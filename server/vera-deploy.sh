#!/bin/bash
# ---------------------------------------------------------------
#  VERA — Ausrollen in einem Schritt.
#
#  Holt den aktuell ausgecheckten Branch, installiert, wendet
#  ausstehende Datenbank-Migrationen an, baut, setzt den Besitz auf
#  den Dienst-Benutzer zurück und startet den Dienst neu.
#
#  Warum der Besitz-Schritt: Der Dienst läuft als Benutzer 'vera'.
#  Wird als root ausgerollt, gehören die neuen Dateien root, und der
#  Dienst darf sie nicht lesen -> 502 Bad Gateway (react/next.config
#  "nicht gefunden"). Das chown am Ende verhindert genau das.
#
#  Aufruf als root im Projektverzeichnis:
#    cd /var/www/vera && ./server/vera-deploy.sh
#
#  Schaltet NICHTS scharf: Passwortschutz (NEXT_PUBLIC_VORSCHAU_PASSWORT)
#  und Stripe-Testmodus bleiben unberührt. Das bestimmt allein die .env.
# ---------------------------------------------------------------
set -euo pipefail

APP=/var/www/vera
DIENST=vera
BENUTZER=vera

cd "$APP"

echo "══ VERA · Ausrollen $(date '+%d.%m.%Y %H:%M') ══"

echo "▶ 1/6  Git: aktuellen Branch holen"
git pull --ff-only

echo "▶ 2/6  Abhängigkeiten (npm ci)"
npm ci

echo "▶ 3/6  Datenbank-Migrationen (migrate deploy)"
npx prisma migrate deploy

echo "▶ 4/6  Build (npm run build)"
npm run build

echo "▶ 5/6  Besitz zurücksetzen auf ${BENUTZER}:${BENUTZER}"
chown -R "${BENUTZER}:${BENUTZER}" "$APP"

echo "▶ 6/6  Dienst neu starten"
systemctl restart "$DIENST"
sleep 2
systemctl status "$DIENST" --no-pager -l | head -6

echo
echo "✓ Fertig. Kurzprüfung mit:  vera-status"
