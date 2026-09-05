#!/bin/bash
# ---------------------------------------------------------------
#  Vollstaendige Pruefung der Backblaze-B2-Anbindung.
#
#  Prueft BEIDE Zugaenge einzeln und vor allem, dass sie wirklich
#  getrennt sind: Der Schreib-Zugang darf NICHT lesen koennen, der
#  Lese-Zugang NICHT schreiben. Genau darauf beruht der Schutz —
#  ein gekaperter Server soll die Sicherungen weder ausspaehen noch
#  zerstoeren koennen.
#
#  Fasst bestehende Sicherungen nicht an: sie werden nur gelesen,
#  nie ueberschrieben oder geloescht. Die Testdatei traegt bewusst
#  den Namensanfang "pruefung-", damit sie nie mit einer echten
#  Sicherung verwechselt wird.
#
#  Zeigt keine Zugangsdaten an.
#
#  Aufruf:  /usr/local/bin/vera-b2-pruefung.sh
# ---------------------------------------------------------------
set -uo pipefail   # bewusst OHNE -e: manche Befehle MUESSEN scheitern

CONF=/home/vera/.config/rclone/rclone.conf
EIMER=Vera-sicherungen
ARBEIT=$(mktemp -d); chmod 700 "$ARBEIT"
TESTDATEI="pruefung-schreibtest-$(date +%Y%m%d_%H%M%S).txt"
trap 'rm -rf "$ARBEIT"' EXIT

gut=0; warn=0; schlecht=0
melde() { # $1 = Symbol, $2 = Text
  printf '   %s %s\n' "$1" "$2"
  case "$1" in "OK") gut=$((gut+1));; "WARN") warn=$((warn+1));; *) schlecht=$((schlecht+1));; esac
}
# Sucht in einer Ausgabe nach Rechte-Fehlern, ohne sie anzuzeigen.
hat401() { grep -qE '\b(401|403)\b|Unauthorized|not authorized|forbidden' "$1"; }

echo "═══ A. SCHREIB-Zugang (b2vera) ═══"

rclone --config "$CONF" lsd b2vera: > "$ARBEIT/a1" 2>&1
if [ $? -eq 0 ] && grep -q "$EIMER" "$ARBEIT/a1"; then
  melde OK "A1 Anmeldung funktioniert, Bucket sichtbar"
else
  melde FEHLER "A1 Anmeldung fehlgeschlagen"; hat401 "$ARBEIT/a1" && melde FEHLER "   (Rechte-Fehler 401/403)"
fi

echo "Pruefdatei — darf geloescht werden. Erzeugt: $(date -Iseconds)" > "$ARBEIT/test.txt"
rclone --config "$CONF" copyto --no-check-dest "$ARBEIT/test.txt" "b2vera:$EIMER/$TESTDATEI" > "$ARBEIT/a2" 2>&1
A2=$?
if [ $A2 -eq 0 ]; then
  melde OK "A2 Hochladen funktioniert ($TESTDATEI)"
else
  melde FEHLER "A2 Hochladen fehlgeschlagen"; hat401 "$ARBEIT/a2" && melde FEHLER "   (Rechte-Fehler 401/403)"
fi

if hat401 "$ARBEIT/a1" || hat401 "$ARBEIT/a2"; then
  melde FEHLER "A3 Es traten 401/403-Fehler auf"
else
  melde OK "A3 Keine 401-/403-Fehler beim Schreiben"
fi

echo ""
echo "═══ B. LESE-Zugang (b2lesen) ═══"

rclone --config "$CONF" lsl "b2lesen:$EIMER" > "$ARBEIT/b1" 2>&1
B1=$?
ANZAHL=$(grep -c 'vera-.*\.sql\.age' "$ARBEIT/b1" 2>/dev/null || echo 0)
if [ $B1 -eq 0 ]; then
  melde OK "B1 Anmeldung und Auflisten funktionieren ($ANZAHL Sicherung(en) gefunden)"
else
  melde FEHLER "B1 Auflisten fehlgeschlagen"; hat401 "$ARBEIT/b1" && melde FEHLER "   (Rechte-Fehler 401/403)"
fi

NEUESTE=$(rclone --config "$CONF" lsf "b2lesen:$EIMER" --include "vera-*.sql.age" 2>/dev/null | sort | tail -1)
if [ -n "$NEUESTE" ]; then
  rclone --config "$CONF" copyto "b2lesen:$EIMER/$NEUESTE" "$ARBEIT/geladen.age" > "$ARBEIT/b2" 2>&1
  B2=$?
  GROESSE=$(wc -c < "$ARBEIT/geladen.age" 2>/dev/null || echo 0)
  if [ $B2 -eq 0 ] && [ "$GROESSE" -gt 0 ]; then
    # Ist es wirklich eine age-Datei? Dann steht das im Dateikopf.
    if head -c 30 "$ARBEIT/geladen.age" | grep -q "age-encryption"; then
      melde OK "B2 Herunterladen funktioniert ($NEUESTE, $GROESSE Bytes, echte age-Verschluesselung)"
    else
      melde WARN "B2 Datei geladen ($GROESSE Bytes), aber kein age-Kopf erkennbar"
    fi
  else
    melde FEHLER "B2 Herunterladen fehlgeschlagen"; hat401 "$ARBEIT/b2" && melde FEHLER "   (Rechte-Fehler 401/403)"
  fi
else
  melde WARN "B2 Keine Sicherung zum Herunterladen gefunden"
fi

if hat401 "$ARBEIT/b1" || { [ -f "$ARBEIT/b2" ] && hat401 "$ARBEIT/b2"; }; then
  melde FEHLER "B3 Es traten 401/403-Fehler auf"
else
  melde OK "B3 Keine 401-/403-Fehler beim Lesen"
fi

echo ""
echo "═══ C. Trennung der beiden Zugaenge ═══"

# C1: Der SCHREIB-Zugang darf NICHT lesen koennen.
if [ -n "$NEUESTE" ]; then
  rclone --config "$CONF" cat "b2vera:$EIMER/$NEUESTE" > /dev/null 2> "$ARBEIT/c1"
  if [ $? -ne 0 ]; then
    melde OK "C1 Schreib-Zugang kann NICHT lesen (wie vorgesehen abgewiesen)"
  else
    melde FEHLER "C1 Schreib-Zugang konnte lesen — Trennung nicht wirksam"
  fi
else
  melde WARN "C1 Nicht pruefbar (keine Sicherung vorhanden)"
fi

# C2: Der LESE-Zugang darf NICHT schreiben koennen.
rclone --config "$CONF" copyto --no-check-dest "$ARBEIT/test.txt" "b2lesen:$EIMER/pruefung-darf-nicht-entstehen.txt" > "$ARBEIT/c2" 2>&1
if [ $? -ne 0 ]; then
  melde OK "C2 Lese-Zugang kann NICHT schreiben (wie vorgesehen abgewiesen)"
else
  melde FEHLER "C2 Lese-Zugang konnte schreiben — Trennung nicht wirksam"
fi

echo ""
echo "═══ D. Testdatei aufraeumen ═══"
if [ $A2 -eq 0 ]; then
  rclone --config "$CONF" deletefile "b2vera:$EIMER/$TESTDATEI" > "$ARBEIT/d1" 2>&1
  if [ $? -eq 0 ]; then
    melde OK "D Testdatei wieder entfernt"
  else
    melde WARN "D Testdatei bleibt liegen — die 90-Tage-Objektsperre verhindert das Loeschen."
    printf '     %s\n' "Das ist KEIN Fehler, sondern genau der gewuenschte Schutz."
    printf '     %s\n' "Die Datei ist wenige Bytes gross und verfaellt automatisch."
  fi
else
  melde OK "D Nichts aufzuraeumen (es wurde nichts hochgeladen)"
fi

echo ""
echo "═══════════════════════════════════════════"
printf '  %s OK · %s Hinweis(e) · %s Fehler\n' "$gut" "$warn" "$schlecht"
echo "═══════════════════════════════════════════"
[ "$schlecht" -eq 0 ]
