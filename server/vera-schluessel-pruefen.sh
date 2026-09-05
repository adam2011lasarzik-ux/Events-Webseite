#!/bin/bash
# ---------------------------------------------------------------
#  Passt mein geheimer Schluessel zu den Sicherungen?
#
#  Leitet aus dem eingegebenen GEHEIMEN Schluessel den zugehoerigen
#  OEFFENTLICHEN ab und vergleicht ihn mit dem, den der Server zum
#  Verschluesseln benutzt. Stimmen beide ueberein, passt der
#  Schluessel — dann lag ein Fehlschlag am Einfuegen.
#
#  Zeigt nur oeffentliche Schluessel an (die sind kein Geheimnis).
#  Der geheime wird nicht angezeigt, nicht gespeichert und nach der
#  Pruefung ueberschrieben geloescht.
# ---------------------------------------------------------------
set -uo pipefail

ARBEIT=$(mktemp -d); chmod 700 "$ARBEIT"
trap 'rm -rf "$ARBEIT"' EXIT

SERVER_SCHLUESSEL=/home/vera/.config/vera/age-public-key.txt

echo "Bitte den geheimen Schluessel einfuegen (AGE-SECRET-KEY-1...) und Enter."
echo "Die Eingabe wird nicht angezeigt."
read -rs EINGABE
echo ""

LAENGE=${#EINGABE}
echo "== 1. Laenge der Eingabe =="
echo "   $LAENGE Zeichen (ein vollstaendiger Schluessel hat 74)"
if [ "$LAENGE" -ne 74 ]; then
  echo "   ACHTUNG: Das passt nicht. Vermutlich ist beim Einfuegen etwas"
  echo "   verlorengegangen oder es wurde etwas anderes eingefuegt."
fi

case "$EINGABE" in
  AGE-SECRET-KEY-1*) echo "   Beginnt korrekt mit AGE-SECRET-KEY-1" ;;
  *) echo "   ACHTUNG: Beginnt NICHT mit AGE-SECRET-KEY-1" ;;
esac

umask 077
printf '%s\n' "$EINGABE" > "$ARBEIT/k.txt"
unset EINGABE

echo ""
echo "== 2. Vergleich der oeffentlichen Schluessel =="
ABGELEITET=$(age-keygen -y "$ARBEIT/k.txt" 2>&1)
shred -u "$ARBEIT/k.txt" 2>/dev/null
AUF_SERVER=$(cat "$SERVER_SCHLUESSEL" 2>/dev/null)

echo "   aus deinem Schluessel : $ABGELEITET"
echo "   auf dem Server        : $AUF_SERVER"
echo ""

if [ "$ABGELEITET" = "$AUF_SERVER" ]; then
  echo "ERGEBNIS: Die Schluessel passen zusammen."
  echo "Der Fehlschlag lag also am Einfuegen, nicht am Schluessel."
  echo "Bitte den Rueckspiel-Test erneut starten und genau darauf achten,"
  echo "dass der ganze Schluessel eingefuegt wird."
else
  echo "ERGEBNIS: Die Schluessel passen NICHT zusammen."
  echo "Der eingegebene Schluessel gehoert nicht zu den Sicherungen."
  echo "Bitte im Passwort-Manager nachsehen, ob dort noch ein anderer"
  echo "Eintrag liegt — moeglicherweise wurde zwischendurch ein zweiter"
  echo "Schluessel erzeugt."
fi
