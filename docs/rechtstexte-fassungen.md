# Rechtstext-Fassungen anlegen

Wie aus den angezeigten Rechtstexten eine archivierte Fassung wird —
und warum es diesen Umweg gibt.

---

## Warum überhaupt

Maßgeblich für einen Vertrag ist die Fassung der Bedingungen, die bei
**Vertragsschluss** einbezogen wurde (Entscheidung 6.7, 20.09.2026).
Ändert VERA die Bedingungen später, gilt für Altbuchungen weiterhin die
alte. Zwei Jahre später lässt sich sonst nicht mehr belegen, welche das
war — und die Git-Historie ist gegenüber einem Kunden kein Nachweis,
sondern ein internes Werkzeug, das VERA selbst ändern kann.

Dazu kommt § 312f Abs. 2 BGB: Die Vertragsbestätigung muss auf einem
**dauerhaften Datenträger** ergehen, **einschließlich** der einbezogenen
Bedingungen. Die Bestätigungsmail schickt den Volltext deshalb mit
(`lib/mailVorlagen.ts` → `fassungsAnhang`). Sie kann das nur, wenn in
der Tabelle `Rechtstext` eine Fassung steht.

**Ist die Tabelle leer, geht jede Bestätigungsmail ohne die Bedingungen
hinaus.** Die Anmeldung selbst scheitert daran nicht — das wäre die
schlechtere Antwort, der Kunde kann nichts dafür — aber die Pflicht
bleibt unerfüllt. Genau dieser Zustand bestand vom Livegang bis zum
24.09.2026.

---

## Der Ablauf, in drei Schritten

### 1. Die Datei erzeugen

```bash
npm run rechtstext:export
```

Schreibt zwei Dateien:

| Datei | Inhalt |
|---|---|
| `rechtstexte/agb-b2c.txt` | Teilnahmebedingungen, Wortlaut wie auf `/agb` |
| `rechtstexte/datenschutzerklaerung.txt` | Datenschutzerklärung, Wortlaut wie auf `/datenschutz` |

Der Wortlaut wird **erzeugt, nicht abgetippt** — aus denselben
Zeichenketten in `content/de.ts`, die auch die Seite anzeigt
(`lib/rechtstextFassung.ts`). Eine Abschrift wäre bei der ersten
Korrektur still falsch geworden, und still falsch ist bei einem
Vertragstext der schlimmste Zustand.

Hinzu kommen ausschließlich Zeilenumbrüche und, wo die Seite eine
Aufzählung zeigt, ein `- ` je Punkt. Kein Wort wird ergänzt,
weggelassen oder umformuliert; auch kein „Stand:"-Kopf — das
Stand-Datum steht bereits in Ziffer 17.3.

Die Dateien tragen **feste Namen, kein Datum**. Sie sind immer der
aktuelle Wortlaut. Das Archiv der alten Fassungen ist die Datenbank,
nicht der Ordner — dorthin verweisen die Buchungen. Zwei Archive wären
zwei Wahrheiten.

### 2. Nachsehen, ob sie noch stimmt

```bash
npm run rechtstext:export -- --pruefen
```

Ändert nichts und meldet, wenn die Dateien nicht mehr zu
`content/de.ts` passen — also wenn jemand einen Rechtstext geändert,
den Export aber vergessen hat. Prüfliste `U` ruft das mit auf.

### 3. Die Fassung anlegen

```bash
npm run rechtstext -- AGB_B2C rechtstexte/agb-b2c.txt 2026-09-22
npm run rechtstext -- DATENSCHUTZ rechtstexte/datenschutzerklaerung.txt 2026-09-22
```

Das Datum ist das **Stand-Datum, das im Text selbst genannt wird** —
bei den AGB steht es in Ziffer 17.3. Ein viertes Argument (`gueltigAb`)
bereitet eine Fassung vor, die erst später greift.

Das ist der **einzige** Weg, einen Rechtstext in die Datenbank zu
bringen. Es gibt bewusst keinen Adminbereich dafür: Ein Vertragstext
wird nicht nebenbei im Browser geändert, sondern bewusst, mit Datum,
und nachdem jemand ihn gelesen hat.

Bestehende Fassungen werden **nie** verändert. Ein zweiter Aufruf legt
Version 2 an; Version 1 bleibt stehen, weil Buchungen auf sie
verweisen.

---

## Nach einer Textänderung

Wer einen Satz in `content/de.ts` ändert, hat damit **eine neue Fassung
geschaffen** — auch wenn es nur ein Komma war. Der Ablauf ist dann:

1. `npm run rechtstext:export`
2. Die geänderte Datei committen (der Unterschied ist lesbar, weil ein
   Absatz eine Zeile ist).
3. Auf dem Server nach dem Ausrollen `npm run rechtstext -- …` mit dem
   **neuen** Stand-Datum. Das legt Version 2 an.

Schritt 3 zu vergessen ist der gefährliche Fehler: Die Seite zeigte
dann den neuen Text, die Mail schickte den alten mit, und keine Anzeige
wäre rot. Prüfliste `U` fängt Schritt 1 ab (Datei gegen `content/de.ts`),
aber **nicht** Schritt 3 — ob die Datenbank auf dem Stand ist, zeigt nur
`/admin/rechtstexte`.

---

## Nachsehen, was gilt

Im Browser: **`/admin/rechtstexte`** — je Art die geltende Fassung, alle
Versionen, Prüfsummen und wie viele Buchungen auf sie verweisen.

Auf der Kommandozeile lässt sich die Prüfsumme gegenprüfen:

```bash
sha256sum rechtstexte/agb-b2c.txt
```

Der Wert muss mit der Spalte `pruefsumme` der Fassung übereinstimmen.
Das ist keine Sicherung gegen Dritte — wer die Zeile ändern kann, kann
auch die Prüfsumme neu setzen — aber es macht eine **unbeabsichtigte**
Änderung sofort sichtbar, und dafür ist sie da.

---

## Zwei Punkte, die offen sind

- **Die Datenschutzerklärung nennt kein Stand-Datum.** Die AGB tun es
  (Ziffer 17.3), die Datenschutzseite nicht. Die Fassung bekommt ihr
  Datum deshalb nur über das Argument beim Anlegen; ein Leser der Seite
  kann nicht erkennen, welche Fassung er vor sich hat. Ein Stand-Satz
  auf der Seite wäre eine inhaltliche Ergänzung und braucht eine
  Entscheidung.
- **AGB_B2B gibt es als Art, aber keinen Text.** Die Seite
  „Für Unternehmen" verweist auf im Einzelfall vereinbarte Bedingungen
  (AGB Ziffer 1.3). Solange das so bleibt, bleibt diese Art leer — das
  ist kein Versehen.
