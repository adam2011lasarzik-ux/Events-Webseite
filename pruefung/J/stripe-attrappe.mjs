/* Eine Attrappe des Zahlungsanbieters.

   Warum: api.stripe.com ist aus dieser Arbeitsumgebung netzwerkseitig
   gesperrt. Ohne Ersatz liesse sich der eigene Ablauf gar nicht
   prüfen — und genau der ist der Teil, für den wir verantwortlich
   sind.

   Die Attrappe beantwortet exakt die zwei Aufrufe, die lib/zahlung.ts
   macht. Sie ersetzt NICHT den echten Durchlauf durch Stripes
   Bezahlseite; der bleibt offen, bis es ein Hosting gibt. */
import http from "node:http";

const sitzungen = new Map();
let zaehler = 0;

export function starte(port = 4242) {
  const server = http.createServer((anfrage, antwort) => {
    let koerper = "";
    anfrage.on("data", (stueck) => (koerper += stueck));
    anfrage.on("end", () => {
      const url = new URL(anfrage.url, "http://attrappe");
      const senden = (code, wert) => {
        antwort.writeHead(code, { "content-type": "application/json" });
        antwort.end(JSON.stringify(wert));
      };

      // Sitzung erzeugen
      if (anfrage.method === "POST" && url.pathname === "/v1/checkout/sessions") {
        const felder = new URLSearchParams(koerper);
        zaehler += 1;
        const id = `cs_test_attrappe_${zaehler}`;
        const sitzung = {
          id,
          object: "checkout.session",
          url: `http://127.0.0.1:${port}/bezahlseite/${id}`,
          payment_status: "unpaid",
          // „open" = noch bezahlbar, „complete" = bezahlt,
          // „expired" = geschlossen. Wie beim echten Anbieter.
          status: "open",
          amount_total: Number(felder.get("line_items[0][price_data][unit_amount]")),
          currency: "eur",
          client_reference_id: felder.get("client_reference_id"),
          metadata: { anmeldungId: felder.get("metadata[anmeldungId]") },
          /* Stripe nummeriert Listen durch: payment_method_types[0],
             [1], … — nicht „[]". Das war beim ersten Anlauf falsch
             gelesen und sah aus wie ein Fehler im Anwendungscode. */
          payment_method_types: [...felder.keys()]
            .filter((k) => /^payment_method_types\[\d+\]$/.test(k))
            .sort()
            .map((k) => felder.get(k)),
          customer_email: felder.get("customer_email"),
          locale: felder.get("locale"),
          success_url: felder.get("success_url"),
          cancel_url: felder.get("cancel_url"),
        };
        sitzungen.set(id, sitzung);
        return senden(200, sitzung);
      }

      // Sitzung schliessen (expire)
      const schliessen = anfrage.method === "POST" &&
        url.pathname.match(/^\/v1\/checkout\/sessions\/([^/]+)\/expire$/);
      if (schliessen) {
        const sitzung = sitzungen.get(schliessen[1]);
        if (!sitzung) {
          return senden(404, { error: { message: "Keine solche Sitzung.", type: "invalid_request_error" } });
        }
        if (sitzung.status !== "open") {
          return senden(400, { error: { message: "Sitzung ist nicht offen.", type: "invalid_request_error" } });
        }
        sitzung.status = "expired";
        sitzung.url = null;
        return senden(200, sitzung);
      }

      // Sitzung abfragen
      const treffer = url.pathname.match(/^\/v1\/checkout\/sessions\/([^/]+)$/);
      if (anfrage.method === "GET" && treffer) {
        const sitzung = sitzungen.get(treffer[1]);
        if (!sitzung) {
          return senden(404, { error: { message: "Keine solche Sitzung.", type: "invalid_request_error" } });
        }
        return senden(200, sitzung);
      }

      /* Eine schlichte Ersatz-Bezahlseite, damit sich der Weg im
         Browser durchklicken lässt. Sie sieht der echten Seite von
         Stripe NICHT ähnlich und soll das auch nicht — sie steht nur
         für „der Besucher ist beim Anbieter und entscheidet sich". */
      const seite = url.pathname.match(/^\/bezahlseite\/([^/]+)$/);
      if (anfrage.method === "GET" && seite) {
        const sitzung = sitzungen.get(seite[1]);
        if (!sitzung) { antwort.writeHead(404); return antwort.end("unbekannt"); }
        antwort.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        return antwort.end(
          `<!doctype html><meta charset="utf-8"><title>Ersatz-Bezahlseite</title>` +
          `<body style="font-family:sans-serif;padding:2rem">` +
          `<h1>Ersatz-Bezahlseite (Attrappe)</h1>` +
          `<p>Betrag: ${(sitzung.amount_total / 100).toFixed(2)} €</p>` +
          `<p><a id="bezahlen" href="/steuerung/klick-bezahlt/${sitzung.id}">Bezahlen</a></p>` +
          `<p><a id="abbrechen" href="${sitzung.cancel_url}">Abbrechen</a></p></body>`,
        );
      }
      const klick = url.pathname.match(/^\/steuerung\/klick-bezahlt\/([^/]+)$/);
      if (anfrage.method === "GET" && klick) {
        const sitzung = sitzungen.get(klick[1]);
        if (!sitzung) { antwort.writeHead(404); return antwort.end("unbekannt"); }
        // Eine geschlossene Seite lässt sich nicht mehr bezahlen —
        // genau das ist der Schutz vor der doppelten Abbuchung.
        if (sitzung.status !== "open") { antwort.writeHead(410); return antwort.end("geschlossen"); }
        sitzung.payment_status = "paid";
        sitzung.status = "complete";
        antwort.writeHead(302, { location: sitzung.success_url });
        return antwort.end();
      }

      /* Steuerung für das Prüfskript — die Attrappe läuft als eigener
         Prozess, deshalb braucht es einen Weg von aussen. */
      const bezahlt = url.pathname.match(/^\/steuerung\/bezahlt\/([^/]+)$/);
      if (anfrage.method === "POST" && bezahlt) {
        const sitzung = sitzungen.get(bezahlt[1]);
        if (!sitzung) return senden(404, { fehler: "unbekannt" });
        sitzung.payment_status = "paid";
        sitzung.status = "complete";
        const betrag = url.searchParams.get("betrag");
        if (betrag !== null) sitzung.amount_total = Number(betrag);
        return senden(200, sitzung);
      }
      if (anfrage.method === "GET" && url.pathname === "/steuerung/sitzungen") {
        return senden(200, [...sitzungen.values()]);
      }

      senden(404, { error: { message: `Unbekannt: ${anfrage.method} ${url.pathname}`, type: "invalid_request_error" } });
    });
  });
  server.listen(port, "127.0.0.1");
  return {
    server,
    sitzungen,
    /** Eine Sitzung als bezahlt markieren — wie nach echtem Bezahlen. */
    alsBezahlt(id, betragCents) {
      const s = sitzungen.get(id);
      if (!s) throw new Error(`Sitzung ${id} unbekannt`);
      s.payment_status = "paid";
      if (betragCents !== undefined) s.amount_total = betragCents;
      return s;
    },
    stoppe: () => new Promise((fertig) => server.close(fertig)),
  };
}

// Direkt gestartet: als eigenständiger Server laufen lassen.
if (process.argv[1]?.endsWith("stripe-attrappe.mjs")) {
  const port = Number(process.argv[2] ?? 4242);
  starte(port);
  console.log(`Attrappe lauscht auf ${port}`);
}
