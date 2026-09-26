import Link from "next/link";
import { verlangeAdmin } from "@/lib/adminAuth";
import { eventUeberblick, offeneFehlbuchungen, erledigteFehlbuchungen } from "@/lib/adminDaten";
import { alsEuro } from "@/lib/preise";
import { AdminRahmen } from "@/components/admin/AdminRahmen";
import { StatusMarker } from "@/components/admin/StatusMarker";
import { fehlbuchungErledigen } from "./fehlbuchungen/aktion";
import stil from "./admin.module.css";

export const dynamic = "force-dynamic";

/** Datum lesbar, ohne fertes Datum als „steht noch nicht fest". */
function alsDatum(wert: Date | null): string {
  if (!wert) return "Termin offen";
  return wert.toLocaleDateString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

/**
 * Der Grund einer Fehlbuchung in einem Satz, den man ohne Handbuch
 * versteht — und mit dem Hinweis, ob schon etwas geschehen ist.
 */
function grundKlartext(grund: string): string {
  switch (grund) {
    case "keine-plaetze":
      return "Platz war vergeben";
    case "doppelte-adresse":
      return "Adresse hatte schon eine Buchung";
    case "kein-termin":
      return "Termin war entfernt";
    case "betrag-abweichend":
      return "Betrag passt nicht";
    case "ohne-marke":
      return "Anmeldedaten kamen nicht an";
    default:
      return grund;
  }
}

/**
 * Wird dieser Grund von selbst zurückgebucht?
 *
 * Steht eine solche Zeile trotzdem in der Warnung, ist die Erstattung
 * steckengeblieben — dann holt der stündliche Abgleichlauf sie nach,
 * und der Satz daneben soll das sagen statt zum Handeln aufzufordern.
 * Bei `betrag-abweichend` ist es umgekehrt: Dort wartet die Zeile
 * wirklich auf einen Menschen.
 */
const ERSTATTET_VON_SELBST = ["keine-plaetze", "doppelte-adresse", "kein-termin", "ohne-marke"];

export default async function AdminUebersicht() {
  const admin = await verlangeAdmin();
  const events = await eventUeberblick();
  const fehlbuchungen = await offeneFehlbuchungen();
  const rueckschau = await erledigteFehlbuchungen();

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
      {/* Geld ist eingegangen, eine Anmeldung ist nicht entstanden.

          Diese Meldung steht GANZ OBEN und vor den Veranstaltungen,
          weil sie das Einzige auf dieser Seite ist, das eine Handlung
          verlangt. Alles andere ist Anzeige. Sie nennt Betrag, Grund
          und Sitzungskennung, damit der Vorgang im Dashboard des
          Anbieters sofort auffindbar ist — ohne diese Kennung müsste
          jemand zwischen Zeitstempeln suchen. */}
      {fehlbuchungen.length > 0 && (
        <div className={`${stil.meldung} ${stil.meldungFehler}`} role="alert">
          <strong>
            {fehlbuchungen.length} eingegangene Zahlung
            {fehlbuchungen.length === 1 ? "" : "en"} ohne Anmeldung — bitte klären
          </strong>
          <ul style={{ margin: "0.75rem 0 0", paddingLeft: "1.2rem" }}>
            {fehlbuchungen.map((f) => (
              <li key={f.id} style={{ marginBottom: "0.9rem" }}>
                {alsEuro(f.betragCents)} · {grundKlartext(f.grund)} ·{" "}
                {f.angelegtAm.toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}
                <br />
                {ERSTATTET_VON_SELBST.includes(f.grund) ? (
                  <span>
                    Wird automatisch vollständig erstattet. Steht diese Zeile über
                    Stunden hier, ist die Erstattung steckengeblieben — dann bitte im
                    Dashboard des Zahlungsanbieters nachsehen.
                  </span>
                ) : (
                  <span>
                    <strong>Nicht automatisch erstattet.</strong> Bitte im Dashboard des
                    Zahlungsanbieters ansehen und dort entscheiden.
                  </span>
                )}
                <br />
                <code style={{ fontSize: "0.85em" }}>{f.sitzungId}</code>

                {/* Abhaken löscht nichts. Die Zeile bleibt vollständig
                    stehen und rutscht nur in die Rückschau weiter
                    unten. Der Vermerk ist freiwillig, aber er ist das
                    Einzige, was in einem halben Jahr noch erklärt,
                    warum hier jemand auf „erledigt" gedrückt hat. */}
                <form action={fehlbuchungErledigen} style={{ marginTop: "0.5rem" }}>
                  <input type="hidden" name="sitzungId" value={f.sitzungId} />
                  <label
                    className={stil.feldLabel}
                    htmlFor={`notiz-${f.id}`}
                    style={{ display: "block", marginBottom: "0.25rem" }}
                  >
                    Vermerk (freiwillig)
                  </label>
                  <input
                    id={`notiz-${f.id}`}
                    name="notiz"
                    type="text"
                    className={stil.eingabe}
                    maxLength={300}
                    placeholder="z. B. im Dashboard von Hand erstattet am ..."
                  />
                  <button type="submit" className={`${stil.knopf} ${stil.knopfKlein}`}
                    style={{ marginTop: "0.4rem" }}>
                    Als erledigt markieren
                  </button>
                </form>
              </li>
            ))}
          </ul>
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.9em" }}>
            „Als erledigt markieren" löscht nichts. Der Vorgang bleibt mit Betrag, Grund
            und Kennung gespeichert und steht danach unten in der Rückschau.
          </p>
        </div>
      )}

      {/* Die Rückschau: was geschehen IST.

          Die Warnung oben sagt, was zu tun ist. Ohne diese Liste wäre
          eine automatisch zurückgebuchte Zahlung nur im Journal des
          Servers nachzulesen — also praktisch gar nicht. Sie ist der
          Nachweis, dass jede Erstattung wirklich stattgefunden hat,
          und trägt die Kennung, mit der sie sich beim Anbieter
          wiederfinden lässt. */}
      {rueckschau.length > 0 && (
        <div className={stil.karte}>
          <div className={stil.karteKopf}>
            <h2 className={stil.karteTitel}>Zahlungen ohne Anmeldung — letzte 30 Tage</h2>
          </div>
          <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
            {rueckschau.map((f) => (
              <li key={f.id} style={{ marginBottom: "0.6rem" }}>
                {alsEuro(f.betragCents)} · {grundKlartext(f.grund)} · eingegangen{" "}
                {f.angelegtAm.toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}
                <br />
                {f.erstattetAm ? (
                  <span>
                    Vollständig erstattet am{" "}
                    {f.erstattetAm.toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}
                    {f.erstattungId ? (
                      <>
                        {" · "}
                        <code style={{ fontSize: "0.85em" }}>{f.erstattungId}</code>
                      </>
                    ) : null}
                  </span>
                ) : (
                  <span>
                    Von Hand als erledigt markiert am{" "}
                    {f.erledigtAm?.toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}
                    {f.erledigtNotiz ? ` — ${f.erledigtNotiz}` : ""}
                  </span>
                )}
                <br />
                <code style={{ fontSize: "0.85em" }}>{f.sitzungId}</code>
              </li>
            ))}
          </ul>
        </div>
      )}

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
        /* Freie Plätze rechnen sich gegen die bezahlten Teilnehmer.
           Seit Stufe 2 (26.09.2026) gibt es keine andere Art von
           Anmeldung mehr — sie entsteht erst mit der Zahlung.

           Dafür ist eine Überbuchung möglich: Wird gleichzeitig um den
           letzten Platz bezahlt, gelten beide Zahlungen. `ueberbucht`
           macht genau das sichtbar — ohne diese Anzeige wäre die
           Kehrseite der Entscheidung unsichtbar, und `Math.max(0, …)`
           würde sie sogar verstecken. */
        const frei =
          e.maxPersonen === null
            ? null
            : Math.max(0, e.maxPersonen - e.belegtePersonen);
        const ueberbucht =
          e.maxPersonen === null ? 0 : Math.max(0, e.belegtePersonen - e.maxPersonen);
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
              <div>
                <span className={stil.zahl}>{frei === null ? "∞" : frei}</span>
                freie Plätze
              </div>
              {ueberbucht > 0 && (
                <div>
                  <span className={stil.zahl}>{ueberbucht}</span>
                  Plätze überbucht — bitte klären
                </div>
              )}
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
