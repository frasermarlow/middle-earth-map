#!/usr/bin/env python3
"""Generate satellite-style tiles using Stable Diffusion img2img.

Strategy:
1. Assemble the full map from zoom-0 tiles (highest native zoom = 2048x1280)
2. Upscale to a working resolution divisible by 512
3. Slice into overlapping 512x512 patches
4. Run SD img2img on each patch with satellite imagery prompt
5. Blend overlapping patches back together
6. Slice result into tile pyramids for all zoom levels
"""

import os
import sys
import math
from pathlib import Path

import numpy as np
import torch
from PIL import Image

# ── Configuration ──
PROMPT = (
    "high resolution satellite photograph from orbit, "
    "natural terrain, forests, mountains, rivers, plains, "
    "realistic earth observation imagery, nadir view, "
    "no text, no labels, no borders, photorealistic"
)
NEGATIVE_PROMPT = (
    "illustration, drawing, painting, sketch, cartoon, anime, "
    "text, labels, words, letters, map, compass, legend, border, "
    "artistic, stylized, watercolor, fantasy art, parchment"
)

DENOISE_STRENGTH = 0.58
GUIDANCE_SCALE = 7.5
NUM_STEPS = 30
SEED = 42
PATCH_SIZE = 512
OVERLAP = 96  # overlap between adjacent patches
TILE_SIZE = 256

SRC_TILES = Path("tiles")
DST_TILES = Path("tiles-sat")
DEVICE = "mps"


def assemble_zoom_level(zoom_dir):
    """Assemble all tiles from a zoom level into one image."""
    x_dirs = sorted([d for d in zoom_dir.iterdir() if d.is_dir()], key=lambda d: int(d.name))
    if not x_dirs:
        return None

    # Find grid dimensions
    max_x = max(int(d.name) for d in x_dirs)
    max_y = 0
    for x_dir in x_dirs:
        for f in x_dir.iterdir():
            if f.suffix.lower() in ('.jpg', '.jpeg', '.png'):
                max_y = max(max_y, int(f.stem))

    cols = max_x + 1
    rows = max_y + 1
    print(f"  Grid: {cols}x{rows} tiles = {cols*TILE_SIZE}x{rows*TILE_SIZE}px")

    full = Image.new("RGB", (cols * TILE_SIZE, rows * TILE_SIZE))
    for x_dir in x_dirs:
        x = int(x_dir.name)
        for f in sorted(x_dir.iterdir()):
            if f.suffix.lower() in ('.jpg', '.jpeg', '.png'):
                y = int(f.stem)
                tile = Image.open(f)
                full.paste(tile, (x * TILE_SIZE, y * TILE_SIZE))
    return full


def slice_to_patches(img, patch_size, overlap):
    """Slice image into overlapping patches. Returns list of (x, y, patch)."""
    w, h = img.size
    step = patch_size - overlap
    patches = []

    for y in range(0, h, step):
        for x in range(0, w, step):
            # Clamp to image bounds
            x2 = min(x + patch_size, w)
            y2 = min(y + patch_size, h)
            x1 = x2 - patch_size  # ensure full patch_size
            y1 = y2 - patch_size

            patch = img.crop((x1, y1, x2, y2))
            patches.append((x1, y1, patch))

    return patches


def blend_patches(patches, full_w, full_h, patch_size, overlap):
    """Blend overlapping patches back together using linear feathering."""
    result = np.zeros((full_h, full_w, 3), dtype=np.float64)
    weights = np.zeros((full_h, full_w), dtype=np.float64)

    # Create feather mask: 1.0 in center, linear ramp in overlap zones
    feather = np.ones((patch_size, patch_size), dtype=np.float64)
    ramp = overlap
    for i in range(ramp):
        t = (i + 1) / ramp
        feather[i, :] *= t          # top
        feather[-(i+1), :] *= t     # bottom
        feather[:, i] *= t          # left
        feather[:, -(i+1)] *= t     # right

    for x, y, patch_img in patches:
        arr = np.array(patch_img).astype(np.float64)
        h, w = arr.shape[:2]
        f = feather[:h, :w]

        result[y:y+h, x:x+w] += arr * f[:, :, np.newaxis]
        weights[y:y+h, x:x+w] += f

    # Avoid division by zero
    weights = np.maximum(weights, 1e-6)
    result /= weights[:, :, np.newaxis]

    return Image.fromarray(result.clip(0, 255).astype(np.uint8))


def slice_to_tiles(img, zoom_level, dst_dir):
    """Slice a full image into 256x256 tiles at a given zoom level."""
    w, h = img.size
    cols = math.ceil(w / TILE_SIZE)
    rows = math.ceil(h / TILE_SIZE)
    count = 0

    for x in range(cols):
        for y in range(rows):
            x1 = x * TILE_SIZE
            y1 = y * TILE_SIZE
            x2 = min(x1 + TILE_SIZE, w)
            y2 = min(y1 + TILE_SIZE, h)

            tile = img.crop((x1, y1, x2, y2))
            # Pad if needed
            if tile.size != (TILE_SIZE, TILE_SIZE):
                padded = Image.new("RGB", (TILE_SIZE, TILE_SIZE))
                padded.paste(tile, (0, 0))
                tile = padded

            tile_path = dst_dir / str(zoom_level) / str(x) / f"{y}.jpg"
            tile_path.parent.mkdir(parents=True, exist_ok=True)
            tile.save(str(tile_path), "JPEG", quality=92)
            count += 1

    return count


def main():
    print("=" * 60)
    print("Middle-earth Satellite Tile Generator (AI img2img)")
    print("=" * 60)

    # ── Step 1: Assemble source image from highest native zoom ──
    # Zoom level 2 in tiles/ = leaflet zoom 0 (highest native)
    print("\n[1/5] Assembling source map from zoom-2 tiles...")
    source_img = assemble_zoom_level(SRC_TILES / "2")
    if source_img is None:
        print("ERROR: Could not find zoom-2 tiles")
        sys.exit(1)
    print(f"  Assembled: {source_img.size[0]}x{source_img.size[1]}px")
    source_img.save("_sat_source.jpg", quality=95)

    # ── Step 2: Load SD pipeline ──
    print("\n[2/5] Loading Stable Diffusion pipeline...")
    print("  (First run downloads ~5GB of model weights)")

    from diffusers import StableDiffusionImg2ImgPipeline

    pipe = StableDiffusionImg2ImgPipeline.from_pretrained(
        "stable-diffusion-v1-5/stable-diffusion-v1-5",
        torch_dtype=torch.float32,  # float16 produces NaN on MPS
        safety_checker=None,
        requires_safety_checker=False,
    )
    pipe = pipe.to(DEVICE)
    # Reduce memory usage on 16GB M4
    pipe.enable_attention_slicing()
    if hasattr(pipe, "enable_vae_slicing"):
        pipe.enable_vae_slicing()

    generator = torch.Generator(device=DEVICE).manual_seed(SEED)

    print("  Pipeline ready.")

    # ── Step 3: Process patches ──
    src_w, src_h = source_img.size
    print(f"\n[3/5] Slicing into {PATCH_SIZE}x{PATCH_SIZE} patches (overlap={OVERLAP})...")
    patches = slice_to_patches(source_img, PATCH_SIZE, OVERLAP)
    print(f"  {len(patches)} patches to process")

    processed_patches = []
    for i, (px, py, patch) in enumerate(patches):
        print(f"  Patch {i+1}/{len(patches)} at ({px},{py})...", end=" ", flush=True)

        # SD img2img expects RGB PIL image
        patch_rgb = patch.convert("RGB")

        # Reset generator for reproducibility per-patch
        generator = torch.Generator(device=DEVICE).manual_seed(SEED + i)

        result = pipe(
            prompt=PROMPT,
            negative_prompt=NEGATIVE_PROMPT,
            image=patch_rgb,
            strength=DENOISE_STRENGTH,
            guidance_scale=GUIDANCE_SCALE,
            num_inference_steps=NUM_STEPS,
            generator=generator,
        ).images[0]

        processed_patches.append((px, py, result))
        print("done")

        # Save progress checkpoint every 50 patches
        if (i + 1) % 50 == 0:
            print(f"  ... checkpoint at patch {i+1}")

    # ── Step 4: Blend and reassemble ──
    print(f"\n[4/5] Blending {len(processed_patches)} patches...")
    full_sat = blend_patches(processed_patches, src_w, src_h, PATCH_SIZE, OVERLAP)
    full_sat.save("_sat_full.jpg", quality=95)
    print(f"  Full satellite image: {full_sat.size[0]}x{full_sat.size[1]}px")

    # ── Step 5: Generate tile pyramid ──
    print("\n[5/5] Generating tile pyramid...")

    # Clean destination
    if DST_TILES.exists():
        import shutil
        shutil.rmtree(DST_TILES)

    # Zoom 2 (native highest) — slice directly
    n = slice_to_tiles(full_sat, 2, DST_TILES)
    print(f"  Zoom 2: {n} tiles")

    # Zoom 1 — half resolution
    z1 = full_sat.resize((src_w // 2, src_h // 2), Image.LANCZOS)
    n = slice_to_tiles(z1, 1, DST_TILES)
    print(f"  Zoom 1: {n} tiles")

    # Zoom 0 — quarter resolution
    z0 = full_sat.resize((src_w // 4, src_h // 4), Image.LANCZOS)
    n = slice_to_tiles(z0, 0, DST_TILES)
    print(f"  Zoom 0: {n} tiles")

    print(f"\nDone! Satellite tiles written to {DST_TILES}/")
    print("Intermediate files: _sat_source.jpg, _sat_full.jpg")


if __name__ == "__main__":
    main()
