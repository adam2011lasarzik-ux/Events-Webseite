import Link from "next/link";
import { abmelden } from "@/app/admin/aktion";
import type { AngemeldeterAdmin } from "@/lib/adminAuth";
import stil from "@/app/admin/admin.module.css";

/**
 * Kopfleiste und Rahmen jeder Admin-Seite.
 *
 * Bekommt die angemeldete Person als Wert übergeben, statt sie selbst
 * zu ermitteln: Jede Seite hat sie ohnehin schon geprüft, und so gibt
 * es keine zweite Stelle, an der ein Zugang gewährt oder verweigert
 * wird.
 */
export function AdminRahmen({
  admin,
  titel,
  unterzeile,
  aktionen,
  children,
}: {
  admin: AngemeldeterAdmin;
  titel: string;
  unterzeile?: string;
  aktionen?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={stil.rahmen}>
      <header className={stil.leiste}>
        <div className={stil.leisteInhalt}>
          <Link href="/admin" className={stil.marke}>
            <b>VERA</b> Verwaltung
          </Link>
          <nav className={stil.navi}>
            <Link href="/admin">Übersicht</Link>
            <Link href="/admin/events/neu">Neues Event</Link>
            <Link href="/">Zur Webseite</Link>
          </nav>
          <div className={stil.rechts}>
            <span className={stil.wer}>{admin.email}</span>
            <form action={abmelden}>
              <button type="submit" className={stil.abmelden}>
                Abmelden
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className={stil.inhalt}>
        <div className={stil.karteKopf}>
          <div style={{ flex: 1 }}>
            <h1 className={stil.titel}>{titel}</h1>
            {unterzeile && <p className={stil.unterzeile}>{unterzeile}</p>}
          </div>
          {aktionen && <div className={stil.knopfReihe}>{aktionen}</div>}
        </div>
        {children}
      </main>
    </div>
  );
}
