import type { Metadata } from "next";
import { verlangeAdmin } from "@/lib/adminAuth";
import { db } from "@/lib/db";
import { neueEinrichtung, unbenutzteBackupCodes } from "@/lib/zweiterFaktor";
import { AdminRahmen } from "@/components/admin/AdminRahmen";
import { EinrichtenFormular, AktivBereich } from "@/components/admin/ZweiterFaktorFormular";
import stil from "../admin.module.css";

export const metadata: Metadata = { title: "Zweiter Faktor" };

/** Liest die Sitzung — muss deshalb bei jedem Aufruf frisch laufen. */
export const dynamic = "force-dynamic";

/**
 * Selbstbedienung für den zweiten Faktor: einrichten, Backup-Codes
 * erneuern, wieder abschalten.
 *
 * Der Zugang wird hier geprüft, nicht im Layout — genau wie in jeder
 * anderen Admin-Seite.
 */
export default async function ZweiterFaktorSeite() {
  const admin = await verlangeAdmin();
  const voll = await db.adminUser.findUniqueOrThrow({ where: { id: admin.id } });

  return (
    <AdminRahmen
      admin={admin}
      titel="Zweiter Faktor"
      unterzeile="Zusätzlicher Schutz für die Anmeldung an diesem Konto"
    >
      <div className={stil.karte}>
        <p>
          Mit dem zweiten Faktor genügt ein gestohlenes Passwort allein nicht mehr für den
          Zugang — es braucht zusätzlich einen Code aus einer Authenticator-App auf einem
          Gerät, das getrennt vom Passwort aufbewahrt wird.
        </p>
      </div>

      {voll.zweiterFaktorAktiv ? (
        <AktivTeil adminId={admin.id} />
      ) : (
        <EinrichtenTeil email={admin.email} />
      )}
    </AdminRahmen>
  );
}

async function EinrichtenTeil({ email }: { email: string }) {
  const { geheimnis, qrDataUrl } = neueEinrichtung(email);
  return <EinrichtenFormular geheimnis={geheimnis} qrDataUrl={qrDataUrl} />;
}

async function AktivTeil({ adminId }: { adminId: string }) {
  const verbleibend = await unbenutzteBackupCodes(adminId);
  return <AktivBereich verbleibendeBackupCodes={verbleibend} />;
}
