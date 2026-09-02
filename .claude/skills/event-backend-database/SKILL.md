---
name: event-backend-database
description: Verbindliche Architektur-, Sicherheits- und Betriebsvorgaben für Backend, Datenbank, Event-Anmeldungen, Gruppen-Anmeldungen, Bezahlung, Adminbereich und den Produktivbetrieb der VERA-Event-Webseite. Diesen Skill IMMER konsultieren bei Aufgaben zu Datenbank-Design, Migrationen, Teilnehmer-Anmeldungen, Preisberechnung, Platzzählung, Bezahlung und Webhooks, Wartelisten, Adminbereich, Authentifizierung, Sessions, CSRF, Datei-Uploads, Rate-Limiting, Sicherheits-Kopfzeilen, Secrets, Datenschutz/DSGVO sowie zu Server, Nginx, systemd, Firewall, Deployment, Rollback, Sicherungen, Überwachung und dem Livegang auf dem Hostinger-KVM-2-VPS. Gilt für alle Backend- und Betriebsaufgaben dieser Webseite, auch wenn der Nutzer nur "Anmeldung bauen", "Admin-Login", "Preis berechnen", "Teilnehmerliste", "deployen" oder "Server einrichten" sagt.
---

# Event-Backend & Datenbank

Dieser Skill legt fest, wie Backend, Datenbank, Event-Anmeldungen, Bezahlung und der
Adminbereich dieser Event-Webseite gebaut werden.

Der Nutzer ist Programmier-Anfänger und entwickelt hauptsächlich über Claude Code im Browser
auf einem iPad + GitHub.

**Stand des Projekts.** Die Webseite ist gebaut und wird produktiv gesetzt — sie ist kein
leeres Blatt mehr. Vorhanden und automatisiert geprüft sind: Datenbank, echte Anmeldung mit
serverseitiger Preisberechnung, Adminbereich mit Login, Bild-Upload, Gründerbereich, drei
Design-Themes und die Zahlung über Stripe **im Testmodus**. Offen sind E-Mail-Versand,
Sicherungen, Überwachung, die Rechtstexte und die Freischaltung echter Zahlungen.

Wer in diesem Skill eine Regel liest, die etwas als „später" oder „noch nicht entschieden"
beschreibt, prüft zuerst im Projekt nach, ob es inzwischen gebaut ist. **Nichts neu bauen, was
schon existiert.**

**Die Seite ist einsprachig deutsch.** Eine frühere Fassung war zweisprachig (DE/EN); der
Nutzer hat sich bewusst für Deutsch allein entschieden, `content/en.ts`, der Sprachumschalter
und die `[locale]`-Ebene wurden entfernt. Die englischen Texte stehen weiterhin in der
Git-Historie und wären wiederherstellbar. Ohne ausdrücklichen neuen Auftrag wird **keine**
Zweisprachigkeit eingebaut.

Grundprinzip: Bei jeder Aufgabe die einfachste, wartbare, sichere und Hostinger-kompatible
Lösung wählen. Keine unnötigen Frameworks, Dienste oder Abhängigkeiten. Bestehenden Code nicht
unnötig verändern.

---

## 1. Tech-Stack

> **Historisch:** Frühere Fassungen dieses Skills gingen von einem geteilten Hostinger-Tarif
> („Unlimited") aus. Diese Annahme ist **überholt** — sie scheiterte daran, dass ohne
> gesicherten Zugang zu einer Kommandozeile weder die Datenbanktabellen noch der erste
> Admin-Zugang entstehen können. Der Betrieb läuft auf einem eigenen Server.

**Die Zielumgebung ist ein selbstverwalteter Hostinger KVM 2 VPS mit Ubuntu 24.04 LTS**
(EU-Standort). Damit gilt verbindlich:

- Framework: **Next.js 16** (App Router) — Frontend und Backend in einem Projekt.
- Laufzeit: **Node.js 20.9 oder neuer** (in `package.json` unter `engines` festgeschrieben).
- Datenbank: **MariaDB** (MySQL-kompatibel), auf demselben Server.
- DB-Zugriffsschicht: **Prisma 7** mit Treiber-Adapter (`@prisma/adapter-mariadb`) — ab
  Prisma 7 ist ein Adapter Pflicht.
- Prisma wird für Migrationen, strukturierte Zugriffe und typsichere Abfragen verwendet.
- Betrieb als **systemd**-Dienst hinter **Nginx** als Reverse Proxy (Einzelheiten in §13).

Diese Wahl ist getroffen und wird nicht ohne Auftrag revidiert.

Falls sich eine Annahme als falsch herausstellt oder eine vorgesehene Technologie nicht
vollständig unterstützt wird, den Nutzer vor einer Änderung informieren und die einfachste
Alternative erklären.

Nicht ungefragt auf einen komplett anderen Stack wechseln, z.B. PHP, MongoDB oder eine
separate Backend-API.

---

## 2. Datenbankstruktur

Die Struktur besteht aus **drei** Ebenen. Der häufigste Fehler wäre, eine Anmeldung mit einer
Person gleichzusetzen — das ist hier ausdrücklich nicht der Fall.

- `Event` — die Veranstaltung
- `Registration` — **eine Anmeldung/Buchung**, gemacht von einer anmeldenden Person
- `Participant` — **eine teilnehmende Person**, gehört zu genau einer Anmeldung

Eine Anmeldung kann mehrere Teilnehmer enthalten, z.B. 2 Erwachsene und 4 Schüler in einer
einzigen Familienbuchung.

Weitere Vorgaben:

- Niemals Event-, Anmelde- und Teilnehmerdaten unstrukturiert in derselben Tabelle mischen.
- Eindeutige IDs verwenden.
- Bei öffentlich sichtbaren IDs bevorzugt cuid() oder uuid() bzw. eine vergleichbar sichere
  Lösung verwenden. Keine fortlaufenden Zahlen nach außen geben.
- Datenbankänderungen über nachvollziehbare Migrationen durchführen.
- Produktionsdatenbank nicht unkontrolliert manuell verändern.
- Alle Datenbankzugriffe über eine zentrale, klar strukturierte Datenbank-Schicht organisieren,
  z.B. lib/db.ts.
- Keine unnötig verstreuten direkten Datenbankzugriffe in einzelnen Seiten oder Komponenten.
- Schema so gestalten, dass später neue Funktionen und weitere Event-Arten ergänzt werden
  können, ohne bestehende Daten unnötig zu gefährden.

### Geldbeträge

**Geldbeträge immer als ganze Zahl in Cent speichern und berechnen, niemals als Kommazahl.**

Kommazahlen (Float/Double) rechnen minimal ungenau. Bei Geld führt das zu Beträgen wie
29,999999 € und zu Summen, die nicht aufgehen. Also `priceCents: 700` statt `price: 7.00`.
Erst bei der Anzeige in Euro umrechnen und formatieren.

### Beispiel-Datenmodell

```
Event
- id
- slug                      (für die Adresse der Detailseite)
- category                  ("sport" | "business" | ... – für spätere Event-Arten)
- title, description
- startAt, endAt
- locationName, street, postalCode, city
- maxParticipants           (Anzahl PERSONEN, optional, null = unbegrenzt)
- lowSeatsThreshold         (ab wie wenigen freien Plätzen die Zahl angezeigt wird)
- priceStudentCents         (z.B. 700)
- priceAdultCents           (z.B. 1400)
- familyEnabled             (gibt es ein Familienpaket?)
- familyBasePriceCents      (z.B. 3000)
- familyIncludedAdults      (z.B. 2)
- familyIncludedStudents    (z.B. 1)
- familyExtraStudentCents   (z.B. 600)
- familyMaxStudents         (z.B. 6)
- minAge, maxAge            (optional)
- published
- createdAt

Registration                (= eine Anmeldung, kann mehrere Teilnehmer enthalten)
- id
- eventId
- contactFirstName, contactLastName
- contactEmail
- contactPhone              (optional)
- bookingType               ("single" | "family")
- isGuardianBooking         (meldet für mindestens eine minderjährige Person an)
- consentGuardian           (Pflicht-Einwilligung, wenn Minderjährige dabei sind)
- consentPhotos             (freiwillig, getrennt)
- status                    ("confirmed" | "waitlist" | "cancelled")
- totalPriceCents           (berechnet, zum Zeitpunkt der Anmeldung eingefroren)
- paymentStatus             (siehe Abschnitt 4)
- paymentMethod             (siehe Abschnitt 4)
- registeredAt
- reactivatedAt             (optional)
- cancelledAt               (optional)

Participant                 (= eine teilnehmende Person)
- id
- registrationId
- firstName, lastName
- type                      ("student" | "adult")
- birthYear                 (optional)
```

Der eingefrorene `totalPriceCents` ist wichtig: Ändert der Veranstalter später den Eventpreis,
darf sich der Betrag einer bereits erfolgten Anmeldung nicht rückwirkend verändern.

---

## 3. Event-Anmeldungen

### Pflichtangaben der anmeldenden Person

- Vorname
- Nachname
- E-Mail-Adresse

Optional: Telefonnummer.

### Pflichtangaben je Teilnehmer

- Vorname
- Nachname
- Typ (Schüler oder Erwachsener)

Optional: Geburtsjahr bzw. Alter.

### Gruppen-Anmeldungen

Eine Anmeldung enthält **einen oder mehrere** Teilnehmer.

- Die anmeldende Person kann selbst Teilnehmer sein, muss es aber nicht (z.B. ein Elternteil,
  das nur das Kind anmeldet).
- Die Teilnehmer einer Anmeldung bleiben dauerhaft zusammen sichtbar. Eine Gruppenbuchung darf
  niemals in mehrere unabhängige Anmeldungen zerlegt werden — der Veranstalter muss erkennen
  können, dass diese Personen gemeinsam kommen.
- Im Adminbereich erscheint eine Gruppe als **eine** Zeile, aufklappbar zu ihren Teilnehmern,
  mit Personenanzahl und Gesamtpreis.

### Teilnehmerzahl und freie Plätze

**Die belegten Plätze werden über Teilnehmer gezählt, niemals über Anmeldungen.**

```
belegte Plätze = Summe aller Participant-Einträge, deren Registration entweder
                   bestätigt ist
                 ODER eine Reservierung mit noch NICHT abgelaufener Frist hat
```

Eine Familie mit 6 Personen belegt 6 Plätze, nicht einen. Würde man Anmeldungen zählen, zeigte
die Seite noch freie Plätze an, während die Anlage längst voll ist — ein Fehler, der erst am
Veranstaltungstag auffällt.

Anmeldungen auf der Warteliste oder mit Status storniert zählen nicht als belegte Plätze.

**Die Reservierung gehört zwingend in die Zählung.** Seit der Online-Zahlung entsteht eine
Anmeldung zunächst als *reserviert*: Der Platz wird gehalten, während der Besucher bezahlt.
Zählte man nur die bestätigten, verkaufte man denselben Platz mehrfach an alle, die gerade
gleichzeitig an der Bezahlseite stehen.

**Abgelaufene Reservierungen werden nicht aufgeräumt, sie zählen einfach nicht mehr mit.** Die
Frist wird beim Lesen ausgewertet. Dadurch braucht es **keinen Hintergrund- oder Cron-Lauf** —
ein bewusster Vorteil, weil ein zuverlässig laufender Zeitplan zusätzliche Betriebsarbeit wäre.

**Diese Regel steht an genau einer Stelle im Code** (`lib/plaetze.ts` → `belegtFilter()`) und
wird von der öffentlichen Anzeige, dem Adminbereich und der Anmeldung gemeinsam benutzt. Eine
zweite, abweichende Zählung an anderer Stelle wäre der Weg in die Überbuchung.

### Anzeige der Restplätze

- Solange viele Plätze frei sind: keine Zahl anzeigen.
- Ab `lowSeatsThreshold` freien Plätzen oder weniger: die exakte Zahl anzeigen
  ("Nur noch 10 freie Plätze"), die mit jeder Anmeldung sinkt.
- Bei 0 freien Plätzen: "Ausgebucht".
- Die Schwelle ist ein Wert am Event, nicht fest im Code verdrahtet.

### Preisberechnung

**Die Preisberechnung gehört an genau eine Stelle im Code** (z.B. `lib/preise.ts`) und wird von
der Anzeige im Browser und vom Backend gemeinsam genutzt.

Zwei getrennte Rechenwege würden früher oder später unterschiedliche Beträge liefern — der
Besucher sieht dann einen anderen Preis, als tatsächlich berechnet wird. Das ist bei Geld ein
ernstes Problem.

**Der im Browser angezeigte Preis ist immer nur eine Vorschau.** Der verbindliche Betrag wird
beim Absenden erneut serverseitig berechnet. Ein aus dem Browser mitgeschickter Preis darf
niemals ungeprüft übernommen werden — sonst kann jemand den Betrag manipulieren.

Berechnungsregeln:

- Einzelbuchung: je Teilnehmer der Preis seines Typs (Schüler oder Erwachsener).
- Familienpaket: Grundpreis für die enthaltenen Personen, danach ein günstigerer Preis je
  weiterem Schüler, begrenzt durch `familyMaxStudents`.
- Alle Preise inklusive Mehrwertsteuer ausweisen.

### Duplikatsschutz

Der Duplikatsschutz gilt auf **Anmeldungs-Ebene**, nicht auf Teilnehmer-Ebene.

Für dieselbe E-Mail-Adresse und dasselbe Event darf es nicht mehrere parallele aktive
Anmeldungen geben. Eine aktive Anmeldung mit Status `confirmed` oder `waitlist` darf nicht
doppelt angelegt werden.

Wer nachträglich weitere Personen mitbringen möchte, **ergänzt die bestehende Anmeldung**,
statt eine zweite anzulegen. Dabei muss erneut geprüft werden, ob noch genügend Plätze frei
sind, und der Gesamtpreis neu berechnet werden.

Wenn bereits eine Anmeldung für dieselbe E-Mail-Adresse und dasselbe Event existiert und deren
Status `cancelled` ist, soll bei einer erneuten Anmeldung nach Möglichkeit derselbe Datensatz
reaktiviert bzw. aktualisiert werden, statt einen zweiten anzulegen.

Dabei:

- Status wieder passend auf `confirmed` oder `waitlist` setzen.
- `cancelledAt` zurücksetzen und `reactivatedAt` sauber dokumentieren.
- Datenbank-Constraint und Anwendungslogik müssen miteinander vereinbar sein. In MySQL gibt es
  keine Teil-Indizes wie in PostgreSQL — die Eindeutigkeit muss daher so modelliert werden,
  dass stornierte Anmeldungen eine spätere erneute Anmeldung technisch **nicht blockieren**.
  Die Lösung soll einfach, wartbar und mit MySQL/Prisma kompatibel bleiben.

### Warteliste

Die Warteliste bleibt im Datenmodell erhalten (Status `waitlist`), wird aber nur angezeigt und
genutzt, wenn der Nutzer es ausdrücklich wünscht. Für das erste VERA-Event ist sie **nicht**
sichtbar.

Nach einer Stornierung muss prüfbar sein, ob Personen von der Warteliste nachrücken können.
Wichtig: Es muss ein Platz für die **gesamte** wartende Anmeldung frei sein — eine
vierköpfige Familie kann nicht teilweise nachrücken.

### Spätere Funktionen

Die Architektur so vorbereiten, dass später ohne unnötigen Umbau ergänzt werden können:

- Bestätigungsmails
- Stornierungs-/Abmeldefunktion
- automatische Wartelisten-Nachrückung
- CSV-Export der Teilnehmerliste
- Sammelbuchung durch Schulen (eine Lehrkraft meldet eine Klasse an)

Der CSV-Export soll über eine klar abgegrenzte Funktion/Route im geschützten Adminbereich
erfolgen und keinen externen Dienst benötigen. Er muss Gruppen sinnvoll abbilden: eine Zeile je
Teilnehmer, mit der zugehörigen Anmeldung als Spalte.

---

## 4. Bezahlung und Bestellungen

Eine Anmeldung ist noch keine Bezahlung. **Anmeldestatus und Zahlungsstatus werden getrennt
geführt** — jemand kann angemeldet, aber noch nicht bezahlt haben.

```
paymentStatus   "unpaid" | "paid" | "refunded" | "partially_refunded"
paymentMethod   "onsite" | "transfer" | "online"
```

> **Zu den Namen in diesem Skill:** Feld- und Statusnamen beschreiben hier das **fachliche
> Modell**. Die Umsetzung benutzt durchgehend **deutsche** Namen (`zahlungsStatus` mit
> `OFFEN`/`BEZAHLT`/`ERSTATTET`, `Registration.teilnehmer` usw.) und kennt zusätzlich den
> Anmeldestatus *reserviert*. Verbindlich ist die **Bedeutung**, nicht die Schreibweise; die
> gültigen Namen stehen in `prisma/schema.prisma`.

### Drei Wege, aufsteigend nach Aufwand

**a) Zahlung vor Ort (`onsite`)** — der einfachste Weg
Anmeldung läuft online, bezahlt wird am Veranstaltungstag. Braucht keinen externen Dienst,
keine Gebühren, keine Zahlungsabwicklung im Code. Für lokale Events mit überschaubarer
Teilnehmerzahl völlig üblich und mit Abstand am schnellsten umsetzbar. Der Adminbereich braucht
dafür nur die Möglichkeit, eine Anmeldung als bezahlt zu markieren.

**b) Zahlung per Überweisung (`transfer`)**
Nach der Anmeldung erhält die Person Bankverbindung und einen eindeutigen Verwendungszweck.
Braucht nur die Bankverbindung, aber manuellen Abgleich der Zahlungseingänge.

**c) Online bezahlen (`online`)**
Braucht einen Zahlungsanbieter mit Gebühren pro Ticket, dazu AGB, Preisangabenpflichten und
Steuerklärung. Deutlich mehr Aufwand.

**Vor Einführung eines Zahlungsanbieters oder eines anderen kostenpflichtigen Dienstes: den
Nutzer informieren, Nutzen und Kosten erklären und Zustimmung einholen.** Nicht eigenmächtig
einen Anbieter auswählen und einbauen.

> **Entschieden und gebaut:** Der Nutzer hat sich nach dem Anbietervergleich für **Stripe** und
> den Weg **online bezahlen** entschieden. Freigeschaltet sind `card` und `paypal`; Apple Pay
> und Google Pay sind **keine eigenen Zahlarten**, sondern die Kartenzahlung, die auf dem
> jeweiligen Gerät so erscheint. Die Anbindung steht vollständig — **im Testmodus**.
> Die Wege `onsite` und `transfer` bleiben im Datenmodell erhalten und sind weiterhin gültig,
> etwa für ein Event ohne Online-Zahlung. Sie sind nicht überholt, nur nicht der Standardweg.

### Die Zahlart-Liste ist tragend

Die angeforderten Zahlarten sind **fest** hinterlegt, nicht automatisch aus dem Dashboard
übernommen. Das ist Absicht (volle Kontrolle darüber, was der Besucher sieht), hat aber eine
Folge, die man kennen muss: **Ist eine der angeforderten Zahlarten beim Anbieter nicht
aktiviert, lehnt er die Erzeugung der Bezahlseite komplett ab** — dann funktioniert *gar keine*
Zahlung, auch nicht mit Karte. Wer die Liste ändert, prüft beides: Konto und Code.

### Sicherheitsregeln bei Online-Zahlung

Diese Regeln sind nicht verhandelbar:

- **Zahlungsdaten dürfen die eigene Seite niemals berühren.** Keine Kartennummern, keine
  Prüfziffern, keine Bankdaten entgegennehmen, weiterleiten, protokollieren oder speichern.
- Ausschließlich die **gehostete Bezahlseite des Anbieters** verwenden. Die Besucher werden
  dorthin geleitet und kommen danach zurück. Nur so bleibt die Haftung beim Anbieter.
- Der Zahlungsstatus wird **nur** durch die Rückmeldung des Anbieters an den Server gesetzt,
  niemals durch eine Weiterleitung im Browser. Eine Browser-Rückleitung lässt sich fälschen.
- Diese Rückmeldungen müssen auf Echtheit geprüft werden (Signatur des Anbieters).
- Rückmeldungen können mehrfach eintreffen. Die Verarbeitung muss so gebaut sein, dass eine
  doppelt empfangene Meldung **nicht** doppelt wirkt.
- Zugangsdaten des Zahlungsanbieters ausschließlich über Umgebungsvariablen, niemals im
  Quellcode.
- **Die Signatur wird über den ROHTEXT der Anfrage geprüft.** Ein bereits eingelesener und in
  ein Objekt umgewandelter Körper hat eine andere Byte-Folge — die Prüfung wäre dann wertlos,
  ohne dass irgendetwas kaputt aussieht. Genau diese Falle macht Signaturprüfungen unwirksam.
- **Betragsabgleich:** Stimmt der vom Anbieter gemeldete Betrag nicht mit dem gespeicherten
  überein, wird die Anmeldung **nicht** auf bezahlt gesetzt, sondern zur Klärung ausgewiesen.
  Ein abweichender Betrag ist entweder ein Fehler oder ein Angriff; beides gehört angesehen.
- **Kein zweiter offener Bezahlvorgang je Anmeldung.** Vor dem Erzeugen einer neuen Sitzung
  wird eine vorhandene offene wiederverwendet oder beim Anbieter geschlossen. Zwei offene
  Vorgänge sind zwei mögliche Abbuchungen.
- **Vor jedem Zahlungsstart erneut prüfen, ob noch Plätze frei sind** — auch beim zweiten
  Anlauf nach einem Abbruch. Sonst bezahlt jemand für einen Platz, den es nicht mehr gibt.
- **Ist bezahlt worden, gilt die Zahlung** — auch wenn die Reservierung inzwischen abgelaufen
  und das Event voll ist. Geld ist geflossen; einen bezahlten Platz stillschweigend abzulehnen
  wäre der schlimmere Fehler. Die Überbuchung wird im Adminbereich sichtbar ausgewiesen.

### Test- und Echtbetrieb strikt trennen

- Im Code liegt ein **Riegel**, der jeden Schlüssel abweist, der kein Testschlüssel ist. Der
  Echtbetrieb ist damit keine vergessene Einstellung, sondern eine **bewusste Änderung**.
- **Echte Zahlungen werden als letzter Schritt vor dem Livegang freigeschaltet** — erst nachdem
  der vollständige Ablauf mit Testschlüsseln durchgespielt wurde: erfolgreiche Zahlung,
  Abbruch, fehlgeschlagene Karte, zweiter Anlauf und die echte Zustellung der Rückmeldung.
- Diesen Riegel niemals „zum Testen" entfernen oder aufweichen.

### Stornierung und Rückerstattung

Von Anfang an mitdenken, auch wenn zunächst manuell erledigt:

- Wer storniert, unter welchen Bedingungen, bis wann
- Wird der Betrag ganz, teilweise oder gar nicht erstattet
- Rückerstattungen im Zahlungsstatus nachvollziehbar festhalten

### Rechtliches

Sobald Geld fließt, sind Impressum, Datenschutzerklärung und AGB Pflicht. Preise müssen inkl.
Mehrwertsteuer als Gesamtpreis ausgewiesen werden. Der Nutzer ist darauf hinzuweisen, dass
Impressum, AGB und Steuerfragen fachkundig geprüft werden sollten — Claude ist kein Anwalt und
darf keine Rechtsberatung als solche darstellen.

---

## 5. Spam- und Missbrauchsschutz

Keinen Captcha-Drittanbieter einbauen, solange dies nicht notwendig ist.

Zunächst einfache Maßnahmen berücksichtigen:

### Honeypot

- Unsichtbares zusätzliches Formularfeld verwenden.
- Bots, die dieses Feld ausfüllen, serverseitig erkennen.
- Solche Anmeldungen verwerfen.
- Dem Bot nicht ausdrücklich mitteilen, dass er durch eine Bot-Falle erkannt wurde.

### Rate-Limiting

- Anmeldungen pro IP-Adresse und/oder E-Mail-Adresse innerhalb eines sinnvollen Zeitfensters
  begrenzen.
- Ein möglicher Ausgangswert wäre beispielsweise maximal 5 Anmeldeversuche pro IP-Adresse pro
  Stunde. Der konkrete Wert soll später bei Bedarf angepasst werden können.

Wichtig:

- In-Memory-Rate-Limiting darf nur für Entwicklung und Tests verwendet werden.
- Für die produktive Hostinger-Umgebung nicht davon ausgehen, dass In-Memory-Zähler
  Server-Neustarts überstehen.
- Falls eine einfache DB-basierte Rate-Limiting-Lösung über die vorhandene MySQL-Datenbank
  sinnvoll und sicher umgesetzt werden kann, diese bevorzugt prüfen.
- Bevor Redis, Upstash, Cloudflare oder ein anderer externer bzw. kostenpflichtiger Dienst
  eingeführt wird, den Nutzer informieren, Nutzen/Kosten erklären und Zustimmung einholen.

### Die echte Besucher-IP hinter dem Reverse Proxy

Eine Bremse ist nur so verlässlich wie die Kennung, auf die sie zählt. Im Betrieb steht Nginx
vor der Anwendung — die Anwendung sieht also nie die echte Adresse des Besuchers, sondern immer
den Proxy. Die Adresse kommt deshalb aus einer Kopfzeile. **Und Kopfzeilen kann jeder mitsenden.**

Verbindlich:

- **Nginx muss `X-Forwarded-For` ÜBERSCHREIBEN, nicht anhängen.** Die überall abgeschriebene
  Zeile `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;` hängt die echte Adresse
  **hinten an einen vom Besucher mitgeschickten Wert an**. Wer den ersten Eintrag ausliest,
  bekommt dann eine frei erfundene Adresse. Richtig ist:
  `proxy_set_header X-Forwarded-For $remote_addr;`
- Ohne diese Zeile lassen sich **beide** Bremsen umgehen — die des Anmeldeformulars und die des
  Admin-Logins. Aus der Grenze am Admin-Login würde damit ein Passwort-Durchprobieren ohne
  jede Grenze. Das ist der teuerste Einzelfehler dieser Betriebsart.
- Die Anwendung vertraut der Kopfzeile **nur**, weil der Proxy sie setzt. Wird die Anwendung je
  direkt von außen erreichbar (Port offen, anderer Proxy), gilt diese Annahme nicht mehr —
  deshalb hört Next.js ausschließlich auf `127.0.0.1` und die Firewall lässt den Anwendungsport
  nicht durch (§13).
- **Diese Konfiguration gehört in den Produktions-Check** (§16) und wird dort mit einer
  erfundenen Kopfzeile gegengeprüft, nicht nur gelesen.

### Gruppenbuchungen begrenzen

Die Anzahl Teilnehmer pro Anmeldung serverseitig begrenzen (z.B. durch `familyMaxStudents`).
Sonst könnte jemand eine Anmeldung mit 5000 Teilnehmern absenden und damit das Event blockieren.

### Sehr wichtige Trennung

Anmeldungen, Teilnehmer, Teilnehmerzahlen, Eventdaten, Anmeldestatus und Zahlungsstatus dürfen
niemals ausschließlich im Arbeitsspeicher/In-Memory gespeichert werden.

Diese Daten müssen persistent in der Datenbank gespeichert werden.

Ein Neustart der Node.js-Anwendung darf niemals dazu führen, dass:

- Teilnehmer verschwinden,
- Anmeldungen verloren gehen,
- Teilnehmerzahlen zurückgesetzt werden,
- Events verschwinden,
- Wartelisten verloren gehen,
- Zahlungsinformationen verloren gehen.

Der Speicher für Rate-Limiting/Spam-Schutz ist technisch von den eigentlichen Event-,
Teilnehmer- und Zahlungsdaten zu trennen.

---

## 6. Adminbereich

Der Adminbereich muss geschützt sein. Niemals Verwaltungsfunktionen ungeschützt öffentlich
zugänglich machen.

Der Adminbereich soll ermöglichen:

- Events anzeigen und verwalten.
- **Anmeldungen als Gruppen anzeigen:** eine Zeile je Anmeldung, aufklappbar zu den
  Teilnehmern, mit Personenanzahl und Gesamtpreis.
- Belegte und freie Plätze je Event anzeigen — gezählt in **Personen**.
- `confirmed`, `waitlist` und `cancelled` unterscheiden.
- Anmeldestatus verwalten.
- Zahlungsstatus verwalten, insbesondere eine Anmeldung als bezahlt markieren.
- Warteliste einsehen.
- Teilnehmerdaten datenschutzkonform löschen/anonymisieren.
- CSV-Export auslösen.

### Authentifizierung

Für einen einzelnen Administrator zunächst eine möglichst einfache, aber sichere Lösung
verwenden.

- Passwörter niemals im Klartext speichern.
- Etablierte Passwort-Hashing-Verfahren verwenden, z.B. bcrypt oder eine zum Zeitpunkt der
  Implementierung geeignete etablierte Alternative.
- Sichere Sessions/Cookies verwenden (httpOnly, secure, sameSite).
- Keine eigene unsichere Authentifizierungslogik „erfinden".
- Keine unnötig komplexe Multi-User-/Multi-Tenant-Lösung einführen, solange sie nicht benötigt
  wird.
- Anmeldeversuche am Adminbereich begrenzen. Die Bremse ist **getrennt** von der des
  öffentlichen Anmeldeformulars — sonst könnte jemand über das öffentliche Formular das
  Kontingent aufbrauchen und den Administrator aus seinem eigenen Bereich aussperren.
- **Keine Selbstregistrierung.** Eine öffentlich erreichbare Seite, über die man sich einen
  Adminzugang anlegen kann, wäre genau die Tür, die der Adminbereich verschließen soll. Zugänge
  entstehen ausschließlich über die Kommandozeile auf dem Server.
- Bei unbekannter Adresse und bei falschem Passwort **dieselbe** Meldung ausgeben, und in
  beiden Fällen **gleich lange rechnen** (Blindprüfung gegen einen Dummy-Hash). Ohne das
  verrät die Antwortzeit, welche Adressen existieren.

### Sitzungen

- **Sitzungen laufen ab.** Die Frist steht **in der Datenbank**, nicht nur im Cookie.
- Im Cookie steht nur ein Zufallsschlüssel, in der Datenbank ausschließlich dessen Hash.
- **Abmelden löscht die Sitzung serverseitig**, nicht nur das Cookie. Ein bloß signiertes
  Cookie ohne Serverspeicher gilt bis zum Ablaufdatum weiter — es ließe sich gar nicht wirklich
  beenden.
- Ein **Passwortwechsel beendet alle offenen Sitzungen**.
- Abgelaufene Sitzungen werden bei Gelegenheit weggeräumt, damit die Tabelle nicht wächst.

### Wo die Zugangsprüfung stehen muss

**Die Prüfung steht in JEDER Seite und JEDER schreibenden Aktion — niemals nur im Layout.**

Ein Layout wird bei manchen Navigationen nicht erneut ausgeführt, und eine Server-Aktion läuft
ohnehin an jedem Layout vorbei. Eine Prüfung dort täuscht Sicherheit vor. Wer nur die Seiten
absichert, prüft die Türen und lässt die Fenster offen.

- Auch Routen ohne Seite (z. B. der CSV-Export) prüfen selbst und antworten ohne gültige
  Sitzung mit **401** — nicht mit einer HTML-Seite, die dann als Tabelle im Download landet.
- **Jede neue Admin-Seite und jede neue Admin-Aktion beginnt mit dieser Prüfung.** Es gibt
  keine Ausnahme „ist ja nur eine Anzeige".
- Zum Prüfen gehört, die Aktion **ohne Sitzung direkt per HTTP aufzurufen** und zu belegen,
  dass nichts gespeichert wird.

### Adminseiten dürfen nicht zwischengespeichert werden

- Adminseiten werden **nicht** statisch vorberechnet und nicht zwischengespeichert. Sonst
  könnte eine Teilnehmerliste aus dem Zwischenspeicher an jemanden ausgeliefert werden, der
  gar nicht angemeldet ist.
- Adminseiten tragen **`robots: noindex`**.

---

## 7. Sicherheit

- Alle Eingaben serverseitig validieren.
- Frontend-Validierung niemals als einzigen Schutz betrachten.
- E-Mail-Format, Pflichtfelder, Datentypen und sinnvolle Längenbegrenzungen prüfen.
- Anzahl der Teilnehmer je Anmeldung serverseitig begrenzen.
- Preise, Plätze und Statuswerte immer serverseitig ermitteln, niemals aus dem Browser
  übernehmen.
- Datenbankzugriffe über ORM bzw. parametrisierte Queries durchführen.
- Nutzereingaben niemals direkt in SQL-Strings einsetzen.
- Fehler serverseitig behandeln.
- Besuchern nur verständliche, generische Fehlermeldungen anzeigen.
- Keine Stacktraces, internen Pfade, Datenbankinformationen oder Secrets an Besucher ausgeben.
- Keine Secrets, API-Keys oder Datenbank-Zugangsdaten direkt im Quellcode speichern.
- Secrets ausschließlich über Umgebungsvariablen verwalten.
- .env mit echten Zugangsdaten niemals in GitHub committen.
- Eine .env.example mit ausschließlich Platzhaltern verwenden, um benötigte Variablen zu
  dokumentieren.
- Keine personenbezogenen Daten oder Zugangsdaten unnötig in Logs schreiben.
- **Auf dem Server liegen die Werte außerhalb des Repository-Ordners**, mit `chmod 600` und dem
  Anwendungsbenutzer als Eigentümer. Ein Deployment ersetzt den Repository-Ordner — dort
  abgelegte Werte wären danach weg oder würden versehentlich mitversioniert.
- **Produktions- und Entwicklungswerte sind getrennt.** Niemals einen Produktionswert in einer
  Entwicklungs- oder Prüfumgebung verwenden.
- **Ein Wert mit dem Vorsatz `NEXT_PUBLIC_` ist niemals geheim.** Er wird beim Bauen in die
  Dateien geschrieben, die der Browser lädt, und ist in der Seitenquelle lesbar. Dort gehört
  nie ein Zugangsschutz hinein.
- **Wird ein Secret versehentlich veröffentlicht, wird es sofort beim Anbieter neu erzeugt
  (rotiert).** Es aus der Git-Historie zu entfernen genügt nicht — es war öffentlich und muss
  als kompromittiert gelten. Erst rotieren, dann aufräumen.

### CSRF und schreibende Vorgänge

Ein fremder Server darf keinen angemeldeten Administrator dazu bringen können, unbemerkt etwas
zu ändern.

- **Schreibende Vorgänge laufen über Server Actions.** Next.js prüft dabei selbst, ob die
  Anfrage von der eigenen Seite kommt. Das ist der Hauptschutz — und ein Grund, warum eigene
  POST-Routen nicht ohne Not eingeführt werden.
- Das Sitzungs-Cookie ist **`SameSite=Lax`**. **`SameSite=None` ist untersagt** — es hebt genau
  diesen Schutz auf.
- Wird doch einmal eine eigene schreibende Route gebraucht, prüft sie den Ursprung der Anfrage
  **selbst**. Eine Ausnahme davon ist die Rückmeldung des Zahlungsanbieters: Sie kommt von
  außen und wird stattdessen über ihre **Signatur** geprüft (§4).
- Schreibende Vorgänge niemals über GET auslösen.

### Sicherheits-Kopfzeilen

Gesetzt werden — **in `next.config.mjs`**, damit sie im Repository stehen und einen
Serverumzug überleben, statt nur in einer Nginx-Datei zu leben:

- **HSTS** (`Strict-Transport-Security`) — der Browser spricht die Seite künftig nur noch über
  HTTPS an. Erst setzen, wenn HTTPS nachweislich läuft; ein zu früh gesetzter langer Wert
  sperrt Besucher aus.
- **Content-Security-Policy** — begrenzt, woher Skripte, Stile, Bilder und Schriften kommen
  dürfen.
- **`frame-ancestors`** gegen das Einbetten in fremde Seiten (Clickjacking).
- `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
  eine restriktive `Permissions-Policy`.

**Zum Zusammenspiel mit dem Zahlungsanbieter — wichtig:** Solange ausschließlich die
**gehostete** Bezahlseite benutzt wird (§4), lädt die eigene Seite **kein** fremdes Skript. Die
CSP darf deshalb streng bleiben, und sie schützt dann sogar die Regel „keine fremden Server"
technisch ab. Würde später doch ein SDK von Stripe oder PayPal eingebettet, **muss die CSP
vorher erweitert und danach gemessen werden** — sonst wird das Skript blockiert und die
Bezahlung schlägt stillschweigend fehl, ohne sichtbare Fehlermeldung. Eine CSP-Änderung wird
nie „nebenbei" gemacht.

### Datei-Uploads

Ein Upload ist die Stelle, an der ein Fremder eine Datei auf den eigenen Server legt. Regeln:

- **Größe serverseitig begrenzen**, mit einer verständlichen Meldung statt eines nackten
  Netzwerkfehlers. Die Transportgrenze des Frameworks muss dabei **über** der eigenen Grenze
  liegen, sonst bricht die Übertragung ab, bevor die eigene Prüfung greift.
- **Den Dateityp niemals über die Endung bestimmen.** Geprüft wird, indem die Datei
  tatsächlich als Bild geöffnet wird.
- **Immer neu kodieren.** Das ist der wirksame Schutz: Was in einer vermeintlichen Bilddatei
  mitgeschmuggelt wurde, überlebt das Umwandeln nicht. Die Endungsprüfung allein ist es nicht.
- **Keine ausführbaren Dateien annehmen**, und das Ablageverzeichnis darf nichts ausführen.
- **EXIF-Drehung anwenden, danach die Metadaten verwerfen.** Handyfotos tragen GPS-Koordinaten
  — die haben auf einer öffentlichen Seite nichts verloren.
- **Der Dateiname wird zufällig vergeben**, niemals aus dem hochgeladenen Namen abgeleitet.
- **Ablage außerhalb von `public/`**, in einem Verzeichnis, das ein Deployment nicht
  überschreibt. Der Pfad kommt aus einer Umgebungsvariablen.
- Ausgeliefert wird über eine eigene Route, die den angefragten Namen **gegen ein striktes
  Muster prüft** — sonst lassen sich mit `..` Dateien außerhalb des Verzeichnisses auslesen.
- Beim Ersetzen oder Entfernen wird die alte Datei gelöscht.
- **Uploads sind eine Admin-Funktion** und unterliegen der Zugangsprüfung aus §6. Ein Upload
  ohne Sitzung, direkt per HTTP aufgerufen, darf nichts speichern.

### Fremde Server und Cookies

**Die ausführliche Regel steht im Skill `vera-frontend-design`, §6** — dort gehört sie hin,
weil sie davon handelt, was die Seite lädt. Damit sie nicht an zwei Stellen auseinanderläuft,
hier nur der Kern und das, was für Backend-Arbeit gilt:

- **Schriften, Bilder, Skripte und Stylesheets werden immer selbst ausgeliefert**, niemals zur
  Laufzeit von fremden Servern nachgeladen. Sonst wandert die IP-Adresse jedes Besuchers dorthin
  — einwilligungspflichtig, und in Deutschland bereits mit Schadenersatz beurteilt.
- Keine Tracking-, Analyse- oder Werbeskripte.
- **Kein Cookie-Banner nötig, solange nur technisch notwendige Cookies verwendet werden.
  Diesen Zustand bewusst erhalten.**

**Der Zahlungsanbieter ändert daran nichts — das ist geprüft.** Bezahlt wird auf der
gehosteten Seite des Anbieters; auf der VERA-Seite läuft **kein** fremdes Skript und es wird
nichts nachgeladen. Das einzige Cookie ist die Anmeldung des Betreibers am Adminbereich, und
das ist technisch notwendig.

**Diese Eigenschaft ist tragend und darf nicht beiläufig aufgegeben werden.** Würde je ein SDK
des Zahlungsanbieters eingebettet, entstünde ein Zustimmungsfenster, die
Datenschutzerklärung müsste geändert und die CSP vorher erweitert werden. Das ist eine
Entscheidung des Nutzers, keine technische Nebensache.

---

## 8. Datenschutz / DSGVO

- Nur Daten speichern, die tatsächlich benötigt werden.
- Keine Tracking- oder Analyseinformationen „auf Vorrat" sammeln.
- Personenbezogene Daten niemals öffentlich zugänglich machen.
- Teilnehmerlisten dürfen nur im geschützten Adminbereich verfügbar sein.
- Öffentlich dürfen ausschließlich **Zahlen** erscheinen (freie Plätze), niemals Namen.
- Für Entwicklung und Tests ausschließlich erfundene Testdaten verwenden. **Niemals echte
  Teilnehmerdaten in eine Entwicklungs- oder Prüfumgebung kopieren** — auch nicht „nur einmal
  zum Nachstellen eines Fehlers".
- Nach einem Prüflauf werden Testanmeldungen, Testevents, Testzugänge und hochgeladene
  Testbilder wieder entfernt.

### Eine unratbare Adresse ist kein Zugriffsschutz

Manche Seiten sind zwangsläufig ohne Anmeldung erreichbar — die Abschluss-Seite nach einer
Anmeldung etwa, damit der Besucher ohne Konto zu seiner Zahlung zurückfindet. Sie werden über
eine Kennung in der Adresse aufgerufen.

Das ist vertretbar, **wenn** die Kennung unratbar ist (cuid/uuid, keine fortlaufende Zahl).
Es ist aber **kein Zugriffsschutz**, sondern nur ein Schlüssel: Wer die Adresse hat, kommt
hinein. Deshalb gilt für solche Seiten:

- **Nur das Nötigste anzeigen.** Was der Besucher nicht braucht, gehört nicht darauf.
- **`robots: noindex` setzen**, damit eine nach außen gelangte Adresse nicht in einer
  Suchmaschine landet.
- Niemals eine fortlaufende Zahl als Kennung nach außen geben — damit wären fremde Anmeldungen
  durch Hochzählen erreichbar.
- Für alles, was mehr als das Nötigste zeigt, ist eine **echte Anmeldung** die Antwort, nicht
  eine längere Kennung.

### Sicherungen und Löschung zusammendenken

Wer sein Recht auf Löschung wahrnimmt, ist aus der laufenden Datenbank entfernt — **steht aber
weiterhin in den Sicherungen**. Ohne Regel bliebe er dort unbegrenzt.

- Sicherungen bekommen eine **dokumentierte Aufbewahrungsfrist** und verfallen danach
  **automatisch** (Einzelheiten in §14).
- Diese Frist wird so kurz gewählt, wie es für eine verlässliche Wiederherstellung reicht.
- Sicherungen werden **nicht** einzeln nachbearbeitet, um eine Person daraus zu entfernen — das
  ist praktisch nicht verlässlich durchführbar. Die Frist ist das Mittel.
- Wird eine Sicherung zurückgespielt, muss anschließend geprüft werden, ob zwischenzeitliche
  Löschungen erneut auszuführen sind.

### Neue Drittanbieter mit Personenbezug

Bevor **irgendein** externer Dienst hinzukommt, der personenbezogene Daten zu sehen bekäme —
Mailversand, Fehlerprotokollierung, Überwachung, Analyse, Zahlungsanbieter —: **den Nutzer
informieren und Zustimmung einholen.** Dazu gehört jeweils, wo der Dienst verarbeitet
(EU-Standort?) und ob ein Auftragsverarbeitungsvertrag vorliegt. Nicht eigenmächtig einbauen,
auch nicht, wenn der Dienst kostenlos ist.

### Minderjährige Teilnehmer

Bei diesem Projekt nehmen ausdrücklich auch Minderjährige teil. Das erhöht die Anforderungen:

- Personen unter 18 Jahren können keine gültigen Verträge allein abschließen. Anmelder und
  Vertragspartner ist dann ein Elternteil bzw. eine erziehungsberechtigte Person.
- Für Kinder unter 16 Jahren ist für die Datenverarbeitung die Einwilligung der
  Erziehungsberechtigten erforderlich.
- Die Einwilligung der Erziehungsberechtigten ist eine **Pflichtangabe**, sobald Minderjährige
  in der Anmeldung enthalten sind.
- Die Foto-Einwilligung ist davon **getrennt** und **freiwillig**. Eine Anmeldung darf nicht
  daran scheitern, dass jemand keine Fotos möchte.
- Bei Minderjährigen besonders sparsam mit Daten umgehen: kein Geburtsdatum, wenn das
  Geburtsjahr reicht; keine Schule und Klasse, wenn sie nicht gebraucht werden.
- Sind auf veröffentlichten Fotos Minderjährige erkennbar, muss die Einwilligung der
  Erziehungsberechtigten vorliegen.

Claude ist kein Anwalt. Bei Geld in Verbindung mit Minderjährigen ist der Nutzer darauf
hinzuweisen, dass eine fachkundige Prüfung sinnvoll ist.

### Stornierung vs. echte Löschung

`status: cancelled` ist keine vollständige Löschung personenbezogener Daten.

Eine Stornierung darf zunächst gespeichert bleiben, damit Wartelistenlogik, Zahlungsabgleich und
notwendige Verwaltungsfunktionen funktionieren.

Zusätzlich eine echte Lösch-/Anonymisierungsfunktion vorsehen. Damit sollen personenbezogene
Daten dauerhaft entfernt oder anonymisiert werden können. Beim Löschen einer Anmeldung müssen
auch **alle zugehörigen Teilnehmer** entfernt bzw. anonymisiert werden — es dürfen keine
verwaisten Personendaten zurückbleiben.

Diese Funktion soll über den geschützten Adminbereich verfügbar sein.

---

## 9. Entwicklung und Produktion

Entwicklungs-/Testumgebung und Produktion müssen sauber getrennt sein.

- Separate Datenbank für Entwicklung/Test und Produktion verwenden.
- Test- und Produktions-Konfiguration nicht vermischen.
- Umgebungsvariablen sauber trennen.
- Testdaten niemals versehentlich in die Produktionsdatenbank übernehmen.
- Beim Zahlungsanbieter strikt zwischen Test- und Echtbetrieb trennen. Niemals mit echten
  Zugangsdaten testen.
- Anmeldung, Datenbankspeicherung, Gruppenbuchung, Preisberechnung, Teilnehmerzählung,
  Warteliste und Adminbereich sollen vor der Veröffentlichung vollständig in der
  Entwicklungs-/Cloud-Umgebung testbar sein.
- Die Entwicklung soll möglichst ohne komplizierte lokale Einrichtung auf dem iPad funktionieren.
- GitHub bleibt Repository für den Quellcode.

### Was mindestens getestet werden muss

- Einzelbuchung Schüler, Einzelbuchung Erwachsener
- Familienbuchung mit der Mindest- und mit der Höchstzahl an Schülern
- Preisberechnung: Anzeige und Serverberechnung liefern denselben Betrag
- Platzzählung mit einer Gruppenbuchung: Eine Anmeldung mit 6 Personen muss 6 Plätze belegen
- Anmeldung bei genau einem freien Platz und einer Gruppe von zwei Personen — muss abgelehnt
  bzw. auf Warteliste gesetzt werden
- Erneute Anmeldung nach Stornierung mit derselben E-Mail-Adresse

### Deployment

Vor **jedem** Deployment in die Produktion:

1. Typprüfung und Bau laufen fehlerfrei durch.
2. Die betroffenen Prüflisten laufen durch.
3. Erst dann wird ausgeliefert.

Ein Deployment, das erst auf dem Produktionsserver zeigt, ob es baut, ist kein Deployment,
sondern ein Versuch.

### Migrationen in der Produktion

- **In der Produktion ausschließlich `prisma migrate deploy`.**
- **`prisma migrate dev` ist auf dem Produktionsserver verboten.** Es ist der
  Entwicklungsbefehl: Er darf die Datenbank neu aufsetzen und dabei **alle Daten löschen**.
  Derselbe Tippfehler, der in der Entwicklung folgenlos ist, kostet dort sämtliche Anmeldungen.
- **Vor jeder Produktionsmigration eine Sicherung**, die nachweislich durchgelaufen ist —
  nicht eine, die „eigentlich läuft".
- Migrationen möglichst **additiv** halten (Feld hinzufügen statt umbenennen, neue Spalte
  zunächst optional). Rückwärts ist der gefährliche Teil.
- Bestehende Migrationsdateien werden **nicht nachträglich verändert** und nicht gelöscht.
- **Niemals** eine produktive Datenbank automatisch löschen, zurücksetzen oder neu aufsetzen —
  weder in einem Skript, noch in einem Ablauf, noch „nur zum Aufräumen".

### Rückweg bei einem fehlerhaften Deployment

Der Rückweg wird **vorher** festgelegt, nicht im Fehlerfall erfunden:

1. Vorherigen Stand auschecken, neu bauen, Dienst neu starten.
2. Hat die fehlerhafte Auslieferung eine **Migration** mitgebracht, ist der Code-Rückbau
   allein nicht genug — dann entscheidet der Einzelfall, und der Nutzer wird gefragt.
3. Genau deshalb sind additive Migrationen wichtig: Sie lassen den alten Code weiterlaufen.

Nach jedem Rückbau prüfen, ob die Seite erreichbar ist und der Adminbereich funktioniert.

---

## 10. Vorgehen bei größeren Änderungen

Bevor größere Änderungen vorgenommen werden, dem Nutzer kurz und anfängerfreundlich erklären:

1. Was geändert werden soll.
2. Warum die Änderung notwendig oder sinnvoll ist.
3. Welche Auswirkungen sie auf das Projekt hat.
4. Ob dadurch zusätzliche Kosten oder externe Dienste entstehen.

Dies gilt insbesondere für:

- Datenbankstruktur
- Preis- und Zahlungslogik
- Authentifizierung
- Adminbereich
- Hosting-Architektur
- neue externe Dienste
- kostenpflichtige Dienste
- sicherheitsrelevante Funktionen
- Änderungen am Tech-Stack

Bei mehreren möglichen Lösungen nicht eigenständig eine unnötig komplexe Variante auswählen.
Die einfachste passende, sichere, wartbare und Hostinger-kompatible Lösung bevorzugen.

---

## 11. Hostinger-Kompatibilität

> **Historisch:** Dieser Abschnitt fragte früher, ob eine Lösung „ohne VPS-spezifische
> Funktionen" auskommt — passend zu geteiltem Hosting. **Das ist überholt.** Der VPS ist die
> Zielumgebung; ein eigener Dienst, ein eigener Reverse Proxy und eine eigene Datenbank sind
> jetzt der Normalfall, nicht der Sonderfall.

Bei wichtigen technischen Entscheidungen prüfen:

- Läuft die Lösung auf **Ubuntu 24.04** mit **Node.js 20.9+**?
- Funktioniert sie im Dauerbetrieb als **systemd**-Dienst hinter **Nginx**?
- Ist sie mit **MariaDB** und **Prisma 7** samt Treiber-Adapter verträglich?
- **Braucht eine Abhängigkeit beim Installieren eine C++-Übersetzung?** Das war früher der
  Hauptgrund für Fehlschläge und ist auch jetzt noch ein Argument: Übersetzungen kosten
  Arbeitsspeicher und Zeit auf einer kleinen Maschine und brechen bei jedem Node-Wechsel.
  Reines JavaScript ist vorzuziehen, wenn es die Aufgabe genauso löst.
- **Läuft `next build` mit dem verfügbaren Arbeitsspeicher durch?** Falls nicht, wird
  anderswo gebaut und das Ergebnis übertragen — das ist kein Grund für einen größeren Tarif.
- Braucht die Lösung einen **zuverlässigen Zeitplan (Cron)**? Wenn ja: erst prüfen, ob sie sich
  stattdessen **beim Lesen** auswerten lässt — so wie die abgelaufenen Reservierungen in §3.
  Das spart dauerhaft Betriebsarbeit.
- Kann die Anwendung über **Git aus dem privaten Repository** ausgeliefert werden?
- Ist die Seite über **HTTPS** erreichbar? (Pflicht, sobald personenbezogene Daten oder
  Zahlungen im Spiel sind.)
- Können **Rückmeldungen des Zahlungsanbieters** den Server zuverlässig erreichen?
- Entsteht durch die Lösung **neue Betriebsarbeit** (ein weiterer Dienst, ein weiteres
  Zertifikat, eine weitere Sicherung)? Dann gehört das benannt, bevor sie eingebaut wird.

Falls etwas nicht unterstützt wird oder unklar ist: nicht einfach eine andere Architektur
einführen. Den Nutzer zuerst informieren und die einfachste Alternative erklären.

---

## 12. Verbesserungsvorschläge und wichtige Hinweise

Claude soll bei der Entwicklung aktiv mitdenken.

Wenn bei der Arbeit an diesem Skill oder später bei der Entwicklung der Webseite etwas auffällt,
das:

- technisch wichtig ist,
- die Sicherheit verbessert,
- Datenverlust verhindern kann,
- die Benutzerfreundlichkeit verbessert,
- die Performance verbessert,
- für Datenschutz/DSGVO relevant ist,
- für Hostinger oder die spätere Veröffentlichung wichtig ist,
- die Wartbarkeit verbessert,
- oder eine Funktion sinnvoller bzw. zuverlässiger machen würde,

den Nutzer aktiv darauf hinweisen.

Dabei kurz und anfängerfreundlich erklären:

1. Was aufgefallen ist.
2. Warum es wichtig oder sinnvoll ist.
3. Was konkret verbessert werden könnte.
4. Ob dadurch zusätzliche Kosten, externe Dienste oder größere Änderungen entstehen.

Wichtig: Zusätzliche Verbesserungen, die über den eigentlichen Auftrag hinausgehen, nicht
automatisch umsetzen. Zuerst vorschlagen und auf die Zustimmung des Nutzers warten.

Kleine notwendige Korrekturen, ohne die ausdrücklich beauftragter Code nicht korrekt
funktionieren würde, dürfen innerhalb des aktuellen Auftrags behoben werden. Anschließend den
Nutzer darauf hinweisen.

---

## 13. Server und Betrieb (VPS)

Auf einem eigenen Server macht **niemand** die Wartung automatisch. Updates, Firewall,
Zertifikate und Sicherungen sind ab jetzt eigene Arbeit. Diese Regeln sind nicht optional.

### Zugang

- **SSH-Key statt Passwort.** Ein Passwort-Zugang wird auf einer öffentlichen IP-Adresse ab
  der ersten Stunde durchprobiert.
- **Root-Anmeldung über SSH abschalten** — aber **erst, nachdem ein anderer Zugang
  nachweislich funktioniert.** Reihenfolge: neuen Benutzer anlegen, Key hinterlegen, **in einer
  zweiten Sitzung erfolgreich anmelden**, und erst dann in der ersten Sitzung abschalten. Wer
  das umdreht, sperrt sich aus.
- **fail2ban** ist sinnvoll und wird empfohlen, sobald der Zugang steht.

### Firewall und offene Ports

- **Nur 22 (SSH), 80 und 443 sind offen.** Sonst nichts.
- **Die Anwendung selbst ist von außen nicht erreichbar.** Next.js hört auf `127.0.0.1`; von
  außen kommt man ausschließlich über Nginx. Nur so gilt die Annahme aus §5, dass die
  Kopfzeile mit der Besucher-IP vom eigenen Proxy stammt.
- **Die Datenbank ist von außen nicht erreichbar** — siehe unten.

### Wer die Anwendung ausführt

- **VERA läuft unter einem eigenen, eingeschränkten Linux-Benutzer — niemals als root.**
  Findet jemand eine Lücke in der Anwendung, hat er dann die Rechte dieses einen Benutzers und
  nicht die der ganzen Maschine.
- Betrieb als **systemd**-Dienst: startet nach einem Server-Neustart von selbst, Protokolle
  laufen ins Journal, Umgebungswerte kommen aus einer Datei mit `chmod 600`.
- **Nach jeder Änderung an Dienst oder Server einmal neu starten und prüfen, dass die Seite von
  allein wiederkommt.** Ein Dienst, der nur läuft, weil ihn jemand von Hand gestartet hat, ist
  beim nächsten Neustart weg.

### Betriebssystem

- **Automatische Sicherheitsupdates einschalten.**
- Nur installieren, was gebraucht wird. Jedes zusätzliche Paket ist zusätzliche Angriffsfläche
  und zusätzliche Pflege.

### Datenbank auf dem eigenen Server

- **MariaDB hört ausschließlich auf `127.0.0.1`.** Keine Erreichbarkeit von außen — auch nicht
  „vorübergehend zum Einrichten".
- **Ein eigener, eingeschränkter Datenbankbenutzer für VERA**, mit Rechten **nur auf die eine
  Datenbank**.
- **Die Anwendung benutzt niemals das root-Konto der Datenbank.** Das root-Konto ist für
  Verwaltungsaufgaben von Hand da, nicht für den Betrieb.
- Zeichensatz `utf8mb4`, damit Umlaute und Sonderzeichen sicher sind.
- Die Zugangsdaten stehen in den Umgebungswerten (§7), nicht im Code.

---

## 14. Sicherungen und Wiederherstellung

Von hier hängt ab, ob ein Fehler ärgerlich oder existenzbedrohend ist. Anmeldungen und
Zahlungen lassen sich nicht rekonstruieren.

- **Täglich automatisch**, unbeaufsichtigt, ohne dass jemand daran denken muss.
- **Mehrere Generationen** behalten, nicht nur die letzte. Ein Schaden fällt oft erst Tage
  später auf — dann ist die einzige Sicherung längst mit dem Schaden überschrieben.
- **Verschlüsselt.** Eine Datenbanksicherung ist eine vollständige Kopie aller Teilnehmerdaten.
- **Der Schlüssel liegt nicht auf demselben Server.** Sonst schützt die Verschlüsselung genau
  gegen nichts.
- **Außerhalb des Servers ablegen.** Eine Sicherung, die nur auf der Maschine liegt, die
  ausfällt, ist keine.
- **Alarm, wenn eine Sicherung ausfällt.** Ein stiller Fehlschlag ist schlimmer als keine
  Sicherung, weil man sich in Sicherheit wiegt.
- **Aufbewahrungsfrist dokumentieren**, danach automatisch verfallen lassen — das ist zugleich
  die Antwort auf den Löschanspruch aus §8.

### Die Regel, die alles trägt

**Eine Sicherung, die nie zurückgespielt wurde, ist keine Sicherung, sondern eine Hoffnung.**

- **Regelmäßiger Restore-Test in eine getrennte Testdatenbank** — niemals über die
  produktive Datenbank.
- Beim Test wird **nachgezählt**: Events, Anmeldungen, Teilnehmer, Zahlungen. „Der Befehl lief
  ohne Fehler" ist kein Ergebnis.
- **Vor jeder Produktionsmigration** eine Sicherung, die nachweislich durchgelaufen ist (§9).
- Die kostenlosen Snapshot-Funktionen des Anbieters sind ein **Rettungsanker vor riskanten
  Serveränderungen**, keine Datensicherung: Es gibt meist nur einen Platz, jeder neue
  überschreibt den alten, und ein Abbild einer laufenden Datenbank kann in sich widersprüchlich
  sein. Sie ersetzen diesen Abschnitt nicht.

---

## 15. Protokolle und Überwachung

### Was niemals ins Protokoll gehört

- Passwörter, Schlüssel, Token, Cookie-Werte — auch nicht gekürzt, auch nicht „nur zum Suchen".
- Personenbezogene Daten, die man zur Fehlersuche nicht braucht. Eine Anmeldenummer genügt fast
  immer; Name, E-Mail und Telefonnummer gehören nicht dazu.
- Vollständige Anfragekörper.

### Was ins Protokoll gehört

- Fehler mit genug Zusammenhang, um sie zu finden: Zeitpunkt, betroffener Vorgang, Kennung.
- Sicherheitsrelevante Ereignisse: fehlgeschlagene Anmeldungen am Adminbereich, abgewiesene
  Rückmeldungen des Zahlungsanbieters, Betragsabweichungen.

### Was Besucher sehen

Verstärkt §7 und ersetzt es nicht: **Besucher bekommen niemals Stacktraces, interne Pfade,
Datenbankmeldungen oder Namen von Umgebungswerten** — nur eine verständliche, allgemeine
Meldung. Die Einzelheiten stehen im Serverprotokoll.

### Überwachung

- **Erreichbarkeit von außen** prüfen — nicht vom Server selbst aus, der sich immer erreicht.
- **Speicherplatz**: Ein volllaufender Datenträger legt Datenbank und Sicherungen gleichzeitig
  still. Protokolle und Sicherungen sind die üblichen Verursacher.
- **Zustand des Dienstes**: Läuft er noch, startet er nach einem Neustart von allein?
- **Zertifikatsablauf** rechtzeitig bemerken.
- **Logrotation** einrichten, sonst füllen die Protokolle den Datenträger.
- Kommt ein externer Überwachungsdienst ins Spiel, gilt §8: erst fragen.

---

## 16. Produktions-Check vor dem Livegang

Diese Liste wird **vollständig** abgearbeitet, bevor die Seite öffentlich beworben wird und
bevor echtes Geld fließt. Jeder Punkt wird **gemessen**, nicht angenommen.

**Server und Zugang**
- [ ] Passwort-Anmeldung über SSH abgelehnt, Key-Anmeldung funktioniert
- [ ] Root-Anmeldung über SSH abgelehnt
- [ ] Firewall aktiv, nur 22/80/443 offen
- [ ] Automatische Sicherheitsupdates aktiv
- [ ] VERA läuft unter dem eigenen Benutzer, **nicht** als root
- [ ] Server-Neustart: Dienst, Datenbank und Seite kommen von allein wieder

**Netz und HTTPS**
- [ ] HTTPS funktioniert, HTTP leitet dorthin um
- [ ] **Automatische Zertifikatserneuerung getestet**, nicht nur eingerichtet
- [ ] Sicherheits-Kopfzeilen kommen beim Browser an (HSTS, CSP, `frame-ancestors`, nosniff,
      Referrer-Policy)
- [ ] **Die Bremsen zählen echte Adressen**: mit einer erfundenen `X-Forwarded-For`-Kopfzeile
      gegenprüfen, dass sie sich **nicht** umgehen lassen (§5)

**Datenbank**
- [ ] Von außen **nicht** erreichbar
- [ ] Die Anwendung benutzt den eingeschränkten Benutzer, nicht root
- [ ] Migrationsstand ist sauber

**Anwendung**
- [ ] Adminbereich: Anmeldung, Abmeldung, Sitzungsablauf
- [ ] Admin-Seiten und Admin-Aktionen **ohne Sitzung direkt aufgerufen** → nichts passiert
- [ ] CSV-Route ohne Sitzung → 401
- [ ] Anmeldung von Ende zu Ende, Preis und Plätze stimmen
- [ ] Fehlerseiten zeigen keine internen Details

**Zahlung**
- [ ] Rückmeldung des Anbieters kommt an und wird **mit gültiger Signatur** verarbeitet
- [ ] Falsche und fehlende Signatur werden abgewiesen
- [ ] Dieselbe Meldung zweimal wirkt genau einmal
- [ ] Erfolgreiche Zahlung, Abbruch, fehlgeschlagene Karte, zweiter Anlauf — alle durchgespielt
- [ ] **Erst danach** echte Schlüssel einsetzen (§4)

**Sicherung**
- [ ] Automatische Sicherung läuft
- [ ] **Restore-Test in eine getrennte Datenbank durchgeführt und nachgezählt**

**Daten und Repository**
- [ ] Keine Testevents, Testanmeldungen, Testzugänge oder Testbilder mehr vorhanden
- [ ] Keine `.env` und kein Secret im Repository — auch nicht in der Git-Historie
- [ ] `.env.example` enthält ausschließlich Platzhalter
- [ ] Vorschau-Passwort im Produktions-Build **nicht** gesetzt

**Rechtliches** (gehört dem Nutzer, nicht der Technik)
- [ ] Impressum, Datenschutz, Widerruf/Stornierung, ggf. AGB inhaltlich fertig
- [ ] Mehrwertsteuer-Aussage geklärt
