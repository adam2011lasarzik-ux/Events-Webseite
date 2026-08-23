---
name: event-backend-database
description: Best Practices und Architekturvorgaben für Backend, Datenbank, Event-Anmeldungen, Gruppen-Anmeldungen, Bezahlung und Adminbereich dieser Event-Webseite. Diesen Skill IMMER konsultieren bei Aufgaben zu Datenbank-Design, Migrationen, Teilnehmer-Anmeldungen, Preisberechnung, Bezahlung, Wartelisten, Adminbereich, Authentifizierung, Sicherheit, Datenschutz/DSGVO oder Hostinger-Deployment für dieses Projekt. Gilt für alle Backend-Aufgaben dieser Webseite, auch wenn der Nutzer nur "Anmeldung bauen", "Admin-Login", "Preis berechnen" oder "Teilnehmerliste" sagt.
---

# Event-Backend & Datenbank

Dieser Skill legt fest, wie Backend, Datenbank, Event-Anmeldungen, Bezahlung und der
Adminbereich dieser Event-Webseite gebaut werden.

Der Nutzer ist Programmier-Anfänger und entwickelt hauptsächlich über Claude Code im Browser
auf einem iPad + GitHub. Die Seite soll später bei Hostinger gehostet werden.

Grundprinzip: Bei jeder Aufgabe die einfachste, wartbare, sichere und Hostinger-kompatible
Lösung wählen. Keine unnötigen Frameworks, Dienste oder Abhängigkeiten. Bestehenden Code nicht
unnötig verändern.

---

## 1. Tech-Stack

Der aktuell vorgesehene Hostinger-Tarif des Nutzers ("Unlimited") unterstützt Node.js-Hosting.
Damit gilt grundsätzlich:

- Framework: Next.js (React-basiert, gute Dokumentation, Frontend + Backend in einem Projekt).
- Datenbank: MySQL.
- DB-Zugriffsschicht: ORM, bevorzugt Prisma, sofern es mit der tatsächlichen Hostinger-Umgebung
  vollständig kompatibel ist.
- Prisma soll für Migrationen, strukturierte Datenbankzugriffe und typsichere Abfragen verwendet
  werden, sofern keine technischen Gründe dagegen sprechen.

Bevor die eigentliche Backend-/Datenbank-Architektur später produktiv umgesetzt wird, die
tatsächlichen technischen Möglichkeiten des verwendeten Hostinger-Tarifs noch einmal prüfen.

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
belegte Plätze = Summe aller Participant-Einträge,
                 deren Registration den Status "confirmed" hat
```

Eine Familie mit 6 Personen belegt 6 Plätze, nicht einen. Würde man Anmeldungen zählen, zeigte
die Seite noch freie Plätze an, während die Anlage längst voll ist — ein Fehler, der erst am
Veranstaltungstag auffällt.

Anmeldungen mit Status `waitlist` oder `cancelled` zählen nicht als belegte Plätze.

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
- Anmeldeversuche am Adminbereich begrenzen.

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

### Fremde Server und Cookies

- **Schriften, Bilder, Skripte und Stylesheets immer selbst ausliefern**, niemals zur Laufzeit
  von fremden Servern nachladen. Werden z.B. Google Fonts direkt von Google geladen, wandert die
  IP-Adresse jedes Besuchers dorthin. Das ist einwilligungspflichtig und hat in Deutschland
  bereits zu Urteilen mit Schadenersatz geführt. Selbst ausgeliefert entfällt das Problem, und
  die Seite lädt schneller.
- Keine Tracking-, Analyse- oder Werbeskripte einbauen.
- Solange nur technisch notwendige Cookies verwendet werden, ist kein Cookie-Banner nötig.
  **Diesen Zustand bewusst erhalten.** Bevor irgendetwas eingebaut wird, das daran etwas ändert,
  den Nutzer informieren.
- Kommt später ein Zahlungsanbieter dazu, das Cookie-Thema erneut prüfen.

---

## 8. Datenschutz / DSGVO

- Nur Daten speichern, die tatsächlich benötigt werden.
- Keine Tracking- oder Analyseinformationen „auf Vorrat" sammeln.
- Personenbezogene Daten niemals öffentlich zugänglich machen.
- Teilnehmerlisten dürfen nur im geschützten Adminbereich verfügbar sein.
- Öffentlich dürfen ausschließlich **Zahlen** erscheinen (freie Plätze), niemals Namen.
- Für Entwicklung und Tests ausschließlich erfundene Testdaten verwenden.

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

Bei wichtigen technischen Entscheidungen prüfen:

- Funktioniert die Lösung mit dem tatsächlich verwendeten Hostinger-Tarif?
- Funktioniert sie mit Node.js-Hosting?
- Funktioniert die geplante Datenbanklösung mit Hostinger?
- Sind Next.js und die verwendeten Funktionen in der tatsächlichen Hosting-Umgebung vollständig
  nutzbar?
- Ist Prisma bzw. das gewählte ORM kompatibel?
- Werden keine unnötigen VPS-spezifischen Funktionen vorausgesetzt?
- Kann die Anwendung möglichst ohne Architektur-Umbau über GitHub zu Hostinger übertragen werden?
- Ist die Seite über HTTPS erreichbar? (Pflicht, sobald personenbezogene Daten oder Zahlungen
  im Spiel sind.)
- Können Rückmeldungen eines Zahlungsanbieters den Server zuverlässig erreichen?

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
