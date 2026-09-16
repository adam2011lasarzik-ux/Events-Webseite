# Rechtliche Seiten — Stand und was noch fehlt

Diese Datei sagt, was technisch fertig ist und was noch von dir oder
von einer fachkundigen Person kommen muss.

> **Kein Rechtsrat.** Hier steht, was im Projekt vorhanden ist und
> welche Fragen offen sind — nicht, wie sie zu beantworten sind. Die
> Texte auf den Seiten sind bewusst als **Platzhalter** gekennzeichnet.

## Legende

| | |
|---|---|
| 🟩 **Fertig** | technisch erledigt, nichts mehr zu tun |
| 🟦 **Du** | kannst du selbst mit deinen Unternehmens- und Eventdaten ausfüllen |
| 🟨 **Fachkundig** | sollte vor Veröffentlichung geprüft werden |
| 🟥 **Pflicht** | muss zwingend vor dem öffentlichen Livegang erledigt sein |

---

## Impressum · `/impressum`

| Punkt | Stand |
|---|---|
| Seite vorhanden, erreichbar, im Fussbereich verlinkt | 🟩 |
| Rechtsform geklärt: **Einzelunternehmen**, kein Registereintrag | 🟩 |
| Name: **Adam Maurice Lasarzik** (keine Geschäftsbezeichnung angemeldet) | 🟩 |
| E-Mail: **kontakt@veraevents.de** — echt, in Betrieb | 🟩 |
| Umsatzsteuer: Kleinunternehmen nach § 19 UStG, keine ausgewiesen | 🟩 |
| **Ladungsfähige Anschrift**: Mühlenstr. 8a, 14167 Berlin | 🟩 **eingetragen (15.09.2026)** |
| **Telefonnummer**: +49 3323 0219825 | 🟩 **eingetragen (15.09.2026)** |
| Umsatzsteuer-Identifikationsnummer | 🟦 ungeklärt, bewusst leer |

**Beide Felder sind seit dem 15.09.2026 gefüllt.** Der Betreiber hat
eine getrennte Geschäftsanschrift und eine geschäftliche Rufnummer
geliefert; sie stehen im Impressum und — die Nummer — auf der
Kontaktseite.

**Die Prüfungen stehen jetzt andersherum.** Vorher kontrollierte
Prüfliste `N`, dass die zwei Felder *erkennbar offen* sind. Jetzt
kontrolliert sie, dass die Angaben wirklich dastehen **und** kein
Platzhalter mehr daneben steht — dazu, dass die Nummer ein wählbarer
`tel:`-Link ist, auf beiden Seiten.

**Was damit NICHT beantwortet ist:** ob die eingetragene Anschrift im
Rechtssinn *ladungsfähig* ist. Das lässt sich nicht aus dem Code
beurteilen und gehört zu den Punkten, die der Rechtstexte-Dienst
bestätigen muss. Ein Postfach oder ein reiner „Impressumsservice"
genügt dafür nicht.

**Zur USt-IdNr.:** Es steht bewusst **keine** dort, solange ungeklärt
ist, ob eine vorliegt. Eine erfundene wäre schlimmer als keine, und
die Steuernummer vom Finanzamt gehört nicht ins Impressum — die steht
nur auf Rechnungen.

**Bewusst nicht enthalten:** der Standardbaustein zur
EU-Streitschlichtungsplattform (eingestellt, der Link zeigt ins Leere)
und der Hinweis nach § 36 VSBG (gilt erst ab mehr als zehn
Beschäftigten). Beides bei einer fachkundigen Prüfung gegenprüfen.

### Wo die Daten gepflegt werden

Alle Anbieterdaten stehen an **einer** Stelle: `content/de.ts` →
`anbieter`. Impressum, Fussbereich und Kontaktseite lesen von dort.
`null` bedeutet „liegt noch nicht vor" und erscheint sichtbar als
Platzhalter.

Vorher lag die erfundene Adresse `kontakt@beispiel.de` an drei Stellen
— im Fussbereich **jeder** Seite sogar ohne Platzhalter-Markierung, wo
sie sich wie eine gültige Adresse las. Sie ist entfernt; Prüfliste `N`
sucht bei jedem Lauf danach.

## Datenschutzerklärung · `/datenschutz`

| Punkt | Stand |
|---|---|
| Seite vorhanden, erreichbar, verlinkt | 🟩 |
| **Cookie-Aussage korrigiert** — siehe unten | 🟩 |
| **Stripe vollständig benannt** — Betrag, Anmeldenummer, E-Mail, Titel der Veranstaltung, Personenzahl | 🟩 |
| Ausformulierte Erklärung: Rechtsgrundlagen, Speicherdauern, Betroffenenrechte | 🟨 🟥 |
| **Server-Protokolle**: IP-Adresse wird gekürzt (letzte Stelle verworfen), Aufbewahrung 14 Tage | 🟩 **erledigt** |
| **UptimeRobot** als zweiter Dienstleister benennen | 🟨 |
| Auftragsverarbeitung mit Stripe einordnen | 🟨 |
| **Einverständniserklärungen für Minderjährige**: eigener Abschnitt 2 | 🟩 **eingetragen (16.09.2026)** |

**Neu seit dem 16.09.2026:** Die Seite hat einen zweiten, **verbindlichen**
Abschnitt „Einverständniserklärungen für minderjährige Teilnehmer" —
Datenarten, Zwecke, Rechtsgrundlagen (Art. 6 Abs. 1 Buchst. b, f und d,
für Gesundheitsangaben Art. 9 Abs. 2 Buchst. a bzw. c DSGVO), Rolle der
Veranstaltungslocation, Speicherdauern und Pflicht- bzw. Freiwilligkeit.

Er ist **wörtlich abgestimmt** mit der Datenschutzinformation auf Seite 2
der Einverständniserklärung (`public/dokumente/`). Beide dürfen nur
gemeinsam geändert werden — stünde auf dem Formular etwas anderes als auf
der Seite, wäre eine der beiden Angaben falsch.

**Deshalb steht die Platzhalter-Markierung jetzt bei Abschnitt 1** statt
über der ganzen Seite, genau wie auf der Widerrufsseite. Eine Seite, die
eine geltende Regelung enthält und sich zugleich als „noch nicht
ausgefüllt" bezeichnet, wäre in beide Richtungen irreführend.

**Korrigiert:** Dort stand „Diese Seite setzt keine Cookies". Das war
falsch — `lib/adminAuth.ts` setzt für die Anmeldung am
Verwaltungsbereich das Cookie `vera_admin`. Besucher bekommen keines,
und ein technisch notwendiges Sitzungscookie ist auch nicht
einwilligungspflichtig; eine nachweislich falsche absolute Aussage
gehört trotzdem nicht auf eine Datenschutzseite. Jetzt steht dort, was
zutrifft.

## Allgemeine Geschäftsbedingungen · `/agb`

| Punkt | Stand |
|---|---|
| Seite vorhanden, erreichbar, verlinkt | 🟩 |
| **Klargestellt: eigene AGB sind nicht vorgeschrieben** | 🟩 |
| Hinweis auf Pflichtangaben vor Vertragsschluss im Fernabsatz | 🟩 (als offene Frage benannt) |
| Entscheidung, ob VERA eigene AGB verwendet | 🟦 🟨 |
| Falls ja: Text passend zum tatsächlichen Buchungsablauf | 🟨 🟥 |
| **Abschnitt 2 „Teilnahme Minderjähriger"** — verbindlich | 🟩 **eingetragen (16.09.2026)** |

**Neu seit dem 16.09.2026:** Abschnitt 2 regelt die Teilnahme
Minderjähriger: Zustimmung der erziehungsberechtigten Person, Abgabe der
Einverständniserklärung spätestens beim Check-in (elektronische
Übermittlung bleibt möglich), Verantwortung für den Hin- und Rückweg,
Betreuungszeitraum von Check-in bis Veranstaltungsende, Hausregeln und
Ausschluss, Erste Hilfe — und die Haftung.

**Der Haftungsabsatz ist die einzige Haftungsregelung im Projekt.** Er
schliesst nichts aus, sondern verweist auf die gesetzlichen Vorschriften
und stellt ausdrücklich klar, dass für Leben, Körper, Gesundheit sowie
Vorsatz und grobe Fahrlässigkeit nichts beschränkt wird. Ein pauschaler
Haftungsausschluss stand auf der Seite nie und gehört auch nicht dorthin;
Prüfliste `N` sucht bei jedem Lauf danach.

**Die Platzhalter-Markierung gilt dadurch nur noch für Abschnitt 1** —
dasselbe Muster wie bei Widerruf und Datenschutz.

**Korrigiert:** Der Platzhalter las sich, als seien AGB Pflicht. Sind
sie nicht — ohne eigene AGB gilt das Gesetz. Etwas anderes sind die
Informationen, die im Fernabsatz **vor** dem Absenden einer Bestellung
erscheinen müssen; welche das für dieses Eventmodell sind, gehört
geprüft.

## Widerruf und Stornierung · `/widerruf`

| Punkt | Stand |
|---|---|
| Seite vorhanden, erreichbar, verlinkt | 🟩 |
| **Widerrufsrecht und Stornierung getrennt dargestellt** | 🟩 |
| **Keine 14-Tage-Belehrung eingebaut** | 🟩 (bewusst) |
| Klärung, ob § 312g Abs. 2 Nr. 9 BGB greift | 🟨 🟥 |
| Je nach Ergebnis: Belehrung **oder** Hinweis auf den Ausschluss | 🟨 🟥 |
| **Stornobedingungen festgelegt und auf der Seite** | 🟩 |
| **Absage durch VERA geregelt** (eigener Abschnitt 3) | 🟩 |

**Erledigt:** Die Stornobedingungen stehen jetzt als verbindlicher Text
auf der Seite — kostenlose Stornierung bis 24 Stunden vor Beginn,
voller Betrag zurück, keine Übertragung auf andere Personen, bei
Absage durch VERA automatische Erstattung. Sie beschreiben genau, was
die Seite tut: Die Selbstbedienungs-Stornierung ist gebaut und läuft
über den Link in der Bestätigungsmail.

**Deshalb gilt die Platzhalter-Markierung dort nur noch für Abschnitt
1.** Eine Seite, die geltende Bedingungen enthält und sich zugleich als
„noch nicht ausgefüllt" bezeichnet, wäre in beide Richtungen
irreführend.

**Korrigiert:** Die Seite hiess „Widerrufsbelehrung". Dieser Titel
setzt voraus, dass ein Widerrufsrecht besteht — und genau das ist
offen. Bei Dienstleistungen im Zusammenhang mit Freizeitbetätigungen
zu einem bestimmten Termin kann es nach § 312g Abs. 2 Nr. 9 BGB
ausgeschlossen sein. Ein Padel-Nachmittag an einem festen Datum fällt
möglicherweise darunter.

Deshalb steht dort **bewusst keine** Standard-Belehrung: Über ein
Recht zu belehren, das es womöglich nicht gibt, wäre irreführend —
über ein bestehendes Recht nicht zu belehren, hätte Folgen. Die Frage
gehört beantwortet, bevor Tickets verkauft werden.

**Stornierung ist etwas anderes** und wird auf der Seite getrennt
behandelt: Sie ist eine vertragliche Regelung, die VERA selbst
festlegt, und gilt unabhängig vom gesetzlichen Widerrufsrecht.

---

## Erreichbarkeit im Buchungsablauf

| Punkt | Stand |
|---|---|
| Fussbereich mit allen vier Rechtsseiten auf **jeder** öffentlichen Seite | 🟩 |
| … auch auf Anmeldeformular und Abschluss-Seite | 🟩 |
| Hinweis beim Absende-Knopf: Weiterleitung zur Bezahlseite, Kartendaten kommen nie an, Anmeldung erst nach Zahlung bestätigt | 🟩 |
| Ob zusätzliche Angaben **direkt am Bestellknopf** stehen müssen | 🟨 |
| Pflicht-Häkchen „AGB akzeptiert" | bewusst **nicht** eingebaut |

Der Fussbereich steckt in `app/(seite)/layout.tsx` und gilt damit für
alle öffentlichen Seiten; Prüfliste `O` belegt das bei jedem Lauf.

**Warum kein Häkchen:** Ein Pflicht-Häkchen, das auf eine leere
Platzhalterseite zeigt, wäre eine Attrappe. Sobald echte AGB
vorliegen, fügt es sich ohne Umbau ein — `lib/anmeldung.ts` führt
`einwilligungVormund` und `einwilligungFotos` bereits nach demselben
Muster.

---

## Einverständniserklärung für Minderjährige · vier Stellen, ein Wortlaut

Die Regelung steht an **vier** Stellen, und sie müssen zusammenpassen:

| Stelle | Datei |
|---|---|
| Das Formular selbst (2 Seiten, mit Art.-13-Information) | `public/dokumente/einverstaendniserklaerung-minderjaehrige.pdf` |
| Hinweis im Anmeldebereich, nur bei „Mein Kind“ und „Familienpaket“ | `content/de.ts` → `anmeldung.minderjaehrig*`, angezeigt in `components/PreisRechner.tsx` |
| AGB, Abschnitt 2 „Teilnahme Minderjähriger“ | `content/de.ts` → `recht.agbMinderjaehrig*` |
| Datenschutz, Abschnitt 2 | `content/de.ts` → `recht.datenschutzMinderjaehrig*` |

**Wird eine geändert, müssen alle vier angesehen werden.** Prüfliste `N`
vergleicht die tragenden Aussagen (Check-in, Hin- und Rückweg,
Betreuungszeitraum, Gesundheitsangaben, 30-Tage-Frist) und schlägt an,
wenn eine davon verschwindet.

**Gestrichen am 16.09.2026:** An allen vier Stellen stand der Satz „Eine
von VERA Events angebotene elektronische Übermittlung bleibt möglich."
Es gibt keine — weder eine Upload-Funktion für Besucher (die Website hat
überhaupt keine, Uploads kann nur der Verwaltungsbereich) noch eine
Einreichung per Mail. Der Satz hätte Eltern nach einem Weg suchen lassen,
den es nicht gibt. Die Erklärung wird **ausgedruckt, unterschrieben und
am Empfang der Veranstaltungslocation abgegeben** — sonst nichts.
Prüfliste `N` hält den Satz jetzt fern, auch in der PDF.

### Umgang mit den Formularen vor Ort

Die Veranstaltungslocation nimmt die Formulare **ausschliesslich für VERA
Events** entgegen. Genau das steht so auf dem Formular und in der
Datenschutzerklärung — und muss deshalb auch so gelebt werden:

- am Empfang geschützt entgegennehmen, **nicht offen auslegen**
- **nicht fotografieren und nicht kopieren**
- kurzfristig geschützt verwahren (verschlossen, nicht einsehbar)
- **vollständig** an VERA Events übergeben
- **keine Ausfertigung in der Halle zurückbehalten**

**Technisch gibt es dazu nichts zu tun.** Die ausgefüllten Formulare
werden **nicht** digitalisiert, nicht hochgeladen und nirgends
gespeichert — es gibt im Projekt keine Funktion dafür, und es soll
vorerst auch keine geben. Deshalb steht dieser Ablauf hier in der Doku
und nicht als Anzeige im Verwaltungsbereich: Dort gibt es keinen
Check-in-Bereich, an den er gehören würde. Käme je eine digitale
Ablage hinzu, wären Aufbewahrung, Zugriff und Löschfrist **vorher** zu
klären — Gesundheitsangaben sind besondere Daten nach Art. 9 DSGVO.

---

## Mehrwertsteuer: geklärt — Kleinunternehmer nach § 19 UStG 🟩

**Entscheidung des Betreibers (September 2026):** VERA wird als
Kleinunternehmen nach **§ 19 UStG** geführt. Es wird **keine
Umsatzsteuer** berechnet und folglich auch keine ausgewiesen.

Das ist keine Formulierungsfrage, sondern eine Pflicht: Wer als
Kleinunternehmer Umsatzsteuer ausweist, **schuldet sie dem Finanzamt**
(§ 14c Abs. 2 UStG) — auch wenn er sie nie eingenommen hat. Die
frühere Angabe „inkl. MwSt." war deshalb nicht nur ungenau, sondern
ein echtes Risiko.

### Was geändert wurde

| Datei | Wo | Wer sieht es | Neu |
|---|---|---|---|
| `content/de.ts` → `preise.einleitung` | Preis-Einleitung auf der Eventseite | alle Besucher | „Es sind Endpreise; gemäß § 19 UStG wird keine Umsatzsteuer berechnet." |
| `content/de.ts` → `anmeldung.preisHinweis` | Preisrechner im Anmeldeformular | alle Anmelder | „Gesamtpreis" (Schlüssel umbenannt von `inklMwst`) |
| `lib/zahlungRegeln.ts` | **Beschriftung auf der Bezahlseite von Stripe** | jeder zahlende Kunde | „Gesamtpreis, keine Umsatzsteuer (§ 19 UStG)" |
| `components/admin/EventFormular.tsx` | Überschrift im Verwaltungsbereich | nur der Betreiber | „Preise (Endpreise, keine USt.)" |

Zwei Entscheidungen dabei, die begründet gehören:

- **Der Wörterbuch-Schlüssel heisst jetzt `preisHinweis`, nicht mehr
  `inklMwst`.** Ein Schlüssel namens `inklMwst` mit dem Inhalt
  „Gesamtpreis" wäre eine Falle für den Nächsten, der die Datei liest.
- **Auf der Bezahlseite steht „keine Umsatzsteuer", nicht „ohne
  Umsatzsteuer".** „Ohne" liest sich wie ein Nettopreis, auf den noch
  etwas draufkommt. Genau das soll dort niemand denken.

### Wenn sich das je ändert

Überschreitet der Umsatz die Grenzen des § 19 UStG, greift die
Regelbesteuerung — dann müssen diese vier Stellen **wieder** angepasst
werden, und zwar bevor der nächste Kunde bezahlt. Prüfliste `N`
schlägt heute Alarm, sobald eine öffentliche Seite Umsatzsteuer
behauptet; sie ist dann mit anzupassen.

---

## Kurzfassung: was vor dem Livegang zwingend fehlt

1. ~~**Impressumsdaten**: ladungsfähige Anschrift und Telefonnummer~~
   🟩 **erledigt (15.09.2026)** — eingetragen, angezeigt und geprüft;
   ob die Anschrift ladungsfähig ist, bestätigt der Rechtstexte-Dienst
2. **Datenschutzerklärung** ausformulieren (Abschnitt 1); Stripe ist
   benannt, die Minderjährigen haben seit dem 16.09.2026 einen eigenen
   verbindlichen Abschnitt 🟥
3. **Widerrufsrecht klären** (§ 312g Abs. 2 Nr. 9 BGB) und die Seite
   entsprechend füllen 🟥
4. ~~**Mehrwertsteuer-Aussage** bestätigen oder ändern~~ 🟩 **erledigt**
   (Kleinunternehmer § 19 UStG, vier Stellen korrigiert)
5. Entscheiden, ob eigene **AGB** verwendet werden — falls ja,
   erstellen und prüfen lassen 🟨
6. ~~**Stornobedingungen** festlegen~~ 🟩 **erledigt**

Punkt 2, 3 und 5 gehören fachkundig geprüft. Punkt 1, 4 und 6 sind
erledigt.

---

## Wie die offenen Punkte beschafft werden — geändert im September 2026

Der frühere Plan sah **eine anwaltliche Beratung** vor, die die Punkte 2,
3 und 5 gemeinsam klärt. Der Betreiber hat entschieden, das in der
Gründungsphase **nicht** zu tun — die Kosten sind zu hoch. Stattdessen
soll ein professioneller **Rechtstexte-Service** genutzt werden.

Was das konkret heißt, welche Angaben ein solcher Dienst braucht und
worauf bei der Anbieterwahl zu achten ist, steht in
**`docs/rechtstexte-beschaffung.md`**.

`docs/sachverhalt-fuer-rechtsberatung.md` bleibt gültig und wird **nicht**
hinfällig: Der Sachverhalt ist derselbe, unabhängig davon, wer ihn
beurteilt. Die Datei ist jetzt die Vorlage für den Fragebogen des
Dienstes.

**An den Seiten selbst ändert das nichts.** Die Platzhalter bleiben
sichtbar markiert, bis echte Texte vorliegen.
