# Business Empire v1.0.0 — First Complete Release

## Release definition

v1.0 means the first complete playable iteration: the existing company-building loop is coherent, major player jobs have canonical homes, and the game is usable on desktop, tablet and phone. It does **not** mean feature-complete forever.

## Mobile certification targets

### Permanent HUD
- Cash, quarterly profit and quarterly revenue remain visible.
- Play/pause, speeds and date remain reachable.
- Active work is represented by a compact tappable chip.

### Campus
- Campus consumes the remaining viewport below the HUD.
- Primary navigation moves to the phone bottom edge.
- Facility selection uses the foundation hitbox.
- Facility details open as a bottom sheet.
- Build/zoom/recenter controls remain touch accessible.

### Operational layers
- Products, People, Market, Finance, Company and History use a full-width mobile overlay.
- Close is always visible.
- Local tabs scroll horizontally instead of wrapping into multiple header rows.
- Content scroll stays inside the overlay so the campus does not move behind it.

### Product lifecycle
Design → Manufacture → Sell → Analyze remains fully operable on phone. The two-step Product Creator is presented as a mobile bottom sheet and all inputs remain usable without landscape orientation.

### Dense data
Wide financial and research tables get local horizontal scrolling. Summary information still reflows into phone-width cards.

### Touch ergonomics
Core floating controls, overlay close buttons and modal controls use practical touch sizes. Safe-area padding prevents controls from sitting under mobile browser/device UI.

## Compatibility
- Save schema: v13
- Existing v0.99.6 saves remain compatible.
- No simulation architecture was added or removed in the v1.0 mobile pass.
