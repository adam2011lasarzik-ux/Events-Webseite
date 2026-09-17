#!/bin/bash
# ---------------------------------------------------------------
#  Der nächtliche Löschlauf.
#
#  Setzt das Löschkonzept aus
#  docs/rechtstexte-entwuerfe/13-loeschkonzept.md um: Was fällig ist
#  und nicht gesperrt, wird anonymisiert oder gelöscht.
#
#  ZWEI LÄUFE, IN DIESER REIHENFOLGE — und das ist Absicht:
#
#    1. Ein Probelauf. Er verändert nichts und schreibt in das
#       Protokoll, WAS gleich passieren wird. Geht beim echten Lauf
#       etwas schief, lässt sich hinterher nachlesen, was er vorhatte.
#    2. Der echte Lauf.
#
#  Läuft nachts über vera-loeschlauf.timer, NACH der Sicherung. Die
#  Reihenfolge ist wichtig: So enthält die Sicherung dieses Tages den
#  Stand VOR der Löschung. Geht eine Löschung daneben, liegt der
#  vorherige Stand noch in der Cloud — und die Sicherung selbst
#  verfällt nach 180 Tagen, sodass die Löschung auch dort ankommt.
#
#  Manuell testen, ohne etwas zu verändern:
#    sudo -u vera bash -c 'cd /var/www/vera && npm run loeschen:vorschau'
#
#  Zustand ansehen:
#    tail -5 /home/vera/.vera-loeschlauf-status
#    journalctl -u vera-loeschlauf.service -n 40
# ---------------------------------------------------------------
set -euo pipefail

HEIM=/home/vera
APP=/var/www/vera
STATUS="$HEIM/.vera-loeschlauf-status"

# Nur bei einem FEHLER eine Mail — ein erfolgreicher Lauf ist der
# Normalfall und soll kein Postfach füllen. "|| true", damit ein
# fehlgeschlagener Mail-Versand nicht die eigentliche Fehlermeldung
# verdeckt.
alarm() {
  echo "$(date -Iseconds) FEHLER" >> "$STATUS"
  ( cd "$APP" && npm run --silent system:alarm -- "Löschlauf fehlgeschlagen am $(date -Iseconds)" ) || true
}
trap alarm ERR

cd "$APP"

echo "── Probelauf ──"
npm run --silent loeschen:vorschau

echo ""
echo "── Echter Lauf ──"
AUSGABE=$(npm run --silent loeschen)
echo "$AUSGABE"

# Die Zusammenfassung in die Statusdatei, damit `tail` genügt, um zu
# sehen, ob der Lauf etwas getan hat.
ZUSAMMEN=$(echo "$AUSGABE" | grep -E '^ +(anonymisiert|geloescht|uebersprungen|faellig) ' | tr -s ' ' | tr '\n' ' ')
echo "$(date -Iseconds) OK ${ZUSAMMEN:-nichts zu tun}" >> "$STATUS"
