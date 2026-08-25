import Link from "next/link";
import { notFound } from "next/navigation";
import { verlangeAdmin } from "@/lib/adminAuth";
import { findeEventFuerVorschau } from "@/lib/events";
import { THEME_LISTE } from "@/lib/themes";
import { EventSeite } from "@/components/EventSeite";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { texte } from "@/content";
import stil from "./vorschau.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vorschau", robots: { index: false, follow: false } };

/**
 * Die Event-Seite so, wie Besucher sie sehen werden — auch als Entwurf.
 *
 * Zwei Dinge sind hier wichtig:
 *
 * 1. Es wird **dieselbe** Komponente gezeigt, die auch die öffentliche
 *    Adresse ausliefert, samt Kopfzeile und Fußbereich. Eine
 *    nachgebaute Vorschau liefe früher oder später auseinander — und
 *    zwar unbemerkt, weil sie ja „fast" stimmt.
 * 2. Der Zugang wird hier geprüft, nicht im Layout: Diese Seite gibt
 *    unveröffentlichte Inhalte heraus.
 */
export default async function VorschauSeite({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await verlangeAdmin();
  const { id } = await params;

  const event = await findeEventFuerVorschau(id);
  if (!event) notFound();

  const theme = THEME_LISTE.find((t) => t.wert === event.theme);

  return (
    <>
      <div className={stil.leiste}>
        <div className={stil.leisteInhalt}>
          <span className={stil.marke}>Vorschau</span>
          <span className={stil.hinweis}>
            So sehen Besucher die Seite. Design: <strong>{theme?.name}</strong>
            {event.status !== "VEROEFFENTLICHT" && " · noch nicht veröffentlicht"}
          </span>
          <span className={stil.rechts}>
            <Link href={`/admin/events/${id}`} className={stil.zurueck}>
              Zurück zum Bearbeiten
            </Link>
          </span>
        </div>
      </div>

      {/* Die Marken-Hülle gehört dazu: Ohne sie zeigte die Vorschau
          eine Seite, die es so nie gibt. */}
      <Header t={texte} />
      <main>
        <EventSeite t={texte} event={event} />
      </main>
      <Footer t={texte} />
      <span className="nurVorlesen">Vorschau für {admin.email}</span>
    </>
  );
}
