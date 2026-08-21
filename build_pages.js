#!/usr/bin/env node
/*
 * Generates the site's data-driven pages from data.js, which stays the single
 * source of truth. Run `node build_pages.js` after editing data.js, then
 * deploy — there is no CI, so nothing regenerates on its own.
 *
 * Emits:
 *   places.html      the index of every place on the map (item B3)
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
    '; ({ events, CATEGORY_LABELS, EVENT_LINKS, JOURNEYS, IMG_W, IMG_H })'
);
const { events, CATEGORY_LABELS, EVENT_LINKS, JOURNEYS, IMG_W, IMG_H } = data;

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

/* Where the index links a place. A3 will repoint this at the per-place page;
   until those exist it goes straight to the marker on the map. */
const placeUrl = evt => mapUrl(evt);

const firstSentence = (text, max = 150) => {
    const m = text.match(/^(.+?[.!?])(\s|$)/);
    let out = m ? m[1] : text;
    if (out.length > max) out = out.slice(0, max).replace(/\s+\S*$/, '') + '…';
    return out;
};

const dateLabel = evt => `${ERA_NAMES[evt.era]} ${evt.year}`;

// ── page shell ───────────────────────────────────────────────────────────
function layout(opts) {
    const { title, description, canonical, h1, standfirst, byline, body,
            jsonLd, activeNav } = opts;
    const nav = [
        ['/', 'Map', '&#x1f5fa;&#xfe0e;', 'map'],
        ['/timeline.html', 'Timeline', '&#x23f3;&#xfe0e;', 'timeline'],
        ['/places', 'Places', '&#x1f4cd;&#xfe0e;', 'places'],
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
        items: events.filter(e => e.era === era).sort((a, b) => a.sortKey - b.sortKey)
    })).filter(g => g.items.length);

    const sections = byEra.map(g => {
        const rows = g.items.map(evt => {
            const ev = eventName(evt);
            return `                <tr>
                    <td class="place"><a href="${esc(placeUrl(evt))}">${esc(placeName(evt))}</a>${ev ? ` &mdash; ${esc(ev)}` : ''}<span class="snippet">${esc(firstSentence(evt.description))}</span></td>
                    <td class="meta">${esc(CATEGORY_LABELS[evt.category])}</td>
                    <td class="meta">${esc(dateLabel(evt))}</td>
                    <td class="coords">${evt.px}, ${evt.py}</td>
                </tr>`;
        }).join('\n');

        return `        <h2><span class="num">${g.items.length} places</span>${esc(g.name)}</h2>
        <div class="table-wrap">
            <table>
                <thead>
                    <tr><th>Place and event</th><th>Book</th><th>Date</th><th>Map x, y</th></tr>
                </thead>
                <tbody>
${rows}
                </tbody>
            </table>
        </div>`;
    }).join('\n\n');

    const intro = `        <p>Every place plotted on the <a href="/">interactive map of Middle-earth</a>, in the order the events happen. ${events.length} places across the three Ages, drawn from The Silmarillion, The Hobbit and The Lord of the Rings. Each name links to that spot on the map; the <a href="/timeline.html">timeline</a> shows the same events chronologically.</p>

        <p>The <strong>Map x, y</strong> column gives pixel coordinates on the ${IMG_W}&nbsp;&times;&nbsp;${IMG_H} base map, which is what the map's own deep links use: <code>/?fly=x,y</code> centres the map on a point. The same data, including the full descriptions, is published as <a href="/locations.json">locations.json</a>.</p>`;

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        name: 'Places on the Middle-earth interactive map',
        description: `Coordinates, dates and descriptions for ${events.length} places and events in Tolkien's Middle-earth, as plotted on the Middle-earth interactive map.`,
        url: `${SITE}/places`,
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
        title: `All ${events.length} Places on the Map of Middle-earth`,
        description: `Every place on the Middle-earth map: ${events.length} locations across the First, Second and Third Ages, with dates, map coordinates and what happened at each.`,
        canonical: '/places',
        h1: `All ${events.length} places on the map of Middle-earth`,
        standfirst: 'A gazetteer of every location plotted on the map, from the awakening of the Elves at Cuiviénen to the ships leaving the Grey Havens.',
        byline: `${events.length} places &middot; ${byEra.length} Ages &middot; ${EVENT_LINKS.length} links between events &middot; ${Object.keys(JOURNEYS).length} journeys`,
        body: intro + '\n\n' + sections,
        jsonLd,
        activeNav: 'places'
    });
    fs.writeFileSync('places.html', html);

    const dataset = {
        $meta: {
            name: 'Places on the Middle-earth interactive map',
            source: `${SITE}/places`,
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
            map: `${SITE}${mapUrl(evt)}`
        }))
    };
    fs.writeFileSync('locations.json', JSON.stringify(dataset, null, 2) + '\n');

    return { pages: ['/places'], count: events.length };
}

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
        { loc: '/places', lastmod: TODAY, changefreq: 'monthly', priority: '0.9' },
        { loc: '/about.html', lastmod: '2026-08-20', changefreq: 'yearly', priority: '0.6',
          images: imageEntry(`${SITE}/middle-earth-satellite-map.jpg`, 'Satellite map of Middle-earth',
              'An AI-generated satellite view of Middle-earth, rendered from the hand-drawn parchment map.') },
        ...generated.map(loc => ({ loc, lastmod: TODAY, changefreq: 'yearly', priority: '0.5' }))
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
const places = buildPlaces();
const urlCount = buildSitemap([]);
console.log(`places.html      ${places.count} places`);
console.log(`locations.json   ${(fs.statSync('locations.json').size / 1024).toFixed(0)} KB`);
console.log(`sitemap.xml      ${urlCount} URLs`);
