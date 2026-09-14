import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { aktuellerAdmin, zweiterFaktorPruefungAktuell } from "@/lib/adminAuth";
import { LoginFormular } from "@/components/admin/LoginFormular";
import { LOGIN_STARTZUSTAND } from "@/lib/adminLogin";
import stil from "../admin.module.css";

export const metadata: Metadata = {
  title: "Anmelden",
  // Der Adminbereich hat in keiner Suchmaschine etwas verloren.
  robots: { index: false, follow: false },
};

/** Liest Cookies — muss deshalb bei jedem Aufruf frisch laufen. */
export const dynamic = "force-dynamic";

export default async function LoginSeite({
  searchParams,
}: {
  searchParams: Promise<{ abgemeldet?: string }>;
}) {
  // Wer schon angemeldet ist, soll nicht erneut nach dem Passwort
  // gefragt werden.
  if (await aktuellerAdmin()) redirect("/admin");

  /* „Überall abmelden" sieht sonst genauso aus wie ein gewöhnliches
     Abmelden — man erführe nie, ob es gewirkt hat. */
  const { abgemeldet } = await searchParams;

  /* Steht schon ein gültiger Zwischenschritt, zeigt das Formular
     gleich die Code-Eingabe — auch nach einem Neuladen der Seite.
     Ohne das fiele ein Neuladen mitten im zweiten Schritt auf die
     Passwortabfrage zurück, obwohl der Zwischenschritt serverseitig
     noch gilt. */
  const laufendePruefung = await zweiterFaktorPruefungAktuell();
  const startZustand = laufendePruefung
    ? { ...LOGIN_STARTZUSTAND, zweiterFaktorNoetig: true }
    : LOGIN_STARTZUSTAND;

  return (
    <div className={stil.loginMitte}>
      <div className={stil.loginKarte}>
        <p className={stil.loginMarke}>
          <b>VERA</b>
          <span>nstaltung</span>
        </p>
        <p className={stil.unterzeile}>Verwaltung</p>
        {abgemeldet === "alle" && (
          <p className={stil.loginHinweis}>
            Du bist jetzt auf allen Geräten abgemeldet.
          </p>
        )}
        <LoginFormular startZustand={startZustand} />
      </div>
    </div>
  );
}
