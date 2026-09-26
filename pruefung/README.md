# Die automatischen Prüfungen

Rund 1.330 Prüfungen, die gegen die **echte** Datenbank und den **echten**
Server laufen — nicht gegen nachgebaute Logik. Was hier grün ist, ist
wirklich geprüft.

Die Zahlen unten sind die des Sammellaufs vom 26.09.2026
(`bash pruefung/alle.sh`, 47 Listen, alle in Ordnung). `L` ist ohne Zahl,
weil die fliessende Messung der Responsivität Tausende von
Einzelmessungen erzeugt und getrennt gestartet wird.

Wie man sie startet, steht in **[../docs/pruefen.md](../docs/pruefen.md)**.

## Was wo geprüft wird

| Ordner | Inhalt | Anzahl |
|---|---|---|
| `E`, `H` | Anmeldung: Preise, Plätze, Überbuchung, Duplikate, manipulierte Werte, Honigtopf, Bremse; dass erst die bezahlte Zahlung eine Anmeldung entstehen lässt und ausbucht | 35 |
| `F`, `H` | Adminbereich: Zugang, Sitzungen, Aktionen ohne Sitzung, CSV, Anonymisieren, Event-Formular, Protokoll, zweiter Faktor (TOTP) | 110 |
| `G`, `H` | Designs, Inhaltsblöcke, Anmeldung je Event | 39 |
| `H` | Bild-Upload: Formate, Grössen, EXIF/GPS, getarnte Dateien, Pfad-Tricks | 20 |
| `I` | Gründerbereich, Kontraste, Wortmarke | 29 |
| `J` | Zahlung: Unterschrift, doppelte Meldungen, Betragsabgleich, Riegel; dass vor der Zahlung nichts gespeichert wird und in der `metadata` des Anbieters kein Klartext steht; die Fehlbuchungs-Warnung im Adminbereich | 76 |
| `K` | Anmeldung und Bezahlung als ein Ablauf — die 15 geforderten Fälle, samt beider Seiten der Platzregel: ein Abbruch hinterlässt nichts, und gegen bezahlte Plätze wird kein Platz zweimal verkauft (wer trotzdem zahlt, bekommt sein Geld zurück) | 61 |
| `L` | Responsivität: fliessende Messung 320–1920 px, Querformat, Pixelvergleich; dazu die Kopfleiste (Menü, Anmelde-Knopf) | 27 + Messung |
| `M` | Fehlgeschlagene und späte Zahlung | 42 |
| `N` | Rechtsseiten: erreichbar, als Platzhalter gekennzeichnet, verlinkt | 112 |
| `O` | Jeder Link und jeder Knopf auf jeder öffentlichen Seite | 10 |
| `P` | Stornierung: Regeln, Mails, Erstattung und Kulanz, Ablauf, Storno durch den Veranstalter, endgültiges Löschen | 126 |
| `Q` | Überwachung: Mail-Texte und Wächter-Logik | 26 |
| `R` | Der Riegel vor der echten Datenbank | 12 |
| `S` | Löschkonzept: Fristen je Klasse (inkl. K8, ereignisbezogen), jede Sperrsituation, Probelauf, Steuerriegel, Protokoll, Zugang, Papiererinnerung, Server-Skripte, Bedienung der Sperren, Vorschau in Klartext, Erfassungswege K3/K5 samt Terminverschiebung | 225 |
| `T` | Terminpflicht: ohne feststehenden Termin keine Buchung und keine Zahlung — die Regel, ihre Verdrahtung an allen sechs Stellen und der Umgehungsversuch über eine direkte Serveranfrage | 42 |
| `U` | Versionierte Rechtstexte: Prüfsumme, Versionsnummern, welche Fassung wann gilt, Unveränderbarkeit (auch projektweit geprüft), Fassung je Buchung, Volltext in der Bestätigungsmail; der erzeugte Wortlaut in `rechtstexte/` gegen `content/de.ts` (in beide Richtungen) und das Anlegeskript im echten Aufruf | 57 |
| `V` | Bestellknopf nach § 312j Abs. 3 BGB, AGB-Häkchen (§ 305 Abs. 2 BGB), Kenntnisnahme zu Aufnahmen und der abgesetzte Widerspruchshinweis (Art. 21 Abs. 4 DS-GVO) — jeweils auch serverseitig erzwungen | 40 |
| `W` | Widerspruch gegen Foto- und Videoaufnahmen (Art. 21 DS-GVO): Speicherung, Rücknahme ohne Löschung, die ereignisbezogene K8-Frist samt „Aufnahmen offline"-Markierung (Datum, Bearbeiter, Prüfvermerk), der Prüfvermerk vor jeder Veröffentlichung, die Sperre bei einem Widerspruch nach der letzten Prüfung, die Empfängerangabe der Veranstaltungsstätte (Art. 13 Abs. 1 Buchst. e DS-GVO), dass VERA ehrlich sagt, noch keinen Instagram-Kanal zu haben (B-12) — und die Veröffentlichungen selbst (B-14): Ort, Verantwortlicher, Zweck, die Löschsperre über offene Veröffentlichungen vor der K8-Offline-Markierung, Entfernen und Wiederherstellen | 144 |
| `X` | Anmeldung erst nach bezahlter Zahlung: die verschlüsselte Nutzlast (jedes Byte einzeln verbogen, fremde Veranstaltung, fremder Betrag, Schlüsselwechsel, Alter, Größe gegen die gemessene Stripe-Grenze), die flüchtige Bremse ohne Datenbankzeile, die eine Anlagefunktion samt der Fehlbuchungsfälle — und `x-keine-spur`, das nach einem Abbruch **jede** Tabelle der Datenbank vorher/nachher zählt | 103 |

## Zu den Schlüsseln in diesen Dateien

In `J/j-zahlung.mjs`, `K/k-ablauf.mjs`, `zahlweg.mjs` und `alle.sh` stehen Zeichenketten
wie `sk_test_pruefung_ohne_echtes_konto`, `whsec_pruefgeheimnis_nur_lokal`
und `sk_live_echtes_konto`.

**Das sind keine echten Schlüssel.** Sie sind frei erfunden und tun
genau zwei Dinge:

- Die beiden ersten sind die Werte, auf die die **örtliche Attrappe**
  des Zahlungsanbieters (`J/stripe-attrappe.mjs`) hört. Sie erreichen
  niemals einen echten Dienst.
- `sk_live_echtes_konto` prüft, dass der Riegel in `lib/zahlung.ts`
  einen Schlüssel für den Echtbetrieb **abweist**. Der Test ist genau
  dann bestanden, wenn nichts passiert.

Echte Schlüssel stehen in `.env` (von Git ausgeschlossen) beziehungsweise
in den Umgebungsvariablen beim Hoster — niemals hier.

## Der gemeinsame Bezahlweg: `zahlweg.mjs`

Seit dem 26.09.2026 entsteht eine Anmeldung erst mit der bestätigten
Zahlung. Wer in einer Liste eine Anmeldung braucht, muss deshalb den
ganzen Weg gehen:

    absenden → Sitzungskennung → bezahlen → Rückmeldung

`pruefung/zahlweg.mjs` bündelt das (`sitzungAusZiel`, `bezahlen`,
`holeSitzung`, `rueckmeldung`, `nutzlastFuer`, `bezahlteSitzung`).
Acht Listen benutzen es. Jede für sich nachzubauen hiesse, sie bei der
nächsten Änderung acht Mal nachzuziehen — und genau dabei laufen
Prüfungen auseinander.

Zwei Dinge daran sind Absicht und sollten so bleiben:

- **Die Marke wird mit der ECHTEN Funktion aus `lib/zahlung.ts`
  zusammengesetzt**, nicht mit einer nachgebauten. Eine eigene Fassung
  läge bei jeder Änderung an der Aufteilung stillschweigend daneben,
  und die Prüfung bestünde dann aus dem falschen Grund.
- **Jedes Browserfenster und jeder Bremstest bekommt eine eigene
  Absenderadresse** aus `198.18.0.0/15`. Die Bremse zählt seit Stufe 2
  im Arbeitsspeicher des Servers und lässt sich von aussen nicht mehr
  zurücksetzen; eine feste Adresse trug ihre Zähler in den nächsten
  Lauf und liess den zweiten Sammellauf scheitern.

## Warum eine Attrappe statt des echten Anbieters

`api.stripe.com` ist aus der Entwicklungsumgebung netzseitig gesperrt,
und es gibt dort keine öffentliche Adresse, an die Stripe eine
Rückmeldung zustellen könnte. Geprüft wird deshalb alles, wofür dieses
Projekt verantwortlich ist. Der Klick durch Stripes echte Bezahlseite
mit einer Testkarte kommt hinzu, sobald die Seite online ist.

## Der Riegel vor der echten Datenbank

Die Listen **löschen** — Anmeldungen, Teilnehmer, Bremszähler,
Zahlungsereignisse. Das müssen sie, sonst gehen zwei Listen mit
demselben Datenstand einander in die Quere.

Dieses Repository liegt auch auf dem Produktionsserver. Ohne Schutz
hätte ein Lauf von dort aus alle echten Buchungen gelöscht, ohne
Rückfrage. `pruefung/schutz.mjs` verhindert das: Er lässt nur
`vera_dev` und `vera_test` durch, und nur, wenn die öffentliche
Adresse auf den eigenen Rechner zeigt. Beide Prüfungen müssen
zustimmen.

**Regel für neue Listen:** Wer `deleteMany` benutzt, bindet als erste
Zeile den Riegel ein:

```js
import "../schutz.mjs";   // aus einem Unterordner
import "./schutz.mjs";    // direkt in pruefung/
```

Dass das niemand vergisst, prüft `R/r-schutz.mjs` — die Liste zählt
alle löschenden Dateien und meldet jede ohne Riegel. Sie prüft
ausserdem den Riegel selbst, indem sie ihn mit verschiedenen
Umgebungen startet.
