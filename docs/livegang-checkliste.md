# Livegang-Checkliste — was vor dem echten Start fehlt

Stand: 09.10.2026. Die Buchungsstrecke (Ticketarten, Preise, Familienpaket,
Mehrfachbuchung) ist fertig und live auf der passwortgeschützten Seite im
**Stripe-Testmodus**. Diese Liste führt zum echten Betrieb.

Legende: 🔴 Blocker (ohne das kein echter Verkauf) · 🟡 Betrieb/Sicherheit
· 🟢 Testen · ✅ schon gebaut, nur aktivieren/konfigurieren.

---

## 🔴 1 — Stripe von Test auf Echt

Der Riegel in `lib/zahlung.ts` weist jeden Schlüssel ab, der nicht mit
`sk_test_` beginnt — echter Betrieb ist eine **bewusste** Umstellung.

Schritt-für-Schritt steht in **`docs/stripe-einrichten.md`**. Kurzfassung:

- [ ] Stripe-Konto verifiziert, **Auszahlungs-Bankkonto** hinterlegt.
- [ ] Seite läuft unter **öffentlicher Adresse** (Passwortschutz aus, Punkt 3)
      — sonst kann Stripe keinen Webhook schicken.
- [ ] `.env` (auf dem Server, nicht in Git):
  - `ZAHLUNG_GEHEIMSCHLUESSEL="sk_live_…"`
  - `ZAHLUNG_WEBHOOK_GEHEIMNIS="whsec_…"` (aus „Entwickler → Webhooks")
  - `OEFFENTLICHE_ADRESSE="https://veraevents.de"` (ohne Schrägstrich am Ende)
  - `ANMELDUNG_SCHLUESSEL="…"` gesetzt (`openssl rand -base64 32`) **und in die
    Sicherung aufgenommen** — ohne ihn sind bezahlte Anmeldungen unlesbar.
- [ ] Riegel im Code bewusst für `sk_live_` öffnen (das mache ich auf dein Wort).
- [ ] Prüfen (zeigt keine Schlüssel): `npm run zahlung:pruefen`
- [ ] Echter Mini-Kauf + Erstattung zur Kontrolle.

> Was nur du kannst: Konto/Bank, die echten Schlüssel. · Was ich mache: Riegel
> umstellen, `.env`-Verdrahtung erklären, Webhook-Pfad bestätigen.

## 🔴 2 — E-Mail scharf schalten ✅ gebaut

`lib/mail.ts` ist fertig; ohne Zugangsdaten verschickt es einfach nichts.

- [ ] SMTP-Daten setzen — am sichersten mit dem Helfer:
      `sudo -u vera /var/www/vera/server/vera-smtp-passwort-setzen.sh`
      (testet das Passwort beim Mailserver, BEVOR es in die `.env` kommt).
      Dazu in `.env`: `SMTP_SERVER`, `SMTP_PORT`, `SMTP_BENUTZER`,
      `SMTP_ABSENDER`, optional `MAIL_ADMIN_EMPFAENGER`.
- [ ] Prüfen: `npm run mail:pruefen`
- [ ] End-to-End: Test-Anmeldung → Bestätigungsmail kommt an; Storno →
      Erstattungsmail; neue Anmeldung → Admin-Benachrichtigung.

## 🔴 3 — Passwortschutz entfernen

- [ ] In der `.env` **`NEXT_PUBLIC_VORSCHAU_PASSWORT` leeren/entfernen**
      (Build-Zeit-Wert) und neu ausrollen (Punkt 9). Leer = Seite öffentlich.

## 🔴 4 — Rechtstexte final + anwaltlich freigegeben

Seiten existieren (`/impressum`, `/datenschutz`, `/agb`, `/widerruf`).

- [ ] Endfassung von **einem Anwalt** freigeben lassen (ich bin kein Anwalt und
      darf keine Rechtsberatung geben). Besonders: Teilnahmebedingungen,
      Widerruf/Storno, Bestätigungsmail-Inhalte, Umgang mit Minderjährigen.

## 🔴 5 — Echte Event-Daten setzen (Admin)

- [ ] Richtiges Datum/Uhrzeit, Ort, Preise, Anmeldefrist, Kapazität (100),
      Ticketarten (Schüler/Erwachsene/Familie), Status **„veröffentlicht"**.
      (Das aktuelle Event trägt noch Test-Daten.)

---

## 🟡 6 — Sicherungen ✅ gebaut

- [ ] Nächtliche Sicherung aktivieren: `sudo systemctl enable --now vera-sicherung.timer`
- [ ] Einmal testen: `sudo systemctl start vera-sicherung.service` →
      `journalctl -u vera-sicherung.service -n 20`
- [ ] Schlüssel passt zur Sicherung: `server/vera-schluessel-pruefen.sh`
- [ ] **Rückspiel-Test** (Pflicht einmal): `server/vera-ruecktest.sh`

## 🟡 7 — Server-Sicherheit

Checkliste in **`docs/sicherheit-serverpruefung.md`** abarbeiten:

- [ ] HTTPS/TLS gültig, HTTP → HTTPS. · Firewall: nur 80/443 (+SSH).
- [ ] MariaDB nur lokal erreichbar. · `.env`-Rechte eng (nur `vera`).
- [ ] `NODE_ENV=production`.

## 🟡 8 — Überwachung ✅ gebaut

- [ ] Wache aktivieren: `sudo systemctl enable --now vera-wache.timer`
      (prüft alle 15 Min, mailt nur bei Zustandswechsel; `vera-wache.sh --probe`
      zeigt den Stand ohne Mail).
- [ ] Zahlungsabgleich-Timer aktiv: `sudo systemctl enable --now vera-zahlungsabgleich.timer`
- [ ] Externer Uptime-Monitor (z. B. UptimeRobot) auf die Startseite.
- [ ] Schneller Gesamtblick jederzeit: `vera-status`

## 🟡 9 — Deploy-Hygiene ✅ neu

- [ ] Ab jetzt in **einem** Schritt ausrollen (setzt den Besitz selbst zurück,
      kein 502 mehr):
      ```
      cd /var/www/vera && ./server/vera-deploy.sh
      ```

---

## 🟢 10 — Voller Testlauf (noch im Testmodus)

- [ ] Erfolgreiche Zahlung · Abbruch · fehlgeschlagene Karte · zweiter Anlauf.
- [ ] **Echte Webhook-Zustellung** (Zahlung wird erst durch den Webhook bestätigt).
- [ ] Storno mit Erstattung · Teilerstattung.
- [ ] Kapazitätsgrenze (Buchung über freie Plätze hinaus wird abgelehnt).
- [ ] Alle vier Wege: Mich selbst · Mein Kind · Mehrere Erwachsene · Familienpaket.
- [ ] Oberfläche auf Handy (ab 320 px) und Rechner.

Die automatische Prüf-Suite (`pruefung/alle.sh`) deckt die Logik ab; was eine
Maschine nicht abnimmt (echtes Geld, echtes Aussehen, echte Mail), steht oben.

---

## Reihenfolge-Empfehlung

1 (Stripe) und 2 (E-Mail) zuerst — ohne die läuft keine echte Buchung. Dann 3
(öffentlich schalten) zusammen mit 5 (Event-Daten) und 4 (Recht). 6–9 begleitend,
10 als Abnahme vor dem Scharfschalten. **Nichts davon live schalten ohne
ausdrückliche Freigabe.**
