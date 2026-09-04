import { Header } from "@/components/Header";
import { VorschauSperre } from "@/components/VorschauSperre";
import { Footer } from "@/components/Footer";
import { slugsMitSchuelern } from "@/lib/events";
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
export default async function SeitenLayout({ children }: { children: React.ReactNode }) {
  // Welche Events sprechen Schüler an? Die Kopfleiste entscheidet
  // danach, ob „Für Schulen" erscheint (Regel in lib/navigation.ts).
  // Muss hier geladen werden: Die Leiste selbst läuft im Browser und
  // kommt dort an keine Datenbank.
  const schulenSlugs = await slugsMitSchuelern();

  return (
    <VorschauSperre>
      <a href="#inhalt" className="zumInhalt">
        {texte.nav.sprungmarke}
      </a>
      <Header t={texte} schulenSlugs={schulenSlugs} />
      <main id="inhalt">{children}</main>
      <Footer t={texte} />
    </VorschauSperre>
  );
}
