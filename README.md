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
| Veranstaltungen: Datum, Ort, Preise, Plätze, **Texte, Abschnitte und Design** | **Im Adminbereich** unter `/admin` |
| Feste Texte der Seite (Navigation, Für-Schulen-Seite, Fragen-Seite) | `content/de.ts` |
| Farben, Schriftgrößen, Abstände | `styles/tokens.css` |
| Aussehen der drei Designs | `styles/themes.css` |
| Titelbild einer Veranstaltung | **Im Adminbereich** hochladen |
| Gründerfoto, Name, Bezeichnung, Beschreibung, Sichtbarkeit | **Im Adminbereich** unter `/admin/einstellungen` |
| Zahlungsstatus einer Anmeldung | **Im Adminbereich** unter Anmeldungen |

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
| `eventInhalte.ts` | Zeilenregeln der Inhaltsblöcke |
| `themes.ts` | Welche Designs es gibt |
| `bilder.ts` | Titelbilder prüfen, umrechnen, ablegen |

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

**Die Anmeldung gehört zur Veranstaltung**, nicht zur Webseite: Sie
liegt unter `/events/<adresse>/anmeldung`. Vorher nahm `/anmeldung`
immer das erste veröffentlichte Event — bei zwei Veranstaltungen hätte
sich jeder für dieselbe angemeldet. `/anmeldung` ohne Angabe leitet auf
die nächste Veranstaltung weiter.

## Designs je Veranstaltung

Beim Anlegen wählst du im Adminbereich das Design der Event-Seite:

| Design | Wofür | Wie es wirkt |
|---|---|---|
| **Standard** | Schüler- und Familienveranstaltungen, Freizeit, Padel, Community | Sandton, ballgelbe Knöpfe, sportlich-offen |
| **Business** | Unternehmer-Events, Networking, Firmenveranstaltungen, Workshops | Fast weiß, Blau trägt alles, sachlich und aufgeräumt |
| **Premium** | Exklusives Networking, VIP- und Abendveranstaltungen | Großes Foto im Kopfbereich, warmes Creme, Champagner-Akzente |

**Nur das Aussehen ändert sich.** Daten, Preise, Plätze und die Anmeldung
sind in jedem Design identisch, und das Design lässt sich jederzeit
umstellen. Kopfzeile, Fußbereich und die rechtlichen Seiten bleiben
überall gleich — man erkennt weiterhin dieselbe Plattform.

Standard und Business benutzen **dieselben Markenfarben**, nur anders
gewichtet. **Premium geht bewusst eigene Wege**: warme Neutraltöne und
Champagner statt des Markenblaus — es soll sich deutlich abheben. Was
alle drei verbindet, ist der Fließtext (Instrument Sans) sowie
Kopfzeile, Fußbereich und die rechtlichen Seiten.

### Premium im Besonderen

Das Titelbild füllt den ganzen Kopfbereich. Damit der Text darüber
**unabhängig vom gewählten Foto** lesbar bleibt, liegt ein dunkler
Verlauf darüber und der Textrahmen bringt einen eigenen leichten
Untergrund mit. Beide Werte sind an den Bildpunkten **gemessen**, nicht
geschätzt: Ohne sie fiel die Überschrift auf 3,2:1 und die goldene
Zeile auf 2,4:1 — nötig sind 4,5:1.

**Champagner-Gold nur für Haarlinien, Rahmen, Knopfflächen und große
Zahlen, niemals für Fließtext.** Auf Creme erreicht es den nötigen
Lesekontrast nicht; als Fläche mit dunkler Schrift dagegen mühelos.

### Ein weiteres Design ergänzen

Drei Schritte, sonst nichts:

1. Wert in `enum EventTheme` in `prisma/schema.prisma` aufnehmen (+ Migration)
2. Eintrag in `THEME_LISTE` in `lib/themes.ts`
3. Block `[data-theme="…"]` in `styles/themes.css`

In `styles/themes.css` werden **nur Design-Variablen** überschrieben —
keine Klassennamen der Bausteine. Deshalb muss kein Baustein angefasst
werden, und es können sich keine Regeln gegenseitig aufheben.

## Titelbilder

Im Adminbereich lädst du je Veranstaltung ein Titelbild hoch — auf dem
iPad öffnet sich dabei die Fotomediathek. Was dabei passiert:

- Die Datei wird **immer neu berechnet**, nie so gespeichert, wie sie
  ankommt. Das ist der wirksamste Schutz: Was sich nicht als Bild
  öffnen lässt, kommt nicht durch, und in einer echten Bilddatei
  eingebetteter Fremdinhalt überlebt das Umrechnen nicht.
- Die **Drehung aus den Aufnahmedaten wird angewendet**, danach werden
  die Metadaten verworfen. Fotos vom iPhone tragen GPS-Koordinaten —
  die haben auf einer öffentlichen Seite nichts verloren.
- Es entstehen **zwei Größen** (1800 und 900 Pixel breit) als WebP,
  damit ein Handy nicht das Desktop-Bild lädt.
- Erlaubt sind JPEG, PNG und WebP bis 10 MB.

Die Dateien liegen **außerhalb von `public/`** in dem Verzeichnis aus
`BILDER_VERZEICHNIS` (Standard `./daten/bilder`) und werden über
`/bilder/…` ausgeliefert.

> **Wichtig für den späteren Livegang:** Bei einem Deployment aus Git
> wird `public/` ersetzt. Deshalb liegen die Bilder daneben.
> `BILDER_VERZEICHNIS` muss beim Hoster auf ein Verzeichnis zeigen, das
> ein Deployment **nicht überschreibt** — sonst sind nach dem nächsten
> Update alle hochgeladenen Bilder weg.

## Bezahlung (Stripe, zurzeit nur Testbetrieb)

Bezahlt wird **auf der gehosteten Seite von Stripe**, nicht auf dieser
Webseite. Kartennummern, Prüfziffern und Bankdaten kommen hier nie an
und werden nirgends gespeichert oder protokolliert. Auf den VERA-Seiten
läuft **kein** Stripe-Skript — der Zustand ohne Zustimmungsfenster
bleibt damit erhalten.

**Der Riegel gegen echte Zahlungen:** `lib/zahlung.ts` weist jeden
Schlüssel ab, der nicht mit `sk_test_` beginnt. Der Echtbetrieb ist
keine vergessene Einstellung, sondern eine bewusste spätere Änderung an
dieser einen Stelle.

### Der Ablauf — EIN Vorgang

Anmeldung und Bezahlung sind für den Besucher **ein** Vorgang. Der Knopf
sagt das auch: **„Jetzt anmelden & bezahlen – 36,00 €"**, mit dem
Betrag der aktuellen Auswahl.

```
Knopf „Jetzt anmelden & bezahlen – 36,00 €"
  → Formular serverseitig prüfen
  → Preis serverseitig NEU berechnen (der Browserwert wird nie gelesen)
  → Plätze prüfen und für 30 Minuten halten (Status „Bezahlung läuft")
  → weiter zur Bezahlseite von Stripe
      ├─ bezahlt      → Rückmeldung an /zahlung/rueckmeldung
      │                 → „Bestätigt" + „Bezahlt", Platz endgültig belegt
      │                 → „Zahlung erfolgreich — deine Anmeldung ist bestätigt"
      └─ abgebrochen  → „Deine Anmeldung ist noch nicht abgeschlossen"
                        + Knopf „Jetzt bezahlen" (ohne neue Dateneingabe)
```

**Es gibt für den Besucher nur zwei Zustände:**

| Lage | Was er liest |
|---|---|
| nicht bezahlt | „Deine Anmeldung ist **noch nicht abgeschlossen**" |
| bezahlt | „**Zahlung erfolgreich** — deine Anmeldung ist bestätigt" (Gruppe: „ihr seid für das Event angemeldet") |

Vor der Bezahlung erscheint **keine** Zwischenbestätigung — ein „Danke,
wir haben deine Anmeldung" würde nach fertig klingen, obwohl nichts fest
ist.

Angeboten werden **Karte, Apple Pay, Google Pay und PayPal**. Apple Pay
und Google Pay sind bei Stripe keine eigenen Zahlarten zum Anschalten,
sondern die Kartenzahlung — auf dem passenden Gerät als Wallet-Knopf.
Freigeschaltet werden deshalb `card` und `paypal`.

### Die 30-Minuten-Reservierung

Eine Anmeldung entsteht mit Status `RESERVIERT` und einem Ablaufdatum
(`reserviertBis`). Der Platz zählt sofort als belegt.

**Läuft die Frist ab, wird nichts gelöscht** — die Anmeldung zählt
einfach nicht mehr mit. Die Regel steht in `lib/plaetze.ts` als
`belegtFilter()` und wird von der öffentlichen Seite, dem Adminbereich
und der Platzprüfung gemeinsam benutzt. Dadurch braucht es **keinen
Aufräumlauf im Hintergrund**, auf den man sich auf geteiltem Hosting
ohnehin nicht verlassen könnte.

Die Reservierung ist eine **technische Sicherung während des Bezahlens**
— keine Anmeldebestätigung und **keine Warteliste**. Sie heißt auf der
Seite deshalb auch nirgends so. (Die echte Wartelistenfunktion für
ausgebuchte Events ist davon unberührt.)

**Vor jedem Zahlungsstart werden die Plätze erneut geprüft** — auch beim
zweiten Anlauf nach einem Abbruch. Reichen sie für die ganze Gruppe
nicht, wird gar keine Bezahlseite erzeugt. Für einen Platz zu bezahlen,
den es nicht mehr gibt, wäre der unangenehmste Fehler.

Kostenlose Events überspringen das: Sie sind sofort bestätigt.

### Zwei Regeln, die nicht verhandelbar sind

1. **Der Zahlungsstatus wird nur durch die Rückmeldung des Anbieters an
   den Server gesetzt.** Eine Rückleitung im Browser kann jeder selbst
   in die Adresszeile tippen. Die Danke-Seite fragt zusätzlich
   serverseitig bei Stripe nach — auch das ist eine Frage vom Server an
   den Anbieter, keine Behauptung aus dem Browser.
2. **Der Betrag kommt aus der Datenbank.** Meldet der Anbieter einen
   anderen Betrag als den bei der Anmeldung eingefrorenen, wird *nicht*
   auf bezahlt gesetzt; der Adminbereich weist den Fall zur Klärung
   aus.

Doppelte Rückmeldungen wirken nicht doppelt: Jede Ereignis-Kennung wird
in `ZahlungsEreignis` vermerkt.

**Keine zwei bezahlbaren Vorgänge für dieselbe Anmeldung.** Wer zweimal
tippt, bekommt **dieselbe** Bezahlseite zurück. Muss eine neue entstehen
(anderer Betrag, alte verfallen), wird die alte vorher mit
`sessions.expire()` geschlossen — sonst bliebe sie über den Link im
Verlauf weiterhin bezahlbar. Der Absende-Knopf sperrt sich zusätzlich
selbst, solange er läuft.

**Wenn die Reservierung abläuft, während das Geld unterwegs ist:** Die
Anmeldung wird trotzdem bestätigt. Einen bezahlten Platz stillschweigend
abzulehnen wäre der schlimmere Fehler. Ist das Event dadurch überbucht,
steht es sichtbar in der Anmeldungsliste.

**Notausgang:** Im Adminbereich eine Anmeldung von Hand auf „Bezahlt"
setzen bestätigt sie zugleich und beendet die Reservierung. Das ist auch
der Weg für Barzahlung und Überweisung.

### Im Adminbereich

Feste Teilnehmer und gehaltene Plätze stehen **getrennt**: Nur bezahlte
Anmeldungen sind feste Teilnehmer. Für die Kapazität zählt die Summe aus
beidem — sonst würde ein laufender Bezahlvorgang doppelt verkauft.

| Lage | Marke |
|---|---|
| bezahlt und bestätigt | **Bestätigt** |
| Reservierung läuft | **Bezahlung läuft**, dazu die Ablaufzeit |
| Reservierung abgelaufen, unbezahlt | **Nicht abgeschlossen** |

### Einrichten

Die Klick-für-Klick-Anleitung — Konto anlegen, Testmodus, PayPal an,
Link aus, Testschlüssel, Webhook, Auszahlungskonto — steht in
**[docs/stripe-einrichten.md](docs/stripe-einrichten.md)**.

Ob alles hinterlegt ist, beantwortet:

```
npm run zahlung:pruefen
```

Der Befehl prüft Schlüssel, Webhook-Geheimnis und öffentliche Adresse
auf Vollständigkeit und Plausibilität, **ohne das Netz zu berühren** —
er lässt sich also auch auf dem Server gefahrlos laufen. Einen
Schlüssel gibt er nie im Klartext aus: Ausgaben landen in
Protokolldateien, und ein Protokoll ist kein sicherer Ort für ein
Geheimnis.

### Was noch offen ist

Ein echter Durchlauf mit einer Stripe-Testkarte braucht eine von außen
erreichbare Adresse für die Rückmeldung — also das Hosting. Zwei Dinge
gehen ohne sie nicht: Stripe kann keinen Webhook zustellen, und aus der
Entwicklungsumgebung heraus ist `api.stripe.com` netzseitig gesperrt
(gemessen, nicht vermutet).

Geprüft sind deshalb alle **eigenen** Teile — Unterschrift, doppelte
Meldungen, Betragsabgleich, fehlgeschlagene Zahlung, Reservierungsablauf,
Doppelklick, zweiter Anlauf, Testmodus-Riegel — gegen eine örtliche
Attrappe des Anbieters. Der Klick durch Stripes echte Bezahlseite bleibt
bis zum Hosting offen.

## Der Gründerbereich

Foto, Name, Bezeichnung und Beschreibungstext gehören zu VERA und nicht
zu einer einzelnen Veranstaltung. Sie stehen deshalb **einmal** in der
Tabelle `Einstellungen` (genau eine Zeile mit der Kennung `global`) und
werden im Adminbereich unter **Gründerbereich** gepflegt.

| Was | Wo |
|---|---|
| Foto hochladen oder entfernen | `/admin/einstellungen` |
| Name und Bezeichnung | `/admin/einstellungen` |
| Beschreibungstext | `/admin/einstellungen` |
| Auf der VERA-Startseite anzeigen | `/admin/einstellungen`, Häkchen unten |
| Auf **einer** Eventseite anzeigen | im jeweiligen Event, Abschnitt **Design** |

Das Foto durchläuft dieselbe Verarbeitung wie ein Titelbild (siehe
oben): neu berechnet, Metadaten und GPS entfernt, zwei Größen, Ablage
außerhalb von `public/`.

Voreingestellt ist der Bereich auf der Startseite **an** und auf jeder
Eventseite **aus** — bestehende Veranstaltungen sehen dadurch
unverändert aus, bis der Haken bewusst gesetzt wird.

Solange kein Beschreibungstext hinterlegt ist, erscheint ein sichtbar
markierter Platzhalter. Das ist Absicht: Ein Platzhalter, den man für
echten Inhalt halten kann, geht irgendwann versehentlich online.

## Abschnitte einer Veranstaltung

Die Texte auf der Event-Seite gehören zum Event, nicht zur Webseite.
Im Adminbereich gibt es dafür vier Abschnitte: **Vorstellung**,
**Ablauf**, **Hinweise** und **Häufige Fragen**. Jeder erscheint nur,
wenn Text darin steht.

Eine Zeilenregel gilt in allen Abschnitten:

| Zeile beginnt mit | Ergebnis |
|---|---|
| `- ` | ein Aufzählungspunkt mit Häkchen |
| `* 20 × 10 \| Meter Platz` | eine Zahlenkachel |
| `> Mehr erfahren \| /fuer-schulen` | ein Knopf (nur seiteneigene Ziele) |
| sonst | Fließtext; eine Leerzeile trennt zwei Absätze |

Bei **Ablauf** und **Häufige Fragen** wird stattdessen an den
senkrechten Strichen geteilt: `Titel | Text` bzw. `Frage | Antwort`.
Beim Ablauf ist auch `19:00 | Titel | Text` möglich — im
Business-Design wird daraus eine Zeitschiene.

## Was diese Version kann

- Zentrale Event-Übersicht, volle Event-Seite je Veranstaltung,
  Für Schulen, Über VERA, FAQ, Kontakt
- **Echte Anmeldung**: Preis serverseitig berechnet, Plätze in einer
  Transaktion geprüft, Duplikatsschutz, Bot-Falle, Bremse gegen
  Massen-Einsendungen
- **Verwaltung** unter `/admin`: Events anlegen und veröffentlichen,
  Design und Abschnitte festlegen, Vorschau ansehen, Anmeldungen als
  Gruppen einsehen, Status und Zahlung verwalten, Personendaten
  löschen, CSV-Export
- **Drei Designs** je Veranstaltung (siehe oben)
- **Gründerbereich** mit Foto, auf der Startseite und je Event
  einschaltbar
- **Durchgehend responsiv**, nutzbar ab 320 Pixel Breite, mit Tastatur
  bedienbar. Nachgemessen wurde nicht stichprobenweise, sondern
  fließend: 16 Seiten in allen drei Designs, 320 bis 1920 Pixel in
  10-Pixel-Schritten, dazu drei Fensterhöhen — 7728 Messungen. Geprüft
  wird dabei auf vier Dinge:

  | Was | Warum |
  |---|---|
  | seitliches Schieben | die naheliegende Prüfung |
  | abgeschnittene Inhalte | eine Fläche mit `overflow: hidden` schneidet sauber weg — die Seite scrollt nicht, der Inhalt fehlt trotzdem |
  | überlappende Elemente | Text, der auf Text liegt |
  | Tippziele und Schriftgrößen | mindestens 44 Pixel bzw. 12 Pixel auf Touch-Breiten |

  Ergebnis: null Funde. Zusätzlich geprüft: Handy im Querformat, flache
  Fenster und das aufgeklappte Menü.

  **Lange deutsche Wörter** sind dabei der eigentliche Gegner —
  Eventtitel kommen aus der Datenbank und können beliebig lang sein.
  Zwei Regeln fangen das ab: `overflow-wrap: anywhere` verhindert jeden
  Überlauf, und Überschriften mit Inhalten aus der Datenbank bekommen
  eine Obergrenze in `cqi`, die ihre Schriftgröße an die Breite ihrer
  eigenen Spalte bindet (Event-Karte, Ablauf-Schritte, Titel der
  Detailseite, Abschlussblock).

## Was diese Version bewusst noch nicht kann

**Kein Echtbetrieb bei der Bezahlung.** Die Anbindung an Stripe steht,
läuft aber ausschließlich im Testmodus (siehe oben). Es fließt kein
echtes Geld.

**Keine automatischen E-Mails.** Auch das steht so auf der
Bestätigungsseite.

**Kein Livebetrieb.** Es gibt noch kein Hosting und keine Domain.

## Lange deutsche Wörter

Die Überschriftenschrift läuft breit — „Veranstaltungen“ ist darin
369 Pixel breit und passt damit auf kein Handy unter 389 Pixel. Ohne
Gegenmaßnahme ragt so ein Wort aus der Seite heraus und man kann sie
seitwärts schieben.

Zwei Dinge verhindern das (`styles/global.css`, bei `h1, h2, h3, h4`):

- `hyphens: auto` trennt sauber mit Bindestrich. Das funktioniert, weil
  `<html lang="de">` gesetzt ist.
- `overflow-wrap: break-word` ist die Rückfallebene für Browser ohne
  deutsche Trennregeln.

Zusätzlich stehen in `content/de.ts` an drei Stellen **weiche
Trennstriche** (`U+00AD`, unsichtbar). Sie sagen dem Browser, wo er
trennen darf, falls er keine Trennregeln kennt. Wichtig dabei:

- Nur bei Wörtern, die auf **jedem** Handy zu breit sind. Ein weicher
  Trennstrich ist auch eine Erlaubnis — bei einem Wort, das ohnehin
  passt, trennt der Zeilenausgleich dann ohne Not.
- Im Seitentitel haben sie nichts verloren (Browser-Tab, Lesezeichen,
  Suchmaschinen). Dafür gibt es `ohneTrennstellen()` in
  `lib/formate.ts`.

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

## Prüfungen

Rund 350 automatische Prüfungen laufen gegen die echte Datenbank und
den echten Server — nicht gegen nachgebaute Logik. Sie liegen in
`pruefung/`; wie man sie startet, steht in
**[docs/pruefen.md](docs/pruefen.md)**.

```bash
bash pruefung/alle.sh          # alles, rund zehn Minuten
npm run typen                  # TypeScript prüfen
npm run build                  # bauen
npm run zahlung:pruefen        # Zahlungs-Einrichtung prüfen (ohne Netz)
```

Einen eigenen Linter gibt es bewusst nicht: `next lint` wurde in
Next 16 entfernt, und ESLint wäre eine weitere Abhängigkeit in einem
Projekt, das mit acht auskommt. Geprüft wird über TypeScript im
strengen Modus, den Bau und die Prüflisten.

## Beim Deployment beachten

- **Node ab 20.9** — steht als `engines` in der `package.json`, weil
  Next 16 es verlangt. Beim Hoster die Version entsprechend einstellen.
- **`npm ci` muss die devDependencies mitinstallieren.** Der
  `postinstall`-Schritt ruft `prisma generate` auf, und die
  Prisma-**CLI** ist eine devDependency. Mit `--omit=dev` bricht die
  Installation ab. Setze dabei `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` —
  Playwright gehört zu den Prüfungen und braucht auf dem Server keinen
  Browser:

  ```bash
  PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci
  ```
- **Migrationen mit `npm run db:deploy`**, niemals mit `db:migrate`.
  `prisma migrate dev` ist der Entwicklungsbefehl und kann Daten
  zurücksetzen; `migrate deploy` wendet nur an, was vorliegt.
- **`BILDER_VERZEICHNIS`** auf einen Ordner zeigen lassen, den ein
  Deployment nicht überschreibt (siehe oben unter Titelbilder).
- **Bekannte Meldung von `npm audit`:** drei Einträge mit hoher
  Einstufung in `deepmerge-ts → @prisma/config → prisma`. Das betrifft
  ausschliesslich die **Prisma-CLI** (devDependency, läuft beim Bauen),
  nicht die ausgelieferte Anwendung. `npm audit fix --force` würde auf
  Prisma 6 zurückstufen und das Projekt brechen — also nicht ausführen.
  Zu beobachten, bis Prisma nachzieht.

## Rechtliche Seiten

Impressum, Datenschutz, AGB sowie Widerruf und Stornierung sind als
**sichtbar gekennzeichnete Platzhalter** vorhanden und aus dem
Fussbereich jeder Seite erreichbar. Was davon fertig ist, was du
selbst ausfüllen kannst und was fachkundig geprüft gehört, steht in
**[docs/rechtliches.md](docs/rechtliches.md)**.

Zwei Punkte daraus, weil sie leicht übersehen werden:

- Die Seite heisst **„Widerruf und Stornierung"**, nicht
  „Widerrufsbelehrung", und enthält bewusst **keine** Standardbelehrung.
  Bei Freizeitveranstaltungen zu einem festen Termin kann das
  Widerrufsrecht nach § 312g Abs. 2 Nr. 9 BGB ausgeschlossen sein — die
  Frage gehört beantwortet, bevor Tickets verkauft werden.
- Die Angabe **„inkl. MwSt."** steht an fünf Stellen, eine davon auf
  der Bezahlseite. Ob sie zutrifft, hängt an der Gewerbeanmeldung
  (§ 19 UStG). Fundstellen in `docs/rechtliches.md`.

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
