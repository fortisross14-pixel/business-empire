# Business Empire v1.0.8 — Physical Campus Expansion

## What changed

- Added a v3 transparent campus art pack with 25 cropped building sprites plus a transparent 5×5 asset atlas.
- Added the general-purpose **Design Studio** facility.
- Rebalanced building footprints around a readable 2×2 / 3×3 / 4×4 / 5×5 progression.
- Founder Office now grows physically **2×2 → 3×3 → 4×4 → 5×5**.
- Beauty, Toy, Research, Training and Warehouse buildings now have level-specific physical footprints and asset IDs.
- Brand, HR, Marketing, Logistics, Consumer Insights, Cold Storage, Distribution Hub and Executive Wing now use bespoke art instead of generic office/warehouse fallbacks.
- Upgrading a facility is now a placement action: after choosing Expand, the player selects the new enlarged footprint on the campus.

## Expansion placement rules

The enlarged facility:

1. may overlap its own existing footprint;
2. cannot overlap another facility;
3. cannot cover an existing path;
4. must remain inside the 48×48 campus;
5. must touch the connected path network;
6. only charges the upgrade cost after the placement passes validation.

This keeps building progression visible on the map instead of treating upgrades as invisible capacity buttons.
