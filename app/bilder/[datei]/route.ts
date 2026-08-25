/* ---------------------------------------------------------------
   Liefert die im Adminbereich hochgeladenen Titelbilder aus.

   Warum eine Route und nicht der Ordner `public/`: Bei einem
   Deployment aus Git wird `public/` ersetzt — hochgeladene Bilder
   wären danach weg. Das Bildverzeichnis liegt deshalb daneben und
   lässt sich beim Hoster auf einen bleibenden Pfad zeigen.

   Bilder sind öffentlich; sie stehen ja auf der Event-Seite. Eine
   Zugangsprüfung wäre hier also falsch. Sehr wohl geprüft wird der
   Dateiname.
   --------------------------------------------------------------- */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { nameIstErlaubt, verzeichnis } from "@/lib/bilder";

export async function GET(
  _anfrage: Request,
  { params }: { params: Promise<{ datei: string }> },
) {
  const { datei } = await params;

  /* Nur Namen, die lib/bilder.ts selbst vergibt.
     Das ist die entscheidende Zeile: Ohne sie liesse sich über
     „../../.env" jede Datei des Servers abholen. Eine Liste verbotener
     Zeichen wäre die schwächere Lösung — hier kommt nur durch, was dem
     erwarteten Muster entspricht. */
  if (!nameIstErlaubt(datei)) {
    return new Response("Nicht gefunden.", { status: 404 });
  }

  const ordner = verzeichnis();
  const voll = path.join(ordner, datei);

  // Zweiter Riegel: Der aufgelöste Pfad muss im Bildverzeichnis liegen.
  // Kostet nichts und fängt ab, was die Musterprüfung übersehen hätte.
  if (!path.resolve(voll).startsWith(path.resolve(ordner) + path.sep)) {
    return new Response("Nicht gefunden.", { status: 404 });
  }

  let inhalt: Buffer;
  try {
    inhalt = await readFile(voll);
  } catch {
    return new Response("Nicht gefunden.", { status: 404 });
  }

  return new Response(new Uint8Array(inhalt), {
    headers: {
      "Content-Type": "image/webp",
      // Der Dateiname enthält Zufall und ändert sich bei jedem neuen
      // Bild. Deshalb darf lange zwischengespeichert werden — ein
      // ausgetauschtes Bild bekommt ohnehin eine neue Adresse.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
