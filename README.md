# Business Empire

A business-strategy simulation. Build a brand in a population modeled as a cube of
customer cells (age × gender × class × leaning), launch products that earn awareness
from zero, negotiate distribution contracts, and manage cash through working capital —
while competitors react and the population shifts under you.

## Run locally

```bash
npm install
npm run dev
```

Open the printed localhost URL.

## Build

```bash
npm run build      # tsc + vite build -> dist/
npm run preview    # preview the production build
```

## Deploy to GitHub Pages

1. Create any GitHub repository and push this project to `main`.
2. In the repo: **Settings → Pages → Source → GitHub Actions**.
3. The workflow in `.github/workflows/deploy.yml` runs `npm ci`, builds `dist/`, uploads the Pages artifact and deploys on every push to `main`.
4. `vite.config.ts` uses `base: "./"`, so you do **not** need to rename the repo or edit a hard-coded repository path.

The same production bundle is therefore portable across repository names and local static previews.

## Architecture

```
src/
  engine/        pure simulation (no React) — testable in isolation
    types.ts       domain types
    industries.ts  configs, axes, channels, helpers
    cube.ts        population, fit (+ product natural lean), drift & shocks
    economics.ts   cost derivation, contract reach
    tick.ts        the step() loop: awareness, per-cell contribution, working capital, competitor reactions
    world.ts       init, SKU builder, studies
  state/useGame.ts game loop hook + actions
  ui/              views & components (render off engine state)
```

The engine is deliberately free of React so it can be unit-tested and reused.

## Current state (v1.0.4 · Research & Capability Tree)

**Customer base + loyalty.** Revenue is no longer an instantaneous share — it's
driven by a persistent customer *stock* per segment. Each period you acquire new
customers from the segment's non-customer pool (rate = your appeal share), retain
most of your existing base, and lose a fraction to churn. Churn is governed by
**satisfaction** — the absolute quality/value your product delivers to that
segment plus how you compare to the best rival, lifted by brand trust. Revenue
comes from repeat purchases by the retained base; satisfied customers buy more and
spread positive **word-of-mouth** (free acquisition), while a dissatisfied base
churns out and dampens growth. Word-of-mouth lifts awareness in the customer's own
segment and spills, with a smaller effect, into demographically adjacent segments.
This is the first system with real hysteresis — a quality cut or price hike churns
the base gradually over quarters rather than instantly, so actions carry lagged,
lasting consequences. A Customers tab shows total base, satisfaction, and
per-segment penetration / churn / lifetime value.

This makes a won segment an asset you must keep satisfied: neglect it, overprice
it, or let a rival out-serve it and satisfaction falls, churn rises, and the base
erodes with momentum. Brand trust now has teeth (it buffers churn), and a happy,
well-distributed base compounds cheaply.

Built on the 648-segment cube, Segment Manager, per-product distribution/packaging
with Product Diagnosis, brand equity, full competitor AI, and strategy reports.

The current architecture is multi-business and data-driven. Skincare and Toys can coexist inside one company with separate customers, competitors, awareness and category economics while sharing cash, people, facilities and corporate capabilities. Future industries are intended to be added primarily through product archetype data and reusable modules rather than bespoke simulation engines.







## v1.0.4 — Research & Capability Tree

v1.0.4 turns company growth into explicit capability progression. Cash and headcount are no longer enough on their own: the company must learn how to coordinate larger products, stronger recruiting, dedicated sourcing, owned manufacturing and larger corporate structures.

- Added **Company → Research**, the canonical home for capability development and product-category expansion. Brand screens now show category access but no longer duplicate the category-development action.
- New companies begin with only baseline startup capabilities. The Founder contributes a small development rate; seated Product, Strategy and Operations talent accelerates research. Only one company capability project can run at a time.
- **Product progression is now researched:** A is available from the start, AA requires Advanced Product Development, and AAA requires Flagship Product Development in addition to its physical 16-seat office and full Product Lead + three Designer team.
- **Organization progression is now researched:** 4→8 seats remains the natural startup expansion; 16-seat Large Offices require Organizational Scaling, 32-seat Corporate HQ requires Corporate Headquarters, and further +8-seat floors require Vertical Expansion.
- **Recruiting progression is now researched:** Quick Available Search is the startup option; People & HR Foundations unlocks normal online searches; Executive Search unlocks deep searches for stronger senior talent.
- **Operations progression is now researched:** founder-led outsourcing remains available through a seated Sourcing specialist, Supplier Management unlocks a dedicated Sourcing Office, and Owned Manufacturing unlocks factories.
- **Market Intelligence** is now a capability unlock. After researching it, the company still needs seated Strategy / Intelligence staff to operate the function; technology and people are complementary rather than substitutes.
- Product-category entry projects are surfaced under Research alongside corporate capabilities, giving the player one canonical place to answer “what can my company learn/unlock next?”
- Active capability research appears in the global work queue with a live estimated completion time.
- Existing v1.0.3 saves migrate to **schema v16** and are grandfathered only into capabilities their current products, offices, factories, sourcing facilities or intelligence teams already prove they possess.

## v1.0.3 — Product Teams & Office Growth

v1.0.3 connects product ambition directly to people, development time and physical office scale.

- Added **A / AA / AAA product projects**.
  - **A**: one Product Designer, ~35 base development days, limited 1–2★ design ceiling and 13 priority points.
  - **AA**: one Product Lead + one Product Designer, ~80 base days, strong 3–4★ potential and 18 priority points.
  - **AAA**: one Product Lead + three Product Designers, ~150 base days, 5★ / market-leading design potential and 23 priority points.
- Product staff assigned to an active design are locked to that project until development completes. Large projects therefore consume real organizational capacity rather than acting as a cash-only upgrade.
- The **Product Lead matters disproportionately**. AA weighs the Lead at 60% of team effectiveness; AAA weighs the Lead at 45%, with the three designers splitting the remaining 55%.
- Product Designers can progress through **Senior Product Designer → Product Lead → VP Product**. Strong external searches can also surface senior Product Leads.
- Project class determines the design-quality ceiling and available priority budget; a badly staffed AAA project can still underperform a well-executed smaller project.
- Office growth now follows a clear physical progression:
  - Small Suburban Office — **4 seats**
  - Normal Office — **8 seats**
  - Large Office — **16 seats**
  - Massive Corporate HQ — **32 seats**
  - Additional Corporate HQ floors — **+8 seats each**, with escalating cost.
- AA requires access to an 8-seat office or larger; AAA requires a 16-seat office or larger. In v1.0.4 these physical requirements are complemented by explicit capability-research prerequisites.
- The Founder Office remains the startup bridge: Founder + three staff initially, then it can grow with the same office progression rather than becoming a dead tutorial building.
- Corporate HQ art is automatically used once an office reaches the 32-seat HQ stage.
- Existing saves migrate to **schema v15**. Existing products infer an A/AA/AAA class from their former development depth, and legacy offices never lose capacity during migration.

## v1.0.2 — Empty Lot & Founder Company

v1.0.2 rewrites the opening of a new company so the player actually **builds a business from nothing** instead of inheriting a prebuilt starter campus.

- New games enter the campus with only a fixed **campus entrance** and two connected path tiles. No office, warehouse or founding brand exists yet.
- Campus construction now starts with a RollerCoaster-Tycoon-style loop: extend **1×1 path tiles** from the entrance, select a facility, preview its footprint on the isometric grid and place it beside the connected path. Facilities cannot overlap another facility or a path.
- The first office becomes the **Founder Office**: a 4-position startup workspace with one permanent Founder / CEO position and three hired staff desks. It can be expanded once to 8 positions in this release; the broader 4→8→16→32 office progression is reserved for the product-team scale batch.
- The founding brand is no longer created in pre-game setup. After the Founder Office exists, the player creates the brand in-game using the full logo/identity builder.
- Recruiting ends in an **employment contract**. Before signing, the player chooses the exact compatible office/workspace; the contract shows role, title, salary, specialty and assigned desk. Hiring is blocked with a clear explanation when no compatible desk is open.
- The Founder Office is intentionally flexible in the startup phase. Its three staff desks can house the first Product Designer, Sourcing / Operations specialist and Marketing specialist, allowing one tiny four-person company (including the Founder) to complete the first commercial loop.
- A seated Sourcing / Operations specialist provides starter outsourced-manufacturing and retailer-negotiation capability; a seated Marketing specialist is required before the first product release.
- The Founder Goals were rebuilt around the new opening: connect the lot → build Founder Office → create brand → hire Product Designer → design → hire Sourcing → build warehouse → manufacture → hire Marketing → launch → win customers.
- Product development now scales from solo **A** projects to multi-person **AA / AAA** teams, with Product Leads carrying disproportionate influence on larger projects.
- Save schema is **v14**. Existing companies are grandfathered with a connected access-road network and keep their current facilities/products.

v1.0.4 now layers explicit capability research on top of these team, time and office-size mechanics.

## v1.0.1 — Clarity & Detail Pass

v1.0.1 is a post-release usability pass focused on small moments where the game was technically working but did not explain itself well enough. No simulation architecture or save-schema changes were introduced.

- **Disabled actions explain why.** Core greyed-out actions now carry a visible reason (and tooltip where useful) instead of forcing the player to guess. This pass covers product design/manufacturing/reorders, product launch prerequisites, segment saving, distribution contracts, IP creation/licensing, facility staff capacity, building affordability and facility upgrades.
- Fixed a real manufacturing-screen bug where the displayed `Maximum available now` could still be calculated from the SKU's previous/default production route instead of the partner/factory currently selected in the UI. Manufacturing availability now previews the selected route correctly.
- The Manufacture stage now includes a **Manufacturing Order / quote** with manufacturer, batch, unit cost, total price, estimated lead time, available capacity, delivered quality and cash after order. The order button also includes the total price.
- Product reorders now show their estimated production cost and any blocker before the player clicks.
- **People now has local subtabs:** `Hiring` and `Employees`. Recruiting search/results stay together; the permanent employee roster is separate. Office assignment remains on the campus building, keeping one canonical place for seat assignment.
- Product Creator and Distribution partner selection received the same blocker-copy treatment so unavailable actions are explicit rather than merely dimmed.

Save schema remains **v13** and v1.0.0 saves remain compatible.

## v1.0.0 — First Complete Release / Mobile Certification

Business Empire v1.0 is the first iteration treated as a complete game rather than an expanding prototype. This release intentionally adds **no new simulation systems**. It certifies the existing tycoon loop across desktop, tablet and phone.

- The **Campus remains the permanent game world** on every device. Phone layouts no longer shrink the desktop dashboard; the map keeps the available viewport and operational screens open as closable layers.
- The desktop left rail becomes a **thumb-friendly bottom navigation bar** on phones, including badges for goals, product attention and recruiting progress.
- The economic HUD has a dedicated mobile composition: Cash / Profit / Revenue remain permanently visible, simulation controls stay tappable, and active work becomes a compact floating status chip.
- Facility context becomes a **mobile bottom sheet**. Tapping the isometric foundation opens assignments, capacity, upgrades and actions without permanently covering the map.
- Build, zoom and recenter controls have mobile-sized touch targets; map panning remains direct touch interaction.
- Product / Company / Market / Finance / People overlays become near-full-screen mobile workspaces with sticky headers, horizontally scrollable local tabs and safe-area padding.
- Product Creator and other modals become **bottom-sheet style flows** on phones. Form controls use mobile-safe sizing to avoid browser zoom and cramped inputs.
- Setup screens, recruiting modes, brand visual tools, History summaries and IP metrics now reflow to one/two-column phone layouts instead of fixed desktop grids.
- Wide finance / analysis tables remain available through contained horizontal scrolling instead of forcing the entire game viewport wider than the phone.
- Inventory product rows collapse into a readable mobile card-like layout.
- iPhone-style `safe-area-inset-*` padding is respected for the HUD, navigation and modal sheets.
- Uses dynamic viewport units (`100dvh`) where the browser chrome would otherwise cause vertical clipping.

The simulation/save schema remains **v13** from Batch 11F; v1.0 is a UX/release certification pass, not a save-breaking feature release.

## Batch 11F — Gameplay Usability / Player Jobs

This pass audits the game from the player's point of view: every common question should have one obvious place to act, while secondary screens may summarize but do not duplicate the action.

### Canonical player jobs

- **Create / manage a product:** Products. Each SKU is a clickable lifecycle card (Design → Manufacture → Sell → Analyze). Founder/Product offices are shortcuts into the same Products workflow.
- **Understand product performance:** open the product. It shows average units/day, quarterly sales/revenue, product contribution, inventory, channels, and a competitor benchmark.
- **Understand company money:** Finance. Cash and net profit remain in the HUD at all times; basic Sales by SKU is visible even before a Finance team exists.
- **Hire someone:** People → Recruiting Agency. Choose role, industry and Quick / Online / Deep search. A persistent HUD work queue and People badge show when the search will finish.
- **Build:** use the visible Build menu directly on the campus. Every option shows footprint, capacity, build cost and monthly cost before placement.
- **Expand a facility:** click its foundation and use the facility popup. Facilities have level 1–3 capacity upgrades; footprint stays fixed, so a second physical building remains a separate construction decision.
- **Inventory / warehouse capacity:** Warehouse building popup for the selected facility; Inventory tab for the pooled network. Inventory is now read-only operational overview—reorders happen inside the product that needs them.
- **Retail contracts vs SKU channels:** Distribution owns retailer contracts. The individual product owns which signed retailers it actually uses.
- **Create a market segment:** Market → Segments. Segment creation/editing no longer changes marketing state itself. Product launch and Marketing link back to this same segment editor.
- **Choose marketing for a target:** Market → Marketing. Select the audience first, then see each agency's target-fit stars before choosing scope, budget and duration. Always-on target and spend also live here.
- **Compare with competitors:** the released product's Analyze stage gives a direct same-category price/quality benchmark, with a nearest-market fallback when no exact rival SKU exists. Market still provides the broader competitive landscape.

### Information hierarchy

- **HUD:** cash, current quarterly profit/revenue, share, date, simulation controls and the next timed job.
- **Campus:** construction, facility capacity, staffing and upgrades.
- **Products:** all SKU-specific commercial and production actions.
- **People:** recruiting and employee decisions.
- **Market:** customers, segmentation and marketing.
- **Finance:** company-level financial explanation and statements.

Obsolete duplicate UI paths from the old Operations/Distribution flow were removed from the active code path. Save schema is v13, adding facility upgrade level while preserving earlier saves.

## Batch 11A — GUI visual foundation

This pass changes presentation, not simulation. It establishes the reusable game shell that the logo/icon and campus-art passes will plug into.

- Dark navy **tycoon HUD** with compact Cash / Profit / Revenue / Share cards, simulation controls and difficulty/confidence state.
- Persistent **bottom game dock** with a stronger selected state and a game-like More navigation sheet.
- New card/panel language: richer hierarchy, softer depth, consistent borders, status colors and more compact information density.
- Screen headers and contextual tabs now read as game navigation rather than SaaS navigation.
- Home/start screen has been moved to the same Business Empire visual language.
- Responsive rules were tightened for tablet/mobile HUD and dock behavior.
- Existing product art and campus art are intentionally unchanged in 11A. Those are the next two dedicated passes, so visual assets can be replaced without another navigation/layout rewrite.
- No `src/engine` files or save schema were changed.

## Batch 11C — Product Icon Depth + Competitor Identity

This pass extends the reusable visual-identity system into two areas that were still too generic:

- **Deeper product icon coverage** for the current archetype set, especially Skincare and Toys.
  Instead of one generic package per industry, categories now get more recognizable pack silhouettes (e.g. serum dropper, premium cream jar, sunscreen/acne tube, mask pouch, building set box, board game, doll window box, vehicle pack, collectible pack, electronic toy box, action-figure blister).
- **Package logic stays systemic**: each product still has a reusable base pack shape, while the brand logo, brand color and optional IP overlay sit on top of it.
- **Packaging tone** now lightly influences the visual finish so Premium / Bold / Techy / Natural / Retro lines feel different without becoming a separate art pipeline.
- Added a **competitor logo system** generated from competitor name, personality and flagship category. Premium, balanced and discounter rivals now have distinct mark styles and palettes.
- Competitor identity is surfaced in the **Businesses**, **Market** and **Intelligence** views so rivals look like actual companies rather than anonymous text rows.
- Added a **Competitive Landscape** panel to Market with reusable rival identity cards and flagship product visuals.

No core simulation systems were rewritten in this pass; this is a presentation / identity-depth layer built on top of the existing data-driven brand/product architecture.


## Batch 11D — Campus Asset Foundation

The first production campus-art pass is now integrated into the actual map rather than living only as a concept sheet.

- Added transparent RGBA building art under `public/assets/campus/`.
- Added `src/ui/campus/assetRegistry.ts` as the single visual registry for footprint, anchor, scale, compatibility and file path.
- Grid footprint is authoritative; PNG pixel size never determines collision or placement.
- Current art pack includes Startup HQ (4×4), future Corporate HQ (6×6), Beauty Lab (4×4), Toy Studio (4×4), Warehouse (6×4), Factory (6×4), plus modular 4×2 / 3×2 expansions and campus decor.
- Product offices resolve to Beauty Lab or Toy Studio from their category mandate. Factory and Warehouse resolve to their dedicated art automatically.
- The canvas keeps the old procedural renderer as a safe fallback if an image is missing or still loading.
- New-build map footprints are standardized to Office 4×4, Factory 6×4, Warehouse 6×4 and Sourcing 3×2. Existing saves keep their stored dimensions.
- Decorative parking / landscaping assets are non-simulated and automatically yield if a real facility occupies the parcel.
- Vite deployment is now repository-name agnostic for GitHub Pages.

See `docs/BATCH11D_CAMPUS_ASSET_FOUNDATION.md` and `public/assets/campus/README.md` for the asset contract.


## Batch 11E — Campus-First Interaction & Product Lifecycle

This pass turns the visual campus into the actual play surface instead of another screen in a navigation hierarchy.

- **The campus remains visible at all times.** Products, People, Market, Finance, Company and History open as closable layers over the map rather than replacing it.
- Removed the active bottom-dock / page-navigation flow. A compact **left control rail** opens Goals and management layers without leaving the campus.
- Founder Goals no longer consume vertical screen space: the nine onboarding milestones live behind a Goals button.
- **Building clicks open a facility popup.** Office staffing, mandates, factory retooling, warehouse state and facility actions happen in that popup.
- Startup Founder Office now represents the Founder/CEO as a permanent virtual slot plus **one real Product-team employee seat**. Office expansion remains a physical growth decision.
- Campus hit-testing now uses the **projected foundation polygon only**. Tall isometric sprites can overlap visually without stealing clicks from another facility.
- New-game Starter Warehouse is standardized to the registered **6×4** warehouse footprint.

### Recruiting loop

Hiring now begins with an external recruiting agency rather than a permanently refreshed candidate shop.

- Choose the role and industry.
- Choose a search depth instead of a talent slider:
  - Quick available search — 2 days / $5k / shallow slate
  - Search online — 7 days / $18k / normal slate
  - Deep search — 21 days / $55k / stronger expected slate
- Search time advances with the simulation; the resulting candidate slate persists for review.
- A future HR department can later internalize or improve this loop without changing its basic interface.

### Product lifecycle

Products now have an explicit player-facing lifecycle:

1. **Design** — product brief, audience hypothesis, positioning, priorities, packaging, development depth, PM and optional IP.
2. **Manufacture** — only after design completes: choose manufacturer / own factory, production standard and first batch.
3. **Sell** — once inventory lands: choose price, audience, retail channels and launch advertising; then explicitly Release.
4. **Analyze** — review sales, revenue, margin, inventory and channel performance; reprice, retarget, change channels, advertise, reorder, commission a post-launch study or create a redesigned V2.

Manufacturer and production standard are locked after the first batch starts. Changing those requires a redesigned next version, while commercial choices can evolve on the live version. Manufacturing completion no longer silently launches a product.

Save schema is now **v12**. Legacy active SKUs migrate as already released; new SKUs use the explicit release state.

See `docs/BATCH11E_CAMPUS_FIRST_PRODUCT_LOOP.md`.

## Company campus

The **Company Campus is the persistent world view**. It is no longer a destination you navigate away from.

- Click a facility's **foundation** to open its context popup; close it to return immediately to the campus.
- Use the left control rail for Goals, Products, People, Market, Finance, Company and History. Those destinations appear as layers over the campus and scroll internally.
- Use the floating **Build** control on the map to place facilities. Pan and zoom remain map interactions.
- Facility popups own physical configuration: staffing offices, assigning product mandates, inspecting warehouse state, retooling factories and demolishing facilities.
- Buildings still determine real simulation capacity: seats, manufacturing, storage, sourcing, operating cost and capability access.

The governing UX rule is now: **the map stays; information comes to the map.**

## UX information architecture

Batch 10 reorganizes screens around player questions rather than engine structure.

- **Products** opens with portfolio health and attention items: stock risk, missing distribution and negative product margin. Troubled products rise to the top and can launch a Post-launch Product Study directly.
- **Finance** starts by answering “why am I making or losing money?” using product contribution, operating spend, net profit and operating cash flow.
- **Businesses** compares active industries using revenue, product margin and main rivals; internal registry/debug information is no longer exposed as player UI.
- **Company HQ** groups Strategy, Brands, Businesses and IP & Licensing into one corporate destination.
- **Market / People / History** remain deep screens, but global navigation no longer requires remembering where they sit in a nested hierarchy.
- Internal implementation language such as engine registries/archetype keys is kept out of normal player-facing copy.

## v0.20.0 — Batch 1: One Company, One Truth

- Removed the legacy `locations` model. The Company Map (`operatingRooms`) is now the only physical infrastructure source of truth.
- Product management, warehouse, owned manufacturing, and outsourcing capacity are derived from physical rooms only.
- Building CAPEX, demolition refunds, and building OPEX are handled through the game state instead of direct UI mutation.
- Personnel can only occupy one compatible office seat at a time; office capacity is enforced centrally.
- Finance and Market Intelligence tiers are derived from staffed Finance/Strategy offices. Abstract department purchasing and duplicate department overhead were removed.
- Inventory UI now reads actual warehouse capacity and reserved/inbound production from the physical footprint.
- Added versioned browser autosave, Continue Company, and manual Save.
- Deleted the obsolete Locations screen and related actions/types.


## v0.30.0 — Batch 2: Kill the Sliders

The product and market UX now exposes business decisions instead of simulation calibration:

- Product creation uses a real target-consumer dropdown; saved segments now determine the SKU's actual demographic target rather than serving as guidance only.
- Added product positioning presets: Value, Mainstream, Premium, Luxury, and Specialist / Performance.
- Product need attributes are configured with 1–5 star priorities instead of continuous 0.00–1.00 sliders.
- Materials quality + production quality are consolidated into a single 1–5 star Manufacturing Standard (Economy → Exceptional).
- Online Readiness was removed as a player input and is now a hidden execution outcome.
- Development is a clear four-level choice: Quick, Standard, Advanced, Breakthrough.
- Packaging is selected directly during design and can still be changed later in Distribution.
- Product price is a currency field, not a range slider.
- Production batch quantity is a numeric input with useful presets and respects cash, warehouse and production/sourcing capacity.
- Future-batch manufacturing changes use the same 1–5 star standard.
- Campaign duration is a dropdown; marketing budget sliders remain because budget is genuinely continuous.
- Removed the meaningless player-controlled Back-office Overhead slider; operating overhead is represented by actual buildings/personnel instead.
- Market Research defaults to saved, recognizable customer segments. The full 648-cell population cube remains available as an Advanced Market Research view.
- Save schema is now v2 and migrates v0.20 saves, including legacy design-depth values and product display metadata.


## v0.40.0 — Batch 3: Complete Skincare Loop

The first full operating loop is now connected end to end around Skincare:

- Outsourced manufacturing uses named partners with distinct cost, lead-time, quality and capacity trade-offs.
- Replenishment is independent from launch state: an active SKU keeps selling from on-hand inventory while the next batch is inbound.
- Distribution is SKU-specific. Each product is assigned to concrete signed retail partners rather than inheriting an average company-wide channel mix.
- Named retailers now affect reach, margins, payment terms, awareness and demographic fit, so Beauty Luxe, ValueMart, Megazon and DTC create genuinely different economics.
- Contract access requires a physical commercial capability; the company website remains the bootstrap route to market.
- Inventory management now shows on-hand units, inbound supply, quarterly demand, lost sales, days of cover, lead time and one-click replenishment guidance.
- Stockouts and low-cover situations generate throttled operating alerts, and lost demand is tracked per SKU.
- Market/financial analysis scales demand back to actual fulfilled sales during stockouts instead of reporting theoretical revenue that was never earned.
- Marketing campaigns have real scope (company / brand / SKU) and can build awareness before launch.
- A lightweight Founder Journey guides the first company through staffing, design, production, distribution, launch, awareness and initial scale without turning the game into a tutorial railroad.
- Save schema is now v3 and migrates v0.30 saves, including legacy channel assignments.

This release is deliberately balanced as a Skincare vertical slice. The next major step is visualizing the operating loop on the Company Map rather than adding another industry immediately.

## v0.50.0 — Batch 4: Make the Company Visible

- Rebuilt Company Map as a living 2.5D corporate campus rather than a functional grid.
- Added distinct procedural building language for offices, factories, warehouses and sourcing offices.
- Buildings now surface real operating state on-map: office occupancy / product development, warehouse utilization, owned production and supplier batches.
- Added lightweight animated staff, logistics trucks, factory activity/smoke and a construction flourish for newly placed facilities.
- Warehouses visually show product packages and the context panel exposes top stored/inbound SKUs.
- Added campus KPI strip for staffed seats, warehouse utilization, production and market flow.
- Double-clicking a building (or using its context action) navigates directly to the relevant management screen.
- Added responsive single-column campus layout for narrower tablet/mobile widths.
- Added clearer facility context, live status chips and operational mini-panels without creating a separate simulation layer.

## v0.60.0 — Batch 5: People Matter
- Named managers/specialists now have age, title, career level, potential, performance, morale and five readable strengths.
- Persistent quarterly talent market replaces random one-click hiring; recruiter searches cost $10k.
- Product/marketing/operations/strategy talent now changes real simulation outcomes.
- Promotions require tenure + performance and create career history.
- Product leads retain launch/development credits; departed staff remain in Company Alumni.
- Rare retirements, voluntary exits and rival poaching can occur over long careers.
- Legacy v0.40/v0.50 saves migrate to save schema v4 and enrich existing staff in place.


## v0.70.0 — Batch 6: Company Chronicle
- Added a permanent Company Chronicle separate from transient operational alerts.
- History is now a top-level area with Chronicle, Annual Reviews, and Records & Legacy views.
- Chronicle events have Notable / Major / Iconic importance so routine activity does not drown out true turning points.
- Product launches, meaningful people changes, first-factory expansion, sales milestones, market-share milestones, revenue milestones and turnarounds are recorded permanently.
- Each completed 360-day year produces an immutable annual review with realized revenue, profit, units, cash, peak share, launches and people changes.
- The current year has a live review preview while it is still in progress.
- Added company records for best-selling product, product contribution, longest-running product, best revenue/profit/share years, longest-serving leader and PM impact.
- Added emergent Product Legacy labels such as Bestseller, Blockbuster, Breakthrough, Cult favorite, Long runner and Commercial disappointment.
- Iconic Moments deliberately remain rare and are surfaced separately from the full timeline.
- Save schema is now v5. v0.60 saves reconstruct prior launch/career history from existing product and personnel data, then track Chronicle data exactly going forward.

## v0.80.0 — Batch 7: Brands, Categories & Growth

- Replaced the single-company-brand assumption with a true brand portfolio: every SKU belongs to a specific brand and each brand keeps its own category/segment equity.
- Added brand positioning (Mass / Premium / Luxury) with real demographic fit and product-positioning coherence, so sister brands can pursue different consumers without sharing one blended reputation.
- New brands require company scale and launch investment; company stages progress from Startup through Emerging, Established, Major Corporation and Enterprise based on realized growth.
- Product creation now selects a brand explicitly, while product cards, warehouse visuals, campaigns and financial analysis preserve brand identity.
- Company/brand campaigns can target an individual brand (`brand:<id>`) instead of treating every brand campaign as company-wide.
- New games begin with a focused Skincare core (Moisturizer, Cleanser, Hydration). Serum, Sunscreen, Anti-Aging, Acne Treatment, Eye Care and Face Masks require funded category-entry projects.
- Category-entry projects consume cash and time, accelerate with Product/Strategy talent, and permanently unlock the capability for every brand once completed.
- Added four new Skincare categories (Sunscreen, Acne Treatment, Eye Care, Face Mask) so deep specialization has meaningful room before multi-industry expansion.
- The Brands & Growth screen now combines company scale, brand portfolio, category expansion, brand-specific equity/perception and company vision.
- Brand equity inheritance is deliberately asymmetric: a new product benefits strongly from its own brand history, modestly from same-brand adjacent categories, and only slightly from sister-brand corporate halo.
- Save schema is now v6. v0.70 saves migrate their original brand, products, equity and campaign scope into the new portfolio structure while retaining the broader category access those games already had.

This release intentionally remains single-industry. It establishes the depth-vs-expansion decision inside Skincare before the first genuinely different industry is added.



## v0.90.0 — Batch 8A: Multi-Industry Foundation

- Added a per-industry business registry to the player company.
- Brands and SKUs now carry an owning `industryId`.
- Separated shared corporate capabilities from industry-specific capabilities.
- Added organic industry-entry projects with cash investment and time-to-build.
- Added the Management → Businesses view with active businesses, shared capabilities and new-industry entry.
- Toys can now be established as a second business foundation, but product gameplay remains intentionally disabled until Batch 8B.
- Wrapped category unlocks/projects per industry while keeping safe compatibility aliases for the current Skincare simulation.
- Save schema upgraded to v7 with v0.80 migration.


## v0.95.0 — Batch 8B.0: Product Engine Foundation

- Added a universal `ProductArchetype` registry. Skincare product definitions are no longer hard-coded inside `industries.ts`; industry configs project their product catalog from the registry.
- Added shared registries for raw materials, manufacturing families and storage profiles.
- Product baseline cost is now derived from a simplified bill of materials (BOM), with a world-level material price index ready for commodity shocks.
- Manufacturing suppliers declare supported process families; outsourced capacity now rejects incompatible products instead of treating every supplier as universal.
- Factories carry manufacturing-family capabilities. Existing/new Skincare factories default to Chemical Mixing + Filling & Packaging; future verticals can define different line families.
- Warehouse capacity is measured in standard-space equivalents and product archetypes define storage footprint per unit. Storage profiles (Standard / Climate / Refrigerated / Frozen / Secure) are part of the same universal schema.
- Retailer fit now includes per-product affinity from archetype data, so changing a product definition can change where it sells best without editing distribution logic.
- Category starter/unlock metadata is generated from the product registry rather than a second hard-coded category list.
- Added lifecycle hooks for repeat purchase, purchase cycle, shelf life, trend sensitivity, seasonality, hit volatility and obsolescence. Only the already-supported lifecycle pieces are active in this foundation release; the remaining hooks are intentionally ready for Toys/Food/Apparel rather than implemented as separate industry engines.
- The Product Creator exposes a compact Product Engine profile (materials, manufacturing, storage and lifecycle) so the underlying config is visible while balancing.
- Businesses now includes a Product Engine Registry summary to make the shared architecture inspectable in-game.
- Save schema upgraded to v8. Existing v0.90 saves gain baseline material indexes plus default factory/storage capabilities without changing booked product history.

The architectural target is now explicit: adding a future product should be mostly archetype data + art/content, with new code reserved for genuinely new optional modules rather than one engine per industry.


## v0.96.0 — Batch 8B: Data-Driven Toys + Universal Product Dynamics

- Added generic `industryMarkets`: every active business receives its own customer cube, competitors, customers, brand equity and fit cache while company Finance consolidates all businesses.
- Toys is now the first fully operational second business without a bespoke `toyMarket` engine.
- Expanded Toys to eight registry-driven archetypes: Building Set, Board Game, Plush Toy, Action Figure, Doll, Toy Vehicle, Collectible and Electronic Toy.
- Added generic Product Design Facets. Toy age group and play fantasy render automatically from archetype data and alter target/attributes without hard-coded Toy UI.
- Added universal seasonality profiles and product momentum/hit volatility. Christmas-heavy products can surge while evergreen products remain steadier.
- Added FIFO inventory lots, shelf-life expiry, commercial ageing and clearance-risk signals.
- Added universal product testing/safety scores plus data-driven recalls.
- Added Toy-capable contract manufacturers whose compatibility comes from manufacturing-family data.
- Product Creator switches catalog, needs, facets, testing and compatible manufacturing automatically from the selected brand/business.
- Retail contracts, campaigns, brand equity and demand are isolated by business where appropriate.
- Factories can be retooled between active business production profiles for CAPEX rather than being permanently tied to the starting industry.
- Company Map, Personnel and History resolve product metadata through the universal registry instead of assuming the primary industry.
- Save schema upgraded to v9; v0.95 saves gain industry market runtimes, inventory lots, testing/safety and momentum defaults.

The architectural proof is now concrete: adding another normal consumer product should mostly mean adding an archetype row/config plus art, with code reserved for genuinely reusable mechanics.


## v0.96 — Batch 8C: Universal IP & Licensing

- Replaced the old fixed, Toy-oriented license list with first-class universal `IPAsset` entities.
- IP now has independent awareness, momentum, prestige, fatigue, audience, ownership and compatible product-family data.
- Added original IP creation. Owned properties start with almost no awareness and gain cultural/commercial value through successful attached products.
- Added a deliberately simple licensing market with 2/3/5-year contracts, minimum guarantees and net-sales royalties.
- Brand and IP are separate layers: a SKU keeps its brand identity while optionally using one owned/licensed IP.
- IP/product compatibility reads the product registry's `ipPotential` plus the IP's compatible family keys; no Toy-specific branch is required.
- Audience fit is evaluated against the same customer cube used by product demand, so an IP can be much stronger with one demographic than another.
- The same IP can power compatible products across multiple industries. External seed properties already include future family keys to exercise that architecture when Food/Apparel arrive.
- Successful products can lift IP awareness, momentum and prestige; overexposure creates fatigue, while dormant original properties gradually cool toward a prestige-based legacy floor.
- Major IP creation/licensing/breakthrough/iconic/value moments are written to the permanent Company Chronicle.
- Owned IP contributes to estimated company value and appears in Finance/Records visibility.
- Save schema upgraded to v10. v0.96 Batch 8B fixed-license saves migrate their old license keys into universal IP contracts without silently stripping the product.

**Foundation is now intentionally closed.** The next planned work is Batch 9 Gameplay & Balance: long-run simulations and playtesting, with no new corporate/product systems unless testing proves a structural gap.

## v0.97 — Batch 9: Gameplay & Balance Pass

Batch 9 deliberately stops adding corporate architecture and focuses on whether the existing systems create learnable business gameplay.

### Difficulty modes
- **Entrepreneur** — $5.0M starting cash, but outside backers expect traction after a one-year grace period. Missing expectations reduces investor confidence and therefore financing availability.
- **Standard** — $2.5M starting cash, moderate expectations and a longer grace period.
- **Bootstrap** — $0.85M starting cash, no investor expectations, and only a small credit line. The challenge is pure runway and cash discipline.

Difficulty does **not** secretly change customer preferences or give competitors unfair demand bonuses. A commercially coherent product works under the same market logic in all three modes.

### Commercial-fit layer
Demand now explicitly evaluates five independent questions for every product / customer segment:
1. Product proposition fit
2. Price fit
3. Distribution/channel fit
4. Brand-positioning fit
5. IP-product-audience transfer

Marketing can create awareness, but it cannot brute-force a fundamentally incoherent proposition. This prevents strategies such as a $200 luxury moisturizer with an irrelevant superhero license sold only through mass retail from succeeding simply because the player spends millions on promotion.

### Post-launch learning
The former Product Diagnosis study is now a **Post-Launch Product Study**. It returns 1–5 star diagnostics for Product, Price, Channel, Brand and IP, identifies the most damaging mismatch, lists supporting issues, and recommends alternative channels. The study reveals information only; it does not buff the product.

Players without an Intelligence department may still buy this post-launch diagnosis from an external consultant, so a failed first product can become useful learning rather than a blind restart.

### Balance principle
The intended loop is: make a hypothesis → launch → observe → investigate failures → apply learning. Strong decisions can compound into meaningful cash generation, while expensive incoherent decisions can burn runway. Early losses are possible, especially for players who do not yet understand an industry, but they should be explainable after research.

## v0.98 — Batch 10: Tycoon UX & Information Architecture

Batch 10 adds no new simulation systems. It reorganizes the existing game so the company itself is the navigation model.

### Campus-first navigation
- Company Campus is now the default/home destination.
- Explore mode turns buildings into direct navigation: click a building and enter the function it represents.
- Manage Campus is a separate editing mode for construction, demolition, staffing, mandates and retooling.
- Added a persistent bottom dock for Campus, Products, People, Market and Finance, with a compact More sheet for Company HQ, Inventory, Distribution, Segments, Marketing and History.
- Removed the old always-visible top-level SaaS-style navigation hierarchy. Local tabs now appear only when they are useful inside a functional area.

### Action-first screens
- Products now opens with portfolio pulse metrics and a prioritized Needs Attention list.
- Products with commercial problems can commission a Post-launch Product Study directly from the portfolio screen.
- Finance begins with a plain-language profit/cash diagnosis instead of requiring the player to infer causes from statements.
- Businesses surfaces comparable operating outcomes across industries and removes internal engine-registry presentation.
- Company HQ provides one corporate home for Strategy, Brands, Businesses and IP & Licensing.

### Cleanup
- Added a compact global operating HUD for cash, quarterly profit/revenue, share, confidence, date, speed and save controls.
- Player-facing copy now uses business concepts rather than implementation terminology.
- Responsive rules keep the bottom dock and major information blocks usable on tablet/mobile.
- Save schema remains v10; this pass changes presentation and navigation, not simulation state.


## v1.0.5 — Capability Gatekeeping, Flow & Balance Audit
Advanced growth now needs believable prerequisites instead of cash alone. Corporate research requires a seated CIO; recruiting requires a compatible open desk; custom segmentation and marketing require commercial staff; production, factory retooling and specialized storage installation require Operations ownership; and advanced market studies require both Market Intelligence technology and Strategy staff. Warehouses can install researched climate/refrigerated/frozen/secure modules, so future cold-chain products are physically gated by infrastructure. IP creation/licensing and second-industry expansion also have explicit organizational owners. The Founder Journey now deliberately creates room for the CIO before research begins, avoiding a circular gate, and the Research screen includes a compact Capability Gate Map. Navigation order remains unchanged. See `docs/V1_0_5_GATEKEEPING_FLOW.md`.
