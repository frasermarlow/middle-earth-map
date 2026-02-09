# Undying Lands Map — Generation Strategy

## Goal
Use the layout from Karen Wynn Fonstad's *The Atlas of Middle-earth* as a geographic reference and generate original artwork visually matching our current Middle-earth map style.

## Strategy

### Phase 1 — Create a line layout
Trace the key geographic features from Fonstad (coastlines, mountain ranges, rivers, city dots) into a simple black-and-white outline. This is the spatial reference — since geographic facts aren't copyrightable, only artistic expression is, a clean re-drawn outline is safe to work from.

### Phase 2 — Generate the artwork
Use the outline as a **ControlNet / image-to-image input** with a style prompt describing the current map's look (aged parchment, muted earth tones, hand-drawn mountains, serif labels). This preserves the geography while generating original artwork.

## Best Tools

### For the generation itself
- **Midjourney** (v7) — best at painterly, artistic output. Great for matching a specific aesthetic, though less precise spatial control.
- **Stable Diffusion + ControlNet** — the most control over layout. Feed the outline as a ControlNet "canny edge" or "lineart" input and it will respect the geography while painting over it in the target style. Free/local. Probably the best bet.
- **DALL-E 4** / Gemini Image Suite — improving rapidly at following spatial references.

### For the outline/tracing
- **Inkarnate** (https://inkarnate.com/) — purpose-built fantasy map tool, good for drafting the layout with coastlines and terrain before handing off to AI for the final style.
- Manual SVG trace in Illustrator/Figma would also work for the outline.

### For tiling
- Once the final image is ready, use the same tile generation approach as the current map (slice into 256px tiles at multiple zoom levels).

## Recommendation

**Stable Diffusion + ControlNet** gives the most reliable path because it can take a reference of the current map as a style guide AND the Fonstad-traced outline as a structural guide simultaneously. The output should look like a natural westward extension of the existing map.

## Key Features to Depict
- Valinor
- Eldamar
- The Pelori mountains
- Tirion upon Tuna
- Alqualonde
- Taniquetil
- Ezellohar (location of the Two Trees)

## References
- [Best Fantasy Map Generators 2026](https://www.robbwallace.co.uk/news/best-fantasy-map-generators/)
- [Fantasy AI Image Tools Compared (Fiddl.art)](https://fiddl.art/blog/en/fantasy-ai-image-tools)
- [Inkarnate - Fantasy Maps Online](https://inkarnate.com/)
- [AI Image Generation Guide 2026 (Kittl)](https://www.kittl.com/blogs/ai-image-generation-guide-ais/)
- [AI in Photography & Graphics 2025-2026 Trends](https://historyoficons.com/blog/ai-in-photography-and-graphics-trends-workflow-changes-and-tools-for-2025-2026/)
