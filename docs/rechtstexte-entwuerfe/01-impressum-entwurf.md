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

`[VOR VERWENDUNG KLÄREN: Liegt eine USt-IdNr. nach § 27a UStG vor?]`

- **Wenn nein** (bei Kleinunternehmern der Regelfall, sofern kein
  innergemeinschaftlicher Leistungsbezug stattfindet): Die Angabe
  entfällt ersatzlos. Es darf **keine** erfunden werden.
- **Wenn ja**: Sie ist nach § 5 Abs. 1 Nr. 6 DDG anzugeben.

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
  zur Teilnahme): Nach **§ 36 Abs. 3 VSBG** ausgenommen, wer am
  31.12. des Vorjahres **zehn oder weniger Personen** beschäftigt hat.
  VERA ist ein Einzelunternehmen. `[VOR VERWENDUNG KLÄREN: Bestätigen,
  dass am 31.12.2025 höchstens zehn Personen beschäftigt waren — nach
  derzeitigem Kenntnisstand null.]`
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

`[VOR VERWENDUNG KLÄREN: Unterliegt die Tätigkeit „Organisation und
Durchführung von Veranstaltungen sowie Erbringung von Büro- und
administrativen Dienstleistungen" einer Erlaubnispflicht oder
Kammerzugehörigkeit?]`

Nach derzeitigem Kenntnisstand nein — Veranstaltungsorganisation ist
grundsätzlich ein freies Gewerbe. Zu prüfen bleibt, ob einzelne
Tätigkeiten (z. B. Bewirtung, Ausschank, größere Veranstaltungen)
eigene Erlaubnisse auslösen. Das betrifft dann aber die Tätigkeit
selbst, nicht zwingend das Impressum.

### 4.4 Wirtschafts-Identifikationsnummer

`[VOR VERWENDUNG KLÄREN: Wurde eine Wirtschafts-Identifikationsnummer
(W-IdNr.) vergeben, und ist sie anzugeben?]` Die Vergabe läuft seit
November 2024 schrittweise. Ob eine Angabepflicht im Impressum besteht,
ist gesondert zu klären — **nicht ungeprüft aufnehmen.**

---

## 5. Was bewusst NICHT im Impressum steht

| Nicht enthalten | Begründung |
|---|---|
| Link zur EU-OS-Plattform | eingestellt zum 20.07.2025, siehe 4.2 |
| Steuernummer | gehört auf Rechnungen, nicht ins Impressum |
| erfundene USt-IdNr. | keine Angabe ist besser als eine falsche |
| Haftungsausschluss für Links | kein Pflichtbestandteil; die verbreiteten Textbausteine dazu haben keine eigenständige Wirkung |
| „Verantwortlich nach § 18 Abs. 2 MStV" | `[VOR VERWENDUNG KLÄREN: Nur nötig, wenn journalistisch-redaktionelle Inhalte angeboten werden. Eine Eventseite ist das im Regelfall nicht.]` |

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
