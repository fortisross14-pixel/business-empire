# v1.3 — Product Moments

This release begins turning the product lifecycle into a sequence of memorable executive
decisions rather than a quiet status change in a spreadsheet-like interface.

## Product interruption cards

The following events pause the simulation and open a visual product card:

- **New Product** — product design is complete and manufacturing can begin.
- **First Batch Arrived** — inventory is in the warehouse; the player can set up price,
  channels and launch.
- **Product on the Market** — the SKU is commercially live; the player is told that the
  first market signal will arrive after one simulated week.
- **Launch Week Review** — seven days after launch, the card uses live results to show units
  sold, net sales after channel margin, and initial category share.
- **Market Breakout** and **Product Alert** — existing breakout and recall events now demand
  executive attention instead of competing with ordinary notifications.

Each card has two deliberate outcomes: remain paused after acknowledging it, or open the
specific product in the Products view. Multiple product moments are queued so no decision
is silently lost when several are generated together.

## Save behaviour

`launchWeekReported` is optional on an SKU. New products use it to ensure a first-week review
is emitted only once. A legacy SKU already launched for more than two weeks is marked as
reviewed without generating a historical alert, preserving calm save resumption.

No save schema migration is required.
