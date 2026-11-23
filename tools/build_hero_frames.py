#!/usr/bin/env python3
"""
Genera l'animazione della HOME a partire dal video: un MP4 fluido a 60 fps
(assets/hero/hero.mp4) e la sequenza di fotogrammi WebP usata come riserva
quando il browser blocca la riproduzione automatica dei video.

Il video originale ha un taglio netto tra l'ingresso dalla porta (fotogramma 72)
e il salone (fotogramma 73). Qui lo sostituiamo con una transizione "zoom-through":
la camera continua ad avanzare oltre la porta (zoom + sfocatura radiale) mentre il
salone entra in dissolvenza assestandosi, così il passaggio risulta continuo.

Uso:
    python3 tools/build_hero_frames.py percorso/video.mov
Richiede: ffmpeg, Pillow, numpy.
"""
import math
import os
import shutil
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "assets", "hero", "frames")

CUT_LAST_A = 72          # ultimo fotogramma della porta
CUT_FIRST_B = 73         # primo fotogramma del salone
T = 24                   # lunghezza della transizione (fotogrammi sintetici)
A_START = 68             # da qui la porta entra nella transizione
A_ZOOM_FROM = CUT_LAST_A - A_START  # t da cui inizia lo zoom extra sulla porta
B_HOLD = 8               # per t < B_HOLD il salone resta sul primo fotogramma
A_CENTER = (0.46, 0.50)  # punto di fuga oltre la porta (sala da pranzo)
B_CENTER = (0.50, 0.52)
QUALITY = 74
WIDTH = 720
SPEED = 0.8              # velocità del video della Home (0.8 = un po' più lento, più cinematografico)
VIDEO_FPS = 60           # fotogrammi al secondo dopo l'interpolazione di movimento
VIDEO_OUT = os.path.join(ROOT, "assets", "hero", "hero.mp4")


def smoothstep(x):
    x = min(max(x, 0.0), 1.0)
    return x * x * (3 - 2 * x)


def ease_out_cubic(x):
    x = min(max(x, 0.0), 1.0)
    return 1 - (1 - x) ** 3


def zoom(img, s, cx, cy):
    """Ingrandisce img di un fattore s (>=1) attorno a (cx, cy) normalizzati."""
    if s <= 1.0001:
        return img
    w, h = img.size
    cw, ch = w / s, h / s
    x0 = min(max(cx * w - cw / 2, 0), w - cw)
    y0 = min(max(cy * h - ch / 2, 0), h - ch)
    return img.resize((w, h), Image.BICUBIC, box=(x0, y0, x0 + cw, y0 + ch))


def zoom_blur(img, s, cx, cy, amount, samples=12):
    """Zoom con sfocatura radiale (media di più ingrandimenti progressivi)."""
    if amount <= 0.001:
        return to_lin(zoom(img, s, cx, cy))
    acc = None
    for k in range(samples):
        sk = s * (1 + amount * k / (samples - 1))
        arr = to_lin(zoom(img, sk, cx, cy))
        acc = arr if acc is None else acc + arr
    return acc / samples


def to_lin(img):
    return (np.asarray(img, dtype=np.float32) / 255.0) ** 2.2


def to_img(lin):
    lin = np.clip(lin, 0, 1) ** (1 / 2.2)
    return Image.fromarray((lin * 255 + 0.5).astype(np.uint8))


def main(video):
    tmp = tempfile.mkdtemp()
    try:
        subprocess.run(
            ["ffmpeg", "-v", "error", "-i", video, "-vf", f"scale={WIDTH}:-2",
             "-q:v", "1", os.path.join(tmp, "s%04d.png")],
            check=True,
        )
        src = sorted(f for f in os.listdir(tmp) if f.endswith(".png"))
        load = lambda i: Image.open(os.path.join(tmp, src[i])).convert("RGB")

        frames = []  # lista di PIL.Image
        for i in range(A_START):
            frames.append(load(i))

        b_resume = CUT_FIRST_B + (T - B_HOLD)
        for t in range(T):
            a_idx = min(A_START + t, CUT_LAST_A)
            # avanzamento oltre la porta: accelera, poi prosegue
            k = max(0, t - A_ZOOM_FROM)
            za = 1.0
            for j in range(k):
                za *= 1 + 0.10 * 1.05 ** j
            za = min(za, 3.6)
            blur_a = min(0.03 + 0.025 * k, 0.28) if k else 0.0
            a = zoom_blur(load(a_idx), za, *A_CENTER, blur_a)

            b_idx = CUT_FIRST_B + max(0, t - B_HOLD)
            u = ease_out_cubic((t - 7) / (T - 1 - 7))
            zb = 1 + 0.24 * (1 - u)
            blur_b = 0.16 * (1 - u) ** 1.5
            b = zoom_blur(load(b_idx), zb, *B_CENTER, blur_b)

            alpha = smoothstep((t - 7) / 7)
            mix = a * (1 - alpha) + b * alpha
            # bagliore di luce al passaggio: maschera la doppia esposizione
            g = math.sin(math.pi * min(max((t - 5) / 11, 0), 1)) ** 2
            warm = np.array([1.0, 0.86, 0.62], dtype=np.float32)
            mix = mix * (1 + 0.22 * g) + warm * (0.10 * g)
            frames.append(to_img(mix))

        for i in range(b_resume, len(src)):
            frames.append(load(i))

        # video della Home: interpolazione di movimento a 60 fps, leggermente rallentato
        seq = os.path.join(tmp, "seq")
        os.makedirs(seq)
        for n, im in enumerate(frames):
            im.save(os.path.join(seq, f"o{n:04d}.png"))
        vf = (f"setpts=PTS/{SPEED},"
              f"minterpolate=fps={VIDEO_FPS}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,"
              "format=yuv420p")
        subprocess.run(
            ["ffmpeg", "-v", "error", "-y", "-framerate", "24", "-i", os.path.join(seq, "o%04d.png"),
             "-vf", vf, "-c:v", "libx264", "-preset", "slow", "-crf", "22", "-profile:v", "high",
             "-level", "4.1", "-movflags", "+faststart", "-an", VIDEO_OUT],
            check=True,
        )
        print(f"video: {os.path.getsize(VIDEO_OUT) / 1e6:.1f} MB")

        if os.path.isdir(OUT_DIR):
            shutil.rmtree(OUT_DIR)
        os.makedirs(OUT_DIR)
        total = 0
        for n, im in enumerate(frames):
            p = os.path.join(OUT_DIR, f"{n:04d}.webp")
            im.save(p, "WEBP", quality=QUALITY, method=6)
            total += os.path.getsize(p)
        # poster (primo fotogramma) e fotogramma finale con il logo
        frames[0].save(os.path.join(ROOT, "assets", "hero", "poster.webp"), "WEBP", quality=80, method=6)
        frames[-1].save(os.path.join(ROOT, "assets", "hero", "final.webp"), "WEBP", quality=80, method=6)
        print(f"{len(frames)} fotogrammi, {total / 1e6:.1f} MB")
    finally:
        shutil.rmtree(tmp)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1])
