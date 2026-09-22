import { verlangeAdmin } from "@/lib/adminAuth";
import { db } from "@/lib/db";
import { AdminRahmen } from "@/components/admin/AdminRahmen";
import stil from "../admin.module.css";
import { zustimmungsnachweisAnlegen } from "./aktion";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Zustimmungsnachweise",
  robots: { index: false, follow: false },
};

const HINWEISE: Record<string, { text: string; gut: boolean }> = {
  angelegt: { text: "Zustimmungsnachweis angelegt.", gut: true },
  "angaben-fehlen": {
    text: "Veranstaltung und Name der teilnehmenden Person werden benötigt.",
    gut: false,
  },
  "kein-termin": {
    text: "Diese Veranstaltung hat noch keinen Termin — ohne Termin lässt sich keine Löschfrist berechnen.",
    gut: false,
  },
};

function datum(d: Date): string {
  return d.toLocaleDateString("de-DE", { timeZone: "Europe/Berlin" });
}

/**
 * K3 — reduzierte Zustimmungsnachweise für Minderjährige.
 *
 * Angelegt wird hier NACHDEM das vollständige Einwilligungsformular
 * (K2) vernichtet wurde — dieser Nachweis ist bewusst alles, was
 * danach noch übrig bleiben soll (docs/loeschkonzept-betrieb.md).
 */
export default async function ZustimmungsnachweiseSeite({
  searchParams,
}: {
  searchParams: Promise<{ hinweis?: string }>;
}) {
  const admin = await verlangeAdmin();
  const { hinweis } = await searchParams;

  const [nachweise, events] = await Promise.all([
    db.zustimmungsnachweis.findMany({ orderBy: { faelligAm: "asc" } }),
    db.event.findMany({ orderBy: { startAt: "desc" }, select: { id: true, titel: true } }),
  ]);

  const meldung = hinweis ? HINWEISE[hinweis] : undefined;

  return (
    <AdminRahmen
      admin={admin}
      titel="Zustimmungsnachweise"
      unterzeile="Reduzierter Nachweis (K3), nachdem das vollständige Formular vernichtet wurde"
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
          Hier entsteht <b>ausschließlich</b> der reduzierte Nachweis: Name der teilnehmenden
          Person, Veranstaltung und ein Vermerk, dass die Zustimmung vorlag. Kein
          Geburtsdatum, keine Mobilnummer, keine Gesundheitsangaben — diese Felder gibt es
          absichtlich nicht. Der Löschlauf entfernt diesen Nachweis automatisch nach Ablauf
          der Frist.
        </p>
      </div>

      <div className={stil.karte}>
        <h2 className={stil.karteTitel}>Vorhandene Nachweise ({nachweise.length})</h2>
        {nachweise.length === 0 ? (
          <p>Noch kein Zustimmungsnachweis angelegt.</p>
        ) : (
          <div className={stil.tabelleUmschlag}>
            <table className={stil.tabelle}>
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Veranstaltung</th>
                  <th>Vermerke</th>
                  <th>fällig zur Löschung</th>
                </tr>
              </thead>
              <tbody>
                {nachweise.map((n) => (
                  <tr key={n.id}>
                    <td>{n.teilnehmerName}</td>
                    <td>
                      {datum(n.veranstaltungAm)}
                      <br />
                      <code>{n.eventId}</code>
                    </td>
                    <td>
                      {n.zustimmungLagVor && <div>Zustimmung lag vor</div>}
                      {n.selbstVerlassenGestattet && (
                        <div>Selbstständiges Verlassen gestattet</div>
                      )}
                    </td>
                    <td>{datum(n.faelligAm)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className={stil.karte}>
        <h2 className={stil.karteTitel}>Nachweis anlegen</h2>
        <form action={zustimmungsnachweisAnlegen}>
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
              <span className={stil.feldLabel}>Name der teilnehmenden Person</span>
              <input name="teilnehmerName" className={stil.eingabe} required maxLength={200} />
            </label>
          </div>
          <label className={stil.haken}>
            <input type="checkbox" name="zustimmungLagVor" value="an" defaultChecked />
            <span>Zustimmung der Erziehungsberechtigten lag vor</span>
          </label>
          <label className={stil.haken}>
            <input type="checkbox" name="selbstVerlassenGestattet" value="an" />
            <span>Selbstständiges Verlassen der Veranstaltung war gestattet</span>
          </label>
          <div className={stil.knopfReihe}>
            <button type="submit" className={stil.knopf}>
              Nachweis anlegen
            </button>
          </div>
        </form>
      </div>
    </AdminRahmen>
  );
}
