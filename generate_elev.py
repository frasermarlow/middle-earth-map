#!/usr/bin/env python3
"""
generate_elev.py — Standalone hillshade generator.

Iterates quickly (no SD) so parameters can be tuned before feeding the result
into the satellite pipeline.

Outputs:
  _elev_dem.jpg        — raw elevation raster (greyscale)
  _elev_hillshade.jpg  — final shaded relief map (greyscale, full resolution)

Key design choices for sharp mountain peaks:
  • Mountain mask blurred minimally (σ=5) so range boundaries stay crisp.
  • TWO parchment blur scales:
      - Broad (σ=25): smooth topographic variation everywhere.
      - Fine  (σ=6):  preserves individual mountain-symbol hatching, blended
                      in strongly within mountain zones → individual peak shapes.
  • High z_factor (2.5) for steep virtual slopes → strong shadow contrast.
  • Unsharp-mask post-pass on the elevation raster emphasises ridgelines.
  • Saved at full 7680×4320 at JPEG quality 97.
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from psd_tools import PSDImage

PSD_PATH   = Path("middle-earth-masks.psd")
CANVAS_W, CANVAS_H = 7680, 4608

# ── Elevation zones ───────────────────────────────────────────────────────────
ELEVATION_ZONES = {
    "ocean":            4,
    "rivers and lakes": 48,
    "swamp":            16,
    "prairie":          55,
    "Dezert":           52,
    "hills":            118,
    "forest":           62,
    "ice land":          60,
    "mountains":        240,    # pushed to near-maximum for dramatic peaks
}
DEFAULT_ELEV = 50

# Blur sigmas for elevation mask blending.
# Mountains intentionally tight — range boundaries should be crisp edges.
ELEV_BLEND_SIGMAS = {
    "ocean":            15,
    "rivers and lakes": 12,
    "swamp":            12,
    "prairie":          40,
    "Dezert":           80,
    "hills":            25,
    "forest":           35,
    "ice land":         80,
    "mountains":         5,     # ← reduced: crisp mountain edges
}

# Parchment modulation strengths
BROAD_SIGMA    = 25    # removes text, keeps broad topographic shading
FINE_SIGMA     =  6   # keeps mountain-symbol hatching for individual peak shapes
BROAD_STRENGTH = 0.18  # used everywhere
FINE_STRENGTH  = 0.55  # used only in mountain zones (adds sharp peak detail)

# Hillshade
AZIMUTH    = 315
ALTITUDE   = 45
Z_FACTOR   = 2.5      # ← raised: steeper virtual slopes, more dramatic shadows
SHADE_MIN  = 0.10     # deep shadow faces (darker than before)
SHADE_MAX  = 1.20     # bright lit faces

# Post-processing
UNSHARP_RADIUS  = 8    # unsharp-mask radius on elevation (pixels)
UNSHARP_PERCENT = 180  # strength (%)


def load_psd(psd_path):
    print(f"Opening {psd_path} …")
    psd = PSDImage.open(str(psd_path))
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
            masks[layer.name] = arr[:, :, 3].astype(np.float32) / 255.0
    print(f"  {len(masks)} mask layers loaded")
    return background, masks


def blur_mask(alpha, sigma, H, W):
    from scipy.ndimage import gaussian_filter, zoom as nd_zoom
    if sigma <= 0:
        return alpha
    if sigma > 20:
        s = 4
        b = gaussian_filter(alpha[::s, ::s].astype(np.float32), sigma / s)
        return nd_zoom(b, s, order=1)[:H, :W].clip(0, 1)
    return gaussian_filter(alpha, sigma).clip(0, 1)


def mountain_peaked_mask(raw_mask, H, W):
    """Distance-transform mountain mask so elevation peaks at each summit center
    and tapers naturally toward range edges — isolated peaks become cones,
    ranges become ridges, rather than flat-topped plateaus."""
    from scipy.ndimage import distance_transform_edt, label, gaussian_filter

    binary = (raw_mask > 0.3).astype(np.uint8)
    dist   = distance_transform_edt(binary).astype(np.float32)

    # Normalise per connected component so a tiny isolated peak (Lonely Mountain,
    # Mount Doom) gets the same 0→1 range as a long range (Misty Mountains).
    labeled, n = label(binary)
    peaked = np.zeros_like(dist)
    for i in range(1, n + 1):
        comp = labeled == i
        max_d = dist[comp].max()
        if max_d > 0:
            # Power < 1 → concave profile (rises fast, pointed summit)
            peaked[comp] = (dist[comp] / max_d) ** 0.75
    return gaussian_filter(peaked, sigma=2).clip(0, 1)


def build_elevation(background, masks):
    from scipy.ndimage import gaussian_filter

    H, W = CANVAS_H, CANVAS_W

    # ── Pre-compute peaked mountain profile ───────────────────────────────────
    print("  Building peaked mountain profile …", end=" ", flush=True)
    mtn_raw    = masks.get("mountains", np.zeros((H, W)))
    mtn_peaked = mountain_peaked_mask(mtn_raw, H, W)
    print("done")

    # ── Zone blending ─────────────────────────────────────────────────────────
    weighted = np.zeros((H, W), dtype=np.float32)
    weight   = np.zeros((H, W), dtype=np.float32)
    for name, zone_val in ELEVATION_ZONES.items():
        if name not in masks:
            continue
        if name == "mountains":
            # Use peaked profile: summit = zone_val, edges taper to 0
            ba = mtn_peaked
        else:
            sigma = ELEV_BLEND_SIGMAS.get(name, 20)
            ba = blur_mask(masks[name], sigma, H, W)
        weighted += ba * zone_val
        weight   += ba

    elevation = np.full((H, W), DEFAULT_ELEV, dtype=np.float32)
    covered = weight > 0.02
    elevation[covered] = weighted[covered] / weight[covered]

    # ── Parchment modulation ──────────────────────────────────────────────────
    bg_luma = background.mean(axis=2)

    # Broad scale: smooth topographic variation for all terrain
    print("  Blurring parchment broad (σ={}) …".format(BROAD_SIGMA), end=" ", flush=True)
    luma_broad = gaussian_filter(bg_luma, sigma=BROAD_SIGMA)
    broad_norm = (luma_broad - luma_broad.mean()) / (luma_broad.std() + 1e-6)
    print("done")

    # Fine scale: preserves hatching symbols → individual peak shapes
    print("  Blurring parchment fine  (σ={}) …".format(FINE_SIGMA), end=" ", flush=True)
    luma_fine = gaussian_filter(bg_luma, sigma=FINE_SIGMA)
    fine_norm = (luma_fine - luma_fine.mean()) / (luma_fine.std() + 1e-6)
    print("done")

    # Ocean stays flat (no parchment modulation over water)
    ocean_ba = blur_mask(masks.get("ocean", np.zeros((H, W))), 15, H, W)
    land_w   = (1.0 - ocean_ba).clip(0, 1)

    # Broad modulation everywhere on land
    elevation += BROAD_STRENGTH * broad_norm * elevation * land_w

    # Fine modulation in mountain zones only
    elevation += FINE_STRENGTH * fine_norm * (ELEVATION_ZONES["mountains"] * 0.4) * mtn_peaked

    elevation = elevation.clip(0, 255)

    # ── Unsharp-mask to sharpen ridgelines ────────────────────────────────────
    print("  Applying unsharp mask to elevation …", end=" ", flush=True)
    elev_img    = Image.fromarray(elevation.astype(np.uint8))
    elev_sharp  = elev_img.filter(
        ImageFilter.UnsharpMask(radius=UNSHARP_RADIUS, percent=UNSHARP_PERCENT, threshold=1)
    )
    elev_sharp_arr = np.array(elev_sharp).astype(np.float32)
    # Blend sharpening — apply fully in mountain zones, partially elsewhere
    sharp_blend = (0.4 + 0.6 * mtn_peaked).clip(0, 1)
    elevation   = elevation * (1 - sharp_blend) + elev_sharp_arr * sharp_blend
    elevation   = elevation.clip(0, 255)
    print("done")

    return elevation


def hillshade(elevation):
    az  = np.radians(AZIMUTH - 90)
    alt = np.radians(ALTITUDE)
    dy, dx = np.gradient(elevation * Z_FACTOR)
    slope  = np.arctan(np.sqrt(dx**2 + dy**2))
    aspect = np.arctan2(-dy, dx)
    shade  = (np.sin(alt) * np.cos(slope) +
              np.cos(alt) * np.sin(slope) * np.cos(az - aspect))
    return shade.clip(0, 1).astype(np.float32)


def main():
    print("=" * 50)
    print("Middle-earth Elevation / Hillshade Generator")
    print(f"  z_factor={Z_FACTOR}  az={AZIMUTH}°  alt={ALTITUDE}°")
    print(f"  fine σ={FINE_SIGMA}  broad σ={BROAD_SIGMA}")
    print("=" * 50)

    background, masks = load_psd(PSD_PATH)

    print("\nBuilding elevation raster …")
    elevation = build_elevation(background, masks)
    print(f"  Range: {elevation.min():.0f}–{elevation.max():.0f}")

    dem_img = Image.fromarray(elevation.astype(np.uint8))
    dem_img.save("_elev_dem.jpg", quality=97)
    print("  Saved _elev_dem.jpg")

    print("\nComputing hillshade …")
    shade = hillshade(elevation)
    shade_mapped = SHADE_MIN + (SHADE_MAX - SHADE_MIN) * shade
    shade_vis = (shade_mapped.clip(0, 1) * 255).astype(np.uint8)

    hs_img = Image.fromarray(shade_vis)
    hs_img.save("_elev_hillshade.jpg", quality=97)
    print(f"  Shade range: {shade.min():.3f}–{shade.max():.3f}")
    print("  Saved _elev_hillshade.jpg  ({0}×{1})".format(*hs_img.size))


if __name__ == "__main__":
    main()
