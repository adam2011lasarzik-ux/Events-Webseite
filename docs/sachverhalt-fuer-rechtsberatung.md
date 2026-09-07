# VERA — Sachverhaltsbeschreibung für die rechtliche Prüfung

**Stand:** 7. September 2026 · **Erstellt für:** die fachkundige Prüfung
von Widerrufsrecht, Datenschutzerklärung und der Frage, ob eigene AGB
verwendet werden sollen.

---

## Wozu dieses Dokument

Die Webseite ist technisch fertig und läuft. Drei rechtliche Fragen sind
offen und hängen zusammen; sie lassen sich in einer Beratung gemeinsam
klären. Dieses Dokument beschreibt **wie der Ablauf tatsächlich
funktioniert**, damit die Prüfung nicht bei Null anfangen muss.

Alle Angaben sind aus dem laufenden Programmcode und der Datenbank
ausgelesen, nicht aus einer Absichtserklärung. Wo etwas noch nicht
feststeht, steht es ausdrücklich als offen dabei.

**Die drei Fragen stehen am Ende, Abschnitt 10.**

---

## 1. Der Anbieter

| | |
|---|---|
| Name | Adam Maurice Lasarzik |
| Rechtsform | Einzelunternehmen, Gewerbe angemeldet, kein Handelsregistereintrag |
| Geschäftsbezeichnung | keine angemeldet — „VERA" wird als Marken-/Projektname verwendet |
| Umsatzsteuer | Kleinunternehmen nach § 19 UStG, keine Umsatzsteuer berechnet oder ausgewiesen |
| USt-IdNr. | ungeklärt, ob eine vorliegt; im Impressum steht deshalb keine |
| E-Mail | kontakt@veraevents.de |
| Anschrift | **noch offen** — es soll eine gemietete, ladungsfähige Geschäftsanschrift werden; die Privatanschrift soll nicht veröffentlicht werden |
| Telefon | **noch offen** — es soll eine getrennte Geschäftsnummer werden |
| Webseite | https://veraevents.de |
| Beschäftigte | keine |

---

## 2. Was angeboten wird

Eintägige Freizeit-Sportveranstaltungen mit **festem Termin und festem
Ort**. Die erste Veranstaltung:

| | |
|---|---|
| Titel | „Padel für Schüler und Eltern" |
| Ort | Padelanlage in Falkensee (Brandenburg) |
| Termin | steht noch nicht fest; wird ein konkreter Kalendertag mit Uhrzeit sein |
| Kapazität | 100 Personen |
| Inhalt | Nutzung der Plätze, Leihschläger und Bälle, ein Betreuer/Trainer vor Ort, der erklärt und Tipps gibt; Essen und Getränke sind vor Ort erhältlich (nicht im Preis enthalten) |
| Zielgruppe | Schüler, Lehrkräfte und Eltern; Vorkenntnisse sind nicht nötig |

**Preise** (Endpreise, ohne ausgewiesene Umsatzsteuer):

| Position | Preis |
|---|---|
| Schüler | 7,00 € |
| Erwachsener | 14,00 € |
| Familienpaket: 2 Erwachsene + 1 Schüler | 30,00 € |
| jeder weitere Schüler im Familienpaket | + 6,00 € |
| Höchstzahl Schüler im Familienpaket | 6 → Höchstpreis 60,00 € |

Der Preis wird **serverseitig** berechnet. Ein aus dem Browser
mitgeschickter Betrag wird nicht gelesen. Der berechnete Gesamtbetrag
wird bei der Anmeldung **eingefroren**: Ändert der Veranstalter später
den Eventpreis, ändert sich der Betrag einer bereits erfolgten Buchung
nicht.

Weitere Veranstaltungsarten (Netzwerk-/Business-Events) sind geplant,
existieren aber noch nicht.

---

## 3. Der Buchungsablauf im Einzelnen

**Anmeldung und Bezahlung sind ein einziger Vorgang.** VERA bietet
**keine Reservierung** an: Es gibt keine Möglichkeit, einen Platz
vorzumerken und später oder gar nicht zu bezahlen. Das Ticket ist erst
mit der **erfolgreichen Zahlung** verbindlich gekauft.

Dass der Platz für 30 Minuten intern mitgezählt wird (Schritt 4), ist
ausschließlich eine technische Absicherung **des laufenden
Kaufvorgangs** — damit der Platz nicht an jemand anderen geht, während
der Kunde auf der Bezahlseite steht. Es ist keine Leistung, die dem
Kunden angeboten oder zugesagt wird.

Dies ist der technisch tatsächlich umgesetzte Ablauf.

**Schritt 1 — Auswahl.** Der Besucher wählt auf der Eventseite, wen er
anmeldet: sich selbst, sein Kind, oder ein Familienpaket. Ein Rechner
zeigt den Gesamtbetrag laufend an. Diese Anzeige ist ausdrücklich nur
eine Vorschau.

**Schritt 2 — Eingaben.** Erhoben werden:

- von der **anmeldenden Person**: Vorname, Nachname, E-Mail-Adresse,
  Telefonnummer (freiwillig)
- von **jeder teilnehmenden Person**: Vorname, Nachname, Typ (Schüler
  oder Erwachsener)
- ein Häkchen **Einwilligung der Erziehungsberechtigten** — Pflicht,
  sobald Minderjährige angemeldet werden
- ein Häkchen **Foto-Einwilligung** — getrennt und **freiwillig**; die
  Anmeldung darf daran nicht scheitern

Ein Geburtsdatum wird **nicht** erhoben. Das Datenmodell sieht optional
ein Geburtsjahr vor, das Formular fragt es derzeit nicht ab.

**Schritt 3 — Absenden.** Der Knopf trägt den Betrag im Klartext:
„Jetzt anmelden & bezahlen – 50,00 €". Bei einer kostenlosen
Veranstaltung stünde dort „Jetzt verbindlich anmelden".

**Schritt 4 — Anmeldung speichern, Platz während der Zahlung halten.**
Der Server prüft die freien Plätze innerhalb einer Datenbank-Transaktion
und speichert die Anmeldung. Sie gilt zu diesem Zeitpunkt **weder als
bestätigt noch als bezahlt**; ein Ticket ist damit nicht erworben.

Damit der Platz nicht an jemand anderen geht, solange der Kunde auf der
Bezahlseite steht, wird er intern **30 Minuten** lang mitgezählt.
Läuft diese Zeit ab, zählt der Platz automatisch wieder als frei;
gelöscht wird dabei nichts. Der interne Datenbankstatus heißt
`RESERVIERT` — **dieser technische Name beschreibt das Halten während
des Kaufvorgangs, keine dem Kunden angebotene Reservierung.**

**Schritt 5 — Bezahlseite.** Der Besucher wird zur gehosteten
Bezahlseite von **Stripe** weitergeleitet (Einzelheiten in Abschnitt 4).

**Schritt 6 — Bestätigung.** Erst wenn Stripe dem Server über eine
signaturgeprüfte Rückmeldung den Zahlungseingang meldet, wird die
Anmeldung auf **BESTÄTIGT** und **BEZAHLT** gesetzt und das Halten des
Platzes beendet. **Erst hier ist das Ticket verbindlich gekauft.** Die bloße Rückleitung des Browsers gilt **nicht** als
Zahlungsnachweis; der Betrag wird zusätzlich mit dem gespeicherten
Betrag abgeglichen.

**Schritt 7 — E-Mails.** Der Teilnehmer erhält eine Bestätigung mit den
Buchungsdaten und einem persönlichen Link zur Selbst-Stornierung. Der
Veranstalter erhält eine Benachrichtigung.

**Wenn die Zahlung abgebrochen wird oder fehlschlägt:** Die Anmeldung
bleibt bestehen und wird auf einer Abschluss-Seite als *„noch nicht
abgeschlossen"* dargestellt, mit einem Knopf „Jetzt bezahlen". Es
erscheint ausdrücklich **kein** „Danke"-Text — es ist nichts gekauft.
Der Kunde kann den Kauf über diesen Knopf fortsetzen; das ist die
Fortsetzung desselben Vorgangs, keine Einlösung einer Reservierung.
Läuft die Haltezeit ab, zählt der Platz automatisch wieder als frei,
und beim nächsten Anlauf wird erneut geprüft, ob überhaupt noch genug
Plätze vorhanden sind.

**Doppelbuchungsschutz:** Pro Veranstaltung und E-Mail-Adresse gibt es
genau eine Anmeldung. Meldet sich jemand nach einer Stornierung erneut
an, wird derselbe Datensatz reaktiviert.

---

## 4. Zahlung

- Zahlungsdienstleister ist **Stripe**. Bezahlt wird **ausschließlich
  auf der von Stripe gehosteten Bezahlseite**.
- Auf veraevents.de läuft **kein** Stripe-Skript; es wird nichts von
  fremden Servern nachgeladen.
- **Karten- und Bankdaten erreichen die Seite von VERA zu keinem
  Zeitpunkt** — sie werden dort weder entgegengenommen noch
  protokolliert noch gespeichert.
- Zahlungsarten: Kartenzahlung (erscheint auf Apple- bzw.
  Android-Geräten als Apple Pay / Google Pay) und PayPal.
- An Stripe übermittelt werden: **Betrag, Anmeldenummer,
  E-Mail-Adresse, Titel der Veranstaltung und Anzahl der Personen.**
  Die Beschriftung auf der Bezahlseite lautet z. B. „2 Personen ·
  Gesamtpreis, keine Umsatzsteuer (§ 19 UStG)".
- Ein Auftragsverarbeitungsvertrag bzw. dessen Einordnung mit Stripe
  ist noch nicht geprüft.

**Aktueller Betriebszustand:** Stripe läuft im **Testmodus**. Der Code
weist einen Echtbetrieb-Schlüssel aktiv zurück; die Freischaltung ist
ein bewusster späterer Schritt. Es hat noch **keine echte Zahlung**
stattgefunden.

---

## 5. Stornierung und Erstattung — bereits festgelegt

Diese Regeln sind vom Veranstalter entschieden und **technisch
umgesetzt**:

| | |
|---|---|
| Frist | bis **24 Stunden vor Veranstaltungsbeginn** |
| Erstattung | **voller** gezahlter Betrag, automatisch |
| Weg | Stripe erstattet auf die ursprünglich verwendete Zahlungsmethode |
| Wie | der Teilnehmer storniert **selbst** über einen persönlichen Link aus seiner Bestätigungsmail |
| Danach | der Platz wird sofort wieder frei; Teilnehmer und Veranstalter erhalten je eine E-Mail |
| Später als 24 Stunden vorher | keine automatische Erstattung; auf der Webseite steht: „Bei einer Absage weniger als 24 Stunden vor Beginn und bei Nichterscheinen besteht grundsätzlich kein Anspruch auf Erstattung." |
| Kulanz | der Veranstalter kann jederzeit von Hand erstatten; die Buchung wird dabei korrekt mitgeführt |

Technische Absicherungen: Die Erstattung wird **vor** der Statusänderung
ausgelöst — scheitert sie, bleibt die Buchung unangetastet, statt
„storniert und erstattet" anzuzeigen, ohne dass Geld geflossen ist. Eine
bereits erstattete Buchung fasst die Selbstbedienung nicht mehr an. Der
Storno-Link enthält einen eigenen Zufallsschlüssel; die Anmeldenummer
allein genügt nicht, und storniert wird nur über eine ausdrückliche
Bestätigung, nie durch bloßes Aufrufen des Links.

**Es gibt keine Mindestteilnehmerzahl.** Der Veranstalter hat sich
ausdrücklich dagegen entschieden.

---

## 6. Minderjährige

- Bei den Buchungswegen „Mein Kind" und „Familienpaket" ist die
  **Einwilligung der Erziehungsberechtigten Pflicht**. Ohne das Häkchen
  wird die Anmeldung serverseitig abgelehnt und nichts gespeichert.
- Die **anmeldende Person** ist in diesen Fällen der Erziehungs-
  berechtigte und damit der Vertragspartner; das Kind ist Teilnehmer,
  nicht Vertragspartner.
- Die Buchung wird intern als Vormundbuchung gekennzeichnet.
- Die **Foto-Einwilligung ist davon getrennt und freiwillig.**
- Es wird kein Geburtsdatum erhoben; die Unterscheidung ergibt sich aus
  dem gewählten Buchungsweg und dem Teilnehmertyp.

---

## 7. Welche Daten gespeichert werden

**Je Anmeldung:** Vorname, Nachname, E-Mail-Adresse, Telefonnummer
(freiwillig), Buchungsart, Status, die beiden Einwilligungen, der
eingefrorene Gesamtpreis, Zahlungsstatus und -weg, die Referenzen des
Zahlungsanbieters, gezahlter Betrag und Zahlungszeitpunkt, der Zeitpunkt
bis zu dem der Platz während der Zahlung gehalten wird, Zeitpunkte von
Anmeldung, Reaktivierung und Stornierung.

**Je teilnehmender Person:** Vorname, Nachname, Typ (Schüler oder
Erwachsener), optional ein Geburtsjahr (wird derzeit nicht abgefragt).

**Außerdem:** Zur Abwehr von Massenanmeldungen werden Anmeldeversuche je
IP-Adresse in einem Zeitfenster gezählt (5 Versuche pro Stunde). Ein
unsichtbares Zusatzfeld erkennt automatisierte Absender.

**Cookies:** Es gibt **keine** Tracking-, Statistik- oder Werbecookies
und deshalb **kein Zustimmungsfenster**. Schriften werden von der
eigenen Domain ausgeliefert, es wird nichts von fremden Servern
geladen. Das einzige Cookie entsteht, wenn sich der Betreiber selbst am
Verwaltungsbereich anmeldet.

**Server-Protokolle.** Der Webserver (Nginx) schreibt für jeden Aufruf
eine Zeile mit **IP-Adresse**, Zeitpunkt, aufgerufener Adresse,
Browserkennung und Verweisquelle — die Voreinstellung von Ubuntu. Die
Anwendung selbst protokolliert nur technische Fehler, keine
Personendaten, keine Passwörter, keine Zahlungsdaten.

Eine **Aufbewahrungsfrist für diese Protokolle ist bisher nicht
festgelegt** (Ubuntu dreht sie standardmäßig wöchentlich und hält
mehrere Wochen vor). Ob die Aufbewahrung verkürzt oder die IP-Adresse
gekürzt werden sollte, ist eine der Fragen an die Beratung.

**Erreichbarkeitsprüfung durch einen Dritten.** Seit dem 7. September
2026 ruft **UptimeRobot** alle fünf Minuten die öffentliche Startseite
auf, um einen Ausfall zu melden. Der Dienst erhält dabei nur, was jeder
Besucher auch bekommt — die öffentliche Seite. Es werden **keine
Besucher- oder Teilnehmerdaten** übermittelt. UptimeRobot bietet eine
Auftragsverarbeitungsvereinbarung an; ob eine solche hier nötig ist,
gehört mit geprüft.

**Serverstandort:** eigener virtueller Server bei Hostinger, bei der
Bestellung wurde ein EU-Standort gewählt. Die genaue Region ist vom
Betreiber im Kundenkonto zu bestätigen, bevor sie in der
Datenschutzerklärung benannt wird.

**Löschung:** Eine Stornierung ist **keine** Löschung — sie muss
gespeichert bleiben, damit Platzzählung und Zahlungsabgleich stimmen.
Für ein Löschverlangen gibt es eine eigene Funktion, die Namen, E-Mail
und Telefonnummer **der Anmeldung und aller Teilnehmer** überschreibt;
die Buchung bleibt als anonyme Zeile bestehen. **Eine automatische
Löschfrist ist bisher nicht festgelegt.** Verschlüsselte
Datenbanksicherungen werden derzeit 180 Tage aufbewahrt.

---

## 8. Was auf der Webseite bereits steht

| Seite | Stand |
|---|---|
| `/impressum` | Name, Kontakt, Rechtsform, § 19 UStG — Anschrift und Telefon sichtbar als Platzhalter markiert |
| `/datenschutz` | **Platzhalter.** Die Angaben zu Stripe und zu den Cookies sind bereits sachlich richtig hinterlegt, eine ausformulierte Erklärung fehlt |
| `/agb` | **Platzhalter.** Enthält den Hinweis, dass eigene AGB nicht vorgeschrieben sind, und eine Aufzählung dessen, was hineingehörte |
| `/widerruf` | Heißt bewusst „Widerruf und Stornierung", **enthält keine Widerrufsbelehrung** (siehe Frage 1). Die Stornobedingungen aus Abschnitt 5 stehen dort ausformuliert |

Alle vier Seiten sind aus dem Fußbereich **jeder** Seite erreichbar,
also auch aus dem Anmeldeformular und der Abschluss-Seite.

**Offener Punkt beim Wortlaut:** Auf der Abschluss-Seite steht derzeit
noch an vier Stellen das Wort „reserviert" (z. B. „Dein Platz ist für
kurze Zeit reserviert"). Das beschreibt zwar den technischen Vorgang
zutreffend, kann aber den Eindruck einer angebotenen Reservierung
erwecken — was ausdrücklich **nicht** gemeint ist (siehe Abschnitt 3).
Der Betreiber hat entschieden, diese Formulierungen anzupassen; der
Ablauf selbst bleibt unverändert.

Es gibt **kein** Pflicht-Häkchen „AGB akzeptiert". Solange die AGB ein
Platzhalter sind, wäre ein solches Häkchen ohne Inhalt. Das Formular
führt die beiden anderen Einwilligungen bereits nach demselben Muster;
ein drittes Feld ließe sich ohne Umbau ergänzen.

---

## 9. Betriebszustand

Die Seite ist unter veraevents.de erreichbar, aber **es hat noch keine
echte Buchung und keine echte Zahlung gegeben**. Der Livegang ist erst
vorgesehen, wenn die hier offenen Punkte geklärt sind.

---

## 10. Die konkreten Fragen an die Beratung

**Frage 1 — Widerrufsrecht.**
Besteht für diese Veranstaltungen ein Widerrufsrecht, oder greift der
Ausschluss nach § 312g Abs. 2 Nr. 9 BGB (Dienstleistungen im Zusammen-
hang mit Freizeitbetätigungen zu einem bestimmten Zeitpunkt)? Es handelt
sich um eintägige Sportveranstaltungen mit festem Datum, festem Ort und
begrenzter Platzzahl.

Falls **kein** Widerrufsrecht besteht: Wie muss darüber informiert
werden? Falls **doch** eines besteht: Wie muss die Belehrung lauten, und
wie verhält sie sich zu den bereits festgelegten Stornobedingungen aus
Abschnitt 5?

Auf der Seite steht derzeit ausdrücklich **keine** Widerrufsbelehrung,
weil eine Belehrung über ein womöglich nicht bestehendes Recht
irreführend wäre.

**Frage 2 — Datenschutzerklärung.**
Auf Grundlage von Abschnitt 7: Welche Rechtsgrundlagen sind je
Verarbeitung anzugeben, welche Speicherdauern sind angemessen (es gibt
bisher weder für die Anmeldedaten noch für die **Server-Protokolle mit
IP-Adressen** eine Löschfrist), und wie sind die beiden Dienstleister —
**Stripe** und **UptimeRobot** — einzuordnen? Zu berücksichtigen: Es nehmen Minderjährige teil, und die
Foto-Einwilligung ist getrennt und freiwillig.

**Frage 3 — Eigene AGB: ja oder nein?**
Falls ja, sollen sie insbesondere abdecken:

1. Vertragspartner — bei Minderjährigen der Erziehungsberechtigte
2. Zustandekommen des Vertrags — nach dem Ablauf in Abschnitt 3 mit der
   erfolgreichen Zahlung, nicht mit dem Absenden des Formulars
3. Leistungsumfang — und was **nicht** enthalten ist (Anreise,
   Versicherung, Verpflegung)
4. Preise und Zahlung — siehe Abschnitt 2 und 4
5. Stornierung — Verweis auf die bereits festgelegten Regeln
   (Abschnitt 5)
6. **Absage oder Verlegung durch VERA** — bisher ungeregelt; gemeint
   sind Wetter, Ausfall des Betreuers, zu geringe Beteiligung
7. **Haftung** — insbesondere für Sportverletzungen; nach Einschätzung
   des Betreibers der wichtigste Punkt
8. **Verhalten vor Ort** — Anweisungen der Betreuer, Hausordnung der
   Anlage, Ausschluss bei grobem Fehlverhalten

Zusätzlich zu prüfen: Welche vorvertraglichen Informationspflichten im
Fernabsatz gelten, und ob dafür Anpassungen am Formular oder an der
Abschluss-Seite nötig sind.

---

## Anhang — bewusst weggelassene Standardbausteine

Beides bitte gegenprüfen:

- **Link zur EU-Streitschlichtungsplattform:** weggelassen, weil die
  Plattform eingestellt wurde und der übliche Textbaustein ins Leere
  zeigt.
- **Hinweis nach § 36 VSBG:** weggelassen, weil die Informationspflicht
  erst ab mehr als zehn Beschäftigten gilt; VERA hat keine
  Beschäftigten.

---

*Dieses Dokument beschreibt Technik und Abläufe. Es enthält bewusst
keine rechtliche Bewertung.*
