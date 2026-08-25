"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { anmelden } from "@/app/admin/aktion";
import { LOGIN_STARTZUSTAND } from "@/lib/adminLogin";
import stil from "@/app/admin/admin.module.css";

export function LoginFormular() {
  const [ergebnis, aktion] = useActionState(anmelden, LOGIN_STARTZUSTAND);

  return (
    <form action={aktion}>
      {ergebnis.meldung && (
        <p className={`${stil.meldung} ${stil.meldungFehler}`} role="alert">
          {ergebnis.meldung}
        </p>
      )}

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

      <Knopf />
    </form>
  );
}

/** Eigene Komponente, weil useFormStatus nur INNERHALB des Formulars wirkt. */
function Knopf() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={stil.knopf} disabled={pending} style={{ width: "100%" }}>
      {pending ? "Wird geprüft …" : "Anmelden"}
    </button>
  );
}
