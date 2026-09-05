#!/bin/bash
# ---------------------------------------------------------------
#  Raeumt /etc/vera-backup.env auf — aber nur, wenn sie wirklich
#  ungenutzt ist.
#
#  Die Datei stammt nicht aus dem VERA-Aufbau. Sie enthaelt eine
#  ungenutzte Zweitkopie der Backblaze-Zugangsdaten und einen
#  zweiten, FALSCHEN age-Schluessel — genau die Verwechslung, an der
#  der erste Rueckspiel-Test scheiterte.
#
#  Dieses Skript sucht ZUERST an allen Stellen, an denen eine
#  Verwendung stehen koennte. Findet es auch nur eine einzige,
#  bricht es ab und loescht NICHTS. Es loescht ausschliesslich diese
#  eine Datei und veraendert sonst nichts.
#
#  Zeigt keine Zugangsdaten an.
#
#  Aufruf:  sudo /usr/local/bin/vera-env-aufraeumen.sh
# ---------------------------------------------------------------
set -uo pipefail

ZIEL=/etc/vera-backup.env

if [ ! -e "$ZIEL" ]; then
  echo "Die Datei $ZIEL gibt es nicht (mehr). Nichts zu tun."
  exit 0
fi

echo "═══ 1. Wird $ZIEL irgendwo verwendet? ═══"

ORTE=(
  /usr/local/bin
  /etc/systemd/system
  /lib/systemd/system
  /etc/cron.d
  /etc/cron.daily
  /etc/cron.hourly
  /var/spool/cron
  /var/www/vera/server
  /root/.bashrc /root/.profile /root/.bash_profile
  /home/vera/.bashrc /home/vera/.profile /home/vera/.bash_profile
)

TREFFER=0
for ORT in "${ORTE[@]}"; do
  [ -e "$ORT" ] || continue
  GEFUNDEN=$(grep -rl 'vera-backup\.env' "$ORT" 2>/dev/null)
  if [ -n "$GEFUNDEN" ]; then
    echo "   VERWENDUNG GEFUNDEN in:"
    printf '     %s\n' $GEFUNDEN
    TREFFER=1
  fi
done

# Zusaetzlich: Fragt irgendein systemd-Dienst die Datei als
# EnvironmentFile ab? Das stuende zwar in /etc/systemd/system, aber
# wir fragen systemd lieber selbst, statt uns auf Textsuche zu
# verlassen.
SYSTEMD_TREFFER=$(systemctl show '*' -p EnvironmentFiles 2>/dev/null | grep -c 'vera-backup\.env')
if [ "${SYSTEMD_TREFFER:-0}" -gt 0 ]; then
  echo "   VERWENDUNG GEFUNDEN: ein systemd-Dienst liest sie als EnvironmentFile."
  TREFFER=1
fi

if [ "$TREFFER" -ne 0 ]; then
  echo ""
  echo "ABBRUCH: Die Datei wird verwendet. Es wurde NICHTS geloescht."
  exit 1
fi

echo "   Keine Verwendung gefunden — weder in Skripten, systemd-Einheiten,"
echo "   Cron-Eintraegen noch in Profildateien."

echo ""
echo "═══ 2. Loeschen ═══"
rm -f "$ZIEL"
if [ -e "$ZIEL" ]; then
  echo "   FEHLER: Loeschen hat nicht geklappt."
  exit 1
fi
echo "   $ZIEL entfernt. Sonst wurde nichts veraendert."

echo ""
echo "═══ 3. Laeuft das Sicherungssystem weiterhin? ═══"

FEHLER=0
pruefe() { # $1 Bedingung schon ausgewertet, $2 Text
  if [ "$1" = "ja" ]; then printf '   OK   %s\n' "$2"; else printf '   FEHLT %s\n' "$2"; FEHLER=1; fi
}

[ -x /usr/local/bin/vera-sicherung.sh ] && A=ja || A=nein
pruefe "$A" "Sicherungs-Skript vorhanden und ausfuehrbar"

systemctl is-enabled vera-sicherung.timer >/dev/null 2>&1 && A=ja || A=nein
pruefe "$A" "Nächtlicher Zeitplan eingeschaltet"

systemctl is-active vera-sicherung.timer >/dev/null 2>&1 && A=ja || A=nein
pruefe "$A" "Zeitplan laeuft"

[ -s /home/vera/.config/vera/age-public-key.txt ] && A=ja || A=nein
pruefe "$A" "Oeffentlicher Verschluesselungs-Schluessel hinterlegt"

grep -q '^\[b2vera\]' /home/vera/.config/rclone/rclone.conf 2>/dev/null && A=ja || A=nein
pruefe "$A" "Backblaze Schreib-Zugang eingerichtet"

grep -q '^\[b2lesen\]' /home/vera/.config/rclone/rclone.conf 2>/dev/null && A=ja || A=nein
pruefe "$A" "Backblaze Lese-Zugang eingerichtet"

echo ""
echo "   Verwendeter Schluessel (Anfang, kein Geheimnis):"
echo "     $(cut -c1-16 /home/vera/.config/vera/age-public-key.txt 2>/dev/null)…"
echo "   Letzte Laeufe:"
tail -3 /home/vera/.vera-sicherung-status 2>/dev/null | sed 's/^/     /'
echo "   Naechster Lauf:"
systemctl list-timers vera-sicherung.timer --no-pager 2>/dev/null | sed -n '2p' | sed 's/^/     /'

echo ""
if [ "$FEHLER" -eq 0 ]; then
  echo "ERGEBNIS: Datei entfernt, Sicherungssystem unveraendert in Ordnung."
else
  echo "ERGEBNIS: Datei entfernt, aber am Sicherungssystem stimmt etwas nicht — siehe oben."
  exit 1
fi
