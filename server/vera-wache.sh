#!/bin/bash
# ---------------------------------------------------------------
#  Die Wache: prüft alle 15 Minuten, ob mit VERA alles in Ordnung
#  ist, und meldet sich per E-Mail — aber nur beim WECHSEL des
#  Zustands.
#
#  Warum nur beim Wechsel: Eine Mail alle 15 Minuten liest nach dem
#  dritten Mal niemand mehr. Dann geht die eine wichtige unter, und
#  die Überwachung schadet mehr, als sie nützt. Deshalb steht der
#  zuletzt gemeldete Zustand in einer Datei; gemailt wird nur, wenn
#  sich daran etwas ändert.
#
#  Aufruf ohne Argumente:  meldet per Mail
#  Aufruf mit --probe:     zeigt nur an, verschickt nichts
#
#  EHRLICHE GRENZE: Dieses Skript läuft auf demselben Server, den es
#  überwacht. Ist der Server aus oder vom Netz getrennt, kann es
#  nichts melden — dafür braucht es eine Prüfung von außen. Siehe
#  docs/ueberwachung.md.
# ---------------------------------------------------------------
set -uo pipefail

# Auch der Anwendungsordner ist überschreibbar — nur zum Prüfen der
# Wache selbst (VERA_WACHE_APP). Im Betrieb gilt der Standardwert.
APP="${VERA_WACHE_APP:-/var/www/vera}"
# Die zu prüfende Adresse lässt sich für einen Test überschreiben:
#   VERA_WACHE_ADRESSE=https://veraevents.de/gibt-es-nicht vera-wache.sh
# Damit lässt sich der Alarmweg Ende zu Ende beweisen, OHNE einen
# laufenden Dienst anzuhalten. Ein Alarm, der nie ausgelöst hat, ist
# kein Alarm — aber dafür muss man nicht die Webseite abschalten.
ADRESSE="${VERA_WACHE_ADRESSE:-https://veraevents.de/}"
ZUSTANDSDATEI="/var/lib/vera-wache/zustand"
SICHERUNGSSTATUS="/home/vera/.vera-sicherung-status"
ZERTIFIKAT="/etc/letsencrypt/live/veraevents.de/fullchain.pem"

# Schwellen — bewusst hier oben, damit sie ohne Suchen zu finden sind.
PLATTE_PROZENT=80      # ab hier gilt der Speicherplatz als knapp
ZERT_TAGE=20           # Certbot erneuert bei 30 Tagen; 20 heißt: es klemmt
SICHERUNG_STUNDEN=48   # eine Sicherung läuft täglich; 48 h Puffer für Ausfälle

PROBE=0
[ "${1:-}" = "--probe" ] && PROBE=1

befunde=()
melde() { befunde+=("$1"); }

# ── 1. Laufen die drei Dienste? ────────────────────────────────
for dienst in vera nginx mariadb; do
  if ! systemctl is-active --quiet "$dienst"; then
    melde "Der Dienst $dienst läuft nicht."
  fi
done

# ── 2. Antwortet die Seite von außen über HTTPS? ───────────────
#
# Absichtlich über die öffentliche Adresse und nicht über
# 127.0.0.1: So werden Nginx, das Zertifikat und die Anwendung in
# einem Zug geprüft. Ein Test auf localhost ginge auch dann noch
# durch, wenn das Zertifikat abgelaufen ist.
# curl schreibt bei %{http_code} auch im Fehlerfall schon "000" und
# beendet sich dann mit einem Fehler. Ein `|| echo "000"` haengte
# deshalb ein ZWEITES "000" an — die Meldung lautete "000000". Erst
# im Probelauf aufgefallen, nicht beim Lesen.
status=$(curl -sS --max-time 20 -o /dev/null -w '%{http_code}' "$ADRESSE" 2>/dev/null || true)
[ -z "$status" ] && status="000"
if [ "$status" != "200" ]; then
  melde "Die Webseite antwortet nicht mit 200, sondern mit $status."
fi

# ── 3. Speicherplatz ───────────────────────────────────────────
belegt=$(df -P / | awk 'NR==2 {gsub(/%/,"",$5); print $5}')
if [ -n "$belegt" ] && [ "$belegt" -ge "$PLATTE_PROZENT" ]; then
  melde "Die Festplatte ist zu $belegt % voll (Schwelle $PLATTE_PROZENT %)."
fi

# ── 4. Zertifikat ──────────────────────────────────────────────
#
# Certbot erneuert selbsttätig ab 30 Tagen Restlaufzeit. Sinkt der
# Wert unter 20, hat die Erneuerung mehrfach nicht funktioniert —
# und das merkt man sonst erst, wenn die Seite unerreichbar ist.
if [ -r "$ZERTIFIKAT" ]; then
  ende=$(openssl x509 -enddate -noout -in "$ZERTIFIKAT" 2>/dev/null | cut -d= -f2)
  if [ -n "$ende" ]; then
    tage=$(( ( $(date -d "$ende" +%s) - $(date +%s) ) / 86400 ))
    if [ "$tage" -lt "$ZERT_TAGE" ]; then
      melde "Das HTTPS-Zertifikat läuft in $tage Tagen ab und wurde nicht erneuert."
    fi
  fi
else
  melde "Das HTTPS-Zertifikat ist nicht lesbar ($ZERTIFIKAT)."
fi

# ── 5. Ist die Datenbank-Sicherung aktuell? ────────────────────
#
# Die Sicherung meldet sich selbst NUR, wenn sie fehlschlägt. Läuft
# ihr Timer gar nicht erst — abgeschaltet, kaputt, nach einem
# Neustart nicht wieder angelaufen —, schweigt sie. Genau diese
# stille Lücke schließt die folgende Prüfung.
if [ -r "$SICHERUNGSSTATUS" ]; then
  alter=$(( ( $(date +%s) - $(stat -c %Y "$SICHERUNGSSTATUS") ) / 3600 ))
  if [ "$alter" -ge "$SICHERUNG_STUNDEN" ]; then
    melde "Die letzte Datenbank-Sicherung ist $alter Stunden her (erwartet: täglich)."
  elif tail -n 1 "$SICHERUNGSSTATUS" | grep -q FEHLER; then
    melde "Die letzte Datenbank-Sicherung ist mit FEHLER beendet worden."
  fi
else
  melde "Es gibt keinen Vermerk über eine Datenbank-Sicherung ($SICHERUNGSSTATUS)."
fi

# ── Ergebnis ───────────────────────────────────────────────────
if [ ${#befunde[@]} -eq 0 ]; then
  jetzt="ok"
  echo "Alles in Ordnung."
else
  # Der Zustand ist die Liste der Befunde selbst. Dadurch wird auch
  # dann gemeldet, wenn zu einer bestehenden Störung eine zweite
  # hinzukommt — sonst bliebe die neue unbemerkt.
  jetzt="alarm:$(printf '%s\n' "${befunde[@]}" | sha256sum | cut -c1-16)"
  printf '%s\n' "${befunde[@]}"
fi

# Ist der Meldeweg überhaupt vorhanden? Ohne diese Zeile fällt ein
# fehlendes npm-Skript erst im Ernstfall auf — also genau dann, wenn
# man sich darauf verlässt.
if grep -q '"system:alarm"' "$APP/package.json" 2>/dev/null; then
  meldeweg="vorhanden"
else
  meldeweg="FEHLT — es kann keine Mail verschickt werden"
fi

if [ "$PROBE" -eq 1 ]; then
  echo "Meldeweg: $meldeweg"
  echo "(Probelauf — es wurde nichts verschickt.)"
  exit 0
fi

if [ "$meldeweg" != "vorhanden" ]; then
  echo "ACHTUNG: In $APP/package.json fehlt das Skript \"system:alarm\"." >&2
  echo "Die Wache kann nichts melden. Bitte den Anwendungsstand nachziehen." >&2
  exit 1
fi

mkdir -p "$(dirname "$ZUSTANDSDATEI")"
vorher=$(cat "$ZUSTANDSDATEI" 2>/dev/null || echo "ok")
[ "$jetzt" = "$vorher" ] && exit 0
echo "$jetzt" > "$ZUSTANDSDATEI"

# Das Skript läuft als root — nur so ist das Zertifikat unter
# /etc/letsencrypt lesbar. Die Mail wird aber bewusst als "vera"
# verschickt: Dort gehört die Anwendung hin, dort liegt die .env, und
# npm als root im Anwendungsordner laufen zu lassen hinterlässt
# root-eigene Dateien, über die spätere Deployments stolpern.
#
# HIER STAND EINMAL `|| true`. Das war derselbe Fehler, den diese
# Wache bei der Sicherung aufdecken soll: Scheitert der Versand,
# passiert nichts Sichtbares — und eine Überwachung, deren Meldeweg
# still kaputt ist, ist schlimmer als gar keine, weil sie Sicherheit
# vortäuscht. Genau das ist beim Einrichten passiert: Der Alarmweg
# fehlte auf dem Server, und der Probelauf hat es nicht bemerkt.
melde_per_mail() {
  local ausgabe
  if ausgabe=$( cd "$APP" && runuser -u vera -- env HOME=/home/vera \
       npm run --silent system:alarm -- "$@" 2>&1 ); then
    return 0
  fi
  echo "ACHTUNG: Der Meldeweg hat nicht funktioniert — es wurde KEINE Mail verschickt." >&2
  echo "$ausgabe" >&2
  return 1
}

if [ "$jetzt" = "ok" ]; then
  melde_per_mail --entwarnung || exit 1
else
  melde_per_mail "${befunde[@]}" || exit 1
fi
