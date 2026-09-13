# Datenbank-Sicherung von VERA

Kurzfassung: Jede Nacht um 03:30 Uhr wird die Datenbank gesichert,
**verschlüsselt** und zu Backblaze B2 hochgeladen. Der Schlüssel zum
Entschlüsseln liegt **nicht auf dem Server**, sondern nur im
Passwort-Manager des Betreibers.

---

## Wie es aufgebaut ist

```
03:30 Uhr  vera-sicherung.timer
             └─ vera-sicherung.service
                  └─ /usr/local/bin/vera-sicherung.sh
                       ├─ mariadb-dump der Datenbank "vera"
                       ├─ age-Verschlüsselung (öffentlicher Schlüssel)
                       ├─ rclone → Backblaze B2, Bucket "Vera-sicherungen"
                       └─ Vermerk in /home/vera/.vera-sicherung-status
```

Dateiname je Sicherung: `vera-JJJJMMTT_HHMMSS.sql.age`

## Die zwei Sorten Schlüssel — nicht verwechseln

**1. Der Verschlüsselungs-Schlüssel (age).** Ein Paar aus zwei Teilen:

| Teil | Wo er liegt | Wozu |
|---|---|---|
| öffentlich (`age1...`) | `/home/vera/.config/vera/age-public-key.txt` | verschlüsseln — darf auf dem Server liegen, ist kein Geheimnis |
| geheim (`AGE-SECRET-KEY-1...`) | **nur** im Passwort-Manager | entschlüsseln — liegt bewusst NICHT auf dem Server |

Das ist der Kern des Schutzes: Der Server kann Sicherungen **erzeugen**,
aber selbst niemals **lesen**. Wer den Server übernimmt, bekommt die
Daten aus den Sicherungen nicht.

**Ohne den geheimen Schlüssel sind alle Sicherungen unlesbar. Er ist
durch nichts zu ersetzen.**

**2. Die Backblaze-Zugangsschlüssel.** Zwei getrennte, in
`/home/vera/.config/rclone/rclone.conf`:

| Name | Darf | Darf nicht |
|---|---|---|
| `b2vera` | hochladen | lesen |
| `b2lesen` | lesen, herunterladen | schreiben |

Geprüft mit `vera-b2-pruefung.sh` — beide Richtungen werden
nachweislich abgewiesen.

## Schutz gegen Löschen

- **Objektsperre 90 Tage**: Hochgeladene Dateien sind 90 Tage lang
  wirklich unlöschbar — auch für jemanden, der den Server samt
  Schreib-Zugang übernommen hat.
- **Aufbewahrung 180 Tage**: Danach räumt Backblaze alte Sicherungen
  automatisch ab, damit der Speicher nicht endlos wächst.

## Regelmäßig prüfen

```bash
# Läuft die Sicherung? Die letzten Läufe ansehen:
tail -5 /home/vera/.vera-sicherung-status

# Was liegt in der Cloud?
rclone --config /home/vera/.config/rclone/rclone.conf lsl b2lesen:Vera-sicherungen

# Ist die Anbindung in Ordnung? (beide Zugänge, Trennung)
/usr/local/bin/vera-b2-pruefung.sh

# Lässt sich eine Sicherung wirklich zurückspielen?
sudo /usr/local/bin/vera-ruecktest.sh
```

**Der Rückspiel-Test gehört mindestens alle paar Monate gemacht.**
Eine Sicherung, die nie zurückgespielt wurde, ist keine Sicherung.
Er fasst die echte Datenbank nicht an — er spielt in eine getrennte
Testdatenbank ein, zählt nach und räumt sie wieder ab.

**Wie das Ergebnis zu lesen ist.** Der Test vergleicht die Sicherung mit
dem **aktuellen** Stand der Datenbank, nicht mit dem Stand zum Zeitpunkt
der Sicherung. Wer ihn tagsüber startet, nachdem gearbeitet wurde,
bekommt deshalb zwangsläufig „ABWEICHUNGEN GEFUNDEN" — in jeder Tabelle,
die sich seit 03:30 Uhr geändert hat. Entscheidend ist nicht die
Gesamtmeldung, sondern die **Richtung**:

| | Bedeutung |
|---|---|
| Live hat **mehr** Zeilen als die Sicherung | seit der Sicherung kamen Daten dazu — normal |
| Sicherung hat **mehr** Zeilen als Live | live fehlt etwas — das gehört geprüft |

**Automatisch überwacht wird die Sicherung ohnehin.** Die Wache prüft
alle 15 Minuten, ob der Vermerk in `/home/vera/.vera-sicherung-status`
jünger als 48 Stunden ist, ob er auf `FEHLER` endet und ob er überhaupt
existiert — bei jedem dieser Fälle geht eine E-Mail raus. Siehe
`docs/ueberwachung.md`.

## Im Ernstfall: eine Sicherung wirklich zurückspielen

Bewusst kein Skript — das soll man mit wachem Kopf tun.

```bash
# 1. Welche Sicherungen gibt es?
rclone --config /home/vera/.config/rclone/rclone.conf lsl b2lesen:Vera-sicherungen

# 2. Die gewünschte holen
cd $(mktemp -d)
rclone --config /home/vera/.config/rclone/rclone.conf \
  copyto b2lesen:Vera-sicherungen/vera-JJJJMMTT_HHMMSS.sql.age ./s.age

# 3. Entschlüsseln (fragt nach dem geheimen Schlüssel)
age -d -o s.sql s.age

# 4. ERST die jetzige Datenbank sichern, bevor irgendetwas überschrieben wird
sudo mariadb-dump --single-transaction vera > vorher-$(date +%F_%H%M).sql

# 5. Dienst anhalten, einspielen, wieder starten
sudo systemctl stop vera
sudo mariadb vera < s.sql
sudo systemctl start vera

# 6. Nachsehen, ob die Seite läuft
curl -s -o /dev/null -w "%{http_code}\n" https://veraevents.de/
```

## Zwischenfall am 04./05.09.2026 — zur Warnung

Der erste Rückspiel-Test schlug fehl: `no identity matched any of the
recipients`. Ursache war **nicht** die Technik, sondern eine
Schlüssel-Verwechslung.

Zwischen dem Erzeugen des echten Schlüssels und dem Test wurde auf
dem Server ein **zweiter** age-Schlüssel erzeugt (erkennbar an
`/etc/vera-backup.env` mit einem abweichenden `AGE_RECIPIENT` und an
`/tmp/vera-age-test.age`). Im Passwort-Manager landete dieser zweite
statt des echten. Die Sicherungen waren damit vorübergehend nicht
entschlüsselbar.

Zwei Lehren:

1. **Es darf genau EINEN Verschlüsselungs-Schlüssel geben.** Wird
   irgendwo ein zweiter erzeugt, muss sofort klar sein, welcher der
   gültige ist.
2. **Nach jeder Schlüssel-Änderung sofort gegenprüfen:**
   `/usr/local/bin/vera-schluessel-pruefen.sh` vergleicht den
   gespeicherten geheimen Schlüssel mit dem, den der Server benutzt.
   Das dauert zehn Sekunden und hätte den Fehlschlag sofort gezeigt.

## Rückspiel-Test vom 13.09.2026 — erfolgreich

Der erste vollständige Durchlauf nach dem Zwischenfall oben:

| Schritt | Ergebnis |
|---|---|
| Sicherung `vera-20260913_033505.sql.age` von Backblaze geladen | 26 980 Bytes |
| Mit dem Schlüssel aus dem Passwort-Manager entschlüsselt | 26 780 Bytes |
| Sicherheitsprüfung auf `USE`/`CREATE DATABASE` | keine gefunden, Einspielen isoliert |
| In `vera_ruecktest` eingespielt | ohne Fehler |
| Testdatenbank danach wieder entfernt | ja |

**Damit ist die Schlüssel-Verwechslung vom 04./05.09. erledigt:** Der im
Passwort-Manager hinterlegte geheime Schlüssel ist der richtige, und die
Sicherungen sind nachweislich wiederherstellbar.

Der Test meldete dabei „ABWEICHUNGEN GEFUNDEN". Das war erwartbar und
kein Datenverlust — er lief um 20:00 Uhr gegen eine Sicherung von 03:35
Uhr, dazwischen lag ein Tag mit Zahlungs- und Storno-Tests. Abweichungen
gab es genau in den vier Tabellen, in denen an diesem Tag gearbeitet
wurde (`Registration`, `Participant`, `ZahlungsEreignis`,
`AnmeldeVersuch`), und überall hatte die Live-Datenbank **mehr** Zeilen.
Alles Unberührte — `Event`, `EventAbschnitt`, `AdminUser`, `Settings`,
`_prisma_migrations` — stimmte exakt überein.

Eine Anmeldung stand in der Sicherung und fehlte live. Nachgeprüft durch
direktes Auslesen der entschlüsselten Sicherung: Es war eine am 06.09.
um 13:59 Uhr angelegte und um 16:11 Uhr desselben Tages stornierte
Testbuchung ohne Zahlungsspur, die im Lauf des 13.09. aufgeräumt wurde.

**Nebenbefund:** Dass dafür eine Sicherung entschlüsselt werden musste,
liegt daran, dass das Löschen einer Anmeldung keine Spur hinterlässt —
es gibt kein Protokoll darüber, wer wann was entfernt hat. Für den
Testbetrieb unerheblich, für den Echtbetrieb mit Kundendaten ein Punkt
für die Liste.

## `/etc/vera-backup.env` — entfernt (geprüft am 13.09.2026)

Diese Datei stammte nicht aus dem VERA-Aufbau. Sie enthielt eine
ungenutzte Zweitkopie der Backblaze-Zugangsdaten und einen zweiten,
**falschen** `AGE_RECIPIENT` — genau die Verwechslung, an der der erste
Rückspiel-Test scheiterte.

Sie ist entfernt. Am 13.09.2026 nachgeprüft:

- `/etc/vera-backup.env` existiert nicht mehr.
- Kein Sicherungs-, Rückspiel- oder Überwachungsskript, keine
  systemd-Unit und kein Cron-Eintrag verweist darauf.
- Eine Suche über das gesamte Dateisystem
  (`find / -xdev -name "*vera-backup*"`) findet keine Kopie — auch
  keine Sicherheitskopie an anderer Stelle.
- Die nächtliche Sicherung ist seitdem jede Nacht durchgelaufen. Das
  Entfernen hat nichts beeinträchtigt.

Das Hilfsskript `/usr/local/bin/vera-env-aufraeumen.sh` bleibt liegen.
Es prüft zuerst an dreizehn Stellen, ob die Datei irgendwo verwendet
wird, bricht bei auch nur einem Treffer ab und löscht dann **nichts**;
fehlt die Datei, meldet es „Nichts zu tun" und beendet sich. Ein
erneuter Aufruf ist damit folgenlos.

Es gibt damit **einen** gültigen Verschlüsselungs-Schlüssel: den
öffentlichen Teil in `/home/vera/.config/vera/age-public-key.txt` und
seinen geheimen Gegenpart im Passwort-Manager. Kommt je ein zweiter
dazu, gilt die Lehre von oben — sofort klären, welcher der gültige ist.
