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
| Als Platzhalter sichtbar gekennzeichnet | 🟩 |
| Name, Anschrift, Kontakt, ggf. Rechtsform und Registereintrag | 🟦 🟥 |

Ohne Impressum darf die Seite nicht öffentlich gehen. Die Angaben
kommen nach der Gewerbeanmeldung von dir.

## Datenschutzerklärung · `/datenschutz`

| Punkt | Stand |
|---|---|
| Seite vorhanden, erreichbar, verlinkt | 🟩 |
| **Cookie-Aussage korrigiert** — siehe unten | 🟩 |
| **Stripe vollständig benannt** — Betrag, Anmeldenummer, E-Mail, Titel der Veranstaltung, Personenzahl | 🟩 |
| Ausformulierte Erklärung: Rechtsgrundlagen, Speicherdauern, Betroffenenrechte | 🟨 🟥 |
| Auftragsverarbeitung mit Stripe einordnen | 🟨 |
| Besonderheiten bei Minderjährigen | 🟨 |

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

1. **Impressumsdaten** eintragen 🟥
2. **Datenschutzerklärung** ausformulieren, Stripe und Minderjährige
   berücksichtigen 🟥
3. **Widerrufsrecht klären** (§ 312g Abs. 2 Nr. 9 BGB) und die Seite
   entsprechend füllen 🟥
4. ~~**Mehrwertsteuer-Aussage** bestätigen oder ändern~~ 🟩 **erledigt**
   (Kleinunternehmer § 19 UStG, vier Stellen korrigiert)
5. Entscheiden, ob eigene **AGB** verwendet werden — falls ja,
   erstellen und prüfen lassen 🟨
6. ~~**Stornobedingungen** festlegen~~ 🟩 **erledigt**

Punkt 1 kannst du selbst liefern. Punkt 2, 3 und 5 gehören
fachkundig geprüft. Punkt 4 und 6 sind erledigt.
