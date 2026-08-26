import Link from "next/link";
import { verlangeAdmin } from "@/lib/adminAuth";
import { eventUeberblick } from "@/lib/adminDaten";
import { alsEuro } from "@/lib/preise";
import { AdminRahmen } from "@/components/admin/AdminRahmen";
import { StatusMarker } from "@/components/admin/StatusMarker";
import stil from "./admin.module.css";

export const dynamic = "force-dynamic";

/** Datum lesbar, ohne fertes Datum als „steht noch nicht fest". */
function alsDatum(wert: Date | null): string {
  if (!wert) return "Termin offen";
  return wert.toLocaleDateString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

export default async function AdminUebersicht() {
  const admin = await verlangeAdmin();
  const events = await eventUeberblick();

  return (
    <AdminRahmen
      admin={admin}
      titel="Übersicht"
      unterzeile={
        events.length === 0
          ? "Es gibt noch keine Veranstaltung."
          : `${events.length} Veranstaltung${events.length === 1 ? "" : "en"}`
      }
      aktionen={
        <Link href="/admin/events/neu" className={stil.knopf}>
          Neues Event
        </Link>
      }
    >
      {events.length === 0 && (
        <div className={stil.karte}>
          <p>
            Lege die erste Veranstaltung an. Sie erscheint erst auf der Webseite, wenn du
            sie auf „Veröffentlicht" stellst — bis dahin bleibt sie ein Entwurf, den nur
            du siehst.
          </p>
        </div>
      )}

      {events.map((e) => {
        /* Freie Plätze rechnen sich gegen feste Teilnehmer UND
           laufende Reservierungen — sonst würde ein gerade laufender
           Bezahlvorgang doppelt verkauft. */
        const frei =
          e.maxPersonen === null
            ? null
            : Math.max(0, e.maxPersonen - e.belegtePersonen - e.reserviertePersonen);
        return (
          <div key={e.id} className={stil.karte}>
            <div className={stil.karteKopf}>
              <h2 className={stil.karteTitel}>{e.titel}</h2>
              <StatusMarker art="event" wert={e.status} />
              <span className={stil.zeileNeben}>
                {alsDatum(e.startAt)} · {e.stadt} · /{e.slug}
              </span>
            </div>

            <div className={stil.zahlen}>
              <div>
                <span className={stil.zahl}>{e.belegtePersonen}</span>
                feste Teilnehmer
              </div>
              {/* Getrennt ausgewiesen: Eine Reservierung hält einen
                  Platz, ist aber noch keine bestätigte Teilnahme. */}
              {e.reserviertePersonen > 0 && (
                <div>
                  <span className={stil.zahl}>{e.reserviertePersonen}</span>
                  Plätze reserviert
                </div>
              )}
              <div>
                <span className={stil.zahl}>{frei === null ? "∞" : frei}</span>
                freie Plätze
              </div>
              <div>
                <span className={stil.zahl}>{e.anzahlAnmeldungen}</span>
                Anmeldungen
              </div>
              {e.wartelistePersonen > 0 && (
                <div>
                  <span className={stil.zahl}>{e.wartelistePersonen}</span>
                  auf der Warteliste
                </div>
              )}
              <div>
                <span className={stil.zahl}>{alsEuro(e.offenCents)}</span>
                offen
              </div>
              <div>
                <span className={stil.zahl}>{alsEuro(e.bezahltCents)}</span>
                bezahlt
              </div>
            </div>

            <div className={stil.knopfReihe} style={{ marginTop: "1rem" }}>
              <Link href={`/admin/events/${e.id}`} className={`${stil.knopf} ${stil.knopfLeise}`}>
                Bearbeiten
              </Link>
              <Link
                href={`/admin/events/${e.id}/vorschau`}
                className={`${stil.knopf} ${stil.knopfLeise}`}
              >
                Vorschau
              </Link>
              <Link
                href={`/admin/events/${e.id}/anmeldungen`}
                className={`${stil.knopf} ${stil.knopfLeise}`}
              >
                Anmeldungen ansehen
              </Link>
              {e.status === "VEROEFFENTLICHT" && (
                <Link href={`/events/${e.slug}`} className={`${stil.knopf} ${stil.knopfLeise}`}>
                  Auf der Webseite ansehen
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </AdminRahmen>
  );
}
