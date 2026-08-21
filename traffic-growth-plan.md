# Traffic Growth Plan — Costed

Plan date: 2026-08-20. Companion to `seo-aeo-improvement-plan.md`, which
covered on-page correctness (headings, canonicals, meta length, structured
data, `llms.txt`). Tiers 1–3 of that plan are implemented and live as of the
2026-08-08 release. **This document is about growth, not correctness**: what
to build next, what each item costs, and what each item is expected to
return.

That earlier plan opened with a caveat that Search Console data was
unavailable, so "actual indexation status, search impressions, click-through
rate, and keyword rankings could not be checked." That gap is now closed —
every number below is measured, not estimated, and the source is named.

**Data sources**
- GA4 property `524060174` (`middle-earth-interactive-map`), via the
  Analytics Data API.
- Search Console property `https://middle-earth-interactive-map.web.app/`.
  Search window used throughout: **2026-07-22 → 2026-08-18** (28 days).
- Interaction telemetry from the 16 custom events shipped in commit
  `2dd8432`, live since 2026-08-08. Behavioural window: **2026-08-09 →
  2026-08-19** (11 full days).
- `firebase hosting:channel:list` for release history.

**How to use this document:** items are costed and ranked, then sequenced
into three waves at the end. Each item states the evidence it rests on, the
work, the cost in focused hours, the modelled return, and the confidence
level of that model. Unlike the earlier plan, several items here *do* require
judgment calls — those are flagged as such rather than hidden.

---

## Baseline — where things actually stand

Measured 2026-08-20. These are the numbers every projection below is built
on; re-measure them before claiming any item worked.

| Metric | Value | Window |
| --- | --- | --- |
| Search clicks | 9,615 (343/day) | 28 days |
| Search impressions | 204,279 (7,296/day) | 28 days |
| Average CTR | 4.71% | 28 days |
| Average position | 4.9 | 28 days |
| Active users | 488/day | 31 days |
| Sessions | 774/day | 31 days |
| Returning users | ~24% of users, ~2.0 sessions each | 31 days |
| Indexable URLs | 3 | — |
| Indexable images on `/` | 0 | — |

**Trend, for context.** Organic search is compounding: weekly active users
went 1,942 (week 25) → 3,055 (week 33), +57% in eight weeks, and search
clicks roughly doubled from ~180/day in early June. What flattened is
everything else — Direct fell from 207 to 75 sessions/day and the launch
referral wave decayed to nothing (pikabu.ru: 22 → 1.3 sessions/day). Total
traffic looks flat because organic growth is filling the hole left by the
press wave.

**The near-term warning sign.** Clicks have been pinned at 330–370/day since
2026-08-03 while impressions climbed from ~7,000 to ~9,000/day. CTR fell
from 5.3% to 3.7–3.9% and average position drifted 4.2 → 5.0 over the same
stretch. Google is showing the site for more queries at slightly worse
positions and the snippet is not winning those extra impressions. Wave 1
below is aimed squarely at this.

**Two measurement caveats that affect how you read any result.**

1. GA4 engagement metrics have a hard discontinuity on 2026-08-08 — the
   custom-event deploy quadrupled *measured* engagement time (96s → 215s per
   active user/day) with no change in real behaviour, because GA4 only
   accrues engagement time from events. Never compare engagement time or
   events/user across that date.
2. 5,777 of ~23,400 sessions in the last 31 days (24%) have no user
   attribution and zero engaged sessions. **These are not bots** — see D1,
   which investigated it. They are real fast-bounce visitors GA4 cannot
   classify. Active users and engaged sessions remain the trustworthy
   denominators, but the sessions are genuine and should not be discarded.

**Deploy discipline.** There is no CI: `git push` does not deploy. The last
release was 2026-08-08 17:09 EDT, so commit `5125f00` (sitemap `lastmod`
corrections, 2026-08-18) is committed but *not live*. Every item below needs
an explicit `firebase deploy --only hosting`.

---

## Cost and confidence conventions

**Cost** is focused solo hours, build only, excluding the wait for Google to
re-crawl. Infrastructure cost is $0 for every item — Firebase Hosting's free
tier covers the added static assets, and the largest item (128 pages plus
per-location social images) adds well under 20 MB.

**Confidence** is about the *mechanism*, not the exact figure:
- **High** — arithmetic on impressions the site already earns. The only
  uncertainty is how much CTR moves.
- **Medium** — the demand is measured, but the site has to earn a ranking it
  does not yet hold.
- **Speculative** — the mechanism is sound and the precedent exists, but the
  outcome is not controllable.

---

## Ranked summary

| # | Item | Cost | Modelled return | Confidence |
| --- | --- | --- | --- | --- |
| A1 | Head-term titles, meta, rich results | 3h | +54 to +90 clicks/day | High |
| A2 | Image SEO — enter Google Images | 6h | New channel, currently zero | Medium |
| C2 | Surface timeline playback | 2h | 10% → 25%+ of map traffic | High |
| C3 | Promote satellite view out of the legend | 0.5h | 15% → 40%+ feature reach | High |
| B3 | Publish the dataset for AI answer engines | 3h | Compounding; 16x growth already | Medium |
| A4 | Hobbit and Silmarillion era landing pages | 8h | +188 clicks/day-28 measured, plus new rankings | Medium |
| C1 | Share affordances + per-location social images | 13h | Converts 70,849 marker opens/11d into distribution | Medium |
| B1 | Second press wave — the satellite story | 4h | 1,000–3,000 users in a week + durable backlinks | Speculative |
| A3 | Per-location pages generated from `data.js` | 20h | +17 to +50 clicks/day at maturity | Medium |
| A5 | Localisation: de, es, it, ru | ~3h/lang (extraction done) | +46 clicks/day-28 before rank gains | Medium |
| C4 | Content depth — more markers and eras | ongoing | Primary retention lever | Medium |
| B2 | Community cadence on Reddit | 1h/week | Already 15 sessions/day unprompted | Speculative |
| D1 | Measurement hygiene | 1h | Protects every number above | High |
| D2 | Redirect `/index.html` to `/` | 0.25h | Consolidates ~944 sessions/28d | High |

Wave 1 (A1, A2, C2, C3, D1, D2) is **12.75 hours** and carries the
highest-confidence return in the table. It is complete as of 2026-08-21.

---

## A — Acquisition from search

### A1. Rewrite titles, meta and rich results for the four head terms

**Cost: 3h. Return: +54 to +90 clicks/day. Confidence: High.**

**Status: implemented 2026-08-20, not yet deployed.**

**Evidence.** Four queries are half the search business and every one of
them converts below what its position should earn:

| query | clicks | impressions | CTR | position |
| --- | --- | --- | --- | --- |
| middle earth map | 1,454 | 43,975 | 3.31% | 4.2 |
| map of middle earth | 1,499 | 27,672 | 5.42% | 3.0 |
| lotr map | 1,268 | 15,730 | 8.06% | 2.8 |
| lord of the rings map | 681 | 12,376 | 5.50% | 3.4 |

That is 99,753 impressions (49% of all impressions) and 4,902 clicks (51% of
all clicks) at a blended 4.91% CTR. Meanwhile every query containing the
word *interactive* converts at 20–36%: "middle earth interactive map" 36.40%,
"lord of the rings interactive map" 29.62%, "interactive map of middle earth"
28.75%, "tolkien interactive map" 35.48%. The intent that converts is
*interactive*, and in the current `<title>` — `Middle-earth — Interactive
Map` — the differentiating word sits last, where Google truncates and users
stop reading.

**The work.** Rewrite `<title>`, `<meta name="description">`, `og:title`,
`og:description`, `twitter:title`, `twitter:description` and the
visually-hidden `<h1>` on `/` so that between them they carry the exact
phrases *Middle-earth Map*, *Map of Middle-earth*, *Interactive*, *Lord of
the Rings* and *The Hobbit*, with the highest-impression phrase first. Do the
same for `timeline.html` against its own query set. Leave `about.html` alone
— item 1.3 of the earlier plan settled its title and re-litigating it costs
consistency for nothing.

**The model.** Holding position constant and moving CTR to conservative
targets for each position (5–6% at position 4.2, 7–8% at position 3.0, 9–10%
at 2.8, 7–8% at 3.4) yields +1,514 to +2,511 clicks per 28 days — **+54 to
+90 clicks/day, or +16% to +26% of all search clicks**, without ranking one
place better. This is the only item in the plan whose upside needs no new
content and no new rankings.

**Risk.** Google rewrites titles it dislikes, and a title stuffed with every
phrase invites that. Keep it under 60 characters and readable as English.
There is also a real chance CTR moves less than modelled; the floor is that
it does not get worse, since the current snippet is already underperforming.

**Verification.** Two weeks after deploy, re-run the query report for the
same four terms and compare CTR at matched average position. Position will
wander on its own — CTR at constant position is the signal.

---

### A2. Image SEO — the site is not in Google Images at all

**Cost: 6h. Return: a channel that is currently zero. Confidence: Medium.**

**Status: implemented 2026-08-20, not yet deployed.**

**Evidence.** The served `index.html` contains **no `<img>` element at all**
— verified, not inferred. At runtime Leaflet injects around forty `<img>`
tags, but every one is a 256-pixel tile fragment with no `alt` text and no
stable URL meaning, which is worthless as an image-search result: nobody
searching "map of middle earth" wants one square of parchment.
`og-image.jpg` exists but is a social card, referenced only in meta tags and
never rendered in the page. The site's
single largest query, "map of middle earth" (27,672 impressions), is an
image-intent query: people searching it want to *look at a map*. The site
competes for that intent with a text link.

**The work.**
1. Render two large static images from assets already in the repo:
   `middle_earth.jpeg` (7680×4320 parchment original) and `_sat_terrain.jpg`
   (7680×4608 AI satellite render), downscaled to ~1600×900 at quality ~70.
   Filenames matter for image search — use `map-of-middle-earth.jpg` and
   `middle-earth-satellite-map.jpg`.
2. Place the parchment image in the first-visit splash card on `/`, with
   descriptive `alt`, explicit `width`/`height`, and `max-width:100%`. This
   is genuinely visible content, not a hidden image: the splash renders
   whenever `localStorage` is empty, which is exactly the state Googlebot
   crawls in. It also improves the splash — it currently describes the map in
   prose without showing it.
3. Place the satellite image on `about.html` as a figure. That page already
   documents the satellite pipeline and already carries four tile images, so
   it is the honest home for it. It also targets an uncontested query —
   nobody else has a satellite map of Middle-earth.
4. Add an `ImageObject` to the JSON-LD on `/` declaring the primary image.
5. Extend `sitemap.xml` with the `image` namespace, listing each image under
   the page it actually appears on.

**The model.** Not quantifiable from current data, because the channel does
not exist yet — Search Console reports no image-search impressions to
project from. The reason to do it anyway is that the intent behind the
biggest query family is visual, and the cost is six hours of work on assets
that already exist. Treat the first month as measurement, not as a
projection: filter Search Console by search type `image` and see what
appears.

**Risk.** Adding an image to the splash is a visible product change on the
most-seen surface of the site. Keep it small and tasteful; check the splash
on a narrow mobile viewport, since the card is already dense with a heading,
prose, four bullets and a disclaimer.

**Verification.** `document.querySelectorAll('img').length` ≥ 1 on `/`. The
image sitemap validates. Then, at four weeks, Search Console → search type
`image`, which should go from no data to something.

---

### A3. Generate a page per location from `data.js`

**Cost: 20h. Return: +17 to +50 clicks/day at maturity. Confidence: Medium.**

**Evidence.** The site is three URLs. That is the structural ceiling on
everything: a Leaflet map has almost no crawlable text, so all 204,279
impressions are won by three pages, and 49% of them by four head keywords.
The long tail is measurably unclaimed:

| query | impressions | CTR | position |
| --- | --- | --- | --- |
| rivendell map | 327 | 0.61% | 8.5 |
| silmarillion map | 329 | 1.52% | 9.0 |
| lotr world map | 603 | 2.16% | 5.5 |
| lord of the rings world map | 532 | 1.88% | 5.6 |

Position 8.5 for "rivendell map" is what a site earns when it merely
*mentions* Rivendell inside a JavaScript payload. There are 128 locations in
`data.js`, each with a name, description, category and coordinates, plus
related events and the journeys that pass through them — and a
`locations.csv` in the repo that has never been published at all.

**The work.** A build script that reads `data.js` and emits one static page
per location: the event description, era and book, coordinates, the journeys
that pass through, links to related events, a static map crop centred on the
location, and a prominent deep link into the live map at that position
(`/?fly=px,py&event=...`, which already works). Wire them into a real
internal link graph — an index page, prev/next by region, links from the
map's popups — and add them to `sitemap.xml`.

**The model.** Conservatively: if 40 of the 128 locations each attract 200
impressions per 28 days at 6% CTR, that is +480 clicks/28d (+17/day). If the
pages rank as well as the homepage does for its tail terms, three times that
is reachable. The wide range is honest — it depends on rankings the site does
not hold yet.

**Risk, and a judgment call.** 128 thin pages generated from one data file is
exactly the shape Google penalises as doorway pages. The mitigation is that
each page must carry content a reader would actually want: the full event
description, its place in the chronology, the journeys through it, and the
related events — not a name, a coordinate and a link. If the data cannot
support a substantive page for a given location, **omit that location**
rather than shipping a stub. Expect to ship perhaps 80–100 of the 128.

**Verification.** All emitted pages return 200 with a unique `<title>`,
`<h1>` and description. `indexing_coverage` on a 20-URL sample two weeks
after deploy: indexed, not "crawled — currently not indexed".

---

### A4. Hobbit and Silmarillion era landing pages

**Cost: 8h. Return: +188 clicks/28d measured, plus new rankings. Confidence: Medium.**

**Evidence.** Two era-shaped demand pockets are being served by a generic
homepage. The Hobbit cluster — "the hobbit map" (1,860 impressions, 2.47%,
position 3.7) and "hobbit map" (1,504, 2.33%, 4.2) — is 3,364 impressions
converting at ~2.4% from a page whose title does not contain the word
*Hobbit*. Separately, "silmarillion map" sits at position 9.0 with 1.52% CTR.

The behavioural data says the appetite is real and points the same way: the
single most-opened marker on the map, across 11 days and 70,849 marker
opens, is **Cuiviénen — Awakening of the Elves** (1,069 opens) — First Age
deep lore, ahead of Mount Doom (796) and Barad-dûr (798).

**The work.** Two filtered views of the existing map (`?era=hobbit`,
`?era=first-age`) each with its own indexable landing page: real prose
introducing the era, the list of that era's locations linking into the map,
and its own title, description and structured data. This reuses the map and
the data — it is packaging, not new content.

**The model.** Lifting the Hobbit cluster from 2.4% to 8% CTR is +188
clicks/28d on impressions the site already earns. The Silmarillion side is a
ranking play, not a CTR play, so it is not modelled — but position 9.0 with
no dedicated page is a floor, not a ceiling.

---

### A5. Localisation — German first, then Spanish, Italian, Russian

**Cost: 3h per language. Return: +46 clicks/28d before rank gains. Confidence: Medium.**

**Status: extraction done 2026-08-21; no language shipped yet.** The 14h
first-language estimate was mostly extraction, and that part is complete, so
each language is now the ~3h marginal job. See `i18n/README.md`.

- `i18n/en.json` — 77 UI strings in 11 groups, the canonical catalogue.
- `i18n/i18n.js` — 122-line runtime. English is never fetched: every call
  site passes the English string as its fallback and the static markup keeps
  its English text, so with no catalogue the pages render exactly as before.
  A localised page inlines its catalogue ahead of the script, so translations
  are present on first paint with no fetch and no flash of English.
- `?lang=xx` previews a catalogue against the English pages, loading it
  synchronously so even JS-built strings render translated. Preview and QA
  only; production inlines.
- Pseudo-locale QA: the README has a one-liner that wraps every value in
  guillemets, so any string still rendering bare English is one that was
  never extracted. Used to verify this work — 30 sampled strings across both
  pages, none unwrapped.

Analytics deliberately still reports English: `journey_toggle` sends
`journey.label` from `data.js`, not the translated string, so localised and
English sessions aggregate into the same GA4 rows instead of splitting.
Verified by spying on `track()` under the pseudo-locale — the legend shows
`«The Fellowship»` while the event reports `The Fellowship`.

**Evidence.** Non-English demand is measured, and the site ranks poorly for
it while ranking well the moment a localised phrase matches:

| query | impressions | CTR | position |
| --- | --- | --- | --- |
| herr der ringe karte | 410 | 0.49% | 7.7 |
| mittelerde karte | 331 | 2.42% | 9.2 |
| herr der ringe map | 233 | 4.72% | 4.4 |
| mappa interattiva signore degli anelli | 38 | 26.32% | 3.7 |

The Italian row is the tell: 26% CTR at position 3.7 with no Italian page in
existence. GA4 backs it — Germany is the fourth-largest country (443 users
in 31 days), Spain sixth (363), and `microsiervos.com` still sends ~13
sessions/day months after its launch coverage, entirely unprompted.

**The work remaining, per language.** Translate the 77 values in a copy of
`en.json`; build `/de/index.html` with `<html lang="de">`, the catalogue
inlined, and a **static translated `<head>`** — title, description and `<h1>`
must be in the served HTML, never rendered client-side, or a crawler sees
English; add the route in `firebase.json`, reciprocal `hreflang` plus
`x-default`, and the new URL in `sitemap.xml`. Marker descriptions stay in
English initially, stated plainly on the page.

**The model.** +46 clicks/28d from existing German impressions alone if CTR
reaches 6%. The real prize is unranked demand: the site currently ranks 8th–9th
for German head terms, so most German searches never see it at all.

**Judgment call.** Machine-translated marker descriptions across four
languages would be 512 blocks of unreviewed text about a canon whose fans
are famously exacting. Do not ship that. Interface plus landing copy only,
until a native speaker reviews more.

---

## B — Acquisition off search

### B1. A second press wave with a different hook

**Cost: 4h. Return: 1,000–3,000 users in a week, plus durable backlinks. Confidence: Speculative.**

**Evidence.** The launch wave worked and is now spent: week 16 hit 5,936
active users against a ~1,200 baseline, and the referrers that drove it have
decayed to noise (pikabu.ru 22 → 1.3 sessions/day; Direct 207 → 75/day).
Re-posting "interactive LOTR map" will not re-fire — but that is no longer
the most interesting thing about the project. The AI-generated satellite
terrain layer is: a Stable Diffusion pipeline that turns a hand-drawn
parchment map into a plausible orbital view, already documented on
`about.html`, with the generation scripts committed in `99b4752`.

**The work.** One post built around the pipeline rather than the map —
before/after tile comparisons, the masking approach, what failed — aimed at
Hacker News, r/MapPorn, r/tolkienfans and r/dataisbeautiful. The map is the
payoff, not the headline.

**The model.** Unpredictable by nature. Note that the durable value is
backlinks and authority for the head terms in A1, not the traffic spike
itself; the spike decays within a fortnight, as the data above shows.

---

### B2. A community cadence, not a launch

**Cost: 1h/week. Return: already 15 sessions/day unprompted. Confidence: Speculative.**

Reddit sends a steady ~15 sessions/day with no effort at all, and that is
after months. Post *features*, not the map: the satellite view, the timeline
playback, a newly added era. Different subreddits reward different features,
and each post is a fresh chance at a link.

---

### B3. Publish the dataset for AI answer engines

**Cost: 3h. Return: compounding — 16x growth already. Confidence: Medium.**

**Evidence.** ChatGPT referrals went from 0.4 sessions/day (May–June) to 6.4
sessions/day (2026-07-20 → 08-19) — a 16x increase off a small base, and
Gemini has started appearing too. `llms.txt` shipped in tier 3 of the earlier
plan and this is the return on it. But an answer engine cannot cite what it
cannot read, and the 128 locations currently exist only inside a JavaScript
file.

**The work.** Publish `locations.csv` as a real HTML table page (every
location, era, book, coordinates, one-line description) plus a
`locations.json` endpoint, and reference both from `llms.txt` and the
sitemap. This doubles as the internal link hub that A3 needs, so do it before
A3, not after.

---

## C — Retention

The site converts strangers well and residents badly: ~24% of users return,
about twice each. Nothing on the site gives anyone a reason to come back.

### C1. Make sharing first-class

**Cost: 13h. Return: converts 70,849 marker opens per 11 days into distribution. Confidence: Medium.**

**Evidence.** Deep links already work and are already being used *without any
share affordance existing*: 287 `deep_link_arrival` events in 11 days, from
people hand-copying URLs. Meanwhile 70,849 marker opens in the same 11 days
represent an enormous surface with no share button anywhere on it.

**The work.** A "copy link to this view" control that captures position, zoom,
active layers and open marker; a per-marker share action in the popup; and a
pre-rendered social image per location so shared links unfurl as a map crop
of *that place* rather than the same generic card. The per-location images
reuse the tile pyramid and the A3 build script — sequence C1 after A3 and
the marginal cost drops by about half.

---

### C2. Surface the timeline playback

**Cost: 2h. Return: 10% → 25%+ of map traffic. Confidence: High.**

**Status: implemented 2026-08-21, not yet deployed.** A "Play the story"
control now sits in a bottom-centre bar on the map, linking to
`timeline.html?play=1`, which autoplays on arrival and reports
`timeline_play` with `source: map_cta`. The splash bullet names the feature
instead of the page.

**Evidence.** `timeline.html` drew 873 pageviews against the map's 8,581 in
11 days — about 10%. Its playback feature, which animates events
chronologically across the map, fired **62 times in 11 days**. Sixty-two.
The most impressive thing the project does is effectively undiscovered, and
it is already built, already linked twice from the map, and already
instrumented.

**The work.** A prominent entry point on the map itself — a labelled "Play
the story" control rather than a nav link — plus autoplay when the timeline
is opened from that control, and a line in the splash card that names the
feature instead of describing the page.

---

### C3. Promote the satellite view out of the legend

**Cost: 0.5h. Return: 15% → 40%+ feature reach. Confidence: High.**

**Status: implemented 2026-08-21, not yet deployed.** The satellite toggle
is now a top-level button in the same bottom-centre bar. The legend row and
the button drive one shared `setSatellite()` state, so either reflects the
other, and the `?view=satellite` deep link reuses the same path. The button
reports `source: map_control` to distinguish it from `legend`. This matters
most on mobile, where the legend auto-collapses on load and the satellite
row was previously unreachable without reopening it.

1,275 `satellite_toggle` events across ~8,300 sessions in 11 days: roughly
15% of visitors find it, because it is a row inside a legend panel. It is the
most visually striking thing on the site and the most likely to be shared or
screenshotted. Make it a visible top-level control. Half an hour of work.

---

### C4. Content depth — more markers, more eras

**Cost: ongoing. Return: the primary retention lever. Confidence: Medium.**

**Evidence.** The marker distribution is remarkably, informatively flat.
Across 11 days, all 128 markers were opened between 672 and 1,069 times.
People are not searching for one place — they are working through
*everything*, and then they run out. All nine journey paths are used too
(Frodo 1,352 activations, the Fellowship 1,139, Bilbo 1,014, down to
Boromir 514).

Two things follow. Depth is what brings people back, and the appetite skews
deeper into the legendarium than the films — the most-opened marker of all is
Cuiviénen. That points at the same First Age expansion as A4, which is why
these two should be planned together.

---

## D — Measurement

### D1. Protect the numbers

**Cost: 1h. Return: every projection above stays legible. Confidence: High.**

**Status: done 2026-08-21.** Findings below; items 1 and 2 need the GA4 UI,
as the Analytics MCP can list annotations but not create them.

1. Baseline recorded — the table at the top of this document, measured
   2026-08-20, is the pre-Wave-1 baseline. **Still to do in the GA4 UI:**
   add it as an annotation, since the API is read-only here.
2. **Still to do in the GA4 UI:** annotate 2026-08-08 with the
   engagement-metric discontinuity, so nobody re-derives it in six months.
3. **The unattributed sessions are not bots.** Investigated 2026-08-21 and
   the bot hypothesis is disproven on two independent counts:

   - **Channel mix matches real traffic.** 3,098 of them come from
     `google / organic` landing on `/`, with a plausible tail behind it —
     direct, reddit.com, yandex.ru, duckduckgo, microsiervos.com,
     techbang.com, bing. A bot population does not arrive two-thirds via
     Google organic with a realistic referrer distribution behind it.
   - **The cohort predates the instrumentation and shrank after it.** It ran
     at 140–250 sessions/day through all of July, then *fell* to 110–173/day
     after the 2026-08-08 deploy.

   What they actually are: sessions of exactly one pageview and two events
   (`page_view` + `session_start`), with no `first_visit` and no
   `user_engagement`. The visitor leaves before GA4's engagement threshold
   fires, so the session can be neither classified as new/returning nor
   counted as engaged. The browser/OS spread is ordinary consumer traffic,
   led by Safari on iOS (1,705 sessions).

   Two consequences. The 24% is a **bounce-measurement artefact, not junk
   traffic** — those are real people, and the fall after 2026-08-08 is
   itself evidence the custom events are capturing engagement that was
   previously invisible. And no bot filter should be applied; filtering
   would delete real visitors.
4. Set a fortnightly cadence: for each shipped item, compare CTR at matched
   average position, not raw clicks — impressions drift on their own.

---

### D2. Stop external links splitting the homepage

**Cost: 0.25h. Return: consolidates ~944 sessions/28d onto one URL. Confidence: High.**

**Status: implemented 2026-08-21, not yet deployed.**

**Evidence.** This one surfaced out of D1. Item 1.2 of the earlier plan
repointed all nine internal links from `index.html` to `/`, but that only
fixed the internal half. External links and Google's existing index still
send real traffic to `/index.html`: 568 sessions from `google / organic` and
376 from direct in the last 31 days within the unattributed cohort alone,
and `/index.html` drew 689 pageviews against `/`'s 8,581 over the 11-day
behavioural window. The homepage is still being counted, and ranked, as two
pages.

**The work.** A `301` redirect from `/index.html` to `/` in `firebase.json`,
which Firebase serves with the query string intact so `?fly=`, `?event=` and
`?view=satellite` deep links survive it. Plus the one internal link that
item 1.2 missed, in `timeline.html`'s `view_on_map` handler, which was still
building `index.html?fly=...` and is now `/?fly=...`.

**Verification.** `curl -sI https://…/index.html` returns `301` with
`location: /`, and a deep link such as `/index.html?fly=100,100` keeps its
query string through the redirect.

---

## Sequencing

**Wave 1 — 12.75h. Complete.** A1 (3h) and A2 (6h) shipped 2026-08-20;
C2 (2h), C3 (0.5h), D1 (1h) and D2 (0.25h, which D1 turned up) done
2026-08-21. D1 leaves two annotations to add by hand in the GA4 UI. Highest confidence in the plan, no new content required, and it
directly addresses the CTR erosion visible since 2026-08-03. A1 and A2 are
both edits to `<head>` and page assets, so they ship as one deploy.

**Wave 2 — 24h. Structural.** B3 (3h) → A4 (8h) → A3 (20h, partially
overlapping B3's output). This is where the three-URL ceiling comes off. B3
first because A3 needs its link hub.

**Wave 3 — 17h + ongoing. Compounding.** C1 (13h, cheaper after A3), A5
(~3h/language, extraction done 2026-08-21), B1 (4h), then B2 and C4 as
habits rather than projects.

Total to the end of Wave 2: ~37 hours. That is the point at which the site
stops being three pages competing for four keywords.

---

## Post-implementation checklist

Per wave, before deploying:

1. Every page still has exactly one `<h1>`:
   `document.querySelectorAll('h1').length === 1`.
2. All `name="description"` meta tags ≤160 characters.
3. `<title>` ≤60 characters and readable as a sentence, not a keyword list.
4. Every JSON-LD block validates at `https://validator.schema.org/` with zero
   errors.
5. `sitemap.xml` is well-formed and lists every new URL, with `lastmod`
   matching the deploy date.
6. Every page loads with zero console errors on desktop and on a 375px-wide
   viewport.
7. `firebase deploy --only hosting`, then re-verify 1–6 against the live URLs
   — not localhost, which no longer reports analytics at all.
8. Confirm the deploy actually landed: `firebase hosting:channel:list` should
   show a `live` release timestamp from today. Commit `5125f00` has been
   sitting undeployed since 2026-08-18 for exactly this reason.
9. Two weeks later, re-run the Search Console comparison for the queries the
   wave targeted, at matched average position.
