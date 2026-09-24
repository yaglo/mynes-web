#!/usr/bin/env python3
"""Tests for tools/make_crop.py. Run: python3 -m unittest discover -s tools -p 'test_*.py'"""
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    from PIL import Image
    import make_crop
except ImportError:  # Pillow missing
    Image = None
import imagefiles as media  # noqa: E402


@unittest.skipUnless(Image, "Pillow not installed")
class MakeCrop(unittest.TestCase):
    def test_crop_is_a_copy_and_alone(self):
        with tempfile.TemporaryDirectory() as tmp:
            frame = os.path.join(tmp, "frame.png")
            src = Image.frombytes("RGB", (40, 30), bytes((x * 7 + y * 3 + c * 50) % 256
                                                          for y in range(30) for x in range(40) for c in range(3)))
            src.info["icc_profile"] = b"x"
            src.save(frame)
            out = os.path.join(tmp, "crop.png")
            size, crop_size = make_crop.make_crop(frame, 4, 6, 20, 10, out)
            self.assertEqual((size, crop_size), ((40, 30), (20, 10)))
            with Image.open(out) as c:
                self.assertEqual(c.convert("RGB").tobytes(), src.crop((4, 6, 24, 16)).tobytes())
            self.assertEqual(sorted(os.listdir(tmp)), ["crop.png", "frame.png"])  # no smaller copy
            kinds = [k for k, _d in media.png_chunks(out)]
            self.assertIn("sRGB", kinds)
            self.assertNotIn("iCCP", kinds)

    def test_odd_or_outside_crops_are_refused(self):
        with tempfile.TemporaryDirectory() as tmp:
            frame = os.path.join(tmp, "frame.png")
            Image.new("RGB", (40, 30)).save(frame)
            with self.assertRaises(ValueError):
                make_crop.make_crop(frame, 1, 0, 10, 10, os.path.join(tmp, "a.png"))
            with self.assertRaises(ValueError):
                make_crop.make_crop(frame, 0, 0, 10, 9, os.path.join(tmp, "a.png"))
            with self.assertRaises(ValueError):
                make_crop.make_crop(frame, 32, 0, 10, 10, os.path.join(tmp, "a.png"))


if __name__ == "__main__":
    unittest.main()
