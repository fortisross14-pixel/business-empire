# Business Empire v1.9.1 — Product Reviews & Market Learning

## Design rule

The simulation now separates three outcomes:

1. **Product review** — how good the product itself is, expressed as a familiar decimal
   score from 1.0 to 5.0.
2. **Sales volume** — how many customers can be reached and converted through audience size,
   product fit, price, IP, awareness, channels and inventory.
3. **Margin** — the value captured after manufacturing cost and channel cut. A small audience
   that loves a product can justify premium pricing and direct channels without becoming a
   mass-market hit.

A 4.5-star specialist product can therefore sell few units at a high margin. A 2.4-star value
product can sell large volume at a low price. Neither outcome is automatically better.

## Product-review progression

| Project class | Intended review band | Hard ceiling | Meaning |
| --- | ---: | ---: | --- |
| A | 1.5–2.5 typical | 2.9 | Early products improve through better focus and talent but remain visibly startup-grade. |
| AA | 2.8–3.8 typical | 4.1 | Mature products; the very best AA work can cross 4.0. |
| AAA | 3.5–4.7 typical | 5.0 | Flagship products; 4.8–4.9 requires top execution and 5.0 is an exceptional deterministic roll. |

The score is frozen when design completes. It contains a small deterministic execution
variation, so save/reload cannot reroll the result. Manufacturing quality still changes cost,
delivered quality, satisfaction and recalls, but does not rewrite the revealed product review.

## Market-study loop

The study evaluates the SKU against the audience currently targeted when the report finishes.
It calculates:

- that audience's strongest product priorities and the priority stars used in the SKU;
- quality sensitivity versus value/price sensitivity;
- whether a category with strong IP potential is missing licensed appeal;
- the audience's preferred channel and whether the SKU is present there;
- whether a strong review is being wasted on a value market or can support a premium niche;
- whether sales or contribution are being pressured by a shrinking target audience, low awareness,
  material inflation or accumulated stock-outs;
- why the product review was limited: project class, team execution, diluted priorities or
  validation depth.

Every finding names an action. For example:

> Mass-market toy customers care more about value and licensed appeal than another increment
> of extreme quality. Put more priority stars into Licensed, attach a relevant IP, test a lower
> price and add marketplace distribution.

The report remains attached to the SKU after archiving. When the player designs another product
in the same category, the creator displays retained lessons and marks only directly applied
priority/IP decisions as complete. There is no automatic design-quality increase.

## Save migration

Schema 22 derives a deterministic review for every existing SKU from its stored project class
and design quality. Existing numeric category-learning history is retained as research coverage
for achievements and compatibility, but no longer affects product statistics.

## Targeted QA

- Reveal several A designs and verify decimal scores vary but never exceed 2.9.
- Reveal top AA designs and verify scores can approach 4.1 but do not exceed it.
- Reveal top AAA designs and verify 4.8–4.9 is possible while 5.0 remains exceptional.
- Compare a high-review narrow product against a lower-review broad value product; verify review,
  sales and contribution can rank differently.
- Complete a study, confirm the SKU's review/design quality does not change, and inspect named
  priority, IP, price, channel, quality and margin lessons.
- Archive the SKU and confirm the report remains visible.
- Start its next version and confirm lessons reappear without changing sliders automatically.
