#!/bin/bash
# ---------------------------------------------------------------
#  Ein Befehl, der auf dem iPad in einen Bildschirm passt und die
#  fünf Fragen beantwortet, die man wirklich stellt:
#  Läuft es? Ist es erreichbar? Ist Platz da? Hält das Zertifikat?
#  Ist die Sicherung durchgelaufen? Dazu die letzten Fehler.
#
#  Aufruf:  vera-status
# ---------------------------------------------------------------
set -uo pipefail

echo "══ VERA · Stand vom $(date '+%d.%m.%Y %H:%M') ══"
echo

echo "DIENSTE"
for d in vera nginx mariadb; do
  printf '  %-10s %s\n' "$d" "$(systemctl is-active "$d")"
done
printf '  %-10s %s\n' "wache" "$(systemctl is-active vera-wache.timer)"
printf '  %-10s %s\n' "sicherung" "$(systemctl is-active vera-sicherung.timer)"
echo

echo "ERREICHBARKEIT"
code=$(curl -sS --max-time 20 -o /dev/null -w '%{http_code}' https://veraevents.de/ 2>/dev/null || echo "000")
printf '  https://veraevents.de/  →  %s\n' "$code"
echo

echo "SPEICHERPLATZ"
df -h / | awk 'NR==2 {printf "  %s von %s belegt (%s)\n", $3, $2, $5}'
echo

echo "ZERTIFIKAT"
zert=/etc/letsencrypt/live/veraevents.de/fullchain.pem
if [ -r "$zert" ]; then
  ende=$(openssl x509 -enddate -noout -in "$zert" | cut -d= -f2)
  echo "  gültig bis $(date -d "$ende" '+%d.%m.%Y') · noch $(( ( $(date -d "$ende" +%s) - $(date +%s) ) / 86400 )) Tage"
else
  echo "  nicht lesbar (als root aufrufen)"
fi
echo

echo "LETZTE SICHERUNGEN"
tail -n 3 /home/vera/.vera-sicherung-status 2>/dev/null | sed 's/^/  /' || echo "  kein Vermerk gefunden"
echo

echo "LETZTE FEHLER DES DIENSTES (24 h)"
fehler=$(journalctl -u vera --since "24 hours ago" -p err --no-pager -n 10 -o cat 2>/dev/null)
if [ -z "$fehler" ]; then echo "  keine"; else echo "$fehler" | sed 's/^/  /'; fi
