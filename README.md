# VERA — Event-Webseite

Webseite für VERA (kurz für **VERA**nstaltung). Erstes Event: ein
Padel-Nachmittag in Falkensee für Schüler, Lehrer und Eltern.

## Starten

```bash
npm install
npm run dev      # Entwicklung, erreichbar unter http://localhost:3000
npm run build    # Prüfen, ob alles fehlerfrei baut
```

## Was du am häufigsten ändern willst

| Was | Wo |
|---|---|
| Datum, Ort, Preise, Plätze | `content/events.ts` |
| Alle Texte | `content/de.ts` |
| Farben, Schriftgrößen, Abstände | `styles/tokens.css` |
| Fotos | `public/images/` (Anleitung liegt dort) |

## Aufbau

```
app/              Die Seiten (/, /anmeldung, /events/… …)
components/       Bausteine (Kopfzeile, Event-Karte, Preisrechner …)
content/          Event-Daten und alle Texte
lib/              preise.ts (Preisberechnung), plaetze.ts (freie Plätze)
styles/           tokens.css (Farben, Schriften), global.css
```

### Zwei Regeln, die wichtig sind

**Preise werden nur an einer Stelle berechnet** — in `lib/preise.ts`.
Sobald Anzeige und Server getrennt rechnen, liefern sie früher oder
später verschiedene Beträge. Bei Geld ist das kein Schönheitsfehler.

**Freie Plätze zählen Personen, nicht Anmeldungen** — siehe
`lib/plaetze.ts`. Eine Familie mit sechs Personen belegt sechs Plätze.

## Was diese Version kann

- Startseite, Event-Detailseite, Für Schulen, Über VERA, FAQ, Kontakt
- Anmeldebereich mit Preisrechner, der live mitrechnet
- Restplatz-Anzeige (erscheint ab 10 freien Plätzen)
- Nutzbar ab 320 Pixel Breite, mit Tastatur bedienbar

## Was diese Version bewusst noch nicht kann

Keine Datenbank, kein Adminbereich, keine Anmeldung, die etwas
speichert, keine Bezahlung. Der Anmeldebereich zeigt den Preis und sagt
offen, dass die Anmeldung noch nicht offen ist — statt ein Formular zu
zeigen, das so aussieht, als würde es funktionieren.

**Es werden keine personenbezogenen Daten verarbeitet.** Es gibt keine
Zählpixel, keine Cookies und keine Anfragen an fremde Server; auch die
Schriften werden von der eigenen Domain ausgeliefert. Deshalb braucht
die Seite kein Zustimmungsfenster. Bevor daran etwas geändert wird,
sollte das Thema neu geprüft werden.

Impressum und Datenschutzerklärung sind angelegt, aber noch nicht
ausgefüllt. Beide sollten vor der Veröffentlichung von einer
fachkundigen Person geprüft werden.

## Noch offen

Datum und Uhrzeit · genaue Adresse · Kontaktdaten · Impressumsdaten ·
eigene Fotos

Diese Stellen sind auf der Seite sichtbar als **Platzhalter**
gekennzeichnet.

## Regeln für die Weiterentwicklung

Die Vorgaben für Backend, Datenbank, Anmeldungen und Bezahlung stehen
in `.claude/skills/event-backend-database/SKILL.md`. Die Vorgaben fürs
Aussehen in `.claude/skills/frontend-design/SKILL.md`.
