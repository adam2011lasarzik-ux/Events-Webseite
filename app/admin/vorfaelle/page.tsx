import { verlangeAdmin } from "@/lib/adminAuth";
import { db } from "@/lib/db";
import { VORFALL_LEICHT_JAHRE, VORFALL_SCHWER_JAHRE } from "@/lib/loeschfristen";
import { AdminRahmen } from "@/components/admin/AdminRahmen";
import stil from "../admin.module.css";
import { einstufungSetzen, statusUmstellen, vorfallAnlegen } from "./aktion";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Vorfälle",
  robots: { index: false, follow: false },
};

const HINWEISE: Record<string, { text: string; gut: boolean }> = {
  angelegt: {
    text: "Vorfall eröffnet. Solange er offen ist, wird die zugehörige Anmeldung nicht gelöscht.",
    gut: true,
  },
  eingestuft: { text: "Einstufung geändert, Aufbewahrungsfrist neu berechnet.", gut: true },
  status: { text: "Status geändert.", gut: true },
  "titel-fehlt": { text: "Ohne Titel wird kein Vorfall angelegt.", gut: false },
};

function zeitpunkt(d: Date): string {
  return d.toLocaleString("de-DE", { timeZone: "Europe/Berlin" });
}

function datum(d: Date): string {
  return d.toLocaleDateString("de-DE", { timeZone: "Europe/Berlin" });
}

/**
 * Vorfall-, Beschwerde- und Versicherungsakten.
 *
 * Der Zugang wird hier geprüft, nicht im Layout — wie überall im
 * Adminbereich.
 */
export default async function VorfaelleSeite({
  searchParams,
}: {
  searchParams: Promise<{ hinweis?: string }>;
}) {
  const admin = await verlangeAdmin();
  const { hinweis } = await searchParams;

  const [vorfaelle, events] = await Promise.all([
    db.vorfall.findMany({ orderBy: [{ status: "asc" }, { eroeffnetAm: "desc" }] }),
    db.event.findMany({ orderBy: { startAt: "desc" }, select: { id: true, titel: true } }),
  ]);

  const offen = vorfaelle.filter((v) => v.status === "OFFEN");
  const abgeschlossen = vorfaelle.filter((v) => v.status === "ABGESCHLOSSEN");

  const meldung = hinweis ? HINWEISE[hinweis] : undefined;

  return (
    <AdminRahmen
      admin={admin}
      titel="Vorfälle"
      unterzeile="Unfall, Beschwerde, Versicherungsfall — und wie lange die Akte bleibt"
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
          Ein <b>offener</b> Vorfall wird nie gelöscht, und er hält auch die zugehörige
          Anmeldung fest. Erst mit dem Abschluss beginnt die Aufbewahrungsfrist:{" "}
          <b>{VORFALL_LEICHT_JAHRE} Jahre</b> im Regelfall, bei Personen- oder
          Gesundheitsschaden <b>bis zu {VORFALL_SCHWER_JAHRE} Jahre</b>. Die Einstufung
          änderst du unten von Hand — ob ein Schaden ein Personenschaden ist, kann keine
          Software entscheiden.
        </p>
      </div>

      <Liste
        titel={`Offen (${offen.length})`}
        leer="Kein offener Vorfall."
        vorfaelle={offen}
      />
      <Liste
        titel={`Abgeschlossen (${abgeschlossen.length})`}
        leer="Kein abgeschlossener Vorfall."
        vorfaelle={abgeschlossen}
      />

      <div className={stil.karte}>
        <h2 className={stil.karteTitel}>Vorfall eröffnen</h2>
        <form action={vorfallAnlegen}>
          <div className={stil.raster}>
            <label className={stil.feld}>
              <span className={stil.feldLabel}>Titel</span>
              <input name="titel" className={stil.eingabe} required maxLength={180} />
              <span className={stil.feldHilfe}>
                Sachlich, ohne Gesundheitsangaben im Titel.
              </span>
            </label>
            <label className={stil.feld}>
              <span className={stil.feldLabel}>Einstufung</span>
              <select name="einstufung" className={stil.auswahl} defaultValue="LEICHT">
                <option value="LEICHT">
                  Leicht — {VORFALL_LEICHT_JAHRE} Jahre nach Abschluss
                </option>
                <option value="SCHWER">
                  Schwer (Personen-/Gesundheitsschaden) — bis {VORFALL_SCHWER_JAHRE} Jahre
                </option>
              </select>
            </label>
            <label className={stil.feld}>
              <span className={stil.feldLabel}>Veranstaltung (optional)</span>
              <select name="eventId" className={stil.auswahl} defaultValue="">
                <option value="">— keine —</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.titel}
                  </option>
                ))}
              </select>
            </label>
            <label className={stil.feld}>
              <span className={stil.feldLabel}>Anmeldungs-Kennung (optional)</span>
              <input name="registrationId" className={stil.eingabe} />
              <span className={stil.feldHilfe}>
                Wird sie eingetragen, sperrt der nächste Löschlauf diese Anmeldung
                automatisch.
              </span>
            </label>
          </div>
          <label className={stil.feld}>
            <span className={stil.feldLabel}>Beschreibung</span>
            <textarea name="beschreibung" className={stil.textfeld} maxLength={4000} />
            <span className={stil.feldHilfe}>
              Nur was für die Aufklärung wirklich nötig ist. Diese Akte bleibt lange
              erhalten.
            </span>
          </label>
          <div className={stil.knopfReihe}>
            <button type="submit" className={stil.knopf}>
              Vorfall eröffnen
            </button>
          </div>
        </form>
      </div>
    </AdminRahmen>
  );
}

function Liste({
  titel,
  leer,
  vorfaelle,
}: {
  titel: string;
  leer: string;
  vorfaelle: {
    id: string;
    titel: string;
    beschreibung: string | null;
    einstufung: string;
    status: string;
    eroeffnetAm: Date;
    abgeschlossenAm: Date | null;
    faelligAm: Date | null;
    registrationId: string | null;
  }[];
}) {
  return (
    <div className={stil.karte}>
      <h2 className={stil.karteTitel}>{titel}</h2>
      {vorfaelle.length === 0 ? (
        <p>{leer}</p>
      ) : (
        <div className={stil.tabelleUmschlag}>
          <table className={stil.tabelle}>
            <thead>
              <tr>
                <th>Vorfall</th>
                <th>Einstufung</th>
                <th>eröffnet</th>
                <th>gelöscht am</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {vorfaelle.map((v) => (
                <tr key={v.id}>
                  <td>
                    <b>{v.titel}</b>
                    <br />
                    <code>{v.id}</code>
                    {v.registrationId && (
                      <>
                        <br />
                        Anmeldung: <code>{v.registrationId}</code>
                      </>
                    )}
                    {v.beschreibung && (
                      <details>
                        <summary>Beschreibung</summary>
                        <p>{v.beschreibung}</p>
                      </details>
                    )}
                  </td>
                  <td>
                    <form action={einstufungSetzen}>
                      <input type="hidden" name="vorfallId" value={v.id} />
                      <select
                        name="einstufung"
                        className={stil.auswahl}
                        defaultValue={v.einstufung}
                      >
                        <option value="LEICHT">Leicht</option>
                        <option value="SCHWER">Schwer</option>
                      </select>
                      <button
                        type="submit"
                        className={`${stil.knopf} ${stil.knopfLeise} ${stil.knopfKlein}`}
                      >
                        Übernehmen
                      </button>
                    </form>
                  </td>
                  <td>{zeitpunkt(v.eroeffnetAm)}</td>
                  <td>
                    {v.faelligAm ? (
                      datum(v.faelligAm)
                    ) : (
                      <span className={`${stil.marker} ${stil.markerOffen}`}>
                        läuft — keine Löschung
                      </span>
                    )}
                  </td>
                  <td>
                    <form action={statusUmstellen}>
                      <input type="hidden" name="vorfallId" value={v.id} />
                      <input
                        type="hidden"
                        name="status"
                        value={v.status === "OFFEN" ? "ABGESCHLOSSEN" : "OFFEN"}
                      />
                      <button
                        type="submit"
                        className={`${stil.knopf} ${stil.knopfLeise} ${stil.knopfKlein}`}
                      >
                        {v.status === "OFFEN" ? "Abschließen" : "Wieder öffnen"}
                      </button>
                    </form>
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
