import { Abschnitt } from "../Abschnitt";
import { FaqListe } from "../FaqListe";
import { Vorstellung } from "./Vorstellung";
import { Ablauf } from "./Ablauf";
import { Hinweise } from "./Hinweise";
import type { EventBlock } from "@/lib/eventInhalte";

/**
 * Zeigt die Inhaltsblöcke einer Veranstaltung.
 *
 * Welche Blöcke es gibt und in welcher Reihenfolge sie stehen,
 * entscheidet lib/eventInhalte.ts — hier wird nur noch übersetzt. Ein
 * weiterer Blocktyp braucht deshalb einen Eintrag dort und einen Fall
 * hier, sonst nichts.
 *
 * Die Abschnitte wechseln sich im Ton ab (hell, warm, hell …), damit
 * die Seite nicht zu einer einzigen Fläche wird — dieselbe Abfolge wie
 * bisher auf der Padel-Seite.
 */
export function EventBloecke({
  bloecke,
  /** Ton des ersten Abschnitts. Die folgenden wechseln sich ab. */
  startTon = "hell",
}: {
  bloecke: EventBlock[];
  startTon?: "hell" | "warm";
}) {
  const versetzt = startTon === "warm" ? 1 : 0;
  return (
    <>
      {bloecke.map((block, i) => (
        <Abschnitt key={block.art} ton={(i + versetzt) % 2 === 1 ? "warm" : "hell"}>
          {block.art === "vorstellung" && <Vorstellung block={block} />}
          {block.art === "ablauf" && <Ablauf block={block} />}
          {block.art === "hinweise" && <Hinweise block={block} />}
          {block.art === "faq" && (
            <FaqListe eintraege={block.fragen} ueberschrift={block.titel} />
          )}
        </Abschnitt>
      ))}
    </>
  );
}
