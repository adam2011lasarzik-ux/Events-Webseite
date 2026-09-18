import { verlangeAdmin } from "@/lib/adminAuth";
import {
  anmeldungenZurAuswahl,
  letztesProtokoll,
  loeschVorschau,
  offeneSperrenListe,
  papierFaellig,
  VORSCHAU_TAGE,
} from "@/lib/loeschVorschau";
import { AKTION_JE_KLASSE, type Loeschklasse } from "@/lib/loeschfristen";
import { AdminRahmen } from "@/components/admin/AdminRahmen";
import { AnmeldungAuswahl } from "@/components/admin/AnmeldungAuswahl";
import { KennungKopieren } from "@/components/admin/KennungKopieren";
import stil from "../admin.module.css";
import {
  loeschlaufAusfuehren,
  probelaufStarten,
  sperreAufheben,
  sperreSetzen,
} from "./aktion";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Löschlauf",
  // Kennungen von Datensätzen gehören in keine Suchmaschine.
  robots: { index: false, follow: false },
};

/** Deutsche Namen der Löschklassen — nur zur Anzeige. */
const KLASSENNAME: Record<Loeschklasse, string> = {
  GESUNDHEITSANGABEN: "K1 Gesundheitsangaben",
  EINVERSTAENDNIS_VOLL: "K2 Einverständniserklärungen",
  ZUSTIMMUNGSNACHWEIS: "K3 Zustimmungsnachweis",
  ANMELDEDATEN: "K4 Anmeldedaten",
  CHECKLISTE: "K5 Checkliste",
  VORFALLAKTE: "K6 Vorfallakte",
  STEUERUNTERLAGEN: "K7 Steuerunterlagen",
};

/** Die Zielarten in Klartext — „Registration" sagt einem Menschen nichts. */
const ZIELART_NAME: Record<string, string> = {
  Registration: "Anmeldung",
  Vorfall: "Vorfall",
  Checkliste: "Checkliste",
  Zustimmungsnachweis: "Zustimmungsnachweis",
};

const SPERRGRUND_NAME: Record<string, string> = {
  UNFALL: "Unfall",
  BESCHWERDE: "Beschwerde",
  RUECKBUCHUNG: "Rückbuchung",
  VERSICHERUNG: "Versicherungsfall",
  RECHTSSTREIT: "Rechtsstreit",
};

const HINWEISE: Record<string, { text: string; gut: boolean }> = {
  "sperre-gesetzt": { text: "Löschsperre gesetzt.", gut: true },
  "sperre-aufgehoben": { text: "Löschsperre aufgehoben.", gut: true },
  "sperre-vorhanden": {
    text: "Für diesen Datensatz gibt es bereits eine offene Sperre mit diesem Grund. Nichts geändert.",
    gut: false,
  },
  "sperre-schon-auf": { text: "Diese Sperre war bereits aufgehoben.", gut: false },
  "sperre-unvollstaendig": {
    text: "Art, Kennung und Grund werden alle drei gebraucht. Nichts geändert.",
    gut: false,
  },
  probelauf: { text: "Probelauf abgeschlossen — es wurde nichts verändert.", gut: true },
  ausgefuehrt: { text: "Löschlauf ausgeführt.", gut: true },
  "nicht-bestaetigt": {
    text: "Der Löschlauf wurde nicht bestätigt. Nichts geändert.",
    gut: false,
  },
};

function datum(d: Date): string {
  return d.toLocaleDateString("de-DE", { timeZone: "Europe/Berlin" });
}

function zeitpunkt(d: Date): string {
  return d.toLocaleString("de-DE", { timeZone: "Europe/Berlin" });
}

/**
 * Vorschau, Sperren und Protokoll des Löschkonzepts.
 *
 * Hier stehen bewusst nur Kennungen und Klassen — keine Namen,
 * keine E-Mail-Adressen. Wer wissen will, um wen es geht, schlägt
 * die Kennung in der Anmeldung nach.
 */
export default async function LoeschenSeite({
  searchParams,
}: {
  searchParams: Promise<{ hinweis?: string; lauf?: string }>;
}) {
  const admin = await verlangeAdmin();
  const { hinweis, lauf } = await searchParams;

  const [vorschau, sperren, papier, protokoll, auswahl] = await Promise.all([
    loeschVorschau(),
    offeneSperrenListe(),
    papierFaellig(),
    letztesProtokoll(50),
    anmeldungenZurAuswahl(),
  ]);

  const ueberfaellig = vorschau.filter((z) => z.ueberfaellig && z.gesperrtWegen.length === 0);
  const liegenGeblieben = vorschau.filter((z) => z.gesperrtWegen.length > 0);
  const demnaechst = vorschau.filter((z) => !z.ueberfaellig && z.gesperrtWegen.length === 0);

  const meldung = hinweis ? HINWEISE[hinweis] : undefined;

  return (
    <AdminRahmen
      admin={admin}
      titel="Löschlauf"
      unterzeile="Was steht zur Löschung an, was ist gesperrt, was ist zuletzt passiert"
    >
      {meldung && (
        <p
          className={`${stil.meldung} ${meldung.gut ? stil.meldungGut : stil.meldungFehler}`}
          role="status"
        >
          {meldung.text}
          {lauf && ` Lauf-Kennung: ${lauf}`}
        </p>
      )}

      <div className={stil.karte}>
        <div className={stil.zahlen}>
          <div>
            <span className={stil.zahl}>{ueberfaellig.length}</span>
            jetzt fällig
          </div>
          <div>
            <span className={stil.zahl}>{demnaechst.length}</span>
            in den nächsten {VORSCHAU_TAGE} Tagen
          </div>
          <div>
            <span className={stil.zahl}>{liegenGeblieben.length}</span>
            durch Sperre gehalten
          </div>
          <div>
            <span className={stil.zahl}>{papier.length}</span>
            auf Papier zu vernichten
          </div>
        </div>
      </div>

      {/* ── Läufe ───────────────────────────────────────────────── */}
      <div className={stil.karte}>
        <h2 className={stil.karteTitel}>Lauf starten</h2>
        <p>
          Der Löschlauf läuft ohnehin automatisch jede Nacht. Diese Knöpfe sind für den
          Fall, dass du sofort nachsehen oder sofort löschen möchtest.
        </p>
        <div className={stil.knopfReihe}>
          <form action={probelaufStarten}>
            <button type="submit" className={stil.knopf}>
              Probelauf — verändert nichts
            </button>
          </form>
          <form action={loeschlaufAusfuehren}>
            <label className={stil.haken}>
              <input type="checkbox" name="bestaetigt" value="ja" />
              <span>
                Ja, wirklich löschen und anonymisieren. Das lässt sich nicht rückgängig
                machen.
              </span>
            </label>
            <button type="submit" className={`${stil.knopf} ${stil.knopfGefahr}`}>
              Löschlauf jetzt ausführen
            </button>
          </form>
        </div>
      </div>

      {/* ── Fällig ──────────────────────────────────────────────── */}
      <div className={stil.karte}>
        <h2 className={stil.karteTitel}>Jetzt fällig ({ueberfaellig.length})</h2>
        {ueberfaellig.length === 0 ? (
          <p>Nichts überfällig.</p>
        ) : (
          <Tabelle zeilen={ueberfaellig} />
        )}
      </div>

      {/* ── Demnächst ───────────────────────────────────────────── */}
      <div className={stil.karte}>
        <h2 className={stil.karteTitel}>
          Demnächst fällig — nächste {VORSCHAU_TAGE} Tage ({demnaechst.length})
        </h2>
        {demnaechst.length === 0 ? (
          <p>In diesem Zeitraum wird nichts fällig.</p>
        ) : (
          <Tabelle zeilen={demnaechst} />
        )}
      </div>

      {/* ── Gehalten ────────────────────────────────────────────── */}
      {liegenGeblieben.length > 0 && (
        <div className={stil.karte}>
          <h2 className={stil.karteTitel}>
            Fällig, aber gesperrt ({liegenGeblieben.length})
          </h2>
          <p>
            Diese Datensätze wären fällig und bleiben nur wegen einer Sperre erhalten. Prüfe
            von Zeit zu Zeit, ob der Sperrgrund noch besteht.
          </p>
          <Tabelle zeilen={liegenGeblieben} />
        </div>
      )}

      {/* ── Papier ──────────────────────────────────────────────── */}
      {papier.length > 0 && (
        <div className={stil.karte}>
          <h2 className={stil.karteTitel}>Auf Papier — von Hand zu vernichten</h2>
          <p>
            Diese Unterlagen liegen nicht in der Datenbank. Die Webseite kann sie nicht
            löschen, nur daran erinnern.
          </p>
          <div className={stil.tabelleUmschlag}>
            <table className={stil.tabelle}>
              <thead>
                <tr>
                  <th>Klasse</th>
                  <th>Veranstaltung</th>
                  <th>fällig seit</th>
                </tr>
              </thead>
              <tbody>
                {papier.map((p, i) => (
                  <tr key={`${p.klasse}-${i}`}>
                    <td>{KLASSENNAME[p.klasse]}</td>
                    <td>{p.eventTitel}</td>
                    <td>{datum(p.faelligAm)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Sperren ─────────────────────────────────────────────── */}
      <div className={stil.karte}>
        <h2 className={stil.karteTitel}>Offene Löschsperren ({sperren.length})</h2>
        {sperren.length === 0 ? (
          <p>Keine offene Sperre.</p>
        ) : (
          <>
            <p className={stil.feldHilfe}>
              <b>Automatisch</b> gesetzte Sperren leitet das System bei jedem Lauf neu ab
              (Erstattung, offener Vorfall) — sie verschwinden von selbst, wenn der Grund
              entfällt. <b>Von Hand</b> gesetzte bleiben, bis du sie aufhebst.
            </p>
            <div className={stil.tabelleUmschlag}>
              <table className={stil.tabelle}>
                <thead>
                  <tr>
                    <th>Betroffener Datensatz</th>
                    <th>Veranstaltung</th>
                    <th>Grund</th>
                    <th>Gesetzt</th>
                    <th>Notiz</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {sperren.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div className={stil.sperrZeile}>
                          <span className={stil.sperrName}>
                            {s.bezeichnung}
                            {s.anonymisiert && (
                              <>
                                {" "}
                                <span className={`${stil.marker} ${stil.markerAus}`}>
                                  anonymisiert
                                </span>
                              </>
                            )}
                            {!s.vorhanden && (
                              <>
                                {" "}
                                <span className={`${stil.marker} ${stil.markerOffen}`}>
                                  nicht mehr vorhanden
                                </span>
                              </>
                            )}
                          </span>
                          {s.email && <span className={stil.sperrNeben}>{s.email}</span>}
                          <span className={stil.sperrNeben}>
                            {ZIELART_NAME[s.zielArt] ?? s.zielArt}
                          </span>
                          <KennungKopieren kennung={s.zielId} />
                        </div>
                      </td>
                      <td>
                        {s.eventTitel ?? "—"}
                        {s.veranstaltungAm && (
                          <>
                            <br />
                            <span className={stil.sperrNeben}>
                              {datum(s.veranstaltungAm)}
                            </span>
                          </>
                        )}
                      </td>
                      <td>
                        <span className={`${stil.marker} ${stil.markerWartet}`}>
                          {SPERRGRUND_NAME[s.grund] ?? s.grund}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`${stil.marker} ${
                            s.automatisch ? stil.markerAuto : stil.markerHand
                          }`}
                        >
                          {s.automatisch ? "automatisch" : "von Hand"}
                        </span>
                        <br />
                        <span className={stil.sperrNeben}>
                          {zeitpunkt(s.gesetztAm)}
                          {!s.automatisch && <> · {s.gesetztVon}</>}
                        </span>
                      </td>
                      <td>{s.notiz ?? "—"}</td>
                      <td>
                        <form action={sperreAufheben}>
                          <input type="hidden" name="sperreId" value={s.id} />
                          <button
                            type="submit"
                            className={`${stil.knopf} ${stil.knopfLeise} ${stil.knopfKlein}`}
                          >
                            Aufheben
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── Sperre setzen ───────────────────────────────────────── */}
      <div className={stil.karte}>
        <h2 className={stil.karteTitel}>Löschsperre von Hand setzen</h2>
        <p>
          Rückbuchungen und offene Vorfälle sperrt das System selbst. Beschwerde,
          Versicherungsfall und Rechtsstreit erfährt es nicht von allein — die trägst du
          hier ein.
        </p>
        <form action={sperreSetzen}>
          {/* Die Art ist fest: Über dieses Formular werden Anmeldungen
              gesperrt. Vorfälle, Checklisten und Zustimmungsnachweise
              sperrt man dort, wo man sie sieht — ein Formular, das
              alles kann, kann nichts davon gut. */}
          <input type="hidden" name="zielArt" value="Registration" />

          {auswahl.length === 0 ? (
            <p>Es gibt noch keine Anmeldung, die sich sperren ließe.</p>
          ) : (
            <AnmeldungAuswahl anmeldungen={auswahl} name="zielId" />
          )}

          <div className={stil.raster}>
            <label className={stil.feld}>
              <span className={stil.feldLabel}>Grund</span>
              <select name="grund" className={stil.auswahl} defaultValue="BESCHWERDE">
                <option value="BESCHWERDE">Beschwerde</option>
                <option value="VERSICHERUNG">Versicherungsfall</option>
                <option value="RECHTSSTREIT">Rechtsstreit</option>
                <option value="UNFALL">Unfall</option>
                <option value="RUECKBUCHUNG">Rückbuchung</option>
              </select>
            </label>
          </div>
          <label className={stil.feld}>
            <span className={stil.feldLabel}>Notiz (optional)</span>
            <textarea name="notiz" className={stil.textfeld} maxLength={500} />
            <span className={stil.feldHilfe}>
              Kurz, sachlich und ohne Gesundheitsangaben — diese Notiz wird nicht
              automatisch gelöscht.
            </span>
          </label>
          <div className={stil.knopfReihe}>
            <button type="submit" className={stil.knopf} disabled={auswahl.length === 0}>
              Sperre setzen
            </button>
          </div>
        </form>
      </div>

      {/* ── Protokoll ───────────────────────────────────────────── */}
      <div className={stil.karte}>
        <h2 className={stil.karteTitel}>Löschprotokoll — die letzten 50 Einträge</h2>
        {protokoll.length === 0 ? (
          <p>Noch kein Lauf protokolliert.</p>
        ) : (
          <div className={stil.tabelleUmschlag}>
            <table className={stil.tabelle}>
              <thead>
                <tr>
                  <th>Zeitpunkt</th>
                  <th>Klasse</th>
                  <th>Datensatz</th>
                  <th>Aktion</th>
                  <th>Grund</th>
                </tr>
              </thead>
              <tbody>
                {protokoll.map((p) => (
                  <tr key={p.id}>
                    <td>{zeitpunkt(p.zeitpunkt)}</td>
                    <td>{KLASSENNAME[p.klasse] ?? p.klasse}</td>
                    <td>
                      {p.zielArt}
                      <br />
                      <code>{p.zielId}</code>
                    </td>
                    <td>
                      <span
                        className={`${stil.marker} ${
                          p.probelauf ? stil.markerAus : stil.markerGut
                        }`}
                      >
                        {p.aktion}
                        {p.probelauf ? " (Probe)" : ""}
                      </span>
                    </td>
                    <td>{p.grund ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminRahmen>
  );
}

/**
 * Die Vorschautabelle — zweimal benutzt (jetzt fällig / demnächst fällig),
 * deshalb einmal geschrieben.
 *
 * Zeigt Name, E-Mail, Veranstaltung und Datum in Klartext, dieselbe
 * Bauweise wie die Tabelle der offenen Löschsperren weiter unten. Die
 * Kennung bleibt sichtbar — klein, mit Kopierfunktion — weil man sie
 * braucht, um den Datensatz anderswo wiederzufinden.
 */
function Tabelle({
  zeilen,
}: {
  zeilen: Awaited<ReturnType<typeof loeschVorschau>>;
}) {
  return (
    <div className={stil.tabelleUmschlag}>
      <table className={stil.tabelle}>
        <thead>
          <tr>
            <th>fällig am</th>
            <th>Betroffener Datensatz</th>
            <th>Veranstaltung</th>
            <th>Klasse</th>
            <th>vorgesehen</th>
            <th>Sperre</th>
          </tr>
        </thead>
        <tbody>
          {zeilen.map((z) => (
            <tr key={`${z.zielArt}-${z.zielId}`}>
              <td>{datum(z.faelligAm)}</td>
              <td>
                <div className={stil.sperrZeile}>
                  <span className={stil.sperrName}>{z.bezeichnung}</span>
                  {z.email && <span className={stil.sperrNeben}>{z.email}</span>}
                  <span className={stil.sperrNeben}>{ZIELART_NAME[z.zielArt] ?? z.zielArt}</span>
                  <KennungKopieren kennung={z.zielId} />
                </div>
              </td>
              <td>
                {z.eventTitel ?? "—"}
                {z.veranstaltungAm && (
                  <>
                    <br />
                    <span className={stil.sperrNeben}>{datum(z.veranstaltungAm)}</span>
                  </>
                )}
              </td>
              <td>{KLASSENNAME[z.klasse] ?? z.klasse}</td>
              <td>{AKTION_JE_KLASSE[z.klasse]}</td>
              <td>
                {z.gesperrtWegen.length === 0 ? (
                  "—"
                ) : (
                  <span className={`${stil.marker} ${stil.markerWartet}`}>
                    {z.gesperrtWegen.map((g) => SPERRGRUND_NAME[g] ?? g).join(", ")}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
