# Middle-earth Interactive Map

An interactive map of Tolkien's Middle-earth — 128 events from The Silmarillion,
The Hobbit, and The Lord of the Rings plotted across the First, Second, and
Third Ages, with character journeys and a synthetic satellite view. See
[about.html](about.html) for how the map and satellite layer were built.

Live at https://middle-earth-interactive-map.web.app

## Setup

This repo uses **Git LFS** for `middle-earth-masks.psd` (the hand-painted
terrain masks used by the satellite-generation pipeline), which exceeds
GitHub's 100MB file limit. Install it before cloning, or `pull` after:

```bash
brew install git-lfs
git lfs install
```

## Deploy

```bash
firebase deploy --only hosting
```

Local preview:

```bash
firebase serve --only hosting --port 5000
```

## Structure

- `index.html` — the map (Leaflet, `L.CRS.Simple`)
- `timeline.html` — chronological timeline with playback
- `about.html` — how the map and satellite layer were built
- `data.js` — shared events/journeys data
- `tiles/`, `tiles-sat/` — parchment and synthetic satellite tile pyramids
- `generate_tiles.py`, `generate_sat_masked.py`, `align_elevation.py`,
  `generate_elev.py`, `generate_sat_terrain.py` — the generation pipeline for
  the tile pyramids
