#!/bin/bash
# ---------------------------------------------------------------
#  Tauscht AUSSCHLIESSLICH den Wert von SMTP_PASSWORT in
#  /var/www/vera/.env aus. Jede andere Zeile bleibt Zeichen fuer
#  Zeichen unveraendert — insbesondere DATABASE_URL.
#
#  Das Passwort wird verdeckt eingegeben und an KEINER Stelle
#  ausgegeben: nicht im Klartext, nicht als Ausschnitt, nicht als
#  Pruefsumme. Angezeigt wird nur seine Zeichenzahl.
#
#  Die entscheidende Vorsichtsmassnahme: Das neue Passwort wird
#  ZUERST beim Mailserver ausprobiert und erst NACH erfolgreicher
#  Anmeldung in die Datei geschrieben. Ein falsches oder unterwegs
#  abgeschnittenes Passwort kommt so gar nicht erst in die Datei.
#
#  Aufruf (als Benutzer vera, damit Eigentuemer und Rechte stimmen):
#    sudo -u vera bash /var/www/vera/server/vera-smtp-passwort-setzen.sh
# ---------------------------------------------------------------
set -euo pipefail

ORDNER=/var/www/vera
ENV="$ORDNER/.env"
SICHERUNG="${ENV}.sicherung-$(date +%Y%m%d_%H%M%S)"

# ── 0. Vorbedingungen ──────────────────────────────────────────
[ -f "$ENV" ] || { echo "FEHLER: $ENV gibt es nicht."; exit 1; }
[ -w "$ENV" ] || { echo "FEHLER: $ENV ist nicht beschreibbar — als Benutzer vera aufrufen."; exit 1; }

TREFFER=$(grep -c '^SMTP_PASSWORT=' "$ENV" || true)
if [ "$TREFFER" -ne 1 ]; then
  echo "FEHLER: Es gibt $TREFFER Zeilen mit SMTP_PASSWORT= (erwartet: genau eine)."
  echo "        Es wurde NICHTS geaendert."
  exit 1
fi

# ── 1. Passwort verdeckt einlesen, zweimal ─────────────────────
#
# Zweimal, weil die Eingabe unsichtbar ist: So faellt ein Vertipper
# oder ein unvollstaendig eingefuegter Wert sofort auf, statt erst
# beim naechsten Mailversand.
echo "Neues Passwort fuer das Postfach eingeben (die Eingabe bleibt unsichtbar)."
echo ""
read -rs -p "Passwort:            " NEU1; echo ""
read -rs -p "Passwort wiederholen: " NEU2; echo ""
echo ""

if [ "$NEU1" != "$NEU2" ]; then
  echo "FEHLER: Die beiden Eingaben sind nicht gleich. Es wurde NICHTS geaendert."
  exit 1
fi
NEU="$NEU1"
unset NEU1 NEU2

[ -n "$NEU" ] || { echo "FEHLER: Es wurde nichts eingegeben. Es wurde NICHTS geaendert."; exit 1; }

echo "Eingegeben: ${#NEU} Zeichen."
echo "Stimmt diese Zahl nicht mit deinem Passwort ueberein, ist beim Einfuegen"
echo "etwas verloren gegangen — dann abbrechen (Strg+C) und noch einmal."
echo ""

# ── 2. Anfuehrungszeichen waehlen ──────────────────────────────
#
# Einfache Anfuehrungszeichen bevorzugt: Ihr Inhalt wird von jedem
# .env-Leser woertlich genommen, ohne dass \n, $ oder ` unterwegs
# eine eigene Bedeutung bekommen.
if [[ "$NEU" != *"'"* ]]; then
  ZITAT="'"
elif [[ "$NEU" != *'"'* ]]; then
  ZITAT='"'
else
  echo "FEHLER: Das Passwort enthaelt beide Arten von Anfuehrungszeichen."
  echo "        So laesst es sich in einer .env-Datei nicht sicher ablegen."
  echo "        Bitte im Postfach ein Passwort ohne ' und \" vergeben."
  echo "        Es wurde NICHTS geaendert."
  exit 1
fi

# ── 3. ERST ausprobieren, DANN schreiben ───────────────────────
#
# Der wichtigste Schritt. Die uebrigen Zugangsdaten kommen aus der
# bestehenden .env, das Passwort aus der Eingabe. Scheitert die
# Anmeldung, wird die Datei nicht einmal angefasst.
echo "Anmeldung beim Mailserver wird ausprobiert …"
if ! (cd "$ORDNER" && VERA_NEUES_PASSWORT="$NEU" node --env-file=.env -e '
  const nodemailer = require("nodemailer");
  const port = Number(process.env.SMTP_PORT);
  nodemailer
    .createTransport({
      host: process.env.SMTP_SERVER,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_BENUTZER, pass: process.env.VERA_NEUES_PASSWORT },
    })
    .verify()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error("  Meldung des Mailservers: " + e.message);
      process.exit(1);
    });
'); then
  echo ""
  echo "✗ Die Anmeldung wurde abgewiesen. Es wurde NICHTS geaendert."
  echo "  Entweder ist das Passwort nicht das richtige, oder beim Einfuegen"
  echo "  ist etwas verloren gegangen (siehe Zeichenzahl oben)."
  exit 1
fi
echo "✓ Der Mailserver hat die Anmeldung angenommen."
echo ""

# ── 4. Sicherung, dann genau eine Zeile ersetzen ───────────────
cp -p "$ENV" "$SICHERUNG"
chmod 600 "$SICHERUNG"
echo "Sicherung der bisherigen Datei: $SICHERUNG"

TMP=$(mktemp)
chmod 600 "$TMP"
trap 'rm -f "$TMP"' EXIT

# ueber ENVIRON statt ueber eine Ersetzung: So wird das Passwort
# woertlich uebernommen, ohne dass Zeichen wie & oder \ unterwegs
# eine Sonderbedeutung bekommen.
VERA_NEUES_PASSWORT="$NEU" ZITAT="$ZITAT" awk '
  /^SMTP_PASSWORT=/ && !getan {
    print "SMTP_PASSWORT=" ENVIRON["ZITAT"] ENVIRON["VERA_NEUES_PASSWORT"] ENVIRON["ZITAT"]
    getan = 1
    next
  }
  { print }
' "$ENV" > "$TMP"

# Mit "cat >" statt "mv": Die Datei behaelt Eigentuemer und Rechte.
cat "$TMP" > "$ENV"

# ── 5. Gegenprobe 1: nur EINE Zeile darf sich unterscheiden ────
GEAENDERT=$(diff "$SICHERUNG" "$ENV" | grep -c '^[<>]' || true)
ANDERE=$(diff "$SICHERUNG" "$ENV" | grep '^[<>]' | grep -cv 'SMTP_PASSWORT=' || true)

echo ""
echo "Vergleich mit der Sicherung:"
echo "  geaenderte Zeilen insgesamt:            $GEAENDERT (erwartet: 2 — die alte und die neue)"
echo "  davon ausserhalb von SMTP_PASSWORT:     $ANDERE (erwartet: 0)"

if [ "$ANDERE" -ne 0 ]; then
  cp -p "$SICHERUNG" "$ENV"
  echo "FEHLER: Es haette sich mehr als die Passwortzeile geaendert."
  echo "        Die vorherige Fassung wurde wiederhergestellt."
  exit 1
fi

# ── 6. Gegenprobe 2: steht in der Datei WIRKLICH das Eingegebene? ──
#
# Verglichen wird ueber Pruefsummen, die nirgends ausgegeben werden.
# Das ist der Unterschied zwischen "sieht richtig aus" und "ist
# nachweislich richtig" — Zeichen auf dem Bildschirm sind in dieser
# Konsole schon mehrfach getaeuscht haben.
ERWARTET=$(printf '%s' "$NEU" | sha256sum | cut -d' ' -f1)
GELESEN=$(cd "$ORDNER" && node --env-file=.env -e 'process.stdout.write(process.env.SMTP_PASSWORT || "")' | sha256sum | cut -d' ' -f1)

if [ "$ERWARTET" != "$GELESEN" ]; then
  cp -p "$SICHERUNG" "$ENV"
  echo ""
  echo "FEHLER: Aus der Datei wird nicht genau das gelesen, was eingegeben wurde."
  echo "        Die vorherige Fassung wurde wiederhergestellt."
  exit 1
fi

echo "  aus der Datei gelesener Wert:           stimmt mit der Eingabe ueberein"
echo ""
echo "✓ Fertig. Es wurde ausschliesslich SMTP_PASSWORT ersetzt."
echo ""
echo "Naechster Schritt:"
echo "  cd /var/www/vera && sudo -u vera npm run mail:pruefen"
