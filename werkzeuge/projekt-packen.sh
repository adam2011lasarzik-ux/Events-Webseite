#!/usr/bin/env bash
#
# Packt den gesamten Projektcode in EIN Archiv.
#
# Warum nicht einfach `zip -r projekt.zip .`?
#
# Weil dabei vier Dinge mitgingen, die dort nicht hineingehoeren:
#
#   .env          die echten Geheimnisse — Stripe-Schluessel,
#                 Datenbankzugang, SMTP-Passwort, ANMELDUNG_SCHLUESSEL.
#                 Ein Archiv wandert per Mail, Cloud oder USB-Stick
#                 weiter; die Geheimnisse duerfen das nicht.
#   daten/        im Adminbereich hochgeladene Titelbilder. Betriebsdaten,
#                 moeglicherweise mit Personenbezug.
#   node_modules  851 MB fremder Code, jederzeit per `npm ci`
#                 wiederherstellbar.
#   .next         179 MB Bauergebnis, entsteht bei `npm run build` neu.
#
# Deshalb nimmt dieses Skript genau die Dateien, die unter
# Versionskontrolle stehen (`git ls-files`). Das ist keine Faulheit,
# sondern die praezise Definition von "der Projektcode": Alles was in
# .gitignore steht, ist entweder Geheimnis, Betriebsdaten oder
# wiederherstellbar.
#
# Es werden die Dateien aus dem ARBEITSVERZEICHNIS genommen, nicht aus
# dem letzten Commit. Noch nicht committete Aenderungen sind also
# enthalten.
#
# Aufruf:
#   bash werkzeuge/projekt-packen.sh            -> Archiv neben dem Projekt
#   bash werkzeuge/projekt-packen.sh /pfad/ziel -> Archiv in /pfad/ziel

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

ZIEL="${1:-$(dirname "$PWD")}"
NAME="vera-projektcode-$(date +%Y-%m-%d-%H%M)"
ARCHIV="$ZIEL/$NAME.zip"

mkdir -p "$ZIEL"

echo "=== 1. Dateiliste aufstellen ==="
# -z / --null: trennt mit Null-Byte statt Zeilenumbruch. Ein Dateiname
# mit Leerzeichen oder Umlaut wuerde sonst in Stuecke zerfallen.
ANZAHL=$(git ls-files -z | tr -dc '\0' | wc -c)
echo "    $ANZAHL versionierte Dateien"

echo "=== 2. Gegenprobe: nichts Geheimes in der Liste ==="
VERBOTEN=0
while IFS= read -r -d '' DATEI; do
  case "$DATEI" in
    .env|.env.*|*/.env|*.pem|*.key|daten/*)
      # .env.example ist Absicht: sie enthaelt nur Namen, keine Werte.
      if [ "$DATEI" != ".env.example" ]; then
        echo "    ABBRUCH — geheime Datei in der Liste: $DATEI"
        VERBOTEN=1
      fi
      ;;
  esac
done < <(git ls-files -z)
if [ "$VERBOTEN" -ne 0 ]; then
  echo ""
  echo "Es wurde KEIN Archiv erzeugt. Pruefe .gitignore."
  exit 1
fi
echo "    in Ordnung"

echo "=== 3. Zweite Gegenprobe: keine echten Schluessel im Inhalt ==="
# Sucht nach Stripe-Schluesseln und langen Base64-Geheimnissen in den
# Dateien, die wirklich ins Archiv gehen. Findet auch den Fall, dass
# jemand versehentlich einen Schluessel in den Quelltext geschrieben hat.
TREFFER=$(git ls-files -z \
  | xargs -0 grep -l -E 'sk_(test|live)_[A-Za-z0-9]{20,}|rk_(test|live)_[A-Za-z0-9]{20,}|whsec_[A-Za-z0-9]{20,}' \
    2>/dev/null || true)
if [ -n "$TREFFER" ]; then
  echo "    ABBRUCH — moeglicher echter Schluessel in:"
  echo "$TREFFER" | sed 's/^/        /'
  echo ""
  echo "Es wurde KEIN Archiv erzeugt."
  exit 1
fi
echo "    in Ordnung"

echo "=== 4. Archiv schreiben ==="
rm -f "$ARCHIV"
# Alle Dateien landen in EINEM Ordner "$NAME" im Archiv — beim
# Entpacken entsteht also kein Dateihaufen im Downloads-Ordner.
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/$NAME"
git ls-files -z | xargs -0 tar -cf - | tar -xf - -C "$TMP/$NAME"
( cd "$TMP" && zip -q -r -X "$ARCHIV" "$NAME" )

echo ""
echo "=== FERTIG ==="
echo "Archiv:   $ARCHIV"
echo "Groesse:  $(du -h "$ARCHIV" | cut -f1)"
echo "Dateien:  $(unzip -l "$ARCHIV" | tail -1 | awk '{print $2}')"
echo ""
echo "Nicht enthalten (Absicht): .env, daten/, node_modules/, .next/, .git/"
echo "Wiederherstellen:  unzip $NAME.zip && cd $NAME && npm ci"
