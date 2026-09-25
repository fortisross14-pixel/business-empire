# Business Empire v1.9 — Balance, Playability & Replayability

This pass is the final systems/QA release before the v2.0 expansion into new products and
industries. It focuses on removing player friction, making failure recoverable and legible,
and ensuring that two competent runs do not follow the same script.

## Problems found and implemented solutions

| Area | Player problem | v1.9 solution |
| --- | --- | --- |
| Campus layout | A misplaced building was permanent. | Every facility, including the Founder Office, can be moved to a connected parcel for a small visible contractor cost. Staff, upgrades and mandates stay intact. |
| Demolition | One click could destroy an operational dependency. | Demolition now has a confirmation step, shows the 25% recovery value, and blocks occupied rooms, active training, live production/sourcing, and warehouse removal when remaining storage cannot hold the stock. |
| Expansion | Players could confuse expansion with an invisible numerical upgrade. | Expansion remains a physical placement action and its larger required footprint is explained beside Move and Demolish. |
| Portfolio clutter | Old or failed SKUs accumulated forever. | Product filters separate Portfolio, On market, Pipeline and Archive. Finished SKUs can be archived and restored without erasing their commercial record. |
| Failed inventory | A weak product could trap the player indefinitely. | Clear Stock & Archive recovers 25% of inventory cost and writes off the rest. The loss is explicit and ends the operational burden. Inbound batches still have to arrive first. |
| Early product sameness | A good early designer produced nearly the same A-tier design as a weak one. | A-tier quality cap increased and the formula now weights team skill and priorities more strongly. Design quality also affects live demand, so product craft matters commercially. |
| Failure recovery | Research explained failure but did not help the next attempt. | The post-launch study now retains named customer-preference, IP, price, quality and channel lessons on the SKU and shows them in the next brief. It never rewrites the current product or grants an invisible quality bonus. |
| Research friction | A recovery study was too slow and expensive for a struggling startup. | Post-launch studies cost $30k and take 10 base days. Repeated studies refresh the diagnosis as the commercial plan changes. |
| Revenue dead zone | A credible first launch could wait too long for meaningful demand. | Founder discovery is slightly stronger and remains fit-weighted. It gives a launch a chance, not guaranteed success; product, price, channel, quality and inventory still determine conversion. |
| Event punishment | Fixed six-figure choices could be trivial for a large company and fatal for a small one. | Event cash stakes now scale from current cash and revenue within safe floors and caps. There are no hidden demand bonuses or competitor cheats. |
| Repeated runs | Event order was mostly derived from the calendar and company counts. | Each company now stores a run seed that changes decision timing and selection. The seed is visible in Achievements & Legacy. |
| Emergent strategy | Market events mostly changed global numbers. | Unexpected Audience selects a real, commercially promising but non-obvious segment for one SKU and can retarget it. Logistics Disruption selects a real outsourced batch and changes its remaining lead time. |
| Achievement feedback | New recovery tools had no long-term recognition. | Learning Loop and Portfolio Editor achievements recognize studying a launch and curating the portfolio. |
| Starting-cash clarity | The default scenario silently reduced the difficulty's advertised opening cash. | Difficulty now owns starting cash exactly. Only the explicitly leveraged Turnaround modifies the balance sheet. |

## Intended outcome bands

The market simulation is identical across difficulties; difficulty changes starting capital
and visible investor expectations, never hidden customer or rival behavior.

| Player pattern | Intended result |
| --- | --- |
| Advanced | Strong talent, focused priorities, coherent price/channel/target and disciplined reorders can produce a profitable early hit. The player is rewarded for understanding the systems, not for waiting. |
| Average | A coherent but unoptimized launch can remain around break-even, produce a modest hit, or miss depending on the product/market draw and run events. The cash buffer supports one meaningful correction. |
| Poor | Bad positioning, price, distribution and oversized inventory can consume runway and force debt, clearance or failure. The cause is visible in product economics and the post-launch study. |
| Recovering | A failed SKU can be studied, cleared and archived. Its retained lessons remain available, but the player must deliberately apply them in the next brief and commercial plan. |

## Replayability rules

- Market generation, competitor behavior and the event deck remain systemic rather than a
  scripted campaign.
- A run seed changes event order and timing while keeping save/reload deterministic.
- Event effects target authoritative simulation state: a concrete SKU, audience, batch,
  delivery timer, awareness, momentum, cost or confidence value.
- Event choices have different cash/strategy trade-offs and are stored permanently in the
  decision history.
- No event grants hidden AI information or changes demand according to difficulty.

## Validation checklist

- Move a staffed/upgraded facility and verify its state is unchanged.
- Attempt to demolish an occupied office, active factory, active sourcing office and needed
  warehouse; verify a specific blocker is shown.
- Demolish an idle facility, verify confirmation and the displayed recovery amount.
- Archive a zero-stock finished SKU, restore it, and confirm its lifetime history remains.
- Clear and archive a stocked SKU; verify cash recovery, inventory removal and campaign stop.
- Complete two studies of the same SKU; verify the retained diagnosis refreshes without
  changing that SKU's review score or design quality.
- Build the next product in that category; verify learned actions appear in the creator and
  only become applied when the player changes priorities, IP or project decisions.
- Trigger Unexpected Audience and verify only the selected SKU is retargeted.
- Trigger Logistics Disruption and verify the selected inbound timer changes.
- Start two companies and verify their run identifiers and event order differ.
- Load a schema-20/21 save and verify archive, review, study and seed fields migrate safely.
