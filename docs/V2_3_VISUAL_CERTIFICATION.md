# Business Empire v2.3 — Full Visual Certification

This release completes the game-wide presentation pass. The target is a colorful,
readable management game rather than an enterprise dashboard: a visual campus as the
emotional anchor, a small number of obvious actions per screen, and deeper information
revealed through tabs and contextual workspaces.

## Certified screen matrix

| Player area | Certified surfaces | Primary outcome |
| --- | --- | --- |
| Entry | Title, Continue, Campaign, Scenarios, Sandbox, setup forms | Visual mode choice, readable setup and touch-safe launch flow |
| Campaign | Career map, case cards, goals, restrictions, submission, result | Live-company assignments feel authored and progression is legible |
| Campus | Map, build menu, placement, hover, facility sheet, pulse, move, expand, demolish | Construction states are mutually exclusive and usable on phone |
| Products | Portfolio, Summary, Versions, Sales, Market, Operations, creator | One exact product stays in context while detail is progressively disclosed |
| Product moments | New product, batch arrival, launch, week-one result, breakout, recall | Major milestones pause play and become memorable reveals |
| Market | Portfolio/product scope, trends, competitors, segments, customers, news | Analytics always state which product or portfolio is being discussed |
| Marketing | Audience, promoted scope, agency fit, budget, duration, active campaigns | Campaign creation reads as four clear business decisions |
| People | Employees, candidates, recruiting, training, promotion, release | Hiring and development use visual cards and explicit consequences |
| Research | Capability branches, active work, category expansion | Requirements, unlocks and recommended next research are visible |
| Company | Executive hub, roadmap, strategy, brands, businesses, IP | Management choices are split into focused, visual workspaces |
| Operations | Inventory, distribution, retailer contracts, product routes | Capacity, supply risk and channel assignment are decision-first |
| Finance | Overview, statements, capital, product economics, intelligence | Company health and per-product value creation are separated clearly |
| History | Chronicle, annual review, records, achievements, outcomes, decisions | A run becomes a persistent company story rather than transient toasts |
| Events | Notification queue, decision events, rival moves, achievements | Simultaneous events are queued; high-impact events remain modal |

## Responsive contract

### Laptop / landscape pointer

- Persistent top HUD and left navigation rail.
- Full-width workspaces with multi-column cards and visual analytics.
- Hover, selection, press and keyboard-focus feedback.
- Campus and overlay positions account for the two-row medium-width HUD.

### Tablet / landscape or portrait touch

- HUD reflows without hiding the business pulse.
- Secondary tabs scroll horizontally rather than wrapping unpredictably.
- Dense cards collapse from five/four columns to three/two columns.
- Core targets remain at least 44px and map sheets avoid the navigation rail.

### Phone / portrait touch

- Fixed two-row HUD and bottom navigation.
- Operational overlays occupy the safe viewport and scroll internally.
- Modals become bottom sheets with sticky close/actions where relevant.
- Product tabs retain labels; competitors and metrics stack instead of forcing desktop widths.
- Campus build, pulse, placement and facility states cannot cover one another.

## Interaction and accessibility contract

- Major actions use tactile hover/press feedback and visible focus rings.
- Escape closes supported modal and map layers; modal focus is trapped where required.
- Motion has a `prefers-reduced-motion` fallback.
- Destructive actions require confirmation and explain the operational consequence.
- Essential body copy is 12px or larger in primary workspaces; compact metadata remains
  subordinate but receives responsive readability overrides.
- Product, competitive and campaign popups use semantic dialog/status roles and labels.

## Functional corrections included in certification

- Notifications use a queue instead of replacing all but the latest event.
- Capital actions report failed outcomes as errors rather than success.
- Finance's pre-simulation empty state now receives its intended visual treatment.
- Campaign results render above every other modal layer.
- Campus Build/Pulse/Move/Expand modes cancel conflicting states.
- Phone task chips no longer collide with overlays or duplicate one another.

## Validation

- TypeScript: `npm run typecheck`
- Production: `npm run build`
- Production preview: root document and generated UI assets return HTTP 200.
- Static asset audit: every directly referenced `/assets/...` UI file exists.
- Screen inventory: all routes in `Game.tsx`, all setup flows, modal components and map
  secondary panels are included in the matrix above.

Vite reports a non-blocking large-chunk warning. It affects initial download size, not
correctness; route-level code splitting is an appropriate optimization for a later release.
