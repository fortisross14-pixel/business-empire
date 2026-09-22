# Batch 11F — Gameplay Usability / Player Jobs

## Goal
Audit Business Empire as a player rather than as an engine designer. Common actions should be obvious, timed work should be visible, and the same decision should not be editable in two unrelated places.

## Player-job map

| Player question | Canonical place | Supporting visibility |
| --- | --- | --- |
| How do I create a product? | Products → Design new product | Founder/Product office shortcut |
| What stage is this product in? | Products card / product popup | stage badge on portfolio |
| How much is it selling? | Product Analyze | Finance Sales by SKU; Inventory supply view |
| Is the product profitable? | Product contribution/Q | Finance explains company net profit |
| How is the company doing financially? | Finance | HUD cash / profit / revenue |
| How do I hire? | People → Recruiting Agency | HUD work queue + People countdown badge |
| How do I build? | Campus → Build | footprint/cost/capacity shown before placement |
| How do I upgrade? | Click facility → Upgrade | facility level/capacity in popup |
| How large is storage? | Inventory / Warehouse popup | pooled utilization + per-building contribution |
| How do I compare with competitors? | Product Analyze → Competitive check | Market → Competitive Landscape |
| How do I create an audience? | Market → Segments | linked from Product and Marketing |
| Which advertising partner fits my target? | Market → Marketing | target-fit stars and specialization |
| When does a job finish? | HUD task pill | contextual progress screen |

## Changes

- Added persistent timed-work visibility in the HUD for recruiting, product design, manufacturing, studies and expansion projects.
- Added facility upgrades (levels 1–3) with visible capacity/cost trade-offs.
- Expanded Build menu information with footprint, capacity, CAPEX and monthly cost.
- Made Inventory a read-only network overview; production/reorder actions remain inside the product lifecycle.
- Made Distribution the contract-management layer; SKU retailer assignment remains inside the product.
- Separated audience definition from marketing execution: Segments defines audiences, Marketing chooses the target and spend.
- Added media/agency target-fit ratings using the same demographic-skew logic used by campaign effectiveness.
- Basic company money and Sales-by-SKU remain visible without requiring a Finance team; deeper statements still reward staffing Finance.
- Added average units/day and product contribution visibility to product portfolio/detail.
- Added same-category competitor benchmark with fallback to each rival's core line when no exact category SKU is represented.
- Removed obsolete legacy Operations and Distribution modal UI paths.

## Save compatibility

Schema v13 adds `OperatingRoom.upgradeLevel`. Older facilities migrate to level 1.
