# ClearStock Ghana — logo files

Generated from `assets/logo-source.png` by the commands recorded below.

| File | Use it for |
|---|---|
| `clearstock-logo-1024.png` … `-64.png` | Slides, documents, anywhere on a light background |
| `clearstock-logo-*-tile.png` | Rounded tile with transparent corners — use on coloured or dark backgrounds |
| `clearstock-logo.svg` | Vector, for print or when it must scale large |

## Two honest limitations

**The source artwork is only 439×410 pixels.** Everything larger is upscaled,
so `clearstock-logo-1024.png` has no more real detail than the 512 — it is
smoother, not sharper. For anything printed large, use the SVG.

**There is no flat-background transparent PNG, deliberately.** White is
structural in this logo: the keyline around the price tag, the gap under the
bag handle, and the punched hole are all white. Removing the white background
also removes those, because they connect to it — the mark comes out with holes
in it. The rounded `-tile` files solve the real need instead: transparent
corners, white kept where the artwork needs it.

## About the SVG

Traced from the raster, since no vector original exists. It is a true vector
and scales cleanly, but the tracer flattens the gold gradient on the tag into
a solid gold. Side by side with the PNG at small sizes the difference is hard
to spot; at poster size it is visible.

If whoever designed the logo still has the original Illustrator or Figma file,
export the SVG from there instead — it will keep the gradient and be a fraction
of the file size.
