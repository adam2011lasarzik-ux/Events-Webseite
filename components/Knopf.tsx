import Link from "next/link";
import stil from "./Knopf.module.css";

type Art = "haupt" | "zweit" | "aufDunkel";

export function Knopf({
  href,
  art = "haupt",
  pfeil = false,
  children,
}: {
  href: string;
  art?: Art;
  pfeil?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={`${stil.knopf} ${stil[art]}`}>
      {children}
      {pfeil && <span className={stil.pfeil} aria-hidden="true">→</span>}
    </Link>
  );
}
