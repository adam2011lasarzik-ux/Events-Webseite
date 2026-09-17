# Löschkonzept produktiv setzen — Ablaufbuch

Für die Hostinger-Webkonsole. **Ein Block nach dem anderen**, und nach
jedem sehen, ob die erwartete Ausgabe kommt. Bei einer Abweichung
anhalten und nachfragen, statt weiterzumachen.

Warum als Anleitung statt als Automatik: Claude Code hat keinen Zugang
zum VPS. Gemessen — `veraevents.de` antwortet aus der Arbeitsumgebung
nicht, Port 22 ebenfalls nicht, es gibt dort weder SSH-Client noch
Schlüssel. Der Zugang läuft über die Webkonsole, und die bedienst du.

**Betriebsregel der Webkonsole** (aus Phase 3, mehrfach bestätigt):
Vor jedem Einfügen warten, bis die Eingabezeile ruhig und leer ist.
Sonst verschluckt oder vermischt sie Zeichen.

---

## Schritt 0 — Wo stehen wir?

```bash
cd /var/www/vera && git log --oneline -1 && systemctl is-active vera mariadb
```

Erwartet: drei Zeilen, zweimal `active`. Steht der letzte Commit noch
auf einem Stand vor dem Löschkonzept, ist das richtig so — Schritt 2
holt ihn.

---

## Schritt 1 — Sicherung kontrollieren

**Vor** der Migration, nicht danach. Eine Migration ohne geprüfte
Sicherung ist eine Wette.

```bash
tail -5 /home/vera/.vera-sicherung-status
```

Erwartet: die letzte Zeile beginnt mit dem heutigen oder gestrigen
Datum und trägt `OK`. Steht dort `FEHLER` oder ist die letzte Zeile
älter als zwei Tage: **hier anhalten.**

```bash
rclone --config /home/vera/.config/rclone/rclone.conf lsl b2lesen:Vera-sicherungen | tail -3
```

Erwartet: mindestens eine Datei von heute oder gestern, Größe deutlich
über null.

Eine Sicherung von Hand anstoßen, falls die letzte zu alt ist:

```bash
sudo systemctl start vera-sicherung.service && sleep 30 && tail -2 /home/vera/.vera-sicherung-status
```

---

## Schritt 2 — Code holen und produktiv migrieren

```bash
cd /var/www/vera && sudo -u vera git pull
```

```bash
cd /var/www/vera && sudo -u vera npx prisma migrate status
```

Erwartet: `20260917131938_loeschkonzept` erscheint als **nicht
angewendet**. Steht dort „Database schema is up to date", ist die
Migration schon gelaufen — dann weiter zu Schritt 3.

**Jetzt die Migration. Produktionsbefehl, nicht `migrate dev`:**

```bash
cd /var/www/vera && sudo -u vera npm run db:deploy
```

Erwartet: `1 migration found` und `applied`. Die Migration ist rein
additiv — ein `ADD COLUMN` mit Vorgabewert und fünf `CREATE TABLE`,
kein `DROP`, kein `MODIFY`, keine Datenwanderung. Bestehende Zeilen
werden nicht angefasst.

**Nachzählen, dass wirklich nichts verloren ging:**

```bash
mariadb -u vera -p"$(cat /home/vera/.vera_db_password)" vera -e "
SELECT 'Anmeldungen' t, COUNT(*) n FROM Registration
UNION ALL SELECT 'Teilnehmer', COUNT(*) FROM Participant
UNION ALL SELECT 'Events', COUNT(*) FROM Event;"
```

Die Zahlen müssen denen vor der Migration entsprechen.

```bash
cd /var/www/vera && sudo -u vera npm run build && sudo systemctl restart vera && sleep 5 && curl -s -o /dev/null -w "%{http_code}\n" https://veraevents.de/
```

Erwartet: `200`.

---

## Schritt 3 + 4 — Trockenlauf: was wäre betroffen?

**Dies ist der Schritt, an dem entschieden wird.** Der Probelauf
verändert kein personenbezogenes Feld und löscht keine Zeile.

```bash
cd /var/www/vera && sudo -u vera npm run loeschen:vorschau
```

Die Ausgabe nennt je Klasse, wie viele Datensätze fällig wären, was
übersprungen wird und warum, und was auf Papier ansteht.

**Erwartung bei heutigem Datenstand: `Entscheidungen: 0`.** Die
Veranstaltung liegt 2026; die kürzeste Frist in der Datenbank sind drei
Jahre ab Jahresende, also frühestens Ende 2029. Steht dort eine höhere
Zahl, ist das **kein Fehler, sondern ein Befund** — dann die Liste
ansehen und erst weitermachen, wenn klar ist, worum es sich handelt.

Dieselbe Vorschau im Browser, mit Kennungen und Fälligkeitsdaten:

```
https://veraevents.de/admin/loeschen
```

---

## Schritt 8 (vorgezogen) — Zahlungs- und Steuerdaten festhalten

Vor dem ersten echten Lauf einen Fingerabdruck der steuerrelevanten
Felder nehmen. Nach dem Lauf muss er identisch sein.

```bash
mariadb -u vera -p"$(cat /home/vera/.vera_db_password)" vera -e "
SELECT COUNT(*) AS zeilen,
       SUM(gesamtpreisCents) AS summe,
       MD5(GROUP_CONCAT(id, '|', gesamtpreisCents, '|',
           COALESCE(bezahlterBetragCents,'-'), '|',
           COALESCE(bezahltAm,'-'), '|', zahlungsStatus, '|',
           COALESCE(zahlungsReferenz,'-'), '|',
           COALESCE(zahlungsAbsicht,'-'), '|', angemeldetAm
           ORDER BY id SEPARATOR ';')) AS fingerabdruck
FROM Registration;"
```

**Diesen Fingerabdruck notieren.** Er umfasst genau die sieben Felder,
die `lib/anonymisieren.ts` als `STEUERRELEVANTE_FELDER` führt, plus die
Anmeldenummer.

---

## Schritt 5 — Löschjob einrichten und aktivieren

```bash
sudo cp /var/www/vera/server/vera-loeschlauf.sh /usr/local/bin/ && \
sudo cp /var/www/vera/server/vera-nach-wiederherstellung.sh /usr/local/bin/ && \
sudo cp /var/www/vera/server/vera-papiererinnerung.sh /usr/local/bin/ && \
sudo chmod +x /usr/local/bin/vera-loeschlauf.sh /usr/local/bin/vera-nach-wiederherstellung.sh /usr/local/bin/vera-papiererinnerung.sh && \
echo "Skripte kopiert"
```

```bash
sudo cp /var/www/vera/server/vera-loeschlauf.service /etc/systemd/system/ && \
sudo cp /var/www/vera/server/vera-loeschlauf.timer /etc/systemd/system/ && \
sudo cp /var/www/vera/server/vera-papiererinnerung.service /etc/systemd/system/ && \
sudo cp /var/www/vera/server/vera-papiererinnerung.timer /etc/systemd/system/ && \
sudo systemctl daemon-reload && echo "Dienste eingelesen"
```

```bash
sudo systemctl enable --now vera-loeschlauf.timer && sudo systemctl enable --now vera-papiererinnerung.timer && echo "Timer aktiv"
```

**Einmal von Hand laufen lassen, im selben Moment zusehen:**

```bash
sudo systemctl start vera-loeschlauf.service && journalctl -u vera-loeschlauf.service -n 40 --no-pager
```

Erwartet: erst der Probelauf, dann der echte Lauf, beide ohne Fehler.
Der Dienst macht beides hintereinander — bricht der echte ab, steht im
Protokoll, was er vorhatte.

---

## Schritt 6 — Zeitpunkt und nächster Lauf

```bash
systemctl list-timers vera-loeschlauf.timer vera-papiererinnerung.timer vera-sicherung.timer --no-pager
```

Zu erwarten ist diese Reihenfolge, und sie ist Absicht:

| Dienst | Zeitpunkt (UTC) | warum |
|---|---|---|
| `vera-sicherung.timer` | täglich 03:30 (+ bis 10 min) | sichert den Stand **vor** der Löschung |
| `vera-loeschlauf.timer` | täglich 04:15 (+ bis 5 min) | erst danach wird gelöscht |
| `vera-papiererinnerung.timer` | 1. des Monats, 08:00 (+ bis 30 min) | vormittags deutscher Zeit, damit die Mail gelesen wird |

04:15 UTC sind **06:15 deutscher Sommerzeit** bzw. 05:15 Winterzeit.

Die Spalte `NEXT` nennt das nächste Ausführungsdatum. Trag es unten in
Abschnitt „Produktiver Stand" ein.

---

## Schritt 7 — Löschsperre und Protokollierung prüfen

Nicht mit erfundenen Daten, sondern mit einer echten Buchung — und
ohne sie zu verändern.

**a) Eine Kennung holen:**

```bash
mariadb -u vera -p"$(cat /home/vera/.vera_db_password)" vera -N -e "SELECT id FROM Registration LIMIT 1;"
```

Gibt es noch keine Buchung, überspringe 7a–7d und prüfe stattdessen im
Browser, dass `/admin/loeschen` die leere Vorschau und das Formular
zeigt.

**b) Im Browser eine Sperre setzen:** `https://veraevents.de/admin/loeschen`
→ Abschnitt „Löschsperre von Hand setzen" → Art `Anmeldung`, die
Kennung aus 7a, Grund `Beschwerde`, Notiz „Prüfung der Einrichtung".

Erwartet: Die Sperre erscheint unter „Offene Löschsperren" mit Grund,
Zeitpunkt und deiner Kennung.

**c) Probelauf — die Sperre muss greifen:**

```bash
cd /var/www/vera && sudo -u vera npm run loeschen:vorschau
```

Erwartet: Der Datensatz erscheint als `uebersprungen` mit Grund
`gesperrt` — **auch wenn er ohnehin nicht fällig wäre**, taucht er
dann nicht auf; das ist richtig. Entscheidend ist, dass er **nicht**
als `faellig` erscheint.

**d) Protokoll ansehen:**

```bash
mariadb -u vera -p"$(cat /home/vera/.vera_db_password)" vera -e "
SELECT zeitpunkt, klasse, zielArt, aktion, grund, probelauf
FROM Loeschprotokoll ORDER BY zeitpunkt DESC LIMIT 10;"
```

Erwartet: Zeilen mit Kennungen — **kein Name, keine E-Mail-Adresse,
keine Telefonnummer.** Genau das ist der Punkt: Ein Protokoll, das die
Daten enthält, die es löschen half, wäre eine Kopie der Löschung.

**e) Sperre wieder aufheben** (im Browser, Knopf „Aufheben"). Sie wird
nicht gelöscht, sondern mit Zeitpunkt und Person abgeschlossen — sonst
bliebe später offen, ob es je eine Sperre gab.

---

## Schritt 8 — Steuer- und Zahlungsdaten gegenprüfen

Denselben Befehl wie oben erneut:

```bash
mariadb -u vera -p"$(cat /home/vera/.vera_db_password)" vera -e "
SELECT COUNT(*) AS zeilen,
       SUM(gesamtpreisCents) AS summe,
       MD5(GROUP_CONCAT(id, '|', gesamtpreisCents, '|',
           COALESCE(bezahlterBetragCents,'-'), '|',
           COALESCE(bezahltAm,'-'), '|', zahlungsStatus, '|',
           COALESCE(zahlungsReferenz,'-'), '|',
           COALESCE(zahlungsAbsicht,'-'), '|', angemeldetAm
           ORDER BY id SEPARATOR ';')) AS fingerabdruck
FROM Registration;"
```

**Der Fingerabdruck muss Zeichen für Zeichen derselbe sein wie vorher.**
Weicht er ab, obwohl der Lauf etwas anonymisiert hat, ist das ein
echter Fehler — dann anhalten und melden.

---

## Schritt 9 — Papiererinnerung prüfen

Ansehen, was verschickt würde, ohne zu mailen:

```bash
cd /var/www/vera && sudo -u vera npm run papier:erinnern -- --zeigen
```

Erwartet bei heutigem Stand: „Keine Papierunterlagen fällig. Es wird
nicht gemailt." Das ist richtig — die Veranstaltung liegt 2026, die
Sieben-Tage-Frist für Gesundheitsangaben beginnt erst danach.

Den Versandweg trotzdem einmal belegen:

```bash
sudo systemctl start vera-papiererinnerung.service && journalctl -u vera-papiererinnerung.service -n 20 --no-pager
```

---

## Produktiver Stand — hier eintragen

| | |
|---|---|
| Migration `20260917131938_loeschkonzept` angewendet am | |
| Zeilen in `Registration` vorher / nachher | / |
| Fingerabdruck Steuer-/Zahlungsdaten vorher | |
| Fingerabdruck nachher | |
| Trockenlauf: Entscheidungen | |
| `vera-loeschlauf.timer` aktiv seit | |
| nächster Löschlauf | |
| `vera-papiererinnerung.timer` aktiv seit | |
| nächste Papiererinnerung | |
| Sperre gesetzt und wieder aufgehoben | ja / nein |
| Protokoll ohne Personendaten belegt | ja / nein |

---

## Wenn etwas schiefgeht

```bash
# Was hat der letzte Lauf getan?
tail -5 /home/vera/.vera-loeschlauf-status
journalctl -u vera-loeschlauf.service -n 60 --no-pager

# Den Job anhalten, ohne ihn zu entfernen:
sudo systemctl disable --now vera-loeschlauf.timer
```

Ist etwas gelöscht worden, das nicht gelöscht gehörte: Sicherung
einspielen und danach **zwingend**
`/usr/local/bin/vera-nach-wiederherstellung.sh` laufen lassen, bevor
der Dienst wieder startet. Sonst sind auch alle richtigen Löschungen
zurückgenommen. Die Einzelheiten stehen in
[`loeschkonzept-betrieb.md`](loeschkonzept-betrieb.md) und
[`sicherung.md`](sicherung.md).
