#!/usr/bin/env python3
"""Generate satellite-style tiles from the existing Middle-earth map tiles.

Transforms the fantasy parchment map into realistic satellite imagery by:
- Classifying terrain by color (forest, water, plains, mountains, snow)
- Remapping to realistic satellite colors
- Adjusting contrast and color balance for a cool, orbital look
"""

import os
import sys
from pathlib import Path
from PIL import Image, ImageEnhance, ImageFilter
import numpy as np

SRC = Path("tiles")
DST = Path("tiles-sat")


def classify_and_remap(img_array):
    """Classify terrain pixels and remap to satellite-realistic colors."""
    h, w, _ = img_array.shape
    r, g, b = img_array[:,:,0].astype(float), img_array[:,:,1].astype(float), img_array[:,:,2].astype(float)

    lum = (r * 0.299 + g * 0.587 + b * 0.114)
    max_c = np.maximum(np.maximum(r, g), b)
    min_c = np.minimum(np.minimum(r, g), b)
    sat = np.where(max_c > 0, (max_c - min_c) / max_c, 0)

    out = np.zeros_like(img_array, dtype=float)

    # ── Water: blue-dominant, darker ──
    water = (b > r * 1.1) & (b > g * 1.0) & (lum < 170)
    out[water, 0] = lum[water] * 0.12 + 8
    out[water, 1] = lum[water] * 0.20 + 15
    out[water, 2] = lum[water] * 0.45 + 40

    # ── Dense forest: green-dominant ──
    forest = (~water) & (g > r * 0.88) & (g > b * 1.05) & (sat > 0.06) & (lum < 180)
    out[forest, 0] = lum[forest] * 0.18 + 10
    out[forest, 1] = lum[forest] * 0.38 + 25
    out[forest, 2] = lum[forest] * 0.12 + 8

    # ── Snow / bright peaks: very high luminance ──
    snow = (~water) & (~forest) & (lum > 210) & (sat < 0.15)
    out[snow, 0] = lum[snow] * 0.82 + 30
    out[snow, 1] = lum[snow] * 0.84 + 30
    out[snow, 2] = lum[snow] * 0.88 + 30

    # ── Rocky / mountain: medium-high lum, low saturation ──
    rocky = (~water) & (~forest) & (~snow) & (lum > 140) & (sat < 0.12)
    out[rocky, 0] = lum[rocky] * 0.42 + 20
    out[rocky, 1] = lum[rocky] * 0.44 + 22
    out[rocky, 2] = lum[rocky] * 0.40 + 25

    # ── Arid / warm tones (brown, yellow, parchment) ──
    warm = (~water) & (~forest) & (~snow) & (~rocky) & (r > g * 0.9) & (r > b * 1.05)
    out[warm, 0] = lum[warm] * 0.40 + 30
    out[warm, 1] = lum[warm] * 0.36 + 25
    out[warm, 2] = lum[warm] * 0.22 + 12

    # ── Default / mixed terrain ──
    default_mask = ~(water | forest | snow | rocky | warm)
    out[default_mask, 0] = lum[default_mask] * 0.32 + 15
    out[default_mask, 1] = lum[default_mask] * 0.34 + 18
    out[default_mask, 2] = lum[default_mask] * 0.28 + 14

    return np.clip(out, 0, 255).astype(np.uint8)


def process_tile(src_path, dst_path):
    """Process a single tile image."""
    img = Image.open(src_path).convert("RGB")
    arr = np.array(img)

    # Remap terrain colors
    sat_arr = classify_and_remap(arr)
    sat_img = Image.fromarray(sat_arr)

    # Boost contrast slightly
    sat_img = ImageEnhance.Contrast(sat_img).enhance(1.25)

    # Slight sharpening for that crisp satellite look
    sat_img = sat_img.filter(ImageFilter.UnsharpMask(radius=1, percent=80, threshold=2))

    # Slight cool color balance (reduce red, boost blue slightly)
    r_ch, g_ch, b_ch = sat_img.split()
    r_ch = r_ch.point(lambda x: min(255, int(x * 0.95)))
    b_ch = b_ch.point(lambda x: min(255, int(x * 1.05 + 3)))
    sat_img = Image.merge("RGB", (r_ch, g_ch, b_ch))

    dst_path.parent.mkdir(parents=True, exist_ok=True)
    sat_img.save(str(dst_path), "JPEG", quality=90)


def main():
    total = 0
    tiles = []

    for zoom_dir in sorted(SRC.iterdir()):
        if not zoom_dir.is_dir():
            continue
        z = zoom_dir.name
        for x_dir in sorted(zoom_dir.iterdir()):
            if not x_dir.is_dir():
                continue
            x = x_dir.name
            for tile_file in sorted(x_dir.iterdir()):
                if tile_file.suffix.lower() in ('.jpg', '.jpeg', '.png'):
                    y = tile_file.stem
                    dst_path = DST / z / x / f"{y}.jpg"
                    tiles.append((tile_file, dst_path))
                    total += 1

    print(f"Processing {total} tiles...")

    for i, (src, dst) in enumerate(tiles):
        process_tile(src, dst)
        if (i + 1) % 50 == 0 or (i + 1) == total:
            print(f"  [{i+1}/{total}]")

    print("Done!")


if __name__ == "__main__":
    main()
