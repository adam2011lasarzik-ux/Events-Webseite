# Die Prüfungen starten

Rund 350 automatische Prüfungen laufen gegen die echte Datenbank und den
echten Server. Diese Anleitung sagt, wie man sie in Gang bringt.

> Alles hier passiert **örtlich**. Es wird nichts an einen fremden
> Dienst gesendet, kein Geld bewegt und keine Adresse veröffentlicht.

---

## Einmal vorbereiten

```bash
npm install
npx prisma migrate deploy     # Tabellen anlegen
npm run db:seed               # Startdaten
npm run build
```

In `.env` müssen `DATABASE_URL` und `OEFFENTLICHE_ADRESSE` stehen; die
Vorlage dafür ist `.env.example`.

Für die Browser-Prüfungen wird Playwright gebraucht:

```bash
npx playwright install chromium
```

---

## Drei Dinge müssen laufen

**1. Die Attrappe des Zahlungsanbieters** (Port 4242)

```bash
node pruefung/J/stripe-attrappe.mjs &
```

Sie beantwortet genau die Aufrufe, die `lib/zahlung.ts` macht. So lässt
sich der ganze eigene Ablauf prüfen, ohne einen echten Dienst zu
berühren.

**2. Ein Server mit den Testwerten** (Port 3213) — für alles rund um
die Zahlung:

```bash
ZAHLUNG_GEHEIMSCHLUESSEL=sk_test_pruefung_ohne_echtes_konto \
ZAHLUNG_WEBHOOK_GEHEIMNIS=whsec_pruefgeheimnis_nur_lokal \
ZAHLUNG_TEST_HOST=127.0.0.1 ZAHLUNG_TEST_PORT=4242 \
OEFFENTLICHE_ADRESSE=http://127.0.0.1:3213 \
PORT=3213 npm start &
```

**3. Ein Server ohne Sonderwerte** (Port 3249) — für Seiten, Links und
die Messung der Responsivität:

```bash
PORT=3249 npm start &
```

---

## Alles auf einmal

```bash
bash pruefung/alle.sh
```

Läuft rund zehn Minuten und gibt je Liste eine Zusammenfassung aus.

## Einzeln

```bash
# Anmeldung: Preise, Plätze, Duplikate, manipulierte Werte
npx tsx --env-file=.env pruefung/H/pruefe.mjs

# Zahlung: Unterschrift, doppelte Meldungen, Betragsabgleich, Riegel
npx tsx --env-file=.env pruefung/J/j-zahlung.mjs

# Responsivität, fliessend über 320–1920 px (dauert ~15 Minuten)
node pruefung/L/l-responsiv.mjs 10

# Handy im Querformat und andere flache Fenster
node pruefung/L/l-quer.mjs

# Jeder Link und jeder Knopf
node pruefung/O/o-links.mjs
```

Bildschirmfotos und Messdaten landen in `pruefung/.ausgabe/` — dieser
Ordner ist von Git ausgeschlossen.

---

## Danach aufräumen

Die Prüfungen legen Testevents, Testanmeldungen und einen Testzugang
an. Vor dem Livegang müssen sie weg:

```bash
npx tsx --env-file=.env pruefung/aufraeumen.mjs
```

Der Befehl entfernt Testevents samt hochgeladenen Bildern, alle
Anmeldungen, Bremsen, Zahlungsereignisse und die Testzugänge
(`…@vera.example`). Die echte Veranstaltung bleibt stehen. Er nennt am
Ende, was übrig ist — das gehört angesehen.

> **Der Gründerbereich wird dabei zurückgesetzt.** Die Prüfliste `I`
> lädt ein Testfoto hoch und schreibt Name, Rolle und Text um. Bliebe
> das stehen, ginge ein Prüfbild als Porträt online. Nach einem
> Prüflauf gehört der Gründerbereich im Adminbereich also **neu
> ausgefüllt** — Foto, Beschreibung und der Haken „auf der Startseite
> anzeigen".

`pruefung/leeren.mjs` ist etwas anderes: Es leert nur Anmeldungen und
Bremsen und wird ZWISCHEN zwei Prüflisten benutzt. Events lässt es
absichtlich stehen, weil `G/g2` die Events braucht, die `G/g1`
anlegt.

---

## Was diese Prüfungen NICHT abdecken

- **Der Klick durch Stripes echte Bezahlseite.** Dafür braucht es eine
  öffentlich erreichbare Adresse — also das Hosting. Siehe
  `docs/stripe-einrichten.md`.
- **Safari.** Gemessen wird in Chromium. Safari rechnet bei `svh` und
  der Adressleiste etwas anders und kennt deutsche Silbentrennung, die
  Chromium hier nicht hat.
- **Echte Last.** Es wird die Richtigkeit geprüft, nicht das Verhalten
  bei vielen gleichzeitigen Zugriffen.
