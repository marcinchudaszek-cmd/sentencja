"""Zrzuty ekranu do Google Play z wersji webowej (ten sam kod co w APK).

Uruchom z katalogu projektu:  python scripts/play-zrzuty.py
Edge bez okna, okno 500x975 przy skali 2.16 (poniżej ~500 px Edge bez okna ucina układ) -> 1080x2106 (proporcja 1:1,95; Play przyjmuje do 1:2).
Wynik: play-assets/screenshots-play/.
"""
import subprocess
import sys
import tempfile
import time
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'play-assets' / 'screenshots-play'
EDGE = Path('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe')
BAZA = 'https://marcinchudaszek-cmd.github.io/sentencja/#'

EKRANY = [
    ('01-start', '/'),
    ('02-cytat', '/cytat/d001'),
    ('03-losuj', '/losuj'),
    ('04-odkrywaj', '/odkrywaj'),
    ('05-os-czasu', '/os-czasu'),
    ('06-studio', '/studio/a025'),
]


def zrzut(nazwa, trasa, profil):
    plik = OUT / f'{nazwa}.png'
    plik.unlink(missing_ok=True)
    subprocess.run([
        str(EDGE), '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
        f'--user-data-dir={profil}', '--window-size=500,975', '--force-device-scale-factor=2.16',
        '--virtual-time-budget=8000', f'--screenshot={plik}', BAZA + trasa,
    ], capture_output=True, timeout=120)
    for _ in range(30):  # Edge bywa szybszy w zwracaniu sterowania niż w zapisie pliku
        if plik.exists() and plik.stat().st_size > 0:
            break
        time.sleep(1)
    return plik


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    wybrane = [e for e in EKRANY if len(sys.argv) < 2 or e[0] in sys.argv[1:]]
    # Edge trzyma pliki profilu chwilę po zakończeniu — nie wywracaj się na sprzątaniu
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as profil:
        for nazwa, trasa in wybrane:
            p = zrzut(nazwa, trasa, profil)
            if not p.exists():
                print(f'{nazwa}: BRAK PLIKU')
                continue
            w, h = Image.open(p).size
            print(f'{nazwa}: {w}x{h}, proporcja 1:{h / w:.3f}', 'OK' if h / w <= 2 else 'ZA WYSOKI')
