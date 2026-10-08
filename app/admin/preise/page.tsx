import { verlangeAdmin } from "@/lib/adminAuth";
import { preisUebersicht } from "@/lib/adminDaten";
import { alsEuro } from "@/lib/preise";
import { AdminRahmen } from "@/components/admin/AdminRahmen";
import stil from "../admin.module.css";

export const dynamic = "force-dynamic";

/** Datum und Uhrzeit lesbar in deutscher Zeit. */
function alsZeitpunkt(wert: Date | null): string {
  if (!wert) return "—";
  return wert.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Preis-Übersicht: aktueller Preis je Ticketart und Event, mit dem
 * Zeitpunkt der letzten Änderung. Geändert werden die Preise im
 * jeweiligen Event-Formular — hier gibt es nur den Überblick und den
 * direkten Weg dorthin. Bereits bezahlte Buchungen bleiben von einer
 * Preisänderung unberührt (eingefrorener Preis je Anmeldung).
 */
export default async function PreiseSeite() {
  const admin = await verlangeAdmin();
  const zeilen = await preisUebersicht();

  return (
    <AdminRahmen admin={admin} titel="Preise">
      <p>
        Der aktuelle Preis je Ticketart. Geändert wird er im Formular der
        jeweiligen Veranstaltung; eine Änderung gilt nur für neue
        Buchungen, bereits bezahlte bleiben unverändert.
      </p>

      {zeilen.length === 0 ? (
        <p>Noch keine Veranstaltungen mit Preisen.</p>
      ) : (
        <table className={stil.tabelle}>
          <thead>
            <tr>
              <th>Veranstaltung</th>
              <th>Ticketart</th>
              <th>Aktueller Preis</th>
              <th>Zuletzt geändert</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {zeilen.map((z) => (
              <tr key={`${z.eventId}:${z.ticketart}`}>
                <td>{z.eventTitel}</td>
                <td>{z.bezeichnung}</td>
                <td>{alsEuro(z.aktuellCents)}</td>
                <td>{alsZeitpunkt(z.geaendertAm)}</td>
                <td>
                  <a href={`/admin/events/${z.eventId}`}>Bearbeiten</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AdminRahmen>
  );
}
