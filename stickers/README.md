# Sticker art

Transparent PNGs (and a few JPGs) live here and show up in the sticker
tray. The tray reads the list in [`../stickers.js`](../stickers.js) —
that file is the single source of truth for what appears, in what order.

**To add a sticker:** drop the file in this folder, then add one line to
`../stickers.js`:

```js
{ id: "sticker-52", src: "stickers/your-file.png" },
```

**To remove one:** delete its line from `../stickers.js` (the file can
stay in this folder, it just won't show up).

**To reorder the tray:** reorder the lines in `../stickers.js`.

If a listed file ever goes missing, that slot shows a plain placeholder
tile instead of a broken image — see `placeholderSticker()` in
`../stickers.js`.
