# Localisation

`en.json` is the canonical catalogue: 77 UI strings in 11 groups. Every other
language is a copy of it with the values translated. This directory is the
extraction step of item A5 in `../traffic-growth-plan.md` — with it in place,
adding a language is roughly three hours rather than fourteen.

## What is in scope

Interface chrome only: navigation, the splash card, the legend, the map
control bar, the timeline controls and card actions, era names, link-type
labels, the six book titles, and the nine journey names.

## What is deliberately out of scope

The 128 event names and descriptions in `data.js`, and the 52 event-link
narrative labels. Machine-translating those would be around 512 blocks of
unreviewed prose about a canon whose readers are exacting, so they stay in
English until a native speaker reviews them. A localised page should say so
plainly.

## Adding a language

1. `cp en.json de.json`, set `$meta.language` and `$meta.name`, translate the
   values. **Never rename a key** and never drop a `{placeholder}` — the
   English string renders if a key is missing, so a partial translation
   degrades rather than breaks.
2. Preview it against the English pages: `/?lang=de` and
   `/timeline.html?lang=de`. This path loads the catalogue synchronously so
   even the JS-built strings render translated — it is for previewing only.
3. Build the real page at `/de/index.html`. It must:
   - set `<html lang="de">`;
   - **inline the catalogue** ahead of `i18n.js`, so translations are present
     on first paint with no fetch and no flash of English:
     `<script>window.__I18N__ = { …contents of de.json… }</script>`
   - carry a **static, translated `<head>`** — `<title>`, `<meta
     name="description">` and the `<h1>` must be German in the served HTML.
     Never render those client-side; a crawler must see them without running
     scripts. The `head` group in the catalogue holds these strings.
   - declare reciprocal `hreflang` on every language version plus
     `x-default`, and add the new URL to `../sitemap.xml`.
4. Add a route for `/de/` in `../firebase.json` if it needs one, then deploy.

## Pseudo-locale QA

Generates a catalogue where every value is wrapped in guillemets, so any
string still rendering bare English is one that was never extracted:

```sh
/usr/bin/python3 -c "
import json, io
d = json.load(io.open('i18n/en.json', encoding='utf-8'))
def walk(n): return {k: (walk(v) if isinstance(v, dict) else ('«' + v + '»' if isinstance(v, str) else v)) for k, v in n.items()}
json.dump(walk(d), io.open('i18n/qps.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)"
```

Then load `/?lang=qps`, look for anything unwrapped, and delete `qps.json`
when done. It is intentionally not committed.

## One thing to leave alone

Analytics values stay English on purpose. `journey_toggle` reports
`journey.label` from `data.js`, not the translated string, so German and
English sessions aggregate into the same rows in GA4 instead of splitting.
Do the same for any new event: translate what the reader sees, report the
English key.
