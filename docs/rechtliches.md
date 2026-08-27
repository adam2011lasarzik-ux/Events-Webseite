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
| Stornobedingungen festlegen (ob, bis wann, Gebühr, Erstattung) | 🟦 🟨 |

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

## Ein offener Punkt zur Mehrwertsteuer

An **fünf** Stellen steht, die Preise seien „inkl. MwSt.":

| Datei | Wo |
|---|---|
| `content/de.ts:81` | Hinweis unter den Preiskacheln |
| `content/de.ts:217` | Kurzform an der Preisanzeige |
| `content/de.ts` (AGB-Platzhalter) | Aufzählung dessen, was in AGB gehört |
| `lib/zahlungRegeln.ts:85` | **Beschriftung auf der Bezahlseite von Stripe** |
| `components/admin/EventFormular.tsx:278` | Überschrift im Verwaltungsbereich |

Ob das zutrifft, hängt an der Gewerbeanmeldung: Als Kleinunternehmer
nach § 19 UStG dürfte gar keine Mehrwertsteuer ausgewiesen werden.

**Ich habe die Aussage nicht geändert** — in die eine wie in die andere
Richtung wäre es geraten. Sie gehört geklärt, bevor echte Kunden
bezahlen; die vierte Zeile sieht jeder zahlende Kunde. 🟨 🟥

---

## Kurzfassung: was vor dem Livegang zwingend fehlt

1. **Impressumsdaten** eintragen 🟥
2. **Datenschutzerklärung** ausformulieren, Stripe und Minderjährige
   berücksichtigen 🟥
3. **Widerrufsrecht klären** (§ 312g Abs. 2 Nr. 9 BGB) und die Seite
   entsprechend füllen 🟥
4. **Mehrwertsteuer-Aussage** bestätigen oder ändern 🟥
5. Entscheiden, ob eigene **AGB** verwendet werden — falls ja,
   erstellen und prüfen lassen 🟨
6. **Stornobedingungen** festlegen 🟦

Punkt 1, 4 und 6 kannst du selbst liefern. Punkt 2, 3 und 5 gehören
fachkundig geprüft.
