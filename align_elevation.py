#!/usr/bin/env python3
"""
align_elevation.py — Warp elevation_map.jpg to match parchment map coordinates.

Uses thin-plate spline (TPS) interpolation via scipy RBF to build an inverse
mapping from parchment space (7680×4608) back to source space (1080×735),
then resamples the source image into a correctly-aligned output.

Outputs:
  _aligned_elev.jpg     — warped image at full 7680×4608
  tiles-sat/            — tile pyramid (zoom 0/1/2)

Control points were estimated visually from known landmarks:
  Mount Doom (red glow), Sea of Rhûn, Misty Mountains spine,
  western coastlines, Iron Hills, Bay of Belfalas, etc.
"""

import math
import shutil
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.interpolate import RBFInterpolator
from scipy.ndimage import map_coordinates

# ── Output dimensions ────────────────────────────────────────────────────────
OUT_W, OUT_H = 7680, 4608
TILE_SIZE    = 256
DST_TILES    = Path("tiles-sat")

OCEAN_COLOR  = np.array([15, 50, 105], dtype=np.uint8)   # fill for out-of-bounds areas

# ── Control points ────────────────────────────────────────────────────────────
# Format: (src_x, src_y, dst_x, dst_y)
# src = pixel coords in elevation_map.jpg (1080×735)
# dst = pixel coords in parchment canvas (7680×4608)
#
# Landmarks used:
#   1.  Mount Doom          — red glow, clearly visible centre-right
#   2.  Sea of Rhûn         — kidney-shaped dark lake, upper right
#   3.  Iron Hills           — mountain cluster just left of Rhûn lake
#   4.  N Lindon coast       — northwest corner where ice meets sea
#   5.  Annúminas area       — bay on west coast, ~1/3 down
#   6.  Andrast cape         — southwestern peninsula tip
#   7.  Bay of Belfalas      — wide southern bay, Dol Amroth coast
#   8.  Caradhras            — central Misty Mountains peak
#   9.  Gladden Fields       — confluence, centre-north Anduin valley
#  10.  Brown Lands / E Mirkwood — east of centre, north of Mordor
#  11.  Withered Heath       — northeast dragon lands (upper right)
#  12.  Near Harad           — far south desert
#  13.  Pelargir             — river delta on south Gondor coast
#  14.  Gap of Rohan         — mountain pass, lower centre
CONTROL_POINTS = [
    # src (1080×735)    dst (7680×4608)
    #
    # NOTE: src coords were re-estimated by visual inspection of elevation_map.jpg.
    # Ocean is at x=0..~85 in src; land starts at x≈87.
    # Previous points 1-4 erroneously used interior Eriador x-coords for coast.

    # ── Western coastline (N→S) — anchors non-linear E-W stretch ──
    (  87,  20,    1300,  340),   #  1  N Lindon / Forlond coast top
    (  95, 218,    1280,  960),   #  2  Harlindon mid-coast / Gulf of Lune lat
    (  94, 300,    1260, 1440),   #  3  Harlindon south
    (  95, 368,    1295, 2100),   #  4  Coast near Enedwaith
    ( 108, 462,    1720, 2760),   #  5  Andrast cape tip

    # ── Blue Mountains (Ered Luin) — west anchor range ──
    ( 122,  55,    1340,  490),   #  6  Blue Mtns north
    ( 115, 395,    1290, 1760),   #  7  Blue Mtns south

    # ── Interior spine ──
    ( 265,  85,    2260,  640),   #  8  N Misty Mountains (Angmar area)
    ( 392, 348,    2440, 2140),   #  9  Gap of Rohan

    # ── Southern coast ──
    ( 505, 568,    2780, 3040),   # 10  Bay of Belfalas coast

    # ── High-confidence distinctive landmarks ──
    ( 607, 398,    3440, 2220),   # 11  Mount Doom (red glow — most reliable)
    ( 782, 143,    3828,  952),   # 12  Lonely Mountain / Erebor
    ( 853, 218,    4220, 1640),   # 13  Sea of Rhûn (kidney lake — most reliable)

    # ── Eastern anchors ──
    ( 635, 215,    3200, 1360),   # 14  Mirkwood center (large dark forest)
    ( 897, 263,    4060, 1180),   # 15  Iron Hills (E of Lonely Mtn)

    # ── Far reaches — constrain extrapolation ──
    ( 650,   8,    2600,  160),   # 16  Northern Forodwaith ice (top)
    ( 650, 662,    3200, 3680),   # 17  Southern Haradwaith
    ( 965, 332,    5200, 1680),   # 18  Eastern steppe (past Sea of Rhûn)
]

# ── RBF smoothing — higher = smoother warp, lower = tighter fit ──────────────
RBF_SMOOTHING = 0.0   # 0 = exact interpolation through control points


GRID_SCALE = 8   # compute TPS at 1/8 resolution, then upscale mapping


def build_tps_mapping(control_points, out_h, out_w, src_h, src_w):
    """
    Build inverse mapping: for every (Y, X) in output space, return
    (y, x) in source space using thin-plate spline RBF.

    Computed at 1/GRID_SCALE resolution then upsampled — much faster
    than evaluating RBF at every output pixel.
    Returns two arrays of shape (out_h, out_w): src_rows, src_cols
    """
    from scipy.ndimage import zoom as nd_zoom

    pts = np.array(control_points, dtype=np.float64)
    src_xy = pts[:, :2]   # (src_x, src_y) in elevation_map
    dst_xy = pts[:, 2:]   # (dst_x, dst_y) in parchment

    rbf_x = RBFInterpolator(dst_xy, src_xy[:, 0], kernel="thin_plate_spline",
                            smoothing=RBF_SMOOTHING)
    rbf_y = RBFInterpolator(dst_xy, src_xy[:, 1], kernel="thin_plate_spline",
                            smoothing=RBF_SMOOTHING)

    # Evaluate on coarse grid
    coarse_h = math.ceil(out_h / GRID_SCALE)
    coarse_w = math.ceil(out_w / GRID_SCALE)
    print(f"  Evaluating TPS on {coarse_w}×{coarse_h} grid …", end=" ", flush=True)

    ys = np.linspace(0, out_h - 1, coarse_h)
    xs = np.linspace(0, out_w - 1, coarse_w)
    grid_x, grid_y = np.meshgrid(xs, ys)
    query = np.column_stack([grid_x.ravel(), grid_y.ravel()])

    coarse_cols = rbf_x(query).reshape(coarse_h, coarse_w)
    coarse_rows = rbf_y(query).reshape(coarse_h, coarse_w)
    print("done")

    # Upscale mapping to full output resolution
    print("  Upscaling mapping …", end=" ", flush=True)
    scale_r = out_h / coarse_h
    scale_c = out_w / coarse_w
    src_rows = nd_zoom(coarse_rows, (scale_r, scale_c), order=3)[:out_h, :out_w]
    src_cols = nd_zoom(coarse_cols, (scale_r, scale_c), order=3)[:out_h, :out_w]
    print("done")

    return src_rows, src_cols


def warp_image(src_img, src_rows, src_cols, src_h, src_w):
    """Resample src_img using precomputed (src_rows, src_cols) mapping."""
    arr = np.array(src_img).astype(np.float32)   # (H, W, 3)

    out_channels = []
    for c in range(3):
        channel = map_coordinates(arr[:, :, c], [src_rows, src_cols],
                                  order=3, mode="constant", cval=np.nan)
        out_channels.append(channel)
    result = np.stack(out_channels, axis=2)

    # Fill out-of-bounds (NaN) regions with ocean colour
    oob_mask = np.isnan(result[:, :, 0])
    for c in range(3):
        result[:, :, c][oob_mask] = OCEAN_COLOR[c]

    return result.clip(0, 255).astype(np.uint8)


def slice_to_tiles(img, zoom_level, dst_dir):
    w, h  = img.size
    count = 0
    for x in range(math.ceil(w / TILE_SIZE)):
        for y in range(math.ceil(h / TILE_SIZE)):
            x1, y1 = x * TILE_SIZE, y * TILE_SIZE
            x2, y2 = min(x1 + TILE_SIZE, w), min(y1 + TILE_SIZE, h)
            tile = img.crop((x1, y1, x2, y2))
            if tile.size != (TILE_SIZE, TILE_SIZE):
                padded = Image.new("RGB", (TILE_SIZE, TILE_SIZE), tuple(OCEAN_COLOR))
                padded.paste(tile)
                tile = padded
            path = dst_dir / str(zoom_level) / str(x) / f"{y}.jpg"
            path.parent.mkdir(parents=True, exist_ok=True)
            tile.save(str(path), "JPEG", quality=95)
            count += 1
    return count


def main():
    print("=" * 55)
    print("Middle-earth Elevation Map Alignment")
    print(f"  Source: elevation_map.jpg")
    print(f"  Output: {OUT_W}×{OUT_H}")
    print(f"  Control points: {len(CONTROL_POINTS)}")
    print("=" * 55)

    src_img = Image.open("elevation_map.jpg").convert("RGB")
    src_w, src_h = src_img.size
    print(f"\nSource: {src_w}×{src_h}")

    print("\n[1/4] Building TPS warp mapping …")
    src_rows, src_cols = build_tps_mapping(
        CONTROL_POINTS, OUT_H, OUT_W, src_h, src_w)

    print(f"\n[2/4] Warping image to {OUT_W}×{OUT_H} …")
    warped_arr = warp_image(src_img, src_rows, src_cols, src_h, src_w)
    warped_img = Image.fromarray(warped_arr)
    warped_img.save("_aligned_elev.jpg", quality=97)
    print("  Saved _aligned_elev.jpg")

    print("\n[3/4] Generating tile pyramid …")
    if DST_TILES.exists():
        shutil.rmtree(DST_TILES)

    n  = slice_to_tiles(warped_img, 2, DST_TILES)
    z1 = warped_img.resize((OUT_W // 2, OUT_H // 2), Image.LANCZOS)
    n += slice_to_tiles(z1, 1, DST_TILES)
    z0 = warped_img.resize((OUT_W // 4, OUT_H // 4), Image.LANCZOS)
    n += slice_to_tiles(z0, 0, DST_TILES)
    print(f"  {n} tiles written to {DST_TILES}/")

    print("\n[4/4] Done — open _aligned_elev.jpg to check alignment.")
    print("  Adjust CONTROL_POINTS in this script if features are off.")


if __name__ == "__main__":
    main()
