# Batch 11D — Campus Asset Foundation

This pass converts the approved campus concept into a production-ready, extensible asset pipeline.

## Asset structure

```text
public/assets/campus/
  manifest.json
  README.md
  buildings/
    startup_hq.png          # 4x4
    corporate_hq.png        # 6x6 (future physical HQ upgrade)
    beauty_lab.png          # 4x4
    toy_studio.png          # 4x4
    warehouse.png           # 6x4
    factory.png             # 6x4
  expansions/
    office_expansion.png    # 4x2
    warehouse_expansion.png # 4x2
    factory_upgrade.png     # 4x2
    loading_dock.png        # 3x2
  decor/
    parking_signage.png     # 4x3
    landscaping.png         # 4x4
```

Every PNG is RGBA with a genuine transparent background.

## Grid / footprint contract

The map never infers physical size from image pixels. `src/ui/campus/assetRegistry.ts` is authoritative for:

- asset id
- footprint in grid tiles
- bottom-center image anchor
- visual scale
- room-kind compatibility
- source path

This allows art to be replaced later without moving buildings, invalidating collisions or changing saves.

## Current integration

`CompanyMapView` resolves a visual skin from actual simulation state:

- Founder office -> Startup HQ
- Product office + Skincare mandate -> Beauty Lab
- Product office + Toys mandate -> Toy Studio
- Factory -> Factory
- Warehouse -> Warehouse
- Sourcing/outsourcing -> Loading Dock visual
- Other offices -> Office Expansion visual

The procedural building renderer remains as a fallback if an image is missing or has not loaded.

Decor assets are rendered separately from simulation state and automatically disappear if a real building occupies their parcel.

## Standardized new-build footprints

To match the approved isometric grid language, **newly constructed** rooms use:

- Office: 4x4
- Factory: 6x4
- Warehouse: 6x4
- Sourcing Office: 3x2

Old saves remain compatible because room dimensions are stored in the save itself; this pass does not rewrite existing room footprints.

## GitHub Pages

Vite now uses `base: "./"`, so the production build is portable across GitHub Pages repository names. The existing workflow installs dependencies, builds `dist/`, uploads it as a Pages artifact and deploys on pushes to `main`.
