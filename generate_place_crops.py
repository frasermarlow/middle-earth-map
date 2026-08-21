#!/usr/bin/env python3
"""Crop a map thumbnail for each generated place page.

Reads .crops.json (written by build_pages.js) and cuts a window out of the
parchment tile pyramid around each place, so every place page shows that spot
on the real map rather than a generic image.

    node build_pages.js && python3 generate_place_crops.py

Needs PIL. On this machine /usr/bin/python3 has it; the homebrew python does
not.
"""

import json
import pathlib
import sys

from PIL import Image

TILES = pathlib.Path("tiles/2")          # full-resolution layer: 30 x 17 tiles
TILE = 256
OUT = pathlib.Path("assets/crops")
WINDOW = (1280, 720)                     # source pixels around the place
FINAL = (640, 360)                       # what the page displays
QUALITY = 72


def stitch():
    xs = sorted(int(p.name) for p in TILES.iterdir() if p.name.isdigit())
    ys = sorted(int(p.stem) for p in (TILES / str(xs[0])).glob("*.jpg"))
    w, h = (max(xs) + 1) * TILE, (max(ys) + 1) * TILE
    canvas = Image.new("RGB", (w, h))
    for x in xs:
        for y in ys:
            tile = TILES / str(x) / f"{y}.jpg"
            if tile.exists():
                canvas.paste(Image.open(tile), (x * TILE, y * TILE))
    return canvas


def crop_for(canvas, px, py):
    cw, ch = WINDOW
    w, h = canvas.size
    left = min(max(px - cw // 2, 0), max(w - cw, 0))
    top = min(max(py - ch // 2, 0), max(h - ch, 0))
    box = (left, top, min(left + cw, w), min(top + ch, h))
    return canvas.crop(box).resize(FINAL, Image.LANCZOS)


def main():
    manifest = pathlib.Path(".crops.json")
    if not manifest.exists():
        sys.exit("no .crops.json — run `node build_pages.js` first")
    places = json.loads(manifest.read_text())
    OUT.mkdir(parents=True, exist_ok=True)

    print(f"stitching {TILES}…")
    canvas = stitch()
    print(f"canvas {canvas.size[0]}x{canvas.size[1]}, cropping {len(places)} places")

    total = 0
    for place in places:
        img = crop_for(canvas, place["px"], place["py"])
        out = OUT / f"{place['id']}.jpg"
        img.save(out, quality=QUALITY, optimize=True, progressive=True)
        total += out.stat().st_size

    # Drop crops for places that no longer have a page
    keep = {f"{p['id']}.jpg" for p in places}
    for stale in OUT.glob("*.jpg"):
        if stale.name not in keep:
            stale.unlink()
            print(f"removed stale crop {stale.name}")

    print(f"{len(places)} crops, {total / 1024 / 1024:.1f} MB total, "
          f"{total / len(places) / 1024:.0f} KB average")


if __name__ == "__main__":
    main()
