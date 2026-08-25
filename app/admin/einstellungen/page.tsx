import { verlangeAdmin } from "@/lib/adminAuth";
import { ladeGruender } from "@/lib/einstellungen";
import { AdminRahmen } from "@/components/admin/AdminRahmen";
import {
  GruenderFormular,
  type GruenderVorbelegung,
} from "@/components/admin/GruenderFormular";
import stil from "../admin.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Gründerbereich" };

/**
 * Foto, Name, Bezeichnung und Text des Gründerbereichs.
 *
 * Der Zugang wird hier geprüft, nicht im Layout — genau wie in jeder
 * anderen Admin-Seite.
 */
export default async function EinstellungenSeite({
  searchParams,
}: {
  searchParams: Promise<{ gespeichert?: string }>;
}) {
  const admin = await verlangeAdmin();
  const { gespeichert } = await searchParams;
  const gruender = await ladeGruender();

  const vorbelegung: GruenderVorbelegung = {
    name: gruender.name,
    rolle: gruender.rolle,
    text: gruender.text ?? "",
    bildUrl: gruender.bildUrl ?? "",
    aufStart: gruender.aufStart,
  };

  return (
    <AdminRahmen
      admin={admin}
      titel="Gründerbereich"
      unterzeile="Foto, Name und Beschreibung — gilt für die ganze Webseite"
    >
      {gespeichert && (
        <p className={`${stil.meldung} ${stil.meldungGut}`} role="status">
          Gespeichert.
        </p>
      )}

      <div className={stil.karte}>
        <p>
          Diese Angaben stehen auf der VERA-Startseite. Auf einer einzelnen Eventseite
          erscheinen sie nur, wenn du den Bereich dort einschaltest — im jeweiligen Event
          unter „Design“.
        </p>
      </div>

      <GruenderFormular vorbelegung={vorbelegung} />
    </AdminRahmen>
  );
}
