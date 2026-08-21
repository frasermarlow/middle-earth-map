#!/usr/bin/env python3
"""Cut map imagery for each place out of the parchment tile pyramid.

Reads .crops.json (written by build_pages.js) and produces two sizes:

  assets/crops/<slug>.jpg   640x360, one per place page
  assets/thumbs/<id>.jpg    288x162, one per event row on the /places index

Both come from the same window, so a thumbnail is the same view as the crop.

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
THUMBS = pathlib.Path("assets/thumbs")
WINDOW = (1280, 720)                     # source pixels around the place
FINAL = (640, 360)                       # what a place page displays
THUMB = (288, 162)                       # 2x the 144x81 index thumbnail
QUALITY = 72
THUMB_QUALITY = 68


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
    manifest_data = json.loads(manifest.read_text())
    thumbs = manifest_data["thumbs"]
    crops = manifest_data["crops"]
    OUT.mkdir(parents=True, exist_ok=True)
    THUMBS.mkdir(parents=True, exist_ok=True)

    print(f"stitching {TILES}…")
    canvas = stitch()
    print(f"canvas {canvas.size[0]}x{canvas.size[1]}: "
          f"{len(crops)} crops, {len(thumbs)} thumbs")

    crop_bytes = thumb_bytes = 0
    for entry in thumbs:
        window = crop_for(canvas, entry["px"], entry["py"])
        tpath = THUMBS / f"{entry['id']}.jpg"
        window.resize(THUMB, Image.LANCZOS).save(
            tpath, quality=THUMB_QUALITY, optimize=True, progressive=True)
        thumb_bytes += tpath.stat().st_size

    for entry in crops:
        window = crop_for(canvas, entry["px"], entry["py"])
        cpath = OUT / f"{entry['id']}.jpg"
        window.save(cpath, quality=QUALITY, optimize=True, progressive=True)
        crop_bytes += cpath.stat().st_size

    # Drop files nothing references any more
    for directory, keep in (
        (OUT, {f"{c['id']}.jpg" for c in crops}),
        (THUMBS, {f"{t['id']}.jpg" for t in thumbs}),
    ):
        for stale in directory.glob("*.jpg"):
            if stale.name not in keep:
                stale.unlink()
                print(f"removed stale {directory}/{stale.name}")

    print(f"{len(crops)} crops, {crop_bytes / 1024 / 1024:.1f} MB "
          f"({crop_bytes / max(len(crops), 1) / 1024:.0f} KB avg)")
    print(f"{len(thumbs)} thumbs, {thumb_bytes / 1024 / 1024:.1f} MB "
          f"({thumb_bytes / max(len(thumbs), 1) / 1024:.0f} KB avg)")


if __name__ == "__main__":
    main()
