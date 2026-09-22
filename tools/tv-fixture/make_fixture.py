#!/usr/bin/env python3
"""Write the synthetic manifest v2 fixture for the television switcher.

The files exercise every path of assets/js/tv-switcher.js before the showcase
pipeline has produced real v2 media: stage clips at 1920x1440 and 960x720 in
HDR (HEVC Main10 and AV1, PQ, BT.2020) and SDR (H.264), 3840x2880 lens clips,
an HDR AVIF still with a lossless PNG next to it, and presets that have no
lens clip or no full-resolution capture at all.

Every size is rendered from the same 256x240 test scene, each at its own
resolution, with a one-pixel RGB mask aligned to the output pixels, so a
browser that resamples a clip shows grey where the stripes should be. Frame N
of each clip carries the number N and a block that moves 3 scene pixels per
frame, which makes drift between stage and lens visible. The white square at
the top right is 4x SDR white in the HDR files.

Needs ffmpeg (libx264, libx265, libsvtav1), ffprobe, avifenc, numpy, Pillow.
Run from the site root:

    python3 tools/tv-fixture/make_fixture.py

"""
import json
import os
import subprocess
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
REL = os.path.relpath(HERE, ROOT)          # tools/tv-fixture, site-root relative

RATE = "150247/2500"                       # 60.0988 fps, NTSC NES
FPS = 150247 / 2500
FRAMES = 60
STILL_FRAME = 30
WHITE_NITS = 203.0
HEADROOM = 4.0

MASKS = {
    # name: per-pixel RGB mask builder (w, h) -> (h, w, 3)
    "grille": lambda w, h: _stripes(w, h, 0),
    "slot": lambda w, h: _stripes(w, h, 2),
    "dots": lambda w, h: _dots(w, h),
}


def _stripes(w, h, slot_rows):
    x = np.arange(w)
    m = np.full((h, w, 3), 0.12, np.float32)
    for c in range(3):
        m[:, x % 3 == c, c] = 1.0
    if slot_rows:
        # Slot mask: every fourth row is dark, staggered between triads.
        y = np.arange(h)[:, None]
        triad = (x // 3)[None, :]
        dark = ((y + 2 * (triad % 2)) % 4) == 0
        m[dark] *= 0.25
    return m


def _dots(w, h):
    x = np.arange(w)[None, :]
    y = np.arange(h)[:, None]
    m = np.full((h, w, 3), 0.1, np.float32)
    phase = (x + (y // 2 % 2) * 1) % 3
    for c in range(3):
        m[..., c] = np.where(phase == c, 1.0, 0.1)
    m[(y % 2 == 1).repeat(w, 1)] *= 0.35
    return m


DIGITS = {
    "0": "111101101101111", "1": "010110010010111", "2": "111001111100111",
    "3": "111001111001111", "4": "101101111001001", "5": "111100111001111",
    "6": "111100111101111", "7": "111001001001001", "8": "111101111101111",
    "9": "111101111001111",
}


def scene(n, tint):
    """Linear-light BT.709 scene at NES resolution; 1.0 is SDR white."""
    s = np.zeros((240, 256, 3), np.float32)
    s[150:166, 16:240] = np.array(tint, np.float32) * 0.8     # floor
    x0 = (n * 3) % 208 + 16
    s[118:150, x0:x0 + 32] = (0.95, 0.35, 0.12)               # moving block
    s[40:64, 200:224] = HEADROOM                               # highlight above SDR white
    # Frame counter, 3x5 digits at 4x scale.
    for i, ch in enumerate("%03d" % n):
        bits = DIGITS[ch]
        for r in range(5):
            for c in range(3):
                if bits[r * 3 + c] == "1":
                    y, x = 40 + r * 4, 32 + i * 16 + c * 4
                    s[y:y + 4, x:x + 4] = 1.0
    return s


def render(n, w, h, mask, tint):
    """The scene rendered at w x h: beam profile per scanline, mask per output pixel."""
    s = scene(n, tint)
    ys = (np.arange(h) * 240) // h
    xs = (np.arange(w) * 256) // w
    img = s[ys][:, xs]
    frac = ((np.arange(h) + 0.5) * 240 / h) % 1.0             # position inside the scanline
    beam = np.exp(-((frac - 0.5) / 0.32) ** 2).astype(np.float32)
    return img * beam[:, None, None] * mask * 2.2


def srgb8(lin):
    v = np.clip(lin, 0.0, 1.0)
    v = np.where(v <= 0.0031308, v * 12.92, 1.055 * np.power(v, 1 / 2.4) - 0.055)
    return (v * 255 + 0.5).astype(np.uint8)


M709_2020 = np.array([[0.6274, 0.3293, 0.0433],
                      [0.0691, 0.9195, 0.0114],
                      [0.0164, 0.0880, 0.8956]], np.float32)


def pq16(lin):
    rgb = np.clip(lin @ M709_2020.T, 0.0, None) * WHITE_NITS / 10000.0
    m1, m2, c1, c2, c3 = 0.1593017578125, 78.84375, 0.8359375, 18.8515625, 18.6875
    p = np.power(np.clip(rgb, 0, 1), m1)
    e = np.power((c1 + c2 * p) / (1 + c3 * p), m2)
    return (e * 65535 + 0.5).astype("<u2")


def encode(path, w, h, mask, tint, hdr, codec, crf):
    pix_in = "rgb48le" if hdr else "rgb24"
    matrix = "bt2020" if hdr else "bt709"
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", pix_in, "-s", f"{w}x{h}",
           "-r", RATE, "-i", "-", "-vf", f"scale=out_color_matrix={matrix}:out_range=tv,"
           f"format={'yuv420p10le' if hdr else 'yuv420p'}"]
    if codec == "hevc":
        params = "log-level=error:keyint=300"
        if hdr:
            params += (":hdr10=1:repeat-headers=1:colorprim=bt2020:transfer=smpte2084:colormatrix=bt2020nc"
                       f":max-cll={int(HEADROOM * WHITE_NITS)},{int(WHITE_NITS / 4)}"
                       ":master-display=G(13250,34500)B(7500,3000)R(34000,16000)WP(15635,16450)L(10000000,1)")
        else:
            params += ":colorprim=bt709:transfer=bt709:colormatrix=bt709"
        cmd += ["-c:v", "libx265", "-tag:v", "hvc1", "-crf", str(crf), "-preset", "medium", "-x265-params", params]
    elif codec == "av1":
        cmd += ["-c:v", "libsvtav1", "-crf", str(crf), "-preset", "8", "-g", "300"]
        if hdr:
            # SVT-AV1 writes colour and HDR metadata only from its own parameters.
            cmd += ["-svtav1-params",
                    "color-primaries=bt2020:transfer-characteristics=smpte2084:matrix-coefficients=bt2020-ncl"
                    ":color-range=studio:mastering-display=G(0.265,0.690)B(0.150,0.060)R(0.680,0.320)"
                    f"WP(0.3127,0.3290)L(1000,0.0001):content-light={int(HEADROOM * WHITE_NITS)},{int(WHITE_NITS / 4)}"]
    else:
        cmd += ["-c:v", "libx264", "-crf", str(crf), "-preset", "slow", "-profile:v", "high", "-g", "300"]
    if hdr:
        cmd += ["-color_primaries", "bt2020", "-color_trc", "smpte2084", "-colorspace", "bt2020nc"]
    else:
        cmd += ["-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709"]
    cmd += ["-color_range", "tv", "-an", "-movflags", "+faststart", path]
    # SVT-AV1 prints its configuration at info level; errors only.
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, env=dict(os.environ, SVT_LOG="1"))
    m = MASKS[mask](w, h)
    for n in range(FRAMES):
        lin = render(n, w, h, m, tint)
        proc.stdin.write((pq16(lin) if hdr else srgb8(lin)).tobytes())
    proc.stdin.close()
    if proc.wait():
        sys.exit(f"ffmpeg failed for {path}")


def probe(path):
    out = subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_frames",
                                   "-show_entries", "stream=codec_name,profile,level,width,height,nb_read_frames",
                                   "-of", "json", path])
    return json.loads(out)["streams"][0]


def codecs_string(info, hdr):
    """Browser codecs parameter from ffprobe fields."""
    name, level = info["codec_name"], int(info["level"])
    if name == "hevc":
        return f"hvc1.{2 if hdr else 1}.{4 if hdr else 6}.L{level}.B0"
    if name == "av1":
        return f"av01.0.{level:02d}M.10.0.110.09.16.09.0" if hdr else f"av01.0.{level:02d}M.08"
    return "avc1.6400%02x" % level


def media_entry(rel, hdr):
    path = os.path.join(ROOT, rel)
    info = probe(path)
    if int(info["nb_read_frames"]) != FRAMES:
        sys.exit(f"{rel}: {info['nb_read_frames']} frames, expected {FRAMES}")
    return {"src": rel, "type": f'video/mp4; codecs="{codecs_string(info, hdr)}"', "hdr": hdr,
            "width": info["width"], "height": info["height"], "bytes": os.path.getsize(path)}


def still(dir_rel, mask, tint):
    w, h = 3840, 2880
    lin = render(STILL_FRAME, w, h, MASKS[mask](w, h), tint)
    png = os.path.join(ROOT, dir_rel, "still-sdr.png")
    Image.fromarray(srgb8(lin)).save(png, optimize=True)
    pq_png = os.path.join(ROOT, dir_rel, "still-pq16.tmp.png")
    # Pillow cannot write 16-bit RGB PNGs; ffmpeg can.
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb48le", "-s", f"{w}x{h}",
                          "-i", "-", "-frames:v", "1", "-pix_fmt", "rgb48be", pq_png], stdin=subprocess.PIPE)
    p.stdin.write(pq16(lin).tobytes())
    p.stdin.close()
    if p.wait():
        sys.exit("ffmpeg failed writing the PQ PNG")
    avif = os.path.join(ROOT, dir_rel, "still-hdr.avif")
    subprocess.check_call(["avifenc", "--cicp", "9/16/9", "--depth", "10", "--yuv", "444", "-q", "60",
                           "-s", "6", pq_png, avif], stdout=subprocess.DEVNULL)
    os.remove(pq_png)
    return {"hdr": f"{dir_rel}/still-hdr.avif", "sdr": f"{dir_rel}/still-sdr.png",
            "width": w, "height": h, "frame": STILL_FRAME}


def poster(dir_rel, name, w, h, mask, tint):
    lin = render(0, w, h, MASKS[mask](w, h), tint)
    Image.fromarray(srgb8(lin)).save(os.path.join(ROOT, dir_rel, name), lossless=True, method=6)
    return f"{dir_rel}/{name}"


def clip(game, preset, mask, tint, stage, lens=(), with_still=False, poster_sizes=((960, 720),)):
    d = f"{REL}/{game}/{preset}"
    os.makedirs(os.path.join(ROOT, d), exist_ok=True)
    out = {}
    posters = [{"src": poster(d, "poster.webp" if i == 0 else f"poster-{w}.webp", w, h, mask, tint),
                "width": w, "height": h} for i, (w, h) in enumerate(poster_sizes)]
    # A single poster is written as a plain path, the shape the handoff's manifest v2 uses.
    out["poster"] = posters[0]["src"] if len(posters) == 1 else posters
    out["stage"] = []
    for w, h, hdr, codec, crf in stage:
        name = f"stage-{w}-{'hdr-' + codec if hdr else 'sdr'}.mp4"
        encode(os.path.join(ROOT, d, name), w, h, mask, tint, hdr, codec, crf)
        out["stage"].append(media_entry(f"{d}/{name}", hdr))
    if lens:
        out["lens"] = []
        for hdr, codec, crf in lens:
            name = f"lens-{'hdr' if hdr else 'sdr'}-{codec}.mp4"
            encode(os.path.join(ROOT, d, name), 3840, 2880, mask, tint, hdr, codec, crf)
            out["lens"].append(media_entry(f"{d}/{name}", hdr))
    if with_still:
        out["still"] = still(d, mask, tint)
    if any(s["hdr"] for s in out["stage"]):
        out["hdr"] = {"white_nits": WHITE_NITS, "headroom": HEADROOM,
                      "max_cll": int(HEADROOM * WHITE_NITS), "max_fall": int(WHITE_NITS / 4)}
    print(f"{game}/{preset}: {sum(os.path.getsize(os.path.join(ROOT, d, f)) for f in os.listdir(os.path.join(ROOT, d)))} bytes")
    return out


def main():
    both = lambda w, h: [(w, h, True, "hevc", 30), (w, h, True, "av1", 50), (w, h, False, "h264", 30)]
    clips = {
        "test-pattern": {
            "fixture_grille": clip("test-pattern", "fixture_grille", "grille", (0.25, 0.55, 1.0),
                                   both(1920, 1440) + both(960, 720),
                                   lens=[(True, "hevc", 32), (True, "av1", 55), (False, "hevc", 32)],
                                   with_still=True, poster_sizes=((960, 720), (1920, 1440))),
            "fixture_slot": clip("test-pattern", "fixture_slot", "slot", (0.35, 0.9, 0.3),
                                 [(1920, 1440, True, "hevc", 30), (1920, 1440, False, "h264", 30),
                                  (960, 720, True, "hevc", 30), (960, 720, False, "h264", 30)],
                                 with_still=True),
            "fixture_dots": clip("test-pattern", "fixture_dots", "dots", (0.9, 0.8, 0.3),
                                 [(1920, 1440, False, "h264", 30), (960, 720, False, "h264", 30)]),
        },
        "small-clip": {
            "fixture_grille": clip("small-clip", "fixture_grille", "grille", (0.9, 0.3, 0.6),
                                   [(960, 720, False, "h264", 30)]),
        },
    }
    manifest = {
        "version": 2, "fps": round(FPS, 4), "aspect": [4, 3],
        "presets": [
            {"id": "fixture_grille", "name": "Aperture grille", "blurb": "Lens clip, still and HDR stage clips"},
            {"id": "fixture_slot", "name": "Slot mask", "blurb": "Still only, no lens clip"},
            {"id": "fixture_dots", "name": "Dot mask", "blurb": "SDR stage clips only, no full-resolution capture"},
            {"id": "fixture_missing", "name": "Not rendered", "blurb": "Listed without clips"},
        ],
        "games": [
            {"id": "test-pattern", "title": "Test pattern", "scene": f"Moving block, frame counter, {FRAMES} frames",
             "default_preset": "fixture_grille"},
            {"id": "small-clip", "title": "960 only", "scene": "One 960x720 SDR clip",
             "default_preset": "fixture_grille"},
        ],
        "clips": clips,
    }
    with open(os.path.join(HERE, "manifest.json"), "w") as f:
        json.dump(manifest, f, indent=1)
        f.write("\n")
    total = 0
    for dirpath, _dirs, files in os.walk(HERE):
        total += sum(os.path.getsize(os.path.join(dirpath, n)) for n in files)
    print(f"fixture total: {total} bytes")


if __name__ == "__main__":
    main()
