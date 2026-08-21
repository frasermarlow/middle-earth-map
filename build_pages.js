#!/usr/bin/env node
/*
 * Generates the site's data-driven pages from data.js, which stays the single
 * source of truth. Run `node build_pages.js` after editing data.js, then
 * deploy — there is no CI, so nothing regenerates on its own.
 *
 * Emits:
 *   places/index.html   the index of every place, served at /places/ (B3)
 *   locations.json   the same data as a citable dataset (item B3)
 *   sitemap.xml      rebuilt to cover every page, hand-written and generated
 *
 * See traffic-growth-plan.md for what each item is for.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const SITE = 'https://middle-earth-interactive-map.web.app';
const TODAY = new Date().toISOString().slice(0, 10);

// data.js is a plain script, not a module: evaluate it and take what we need.
const data = eval(
    fs.readFileSync(path.join(__dirname, 'data.js'), 'utf8') +
    '; ({ events, CATEGORY_LABELS, COLORS, EVENT_LINKS, JOURNEYS, IMG_W, IMG_H })'
);
const { events, CATEGORY_LABELS, COLORS, EVENT_LINKS, JOURNEYS, IMG_W, IMG_H } = data;

const ERA_NAMES = { FA: 'First Age', SA: 'Second Age', TA: 'Third Age' };
const ERA_ORDER = ['FA', 'SA', 'TA'];

// ── helpers ──────────────────────────────────────────────────────────────
const esc = s => String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/* An em-dash separates the place from the event in every name, e.g.
   "Rivendell — The Council of Elrond". The part before it is the place. */
const placeName = evt => evt.name.split('—')[0].trim();
const eventName = evt => {
    const bits = evt.name.split('—');
    return bits.length > 1 ? bits.slice(1).join('—').trim() : '';
};

const mapUrl = evt =>
    `/?fly=${evt.px},${evt.py}&event=${encodeURIComponent(evt.name)}`;

/* Every place has a page now, so the index always links to it. */
const placeUrl = evt => pagePath(evt);

const firstSentence = (text, max = 150) => {
    const m = text.match(/^(.+?[.!?])(\s|$)/);
    let out = m ? m[1] : text;
    if (out.length > max) out = out.slice(0, max).replace(/\s+\S*$/, '') + '…';
    return out;
};

/* Meta descriptions carry the click, so a 60-character first sentence is a
   wasted slot. Take whole sentences until there is enough to be worth
   reading, then stop before Google truncates. */
const metaDescription = (text, min = 110, max = 155) => {
    const sentences = text.match(/[^.!?]+[.!?]?/g) || [text];
    let out = '';
    for (const sentence of sentences) {
        const next = (out + sentence).trim();
        if (next.length > max) break;
        out = next;
        if (out.length >= min) break;
    }
    if (!out) out = text.slice(0, max).replace(/\s+\S*$/, '') + '…';
    // A short opening sentence followed by a long one leaves the slot half
    // empty; fill it from the rest of the text rather than stopping early.
    if (out.length < min && text.length > out.length) {
        out = text.slice(0, max).replace(/\s+\S*$/, '').replace(/[,;:]$/, '') + '…';
    }
    return out;
};

const dateLabel = evt => `${ERA_NAMES[evt.era]} ${evt.year}`;

/* Distance from a point to a line segment, so "a route passes near here"
   means the road itself and not merely one of its waypoints. */
function segDist(p, a, b) {
    const vx = b[0] - a[0], vy = b[1] - a[1];
    const wx = p[0] - a[0], wy = p[1] - a[1];
    const L = vx * vx + vy * vy;
    let t = L ? (wx * vx + wy * vy) / L : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(a[0] + t * vx - p[0], a[1] + t * vy - p[1]);
}

const JOURNEY_NEAR_PX = 150;

function journeysNear(evt) {
    return Object.keys(JOURNEYS).filter(key => {
        const pts = JOURNEYS[key].points;
        let min = Infinity;
        for (let i = 0; i < pts.length - 1; i++) {
            min = Math.min(min, segDist([evt.px, evt.py], pts[i], pts[i + 1]));
        }
        return min <= JOURNEY_NEAR_PX;
    });
}

function relatedEvents(evt) {
    const out = [];
    EVENT_LINKS.forEach(link => {
        if (link.from === evt.id) out.push({ id: link.to, label: link.label, dir: 'to' });
        else if (link.to === evt.id) out.push({ id: link.from, label: link.label, dir: 'from' });
    });
    return out.map(r => ({ ...r, event: events.find(e => e.id === r.id) })).filter(r => r.event);
}

function nearestPlaces(evt, n = 4) {
    return events
        .filter(e => e.id !== evt.id)
        .map(e => ({ event: e, d: Math.hypot(e.px - evt.px, e.py - evt.py) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, n);
}

/* A place earns its own page when its description can carry one on its own.
   260 characters is roughly forty words — below that the page would be a
   stub dressed up with the same structured facts as every other stub, which
   is the shape search engines treat as doorway content. Everything below the
   floor still appears on /places and on the map; expanding a description past
   it and re-running this script is all it takes to promote one. */
/* Pages are per PLACE, not per event. Nine places carry two events each, and
   splitting them produced the most similar pairs on the site — two Grey
   Havens pages competing for the same query is precisely the "substantially
   similar pages" shape Google's doorway policy names. Merged, those pages
   also carry both descriptions. */
const slugify = name => name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // Cuiviénen -> Cuivienen
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const PLACES = (() => {
    const byName = new Map();
    events.forEach(evt => {
        const name = placeName(evt);
        if (!byName.has(name)) byName.set(name, []);
        byName.get(name).push(evt);
    });
    const out = [];
    const seenSlug = new Map();
    for (const [name, list] of byName) {
        list.sort((a, b) => a.sortKey - b.sortKey);
        let slug = slugify(name);
        if (seenSlug.has(slug)) {                        // never silently collide
            const n = seenSlug.get(slug) + 1;
            seenSlug.set(slug, n);
            slug = `${slug}-${n}`;
        } else {
            seenSlug.set(slug, 1);
        }
        out.push({
            name, slug, events: list,
            sortKey: list[0].sortKey,
            prose: list.map(e => e.description).join(' ')
        });
    }
    return out.sort((a, b) => a.sortKey - b.sortKey);
})();

const PLACE_BY_EVENT = new Map();
PLACES.forEach(pl => pl.events.forEach(e => PLACE_BY_EVENT.set(e.id, pl)));

/* Google publishes no word count, and says so explicitly. What it does name
   is substantially similar pages and content that adds nothing, so the bar
   here is about substance rather than length: a place is offered for
   indexing when its own prose runs past this. Everything else still gets a
   page — reachable from the index, the map popups and its neighbours — but
   carries noindex,follow and stays out of the sitemap, so it serves readers
   without asking Google to rank a stub. Expanding a description and
   re-running promotes it. */
const INDEX_FLOOR = 260;
const isIndexable = place => place.prose.length >= INDEX_FLOOR;
const pagePathFor = place => `/places/${place.slug}/`;
const pagePath = evt => pagePathFor(PLACE_BY_EVENT.get(evt.id));

// ── shared place list ───────────────────────────────────────────────────
/* One row per place: a crop of that spot on the map, the name and event, a
   one-sentence snippet, and the book/date/coordinates. Rows are a grid rather
   than a <table> so they can collapse to two columns on a phone instead of
   forcing a sideways scroll. */
function placeList(items, opts = {}) {
    const showBook = opts.showBook !== false;
    /* Rows are places, like the pages they link to. A place with two events
       shows both rather than appearing twice. */
    const rows = items.map(place => {
        const first = place.events[0];
        const evNames = place.events.map(e => eventName(e)).filter(Boolean).map(esc);
        const books = [...new Set(place.events.map(e => e.category))];
        const href = esc(pagePathFor(place));
        return `                <li class="place-row">
                    <a class="place-thumb" href="${href}" tabindex="-1" aria-hidden="true"><img src="/assets/thumbs/${first.id}.jpg" width="144" height="81" loading="lazy" alt=""></a>
                    <div class="place-body">
                        <a class="place-name" href="${href}">${esc(place.name)}</a>${evNames.length ? `<span class="place-event">${evNames.join(' &middot; ')}</span>` : ''}
                        <p class="place-snippet">${esc(firstSentence(first.description, 180))}</p>
                    </div>
                    <div class="place-meta">
${showBook ? books.map(c => `                        <span class="place-book"><i style="background:${COLORS[c]}"></i>${esc(CATEGORY_LABELS[c])}</span>`).join('\n') + '\n' : ''}                        <span class="place-date">${place.events.map(e => esc(dateLabel(e))).join(', ')}</span>
                        <span class="place-coords">${first.px}, ${first.py}</span>
                    </div>
                </li>`;
    }).join('\n');

    return `        <ul class="place-list">
${rows}
        </ul>`;
}

// ── page shell ───────────────────────────────────────────────────────────
function layout(opts) {
    const { title, description, canonical, h1, standfirst, byline, body,
            jsonLd, activeNav } = opts;
    const nav = [
        ['/', 'Map', '&#x1f5fa;&#xfe0e;', 'map'],
        ['/timeline.html', 'Timeline', '&#x23f3;&#xfe0e;', 'timeline'],
        ['/places/', 'Places', '&#x1f4cd;&#xfe0e;', 'places'],
        ['/about.html', 'About', '&#x1f4dc;&#xfe0e;', 'about']
    ];
    const navLink = ([href, label, icon, key]) =>
        `<a href="${href}" class="nav-link${key === activeNav ? ' active' : ''}">${icon} ${esc(label)}</a>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}">
    <link rel="canonical" href="${SITE}${canonical}">
${opts.noindex ? '    <meta name="robots" content="noindex, follow">\n' : ''}
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(description)}">
    <meta property="og:url" content="${SITE}${canonical}">
    <meta property="og:image" content="${SITE}/og-image.jpg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="Map of Middle-earth on aged parchment, showing the Shire, Rohan, Gondor and Mordor">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(title)}">
    <meta name="twitter:description" content="${esc(description)}">
    <meta name="twitter:image" content="${SITE}/og-image.jpg">
    <link rel="stylesheet" href="/assets/page.css">
${jsonLd ? '    <script type="application/ld+json">\n' + JSON.stringify(jsonLd, null, 4).replace(/^/gm, '    ') + '\n    </script>\n' : ''}</head>
<body>
    <nav id="nav-bar">
        ${navLink(nav[0])}
        <span class="nav-title">Middle-earth</span>
        <span class="nav-right">${nav.slice(1).map(navLink).join('')}</span>
    </nav>

    <main id="article">
        <h1 class="page-title">${h1}</h1>
${standfirst ? `        <p class="standfirst">${standfirst}</p>\n` : ''}${byline ? `        <p class="byline">${byline}</p>\n` : ''}
${body}

        <footer class="page-footer">
            <p>Generated from the map's own dataset on ${TODAY}. <a href="/locations.json">locations.json</a> holds the same data in machine-readable form.</p>
            <p>Place descriptions were written for this project &mdash; please quote them with a link. The parchment artwork is not owned by this project and is used for fan and educational purposes only.</p>
        </footer>
    </main>
</body>
</html>
`;
}

// ── B3: the places index and the dataset ─────────────────────────────────
function buildPlaces() {
    const byEra = ERA_ORDER.map(era => ({
        era,
        name: ERA_NAMES[era],
        items: PLACES.filter(pl => pl.events[0].era === era)
    })).filter(g => g.items.length);

    const anchor = era => era.toLowerCase().replace(/\s+/g, '-');
    const jump = `        <nav class="age-jump" aria-label="Jump to an Age">
${byEra.map(g => `            <a href="#${anchor(g.name)}">${esc(g.name)}<span>${g.items.length}</span></a>`).join('\n')}
        </nav>`;

    const sections = byEra.map(g =>
        `        <section id="${anchor(g.name)}">\n` +
        `        <h2><span class="num">${g.items.length} places</span>${esc(g.name)}</h2>\n` +
        placeList(g.items) + '\n        </section>'
    ).join('\n\n');

    const intro = `        <p>Every place plotted on the <a href="/">interactive map of Middle-earth</a>, in the order the events happen. ${events.length} places across the three Ages, drawn from The Silmarillion, The Hobbit and The Lord of the Rings. Each name opens that place's own page where it has one, and otherwise goes straight to its marker on the map; the <a href="/timeline.html">timeline</a> shows the same events chronologically.</p>

        <p>Two books have their own page: <a href="/hobbit-map">The Hobbit</a>, whose fifteen places run the width of the map in a single year, and <a href="/silmarillion-map">The Silmarillion</a>, whose thirteen span all three Ages.</p>

        <p>Each row shows that place as it appears on the parchment, with its <strong>x, y</strong> position on the ${IMG_W}&nbsp;&times;&nbsp;${IMG_H} base map &mdash; the coordinates the map's own deep links use, so <code>/?fly=x,y</code> centres the map on a point. The same data, including the full descriptions, is published as <a href="/locations.json">locations.json</a>.</p>`;

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        name: 'Places on the Middle-earth interactive map',
        description: `Coordinates, dates and descriptions for ${PLACES.length} places and ${events.length} events in Tolkien's Middle-earth, as plotted on the Middle-earth interactive map.`,
        url: `${SITE}/places/`,
        keywords: ['Middle-earth', 'Tolkien', 'map', 'gazetteer', 'The Lord of the Rings', 'The Hobbit', 'The Silmarillion'],
        creator: { '@type': 'Person', name: 'Fraser Marlow', url: 'https://github.com/frasermarlow' },
        isAccessibleForFree: true,
        distribution: [{
            '@type': 'DataDownload',
            encodingFormat: 'application/json',
            contentUrl: `${SITE}/locations.json`
        }]
    };

    const html = layout({
        title: `All ${PLACES.length} Places on the Map of Middle-earth`,
        description: `Every place on the Middle-earth map: ${PLACES.length} locations across the First, Second and Third Ages, with dates, map coordinates and what happened at each.`,
        canonical: '/places/',
        h1: `All ${PLACES.length} places on the map of Middle-earth`,
        standfirst: 'A gazetteer of every location plotted on the map, from the awakening of the Elves at Cuiviénen to the ships leaving the Grey Havens.',
        byline: `${PLACES.length} places &middot; ${events.length} events &middot; ${byEra.length} Ages &middot; ${EVENT_LINKS.length} links between events &middot; ${Object.keys(JOURNEYS).length} journeys`,
        body: intro + '\n\n' + jump + '\n\n' + sections,
        jsonLd,
        activeNav: 'places'
    });
    fs.mkdirSync('places', { recursive: true });
    fs.writeFileSync(path.join('places', 'index.html'), html);

    const dataset = {
        $meta: {
            name: 'Places on the Middle-earth interactive map',
            source: `${SITE}/places/`,
            generated: TODAY,
            count: events.length,
            coordinates: {
                system: 'pixel coordinates on the base map image',
                width: IMG_W,
                height: IMG_H,
                origin: 'top-left',
                deepLink: `${SITE}/?fly={px},{py}&event={name}`
            },
            fields: {
                id: 'stable slug used in the map and timeline',
                name: 'place name, an em dash, then the event at that place',
                place: 'the place name alone',
                event: 'the event alone',
                book: 'the book the event is drawn from',
                era: 'FA, SA or TA — First, Second or Third Age',
                year: 'year within that Age',
                px: 'x coordinate on the base map image',
                py: 'y coordinate on the base map image',
                description: 'what happened there, written for this project',
                characters: 'figures involved',
                map: 'deep link that centres the map on this place'
            },
            attribution: 'Descriptions written for this project — quote with a link. The parchment base map artwork is not owned by this project and is used for fan and educational purposes only.'
        },
        places: events.map(evt => ({
            id: evt.id,
            name: evt.name,
            place: placeName(evt),
            event: eventName(evt),
            book: CATEGORY_LABELS[evt.category],
            era: evt.era,
            eraName: ERA_NAMES[evt.era],
            year: evt.year,
            px: evt.px,
            py: evt.py,
            description: evt.description,
            characters: evt.characters,
            map: `${SITE}${mapUrl(evt)}`,
            page: `${SITE}${pagePath(evt)}`
        }))
    };
    fs.writeFileSync('locations.json', JSON.stringify(dataset, null, 2) + '\n');

    return { pages: ['/places/'], count: PLACES.length };
}

// ── A4: book landing pages ───────────────────────────────────────────────
const BOOK_PAGES = [
    {
        cat: 'hobbit',
        slug: 'hobbit-map',
        journey: 'bilbo',
        title: "The Hobbit Map — Bilbo's Journey from Bag End to Erebor",
        description: 'The Hobbit on an interactive map of Middle-earth: all 15 places from Bag End to the Lonely Mountain, with Bilbo’s route traced across the parchment.',
        h1: 'The Hobbit on the map of Middle-earth',
        standfirst: 'Fifteen places and a single year, along a road that runs most of the width of the map — from a hobbit-hole in the Shire to a dragon’s door under the Lonely Mountain.',
        prose: [
            'Every place in <em>The Hobbit</em> that this map plots, in the order Bilbo reaches them. You can <a href="/?book=hobbit&amp;journey=bilbo">open the map showing only these places</a>, with Bilbo’s route drawn across it, or read the same events in sequence on the <a href="/timeline.html">timeline</a>.',
            'The journey is almost perfectly west to east. Bag End sits at x&nbsp;2746 on the base map; Erebor sits at x&nbsp;5161. Between them the road runs through the Trollshaws, over the Misty Mountains by the High Pass and Goblin-town, down to the Carrock and Beorn’s Hall, through Mirkwood to Thranduil’s Halls, and out to Lake-town on the Long Lake beneath the mountain itself. Thirteen of the fifteen places fall on that line.',
            'The other two sit well off it, and both belong to the parts of the story Bilbo never saw. <strong>Mount Gundabad</strong> is far to the north, where the goblin host mustered before the Battle of Five Armies. <strong>Dol Guldur</strong> is far to the south in Mirkwood, where the White Council struck while the dwarves were still on the road — the errand that takes Gandalf away from the company for much of the book.',
            'Every event here is dated to Third Age 2941, the single year the quest occupies. For the deep past of these same lands, see <a href="/silmarillion-map">The Silmarillion on the map</a>; for all 128 places across every book, see the <a href="/places/">full gazetteer</a>.'
        ]
    },
    {
        cat: 'silmarillion',
        slug: 'silmarillion-map',
        journey: null,
        title: 'The Silmarillion Map — Elder Days on the Middle-earth Map',
        description: 'The Silmarillion on a map of Middle-earth: 13 places from Cuiviénen to Dol Guldur, and why Beleriand lies drowned beyond the map’s western edge.',
        h1: 'The Silmarillion on the map of Middle-earth',
        standfirst: 'The widest spread of any book here — from the far eastern shore where the Elves first woke, to an island in the western sea that by the Third Age no longer existed.',
        prose: [
            'These are the places from <em>The Silmarillion</em> and the elder days that this map can show. You can <a href="/?book=silmarillion">open the map with only these places</a> marked, or find them among the rest in the <a href="/places/">full gazetteer</a>.',
            'One thing is worth saying plainly, because it explains why the list is short. This is a <strong>Third Age map</strong>. Beleriand — the stage for almost all of <em>The Silmarillion</em>, with Doriath, Gondolin, Nargothrond and the rest — lay west of the Blue Mountains, and was broken and drowned in the War of Wrath at the First Age’s end. It is not off to one side of this map; it is under the sea beyond its western edge. What survived are peaks: the map carries <a href="/?fly=1202,752&amp;event=Himling%20%E2%80%94%20Remnant%20of%20Beleriand">Himling</a>, once Himring where Maedhros held his fortress, and <a href="/?fly=747,874&amp;event=Tol%20Fuin%20%E2%80%94%20Remnant%20of%20Dorthonion">Tol Fuin</a>, all that is left above water of Dorthonion. Both are filed under Appendices rather than here.',
            'What does fall inside the map spans the whole legendarium, edge to edge. <strong>Cuiviénen</strong>, where the Elves awoke, sits at x&nbsp;7091, at the far eastern limit of the parchment; the <strong>Meneltarma</strong> of Númenor sits at x&nbsp;237, out in the western sea. Between them: Durin waking at <strong>Khazad-dûm</strong>, the Dwarven cities of <strong>Ered Luin</strong>, the founding of <strong>Lindon</strong> and the <strong>Grey Havens</strong> after Beleriand’s ruin, the forging of the Rings in <strong>Eregion</strong> and the One in <strong>Mount Doom</strong>, the raising of <strong>Barad-dûr</strong>, the Corsair haven at <strong>Umbar</strong>, the Last Alliance on <strong>Dagorlad</strong>, and the loss of the Ring at the <strong>Gladden Fields</strong>.',
            'It is the only book on this map whose events run through all three Ages — which is the point of it. For the Third Age story that grows out of these events, start with <a href="/hobbit-map">The Hobbit</a> or open the <a href="/">full map</a>.'
        ]
    }
];

function buildBookPages() {
    const built = [];
    for (const page of BOOK_PAGES) {
        const items = PLACES.filter(pl => pl.events.some(e => e.category === page.cat));
        const eras = ERA_ORDER.filter(era => items.some(pl => pl.events[0].era === era));
        const multiAge = eras.length > 1;

        const tables = multiAge
            ? eras.map(era => {
                  const group = items.filter(pl => pl.events[0].era === era);
                  return `        <h2><span class="num">${group.length} place${group.length === 1 ? '' : 's'}</span>${esc(ERA_NAMES[era])}</h2>\n` +
                         placeList(group, { showBook: false });
              }).join('\n\n')
            : `        <h2><span class="num">${items.length} places</span>Every place, in order</h2>\n` +
              placeList(items, { showBook: false });

        const mapLink = `/?book=${page.cat}` + (page.journey ? `&journey=${page.journey}` : '');
        const yearsNote = multiAge
            ? `${eras.map(e => ERA_NAMES[e]).join(', ')}`
            : `${ERA_NAMES[items[0].events[0].era]} ${items[0].events[0].year}`;

        const jsonLd = {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: page.title,
            description: page.description,
            url: `${SITE}/${page.slug}`,
            isPartOf: { '@type': 'WebSite', name: 'Middle-earth Interactive Map', url: `${SITE}/` },
            about: { '@type': 'Book', name: CATEGORY_LABELS[page.cat], author: { '@type': 'Person', name: 'J. R. R. Tolkien' } },
            mainEntity: {
                '@type': 'ItemList',
                numberOfItems: items.length,
                itemListElement: items.map((pl, i) => ({
                    '@type': 'ListItem',
                    position: i + 1,
                    name: pl.name,
                    url: `${SITE}${pagePathFor(pl)}`
                }))
            }
        };

        const body = page.prose.map(par => `        <p>${par}</p>`).join('\n\n') +
                     '\n\n' + tables;

        fs.writeFileSync(`${page.slug}.html`, layout({
            title: page.title,
            description: page.description,
            canonical: `/${page.slug}`,
            h1: page.h1,
            standfirst: page.standfirst,
            byline: `${items.length} places &middot; ${yearsNote} &middot; <a href="${esc(mapLink)}">show these on the map</a>`,
            body,
            jsonLd,
            activeNav: 'places'
        }));
        built.push({ slug: page.slug, count: items.length });
    }
    return built;
}

// ── A3: one page per place ───────────────────────────────────────────────
function buildPlacePages() {
    const indexable = [];
    const noindexed = [];

    PLACES.forEach((place, i) => {
        const first = place.events[0];
        const prev = PLACES[i - 1];
        const next = PLACES[i + 1];
        const indexed = isIndexable(place);
        const routes = journeysNear(first);
        const near = nearestPlaces(first).filter(n => PLACE_BY_EVENT.get(n.event.id) !== place).slice(0, 4);
        const related = place.events.flatMap(e => relatedEvents(e))
            .filter(r => PLACE_BY_EVENT.get(r.event.id) !== place);
        const books = [...new Set(place.events.map(e => e.category))];
        const bookPage = BOOK_PAGES.find(b => books.includes(b.cat));

        const cropImg = `        <figure>
            <a href="${esc(mapUrl(first))}"><img src="/assets/crops/${place.slug}.jpg" width="640" height="360" loading="lazy" alt="${esc(place.name)} and its surroundings on the parchment map of Middle-earth"></a>
            <figcaption>${esc(place.name)} on the parchment map. <a href="${esc(mapUrl(first))}">Open this spot on the interactive map</a> to pan, zoom or switch to the satellite view.</figcaption>
        </figure>`;

        /* One section per event at this place. Nine places carry two. */
        const eventSections = place.events.map(evt => {
            const ev = eventName(evt);
            const heading = place.events.length > 1
                ? `        <h2>${esc(ev || dateLabel(evt))}<span class="event-date">${esc(dateLabel(evt))}</span></h2>\n`
                : '';
            const figures = evt.characters && evt.characters.trim()
                ? `        <p class="event-figures"><strong>Figures:</strong> ${esc(evt.characters)}</p>\n`
                : '';
            return heading + `        <p>${esc(evt.description)}</p>\n` + figures;
        }).join('\n');

        const facts = `        <div class="table-wrap">
            <table>
                <tbody>
                    <tr><th>Place</th><td>${esc(place.name)}</td></tr>
                    <tr><th>Book${books.length > 1 ? 's' : ''}</th><td>${books.map(c => bookPage && bookPage.cat === c ? `<a href="/${bookPage.slug}">${esc(CATEGORY_LABELS[c])}</a>` : esc(CATEGORY_LABELS[c])).join(', ')}</td></tr>
                    <tr><th>Date${place.events.length > 1 ? 's' : ''}</th><td>${place.events.map(e => esc(dateLabel(e))).join(', ')}</td></tr>
                    <tr><th>Map x, y</th><td><code>${first.px}, ${first.py}</code></td></tr>
                </tbody>
            </table>
        </div>`;

        const relatedBlock = related.length ? `        <h2>What this connects to</h2>
        <ul>
${related.map(r => `            <li><a href="${esc(placeUrl(r.event))}">${esc(placeName(r.event))}</a> &mdash; ${esc(r.label)}${r.dir === 'from' ? ' (leading here)' : ''}</li>`).join('\n')}
        </ul>` : '';

        const routesBlock = routes.length ? `        <h2>Routes passing through</h2>
        <p>${routes.length === 1 ? 'One traced route runs' : `${routes.length} traced routes run`} within ${JOURNEY_NEAR_PX} map-pixels of here:</p>
        <ul>
${routes.map(k => `            <li><a href="/?journey=${k}&amp;fly=${first.px},${first.py}">${esc(JOURNEYS[k].label)}</a></li>`).join('\n')}
        </ul>` : '';

        const nearBlock = `        <h2>Nearest places on the map</h2>
        <ul>
${near.map(n => `            <li><a href="${esc(placeUrl(n.event))}">${esc(placeName(n.event))}</a> &mdash; ${Math.round(n.d)} map-pixels away, ${esc(dateLabel(n.event))}</li>`).join('\n')}
        </ul>`;

        const walk = `        <p class="page-walk">
${prev ? `            &#8592; <a href="${pagePathFor(prev)}">${esc(prev.name)}</a><br>` : ''}
${next ? `            <a href="${pagePathFor(next)}">${esc(next.name)}</a> &#8594;<br>` : ''}
            <a href="/places/">All ${PLACES.length} places</a> &middot; <a href="/">the map</a> &middot; <a href="/timeline.html">the timeline</a>
        </p>`;

        const jsonLd = [
            {
                '@context': 'https://schema.org',
                '@type': 'WebPage',
                name: `${place.name} — Map of Middle-earth`,
                description: metaDescription(place.prose),
                url: `${SITE}${pagePathFor(place)}`,
                isPartOf: { '@type': 'WebSite', name: 'Middle-earth Interactive Map', url: `${SITE}/` },
                about: { '@type': 'Place', name: place.name, description: place.prose }
            },
            {
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Map', item: `${SITE}/` },
                    { '@type': 'ListItem', position: 2, name: 'Places', item: `${SITE}/places/` },
                    { '@type': 'ListItem', position: 3, name: place.name }
                ]
            }
        ];

        // escape each name, then join with the entity — escaping the joined
        // string would turn "&middot;" into "&amp;middot;"
        const eventNames = place.events.map(e => eventName(e)).filter(Boolean).map(esc);
        const body = [cropImg, eventSections, facts, relatedBlock, routesBlock, nearBlock, walk]
            .filter(Boolean).join('\n\n');

        const dir = path.join('places', place.slug);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, 'index.html'), layout({
            title: `${place.name} — Map of Middle-earth`,
            description: metaDescription(place.prose),
            canonical: pagePathFor(place),
            h1: esc(place.name),
            standfirst: eventNames.join(' &middot; '),
            byline: `${books.map(c => esc(CATEGORY_LABELS[c])).join(', ')} &middot; ${place.events.map(e => esc(dateLabel(e))).join(', ')} &middot; <a href="${esc(mapUrl(first))}">show on the map</a>`,
            body,
            jsonLd,
            activeNav: 'places',
            noindex: !indexed
        }));

        (indexed ? indexable : noindexed).push(place);
    });

    // The map popups link every place, so the id -> slug map covers them all.
    fs.writeFileSync('place-pages.js',
        '// Generated by build_pages.js — event id to the place page it belongs to.\n' +
        'const PLACE_PAGES = ' + JSON.stringify(
            Object.fromEntries(events.map(e => [e.id, PLACE_BY_EVENT.get(e.id).slug]))) + ';\n');

    return { indexable, noindexed };
}

// ── A3: one page per place ─── end ───────────────────────────────────────

// ── sitemap ──────────────────────────────────────────────────────────────
function buildSitemap(generated) {
    const imageEntry = (loc, title, caption) => `
    <image:image>
      <image:loc>${loc}</image:loc>
      <image:title>${esc(title)}</image:title>
      <image:caption>${esc(caption)}</image:caption>
    </image:image>`;

    const urls = [
        { loc: '/', lastmod: TODAY, changefreq: 'monthly', priority: '1.0',
          images: imageEntry(`${SITE}/map-of-middle-earth.jpg`, 'Map of Middle-earth',
              'Map of Middle-earth on aged parchment, showing the Shire, the Misty Mountains, Rohan, Gondor and Mordor.') },
        { loc: '/timeline.html', lastmod: TODAY, changefreq: 'monthly', priority: '0.8' },
        { loc: '/places/', lastmod: TODAY, changefreq: 'monthly', priority: '0.9' },
        { loc: '/about.html', lastmod: '2026-08-20', changefreq: 'yearly', priority: '0.6',
          images: imageEntry(`${SITE}/middle-earth-satellite-map.jpg`, 'Satellite map of Middle-earth',
              'An AI-generated satellite view of Middle-earth, rendered from the hand-drawn parchment map.') },
        ...generated.map(g => ({ loc: g.loc, lastmod: TODAY, changefreq: 'monthly', priority: g.priority || '0.5' }))
    ];

    const body = urls.map(u => `  <url>
    <loc>${SITE}${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>${u.images || ''}
  </url>`).join('\n');

    fs.writeFileSync('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${body}
</urlset>
`);
    return urls.length;
}

// ── run ──────────────────────────────────────────────────────────────────
const leaves = buildPlacePages();

/* Consumed by generate_place_crops.py; a dotfile so Firebase never uploads
   it. Thumbnails are keyed by event because the index has a row per event;
   crops are keyed by place slug because pages are per place. */
fs.writeFileSync('.crops.json', JSON.stringify({
    thumbs: events.map(e => ({ id: e.id, px: e.px, py: e.py })),
    crops: PLACES.map(pl => ({ id: pl.slug, px: pl.events[0].px, py: pl.events[0].py }))
}, null, 1) + '\n');
const places = buildPlaces();
const books = buildBookPages();
/* Only indexable pages go in the sitemap — listing a noindex URL asks Google
   to index something the page itself refuses. */
const urlCount = buildSitemap([
    ...books.map(b => ({ loc: `/${b.slug}`, priority: '0.7' })),
    ...leaves.indexable.map(pl => ({ loc: pagePathFor(pl), priority: '0.5' }))
]);
console.log(`places/*         ${PLACES.length} place pages — ${leaves.indexable.length} indexable, ${leaves.noindexed.length} noindex,follow`);
console.log(`places/index    ${places.count} places`);
console.log(`locations.json   ${(fs.statSync('locations.json').size / 1024).toFixed(0)} KB`);
books.forEach(b => console.log(`${(b.slug + '.html').padEnd(17)}${b.count} places`));
console.log(`sitemap.xml      ${urlCount} URLs`);
if (leaves.noindexed.length) {
    console.log('\nnoindex — expand the description past ' + INDEX_FLOOR + ' characters to promote:');
    leaves.noindexed.sort((a, b) => a.prose.length - b.prose.length)
        .forEach(pl => console.log(`  ${String(pl.prose.length).padStart(3)}  ${pl.name}`));
}
