# 10 — Prüfprotokoll

> Dokumentiert, worauf die Entwürfe 01 bis 09 beruhen, was geprüft
> wurde, wo die Prüfung an Grenzen stieß und was offen bleibt.
>
> **Stand: 16.09.2026, Version 1.**

---

## 1. Grenzen der Quellenprüfung — zuerst, weil es alles Weitere färbt

**Der direkte Abruf amtlicher Quellen war aus dieser Arbeitsumgebung
nicht möglich.** Gemessen, nicht vermutet:

| Quelle | Ergebnis |
|---|---|
| `www.gesetze-im-internet.de` | **blockiert** (`EGRESS_BLOCKED` am Netz-Gateway) |
| `dejure.org` | **blockiert** (`EGRESS_BLOCKED`) |
| Websuche | funktioniert |

**Folge:** Die Normwortlaute in den Entwürfen stammen aus
**Suchergebnis-Zusammenfassungen**, teils von Treffern auf
gesetze-im-internet.de, teils aus Fachbeiträgen — **nicht aus dem im
Volltext abgerufenen amtlichen Text.**

**Das ist kein Randproblem.** Die Zitierregel des verwendeten
Skill-Pakets verbietet Blindzitate und Fundstellen aus Modellwissen
ausdrücklich. Deshalb gilt für alle zehn Dokumente:

> **Jede genannte Norm ist als Prüfauftrag zu lesen, nicht als
> nachgewiesenes Ergebnis. Vor der Verwendung ist jeder Paragraf im
> amtlichen Text nachzulesen.**

**Es wurde keine einzige Gerichtsentscheidung mit Aktenzeichen zitiert**
und kein Kommentar mit Randnummer. Wo Rechtsprechung erwähnt ist (etwa
zu § 312j BGB), steht ausdrücklich dabei, dass es sich um
zusammenfassende Fachbeiträge handelt.

---

## 2. Geprüfte Quellen mit Datum

| Thema | Ergebnis | Quellenart | Datum |
|---|---|---|---|
| **EU-OS-Plattform** | eingestellt zum **20.07.2025** durch **Verordnung (EU) 2024/3228**; Hinweispflicht entfallen; veralteter Link kann als irreführend gewertet werden | IHK-Veröffentlichungen, EUR-Lex-Treffer, Fachbeiträge | 16.09.2026 |
| **§ 36 VSBG** | Ausnahme nach **Abs. 3** für Unternehmen mit **zehn oder weniger** Beschäftigten am 31.12. des Vorjahres, bezogen auf Abs. 1 Nr. 1; **Abs. 1 Nr. 2 bleibt** | Bundesamt für Justiz, Fachbeiträge | 16.09.2026 |
| **§ 312j Abs. 3 BGB** | „zahlungspflichtig bestellen" oder entsprechend eindeutige Formulierung; als **nicht ausreichend** angesehen u. a. „Bestellung aufgeben", „Bestellen", „Senden", „mit … bezahlen"; als ausreichend u. a. „Jetzt verbindlich anmelden! (zahlungspflichtiger Reisevertrag)"; Rechtsfolge bei Verstoß: **Vertrag kommt nicht zustande** (Abs. 4) | Fachbeiträge, Blogbeiträge zu Instanzentscheidungen | 16.09.2026 |
| **§ 312g Abs. 2 Nr. 9 BGB** | kein Widerrufsrecht bei Dienstleistungen im Zusammenhang mit **Freizeitbetätigungen**, wenn ein **spezifischer Termin oder Zeitraum** vorgesehen ist; setzt Art. 16 Buchst. l RL 2011/83/EU um | Fachbeiträge | 16.09.2026 |
| **§ 356a BGB — Widerrufsbutton** | Pflicht zur **elektronischen Widerrufsfunktion seit 19.06.2026**; Umsetzung der RL (EU) 2023/2673; **ausgenommen**, wenn kein Widerrufsrecht besteht (Katalog § 312g BGB); Anforderungen: ständig verfügbar, eindeutig beschriftet, nicht hinter Anmeldehürde, zweistufig, Eingangsbestätigung mit Datum und Uhrzeit | Fachbeiträge, IHK | 16.09.2026 |
| **BFSG § 3 Abs. 3** | Ausnahme für **Kleinstunternehmen**, die Dienstleistungen anbieten; Kleinstunternehmen nach § 2 Nr. 17 BFSG: weniger als zehn Beschäftigte **und** höchstens 2 Mio. € Jahresumsatz oder Bilanzsumme; Ausnahme gilt **nicht** für Produkte | Fachbeiträge, Bundesfachstelle Barrierefreiheit | 16.09.2026 |
| **§ 5 DDG** | DDG hat am 14.05.2024 das TMG abgelöst | bereits im Projekt dokumentiert und umgesetzt | — |

**Nicht eigenständig geprüft** und daher in den Entwürfen nur als
Prüfauftrag markiert: §§ 305–310, 312f, 312k, 355, 356, 648, 832 BGB,
Art. 6, 7, 9, 13, 26, 28, 37 DSGVO, §§ 22, 23 KunstUrhG, § 25 TDDDG,
§ 19 UStG, §§ 38 ZPO, § 37 VSBG.

---

## 3. Verwendete Fakten und ihre Quellen

### 3.1 Durch Dateien oder Code bestätigt

| Tatsache | Fundstelle |
|---|---|
| Name, Anschrift, Telefon, E-Mail des Anbieters | `content/de.ts` → `anbieter` |
| Kleinunternehmerregelung § 19 UStG | `content/de.ts` → `anbieter.umsatzsteuer` |
| Kein EU-OS-Link im Impressum | `app/(seite)/impressum/page.tsx` |
| Online erhoben: Vorname, Nachname, E-Mail, Telefon (freiwillig) | `lib/anmeldung.ts` |
| **Kein Geburtsdatum online** | ebenda |
| Einwilligung Vormund Pflicht bei „Mein Kind"/„Familienpaket" | `lib/anmeldung.ts:104, 214–218` |
| Fotoeinwilligung freiwillig, getrennt, nicht Pflichtfeld | ebenda |
| Foto-Häkchentext: ein Satz | `content/de.ts:258–259` |
| Bestellschaltfläche „Zur Bezahlung – {betrag}" | `content/de.ts:263` |
| Kein AGB-Häkchen, kein Rechtstext-Link im Bestellvorgang | `components/PreisRechner.tsx`, `FormularVorschau.tsx` |
| Reservierung 30 Minuten | `app/(seite)/anmeldung/aktion.ts` |
| Bestätigung erst nach geprüfter Zahlungsrückmeldung | `app/zahlung/rueckmeldung/route.ts` |
| Stornofrist 24 h, ein Wert an einer Stelle | `lib/storno.ts:17` |
| `innerhalbFrist(null) === true` | `lib/storno.ts:37–41` |
| Erstattung voll, auf demselben Weg, kein Abzug | `lib/stornoAusfuehren.ts` |
| Keine Übertragung eines Platzes | `content/de.ts`, Stornobedingungen |
| **Kein Feld für Mindestteilnehmerzahl** | `prisma/schema.prisma` → `Event` |
| **`startAt` nullable — Events ohne Termin sind vorgesehen** | ebenda |
| Eventkategorien u. a. BUSINESS, NETWORKING, WORKSHOP, SCHULE | `prisma/schema.prisma` → `EventKategorie` |
| Stripe: nur Testmodus möglich | `lib/zahlung.ts` → `istTestschluessel()` |
| An Stripe: Betrag, Anmeldenummer, E-Mail, Eventtitel, Personenzahl | `lib/zahlung.ts`, `lib/zahlungRegeln.ts` |
| Kein Stripe-Skript auf der eigenen Seite | Volltextsuche: kein externer Host |
| **Kein einziger externer Host zur Laufzeit** | Volltextsuche über `app/`, `lib/`, `components/`, `content/`, `next.config.mjs` |
| Einziges Cookie: `vera_admin` | `lib/adminAuth.ts` |
| Vorschau-Sperre ohne jede Speicherung | `components/VorschauSperre.tsx:19` |
| Nginx-Protokoll: IP gekürzt seit 08.09.2026, 14 Generationen | `docs/ueberwachung.md:207 ff.` |
| Journal 7 Tage / max. 1 GB | ebenda |
| **Missbrauchsschutz speichert volle IP im Klartext, max. 60 Min.** | `lib/ratelimit.ts` |
| E-Mail-Adresse für Kontobremse wird gehasht | `lib/ratelimit.ts:109` |
| Backblaze B2, age-verschlüsselt, Schlüssel nicht auf dem Server | `docs/sicherung.md` |
| Objektsperre 90 Tage, Aufbewahrung 180 Tage | `docs/sachverhalt-fuer-rechtsberatung.md` |
| UptimeRobot seit 07.09.2026, alle 5 Min., nur öffentliche Seite | `docs/ueberwachung.md:69 ff.`, `docs/sperre.md` |
| SMTP über Hostinger, `kontakt@veraevents.de` | `docs/email-einrichten.md` |
| Anonymisierung vorhanden, **manuell auszulösen** | `lib/anmeldungLoeschbar.ts` |
| **Keine automatische Löschfrist für Anmeldungen** | ebenda, `docs/sachverhalt-fuer-rechtsberatung.md` |
| **Mails ohne Anbieterangaben, ohne AGB, ohne Widerrufsinfo** | `lib/mailVorlagen.ts`, Volltextsuche ohne Treffer |
| Schulen: keine Onlinebuchung, nur E-Mail | `content/de.ts` → `schulen.absaetze` |
| **Kein B2B-Vertragsweg im gesamten Projekt** | Volltextsuche: kein Firmenfeld, keine Rechnungsanschrift |
| AGB Abschnitt 2 und Datenschutz Abschnitt 2 verbindlich | `content/de.ts`, `app/(seite)/agb/page.tsx` |
| Papierformular: „enthält keine Einwilligung in Foto- oder Videoaufnahmen" | PDF, dekomprimierter Textstrom |
| Fußbereich auf jeder öffentlichen Seite | `app/(seite)/layout.tsx`, Prüfliste `O` |

### 3.2 Bisheriger Wunsch des Unternehmers

- Kostenlose Stornierung bis 24 Stunden vorher, volle Erstattung.
- Kleinunternehmerregelung nach § 19 UStG.
- Beschriftung der Bestellschaltfläche „Zur Bezahlung" / „Bezahlen".
- Tätigkeitsbeschreibung: „Organisation und Durchführung von
  Veranstaltungen sowie Erbringung von Büro- und administrativen
  Dienstleistungen."
- Drei Geschäftsbereiche: B2C-Events, B2B-Aufträge, Bürodienstleistungen.
- Keine eigene anwaltliche Beratung; stattdessen ein Rechtstexte-Service.

### 3.3 Aus Unterlagen abgeleitet

- Einzelunternehmen ohne Registereintrag (`docs/rechtstexte-beschaffung.md`).
- EU-Serverstandort bei Hostinger; Hostname `dus.hostingervps.com`
  deutet auf Düsseldorf — **Indiz, kein Beleg.**
- Vermutlich keine USt-IdNr.
- Vermutlich keine Beschäftigten.

### 3.4 Noch offen

Siehe Abschnitt 6.

---

## 4. Angewandte Skills

Alle vier Skills des Pakets `agb-recht-pruefer` wurden gemeinsam
angewandt (Commit `9843b807`, MIT und Apache-2.0; Herkunft und
Änderungen in `.claude/agb-recht-pruefer/HERKUNFT.md`).

| Skill | Wo er gewirkt hat |
|---|---|
| **agb-pruefung-kaltstart** | Prüfpfad: Anwendungsbereich → Einbeziehung → Auslegung → Inhaltskontrolle → Rechtsfolge. Trennung B2C/B2B nach § 310 Abs. 1 BGB. Vorgabe „Arbeitsprodukt statt Inventarliste" — deshalb Entwürfe statt einer Mängelliste. |
| **klauselinhalt-und-verbote-pruefen** | Reihenfolge § 309 → § 308 → § 307. Warnung, den B2B-Ausschluss nicht auf den ganzen § 308 zu erstrecken → Dokument 04, Vorbemerkung und Ziffer 9.5. Forderung nach dem gesetzlichen Leitbild → Vertragstypfrage in 03 und 04. Gegenargument zu jedem Votum → Dokument 03 Ziffer 7, Dokument 04 Ziffer 15. |
| **klauseltransparenz-pruefen** | Maßstab „aufmerksamer Durchschnittskunde dieser Vertragsart". Traf „grundsätzlich … wir finden eine Lösung" (Storno), den Foto-Einwilligungssatz und das Nebeneinander von Platzhalter und geltendem Text. Vorgabe, die Ersatzfassung mit **denselben wirtschaftlichen Zielen** zu formulieren → Dokument 03 Ziffer 7.5/7.6 trennt Regel und Kulanz, statt die Kulanz zu streichen. |
| **haftungsbegrenzung-pruefen-und-formulieren** | Aufbau der Haftungsziffern: Ausnahmen zuerst, Kernpflichten **konkret benannt** statt „wesentliche Vertragspflichten". Vorgabe, kein festes Vielfaches des Entgelts als zulässig zu behandeln → Dokument 04 Ziffer 15.4 lehnt die Formel „höchstens eine Jahresvergütung" als Selbstverständlichkeit ab. Vorgabe, dass eine Versicherungssumme keine Wirksamkeit belegt → in 03 und 04 ausdrücklich aufgenommen. |

**Formatvorgaben der Skills** („Times New Roman 11 pt, dezimale
Gliederung") wurden nicht übernommen. Sie gelten nach
`HERKUNFT.md` nicht für dieses Projekt; VERA formatiert nach eigenen
Vorgaben, und die Entwürfe sind Markdown im Repository.

**Was die Skills nicht leisten konnten** (bereits in `HERKUNFT.md`
festgehalten und hier bestätigt): Minderjährige und Aufsicht,
Fotoeinwilligungen, Vertragstypbestimmung, Sportrisiko und
Veranstalterhaftung, BFSG. Diese Themen wurden aus anderen Quellen
bearbeitet und sind durchgehend als offen markiert.

---

## 5. Zweiter Durchgang: Widersprüche zwischen Website, Checkout,
## Formularen und Entwürfen

> Nach Fertigstellung der Entwürfe 01–09 wurde der Code erneut gegen sie
> gelesen. Diese Befunde sind das Ergebnis; sie sind **in die Entwürfe
> eingearbeitet**.

### T-1 ⚠️ Stornofrist bricht, wenn der Termin nachträglich gesetzt wird

> ✅ **Teilweise erledigt am 20.09.2026, und der Rest ist ein anderer
> Befund.** Die hier beschriebene Fallgruppe — Buchungen, die zustande
> kamen, als es gar keinen Termin gab — kann es seit der Terminpflicht
> nicht mehr geben (Bauauftrag **B-5**, Prüfliste `T`).
>
> **Übrig bleibt der Fall, dass ein bereits feststehender Termin
> nachträglich VORVERLEGT wird.** Dann rutscht die 24-Stunden-Frist mit,
> und Buchungen, die vorher innerhalb der Frist lagen, sind schlagartig
> außerhalb — ohne Zutun der Teilnehmenden. Der Adminbereich hindert
> heute nicht daran (**B-8**). Nach Entscheidung 2.10 gehört eine
> Terminänderung mit bestehenden Buchungen ohnehin als **Absage**
> behandelt, nicht als stille Verschiebung — der verbleibende Befund
> ist damit einer der Bedienung, nicht des Texts.


**Belegt:** `innerhalbFrist(null)` liefert `true` — ohne Termin ist eine
Stornierung immer möglich. `stornoFristEnde` rechnet `startAt − 24 h`.

**Der Fehler:** Wird `startAt` nachträglich auf einen Zeitpunkt gesetzt,
der weniger als 24 Stunden entfernt ist, ist die
Selbstbedienungs-Stornierung **ab diesem Moment gesperrt** — für
Buchungen, die zu einer Zeit abgeschlossen wurden, als es noch gar
keinen Termin gab. Die Kundin hatte nie eine Gelegenheit zu stornieren.

**Eingearbeitet in:** Dokument 07, Abschnitt 3.3.
**Behebung:** Frist ab Bekanntgabe des Termins laufen lassen, nicht nur
ab `startAt`. Klein bis mittel.

### T-2 ⚠️ Mindestteilnehmerzahl ohne technische Grundlage

**Belegt:** `Event` hat `maxPersonen`, aber kein Gegenstück.

**Folge:** Eine AGB-Klausel zur Absage wegen Unterschreitung einer
Mindestteilnehmerzahl hätte keine Grundlage — die Zahl könnte nicht
angezeigt werden, obwohl sie vor der Anmeldung bekannt sein müsste.

**Eingearbeitet in:** Dokument 03, Ziffer 8.3 mit zwei Wegen.

### T-3 ⚠️ Volle IP-Adresse im Klartext beim Missbrauchsschutz

**Belegt:** `lib/ratelimit.ts` speichert für die Anmeldebremse
`kennung = <IP>` und für die Admin-Bremse `admin:<IP>` **im Klartext**.
Die E-Mail-Adresse für die Kontobremse wird dagegen mit SHA-256
gehasht.

**Bewertung:** Die Aufbewahrung ist mit höchstens 60 Minuten sehr kurz
und der Zweck legitim. Es ist kein Rechtsverstoß, den dieser Bericht
feststellen könnte — aber es ist **inkonsistent**: Der Zähler
funktionierte mit einem Hash genauso.

**Eingearbeitet in:** Dokument 02, Abschnitt 3 — offen beschrieben,
statt beschönigt.
**Behebung:** eine Zeile. Klein.

### T-4 ⚠️ Bestätigungsmails ohne Anbieterangaben, AGB und Widerrufsinfo

**Belegt:** Volltextsuche in `lib/mailVorlagen.ts` nach `Lasarzik`,
`Mühlenstr`, `Impressum`, `AGB`, `Teilnahmebedingungen`, `Widerruf` →
**kein Treffer.** Beide Mails enden mit „Bis bald, das VERA-Team".
Zusätzlich fehlt in `bestaetigungsMail` der Gesamtbetrag.

**Eingearbeitet in:** Dokument 08, Abschnitt C-4 (erste Fassung war zu
vorsichtig formuliert und wurde ersetzt).

### T-5 ⚠️ Der Datenschutzabschnitt zu Minderjährigen kennt keine Fotos

**Belegt:** Acht Absätze über Namen, Geburtsdatum, Mobilnummer und
Gesundheitsangaben — **kein Wort zu Foto- oder Videoaufnahmen.**
Gleichzeitig setzt die erziehungsberechtigte Person im Online-Formular
ein Häkchen, das für das Kind gilt, und das Papierformular schließt
Fotoeinwilligung ausdrücklich aus.

**Eingearbeitet in:** Dokument 02, Abschnitt 5 (mit Ergänzungsabsatz);
Dokument 05, Abschnitt K-3; Dokument 06 vollständig.

### T-6 ⚠️ Keine Löschfrist für Anmeldedaten

**Belegt:** Anonymisierung vorhanden, aber manuell. Keine automatische
Frist.

**Eingearbeitet in:** Dokument 02, Abschnitt 15 — ausdrücklich als
nicht festgelegt beschrieben, statt eine Frist zu behaupten.

### T-7 Prüfskripte hängen am Wortlaut der Bestellschaltfläche

**Belegt:** `pruefung/K/k-browser.mjs` und `pruefung/J/j-browser.mjs`
suchen nach dem Text der Schaltfläche. Bei der letzten Umbenennung sind
sie stehen geblieben und haben die Testläufe zum Absturz gebracht.

**Eingearbeitet in:** Dokument 08, Abschnitt C-1, Umsetzungshinweis.

### T-8 ✅ Kein Widerspruch, aber bestätigenswert

Folgende Aussagen der Entwürfe wurden gegen den Code geprüft und
**stimmen**:

- Bestätigung erst nach geprüfter Zahlungsrückmeldung, nicht beim
  Absenden.
- Erstattung voll, ohne Abzug, auf demselben Weg.
- Kein Stripe-Skript auf der eigenen Seite; kein externer Host.
- Fotoeinwilligung ist technisch nicht an die Teilnahme gekoppelt.
- Fußbereich mit allen Rechtsseiten auf jeder öffentlichen Seite.
- Reservierung 30 Minuten, Platzprüfung in einer Transaktion.

---

## 6. Offene Fragen — vollständige Liste

### 6.1 Entscheidungen des Unternehmers

| # | Frage | Betrifft |
|---|---|---|
| U-1 | Sollen eigene AGB überhaupt verwendet werden? | 03, 08 |
| U-2 | Haftungsbegrenzung für einfache Fahrlässigkeit — ja oder nein? | 03 Ziffer 11 |
| U-3 | Mindestteilnehmerzahl einführen? | 03 Ziffer 8.3, Datenmodell |
| U-4 | Verlegung als eigener Ablauf — oder Absage plus Neuanmeldung? | 03 Ziffer 8.4, 07 |
| U-5 | Übernimmt VERA die Aufsicht über Minderjährige? Mit welcher Personalstärke? | 05, 04 Ziffer 6 |
| U-6 | Fotos: Zwecke, Kanäle, Dauer — oder ganz ohne Einwilligung arbeiten? | 06, 02 |
| U-7 | Ab welchem Alter wird die minderjährige Person selbst in die Fotoeinwilligung einbezogen? | 06 |
| U-8 | Alkohol bei Veranstaltungen? | 09 Ziffer 5 |
| U-9 | Sollen B2B-Buchungen über die Website laufen? | 04 |
| U-10 | Welche Auftragsarten im B2B — und je Auftrag Dienst- oder Werkvertrag? | 04 |
| U-11 | Ausfallstaffel B2B, Stunden-/Tagessatz, Abschlagsstaffel | 04 Ziffern 9–11 |
| U-12 | Haftungshöchstbetrag B2B — und auf welcher Schadensbasis? | 04 Ziffer 15.4 |
| U-13 | Geschäftsbereich 3: welche Leistungen genau? | 04 Anhang B |
| U-14 | Regelaufbewahrungsfrist für Anmeldedaten | 02 Abschnitt 15 |
| U-15 | AGB-Bestätigung: Häkchen oder Hinweistext? | 08 C-2 |
| U-16 | Bestätigungsmail: AGB als PDF-Anhang oder Volltext? | 08 C-4 |
| U-17 | Ausschließlich Veranstaltungen mit festem Termin anbieten? | 07 — entscheidet über den Widerrufsbutton |

### 6.2 Tatsachen, die abgelesen werden müssen

| # | Was | Wo |
|---|---|---|
| F-1 | Genauer Serverstandort | Hostinger-Konto |
| F-2 | Firmierung und Anschrift: Hostinger, Stripe, Backblaze, UptimeRobot | jeweiliges Konto |
| F-3 | Region des Backblaze-Buckets | Backblaze-Konto |
| F-4 | Welche AV-Verträge liegen vor? | Konten und Vertragsunterlagen |
| F-5 | USt-IdNr. vorhanden? W-IdNr. vergeben? | Finanzamt, eigene Unterlagen |
| F-6 | Beschäftigtenzahl am 31.12.2025 | eigene Unterlagen |
| F-7 | Anschrift der Berliner Aufsichtsbehörde | deren Website |
| F-8 | Hausordnung der Veranstaltungslocation im Wortlaut | Location |
| F-9 | Wer stellt den Trainer — VERA, Halle oder Dritte? | Vertrag mit der Halle |
| F-10 | Besteht eine Veranstalterhaftpflicht? Welche Deckung? | Versicherung |
| F-11 | Behält Stripe bei Erstattungen die Gebühr ein? | Stripe-Konto |

### 6.3 Rechtliche Unsicherheiten

| # | Frage | Warum unsicher |
|---|---|---|
| R-1 | Vertragstyp des Teilnahmevertrags | entscheidet über § 648 BGB und die Stornoregel |
| R-2 | Greift § 312g Abs. 2 Nr. 9 BGB — und für welche Veranstaltungen? | hängt am „spezifischen Termin"; Events ohne Termin sind vorgesehen |
| R-3 | Ist § 356a BGB einschlägig? | folgt aus R-2 |
| R-4 | Erfüllt die vorhandene Storno-Funktion die Anforderungen von § 356a BGB? | „ständig verfügbar" bei einem Link nur in der Mail fraglich |
| R-5 | Ist „Zur Bezahlung – {Betrag}" nach § 312j Abs. 3 BGB ausreichend? | Wortlaut liegt nahe an als unzureichend beurteilten Beschriftungen |
| R-6 | Darf die Schaltfläche einen Betragszusatz tragen? | § 312j Abs. 3 verlangt „nichts anderem als" |
| R-7 | Genügt der Fußzeilenlink für § 305 Abs. 2 BGB? | verbreitet verneint |
| R-8 | Rolle von Stripe: Verantwortlicher oder Auftragsverarbeiter? | folgt aus dem Vertragswerk |
| R-9 | Ist ein AV-Vertrag mit UptimeRobot nötig? | es werden keine Nutzerdaten übermittelt |
| R-10 | Genügt die Verschlüsselung vor dem Upload für Backblaze? | Verschlüsselung ist ein starkes Argument, ersetzt die Einordnung nicht |
| R-11 | Datenschutzbeauftragter nötig? | Gesundheitsangaben auf Papier gesondert zu bewerten |
| R-12 | Greift die BFSG-Ausnahme für Kleinstunternehmen? | Voraussetzungen müssen belegbar sein |
| R-13 | Ist ein Business-Netzwerkabend eine „Freizeitbetätigung"? | beruflicher Bezug spricht dagegen |
| R-14 | Sind Schulen Unternehmer i. S. v. § 310 Abs. 1 BGB? | Körperschaft des öffentlichen Rechts |
| R-15 | Wer ist bei Klassenbuchungen Vertragspartner? | Schule, Träger oder Lehrkraft |
| R-16 | Ist der Trainer Erfüllungsgehilfe nach § 278 BGB? | hängt am Vertrag mit der Halle |
| R-17 | Erlaubnispflichten: Ausschank, Versammlungsstätte, RDG/StBerG bei Bürodienstleistungen | tätigkeitsabhängig |

---

## 7. Punkte für die abschließende anwaltliche Prüfung

Nach Dringlichkeit, nicht nach Reihenfolge der Dokumente:

1. **§ 312j Abs. 3 BGB — Beschriftung der Bestellschaltfläche.**
   Härteste Rechtsfolge (Vertrag kommt nicht zustande), betrifft jede
   Buchung. → R-5, R-6.
2. **Vertragstyp und Widerrufsrecht.** Entscheidet über Storno,
   Belehrung und die Frage, ob eine Widerrufsschaltfläche nach
   § 356a BGB gebaut werden muss. → R-1, R-2, R-3, R-4.
3. **Einbeziehung der AGB nach § 305 Abs. 2 BGB** samt Platzierung und
   Nachweis. → R-7.
4. **Haftung und Aufsicht bei Minderjährigen** — die eigentliche
   Risikofrage bei einer Sportveranstaltung mit Jugendlichen. → U-5,
   R-16, F-9, F-10.
5. **Foto- und Videoeinwilligung**, insbesondere für Minderjährige.
   → U-6, U-7, T-5.
6. **Datenschutz: Anbieterrollen, Drittlandbezug, Löschfristen.**
   → R-8 bis R-11, F-1 bis F-4, U-14.
7. **Stornoklausel** nach § 309 Nr. 5 BGB in der neuen Fassung.
8. **B2B-Bedingungen** samt Vertragstyp, Abnahme, Haftungsdeckel.
   → U-9 bis U-12, R-14, R-15.
9. **Verbraucherstreitbeilegung** — Formulierung oder Verzicht.
10. **BFSG** — Ausnahme oder Erklärung. → R-12.
11. **Geschäftsbereich 3** — vor jeder Textfassung: Leistungen und
    Erlaubnispflichten. → U-13, R-17.

---

## 8. Versionsstand

| Datei | Version | Stand | Umfang |
|---|---|---|---|
| `00-uebersicht-und-offene-fragen.md` | 1 | 16.09.2026 | Übersicht in einfacher Sprache |
| `01-impressum-entwurf.md` | 1 | 16.09.2026 | Entwurf + Herkunftsnachweis je Angabe |
| `02-datenschutzerklaerung-entwurf.md` | 1 | 16.09.2026 | 17 Abschnitte, 10 offene Punkte |
| `03-agb-b2c-events-entwurf.md` | 1 | 16.09.2026 | 17 Ziffern + Anhang Einbeziehung |
| `04-b2b-eventbedingungen-entwurf.md` | 1 | 16.09.2026 | 19 Ziffern + 2 Anhänge |
| `05-minderjaehrige-teilnahmeerklaerung-entwurf.md` | 1 | 16.09.2026 | Befund + Formularentwurf 2 Seiten |
| `06-foto-video-einwilligung-entwurf.md` | 1 | 16.09.2026 | Befund + Entwurf + Alternative ohne Einwilligung |
| `07-widerruf-stornierung-entwurf.md` | 1 | 16.09.2026 | 2 Funde + 3 Fassungen + Umsetzungsliste |
| `08-checkout-rechtstexte-entwurf.md` | 1 | 16.09.2026 | 6 Abschnitte, nach zweitem Durchgang überarbeitet |
| `09-hausordnung-teilnahmehinweise-entwurf.md` | 1 | 16.09.2026 | 10 Ziffern + Klärungsanhang |
| `10-rechtstexte-pruefprotokoll.md` | 1 | 16.09.2026 | dieses Dokument |

**Keine bestehende Rechtstextdatei wurde verändert.** `content/de.ts`,
alle Seiten unter `app/(seite)/` und das PDF unter `public/dokumente/`
sind unangetastet. Es wurde nichts veröffentlicht und nichts deployed.

---

## 9. Was diese Entwürfe ausdrücklich nicht sind

- **Nicht rechtssicher.** Sie sind Arbeitsmaterial.
- **Nicht anwaltlich geprüft.** Kein Jurist hat sie gesehen.
- **Nicht garantiert wirksam.** Mehrere Klauseln hängen an Fragen, die
  ungeklärt sind.
- **Nicht vollständig.** Jede `[VOR VERWENDUNG KLÄREN]`-Markierung ist
  eine Lücke, die absichtlich offen geblieben ist statt mit einer
  Vermutung gefüllt zu werden.
- **Nicht abgeschrieben.** Es wurden keine fremden AGB und keine
  Kanzleimuster übernommen. Wo eine Formulierung dem Gesetzeswortlaut
  folgt (etwa „zahlungspflichtig bestellen"), ist das die Norm selbst,
  kein fremder Text.

---

# Konsistenzdurchlauf über die Dokumente 01 bis 09 (20.09.2026)

**Anlass.** Zwischen dem 18. und 20.09.2026 sind rund vierzig
Entscheidungen getroffen worden, mehrere davon aufeinander aufbauend.
Das Aufnahmekonzept wurde **zweimal** grundlegend umgestellt, die
Regeln zu Abschlag, Ausfall und Haftung greifen ineinander. Zwei echte
Widersprüche waren beim Bearbeiten **zufällig** aufgefallen — dieser
Durchlauf sucht die übrigen systematisch.

**Methode.** Gezielte Volltextsuchen über alle neun Dokumente nach den
Begriffen, an denen sich eine überholte Fassung zeigt: Foto-Einwilligung,
Widerruf gegenüber Widerspruch, Verlegung und Ersatztermin, Verpflegung
und Hallengastronomie, „netto", Verbraucherabgrenzung, offene
Platzhalter. Anschließend Sichtprüfung jeder Fundstelle im Zusammenhang —
eine Trefferliste allein unterscheidet nicht zwischen einer überholten
Regel und einem korrekt beschriebenen Ist-Zustand.

## Gefundene und behobene Widersprüche

**K-1 · Dokument 02, Tabelle der erhobenen Daten.** Führte die
„Einwilligung in Foto- und Videoaufnahmen" als **freiwillig**. Es gibt
sie seit dem 19.09.2026 nicht mehr. Ersetzt durch zwei Zeilen: die
**verpflichtende Kenntnisnahme** des Aufnahmehinweises und den
**freiwilligen Widerspruch**, der gespeichert werden muss, damit er vor
einer Veröffentlichung umgesetzt werden kann.

**K-2 · Dokument 02, „Folgen einer Nichtangabe".** Nannte die
Foto-Einwilligung neben der Telefonnummer als freiwillig. Korrigiert —
freiwillig ist nur noch die Telefonnummer.

**K-3 · Dokument 02, Absatz zu Minderjährigen.** Beschrieb, dass die
erziehungsberechtigte Person die Foto-Einwilligung zugleich für das Kind
abgibt, mit Verweis auf Zwecke, Dauer und **Widerruf**. Vollständig
ersetzt: Übersichtsaufnahmen auf Grundlage des berechtigten Interesses,
**Widerspruch** statt Widerruf, gültig auch für die angemeldeten
Personen.

**K-4 · Dokument 02, Empfängerübersicht.** Meta und die
Veranstaltungslocation standen dort „nur bei erteilter
Foto-Einwilligung" beziehungsweise „bei erteilter **zweiter**
Einwilligung". Beide Bedingungen gibt es nicht mehr; sie knüpfen jetzt
daran an, ob Übersichtsaufnahmen veröffentlicht beziehungsweise
weitergegeben werden.

**K-5 · Dokument 02, Löschkonzept.** Die vorgesehene neue Löschklasse
hieß „für Foto-Einwilligungen". Umbenannt in **Nachweise zu Aufnahmen**
— Kenntnisnahme und Widersprüche —, weil es Einwilligungen nicht mehr
gibt, die Nachweispflicht aber bleibt.

**K-6 · Dokument 07, Abschnitt 3.2 „Verlegung".** Stand seit dem
16.09.2026 als offener Platzhalter, obwohl die Frage am 18.09.2026
entschieden wurde (Entscheidung 2.10). Ausgefüllt: keine Verlegung, der
Verlegungsfall ist ein Absagefall; dazu der Hinweis, dass im B2B
dieselbe Linie gilt (Dokument 04, Ziffer 11.3). Der zugehörige offene
Punkt **W-h** ist als erledigt markiert.

**K-7 · Dokument 07, Abschnitt 3.3.** Regelte die nachträgliche
Bekanntgabe eines Termins und verwies dabei auf den **bereits am
18.09.2026 gestrichenen** Abschnitt 2.4 — ein Verweis ins Leere.
Gestrichen, weil seit Entscheidung 2.5 ohne feststehenden Termin nicht
gebucht werden kann.
**Dabei sichtbar geworden:** Die Software setzt das **noch nicht**
durch (Bauauftrag **B-5**). Bis dahin kann eine Buchung ohne Termin
entstehen, für die es dann **keine passende Klausel mehr gibt** — die
alte ist gestrichen, die neue Sperre fehlt. Das ist der einzige Fund
dieses Durchlaufs, der ein **offenes Risiko** und nicht nur einen
redaktionellen Rest betrifft.
**✅ Geschlossen am 20.09.2026** — siehe den Abschnitt „Nachtrag" am
Ende dieses Dokuments.

**K-8 · Dokument 08, Bauliste.** Die Zeilen 3 und 4 planten einen
„neuen Text" für die Fotoeinwilligung und einen Zusatz für
Minderjährige. Beides setzt eine Einwilligung voraus. Zeile 3 ist neu
gefasst — das Häkchen wird **ersetzt**, nicht überarbeitet —, Zeile 4
entfällt.

**K-9 · Dokument 08, Ablaufbild des Bestellvorgangs.** Es zeigt den
Stand **vor** den Entscheidungen vom 18. bis 20.09.2026. Das ist als
Befund richtig, war aber nicht als solcher gekennzeichnet. Hinweis
ergänzt.

**K-10 · Dokument 09, Hinweis zur Speisenabgabe.** Fragte offen, welche
Speisen abgegeben werden. Seit Entscheidung 5.6 ist die Systematik
geklärt — drei Angebotsstufen mit unterschiedlichen Pflichten, Empfehlung
Stufe 1. Verweis auf Dokument 04, Anhang F ergänzt; die konkrete
Stufenwahl bleibt als Punkt vor der Freischaltung offen.

## Geprüft und für stimmig befunden

- **„netto"** kommt nur noch in der Begründung vor, warum der Begriff
  nicht verwendet wird — nicht mehr in einer Klausel.
- **Verlegung** ist jetzt in Dokument 03 (Ziffer 8.4), Dokument 04
  (Ziffer 11.3) und Dokument 07 (Abschnitt 3.2) **gleichlautend**
  geregelt: keine Verlegung, neuer Termin als neue Veranstaltung.
- **Verbraucherabgrenzung** in Dokument 03, Ziffer 1 passt zur
  Entscheidung 5.1 und widerspricht nicht den B2B-Bedingungen
  (Dokument 04, Ziffer 1.1b verweist zurück).
- **Dokument 03, Ziffer 2.2** löst den Verpflegungswiderspruch aus
  **B-19** vertraglich bereits auf: Leistungen sind nur dann im Preis
  enthalten, wenn die Eventseite sie ausdrücklich ausweist. **Das
  entbindet nicht davon, die Website eindeutig zu machen** — eine
  Klausel repariert keinen widersprüchlichen Werbetext, sie verlagert
  den Streit nur.
- **Dokument 05** enthält keine offenen Platzhalter mehr und keine
  Aussage zu Aufnahmen, die der Neufassung widerspräche.
- **Dokument 01** ist bis auf die bekannten Unternehmensdaten vollständig.

## Was bewusst offen bleibt

Die verbleibenden Platzhalter sind **echte Angaben**, die nur Adam oder
ein Dritter liefern kann — Unternehmensdaten, das Datum der jeweiligen
Fassung, die Hausordnung der Halle, Schuhwerkvorgaben, ~~Schließfächer~~,
die vollständige Widerrufsbelehrung nach fachlicher Klärung. Sie sind
keine Widersprüche und werden hier nicht als solche gezählt.

> **Nachtrag 20.09.2026:** Der Platzhalter zu den **Schließfächern** ist
> entfallen. Entscheidung 6.4 hat ihn nicht ausgefüllt, sondern
> überflüssig gemacht: Ziffer 8.3 der Hausordnung ist jetzt als
> Bedingungssatz formuliert und gilt mit wie ohne Schließfächer. Das ist
> die bessere Art, einen Platzhalter zu schließen — sie hält auch bei
> einer Veranstaltung in einer anderen Halle.

## Bewertung

**Zehn Fundstellen, neun davon redaktionelle Reste einer überholten
Fassung, eine mit echtem Risiko (K-7).** Das Verhältnis ist erwartbar:
Wer ein Konzept zweimal an einem Tag umstellt, hinterlässt Spuren in den
Dokumenten, die darauf verweisen. Auffällig ist, dass **alle** Funde im
Umfeld der beiden großen Umstellungen liegen — Aufnahmen und Verlegung —
und keiner in den heute neu geschriebenen B2B-Teilen.

**Empfehlung:** Diesen Durchlauf nach jeder weiteren Gruppe von
Entscheidungen wiederholen, nicht erst am Ende. Die Funde waren hier
noch leicht zu beheben; je mehr Dokumente aufeinander verweisen, desto
teurer wird ein übersehener Rest.

---

## Nachtrag vom 20.09.2026 — die Lücke aus K-7 ist geschlossen

Der Fund **K-7** war der einzige dieses Durchlaufs mit einem offenen
Risiko: Die beiden Klauseln, die den Fall „gebucht, aber noch kein
Termin" regelten, waren gestrichen — und die Software ließ diesen Fall
weiterhin zu. Beides zusammen hätte eine Buchung entstehen lassen, für
die es keine passende Regel mehr gab.

Diese Lücke ist jetzt technisch geschlossen. Die Regel steht an genau
**einer** Stelle (`lib/termin.ts`) und wird an sechs Stellen benutzt:
in der Serveraktion der Anmeldung, beim Start der Zahlung, auf der
Abschluss-Seite, auf der Anmeldeseite der Veranstaltung und an den drei
Kaufknöpfen (Standard-Kopfbereich, Premium-Kopfbereich, Abschlussband).

**Warum die Serveraktion der entscheidende Ort ist.** Der ausgeblendete
Knopf allein wäre kein Riegel: Die Anmeldung schickt die Kennung der
Veranstaltung als Formularfeld mit, und ein Formularfeld lässt sich
ändern. Geprüft wurde deshalb nicht nur, dass der Knopf verschwindet,
sondern der realistische Umgehungsversuch — gültige Formularmarken von
einer buchbaren Veranstaltung, die Kennung auf die Veranstaltung ohne
Termin getauscht. Die Anfrage wird abgewiesen, und es entsteht **keine**
Anmeldung.

**Belegt, nicht behauptet.** Neue Prüfliste `T`: Teil 1 mit 29
Prüfungen ohne Datenbank (die Regel selbst, dass sie nur an einer Stelle
steht, und dass sie an allen sechs Stellen tatsächlich benutzt wird),
Teil 2 mit 11 Prüfungen gegen die echte Datenbank und den echten Server.
Dazu eine **Gegenprobe**: Mit entferntem Riegel fallen die Prüfungen
durch, die Anmeldung entsteht und die Zahlung wird mit dem Grund
`kein-termin` abgewiesen — die Prüfungen greifen also wirklich. Der
vollständige Sammellauf über 39 Listen ist danach grün.

**Eine Anpassung an den Prüfungen war nötig und wird hier offengelegt.**
Der Startdatensatz legt `padel-falkensee` bewusst **ohne** Datum an
(„Termin folgt"). Seit der Sperre gibt es dort kein Anmeldeformular
mehr — die Prüflisten, die eine Anmeldung absenden, hätten also nichts
mehr gefunden, an das sie sich wenden könnten. `pruefung/leeren.mjs`
setzt deshalb bei jeder Veranstaltung ohne Datum einen Termin in der
Zukunft. Das ist eine **Anpassung der Prüfung an die neue Regel, keine
Abschwächung**: Die Sperre selbst prüft Liste `T` mit einer eigens dafür
angelegten Veranstaltung, die bewusst keinen Termin hat.

**Noch offen und ausdrücklich so gewollt:** Der Widerspruch bei Speisen
und Getränken (**B-19**) bleibt auf der Bauliste und wurde nicht
angefasst — das ist eine Vorgabe von Adam, keine Nachlässigkeit.

---

# Konsistenzdurchlauf vom 20.09.2026, zweiter Teil — nach Abschnitt E

Der erste Durchlauf dieses Tages (Funde K-1 bis K-10) lief **vor** den
Entscheidungen 6.1 bis 6.7. Dieser zweite prüft, was diese sieben
Entscheidungen in den Dokumenten 01 bis 09 hinterlassen haben.

**Anlass und Methode:** Geprüft wurde gezielt auf die Spuren der
heutigen Entscheidungen — nicht das gesamte Werk erneut. Gesucht wurde
nach den Formulierungen, die jede Entscheidung überholt: Zusagen zur
vollen Erstattung, Hinweise auf die noch fehlende Terminsperre,
Klärungsvorbehalte zu Impressumsangaben, Querverweise auf die neu
gefasste Ziffer 8 der Hausordnung.

**Ergebnis: acht Fundstellen, alle korrigiert.** Keine davon war ein
Rechtsrisiko wie K-7 im ersten Durchlauf — es sind ausnahmslos Reste
einer überholten Fassung. Das ist das erwartbare Bild, wenn an einem
Tag sieben Fragen entschieden werden, und es ist genau der Grund für
diesen Durchlauf.

## Die acht Fundstellen

**L-1 · Dokument 03, Ziffer 7.1 und 7.2 — der wichtigste Fund.**
Beide sagten die **volle Erstattung ohne Abzug** zu und standen damit
im Widerspruch zum Stornoentgelt aus Entscheidung 6.5. Ziffer 7.1 ist
neu gefasst, die neue Ziffer 7.1a ergänzt (Entgelt je Buchung, beide
Ausnahmen, Nachweisvorbehalt), Ziffer 7.2 nennt jetzt den konkreten
Erstattungsbetrag vor dem Klick. **Hätte man nur Dokument 07 geändert
und dieses hier vergessen, stünden zwei verschiedene Stornoregeln im
Werk — und nach § 305c Abs. 2 BGB hätte die kundenfreundlichere
gegolten, also die ohne Entgelt.**

**L-2 · Dokument 08, Entwurf der Storno-Bestätigungsmail.** Sagte
ebenfalls „der volle Betrag, ohne Abzug". Angepasst, mit dem Hinweis,
dass die Mail **beide** Zahlen nennen muss — gezahlter Betrag und
Erstattungsbetrag —, weil der Empfänger die Gutschrift auf seinem Konto
sonst nicht nachvollziehen kann. Dazu die Feststellung, dass die
**Absage-Mail einen eigenen Wortlaut** braucht und diesen nicht
wiederverwenden darf: Bei einer Absage durch VERA wird voll erstattet.

**L-3 · Dokument 07, Fund W-1 samt Tabellenzeile.** Beschrieb
Veranstaltungen ohne feststehenden Termin als den Fall, „in dem die
Ausnahme am wenigsten trägt", und zitierte dafür eine bereits
gestrichene Klausel. Als überholt gekennzeichnet, die Tabellenzeile
durchgestrichen und um die Auflösung ergänzt: Ohne Buchung gibt es
keinen Vertrag und damit keine Widerrufsfrage. Der Befund bleibt zur
Nachvollziehbarkeit stehen.

**L-4 · Dokument 07, Warnhinweis zu Abschnitt 3.3.** Lautete: „Der
Hinweis bleibt hier stehen, weil die Software es noch nicht durchsetzt
— bis dahin ist die Gefahr real." Das trifft seit dem Vormittag des
20.09.2026 nicht mehr zu. Ersetzt durch die Feststellung, dass die
Sperre gebaut und mit 40 Prüfungen belegt ist.

**L-5 · Dokument 07, Klärungsvorbehalt zur Sonderfrist.** Fragte, ob
nach einer nachträglichen Terminbekanntgabe eine eigene Stornofrist
gelten soll. Gegenstandslos: Ohne Buchungen ohne Termin gibt es keine
Buchung, die von einer solchen Bekanntgabe überrascht werden könnte.
Gestrichen.

**L-6 · Dokument 01, Abschnitt 4.4 (Wirtschafts-Identifikationsnummer).**
Trug einen Klärungsvorbehalt, den Entscheidung 6.1 beantwortet hat.
Ausgefüllt, mit dem ausdrücklichen Zusatz, dass der Punkt die
Veröffentlichung **nicht** blockiert.

**L-7 · Dokument 01, Abschnitt 5 (§ 18 Abs. 2 MStV).** Ebenfalls ein
Klärungsvorbehalt, beantwortet durch Entscheidung 6.2. Ausgefüllt, mit
der Begründung, warum eine vorsorgliche Angabe gerade **nicht** die
sichere Wahl wäre: Sie veröffentlichte Adams Privatanschrift ohne
Pflicht.

**L-8 · Dokument 01, Abschnitt 4.3 (berufsrechtliche Angaben).**
Fragte nach Erlaubnispflicht und Kammerzugehörigkeit — beantwortet
durch Entscheidung 6.3. Ausgefüllt. **Dabei ist ein zweiter, eigener
Fehler aufgefallen:** Die Frage beschrieb die Tätigkeit noch als
„Organisation und Durchführung von Veranstaltungen **sowie Erbringung
von Büro- und administrativen Dienstleistungen**". Letztere werden nach
**Entscheidung 5.2** gar nicht angeboten. Richtiggestellt, mit dem
Hinweis, dass die Erlaubnisfrage neu zu stellen wäre, falls sie später
doch kommen.

## Drei Stellen, die geprüft wurden und in Ordnung sind

Sie werden genannt, weil „geprüft und unauffällig" eine andere Aussage
ist als „nicht angesehen":

- **Dokument 09, Querverweis aus Ziffer 8.2 auf „Ziffer 11 der
  Teilnahmebedingungen".** Nachgezählt: Ziffer 11 in Dokument 03 ist
  tatsächlich die Haftung. Der Verweis stimmt.
- **Dokument 05, Verweis auf „Dokument 09, Ziffer 8".** Bleibt richtig,
  obwohl Ziffer 8 neu gegliedert wurde — der Verweis geht auf die
  Ziffer als Ganzes, nicht auf eine Unterziffer.
- **Dokumente 02 und 06.** Von den heutigen Entscheidungen inhaltlich
  nicht berührt. Ein Nachzug in Dokument 02 wird erst fällig, wenn
  **B-27** gebaut ist — die Versions-IDs je Buchung gehören dann in die
  Aufstellung der gespeicherten Daten. Als Teilpunkt in B-27 vermerkt.

## Was dieser Durchlauf über die Methode zeigt

Im ersten Durchlauf waren neun von zehn Funden redaktionelle Reste und
einer ein echtes Risiko. Hier sind es acht von acht redaktionelle
Reste. Der Unterschied hat einen Grund: Der erste Durchlauf prüfte
**Entscheidungen gegen Texte, die vor ihnen geschrieben waren**; dieser
prüft **Texte gegen Entscheidungen, die am selben Tag getroffen
wurden**. Je kürzer der Abstand, desto harmloser die Funde.

**Daraus folgt nicht, dass der Durchlauf verzichtbar wäre — im
Gegenteil.** L-1 hätte unbemerkt zwei widersprüchliche Stornoregeln im
Werk stehen lassen, und nach § 305c Abs. 2 BGB hätte die für VERA
ungünstigere gegolten. Ein Fund dieser Art rechtfertigt den ganzen
Durchgang.

**Empfehlung unverändert:** nach jeder Gruppe von Entscheidungen
wiederholen, nicht erst am Ende.

---

# Abgleich Abschnitt B am 20.09.2026 — zwei Entscheidungen ohne Bauauftrag

**Anlass:** Abschnitt B sollte als nächste Gruppe bearbeitet werden.
Der erste Blick zeigte, dass dort **keine offene Frage** mehr steht —
alle vierzehn Entscheidungen (2.1 bis 2.14) sind seit dem 18.09.2026
beantwortet. Statt Fragen zu erfinden, wurde geprüft, ob jede
Entscheidung auch einen **Bauauftrag** hat und ob dieser den Code
richtig beschreibt.

**Ergebnis: zwei Entscheidungen hatten überhaupt keinen Bauauftrag —
und es sind die beiden mit der schärfsten Rechtsfolge.**

## M-1 · Knopfbeschriftungen (Entscheidung 2.2/2.3) → neu **B-28**

Entschieden war: Bestellknopf **„Zahlungspflichtig bestellen"**,
Einstiegsknopf **„Zu den Tickets"**. Im Code steht:

- `content/de.ts:276` → **„Zur Bezahlung – {betrag}"**
- `content/de.ts:25` → **„Jetzt anmelden"**, an sechs Stellen verwendet

**§ 312j Abs. 3 BGB** verlangt „zahlungspflichtig bestellen" oder eine
entsprechend eindeutige Formulierung. **§ 312j Abs. 4 BGB** ordnet als
Folge an, dass der Vertrag **nicht zustande kommt**. Die Gerichte
prüfen ausschließlich die Beschriftung der Schaltfläche selbst; der
umgebende Text zählt nicht. Als unzureichend verworfen wurden unter
anderem „Bestellung aufgeben", „Senden" — und ausdrücklich **„Jetzt
anmelden"**.

**„Zur Bezahlung" beschreibt einen Navigationsschritt, nicht die Abgabe
einer zahlungspflichtigen Bestellung.** Es ist damit mit hoher
Wahrscheinlichkeit zu schwach.

**Nicht betroffen** ist die kostenlose Fassung („Jetzt verbindlich
anmelden"): Ohne Zahlungspflicht greift die Vorschrift nicht.

## M-2 · AGB-Häkchen (Entscheidung 2.4) → neu **B-29**

Entschieden war ein nicht vorbelegtes Pflicht-Häkchen „Ich akzeptiere
die AGB.", serverseitig erzwungen. **Es existiert nicht** — die Suche
über `lib/anmeldung.ts` nach `agb`, `agbAkzeptiert` und
`einwilligungAgb` findet keinen Treffer.

Nach **§ 305 Abs. 2 BGB** werden AGB nur Vertragsbestandteil, wenn bei
Vertragsschluss ausdrücklich auf sie hingewiesen wird und die zumutbare
Möglichkeit der Kenntnisnahme besteht. **Ohne diesen Schritt gelten die
ausformulierten Bedingungen nicht** — für Storno, Haftung,
Mindestteilnehmerzahl und alles Übrige griffe das Gesetz. Ein Link im
Fußbereich genügt dafür nicht.

## Was dieser Abgleich über die Methode zeigt

Die bisherigen Durchläufe prüften **Texte gegen Entscheidungen**. Dieser
prüfte **Entscheidungen gegen Bauaufträge** — und genau dort lag die
Lücke. Eine Entscheidung, die dokumentiert ist, sieht erledigt aus; ob
sie je einen Weg in den Code gefunden hat, steht an anderer Stelle.

**Beide Funde sind auch deshalb bemerkenswert, weil sie die teuerste
Sorte Fehler sind:** Sie machen nicht einen Absatz angreifbar, sondern
entziehen dem gesamten Vertragswerk die Grundlage — beim einen kommt
kein Vertrag zustande, beim anderen gelten die AGB nicht.

**Empfehlung, neu:** Diesen Abgleich künftig **zusätzlich** zum
Konsistenzdurchlauf fahren. Der Konsistenzdurchlauf fragt „Sagen die
Dokumente dasselbe?". Dieser fragt „Tut die Software, was die Dokumente
sagen?". Das ist nicht dieselbe Frage, und die zweite ist die, die am
Tag der Freischaltung zählt.

