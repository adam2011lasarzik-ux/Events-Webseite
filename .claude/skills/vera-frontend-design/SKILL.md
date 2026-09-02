---
name: vera-frontend-design
description: Verbindliche Frontend-Vorgaben der VERA-Event-Webseite — Marke, Farb- und Schrift-Tokens, die drei Design-Themes (Standard, Business, Premium), CSS Modules ohne Framework, Sprache (nur Deutsch), Responsivität ab 320 px, Barrierefreiheit und die Regel, dass nichts von fremden Servern nachgeladen wird. Diesen Skill IMMER konsultieren bei Aufgaben zu Aussehen, Layout, Farben, Schriften, Abständen, Komponenten, Seitenaufbau, Themes, Texten im Interface, Bildern und Videos, Responsivität, Tastaturbedienung oder Kontrast dieser Webseite — auch wenn der Nutzer nur "Seite schöner machen", "Abstand ändern", "neue Seite bauen" oder "Text anpassen" sagt.
---

# VERA — Frontend und Design

Diese Datei ist die verbindliche Vorgabe für alles Sichtbare an der VERA-Webseite. Sie ergänzt
den Skill `event-backend-database`, der Datenmodell, Zahlung, Adminbereich und Betrieb regelt.
Bei Backend-Fragen gilt jener, bei Aussehen und Bedienung dieser.

Der Nutzer ist Programmier-Anfänger und arbeitet über Claude Code im Browser auf einem iPad.
**Bestehendes Aussehen nicht ohne Auftrag verändern.** Diese Seite wurde über viele Runden
gestaltet und gemessen; eine „Verbesserung" nebenbei ist hier fast immer ein Rückschritt.

---

## 1. Was VERA ist

VERA (kurz für **VERA**nstaltung) ist eine Event-Marke. Erstes Event: ein Padel-Nachmittag in
Falkensee für Schüler, Lehrer und Eltern. Später kommen Sport-, Business- und
Netzwerk-Veranstaltungen dazu — deshalb muss das Design mehr können als Padel.

**Die Wortmarke ist der Kern:** „**VERA**" kräftig, „nstaltung" fein weitergeführt. Das erklärt
den Namen ohne ein Wort und funktioniert auch für ein Business-Event. Diese Marke bleibt in
**allen** Themes gleich — sie ist die Klammer.

---

## 2. Sprache: nur Deutsch

**Die Seite ist einsprachig deutsch.**

> **Historisch:** Eine frühere Fassung war zweisprachig (DE/EN) mit Sprachumschalter und einer
> `[locale]`-Ebene im Routing. Der Nutzer hat sich bewusst dagegen entschieden: Das halbiert
> die Textfelder im Adminbereich und vereinfacht das Routing spürbar. `content/en.ts`, der
> Umschalter und die `[locale]`-Ebene wurden entfernt. **Die englischen Texte stehen weiterhin
> in der Git-Historie und wären wiederherstellbar** — gelöscht ist nichts endgültig.

Ohne ausdrücklichen neuen Auftrag wird **keine** Zweisprachigkeit eingebaut. Käme sie zurück,
wäre das eine eigene Aufgabe mit echtem Aufwand (Routing, Umschalter, doppelte Pflege im
Adminbereich) — nicht etwas, das man nebenbei mitnimmt.

**Alle sichtbaren Texte stehen in `content/de.ts`**, nicht im Code der Komponenten. Wer einen
Text ändert, ändert ihn dort. Eventbezogene Inhalte kommen aus der Datenbank.

---

## 3. Technik: bewusst minimal

- **Next.js 16 (App Router) + TypeScript**
- **CSS Modules + CSS-Variablen.** Kein Tailwind, kein UI-Framework, keine
  Animationsbibliothek.
- **Keine neue Frontend-Abhängigkeit ohne Rückfrage.**

Das ist kein Zufall, sondern Absicht: weniger Abhängigkeiten, für einen Anfänger auf dem iPad
besser lesbar, und CSS Modules verhindern das gegenseitige Überschreiben von Abständen.

### Vorsicht bei CSS-Spezifität

Es ist leicht, Klassen zu erzeugen, die sich gegenseitig aufheben — besonders bei Abständen
zwischen Abschnitten, wenn eine typbezogene und eine elementbezogene Regel dasselbe Element
treffen. Vor dem Hinzufügen einer Regel prüfen, ob schon eine existiert, die dasselbe tut.

---

## 4. Design-Tokens — die einzige Quelle für Farben, Schriften, Maße

**Alle Farben, Schriftgrößen, Abstände und Rundungen stehen in `styles/tokens.css`.**
Komponenten benutzen **ausschließlich** diese Variablen.

**Niemals einen festen Farbwert oder eine feste Schriftgröße in eine Komponenten-CSS
schreiben.** Ein fester Wert bricht die Themes: Er bleibt gleich, während sich alles um ihn
herum ändert. Fehlt eine passende Variable, wird eine **neue Variable** angelegt — nicht ein
fester Wert eingesetzt.

### Die Markenfarben

| Variable | Wert | Rolle |
|---|---|---|
| `--sand` | `#F6F3ED` | warmer Grundton (vom Sand im Court-Kunstrasen) |
| `--sand-tief` | `#EBE4D6` | abgesetzte warme Fläche |
| `--tiefblau` | `#0C3157` | dunkle Blöcke und Text |
| `--courtblau` | `#175D9C` | sekundär |
| `--ballgelb` | `#D8E84A` | Akzent, alle Knöpfe |
| `--linienweiss` | `#FFFFFF` | Court-Linien, Flächen |

Benutzt werden im Code die **Rollen-Variablen** (`--flaeche`, `--akzent`, `--akzent-text`,
`--fokus`, `--fehler` …), nicht die Markenfarben direkt. Nur so kann ein Theme sie umlegen.

### Schriftgrößen und Abstände

Schriftgrößen sind Stufen (`--gr-xs` … `--gr-3xl`), die großen mit `clamp()` fließend.
Abstände sind Stufen (`--a-1` … `--a-7`). Rundungen: `--rund-s` 10px, `--rund-m` 18px,
`--rund-l` 28px, `--rund-xl` 40px.

**Keine losen Pixelwerte für Abstände.** Wer eine Zwischenstufe braucht, sagt es, statt eine zu
erfinden.

---

## 5. Schriften — selbst ausliefern, immer

Geladen über `next/font/google`: beim **Bauen** heruntergeladen und von der **eigenen Domain**
ausgeliefert.

| Rolle | Schrift |
|---|---|
| Fließtext, **alle** Themes | Instrument Sans |
| Auszeichnung Standard | Archivo (breit laufend) |
| Auszeichnung Business | IBM Plex Sans, Daten in IBM Plex Mono |
| Auszeichnung Premium | Instrument Serif |

**Der Fließtext bleibt in allen Themes Instrument Sans** — das ist der durchgehende Faden der
Marke. Unterschiedlich ist nur die Auszeichnungsschrift.

**Würden Schriften zur Laufzeit von Google geladen, ginge die IP-Adresse jedes Besuchers
dorthin.** Das wäre einwilligungspflichtig und hat in Deutschland zu Urteilen mit
Schadenersatz geführt. Selbst ausgeliefert entfällt das Problem, und die Seite lädt schneller.
Themes-Schriften werden mit `preload: false` geladen, damit sie nur dort geholt werden, wo sie
gebraucht werden.

---

## 6. Nichts von fremden Servern

**Schriften, Bilder, Skripte, Stylesheets und Videos werden immer selbst ausgeliefert.** Nie
zur Laufzeit von einem fremden Server nachladen.

- Keine Tracking-, Analyse- oder Werbeskripte.
- **Solange nur technisch notwendige Cookies verwendet werden, ist kein Cookie-Banner nötig.
  Diesen Zustand bewusst erhalten.** Er ist ein echter Vorteil — für die Besucher und
  rechtlich.
- Bezahlt wird auf der **gehosteten Seite des Anbieters**; auf der VERA-Seite läuft **kein**
  fremdes Skript. Das ist der Grund, warum der cookiefreie Zustand trotz Zahlung erhalten
  bleibt.
- Bevor irgendetwas eingebaut wird, das daran etwas ändert: **den Nutzer informieren und
  zustimmen lassen.**
- **Keine fremden Fotos ohne ausdrückliche Freigabe.** Bilder und Videos liefert der Nutzer.

---

## 7. Die drei Themes

Jede Veranstaltung hat ein Design: **Standard**, **Business** oder **Premium**. Ausgewählt wird
es im Adminbereich; die Event-Seite erscheint daraufhin im passenden Look. **Daten, Preise,
Plätze und Anmeldung sind identisch — nur das Aussehen ändert sich.**

| | Grund | Akzent | Auszeichnung |
|---|---|---|---|
| **Standard** | Sand | Ballgelb, alle Knöpfe | Archivo |
| **Business** | fast Weiß | Courtblau, Ballgelb nur als Fokusring | IBM Plex |
| **Premium** | warmes Fast-Schwarz und Creme | Champagner-Gold | Instrument Serif |

### Wie ein Theme funktioniert

- `styles/themes.css` enthält je Theme einen Block `[data-theme="…"]`, der **ausschließlich
  Design-Variablen überschreibt**.
- **Keine Komponenten-Klassennamen als Selektor.** Themes greifen über `data-*`-Attribute
  (`data-block="ablauf"`, `data-zier="court"`). Klassennamen aus CSS Modules sind erzeugt und
  können sich ändern; außerdem heben sich Spezifitäten sonst gegenseitig auf.
- `lib/themes.ts` ist die **einzige** Stelle, an der steht, welche Themes es gibt. Dort stehen
  bewusst **keine** Farben — die stehen in `themes.css`.
- Ein weiteres Theme braucht genau drei Schritte: Wert in die Prisma-Aufzählung (+ Migration),
  Eintrag in `lib/themes.ts`, Block in `themes.css`.
- **Die Marken-Hülle bleibt außerhalb des Themes**: Kopfzeile, Fußbereich, Rechtsseiten und die
  Startseite sehen in jedem Fall gleich aus. Das ist die gemeinsame Identität.

### Ein mutiger Griff je Theme, sonst Ruhe

- Standard: die weißen **Court-Linien**
- Business: die **Zeitschiene** am Ablauf (Uhrzeiten an einer Haarlinie, wie ein gedrucktes
  Programm)
- Premium: der **gravierte Linienrahmen** um den Kopfbereich

**Gold im Premium ausschließlich für Haarlinien, Rahmen, Knopfflächen und große Zahlen —
niemals für Fließtext.** Auf Creme erreicht Champagner den nötigen Lesekontrast nicht. Diese
Regel wird gemessen, nicht geschätzt.

---

## 8. Qualitätsniveau — nicht verhandelbar

Diese Punkte werden ohne Extra-Auftrag eingehalten. Sie sind kein Zusatz, sondern die
Grundlinie.

### Responsivität

- **Nutzbar ab 320 px Breite** — bis 1920 px.
- **Kein waagerechtes Scrollen.** Bei keiner Breite.
- **Nichts abgeschnitten, nichts unbeabsichtigt überlappend.**
- Bedienelemente auf Touch-Geräten mindestens **44 px** hoch.
- Breite Inhalte (Tabellen, Code) scrollen **in ihrem eigenen Kasten**, nicht die Seite.

**Feste Breiten sind verdächtig.** `min()`, `clamp()`, `flex-wrap` und `min-width: 0` bei
Rasterfeldern sind die üblichen Antworten. Wer eine feste Pixelbreite setzt, muss sagen können,
warum sie bei 320 px noch passt.

**Gemessen wird fließend, nicht stichprobenweise:** `pruefung/L/l-responsiv.mjs` misst in
10-Pixel-Schritten von 320 bis 1920. Ein Layout kann bei 390 und bei 414 sauber sein und bei
400 brechen — genau dort, wo ein Umbruch greift. Geprüft wird auf vier Dinge: seitliches
Scrollen, abgeschnittene Inhalte, Überlappungen, zu kleine Tippziele.

### Barrierefreiheit

- **Sichtbarer Tastatur-Fokus** überall (`:focus-visible`, auf dunklem Grund mit eigener Farbe).
- **`prefers-reduced-motion` respektieren.** Wer Bewegung reduziert hat, bekommt keine
  automatisch startenden Videos und keine Bewegung.
- **Farbkontraste mindestens WCAG AA** — gemessen, besonders auf den dunklen Flächen.
- **Echte Überschriften-Hierarchie**, keine Überschrift nur wegen der Größe.
- Ein **eigener Seitentitel je Seite**.
- Bilder bekommen einen sachlichen Alt-Text aus den Daten, keinen Marketingtext. Reine Zier
  ist `aria-hidden`.

### Video

- Automatischer Start funktioniert auf Handys nur **stumm** (`muted`) und mit `playsinline` —
  Vorgabe der Browser, keine Design-Entscheidung.
- Ein abgelehntes `play()` wird abgefangen, damit die Seite nicht stehen bleibt.
- Feste `aspect-ratio`, damit beim Laden nichts springt.

---

## 9. Texte im Interface

Wörter sind Gestaltungsmaterial, keine Dekoration.

- **Aktive Sprache.** Ein Knopf sagt, was passiert: „Jetzt anmelden & bezahlen", nicht
  „Absenden". Eine Aktion behält ihren Namen durch den ganzen Ablauf.
- **Konkret vor clever.**
- **Nichts versprechen, was es nicht gibt.** Keine Bestätigungsmail ankündigen, solange keine
  verschickt wird. Kein „Danke — deine Anmeldung ist da", solange nicht bezahlt wurde. Ein
  Formular, das aussieht, als funktioniere es, aber nichts tut, ist irreführend.
- **Fehler erklären, was schiefging und wie man es behebt** — sachlich, ohne Entschuldigung und
  ohne Vagheit.
- **Platzhalter müssen als Platzhalter erkennbar sein.** Dafür gibt es die
  `Platzhalter`-Komponente. Ein Platzhalter, den man für echten Inhalt halten kann, geht
  irgendwann versehentlich online. **Keine erfundenen Adressen, Daten, Preise oder
  Rechtstexte** — auch nicht „als Beispiel".

---

## 10. Bevor etwas Sichtbares geändert wird

1. **Nachsehen, ob es die Regel oder Komponente schon gibt.** Diese Seite hat viel; Doppelungen
   sind der häufigste Schaden.
2. **So klein wie möglich ändern.** Ein- bis Dreizeiler in einem CSS-Modul statt eines Umbaus.
3. **Danach messen**, nicht schätzen — die Prüfung aus §8 gehört dazu, wenn Maße, Umbrüche oder
   Abstände berührt wurden.
4. **Belegen, dass sich sonst nichts bewegt hat.** Bei Änderungen am Aussehen ist der
   Bildvergleich vorher/nachher das Mittel: Was nicht Teil der Aufgabe war, muss identisch
   bleiben.
5. Bei größeren Änderungen vorher kurz und anfängerfreundlich erklären, **was** geändert wird,
   **warum**, und **welche Folgen** das hat — dann auf Zustimmung warten.

---

## 11. Beim Gestalten von Neuem

Für wirklich neue Oberflächen gilt zusätzlich der allgemeine Skill `frontend-design`
(Anthropic-Vorlage): eigenständige Haltung statt Standardlook, bewusste Typografie, ein
Signaturelement statt vieler Effekte.

**Er steht diesem Skill nach.** Wo er allgemein rät und VERA bereits entschieden hat, gilt die
Entscheidung von VERA: Diese Palette, diese Schriften, diese Themes, diese Wortmarke. Ein
Vorschlag, der die Marke austauscht, ist keine Gestaltung, sondern ein Bruch — und braucht die
ausdrückliche Zustimmung des Nutzers.
