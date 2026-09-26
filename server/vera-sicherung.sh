#!/bin/bash
# ---------------------------------------------------------------
#  Nächtliche, verschlüsselte Sicherung der VERA-Datenbank.
#
#  Ablauf: Datenbank sichern -> mit dem öffentlichen age-Schlüssel
#  verschlüsseln (der geheime Gegenpart liegt NICHT auf diesem
#  Server) -> zu Backblaze B2 hochladen -> Erfolg/Fehler vermerken.
#
#  Wird nachts automatisch über den systemd-Timer
#  vera-sicherung.timer gestartet. Manuell testen mit:
#    sudo systemctl start vera-sicherung.service
#    journalctl -u vera-sicherung.service -n 20
# ---------------------------------------------------------------
set -euo pipefail

HEIM=/home/vera
APP=/var/www/vera
STATUS="$HEIM/.vera-sicherung-status"
ZEIT=$(date +%Y%m%d_%H%M%S)
DATEI="vera-${ZEIT}.sql.age"
TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT

# Nur bei einem FEHLER wird eine Mail verschickt — bei einer
# erfolgreichen Sicherung ausdrücklich nicht (Wunsch aus Phase 8).
# "|| true" hier UND in der aufgerufenen Datei selbst: Schlägt der
# Mail-Versand fehl (SMTP noch nicht eingerichtet, kein Netz), soll
# das die eigentliche Fehlermeldung dieses Skripts nicht verdecken.
alarm() {
  echo "$(date -Iseconds) FEHLER" >> "$STATUS"
  ( cd "$APP" && npm run --silent sicherung:alarm -- "Sicherung fehlgeschlagen am $(date -Iseconds)" ) || true
}
trap alarm ERR

OEFFENTLICHER_SCHLUESSEL=$(cat "$HEIM/.config/vera/age-public-key.txt")
DB_PASSWORT=$(cat "$HEIM/.vera_db_password")

mariadb-dump --single-transaction -u vera -p"$DB_PASSWORT" vera \
  | age -r "$OEFFENTLICHER_SCHLUESSEL" -o "$TMP"

# Der Bucket heisst "Vera-sicherungen" mit grossem V — Backblaze
# unterscheidet Gross- und Kleinschreibung, und der Anwendungsschluessel
# ist genau auf diesen Namen beschraenkt.
#
# --no-check-dest ist noetig, WEIL der Schluessel nur schreiben darf:
# Sonst sieht rclone erst am Ziel nach, ob die Datei schon existiert,
# und dieser Lesezugriff wird (richtigerweise) mit 401 abgewiesen.
# Ueberschreiben kann dabei nicht passieren — jeder Dateiname traegt
# einen Zeitstempel auf die Sekunde genau.
rclone --config "$HEIM/.config/rclone/rclone.conf" copyto --no-check-dest "$TMP" "b2vera:Vera-sicherungen/$DATEI"

# ── Der Schluessel fuer die Anmeldedaten, als zweite Datei ────────
#
# Warum ueberhaupt: Seit dem Umbau vom 25.09.2026 liegen die
# Anmeldedaten zwischen dem Absenden des Formulars und der bestaetigten
# Zahlung NUR verschluesselt beim Zahlungsanbieter. Geht
# ANMELDUNG_SCHLUESSEL verloren, ist das Geld da und die Anmeldung
# unlesbar. Er gehoert deshalb gesichert.
#
# Warum JEDE NACHT und nicht einmal: Der Bucket raeumt nach 180 Tagen
# auf. Eine einmal hochgeladene Schluesseldatei waere im siebten Monat
# weg, waehrend der Schluessel weiter in Gebrauch ist - eine Sicherung,
# die still verfaellt, ist schlimmer als keine. So traegt immer die
# neueste Nacht auch den aktuellen Schluessel.
#
# Warum eine ZWEITE Datei und nicht in denselben Strom: Die
# Sicherungsdatei muss reines SQL bleiben. Sonst scheiterte das
# Zurueckspielen mit `age -d ... | mariadb` an einer Zeile, die kein
# SQL ist - und zwar im Ernstfall, wenn niemand Zeit zum Suchen hat.
#
# Warum nur DIESE eine Zeile und nicht die ganze .env: Das Datenbank-
# Passwort, die Zahlungsschluessel und das SMTP-Passwort haben hier
# nichts zu suchen. Wer den geheimen age-Schluessel hat, bekaeme sonst
# mit einer Datei alles auf einmal.
SCHLUESSEL_DATEI="vera-schluessel-${ZEIT}.age"
TMP2=$(mktemp)
trap 'rm -f "$TMP" "$TMP2"' EXIT

if grep -q '^ANMELDUNG_SCHLUESSEL=' "$APP/.env"; then
  grep '^ANMELDUNG_SCHLUESSEL=' "$APP/.env" | age -r "$OEFFENTLICHER_SCHLUESSEL" -o "$TMP2"
  rclone --config "$HEIM/.config/rclone/rclone.conf" copyto --no-check-dest "$TMP2" "b2vera:Vera-sicherungen/$SCHLUESSEL_DATEI"
  echo "$(date -Iseconds) OK $SCHLUESSEL_DATEI" >> "$STATUS"
else
  # Kein Abbruch: Bis zum Ausrollen von Stufe 2 gibt es den Schluessel
  # noch nicht, und die Datenbanksicherung ist deswegen nicht weniger
  # gueltig. Vermerkt wird es trotzdem - stillschweigend zu ueberspringen
  # waere genau die Art Luecke, die erst im Ernstfall auffaellt.
  echo "$(date -Iseconds) HINWEIS ANMELDUNG_SCHLUESSEL fehlt in .env - nicht gesichert" >> "$STATUS"
fi

echo "$(date -Iseconds) OK $DATEI" >> "$STATUS"
echo "Sicherung erfolgreich: $DATEI"
