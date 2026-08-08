#!/usr/bin/env python3
"""
generate_sat_terrain.py — Procedural satellite terrain from PSD masks.

Style reference: elevation_map.jpg (satellite-photo look, colors, textures).
Content: entirely derived from middle-earth-masks.psd (correct alignment).
No Stable Diffusion.

Rendering pipeline:
  1. Load PSD masks + background (parchment)
  2. Build elevation raster (zone heights + peaked mountain profile)
  3. Compute hillshade (NW sun at 315°/45°)
  4. Build base color image using elevation-driven hypsometric gradient
     modified per terrain zone
  5. Add procedural fBm texture per zone (matches elevation_map detail level)
  6. Blend parchment micro-detail into terrain (mountain symbols → ridge texture)
  7. Snow caps, beaches, foothills
  8. Final unsharp-mask sharpening
  9. Slice to tile pyramid

Outputs:
  _sat_terrain.jpg  — full 7680×4608 satellite image
  tiles-sat/        — tile pyramid (zoom 0/1/2)
"""

import math
import shutil
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from psd_tools import PSDImage
from scipy.ndimage import (
    gaussian_filter, distance_transform_edt, label as sp_label,
    binary_dilation, zoom as nd_zoom,
)

# ── Paths / canvas ────────────────────────────────────────────────────────────
PSD_PATH         = Path("middle-earth-masks.psd")
STYLE_REF        = Path("elevation_map.jpg")    # style reference only (not used at runtime)
CANVAS_W, CANVAS_H = 7680, 4608
TILE_SIZE        = 256
DST_TILES        = Path("tiles-sat")

# ── Elevation zone values (same as generate_elev.py) ─────────────────────────
ELEVATION_ZONES = {
    "ocean":             4,
    "rivers and lakes": 48,
    "swamp":            16,
    "prairie":          55,
    "Dezert":           52,
    "hills":            118,
    "forest":           62,
    "ice land":          60,
    "mountains":        240,
}
ELEV_SIGMAS = {
    "ocean":            15,
    "rivers and lakes": 12,
    "swamp":            12,
    "prairie":          40,
    "Dezert":           80,
    "hills":            25,
    "forest":           35,
    "ice land":         80,
    "mountains":         5,
}

# ── Hypsometric color gradient (elevation 0–255 → RGB) ───────────────────────
# Tuned to match elevation_map.jpg: muted olive-greens, dark forests,
# grey rock mountains, minimal brightness overall.
HYPSO_STOPS = [
    (  0, np.array([  9,  38,  82], dtype=np.float32)),   # deep ocean
    (  8, np.array([ 18,  58, 118], dtype=np.float32)),   # shallow sea
    ( 20, np.array([ 42,  62,  30], dtype=np.float32)),   # swamp/lowland
    ( 50, np.array([ 72, 100,  38], dtype=np.float32)),   # low grassland
    ( 60, np.array([ 68,  96,  36], dtype=np.float32)),   # prairie / open land
    ( 75, np.array([ 82, 102,  40], dtype=np.float32)),   # mixed open terrain
    (100, np.array([ 86,  96,  46], dtype=np.float32)),   # hill base (olive)
    (130, np.array([ 94,  90,  76], dtype=np.float32)),   # mountain footing
    (175, np.array([110, 106,  98], dtype=np.float32)),   # mountain rock
    (205, np.array([148, 144, 136], dtype=np.float32)),   # high mountain
    (225, np.array([196, 194, 190], dtype=np.float32)),   # near-snow
    (255, np.array([244, 246, 250], dtype=np.float32)),   # permanent snow
]

# ── Per-zone target colors + blend strength ──────────────────────────────────
# The result blends FROM the hypsometric base TOWARD this target color.
# Strength controls how much the hypsometric base is overridden (0=none, 1=full).
# High strength for zones that should look distinctly different (ocean, desert, ice).
# Low strength for zones that mainly modify the base (hills, mountains).
ZONE_TARGETS = {
    "ocean":            (np.array([  9,  38,  82], dtype=np.float32), 0.95),
    "rivers and lakes": (np.array([ 40,  75, 148], dtype=np.float32), 0.82),
    "swamp":            (np.array([ 46,  58,  30], dtype=np.float32), 0.68),
    "prairie":          (np.array([ 80, 106,  40], dtype=np.float32), 0.42),
    "Dezert":           (np.array([188, 154,  82], dtype=np.float32), 0.88),  # sandy tan
    "hills":            (np.array([ 96, 106,  44], dtype=np.float32), 0.38),
    "forest":           (np.array([ 30,  62,  18], dtype=np.float32), 0.78),  # dark green
    "ice land":         (np.array([216, 222, 234], dtype=np.float32), 0.92),
    "mountains":        (np.array([100,  96,  88], dtype=np.float32), 0.22),  # subtle: keep hypso
}

# ── Special colors ────────────────────────────────────────────────────────────
SNOW_COLOR     = np.array([238, 240, 246], dtype=np.float32)
BEACH_COLOR    = np.array([198, 175, 118], dtype=np.float32)
FOOTHILL_COLOR = np.array([130, 118,  64], dtype=np.float32)

# ── Hillshade ─────────────────────────────────────────────────────────────────
AZIMUTH    = 315
ALTITUDE   = 45
Z_FACTOR   = 2.5
SHADE_MIN  = 0.18
SHADE_MAX  = 1.45

# ── Snow / beach / foothills ──────────────────────────────────────────────────
SNOW_THRESHOLD  = 0.56
SNOW_MAX_ALPHA  = 0.90
BEACH_WIDTH     = 16
BEACH_SEGMENT   = 180
BEACH_PROB      = 0.42
BEACH_SEED      = 17
FOOTHILL_ITERS  = 55    # binary_dilation iterations (~55 px band)

# ── Parchment texture modulation ──────────────────────────────────────────────
PARCH_BROAD_SIGMA    = 25
PARCH_FINE_SIGMA     = 5
PARCH_BROAD_ELEV     = 0.15   # elevation modulation (drives hillshade variation)
PARCH_FINE_ELEV      = 0.38
PARCH_COLOR_FINE     = 0.06   # direct color modulation (subtle hatch texture)

# ── fBm noise per zone ────────────────────────────────────────────────────────
ZONE_NOISE_PARAMS = {
    "ocean":            dict(scale=600, octaves=4, strength=0.04),
    "rivers and lakes": dict(scale=80,  octaves=4, strength=0.06),
    "swamp":            dict(scale=100, octaves=5, strength=0.14),
    "prairie":          dict(scale=280, octaves=5, strength=0.12),
    "Dezert":           dict(scale=220, octaves=5, strength=0.11),
    "hills":            dict(scale=140, octaves=5, strength=0.16),
    "forest":           dict(scale=70,  octaves=6, strength=0.20),
    "ice land":         dict(scale=400, octaves=4, strength=0.07),
    "mountains":        dict(scale=90,  octaves=6, strength=0.24),
}


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def blur_mask(alpha, sigma, H, W):
    if sigma <= 0:
        return alpha
    if sigma > 20:
        s = 4
        b = gaussian_filter(alpha[::s, ::s].astype(np.float32), sigma / s)
        return nd_zoom(b, s, order=1)[:H, :W].clip(0, 1)
    return gaussian_filter(alpha.astype(np.float32), sigma).clip(0, 1)


def mountain_peaked_mask(mtn_mask):
    """Distance-transform: per-component normalised cone profile."""
    H, W    = mtn_mask.shape
    binary  = (mtn_mask > 0.3).astype(np.uint8)
    dist    = distance_transform_edt(binary).astype(np.float32)
    lbd, n  = sp_label(binary)
    peaked  = np.zeros_like(dist)
    for i in range(1, n + 1):
        comp  = lbd == i
        max_d = dist[comp].max()
        if max_d > 0:
            peaked[comp] = (dist[comp] / max_d) ** 0.75
    return gaussian_filter(peaked, sigma=2).clip(0, 1)


def hypso_lookup(elev_arr):
    """Vectorised hypsometric color lookup from HYPSO_STOPS."""
    H, W    = elev_arr.shape
    result  = np.zeros((H, W, 3), dtype=np.float32)
    stops   = HYPSO_STOPS
    for i in range(len(stops) - 1):
        e0, c0 = stops[i]
        e1, c1 = stops[i + 1]
        t = ((elev_arr - e0) / (e1 - e0)).clip(0, 1)
        mask = (elev_arr >= e0) & (elev_arr < e1)
        for ch in range(3):
            result[:, :, ch] += mask * (c0[ch] + t * (c1[ch] - c0[ch]))
    # Above last stop: use final color
    above = elev_arr >= stops[-1][0]
    for ch in range(3):
        result[:, :, ch] += above * stops[-1][1][ch]
    return result


def make_fbm(H, W, scale, octaves=5, seed=0):
    """Fractional Brownian motion via multi-scale Gaussian-filtered noise."""
    rng    = np.random.default_rng(seed)
    out    = np.zeros((H, W), dtype=np.float32)
    amp    = 1.0
    total  = 0.0
    for k in range(octaves):
        sigma = max(scale / (2 ** k), 0.5)
        noise = rng.standard_normal((H, W)).astype(np.float32)
        out  += amp * gaussian_filter(noise, sigma=sigma)
        total += amp
        amp  *= 0.5
    out /= total
    std = out.std()
    return (out / std) if std > 0 else out


# ─────────────────────────────────────────────────────────────────────────────
# PSD loading
# ─────────────────────────────────────────────────────────────────────────────

def load_psd():
    print(f"  Opening {PSD_PATH} …")
    psd = PSDImage.open(str(PSD_PATH))
    background = None
    masks = {}
    for layer in psd:
        bbox    = layer.bbox
        cropped = layer.composite()
        full    = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
        full.paste(cropped, (bbox[0], bbox[1]))
        arr = np.array(full)
        if layer.name == "Background":
            background = arr[:, :, :3].astype(np.float32)
        else:
            alpha = arr[:, :, 3].astype(np.float32) / 255.0
            masks[layer.name] = alpha
            cov = float((alpha > 0.05).sum()) / (CANVAS_W * CANVAS_H) * 100
            print(f"    {layer.name!r:25s} {cov:5.1f}%")
    if background is None:
        raise RuntimeError("No 'Background' layer in PSD")
    return background, masks


# ─────────────────────────────────────────────────────────────────────────────
# Elevation + hillshade
# ─────────────────────────────────────────────────────────────────────────────

def build_elevation(masks, background, H, W):
    mtn_raw    = masks.get("mountains", np.zeros((H, W)))
    mtn_peaked = mountain_peaked_mask(mtn_raw)

    weighted = np.zeros((H, W), dtype=np.float32)
    weight   = np.zeros((H, W), dtype=np.float32)
    for name, zone_val in ELEVATION_ZONES.items():
        if name not in masks:
            continue
        ba = mtn_peaked if name == "mountains" else blur_mask(masks[name], ELEV_SIGMAS[name], H, W)
        weighted += ba * zone_val
        weight   += ba

    elev = np.full((H, W), 50.0, dtype=np.float32)
    covered = weight > 0.02
    elev[covered] = weighted[covered] / weight[covered]

    # Parchment modulation: broad scale drives topographic variation,
    # fine scale adds mountain-symbol ridge detail
    bg_luma    = background.mean(axis=2)
    luma_broad = gaussian_filter(bg_luma, sigma=PARCH_BROAD_SIGMA)
    broad_norm = (luma_broad - luma_broad.mean()) / (luma_broad.std() + 1e-6)
    luma_fine  = gaussian_filter(bg_luma, sigma=PARCH_FINE_SIGMA)
    fine_norm  = (luma_fine  - luma_fine.mean())  / (luma_fine.std()  + 1e-6)

    ocean_ba = blur_mask(masks.get("ocean", np.zeros((H, W))), 15, H, W)
    land_w   = (1.0 - ocean_ba).clip(0, 1)
    elev += PARCH_BROAD_ELEV * broad_norm * elev * land_w
    elev += PARCH_FINE_ELEV  * fine_norm  * (ELEVATION_ZONES["mountains"] * 0.4) * mtn_peaked
    return elev.clip(0, 255), mtn_peaked


def compute_hillshade(elev):
    az     = np.radians(AZIMUTH - 90)
    alt    = np.radians(ALTITUDE)
    dy, dx = np.gradient(elev * Z_FACTOR)
    slope  = np.arctan(np.sqrt(dx ** 2 + dy ** 2))
    aspect = np.arctan2(-dy, dx)
    shade  = (np.sin(alt) * np.cos(slope)
              + np.cos(alt) * np.sin(slope) * np.cos(az - aspect))
    return shade.clip(0, 1).astype(np.float32)


# ─────────────────────────────────────────────────────────────────────────────
# Color image
# ─────────────────────────────────────────────────────────────────────────────

def build_color_image(masks, background, elev, shade, mtn_peaked):
    H, W = CANVAS_H, CANVAS_W
    rng  = np.random.default_rng(BEACH_SEED)

    brightness = (SHADE_MIN + (SHADE_MAX - SHADE_MIN) * shade)  # (H,W)

    # ── Hypsometric base color ────────────────────────────────────────────────
    print("  Hypsometric color base …", end=" ", flush=True)
    result = hypso_lookup(elev)  # (H, W, 3) float32
    print("done")

    # ── Per-zone color blending (blend from hypsometric base toward target) ─────
    print("  Applying zone color targets …")
    # Build combined coverage mask to detect uncovered border pixels
    total_coverage = np.zeros((H, W), dtype=np.float32)
    for name, (target, strength) in ZONE_TARGETS.items():
        if name not in masks:
            continue
        sigma    = ELEV_SIGMAS.get(name, 20)
        ba       = blur_mask(masks[name], sigma, H, W)
        total_coverage = np.maximum(total_coverage, ba)
        blend    = (ba * strength)[:, :, np.newaxis]
        result   = result * (1.0 - blend) + target * blend
    # Fill uncovered canvas border/edges with ocean color so tiles look clean
    uncovered = (total_coverage < 0.05)[:, :, np.newaxis]
    ocean_c   = ZONE_TARGETS["ocean"][0]
    result    = np.where(uncovered, ocean_c, result)
    result    = result.clip(0, 255)
    print("  done")

    # ── fBm noise texture per zone ────────────────────────────────────────────
    print("  Building zone noise textures …")
    for seed_i, (name, params) in enumerate(ZONE_NOISE_PARAMS.items()):
        if name not in masks:
            continue
        noise = make_fbm(H, W, params["scale"], params["octaves"], seed=200 + seed_i)
        sigma = ELEV_SIGMAS.get(name, 20)
        ba    = blur_mask(masks[name], sigma, H, W)
        ns    = params["strength"]
        # Apply noise as a color modulation proportional to local color
        noise_mod = (ba * noise * ns)[:, :, np.newaxis]
        result    = result + result * noise_mod
    print("  done")

    # ── Apply hillshade ───────────────────────────────────────────────────────
    print("  Applying hillshade …", end=" ", flush=True)
    result = result * brightness[:, :, np.newaxis]
    print("done")

    # ── Parchment fine-detail color tint (land only — avoids ocean border bleed) ─
    print("  Parchment micro-detail …", end=" ", flush=True)
    bg_luma    = background.mean(axis=2)
    luma_fine  = gaussian_filter(bg_luma, sigma=PARCH_FINE_SIGMA)
    fine_norm  = (luma_fine - luma_fine.mean()) / (luma_fine.std() + 1e-6)
    ocean_ba2  = blur_mask(masks.get("ocean", np.zeros((H, W))), 15, H, W)
    land_w2    = (1.0 - ocean_ba2).clip(0, 1)[:, :, np.newaxis]
    result     = result + result * (PARCH_COLOR_FINE * fine_norm * land_w2[:,:,0])[:, :, np.newaxis]
    print("done")

    # ── Foothills transition band ─────────────────────────────────────────────
    print("  Foothills …", end=" ", flush=True)
    mtn_raw = masks.get("mountains", np.zeros((H, W)))
    mtn_bin = (mtn_raw > 0.3).astype(np.uint8)
    fh_dil  = binary_dilation(mtn_bin, iterations=FOOTHILL_ITERS).astype(np.float32)
    fh_mask = gaussian_filter((fh_dil - mtn_bin.astype(np.float32)).clip(0, 1), sigma=18)
    fh_lit  = FOOTHILL_COLOR * brightness[:, :, np.newaxis]
    result  = result * (1.0 - fh_mask[:, :, np.newaxis]) + fh_lit * fh_mask[:, :, np.newaxis]
    print("done")

    # ── Snow caps ─────────────────────────────────────────────────────────────
    print("  Snow caps …", end=" ", flush=True)
    snow_a = ((mtn_peaked - SNOW_THRESHOLD) / (1.0 - SNOW_THRESHOLD)).clip(0, 1) * SNOW_MAX_ALPHA
    result = result * (1.0 - snow_a[:, :, np.newaxis]) + SNOW_COLOR * snow_a[:, :, np.newaxis]
    print("done")

    # ── Beaches ───────────────────────────────────────────────────────────────
    print("  Beaches …", end=" ", flush=True)
    ocean_bin  = (masks.get("ocean", np.zeros((H, W))) > 0.4).astype(np.uint8)
    struct     = np.ones((BEACH_WIDTH * 2 + 1, BEACH_WIDTH * 2 + 1), dtype=np.uint8)
    dil        = binary_dilation(ocean_bin, structure=struct)
    coast_band = (dil.astype(np.float32) - ocean_bin.astype(np.float32)).clip(0, 1)
    cols       = math.ceil(W / BEACH_SEGMENT)
    rows_      = math.ceil(H / BEACH_SEGMENT)
    beach_grid = rng.random((rows_, cols)) < BEACH_PROB
    grid_img   = Image.fromarray((beach_grid * 255).astype(np.uint8))
    beach_on   = np.array(grid_img.resize((W, H), Image.NEAREST)).astype(np.float32) / 255.0
    beach_mask = gaussian_filter(coast_band * beach_on, sigma=4)
    result     = result * (1.0 - beach_mask[:, :, np.newaxis]) + BEACH_COLOR * beach_mask[:, :, np.newaxis]
    print("done")

    return result.clip(0, 255).astype(np.uint8)


# ─────────────────────────────────────────────────────────────────────────────
# Tiling
# ─────────────────────────────────────────────────────────────────────────────

def slice_to_tiles(img, zoom_level, dst_dir):
    w, h  = img.size
    count = 0
    for x in range(math.ceil(w / TILE_SIZE)):
        for y in range(math.ceil(h / TILE_SIZE)):
            x1, y1 = x * TILE_SIZE, y * TILE_SIZE
            x2, y2 = min(x1 + TILE_SIZE, w), min(y1 + TILE_SIZE, h)
            tile = img.crop((x1, y1, x2, y2))
            if tile.size != (TILE_SIZE, TILE_SIZE):
                padded = Image.new("RGB", (TILE_SIZE, TILE_SIZE))
                padded.paste(tile)
                tile = padded
            path = dst_dir / str(zoom_level) / str(x) / f"{y}.jpg"
            path.parent.mkdir(parents=True, exist_ok=True)
            tile.save(str(path), "JPEG", quality=95)
            count += 1
    return count


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

def main():
    print("=" * 58)
    print("Middle-earth Satellite Terrain Generator (Procedural)")
    print(f"  Canvas : {CANVAS_W}×{CANVAS_H}")
    print(f"  Style  : {STYLE_REF}")
    print(f"  Source : {PSD_PATH}")
    print("=" * 58)

    H, W = CANVAS_H, CANVAS_W

    print("\n[1/5] Loading PSD …")
    background, masks = load_psd()

    print("\n[2/5] Building elevation raster …")
    elev, mtn_peaked = build_elevation(masks, background, H, W)
    print(f"  Range: {elev.min():.0f}–{elev.max():.0f}")

    print("\n[3/5] Computing hillshade …")
    shade = compute_hillshade(elev)
    print(f"  Range: {shade.min():.3f}–{shade.max():.3f}")

    print("\n[4/5] Building satellite color image …")
    color_arr = build_color_image(masks, background, elev, shade, mtn_peaked)
    sat_img   = Image.fromarray(color_arr)

    print("  Unsharp sharpening pass …", end=" ", flush=True)
    sat_img = sat_img.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=1))
    print("done")

    sat_img.save("_sat_terrain.jpg", quality=96)
    print(f"  Saved _sat_terrain.jpg  ({W}×{H})")

    print("\n[5/5] Slicing tile pyramid …")
    if DST_TILES.exists():
        shutil.rmtree(DST_TILES)
    w, h = sat_img.size
    n  = slice_to_tiles(sat_img, 2, DST_TILES)
    n += slice_to_tiles(sat_img.resize((w // 2, h // 2), Image.LANCZOS), 1, DST_TILES)
    n += slice_to_tiles(sat_img.resize((w // 4, h // 4), Image.LANCZOS), 0, DST_TILES)
    print(f"\nDone — {n} tiles written to {DST_TILES}/")
    print("Open _sat_terrain.jpg to verify style. Adjust HYPSO_STOPS or")
    print("ZONE_COLOR_SHIFT constants to tune colors before deploying.")


if __name__ == "__main__":
    main()
