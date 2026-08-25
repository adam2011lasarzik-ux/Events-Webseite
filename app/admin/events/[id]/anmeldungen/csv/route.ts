/* ---------------------------------------------------------------
   Teilnehmerliste als CSV-Datei.

   Eine Route statt einer Server-Aktion, weil hier eine Datei
   herauskommt und keine Seite. Die Zugangsprüfung ist deshalb umso
   wichtiger: Diese Adresse gibt vollständige Personendaten heraus.
   --------------------------------------------------------------- */

import { db } from "@/lib/db";
import { aktuellerAdmin } from "@/lib/adminAuth";
import { anmeldungenZuEvent } from "@/lib/adminDaten";
import { alsLesbar } from "@/lib/zeit";

/**
 * Ein Feld für die CSV-Datei aufbereiten.
 *
 * Zwei Dinge passieren hier, und beide sind wichtiger, als sie
 * aussehen:
 *
 * 1. Anführungszeichen und Semikolons. Ohne Maskierung zerlegt ein
 *    Nachname wie „Meier; Schmidt" die Zeile in zwei Spalten.
 *
 * 2. Der führende Apostroph bei =, +, - und @. Tabellenprogramme
 *    lesen solche Felder als FORMEL. Ein Feld mit
 *    =HYPERLINK(...) kann beim Öffnen der Datei Befehle ausführen.
 *    Das ist eine bekannte Lücke („CSV Injection") — und die Daten
 *    hier stammen aus einem öffentlichen Formular, das jeder ausfüllen
 *    kann.
 */
function feld(wert: string | number | null): string {
  let text = wert === null ? "" : String(wert);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(
  _anfrage: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // Kein redirect() wie bei den Seiten: Hier ist eine klare Absage
  // richtig, damit niemand aus Versehen eine HTML-Seite als Tabelle
  // herunterlädt.
  if (!(await aktuellerAdmin())) {
    return new Response("Nicht angemeldet.", { status: 401 });
  }

  const { id } = await params;
  const event = await db.event.findUnique({ where: { id } });
  if (!event) return new Response("Nicht gefunden.", { status: 404 });

  const anmeldungen = await anmeldungenZuEvent(id);

  const kopf = [
    "Anmeldenummer", "Angemeldet am", "Status", "Zahlung", "Betrag in Euro",
    "Buchungsart", "Kontakt Vorname", "Kontakt Nachname", "E-Mail", "Telefon",
    "Einwilligung Erziehungsberechtigte", "Fotos erlaubt",
    "Teilnehmer Vorname", "Teilnehmer Nachname", "Teilnehmer Art",
  ];

  const zeilen: string[] = [kopf.map(feld).join(";")];

  for (const a of anmeldungen) {
    // Eine Zeile je TEILNEHMER, die Anmeldedaten wiederholt. So lässt
    // sich die Datei direkt als Anwesenheitsliste ausdrucken, ohne
    // vorher aufgeklappte Zeilen von Hand aufzulösen.
    const gemeinsam = [
      a.id,
      alsLesbar(a.angemeldetAm),
      a.status,
      a.zahlungsStatus,
      (a.gesamtpreisCents / 100).toFixed(2).replace(".", ","),
      a.buchungsart,
      a.kontaktVorname,
      a.kontaktNachname,
      a.kontaktEmail,
      a.kontaktTelefon,
      a.einwilligungVormund ? "ja" : "nein",
      a.einwilligungFotos ? "ja" : "nein",
    ];

    if (a.teilnehmer.length === 0) {
      zeilen.push([...gemeinsam, "", "", ""].map(feld).join(";"));
      continue;
    }
    for (const t of a.teilnehmer) {
      zeilen.push(
        [...gemeinsam, t.vorname, t.nachname, t.typ === "SCHUELER" ? "Schüler" : "Erwachsener"]
          .map(feld)
          .join(";"),
      );
    }
  }

  // Das BOM am Anfang sorgt dafür, dass Excel die Umlaute richtig
  // liest. Ohne es steht dort „Schler".
  const inhalt = "﻿" + zeilen.join("\r\n") + "\r\n";
  const datum = new Date().toISOString().slice(0, 10);

  return new Response(inhalt, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="anmeldungen-${event.slug}-${datum}.csv"`,
      // Personendaten gehören in keinen Zwischenspeicher.
      "Cache-Control": "no-store",
    },
  });
}
