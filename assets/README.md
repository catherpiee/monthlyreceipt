# assets/paper.png

This is the actual receipt background — Albert's own Canva design
(646 × 1422px), not a generated texture. The heading, "SEE YOU NEXT
MONTH", and the barcode are baked into these pixels; the app only draws
the parts that change on top of it (month/name, answers, cardholder, and
the handle).

The original design also had a handle baked in at the very bottom. That
text was painted over with a same-size patch of clean paper (copied from
elsewhere in the same photo) so the app can print *your* handle there
instead — dynamically, from the `HANDLE` constant in `questions.js` —
rather than permanently showing someone else's.

## If you swap in different art

`.receipt` in `style.css` locks its aspect ratio to this file's
646 : 1422, so it never stretches or crops — swap the file and update
that ratio to match the new image's actual width/height.

The overlay positions (`.r-content`, `.r-handle` in `style.css`) are
percentages measured directly off this image — where the blank writing
area starts/ends, and where the patched-out handle sits. New art needs
those percentages re-measured:

1. Open the new image, note its pixel height.
2. Find the row just below the heading's last descender, and the row
   just above "SEE YOU NEXT MONTH" starts — those become `.r-content`'s
   `top` / `bottom` (as `% = row / image height`).
3. Find (or make) a blank band for the handle, patch out any baked-in
   text there the same way, and set `.r-handle`'s `top` to that band's
   vertical center as a percentage.

## assets/loading.gif

Not included yet — drop an image or gif here with this exact filename
and it shows on the brief loading screen between "Print receipt" and
seeing the actual receipt (~1.4s, see `LOADING_MS` in `app.js`). Until
then that screen just shows a plain spinner instead of a broken image.

