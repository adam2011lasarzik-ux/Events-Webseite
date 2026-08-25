import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { aktuellerAdmin } from "@/lib/adminAuth";
import { LoginFormular } from "@/components/admin/LoginFormular";
import stil from "../admin.module.css";

export const metadata: Metadata = {
  title: "Anmelden",
  // Der Adminbereich hat in keiner Suchmaschine etwas verloren.
  robots: { index: false, follow: false },
};

/** Liest Cookies — muss deshalb bei jedem Aufruf frisch laufen. */
export const dynamic = "force-dynamic";

export default async function LoginSeite() {
  // Wer schon angemeldet ist, soll nicht erneut nach dem Passwort
  // gefragt werden.
  if (await aktuellerAdmin()) redirect("/admin");

  return (
    <div className={stil.loginMitte}>
      <div className={stil.loginKarte}>
        <p className={stil.loginMarke}>
          <b>VERA</b>
          <span>nstaltung</span>
        </p>
        <p className={stil.unterzeile}>Verwaltung</p>
        <LoginFormular />
      </div>
    </div>
  );
}
