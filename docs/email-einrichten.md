# E-Mail-Versand einrichten

Diese Anleitung beschreibt, wie der automatische E-Mail-Versand von VERA
eingerichtet und geprüft wird. Sie ist für das **iPad** geschrieben.

> **Das Postfach ist bereits eingerichtet.** `kontakt@veraevents.de`
> wurde bei Hostinger angelegt (Tarif „E-Mail-Adresse für
> Geschäftseinsteiger"), DNS (MX, SPF, DKIM, DMARC) ist grün, Webmail
> funktioniert. Diese Anleitung beschreibt nur noch die Anbindung an
> die VERA-Anwendung.

---

## Was VERA automatisch verschickt

| Anlass | An wen | Wann |
|---|---|---|
| Anmeldung bestätigt | die anmeldende Person | sofort, nur bei **kostenlosen** Events |
| Zahlung eingegangen | die anmeldende Person | nachdem die Rückmeldung des Zahlungsanbieters geprüft ist |
| Neue Anmeldung | der Veranstalter | bei **jeder** neuen Anmeldung, unabhängig vom Zahlungsstatus |
| Sicherung fehlgeschlagen | der Veranstalter | **nur bei einem Fehler** der nächtlichen Datenbank-Sicherung — nie bei Erfolg |

Bei einer bezahlpflichtigen Anmeldung bekommt die anmeldende Person
**keine** Bestätigung direkt nach dem Absenden — die kommt erst, wenn
die Zahlung wirklich bestätigt ist (`app/zahlung/rueckmeldung/route.ts`).
Alles andere wäre eine Bestätigung, bevor feststeht, dass bezahlt wurde.

**Wichtiger Grundsatz:** Eine Anmeldung oder eine Zahlung scheitert
**niemals** daran, dass eine E-Mail nicht verschickt werden konnte.
Die Daten stehen bereits in der Datenbank; ein Mail-Ausfall wird nur
protokolliert (`lib/mail.ts` → `mailSendenOhneAbbruch`).

---

## Die fünf Werte

Zu finden bei Hostinger unter **E-Mail → das Postfach → „Apps und
Geräte verbinden" → „Erweiterte Einstellungen"**.

| Variable | Wert |
|---|---|
| `SMTP_SERVER` | `smtp.hostinger.com` |
| `SMTP_PORT` | `465` |
| `SMTP_BENUTZER` | `kontakt@veraevents.de` |
| `SMTP_PASSWORT` | das Postfach-Passwort |
| `SMTP_ABSENDER` | `kontakt@veraevents.de` |

Port 465 bedeutet **direktes TLS/SSL** (nicht STARTTLS) — das ist bei
Hostinger die vorgesehene Kombination für diesen Port, und `lib/mail.ts`
schaltet `secure: true` automatisch ein, sobald der Port `465` ist.

Optional dazu:

| Variable | Wert |
|---|---|
| `MAIL_ADMIN_EMPFAENGER` | wohin die Benachrichtigung über neue Anmeldungen geht. Leer = dieselbe Adresse wie `SMTP_ABSENDER`. |

> **Ein Zeichen ist im Postfach-Passwort verboten: `$` mit einem
> Buchstaben, einer Ziffer oder `{` dahinter.**
>
> Next.js liest die `.env`-Datei mit einer Erweiterung, die `$name`
> durch andere Einstellungen ersetzt — aus `ab$cdef` wird dabei `ab`.
> Gemessen, nicht vermutet. Die Prüfskripte tun das nicht, also wäre
> `npm run mail:pruefen` grün, während die laufende Webseite mit einem
> verstümmelten Passwort abgewiesen würde. `npm run mail:pruefen`
> erkennt und meldet diesen Fall inzwischen ausdrücklich.
>
> Unbedenklich sind dagegen `\`, `` ` ``, `"` und ein `$` am Ende —
> alle vier wurden gegen den echten Einleser von Next.js geprüft.
>
> Passwörter werden mit `server/vera-smtp-passwort-setzen.sh` gesetzt,
> nie von Hand in der Datei: Das Skript probiert das Passwort erst
> beim Mailserver aus und schreibt es erst danach, fasst
> ausschließlich diese eine Zeile an und zeigt das Passwort nirgends.

**Wo diese Werte hingehören — und wo nicht**, genau wie beim
Zahlungsschlüssel (siehe `docs/stripe-einrichten.md`):

| | Ort |
|---|---|
| **Richtig** | die `.env`-Datei auf dem Server (`/var/www/vera/.env`, `chmod 600`) — oder in der Entwicklung die lokale `.env` |
| **Niemals** | Git, GitHub, der Quelltext, der Chat, eine Umgebungsvariable von Claude Code |

Das Passwort wird an **keiner** Stelle im Projekt angezeigt oder
protokolliert — auch die Selbstprüfung unten zeigt es nie im Klartext.

---

## Einrichten, Schritt für Schritt

1. Auf dem Server (Webkonsole) die Datei `/var/www/vera/.env` öffnen:
   ```
   sudo -u vera nano /var/www/vera/.env
   ```
2. Die fünf Zeilen aus der Tabelle oben ergänzen (Vorlage steht in
   `.env.example`).
3. Speichern (`Strg+O`, dann `Enter`), verlassen (`Strg+X`).
4. Prüfen, ohne den Dienst neu zu starten:
   ```
   cd /var/www/vera && sudo -u vera npm run mail:pruefen
   ```
   Das Ergebnis zeigt, ob alle fünf Werte vollständig sind und ob das
   Postfach die Verbindung annimmt — **ohne** das Passwort anzuzeigen.
5. Erst wenn `npm run mail:pruefen` durchgängig grün ist, den Dienst
   neu starten, damit die laufende Anwendung die neuen Werte liest:
   ```
   sudo systemctl restart vera
   ```

---

## Selbstprüfung: `npm run mail:pruefen`

Anders als `npm run zahlung:pruefen` (bewusst **ohne** Netzzugriff, weil
es dort um einen Zahlungsschlüssel geht) prüft dieser Befehl die
Verbindung **wirklich**: Ein SMTP-Login kostet nichts und verrät kein
Geheimnis, verhindert aber, dass ein falscher Port oder ein
Tippfehler im Passwort erst bei der ersten echten Anmeldung auffällt.

```
npm run mail:pruefen
```

Typische Ausgabe, wenn noch nichts eingerichtet ist:

```
✗ SMTP_SERVER ist hinterlegt
    → SMTP_SERVER setzen, z. B. „smtp.hostinger.com" …
```

Wenn alles stimmt:

```
✓ Verbindung und Anmeldung erfolgreich.
Alles vollständig. Der E-Mail-Versand ist eingerichtet.
```

---

## Die letzte, gemeinsame Prüfung

Der Befehl oben bestätigt nur, dass sich die Anwendung beim Postfach
anmelden kann — er verschickt keine Mail. Der eigentliche Beweis ist
eine **echte** Anmeldung auf der Webseite, gemeinsam durchgeklickt:

1. Ein kostenloses Test-Event anlegen (oder ein bestehendes Event auf
   Preis 0 setzen) und sich damit anmelden → die Bestätigungsmail muss
   ankommen.
2. Dieselbe Anmeldung noch einmal mit echtem Testschlüssel und einer
   Stripe-Testkarte bezahlen (sobald Phase 12 so weit ist) → die
   Zahlungsbestätigung muss ankommen.
3. Bei beiden Schritten muss außerdem die Admin-Benachrichtigung unter
   `MAIL_ADMIN_EMPFAENGER` ankommen.
4. Testanmeldung danach im Adminbereich wieder entfernen.

---

## Der Sicherungs-Alarm

`server/vera-sicherung.sh` ruft bei einem Fehler automatisch
`npm run sicherung:alarm` auf (`prisma/sicherungsAlarmSenden.ts`).
Das passiert **ausschließlich im Fehlerfall** — eine erfolgreiche
nächtliche Sicherung verschickt bewusst keine Mail, sonst würde die
tägliche Bestätigung irgendwann ignoriert und ein echter Fehler ginge
darin unter.

Manuell auslösen, um den Weg einmal zu prüfen (verschickt eine echte
Test-Alarm-Mail, verändert aber keine Sicherung):

```
cd /var/www/vera && sudo -u vera npm run sicherung:alarm -- "Testalarm"
```
