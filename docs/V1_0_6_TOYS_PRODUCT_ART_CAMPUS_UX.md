# v1.0.6 — Toys design hotfix, product art cards, campus UX

## What changed

### Toys can start product design
- Product creation no longer injects the skincare-only `FlexForm Labs` supplier into every outsourced design.
- Manufacturing selection is deferred until the post-design Manufacture stage, matching the UI flow.
- Toy products therefore reach design with `supplierId: null`, then the Manufacture stage offers only compatible toy suppliers.
- Existing saves are sanitized on load: an incompatible legacy supplier assignment is cleared rather than blocking a toy product.

### No more silent product-creation failure
- `createProduct` now returns a structured success/error result.
- The Product Creator shows the exact blocker under **Start design** instead of leaving the modal open with no feedback.
- Blockers include category/brand mismatch, office requirements, project-tier requirements, team assignment, and incompatible explicit suppliers.

### Image-backed product cards
- Product visuals no longer use runtime procedural package geometry.
- `public/assets/products/` now contains one static illustration file per current skincare/toy archetype (17 total).
- Portfolio cards are larger and use a collectible-card composition: brand chip top-left, optional IP chip top-right, hero illustration in the center, product/category/stars at the bottom.
- Art is replaceable by filename (`<productKey>.svg`) without changing UI code, so future illustration passes can swap in higher-fidelity PNG/WebP/SVG art directly.

### Campus path preview
- Existing path tiles in a dragged route render as neutral/blue rather than invalid red.
- Preview validation now simulates path construction tile-by-tile, including connectivity and cash, matching the actual build action.
- Green means a new tile can be built; red is now reserved for a genuine blocker.

### Mobile campus framing
- Initial/Center camera now fits the active campus plus a small margin instead of framing the whole 48×48 lot.
- This makes the Founder Office and early campus materially larger on phones and reduces the feeling of a tiny sprite in a huge empty map.

## Asset limitation found
Several current campus PNGs are already cropped at their source image boundary (not by the canvas renderer). In particular, `startup_hq.png` loses part of the right/bottom exterior. Code can reposition or scale these images but cannot restore missing pixels. Those files need an art replacement/outpainting pass while preserving transparent background, isometric angle, and the same asset IDs/filenames.

## Next structural pass
The larger "building should be a recurring part of the game" change is best implemented as a dedicated campus/build-system pass: more buildable placeables/variants, unlock cadence, cosmetic + functional upgrades, save migration, build-menu categorization, and a data-driven asset catalog. Keep the art generation itself separate from that coding pass so the agent wires stable asset slots rather than inventing procedural graphics.
