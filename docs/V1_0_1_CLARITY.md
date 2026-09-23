# Business Empire v1.0.1 — Clarity & Detail Pass

## Goal
Improve the first completed release by removing small but costly moments of player confusion. The core rule for this pass is: **if an action is unavailable, the interface must say why; if an action commits money, the interface must show the money before confirmation.**

## Manufacturing
- Manufacturing availability is now calculated from the production route and supplier currently selected in the modal, fixing a stale-route preview bug.
- Added a manufacturing order summary with batch size, unit cost, total order cost, lead time, available capacity, delivered quality and post-order cash.
- The first-batch CTA includes the total cost.
- Missing sourcing capacity, warehouse space, cash or compatible factory capacity is displayed directly under the disabled action.
- Reorders use the same quote logic and blocker copy.

## People
- Added local `Hiring` and `Employees` subtabs.
- Hiring contains agency brief, active search countdown and candidate slate.
- Employees contains the permanent roster.
- Office seat assignment stays on the campus facility popup.

## Disabled-action explanations
Added explicit reasons to high-value disabled actions across Products, Product Creator, Segments, Distribution, IP/Licensing and Campus building/upgrade flows.

## Compatibility
- App version: 1.0.1
- Save schema: v13 (unchanged)
- Existing v1.0.0 saves remain compatible.
