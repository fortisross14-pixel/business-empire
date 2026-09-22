# Campus Asset Pack

All campus art is stored as **individual transparent PNGs**. Placement is controlled by
`src/ui/campus/assetRegistry.ts`, not by the pixel dimensions of the image.

## Rules for future assets

1. Use the same 3/4 isometric camera / light direction as the current pack.
2. Export RGBA PNG with a genuinely transparent background.
3. Keep the building centered horizontally and its ground contact near the bottom-center anchor.
4. Add the PNG under one of:
   - `buildings/`
   - `expansions/`
   - `decor/`
5. Add one registry entry with:
   - `footprint: { w, h }` in campus grid tiles
   - `anchor` (normally `{ x: .5, y: .965 }`)
   - `scale`
   - compatible room kinds, if applicable
6. Never derive collisions from PNG size. **Grid footprint is authoritative.**

## Current footprints

- Startup HQ — 4×4
- Corporate HQ — 6×6
- Beauty Lab — 4×4
- Toy Studio — 4×4
- Warehouse — 6×4
- Factory — 6×4
- Office Expansion — 4×2
- Warehouse Expansion — 4×2
- Factory Upgrade — 4×2
- Loading Dock — 3×2
- Parking & Signage — 4×3
- Landscaping Plaza — 4×4
