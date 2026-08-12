# Monthly Receipt

A little app that turns your month into a printed receipt. Answer a few
questions, cover it in stickers, save the image, share it.

No build step, no framework, no dependencies. Plain HTML/CSS/JS.

## Files

| File | What it's for | Edit this when… |
|---|---|---|
| `questions.js` | The question bank | you rewrite the prompts in your own voice |
| `stickers.js` | The sticker tray manifest | you add/remove/rename sticker art |
| `stickers/` | The actual PNG files | you have art to drop in — see `stickers/README.md` |
| `style.css` | All visual styling | you want to change colors, spacing, layout |
| `app.js` | App logic (state, rendering, export) | you're changing behaviour, not just words or art |
| `index.html` | Page structure only | rarely — it's mostly a shell around the above |

`app.js` is organised top-to-bottom in the order things happen: storage →
form → receipt model → receipt rendering → stickers → PNG export → view
switching. Numbered section comments mark each part.

## Run it locally

Any static file server works. From this folder:

```bash
python3 -m http.server 8791
```

Then open `http://localhost:8791`. (Opening `index.html` directly by
double-clicking also works for most things, but the sticker `<img>` tags
and `navigator.share` need a real `http://` origin to behave — use the
server for anything sticker- or export-related.)

If you use VS Code, the **Live Server** extension does the same thing with
auto-reload — right-click `index.html` → *Open with Live Server*.

## State

Everything is saved in the browser's `localStorage`, one entry per month
(`monthly-receipt:2026-08`, etc.). There's no backend and no account —
clearing site data clears your receipts. That's a deliberate trade for
"zero setup, just open a link."

## Deploying (GitHub Pages / Vercel)

This folder is already what a static host expects — no build step.

**GitHub Pages:** push this folder to a repo, then in Settings → Pages set
the source to the branch/folder this lives in.

**Vercel:** `vercel` from this folder (or connect the repo in the
dashboard) — it'll detect a static site automatically, no config needed.

## More context

- [`PRD.md`](PRD.md) — what this is, what's built, what's still a gap
- [`inspiration-prompt.md`](inspiration-prompt.md) — the reverse-engineered
  prompt for the original blue journal-card reference image
