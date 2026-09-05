#!/bin/bash
# ---------------------------------------------------------------
#  Rueckspiel-Test der VERA-Sicherung.
#
#  "Eine Sicherung, die nie zurueckgespielt wurde, ist keine
#  Sicherung." Dieses Skript holt die neueste Sicherung aus
#  Backblaze, entschluesselt sie, spielt sie in eine SEPARATE
#  Testdatenbank ein und zaehlt Tabelle fuer Tabelle nach, ob
#  gleich viele Zeilen ankommen wie in der echten Datenbank.
#
#  Die echte Datenbank wird dabei NICHT angefasst — nur gelesen.
#  Die Testdatenbank wird am Ende wieder geloescht.
#
#  Der geheime age-Schluessel wird beim Lauf abgefragt, landet nur
#  kurz in einer Datei mit Rechten 600 und wird danach ueberschrieben
#  geloescht. Er bleibt NICHT auf dem Server.
#
#  Aufruf:  sudo /usr/local/bin/vera-ruecktest.sh
# ---------------------------------------------------------------
set -euo pipefail

HEIM=/home/vera
RCLONE_CONF="$HEIM/.config/rclone/rclone.conf"
BUCKET="b2lesen:Vera-sicherungen"
TESTDB=vera_ruecktest

ARBEIT=$(mktemp -d)
chmod 700 "$ARBEIT"
trap 'rm -rf "$ARBEIT"' EXIT

echo "== 1. Neueste Sicherung suchen =="
# Nur echte Sicherungen beruecksichtigen. Ohne dieses Muster wuerde
# eine beliebige andere Datei im Bucket (etwa eine Testdatei) je nach
# Namen als "neueste Sicherung" gelten und der Rueckspiel-Test liefe
# gegen die falsche Datei.
NEUESTE=$(rclone --config "$RCLONE_CONF" lsf "$BUCKET" --include "vera-*.sql.age" | sort | tail -1)
if [ -z "$NEUESTE" ]; then echo "   Keine Sicherung gefunden — Abbruch."; exit 1; fi
echo "   $NEUESTE"

echo "== 2. Herunterladen =="
rclone --config "$RCLONE_CONF" copyto "$BUCKET/$NEUESTE" "$ARBEIT/sicherung.age"
echo "   $(wc -c < "$ARBEIT/sicherung.age") Bytes verschluesselt geladen"

echo "== 3. Entschluesseln =="
echo "   Bitte den geheimen Schluessel einfuegen (beginnt mit AGE-SECRET-KEY-1)"
echo "   und Enter druecken. Die Eingabe wird bewusst NICHT angezeigt."
read -rs AGE_KEY
umask 077
printf '%s\n' "$AGE_KEY" > "$ARBEIT/schluessel.txt"
unset AGE_KEY
age -d -i "$ARBEIT/schluessel.txt" -o "$ARBEIT/sicherung.sql" "$ARBEIT/sicherung.age"
shred -u "$ARBEIT/schluessel.txt"
echo "   $(wc -c < "$ARBEIT/sicherung.sql") Bytes entschluesselt"

# Sicherheitsriegel: Eine Sicherung, die "USE vera" oder
# "CREATE DATABASE vera" enthaelt, wuerde beim Einspielen die ECHTE
# Datenbank treffen, egal in welche Testdatenbank wir sie lenken.
# mariadb-dump erzeugt solche Anweisungen bei einer einzelnen
# Datenbank zwar nicht — aber darauf verlassen wir uns hier nicht,
# sondern pruefen es nach.
echo "== 4a. Sicherheitspruefung der Sicherungsdatei =="
if grep -qiE '^[[:space:]]*(USE[[:space:]]|CREATE[[:space:]]+DATABASE)' "$ARBEIT/sicherung.sql"; then
  echo "   ABBRUCH: Die Datei enthaelt USE-/CREATE-DATABASE-Anweisungen."
  echo "   Sie koennte damit in die ECHTE Datenbank schreiben."
  exit 1
fi
echo "   Enthaelt keine Datenbank-Umschaltung — Einspielen ist isoliert."

echo "== 4b. In die Testdatenbank $TESTDB einspielen =="
mariadb -e "DROP DATABASE IF EXISTS \`$TESTDB\`; CREATE DATABASE \`$TESTDB\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mariadb "$TESTDB" < "$ARBEIT/sicherung.sql"
echo "   eingespielt"

echo "== 5. Zeilen vergleichen =="
printf '   %-22s %8s %10s   %s\n' "Tabelle" "Live" "Sicherung" "Ergebnis"
ABWEICHUNG=0
for T in $(mariadb -N -B -e "SELECT table_name FROM information_schema.tables WHERE table_schema='vera' ORDER BY table_name;"); do
  LIVE=$(mariadb -N -B -e "SELECT COUNT(*) FROM \`vera\`.\`$T\`;")
  SICH=$(mariadb -N -B -e "SELECT COUNT(*) FROM \`$TESTDB\`.\`$T\`;" 2>/dev/null || echo "FEHLT")
  if [ "$LIVE" = "$SICH" ]; then ERG="OK"; else ERG="ABWEICHUNG"; ABWEICHUNG=1; fi
  printf '   %-22s %8s %10s   %s\n' "$T" "$LIVE" "$SICH" "$ERG"
done

echo "== 6. Testdatenbank wieder entfernen =="
mariadb -e "DROP DATABASE \`$TESTDB\`;"
echo "   entfernt"

echo ""
if [ "$ABWEICHUNG" = 0 ]; then
  echo "ERGEBNIS: Die Sicherung liess sich vollstaendig zurueckspielen."
  echo "Alle Tabellen enthalten gleich viele Zeilen wie die echte Datenbank."
else
  echo "ERGEBNIS: ABWEICHUNGEN GEFUNDEN — siehe Tabelle oben."
  exit 1
fi
