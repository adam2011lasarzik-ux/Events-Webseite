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
