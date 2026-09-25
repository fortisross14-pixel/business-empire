# v1.4 — Living Campus

The campus is now an operating visualization of the company rather than a static collection
of building sprites.

## State communication

- Warehouse buildings show pooled utilization and escalate from healthy to warning and
  critical states.
- Factories and sourcing facilities show live batches, idle capacity, or a blocked state
  when Operations ownership is missing.
- Research, Marketing, Brand, Consumer Insights, HR and Product facilities surface their
  real projects, campaigns, searches and design progress.
- Map nameplates use an explicit hierarchy: active, ready, idle, attention, blocked and
  critical. Attention markers pulse without hiding the authored building art.

## Campus Pulse

Campus Pulse summarizes office occupancy, storage pressure, production capacity, active
products, incomplete product flows and every facility requiring intervention. Selecting an
attention item opens that exact building.

## Construction feedback

Build placement now shows the complete authored building as a transparent valid/invalid
preview. Successful construction and expansion reveal the building over several seconds,
with a short construction flourish. The grid, coordinates, footprints and existing saves
remain compatible.

Desktop and mobile continue to share the same map. On compact screens Pulse and facility
details behave as bounded sheets rather than forcing the campus off-screen.
