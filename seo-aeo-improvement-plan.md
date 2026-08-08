# SEO / AEO Audit and Improvement Plan

Audit date: 2026-08-08. Scope: `index.html`, `timeline.html`, `about.html`,
`robots.txt`, `sitemap.xml`, `firebase.json`. All findings below were verified
directly against the files and/or the live site
(`https://middle-earth-interactive-map.web.app`) — none are guesses.

**How to use this document:** each item states the exact current text, the
exact replacement, the file and line to anchor on, why it matters, and how to
confirm the fix worked. Items are ordered by priority. Apply them in order —
later items assume earlier ones are done. No item requires a judgment call;
where a decision was needed, it has already been made and is stated as an
instruction.

**Not covered by this plan** (needs the site owner, not an executing model):
Google Search Console has no MCP tool available in this session, so actual
indexation status, search impressions, click-through rate, and keyword
rankings could not be checked. The verification steps below confirm the code
is correct, not that Google has re-crawled and re-indexed — that takes days
to weeks after deploy.

---

## Tier 1 — Fix first (highest confidence, highest impact)

### 1.1 Add a real `<h1>` to `index.html` and `timeline.html`

**Finding:** Neither page has an `<h1>` anywhere in the DOM. The only
page-level title text is `<span class="nav-title">Middle-earth</span>`, which
is not a heading element, is identical on every page (so it can't
differentiate them), and is set to `display:none` below 640px — meaning on
mobile there is no page title at all, ever. The `<h2>` elements that do exist
(`Events of Middle-earth`, `Welcome to Middle-earth`) sit inside a
JS-populated legend and a first-visit splash modal respectively — neither is
a reliable, always-present top-level heading.

An `<h1>` is one of the strongest single signals search engines and AI answer
engines use to determine what a page is about. Its absence here is a real
gap, not a stylistic nitpick.

**Fix:** add a visually-hidden `<h1>` to each page. This does not touch the
visible nav bar or its centering CSS at all — it is a separate element,
present in the DOM and to screen readers/crawlers, invisible on screen. This
is a standard, widely-used technique (the same pattern used for skip-links),
not a cloaking risk, because the text describes the page accurately and
isn't hidden to manipulate rankings with unrelated content.

**In `index.html`**, add this CSS rule inside the existing `<style>` block,
anywhere after the `* { margin: 0; ... }` rule (exact placement doesn't
matter, e.g. immediately before the `#nav-bar` rule):

```css
.visually-hidden {
    position: absolute;
    width: 1px; height: 1px;
    padding: 0; margin: -1px;
    overflow: hidden;
    clip: rect(0,0,0,0);
    white-space: nowrap;
    border: 0;
}
```

Then find this exact line in `index.html`:

```html
    <nav id="nav-bar">
```

Replace it with:

```html
    <h1 class="visually-hidden">Middle-earth Interactive Map</h1>
    <nav id="nav-bar">
```

**In `timeline.html`**, add the identical `.visually-hidden` CSS rule to its
`<style>` block, then find:

```html
    <nav id="nav-bar">
```

Replace it with:

```html
    <h1 class="visually-hidden">Middle-earth Timeline &amp; Narrative</h1>
    <nav id="nav-bar">
```

`about.html` already has a real, visible `<h1>` — do not add another one to
it. It is handled separately in item 1.3.

**Verify:** open each page in a browser, run
`document.querySelectorAll('h1').length` in the console — must return `1` on
every page. Confirm the nav bar's visual appearance and centering are
unchanged (the h1 is off-screen, so it should not affect layout at all).

---

### 1.2 Point every internal nav link at `/`, not `index.html`

**Finding:** every internal navigation link across all three pages —
9 links total — points at `index.html` or `/index.html`, and none point at
`/`. Meanwhile `index.html`'s own `<link rel="canonical">` correctly declares
`/` as the canonical URL. A canonical tag is a hint, not a directive, and
100% of internal link equity contradicting it undermines it. This is the
verified, exact mechanism behind a real problem already observed in GA4: the
homepage has been recorded as two separate pages — 60,814 views on `/` and
17,662 on `/index.html` — because that is genuinely how it has been linked
and crawled.

**Fix — six exact replacements**, all `href="index.html"` or
`href="/index.html"` → `href="/"`:

In `index.html`:
```
OLD: <a href="index.html" class="nav-link active">&#x1f5fa;&#xfe0e; Map</a>
NEW: <a href="/" class="nav-link active">&#x1f5fa;&#xfe0e; Map</a>
```

In `timeline.html`:
```
OLD: <a href="index.html" class="nav-link">&#x1f5fa;&#xfe0e; Map</a>
NEW: <a href="/" class="nav-link">&#x1f5fa;&#xfe0e; Map</a>
```

In `about.html` (nav bar):
```
OLD: <a href="/index.html" class="nav-link">&#x1f5fa;&#xfe0e; Map</a>
NEW: <a href="/" class="nav-link">&#x1f5fa;&#xfe0e; Map</a>
```

In `about.html` (footer back-link):
```
OLD: <p><a href="/index.html">&larr; Back to the map</a></p>
NEW: <p><a href="/">&larr; Back to the map</a></p>
```

Leave `timeline.html` and `about.html` links pointed at `timeline.html`
and `about.html` (or their `/`-prefixed forms) exactly as they are — those
pages are correctly canonicalized to their own `.html` URLs (see item 1.4 for
why `about.html`, not `/about`, is the correct canonical there), so no change
is needed for them.

**Verify:** `grep -n 'href="index.html"\|href="/index.html"'
index.html timeline.html about.html` must return nothing. Click the Map nav
link from every page and confirm it lands on `/` (check the browser address
bar), not `/index.html`.

**Do not also do this:** do not add a redirect from `/index.html` to `/` in
`firebase.json`. `/index.html` must keep returning content directly (it is
Firebase's implicit root file), and it already carries a correct
`rel="canonical"` pointing at `/`. A redirect is unnecessary once the
internal links are fixed and risks an infinite-loop or redirect-chain
misconfiguration if added carelessly. Fixing the links is sufficient.

---

### 1.3 Make the About page's title consistent across all four places it appears

**Finding:** a recent manual edit to `about.html` changed the visible `<h1>`
but not the other three places a page's title lives, so the page now states
four different titles for itself:

| Location | Current text |
|---|---|
| `<h1>` (visible) | "How the map of middle earth was built" |
| `<title>` | "Middle-earth — How This Map Was Built" |
| JSON-LD `headline` | "How the Middle-earth Interactive Map Was Built" |
| `og:title` / `twitter:title` | "Middle-earth — How This Map Was Built" |

Mismatched titles are a classic on-page SEO weakness, and for AI answer
engines specifically, inconsistent naming of the same entity/page makes it
harder for a model to confidently cite a single canonical title when
summarizing or quoting the page.

The `<h1>` also lowercases "middle earth" without a hyphen, which is
inconsistent with "Middle-earth" — the spelling used everywhere else on this
site (and Tolkien's own spelling of the name).

**Fix:** keep the site owner's simpler phrasing from the recent edit, fix
only the capitalization, and make all four locations read the same thing.

In `about.html`, find:
```
OLD: <h1 class="page-title">How the map of middle earth was built</h1>
NEW: <h1 class="page-title">How the map of Middle-earth was built</h1>
```

Find (in `<title>`):
```
OLD: <title>Middle-earth &mdash; How This Map Was Built</title>
NEW: <title>How the Map of Middle-earth Was Built</title>
```

Find (JSON-LD block):
```
OLD:         "headline": "How the Middle-earth Interactive Map Was Built",
NEW:         "headline": "How the Map of Middle-earth Was Built",
```

Find (both appear on the same two lines, `og:title` and `twitter:title`):
```
OLD: <meta property="og:title" content="Middle-earth — How This Map Was Built">
NEW: <meta property="og:title" content="How the Map of Middle-earth Was Built">
```
```
OLD: <meta name="twitter:title" content="Middle-earth — How This Map Was Built">
NEW: <meta name="twitter:title" content="How the Map of Middle-earth Was Built">
```

**Verify:** `grep -n "middle earth\b" about.html` (lowercase, no hyphen)
should return nothing. All four title locations should read either "How the
map of Middle-earth was built" (the visible h1, sentence case) or "How the
Map of Middle-earth Was Built" (title, JSON-LD, OG, Twitter — title case) —
never a fifth variant.

---

### 1.4 Shorten meta descriptions to fit Google's display limit

**Finding:** Google typically truncates search-result snippets at roughly
155–160 characters. All three pages exceed it: `index.html` (205 chars),
`timeline.html` (195 chars), and `about.html` (298 chars — nearly double).
Long descriptions get cut off mid-sentence in search results, which reads
poorly and loses control over the pitch.

**Fix — exact replacements**, each already verified at or under 160
characters:

In `index.html`, find:
```
OLD: <meta name="description" content="Explore an interactive map of Tolkien's Middle-earth with over 100 events from The Silmarillion, The Hobbit, and The Lord of the Rings. Click markers, trace journeys, and discover the history of every age.">
NEW: <meta name="description" content="Explore an interactive map of Tolkien's Middle-earth with 128 events from The Silmarillion, The Hobbit and The Lord of the Rings. Click markers, trace journeys.">
```
(160 characters)

In `timeline.html`, find:
```
OLD: <meta name="description" content="A chronological timeline of Middle-earth spanning the First, Second, and Third Ages. Follow events from The Silmarillion through The Lord of the Rings with playback controls and category filters.">
NEW: <meta name="description" content="A chronological timeline of Middle-earth: events from The Silmarillion through The Lord of the Rings, with playback controls and category filters.">
```
(146 characters)

In `about.html`, find:
```
OLD: <meta name="description" content="A technical account of how the Middle-earth interactive map was built: the tile pyramid, the coordinate system, and the six-stage pipeline that turned a hand-drawn parchment map into a synthetic satellite view using hand-painted masks, a synthetic elevation model, hillshading and Stable Diffusion.">
NEW: <meta name="description" content="How the Middle-earth map was built: the tile pyramid, coordinate system, and the pipeline turning a parchment map into a satellite view with Stable Diffusion.">
```
(158 characters)

Leave the `og:description` and `twitter:description` meta tags exactly as
they are on all three pages — those are not subject to the same hard
truncation limit and are already reasonable lengths for how Facebook/Twitter
render link previews.

**Verify:** for each file, extract the `name="description"` content attribute
and confirm its length is ≤160 characters, e.g.:
```bash
grep -oE 'name="description" content="[^"]*"' about.html | wc -c
```

---

## Tier 2 — AEO-specific structured data (do after Tier 1)

### 2.1 Add FAQPage structured data to `about.html`

**Finding:** `about.html` already contains at least two sections phrased as
genuine, self-contained questions with clear answers directly beneath them —
`<h3>Why not MBTiles, or a tile server?</h3>` and
`<h3>Which age is this map, though?</h3>`. This is exactly the shape of
content that `FAQPage` structured data is designed for, and FAQPage markup is
one of the highest-leverage, lowest-risk techniques available for surfacing
content directly inside Google's AI Overviews, Perplexity answers, and voice
assistant responses — because it hands the answer engine a pre-extracted,
unambiguous question/answer pair instead of asking it to parse prose.

**Fix:** add a second JSON-LD script block to `about.html`, right after the
existing one that closes with `</script>` around line 34 (the one with
`"@type": "TechArticle"`). Insert this as a new, separate `<script>` block —
do not merge it into the existing one; a page can have multiple JSON-LD
blocks.

```html
<script type="application/ld+json">
{
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
        {
            "@type": "Question",
            "name": "Why not MBTiles, or a tile server?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "There is no tile server. Every tile is an ordinary static file served by a CDN, using the standard XYZ/slippy-map directory convention that Leaflet and OpenStreetMap already use. MBTiles packs tiles into a SQLite container, which is useful for shipping a tileset as one file, but it requires something to unpack and serve the rows — introducing a server purely to undo packaging that static hosting already avoids. The trade-off is that this approach means about 1,400 small files in version control, which is not what git is designed for."
            }
        },
        {
            "@type": "Question",
            "name": "Which age of Middle-earth does this map show?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "This is a Third Age map. Beleriand, the region where most of The Silmarillion takes place, sank beneath the sea at the end of the First Age during the War of Wrath, so those events cannot be placed on this map at all because the land no longer exists. Most Silmarillion-era markers shown are actually Second Age events that map onto this geography without much trouble. Some place names are also late-Third-Age labels applied to older places — Dol Guldur was called Amon Lanc in the Second Age, and Lothlorien was called Laurelindorenan."
            }
        }
    ]
}
</script>
```

**Verify:** paste the new JSON-LD block into
`https://validator.schema.org/` (or Google's Rich Results Test) and confirm
it parses with zero errors and is recognized as type `FAQPage`.

---

### 2.2 Add `author` and date fields to the About page's TechArticle schema

**Finding:** `index.html`'s `WebSite` schema includes an `author` entity
(`Fraser Marlow`, linked to a GitHub profile), but `about.html`'s
`TechArticle` schema — the one page that is specifically about who built the
project and how — has no `author`, no `datePublished`, and no
`dateModified`. These are standard, recommended properties for `Article`-family
schema types and are a direct authorship/attribution signal that both
classic search and AI answer engines use when deciding whether and how to
credit a source.

**Fix:** in `about.html`, find the existing JSON-LD block:
```
OLD:
        "description": "A technical account of the tile pyramid, coordinate system, and the six-stage pipeline that generated the synthetic satellite layer.",
        "isPartOf": {
```
```
NEW:
        "description": "A technical account of the tile pyramid, coordinate system, and the six-stage pipeline that generated the synthetic satellite layer.",
        "author": {
            "@type": "Person",
            "name": "Fraser Marlow",
            "url": "https://github.com/frasermarlow"
        },
        "datePublished": "2026-08-07",
        "dateModified": "2026-08-08",
        "isPartOf": {
```

**Verify:** re-validate the JSON-LD at `https://validator.schema.org/` after
this change — should still parse cleanly with the added `author`,
`datePublished`, and `dateModified` fields recognized.

---

## Tier 3 — Lower-risk hygiene (optional, do last)

### 3.1 Add `llms.txt`

**Finding:** no `llms.txt` file exists. This is an emerging (not yet
universal, but increasingly checked) convention for pointing AI systems at a
site's most important pages directly, similar in spirit to `robots.txt` but
aimed at answer engines rather than crawl permissions. Given this project's
premise — openly discussed as AI-assisted, with an entire page now
documenting the build process — this is a low-effort, low-risk addition
aligned with the site's own goals.

**Fix:** create a new file `llms.txt` in the project root:

```
# Middle-earth Interactive Map

> An interactive map of Tolkien's Middle-earth with 128 events plotted
> across the First, Second, and Third Ages, drawn from The Silmarillion,
> The Hobbit, and The Lord of the Rings.

## Pages

- [Map](https://middle-earth-interactive-map.web.app/): Interactive map with event markers, character journeys, and a synthetic satellite view.
- [Timeline](https://middle-earth-interactive-map.web.app/timeline.html): Chronological timeline with playback controls and category filters.
- [About](https://middle-earth-interactive-map.web.app/about.html): How the map was built — tile pyramid, coordinate system, and the satellite-generation pipeline.
```

Note: `firebase.json`'s `ignore` list excludes `*.md` but not `.txt`, so this
file will deploy as-is; no config change is needed.

**Verify:** after deploy, confirm
`https://middle-earth-interactive-map.web.app/llms.txt` returns 200 with the
above content.

---

### 3.2 Take an explicit position on AI crawlers in `robots.txt`

**Finding:** the current `robots.txt` allows all crawlers via a wildcard
`User-agent: *` / `Allow: /`, which implicitly permits AI crawlers (GPTBot,
ClaudeBot, PerplexityBot, Google-Extended, CCBot, etc.) but does not name
them. For a site whose explicit goal includes AI answer-engine visibility,
making this an explicit, deliberate allow — rather than an implicit
side-effect of a wildcard — is worth doing so the intent is documented in the
file itself.

**Fix:** replace the full contents of `robots.txt` with:

```
User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: https://middle-earth-interactive-map.web.app/sitemap.xml
```

**Verify:** `curl -s https://middle-earth-interactive-map.web.app/robots.txt`
after deploy should return the new content with a 200 status.

---

### 3.3 Add resource hints for the two external origins in use

**Finding:** the site loads Leaflet's CSS and JS from `unpkg.com`, and
Firebase Analytics from Google's origins, with no `preconnect` hint for
either. A `preconnect` hint lets the browser start the DNS/TLS handshake for
a third-party origin before the resource is actually requested, shaving
latency off the first request to it — a minor but free performance
improvement, and performance is itself a ranking factor.

**Fix:** in `index.html`, `timeline.html`, and `about.html`, find the line:
```
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
```
and add these two lines immediately after it, on all three pages:
```html
    <link rel="preconnect" href="https://unpkg.com" crossorigin>
    <link rel="preconnect" href="https://www.googletagmanager.com">
```

**Verify:** in each page's rendered `<head>`, confirm both `<link
rel="preconnect">` tags are present. This has no visible effect — it only
changes network timing, so there is nothing to see beyond the tag existing.

---

## Post-implementation checklist

Run through this after all tiers are applied and before deploying:

1. Every page (`index.html`, `timeline.html`, `about.html`) has exactly one
   `<h1>`: `document.querySelectorAll('h1').length === 1`.
2. `grep -rn 'href="index.html"\|href="/index.html"' *.html` returns nothing.
3. `about.html`'s title is consistent across `<h1>`, `<title>`, JSON-LD
   `headline`, `og:title`, and `twitter:title` (allowing for sentence-case
   vs. title-case, per item 1.3 — but no fifth variant, and no lowercase
   "middle earth" without a hyphen anywhere).
4. All three `name="description"` meta tags are ≤160 characters.
5. Both JSON-LD blocks on `about.html` (TechArticle and the new FAQPage)
   validate with zero errors at `https://validator.schema.org/`.
6. `robots.txt` and `sitemap.xml` are still valid (the sitemap needs no
   changes in this plan — it already lists exactly the three real pages).
7. Load every page in a browser: zero console errors, zero console
   warnings, nav bar still visually centered, satellite/parchment figure
   images on the About page still load.
8. Deploy with `firebase deploy --only hosting`, then re-run steps 2–6
   against the live URLs, not just localhost.
9. In Google Search Console (manual — not automatable from here): submit
   `sitemap.xml` again if it hasn't been resubmitted recently, and use the
   URL Inspection tool on `/` to request re-indexing now that internal links
   no longer split it against `/index.html`.
