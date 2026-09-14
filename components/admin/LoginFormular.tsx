"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { anmelden } from "@/app/admin/aktion";
import { LOGIN_STARTZUSTAND } from "@/lib/adminLogin";
import stil from "@/app/admin/admin.module.css";

/**
 * Ein einziges Formular für beide Schritte der Anmeldung.
 *
 * Welche Felder erscheinen — E-Mail/Passwort oder der Code —
 * entscheidet sich ausschließlich am servergelieferten `ergebnis`,
 * nicht an einem eigenen Client-Zustand. Dadurch funktioniert der
 * zweite Schritt auch ohne JavaScript: `anmelden()` liest den
 * Zwischenschritt aus einem Cookie, nicht aus einem versteckten
 * Feld, das nur ein Skript setzen könnte.
 */
export function LoginFormular({ startZustand = LOGIN_STARTZUSTAND }: { startZustand?: typeof LOGIN_STARTZUSTAND }) {
  const [ergebnis, aktion] = useActionState(anmelden, startZustand);

  return (
    <form action={aktion}>
      {ergebnis.meldung && (
        <p className={`${stil.meldung} ${stil.meldungFehler}`} role="alert">
          {ergebnis.meldung}
        </p>
      )}

      {ergebnis.zweiterFaktorNoetig ? (
        <div className={stil.feld} style={{ marginBottom: "1.5rem" }}>
          <label className={stil.feldLabel} htmlFor="admin-code">
            Code aus der App — oder ein Backup-Code
          </label>
          <input
            id="admin-code"
            className={stil.eingabe}
            type="text"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            required
          />
          <span className={stil.feldHilfe}>
            Sechs Ziffern aus der Authenticator-App, oder ein zehnstelliger Backup-Code.
          </span>
        </div>
      ) : (
        <>
          <div className={stil.feld} style={{ marginBottom: "1rem" }}>
            <label className={stil.feldLabel} htmlFor="admin-email">
              E-Mail-Adresse
            </label>
            <input
              id="admin-email"
              className={stil.eingabe}
              type="email"
              name="email"
              autoComplete="username"
              required
            />
          </div>

          <div className={stil.feld} style={{ marginBottom: "1.5rem" }}>
            <label className={stil.feldLabel} htmlFor="admin-passwort">
              Passwort
            </label>
            <input
              id="admin-passwort"
              className={stil.eingabe}
              type="password"
              name="passwort"
              autoComplete="current-password"
              required
            />
          </div>
        </>
      )}

      <Knopf zweiterFaktor={!!ergebnis.zweiterFaktorNoetig} />
    </form>
  );
}

/** Eigene Komponente, weil useFormStatus nur INNERHALB des Formulars wirkt. */
function Knopf({ zweiterFaktor }: { zweiterFaktor: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={stil.knopf} disabled={pending} style={{ width: "100%" }}>
      {pending ? "Wird geprüft …" : zweiterFaktor ? "Bestätigen" : "Anmelden"}
    </button>
  );
}
