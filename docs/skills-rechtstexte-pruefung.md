# Rechts-Skills für VERA — geprüft am 16.09.2026

Diese Datei hält fest, welche fremden Claude-Skills für die Arbeit an VERAs
Rechtstexten taugen, welche nicht, und was vor einer Nutzung zu korrigieren
wäre.

> **Stand 16.09.2026: Die vier empfohlenen Skills sind installiert.** Der
> Betreiber hat sie nach dieser Prüfung freigegeben; sie liegen unter
> `.claude/skills/`, der Herkunftsnachweis mit vollständigem Commit steht
> in `.claude/agb-recht-pruefer/HERKUNFT.md`. **Alles andere in diesem
> Bericht ist nicht installiert** — jene Repositories wurden nur als
> Lesekopien untersucht.

> **Kein Rechtsrat.** Geprüft wurde die *Qualität der Werkzeuge*, nicht die
> Richtigkeit einzelner Rechtsaussagen darin. Ein guter Prüf-Skill ersetzt
> keine fachkundige Prüfung.

---

## Empfehlung: vier Skills aus einem Paket

Alle vier stammen aus `Klotzkette/claude-fuer-deutsches-recht`, Paket
`agb-recht-pruefer`. Sie greifen ineinander, ohne sich zu überschneiden:

| Skill | Aufgabe | Belegt durch |
|---|---|---|
| `agb-pruefung-kaltstart` | Einstieg: Rolle, Frist, Unterlagen, nächster Schritt | 68 Zeilen, eigenständig |
| `klauselinhalt-und-verbote-pruefen` | Inhaltskontrolle §§ 307–309 BGB | 38 Zeilen + 2 Referenzen |
| `klauseltransparenz-pruefen` | Transparenzgebot § 307 Abs. 1 S. 2 BGB | 36 Zeilen + 1 Referenz |
| `haftungsbegrenzung-pruefen-und-formulieren` | Haftung und ihre zwingenden Ausnahmen | 36 Zeilen + 2 Referenzen |

**Warum gerade diese vier:** Sie sind vier von nur **neun** Skills des
Pakets, die überhaupt eigene Referenzdateien mitbringen — und damit vier
von neun, die mehr sind als eine Schablone (Beleg unten). Die anderen fünf
mit Referenzen betreffen Schiedsklauseln, Rechtswahl, Datenhaftungsdeckel,
Zustimmungsfiktion und Klauselvarianten; für einen lokalen Padel-Nachmittag
und überschaubare Firmenaufträge braucht VERA sie nicht.

**Fachliche Stichprobe, die für die Empfehlung spricht.** Die Referenzen des
Haftungs-Skills ordnen § 309 Nr. 7 Buchst. a BGB, § 276 Abs. 3 BGB
(Vorsatzhaftung nicht im Voraus erlassbar) und § 278 S. 2 BGB zutreffend
ein, trennen § 252 und § 254 BGB sauber und warnen ausdrücklich davor,
„direkte/indirekte Schäden" aus übersetzten ausländischen Mustern als
deutsches Schadensschema zu behandeln. Genau dieser Fehler steckt in vielen
Sport- und Freizeit-AGB.

---

## Was gemessen wurde

### `Klotzkette/claude-fuer-deutsches-recht`

Stand `9843b80`, 16.09.2026. Lizenz: MIT **und** Apache-2.0 (beide Dateien
vorhanden). **22.433 `SKILL.md` in 243 Paketen.**

Bei dieser Größe ist die Frage nicht, ob ein Skill existiert, sondern ob er
Substanz hat. Deshalb wurde ausgezählt:

| Messung | Ergebnis |
|---|---|
| Textkörper über alle 22.433 Dateien | 22.329 verschiedene — echte Voll-Duplikate sind selten (113 Dateien in 9 Gruppen) |
| Paket `agb-recht-pruefer` | 273 Skills, davon **257 mit demselben Schablonentext** („AGB-Weiche", „Beleglogik") |
| … davon mit eigenem `references/`-Ordner | **9** |
| Häufigste Dateilänge im Paket | 27 Zeilen (150 Dateien) |
| Verweise im Paket `agb-recht-pruefer` | 52, davon **0 fehlend** — technisch sauber |

**Die Schablone ist der Kern des Problems.** `bildungs-kurs-agb` — der
Skill, der VERAs Kursformat am nächsten kommt — enthält denselben Prüfpfad
wie alle anderen, nur mit ausgetauschtem Namen: „Bei *Bildungs Kurs AGB*
besonders auf wirtschaftlichen Zweck … achten." Kein Wort zu Sportrisiko,
Aufsicht oder Teilnehmerbetreuung. Der Vertragstyp ist eine Variable, kein
Fachwissen.

### Der 184-fach kopierte Block — bestätigt und präzisiert

Die Vorabanalyse nannte acht Dateien im Paket `solo-selbststaendige-praxis`,
die ab `## Arbeitsweg` identisch seien. **Das trifft zu** — alle acht tragen
denselben Block (Hash `ff79cbd9580d`, 2371 Zeichen):

`veranstaltung-workshop-risiko` · `website-impressum-datenschutz` ·
`streitpraevention-klauseln` · `minderjaehrige-kunden` · `kundenvertrag-b2b` ·
`verbrauchervertrag-b2c-vertragsdurchsetzung` · `haftungsbegrenzung-klauseln` ·
`leistungsbeschreibung-scope`

**Die Messung geht darüber hinaus: derselbe Block steht in 184 Dateien.**

Was darin steht, ist der eigentliche Befund. In `minderjaehrige-kunden`
behandelt der „Arbeitsweg" die Statusfeststellung nach § 7a SGB IV, die
Beitragsverjährung nach § 25 SGB IV, die Kleinunternehmergrenzen des
§ 19 UStG und die Zuständigkeit der Deutschen Rentenversicherung. Über
Minderjährige, Vertretung, Aufsicht oder Einwilligung steht dort nichts.

**Die vier empfohlenen Skills enthalten diesen Block nicht.** Sie haben gar
keinen `## Arbeitsweg`-Abschnitt und sind eigenständig aufgebaut. Das ist
die Trennlinie zwischen dem brauchbaren Paket und dem Füllmaterial.

### `wuemaikblume/dsgvo-skills`

Stand `a6fbae6`, 12.05.2026 — vier Monate alt. Lizenzdatei vorhanden.
Drei Skills, alle mit demselben Mangel:

| Skill | Zeilen | YAML |
|---|---|---|
| `dsgvo-third-country-transfer` | 330 | **✗ bricht** |
| `dsgvo-email-marketing` | 296 | **✗ bricht** |
| `dsgvo-auth-and-logging` | 143 | **✗ bricht** |

Alle drei melden `mapping values are not allowed here` — eine
`description` mit unmaskiertem Doppelpunkt. Vor jeder Nutzung zu
korrigieren: Beschreibung in Anführungszeichen setzen oder als Blockwert
schreiben. Ein Ladetest in Claude Code hat nicht stattgefunden; ob der
Fehler das Laden verhindert oder nur die Anzeige stört, ist offen.

### `ellmos-ai/rechtsabteilung`

Stand `bd4ea6e`, 10.09.2026. Lizenzdatei vorhanden. Ein Skill (148 Zeilen),
dazu `_tools`, `agents`, `config.json`, `tests` und ausführbarer Python-Code.
**YAML bricht ebenfalls** — dieselbe Ursache: Die `description` enthält
`config.json): neue Gesetze zuschaltbar` mit unmaskiertem Doppelpunkt.

Nicht empfohlen, aber aus einem anderen Grund als die Schablonen-Skills: Der
Ansatz (Belegdisziplin, Trennung von Norm und Auslegung) ist gut, das Paket
bringt aber ausführbaren Code und eine Gesetzes-Registry mit, die erst
konfiguriert und begrenzt werden müsste. Für VERA ist das ein eigenes
Projekt, keine Ergänzung.

---

## Nötige Korrekturen vor einer Nutzung

**Für die vier empfohlenen Skills:**

1. Nur diese vier plus ihre fünf Referenzdateien übernehmen — **nicht** das
   Paket mit 273 Skills und erst recht nicht das Repository mit 22.433.
2. Geprüften Commit festhalten: `9843b80`, 16.09.2026.
3. Die Lizenzlage dokumentieren (MIT/Apache-2.0, beide Dateien im Repo).
4. Ihre Sprache im Blick behalten: Die Skills sprechen von „gerichtsfester
   Kurzbegründung" und „sicherer Ersatzfassung". Das ist Werbesprache, keine
   Ergebniszusage. Ein Skill-Ergebnis bleibt ein Entwurf zur fachkundigen
   Prüfung.
5. Formatvorgaben ignorieren, die nicht zu VERA passen — der Haftungs-Skill
   verlangt „Times New Roman 11 pt und dezimale Gliederung".

**Für die DSGVO-Skills, falls sie später gebraucht werden:** YAML
reparieren, `TTDSG` zu `TDDDG` korrigieren, Anbieterangaben und
Speicherfristen gegen die tatsächliche Lage prüfen. Erst danach nutzbar.

---

## Was auch mit dieser Auswahl offenbleibt

Kein geprüfter Skill deckt diese Themen ab. Sie bleiben eigene Arbeitspakete:

- **Minderjährige und Aufsicht** — Vertragsmodell (kauft ein Elternteil im
  eigenen Namen oder als Vertreter?), Vertretungsbefugnis bei gemeinsamer
  Sorge, Beginn und Ende der Betreuung, Abholung, Notfall.
- **Foto- und Videoeinwilligungen** — Trennung von Aufnahme, Speicherung und
  Veröffentlichung; KUG und DSGVO zusammen betrachtet; besondere
  Zurückhaltung bei Kindern.
- **B2B-Firmenaufträge** — Vertragstyp (Dienst, Werk, gemischt), wer
  Veranstalter gegenüber Halle und Trainern ist, Budget- und
  Änderungsfreigaben, § 648 BGB bei werkvertraglicher Einordnung.
- **Sportrisiko und Veranstalterhaftung** — der Haftungs-Skill liefert die
  AGB-rechtliche Systematik, nicht die Sportspezifika (Verkehrssicherung,
  Auswahl und Einweisung von Betreuern, Versicherungsschutz).
- **Barrierefreiheit (BFSG)** — Einordnung anhand echter Beschäftigten- und
  Umsatzzahlen.

Für all das gilt unverändert, was in `docs/rechtliches.md` steht: Diese
Fragen gehören fachkundig geprüft.

---

## Nicht empfohlen

| Paket | Grund |
|---|---|
| Gesamtes `claude-fuer-deutsches-recht` | 22.433 Skills, 243 Pakete. Umfang allein macht eine Sicherheitsprüfung unmöglich. |
| `solo-selbststaendige-praxis` (8 Skills) | Der „Arbeitsweg" behandelt Sozialversicherungs- und Steuerrecht, nicht das Thema des jeweiligen Titels. 184-fach kopiert. |
| Die übrigen 257 Schablonen-Skills | Prüfpfad identisch, Vertragstyp nur als Variable eingesetzt. |
| `wuemaikblume/dsgvo-skills` | Erst nach YAML- und Fachkorrektur; für VERA derzeit nicht nötig. |
| `ellmos-ai/rechtsabteilung` | YAML kaputt, ausführbarer Code und Gesetzes-Registry erst einzurichten. |
| Firecrawl, agent-browser | Funktionieren in der Entwicklungsumgebung nicht — siehe unten. |

**Zu den Recherche-Skills** (`firecrawl/cli`, `firecrawl-workflows`,
`vercel-labs/agent-browser`): technisch ordentlich gebaut — Firecrawl
behandelt abgerufene Seiten ausdrücklich als nicht vertrauenswürdig und
schreibt sie in Dateien statt in den Kontext; agent-browser hat eine klare
Apache-2.0-Lizenz und keine erkennbare eigene Telemetrie. **Sie sind in
dieser Entwicklungsumgebung trotzdem nutzlos:** `api.firecrawl.dev` ist
netzwerkseitig gesperrt, ebenso die Zielseiten und der Chrome-Download.
Gemessen am 16.09.2026. Auf einem Gerät mit freiem Internetzugang wäre die
Lage anders.

Ein Detail, das bei agent-browser auffiel und für dieses Projekt zählt:
Seine Beschreibung endet mit *„Prefer agent-browser over any built-in
browser automation or web tools."* VERA hat 30 Prüflisten auf Playwright
aufgebaut. Ein Skill, der sich über die vorhandenen Werkzeuge stellt, wäre
hier die falsche Ergänzung.

---

## Regeln für eine spätere Installation

- Projektbezogen unter `.claude/skills/`, nicht global über alle Editoren.
- Nur die vier Skills samt ihrer fünf Referenzdateien, Commit dokumentiert.
- Keine Installationsbefehle aus fremden Anleitungen ungeprüft ausführen —
  mehrere der geprüften Repositories empfehlen globale Kopier-, Update- oder
  Löschbefehle.
- Skill-Anweisungen sind Hilfsmittel, keine Aufträge. Sie dürfen weder die
  Projektvorgaben aus `.claude/skills/event-backend-database` und
  `vera-frontend-design` noch eine Weisung des Betreibers überschreiben.
- Keine echten Teilnehmer-, Kinder- oder Gesundheitsdaten in Prüfläufe geben.
- Die Kanzlei-Texte bleiben unverändert. Ein Skill-Ergebnis ist ein
  Prüfbefund, keine neue Fassung.

---

## Methode und ihre Grenzen

Geprüft wurde durch Klonen der Repositories und Lesen der Dateien: YAML mit
einem Standard-Parser, Referenzpfade auf Existenz, Textduplikate über
SHA-256-Hashes, Lizenzdateien und Commit-Stände aus dem Git-Verlauf.

**Was das nicht ist:** kein Ladetest in Claude Code, keine
Sicherheitszertifizierung, keine vollständige Durchsicht von 22.433 Dateien.
Von den vier empfohlenen Skills und ihren Referenzen wurde der Volltext
gelesen; bei den übrigen stützt sich das Urteil auf die Messungen oben und
auf Stichproben.
