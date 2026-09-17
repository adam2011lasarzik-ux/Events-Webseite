#!/bin/bash
# ---------------------------------------------------------------
#  Monatliche Erinnerung an Papierunterlagen.
#
#  Gesundheits- und Notfallangaben (Klasse 1) und die vollständigen
#  Einverständniserklärungen (Klasse 2) liegen im Ordner, nicht in
#  der Datenbank. Der Löschlauf kann sie nicht vernichten — er kann
#  nur sagen, was ansteht. Diese Mail ist die einzige Stelle, an der
#  das jemanden erreicht.
#
#  Läuft monatlich über vera-papiererinnerung.timer. Steht nichts an,
#  passiert nichts — es wird ausdrücklich keine "nichts zu tun"-Mail
#  verschickt.
#
#  Von Hand ansehen, ohne zu mailen:
#    sudo -u vera bash -c 'cd /var/www/vera && npm run papier:erinnern -- --zeigen'
# ---------------------------------------------------------------
set -euo pipefail

HEIM=/home/vera
APP=/var/www/vera
STATUS="$HEIM/.vera-papiererinnerung-status"

alarm() {
  echo "$(date -Iseconds) FEHLER" >> "$STATUS"
  ( cd "$APP" && npm run --silent system:alarm -- "Papiererinnerung fehlgeschlagen am $(date -Iseconds)" ) || true
}
trap alarm ERR

cd "$APP"
AUSGABE=$(npm run --silent papier:erinnern)
echo "$AUSGABE"
echo "$(date -Iseconds) OK ${AUSGABE//$'\n'/ }" >> "$STATUS"
