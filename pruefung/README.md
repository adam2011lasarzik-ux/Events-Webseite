# Die automatischen Prüfungen

Rund 350 Prüfungen, die gegen die **echte** Datenbank und den **echten**
Server laufen — nicht gegen nachgebaute Logik. Was hier grün ist, ist
wirklich geprüft.

Wie man sie startet, steht in **[../docs/pruefen.md](../docs/pruefen.md)**.

## Was wo geprüft wird

| Ordner | Inhalt | Anzahl |
|---|---|---|
| `E`, `H` | Anmeldung: Preise, Plätze, Überbuchung, Duplikate, manipulierte Werte, Honigtopf, Bremse | 32 |
| `F`, `H` | Adminbereich: Zugang, Sitzungen, Aktionen ohne Sitzung, CSV, Anonymisieren, Event-Formular, zweiter Faktor (TOTP) | 86 |
| `G`, `H` | Designs, Inhaltsblöcke, Anmeldung je Event | 38 |
| `H` | Bild-Upload: Formate, Grössen, EXIF/GPS, getarnte Dateien, Pfad-Tricks | 20 |
| `I` | Gründerbereich, Kontraste, Wortmarke | 29 |
| `J` | Zahlung: Unterschrift, doppelte Meldungen, Betragsabgleich, Reservierung, Riegel | 59 |
| `K` | Anmeldung und Bezahlung als ein Ablauf — die 15 geforderten Fälle | 45 |
| `L` | Responsivität: fliessende Messung 320–1920 px, Querformat, Pixelvergleich | — |
| `M` | Fehlgeschlagene Zahlung | 15 |
| `N` | Rechtsseiten: erreichbar, als Platzhalter gekennzeichnet, verlinkt | 18 |
| `O` | Jeder Link und jeder Knopf auf jeder öffentlichen Seite | 9 |
| `R` | Der Riegel vor der echten Datenbank | 12 |
| `S` | Löschkonzept: Fristen je Klasse, jede Sperrsituation, Probelauf, Steuerriegel, Protokoll, Zugang, Papiererinnerung | 109 |

## Zu den Schlüsseln in diesen Dateien

In `J/j-zahlung.mjs`, `K/k-ablauf.mjs` und `alle.sh` stehen Zeichenketten
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
