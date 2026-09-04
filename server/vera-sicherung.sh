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
STATUS="$HEIM/.vera-sicherung-status"
ZEIT=$(date +%Y%m%d_%H%M%S)
DATEI="vera-${ZEIT}.sql.age"
TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT
trap 'echo "$(date -Iseconds) FEHLER" >> "$STATUS"' ERR

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

echo "$(date -Iseconds) OK $DATEI" >> "$STATUS"
echo "Sicherung erfolgreich: $DATEI"
