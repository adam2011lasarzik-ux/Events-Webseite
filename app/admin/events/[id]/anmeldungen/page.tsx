import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { verlangeAdmin } from "@/lib/adminAuth";
import { anmeldungenZuEvent } from "@/lib/adminDaten";
import { alsEuro } from "@/lib/preise";
import { alsLesbar } from "@/lib/zeit";
import {
  statusSetzen,
  zahlungSetzen,
  anonymisieren,
  stornierenUndErstatten,
} from "@/app/admin/anmeldungen/aktion";
import { AdminRahmen } from "@/components/admin/AdminRahmen";
import { StatusMarker } from "@/components/admin/StatusMarker";
import stil from "../../../admin.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Anmeldungen" };

export default async function AnmeldungenSeite({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ hinweis?: string }>;
}) {
  const admin = await verlangeAdmin();
  const { id } = await params;
  const { hinweis } = await searchParams;

  const event = await db.event.findUnique({ where: { id } });
  if (!event) notFound();

  const anmeldungen = await anmeldungenZuEvent(id);

  // Gezählt wird in PERSONEN. Eine Familie mit sechs Leuten belegt
  // sechs Plätze — würde man Anmeldungen zählen, wäre die Anlage voll,
  // während die Seite noch freie Plätze meldet.
  //
  // Belegt sind ausschliesslich bestätigte, also bezahlte Anmeldungen
  // — dieselbe Regel wie auf der öffentlichen Seite (lib/plaetze.ts).
  //
  // Seit Stufe 2 (26.09.2026) gibt es gar keine unbezahlte Anmeldung
  // mehr: Sie entsteht erst mit der bestätigten Zahlung. Die frühere
  // Unterscheidung zwischen „belegt" und „in offener Zahlung" ist
  // damit entfallen, weil es nichts mehr zu unterscheiden gibt.
  const teilnehmer = anmeldungen
    .filter((a) => a.status === "BESTAETIGT")
    .reduce((s, a) => s + a.teilnehmer.length, 0);
  const belegt = teilnehmer;
  const frei = event.maxPersonen === null ? null : Math.max(0, event.maxPersonen - belegt);
  const verbindlich = anmeldungen.filter(
    (a) => a.status === "BESTAETIGT" || a.status === "WARTELISTE",
  ).length;
  const ueberbucht = event.maxPersonen !== null && belegt > event.maxPersonen;

  return (
    <AdminRahmen
      admin={admin}
      titel={`Anmeldungen — ${event.titel}`}
      unterzeile={
        `${verbindlich} Anmeldung${verbindlich === 1 ? "" : "en"} · ` +
        `${teilnehmer} Teilnehmer` +
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
      <StornoHinweis hinweis={hinweis} />

      {/* Eine bezahlte Anmeldung wird niemals stillschweigend
          abgelehnt. Seit dem 24.09.2026 wird auch kein Platz mehr
          gehalten, während jemand bezahlt — dadurch ist dieser Fall
          nicht mehr selten, sondern die bewusst in Kauf genommene
          Kehrseite der Entscheidung (lib/plaetze.ts). Er muss deshalb
          sichtbar sein und beim Namen genannt werden. */}
      {ueberbucht && (
        <p className={`${stil.meldung} ${stil.meldungFehler}`} role="alert">
          Dieses Event ist überbucht: {belegt} bezahlte Personen bei {event.maxPersonen}{" "}
          Plätzen. Das passiert, wenn mehrere gleichzeitig um die letzten Plätze bezahlen —
          ein Platz wird während der Zahlung nicht gehalten, und bezahlte Plätze werden nie
          abgelehnt. Bitte klären.
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
                          a.status
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
                        AGB angenommen: {a.agbAkzeptiert ? "ja" : "nein"} · Aufnahmehinweis gelesen:{" "}
                        {a.kenntnisAufnahmen ? "ja" : "nein"}
                        <br />
                        Nummer: {a.id}
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

                  {a.status !== "STORNIERT" && (
                    <form action={stornierenUndErstatten} style={{ marginBottom: "1rem" }}>
                      <input type="hidden" name="anmeldungId" value={a.id} />
                      <button type="submit" className={`${stil.knopf} ${stil.knopfKlein}`}>
                        {a.zahlungsStatus === "BEZAHLT" && a.gesamtpreisCents > 0
                          ? `Stornieren und ${alsEuro(a.gesamtpreisCents)} erstatten`
                          : "Stornieren"}
                      </button>
                      <span className={stil.feldHilfe} style={{ marginLeft: "0.75rem" }}>
                        {a.zahlungsStatus === "BEZAHLT" && a.gesamtpreisCents > 0
                          ? "Das Geld geht zurück, der Platz wird frei, und beide bekommen eine E-Mail."
                          : "Für diese Buchung ist nichts bezahlt — es wird nur storniert und benachrichtigt."}
                      </span>
                    </form>
                  )}

                  {/* Darunter die reinen Vermerke. Sie bewegen KEIN Geld
                      und verschicken KEINE Mail — das muss dranstehen,
                      sonst liest sich "Stornieren" hier wie der Knopf
                      darüber und "Erstattet" wie eine Überweisung. */}
                  <p className={stil.feldHilfe} style={{ marginBottom: "0.25rem" }}>
                    Nur den Vermerk ändern (kein Geld, keine E-Mail):
                  </p>
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

/**
 * Rueckmeldung nach einer Stornierung durch den Veranstalter.
 *
 * Kommt ueber die Adresse herein (?hinweis=…), damit die Seite ohne
 * JavaScript auskommt wie der ganze uebrige Adminbereich. Unbekannte
 * Werte werden stillschweigend verworfen — in der Adresszeile steht,
 * was jemand hineinschreibt, und das gehoert nicht ungeprueft auf die
 * Seite.
 */
function StornoHinweis({ hinweis }: { hinweis?: string }) {
  if (!hinweis) return null;

  const meldungen: Record<string, { text: string; fehler: boolean }> = {
    erstattet: {
      text: "Storniert. Der Betrag ist zur Rückerstattung angewiesen, beide E-Mails sind raus.",
      fehler: false,
    },
    storniert: {
      text: "Storniert. Für diese Buchung war nichts bezahlt, es wurde also nichts erstattet.",
      fehler: false,
    },
    "fehler-anbieter": {
      text:
        "Der Zahlungsanbieter hat die Erstattung nicht angenommen. Es wurde NICHTS geändert — " +
        "die Buchung steht unverändert da. Bitte im Stripe-Bereich nachsehen.",
      fehler: true,
    },
    "fehler-bereits-storniert": {
      text: "Diese Buchung war bereits storniert. Es wurde nichts geändert.",
      fehler: true,
    },
    "fehler-unbekannt": {
      text: "Diese Buchung wurde nicht gefunden. Es wurde nichts geändert.",
      fehler: true,
    },
  };

  const m = meldungen[hinweis];
  if (!m) return null;

  return (
    <p
      className={`${stil.meldung} ${m.fehler ? stil.meldungFehler : stil.meldungGut}`}
      role={m.fehler ? "alert" : "status"}
    >
      {m.text}
    </p>
  );
}
