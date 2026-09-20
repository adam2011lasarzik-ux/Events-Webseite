import { verlangeAdmin } from "@/lib/adminAuth";
import { AdminRahmen } from "@/components/admin/AdminRahmen";
import {
  alleFassungen,
  fassungenUnversehrt,
  geltendeFassungJetzt,
  RECHTSTEXTARTEN,
  ARTNAME,
} from "@/lib/rechtstexte";
import stil from "../admin.module.css";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Rechtstexte",
  robots: { index: false, follow: false },
};

function datum(d: Date): string {
  return d.toLocaleDateString("de-DE", { timeZone: "Europe/Berlin" });
}

/**
 * Das Archiv der Rechtstext-Fassungen.
 *
 * Reine Ansicht — hier lässt sich nichts anlegen und nichts ändern.
 * Das ist Absicht: Eine neue Fassung entsteht ausschliesslich über
 * `npm run rechtstext`, bewusst und mit einem gelesenen Text. Ein
 * Formular im Browser lädt dazu ein, einen Vertragstext nebenbei zu
 * ändern — und die alte Fassung wäre dann weg, obwohl Buchungen auf
 * sie verweisen.
 *
 * Der Zugang wird hier geprüft, nicht im Layout — wie überall im
 * Adminbereich.
 */
export default async function RechtstexteSeite() {
  const admin = await verlangeAdmin();

  const jetzt = new Date();
  const [gruppen, beschaedigt] = await Promise.all([
    Promise.all(
      RECHTSTEXTARTEN.map(async (art) => ({
        art,
        fassungen: await alleFassungen(art),
        geltend: await geltendeFassungJetzt(art, jetzt),
      })),
    ),
    fassungenUnversehrt(),
  ]);

  return (
    <AdminRahmen
      admin={admin}
      titel="Rechtstexte"
      unterzeile="Welche Fassung galt wann — der Nachweis für jede Buchung"
    >
      <p className={stil.meldung}>
        Jede Fassung ist unveränderbar. Eine Änderung am Wortlaut ist eine neue
        Fassung — die alte bleibt stehen, weil Buchungen auf sie verweisen.
        Angelegt wird ausschliesslich über <code>npm run rechtstext</code>.
      </p>

      {beschaedigt.length > 0 && (
        <p className={`${stil.meldung} ${stil.meldungFehler}`}>
          <strong>Achtung:</strong> Bei {beschaedigt.length}{" "}
          {beschaedigt.length === 1 ? "Fassung" : "Fassungen"} stimmt der
          gespeicherte Wortlaut nicht mehr mit der Prüfsumme überein:{" "}
          {beschaedigt.map((f) => `${ARTNAME[f.art]} v${f.version}`).join(", ")}. Das
          darf nicht vorkommen — der Text wurde nach dem Anlegen verändert.
        </p>
      )}

      {gruppen.map(({ art, fassungen, geltend }) => (
        <section key={art} style={{ marginTop: "2rem" }}>
          <h2>{ARTNAME[art]}</h2>

          {fassungen.length === 0 ? (
            <p className={stil.meldung}>
              Noch keine Fassung hinterlegt. Buchungen, die jetzt entstehen,
              tragen für diese Art <strong>keine</strong> Fassung — der Nachweis,
              welcher Text einbezogen war, fehlt dann später.
            </p>
          ) : (
            <div className={stil.tabelleUmschlag}>
              <table className={stil.tabelle}>
              <thead>
                <tr>
                  <th>Version</th>
                  <th>Stand</th>
                  <th>Gültig ab</th>
                  <th>Buchungen</th>
                  <th>Prüfsumme</th>
                </tr>
              </thead>
              <tbody>
                {fassungen.map((f) => {
                  const zahl =
                    art === "DATENSCHUTZ"
                      ? f._count.anmeldungenDatenschutz
                      : f._count.anmeldungenAgb;
                  return (
                    <tr key={f.id}>
                      <td>
                        v{f.version}
                        {geltend?.id === f.id && <strong> · gilt jetzt</strong>}
                      </td>
                      <td>{datum(f.datum)}</td>
                      <td>
                        {datum(f.gueltigAb)}
                        {f.gueltigAb > jetzt && " (noch nicht)"}
                      </td>
                      <td>{zahl}</td>
                      <td>
                        <code>{f.pruefsumme.slice(0, 12)}…</code>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
    </AdminRahmen>
  );
}
