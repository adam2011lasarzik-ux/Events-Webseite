# 01 — Impressum (Entwurf)

> **Status:** Entwurf, Version 1 vom 16.09.2026. **Nicht anwaltlich geprüft.**
> Nicht als „rechtssicher" oder „geprüft" bezeichnen. Vor Verwendung
> müssen alle mit `[VOR VERWENDUNG KLÄREN: …]` markierten Punkte
> beantwortet sein.
>
> **Verhältnis zum Bestand:** Die Seite `/impressum` existiert bereits und
> ist inhaltlich weitgehend fertig (`app/(seite)/impressum/page.tsx`,
> Daten aus `content/de.ts` → `anbieter`). Dieser Entwurf überschreibt
> sie **nicht**, sondern beschreibt den Sollzustand samt Begründung.
>
> **Stand 18.09.2026:** Inhaltlich unverändert gegenüber Version 1 —
> § 5 DDG und die EU-OS-Plattform-Abschaltung wurden erneut recherchiert
> und bestätigt (Dokument 14). Die beiden offenen Punkte (USt-IdNr.,
> Beschäftigtenzahl für § 36 VSBG) stehen jetzt zusätzlich gesammelt in
> Dokument 15, Abschnitt A — beide lassen sich in wenigen Minuten
> beantworten.
>
> **Stand 20.09.2026:** Zwei weitere Punkte sind beantwortet und im
> Text nachgezogen — die **Wirtschafts-Identifikationsnummer**
> (Abschnitt 4.4, Frage 6.1: keine vorhanden, nichts zu ergänzen) und
> die **Angabe nach § 18 Abs. 2 MStV** (Abschnitt 5, Frage 6.2:
> entfällt). Dazu die **berufsrechtlichen Angaben** (Abschnitt 4.3,
> Frage 6.3: erlaubnisfreies Gewerbe, nichts zu ergänzen).
>
> **Offen bleibt genau ein Klärungsvorbehalt**, und er ist eine
> Stilfrage, kein Rechtsrisiko: ob der freiwillige Satz zur
> Verbraucherstreitbeilegung aufgenommen wird, obwohl die Ausnahme nach
> § 36 Abs. 3 VSBG greift (Abschnitt 4.2). Dazu kommen die echten
> Unternehmensdaten aus Dokument 15, Abschnitt A.

---

## 1. Fundament

Maßgeblich ist **§ 5 Digitale-Dienste-Gesetz (DDG)**. Das DDG hat am
14.05.2024 das Telemediengesetz (TMG) abgelöst. Wer noch „Angaben gemäß
§ 5 TMG" schreibt, zitiert eine aufgehobene Norm.

Die Seite trägt bereits die richtige Überschrift („Angaben gemäß § 5 DDG",
`content/de.ts` → `recht.impressumAngaben`).

---

## 2. Entwurfstext

> **Angaben gemäß § 5 DDG**
>
> VERA ist ein Angebot von
> **Adam Maurice Lasarzik**
>
> **Anschrift**
> Mühlenstr. 8a
> 14167 Berlin
>
> **Kontakt**
> E-Mail: kontakt@veraevents.de
> Telefon: +49 3323 0219825
>
> **Umsatzsteuer**
> Als Kleinunternehmen nach § 19 UStG wird keine Umsatzsteuer berechnet
> und daher auch keine ausgewiesen.
>
> **Verantwortlich für den Inhalt**
> Adam Maurice Lasarzik, Anschrift wie oben.
>
> **Verbraucherstreitbeilegung**
> [VOR VERWENDUNG KLÄREN: siehe Abschnitt 4 — Formulierung erst nach
> der Entscheidung einsetzen.]

---

## 3. Woher jede Angabe stammt

| Angabe | Wert | Quelle | Einstufung |
|---|---|---|---|
| Name | Adam Maurice Lasarzik | `content/de.ts:anbieter.name` | **durch Code bestätigt** |
| Anschrift | Mühlenstr. 8a, 14167 Berlin | `content/de.ts:anbieter.anschrift` | **durch Code bestätigt** |
| E-Mail | kontakt@veraevents.de | `content/de.ts`, `docs/email-einrichten.md` (Postfach bei Hostinger aktiv) | **durch Code bestätigt** |
| Telefon | +49 3323 0219825 | `content/de.ts:anbieter.telefon` | **durch Code bestätigt** |
| Rechtsform | Einzelunternehmen, kein Registereintrag | `docs/rechtstexte-beschaffung.md` | **aus Unterlagen abgeleitet** |
| Kleinunternehmer § 19 UStG | ja | `content/de.ts:anbieter.umsatzsteuer` | **bisheriger Wunsch / Angabe des Unternehmers** |
| USt-IdNr. | keine angegeben | bewusst leer gelassen | **noch offen** |

---

## 4. Was noch zu klären ist

### 4.1 Umsatzsteuer-Identifikationsnummer

✅ **Beantwortet von Adam am 18.09.2026:** Keine USt-IdNr. vorhanden.
Das Feld entfällt im Impressum ersatzlos — es wird keine erfunden.

**Nicht verwechseln:** Die Steuernummer des Finanzamts gehört **nicht**
ins Impressum. Sie steht auf Rechnungen. Die Unterscheidung ist im Code
bereits richtig kommentiert (`content/de.ts`, Kommentar über
`anbieter.umsatzsteuer`).

### 4.2 Verbraucherstreitbeilegung

**Geprüfter Stand (16.09.2026):**

Die **EU-Plattform für Online-Streitbeilegung (OS-Plattform) wurde zum
20.07.2025 eingestellt** (Verordnung (EU) 2024/3228). Die Pflicht, auf
sie hinzuweisen, ist damit entfallen. Ein noch vorhandener Link wäre
nicht nur nutzlos, sondern könnte als irreführende Angabe gewertet
werden.

**Die Seite enthält bereits keinen solchen Link** — das ist im Code
ausdrücklich begründet (`app/(seite)/impressum/page.tsx`, Kopfkommentar).
Hier ist nichts zu entfernen.

Davon getrennt gilt weiterhin das **Verbraucherstreitbeilegungsgesetz
(VSBG)**:

- **§ 36 Abs. 1 Nr. 1 VSBG** (allgemeine Information über Bereitschaft
  zur Teilnahme): ✅ **Bestätigt von Adam am 18.09.2026** — am
  31.12.2025 waren 0 Personen beschäftigt (Einzelunternehmen ohne
  Angestellte). Die Ausnahme nach **§ 36 Abs. 3 VSBG** greift damit.
- **§ 36 Abs. 1 Nr. 2 VSBG** (Hinweis auf die zuständige Stelle, wenn
  eine Teilnahmeverpflichtung besteht oder eingegangen wurde): bleibt
  unabhängig von der Beschäftigtenzahl bestehen. `[VOR VERWENDUNG
  KLÄREN: Besteht eine Verpflichtung oder Selbstverpflichtung zur
  Teilnahme an einem Schlichtungsverfahren? Nach derzeitigem
  Kenntnisstand nein.]`
- **§ 37 VSBG** (Information, nachdem eine konkrete Streitigkeit
  entstanden ist): gilt **größenunabhängig**. Das ist keine Angabe fürs
  Impressum, sondern eine Pflicht im Einzelfall — sie gehört in die
  interne Ablaufbeschreibung, nicht auf die Seite.

**Formulierungsvorschlag, falls keine Teilnahmebereitschaft besteht:**

> Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungs­verfahren
> vor einer Verbraucherschlichtungsstelle teilzunehmen.

**Ausdrücklich zu prüfen:** ob dieser Satz trotz der Ausnahme nach
§ 36 Abs. 3 VSBG aufgenommen werden soll. Er ist dann freiwillig. Er
schadet nicht und beugt Nachfragen vor — ihn wegzulassen ist aber
ebenso zulässig.

### 4.3 Berufsrechtliche Angaben

✅ **Beantwortet am 20.09.2026 (Frage 6.3): keine Erlaubnispflicht,
keine Kammerzugehörigkeit — im Impressum ist nichts zu ergänzen.** Die
Organisation und Durchführung **eigener** Veranstaltungen ist ein
**erlaubnisfreies Gewerbe**; die bereits erfolgte Gewerbeanmeldung nach
§ 14 GewO genügt. Firmen können VERA mit der Organisation und
Durchführung **eigener Firmenveranstaltungen** beauftragen — das bleibt
dieselbe Tätigkeit in fremdem Auftrag.

Einzeln durchgesehen und als nicht einschlägig festgehalten:
**§ 33a GewO** (Schaustellung von Personen), **§ 55 GewO**
(Reisegewerbekarte), **§ 34a GewO** (Bewachungsgewerbe), **§ 34c GewO**
(Makler). Auch eine **Zahlungsdiensteerlaubnis** ist nicht nötig, weil
VERA **eigene** Tickets im eigenen Namen verkauft.

⚠️ **Die Tätigkeitsbeschreibung in der Klammerfrage ist überholt.** Sie
nannte „sowie Erbringung von Büro- und administrativen
Dienstleistungen". Nach **Entscheidung 5.2** werden solche Leistungen
**nicht angeboten**; die Website bewirbt sie auch nicht. Sollte das
später doch kommen, wäre die Erlaubnisfrage neu zu stellen — dann
kämen das Rechtsdienstleistungsgesetz und das Steuerberatungsgesetz in
Betracht (Dokument 11, Frage 5.18).

**Was davon unberührt bleibt:** Erlaubnisse und Anzeigen für die
**einzelne Veranstaltung** — Gaststättenanzeige nach BbgGastG, GEMA,
Versammlungsstättenrecht, Zustimmung des Hallenbetreibers. Die sind in
Dokument 04, Ziffer 8 und Anhang F geregelt und betreffen die
Tätigkeit, nicht das Impressum.

⚠️ **Schwächer belegt als die übrigen Punkte dieses Abschnitts.** Die
Websuche lieferte überwiegend österreichische Quellen; die deutsche
Lage ist aus den Erlaubnistatbeständen der GewO abgeleitet.
**Empfehlung: kostenlose Auskunft bei der IHK Potsdam** — hier der
schnellste verlässliche Weg. Merkposten **B-23** nennt die drei
Erweiterungen, die die Bewertung kippen würden.

### 4.4 Wirtschafts-Identifikationsnummer

✅ **Beantwortet am 20.09.2026 (Frage 6.1):** Adam hat **keine**
W-IdNr. vom Bundeszentralamt für Steuern erhalten. Im Impressum wird
deshalb **nichts** ergänzt — es ist ohne die Nummer vollständig, weil
**§ 5 Abs. 1 Nr. 6 DDG** die Angabe nur „soweit vorhanden" verlangt.

Die Vergabe läuft seit November 2024 schrittweise und erfolgt **von
Amts wegen ohne Antrag**; Kleinunternehmer nach § 19 UStG gehören zur
ersten Stufe. Es gibt also nichts zu beantragen und nichts zu
beschleunigen. Sobald das Schreiben eintrifft (Form `DE` + neun Ziffern
+ `-00001`), ist die Nummer „vorhanden" und gehört ins Impressum —
Bauauftrag **B-21**.

⚠️ **Dieser Punkt blockiert die Veröffentlichung ausdrücklich nicht.**
Ein Zuwarten auf die Vergabe wäre ein selbstgemachter Blocker ohne
rechtlichen Grund.

---

## 5. Was bewusst NICHT im Impressum steht

| Nicht enthalten | Begründung |
|---|---|
| Link zur EU-OS-Plattform | eingestellt zum 20.07.2025, siehe 4.2 |
| Steuernummer | gehört auf Rechnungen, nicht ins Impressum |
| erfundene USt-IdNr. | keine Angabe ist besser als eine falsche |
| Haftungsausschluss für Links | kein Pflichtbestandteil; die verbreiteten Textbausteine dazu haben keine eigenständige Wirkung |
| „Verantwortlich nach § 18 Abs. 2 MStV" | ✅ **Entschieden 20.09.2026 (Frage 6.2): entfällt.** Kein Blog, keine Newsrubrik, kein journalistisch-redaktionelles Angebot geplant — nachgesehen in `app/(seite)/`. Eine vorsorgliche Angabe würde nur Adams **Privatanschrift** zusätzlich veröffentlichen, ohne dass eine Pflicht bestünde. Merkposten **B-22**, falls später redaktionelle Inhalte dazukommen. |

---

## 6. Technischer Hinweis zur Umsetzung

Alle Angaben kommen aus **einer** Stelle (`content/de.ts` → `anbieter`).
Felder mit dem Wert `null` erscheinen als sichtbar markierter Platzhalter
statt still zu fehlen. Diese Rückfallebene bleibt erhalten — sie ist der
Grund, warum eine fehlende Pflichtangabe nicht unbemerkt verschwinden
kann.

**Erreichbarkeit:** Der Fußbereich steht in **jeder** öffentlichen Seite
(`app/(seite)/layout.tsx`), einschließlich Anmeldeformular und
Abschluss-Seite. Die Anforderung „leicht erkennbar, unmittelbar
erreichbar und ständig verfügbar" ist damit technisch erfüllt; die
Prüfliste `O` belegt das bei jedem Lauf.
