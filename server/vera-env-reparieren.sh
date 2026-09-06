#!/bin/bash
# ---------------------------------------------------------------
#  Repariert die DATABASE_URL-Zeile in /var/www/vera/.env.
#
#  Hintergrund: Beim Bearbeiten der Datei in der Webkonsole ist die
#  DATABASE_URL-Zeile zerrissen worden (sie steht als mehrere
#  Bruchstuecke in der Datei). Seitdem bricht "prisma generate" mit
#  "PrismaConfigEnvError: DATABASE_URL" ab, und damit auch npm ci.
#
#  Das Datenbank-Passwort wird aus /home/vera/.vera_db_password
#  gelesen und an KEINER Stelle ausgegeben. Vor der Aenderung
#  entsteht eine Sicherung der bisherigen Datei.
#
#  Aufruf (als Benutzer vera, damit Eigentuemer und Rechte stimmen):
#    sudo -u vera bash /var/www/vera/server/vera-env-reparieren.sh
# ---------------------------------------------------------------
set -euo pipefail

ENV=/var/www/vera/.env
PWDATEI=/home/vera/.vera_db_password
SICHERUNG="${ENV}.sicherung-$(date +%Y%m%d_%H%M%S)"

# ── 0. Vorbedingungen ──────────────────────────────────────────
[ -f "$ENV" ]     || { echo "FEHLER: $ENV gibt es nicht."; exit 1; }
[ -w "$ENV" ]     || { echo "FEHLER: $ENV ist nicht beschreibbar — als Benutzer vera aufrufen."; exit 1; }
[ -r "$PWDATEI" ] || { echo "FEHLER: $PWDATEI ist nicht lesbar — ohne das Datenbank-Passwort geht es nicht."; exit 1; }

DB_PASSWORT=$(cat "$PWDATEI")
[ -n "$DB_PASSWORT" ] || { echo "FEHLER: Die Passwortdatei ist leer."; exit 1; }

# ── 1. Sicherung, bevor irgendetwas angefasst wird ─────────────
cp -p "$ENV" "$SICHERUNG"
chmod 600 "$SICHERUNG"
echo "Sicherung der bisherigen Datei: $SICHERUNG"

# ── 2. Passwort fuer die Adresse prozentkodieren ───────────────
#
# Ein zufaellig erzeugtes Passwort kann Zeichen enthalten, die in
# einer Adresse eine eigene Bedeutung haben (@ / : + ? #). Unkodiert
# zerlegen sie die Verbindungsadresse an der falschen Stelle. Alles
# ausser den unbedenklichen Zeichen wird deshalb kodiert; Prisma
# dekodiert es beim Verbinden wieder.
kodiere() {
  local roh="$1" i zeichen ergebnis=""
  for (( i = 0; i < ${#roh}; i++ )); do
    zeichen="${roh:i:1}"
    case "$zeichen" in
      [A-Za-z0-9._~-]) ergebnis+="$zeichen" ;;
      *)               ergebnis+=$(printf '%%%02X' "'$zeichen") ;;
    esac
  done
  printf '%s' "$ergebnis"
}
PW_KODIERT=$(kodiere "$DB_PASSWORT")

# ── 3. Welcher Hostname funktioniert wirklich? ─────────────────
#
# Nicht raten: MariaDB unterscheidet "localhost" (Socket) und
# "127.0.0.1" (Netzwerk) bei den Rechten. Es wird der Weg
# eingetragen, der sich nachweislich verbinden laesst.
HOST=""
for kandidat in 127.0.0.1 localhost; do
  if mariadb -u vera -p"$DB_PASSWORT" -h "$kandidat" vera -e "SELECT 1" >/dev/null 2>&1; then
    HOST="$kandidat"
    break
  fi
done
[ -n "$HOST" ] || {
  echo "FEHLER: Keine Verbindung zur Datenbank 'vera' — weder ueber 127.0.0.1 noch ueber localhost."
  echo "        Es wurde NICHTS geaendert."
  exit 1
}
echo "Datenbank erreichbar ueber: $HOST"

# ── 4. Bruchstuecke entfernen, eine korrekte Zeile schreiben ───
VORHER=$(wc -l < "$ENV")
TMP=$(mktemp)
chmod 600 "$TMP"
trap 'rm -f "$TMP"' EXIT

# Alles entfernen, was zur alten (zerrissenen) Adresse gehoert:
# die vollstaendige Zeile, ihre Bruchstuecke und die verirrte
# Plus-Zeile. Alle uebrigen Zeilen bleiben unveraendert stehen.
grep -vE '^DATABASE|^URL|mysql://|^\+$' "$ENV" > "$TMP" || true

# Sicherheitsnetz: Wenn dabei fast alles verschwunden waere, ist
# etwas anders als angenommen — dann lieber abbrechen.
UEBRIG=$(grep -cE '^[A-Za-z_][A-Za-z0-9_]*=' "$TMP" || true)
if [ "$UEBRIG" -lt 3 ]; then
  echo "FEHLER: Nach dem Aussortieren blieben nur $UEBRIG Einstellungen uebrig."
  echo "        Das sieht falsch aus — es wurde NICHTS geaendert."
  echo "        Die unveraenderte Datei liegt weiterhin unter $ENV"
  exit 1
fi

echo "DATABASE_URL=\"mysql://vera:${PW_KODIERT}@${HOST}:3306/vera\"" >> "$TMP"

# Mit "cat >" statt "mv": So behaelt die Datei ihren Eigentuemer
# und ihre Rechte (600), egal wer das Skript aufruft.
cat "$TMP" > "$ENV"

NACHHER=$(wc -l < "$ENV")
echo "Zeilen vorher: $VORHER — nachher: $NACHHER"

# ── 5. Gegenprobe: nur NAMEN zeigen, niemals Werte ─────────────
echo ""
echo "Einstellungen in der Datei (nur die Namen, keine Werte):"
sed -n 's/^\([A-Za-z_][A-Za-z0-9_]*\)=.*/  \1/p' "$ENV"

# ── 6. Echte Gegenprobe mit Prisma ─────────────────────────────
#
# Prisma liest DATABASE_URL ueber prisma.config.ts. Laeuft dieser
# Befehl durch, ist die Zeile nicht nur vorhanden, sondern auch
# brauchbar — genau daran ist npm ci vorhin gescheitert.
echo ""
echo "Gegenprobe mit Prisma …"
if (cd /var/www/vera && npx prisma validate >/dev/null 2>&1); then
  echo "✓ Prisma kann DATABASE_URL lesen. Die Reparatur hat funktioniert."
  echo ""
  echo "Naechster Schritt:"
  echo "  cd /var/www/vera && sudo -u vera env PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci"
else
  echo "✗ Prisma kommt weiterhin nicht zurecht. Die Ausgabe im Klartext:"
  (cd /var/www/vera && npx prisma validate 2>&1 | tail -20) || true
  echo ""
  echo "Die vorherige Fassung liegt unter: $SICHERUNG"
fi
