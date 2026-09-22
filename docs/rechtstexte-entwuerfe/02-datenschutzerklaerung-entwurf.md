# 02 — Datenschutzerklärung (Entwurf)

> **Status:** Entwurf, **Version 2 vom 18.09.2026**. **Nicht anwaltlich
> geprüft.** Ersetzt nicht die bestehende Seite `/datenschutz`. Abschnitt 2
> der bestehenden Seite (Einverständniserklärungen für Minderjährige) ist
> bereits verbindlich und wird hier **übernommen, nicht neu erfunden**.
>
> **Was sich gegenüber Version 1 geändert hat:** Ziffer 15
> (Speicherdauer) ist an das inzwischen gebaute und produktive
> Löschkonzept (K1–K8) angepasst — die frühere Aussage „keine
> automatische Löschfrist" gilt nicht mehr. Neu: Ziffer 4b
> (Anwesenheitsliste), PayPal in Ziffer 6 und Ziffer 14, eine erste
> recherchierte Einordnung der Stripe-/PayPal-Rollen (Dokument 14).
>
> **Stand 20.09.2026:** Die Vertragsgesellschaften sind von Adam
> anhand der Anbieterunterlagen bestätigt und im Text eingesetzt —
> **Hostinger International Ltd.** (Larnaca, Zypern) für Server und
> E-Mail, **Stripe Payments Europe, Limited** für die
> Datenverarbeitung und gegebenenfalls **Stripe Technology Europe,
> Limited** für bestimmte Zahlungsdienste (beide Irland). Offen
> Die Anschriften beider Stripe-Gesellschaften sind ebenfalls
> bestätigt und eingesetzt. **Damit ist Punkt 1.5 vollständig
> erledigt.** Ebenso **Punkt 1.8**: Bei allen vier Dienstleistern ist
> der Auftragsverarbeitungsvertrag automatisch per Verweis in die
> Kontoeröffnung einbezogen — auch bei UptimeRobot, dem bisher
> einzigen unklaren Fall. Quellen und Prüfweg stehen in Dokument 14,
> Abschnitt „Nachtrag 20.09.2026".
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
| ~~Einwilligung in Foto- und Videoaufnahmen~~ | 🛑 **überholt seit 19.09.2026** | Es gibt **keine** Foto-Einwilligung mehr. An ihre Stelle tritt ein **verpflichtendes Kenntnisnahme-Häkchen** und das **Widerspruchsrecht** nach Art. 21 DS-GVO — Dokument 06, Teil VIII. |
| Kenntnisnahme des Hinweises zu Foto-, Video- und allgemeinen Tonaufnahmen | **ja, verpflichtend** | keine Einwilligung, sondern Information |
| Widerspruch gegen Übersichtsaufnahmen | **freiwillig**, jederzeit | zu speichern, damit er vor Veröffentlichung umgesetzt werden kann (B-10 neu) |
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
> Anmeldung entgegengenommen werden. Die Telefonnummer ist freiwillig;
> ohne sie ist die Teilnahme uneingeschränkt möglich.
>
> `[AKTUALISIERT 20.09.2026: Der frühere Verweis auf eine freiwillige
> Foto-Einwilligung ist entfallen — es gibt keine. Die Kenntnisnahme des
> Aufnahmehinweises ist verpflichtend, der Widerspruch gegen
> Übersichtsaufnahmen jederzeit möglich und folgenlos.]`

---

## 4b. Ankommen vor Ort (Anwesenheitsliste) — neu, Stand 18.09.2026

> ✅ **Neue Verarbeitung**, die sich aus Dokument 11, Entscheidung 3.27
> ergibt und bisher in keiner Fassung dieser Erklärung stand.

Beim Ankommen wird auf einer ausgedruckten Teilnehmerliste vermerkt,
wer erschienen ist. Bei unbegleiteten minderjährigen Teilnehmenden wird
zusätzlich die unterschriebene Einverständniserklärung entgegengenommen
(siehe Dokument 05); bei begleiteten eine Kurzbestätigung der
anwesenden erziehungsberechtigten Person.

> **Welche Daten.** Name der teilnehmenden Person, Ankunftszeit, das
> Kürzel der Person, die den Vermerk vornimmt — bei Minderjährigen
> zusätzlich die Angaben aus der Einverständniserklärung.
>
> **Wozu.** Um im Notfall schnell feststellen zu können, wer vor Ort
> ist, sowie zur Platz- und Anwesenheitskontrolle. **Nicht**, um zu
> überwachen, wer das Gelände wann verlässt — das findet nicht statt
> (siehe Dokument 05 und Dokument 09, Ziffer 1.2).
>
> **Rechtsgrundlage.** Art. 6 Abs. 1 Buchst. f DSGVO (berechtigtes
> Interesse an einem funktionierenden Notfallmanagement und einer
> geordneten Durchführung).
>
> **Wie lange.** Die ausgedruckte Teilnehmerliste wird nach der
> Veranstaltung digitalisiert oder vernichtet; ein von Namen bereinigter
> Nachweis (Löschklasse K5) wird bis zu 3 Jahre aufbewahrt.

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

> 🛑 **Überholt seit 19.09.2026 — ersetzt durch den folgenden Absatz.**
> Der frühere Text setzte eine Foto-Einwilligung voraus, die es nicht
> mehr gibt.

**Ersetzender Absatz:**

> Bei unseren Veranstaltungen entstehen **Übersichtsaufnahmen**, auf
> denen keine einzelne Person im Mittelpunkt steht; Videoaufnahmen
> können allgemeine Umgebungsgeräusche enthalten. Grundlage ist unser
> berechtigtes Interesse an der Darstellung unserer Tätigkeit; eine
> Einwilligung wird dafür **nicht** erhoben. Sie können der Anfertigung
> und Veröffentlichung jederzeit **widersprechen** — vorab, beim
> Check-in oder während der Veranstaltung. Ein Widerspruch muss nicht
> begründet werden und hat keine Auswirkung auf die Teilnahme; er gilt
> auch für die von Ihnen angemeldeten Personen. Die auf Papier
> abgegebene Einverständniserklärung für Minderjährige enthält **keine**
> Erklärung zu Foto- oder Videoaufnahmen.

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
- Als Zahlungsart steht neben der Karte auch **PayPal** zur Verfügung
  (`lib/zahlung.ts` → `payment_method_types: ["card", "paypal"]`). Wer
  PayPal wählt, wird innerhalb der Stripe-Bezahlseite zu PayPal
  weitergeleitet und gibt seine PayPal-Zugangsdaten dort, **nicht** bei
  VERA oder auf einer VERA-Seite, ein.

> ⚠️ **Stand der Freischaltung:** `lib/zahlung.ts` weist jeden Schlüssel
> ab, der nicht mit `sk_test_` oder `rk_test_` beginnt. **Es ist bisher
> ausschließlich der Testmodus möglich; echte Zahlungen sind technisch
> gesperrt.** Die Erklärung darf trotzdem bereits so formuliert sein,
> muss aber vor dem Livegang noch einmal gegen den dann tatsächlichen
> Stand gelesen werden.

**Entwurfstext:**

> Für die Bezahlung nutzen wir den Zahlungsdienstleister **Stripe
> Payments Europe, Limited**, One Wilton Park, Wilton Place, Dublin 2, D02 FX04, Irland.
>
> Je nach genutztem Zahlungsdienst kann zusätzlich **Stripe Technology
> Europe, Limited** beteiligt sein, One Wilton Park, Wilton Place, Dublin 2, D02 FX04, Irland.
>
> Bezahlt wird ausschließlich auf einer von Stripe betriebenen Seite. Wir
> übermitteln dorthin den zu zahlenden Betrag, die Anmeldenummer, Ihre
> E-Mail-Adresse, den Titel der Veranstaltung und die Anzahl der
> angemeldeten Personen. Ihre Zahlungsdaten — Kartennummer, Prüfziffer,
> Bankverbindung — geben Sie unmittelbar bei Stripe ein. Sie erreichen
> unsere Website zu keinem Zeitpunkt und werden von uns weder
> gespeichert noch protokolliert.

> ✅ **Am 20.09.2026 von Adam anhand der Stripe-Rechtsdokumente
> bestätigt — die beiden Gesellschaften stehen damit fest:**
>
> - **Stripe Payments Europe, Limited (SPEL)** ist nach dem aktuellen
>   Stripe-Datenverarbeitungsvertrag bei einem **deutschen Konto** für
>   die Datenverarbeitung zuständig.
> - Der **Stripe-Rahmenvertrag** nennt zusätzlich **Stripe Technology
>   Europe, Limited (STEL)** als mögliche weitere Vertragspartei für
>   bestimmte Zahlungsdienste.
>
> Damit ist die frühere Unsicherheit („mehrere Gesellschaften möglich")
> aufgelöst: Es sind diese beiden, und beide sitzen in **Irland**, also
> innerhalb der EU. Ein Drittlandbezug entsteht aus der Gesellschaft
> selbst nicht.

> ✅ **Anschriften am 20.09.2026 von Adam aus den Stripe-Rechtsdokumenten
> bestätigt und eingesetzt.** Für **beide** Gesellschaften gilt derzeit
> dieselbe Anschrift: One Wilton Park, Wilton Place, Dublin 2, D02 FX04,
> Irland.
>
> **Zum Weg dorthin, weil er für spätere Aktualisierungen zählt:**
> `stripe.com` und `support.stripe.com` sind aus der Arbeitsumgebung des
> Entwicklers netzwerkseitig gesperrt (geprüft am 20.09.2026, beide
> Abrufe vom Egress-Proxy abgewiesen). Die Anschrift stand zwischenzeitlich
> schon einmal hier, stammte aber aus Sekundärrecherche und wurde deshalb
> **entfernt**; eingesetzt ist sie erst jetzt, nachdem Adam sie im
> Stripe-Dokument selbst gelesen hat. Dass beide Angaben übereinstimmen,
> ändert daran nichts: Belegt ist sie erst seit der Bestätigung.
>
> ⚠️ **Bei einer späteren Aktualisierung derselbe Weg.** Die Anschrift
> kann sich ändern, und nachprüfen lässt sie sich nur im
> Stripe-Konto — nicht von hier aus. Wer den Text irgendwann
> überarbeitet, liest sie erneut im Stripe-Datenverarbeitungsvertrag
> beziehungsweise im Abschnitt „Definitionen" der Stripe Services
> Agreement nach.
>
> Zurück erhalten wir die Information, ob und in welcher Höhe gezahlt
> wurde, sowie eine Zahlungsreferenz. Diese Angaben brauchen wir, um
> Ihre Anmeldung zu bestätigen und um eine Erstattung durchführen zu
> können.
>
> Wenn Sie als Zahlungsart PayPal wählen, geben Sie Ihre
> PayPal-Zugangsdaten unmittelbar bei PayPal ein; PayPal verarbeitet
> diese Daten dann in eigener Verantwortung.
>
> Rechtsgrundlage ist Art. 6 Abs. 1 Buchst. b DSGVO.

> 🔎 **Recherchiert am 18.09.2026 (Such-Zusammenfassungen, siehe
> Dokument 14) — als Prüfauftrag zu lesen, nicht als bestätigtes
> Ergebnis:** Stripe wird verbreitet als **doppelte Rolle** beschrieben
> — Auftragsverarbeiter für die reine Zahlungsabwicklung (Art. 28
> DSGVO), zugleich eigenständig Verantwortlicher für eigene regulatorische
> Pflichten (etwa Geldwäscheprävention). **PayPal tritt nach verbreiteter
> Einschätzung nicht als Auftragsverarbeiter, sondern durchgehend als
> eigenständig Verantwortlicher auf.**
>
> ✅ **Zum Auftragsverarbeitungsvertrag selbst, recherchiert 18.09.2026
> (Dokument 14/15):** Stripes DPA (einschließlich „Data Transfers
> Addendum") ist **per Verweis in die Stripe Services Agreement
> eingebunden** — mit der Kontoeröffnung und Vertragsannahme gilt er als
> abgeschlossen, ohne separate Unterschrift.
>
> `[VOR VERWENDUNG KLÄREN: Die genaue Rollenverteilung (Verantwortlicher/
> Auftragsverarbeiter je Tätigkeit) und der Drittlandbezug
> (Angemessenheitsbeschluss EU-US Data Privacy Framework oder
> Standardvertragsklauseln) sind aus den „Definitionen" der eigenen
> Stripe Services Agreement zu bestätigen, nicht aus fremden Mustern zu
> übernehmen.]`

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
> **Hostinger International Ltd.**, 61 Lordou Vironos Street, 6023
> Larnaca, Zypern. Der Anbieter verarbeitet die Inhalte und
> Verbindungsdaten Ihrer E-Mails in unserem Auftrag.

> ✅ **Am 20.09.2026 von Adam bestätigt.** Die frühere Unsicherheit ist
> damit aufgelöst: Es ist **Hostinger International Ltd.** in Larnaca,
> Zypern — **nicht** Hostinger Global S.à r.l. (Luxemburg), die als
> zweite Möglichkeit im Raum stand. Zypern liegt in der EU; ein
> Drittlandbezug entsteht aus der Gesellschaft nicht.
>
> **Dieselbe Gesellschaft gilt auch für den Server** (Abschnitt 8) —
> Hosting und E-Mail laufen über denselben Vertrag. Beide Stellen
> müssen dieselbe Firmierung tragen.
>
> ✅ **Recherchiert 18.09.2026 (Dokument 14/15):** Hostingers
> Auftragsverarbeitungsvertrag (einschließlich EU-Standardvertrags­
> klauseln) ist **per Verweis in die Nutzungsbedingungen eingebunden**
> — mit der Annahme der Nutzungsbedingungen gilt er nach Hostingers
> eigenen Angaben als abgeschlossen, ohne separate Unterschrift. Das
> deckt sowohl den Server als auch das Postfach ab, soweit beide unter
> demselben Vertragswerk laufen.

---

## 8. Hosting

**Belegt:** eigener virtueller Server (KVM 2) bei Hostinger, Ubuntu
24.04 LTS, Nginx als Reverse Proxy, MariaDB auf demselben Server und nur
an `127.0.0.1` gebunden. Bei der Bestellung wurde ein EU-Standort
gewählt.

✅ **Bestätigt von Adam am 18.09.2026: Frankreich.** Die frühere
Vermutung „Düsseldorf" stützte sich nur auf die Hostname-Kennung
`dus.hostingervps.com` — ein Indiz, kein Beleg, und damit durch die
echte Angabe aus hPanel überholt. `[VOR VERWENDUNG KLÄREN, optional:
genaue Stadt/Rechenzentrum in Frankreich, falls hPanel das einmal
verlässlich anzeigt — „Frankreich" allein reicht als Ländername für
die Erklärung.]`

**Entwurfstext:**

> Diese Website wird auf einem von uns angemieteten virtuellen Server
> betrieben. Anbieter ist die **Hostinger International Ltd.**, 61
> Lordou Vironos Street, 6023 Larnaca, Zypern; Standort des Servers ist
> **Frankreich**. Der Anbieter
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
> Anbieter des Speicherdienstes ist **Backblaze, Inc.**, 500 Ben
> Franklin Ct, San Mateo, CA 94401, USA (recherchiert 18.09.2026,
> Dokument 14/15 — Backblaze nennt nur diese eine Gesellschaft). Der
> genutzte Speicherort (Bucket „Vera-Sicherungen") liegt **in der EU**
> (Endpoint `s3.eu-central-003.backblazeb2.com`, bestätigt von Adam am
> 18.09.2026).
>
> Sicherungen werden nach 180 Tagen gelöscht.
>
> Rechtsgrundlage ist Art. 6 Abs. 1 Buchst. f DSGVO; unser berechtigtes
> Interesse liegt in der Ausfallsicherheit.

✅ **Recherchiert 18.09.2026 (Dokument 14/15):** Auch Backblazes
Auftragsverarbeitungsvertrag ist per Verweis in die Nutzungsbedingungen
eingebunden — für Kunden aus der EU/EWR gilt zusätzlich eine eigene
„DPA for EEA/EU Residents"-Fassung, die im Konfliktfall Vorrang hat.
Kein separater Vertragsschluss nötig.

`[Fachlich zu prüfen bleibt trotzdem: Auch bei einem **EU-Speicherort**
bleibt Backblaze, Inc. eine **US-amerikanische Gesellschaft** — ob und
unter welchen Garantien (Angemessenheitsbeschluss EU-US Data Privacy
Framework, Standardvertragsklauseln) sie dadurch weiterhin
zugriffsberechtigt sein könnte (z. B. über den US CLOUD Act), ist eine
fachliche Frage, die die EU-Speicherregion allein nicht beantwortet.
Die Verschlüsselung vor dem Hochladen — der Schlüssel bleibt bei VERA —
ist hier das stärkste Argument: Selbst bei einem Zugriff auf die
Speicherebene bliebe der Inhalt unlesbar.]`

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
> Anbieter ist **UptimeRobot s. r. o.**, Obchodná 507/2, Bratislava —
> mestská časť Staré Mesto, 811 06 Bratislava, Slowakei. Dabei werden
> **keine** Daten von Besuchern
> oder Teilnehmenden übermittelt — der Dienst ruft die Seite auf wie ein
> gewöhnlicher Besucher. In unseren Server-Protokollen erscheinen diese
> Aufrufe wie andere auch.
>
> Rechtsgrundlage ist Art. 6 Abs. 1 Buchst. f DSGVO; unser berechtigtes
> Interesse liegt darin, Störungen schnell zu bemerken.

> ✅ **Am 20.09.2026 von Adam im eigenen Konto geprüft und erledigt:
> Der DPA von UptimeRobot ist automatisch in die Nutzungsbedingungen
> einbezogen; eine gesonderte Unterschrift ist nicht erforderlich.**
>
> **Damit gilt für alle vier Dienstleister dasselbe Bild:** Hostinger,
> Stripe, Backblaze und UptimeRobot binden den Auftragsverarbeitungs­
> vertrag jeweils per Verweis in die Kontoeröffnung ein. Es ist
> nirgends etwas zu unterschreiben, anzufordern oder nachzureichen.
> **Die Anforderung aus Art. 28 Abs. 3 DS-GVO ist damit für alle vier
> erfüllt.**
>
> Die frühere Unsicherheit hatte einen sprachlichen Grund: UptimeRobot
> beschrieb seinen DPA als für Verantwortliche „verfügbar" und „auf
> Anfrage zugänglich", was nach einem gesonderten Schritt klang. Der
> Blick ins Konto hat das geklärt — es ist keiner.

**Nebenbefund, nicht sicherheitsrelevant:** UptimeRobots kostenloser
Tarif hatte zeitweise ein Verbot kommerzieller Nutzung; das wurde nach
Recherche inzwischen (Stand Juni 2026) wieder aufgehoben — kommerzielle
Nutzung ist ausdrücklich erlaubt.

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

> 🛑 **Neufassung vom 19.09.2026 — überholt die beiden folgenden
> Ergänzungen, soweit sie Einwilligungen betreffen.** Es gibt künftig
> **ausschließlich Übersichtsaufnahmen** mit allgemeinem Umgebungston und
> **keine Einwilligung mehr**. Für Ziffer 13 heißt das:
>
> - **Eine** Rechtsgrundlage statt zweier: **Art. 6 Abs. 1 Buchst. f
>   DS-GVO**, bildrechtlich gestützt auf **§ 23 Abs. 1 Nr. 3
>   KunstUrhG**. Der Verweis auf Art. 6 Abs. 1 Buchst. a und § 22
>   KunstUrhG entfällt.
> - **Das Widerspruchsrecht nach Art. 21 DS-GVO** ist der einzige
>   Rechtsbehelf der betroffenen Person und muss nach Art. 21 Abs. 4
>   DS-GVO **ausdrücklich und von anderen Informationen getrennt**
>   dargestellt werden. Der Begriff „Widerruf" darf hier nicht mehr
>   vorkommen — er setzt eine Einwilligung voraus, die es nicht gibt.
> - **Veröffentlicht werden dürfen nur allgemeine Veranstaltungs- und
>   Hallengeräusche.** Verständliche einzelne Gespräche werden entfernt
>   oder stummgeschaltet — vor der Veröffentlichung und vor jeder
>   Weitergabe an die Location.
> - **Die Weitergabe an die Location** steht damit allein auf der
>   Abwägung und ist eine Übermittlung an einen weiteren
>   Verantwortlichen zu **dessen** Werbezwecken. Sie ist der Punkt,
>   der in der anwaltlichen Prüfung am ehesten fällt — siehe Dokument
>   06, Teil VIII.4.
>
> ✅ **Ergänzt 19.09.2026: Die Weitergabe bleibt, mit Bedingungen.** Der
> Veranstaltungsort darf die Übersichtsaufnahmen für seine eigene
> Veranstaltungswerbung verwenden. Für diesen Abschnitt heißt das:
>
> - **Beide Verantwortlichen müssen namentlich genannt werden** — VERA
>   und die Location mit Firmierung und Anschrift je Event (B-11, ✅ erledigt am 21.09.2026) —,
>   dazu beide Zweckrichtungen und alle vier Veröffentlichungskanäle
>   (B-12). „Der Veranstaltungsort" genügt nicht.
> - **Einordnung:** nach dem geplanten Zuschnitt **getrennte,
>   nacheinander tätige Verantwortliche**, keine Auftragsverarbeitung
>   nach Art. 28 DS-GVO. Weil die Abgrenzung zu Art. 26 DS-GVO unscharf
>   ist, wird eine schriftliche Vereinbarung geschlossen, die beide
>   Fälle abdeckt (B-18), und **ihr wesentlicher Inhalt wird hier
>   veröffentlicht** — das erfüllt Art. 26 Abs. 2 Satz 2 DS-GVO
>   vorsorglich.
> - **Klarstellung für die betroffene Person:** Rechte können nach
>   Art. 26 Abs. 3 DS-GVO **gegenüber jedem** der beiden
>   Verantwortlichen geltend gemacht werden. Ein Widerspruch bei VERA
>   genügt; VERA gibt ihn weiter, die Location setzt ihn um.
> - **Vor jeder Weitergabe** wird geprüft, ob widersprechende Personen
>   erkennbar sind, und ob verständliche Gespräche im Ton enthalten
>   sind.

>
> Die beiden folgenden Absätze bleiben als Begründungsmaterial stehen.

> ⚠️ **Ergänzung vom 19.09.2026 (Entscheidung 4.9): zwei Spuren, zwei
> Rechtsgrundlagen.** Der bisherige Entwurfstext oben beschreibt nur die
> Einwilligung. Seit der Entscheidung zum Umgebungston braucht Ziffer 13
> eine **zweite Passage**, sonst fehlt die Rechtsgrundlage für den
> größeren Teil der Aufnahmen:
>
> - **Übersichtsaufnahmen, bei denen keine einzelne Person im Mittelpunkt
>   steht** — einschließlich allgemeiner Umgebungsgeräusche wie Spiel-
>   und Hallengeräuschen und Applaus. Rechtsgrundlage ist **Art. 6 Abs. 1
>   Buchst. f DS-GVO**, bildrechtlich gestützt auf **§ 23 Abs. 1 Nr. 3
>   KunstUrhG**. Berechtigtes Interesse: die Darstellung der eigenen
>   Veranstaltungstätigkeit auf den in Dokument 06 benannten vier
>   Kanälen.
> - **Aufnahmen mit erkennbaren einzelnen Personen** — Rechtsgrundlage
>   bleibt die **freiwillige Einwilligung** nach Art. 6 Abs. 1 Buchst. a
>   DS-GVO, zusätzlich § 22 KunstUrhG.
>
> **Pflichtbestandteil der ersten Spur ist der Hinweis auf das
> Widerspruchsrecht** nach Art. 21 Abs. 1 DS-GVO. Art. 21 Abs. 4 DS-GVO
> verlangt ihn **ausdrücklich und in einer von anderen Informationen
> getrennten Form** — er darf hier also nicht im Fließtext untergehen.
>
> Ebenfalls aufzunehmen: Einzelne Gespräche und private Äußerungen werden
> nicht gezielt aufgenommen und nicht veröffentlicht; ist ein Gespräch
> deutlich verständlich, wird der Ton vor der Veröffentlichung entfernt
> oder bearbeitet. Das ist zugleich die Antwort auf § 201 StGB
> (Dokument 06, Teil VII).

> ✅ **Ergänzung vom 18.09.2026 (Entscheidung 4.4).** Die Veröffentlichung
> erfolgt auf vier benannten Kanälen: Website und offizieller
> Instagram-Kanal von VERA sowie Website und offizieller Instagram-Kanal
> der jeweiligen Veranstaltungslocation. Daraus folgt für diesen
> Abschnitt:
>
> - **Meta wird zum Empfänger.** Mit der Instagram-Veröffentlichung tritt
>   Meta Platforms Ireland Ltd. als weiterer Empfänger hinzu, mit
>   möglicher Übermittlung in die USA. Das gehört in die Übersicht in
>   Ziffer 14 — siehe die dortige Zeile.
> - **Die Location wird zum eigenständig Verantwortlichen** für ihre
>   eigene Veröffentlichung (Entscheidung 4.3). Auch sie gehört in die
>   Übersicht, mit Firmierung je Event (B-11, ✅ erledigt am 21.09.2026 — die Angabe steht in `Event.ortFirma`/`ortRegister` und wird von `/aufnahmen` ausgelesen).
> - **Ziffer 12 bleibt richtig.** Die Aussage „keine
>   Social-Media-Bausteine" betrifft **eingebettete Inhalte auf
>   veraevents.de** — die gibt es weiterhin nicht. Dass VERA selbst
>   Beiträge auf Instagram veröffentlicht, ist etwas anderes und berührt
>   den Besuch der Website nicht. Diese Unterscheidung muss im Text
>   erkennbar bleiben, sonst wirkt sie wie ein Widerspruch.

> ✅ **Ergänzung vom 21.09.2026 (Entscheidung 4.4a — B-14).** Die
> Veröffentlichungswege der **Veranstaltungsstätte** wurden gegenüber
> Entscheidung 4.4 bewusst erweitert: Sie darf Übersichtsaufnahmen nicht
> mehr nur auf ihrer Website und ihrem Instagram-Kanal veröffentlichen,
> sondern auf ihrer **Website und ihren offiziellen Social-Media-Kanälen
> allgemein**, beispielhaft genannt Instagram oder TikTok. Ausdrücklich
> **unverändert**:
>
> - **VERAs eigener Kanal-Umfang** bleibt bei den bisherigen zwei
>   (Website, und — sobald eingerichtet — der eigene Instagram-Kanal).
>   Solange VERA keinen eigenen Instagram-Kanal hat (B-12), bleibt es bei
>   der eigenen Website.
> - **Entscheidung 4.5 (kein Drittempfänger)** bleibt vollständig in
>   Kraft — Presse, Sponsoren und Kooperationspartner erhalten weiterhin
>   keine Aufnahmen.
> - **Kein neuer Empfänger für TikTok/ByteDance in dieser Übersicht.**
>   Nach dem bereits etablierten Phasenmodell (EuGH, Urt. v. 29.07.2019,
>   Rs. C-40/17 — *Fashion ID*, dazu Entscheidung 4.3) ist die
>   Veranstaltungsstätte VERAs alleiniger, eigenständig verantwortlicher
>   Empfänger für die Weitergabe der Übersichtsaufnahme. Was die
>   Veranstaltungsstätte mit dieser Aufnahme anschliessend selbst tut —
>   ob sie sie auf ihrer Website, ihrem Instagram- oder ihrem
>   TikTok-Kanal veröffentlicht — ist eine eigene, nachgelagerte
>   Verarbeitung der Veranstaltungsstätte unter deren eigener
>   Datenschutzerklärung, genau wie VERAs eigenes Verhältnis zu Meta nur
>   für VERAs **eigenen** Instagram-Kanal ausgewiesen ist, nicht für jeden
>   Kanal, auf dem eine VERA-Aufnahme irgendwann landen könnte.
> - Die Zeile zur Veranstaltungsstätte in Ziffer 14 wird entsprechend
>   auf „Website und offizielle Social-Media-Kanäle" verallgemeinert.
>
> Technisch abgesichert wird dies durch das neue Datenmodell
> `Veroeffentlichung` (`prisma/schema.prisma`): Jede Veröffentlichung
> wird mit Ort, Verantwortlichem (VERA oder Veranstaltungsstätte) und
> Zweck festgehalten, admin-verwaltet unter `/admin/aufnahmen`.

> ✅ **Ergänzung vom 21.09.2026 (Dokument 16, Frage 5 beantwortet — B-18
> weiterhin offen).** Die Veranstaltungsstätte hat bestätigt: Sie
> fertigt während der Veranstaltung **auch eigene** Übersichtsaufnahmen
> an, unabhängig von VERA, und veröffentlicht sie über ihre eigenen
> Kanäle. Damit ändert sich die Einordnung aus Dokument 06, Teil VIII.5
> grundlegend — dort war „VERA allein verantwortlich für die
> Anfertigung" ausdrücklich unter dem Vorbehalt formuliert, dass die
> Veranstaltungsstätte NICHT selbst fotografiert. Für diesen Abschnitt
> folgt:
>
> - **Zwei parallele, unabhängige Verarbeitungen statt einer rein
>   sequenziellen Weitergabe.** Neben VERAs eigenen Aufnahmen (mit
>   optionaler Weitergabe an die Veranstaltungsstätte, siehe oben)
>   fertigt die Veranstaltungsstätte **eigene** Aufnahmen an. Für diese
>   eigenen Aufnahmen ist sie von der ersten Sekunde an **eigenständig
>   verantwortlich** — eigene Rechtsgrundlage, eigene
>   Informationspflicht nach Art. 13 DS-GVO. VERA ist für dieses
>   Material **nicht** Verantwortlicher und tritt dafür auch **nicht
>   als Empfänger oder Übermittler** auf — anders als bei der
>   Weitergabe von VERAs eigenem Material.
> - **VERAs Prüfung vor Veröffentlichung greift für dieses Material
>   nicht.** Die Kontrolle, ob widersprechende Personen erkennbar sind
>   (Entscheidung 4.8), findet nur für Material statt, das VERA
>   tatsächlich in der Hand hat. Für die eigenen Aufnahmen der
>   Veranstaltungsstätte lässt sich ein Widerspruch nur über die
>   Veranstaltungsstätte selbst durchsetzen.
> - **Empfänger-Tabelle (Ziffer 14) bleibt unverändert für die
>   Weitergabe VERAs** — sie beschreibt weiterhin nur, was VERA an die
>   Veranstaltungsstätte übermittelt. Die eigenen Aufnahmen der
>   Veranstaltungsstätte werden hier aus Transparenzgründen erwähnt,
>   obwohl VERA dafür keine Verantwortlichkeit trägt und keine
>   Übermittlung stattfindet.
> - **B-18 (schriftliche Vereinbarung) ist damit nicht erledigt, sondern
>   zwingender geworden.** Sie muss jetzt zusätzlich regeln: einen
>   eigenen Vor-Ort-Hinweis und ein eigenes Widerspruchsverfahren der
>   Veranstaltungsstätte für deren eigene Aufnahmen (Dokument 06, Teil
>   VIII.5). Ohne diese Vereinbarung bleibt offen, wie ein Widerspruch
>   gegen die eigenen Aufnahmen der Veranstaltungsstätte dort
>   tatsächlich wirkt.
>
> **Kurzfassung für den Verbrauchertext:** `/aufnahmen` nennt seit
> 21.09.2026 ausdrücklich, dass auch die Veranstaltungsstätte eigene
> Aufnahmen anfertigen und veröffentlichen kann, wer dafür
> verantwortlich ist, und dass ein Widerspruch dagegen zusätzlich
> direkt bei der Veranstaltungsstätte erklärt werden sollte
> (`content/de.ts`). Die Teilnahmebedingungen (`/agb`, Abschnitt 3)
> verweisen mit einem kurzen Satz auf diese Seite und auf diese
> Datenschutzerklärung, ohne den Inhalt zu wiederholen.
>
> ⚠️ **Weiterhin offen und NICHT durch diese Ergänzung ersetzt:** die
> schriftliche Vereinbarung nach B-18 selbst, und die genauen
> Kanalnamen der Veranstaltungsstätte (bleiben `[je Event zu
> ergänzen]`, Ziffer 14).

---

## 14. Empfänger und Auftragsverarbeiter — Übersicht

| Empfänger | Wofür | Was er erhält | Rolle | Standort |
|---|---|---|---|---|
| Hostinger (Server) | Betrieb der Website | alle auf dem Server anfallenden Daten | Auftragsverarbeiter `[bestätigen]` | Server: **Frankreich** (bestätigt 18.09.2026) — Vertragsgesellschaft: **Hostinger International Ltd.**, 61 Lordou Vironos Street, 6023 Larnaca, Zypern (bestätigt 20.09.2026) |
| Hostinger (Postfach) | E-Mail-Versand und -Empfang | Inhalt und Adressaten der E-Mails | Auftragsverarbeiter `[bestätigen]` | wie oben |
| Stripe | Bezahlung | Betrag, Anmeldenummer, E-Mail, Eventtitel, Personenzahl | doppelte Rolle — Auftragsverarbeiter für die Abwicklung, eigenständig Verantwortlicher für eigene Pflichten. **AVV bereits durch Kontoeröffnung wirksam** (per Verweis), genaue Rollenverteilung `[aus eigenem Vertrag bestätigen]` | Gesellschaften: **Stripe Payments Europe, Limited (SPEL)** für die Datenverarbeitung, ggf. zusätzlich **Stripe Technology Europe, Limited (STEL)** für bestimmte Zahlungsdienste — beide **Irland**, One Wilton Park, Wilton Place, Dublin 2, D02 FX04 (bestätigt 20.09.2026). Weiterer Drittlandbezug `[klären]` |
| PayPal (nur bei Auswahl dieser Zahlungsart) | Bezahlung | PayPal-Zugangsdaten, Betrag | eigenständig Verantwortlicher | `[klären]` |
| Backblaze, Inc., 500 Ben Franklin Ct, San Mateo, CA 94401, USA | verschlüsselte Sicherungen | verschlüsselte Datei, kein lesbarer Inhalt | Auftragsverarbeiter `[bestätigen]` | Speicherort: **EU** (Bucket-Endpoint `eu-central-003`, bestätigt 18.09.2026) — Gesellschaft selbst US-amerikanisch, Drittlandbezug `[fachlich zu bewerten]` |
| Meta Platforms Ireland Ltd., Merrion Road, Dublin 4, D04 X2K5, Irland (Instagram) — **sofern Übersichtsaufnahmen veröffentlicht werden** | Veröffentlichung von Aufnahmen auf dem offiziellen Instagram-Kanal von VERA | die veröffentlichte Aufnahme selbst | eigenständig Verantwortlicher | Irland, mit möglicher Übermittlung in die **USA**; Grundlage derzeit der EU-US-Angemessenheitsbeschluss `[Stand 18.09.2026 in Kraft, aber unter Überprüfung — siehe Dokument 06]` |
| Veranstaltungslocation `[Firmierung je Event aus `Event.ortFirma`; erste Veranstaltung: Quality Padel GmbH, Straße der Einheit 112, 14612 Falkensee, Amtsgericht Potsdam, HRB 42437]` — **sofern Übersichtsaufnahmen weitergegeben werden** | eigene Werbung der Location auf deren Website und offiziellen Social-Media-Kanälen (z. B. Instagram oder TikTok, Entscheidung 4.4a) | die veröffentlichte Aufnahme selbst | eigenständig Verantwortlicher (Entscheidung 4.3) | `[je Event zu ergänzen]` |
| UptimeRobot s. r. o., Obchodná 507/2, 811 06 Bratislava, Slowakei | Erreichbarkeitsprüfung | nur öffentliche Seitenaufrufe | Auftragsverarbeiter; **AVV automatisch über die Nutzungsbedingungen einbezogen** (bestätigt 20.09.2026) | EU (Slowakei) |
| Veranstaltungslocation | Entgegennahme der Papierformulare am Empfang | die unterschriebenen Einverständniserklärungen | siehe Datenschutz Abschnitt 2 | Inland |
| Rettungsdienst / ärztliches Personal | Notfall | die im Notfall erforderlichen Angaben | eigener Verantwortlicher | Inland |

**Keine weiteren Empfänger.** Insbesondere keine Werbenetzwerke, keine
Analysedienste, keine sozialen Netzwerke.

---

## 15. Speicherdauer und Löschung

> ✅ **Stand 18.09.2026 — diese Ziffer ist jetzt technisch überholt und
> unten neu gefasst.** Seit dem 16./17.09.2026 gibt es ein
> vollständiges, automatisiertes Löschkonzept nach **DIN 66398** mit
> acht Löschklassen (K1–K8), einem täglichen automatischen Lauf und
> einer Löschsperre für Einzelfälle (Unfall, Beschwerde, Rechtsstreit).
> Es ist **produktiv im Einsatz** (systemd-Timer `vera-loeschlauf.timer`)
> und ausführlich dokumentiert in `docs/loeschkonzept-betrieb.md`. Die
> frühere Aussage „für Anmeldungen gibt es bisher keine automatische
> Löschfrist" **stimmt seit der Umsetzung nicht mehr** und darf so nicht
> stehen bleiben.

**Die acht Klassen im Überblick** (Einzelheiten und Rechtsgrundlagen
in `docs/loeschkonzept-betrieb.md`):

| Klasse | Datenart | Frist | danach |
|---|---|---|---|
| K1 | Gesundheits- und Notfallangaben | 7 Tage nach Veranstaltungsende | Papier vernichten |
| K2 | vollständige Einverständniserklärungen | 3 Jahre zum Jahresende | Papier vernichten |
| K3 | reduzierter Zustimmungsnachweis | 10 Jahre zum Jahresende | löschen |
| K4 | Anmelde- und Ankunftsdaten | 3 Jahre zum Jahresende | anonymisieren |
| K5 | Veranstaltungs- und Sicherheitschecklisten | 3 Jahre zum Jahresende | Personenbezug entfernen |
| K6 | Vorfall- und Versicherungsakten | 10 Jahre, bei schwerem Personen-/Gesundheitsschaden bis 30 Jahre, ab Abschluss des Vorgangs | löschen |
| K7 | Steuerunterlagen (§ 147 AO) | 10 / 8 / 6 Jahre | **niemals** vom Löschlauf angefasst |
| K8 | Widerspruch gegen Foto- und Videoaufnahmen samt Prüfvermerk (Art. 21 DS-GVO) | 3 Jahre Nachlauf ab der von Hand gesetzten „Aufnahmen offline“-Markierung; davor keine Frist | löschen — erst ab der Markierung fällig |

> ⚠️ **Seit Entscheidung 4.6 (19.09.2026) — eine von zwei Lücken in
> dieser Tabelle ist erledigt.** Die Foto- und Videoaufnahmen werden
> künftig **unbefristet** genutzt, solange der Werbezweck besteht
> (Dokument 06). Daraus folgte:
>
> 1. **Die veröffentlichten Aufnahmen selbst haben keine Löschklasse.**
>    K1–K8 erfassen Erklärungen, Nachweise, Anmeldedaten, Checklisten,
>    Vorfallakten, Steuerunterlagen und jetzt auch den Nachweis über
>    Widerspruch/Prüfung — nicht die Bilddateien und nicht die
>    Beiträge auf Website und Instagram selbst. Der automatische
>    Löschlauf wird dort weiterhin nie etwas tun. Das bleibt vertretbar,
>    muss aber ausdrücklich so dastehen, statt den Eindruck zu erwecken,
>    der Lauf decke alles ab. **Weiterhin offen.**
> 2. ✅ **Erledigt am 21.09.2026.** K8 hat jetzt genau die vorgeschlagene
>    eigene Löschklasse für die **Nachweise zu Aufnahmen** (Widerspruch
>    und Prüfvermerk) mit der Frist „Ende der Nutzung zuzüglich
>    Verjährungspuffer" — technisch umgesetzt als „Ende der Nutzung"
>    gleich der von Hand gesetzten `aufnahmenOfflineAm`-Markierung
>    („Alle Aufnahmen dieser Veranstaltung endgültig offline", mit
>    Datum, Bearbeiter und Prüfvermerk) und „Verjährungspuffer" gleich
>    3 Jahre Nachlauf ab deren Jahresende
>    (`faelligAufnahmewiderspruch()` in `lib/loeschfristen.ts`).
>    Zusätzlich, wie ursprünglich als Alternative vorgeschlagen: Eine
>    Löschsperre hält die Löschung an, solange ein Streit, eine
>    Beschwerde oder ein laufendes Verfahren dazu besteht — beide
>    Auflösungswege aus dem ursprünglichen Vorschlag sind damit
>    kombiniert, nicht nur einer davon gewählt. Bauauftrag **B-14** in
>    Dokument 15, dort als erledigt vermerkt. Einzelheiten in
>    `docs/loeschkonzept-betrieb.md`.

**Löschsperre.** Einzelne Datensätze können von der Löschung
ausgenommen werden — bei einem Unfall, einer Beschwerde, einer
Rückbuchung, einem Versicherungsfall oder einem drohenden
Rechtsstreit. Ohne eine solche Sperre läuft die automatische Löschung
regulär weiter.

**Rechnungen mit Namen** sind, solange ihre gesetzliche Aufbewahrungs­
frist läuft, selbst ein Buchungsbeleg und werden vom Löschlauf **nicht**
angefasst, auch wenn die zugehörige Anmeldung längst anonymisiert
wurde.

> ⚠️ **Weiterhin offen, ausdrücklich nicht erfunden:** Die konkreten
> Fristen für K3–K6 stützen sich auf DIN 66398 als anerkanntes Verfahren
> und auf eine erste fachliche Einschätzung (Dokument 12/13 in diesem
> Ordner), sind aber **nicht** anwaltlich bestätigt. Vor der
> Veröffentlichung dieser Erklärung sollten sie fachkundig geprüft
> werden — eine spätere Verkürzung ist unproblematisch, eine zu frühe
> Löschung wäre es nicht.

**Was unverändert gilt:**

| Daten | Dauer | Beleg |
|---|---|---|
| Server-Protokolle (Nginx) | ~14 Tage | Serverkonfiguration |
| System-Journal | 7 Tage | Serverkonfiguration |
| Missbrauchsschutz-Zähler | 60 Minuten | `lib/ratelimit.ts` |
| Verschlüsselte Sicherungen | 180 Tage | `docs/sicherung.md` |

**Wichtiger Zusammenhang, der oft übersehen wird:** Wer gelöscht oder
anonymisiert wird, steht noch in den Sicherungen — bis zu 180 Tage lang.
Das gehört in die Erklärung, statt einen Löschvorgang zu versprechen,
der so nicht stattfindet.

**Entwurfstext:**

> Wir löschen oder anonymisieren personenbezogene Daten nach festen
> Fristen, die sich nach der Art der Daten richten (Löschkonzept nach
> DIN 66398). Ein täglich laufender automatischer Vorgang prüft, welche
> Daten fällig sind:
>
> - Gesundheits- und Notfallangaben auf Papier: spätestens 7 Tage nach
>   der Veranstaltung vernichtet.
> - Vollständige Einverständniserklärungen: nach 3 Jahren auf einen
>   reduzierten Nachweis verkürzt, dieser nach insgesamt 10 Jahren
>   gelöscht.
> - Anmelde- und Ankunftsdaten: nach 3 Jahren anonymisiert — Name,
>   E-Mail-Adresse und Telefonnummer werden überschrieben, die Buchung
>   bleibt als anonyme Zeile bestehen, damit Statistiken und der
>   Zahlungsabgleich stimmen.
> - Veranstaltungs- und Sicherheitschecklisten: nach 3 Jahren wird der
>   Personenbezug entfernt.
> - Akten zu Unfällen oder Vorfällen: 10 Jahre, bei einem schweren
>   Personen- oder Gesundheitsschaden bis zu 30 Jahre nach Abschluss des
>   Vorgangs.
> - Steuerlich relevante Unterlagen: 10, 8 oder 6 Jahre nach der
>   gesetzlichen Aufbewahrungspflicht (§ 147 AO) — davon rührt der
>   automatische Löschvorgang **nicht**.
>
> Eine Stornierung ist dabei keine Löschung: Die Buchung muss bis zum
> Ablauf ihrer Frist gespeichert bleiben, damit Platzzählung und
> Zahlungsabgleich stimmen.
>
> Droht ein Rechtsstreit oder liegt ein Unfall, eine Beschwerde oder ein
> Versicherungsfall vor, setzen wir die Löschung für die betroffenen
> Datensätze gezielt aus, bis der Vorgang abgeschlossen ist.
>
> Bitte beachten Sie: Verschlüsselte Sicherungskopien der Datenbank
> werden 180 Tage aufbewahrt. Gelöschte oder anonymisierte Daten können
> darin noch enthalten sein, bis die betreffende Sicherung turnusmäßig
> verfällt.

---

## 16. Ihre Rechte

> ✅ **Korrigiert am 22.09.2026, vom Nutzer bestätigt.** Zuständig ist
> **nicht** die Berliner Beauftragte, sondern die **Landesbeauftragte
> für den Datenschutz und für das Recht auf Akteneinsicht
> Brandenburg**, Stahnsdorfer Damm 77, 14532 Kleinmachnow,
> Poststelle@LDA.Brandenburg.de — weil das Einzelunternehmen in
> Brandenburg angemeldet ist und von dort geführt wird. Die Berliner
> Anschrift (Mühlenstr. 8a, 14167 Berlin) ist eine gemietete
> Post-/Impressumsadresse und ändert die Hauptniederlassung nicht.
> Bereits umgesetzt in `content/de.ts`
> (`recht.datenschutzRechteBeschwerde`) und in
> `public/dokumente/einverstaendniserklaerung-minderjaehrige.pdf`.
> Offen, separat zu prüfen: Ob der Berliner Postdienstleister durch
> Öffnen, Scannen oder digitales Speichern der Geschäftspost eine
> eigene Auftragsverarbeiter-Rolle hat — dafür fehlt bislang jede
> Vertragsprüfung, er wird deshalb nirgends als Auftragsverarbeiter
> genannt.

**Entwurfstext (Stand vor der Korrektur, nur zum Nachlesen):**

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
| D-7 | ~~Regelaufbewahrungsfrist für Anmeldungen~~ | ✅ gelöst durch das Löschkonzept (K1–K7, Ziffer 15) — die Fristen selbst sind aber weiterhin fachlich zu bestätigen |
| D-8 | ~~Anschrift der Aufsichtsbehörde~~ | ✅ **erledigt am 22.09.2026, vom Nutzer bestätigt.** Nicht Berlin, sondern die Landesbeauftragte für den Datenschutz und für das Recht auf Akteneinsicht Brandenburg, Stahnsdorfer Damm 77, 14532 Kleinmachnow (Sitz des Einzelunternehmens) — siehe Ziffer 16 oben |
| D-9 | Datenschutzbeauftragter nötig? | Bewertung, auch wegen Gesundheitsangaben |
| D-10 | Foto-Einwilligung: alle Angaben aus Dokument 06 | Entscheidung des Unternehmers |
