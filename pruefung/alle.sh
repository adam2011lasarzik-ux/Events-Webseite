#!/bin/bash
# ---------------------------------------------------------------
#  Alle Prüflisten nacheinander.
#
#  Aufruf aus dem Projektordner:
#      bash pruefung/alle.sh
#
#  Voraussetzungen (siehe docs/pruefen.md) — DREI Prozesse, nicht zwei:
#    - Datenbank läuft, .env ist gefüllt, `npm run build` ist gelaufen
#    - Port 4242: die Attrappe des Zahlungsanbieters
#    - Port 3213: ein Server MIT den Zahlungs-Testwerten
#    - Port 3249: ein Server OHNE Sonderwerte (Seiten, Links)
#
#  Zwischen den Läufen werden Anmeldungen geleert: Zwei Listen, die
#  sich denselben Datenstand teilen, gehen einander sonst in die Quere.
#
#  ── Warum dieses Skript seine Voraussetzungen selbst prüft ──
#
#  Es tat das lange nicht, und das hat es zu einem Werkzeug gemacht,
#  das lügt: Der Kopf nannte nur 3213 und 4242, der dritte Server
#  fehlte. Die Listen N und O laufen aber gegen 3249. Ohne ihn stürzten
#  beide mit "ERR_CONNECTION_REFUSED" ab — und weil jede Liste durch
#  `| tail` lief, ging ihr Exitcode verloren und am Ende stand trotzdem
#  "FERTIG". 57 Prüfungen fielen bei jedem Sammellauf still aus.
#
#  Deshalb jetzt: Ports vorab prüfen und abbrechen, Exitcode jeder
#  Liste auswerten, und am Schluss eine Bilanz statt eines Grußworts.
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

# ── Riegel vor der echten Datenbank ──────────────────────────────
#
# Muss VOR allem anderen greifen. Das Repository liegt auch auf dem
# Produktionsserver; ein Lauf von dort aus würde echte Buchungen
# löschen. Die Begründung steht in pruefung/schutz.mjs.
node --env-file=.env "$P/schutz.mjs" || exit 1

# ── Voraussetzungen prüfen, bevor irgendetwas läuft ──────────────
#
# Lieber hier abbrechen mit einem Satz, der sagt was fehlt, als
# mitten im Lauf mit einem Stapelabzug, der nach Produktfehler
# aussieht und keiner ist.
fehlt=0
pruefe_port () {
  local port="$1" zweck="$2"
  if ! curl -s -o /dev/null --max-time 5 "http://127.0.0.1:$port/"; then
    echo "✗ Port $port antwortet nicht — $zweck"
    fehlt=1
  fi
}
pruefe_port 4242 "die Attrappe des Zahlungsanbieters"
pruefe_port 3213 "Server MIT Zahlungs-Testwerten"
pruefe_port 3249 "Server OHNE Sonderwerte (Listen N und O)"
if [ "$fehlt" -ne 0 ]; then
  echo ""
  echo "ABBRUCH: Es fehlen Prozesse. docs/pruefen.md sagt, wie man sie startet."
  echo "Ein Lauf ohne sie wäre kein Beweis, sondern ein Zufallsergebnis."
  exit 1
fi

gelaufen=0
gescheitert=0
gescheiterte_listen=""

# Gemeinsamer Kern von `lauf` und `lauf_rein`: ausführen, Exitcode
# festhalten (NICHT durch die Pipe verlieren), Ausschnitt zeigen.
#
# tail -6 statt -4: Die Schlusszeile mancher Listen stand sonst
# ausserhalb des Ausschnitts und sah aus wie ein Fehlschlag.
fuehre_aus () {
  local name="$1"; shift
  local ausgabe code
  ausgabe=$("$@" 2>&1)
  code=$?
  printf '%s\n' "$ausgabe" | tail -6

  gelaufen=$((gelaufen + 1))
  if [ "$code" -ne 0 ]; then
    gescheitert=$((gescheitert + 1))
    gescheiterte_listen="${gescheiterte_listen}  · ${name} (Exitcode ${code})"$'\n'
    echo ""
    echo "✗ FEHLGESCHLAGEN: $name"
  fi
}

kopf () {
  echo ""
  echo "═══════════════════════════════════════════════"
  echo "  $1"
  echo "═══════════════════════════════════════════════"
}

# Listen, die einen sauberen Datenstand und einen Testzugang brauchen.
lauf () {
  local name="$1"; shift
  kopf "$name"

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

  fuehre_aus "$name" npx tsx --env-file=.env "$@"
}

# Listen ohne Datenbank-Vorlauf (reine Regeln, Seiten, Links).
lauf_rein () {
  local name="$1"; shift
  kopf "$name"
  fuehre_aus "$name" "$@"
}

lauf "E/H · Anmeldung"                 "$P/H/pruefe.mjs"
lauf "E/H · Preis-Invarianten"              "$P/H/invariante.mjs"
lauf "F · Adminzugang, Sitzungen"      "$P/H/admin3.mjs"
lauf "F · Aktionen ohne Sitzung"        "$P/H/admin2.mjs"
lauf "F · Anmeldungen, CSV, Löschen"   "$P/H/admin5.mjs"
lauf "F · Event-Formular"              "$P/F/admin4.mjs"
lauf "F · Protokoll der Admin-Aktionen" "$P/F/admin-protokoll.mjs"
lauf "F · Zweiter Faktor (TOTP)"        "$P/F/admin-2fa.mjs"
lauf "G · Themes und Inhalte"          "$P/H/g1.mjs"
lauf "G · Anmeldung je Event"          "$P/H/g2.mjs"
lauf "H · Bild-Upload"                 "$P/H/h-upload.mjs"
lauf "I · Gründerbereich"              "$P/I/i-gruender.mjs"
lauf "J · Zahlung und Reservierung"    "$P/J/j-zahlung.mjs"
lauf "J · Adminbereich Zahlung"         "$P/J/j-admin.mjs"
lauf "J · Browser Zahlung"             "$P/J/j-browser.mjs"
lauf "K · Ablauf, die 15 Fälle"        "$P/K/k-ablauf.mjs"
lauf "K · Browser Ende zu Ende"        "$P/K/k-browser.mjs"
lauf "M · Fehlgeschlagene Zahlung"     "$P/M/m-fehlschlag.mjs"
lauf "M · Spaete Zahlungsbestaetigung" "$P/M/m-spaete-bestaetigung.mjs"
lauf "P · Storno-Regeln"               "$P/P/p-storno-regeln.mjs"
lauf "P · Storno-Mails"                "$P/P/p-storno-mails.mjs"
lauf "P · Erstattung und Kulanz"       "$P/P/p-erstattung.mjs"
lauf "P · Storno von Ende zu Ende"     "$P/P/p-storno-ablauf.mjs"
lauf "P · Storno durch den Veranstalter" "$P/P/p-admin-storno.mjs"
lauf "P · Anmeldung endgueltig loeschen" "$P/P/p-anmeldung-loeschen.mjs"
lauf "S · Loeschlauf je Klasse und Sperre" "$P/S/s-loeschlauf.mjs"
lauf "S · Zugang zu Loeschen und Vorfaellen" "$P/S/s-zugang.mjs"
lauf "S · Monatliche Papiererinnerung" "$P/S/s-papier.mjs"
lauf "S · Bedienung der Loeschsperren" "$P/S/s-sperr-bedienung.mjs"
lauf "S · Vorschau-Tabellen in Klartext" "$P/S/s-vorschau-klartext.mjs"
lauf "T · Termin-Pflicht: Ablauf und Umgehung" "$P/T/t-http.mjs"
lauf "U · Versionierte Rechtstexte" "$P/U/u-rechtstexte.mjs"
lauf "V · Bestellknopf, AGB-Haken, Aufnahmehinweis" "$P/V/v-checkout.mjs"
lauf "W · Widerspruch gegen Aufnahmen" "$P/W/w-aufnahmen.mjs"

# Diese beiden laufen gegen den Server OHNE Sonderwerte (Port 3249).
lauf_rein "N · Rechtsseiten"           node "$P/N/n-seiten.mjs"
lauf_rein "O · Links und Knöpfe"        node "$P/O/o-links.mjs"

# Reine Regeln, brauchen weder Datenbank noch Browser.
lauf_rein "L · Kopfleiste: Menü und Anmelden" npx tsx "$P/L/l-schulen.mjs"
lauf_rein "Q · Überwachung (Mail-Texte und Wächter-Logik)" npx tsx "$P/Q/q-wache.mjs"
lauf_rein "R · Riegel vor der echten Datenbank" node "$P/R/r-schutz.mjs"
lauf_rein "S · Loeschfristen (reine Regeln)" npx tsx "$P/S/s-fristen.mjs"
lauf_rein "S · Server-Skripte (grep-Falle)" node "$P/S/s-skripte.mjs"
lauf_rein "T · Termin-Pflicht: Regel und Verdrahtung" npx tsx "$P/T/t-regel.mjs"

# ── Bilanz ───────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════"
if [ "$gescheitert" -eq 0 ]; then
  echo "  FERTIG — $gelaufen Listen, alle in Ordnung"
  echo "═══════════════════════════════════════════════"
  exit 0
fi
echo "  NICHT IN ORDNUNG — $gescheitert von $gelaufen Listen"
echo "═══════════════════════════════════════════════"
printf '%s' "$gescheiterte_listen"
exit 1
