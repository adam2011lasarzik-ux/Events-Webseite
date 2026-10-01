# pretix-Umstieg — Stufe 1: Bestandsaufnahme und Architekturplan

Stand: 01.10.2026. Erstellt vor jeder Code-Änderung.

> **Dieses Dokument beschreibt einen Plan, keinen Zustand.** Zum
> Zeitpunkt der Erstellung ist **nichts** umgesetzt: kein Code
> geändert, keine Migration gelaufen, nichts deployt, kein
> pretix-Konto angelegt. Das selbst entwickelte Buchungssystem ist
> unverändert in Betrieb.

Grundsatzentscheidung vom 01.10.2026: **pretix Hosted** wird als
externes Buchungs- und Ticketsystem erprobt. VERA bleibt dabei
Veranstalter, Verkäufer, Vertragspartner und Zahlungsempfänger; das
eigene Stripe-Konto wird direkt mit pretix verbunden.

---

## Belegstufen in diesem Dokument

Der Netzzugang der Arbeitsumgebung sperrt `pretix.eu`, `pretix.cloud`
und `docs.pretix.eu` (nachgewiesen: `EGRESS_BLOCKED`, Gegenprobe mit
`de.wikipedia.org` ebenfalls gesperrt). Keine Anbieterseite konnte
direkt geöffnet werden. Deshalb trägt jede Aussage über pretix eine
Marke:

| Marke | Bedeutung |
|---|---|
| **[O]** | Suchindex zitiert eine offizielle pretix-Seite; Seite nicht selbst geöffnet |
| **[D]** | Drittquelle (Vergleichsportal, Forum) |
| **[NV]** | **nicht verifiziert** — widersprüchlich oder nicht gefunden |
| **[P]** | Prüfauftrag: von pretix, anwaltlich oder steuerlich zu klären |

Aussagen über **VERAs eigenen Code** tragen keine Marke. Sie sind am
Repository geprüft und mit Datei und Zeilennummer belegt.

---

# Teil 1 — Bestandsaufnahme des heutigen Buchungssystems

## 1.1 Wo das Buchungsformular eingebaut ist

Der Ablauf hat fünf Stationen, nicht eine:

| Station | Datei | Aufgabe |
|---|---|---|
| Formularseite | `app/(seite)/events/[slug]/anmeldung/page.tsx` | Einstieg je Veranstaltung, `force-dynamic`, erbt das Theme des Events |
| Eingabe und Preisvorschau | `components/PreisRechner.tsx` | Personenwahl, Preisanzeige, Widerrufshinweis vor dem Betrag |
| Serveraktion | `app/(seite)/anmeldung/aktion.ts` (422 Zeilen) | `anmeldungAbsenden` — prüft, rechnet serverseitig neu, startet die Bezahlseite |
| Abschluss | `app/(seite)/anmeldung/danke/page.tsx` | drei Zustände: `zahlung=abgebrochen`, `zahlung=zurueck`, bezahlt |
| Storno | `app/(seite)/anmeldung/stornieren/page.tsx` + `aktion.ts` | Selbstbedienung über `stornoSchluessel` |

**Der Punkt, der jede pretix-Planung bestimmt:** Die Serveraktion
schreibt **keine Anmeldung**. Sie verschlüsselt die Eingaben und legt
sie als `marke_*`-Metadaten in die Stripe-Sitzung; die `Registration`
entsteht erst im Webhook, nachdem Geld geflossen ist. Es gibt heute
keinen Zwischenzustand und keinen vorläufigen Datensatz.

`app/(seite)/anmeldung/page.tsx` — die alte Sammelseite ohne Slug —
existiert noch.

## 1.2 Zugehörige Routen, Module, Tabellen, Adminfunktionen

**Routen mit eigener Logik (3):**

- `app/zahlung/rueckmeldung/route.ts` — 514 Zeilen, Stripe-Webhook,
  behandelt sechs Ereignisse: `checkout.session.completed`,
  `.async_payment_succeeded`, `.expired`, `.async_payment_failed`,
  `charge.refunded`
- `app/admin/events/[id]/anmeldungen/csv/route.ts` — CSV-Export
- `app/bilder/[datei]/route.ts` — Bildausgabe

**lib-Module: 46 insgesamt, davon 17 buchungsrelevant** — `preise`,
`plaetze`, `anmeldung`, `anmeldungAnlegen`, `anmeldeNutzlast`,
`anmeldeSchluessel`, `zahlung`, `zahlungStart`, `zahlungRegeln`,
`storno`, `stornoAusfuehren`, `mail`, `mailVorlagen`, `rechtstexte`,
`rechtstextFassung`, `bremseFluechtig`, `ratelimit`.

**Datenmodelle: 22 insgesamt.** Die Trennung ist die wichtigste Zahl
dieses Berichts:

*Von pretix ersetzbar (8):* `Event`, `EventAbschnitt`, `Registration`,
`Participant`, `ZahlungsEreignis`, `Fehlbuchung`, `AnmeldeVersuch` —
und `Rechtstext` nur teilweise.

*Von pretix **nicht** ersetzbar (14):* `Loeschsperre`,
`Loeschprotokoll`, `Vorfall`, `Zustimmungsnachweis`, `Checkliste`,
`Aufnahmewiderspruch`, `Veroeffentlichung`,
`Veroeffentlichungspruefung`, `AdminUser`, `AdminSession`,
`AdminZweiterFaktorCode`, `AdminZweiterFaktorPruefung`,
`AdminProtokoll`, `Einstellungen`.

**Folgerung: VERAs Adminbereich und Datenbank bleiben in jedem Fall
bestehen.** pretix übernimmt rund ein Drittel der Modelle.

**Adminfunktionen: 15 Bereiche, 30 Serveraktionen.** Buchungsnah sind
nur fünf — `statusSetzen`, `zahlungSetzen`, `anonymisieren`,
`stornierenUndErstatten`, `fehlbuchungErledigen`. Die übrigen 25
betreffen Aufnahmen, Checklisten, Vorfälle, Zustimmungsnachweise,
Löschen, zweiten Faktor und Events.

**Betrieb: 31 Dateien in `server/`, fünf systemd-Timer** — Löschlauf,
Papiererinnerung, Sicherung, Wache, Zahlungsabgleich.
**22 Prüflisten, 132 Prüfdateien.**

## 1.3 Die heutige Content-Security-Policy

Aus `next.config.mjs:64-89`, wortgetreu:

```
default-src 'self'
script-src 'self' 'unsafe-inline'
style-src 'self' 'unsafe-inline'
img-src 'self' data:
font-src 'self'
connect-src 'self'
object-src 'none'
base-uri 'self'
form-action 'self'
frame-ancestors 'none'
upgrade-insecure-requests
```

Es gibt **kein** `frame-src` — also greift `default-src 'self'`, und
ein iFrame auf eine Fremddomain wäre blockiert. Der Kommentar daneben
warnt bereits vor genau diesem Fall:

> Würde später ein SDK eines Zahlungsanbieters eingebettet, MUSS diese
> Regel vorher erweitert und danach erneut gemessen werden — sonst
> wird das Skript stillschweigend blockiert und die Bezahlung schlägt
> fehl.

## 1.4 Stripe und PayPal heute

- **Stripe-Zugang:** `lib/zahlung.ts`, Schlüssel aus `ZAHLUNG_GEHEIMSCHLUESSEL`
- **Riegel:** `lib/zahlungRegeln.ts:47` weist jeden Schlüssel ab, der
  nicht mit `sk_test_` oder `rk_test_` beginnt
- **Bezahlseite:** gehostetes Stripe Checkout, 30 Minuten Gültigkeit
- **Webhook:** Signaturprüfung über den **Rohtext**, Geheimnis aus
  `ZAHLUNG_WEBHOOK_GEHEIMNIS`
- **Erstattung:** `stripe().refunds.create` (`lib/zahlung.ts:467`)

**Befund mit Folgen für das Ziel „eigenes PayPal-Konto":**
`payment_method_types: ["card", "paypal"]` (`lib/zahlung.ts:243`).
PayPal läuft heute als Zahlart **innerhalb** von Stripe — VERA hat
kein angebundenes PayPal-Geschäftskonto. Bei pretix das eigene
PayPal-Konto zu nutzen ist deshalb **keine Fortsetzung, sondern eine
Neueinführung**: eigener PayPal-Vertrag, eigene Gebühren, eigene
Angabe in der Datenschutzerklärung, eigener Auszahlungsweg. Machbar
und sogar sauberer — aber ein zusätzlicher Schritt.

**Geheimnisse:** 6 Namen in `.env.example`, 19 `process.env`-Namen im
Code. Keine Werte im Repository.

## 1.5 Was bei einer pretix-Integration betroffen wäre

| Bereich | Betroffenheit |
|---|---|
| Formular, PreisRechner, Serveraktion | **vollständig ersetzt** |
| Webhook `/zahlung/rueckmeldung` | ersetzt durch pretix-Webhook — **eigene Ausnahme in der nginx-Bremse nötig** |
| `preise.ts`, `plaetze.ts` | wandern nach pretix (Produkte, Bundles, Quota) |
| Bestätigungs-, Storno-, Erstattungsmails | wandern nach pretix; 10 Vorlagen entfallen |
| `Registration`, `Participant` | nicht mehr befüllt — Altdaten bleiben |
| `agbFassungId` / `datenschutzFassungId` | **kein Gegenstück bei pretix** |
| `Fehlbuchung` und fünf Automatikgründe | entfällt |
| CSP, Prüfliste O, Skill `vera-frontend-design` | müssen angepasst bzw. neu gemessen werden |
| Löschklassen, Vorfälle, Aufnahmen, Checklisten | **unberührt, bleiben bei VERA** |

## 1.6 Wie das alte System unverändert aktiv bleibt

Günstige Ausgangslage: **An keiner bestehenden Datei muss etwas
geändert werden.** Der Weg zu pretix führt über zusätzliche Dateien,
nicht über Umbau.

- Keine Änderung an `anmeldung/aktion.ts`, `zahlung.ts`,
  `rueckmeldung/route.ts`, `plaetze.ts`, `preise.ts`
- **Keine Datenbankmigration während der Testphase** — damit entfällt
  der riskanteste Rückweg vollständig
- Kein Eingriff in die fünf systemd-Timer
- Keine Änderung an der globalen CSP; nur eine pfadbezogene Ausnahme

## 1.7 Feature-Flag und getrennte Testseite

**Doppelriegel, beide müssen offen sein:**

```
PRETIX_TEST=1            # serverseitige Umgebungsvariable, Voreinstellung: aus
NODE_ENV !== production  # zweiter, unabhängiger Riegel
```

**Niemals `NEXT_PUBLIC_`** — das würde den Wert in das Browser-Paket
schreiben.

**Die Testseite:** `app/(test)/pretix-test/page.tsx`. Bei fehlendem
Flag ruft sie `notFound()` auf und liefert damit eine **echte 404** —
nicht eine versteckte Seite, die man mit der richtigen Adresse doch
erreicht. Auf dem Live-Server käme die bestehende
`auth_basic`-Sperre als dritte Schicht dazu (`server/vera-sperre.conf`).

**CSP:** eine eigene `headers()`-Regel **nur für diesen Pfad**, mit
einzeln benannten Zielen — kein `*`, kein zusätzliches
`unsafe-inline`. Welche Ziele genau, wird festgelegt, sobald die
pretix-Domain feststeht.

**Was die Testseite nicht darf:** nichts in die VERA-Datenbank
schreiben, keine Namen, E-Mail-Adressen, Zahlungsdaten oder
Geheimnisse protokollieren, keine echten Teilnehmerdaten verwenden.

**Warum kein Schalter im `Einstellungen`-Modell:** Das wäre eine
Datenbankänderung. Eine Umgebungsvariable ist hier ohnehin besser —
sie wirkt vor jedem Datenbankzugriff.

## 1.8 Sicherungs- und Rückkehrplan

**Vor jeder Änderung:**

1. `server/vera-sicherung.sh` ausführen, Erfolg im Protokoll bestätigen
2. Arbeit auf `claude/frontend-design-skill-folder-luremb`, ein Commit je Stufe

**Rückkehr, drei Stufen, jede für sich ausreichend:**

| Stufe | Maßnahme | Wirkung | Dauer |
|---|---|---|---|
| 1 | `PRETIX_TEST` entfernen, Dienst neu starten | Testseite ist 404, alles andere unverändert | Sekunden |
| 2 | Commit zurücknehmen (`git revert`), neu bauen | Code wie vorher | Minuten |
| 3 | `server/vera-nach-wiederherstellung.sh` nach Rücksicherung | vollständiger Stand | vorhanden, geübt |

**Der stärkste Schutz ist die Abwesenheit einer Migration:** Ohne
Schemaänderung gibt es keinen Datenbank-Rückweg, der scheitern könnte.
`server/vera-ruecktest.sh` und `vera-nach-wiederherstellung.sh`
existieren bereits aus dem Ausrollen der Stufe 2.

---

# Teil 2 — Architekturplan: dynamisch für alle Events

Vorgabe vom 01.10.2026: Nicht „pretix für das Padel-Event", sondern
**jedes VERA-Event kann einer pretix-Veranstaltung zugeordnet
werden** — bestehende und künftige, ohne Code-Änderung und ohne
Deployment je Event.

**Vereinfachung vom 01.10.2026:** Die pretix-Veranstaltungen werden
**von Hand im pretix-Administrationsbereich angelegt**. VERA speichert
nur die Zuordnung. Keine automatische Erstellung, kein Klonen über die
API — das wäre wieder Eigenentwicklung und Wartung. Siehe Teil 5 für
die bewusst zurückgestellte Erweiterung.

## 2.1 Die Zuordnung je Event

Vier neue Felder am `Event`-Modell:

```
pretixAktiv        Boolean  @default(false)
pretixVeranstalter String?              // Veranstalterkürzel (organizer slug)
pretixEvent        String?              // Veranstaltungskürzel (event slug)
pretixGeprueftAm   DateTime?            // wann zuletzt geprüft
pretixZustand      String?              // zwischengespeichertes Ergebnis

@@unique([pretixVeranstalter, pretixEvent])
```

**Der `@@unique` ist der wichtigste Teil.** Er macht es technisch
unmöglich, dass zwei VERA-Events auf dieselbe pretix-Veranstaltung
zeigen — also dass zwei Veranstaltungen sich still dieselben Plätze
teilen. Das ist eine Datenbankregel, keine Absprache. Der Skill
`event-backend-database` verlangt genau das: Constraint und
Anwendungslogik müssen zueinander passen.

**Gegenprobe in die andere Richtung:** pretix erlaubt
**Meta-Attribute** am Event, nach denen der Widget sogar filtern kann
**[O]**. Dort wird `vera_event_id` mit VERAs `Event.id` abgelegt. Dann
ist die Verknüpfung **beidseitig prüfbar**: Ein vertipptes Kürzel
fällt auf, weil die Gegenseite nicht zurückzeigt. Ohne das würde ein
Tippfehler Buchungen in die falsche Veranstaltung leiten — und das
fiele erst am Veranstaltungstag auf.

## 2.2 Genau eine Weiche im Code

```
lib/buchungsweg.ts  →  buchungsweg(event): "EIGEN" | "PRETIX" | "GESPERRT"
```

Eine Stelle, drei Abnehmer: Eventseite, Anmeldeseite, Adminbereich.
Das folgt demselben Grundsatz wie `belegtFilter()` in
`lib/plaetze.ts` — eine zweite, abweichende Entscheidung an anderer
Stelle wäre der Weg in die Doppelbuchung.

**Je Event ist immer genau einer der beiden Wege offen.** Niemals
beide. Das ist nicht Bedienkomfort, sondern Überbuchungsschutz.

## 2.3 Kein automatischer Rückfall — und warum

Ist die Zuordnung bei einem auf pretix gestellten Event kaputt, zeigt
die Seite **„Anmeldung derzeit nicht möglich"** und der Adminbereich
schlägt Alarm. Sie fällt **nicht** automatisch auf das alte System
zurück.

Das klingt unfreundlicher, als es ist: Für ein pretix-Event hat VERAs
eigene Datenbank null belegte Plätze. Ein stiller Rückfall würde
dieselben Plätze ein zweites Mal von vorn verkaufen. **Der Rückweg
muss eine menschliche Entscheidung bleiben** — ein Umschalten des
Flags, kein Automatismus.

Ebenso: **keine automatische Freischaltung.** Ein Event wird nie
selbsttätig auf pretix umgestellt.

## 2.4 Die Gültigkeitsprüfung

`pretixZuordnungPruefen(event)` liest die pretix-Veranstaltung über die
API und prüft sechs Dinge:

1. Existiert die Veranstaltung?
2. Ist sie live?
3. Gibt es eine Quota?
4. Ist ein Zahlungsanbieter aktiv?
5. Stimmt die Quota mit VERAs `maxPersonen`?
6. Zeigt das Meta-Attribut `vera_event_id` auf dieses VERA-Event zurück?

Vier Zustände: **AUS** · **UNVOLLSTÄNDIG** (Kürzel fehlt) ·
**UNGÜLTIG** (Kürzel da, Prüfung fehlgeschlagen) · **GÜLTIG**.

Mit Zeitüberschreitung und Zwischenspeicher — **die Prüfung darf keine
Seite blockieren**. Ein langsamer pretix-Server würde sonst die
Eventseite ausbremsen.

## 2.5 Was der Adminbereich zeigt

| Was | Wo |
|---|---|
| Ist pretix für dieses Event aktiv? | Spalte in der Eventliste, Abschnitt auf der Eventseite |
| Welche pretix-Veranstaltung ist zugeordnet? | `veranstalter/event` als Text plus Verweis |
| Läuft noch das alte System? | derselbe Abschnitt, Gegenstück zur Anzeige oben |
| Ist die Zuordnung vollständig und gültig? | Ampel mit den vier Zuständen, Knopf „Jetzt prüfen" |

Dazu je Event ein Hinweis, wenn beide Wege Plätze hätten — der Fall
darf nicht unbemerkt eintreten.

## 2.6 Der Migrationskonflikt und seine Auflösung

Die vier neuen Felder brauchen eine Prisma-Migration. Die
Sicherheitsregel für die Testphase verbietet Migrationen. Beides ist
richtig:

- **Testphase:** Die Zuordnung des einen Padel-Events lebt in
  Umgebungsvariablen — `PRETIX_TEST_VERANSTALTER`, `PRETIX_TEST_EVENT`.
  Keine Migration, kein Schemaeingriff, nichts in der Datenbank. Die
  Testseite liest nur.
- **Allgemeine Umsetzung (nach ausdrücklicher Freigabe):** dann die
  Migration, als eigener Schritt mit Sicherung und Rückkehrplan.

---

# Teil 3 — Risiken

**1. Die Kernanforderung bleibt offen.** pretix legt vor der Zahlung
einen Warenkorb und eine vorläufige Bestellung mit Namen an. Dass der
Warenkorb **abläuft** und den Platz freigibt, ist belegt: *„Cart
positions expire at a set time and no longer block quota after that
point"* **[O]**. Dass die Daten **gelöscht** werden, ist es **nicht** —
die Dokumentation sagt im Gegenteil, Löschen sei wegen steuerlicher
Aufbewahrung schwierig und der übliche Weg sei *Anonymisieren* **[O]**.
Die Anforderung lautet „läuft automatisch ab **und wird gelöscht**".
Erste Hälfte erfüllt, zweite ungeklärt. **[P] — erste Frage an pretix.**

**2. Doppelte Platzvergabe.** Zwei Systeme, eine Halle, 100 Plätze.
Abgesichert durch die Weiche in 2.2, den `@@unique` in 2.1 und das
Verbot des automatischen Rückfalls in 2.3.

**3. Die nginx-Bremse würde den pretix-Webhook abwürgen.** Genau
dieser Fehler trat am 30.09.2026 auf: zwölf Stripe-Rückmeldungen mit
429. Die Ausnahme in `server/vera-bremse.conf` gilt nur für
`/zahlung/rueckmeldung`. Ein pretix-Webhook braucht seine eigene
Ausnahme, **und sie muss vor der allgemeinen Regel stehen** — in
nginx-`map` gewinnt der erste Treffer.

**4. Rechtstext-Fassung je Buchung.** `Registration.agbFassungId` und
`datenschutzFassungId` (`prisma/schema.prisma:372-375`) haben bei
pretix kein Gegenstück. Umweg: ein Order-Metafeld über die API —
machbar, aber Eigenentwicklung.

**5. Foto-/Video-Einwilligung — bewusst nicht wieder eingeführt.**
VERA hat sie mit Entscheidung 4.8 (Bauaufträge B-10, B-17)
abgeschafft. Es gibt nur `kenntnisAufnahmen` als **Kenntnisnahme**
(Pflicht, keine Einwilligung; die Aufnahmen stützen sich auf Art. 6
Abs. 1 Buchst. f DS-GVO), und wer nicht abgebildet werden will,
widerspricht nach Art. 21 DS-GVO über `Aufnahmewiderspruch`.
**Entscheidung vom 01.10.2026: Beim heutigen Stand bleiben.** Im
pretix-Testevent wird nur die Pflicht-Kenntnisnahme abgebildet.

**6. Add-ons umgehen den Personendeckel.** `max_items_per_order`
begrenzt die Gesamtzahl je Bestellung **[O]**, aber *„Add-on products
are not counted in these limits"* **[O]**. Wird das Familienpaket über
Add-ons gebaut, sind 20 Personen umgehbar. Gehört in Test 7.

---

# Teil 4 — Offene Fragen an pretix

| # | Frage | Warum sie zählt |
|---|---|---|
| 1 | Werden abgelaufene Bestellungen **gelöscht** oder nur anonymisiert, und nach welcher Frist? | Kernanforderung, siehe Risiko 1 |
| 2 | Sind Retention-Fristen je Datenart trennbar? | VERA hat acht Löschklassen von 7 Tagen bis 30 Jahren |
| 3 | Zählt `max_items_per_order` Bundle-Unterposten mit? | Personendeckel, siehe Risiko 6 |
| 4 | Lässt sich die Rechtstext-Fassung als Order-Metafeld zuverlässig mitschreiben? | Risiko 4 |
| 5 | Freikontingent bei Freikarten: 500 **[O]** oder 2.500 **[D]**? | Quellen widersprechen sich |
| 6 | **Wer ist Auftragsverarbeiter im AVV — pretix GmbH oder rami.io GmbH?** | Der AVV muss die richtige Stelle benennen |
| 7 | Wie wird die Kleinunternehmerregelung nach § 19 UStG in der Steuerregel abgebildet? | **[P] steuerlich** — siehe Teil 6 |
| 8 | Fällt auf die Systemgebühr deutsche Umsatzsteuer an? | VERA hat keinen Vorsteuerabzug |

---

# Teil 5 — Bewusst zurückgestellt: automatische Erstellung über die API

**Nicht umgesetzt. Nur dokumentiert, falls es später gewollt ist.**

pretix kann Veranstaltungen über die API anlegen:
`POST /api/v1/organizers/{veranstalter}/events/`, und mit dem
Parameter `clone_from` werden *„settings, products, …"* von einer
Vorlagenveranstaltung übernommen **[O]**. Zwei Eigenschaften sind
belegt und wichtig: *„events cannot be created as 'live' using this
endpoint"* und *„Quotas and payment must be added to the event before
sales can go live"* **[O]**.

Damit wäre ein Weg möglich, bei dem VERAs Adminbereich beim Speichern
eines neuen Events auf Wunsch eine pretix-Veranstaltung als Klon einer
Vorlage anlegt.

**Warum es zurückgestellt ist:** Es wäre zusätzliche
Eigenentwicklung mit zusätzlicher Wartung — genau das, was mit dem
Umstieg verringert werden soll. Der manuelle Weg (Veranstaltung in
pretix anlegen, Kürzel in VERA eintragen) kostet pro Event wenige
Minuten und kann nicht stillschweigend falsch laufen.

**Voraussetzung für eine späte Umsetzung:** Der manuelle Weg läuft
über mehrere Veranstaltungen fehlerfrei, und der Aufwand ist messbar
störend geworden.

---

# Teil 6 — Was vor dem ersten Verkauf geklärt sein muss

**Drei Entscheidungen bei der Kontoanlage sind später schwer oder
nicht änderbar:**

1. **Das Veranstalterkürzel.** *„It is not possible to change the
   short form because it is the organizer's unique identifier"* **[O]**.
   Es steht in jeder Shop-Adresse und in jedem API-Pfad.
2. **Das Veranstaltungskürzel.** Kleingeschrieben, alphanumerisch,
   eindeutig innerhalb des Veranstalters, Teil der Adresse **[O]**.
   Nachträgliche Änderbarkeit **[NV]** — praktisch wie unveränderlich
   behandeln, weil Ticket-Links und QR-Codes darauf zeigen.
3. **Steuerregel und Währung.** VERA ist Kleinunternehmen nach
   § 19 UStG und darf **keine Umsatzsteuer ausweisen**. Wer sie als
   Kleinunternehmer ausweist, **schuldet sie dem Finanzamt**
   (§ 14c Abs. 2 UStG) — auch wenn er sie nie eingenommen hat. Wie das
   in pretix einzustellen ist: **[NV]**, nicht gefunden. Währung wird
   am Event gesetzt **[O]**, nachträgliche Änderbarkeit **[NV]**.
   **[P] steuerlich zu prüfen, bevor der erste Verkauf stattfindet.**

**Kostenfreiheit und Verkaufssperre sind belegt:**

- *„Creating an account with pretix is completely free of charge and
  does not come with any obligation to pay money … pretix will not
  charge you before you publish your ticket shop to everyone"* **[O]**
- *„Every event begins in test mode by default"* **[O]** — und das ist
  Absicht, weil Buchungen im Echtbetrieb aus steuerlichen Gründen
  nicht mehr gelöscht werden können **[O]**
- Testbestellungen können beim Abschalten des Testmodus dauerhaft
  gelöscht werden; die Löschung wird revisionssicher protokolliert **[O]**
- Ein Event ist **nicht live**, bis es ausdrücklich live geschaltet
  wird **[O]**

---

# Teil 7 — Nächste Schritte

| Stufe | Inhalt | Zustand |
|---|---|---|
| 1 | Bestandsaufnahme und Architekturplan | **dieses Dokument** |
| 2 | Angaben erfragen, Konto anlegen | läuft |
| 3 | Testveranstaltung planen und einrichten | offen |
| 4 | Technische Testintegration (nur nach Freigabe) | offen |
| 5 | 22 Tests durchführen und dokumentieren | offen |
| 6 | Änderungsliste Datenschutz und Rechtstexte | offen |
| 7 | Pilotbetrieb mit genau einer Veranstaltung | offen |

Die endgültige Umstellung erfolgt **nur nach ausdrücklicher Freigabe**.
Das selbst entwickelte Buchungssystem bleibt während der gesamten
Test- und Pilotphase unverändert als Rückfalllösung erhalten.
