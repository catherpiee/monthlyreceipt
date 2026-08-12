# Monthly Receipt — PRD

**Status:** v1 built · **Owner:** Albert · **Last updated:** August 6, 2026

---

## 1. Summary

Monthly Receipt turns a short set of end-of-month questions into a stylised **printed receipt** — one answer per line item, a barcode, and a TOTAL you write yourself. You then cover it in stickers and save it as an image to share.

It is **not** a real-receipt scanner or an expense tracker. Nothing is uploaded, nothing is scanned, and no number on it is money. You type everything in.

---

## 2. Inspiration

| Reference | What we took |
|---|---|
| Blue grid-paper journey UI | Palette (periwinkle on grid paper), dashed rules, torn-paper edges, mono type feel |
| Blue moodboard (moon, polaroids, tape, charms) | The sticker library that goes on top |
| "Beatopia" playlist receipt | The literal output: title block → dashed rule → line items → ITEM COUNT / TOTAL → card-auth block → barcode → footer message |

---

## 3. Decisions locked in

| Question | Decision |
|---|---|
| Platform | Mobile web app, works on desktop too. No app store. |
| Journaling scope | Monthly only. No daily diary, no streak counter. |
| Timeframe | Every question is month-scoped ("how many friends did you see **this month**") |
| Accounts | None. Everything saves in the browser (`localStorage`). Send friends a link. |
| Sharing | Native share sheet on mobile, PNG download everywhere else |
| TOTAL line | Free text — you write the punchline yourself |
| Stickers | Fixed packs supplied by Albert (transparent PNGs). Placeholders shipped for now. |

---

## 4. What's built

**Three screens:**

1. **Home** — "Create your monthly receipt!" + a *Let's go* button, over an animated mini-receipt that prints itself in. Says "Pick up where you left off" if the month is already part-filled.
2. **Form** — 10 questions + a TOTAL field. All optional, 22-char cap on text answers (so lines fit the receipt), autosaves on every keystroke, progress meter at the top.
3. **Receipt + decorate** — the receipt renders from your answers; sticker tray slides up from the bottom; drag to move, corner handle to resize + rotate, × to delete. *Save image* exports a 1080px-wide PNG.

**Other:**
- Month picker in the header (last 12 months); each month is its own receipt.
- Light and dark themes. The receipt paper stays white in both — it's paper.
- Skipped questions print nothing (no blank lines).

---

## 5. Receipt layout

```
        MONTHLY RECEIPT
          AUGUST 2026
    PRINTED 06.08.26  14:52
- - - - - - - - - - - - - -
FAVOURITE FOOD ··· TONKOTSU RAMEN
FAVOURITE SONG ·· THE PERFECT PAIR
FRIENDS SEEN ················· 7
...
- - - - - - - - - - - - - -
ITEM COUNT:                   10
TOTAL:                  WORTH IT
- - - - - - - - - - - - - -
CARD #:                 ****6797
AUTH:                     001006
LABEL:                SELF ISSUED

     ▌▌▎▌▎▌▌▎▎▌▌▎▌▎▌▌▎▌▎▌
        001006256797
    ♡ SEE YOU NEXT MONTH ♡
```

The CARD/AUTH block and barcode are decorative — derived from a hash of the month, never real card data.

---

## 6. Question bank

Edit the `QUESTIONS` array at the top of the script to change these.

| # | Prompt | Receipt label | Type |
|---|---|---|---|
| 1 | What was your favourite thing you ate this month? | FAVOURITE FOOD | text |
| 2 | What song did you have on repeat? | FAVOURITE SONG | text |
| 3 | How many friends did you see this month? | FRIENDS SEEN | number |
| 4 | A film or show you watched? | WATCHED | text |
| 5 | Something you read, or started reading? | READING | text |
| 6 | Best thing that happened? | BEST MOMENT | text |
| 7 | A new place you went? | NEW PLACE | text |
| 8 | Your mood most days? | MOOD | pick |
| 9 | Rate the month out of five. | MONTH RATING | pick (prints `4/5`) |
| 10 | What do you want more of next month? | NEXT MONTH | text |
| — | Sum up the whole month in a few words. | TOTAL | text |

---

## 7. Technical notes

- Single HTML file, no build step, no dependencies, no network calls. Host it anywhere static (GitHub Pages, Netlify, Vercel) or just open the file.
- State: `localStorage`, one key per month (`monthly-receipt:2026-08`), holding answers + sticker transforms.
- Export: the canvas painter **measures the live DOM** and repaints each text box, rule, and barcode at 1080px wide. What you see is what you get, and there's no third-party rasteriser to break.
- Sticker positions are stored as fractions of the stage, so they survive window resize.

---

## 8. Known gaps

1. **Real sticker art** — currently placeholder SVGs. Replace the `STICKERS` array with `{ id, src }` pointing at your PNGs.
2. **No history browser** — past months are reachable via the header picker, but there's no thumbnail grid.
3. **No undo** — delete is immediate.
4. **No reminder** — nothing nudges you at month end.
5. **Data is device-local** — clearing browser data loses everything. Fine for a fun project; would need accounts to fix.
6. **No pinch-to-zoom** — the corner handle covers resize + rotate instead.

---

## 9. If it takes off (not now)

- Daily entries that auto-fill the monthly receipt, plus the streak card from the inspiration image.
- User-uploaded stickers.
- Alternate templates: a "date night" receipt, a "year in review" receipt.
