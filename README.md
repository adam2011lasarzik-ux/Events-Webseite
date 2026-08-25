# VERA — Event-Webseite

Webseite und Verwaltung für VERA (kurz für **VERA**nstaltung). Erstes
Event: ein Padel-Nachmittag in Falkensee für Schüler, Lehrer und Eltern.

## Starten

```bash
npm install
npm run db:migrate    # Datenbank anlegen bzw. auf den neuesten Stand bringen
npm run db:seed       # Startdaten einspielen (nur beim ersten Mal)
npm run dev           # Entwicklung, erreichbar unter http://localhost:3000
npm run build         # Prüfen, ob alles fehlerfrei baut
```

Vorher `.env` anlegen — welche Werte hineingehören, steht in
`.env.example`. **Die `.env` gehört niemals nach GitHub.**

Das Projekt braucht eine **MySQL- oder MariaDB-Datenbank**.

## Zugang zur Verwaltung

Der Adminbereich liegt unter `/admin`. Es gibt bewusst **keine
Selbstregistrierung** — eine öffentlich erreichbare Seite, über die man
sich einen Admin-Zugang anlegen kann, wäre genau die Tür, die der
Adminbereich verschließen soll. Zugänge entstehen ausschließlich über
die Kommandozeile:

```bash
npm run admin -- deine@adresse.de "Ein langes Passwort"
```

Derselbe Befehl ändert das Passwort eines vorhandenen Zugangs — und
beendet dabei alle offenen Sitzungen.

Das Passwort wird niemals gespeichert, nur sein Hash (scrypt).

## Was du am häufigsten ändern willst

| Was | Wo |
|---|---|
| Veranstaltungen: Datum, Ort, Preise, Plätze, Texte | **Im Adminbereich** unter `/admin` |
| Feste Texte der Seite (FAQ, „Was ist Padel?", Für Schulen) | `content/de.ts` |
| Farben, Schriftgrößen, Abstände | `styles/tokens.css` |
| Fotos | `public/images/` (Anleitung liegt dort) |

Veranstaltungen brauchen **keine Code-Änderung** mehr. Ein im
Adminbereich veröffentlichtes Event erscheint sofort auf der Webseite.

## Aufbau

```
app/(seite)/      Die öffentlichen Seiten (/, /anmeldung, /events/… …)
app/admin/        Die geschützte Verwaltung
components/       Bausteine der Webseite
components/admin/ Bausteine der Verwaltung
content/          Die festen Texte der Seite
lib/              Die Regeln (siehe unten)
prisma/           Datenmodell, Migrationen, Startdaten
styles/           tokens.css (Farben, Schriften), global.css
```

Die Klammern in `app/(seite)` machen den Ordner zu einer reinen
Gruppierung: Er taucht in **keiner Adresse** auf. `/anmeldung` bleibt
`/anmeldung` — der Ordner sorgt nur dafür, dass die Verwaltung ein
eigenes Layout ohne Besucher-Navigation bekommt.

### Die Regeln liegen in `lib/`, getrennt von der Anzeige

Jede dieser Dateien enthält reine Funktionen: kein HTTP, keine
Datenbank, keine Anzeige — nur Entscheidungen. Dadurch lässt sich jede
Regel einzeln prüfen.

| Datei | Regel |
|---|---|
| `preise.ts` | Preisberechnung |
| `plaetze.ts` | Wann die Restplätze angezeigt werden |
| `vorschau.ts` | Welche Personen die Anmeldung abfragt |
| `anmeldung.ts` | Prüfung und Aufbau einer Anmeldung |
| `eventFormular.ts` | Prüfung des Event-Formulars |
| `zeit.ts` | Umrechnung deutsche Zeit ↔ gespeicherter Zeitpunkt |

### Fünf Regeln, die wichtig sind

**Preise werden nur an einer Stelle berechnet** — in `lib/preise.ts`.
Sobald Anzeige und Server getrennt rechnen, liefern sie früher oder
später verschiedene Beträge. Bei Geld ist das kein Schönheitsfehler.

**Freie Plätze zählen Personen, nicht Anmeldungen.** Eine Familie mit
sechs Personen belegt sechs Plätze. Zählte man Anmeldungen, zeigte die
Seite freie Plätze an, während die Anlage längst voll ist.

**Dem Browser wird nichts geglaubt.** Preis, Teilnehmerzahl und freie
Plätze ermittelt ausschließlich der Server aus der Datenbank. Ein
mitgeschickter Betrag wird nicht einmal gelesen.

**Der Zugang wird in jeder Seite und jeder Aktion einzeln geprüft**,
nicht im Layout. Ein Layout wird bei manchen Navigationen nicht erneut
ausgeführt, und eine Server-Aktion läuft ohnehin an jedem Layout
vorbei. Eine Prüfung dort täuschte Sicherheit vor.

**Zeiten werden in deutscher Zeit ein- und ausgegeben**, gespeichert
wird der echte Zeitpunkt (`lib/zeit.ts`). Der Server läuft in UTC —
ohne Umrechnung stünde bei einem Event um 14:00 auf der Seite 12:00.

## Was diese Version kann

- Zentrale Event-Übersicht, volle Event-Seite je Veranstaltung,
  Für Schulen, Über VERA, FAQ, Kontakt
- **Echte Anmeldung**: Preis serverseitig berechnet, Plätze in einer
  Transaktion geprüft, Duplikatsschutz, Bot-Falle, Bremse gegen
  Massen-Einsendungen
- **Verwaltung** unter `/admin`: Events anlegen und veröffentlichen,
  Anmeldungen als Gruppen einsehen, Status und Zahlung verwalten,
  Personendaten löschen, CSV-Export
- Nutzbar ab 320 Pixel Breite, mit Tastatur bedienbar

## Was diese Version bewusst noch nicht kann

**Keine Bezahlung.** Eine Anmeldung entsteht mit dem Zahlungsstatus
„offen"; die Bestätigungsseite sagt das offen, statt eine Zahlung
vorzutäuschen.

**Keine automatischen E-Mails.** Auch das steht so auf der
Bestätigungsseite.

**Kein Livebetrieb.** Es gibt noch kein Hosting und keine Domain.

## Datenschutz

Seit der echten Anmeldung **verarbeitet die Seite personenbezogene
Daten** — Namen, E-Mail-Adressen, Telefonnummern und Einwilligungen.
Sie liegen ausschließlich in der Datenbank und sind nur im geschützten
Adminbereich einsehbar. Öffentlich erscheinen ausschließlich **Zahlen**
(freie Plätze), niemals Namen.

Es gibt weiterhin **keine Zählpixel, keine Cookies zu Werbezwecken und
keine Anfragen an fremde Server**; auch die Schriften werden von der
eigenen Domain ausgeliefert. Das einzige Cookie ist das der
Admin-Sitzung — technisch notwendig und damit nicht
einwilligungspflichtig. Deshalb braucht die Seite kein
Zustimmungsfenster. **Bevor daran etwas geändert wird, sollte das Thema
neu geprüft werden.**

Eine Stornierung ist keine Löschung: Sie bleibt gespeichert, damit
Platzzählung und Zahlungsabgleich stimmen. Für das Löschrecht gibt es
im Adminbereich „Personendaten löschen" — dabei werden Kontakt **und
alle Teilnehmer** überschrieben, Betrag und Datum bleiben für die
Buchhaltung erhalten.

Impressum und Datenschutzerklärung sind angelegt, aber noch nicht
ausgefüllt. Beide sollten vor der Veröffentlichung von einer
fachkundigen Person geprüft werden. Dasselbe gilt für AGB und
Widerrufsrecht, sobald online bezahlt wird.

## Noch offen

Datum und Uhrzeit des ersten Events · genaue Adresse · Kontaktdaten ·
Impressumsdaten · eigene Fotos · Hosting · Domain · Bezahlung ·
automatische E-Mails

Die inhaltlichen Lücken sind auf der Seite sichtbar als
**Platzhalter** gekennzeichnet.

## Regeln für die Weiterentwicklung

Die Vorgaben für Backend, Datenbank, Anmeldungen und Bezahlung stehen
in `.claude/skills/event-backend-database/SKILL.md`. Die Vorgaben fürs
Aussehen in `.claude/skills/frontend-design/SKILL.md`.
