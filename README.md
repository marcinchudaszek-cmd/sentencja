# Sentencja — słynne cytaty

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
