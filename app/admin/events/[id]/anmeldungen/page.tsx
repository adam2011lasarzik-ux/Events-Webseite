import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { verlangeAdmin } from "@/lib/adminAuth";
import { anmeldungenZuEvent } from "@/lib/adminDaten";
import { alsEuro } from "@/lib/preise";
import { alsLesbar } from "@/lib/zeit";
import { statusSetzen, zahlungSetzen, anonymisieren } from "@/app/admin/anmeldungen/aktion";
import { AdminRahmen } from "@/components/admin/AdminRahmen";
import { StatusMarker } from "@/components/admin/StatusMarker";
import stil from "../../../admin.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Anmeldungen" };

export default async function AnmeldungenSeite({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await verlangeAdmin();
  const { id } = await params;

  const event = await db.event.findUnique({ where: { id } });
  if (!event) notFound();

  const anmeldungen = await anmeldungenZuEvent(id);

  // Gezählt wird in PERSONEN. Eine Familie mit sechs Leuten belegt
  // sechs Plätze — würde man Anmeldungen zählen, wäre die Anlage voll,
  // während die Seite noch freie Plätze meldet.
  //
  // Belegt sind bestätigte Anmeldungen UND Reservierungen, deren Frist
  // noch läuft — dieselbe Regel wie auf der öffentlichen Seite. Sonst
  // stünden hier mehr freie Plätze als dort.
  const jetzt = new Date();
  const laeuftNoch = (a: { status: string; reserviertBis: Date | null }) =>
    a.status === "RESERVIERT" && a.reserviertBis !== null && a.reserviertBis > jetzt;

  // Feste Teilnehmer und gehaltene Plätze getrennt: Beides bedeutet
  // etwas anderes. Für die Kapazität zählt die Summe.
  const teilnehmer = anmeldungen
    .filter((a) => a.status === "BESTAETIGT")
    .reduce((s, a) => s + a.teilnehmer.length, 0);
  const reserviert = anmeldungen
    .filter(laeuftNoch)
    .reduce((s, a) => s + a.teilnehmer.length, 0);
  const belegt = teilnehmer + reserviert;
  const frei = event.maxPersonen === null ? null : Math.max(0, event.maxPersonen - belegt);
  const ueberbucht = event.maxPersonen !== null && belegt > event.maxPersonen;

  return (
    <AdminRahmen
      admin={admin}
      titel={`Anmeldungen — ${event.titel}`}
      unterzeile={
        `${anmeldungen.length} Anmeldung${anmeldungen.length === 1 ? "" : "en"} · ` +
        `${teilnehmer} feste Teilnehmer` +
        (reserviert > 0 ? ` · ${reserviert} Plätze reserviert` : "") +
        ` · ${belegt} von ${event.maxPersonen ?? "∞"} Plätzen belegt` +
        (frei === null ? "" : ` · ${frei} frei`)
      }
      aktionen={
        <>
          <Link href={`/admin/events/${id}`} className={`${stil.knopf} ${stil.knopfLeise}`}>
            Event bearbeiten
          </Link>
          <a href={`/admin/events/${id}/anmeldungen/csv`} className={`${stil.knopf} ${stil.knopfLeise}`}>
            Als CSV herunterladen
          </a>
        </>
      }
    >
      {/* Eine bezahlte Anmeldung wird niemals stillschweigend
          abgelehnt — läuft die Reservierung ab, während das Geld
          unterwegs ist, kann das Event dadurch überbucht werden. Der
          Fall ist selten, aber er muss sichtbar sein. */}
      {ueberbucht && (
        <p className={`${stil.meldung} ${stil.meldungFehler}`} role="alert">
          Dieses Event ist überbucht: {belegt} Personen bei {event.maxPersonen} Plätzen. Das
          passiert, wenn eine Zahlung erst nach Ablauf der Reservierung eingeht — bezahlte
          Plätze werden nie abgelehnt. Bitte klären.
        </p>
      )}

      {anmeldungen.length === 0 && (
        <div className={stil.karte}>
          <p>Für diese Veranstaltung gibt es noch keine Anmeldungen.</p>
        </div>
      )}

      {anmeldungen.length > 0 && (
        <div className={stil.karte}>
          <p className={stil.formGruppenTitel}>
            Eine Zeile je Anmeldung — zum Aufklappen antippen
          </p>

          {anmeldungen.map((a) => {
            const schueler = a.teilnehmer.filter((t) => t.typ === "SCHUELER").length;
            const erwachsene = a.teilnehmer.length - schueler;

            return (
              <details key={a.id} className={stil.zeile}>
                <summary className={stil.zeileKopf}>
                  <div>
                    <span className={a.anonymisiertAm ? stil.anonym : stil.zeileName}>
                      {a.kontaktVorname} {a.kontaktNachname}
                    </span>
                    <span className={stil.zeileNeben}>
                      {" · "}
                      {a.teilnehmer.length} Person{a.teilnehmer.length === 1 ? "" : "en"}
                      {" ("}
                      {[
                        schueler > 0 ? `${schueler} Schüler` : null,
                        // „1 Erwachsener", nicht „1 Erwachsene" — bei
                        // einer einzelnen Person fiele der falsche
                        // Plural sofort ins Auge.
                        erwachsene > 0
                          ? `${erwachsene} ${erwachsene === 1 ? "Erwachsener" : "Erwachsene"}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                      {")"}
                    </span>
                  </div>
                  <div className={stil.zeileRechts}>
                    <span className={stil.zeileBetrag}>{alsEuro(a.gesamtpreisCents)}</span>
                    <span>
                      <StatusMarker
                        art="anmeldung"
                        wert={
                          a.status === "RESERVIERT" && !laeuftNoch(a)
                            ? "RESERVIERT_ABGELAUFEN"
                            : a.status
                        }
                      />{" "}
                      <StatusMarker art="zahlung" wert={a.zahlungsStatus} />
                    </span>
                  </div>
                </summary>

                <div className={stil.zeileInhalt}>
                  <div className={stil.raster} style={{ marginBottom: "1rem" }}>
                    <div>
                      <p className={stil.feldLabel}>Teilnehmer</p>
                      <ul className={stil.teilnehmerListe}>
                        {a.teilnehmer.map((t) => (
                          <li key={t.id}>
                            {t.vorname} {t.nachname}
                            <span className={stil.zeileNeben}>
                              {" · "}
                              {t.typ === "SCHUELER" ? "Schüler" : "Erwachsener"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className={stil.feldLabel}>Kontakt</p>
                      <p className={stil.zeileNeben} style={{ margin: 0 }}>
                        {a.anonymisiertAm ? (
                          <em>Personendaten wurden am {alsLesbar(a.anonymisiertAm)} gelöscht.</em>
                        ) : (
                          <>
                            {a.kontaktEmail}
                            <br />
                            {a.kontaktTelefon || "keine Telefonnummer"}
                          </>
                        )}
                        <br />
                        Angemeldet am {alsLesbar(a.angemeldetAm)}
                        <br />
                        Buchungsart: {a.buchungsart === "FAMILIE" ? "Familienpaket" : "Einzeln"}
                        <br />
                        Einwilligung Erziehungsberechtigte:{" "}
                        {a.einwilligungVormund ? "ja" : a.istVormundBuchung ? "FEHLT" : "nicht nötig"}
                        <br />
                        Fotos erlaubt: {a.einwilligungFotos ? "ja" : "nein"}
                        <br />
                        Nummer: {a.id}
                        {a.status === "RESERVIERT" && a.reserviertBis && (
                          <>
                            <br />
                            {a.reserviertBis > new Date()
                              ? `Platz reserviert bis ${alsLesbar(a.reserviertBis)}`
                              : `Reservierung abgelaufen am ${alsLesbar(a.reserviertBis)} — der Platz ist wieder frei`}
                          </>
                        )}
                        {a.zahlungsReferenz && (
                          <>
                            <br />
                            Zahlungsreferenz: {a.zahlungsReferenz}
                          </>
                        )}
                        {/* Der Anbieter hat einen anderen Betrag
                            gemeldet, als bei der Anmeldung galt. Das
                            gehört angesehen, nicht überlesen. */}
                        {a.bezahlterBetragCents !== null &&
                          a.zahlungsStatus !== "BEZAHLT" && (
                            <>
                              <br />
                              <strong>
                                Achtung: gemeldeter Betrag {alsEuro(a.bezahlterBetragCents)},
                                erwartet {alsEuro(a.gesamtpreisCents)}. Bitte prüfen.
                              </strong>
                            </>
                          )}
                      </p>
                    </div>
                  </div>

                  <div className={stil.knopfReihe}>
                    <StatusKnoepfe id={a.id} aktuell={a.status} />
                  </div>
                  <div className={stil.knopfReihe} style={{ marginTop: "0.5rem" }}>
                    <ZahlungsKnoepfe id={a.id} aktuell={a.zahlungsStatus} />
                  </div>

                  {!a.anonymisiertAm && (
                    <form action={anonymisieren} style={{ marginTop: "1rem" }}>
                      <input type="hidden" name="anmeldungId" value={a.id} />
                      <button
                        type="submit"
                        className={`${stil.knopf} ${stil.knopfGefahr} ${stil.knopfKlein}`}
                      >
                        Personendaten löschen
                      </button>
                      <span className={stil.feldHilfe} style={{ marginLeft: "0.75rem" }}>
                        Namen, E-Mail und Telefon werden überschrieben. Betrag und Datum
                        bleiben für die Buchhaltung erhalten. Das lässt sich nicht rückgängig
                        machen.
                      </span>
                    </form>
                  )}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </AdminRahmen>
  );
}

/**
 * Je ein kleines Formular pro Knopf statt eines Auswahlfeldes mit
 * Absenden-Knopf: So funktioniert es auch ohne JavaScript, und man
 * sieht auf einen Blick, welche Zustände es überhaupt gibt.
 */
function StatusKnoepfe({ id, aktuell }: { id: string; aktuell: string }) {
  const moeglich: [string, string][] = [
    ["BESTAETIGT", "Bestätigen"],
    ["WARTELISTE", "Auf Warteliste"],
    ["STORNIERT", "Stornieren"],
  ];
  return (
    <>
      <span className={stil.feldLabel}>Anmeldung:</span>
      {moeglich.map(([wert, beschriftung]) => (
        <form action={statusSetzen} key={wert}>
          <input type="hidden" name="anmeldungId" value={id} />
          <input type="hidden" name="status" value={wert} />
          <button
            type="submit"
            className={`${stil.knopf} ${stil.knopfLeise} ${stil.knopfKlein}`}
            disabled={aktuell === wert}
          >
            {beschriftung}
          </button>
        </form>
      ))}
    </>
  );
}

function ZahlungsKnoepfe({ id, aktuell }: { id: string; aktuell: string }) {
  const moeglich: [string, string][] = [
    ["BEZAHLT", "Als bezahlt markieren"],
    ["OFFEN", "Auf offen zurücksetzen"],
    ["ERSTATTET", "Erstattet"],
  ];
  return (
    <>
      <span className={stil.feldLabel}>Zahlung:</span>
      {moeglich.map(([wert, beschriftung]) => (
        <form action={zahlungSetzen} key={wert}>
          <input type="hidden" name="anmeldungId" value={id} />
          <input type="hidden" name="zahlungsStatus" value={wert} />
          <button
            type="submit"
            className={`${stil.knopf} ${stil.knopfLeise} ${stil.knopfKlein}`}
            disabled={aktuell === wert}
          >
            {beschriftung}
          </button>
        </form>
      ))}
    </>
  );
}
