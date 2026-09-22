# Product Engine

Business Empire v0.96 (through Batch 8C) uses a data-driven product engine. The intent is that a new product category is primarily **content/config**, not a new simulation engine.

## Add a product

The main edit point is `src/engine/productCatalog.ts` → `PRODUCT_ARCHETYPES`.

A product archetype defines:

- identity: `key`, `label`, `industryId`
- commercial range: `priceBand`
- customer fit: `naturalLean`, `categoryLean`, `defaultAttributes`
- bill of materials: `materials[]`
- manufacturing: `manufacturingFamilies[]`
- storage: `storage.profile`, `storage.spacePerUnit`
- safety/regulation profile
- retailer affinity
- brand / IP / packaging importance hooks
- lifecycle: repeat purchase, purchase cycle, shelf life, trend, hit volatility, seasonality, obsolescence
- capability weights
- optional modules
- category-entry metadata: starter vs investment/time to enter

The engine automatically projects registered archetypes into the legacy-compatible `IndustryConfig.products` model.

## What is derived automatically

Once an archetype exists:

1. `IndustryConfig.products` receives the product type automatically.
2. Starter categories and category-expansion definitions are generated from `entry`.
3. Baseline raw-material cost is derived from the simplified BOM.
4. Current material price indexes alter future production cost.
5. Supplier compatibility is checked against required manufacturing families.
6. Owned factory capacity is the bottleneck across required manufacturing families.
7. Warehouse capacity uses storage profile + `spacePerUnit` rather than treating every unit as identical.
8. Retail partner fit reads archetype affinity before demand is calculated.
9. Seasonality, hit momentum, repeat-purchase cadence and obsolescence are read from the lifecycle profile.
10. Inventory is tracked as FIFO lots so ageing/expiry can work for any archetype.
11. Safety/testing is activated by regulation/module data and can generate recalls without industry-specific code.
12. Generic design facets (for example Age Group or Play Fantasy) render automatically in Product Creator.

## Add a raw material

Add one entry to `MATERIALS`.

A material currently defines:

- id / label
- volatility band
- description

Each product BOM stores the material's baseline dollar contribution. `World.materialPriceIndex[materialId]` is a multiplier (1.0 baseline). Future commodity events can modify this shared index without touching product code.

## Add a manufacturing process

Add one entry to `MANUFACTURING_FAMILIES` and reference its id from products, suppliers and factory lines.

Products can require multiple process families. Owned capacity is the bottleneck across all required families, so separate facilities can collectively support a product.

## Add a storage requirement

Use one of the shared `STORAGE_PROFILES`:

- standard
- climate
- refrigerated
- frozen
- secure

Warehouses declare supported profiles. New warehouses currently start as `standard`; later facility modules can add cold/secure/climate capability without changing product definitions.

`spacePerUnit` controls warehouse density. A compact product can be below 1.0; bulky products can be above 1.0.

## Retail affinity

`retailAffinity` supports direct partner ids today and the helper also accepts future fallback keys:

- exact partner id, e.g. `beauty_luxe`
- `format:<retailer category>`
- `channel:<channel type>`

A value of `1` is neutral, above 1 over-indexes, below 1 under-indexes.

## Optional modules

The archetype schema deliberately includes module hooks rather than one engine per industry. Reusable behavior already active in v0.96 includes:

- seasonality profiles
- hit / fade momentum driven by `hitVolatility`
- FIFO inventory ageing and physical expiry when `shelfLifeDays` is set
- commercial staleness from trend/obsolescence parameters
- safety / testing levels and data-driven recall risk
- universal IP/licensing through first-class IP assets, audience fit, product-family fit, ownership and contracts

The schema is also ready for deeper reusable modules such as collectibility, cold chain, fashion sizing/returns and technology generations. A product should activate modules through data. Add product-specific code only when the behavior cannot be expressed as a reusable module.


## Add / use an IP

IP is a universal layer in `src/engine/ip.ts`, not a Toy feature. `IPAsset.compatibleProductFamilies` stores product-archetype keys and the archetype's `ipPotential` determines how strongly that family can express IP. Archetypes with `ipPotential <= 0` cannot attach IP.

An IP carries its own awareness, momentum, prestige, fatigue and audience profile. A SKU may attach one IP while retaining its independent `brandId`; brand equity and IP pull therefore coexist rather than replacing one another.

External IPs can be licensed through standardized contracts (duration, minimum guarantee and net-sales royalty). Original IPs are player-owned and royalty-free. The demand layer is industry-agnostic, so one property can support a Building Set today and a future Cereal/T-Shirt archetype later simply by sharing compatible product-family keys.

The architectural rule is: **never add `if (industry === "toys")` to make an IP work.** If a future product can carry IP, give its archetype a positive `ipPotential` and make the IP compatible with that family.

## Architectural rule

Before adding an industry-specific rule, ask:

> Is this truly unique to this industry, or is it a property some products can have?

Prefer the latter.

Examples:

- Christmas demand → seasonality profile
- frozen pizza → frozen storage + perishability
- cereal with a character → food archetype + IP module
- licensed T-shirt → apparel archetype + IP module
- GPU → technology cycle + semiconductor manufacturing family

The target is that mature future product additions are roughly **80% data/config, 15% content/art, 5% genuinely new reusable code**.


## Add an industry

An industry supplies a common consumer need vocabulary, demographic/spend profile and competitor seeds. It does **not** get its own simulation engine. Every active business receives an `IndustryMarketState` generated by the same runtime.

The minimum path is:

1. Add/update the `IndustryConfig` in `industries.ts` (needs, spend, demographic weights, competitor seeds).
2. Add its product archetypes to `PRODUCT_ARCHETYPES`.
3. Add any genuinely new material/manufacturing/storage ids to the shared registries.
4. Add retailers/suppliers only when the existing generic ones are not appropriate.
5. Add art/content.

`industryMarkets` then gives that business its own customer cube, competitors, awareness, equity and demand while Finance consolidates all businesses at company level.
