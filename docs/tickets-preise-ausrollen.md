# Ticketarten & Preisverwaltung — Ausroll- und Rückkehrplan

Stand: 08.10.2026. Entwickelt auf `claude/frontend-design-skill-folder-luremb`.
**Noch nicht ausgerollt.** Der Live-Server ist unverändert.

## Was neu ist

1. Buchungsweg „Mehrere Erwachsene" (1 bis `maxErwachsene`, Standard 4),
   serverseitig erzwungen.
2. Event-Feld `maxErwachsene` (Standard 4, einstellbar **1 bis 6**), im
   Admin-Eventformular.
3. **Harte Obergrenze: 6 Personen je Buchung** — über alle Ticketarten
   (Erwachsene, Schüler, Familie). Serverseitig erzwungen; eine
   manipulierte Über-Anfrage wird **abgelehnt**, nicht still gekappt.
4. Familienpaket: **mindestens 4 Kinder** und zusammen mit den
   enthaltenen Erwachsenen höchstens 6 Personen. Mit den üblichen 2
   enthaltenen Erwachsenen sind das **genau 4 Kinder** (= 6 Personen).
   Ein Familienpaket darf höchstens 2 enthaltene Erwachsene haben.
5. Preis-Änderungsprotokoll (Tabelle `PreisAenderung`) und Preis-Übersicht
   im Adminbereich (aktueller Preis, Ticketart, Event, zuletzt geändert).

## Datenbankänderung

Migration `20261008174530_tickets_preisverwaltung`, rein additiv:
- `Event.maxErwachsene INT NOT NULL DEFAULT 4` (Altzeilen bekommen 4).
- neue Tabelle `PreisAenderung`.

Die 6-Personen-Grenze ist **keine** Schemaänderung — sie steht als
Konstante im Code (`lib/preise.ts`). Kein Datenverlust, keine bestehende
Spalte verändert. Bezahlte Buchungen behalten ihren eingefrorenen
`gesamtpreisCents`.

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
| 1 | `git revert` der betroffenen Commits + `npm ci` + build | Code wie vorher |
| 2 | Migration zurücknehmen (SQL unten) | Schema wie vorher |
| 3 | Rücksicherung + `server/vera-nach-wiederherstellung.sh` | vollständiger Stand |

Die 6-Personen-Grenze wird allein durch `git revert` zurückgenommen
(keine Schema- oder Datenänderung).

**Migration-Rückkehr-SQL** (nur falls nötig; entfernt nur das Neue):

```sql
DROP TABLE `PreisAenderung`;
ALTER TABLE `Event` DROP COLUMN `maxErwachsene`;
```

Danach `npx prisma generate` mit dem alten Schema. Die Tabelle
`PreisAenderung` enthält nur Protokolldaten (keine Buchungen); ihr
Entfernen verliert keine Teilnehmer- oder Zahlungsdaten.

---

## Offene manuelle Schritte (erledigst du später selbst)

Die Logik ist automatisch geprüft (volle Suite grün). Was eine Maschine
hier **nicht** abnehmen kann — Aussehen am echten Gerät und ein echter
Stripe-Testkauf — bleibt dir. Alles im **Testmodus**, keine echten
Zahlungen.

### A — Oberfläche am Handy (ab 320 px Breite)

Anmeldeseite eines Events mit Schüler-Kategorie öffnen und je Ticketart
durchklicken:

- [ ] **Mehrere Erwachsene:** Zähler geht 1 bis 4 (bzw. bis zum am Event
      gesetzten Wert, höchstens 6); je Person ein Namensfeld, die erste
      Person hat Kontaktfelder (E-Mail/Telefon).
- [ ] **Familienpaket:** steht fest auf 4 Kinder; 2 Erwachsene + 4 Kinder
      = 6 Personen; Preis stimmt mit der Zusammenfassung überein.
- [ ] **Mein Kind / Schule:** Zähler bis 6 Kinder; mit Haken „Ich komme
      selbst mit" sinkt die mögliche Kinderzahl auf 5 (zusammen 6).
- [ ] Nichts läuft über den Rand, keine abgeschnittenen Felder, Zähler
      mit dem Daumen bedienbar.

### B — Oberfläche am Rechner

- [ ] Dieselben drei Ticketarten wie unter A, breite Ansicht.
- [ ] Tastaturbedienung: mit Tab durch Auswahl, Zähler und Felder; die
      Plus-/Minus-Knöpfe der Zähler sind mit der Tastatur erreichbar.
- [ ] Die Preis-Zusammenfassung zeigt denselben Betrag, der danach auf
      der Stripe-Seite steht.

### C — Stripe-Testkauf (Testmodus, kein echtes Geld)

Mit einer Stripe-Testkarte (z. B. `4242 4242 4242 4242`, beliebiges
künftiges Datum, beliebiger CVC):

- [ ] **Mehr-Erwachsenen-Buchung** (z. B. 3 Erwachsene): Betrag auf der
      Stripe-Seite = Anzahl × Erwachsenenpreis.
- [ ] Zahlung abschließen → Bestätigungsmail kommt an; im Adminbereich
      erscheint die Anmeldung mit der richtigen Personenzahl, der Platz
      ist belegt.
- [ ] **Familienpaket** (2 + 4 = 6 Personen): Betrag = Grundpreis + 3
      weitere Kinder; belegt 6 Plätze.
- [ ] **Abbruch** auf der Stripe-Seite → es entsteht **keine** Anmeldung
      und **kein** belegter Platz.
- [ ] **Storno** einer bezahlten Buchung → volle Erstattung wird
      angewiesen, beide E-Mails gehen raus.
- [ ] **Teilerstattung** über den Adminbereich → Zahlungsstatus zeigt
      „teilweise erstattet".
- [ ] **Grenze:** Versuch, mehr als 6 Personen zu buchen (z. B. über die
      Entwicklerwerkzeuge manipuliert) → wird abgelehnt, keine
      Bezahlseite.

### D — Weitere Punkte

- [ ] **Flatpreis-Events** (ohne Schüler-Kategorie, `schuelerAktiv=false`):
      Hier erscheint der Weg „Mehrere Erwachsene" bewusst **nicht** — die
      Anmeldung bleibt auf eine Person. Nur bestätigen, dass das so
      gewollt ist; eine Mehr-Erwachsenen-Buchung dort wäre eine eigene,
      noch nicht umgesetzte Erweiterung.
- [ ] **Preis-Übersicht** (Adminbereich → „Preise") mit mehreren Events
      gegenlesen; „zuletzt geändert" erscheint erst nach der ersten
      Preisänderung bzw. Neuanlage nach dem Ausrollen (Altzeilen haben
      noch keinen Protokolleintrag).

Erst wenn A–D für dich passen und du ausdrücklich freigibst, rollen wir
gemeinsam live aus.
