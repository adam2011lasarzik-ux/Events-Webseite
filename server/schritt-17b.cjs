/* ---------------------------------------------------------------
   Schritt 17b — Aufraeumen auf einer BEZAHLTEN Bezahlseite.

   Der letzte offene Punkt des Umbaus. Fuer `open` und `expired` ist
   am 26.09.2026 gegen die echte Schnittstelle belegt, dass sich die
   verschluesselten `marke_*`-Felder entfernen lassen. Der Zustand
   `complete` laesst sich ueber die Schnittstelle allein nicht
   herstellen - dafuer braucht es eine vollstaendige Testzahlung.

   ── Was hier geprueft wird ──────────────────────────────────────

     1 ZUSTAND   Ist die Sitzung wirklich complete / paid?
     2 ZAHLUNG   Hat der PaymentIntent Anmeldedaten uebernommen?
     3 BUCHUNG   Hat die Charge Anmeldedaten uebernommen?
     4 LEEREN    Lassen sich die marke_*-Felder JETZT noch entfernen?

   Die Punkte 2 und 3 sind die stille Gefahr: Stripe kopiert
   metadata NICHT automatisch von der Session auf PaymentIntent oder
   Charge - aber verlassen wollen wir uns darauf nicht. Traegt eines
   der beiden die verschluesselten Daten, waere das Entfernen an der
   Session wertlos, weil die Daten anderswo weiterlebten.

   Punkt 4 entscheidet ueber Fassung B des Datenschutztextes. Nur
   wenn dort `GEHT` steht, darf sie aktiviert werden.

   ── Aufruf ──────────────────────────────────────────────────────

       cd /var/www/vera
       sudo -u vera node --env-file=.env ./schritt-17b.cjs cs_test_...

   Die Sitzungskennung steht in der Adresszeile der Abschluss-Seite
   (…?sitzung=cs_…) und im Dashboard des Anbieters. Sie gehoert zu
   der Buchung, die in Abschnitt 5 bezahlt wurde - VOR dem Storno
   ausfuehren, danach gibt es keine bezahlte Sitzung mehr.

   Der Riegel: Ohne Testschluessel bricht das Skript ab. Den
   Schluessel selbst gibt es niemals aus.
   --------------------------------------------------------------- */

const Stripe = require("stripe");

const schluessel = (process.env.ZAHLUNG_GEHEIMSCHLUESSEL || "").trim();
if (!/^(sk|rk)_test_/.test(schluessel)) {
  console.log("KEIN TESTSCHLUESSEL — abgebrochen");
  process.exit(1);
}

const id = process.argv[2];
if (!id || !/^cs_/.test(id)) {
  console.error("Aufruf: node --env-file=.env ./schritt-17b.cjs <sitzungskennung cs_...>");
  process.exit(1);
}

const s = new Stripe(schluessel);
const marken = (m) => Object.keys(m || {}).filter((x) => /^marke_/.test(x));

(async () => {
  const a = await s.checkout.sessions.retrieve(id);

  const zustandOk = a.status === "complete" && a.payment_status === "paid";
  console.log("1 ZUSTAND    :", a.status, "/", a.payment_status, zustandOk ? "— OK" : "— NICHT OK");

  const piId = typeof a.payment_intent === "string" ? a.payment_intent : a.payment_intent?.id;
  if (!piId) {
    console.log("2 ZAHLUNG    : keine Zahlung an der Sitzung — NICHT OK");
    return;
  }

  const p = await s.paymentIntents.retrieve(piId);
  const pm = marken(p.metadata);
  console.log(
    "2 ZAHLUNG    :", JSON.stringify(p.metadata || {}),
    pm.length ? "— NICHT OK, traegt Anmeldedaten" : "— OK, keine Anmeldedaten",
  );

  const chId = typeof p.latest_charge === "string" ? p.latest_charge : p.latest_charge?.id;
  if (!chId) {
    console.log("3 BUCHUNG    : keine Charge vorhanden");
  } else {
    const c = await s.charges.retrieve(chId);
    const cm = marken(c.metadata);
    console.log(
      "3 BUCHUNG    :", JSON.stringify(c.metadata || {}),
      cm.length ? "— NICHT OK, traegt Anmeldedaten" : "— OK, keine Anmeldedaten",
    );
  }

  const felder = marken(a.metadata);
  if (!felder.length) {
    console.log("4 LEEREN     : schon fort — nichts zu tun");
    console.log("             (der stuendliche Abgleich war schneller; das ist kein Fehler,");
    console.log("              belegt aber nicht, dass es im Zustand complete geht)");
    return;
  }

  const leer = {};
  for (const f of felder) leer[f] = "";
  try {
    const b = await s.checkout.sessions.update(id, { metadata: leer });
    const rest = marken(b.metadata);
    console.log(
      "4 LEEREN     :", rest.length ? "NICHT OK, Rest: " + rest.join(", ") : "GEHT",
      "—", JSON.stringify(b.metadata),
    );
  } catch (e) {
    console.log("4 LEEREN     : GEHT NICHT —", e.message);
  }
})().catch((e) => console.error("FEHLER:", e.message));
