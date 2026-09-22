# Batch 11E — Campus-First Interaction & Product Lifecycle

## Design goal
Business Empire should behave like a tycoon game whose primary surface is the company campus. The player should not repeatedly leave the map to navigate a web-app style hierarchy.

## Campus interaction
- Campus remains mounted beneath all management screens.
- Major areas open as closable overlays.
- Founder Goals live behind a left-rail button instead of occupying permanent vertical space.
- Buildings open their own context popup.
- Hit-testing is based on the isometric foundation polygon, not the full transparent sprite bounds.
- Build controls float over the map.

## Startup office
The founder is implicit and does not consume a hired-person slot. The Founder Office begins with one operating Product-team seat. This makes the initial staffing loop explicit: recruit a PM, then assign that PM to the office from the campus.

## Recruiting agency
`TalentSearch` is persistent simulation state. Searches have role, industry, mode, cost and remaining days.

Modes:
- `quick`: 2 days, $5,000, 3 candidates, lower expected quality
- `online`: 7 days, $18,000, 4 candidates, normal expected quality
- `deep`: 21 days, $55,000, 5 candidates, higher expected quality

No talent-quality slider is exposed to the player.

## Product lifecycle
### Design
The creator is now two-step and intentionally excludes manufacturer, batch size, manufacturing standard and price.

### Manufacture
After design completion, the product detail popup exposes production route, manufacturing partner, quality standard and first batch. Those are frozen after the first batch begins.

### Sell
The first completed batch becomes inventory but the SKU is not commercially released. The player explicitly configures price, target, signed channels and optional launch advertising, then presses Release.

### Analyze
A released product exposes operating results and iteration actions. Commercial decisions can be changed on the live SKU. A manufacturer/product redesign requires a new product version linked through `parentSkuId` / `version`.

## Engine changes
- Save schema 12
- `SKU.releasedToMarket`
- `SKU.version` and `SKU.parentSkuId`
- `TalentSearch` state and timed agency searches
- Demand, secondary market and product-dynamics logic ignore unreleased inventory
- Legacy active products migrate as released

## Validation
- Strict TypeScript passes for `src/engine`.
- Full structural TypeScript check passes with a temporary local React declaration shim (removed from the package afterward).
- Runtime engine smoke test confirmed: Founder operating capacity = 1, Starter Warehouse = 6×4, quick recruiting returns 3 candidates after 2 days, newly built SKU starts unreleased.
