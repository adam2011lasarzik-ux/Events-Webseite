# Rechtstexte beschaffen — Bestand, Lücken und Vorbereitung

**Entscheidung des Betreibers (September 2026):** Die rechtliche Prüfung
erfolgt **vorerst nicht durch einen eigenen Anwalt** — die Kosten sind in
der Gründungsphase zu hoch. Stattdessen soll ein professioneller
**Rechtstexte-Service** genutzt werden.

Diese Datei ersetzt damit den bisherigen Plan-Punkt „eine Rechtsberatung".
`docs/sachverhalt-fuer-rechtsberatung.md` bleibt bestehen und wird
**nicht** hinfällig: Es ist jetzt die Vorlage, aus der die Angaben für den
Service kommen.

> **Kein Rechtsrat.** Hier steht, was im Projekt vorhanden ist, welche
> Fragen offen sind und welche Angaben ein externer Dienst braucht —
> nicht, wie die Fragen zu beantworten sind. Es wurden **keine
> Rechtstexte erfunden** und **keine Texte von fremden Seiten kopiert**.
> Die vorhandenen Platzhalter wurden für diese Übersicht **nicht**
> umformuliert.

---

## 1. Welche Rechtstexte bereits im Projekt vorhanden sind

Alle vier Seiten existieren, sind erreichbar und stehen im Fußbereich
**jeder** öffentlichen Seite — auch im Anmeldeformular und auf der
Abschluss-Seite. Prüfliste `O` belegt das bei jedem Lauf.

| Seite | Adresse | Zustand |
|---|---|---|
| Impressum | `/impressum` | **inhaltlich weitgehend fertig**, zwei Felder offen |
| Datenschutzerklärung | `/datenschutz` | markierter Platzhalter mit korrekten Tatsachenangaben |
| Allgemeine Geschäftsbedingungen | `/agb` | markierter Platzhalter |
| Widerruf und Stornierung | `/widerruf` | **teils verbindlich**, Abschnitt 1 offen |

### Was davon schon echter, gültiger Inhalt ist

Das ist wichtig für den Service — diese Punkte müssen **nicht** neu
erfunden, sondern nur übernommen und geprüft werden:

- **Impressum**: Name, Rechtsform (Einzelunternehmen, kein
  Registereintrag), E-Mail `kontakt@veraevents.de`, Angabe nach § 5 DDG,
  Umsatzsteuerhinweis (Kleinunternehmen nach § 19 UStG).
- **Stornobedingungen** (`/widerruf`, Abschnitt 2): kostenlose Stornierung
  bis 24 Stunden vor Beginn, voller Betrag zurück, keine Übertragung auf
  andere Personen. Das ist **verbindlicher Text**, kein Platzhalter — die
  Selbstbedienungs-Stornierung ist gebaut und läuft über den Link in der
  Bestätigungsmail.
- **Absage durch VERA** (`/widerruf`, Abschnitt 3): automatische
  Erstattung des vollen Betrags, Mitteilung per E-Mail.
- **Datenschutz-Tatsachen**: was an Stripe übermittelt wird (Betrag,
  Anmeldenummer, E-Mail, Titel der Veranstaltung, Personenzahl), dass
  Kartendaten die Seite nie berühren, dass Schriften selbst ausgeliefert
  werden, dass es kein Tracking und kein Zustimmungsfenster gibt, und dass
  das einzige Cookie die Anmeldung des Betreibers am Verwaltungsbereich
  ist.
- **Server-Protokolle**: die IP-Adresse wird beim Schreiben gekürzt
  (letzte Stelle verworfen), Aufbewahrung 14 Tage. Technisch umgesetzt und
  im Betrieb nachgewiesen.

---

## 2. Was darin noch Platzhalter oder ungeprüft ist

### 2.1 Sichtbar als Platzhalter markiert

| Ort | Was fehlt | Dringlichkeit |
|---|---|---|
| `/impressum` | **ladungsfähige Geschäftsanschrift** | vor Livegang zwingend |
| `/impressum` | **Telefonnummer** | vor Livegang zwingend |
| `/datenschutz` | die gesamte ausformulierte Erklärung | vor Livegang zwingend |
| `/agb` | der gesamte Text, falls eigene AGB gewünscht | zu entscheiden |
| `/widerruf` Abschnitt 1 | Widerrufsrecht **oder** Hinweis auf dessen Ausschluss | vor Livegang zwingend |

Die beiden Impressumsfelder liefert der Betreiber selbst — sie brauchen
keinen Dienst. Er möchte weder Privatanschrift noch private Mobilnummer
veröffentlichen; der Weg ist eine gemietete, ausdrücklich **ladungsfähige**
Geschäftsanschrift und eine getrennte Geschäftsnummer.

### 2.2 Ungeprüft, aber nicht als Platzhalter sichtbar

Diese Punkte sehen fertig aus und sind es fachlich möglicherweise nicht.
Sie gehören ausdrücklich auf die Liste für den Service:

| Punkt | Warum offen |
|---|---|
| **§ 312g Abs. 2 Nr. 9 BGB** | Ob das Widerrufsrecht bei termingebundenen Freizeitveranstaltungen ausgeschlossen ist. Bewusst **keine** Standard-Belehrung eingebaut: über ein Recht zu belehren, das es womöglich nicht gibt, wäre irreführend — über ein bestehendes nicht zu belehren, hätte Folgen. |
| **Pflichtangaben im Fernabsatz** | Welche Angaben **direkt am Bestellknopf** stehen müssen und ob die vorhandenen genügen. |
| **Auftragsverarbeitung** | Einordnung der Verträge mit Stripe, Hostinger, Backblaze und UptimeRobot. |
| **Minderjährige** | Die Einwilligung der Erziehungsberechtigten ist bereits Pflichtfeld; wie sie in der Datenschutzerklärung zu beschreiben ist, ist offen. |
| **USt-IdNr.** | Ungeklärt, ob eine vorliegt. Bewusst **leer** — eine erfundene wäre schlimmer als keine, und die Steuernummer gehört nicht ins Impressum. |
| **EU-Streitschlichtung / § 36 VSBG** | Beide Standardbausteine bewusst weggelassen (Plattform eingestellt; VSBG gilt erst ab mehr als zehn Beschäftigten). Gegenprüfen lassen. |
| **Serverstandort** | Hostinger: „EU" gewählt, genaue Region unbestätigt. Backblaze-B2-Bucket: Region nicht dokumentiert. Beides für die Datenschutzerklärung relevant. |

### 2.3 Bewusste Entscheidungen, die so bleiben sollen

Damit ein Dienst sie nicht versehentlich „korrigiert":

- **Kein Pflicht-Häkchen „AGB akzeptiert"** im Anmeldeformular, solange
  die AGB ein Platzhalter sind. Ein Häkchen auf eine leere Seite wäre eine
  Attrappe. Es fügt sich später ohne Umbau ein.
- **Kein Cookie-Banner.** Es gibt kein einwilligungspflichtiges Cookie:
  kein Tracking, keine Besucherzählung, Schriften auf der eigenen Domain,
  Bezahlung auf Stripes eigener Seite. Dieser Zustand soll erhalten
  bleiben — ein Dienst, der pauschal ein Banner mitliefert, würde ihn ohne
  Not aufgeben.
- **Keine Umsatzsteuer ausweisen.** § 19 UStG. Wer als Kleinunternehmer
  Umsatzsteuer ausweist, schuldet sie dem Finanzamt (§ 14c Abs. 2 UStG).
  Vier Stellen im Code sind entsprechend gesetzt; Prüfliste `N` schlägt
  Alarm, sobald eine öffentliche Seite Umsatzsteuer behauptet.

---

## 3. Was für den geplanten Ticketverkauf noch fehlen könnte

Über die vier vorhandenen Seiten hinaus:

| Möglicherweise nötig | Wofür | Stand |
|---|---|---|
| **Teilnahmebedingungen** | Verhalten vor Ort, Haftung, Ausrüstung, Gesundheit, Hausordnung der Anlage | nicht vorhanden; inhaltlich Teil der AGB, kann dort hinein |
| **Foto- und Videoeinwilligung** | Das Datenfeld existiert (`einwilligungFotos`, freiwillig, getrennt) — ein erklärender Text dazu fehlt | Feld gebaut, Text fehlt |
| **Angaben unmittelbar am Bestellknopf** | Fernabsatz-Pflichtangaben | teils vorhanden, Umfang ungeprüft |
| **Hinweis auf die Selbstbedienungs-Stornierung** in den AGB | Der Ablauf ist gebaut, in den AGB aber nicht beschrieben | offen |
| **Einwilligungstext für Minderjährige** | Was der Erziehungsberechtigte konkret bestätigt | Feld gebaut, Wortlaut ungeprüft |

**Nicht** nötig nach heutigem Stand: Cookie-Richtlinie, Einwilligungs-
verwaltung, Newsletter-Bedingungen, Rücksendebedingungen (es werden keine
Waren versandt).

---

## 4. Welche Angaben ein Rechtstexte-Service braucht

Das ist die eigentliche Vorbereitung. Alle Werte stammen aus dem Code oder
der Datenbank, nicht aus der Erinnerung.

### 4.1 Anbieter

| Angabe | Wert |
|---|---|
| Name | Adam Maurice Lasarzik |
| Rechtsform | Einzelunternehmen, kein Registereintrag |
| Geschäftsanschrift | **liegt noch nicht vor** |
| Telefon | **liegt noch nicht vor** |
| E-Mail | kontakt@veraevents.de |
| Umsatzsteuer | Kleinunternehmen nach § 19 UStG, keine ausgewiesen |
| USt-IdNr. | ungeklärt, bewusst leer |
| Website | https://veraevents.de |
| Beschäftigte | keine |

### 4.2 Geschäftsmodell — der Punkt, an dem es sich entscheidet

- VERA ist **selbst Veranstalter**, kein Vermittler und kein
  Zweitmarkt-Portal. Das Risiko leerer Plätze trägt VERA.
- Verkauft werden **Teilnahmeplätze an termingebundenen
  Freizeitveranstaltungen** (erstes Event: Padel-Schnuppertag in
  Falkensee), keine Waren, kein Versand, keine digitalen Inhalte.
- Zielgruppe: Schüler, Lehrkräfte und Eltern. **Minderjährige nehmen
  teil**, Vertragspartner ist dann ein Erziehungsberechtigter.
- Verkauf ausschließlich über die eigene Website an Verbraucher in
  Deutschland.

### 4.3 Bestell- und Zahlungsablauf

- **Anmeldung und Bezahlung sind ein einziger Vorgang.** Es gibt für den
  Kunden **keine** separate Reservierungsfunktion.
- Verbindlich ist die Anmeldung **erst nach erfolgreicher Zahlung**,
  bestätigt über die signaturgeprüfte Rückmeldung des Zahlungsanbieters —
  nicht über die Rückleitung im Browser.
- Technisch wird der Platz während des laufenden Zahlungsvorgangs
  **30 Minuten** gehalten. Das ist eine interne Sicherung gegen
  Überbuchung, **keine dem Kunden angebotene Reservierung**.
- Preise sind **Endpreise ohne Umsatzsteuer** (§ 19 UStG).
- Zahlarten: **Karte** (erscheint auf iPhone als Apple Pay, auf Android als
  Google Pay) und **PayPal**. Bezahlt wird ausschließlich auf der
  gehosteten Seite von Stripe.
- Storno durch den Kunden: bis **24 Stunden** vor Beginn kostenlos, voller
  Betrag zurück, keine Übertragung auf andere Personen. Der Kunde storniert
  selbst über einen Link in der Bestätigungsmail.
- Absage durch VERA: automatische Erstattung des vollen Betrags.

### 4.4 Welche personenbezogenen Daten erhoben werden

**Anmeldende Person:** Vorname, Nachname, E-Mail-Adresse, Telefonnummer
(freiwillig).

**Je Teilnehmer:** Vorname, Nachname, Art (Schüler/Erwachsener),
Geburtsjahr (freiwillig).

**Zusätzlich gespeichert:** ob es eine Buchung durch einen
Erziehungsberechtigten ist, Einwilligung des Erziehungsberechtigten
(Pflicht bei Minderjährigen), Foto-Einwilligung (freiwillig, getrennt),
Gesamtbetrag, Zahlungsstatus, Zahlungsreferenz des Anbieters, gezahlter
Betrag, Zeitpunkte (Anmeldung, Zahlung, Stornierung).

**Ausdrücklich nicht:** Kartennummern, Prüfziffern, Bankdaten. Sie werden
weder entgegengenommen noch protokolliert noch gespeichert.

**Löschung:** Stornieren löscht nicht. Für das Löschrecht gibt es eine
Anonymisierung, die Namen, E-Mail und Telefon **einschließlich aller
Teilnehmer** überschreibt; Betrag und Datum bleiben.

### 4.5 Eingesetzte Dienstleister

| Dienst | Wofür | Was dorthin geht |
|---|---|---|
| **Stripe** | Zahlungsabwicklung | Betrag, Anmeldenummer, E-Mail-Adresse, Titel der Veranstaltung, Personenzahl |
| **Hostinger** | Server (VPS) und E-Mail-Postfach (SMTP-Versand) | alle Daten der Anwendung; ausgehende E-Mails |
| **Backblaze B2** | Ablage der Datenbank-Sicherungen | vollständige Datenbank, **verschlüsselt** (age); der Schlüssel liegt **nicht** auf dem Server und nicht bei Backblaze. Aufbewahrung 180 Tage |
| **UptimeRobot** | Erreichbarkeitsprüfung von außen | nur Abrufe der Startseite, keine Kundendaten |
| **Let's Encrypt** | TLS-Zertifikat | Domainname |

**Keine** weiteren externen Dienste: keine Analyse, keine Werbung, keine
eingebetteten Videos, keine Schriften von fremden Servern.

### 4.6 Technische Rahmendaten

| Angabe | Wert |
|---|---|
| Server-Protokolle | IP gekürzt (letzte Stelle verworfen), 14 Tage |
| Sicherungen | täglich, verschlüsselt, bei Backblaze B2, 180 Tage |
| Cookies | genau eines: `vera_admin` für die Anmeldung des Betreibers am Verwaltungsbereich, technisch notwendig |
| Verschlüsselung | HTTPS erzwungen, HSTS aktiv |
| Schriften | selbst ausgeliefert von veraevents.de |
| Automatische E-Mails | Anmeldebestätigung, Zahlungsbestätigung, Stornobestätigung, Benachrichtigung des Betreibers |

### 4.7 Was noch beschafft oder bestätigt werden muss

1. Ladungsfähige Geschäftsanschrift
2. Geschäftstelefonnummer
3. Ob eine USt-IdNr. vorliegt
4. Genaue Hostinger-Serverregion
5. Region des Backblaze-B2-Buckets

---

## 5. Anbieterlage — was die Recherche ergeben hat

**Der entscheidende Fund:** Die meisten Rechtstexte-Generatoren sind für
den **Warenverkauf** gebaut — mit Versand, Lieferzeiten und
Rücksendungen. Das passt auf VERA **nicht**, und ein solcher Text würde
genau an der Stelle falsch, auf die es hier ankommt: dem Widerrufsrecht.

Es gibt jedoch **spezialisierte Rechtstexte für den Online-Verkauf von
Veranstaltungstickets** — ausdrücklich für Anbieter, die über einen
eigenen Shop Tickets für termingebundene Freizeitveranstaltungen
verkaufen. Das ist genau VERAs Fall. Nach der gefundenen Darstellung
greift der Ausschluss des Widerrufsrechts nach § 312g Abs. 2 Nr. 9 BGB
dann, wenn der Unternehmer **selbst das Risiko leerer Plätze trägt** —
was auf VERA als Veranstalter zutrifft, anders als auf ein
Zweitmarkt-Portal. **Das ist eine Feststellung aus der Recherche, keine
rechtliche Beurteilung** — sie zeigt nur, dass es für diesen Fall
passende, fertige Produkte gibt.

### Etablierte Anbieter in Deutschland

| Anbieter | Bekannt für |
|---|---|
| **IT-Recht Kanzlei** | Fachanwaltlich betreute Rechtstexte im Abo, mit einem **eigenen Paket für den Ticketverkauf**; laufende Aktualisierung |
| **eRecht24** | Generatoren für Impressum, Datenschutz, AGB, Widerruf; günstiger Einstieg, breit auf Websites ausgerichtet |
| **Händlerbund** | Rechtstexte plus Beratung im Mitgliedsmodell |
| **Trusted Shops** | Rechtstexte als Teil eines größeren Shop-Pakets |

**Preise nenne ich hier bewusst nicht.** Die Anbieterseiten sind aus
dieser Arbeitsumgebung netzwerkseitig gesperrt (gemessen), ich könnte sie
also nur aus dem Gedächtnis zitieren — und veraltete Preise sind
schlimmer als keine. Die allgemeine Suche nennt eine Spanne von etwa
**10 bis 50 € im Monat** je nach Umfang; das ist eine grobe Orientierung,
kein Angebot.

### Worauf beim Vergleich zu achten ist

Diese fünf Fragen entscheiden, ob ein Angebot für VERA taugt:

1. **Deckt es Veranstaltungen ab** — oder nur Warenverkauf mit Versand?
   Das ist die Ausschlussfrage.
2. **Behandelt es § 312g Abs. 2 Nr. 9 BGB** ausdrücklich, statt pauschal
   eine 14-Tage-Belehrung mitzuliefern?
3. **Deckt es Minderjährige** und die Einwilligung Erziehungsberechtigter
   ab?
4. **Sind die genutzten Dienste abgedeckt** — Stripe, ein deutscher
   Hoster, ein verschlüsselter Sicherungsdienst, eine externe
   Erreichbarkeitsprüfung?
5. **Gibt es laufende Aktualisierung** bei Gesetzesänderungen, und wie
   lange bindet der Vertrag?

---

## 6. Was jetzt zu tun ist

| # | Schritt | Wer |
|---|---|---|
| 1 | Ladungsfähige Geschäftsanschrift und Geschäftsnummer besorgen | Betreiber |
| 2 | Anbieter anhand der fünf Fragen vergleichen, Preise am Bildschirm prüfen | Betreiber, gemeinsam |
| 3 | Angaben aus Abschnitt 4 in den Fragebogen des Dienstes übertragen | gemeinsam |
| 4 | Gelieferte Texte in `content/de.ts` einsetzen, Platzhalter-Markierungen entfernen | Claude Code |
| 5 | Pflicht-Häkchen „AGB akzeptiert" ergänzen, sobald echte AGB vorliegen | Claude Code |
| 6 | Prüfliste `N` anpassen: sie erwartet heute die Platzhalter | Claude Code |
| 7 | Erst danach Phase 12 (Webhook, echte Testzahlung, Test-Rückerstattung) | gemeinsam |

**Am technischen Stand ändert diese Übersicht nichts.** Datenbank,
Zahlungslogik, Stripe, Nginx, Zertifikate und Deployment bleiben
unberührt; der Testmodus-Riegel bleibt geschlossen.

---

## Quellen der Recherche

- [§ 312g BGB — Widerrufsrecht (dejure.org)](https://dejure.org/gesetze/BGB/312g.html)
- [IT-Recht Kanzlei: AGB für den Online-Verkauf von Veranstaltungstickets](https://www.it-recht-kanzlei.de/agb-ticketverkauf.html)
- [Kein Widerrufsrecht für online erworbene Tickets (SOS Recht)](https://sos-recht.de/news/kein-widerrufsrecht-fuer-online-erworbene-tickets/)
- [Widerrufsrecht bei Zweitmarkt-Tickets (ratgeberrecht.eu)](https://www.ratgeberrecht.eu/aktuell/widerrufsrecht-bei-zweitmarkt-tickets/)
- [Ticketing für Veranstaltungen: Rechtsfragen (eventfaq.de)](https://eventfaq.de/ticketing/)
- [Rechtstexte für Onlineshop: Anbieter, Tipps & Kosten](https://impressum-generator.de/rechtstexte-onlineshop)
