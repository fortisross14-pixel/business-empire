# v2.1 — Business School Campaign

## Player-facing structure

The home screen now exposes three game modes:

- **Campaign** is always available. Cases begin from authored, live companies and award 1–3 career stars.
- **Scenarios** unlock at 3 total campaign stars and preserve the five founder journeys from v1.7.
- **Sandbox** unlocks at 5 total campaign stars. The player chooses the industry, company name and starting capital.

Cases 1–3 are available immediately. The remaining career ladder unlocks at 3, 4, 5, 6, 8, 10, 12, 14 and 16 total stars.

## Implemented cases

1. Success Story
2. The Full Warehouse
3. Old Brand, New Customer
4. Snack Wars
5. The Quiet Hit
6. The Luxury Trap
7. Forty-Five Days Cold
8. The Licensing Bet
9. Two Brands, One Campus
10. Silicon Supply
11. The Debt Covenant
12. The Board's Portfolio

Every case is playable and receives a seeded company, campus, people, brands, products, distribution and financial position. Each case also has three grading tiers and at least one authored decision event.

## Architecture

`src/engine/campaign.ts` is the single campaign registry and evaluator. React does not contain case-specific rules.

A `CampaignCaseDefinition` owns:

- metadata and unlock threshold;
- starting industry, company and reusable seed profile;
- duration and difficulty label;
- declarative constraints;
- three star tiers made from generic metric requirements;
- scheduled authored decision events;
- the learning objective shown in the result screen.

`CampaignRuntime` is stored in the world save. It records the case clock, opening inventory, opening products/contracts/facilities, encountered events and submitted result. Career progression is deliberately separate in `market-sim:campaign-profile-v1`; restarting or losing a case cannot erase stars already earned.

## Adding a case

1. Add one `CampaignCaseDefinition` to `CAMPAIGN_CASES`.
2. Choose an existing seed profile, or add a reusable seed profile to `seedLiveCompany` only when the company structure is genuinely new.
3. Compose star tiers from existing metrics. Add a metric to `CampaignMetric` and `campaignMetricValue` only if it will be reusable by several cases.
4. Compose restrictions from `CampaignConstraints`. Enforcement belongs in `campaignConstraintReason` and the central action layer, never in a case-specific UI branch.
5. Add events as `CampaignEventDefinition` records. Event choices use the same `GameEffect` system as founder-scenario events.
6. Run `scripts/campaign-smoke.ts` with a TypeScript runner and run the normal typecheck/build.

## Adding products or industries

Campaign definitions reference industry IDs and product catalogs already registered by the Product Engine. A new industry automatically supplies its product list, need axes, market, competitors and specialist facilities to campaign seeding. The normal extension path is therefore:

1. register the industry and product archetypes;
2. add its art, facilities, suppliers and retailers through the existing data registries;
3. create cases that reference the new industry ID and reuse campaign metrics/effects;
4. add a new seed profile only if the assignment needs a starting company shape not represented by the existing profiles.

This keeps new cases content-driven and prevents campaign logic from fragmenting into product- or market-specific engines.
