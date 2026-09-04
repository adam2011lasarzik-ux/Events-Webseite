#!/bin/bash
# ---------------------------------------------------------------
#  Alle Prüflisten nacheinander.
#
#  Aufruf aus dem Projektordner:
#      bash pruefung/alle.sh
#
#  Voraussetzungen (siehe docs/pruefen.md):
#    - Datenbank läuft, .env ist gefüllt
#    - `npm run build` ist gelaufen
#    - Ein Server läuft auf Port 3213 mit den Testwerten für die
#      Zahlung, dazu die Anbieter-Attrappe auf Port 4242
#
#  Zwischen den Läufen werden Anmeldungen geleert: Zwei Listen, die
#  sich denselben Datenstand teilen, gehen einander sonst in die Quere.
# ---------------------------------------------------------------
set -u
cd "$(dirname "$0")/.." || exit 1
P=pruefung

# Werte NUR für die örtliche Attrappe. Keine echten Schlüssel — echte
# gehören in .env beziehungsweise in die Umgebung des Hosters.
export ZAHLUNG_GEHEIMSCHLUESSEL=sk_test_pruefung_ohne_echtes_konto
export ZAHLUNG_WEBHOOK_GEHEIMNIS=whsec_pruefgeheimnis_nur_lokal
export ZAHLUNG_TEST_HOST=127.0.0.1
export ZAHLUNG_TEST_PORT=4242
export OEFFENTLICHE_ADRESSE=http://127.0.0.1:3213

lauf () {
  local name="$1"; shift
  echo ""
  echo "═══════════════════════════════════════════════"
  echo "  $name"
  echo "═══════════════════════════════════════════════"

  # Die Vorbereitung darf NICHT stillschweigend scheitern.
  #
  # Genau das ist einmal passiert: Hier stand ein falscher Dateiname,
  # und weil die Ausgabe nach /dev/null ging, lief das Aufräumen bei
  # jeder Liste ins Leere. Die Folge waren drei Listen, die sich
  # gegenseitig Daten hinterliessen — und drei Fehlschläge, die nach
  # Produktfehlern aussahen und keine waren. Deshalb wird der Erfolg
  # jetzt geprüft und der Lauf abgebrochen, wenn er ausbleibt.
  if ! npx tsx --env-file=.env "$P/leeren.mjs" >/dev/null 2>&1; then
    echo "✗ ABBRUCH: $P/leeren.mjs ist fehlgeschlagen — der Datenstand wäre unklar."
    npx tsx --env-file=.env "$P/leeren.mjs" 2>&1 | tail -5
    exit 1
  fi
  if ! npm run admin -- test-admin@vera.example "Sonnenblume-Kaffee-Regen" >/dev/null 2>&1; then
    echo "✗ ABBRUCH: der Testzugang liess sich nicht anlegen."
    exit 1
  fi

  # tail -6 statt -4: Die Schlusszeile mancher Listen stand sonst
  # ausserhalb des Ausschnitts und sah aus wie ein Fehlschlag.
  npx tsx --env-file=.env "$@" 2>&1 | tail -6
}

lauf "E/H · Anmeldung (32)"                 "$P/H/pruefe.mjs"
lauf "E/H · Preis-Invarianten"              "$P/H/invariante.mjs"
lauf "F · Adminzugang, Sitzungen (13)"      "$P/H/admin3.mjs"
lauf "F · Aktionen ohne Sitzung (7)"        "$P/H/admin2.mjs"
lauf "F · Anmeldungen, CSV, Löschen (26)"   "$P/H/admin5.mjs"
lauf "F · Event-Formular (14)"              "$P/F/admin4.mjs"
lauf "G · Themes und Inhalte (18)"          "$P/H/g1.mjs"
lauf "G · Anmeldung je Event (20)"          "$P/H/g2.mjs"
lauf "H · Bild-Upload (20)"                 "$P/H/h-upload.mjs"
lauf "I · Gründerbereich (29)"              "$P/I/i-gruender.mjs"
lauf "J · Zahlung und Reservierung (38)"    "$P/J/j-zahlung.mjs"
lauf "J · Adminbereich Zahlung (9)"         "$P/J/j-admin.mjs"
lauf "J · Browser Zahlung (12)"             "$P/J/j-browser.mjs"
lauf "K · Ablauf, die 15 Fälle (32)"        "$P/K/k-ablauf.mjs"
lauf "K · Browser Ende zu Ende (13)"        "$P/K/k-browser.mjs"
lauf "M · Fehlgeschlagene Zahlung (15)"     "$P/M/m-fehlschlag.mjs"

echo ""
echo "═══════════════════════════════════════════════"
echo "  N · Rechtsseiten (18)"
echo "═══════════════════════════════════════════════"
node "$P/N/n-seiten.mjs" 2>&1 | tail -3

echo ""
echo "═══════════════════════════════════════════════"
echo "  O · Links und Knöpfe (9)"
echo "═══════════════════════════════════════════════"
node "$P/O/o-links.mjs" 2>&1 | tail -3

# Reine Regel, braucht weder Datenbank noch Browser — deshalb hier
# unten und nicht in der `lauf`-Gruppe mit ihrem Datenbank-Vorlauf.
echo ""
echo "═══════════════════════════════════════════════"
echo "  L · Kopfleiste: Für Schulen (16)"
echo "═══════════════════════════════════════════════"
npx tsx "$P/L/l-schulen.mjs" 2>&1 | tail -3

echo ""
echo "FERTIG"
