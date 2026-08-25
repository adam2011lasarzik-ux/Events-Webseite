import { Header } from "@/components/Header";
import { VorschauSperre } from "@/components/VorschauSperre";
import { Footer } from "@/components/Footer";
import { texte } from "@/content";

/**
 * Das Layout des öffentlichen Teils: Kopfleiste, Fußbereich und die
 * Vorschau-Sperre.
 *
 * Der Adminbereich liegt bewusst außerhalb dieser Gruppe. Er braucht
 * keine Besucher-Navigation, und die Vorschau-Sperre davor wäre eine
 * zweite Passwortabfrage vor der eigentlichen Anmeldung — verwirrend
 * und ohne Sicherheitsgewinn, denn sie läuft nur im Browser.
 */
export default function SeitenLayout({ children }: { children: React.ReactNode }) {
  return (
    <VorschauSperre>
      <a href="#inhalt" className="zumInhalt">
        {texte.nav.sprungmarke}
      </a>
      <Header t={texte} />
      <main id="inhalt">{children}</main>
      <Footer t={texte} />
    </VorschauSperre>
  );
}
