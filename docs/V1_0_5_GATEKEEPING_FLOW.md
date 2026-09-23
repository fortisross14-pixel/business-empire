# v1.0.5 — Capability Gatekeeping, Flow & Balance Audit

This pass makes progression obey one consistent rule: **cash buys things; it does not magically create capabilities**. Advanced actions require a believable owner (person), knowledge (research), physical capacity (building/module), or a combination of those. Every disabled action should surface the missing prerequisite rather than simply appearing dead.

## Gate philosophy

- **People own decisions and operations.** Empty buildings do not run themselves.
- **Research unlocks know-how.** Having staff does not let a startup coordinate AAA product programs, factories or cold chains without learning how.
- **Buildings provide physical capacity.** Hiring stops when desks are full; manufacturing stops when storage or production capacity is missing.
- **Money is the final constraint, not the only constraint.** Once the organizational/technical gate is met, the player still has to afford it.

## People gates

- **Corporate research** → seated **Chief Innovation Officer (CIO)**. Active research pauses if the CIO is removed from an office.
- **Recruiting** → a compatible office desk must already be open. The agency will not search for an employee the company cannot seat.
- **Marketing campaigns / always-on marketing / product launch** → seated Marketing specialist.
- **Custom market segments** → seated Marketing or Strategy specialist.
- **Supplier coordination and production** → seated Sourcing / Operations specialist.
- **External retailer negotiation** → seated Sourcing / Operations or Strategy specialist. Own web remains a founder-level channel.
- **Factory retooling and specialized warehouse installation** → seated Sourcing / Operations specialist.
- **Advanced market intelligence** → seated Strategy specialist in addition to the technology unlock.
- **Additional brands** → seated Marketing specialist plus company-scale allowance.
- **New industry entry** → staffed Product organization + seated Strategy specialist + sufficient company scale/cash. The entry program pauses if either owner disappears.
- **Original consumer IP** → seated Marketing specialist. External IP licensing requires Strategy or Marketing ownership of the negotiation.
- **New category development** → seated CIO + seated Product staff; the project pauses if either capability disappears.

## Technology gates

- **AA product programs** → Advanced Product Development.
- **AAA product programs** → Flagship Product Development (which also depends on Organizational Scaling).
- **Online recruiting** → People & HR Foundations.
- **Deep / executive recruiting** → Executive Search.
- **16-seat Large Office** → Organizational Scaling.
- **32-seat Corporate HQ** → Corporate Headquarters.
- **Additional HQ floors (+8 seats)** → Vertical Expansion.
- **Dedicated Sourcing Office** → Supplier Management.
- **Factory / owned manufacturing** → Owned Manufacturing.
- **Climate / refrigerated / frozen / secure storage modules** → Specialized Storage.
- **Advanced market studies** → Market Intelligence.

## Product-program gates

The intended progression remains deliberately physical:

- **A**: 1 Product Designer. No research gate. Small-company product, ~35 base development days.
- **AA**: Product Lead + 1 Product Designer, Advanced Product Development, and an office of at least 8 seats. ~80 base days.
- **AAA**: Product Lead + 3 Product Designers, Flagship Product Development, and an office of at least 16 seats. ~150 base days.

The Lead is weighted more heavily than an individual designer, so assigning the strongest person to lead a flagship matters. Research unlocks the program structure; it does not guarantee quality.

## Storage / cold-chain gate

Warehouses start as standard dry storage. After **Specialized Storage** is researched, an Operations specialist can install modules on an existing warehouse:

- Climate Controlled — $90k
- Refrigerated / Cold Storage — $180k
- Frozen Storage — $300k
- High Security — $220k

Every product archetype declares a storage profile. Manufacturing is blocked if no compatible warehouse capacity exists. Specialized modules unlock handling capability but **do not duplicate floor space**: standard, cold, frozen and secure inventory still compete for the same physical warehouse capacity. This means a future Frozen Pizza archetype can simply declare `storage.profile = "frozen"`; the ordinary Product Engine will then require actual Frozen Storage before a batch can be ordered. Food itself is not added in v1.0.5.

## Early-game flow audit

The intended first-company sequence is now:

1. Empty lot → connect a path.
2. Build 4-seat Founder Office.
3. Create founding brand.
4. Hire and seat Product Designer.
5. Design an A product.
6. Hire and seat Sourcing Manager.
7. Build warehouse and order first batch.
8. Hire and seat Marketing Specialist.
9. Configure audience/channel/price and launch.
10. Reach meaningful traction.
11. Founder Office is full → expand to 8 seats (or build another office).
12. Hire and seat CIO.
13. Choose the first capability research project.
14. Research + people + physical expansion now determine which direction the company can take.

There is intentionally no research requirement for the first 4→8 office expansion. Requiring research before hiring the CIO would create a deadlock.

## Mid-game balance logic

The first research choices are designed to compete with one another rather than all being mandatory immediately:

- Advanced Product Development pushes toward AA quality.
- People & HR Foundations improves access to stronger talent.
- Supplier Management scales outsourced production.
- Organizational Scaling opens a 16-seat organization.
- Market Intelligence improves information quality.
- Specialized Storage opens cold-chain/special-handling product families when those archetypes exist.

Only one corporate capability project can be active at once. A CIO is the core research engine; Product, Strategy and Operations staff provide supporting development speed. This makes expansion consume both **time and organizational bandwidth**, not only cash. Recruiting odds were also rebalanced so search depth matters: Quick remains mostly junior, Online has meaningful access to senior candidates, and Deep Search becomes the reliable route to Product Leads/directors with a small chance of true executive talent. This avoids turning AA staffing into a hidden one-year promotion wall.

## Visibility / disabled-action rule

Important buttons now expose their gate in nearby copy or a tooltip: no open desk, missing CIO, missing technology, missing Operations/Marketing/Strategy staff, missing compatible storage, missing factory, insufficient cash, or prerequisite research. Research also contains a compact **Capability Gate Map** so the player can understand the main progression chains without hunting through unrelated menus.

The HUD work queue now displays research, category-development and industry-entry projects as **Paused** rather than inventing a false ETA when their required people disappear. Founder Office specialists also count toward Finance/Strategy capability tiers, so the flexible early office does not hide a second-building requirement.

## Navigation audit

No new top-level navigation was introduced. Canonical order remains:

- Campus — permanent play surface
- Left/mobile rail: **Goals → Products → People → Market → Finance → Company → History**
- Products: **Products → Inventory → Distribution**
- People: **Hiring → Employees**
- Market: **Market → Segments → Marketing**
- Finance: **Overview → Analysis**
- Company: **HQ → Research → Strategy → Brands → Businesses → IP & Licensing**
- History: **Chronicle → Annual Reviews → Records**

Actions remain canonical: staffing in People/building popups, product lifecycle in Products, capability unlocks in Research, customer definitions in Segments, media decisions in Marketing, and physical construction/upgrades on the Campus.
