#!/bin/bash
# ---------------------------------------------------------------
#  Stuendlicher Abgleich: bezahlte Zahlungen ohne Anmeldung.
#
#  Seit dem Umbau vom 26.09.2026 entsteht eine Anmeldung erst mit der
#  bestaetigten Zahlung. Bleibt die Rueckmeldung des Anbieters aus,
#  ist Geld geflossen und es gibt nirgends bei uns eine Spur davon.
#  Dieser Lauf ist der Ersatz fuer die Spur.
#
#  Er ist deshalb KEIN Komfort, sondern Teil der Funktion. Laeuft er
#  nicht, ist der Ausfall der Rueckmeldung unbemerkt.
#
#  Manuell:
#    sudo systemctl start vera-zahlungsabgleich.service
#    journalctl -u vera-zahlungsabgleich.service -n 40
#
#  Nur ansehen, ohne etwas zu tun:
#    sudo -u vera bash -c 'cd /var/www/vera && npm run zahlung:abgleich'
# ---------------------------------------------------------------
set -uo pipefail

APP=/var/www/vera
STATUS=/home/vera/.vera-zahlungsabgleich-status

cd "$APP" || exit 1

# Exitcodes des Laufs:
#   0  alles in Ordnung
#   2  es liegt etwas zur Klaerung an (kein Fehler, aber eine Mail wert)
#   1  echter Fehler
AUSGABE=$(npm run --silent zahlung:abgleich -- --echt 2>&1)
CODE=$?

echo "$AUSGABE"
echo "$(date -Iseconds) code=$CODE" >> "$STATUS"

# Bei 1 UND bei 2 eine Mail: Im einen Fall ist der Lauf gescheitert,
# im anderen liegt Geld ungeklaert herum. Beides gehoert gesehen.
#
# "|| true", damit ein fehlgeschlagener Mailversand nicht die
# eigentliche Meldung verdeckt - dieselbe Vorsicht wie im Loeschlauf.
if [ "$CODE" -ne 0 ]; then
  ( npm run --silent system:alarm -- \
      "Zahlungsabgleich: Code $CODE am $(date -Iseconds)

$AUSGABE" ) || true
fi

exit 0
