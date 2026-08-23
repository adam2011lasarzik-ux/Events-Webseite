import stil from "./VeraWortmarke.module.css";

/**
 * Die Wortmarke erklärt den Namen selbst: VERA ist die Kurzform von
 * VERAnstaltung. Der zweite Teil steht leiser daneben.
 */
export function VeraWortmarke({
  groesse = "mittel",
  kurzAufKlein = false,
}: {
  groesse?: "klein" | "mittel" | "gross";
  kurzAufKlein?: boolean;
}) {
  return (
    <span className={`${stil.marke} ${stil[groesse]} ${kurzAufKlein ? stil.kurzAufKlein : ""}`}>
      <span className={stil.stark}>VERA</span>
      <span className={stil.leise}>nstaltung</span>
    </span>
  );
}
