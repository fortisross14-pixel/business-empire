# Visual Polish Pass

## Audit

The strongest prototype signals were not missing content; they were inconsistent visual decisions. Screens used several near-identical whites, borders, radii and shadows, so hierarchy was hard to read. Product cards put a detailed package mock, brand mark and IP badge in the same small area without a clear reading order. The logo generator had too many shape and motif combinations, which made small marks feel noisy. The campus had good asset hooks but needed stronger plot contrast, grounding shadows, selection treatment and reserved space around navigation chrome.

## Direction

Business Empire should feel like a polished management sim: credible corporate tools presented with friendly toy-like clarity. The interface is bright, calm and information-dense. The campus is the emotional anchor; operations screens are quieter and more structured.

- **Palette:** cool mineral backgrounds, warm white panels, navy ink, restrained blue-teal action color, violet for selected/strategic state, green/amber/red for status only.
- **Typography:** use a humanist sans for UI copy (`Trebuchet MS`, then the platform sans fallback). Use monospace only for money, quantities and dates. Headings are compact and confident; labels are uppercase only for metadata.
- **Spacing:** use 4 / 8 / 12 / 16 / 24px rhythm. Keep dense panels to 12-18px padding and avoid single-pixel clusters of unrelated controls.
- **Radii:** 7px for controls and small chips, 10px for inputs and buttons, 14px for cards/panels, 18px only for hero product or modal framing.
- **Shadows:** use a low shadow for controls, a soft card shadow for repeated content and a stronger float shadow only for sheets, menus and selected context.

## Component rules

- **Buttons:** one primary action per region. Primary buttons use blue-teal; secondary buttons use warm white; selected controls use violet. Disabled controls stay readable and must explain the blocker below or in a tooltip.
- **Tabs:** tabs are compact, horizontally scrollable on mobile, and use a single active fill. Do not use a different pill style for every screen.
- **Status chips:** status is a short label with a tinted background and border. Use color plus text; never use color alone.
- **Cards:** repeated cards use the same border, radius and shadow. Put the item name first, then state, then the visual, then metrics or action. Avoid cards inside cards unless the inner item is a genuinely separate object.
- **Panels:** panels group a workflow, not decorative content. Section headers use one title and a short supporting sentence. Tables should be quiet and let the strongest value carry the contrast.
- **Empty and locked states:** show what is missing, why it matters and the next canonical action. Avoid vague “unavailable” copy.

## Logo system

Brand marks are a small geometric badge plus a two-letter monogram. Shapes are limited to square, circle, hex and shield. Motifs are restrained: orbit, stripe, spark and leaf. A logo must remain legible at 16-22px, so the monogram is the primary signal and the motif is secondary texture. Use one base color and one light accent; avoid gradients with more than two meaningful color stops.

Product identity is a lockup: brand mark/name at the top of the package, optional IP badge offset to the opposite side, product form below, product category at the bottom. The brand and IP should not compete for the same visual area.

## Product visuals

Product visuals are generated from a small set of packaging silhouettes and a deterministic palette. The silhouette communicates category; the brand color communicates ownership; the accent communicates packaging or IP. Future product art should replace the silhouette inside the same frame rather than changing card layout. Every product card should expose name, lifecycle stage and one useful performance signal without opening the detail view.

## Campus art direction

- The lot is a distinct bounded parcel with visible but quiet isometric grid lines.
- Roads are darker and more neutral than grass; buildings sit on a concrete apron and cast a soft footprint shadow.
- Assets use a bottom-center ground anchor. The visible base must sit on the simulation footprint, not float above it.
- Selection is a violet foundation outline and a subtle tinted footprint, not a heavy glow around the entire sprite.
- Labels are short, high-contrast nameplates attached to the building context. Status bars belong below the label, not over the art.
- Keep the entrance and first road visually legible as the campus origin. Frame the playable parcel with enough empty breathing room for future buildings.

## Future asset guidance

- **Buildings:** transparent PNG/WebP, consistent camera angle, bottom-center ground contact, no baked UI labels, and a documented simulation footprint and scale.
- **Products:** transparent or clean-background pack shots with a clear silhouette, one dominant face, controlled highlights and no baked brand text that duplicates the UI lockup.
- **Logos:** flat, geometric, two-color maximum, recognizable at 16px, and supplied with a monochrome fallback.
- **Map decor:** use a few repeatable anchors such as landscaping, signage and loading equipment. Decor should reinforce circulation and scale, not fill every empty tile.
- **Do not generate large one-off libraries** until a new asset proves that the shared frame, palette and interaction system cannot express the required category.
