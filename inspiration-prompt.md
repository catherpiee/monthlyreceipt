# Reverse-engineered prompt — the blue grid-paper journal UI

Paste this back in to reproduce or extend that visual direction.

---

## Short version

> Design a mobile app screen in a soft cornflower-blue-on-graph-paper style. Top half: a pale blue grid-paper panel with a small uppercase letter-spaced eyebrow label and a large rounded-sans headline in saturated royal blue, plus a centred translucent 3D illustration of many thin stacked planes rendered as blueprint-style wireframe layers. A horizontal dashed tear line separates it from the bottom half: a white rounded card with a thin blue border, holding a solid blue rounded date pill, an outline pencil "edit" icon in the top right, and body copy set in a light monospaced handwriting face in medium blue with generous line spacing. Below the copy, a short checklist with hollow circle bullets. A small hand-drawn squiggle sits bottom-right of the card. Whole screen sits inside a thick white rounded phone frame on a very pale grey-blue background. Flat, airy, minimal, no shadows except one soft outer glow on the frame.

---

## Full spec

**Format** — Single mobile app screen mockup, portrait, presented inside a thick white rounded-rectangle phone bezel (~28px radius) floating on a very pale cool-grey background (`#eef1f6`). One soft, wide, low-opacity drop shadow on the frame only.

**Palette**
| Role | Hex |
|---|---|
| Page ground behind frame | `#eef1f6` |
| Grid-paper panel fill | `#e3edfd` |
| Grid rule | `#c6dbf7` |
| Primary blue (headline, pill, ink) | `#2f5fd0` |
| Deep blue (illustration core) | `#1e4fc4` |
| Muted blue-grey (eyebrow) | `#8fa3c4` |
| Card white | `#ffffff` |
| Card border | `#dde7f5` |

**Type**
- Eyebrow: uppercase, ~11px, letter-spacing ~0.18em, weight 500, muted blue-grey (`ACTIVE JOURNEY`).
- Headline: rounded geometric sans, ~40px, weight 700, tight tracking, primary blue (`14 Days`).
- Date pill: rounded sans, ~13px, weight 500, white on solid primary blue, fully rounded, ~10px × 18px padding.
- Body: **light monospaced handwriting face** — even letter widths, round terminals, slightly informal. ~15px, primary blue, line-height ~2.1. This face carries the whole personality of the screen.
- Checklist items: same face, same size, hollow circle bullets (~5px, 1.5px stroke, no fill).

**Layout, top to bottom**
1. Grid-paper panel, full bleed to the frame's rounded corners, ~35% of screen height. Graph rule every ~26px, both axes, hairline.
2. Eyebrow, then headline, both left-aligned with ~28px inset from the frame edge.
3. Centred hero illustration: 15–20 thin square planes stacked in isometric-ish perspective, each translucent royal blue with a lighter edge highlight, offset slightly so the stack reads as slightly irregular. Blueprint/wireframe feel, not photoreal.
4. A full-width **horizontal dashed line** (~4px dash, ~5px gap, primary blue) acting as a tear-off perforation between panel and card.
5. White card, ~16px inset from the frame edges, ~18px corner radius, 1px `#dde7f5` border, no shadow.
6. Inside the card, top row: date pill left, outline pencil-with-underline icon right (1.5px stroke, primary blue).
7. Two body paragraphs separated by one blank line's worth of space.
8. `Reminders:` label, then three checklist rows.
9. A small hand-drawn blue squiggle (a lazy S / tilde stroke, ~1.5px, rounded caps) tucked into the bottom-right of the card as a signature flourish.

**Feel** — Airy, flat, considered. Everything is blue on white or blue on pale blue; there is no second accent colour. Whitespace does the work. The perforation and the graph rule are the only textures.
