#!/usr/bin/env python3
"""Generate 256x256 JPEG tiles from the Middle-earth source PNG.

Output structure: tiles/{z}/{x}/{y}.jpg
  Dir zoom 0 (map zoom -2): 1/4 scale
  Dir zoom 1 (map zoom -1): 1/2 scale
  Dir zoom 2 (map zoom  0): native resolution
"""

import math
import os
from PIL import Image

SRC = "middle_earth.png"
OUT = "tiles"
TILE = 256
QUALITY = 85
BG = (0x2C, 0x24, 0x18)  # #2c2418

# Dir zoom → scale factor (zoom 2 = native)
ZOOM_SCALES = {0: 0.25, 1: 0.5, 2: 1.0}


def generate_tiles():
    img = Image.open(SRC)
    src_w, src_h = img.size
    print(f"Source image: {src_w}x{src_h}")

    for z, scale in ZOOM_SCALES.items():
        scaled_w = round(src_w * scale)
        scaled_h = round(src_h * scale)
        cols = math.ceil(scaled_w / TILE)
        rows = math.ceil(scaled_h / TILE)
        print(f"Zoom {z}: {scaled_w}x{scaled_h} → {cols}x{rows} = {cols * rows} tiles")

        scaled = img.resize((scaled_w, scaled_h), Image.LANCZOS)

        for x in range(cols):
            dir_path = os.path.join(OUT, str(z), str(x))
            os.makedirs(dir_path, exist_ok=True)
            for y in range(rows):
                # Crop region from scaled image (y=0 is top row)
                left = x * TILE
                upper = y * TILE
                right = min(left + TILE, scaled_w)
                lower = min(upper + TILE, scaled_h)

                crop = scaled.crop((left, upper, right, lower))

                # Pad edge tiles if smaller than 256x256
                if crop.size != (TILE, TILE):
                    padded = Image.new("RGB", (TILE, TILE), BG)
                    padded.paste(crop, (0, 0))
                    crop = padded

                tile_path = os.path.join(dir_path, f"{y}.jpg")
                crop.convert("RGB").save(tile_path, "JPEG", quality=QUALITY)

        scaled.close()

    img.close()
    print("Done.")


if __name__ == "__main__":
    generate_tiles()
