import { AbschnittKopf } from "./Abschnitt";
import type { Woerterbuch } from "@/content";
import stil from "./Ablauf.module.css";

export function Ablauf({ t }: { t: Woerterbuch }) {
  return (
    <>
      <AbschnittKopf titel={t.ablauf.ueberschrift} />
      <ol className={stil.liste}>
        {t.ablauf.schritte.map((schritt) => (
          <li key={schritt.titel} className={stil.schritt}>
            <h3 className={stil.titel}>{schritt.titel}</h3>
            <p className={stil.text}>{schritt.text}</p>
          </li>
        ))}
      </ol>
    </>
  );
}
