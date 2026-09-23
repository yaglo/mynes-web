"""File facts the media checks need, without dependencies: PNG chunks and
size, AVIF size and colour (CICP), and the 2x2 box average of a PNG.
"""
from __future__ import annotations

import struct
import zlib


def png_chunks(path):
    """[(type, data)] of a PNG file; raises ValueError when it is not a PNG."""
    with open(path, "rb") as f:
        data = f.read()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError(f"{path}: not a PNG file")
    out = []
    i = 8
    while i + 8 <= len(data):
        n, kind = struct.unpack(">I4s", data[i:i + 8])
        out.append((kind.decode("latin-1"), data[i + 8:i + 8 + n]))
        i += 12 + n
        if kind == b"IEND":
            break
    return out


def png_size(path):
    for kind, data in png_chunks(path):
        if kind == "IHDR":
            return struct.unpack(">II", data[:8])
    raise ValueError(f"{path}: no IHDR chunk")


def _boxes(data, start, end):
    i = start
    while i + 8 <= end:
        size, kind = struct.unpack(">I4s", data[i:i + 8])
        head = 8
        if size == 1:
            size = struct.unpack(">Q", data[i + 8:i + 16])[0]
            head = 16
        elif size == 0:
            size = end - i
        if size < head:
            break
        yield kind.decode("latin-1"), i + head, i + size
        i += size


def avif_info(path):
    """{'width', 'height', 'cicp': (primaries, transfer, matrix, full_range) or None}
    from the first ispe and nclx colr properties of an AVIF file."""
    with open(path, "rb") as f:
        data = f.read()
    info = {"width": None, "height": None, "cicp": None}

    def walk(start, end):
        for kind, a, b in _boxes(data, start, end):
            if kind == "meta":
                walk(a + 4, b)
            elif kind in ("iprp", "ipco"):
                walk(a, b)
            elif kind == "ispe" and info["width"] is None:
                info["width"], info["height"] = struct.unpack(">II", data[a + 4:a + 12])
            elif kind == "colr" and info["cicp"] is None and data[a:a + 4] == b"nclx":
                p, t, m = struct.unpack(">HHH", data[a + 4:a + 10])
                info["cicp"] = (p, t, m, data[a + 10] >> 7)
    walk(0, len(data))
    if not data[4:8] == b"ftyp":
        raise ValueError(f"{path}: not an ISO BMFF (AVIF) file")
    return info


def _unfilter(raw, width, height, bpp):
    stride = width * bpp
    out = bytearray(height * stride)
    prev = bytearray(stride)
    i = 0
    for y in range(height):
        ft = raw[i]
        line = bytearray(raw[i + 1:i + 1 + stride])
        i += 1 + stride
        if ft == 1:
            for x in range(bpp, stride):
                line[x] = (line[x] + line[x - bpp]) & 255
        elif ft == 2:
            for x in range(stride):
                line[x] = (line[x] + prev[x]) & 255
        elif ft == 3:
            for x in range(stride):
                left = line[x - bpp] if x >= bpp else 0
                line[x] = (line[x] + ((left + prev[x]) >> 1)) & 255
        elif ft == 4:
            for x in range(stride):
                a = line[x - bpp] if x >= bpp else 0
                b = prev[x]
                c = prev[x - bpp] if x >= bpp else 0
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                line[x] = (line[x] + (a if pa <= pb and pa <= pc else b if pb <= pc else c)) & 255
        out[y * stride:(y + 1) * stride] = line
        prev = line
    return out


def read_rgb(path):
    """(width, height, bytes of 8-bit RGB) of a PNG. Uses Pillow when it is
    installed, else decodes 8-bit RGB or RGBA non-interlaced files itself."""
    try:
        from PIL import Image
        with Image.open(path) as im:
            im = im.convert("RGB")
            return im.width, im.height, im.tobytes()
    except ImportError:
        pass
    chunks = png_chunks(path)
    ihdr = next(d for k, d in chunks if k == "IHDR")
    w, h, depth, ctype, _c, _f, interlace = struct.unpack(">IIBBBBB", ihdr)
    if depth != 8 or ctype not in (2, 6) or interlace:
        raise ValueError(f"{path}: needs Pillow for this PNG (depth {depth}, colour type {ctype})")
    bpp = 3 if ctype == 2 else 4
    raw = zlib.decompress(b"".join(d for k, d in chunks if k == "IDAT"))
    px = _unfilter(raw, w, h, bpp)
    if bpp == 4:
        px = bytes(b for i, b in enumerate(px) if i % 4 != 3)
    return w, h, bytes(px)


def reduce2(w, h, rgb):
    """The exact 2x2 box average of Image.reduce(2): (a + b + c + d + 2) // 4 per channel."""
    if w % 2 or h % 2:
        raise ValueError(f"the 2x2 average needs even dimensions, got {w}x{h}")
    ow, oh = w // 2, h // 2
    out = bytearray(ow * oh * 3)
    row = w * 3
    for y in range(oh):
        r0 = 2 * y * row
        r1 = r0 + row
        o = y * ow * 3
        for x in range(ow):
            i = x * 6
            for c in range(3):
                s = rgb[r0 + i + c] + rgb[r0 + i + 3 + c] + rgb[r1 + i + c] + rgb[r1 + i + 3 + c]
                out[o + x * 3 + c] = (s + 2) // 4
    return ow, oh, bytes(out)


def max_difference(a: bytes, b: bytes) -> int:
    if len(a) != len(b):
        raise ValueError("different sizes")
    try:
        import numpy as np
        return int(np.abs(np.frombuffer(a, np.uint8).astype(np.int16) - np.frombuffer(b, np.uint8)).max(initial=0))
    except ImportError:
        return max((abs(x - y) for x, y in zip(a, b)), default=0)


def reduce2_file(path):
    """(width, height, rgb) of Image.reduce(2) of a PNG file."""
    try:
        from PIL import Image
        with Image.open(path) as im:
            small = im.convert("RGB").reduce(2)
            return small.width, small.height, small.tobytes()
    except ImportError:
        return reduce2(*read_rgb(path))
