import { verlangeAdmin } from "@/lib/adminAuth";
import { db } from "@/lib/db";
import { AdminRahmen } from "@/components/admin/AdminRahmen";
import stil from "../admin.module.css";
import { checklisteAktualisieren, checklisteAnlegen } from "./aktion";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Checklisten",
  robots: { index: false, follow: false },
};

const HINWEISE: Record<string, { text: string; gut: boolean }> = {
  angelegt: { text: "Checkliste angelegt.", gut: true },
  geaendert: { text: "Checkliste aktualisiert.", gut: true },
  "angaben-fehlen": { text: "Bitte eine Veranstaltung auswählen.", gut: false },
  "kein-termin": {
    text: "Diese Veranstaltung hat noch keinen Termin — ohne Termin lässt sich keine Löschfrist berechnen.",
    gut: false,
  },
  "nicht-bearbeitbar": {
    text: "Diese Checkliste ist bereits anonymisiert und lässt sich nicht mehr bearbeiten.",
    gut: false,
  },
};

function datum(d: Date): string {
  return d.toLocaleDateString("de-DE", { timeZone: "Europe/Berlin" });
}

/**
 * K5 — Veranstaltungs- und Sicherheitschecklisten.
 *
 * Der Zugang wird hier geprüft, nicht im Layout — wie überall im
 * Adminbereich.
 */
export default async function ChecklistenSeite({
  searchParams,
}: {
  searchParams: Promise<{ hinweis?: string }>;
}) {
  const admin = await verlangeAdmin();
  const { hinweis } = await searchParams;

  const [checklistenRoh, events] = await Promise.all([
    db.checkliste.findMany({ orderBy: { durchgefuehrtAm: "desc" } }),
    db.event.findMany({ orderBy: { startAt: "desc" }, select: { id: true, titel: true } }),
  ]);

  // Checkliste.eventId ist bewusst keine Prisma-Relation (wie bei
  // Vorfall/Zustimmungsnachweis) — der Eventtitel wird deshalb hier
  // zugeordnet, statt per `include` geladen.
  const titelNachEventId = new Map(events.map((e) => [e.id, e.titel]));
  const checklisten = checklistenRoh.map((c) => ({
    ...c,
    eventTitel: titelNachEventId.get(c.eventId) ?? "Unbekannte Veranstaltung",
  }));

  const meldung = hinweis ? HINWEISE[hinweis] : undefined;

  return (
    <AdminRahmen
      admin={admin}
      titel="Checklisten"
      unterzeile="Einweisung durch die Halle, Sicherheits-/Organisationsprüfung, zuständige Person und Prüfdatum — je Event"
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
          Das Kürzel der prüfenden Person und die Notiz sind Personenbezug — sie werden nach
          drei Jahren automatisch entfernt (anonymisiert). Ob die Einweisung erfolgt ist und
          wie viele Teilnehmer dabei waren, bleibt dauerhaft erhalten. Wird der Termin des
          Events später geändert, rechnet der nächste Löschlauf die Frist automatisch neu.
        </p>
      </div>

      <div className={stil.karte}>
        <h2 className={stil.karteTitel}>Vorhandene Checklisten ({checklisten.length})</h2>
        {checklisten.length === 0 ? (
          <p>Noch keine Checkliste angelegt.</p>
        ) : (
          <div className={stil.tabelleUmschlag}>
            <table className={stil.tabelle}>
              <thead>
                <tr>
                  <th>Veranstaltung</th>
                  <th>Prüfdatum</th>
                  <th>Einweisung / Prüfung</th>
                  <th>fällig zur Löschung</th>
                </tr>
              </thead>
              <tbody>
                {checklisten.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <b>{c.eventTitel}</b>
                      <br />
                      <code>{c.id}</code>
                    </td>
                    <td>{datum(c.durchgefuehrtAm)}</td>
                    <td>
                      {c.anonymisiertAm ? (
                        <span className={`${stil.marker} ${stil.markerOffen}`}>
                          anonymisiert am {datum(c.anonymisiertAm)}
                        </span>
                      ) : (
                        <form action={checklisteAktualisieren}>
                          <input type="hidden" name="checklisteId" value={c.id} />
                          <div className={stil.raster}>
                            <label className={stil.feld}>
                              <span className={stil.feldLabel}>Zuständige Person (Kürzel)</span>
                              <input
                                name="einweisungKuerzel"
                                className={stil.eingabe}
                                defaultValue={c.einweisungKuerzel ?? ""}
                                maxLength={50}
                              />
                            </label>
                            <label className={stil.feld}>
                              <span className={stil.feldLabel}>Teilnehmerzahl</span>
                              <input
                                name="teilnehmerAnzahl"
                                type="number"
                                min={0}
                                className={stil.eingabe}
                                defaultValue={c.teilnehmerAnzahl ?? ""}
                              />
                            </label>
                          </div>
                          <label className={stil.feld}>
                            <span className={stil.feldLabel}>
                              Sicherheits-/Organisationsprüfung
                            </span>
                            <textarea
                              name="notiz"
                              className={stil.textfeld}
                              defaultValue={c.notiz ?? ""}
                              maxLength={4000}
                            />
                          </label>
                          <label className={stil.haken}>
                            <input
                              type="checkbox"
                              name="einweisungErfolgt"
                              value="an"
                              defaultChecked={c.einweisungErfolgt}
                            />
                            <span>Einweisung durch die Halle ist erfolgt</span>
                          </label>
                          <button
                            type="submit"
                            className={`${stil.knopf} ${stil.knopfLeise} ${stil.knopfKlein}`}
                          >
                            Speichern
                          </button>
                        </form>
                      )}
                    </td>
                    <td>{datum(c.faelligAm)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className={stil.karte}>
        <h2 className={stil.karteTitel}>Checkliste anlegen</h2>
        <form action={checklisteAnlegen}>
          <div className={stil.raster}>
            <label className={stil.feld}>
              <span className={stil.feldLabel}>Veranstaltung</span>
              <select name="eventId" className={stil.auswahl} required defaultValue="">
                <option value="" disabled>
                  — auswählen —
                </option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.titel}
                  </option>
                ))}
              </select>
            </label>
            <label className={stil.feld}>
              <span className={stil.feldLabel}>Prüfdatum</span>
              <input name="durchgefuehrtAm" type="date" className={stil.eingabe} />
              <span className={stil.feldHilfe}>Leer = heute.</span>
            </label>
            <label className={stil.feld}>
              <span className={stil.feldLabel}>Zuständige Person (Kürzel)</span>
              <input name="einweisungKuerzel" className={stil.eingabe} maxLength={50} />
            </label>
            <label className={stil.feld}>
              <span className={stil.feldLabel}>Teilnehmerzahl</span>
              <input name="teilnehmerAnzahl" type="number" min={0} className={stil.eingabe} />
            </label>
          </div>
          <label className={stil.feld}>
            <span className={stil.feldLabel}>Sicherheits-/Organisationsprüfung</span>
            <textarea name="notiz" className={stil.textfeld} maxLength={4000} />
          </label>
          <label className={stil.haken}>
            <input type="checkbox" name="einweisungErfolgt" value="an" />
            <span>Einweisung durch die Halle ist erfolgt</span>
          </label>
          <div className={stil.knopfReihe}>
            <button type="submit" className={stil.knopf}>
              Checkliste anlegen
            </button>
          </div>
        </form>
      </div>
    </AdminRahmen>
  );
}
