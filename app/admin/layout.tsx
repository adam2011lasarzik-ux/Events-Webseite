import type { Metadata } from "next";

/**
 * Layout des Adminbereichs.
 *
 * Bewusst OHNE Zugangsprüfung: Ein Layout wird bei manchen
 * Navigationen nicht erneut ausgeführt, und eine Server-Aktion läuft
 * ohnehin an jedem Layout vorbei. Eine Prüfung hier würde also
 * Sicherheit vortäuschen, die sie nicht bietet. Geprüft wird in jeder
 * einzelnen Seite und jeder einzelnen Aktion über verlangeAdmin() —
 * an der Stelle, die tatsächlich Daten herausgibt oder verändert.
 *
 * Die Kopfleiste steckt deshalb nicht hier, sondern in
 * components/admin/AdminRahmen.tsx: Sie braucht die angemeldete
 * Person, die jede Seite selbst ermittelt. Die Anmeldeseite bekommt
 * so ganz von selbst keine Navigation.
 */
export const metadata: Metadata = {
  title: { default: "Verwaltung", template: "%s · VERA Verwaltung" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
