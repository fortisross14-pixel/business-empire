# Campus Asset Pack v3

The runtime uses **individual transparent PNGs** under `buildings/v3/`. A transparent 5×5 contact atlas is also included as `buildings/v3/building_asset_grid.png`, with cell metadata in `building_asset_grid.json`.

## Important rules

- Grid footprints come from `src/engine/infrastructure.ts`; PNG dimensions never control collisions.
- Every facility upgrade can claim a larger footprint. The player chooses the enlarged footprint again on the campus map.
- An expansion may overlap the building's own current footprint, but cannot cover paths, collide with other facilities, leave the map, or lose connected-path access.
- Runtime art selection is in `src/ui/campus/assetRegistry.ts`.
- All v3 art is RGBA, cropped to visible content plus a small transparent safety margin.

## Core footprint progression

- Founder Office: **2×2 → 3×3 → 4×4 → 5×5**
- Design Studio: **2×2 → 3×3**
- Beauty Center: **3×3 → 4×4**
- Toy Center: **3×3 → 4×4**
- Research Center: **3×3 → 4×4 → 5×5**
- Training Room: **2×2 → 3×3**
- Warehouse: **3×3 → 4×4 → 5×5**
- Brand Studio: **2×2 → 3×3**
- HR Office: **2×2 → 3×3**
- Marketing Office: **3×3 → 4×4**
- Logistics Office: **3×3 → 4×4**
- Consumer Insights Lab: **3×3 → 4×4**
- Cold Storage: **4×4 → 5×5**
- Distribution Hub: **5×5 → 6×6**
- Executive Wing: **4×4 → 5×5**

Some tier-II/III specialist assets currently reuse the same authored illustration while the **physical footprint and map scale grow**. The registry keeps separate tier filenames so unique replacement art can be dropped in later without changing saves or code.
