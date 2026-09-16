# 02 — Datenschutzerklärung (Entwurf)

> **Status:** Entwurf, Version 1 vom 16.09.2026. **Nicht anwaltlich geprüft.**
> Ersetzt nicht die bestehende Seite `/datenschutz`. Abschnitt 2 der
> bestehenden Seite (Einverständniserklärungen für Minderjährige) ist
> bereits verbindlich und wird hier **übernommen, nicht neu erfunden**.
>
> **Grundsatz dieses Entwurfs:** Es wird ausschließlich beschrieben, was
> im Code oder in der Serverdokumentation nachweisbar geschieht. Wo eine
> Rechtsgrundlage, eine Frist oder eine Anbieterrolle nicht belegbar ist,
> steht eine Markierung statt einer Vermutung.

---

## Vorbemerkung: technische Maßnahme ≠ gesetzliche Pflicht

Mehrere der unten beschriebenen Maßnahmen (gekürzte IP-Adressen,
verschlüsselte Sicherungen, selbst ausgelieferte Schriften, Verzicht auf
Tracking) sind **freiwillige technische Entscheidungen**. Sie werden hier
als Tatsache beschrieben, nicht als gesetzliche Pflicht dargestellt. Das
ist wichtig: Wer eine freiwillige Maßnahme als Pflicht ausgibt, macht die
Erklärung an dieser Stelle unrichtig.

---

## 1. Verantwortlicher

> Verantwortlicher im Sinne der Datenschutz-Grundverordnung ist:
>
> Adam Maurice Lasarzik
> Mühlenstr. 8a
> 14167 Berlin
> E-Mail: kontakt@veraevents.de
> Telefon: +49 3323 0219825

`[VOR VERWENDUNG KLÄREN: Ist ein Datenschutzbeauftragter zu benennen?
Nach derzeitigem Kenntnisstand nein — Art. 37 DSGVO und § 38 BDSG setzen
in der Regel mindestens 20 mit automatisierter Verarbeitung beschäftigte
Personen voraus. Ein Einzelunternehmen ohne Beschäftigte erfüllt das
nicht. Zu bestätigen, dass auch keine Kerntätigkeit mit umfangreicher
Verarbeitung besonderer Kategorien vorliegt — die freiwilligen
Gesundheitsangaben auf dem Papierformular sind gesondert zu bewerten.]`

---

## 2. Aufruf der Website (Server-Protokolle)

**Was passiert — belegt.** Der Webserver (Nginx) schreibt für jeden
Aufruf eine Zeile mit Zeitpunkt, aufgerufener Adresse, Browserkennung,
Verweisquelle und Host-Kennung.

**Die IP-Adresse wird beim Schreiben gekürzt**: die letzte Stelle wird
verworfen (`179.198.201.39` → `179.198.201.0`). Umgesetzt seit dem
08.09.2026, Konfiguration `server/nginx-protokoll-kuerzen.conf`.

**Aufbewahrung, am Server abgelesen:** Nginx-Protokolle werden täglich
gedreht und in 14 Generationen vorgehalten (rund zwei Wochen). Das
System-Journal ist auf 7 Tage und höchstens 1 GB begrenzt.

**Entwurfstext:**

> Beim Aufruf dieser Website werden technische Daten in einer
> Protokolldatei gespeichert: Zeitpunkt des Aufrufs, die aufgerufene
> Adresse, die verwendete Browser- und Betriebssystemkennung, die
> Verweisquelle und die aufgerufene Domain.
>
> Die IP-Adresse wird dabei **gekürzt** gespeichert — die letzte Stelle
> wird verworfen. Eine einzelne Person lässt sich daraus nicht mehr
> bestimmen; die grobe Herkunft bleibt erkennbar.
>
> Zweck ist der sichere und störungsfreie Betrieb der Website sowie das
> Erkennen und Nachvollziehen von Angriffen. Rechtsgrundlage ist
> Art. 6 Abs. 1 Buchst. f DSGVO; unser berechtigtes Interesse liegt im
> technisch fehlerfreien und sicheren Betrieb.
>
> Die Protokolle werden täglich gedreht und nach rund zwei Wochen
> automatisch gelöscht. Sie werden nicht mit anderen Daten
> zusammengeführt und nicht zur Analyse des Nutzungsverhaltens
> ausgewertet.

---

## 3. Missbrauchsschutz (Bremse gegen Massen-Einsendungen)

**Was passiert — belegt** (`lib/ratelimit.ts`, Tabelle `AnmeldeVersuch`):

- Beim Absenden des Anmeldeformulars und beim Anmelden am
  Verwaltungsbereich wird ein Zähler geführt.
- Als Kennung dient die **IP-Adresse in ungekürzter Form**. Sie steht
  für die Dauer des Zeitfensters im Klartext in der Datenbank.
- Einträge werden automatisch entfernt, sobald sie älter als **60
  Minuten** sind. Eine längere Aufbewahrung findet nicht statt.
- Die E-Mail-Adresse wird für die kontobezogene Bremse **nicht** im
  Klartext gespeichert, sondern nur als Hashwert.

> ⚠️ **Das ist der eine Punkt, an dem die Technik hinter dem übrigen
> Datenschutzniveau zurückbleibt.** Die E-Mail-Adresse wird gehasht, die
> IP-Adresse nicht — obwohl der Zähler mit einem Hash genauso
> funktionieren würde. Siehe `10-rechtstexte-pruefprotokoll.md`,
> Befund T-3. **Solange das so ist, muss es hier stehen.**

**Entwurfstext:**

> Um Massen-Einsendungen und das Durchprobieren von Passwörtern zu
> verhindern, zählen wir Absendeversuche je Absenderadresse. Dafür wird
> die IP-Adresse zusammen mit einem Zeitstempel gespeichert. Diese
> Einträge werden spätestens nach 60 Minuten automatisch gelöscht.
> Rechtsgrundlage ist Art. 6 Abs. 1 Buchst. f DSGVO; unser berechtigtes
> Interesse liegt in der Abwehr missbräuchlicher Nutzung.

---

## 4. Anmeldung zu einer Veranstaltung

**Was tatsächlich erhoben wird — belegt** (`lib/anmeldung.ts`,
`prisma/schema.prisma` → `Registration`, `Participant`):

| Feld | Pflicht | Bemerkung |
|---|---|---|
| Vorname, Nachname der anmeldenden Person | ja | |
| E-Mail-Adresse | ja | für Bestätigung und Stornolink |
| Telefonnummer | nein | `kontaktTelefon` ist nullable |
| Vorname, Nachname je Teilnehmer | ja | |
| Teilnehmerart (Schüler / Erwachsener) | ja | bestimmt den Preis |
| Einwilligung der erziehungsberechtigten Person | ja, bei „Mein Kind" und „Familienpaket" | |
| Einwilligung in Foto- und Videoaufnahmen | **nein, freiwillig** | siehe Dokument 06 |
| Gesamtbetrag, Zahlungsstatus, Zahlungsreferenz | automatisch | |
| Stornoschlüssel | automatisch | Zufallswert für den Link in der Bestätigungsmail |

**Ausdrücklich nicht erhoben:** Geburtsdatum, Anschrift,
Gesundheitsangaben. Das Online-Formular kennt diese Felder nicht.

**Entwurfstext:**

> **Welche Daten.** Für eine Anmeldung verarbeiten wir Vor- und
> Nachnamen der anmeldenden Person, ihre E-Mail-Adresse, auf freiwilliger
> Basis ihre Telefonnummer, sowie Vor- und Nachnamen und die
> Teilnehmerart jeder angemeldeten Person. Hinzu kommen der
> Gesamtbetrag, der Zahlungsstatus und ein zufällig erzeugter Schlüssel,
> mit dem die Buchung über den Link in der Bestätigungsmail aufgerufen
> und storniert werden kann.
>
> **Wozu.** Um den Vertrag über die Teilnahme zu schließen und
> durchzuführen: Platzvergabe, Zahlungsabwicklung, Teilnehmerliste vor
> Ort, Bestätigungs- und Stornomails.
>
> **Rechtsgrundlage.** Art. 6 Abs. 1 Buchst. b DSGVO (Erfüllung des
> Vertrags und vorvertragliche Maßnahmen). Für die Telefonnummer, die
> freiwillig ist: Art. 6 Abs. 1 Buchst. f DSGVO — wir möchten Sie bei
> einer kurzfristigen Änderung erreichen können.
>
> **Folgen einer Nichtangabe.** Ohne die Pflichtangaben kann keine
> Anmeldung entgegengenommen werden. Die Telefonnummer und die
> Einwilligung in Foto- und Videoaufnahmen sind freiwillig; ohne sie ist
> die Teilnahme uneingeschränkt möglich.

---

## 5. Minderjährige Teilnehmer und Sorgeberechtigte

Der bestehende **Abschnitt 2 der Datenschutzseite** (acht Absätze,
`content/de.ts` → `datenschutzMinderjaehrigAbsaetze`) ist bereits
verbindlich, mit der Datenschutzinformation auf Seite 2 der
Einverständniserklärung wörtlich abgestimmt und **wird unverändert
übernommen**.

**Er bleibt inhaltlich richtig** — mit **einer** Lücke, die dieser
Entwurf schließt:

> ⚠️ **Fotos fehlen dort vollständig.** Der Abschnitt zählt Name,
> Geburtsdatum, Mobilnummer, Gesundheitsangaben auf, erwähnt aber
> Foto- und Videoaufnahmen mit keinem Wort — obwohl die erziehungs­
> berechtigte Person im Online-Formular ein Häkchen dafür setzen kann,
> **das für das Kind gilt**. Das Papierformular stellt ausdrücklich
> klar: „Diese Erklärung enthält keine Einwilligung in Foto- oder
> Videoaufnahmen." Damit steht die Einwilligung für Minderjährige
> allein im Online-Formular — in einem einzigen Satz ohne jede
> Information. Siehe Dokument 06 und Befund R-2.

**Zu ergänzender Absatz (neu):**

> Wird über das Anmeldeformular eine Einwilligung in Foto- und
> Videoaufnahmen erteilt und betrifft die Anmeldung minderjährige
> Personen, so gibt die erziehungsberechtigte Person diese Einwilligung
> zugleich für die minderjährige Person ab. Einzelheiten zu Zwecken,
> Veröffentlichungswegen, Dauer und Widerruf stehen in der gesonderten
> Einwilligungserklärung. Die Einwilligung ist freiwillig; die Teilnahme
> hängt nicht von ihr ab. Die auf Papier abgegebene
> Einverständniserklärung für Minderjährige enthält **keine**
> Einwilligung in Foto- oder Videoaufnahmen.

---

## 6. Zahlungsabwicklung

**Was tatsächlich geschieht — belegt** (`lib/zahlung.ts`,
`lib/zahlungRegeln.ts`, `app/zahlung/rueckmeldung/route.ts`):

- Bezahlt wird **ausschließlich auf der von Stripe gehosteten
  Bezahlseite**. Auf der VERA-Seite läuft **kein** Stripe-Skript; es
  wird nichts von fremden Servern nachgeladen.
- An Stripe übermittelt werden: **Betrag, Anmeldenummer,
  E-Mail-Adresse, Titel der Veranstaltung, Anzahl der Personen.**
- Kartennummern, Prüfziffern und Bankdaten erreichen die VERA-Seite zu
  keinem Zeitpunkt — sie werden dort weder entgegengenommen noch
  gespeichert noch protokolliert.
- Zurück kommt eine signaturgeprüfte Rückmeldung mit Zahlungsstatus,
  Betrag und Referenz.

> ⚠️ **Stand der Freischaltung:** `lib/zahlung.ts` weist jeden Schlüssel
> ab, der nicht mit `sk_test_` oder `rk_test_` beginnt. **Es ist bisher
> ausschließlich der Testmodus möglich; echte Zahlungen sind technisch
> gesperrt.** Die Erklärung darf trotzdem bereits so formuliert sein,
> muss aber vor dem Livegang noch einmal gegen den dann tatsächlichen
> Stand gelesen werden.

**Entwurfstext:**

> Für die Bezahlung nutzen wir den Zahlungsdienstleister **Stripe**.
>
> `[VOR VERWENDUNG KLÄREN: vollständige Firmierung und Anschrift der
> für VERA vertragschließenden Stripe-Gesellschaft aus dem eigenen
> Stripe-Konto ablesen — nicht aus fremden Erklärungen abschreiben.]`
>
> Bezahlt wird ausschließlich auf einer von Stripe betriebenen Seite. Wir
> übermitteln dorthin den zu zahlenden Betrag, die Anmeldenummer, Ihre
> E-Mail-Adresse, den Titel der Veranstaltung und die Anzahl der
> angemeldeten Personen. Ihre Zahlungsdaten — Kartennummer, Prüfziffer,
> Bankverbindung — geben Sie unmittelbar bei Stripe ein. Sie erreichen
> unsere Website zu keinem Zeitpunkt und werden von uns weder
> gespeichert noch protokolliert.
>
> Zurück erhalten wir die Information, ob und in welcher Höhe gezahlt
> wurde, sowie eine Zahlungsreferenz. Diese Angaben brauchen wir, um
> Ihre Anmeldung zu bestätigen und um eine Erstattung durchführen zu
> können.
>
> Rechtsgrundlage ist Art. 6 Abs. 1 Buchst. b DSGVO.

`[VOR VERWENDUNG KLÄREN: Rolle von Stripe. Stripe tritt für
Zahlungsdienste weithin als eigenständig Verantwortlicher auf, nicht als
Auftragsverarbeiter. Das ist im eigenen Vertragswerk zu prüfen und
richtig zu benennen — die Rolle bestimmt, ob ein AV-Vertrag nötig ist
und wie die Übermittlung zu beschreiben ist.]`

`[VOR VERWENDUNG KLÄREN: Drittlandbezug. Ob und in welchem Umfang Daten
in die USA gelangen und auf welche Garantien sich das stützt
(Angemessenheitsbeschluss EU-US Data Privacy Framework,
Standardvertragsklauseln), ist aus dem eigenen Stripe-Vertrag zu
belegen. Nicht aus fremden Mustern übernehmen.]`

---

## 7. E-Mail-Versand

**Was tatsächlich verschickt wird — belegt** (`lib/mailVorlagen.ts`,
`docs/email-einrichten.md`):

| Anlass | An wen |
|---|---|
| Anmeldung bestätigt | die anmeldende Person (nur bei kostenlosen Veranstaltungen) |
| Zahlung erhalten | die anmeldende Person |
| Neue Anmeldung | den Veranstalter |
| Stornierung bestätigt | die anmeldende Person |
| Stornierung eingegangen | den Veranstalter |
| Störungs- und Sicherungsmeldungen | den Veranstalter (keine Teilnehmerdaten) |

Versand über das Postfach `kontakt@veraevents.de` bei **Hostinger**
(`smtp.hostinger.com`, Port 465, direktes TLS).

**Entwurfstext:**

> Im Zusammenhang mit Ihrer Anmeldung senden wir Ihnen E-Mails: die
> Bestätigung Ihrer Anmeldung beziehungsweise Ihrer Zahlung und, falls
> Sie stornieren, die Bestätigung der Stornierung. Diese E-Mails gehören
> zur Durchführung des Vertrags; Rechtsgrundlage ist Art. 6 Abs. 1
> Buchst. b DSGVO. Werbe-E-Mails versenden wir nicht.
>
> Für den Versand und das Postfach nutzen wir die E-Mail-Dienste der
> `[VOR VERWENDUNG KLÄREN: vollständige Firmierung und Anschrift der
> Hostinger-Gesellschaft, mit der der Vertrag besteht — aus dem eigenen
> Kundenkonto ablesen.]`. Der Anbieter verarbeitet die Inhalte und
> Verbindungsdaten Ihrer E-Mails in unserem Auftrag.
>
> `[VOR VERWENDUNG KLÄREN: Liegt ein Auftragsverarbeitungsvertrag mit
> Hostinger vor, und deckt er sowohl den Server als auch das Postfach
> ab?]`

---

## 8. Hosting

**Belegt:** eigener virtueller Server (KVM 2) bei Hostinger, Ubuntu
24.04 LTS, Nginx als Reverse Proxy, MariaDB auf demselben Server und nur
an `127.0.0.1` gebunden. Bei der Bestellung wurde ein EU-Standort
gewählt.

`[VOR VERWENDUNG KLÄREN: **genauer Serverstandort.** Im Hostinger-Konto
ablesen und hier benennen. Die Hostname-Kennung `dus.hostingervps.com`
deutet auf Düsseldorf hin — das ist ein Indiz, kein Beleg, und darf so
nicht in die Erklärung.]`

**Entwurfstext:**

> Diese Website wird auf einem von uns angemieteten virtuellen Server
> betrieben. Anbieter ist `[VOR VERWENDUNG KLÄREN: Firmierung und
> Anschrift]`, Standort `[VOR VERWENDUNG KLÄREN: Region]`. Der Anbieter
> verarbeitet die auf dem Server anfallenden Daten in unserem Auftrag auf
> Grundlage eines Auftragsverarbeitungsvertrags.
> Rechtsgrundlage für den Einsatz ist Art. 6 Abs. 1 Buchst. f DSGVO;
> unser berechtigtes Interesse liegt im sicheren und zuverlässigen
> Betrieb der Website.

---

## 9. Datenbank-Sicherung (Backblaze B2)

**Was tatsächlich geschieht — belegt** (`docs/sicherung.md`):

- Jede Nacht um 03:30 Uhr wird die **gesamte Datenbank** gesichert.
- Die Datei wird **vor** dem Hochladen mit einem `age`-Schlüsselpaar
  verschlüsselt.
- Hochgeladen wird zu **Backblaze B2** (Bucket `Vera-sicherungen`).
- Der geheime Schlüssel liegt **nicht auf dem Server und nicht bei
  Backblaze**, sondern ausschließlich im Passwort-Manager des
  Betreibers. Backblaze kann die Sicherungen nicht lesen.
- Objektsperre 90 Tage, Aufbewahrung 180 Tage.

Damit verlassen dieselben personenbezogenen Daten wie in der Datenbank
(Namen, E-Mail-Adressen, Telefonnummern, Teilnehmerangaben,
Zahlungsbezüge) **einmal täglich in verschlüsselter Form** den Server.

**Entwurfstext:**

> Zur Absicherung gegen Datenverlust wird die Datenbank jede Nacht
> gesichert. Die Sicherungsdatei wird **auf unserem Server verschlüsselt**
> und erst danach zu einem externen Speicherdienst übertragen. Der zum
> Entschlüsseln erforderliche Schlüssel befindet sich ausschließlich bei
> uns; der Speicherdienst kann die Sicherungen nicht lesen.
>
> Anbieter des Speicherdienstes ist **Backblaze, Inc.**
> `[VOR VERWENDUNG KLÄREN: vollständige Anschrift sowie die für den
> Bucket tatsächlich gewählte Region — EU oder USA. Dies im
> Backblaze-Konto ablesen.]`
>
> Sicherungen werden nach 180 Tagen gelöscht.
>
> Rechtsgrundlage ist Art. 6 Abs. 1 Buchst. f DSGVO; unser berechtigtes
> Interesse liegt in der Ausfallsicherheit.

`[VOR VERWENDUNG KLÄREN: Auftragsverarbeitungsvertrag mit Backblaze
abgeschlossen? Bei einer Region außerhalb der EU zusätzlich: auf welche
Garantien stützt sich die Übermittlung? Die Verschlüsselung vor dem
Hochladen ist ein starkes Argument, ersetzt die rechtliche Einordnung
aber nicht.]`

---

## 10. Erreichbarkeitsprüfung (UptimeRobot)

**Belegt** (`docs/ueberwachung.md`, `docs/sperre.md`): Seit dem
07.09.2026 ruft **UptimeRobot** (kostenloser Tarif) alle fünf Minuten
eine öffentliche Adresse dieser Website auf, um einen Ausfall zu melden.

Der Dienst erhält dabei **nur das, was jeder Besucher auch bekommt** —
die aufgerufene Seite. Es werden keine Besucher- oder Teilnehmerdaten
übermittelt. Zusätzlich prüft sich der Server alle 15 Minuten selbst
(`vera-wache.timer`); diese Prüfung findet vollständig auf dem eigenen
Server statt.

**Entwurfstext:**

> Damit wir von einem Ausfall der Website erfahren, ruft ein externer
> Überwachungsdienst alle fünf Minuten eine öffentliche Seite auf.
> Anbieter ist `[VOR VERWENDUNG KLÄREN: Firmierung und Anschrift der
> UptimeRobot-Gesellschaft]`. Dabei werden **keine** Daten von Besuchern
> oder Teilnehmenden übermittelt — der Dienst ruft die Seite auf wie ein
> gewöhnlicher Besucher. In unseren Server-Protokollen erscheinen diese
> Aufrufe wie andere auch.
>
> Rechtsgrundlage ist Art. 6 Abs. 1 Buchst. f DSGVO; unser berechtigtes
> Interesse liegt darin, Störungen schnell zu bemerken.

`[VOR VERWENDUNG KLÄREN: Ist ein Auftragsverarbeitungsvertrag mit
UptimeRobot erforderlich? Da keine Nutzerdaten übermittelt werden,
spricht einiges dagegen — der Dienst erzeugt Zugriffe, er verarbeitet
keine. Das gehört fachlich bestätigt, nicht angenommen.]`

---

## 11. Cookies und externe Inhalte

**Belegt durch Volltextsuche über `app/`, `lib/`, `components/`,
`content/`, `next.config.mjs`:**

- **Kein einziger externer Host** wird zur Laufzeit aufgerufen.
  Schriften werden beim Bauen heruntergeladen und von der eigenen
  Domain ausgeliefert.
- Kein Tracking, keine Besucherzählung, keine Werbenetzwerke, keine
  eingebetteten Videos, keine Karten, keine Social-Media-Bausteine.
- **Genau ein Cookie:** `vera_admin`. Es entsteht nur, wenn sich der
  Betreiber am Verwaltungsbereich anmeldet (`lib/adminAuth.ts`), trägt
  `httpOnly` und `SameSite=Lax` und enthält nur einen Zufallsschlüssel.
- Die Vorschau-Sperre (`components/VorschauSperre.tsx`) speichert
  **nichts** — weder Cookie noch `localStorage`.

**Entwurfstext:**

> Diese Website zählt keine Besucher, verfolgt niemanden über andere
> Seiten hinweg und lädt keine Inhalte von fremden Servern nach — auch
> die Schriften liegen auf dieser Domain. Es gibt keine Werbe- oder
> Statistik-Cookies und deshalb auch kein Zustimmungsfenster.
>
> Das einzige Cookie entsteht, wenn sich der Betreiber am
> Verwaltungsbereich anmeldet. Es hält nur diese Anmeldung, ist technisch
> notwendig und für Besucherinnen und Besucher ohne Bedeutung.

**Einordnung:** Ein technisch notwendiges Sitzungscookie für die eigene
Anmeldung des Betreibers ist nach § 25 Abs. 2 Nr. 2 TDDDG nicht
einwilligungsbedürftig. Der Satz „diese Seite setzt keine Cookies" wäre
falsch und steht deshalb bewusst **nicht** in diesem Entwurf.

---

## 12. Verwaltungsbereich

**Belegt:** Zugang nur über ein Konto, das ausschließlich über die
Kommandozeile angelegt werden kann (keine Selbstregistrierung).
Passwörter mit `scrypt` gehasht, Sitzungen in der Datenbank, zweiter
Faktor (TOTP) vorhanden, Bremsen je Adresse und je Konto.

**Entwurfstext:**

> Für die Verwaltung der Veranstaltungen und Anmeldungen gibt es einen
> passwortgeschützten Bereich, der ausschließlich vom Betreiber genutzt
> wird. Dort verarbeitete Daten sind die E-Mail-Adresse und das
> verschlüsselt gespeicherte Passwort des Zugangs sowie Zeitpunkte der
> Anmeldung. Rechtsgrundlage ist Art. 6 Abs. 1 Buchst. f DSGVO.

---

## 13. Foto- und Videoaufnahmen bei Veranstaltungen

Siehe Dokument **06** für den Einwilligungstext selbst.

**Entwurfstext:**

> Bei unseren Veranstaltungen können Foto- und Videoaufnahmen entstehen.
> Aufnahmen, auf denen Teilnehmende erkennbar sind, verwenden wir nur,
> wenn eine Einwilligung vorliegt. Die Einwilligung ist **freiwillig**
> und von der Teilnahme unabhängig; sie kann jederzeit mit Wirkung für
> die Zukunft widerrufen werden. Rechtsgrundlage ist Art. 6 Abs. 1
> Buchst. a DSGVO, bei der Veröffentlichung zusätzlich § 22 KunstUrhG.
> Einzelheiten — welche Aufnahmen, wofür, wo veröffentlicht, wie lange —
> stehen in der gesonderten Einwilligungserklärung.

`[VOR VERWENDUNG KLÄREN: Alle Angaben aus Dokument 06. Ohne sie darf
dieser Abschnitt nicht veröffentlicht werden, weil er sonst auf eine
Erklärung verweist, die es nicht gibt.]`

---

## 14. Empfänger und Auftragsverarbeiter — Übersicht

| Empfänger | Wofür | Was er erhält | Rolle | Standort |
|---|---|---|---|---|
| Hostinger (Server) | Betrieb der Website | alle auf dem Server anfallenden Daten | Auftragsverarbeiter `[bestätigen]` | EU `[Region bestätigen]` |
| Hostinger (Postfach) | E-Mail-Versand und -Empfang | Inhalt und Adressaten der E-Mails | Auftragsverarbeiter `[bestätigen]` | `[bestätigen]` |
| Stripe | Bezahlung | Betrag, Anmeldenummer, E-Mail, Eventtitel, Personenzahl | `[Rolle klären — vermutlich eigenständig Verantwortlicher]` | `[klären]` |
| Backblaze, Inc. | verschlüsselte Sicherungen | verschlüsselte Datei, kein lesbarer Inhalt | Auftragsverarbeiter `[bestätigen]` | `[Region klären]` |
| UptimeRobot | Erreichbarkeitsprüfung | nur öffentliche Seitenaufrufe | `[klären, ob AV nötig]` | `[klären]` |
| Veranstaltungslocation | Entgegennahme der Papierformulare am Empfang | die unterschriebenen Einverständniserklärungen | siehe Datenschutz Abschnitt 2 | Inland |
| Rettungsdienst / ärztliches Personal | Notfall | die im Notfall erforderlichen Angaben | eigener Verantwortlicher | Inland |

**Keine weiteren Empfänger.** Insbesondere keine Werbenetzwerke, keine
Analysedienste, keine sozialen Netzwerke.

---

## 15. Speicherdauer und Löschung

**Belegter Stand — und die offene Stelle:**

| Daten | Dauer | Beleg |
|---|---|---|
| Server-Protokolle (Nginx) | ~14 Tage | Serverkonfiguration |
| System-Journal | 7 Tage | Serverkonfiguration |
| Missbrauchsschutz-Zähler | 60 Minuten | `lib/ratelimit.ts` |
| Verschlüsselte Sicherungen | 180 Tage | `docs/sicherung.md` |
| Gesundheitsangaben auf Papier | spätestens 30 Tage nach Veranstaltungsende | Datenschutz Abschnitt 2 |
| **Anmeldungen und Teilnehmerdaten** | **nicht festgelegt** | ⚠️ siehe unten |

> ⚠️ **Für Anmeldungen gibt es bisher keine automatische Löschfrist.**
> Es existiert eine Anonymisierungsfunktion, die Namen, E-Mail und
> Telefon der Anmeldung **und aller Teilnehmer** überschreibt und die
> Buchung als anonyme Zeile bestehen lässt
> (`lib/anmeldungLoeschbar.ts`). Sie muss aber **von Hand ausgelöst**
> werden. Eine Erklärung darf keine Frist behaupten, die es nicht gibt.

`[VOR VERWENDUNG KLÄREN: Regelaufbewahrungsfrist für Anmeldedaten
festlegen. Zu berücksichtigen: handels- und steuerrechtliche
Aufbewahrungspflichten für Zahlungsvorgänge sowie die
Verjährungsfristen möglicher Ansprüche. Danach entweder die Frist hier
eintragen **und technisch umsetzen**, oder ehrlich beschreiben, dass
gelöscht wird, sobald der Zweck entfällt.]`

**Wichtiger Zusammenhang, der oft übersehen wird:** Wer gelöscht oder
anonymisiert wird, steht noch in den Sicherungen — bis zu 180 Tage lang.
Das gehört in die Erklärung, statt einen Löschvorgang zu versprechen,
der so nicht stattfindet.

**Entwurfstext:**

> Wir löschen personenbezogene Daten, sobald der Zweck ihrer
> Verarbeitung entfällt und keine gesetzliche Aufbewahrungspflicht
> entgegensteht.
>
> Eine Stornierung ist dabei keine Löschung: Die Buchung muss
> gespeichert bleiben, damit Platzzählung und Zahlungsabgleich stimmen.
> Auf Verlangen überschreiben wir Namen, E-Mail-Adresse und
> Telefonnummer der Anmeldung und aller Teilnehmenden; die Buchung
> bleibt dann als anonyme Zeile ohne Personenbezug bestehen.
>
> Bitte beachten Sie: Verschlüsselte Sicherungskopien der Datenbank
> werden 180 Tage aufbewahrt. Gelöschte oder anonymisierte Daten können
> darin noch enthalten sein, bis die betreffende Sicherung turnusmäßig
> verfällt.

---

## 16. Ihre Rechte

**Entwurfstext:**

> Sie haben das Recht,
>
> - Auskunft über die von uns verarbeiteten Daten zu verlangen
>   (Art. 15 DSGVO),
> - deren Berichtigung zu verlangen (Art. 16 DSGVO),
> - deren Löschung zu verlangen (Art. 17 DSGVO),
> - die Einschränkung der Verarbeitung zu verlangen (Art. 18 DSGVO),
> - die Sie betreffenden Daten in einem übertragbaren Format zu
>   erhalten (Art. 20 DSGVO),
> - der Verarbeitung zu widersprechen, soweit sie auf Art. 6 Abs. 1
>   Buchst. f DSGVO beruht (Art. 21 DSGVO),
> - eine erteilte Einwilligung jederzeit mit Wirkung für die Zukunft zu
>   widerrufen, ohne dass die Rechtmäßigkeit der bis dahin erfolgten
>   Verarbeitung berührt wird (Art. 7 Abs. 3 DSGVO).
>
> Wenden Sie sich dafür an kontakt@veraevents.de.
>
> Ihnen steht außerdem ein Beschwerderecht bei einer
> Datenschutz-Aufsichtsbehörde zu (Art. 77 DSGVO). Für uns zuständig
> ist die **Berliner Beauftragte für Datenschutz und
> Informationsfreiheit**.
>
> `[VOR VERWENDUNG KLÄREN: aktuelle Anschrift und Webadresse der
> Behörde von deren eigener Seite übernehmen — nicht aus fremden
> Mustern. Die Zuständigkeit folgt der Niederlassung in Berlin.]`

**Keine automatisierte Entscheidungsfindung.** Es findet kein
Profiling und keine automatisierte Entscheidung im Sinne von Art. 22
DSGVO statt — das ist im Code belegbar, es gibt keine solche Funktion.

---

## 17. Offene Punkte dieses Entwurfs

| Nr. | Was | Warum es nicht selbst entschieden wurde |
|---|---|---|
| D-1 | Genauer Serverstandort Hostinger | nur im Kundenkonto ablesbar |
| D-2 | Firmierungen und Anschriften aller vier Dienstleister | dürfen nicht geraten werden |
| D-3 | Rolle von Stripe (Verantwortlicher oder Auftragsverarbeiter) | folgt aus dem eigenen Vertragswerk |
| D-4 | Drittlandbezug Stripe und Backblaze samt Garantien | rechtliche Bewertung |
| D-5 | Region des Backblaze-Buckets | nur im Konto ablesbar |
| D-6 | AV-Verträge: welche liegen vor | Tatsachenfrage |
| D-7 | Regelaufbewahrungsfrist für Anmeldungen | unternehmerische **und** rechtliche Entscheidung |
| D-8 | Anschrift der Aufsichtsbehörde | von deren Seite zu übernehmen |
| D-9 | Datenschutzbeauftragter nötig? | Bewertung, auch wegen Gesundheitsangaben |
| D-10 | Foto-Einwilligung: alle Angaben aus Dokument 06 | Entscheidung des Unternehmers |
