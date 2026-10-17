"""Grafiki do Google Play: ikona 512x512 (bez przezroczystości) i grafika promocyjna 1024x500.

Uruchom z katalogu projektu:  python scripts/play-grafiki.py
Wynik trafia do play-assets/. Kolory i znak cudzysłowu pochodzą z public/icon-512.png.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'play-assets'
FONTS = Path('C:/Windows/Fonts')

# Te same przystanki co gradient w public/favicon.svg
STOPS = [(0.0, (124, 58, 237)), (0.55, (217, 70, 239)), (1.0, (34, 211, 238))]
TLO = (10, 10, 15)  # backgroundColor aplikacji


def kolor(t):
    for (t0, c0), (t1, c1) in zip(STOPS, STOPS[1:]):
        if t <= t1:
            f = (t - t0) / (t1 - t0)
            return tuple(round(a + (b - a) * f) for a, b in zip(c0, c1))
    return STOPS[-1][1]


def gradient(w, h):
    """Gradient po przekątnej, jak linearGradient x1=0 y1=0 x2=1 y2=1 w SVG."""
    im = Image.new('RGB', (w, h))
    px = im.load()
    for y in range(h):
        for x in range(w):
            px[x, y] = kolor((x / (w - 1) + y / (h - 1)) / 2)
    return im


def ikona():
    # Pełny kwadrat z jednym gradientem — Play sam zaokrągla rogi, a przezroczystość odrzuca.
    out = gradient(512, 512)
    znak = znak_cudzyslowu()
    # ta sama pozycja znaku co w oryginalnej ikonie
    src = Image.open(ROOT / 'public' / 'icon-512.png').convert('RGBA')
    pozycja = maska_bieli(src).getbbox()[:2]
    out.paste(Image.new('RGB', znak.size, (255, 255, 255)), pozycja, znak)
    out.save(OUT / 'ikona-512.png')
    return out


def znak_cudzyslowu():
    """Maska białego znaku „ z ikony — ten sam kształt co w aplikacji."""
    maska = maska_bieli(Image.open(ROOT / 'public' / 'icon-512.png').convert('RGBA'))
    return maska.crop(maska.getbbox())


def maska_bieli(src):
    maska = Image.new('L', src.size, 0)
    sp, mp = src.load(), maska.load()
    for y in range(src.height):
        for x in range(src.width):
            r, g, b, a = sp[x, y]
            jasnosc = min(r, g, b)  # biały ~255, gradient ma któryś kanał niski
            if a > 0 and jasnosc > 150:
                mp[x, y] = min(255, round((jasnosc - 150) / 105 * 255))
    return maska


def grafika_promocyjna():
    W, H = 1024, 500
    out = Image.new('RGB', (W, H), TLO)
    # miękka poświata w kolorach marki
    blask = gradient(W, H).filter(ImageFilter.GaussianBlur(2))
    alfa = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(alfa)
    d.ellipse((-260, -320, 640, 560), fill=150)
    d.ellipse((520, 120, 1300, 760), fill=110)
    alfa = alfa.filter(ImageFilter.GaussianBlur(120))
    out.paste(blask, (0, 0), alfa)

    # duży, półprzezroczysty znak cudzysłowu po prawej jako motyw tła
    znak = znak_cudzyslowu()
    skala = 320 / znak.height
    znak = znak.resize((round(znak.width * skala), 320), Image.LANCZOS)
    znak = ImageOps.expand(znak, border=24, fill=0)  # margines, żeby rozmycie nie ucinało boków
    # powiększona mała maska ma schodki — rozmycie + próg + lekkie rozmycie dają gładką krawędź
    znak = znak.filter(ImageFilter.GaussianBlur(4)).point(lambda v: 255 if v > 128 else 0)
    znak = znak.filter(ImageFilter.GaussianBlur(1.2)).point(lambda v: round(v * 0.18))
    out.paste(Image.new('RGB', znak.size, (255, 255, 255)), (W - znak.width - 70, 90), znak)

    # mała ikona aplikacji nad tytułem
    ik = ikona().resize((96, 96), Image.LANCZOS)
    rogi = Image.new('L', ik.size, 0)
    ImageDraw.Draw(rogi).rounded_rectangle((0, 0, 95, 95), radius=22, fill=255)
    x = 88
    out.paste(ik, (x, 92), rogi)

    d = ImageDraw.Draw(out)
    tytul = ImageFont.truetype(str(FONTS / 'georgiab.ttf'), 88)
    podtytul = ImageFont.truetype(str(FONTS / 'georgiai.ttf'), 34)
    drobne = ImageFont.truetype(str(FONTS / 'segoeui.ttf'), 27)
    d.text((x - 4, 206), 'Sentencja', font=tytul, fill=(255, 255, 255))
    d.text((x, 322), 'Słynne cytaty, ich autorzy i epoki', font=podtytul, fill=(233, 225, 255))
    d.text((x, 384), '969 cytatów  ·  351 autorów  ·  26 tematów  ·  offline',
           font=drobne, fill=(196, 181, 253))
    out.save(OUT / 'grafika-promocyjna-1024x500.png')


if __name__ == '__main__':
    OUT.mkdir(exist_ok=True)
    ikona()
    grafika_promocyjna()
    for p in sorted(OUT.glob('*.png')):
        im = Image.open(p)
        print(p.name, im.size, im.mode)
