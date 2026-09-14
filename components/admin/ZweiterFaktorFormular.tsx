"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
  zweiterFaktorEinrichtenBestaetigen,
  backupCodesErneuern,
  zweiterFaktorDeaktivierenAktion,
} from "@/app/admin/zweiter-faktor/aktion";
import { ZWEITER_FAKTOR_STARTZUSTAND } from "@/lib/zweiterFaktorFormular";
import stil from "@/app/admin/admin.module.css";

/** Die Einrichtung: QR-Code zeigen, dann mit einem Code bestätigen. */
export function EinrichtenFormular({
  geheimnis,
  qrDataUrl,
}: {
  geheimnis: string;
  qrDataUrl: string;
}) {
  const [ergebnis, aktion] = useActionState(
    zweiterFaktorEinrichtenBestaetigen,
    ZWEITER_FAKTOR_STARTZUSTAND,
  );

  if (ergebnis.backupCodes) {
    return <BackupCodesAnzeige codes={ergebnis.backupCodes} />;
  }

  return (
    <form action={aktion}>
      {ergebnis.meldung && (
        <p className={`${stil.meldung} ${stil.meldungFehler}`} role="alert">
          {ergebnis.meldung}
        </p>
      )}

      <div className={stil.karte}>
        <p className={stil.formGruppenTitel}>1. Mit der Authenticator-App abfotografieren</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          alt="QR-Code zur Einrichtung des zweiten Faktors"
          width={220}
          height={220}
          style={{ display: "block", margin: "0.5rem 0" }}
        />
        <p className={stil.feldHilfe}>
          Google Authenticator, Authy, 1Password oder eine ähnliche App. Geht der QR-Code
          nicht: Schlüssel von Hand eingeben — <code>{geheimnis}</code>
        </p>
        <p className={stil.feldHilfe}>
          Wird diese Seite neu geladen, bevor der Code unten bestätigt ist, erscheint ein
          neuer QR-Code — der jetzige gilt dann nicht mehr.
        </p>
      </div>

      <div className={stil.karte}>
        <p className={stil.formGruppenTitel}>2. Den angezeigten Code bestätigen</p>
        <input type="hidden" name="geheimnis" value={geheimnis} />
        <div className={stil.feld}>
          <label className={stil.feldLabel} htmlFor="zf-einrichten-code">
            Code aus der App
          </label>
          <input
            id="zf-einrichten-code"
            className={stil.eingabe}
            type="text"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
          />
        </div>
      </div>

      <div className={stil.knopfReihe}>
        <Knopf text="Einrichten abschließen" pendingText="Wird geprüft …" />
      </div>
    </form>
  );
}

/** Zeigt die acht Backup-Codes GENAU EINMAL an. */
function BackupCodesAnzeige({ codes }: { codes: string[] }) {
  return (
    <div className={stil.karte}>
      <p className={`${stil.meldung} ${stil.meldungGut}`} role="status">
        Der zweite Faktor ist jetzt aktiv.
      </p>
      <p className={stil.formGruppenTitel}>Backup-Codes — jetzt notieren</p>
      <p className={stil.feldHilfe}>
        Diese acht Codes werden nur jetzt angezeigt. Jeder funktioniert genau einmal, falls
        das Gerät mit der App nicht zur Hand ist. Am besten ausdrucken oder in einem
        Passwort-Manager ablegen — nicht als Bildschirmfoto auf demselben Gerät.
      </p>
      <ul style={{ fontFamily: "monospace", fontSize: "1.05rem", lineHeight: 1.8, paddingLeft: "1.25rem" }}>
        {codes.map((code) => (
          <li key={code}>{code}</li>
        ))}
      </ul>
      <div className={stil.knopfReihe}>
        <Link href="/admin/zweiter-faktor" className={stil.knopf}>
          Fertig
        </Link>
      </div>
    </div>
  );
}

/** Der Bereich, wenn der zweite Faktor schon aktiv ist. */
export function AktivBereich({ verbleibendeBackupCodes }: { verbleibendeBackupCodes: number }) {
  return (
    <>
      <div className={stil.karte}>
        <p className={`${stil.meldung} ${stil.meldungGut}`} role="status">
          Der zweite Faktor ist aktiv.
        </p>
        <p className={stil.feldHilfe}>
          {verbleibendeBackupCodes === 0
            ? "Keine unbenutzten Backup-Codes mehr übrig."
            : verbleibendeBackupCodes === 1
              ? "Noch 1 unbenutzter Backup-Code."
              : `Noch ${verbleibendeBackupCodes} unbenutzte Backup-Codes.`}
        </p>
      </div>

      <BackupCodesErneuernFormular />
      <DeaktivierenFormular />
    </>
  );
}

function BackupCodesErneuernFormular() {
  const [ergebnis, aktion] = useActionState(backupCodesErneuern, ZWEITER_FAKTOR_STARTZUSTAND);

  if (ergebnis.backupCodes) {
    return <BackupCodesAnzeige codes={ergebnis.backupCodes} />;
  }

  return (
    <form action={aktion} className={stil.karte}>
      <p className={stil.formGruppenTitel}>Backup-Codes neu erzeugen</p>
      {ergebnis.meldung && (
        <p className={`${stil.meldung} ${stil.meldungFehler}`} role="alert">
          {ergebnis.meldung}
        </p>
      )}
      <p className={stil.feldHilfe}>
        Ersetzt alle bisherigen Backup-Codes durch acht neue. Die alten funktionieren danach
        nicht mehr.
      </p>
      <div className={stil.feld}>
        <label className={stil.feldLabel} htmlFor="zf-erneuern-code">
          Zur Bestätigung: aktueller Code aus der App
        </label>
        <input
          id="zf-erneuern-code"
          className={stil.eingabe}
          type="text"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
        />
      </div>
      <div className={stil.knopfReihe}>
        <Knopf text="Neu erzeugen" pendingText="Wird geprüft …" />
      </div>
    </form>
  );
}

function DeaktivierenFormular() {
  const [ergebnis, aktion] = useActionState(
    zweiterFaktorDeaktivierenAktion,
    ZWEITER_FAKTOR_STARTZUSTAND,
  );

  return (
    <form action={aktion} className={stil.karte}>
      <p className={stil.formGruppenTitel}>Zweiten Faktor deaktivieren</p>
      {ergebnis.meldung && (
        <p className={`${stil.meldung} ${stil.meldungFehler}`} role="alert">
          {ergebnis.meldung}
        </p>
      )}
      <p className={stil.feldHilfe}>
        Danach genügt beim Anmelden wieder allein das Passwort.
      </p>
      <div className={stil.feld}>
        <label className={stil.feldLabel} htmlFor="zf-deaktivieren-code">
          Zur Bestätigung: aktueller Code aus der App
        </label>
        <input
          id="zf-deaktivieren-code"
          className={stil.eingabe}
          type="text"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
        />
      </div>
      <div className={stil.knopfReihe}>
        <Knopf text="Deaktivieren" pendingText="Wird geprüft …" gefahr />
      </div>
    </form>
  );
}

function Knopf({
  text,
  pendingText,
  gefahr = false,
}: {
  text: string;
  pendingText: string;
  gefahr?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={gefahr ? stil.knopfGefahr : stil.knopf}
      disabled={pending}
    >
      {pending ? pendingText : text}
    </button>
  );
}
