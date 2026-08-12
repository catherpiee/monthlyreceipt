# Loading photos

Your own pictures, shown inside the little receipt that prints on the
loading screen (between "Print receipt" and the finished receipt).

Drop images in this folder, then list them in `LOADING_PHOTOS` at the top
of `../../questions.js`:

```js
const LOADING_PHOTOS = [
  "assets/loading/one.jpg",
  "assets/loading/two.jpg",
];
```

The loading screen picks the next one each time, so they cycle rather
than always showing the same shot.

Guidelines:
- **Roughly square or portrait** works best — the slot is a small printed
  photo inside the receipt, and very wide images get cropped to fill it.
- Anything web-friendly is fine (jpg/png/webp). Keep them reasonably
  small (under ~500KB each) so the loading screen isn't waiting on a
  download.

Leave `LOADING_PHOTOS` empty and the receipt still prints its lines and
barcode — it just skips the photo, no broken image.
