# Sentencja — słynne cytaty

**→ [marcinchudaszek-cmd.github.io/sentencja](https://marcinchudaszek-cmd.github.io/sentencja/)**

Kolekcja cytatów z podziałem na **tematy, autorów i epoki**. Jedna baza, dwie platformy:
aplikacja webowa (PWA) i natywna aplikacja na Androida — ten sam kod, pełne działanie offline.

## Co jest w środku

- **511 cytatów** — każdy po polsku, z oryginałem (łacina, greka, angielski, niemiecki, francuski,
  chiński, perski i inne), autorem i źródłem.
- **221 autorów** z 37 krajów, z biogramami i latami życia — od Safony i Homera po współczesność.
- **26 tematów** (miłość, czas, władza, cierpienie, humor…) i **7 epok**.
- 87 cytatów o niepewnym pochodzeniu jest **wyraźnie oznaczonych** jako sporne — każdy z notatką,
  skąd wzięło się przypisanie (test pilnuje, by żadne oznaczenie nie zostało bez wyjaśnienia).
  Można je globalnie odfiltrować w ustawieniach.

## Funkcje

| Ekran | Co robi |
|---|---|
| **Start** | Cytat dnia (ten sam dla wszystkich, deterministyczny z daty), losowy strzał, skróty do tematów i epok |
| **Odkrywaj** | Trzy przekroje bazy: tematy, autorzy (z wyszukiwarką, filtrem epoki i trzema sortowaniami), epoki |
| **Losuj** | Jeden przypadkowy cytat na pełnym ekranie; pula zawężana tematem, epoką lub ulubionymi. Kolejny wywołuje przycisk, spacja na klawiaturze albo potrząśnięcie telefonem |
| **Talia** | Karty do przesuwania — w prawo do ulubionych, w lewo dalej |
| **Szukaj** | Wyszukiwanie pełnotekstowe po treści, oryginale, autorze, temacie i źródle; odporne na polskie znaki (`wolnosc` znajdzie `wolność`). Fraza w cudzysłowie szuka dosłownie, wyniki filtrują się po epoce i temacie, historia zapytań zostaje na później |
| **Zbiory** | Ulubione, własne kolekcje z emoji i notatki do cytatów |
| **Studio** | Generator grafik: 6 motywów, 4 formaty (kwadrat, story, tapeta, panorama), eksport PNG w pełnej rozdzielczości |
| **Ustawienia** | Motyw jasny/ciemny/systemowy, skala tekstu, oryginały, filtr spornych, powiadomienie o cytacie dnia, eksport danych |

Wszystkie dane użytkownika (ulubione, kolekcje, notatki) trzymane są lokalnie w przeglądarce /
na urządzeniu. Nic nie wychodzi na zewnątrz — aplikacja nie ma backendu.

## Stack

- React 19 + TypeScript + Vite 6
- Tailwind CSS 4 (tokeny motywu na zmiennych CSS, jasny i ciemny)
- Motion (animacje, gesty przesuwania)
- Zustand + `persist` (stan i trwałość)
- vite-plugin-pwa (offline na webie)
- Capacitor 7 (Android: powiadomienia lokalne, haptyka, udostępnianie, splash, status bar)

## Uruchomienie (web)

```bash
npm install
npm run dev
```

Kontrola jakości przed commitem — typy plus 29 testów spójności bazy i wyszukiwarki:

```bash
npm run check
```

Produkcyjna wersja:

```bash
npm run build
npm run preview
```

## Publikacja wersji web

Workflow `.github/workflows/deploy.yml` buduje i publikuje aplikację na GitHub Pages po każdym
pushu na `main`. Najpierw uruchamia `npm run check` — przy czerwonych testach publikacja się nie
odbywa.

Uruchomienie jednorazowo:

```bash
git remote add origin git@github.com:UZYTKOWNIK/sentencja.git
git push -u origin main
```

Potem w ustawieniach repozytorium: **Settings → Pages → Source → GitHub Actions**.

Ścieżki w buildzie są względne (`base: './'`), a routing działa na hashu, więc aplikacja działa
poprawnie także pod adresem w podkatalogu, np. `uzytkownik.github.io/sentencja/`. Service worker
sprawia, że po pierwszej wizycie strona działa offline i da się ją zainstalować jako PWA.

## Widget cytatu dnia

Natywny widget (`DailyQuoteWidget.java`) pokazuje ten sam cytat co aplikacja, ale działa bez
uruchamiania WebView — czyta własną kopię bazy z `assets/quotes-widget.json`. Kopię generuje
`scripts/make-widget-data.mjs` z tych samych plików źródłowych, zachowując kolejność, a wybór
cytatu używa tego samego hasha FNV-1a co `src/lib/daily.ts`. Dzięki temu widget i aplikacja
nigdy się nie rozjeżdżają.

Dotknięcie widgetu otwiera dany cytat przez `sentencja://cytat/<id>`.

> Generowanie danych widgetu jest wpięte w `npm run android:sync`. Po dopisaniu cytatów nie trzeba
> pamiętać o osobnym kroku.

## Android

Wymagania: Android Studio + SDK, JDK 21.

```bash
npm run android:sync
```

Potem otwórz projekt w Android Studio:

```bash
npm run android:open
```

albo zbuduj APK z linii poleceń:

```bash
cd android && ./gradlew assembleDebug
```

Gotowy plik: `android/app/build/outputs/apk/debug/app-debug.apk`.

### Build release (podpisany)

Klucz podpisujący generujesz **sam** — hasło ma znać tylko Ty. Jeśli zgubisz keystore, nie da się
już wydać aktualizacji aplikacji w Google Play pod tym samym identyfikatorem, więc zrób kopię
zapasową w menedżerze haseł lub w innym bezpiecznym miejscu.

```bash
keytool -genkeypair -v -keystore android/sentencja-release.jks -alias sentencja -keyalg RSA -keysize 4096 -validity 10000
```

Następnie skopiuj `android/keystore.properties.example` do `android/keystore.properties` i wpisz
tam ścieżkę, alias oraz hasła. Oba pliki — keystore i properties — są w `.gitignore` i nigdy nie
trafią do repozytorium.

```bash
cd android && ./gradlew assembleRelease   # podpisany APK
cd android && ./gradlew bundleRelease     # AAB do Google Play
```

Wyniki: `android/app/build/outputs/apk/release/app-release.apk` oraz
`android/app/build/outputs/bundle/release/app-release.aab`.

> Bez pliku `keystore.properties` build release nadal się wykona, ale APK zostanie niepodpisany
> i nie da się go zainstalować. Gradle wypisze wtedy ostrzeżenie.

> Jeśli Gradle nie widzi JDK, ustaw `JAVA_HOME` na katalog z JDK 21
> (np. `C:\Program Files\Eclipse Adoptium\jdk-21...`), a ścieżkę do SDK wpisz w
> `android/local.properties` jako `sdk.dir=C:/Users/<user>/AppData/Local/Android/Sdk`.

## Ikony

Ikony (PWA, launcher Androida, adaptacyjne, powiadomienia) są generowane skryptem bez zewnętrznych
zależności — własny enkoder PNG na `zlib`:

```bash
node scripts/make-icons.mjs
```

## Struktura bazy

```
src/data/
  types.ts          typy Quote / Author / Theme / Era
  taxonomy.ts       26 tematów i 7 epok
  authors.ts        autorzy (krotki + biogramy)
  quotes-antyk.ts   cytaty pogrupowane w cztery pliki wg epoki
  quotes-klasyka.ts
  quotes-xix.ts
  quotes-xx.ts
  index.ts          scalanie, indeksy, statystyki, walidacja
```

Każdy cytat to krotka:

```ts
['a025', 'Nie dlatego nie ośmielamy się, że jest trudno…', 'Non quia difficilia sunt…', 'la',
 'seneka', ['odwaga', 'sukces'], 'Listy moralne 104']
```

Ostatnie pole `1` oznacza atrybucję sporną. W trybie deweloperskim `index.ts` sprawdza spójność
bazy (nieznani autorzy, nieznane tematy, duplikaty id) i wypisuje problemy w konsoli.

### Dodawanie cytatów

Dopisz krotkę do pliku odpowiedniej epoki. Jeśli autora nie ma jeszcze w `authors.ts`, dodaj go
tam najpierw — walidacja od razu zgłosi brak w konsoli dev.
