# ClearStock Ghana — logo files

Generated from `assets/logo-source.png` by the commands recorded below.

| File | Use it for |
|---|---|
| `clearstock-logo-1024.png` … `-64.png` | Transparent background — works on any colour |
| `clearstock-logo-*-tile.png` | White rounded tile — for photos or busy backgrounds |
| `clearstock-logo.svg` | Vector, transparent, for print or large sizes |

## Two honest limitations

**The source artwork is only 439×410 pixels.** Everything larger is upscaled,
so `clearstock-logo-1024.png` has no more real detail than the 512 — it is
smoother, not sharper. For anything printed large, use the SVG.

**The white outline is part of the mark, not background.** The logo has a
white keyline around it, a hole through the bag handle, and a punched hole in
the tag. Cutting out every white pixel eats the keyline and leaves the mark
full of gaps — so only background beyond the keyline is made transparent.
The `-tile` files put it back on a white rounded tile, for photos or busy
backgrounds where a transparent mark would get lost.

## About the SVG

Traced from the raster, since no vector original exists. It is a true vector
and scales cleanly, but the tracer flattens the gold gradient on the tag into
a solid gold. Side by side with the PNG at small sizes the difference is hard
to spot; at poster size it is visible.

If whoever designed the logo still has the original Illustrator or Figma file,
export the SVG from there instead — it will keep the gradient and be a fraction
of the file size.
