# Ticketarten & Preisverwaltung — Ausroll- und Rückkehrplan

Stand: 08.10.2026. Entwickelt auf `claude/frontend-design-skill-folder-luremb`.
**Noch nicht ausgerollt.** Der Live-Server ist unverändert.

## Was neu ist

1. Buchungsweg „Mehrere Erwachsene" (1 bis `maxErwachsene`, Standard 4),
   serverseitig erzwungen.
2. Event-Feld `maxErwachsene` (Standard 4), im Admin-Eventformular
   einstellbar.
3. Familienpaket muss mindestens 4 Kinder zulassen (serverseitige
   Formularprüfung, keine DB-Regel — Altzeilen bleiben unberührt).
4. Preis-Änderungsprotokoll (Tabelle `PreisAenderung`) und Preis-Übersicht
   im Adminbereich (aktueller Preis, Ticketart, Event, zuletzt geändert).

## Datenbankänderung

Migration `20261008174530_tickets_preisverwaltung`, rein additiv:
- `Event.maxErwachsene INT NOT NULL DEFAULT 4` (Altzeilen bekommen 4).
- neue Tabelle `PreisAenderung`.

Kein Datenverlust, keine bestehende Spalte verändert. Bezahlte Buchungen
behalten ihren eingefrorenen `gesamtpreisCents`.

## Ausrollen (erst nach ausdrücklicher Freigabe)

1. **Sicherung** erstellen: `server/vera-sicherung.sh`, Erfolg im
   Protokoll bestätigen.
2. Auf dem Server: `git pull` des Entwicklungsbranches.
3. `npm ci` (keine neuen Pakete, nur der bestehende Stand).
4. **Migration anwenden:** `npx prisma migrate deploy`
   (wendet genau die eine neue Migration an; `migrate status` vorher
   zeigt sie als ausstehend).
5. `npm run build`.
6. Dienst neu starten.
7. Kurzprüfung: Adminbereich → „Preise" zeigt die Übersicht; ein Event
   öffnen → Feld „Höchstzahl Erwachsene je Buchung" sichtbar;
   Anmeldeseite eines Events → Weg „Mehrere Erwachsene" wählbar.

Passwortschutz und Stripe-Testmodus bleiben wie gehabt; es werden keine
echten Zahlungen und keine E-Mails ausgelöst.

## Rückkehr

Je nach Tiefe:

| Stufe | Maßnahme | Wirkung |
|---|---|---|
| 1 | `git revert` der fünf Commits (5/5 … 1/5) + `npm ci` + build | Code wie vorher |
| 2 | Migration zurücknehmen (SQL unten) | Schema wie vorher |
| 3 | Rücksicherung + `server/vera-nach-wiederherstellung.sh` | vollständiger Stand |

**Migration-Rückkehr-SQL** (nur falls nötig; entfernt nur das Neue):

```sql
DROP TABLE `PreisAenderung`;
ALTER TABLE `Event` DROP COLUMN `maxErwachsene`;
```

Danach `npx prisma generate` mit dem alten Schema. Die Tabelle
`PreisAenderung` enthält nur Protokolldaten (keine Buchungen); ihr
Entfernen verliert keine Teilnehmer- oder Zahlungsdaten.

## Vor dem Deployment noch manuell zu prüfen

1. **Oberfläche am Gerät:** Weg „Mehrere Erwachsene" auf Handy (ab
   320 px) und Rechner durchklicken — Zähler 1–4, Namen je Person,
   erster ist Kontakt. (Automatisch geprüft ist die Logik, nicht das
   Aussehen.)
2. **Echte Testzahlung** über Stripe-Testschlüssel für eine
   Mehr-Erwachsenen-Buchung: Betrag = Anzahl × Erwachsenenpreis, Webhook,
   Bestätigungsmail, Storno, Erstattung. (Die Attrappe deckt das im Test
   ab; der echte Stripe-Testmodus sollte einmal von Hand laufen.)
3. **Flatpreis-Events** (ohne Schüler-Kategorie, `schuelerAktiv=false`):
   Hier erscheint der Weg „Mehrere Erwachsene" bewusst NICHT — die
   Anmeldung bleibt wie bisher auf eine Person. Falls dort künftig auch
   mehrere Erwachsene möglich sein sollen, ist das eine eigene, noch
   nicht umgesetzte Erweiterung.
4. **Preis-Übersicht** mit mehreren Events gegenlesen; „zuletzt geändert"
   erscheint erst nach der ersten Preisänderung bzw. Neuanlage nach dem
   Ausrollen (Altzeilen haben noch keinen Protokolleintrag).

## Nachtrag 08.10.2026: harte Grenze 6 Personen je Buchung

Pro Buchung insgesamt höchstens 6 Personen, über alle Ticketarten. Familienpaket: mindestens 4 Kinder und zusammen mit den enthaltenen Erwachsenen höchstens 6 — mit 2 Erwachsenen also genau 4 Kinder. maxErwachsene ist auf 1..6 begrenzt. Manipulierte Über-Anfragen werden serverseitig abgelehnt, nicht still gekappt. Keine Schemaänderung; dieselben Ausroll- und Rückkehrschritte wie oben.
