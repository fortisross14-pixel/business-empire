# Business Empire v1.0.2 — Empty Lot & Founder Company

## Design goal
The first minutes should feel like founding a company, not inheriting one. A new run starts with cash, an empty parcel and a campus entrance. The player physically creates the first path, places the first office, creates the first brand and hires people into real desks.

## Opening loop
1. Extend the campus path from the fixed entrance.
2. Place the 4-position Founder Office beside the connected path.
3. Create the founding brand and logo in-game.
4. Search for and sign a Product Designer into an open Founder Office desk.
5. Design the first product.
6. Hire a Sourcing / Operations specialist into another open desk.
7. Build a warehouse and order the first outsourced batch.
8. Hire a Marketing specialist into the final startup desk.
9. Prepare price, channel, target and launch marketing.
10. Release and win the first customers.

## Campus construction
- Paths are 1×1 tiles and cost $250 each.
- Every new path must connect back to the campus entrance network.
- Buildings use their declared footprints and must sit adjacent to a connected path.
- Buildings cannot overlap paths or other facilities.
- Placement uses the same isometric tile grid as hit-testing.

## Founder Office
The first Office placed is normalized into `founder-office` with 4 positions:
- Position 1: Founder / CEO (virtual, permanently occupied).
- Positions 2–4: flexible startup staff desks.

The Founder Office can host any early role so the startup does not need several specialized buildings before it can make its first sale. Its first expansion adds four staff positions (8 total). Full office-tier progression is a later batch.

## Employment contracts
Agency searches still generate candidate slates. Selecting a candidate now opens a contract review where the player chooses a compatible office with a free desk before signing. The signed employee is immediately assigned to that physical workspace.

## Save migration
Schema v14 adds `campusPaths`. Existing saves receive a connected legacy access network so their current buildings remain usable. Existing products and brands are preserved.

## Explicitly deferred
- A / AA / AAA product scales and multi-person product teams (v1.03).
- Technology / capability research tree and wider building unlock progression (v1.04).
