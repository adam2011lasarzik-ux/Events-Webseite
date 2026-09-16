# Herkunft der vier AGB-Prüf-Skills

Diese vier Skills stammen nicht aus diesem Projekt. Sie wurden am
**16.09.2026** aus einem fremden Repository übernommen, nachdem sie
einzeln geprüft worden waren. Der Prüfbericht mit den Messwerten steht in
**`docs/skills-rechtstexte-pruefung.md`**.

## Quelle

| | |
|---|---|
| Repository | `https://github.com/Klotzkette/claude-fuer-deutsches-recht` |
| Paket | `agb-recht-pruefer` |
| **Commit** | **`9843b80716ec6808f47fab067c5fbcce38740abc`** |
| Commit-Datum | 2026-09-16 15:37:22 +0200 |
| Commit-Betreff | `Fix Aktivierungsaudit für Arbeitszeugnisprüfer (#411)` |
| Lizenz | MIT **und** Apache-2.0 — beide Lizenztexte liegen hier daneben |

Das Repository enthält 22.433 Skill-Dateien in 243 Paketen. Übernommen
wurden **vier** davon. Der Grund für genau diese vier steht im Prüfbericht:
Sie sind vier von nur neun Skills des Pakets, die eigene Referenzdateien
mitbringen und nicht aus der Schablone bestehen, die 257 der 273 Skills
teilen.

## Was übernommen wurde

```
.claude/skills/agb-pruefung-kaltstart/SKILL.md
.claude/skills/klauselinhalt-und-verbote-pruefen/SKILL.md
                └── references/klauselverbote.md, kontrollmassstab.md
.claude/skills/klauseltransparenz-pruefen/SKILL.md
                └── references/transparenz.md
.claude/skills/haftungsbegrenzung-pruefen-und-formulieren/SKILL.md
                └── references/haftungsausnahmen.md, schadensumfang-und-obergrenze.md
.claude/agb-recht-pruefer/zitierweise.md          ← von allen drei geteilt
.claude/agb-recht-pruefer/QUELLEN.md              ← von agb-pruefung-kaltstart
.claude/agb-recht-pruefer/PRUEFLOGIK.md           ← von agb-pruefung-kaltstart
.claude/agb-recht-pruefer/KLAUSELFAMILIEN.md      ← von agb-pruefung-kaltstart
.claude/agb-recht-pruefer/LICENSE-MIT, LICENSE-APACHE
```

`zitierweise.md` lag im Original auf der Wurzelebene des Repositories und
wird von drei der vier Skills gebraucht. Sie ist die wichtigste der
Referenzen: Sie verbietet Blindzitate, erfundene Fundstellen und
Kommentar-Randnummern aus Modellwissen.

## Änderungen am Originaltext

**Nur Pfade, kein Inhalt.** In den drei Skills, die auf
`zitierweise.md` verweisen, wurde der Pfad angepasst:

```
../../../references/zitierweise.md   →   ../../agb-recht-pruefer/zitierweise.md
```

Im Original lag die Datei drei Ebenen über dem Skill
(`<repo>/references/`). Hier gibt es diese Verschachtelung nicht — ohne
die Anpassung zeigte der Verweis auf `/home/user/Events-Webseite/references/`
und damit ins Leere.

Dieselbe Anpassung noch einmal in `agb-pruefung-kaltstart/SKILL.md`, dort
für die drei Quellenanker:

```
references/QUELLEN.md   →   ../../agb-recht-pruefer/QUELLEN.md
```

Diese drei standen im Original **in Backticks statt als Markdown-Link**
und sind meiner ersten Vollständigkeitsprüfung deshalb entgangen — die
suchte nur nach `[…](…)`. Der Fehler lag in der Prüfung, nicht im
Skill. Die Dateien liegen jetzt neben `zitierweise.md`, weil sie wie
diese aus der Wurzelebene des Herkunftspakets stammen.

**Am Inhalt der Skills und der Referenzen wurde nichts geändert.**

## Zwei Verweise zeigen bewusst ins Leere

Zwei Skills verweisen ergänzend auf Skills des Herkunftspakets, die nicht
übernommen wurden:

| In | Verweis auf |
|---|---|
| `haftungsbegrenzung-pruefen-und-formulieren` | `../haftungsdeckel-fuer-daten-und-modelldienste-pruefen/SKILL.md` |
| `klauselinhalt-und-verbote-pruefen` | `../klauselausfall-und-vertragsluecke-pruefen/SKILL.md` |

Beide sind im Original als *ergänzende* Prüfung formuliert, nicht als
Voraussetzung — die vier Skills arbeiten ohne sie vollständig. Der
Datenhaftungsdeckel betrifft Schäden aus Datenverarbeitung und
Modelldiensten, die Vertragslücke den Umgang mit unwirksamen Klauseln.
Beides ist für VERA derzeit nicht nötig.

Die Verweise wurden **nicht entfernt**: Fremden Text zu kürzen, um eine
selbst gesetzte Auswahl zu kaschieren, wäre die schlechtere Lösung als
eine dokumentierte Lücke. Sollten die beiden Skills später gebraucht
werden, lassen sie sich aus demselben Commit nachziehen — dann greifen
auch die Verweise wieder.

## Wie mit diesen Skills zu arbeiten ist

- Sie sind **Prüfwerkzeuge, keine Textquellen.** Ihr Ergebnis ist ein
  Befund für die fachkundige Prüfung, keine fertige Klausel.
- Ihre Sprache ist stellenweise werblich („gerichtsfeste Kurzbegründung",
  „sichere Ersatzfassung"). Das ist keine Ergebniszusage.
- Formatvorgaben daraus gelten nicht für dieses Projekt. Der Haftungs-Skill
  verlangt „Times New Roman 11 pt und dezimale Gliederung" — VERA
  formatiert nach eigenen Vorgaben.
- Sie stehen **unter** den Projektvorgaben. Die Skills
  `event-backend-database` und `vera-frontend-design` und jede Weisung des
  Betreibers gehen vor.
- **Die Kanzlei-Texte bleiben unverändert.** Ein Skill-Ergebnis ist ein
  Prüfbefund, keine neue Fassung.

## Was diese Skills nicht können

Minderjährige und Aufsicht, Fotoeinwilligungen, der B2B-Vertragstyp samt
§ 648 BGB, Sportrisiko und Veranstalterhaftung sowie die BFSG-Einordnung
sind von keinem der vier abgedeckt. Diese Themen bleiben offen — siehe
`docs/skills-rechtstexte-pruefung.md` und `docs/rechtliches.md`.
