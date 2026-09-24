#!/usr/bin/env python3
"""Cut a 1:1 crop from a render.

  python3 tools/make_crop.py FRAME.png X Y W H OUT.png

writes OUT.png, the W x H pixels at (X, Y) of FRAME.png copied without
resampling, as an 8-bit RGB PNG with an sRGB chunk and no ICC profile. The
site shows it 1:1 at every pixel ratio and makes no smaller copy. X, Y, W and
H must be even (the site's crop rule), so the half-size layout of the crop
falls on whole CSS pixels. The script prints the entry for _data/renders.yml;
fill in game, scene, preset, signal and alt.

Needs Pillow.
"""
import sys

from PIL import Image
from PIL.PngImagePlugin import PngInfo


def srgb_info():
    info = PngInfo()
    info.add(b"sRGB", b"\x00")  # perceptual rendering intent
    return info


def make_crop(frame, x, y, w, h, out):
    """Write the crop; returns (frame size, crop size)."""
    for name, v in (("x", x), ("y", y), ("width", w), ("height", h)):
        if v < 0 or v % 2:
            raise ValueError(f"{name} {v} must be even and not negative")
    with Image.open(frame) as im:
        if x + w > im.width or y + h > im.height:
            raise ValueError(f"crop ({x}, {y}, {w}x{h}) leaves the {im.width}x{im.height} frame")
        size = im.size
        rgb = im.convert("RGB").crop((x, y, x + w, y + h))
    crop = Image.frombytes("RGB", rgb.size, rgb.tobytes())  # no metadata from the source
    crop.save(out, pnginfo=srgb_info(), optimize=True)
    return size, crop.size


def main(argv):
    if len(argv) != 7:
        print(__doc__)
        return 2
    frame, x, y, w, h, out = argv[1], *map(int, argv[2:6]), argv[6]
    size, _ = make_crop(frame, x, y, w, h, out)
    print(f"""some-id:
  file: {out}
  full: {frame}
  crop: [{x}, {y}, {w}, {h}]
  frame: [{size[0]}, {size[1]}]
  game:
  scene:
  preset:
  signal:
  alt:""")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
