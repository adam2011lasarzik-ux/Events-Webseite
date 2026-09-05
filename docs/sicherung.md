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

## Was noch offen ist

- **Alarm bei ausbleibender Sicherung.** Bricht die nächtliche
  Sicherung ab, steht das zwar im Protokoll (`journalctl -u
  vera-sicherung.service`) und in der Statusdatei, aber niemand wird
  benachrichtigt. Das kommt mit Phase 8 (E-Mail-Versand).
- **`/etc/vera-backup.env` aufräumen.** Enthält eine ungenutzte Kopie
  der Backblaze-Zugangsdaten und den zweiten, falschen
  `AGE_RECIPIENT`. Kein Skript verwendet die Datei.
