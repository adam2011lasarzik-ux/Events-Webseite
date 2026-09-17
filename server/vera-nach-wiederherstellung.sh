#!/bin/bash
# ---------------------------------------------------------------
#  Nach einer Wiederherstellung aus der Sicherung.
#
#  DAS PROBLEM, UM DAS ES HIER GEHT
#
#  Eine Sicherung ist ein Abbild von gestern — mitsamt der Daten, die
#  seitdem gelöscht wurden. Spielt man sie zurück, sind die Namen,
#  E-Mail-Adressen und Telefonnummern wieder da, die jemand hat
#  löschen lassen. Ohne diesen Schritt wäre jede Wiederherstellung
#  eine stille Rücknahme aller Löschungen.
#
#  DIE LÖSUNG
#
#  Der Löschlauf wird sofort nach der Wiederherstellung erneut
#  ausgeführt, BEVOR die Anwendung wieder in Betrieb geht. Er rechnet
#  die Fälligkeit aus dem Veranstaltungstermin — ein Datensatz, der
#  gestern fällig war, ist es heute erst recht. Was gelöscht gehörte,
#  verschwindet damit wieder.
#
#  WAS ER NICHT WIEDERHERSTELLEN KANN
#
#  Eine Löschsperre, die zwischen Sicherung und Wiederherstellung
#  gesetzt wurde, fehlt im zurückgespielten Stand. Der Lauf setzt die
#  automatischen Sperren (Rückbuchung, offener Vorfall) selbst neu —
#  eine von Hand gesetzte Sperre (Beschwerde, Rechtsstreit) ist
#  jedoch weg und muss im Adminbereich erneut eingetragen werden.
#  Deshalb fragt dieses Skript ausdrücklich danach, statt es
#  stillschweigend zu übergehen.
#
#  Aufruf (als root, direkt nach dem Einspielen):
#    sudo /usr/local/bin/vera-nach-wiederherstellung.sh
# ---------------------------------------------------------------
set -euo pipefail

APP=/var/www/vera

echo "═══════════════════════════════════════════════"
echo "  Nach der Wiederherstellung"
echo "═══════════════════════════════════════════════"
echo ""
echo "Die Anwendung sollte JETZT noch gestoppt sein."
echo "Falls nicht:  sudo systemctl stop vera"
echo ""

read -r -p "Ist der Dienst gestoppt und die Datenbank eingespielt? [ja/nein] " antwort
if [ "$antwort" != "ja" ]; then
  echo "Abgebrochen. Nichts geändert."
  exit 1
fi

echo ""
echo "── Schritt 1: Migrationen nachziehen ──"
# Die Sicherung kann von einem älteren Schemastand stammen.
sudo -u vera bash -c "cd $APP && npm run db:deploy"

echo ""
echo "── Schritt 2: Probelauf — was wäre wieder da? ──"
sudo -u vera bash -c "cd $APP && npm run loeschen:vorschau"

echo ""
echo "Oben steht, was der zurückgespielte Stand an fälligen Daten"
echo "wieder enthält. Genau das wird im nächsten Schritt erneut"
echo "gelöscht beziehungsweise anonymisiert."
echo ""

read -r -p "Löschlauf jetzt ausführen? [ja/nein] " antwort
if [ "$antwort" != "ja" ]; then
  echo ""
  echo "ABGEBROCHEN — und das ist ein Zustand, den man nicht stehen"
  echo "lassen darf: Die Anwendung enthält gerade Daten, die gelöscht"
  echo "sein müssten. Hole den Lauf nach, bevor der Dienst startet:"
  echo "    sudo -u vera bash -c 'cd $APP && npm run loeschen'"
  exit 1
fi

echo ""
echo "── Schritt 3: Löschlauf ──"
sudo -u vera bash -c "cd $APP && npm run loeschen"

echo ""
echo "═══════════════════════════════════════════════"
echo "  Noch von Hand zu erledigen"
echo "═══════════════════════════════════════════════"
echo ""
echo "1. Von Hand gesetzte Löschsperren prüfen."
echo "   Sperren wegen Beschwerde, Versicherungsfall oder Rechtsstreit,"
echo "   die nach der Sicherung gesetzt wurden, fehlen im"
echo "   zurückgespielten Stand. Sie müssen erneut eingetragen werden:"
echo "       /admin/loeschen"
echo ""
echo "2. Vorfälle prüfen — ein nach der Sicherung eröffneter Vorfall"
echo "   fehlt ebenfalls:"
echo "       /admin/vorfaelle"
echo ""
echo "3. Erst danach den Dienst starten:"
echo "       sudo systemctl start vera"
