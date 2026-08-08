#!/usr/bin/env python3
"""
generate_sat_masked.py  v7  — sharp hillshade SD base + settlement-aware prompts

Pipeline
────────
1.  Load pre-computed hillshade from _elev_hillshade.jpg (built by generate_elev.py)
      - Falls back to inline computation if file missing
2.  Composite: terrain_palette_colour × hillshade_brightness
3.  Save _sat_source.jpg
4.  SD img2img (DPMSolverMultistep, 50 steps) with:
      - Per-patch terrain prompts
      - Settlement location descriptors injected when patch overlaps a known site
      - Per-patch unsharp mask post-process for crispness
5.  Blend patches (96px overlap feathering)
6.  Final unsharp-mask pass on assembled image
7.  Slice to tile pyramid

Flags:  --no-sd   build all intermediates and write colour base as tiles (fast).
"""

import math
import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from psd_tools import PSDImage

# ── Paths ─────────────────────────────────────────────────────────────────────
PSD_PATH        = Path("middle-earth-masks.psd")
HILLSHADE_CACHE = Path("_elev_hillshade.jpg")
DST_TILES       = Path("tiles-sat")
CANVAS_W, CANVAS_H = 7680, 4608
TILE_SIZE  = 256
PATCH_SIZE = 512
OVERLAP    = 96

# ── Terrain colour palette ─────────────────────────────────────────────────────
TERRAIN_PALETTE = {
    "ocean":            np.array([ 15,  50, 105], dtype=np.float32),
    "rivers and lakes": np.array([ 55, 130, 190], dtype=np.float32),
    "swamp":            np.array([ 38,  55,  28], dtype=np.float32),  # darker, murkier
    "forest":           np.array([ 18,  68,  12], dtype=np.float32),  # richer green
    "hills":            np.array([108,  96,  62], dtype=np.float32),
    "mountains":        np.array([110, 105,  98], dtype=np.float32),
    "ice land":         np.array([210, 225, 238], dtype=np.float32),
    "Dezert":           np.array([196, 154,  68], dtype=np.float32),
    "prairie":          np.array([138, 152,  78], dtype=np.float32),
    "buildings":        np.array([160, 140, 100], dtype=np.float32),
    "bridges":          np.array([140, 120,  90], dtype=np.float32),
}
BEACH_COLOR  = np.array([210, 190, 135], dtype=np.float32)   # sandy tan
SNOW_COLOR   = np.array([235, 238, 242], dtype=np.float32)   # blue-white snow
FOOTHILL_COLOR = np.array([122, 108,  72], dtype=np.float32) # dry grassy foothills
EDGE_COLOR   = np.array([10, 8, 6], dtype=np.float32)
DEFAULT_LAND = np.array([130, 145, 72], dtype=np.float32)

# Beach generation: fraction of coastline that becomes sandy beach
BEACH_SEGMENT_LENGTH = 180   # pixels per random segment decision
BEACH_PROBABILITY    = 0.42  # ~42% of coast becomes beach
BEACH_WIDTH          = 14    # pixel width of beach strip (land side of coast)
BEACH_RNG_SEED       = 17

# Snow: applied to mountain pixels above this peaked-profile threshold
SNOW_THRESHOLD = 0.60   # top 40% of each mountain cluster gets snow blend
SNOW_MAX_ALPHA = 0.85   # maximum snow coverage at absolute peak

# ── Hillshade parameters (used only if cache file missing) ────────────────────
HILLSHADE_AZIMUTH  = 315
HILLSHADE_ALTITUDE = 45
HILLSHADE_Z_FACTOR = 2.5
HILLSHADE_MIN      = 0.10
HILLSHADE_MAX      = 1.20

# ── Colour blend sigmas ───────────────────────────────────────────────────────
COLOUR_BLEND_SIGMAS = {
    "ice land":         40,
    "Dezert":           40,
    "prairie":          20,
    "mountains":         8,
    "hills":            15,
    "forest":            8,
    "swamp":            12,
    "ocean":            10,
    "rivers and lakes":  3,
    "buildings":         6,
    "bridges":           4,
}
COLOUR_APPLY_ORDER = [
    "prairie", "hills", "swamp", "forest",
    "mountains", "ice land", "Dezert",
    "buildings", "bridges",
    "rivers and lakes",
]

# ── Known settlements (px, py in 7680×4608 canvas coords) ────────────────────
# Injected into SD prompt when a patch overlaps the location.
SETTLEMENTS = [
    (2746, 1115,  "small hobbit village with round doors, rural green countryside, Hobbiton"),
    (2772, 1258,  "rolling green hills, small rural village, The Shire"),
    (3254, 1139,  "small walled medieval town at crossroads, Bree"),
    (2266, 1150,  "elven harbor with tall ships, stone quays at river mouth, Grey Havens"),
    (2765,  919,  "ancient ruined city on lakeshore, crumbling stone walls, Annuminas"),
    (3940, 1096,  "hidden valley with elven buildings nestled in steep gorge, Rivendell"),
    (4190, 1640,  "ancient forest city of tall trees with platforms and bridges, Lothlorien"),
    (3775, 2039,  "circular walled compound with dark spike tower at center, Isengard"),
    (3760, 2277,  "fortress carved into cliff face with long stone dam and causeway, Helm's Deep"),
    (3969, 2344,  "small fortified hill-top town with golden thatched hall, Edoras"),
    (4720, 2641,  "tiered white stone city built into mountainside, concentric walls, Minas Tirith"),
    (4856, 2658,  "ruined bridge city spanning wide river, broken arches, Osgiliath"),
    (5033, 2660,  "ghostly pale fortress glowing faintly in narrow mountain pass, Minas Morgul"),
    (5613, 2466,  "massive dark iron fortress on barren volcanic plain, Barad-dur"),
    (4672, 1578,  "dark ruined fortress on forested hilltop, Dol Guldur"),
    (4508, 3010,  "large port city at wide river mouth with wharves and walls, Pelargir"),
    (3702, 2892,  "coastal city on rocky promontory with tall white tower, Dol Amroth"),
    (4204, 3995,  "walled harbor city on southern coast, Umbar"),
    (3374,  357,  "dark ruined fortress in northern mountains, Carn Dum"),
    (3111,  866,  "ruined walled city on hilltop, collapsed towers, Fornost"),
]
SETTLEMENT_RADIUS = 350   # pixels — patch must come within this to trigger

# ── SD settings ───────────────────────────────────────────────────────────────
BASE_PROMPT = (
    "high resolution satellite photograph from orbit, "
    "realistic earth observation imagery, nadir view, "
    "photorealistic, ultra sharp crisp terrain detail, fine surface texture, "
    "8k resolution detail, highly detailed natural terrain, "
    "no text, no labels, no map markings"
)
NEGATIVE_PROMPT = (
    "blurry, out of focus, haze, fog, clouds, soft focus, bokeh, "
    "low resolution, pixelated, oversmoothed, dreamy, misty, atmospheric haze, "
    "smooth gradients, featureless, flat texture, uniform color, "
    "illustration, drawing, painting, sketch, cartoon, anime, "
    "text, labels, words, letters, map, compass, legend, border, "
    "parchment, artistic, stylized, watercolor, fantasy art, "
    "agricultural fields, farmland, crop rows, rectangular farm patterns, "
    "industrial farming, monoculture crops, modern roads, highways, "
    "urban sprawl, modern city, suburbs, parking lots, "
    "white lines, bright lines, road markings, radial pattern, "
    "oversized river, wide river, thick river"
)
TERRAIN_DESCRIPTORS = {
    "ocean":            "deep open ocean, dark blue seawater, gentle wave texture visible from orbit",
    "rivers and lakes": "narrow winding river proportional to landscape, small clear reflective lakes, thin blue waterway",
    "swamp":            "murky dark marshland, standing brown pools between reeds, bog and fen, muddy wetland, distinctly different from forest",
    "forest":           "dense dark green forest canopy from above, individual tree crowns visible, ancient woodland, clearly distinct from swamp",
    "hills":            "rolling foothills transitioning from mountains to plains, grassy slopes, gently undulating terrain, scattered rocks",
    "mountains":        "craggy rocky mountain range, dramatic peaks, snow-capped summits, permanent snowfields on high ridges, steep cliff faces, deep shadowed valleys, sharp alpine ridgelines, talus slopes",
    "ice land":         "arctic tundra, vast snowfields, frozen landscape, permafrost, icy terrain",
    "Dezert":           "sandy desert, golden sand dunes, arid cracked earth, dry barren wasteland, scattered rock outcrops",
    "prairie":          "open grassland, mixed grass and low scrub, rolling plains, natural meadow",
    "buildings":        None,
    "bridges":          None,
}
DEFAULT_DESCRIPTOR = "mixed temperate terrain, open natural landscape"
TERRAIN_THRESHOLD  = 0.04
EDGE_THRESHOLD     = 0.70

DENOISE_STRENGTH = 0.67
GUIDANCE_SCALE   = 10.0
NUM_STEPS        = 50
SEED             = 42
DEVICE           = "mps"

DENOISE_OVERRIDES = {
    "ocean":     0.30,
    "mountains": 0.72,
    "ice land":  0.55,
}

# Post-process sharpening applied to each SD output patch
PATCH_UNSHARP_RADIUS  = 1
PATCH_UNSHARP_PERCENT = 120

# Final assembled-image sharpening before tiling
FINAL_UNSHARP_RADIUS  = 2
FINAL_UNSHARP_PERCENT = 140

SKIP_SD         = "--no-sd" in sys.argv
PREVIEW_PATCHES = 20


# ── PSD extraction ────────────────────────────────────────────────────────────

def extract_psd_layers(psd_path):
    print(f"  Opening {psd_path} …")
    psd = PSDImage.open(str(psd_path))
    print(f"  Canvas: {psd.width}x{psd.height}, {len(list(psd))} layers")
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
            continue
        alpha = arr[:, :, 3].astype(np.float32) / 255.0
        masks[layer.name] = alpha
        cov = float((alpha > 0.05).sum()) / (CANVAS_W * CANVAS_H) * 100
        print(f"  {layer.name!r:22s}  {cov:5.1f}%")
    if background is None:
        raise RuntimeError("No 'Background' layer in PSD")
    return background, masks


# ── Hillshade ─────────────────────────────────────────────────────────────────

def load_or_compute_hillshade(masks, background):
    """Load pre-computed hillshade from generate_elev.py, or compute inline."""
    if HILLSHADE_CACHE.exists():
        print(f"  Loading pre-computed hillshade from {HILLSHADE_CACHE} …")
        hs = Image.open(HILLSHADE_CACHE).convert("L")
        if hs.size != (CANVAS_W, CANVAS_H):
            print(f"  WARNING: hillshade is {hs.size}, resizing to {CANVAS_W}×{CANVAS_H}")
            hs = hs.resize((CANVAS_W, CANVAS_H), Image.LANCZOS)
        shade = np.array(hs).astype(np.float32) / 255.0
        print(f"  Shade range: {shade.min():.3f}–{shade.max():.3f}")
        return shade
    print("  _elev_hillshade.jpg not found — computing inline …")
    return _compute_hillshade_inline(masks, background)


def _compute_hillshade_inline(masks, background):
    from scipy.ndimage import gaussian_filter, zoom as nd_zoom, distance_transform_edt, label

    H, W = CANVAS_H, CANVAS_W

    def blur(alpha, sigma):
        if sigma <= 0:
            return alpha
        if sigma > 20:
            s = 4
            b = gaussian_filter(alpha[::s, ::s].astype(np.float32), sigma / s)
            return nd_zoom(b, s, order=1)[:H, :W].clip(0, 1)
        return gaussian_filter(alpha, sigma).clip(0, 1)

    ELEVATION_ZONES = {
        "ocean": 4, "rivers and lakes": 48, "swamp": 16,
        "prairie": 55, "Dezert": 52, "hills": 118,
        "forest": 62, "ice land": 60, "mountains": 240,
    }
    ELEV_SIGMAS = {
        "ocean": 15, "rivers and lakes": 12, "swamp": 12,
        "prairie": 40, "Dezert": 80, "hills": 25,
        "forest": 35, "ice land": 80, "mountains": 5,
    }

    mtn_raw    = masks.get("mountains", np.zeros((H, W)))
    mtn_binary = (mtn_raw > 0.3).astype(np.uint8)
    mtn_dist   = distance_transform_edt(mtn_binary).astype(np.float32)
    labeled, n = label(mtn_binary)
    mtn_peaked = np.zeros_like(mtn_dist)
    for i in range(1, n + 1):
        comp  = labeled == i
        max_d = mtn_dist[comp].max()
        if max_d > 0:
            mtn_peaked[comp] = (mtn_dist[comp] / max_d) ** 0.75
    mtn_peaked = gaussian_filter(mtn_peaked, sigma=2).clip(0, 1)

    weighted = np.zeros((H, W), dtype=np.float32)
    weight   = np.zeros((H, W), dtype=np.float32)
    for name, zone_val in ELEVATION_ZONES.items():
        if name not in masks:
            continue
        ba = mtn_peaked if name == "mountains" else blur(masks[name], ELEV_SIGMAS[name])
        weighted += ba * zone_val
        weight   += ba

    elevation = np.full((H, W), 50.0, dtype=np.float32)
    covered   = weight > 0.02
    elevation[covered] = weighted[covered] / weight[covered]

    bg_luma    = background.mean(axis=2)
    luma_broad = gaussian_filter(bg_luma, sigma=25)
    broad_norm = (luma_broad - luma_broad.mean()) / (luma_broad.std() + 1e-6)
    luma_fine  = gaussian_filter(bg_luma, sigma=6)
    fine_norm  = (luma_fine - luma_fine.mean()) / (luma_fine.std() + 1e-6)

    ocean_ba = blur(masks.get("ocean", np.zeros((H, W))), 15)
    land_w   = (1.0 - ocean_ba).clip(0, 1)
    elevation += 0.18 * broad_norm * elevation * land_w
    elevation += 0.55 * fine_norm * (ELEVATION_ZONES["mountains"] * 0.4) * mtn_peaked
    elevation  = elevation.clip(0, 255)

    az  = np.radians(HILLSHADE_AZIMUTH - 90)
    alt = np.radians(HILLSHADE_ALTITUDE)
    dy, dx = np.gradient(elevation * HILLSHADE_Z_FACTOR)
    slope  = np.arctan(np.sqrt(dx**2 + dy**2))
    aspect = np.arctan2(-dy, dx)
    shade  = (np.sin(alt) * np.cos(slope) +
              np.cos(alt) * np.sin(slope) * np.cos(az - aspect))
    return shade.clip(0, 1).astype(np.float32)


# ── Colour base ───────────────────────────────────────────────────────────────

def _mountain_peaked(mtn_mask, H, W):
    """Re-derive the per-component normalised distance profile for snow/foothills."""
    from scipy.ndimage import distance_transform_edt, label, gaussian_filter
    binary = (mtn_mask > 0.3).astype(np.uint8)
    dist   = distance_transform_edt(binary).astype(np.float32)
    labeled, n = label(binary)
    peaked = np.zeros_like(dist)
    for i in range(1, n + 1):
        comp  = labeled == i
        max_d = dist[comp].max()
        if max_d > 0:
            peaked[comp] = (dist[comp] / max_d) ** 0.75
    return gaussian_filter(peaked, sigma=2).clip(0, 1)


def _beach_mask(ocean_alpha, H, W, rng):
    """Thin randomised beach strip on the land side of coastlines."""
    from scipy.ndimage import binary_dilation, gaussian_filter
    ocean_bin  = (ocean_alpha > 0.4).astype(np.uint8)
    struct     = np.ones((BEACH_WIDTH * 2 + 1, BEACH_WIDTH * 2 + 1), dtype=np.uint8)
    dilated    = binary_dilation(ocean_bin, structure=struct)
    coast_band = (dilated.astype(np.float32) - ocean_bin).clip(0, 1)  # land-side strip

    # Segment the coastline and randomly enable/disable beach per segment
    cols       = math.ceil(W / BEACH_SEGMENT_LENGTH)
    rows       = math.ceil(H / BEACH_SEGMENT_LENGTH)
    beach_grid = rng.random((rows, cols)) < BEACH_PROBABILITY
    # Scale grid back to full resolution
    from PIL import Image as _PIL
    grid_img  = _PIL.fromarray((beach_grid * 255).astype(np.uint8))
    mask_img  = grid_img.resize((W, H), _PIL.NEAREST)
    beach_on  = np.array(mask_img).astype(np.float32) / 255.0

    beach = coast_band * beach_on
    return gaussian_filter(beach, sigma=3).clip(0, 1)


def _foothill_mask(mtn_mask, H, W):
    """A transition band just outside the mountain boundary → foothills colour."""
    from scipy.ndimage import binary_dilation, gaussian_filter
    binary    = (mtn_mask > 0.3).astype(np.uint8)
    expanded  = binary_dilation(binary, iterations=55).astype(np.float32)
    foothills = (expanded - binary.astype(np.float32)).clip(0, 1)
    return gaussian_filter(foothills, sigma=18).clip(0, 1)


def build_terrain_base(masks, shade):
    from scipy.ndimage import gaussian_filter, zoom as nd_zoom

    H, W = CANVAS_H, CANVAS_W
    rng  = np.random.default_rng(BEACH_RNG_SEED)

    def blur(alpha, sigma):
        if sigma <= 0:
            return alpha
        if sigma > 20:
            s = 4
            b = gaussian_filter(alpha[::s, ::s].astype(np.float32), sigma / s)
            return nd_zoom(b, s, order=1)[:H, :W].clip(0, 1)
        return gaussian_filter(alpha, sigma).clip(0, 1)

    brightness = (HILLSHADE_MIN + (HILLSHADE_MAX - HILLSHADE_MIN) * shade)[:, :, np.newaxis]
    result = (DEFAULT_LAND * brightness).clip(0, 255)

    # ── Foothills transition band around mountains ────────────────────────────
    mtn_raw = masks.get("mountains", np.zeros((H, W)))
    print("    Computing foothills band …", end=" ", flush=True)
    fh_mask = _foothill_mask(mtn_raw, H, W)[:, :, np.newaxis]
    result  = result * (1.0 - fh_mask) + (FOOTHILL_COLOR * brightness).clip(0, 255) * fh_mask
    print("done")

    # ── Standard terrain layers ───────────────────────────────────────────────
    for name in COLOUR_APPLY_ORDER:
        if name not in masks or name not in TERRAIN_PALETTE:
            continue
        sigma = COLOUR_BLEND_SIGMAS.get(name, 10)
        ba    = blur(masks[name], sigma)[:, :, np.newaxis]
        result = result * (1.0 - ba) + (TERRAIN_PALETTE[name] * brightness).clip(0, 255) * ba

    # ── Snow caps on mountain peaks ───────────────────────────────────────────
    print("    Computing snow caps …", end=" ", flush=True)
    peaked   = _mountain_peaked(mtn_raw, H, W)
    snow_alpha = ((peaked - SNOW_THRESHOLD) / (1.0 - SNOW_THRESHOLD)).clip(0, 1) * SNOW_MAX_ALPHA
    snow_alpha = snow_alpha[:, :, np.newaxis]
    result   = result * (1.0 - snow_alpha) + SNOW_COLOR * snow_alpha
    print("done")

    # ── Ocean ─────────────────────────────────────────────────────────────────
    if "ocean" in masks:
        ba = blur(masks["ocean"], COLOUR_BLEND_SIGMAS.get("ocean", 10))[:, :, np.newaxis]
        result = result * (1.0 - ba) + np.full((H, W, 3), TERRAIN_PALETTE["ocean"], dtype=np.float32) * ba

    # ── Beaches (applied after ocean so they sit on the land-sea boundary) ────
    print("    Computing beaches …", end=" ", flush=True)
    beach = _beach_mask(masks.get("ocean", np.zeros((H, W))), H, W, rng)[:, :, np.newaxis]
    result = result * (1.0 - beach) + BEACH_COLOR * beach
    print("done")

    if "edge" in masks:
        result = result * (1.0 - masks["edge"][:, :, np.newaxis]) + EDGE_COLOR * masks["edge"][:, :, np.newaxis]

    return Image.fromarray(result.clip(0, 255).astype(np.uint8))


# ── Per-patch prompt ──────────────────────────────────────────────────────────

def build_patch_prompt(px, py, masks):
    x2 = min(px + PATCH_SIZE, CANVAS_W)
    y2 = min(py + PATCH_SIZE, CANVAS_H)
    cx = px + PATCH_SIZE // 2
    cy = py + PATCH_SIZE // 2

    if "edge" in masks and float(masks["edge"][py:y2, px:x2].mean()) > EDGE_THRESHOLD:
        return BASE_PROMPT

    parts = []
    for name, alpha in masks.items():
        desc = TERRAIN_DESCRIPTORS.get(name)
        if not desc:
            continue
        if float(alpha[py:y2, px:x2].mean()) >= TERRAIN_THRESHOLD:
            parts.append((float(alpha[py:y2, px:x2].mean()), desc))
    parts.sort(reverse=True)

    # Inject settlement descriptors for nearby known locations
    for sx, sy, s_desc in SETTLEMENTS:
        dist = math.hypot(cx - sx, cy - sy)
        if dist < SETTLEMENT_RADIUS:
            parts.append((999.0, s_desc))  # high weight → listed first

    parts.sort(reverse=True)
    terrain_parts = [d for _, d in parts if _ < 900]  # exclude settlement entries for coverage check
    total_coverage = sum(cov for cov, _ in parts if cov < 900)

    # Low-coverage patches risk coming out blurry — inject generic detail anchor
    if total_coverage < 0.15:
        parts.append((0.01, "varied natural ground texture, rock and soil detail, sharp fine detail"))

    parts.sort(reverse=True)
    if parts:
        return BASE_PROMPT + ", " + ", ".join(d for _, d in parts)
    return BASE_PROMPT + ", " + DEFAULT_DESCRIPTOR


# ── Patch utilities ───────────────────────────────────────────────────────────

def slice_to_patches(img):
    w, h = img.size
    step = PATCH_SIZE - OVERLAP
    patches = []
    for y in range(0, h, step):
        for x in range(0, w, step):
            x2 = min(x + PATCH_SIZE, w);  x1 = x2 - PATCH_SIZE
            y2 = min(y + PATCH_SIZE, h);  y1 = y2 - PATCH_SIZE
            patches.append((x1, y1, img.crop((x1, y1, x2, y2))))
    return patches


def blend_patches(patches, full_w, full_h):
    result  = np.zeros((full_h, full_w, 3), dtype=np.float64)
    weights = np.zeros((full_h, full_w),    dtype=np.float64)
    feather = np.ones((PATCH_SIZE, PATCH_SIZE), dtype=np.float64)
    for i in range(OVERLAP):
        t = (i + 1) / OVERLAP
        feather[i, :] *= t;  feather[-(i+1), :] *= t
        feather[:, i] *= t;  feather[:, -(i+1)] *= t
    for x, y, patch_img in patches:
        arr = np.array(patch_img).astype(np.float64)
        h, w = arr.shape[:2]
        f = feather[:h, :w]
        result[y:y+h, x:x+w]  += arr * f[:, :, np.newaxis]
        weights[y:y+h, x:x+w] += f
    result /= np.maximum(weights, 1e-6)[:, :, np.newaxis]
    return Image.fromarray(result.clip(0, 255).astype(np.uint8))


def sharpen(img, radius, percent):
    return img.filter(ImageFilter.UnsharpMask(radius=radius, percent=percent, threshold=1))


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


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("Middle-earth Satellite Generator v7")
    print(f"  SD: denoise {DENOISE_STRENGTH} | guidance {GUIDANCE_SCALE} | steps {NUM_STEPS}")
    print(f"  Patch: {PATCH_SIZE}px, overlap {OVERLAP}px")
    print("  Mode:", "colour preview" if SKIP_SD else "full SD pipeline")
    print("=" * 60)

    print("\n[1/5] Extracting PSD layers …")
    background, masks = extract_psd_layers(PSD_PATH)

    print("\n[2/5] Loading hillshade …")
    shade = load_or_compute_hillshade(masks, background)

    print("\n[3/5] Building terrain colour base …")
    base_img = build_terrain_base(masks, shade)
    base_img.save("_sat_source.jpg", quality=95)
    print(f"  Saved _sat_source.jpg  ({base_img.size[0]}×{base_img.size[1]})")

    print("\n[4/5] Building per-patch prompts …")
    patches = slice_to_patches(base_img)
    patch_data = [
        (px, py, patch, build_patch_prompt(px, py, masks))
        for px, py, patch in patches
    ]
    print(f"  {len(patch_data)} patches  (overlap={OVERLAP}px)")

    # Count settlement-triggered patches
    n_settle = sum(
        1 for px, py, _, p in patch_data
        if any(s[2] in p for s in SETTLEMENTS)
    )
    print(f"  {n_settle} patches with settlement descriptors")

    if SKIP_SD:
        print(f"\n  Sample prompts (first {PREVIEW_PATCHES}):")
        for i, (px, py, _, p) in enumerate(patch_data[:PREVIEW_PATCHES]):
            short = p.replace(BASE_PROMPT + ", ", "")[:90]
            print(f"  [{i+1:3d}] ({px:4d},{py:4d})  {short}")
        print("\n--no-sd: writing colour base as tiles-sat/ …")
        if DST_TILES.exists():
            shutil.rmtree(DST_TILES)
        w, h = base_img.size
        n  = slice_to_tiles(base_img, 2, DST_TILES)
        n += slice_to_tiles(base_img.resize((w//2, h//2), Image.LANCZOS), 1, DST_TILES)
        n += slice_to_tiles(base_img.resize((w//4, h//4), Image.LANCZOS), 0, DST_TILES)
        print(f"  {n} preview tiles written.")
        return

    print("\n[5/5] Stable Diffusion img2img …")
    import torch
    from diffusers import StableDiffusionImg2ImgPipeline, DPMSolverMultistepScheduler

    pipe = StableDiffusionImg2ImgPipeline.from_pretrained(
        "stable-diffusion-v1-5/stable-diffusion-v1-5",
        torch_dtype=torch.float32,
        safety_checker=None,
        requires_safety_checker=False,
    )
    pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config)
    pipe = pipe.to(DEVICE)
    pipe.enable_attention_slicing()
    if hasattr(pipe, "enable_vae_slicing"):
        pipe.enable_vae_slicing()

    est = len(patch_data) * NUM_STEPS // 60
    print(f"  ~{est} min  ({len(patch_data)} patches × {NUM_STEPS} steps)")

    def patch_denoise(px, py):
        x2, y2 = min(px + PATCH_SIZE, CANVAS_W), min(py + PATCH_SIZE, CANVAS_H)
        best, best_cov = None, 0.0
        for name in DENOISE_OVERRIDES:
            if name in masks:
                cov = float(masks[name][py:y2, px:x2].mean())
                if cov > best_cov:
                    best_cov, best = cov, name
        return DENOISE_OVERRIDES[best] if best and best_cov > 0.25 else DENOISE_STRENGTH

    processed = []
    for i, (px, py, patch, prompt) in enumerate(patch_data):
        dn    = patch_denoise(px, py)
        label = prompt.replace(BASE_PROMPT + ", ", "")[:60]
        print(f"  [{i+1:3d}/{len(patch_data)}] ({px:4d},{py:4d}) d={dn:.2f}  {label} …",
              end=" ", flush=True)
        gen = torch.Generator(device=DEVICE).manual_seed(SEED + i)
        out = pipe(
            prompt=prompt,
            negative_prompt=NEGATIVE_PROMPT,
            image=patch.convert("RGB"),
            strength=dn,
            guidance_scale=GUIDANCE_SCALE,
            num_inference_steps=NUM_STEPS,
            generator=gen,
        ).images[0]
        # Per-patch sharpen before blending
        out = sharpen(out, PATCH_UNSHARP_RADIUS, PATCH_UNSHARP_PERCENT)
        processed.append((px, py, out))
        print("done")
        if (i + 1) % 50 == 0:
            print(f"  ── checkpoint {i+1}/{len(patch_data)} ──")

    print(f"\n  Blending {len(processed)} patches …")
    w, h     = base_img.size
    full_sat = blend_patches(processed, w, h)

    print("  Applying final sharpening pass …")
    full_sat = sharpen(full_sat, FINAL_UNSHARP_RADIUS, FINAL_UNSHARP_PERCENT)

    full_sat.save("_sat_full.jpg", quality=95)
    print("  Saved _sat_full.jpg")

    print("\nGenerating tile pyramid …")
    if DST_TILES.exists():
        shutil.rmtree(DST_TILES)
    n  = slice_to_tiles(full_sat, 2, DST_TILES)
    z1 = full_sat.resize((w//2, h//2), Image.LANCZOS)
    n += slice_to_tiles(z1, 1, DST_TILES)
    z0 = full_sat.resize((w//4, h//4), Image.LANCZOS)
    n += slice_to_tiles(z0, 0, DST_TILES)
    print(f"\nDone!  {n} tiles → {DST_TILES}/")


if __name__ == "__main__":
    main()
