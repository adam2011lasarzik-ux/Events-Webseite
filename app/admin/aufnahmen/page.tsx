import Link from "next/link";
import { verlangeAdmin } from "@/lib/adminAuth";
import {
  WEGNAME,
  WIDERSPRUCHSWEGE,
  freigabe,
  geltendeWidersprueche,
  letzteJeZiel,
  pruefungen,
  staetteVollstaendig,
  staetteZeile,
  widersprueche,
  type Widerspruchsweg,
} from "@/lib/aufnahmen";
import { db } from "@/lib/db";
import { AdminRahmen } from "@/components/admin/AdminRahmen";
import stil from "../admin.module.css";
import { pruefungErfassen, widerspruchErfassen, widerspruchUmstellen } from "./aktion";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Aufnahmen",
  robots: { index: false, follow: false },
};

const HINWEISE: Record<string, { text: string; gut: boolean }> = {
  erfasst: {
    text: "Widerspruch festgehalten. Er gilt ab sofort und muss vor jeder Veröffentlichung berücksichtigt werden.",
    gut: true,
  },
  zurueckgenommen: {
    text: "Widerspruch als zurückgenommen vermerkt. Die Zeile bleibt als Beleg stehen.",
    gut: true,
  },
  "wieder-gueltig": { text: "Widerspruch gilt wieder.", gut: true },
  freigegeben: {
    text: "Prüfung festgehalten: niemand erkennbar, der widersprochen hat. Die Veröffentlichung ist damit belegt geprüft.",
    gut: true,
  },
  gesperrt: {
    text: "Prüfung festgehalten: jemand ist erkennbar. So darf nicht veröffentlicht werden — zuerst bearbeiten oder weglassen.",
    gut: false,
  },
  "name-fehlt": { text: "Ohne Namen lässt sich ein Widerspruch später niemandem zuordnen.", gut: false },
  "ziel-fehlt": { text: "Ohne Ziel („Website“, „Weitergabe an die Halle“ …) ist der Prüfvermerk wertlos.", gut: false },
  "ergebnis-fehlt": { text: "Bitte das Ergebnis der Sichtung angeben. Es gibt hier bewusst keinen Standardwert.", gut: false },
  "event-fehlt": { text: "Diese Veranstaltung gibt es nicht.", gut: false },
};

const GRUND_TEXT: Record<"ungeprueft" | "erkennbar" | "veraltet", string> = {
  ungeprueft: "noch nicht geprüft",
  erkennbar: "jemand ist erkennbar",
  veraltet: "Prüfung überholt — danach kam ein Widerspruch dazu",
};

function zeitpunkt(d: Date): string {
  return d.toLocaleString("de-DE", { timeZone: "Europe/Berlin" });
}

/**
 * Widersprüche gegen Aufnahmen und die Prüfung vor der
 * Veröffentlichung (B-10, B-13).
 *
 * Der Zugang wird hier geprüft, nicht im Layout — wie überall im
 * Adminbereich.
 */
export default async function AufnahmenSeite({
  searchParams,
}: {
  searchParams: Promise<{ event?: string; hinweis?: string }>;
}) {
  const admin = await verlangeAdmin();
  const { event: gewaehlt, hinweis } = await searchParams;

  const events = await db.event.findMany({
    orderBy: { startAt: "desc" },
    select: {
      id: true,
      titel: true,
      startAt: true,
      ortFirma: true,
      ortName: true,
      strasse: true,
      plz: true,
      stadt: true,
      ortRegister: true,
    },
  });

  const event = events.find((e) => e.id === gewaehlt) ?? events[0] ?? null;
  const meldung = hinweis ? HINWEISE[hinweis] : undefined;

  const [alle, geltende, vermerke] = event
    ? await Promise.all([
        widersprueche(event.id),
        geltendeWidersprueche(event.id),
        pruefungen(event.id),
      ])
    : [[], [], []];

  const jeZiel = letzteJeZiel(vermerke);

  return (
    <AdminRahmen
      admin={admin}
      titel="Aufnahmen"
      unterzeile="Widerspruch gegen Foto- und Videoaufnahmen · Prüfung vor jeder Veröffentlichung"
    >
      {meldung && (
        <p
          className={`${stil.meldung} ${meldung.gut ? stil.meldungGut : stil.meldungFehler}`}
          role="status"
        >
          {meldung.text}
        </p>
      )}

      <div className={stil.karte}>
        <p>
          Aufnahmen stützen sich auf das <b>berechtigte Interesse</b> (Art. 6 Abs. 1
          Buchst. f DS-GVO), nicht auf eine Einwilligung. Wer nicht abgebildet werden
          möchte, <b>widerspricht</b> (Art. 21 DS-GVO). Dieser Widerspruch ist damit die
          einzige Sicherung des Konzepts — er wird hier festgehalten und ist vor{" "}
          <b>jeder</b> Veröffentlichung zu berücksichtigen.
        </p>
        <p>
          Ein Widerspruch wird nie gelöscht. Wird er zurückgenommen, bleibt die Zeile als
          Beleg stehen. Auch der Löschlauf rührt diese Einträge nicht an, solange Aufnahmen
          veröffentlicht sind (Löschklasse <b>K8</b>).
        </p>
      </div>

      {events.length === 0 ? (
        <div className={stil.karte}>
          <p>Es gibt noch keine Veranstaltung. Lege zuerst eine an.</p>
        </div>
      ) : (
        <>
          <div className={stil.karte}>
            <h2 className={stil.karteTitel}>Veranstaltung</h2>
            <form method="get">
              <div className={stil.raster}>
                <label className={stil.feld}>
                  <span className={stil.feldLabel}>Welche Veranstaltung?</span>
                  <select name="event" className={stil.auswahl} defaultValue={event?.id}>
                    {events.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.titel}
                        {e.startAt
                          ? ` — ${e.startAt.toLocaleDateString("de-DE", { timeZone: "Europe/Berlin" })}`
                          : " — Termin folgt"}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className={stil.knopfReihe}>
                <button type="submit" className={`${stil.knopf} ${stil.knopfLeise}`}>
                  Anzeigen
                </button>
              </div>
            </form>
          </div>

          {event && (
            <>
              <Empfaenger event={event} />
              <Freigabe geltende={geltende} jeZiel={jeZiel} />
              <WiderspruchsListe eintraege={alle} />
              <ErfassenFormular eventId={event.id} />
              <PruefFormular eventId={event.id} geltendeAnzahl={geltende.length} />
              <VermerkListe vermerke={vermerke} />
            </>
          )}
        </>
      )}

      <div className={stil.karte}>
        <h2 className={stil.karteTitel}>Instagram (B-12)</h2>
        <p>
          <b>Geklärt am 21.09.2026:</b> VERA hat derzeit keinen eigenen Instagram-Kanal.
          Deshalb wird Instagram hier nicht als Veröffentlichungsziel angeboten — auf der
          Hinweisseite <Link href="/aufnahmen">/aufnahmen</Link> steht das entsprechend, und
          das Feld „Ziel" schlägt Instagram nicht mehr vor.
        </p>
        <p>
          Richtet VERA später ein offizielles Konto ein, wird das hier nachgezogen: Text auf
          der Hinweisseite ergänzen, Kontoname und Link eintragen, dann erst als Ziel
          verwenden.
        </p>
        <p>
          Der Instagram-Kanal der Veranstaltungsstätte ist davon unberührt und weiterhin
          ungeklärt — siehe Dokument 16, Frage 5, und die Übersicht{" "}
          <Link href="/admin">Übersicht</Link>.
        </p>
      </div>
    </AdminRahmen>
  );
}

/**
 * Wer die Aufnahmen bekommt — die Empfängerangabe nach
 * Art. 13 Abs. 1 Buchst. e DS-GVO (Bauauftrag B-11).
 *
 * Sie steht am Event und nicht in einem Text, weil jede Veranstaltung
 * an einem anderen Ort stattfinden kann. Fehlt sie oder ist sie
 * unvollständig, sagt diese Karte das deutlich: Eine halbe
 * Empfängerangabe sieht auf der öffentlichen Seite aus wie eine
 * ganze.
 */
function Empfaenger({
  event,
}: {
  event: {
    ortFirma: string | null;
    ortName: string | null;
    strasse: string | null;
    plz: string | null;
    stadt: string;
    ortRegister: string | null;
  };
}) {
  const ort = {
    firma: event.ortFirma,
    name: event.ortName,
    strasse: event.strasse,
    plz: event.plz,
    stadt: event.stadt,
    register: event.ortRegister,
  };
  const vollstaendig = staetteVollstaendig(ort);

  return (
    <div className={stil.karte}>
      <h2 className={stil.karteTitel}>Wer die Aufnahmen bekommt</h2>
      <p>
        Die Veranstaltungsstätte darf die Übersichtsaufnahmen für ihre eigene Werbung
        nutzen und ist damit <b>Empfängerin</b>. Genau so steht sie auf der Seite{" "}
        <Link href="/aufnahmen">Hinweise zu Aufnahmen</Link>:
      </p>
      <p>
        <b>{staetteZeile(ort)}</b>
      </p>
      {vollstaendig ? (
        <p className={`${stil.marker} ${stil.markerGut}`}>
          vollständig — Firmierung, Anschrift und Ort sind hinterlegt
        </p>
      ) : (
        <p className={`${stil.marker} ${stil.markerOffen}`}>
          unvollständig — Firmierung und Anschrift gehören ins Event-Formular unter „Zeit
          und Ort“
        </p>
      )}
    </div>
  );
}

/** Die Ampel: Darf zu diesem Ziel veröffentlicht werden? */
function Freigabe({
  geltende,
  jeZiel,
}: {
  geltende: { id: string; name: string; erklaertAm: Date }[];
  jeZiel: { ziel: string; erkennbar: boolean; geprueftAm: Date }[];
}) {
  const ohneVermerk = freigabe(geltende, null);

  return (
    <div className={stil.karte}>
      <h2 className={stil.karteTitel}>Darf veröffentlicht werden?</h2>
      <p>
        Geltende Widersprüche: <b>{geltende.length}</b>
        {geltende.length > 0 && <> — {geltende.map((w) => w.name).join(", ")}</>}
      </p>

      {geltende.length === 0 ? (
        <p className={`${stil.marker} ${stil.markerGut}`}>
          Kein Widerspruch — eine Veröffentlichung ist nicht durch einen Widerspruch
          gesperrt.
        </p>
      ) : jeZiel.length === 0 ? (
        <p className={`${stil.marker} ${stil.markerOffen}`}>
          Gesperrt — {GRUND_TEXT[(ohneVermerk as { grund: "ungeprueft" }).grund]}. Halte
          unten für jedes Ziel eine Prüfung fest.
        </p>
      ) : (
        <div className={stil.tabelleUmschlag}>
          <table className={stil.tabelle}>
            <thead>
              <tr>
                <th>Ziel</th>
                <th>zuletzt geprüft</th>
                <th>Stand</th>
              </tr>
            </thead>
            <tbody>
              {jeZiel.map((z) => {
                const stand = freigabe(geltende, z);
                return (
                  <tr key={z.ziel}>
                    <td>
                      <b>{z.ziel}</b>
                    </td>
                    <td>{zeitpunkt(z.geprueftAm)}</td>
                    <td>
                      {stand.erlaubt ? (
                        <span className={`${stil.marker} ${stil.markerGut}`}>
                          geprüft, freigegeben
                        </span>
                      ) : (
                        <span className={`${stil.marker} ${stil.markerOffen}`}>
                          gesperrt — {GRUND_TEXT[stand.grund]}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {geltende.length > 0 && (
        <p>
          Ein Ziel, das hier <b>nicht</b> aufgeführt ist, wurde nie geprüft und ist damit
          gesperrt. Es gibt keine stillschweigende Freigabe.
        </p>
      )}
    </div>
  );
}

function WiderspruchsListe({
  eintraege,
}: {
  eintraege: {
    id: string;
    name: string;
    weg: string;
    notiz: string | null;
    erklaertAm: Date;
    erfasstVon: string;
    zurueckgenommenAm: Date | null;
    registrationId: string | null;
  }[];
}) {
  return (
    <div className={stil.karte}>
      <h2 className={stil.karteTitel}>Widersprüche ({eintraege.length})</h2>
      {eintraege.length === 0 ? (
        <p>Für diese Veranstaltung wurde noch kein Widerspruch erklärt.</p>
      ) : (
        <div className={stil.tabelleUmschlag}>
          <table className={stil.tabelle}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Weg</th>
                <th>erklärt</th>
                <th>Stand</th>
              </tr>
            </thead>
            <tbody>
              {eintraege.map((w) => {
                const gilt = w.zurueckgenommenAm === null;
                return (
                  <tr key={w.id}>
                    <td>
                      <b>{w.name}</b>
                      <br />
                      <code>{w.id}</code>
                      {w.registrationId && (
                        <>
                          <br />
                          Anmeldung: <code>{w.registrationId}</code>
                        </>
                      )}
                      {w.notiz && (
                        <details>
                          <summary>Notiz</summary>
                          <p>{w.notiz}</p>
                        </details>
                      )}
                    </td>
                    <td>{WEGNAME[w.weg as Widerspruchsweg] ?? w.weg}</td>
                    <td>{zeitpunkt(w.erklaertAm)}</td>
                    <td>
                      {gilt ? (
                        <span className={`${stil.marker} ${stil.markerOffen}`}>gilt</span>
                      ) : (
                        <span className={`${stil.marker} ${stil.markerAus}`}>
                          zurückgenommen {zeitpunkt(w.zurueckgenommenAm as Date)}
                        </span>
                      )}
                      <form action={widerspruchUmstellen}>
                        <input type="hidden" name="widerspruchId" value={w.id} />
                        <input type="hidden" name="zurueck" value={gilt ? "ja" : "nein"} />
                        <button
                          type="submit"
                          className={`${stil.knopf} ${stil.knopfLeise} ${stil.knopfKlein}`}
                        >
                          {gilt ? "Zurücknahme vermerken" : "Wieder gültig setzen"}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ErfassenFormular({ eventId }: { eventId: string }) {
  return (
    <div className={stil.karte}>
      <h2 className={stil.karteTitel}>Widerspruch festhalten</h2>
      <form action={widerspruchErfassen}>
        <input type="hidden" name="eventId" value={eventId} />
        <div className={stil.raster}>
          <label className={stil.feld}>
            <span className={stil.feldLabel}>Name</span>
            <input name="name" className={stil.eingabe} required maxLength={180} />
            <span className={stil.feldHilfe}>
              So, wie die Person sich genannt hat. Ohne Namen lässt sich später nicht
              sagen, um wen es geht.
            </span>
          </label>
          <label className={stil.feld}>
            <span className={stil.feldLabel}>Auf welchem Weg?</span>
            <select name="weg" className={stil.auswahl} defaultValue="VOR_ORT">
              {WIDERSPRUCHSWEGE.map((w) => (
                <option key={w} value={w}>
                  {WEGNAME[w]}
                </option>
              ))}
            </select>
          </label>
          <label className={stil.feld}>
            <span className={stil.feldLabel}>Anmeldungs-Kennung (optional)</span>
            <input name="registrationId" className={stil.eingabe} />
            <span className={stil.feldHilfe}>
              Nur falls bekannt. Auch eine Begleitperson ohne Buchung kann widersprechen.
            </span>
          </label>
        </div>
        <label className={stil.feld}>
          <span className={stil.feldLabel}>Notiz (optional)</span>
          <textarea name="notiz" className={stil.textfeld} maxLength={2000} />
          <span className={stil.feldHilfe}>
            Etwa „nur die Tochter, nicht der Vater“. Keine Gesundheitsangaben.
          </span>
        </label>
        <div className={stil.knopfReihe}>
          <button type="submit" className={stil.knopf}>
            Widerspruch festhalten
          </button>
        </div>
      </form>
    </div>
  );
}

function PruefFormular({
  eventId,
  geltendeAnzahl,
}: {
  eventId: string;
  geltendeAnzahl: number;
}) {
  return (
    <div className={stil.karte}>
      <h2 className={stil.karteTitel}>Veröffentlichung prüfen</h2>
      <p>
        Vor jeder Veröffentlichung: Material durchsehen und festhalten, ob jemand erkennbar
        ist, der widersprochen hat. Der Vermerk hält fest, was <b>zu diesem Zeitpunkt</b>{" "}
        bekannt war — aktuell {geltendeAnzahl} geltende{" "}
        {geltendeAnzahl === 1 ? "Widerspruch" : "Widersprüche"}.
      </p>
      <form action={pruefungErfassen}>
        <input type="hidden" name="eventId" value={eventId} />
        <div className={stil.raster}>
          <label className={stil.feld}>
            <span className={stil.feldLabel}>Ziel</span>
            <input
              name="ziel"
              className={stil.eingabe}
              required
              maxLength={180}
              placeholder="Website"
            />
            <span className={stil.feldHilfe}>
              Wohin veröffentlicht wird: „Website“, „Weitergabe an die Halle“. VERA hat
              derzeit keinen eigenen Instagram-Kanal (B-12) — Instagram taucht deshalb hier
              noch nicht als Beispiel auf.
            </span>
          </label>
          <label className={stil.feld}>
            <span className={stil.feldLabel}>Ist jemand erkennbar, der widersprochen hat?</span>
            {/* Kein Standardwert: Wer nicht hingesehen hat, soll hier
                nichts eintragen können. */}
            <select name="erkennbar" className={stil.auswahl} defaultValue="" required>
              <option value="" disabled>
                — bitte wählen —
              </option>
              <option value="nein">Nein — niemand erkennbar, freigegeben</option>
              <option value="ja">Ja — erkennbar, deshalb nicht veröffentlicht</option>
            </select>
          </label>
        </div>
        <label className={stil.feld}>
          <span className={stil.feldLabel}>Notiz (optional)</span>
          <textarea name="notiz" className={stil.textfeld} maxLength={2000} />
        </label>
        <div className={stil.knopfReihe}>
          <button type="submit" className={stil.knopf}>
            Prüfung festhalten
          </button>
        </div>
      </form>
    </div>
  );
}

function VermerkListe({
  vermerke,
}: {
  vermerke: {
    id: string;
    ziel: string;
    widersprueche: number;
    namen: string | null;
    erkennbar: boolean;
    notiz: string | null;
    geprueftAm: Date;
    geprueftVon: string;
  }[];
}) {
  return (
    <div className={stil.karte}>
      <h2 className={stil.karteTitel}>Prüfvermerke ({vermerke.length})</h2>
      {vermerke.length === 0 ? (
        <p>Noch keine Prüfung festgehalten.</p>
      ) : (
        <div className={stil.tabelleUmschlag}>
          <table className={stil.tabelle}>
            <thead>
              <tr>
                <th>Ziel</th>
                <th>geprüft</th>
                <th>damals bekannt</th>
                <th>Ergebnis</th>
              </tr>
            </thead>
            <tbody>
              {vermerke.map((v) => (
                <tr key={v.id}>
                  <td>
                    <b>{v.ziel}</b>
                    {v.notiz && (
                      <details>
                        <summary>Notiz</summary>
                        <p>{v.notiz}</p>
                      </details>
                    )}
                  </td>
                  <td>{zeitpunkt(v.geprueftAm)}</td>
                  <td>
                    {v.widersprueche}
                    {v.namen && (
                      <>
                        <br />
                        {v.namen}
                      </>
                    )}
                  </td>
                  <td>
                    {v.erkennbar ? (
                      <span className={`${stil.marker} ${stil.markerOffen}`}>
                        erkennbar — nicht veröffentlicht
                      </span>
                    ) : (
                      <span className={`${stil.marker} ${stil.markerGut}`}>
                        niemand erkennbar
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
