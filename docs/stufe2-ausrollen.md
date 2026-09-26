# Stufe 2 ausrollen

**Stand: 26.09.2026 — noch NICHT ausgerollt.** Alles hier ist Vorschlag
und wartet auf die ausdrückliche Freigabe.

Was Stufe 2 ändert, in einem Satz: Zwischen dem Absenden des
Anmeldeformulars und der serverseitig bestätigten Zahlung steht in der
VERA-Datenbank **nichts** — keine Anmeldung, kein Teilnehmer, keine
Platzsperre, kein Zahlungsversuch, keine personenbezogenen Daten.

Der Code dafür ist gebaut und geprüft: 47 Prüflisten, rund 1.360
Prüfungen, alle in Ordnung.

---

## 0. Die beiden offenen Punkte sind entschieden und eingebaut

Der erste Entwurf dieses Plans liess zwei Fragen offen. Beide sind
beantwortet und umgesetzt; sie stehen hier, weil sie erklären, warum
der Ablauf unten anders aussieht als im ersten Entwurf.

### 0.1 `ohne-marke` wird vollständig erstattet

Es gibt fünf Gründe, aus denen Geld eingeht, ohne dass eine Anmeldung
entsteht. Vier davon buchen das Geld von selbst vollständig zurück:

| Grund | Was passiert |
|---|---|
| `keine-plaetze` | automatisch vollständig erstattet |
| `doppelte-adresse` | automatisch vollständig erstattet |
| `kein-termin` | automatisch vollständig erstattet |
| `ohne-marke` | automatisch vollständig erstattet |
| `betrag-abweichend` | **nicht** erstattet, Warnung im Adminbereich |

`ohne-marke` greift, wenn eine bezahlte Bezahlseite **ohne**
verschlüsselte Anmeldedaten zurückkommt — eine Seite aus der Zeit vor
dem Umbau, die beim Ausrollen noch offen war.

Warum dieser Fall erstattet und `betrag-abweichend` nicht: Hier ist
nichts unklar. Ohne Anmeldedaten kann daraus **niemals** eine
Anmeldung werden; jemand hat für nichts bezahlt, und das Geld gehört
ihm. Bei einem abweichenden Betrag ist dagegen offen, *was* gekauft
wurde — und solange das offen ist, wird nichts zurückgebucht.

**Wie die Erstattung nachvollziehbar bleibt**, an drei Stellen:

1. **Die Zeile in `Fehlbuchung`** trägt Bezahlseite, Betrag, Grund,
   Zeitpunkt des Eingangs, Zeitpunkt der Erstattung und deren Kennung
   beim Anbieter (`re_…`). Damit lässt sich jeder zurückgebuchte
   Betrag Jahre später einem Vorgang zuordnen, in beide Richtungen.
2. **Im Adminbereich** steht sie in der neuen Rückschau „Zahlungen
   ohne Anmeldung — letzte 30 Tage", mit Betrag, Grund, beiden
   Zeitpunkten und der Erstattungskennung. Ohne diese Liste wäre eine
   automatische Rückbuchung nur im Journal des Servers nachzulesen —
   also praktisch gar nicht.
3. **Im Journal des Dienstes** eine Zeile, die den Vorgang zeitlich
   zwischen den übrigen Meldungen einordnet.

Der Mensch, der bezahlt hat, bekommt eine Mail, die den Grund richtig
nennt („Deine Anmeldedaten sind bei uns technisch nicht angekommen —
das liegt an uns, nicht an dir"). Ist keine Adresse bekannt, wird
trotzdem erstattet und das im Journal vermerkt: Eine Erstattung ohne
Mail ist besser als eine Mail ohne Erstattung.

### 0.2 „Als erledigt markieren"

`betrag-abweichend` wird absichtlich nie automatisch erstattet — die
Warnung dazu hatte damit keinen Weg, jemals wieder zu verschwinden.
Eine Warnung, die immer dasteht, wird nach zwei Wochen nicht mehr
gelesen.

Neu in der Warnung: ein Feld für einen freiwilligen Vermerk und ein
Knopf **„Als erledigt markieren"**.

**Er löscht nichts.** Die Zeile bleibt mit Betrag, Grund, Zeitpunkt
und Sitzungskennung vollständig stehen und rutscht in die Rückschau
darunter. Festgehalten wird zusätzlich, **wer** abgehakt hat, **wann**
und **warum** — und derselbe Vorgang steht im Protokoll der
Admin-Aktionen.

**Er erstattet auch nichts.** Wer Geld zurückgeben will, tut das im
Dashboard des Anbieters. Ein Knopf, der beides zugleich täte, würde
die Frage „ist das Geld zurück?" mit „jemand hat draufgedrückt"
beantworten.

Zweimal abhaken überschreibt den ersten Vermerk nicht: Wer entschieden
hat und wann, ist der eigentliche Wert dieses Feldes.

### 0.3 Was dafür an der Datenbank geändert wird

Eine zweite Migration, `20260926150000_fehlbuchung_erledigt`. Sie
**fügt nur hinzu** und entfernt nichts:

```sql
ALTER TABLE `Fehlbuchung`
  ADD COLUMN `erledigtAm` DATETIME(3) NULL,
  ADD COLUMN `erledigtVon` VARCHAR(191) NULL,
  ADD COLUMN `erledigtNotiz` TEXT NULL;
CREATE INDEX `Fehlbuchung_erledigtAm_idx` ON `Fehlbuchung`(`erledigtAm`);
```

Beide Migrationen laufen in einem Aufruf (`npm run db:deploy`), in
dieser Reihenfolge.

## 1. Der vollständige Ablauf, in der richtigen Reihenfolge

Die Reihenfolge ist nicht beliebig. Drei Dinge hängen aneinander:

- **„Test 2.1" vor der Migration.** Die Migration setzt jede Zeile im
  Zustand `RESERVIERT` auf `STORNIERT`. Danach ist die Testanmeldung
  nicht mehr als unbezahlter Versuch zu erkennen, sondern sieht aus wie
  eine gewöhnliche Stornierung. Sie muss also **vorher** weg.
- **Keine offene Bezahlseite beim Umschalten.** Eine Bezahlseite, die
  vor dem Umbau geöffnet wurde und danach bezahlt wird, bringt keine
  verschlüsselten Anmeldedaten mit → Fehlbuchung `ohne-marke`. Das Geld
  geht automatisch zurück, aber der Mensch hat umsonst bezahlt und muss
  sich neu anmelden. Vermeidbar, indem man nachsieht.
- **Der Dienst steht während der Migration.** Der alte Code schreibt
  `reserviertBis` und `RESERVIERT`; beide gibt es nach der Migration
  nicht mehr. Liefe er weiter, scheiterte jede Anmeldung mit einem
  Datenbankfehler. Deshalb: bauen → anhalten → migrieren → starten.
  Die Stillstandszeit beträgt wenige Sekunden.

| # | Schritt | Ändert etwas? |
|---|---|---|
| 1 | Zeitpunkt wählen: abends oder früh, wenn niemand bucht | nein |
| 2 | Sicherung ziehen und prüfen, dass sie angekommen ist | schreibt eine Sicherungsdatei |
| 3 | „Test 2.1" ansehen — rein lesend | nein |
| 4 | „Test 2.1" entfernen — nach ausdrücklicher Freigabe | **ja, Live-Daten** |
| 5 | Offene Bezahlseiten beim Anbieter nachsehen | nein |
| 6 | Doppelte `zahlungsReferenz` nachsehen (die Migration legt darauf einen eindeutigen Index) | nein |
| 7 | Neuen Stand holen und bauen | **ja, Server** |
| 8 | Dienst anhalten | **ja, Server** |
| 9 | Beide Migrationen ausführen (ein Aufruf) | **ja, Live-Daten** |
| 10 | Dienst starten | **ja, Server** |
| 11 | Erste Sichtprüfung: Seite da, Adminbereich da | nein |
| 12 | Nginx-Bremse einbauen und neu laden | **ja, Server** |
| 13 | Abgleichlauf einrichten (systemd-Timer) | **ja, Server** |
| 14 | Stripe-Dashboard: Ereignisarten prüfen | evtl. beim Anbieter |
| 15 | Abschlussprüfung mit einer echten Testzahlung | legt eine echte Buchung an, die danach entfernt wird |

Die Befehle zu allen Schritten stehen in **Abschnitt 4**.

---

## 2. Der Rückkehrplan

Der Grundsatz: **Es gibt zu jedem Zeitpunkt einen Weg zurück, und er
dauert weniger als zehn Minuten.**

### 2.1 Bis Schritt 8 (Dienst läuft noch, Migration ist nicht gelaufen)

Nichts zu tun. Die Datenbank ist unberührt, der alte Dienst läuft
weiter. Einzige Ausnahme: Wurde „Test 2.1" in Schritt 4 schon gelöscht,
bleibt sie gelöscht — sie kommt aus der Sicherung zurück, wenn nötig.

### 2.2 Nach Schritt 9 (Migration ist gelaufen)

Die **erste** Migration ist nicht von selbst umkehrbar: Sie hat die
Spalte `reserviertBis` entfernt, und die Werte darin sind fort.

Aber sie musste auch nichts Unersetzliches löschen. Was sie getan hat:

- Zeilen im Zustand `RESERVIERT` auf `STORNIERT` gesetzt — die Zeilen
  selbst stehen alle noch da, mit allen Daten.
- Den Aufzählungstyp verengt und `reserviertBis` entfernt.

Die **zweite** Migration fügt nur drei Spalten an `Fehlbuchung` an.
Sie ist harmlos: Der alte Code kennt diese Spalten nicht und lässt sie
einfach stehen. Sie muss für eine Rückkehr gar nicht angefasst werden.

**Der schnelle Weg zurück** (Code zurück, Schema vorwärts lassen):

Der neue Code braucht `reserviertBis` nicht. Der alte braucht es. Also:

```
Sicherung einspielen (Abschnitt 4.11) → alter Commit auschecken →
bauen → Dienst starten
```

Das stellt beides wieder her: Schema und Daten, auf dem Stand der
Sicherung aus Schritt 2. Alles, was zwischen Sicherung und Rückkehr
gebucht wurde, ginge dabei verloren — deshalb Schritt 1 (Zeitpunkt,
an dem niemand bucht) und deshalb die Sicherung **unmittelbar** vor
dem Umbau.

**Der Zeitraum, in dem das wirklich zählt**, ist kurz: von Schritt 9
bis Schritt 11 vergehen unter fünf Minuten.

### 2.3 Wenn erst nach Stunden etwas auffällt

Dann ist eine Rückkehr über die Sicherung keine Option mehr — es
hingen echte Buchungen daran. Stattdessen:

1. Ist eine Zahlung betroffen? → Adminbereich, Warnblock ganz oben.
   Jede eingegangene Zahlung ohne Anmeldung steht dort mit Betrag,
   Grund und Sitzungskennung.
2. Reicht ein Rücksprung des **Codes** ohne Schema? Der alte Code
   braucht `reserviertBis` — also nein, nicht ohne weiteres. Die
   Spalte liesse sich aber in einer Zeile wieder anlegen:
   `ALTER TABLE Registration ADD COLUMN reserviertBis DATETIME(3) NULL;`
   und der Aufzählungstyp wieder erweitern. Beides steht in
   Abschnitt 4.12. Das ist der Notausgang, nicht der Normalweg.
3. Im Zweifel: Dienst anhalten, Anmeldeformular vom Netz (Nginx zeigt
   die Wartungsseite, `server/vera-sperre.conf`), dann in Ruhe ansehen.

### 2.4 Woran man merkt, dass es schiefgegangen ist

- Der Adminbereich zeigt oben Fehlbuchungen, die nicht von der
  Abschlussprüfung stammen.
- `journalctl -u vera -n 100` zeigt „Bezahlte Sitzung ohne
  verschlüsselte Anmeldung" oder „liess sich nicht aufschliessen".
- Eine Anmeldung führt nicht zur Bezahlseite, sondern zu einer
  Fehlermeldung.
- `npm run zahlung:pruefen` meldet eine Zahlung ohne Buchung.

---

## 3. Die Änderungen an AGB und Datenschutz — endgültiger Wortlaut

Fünf Stellen beschreiben heute einen Ablauf, den es nach dem Umbau
nicht mehr gibt. Sie stehen alle in `content/de.ts`.

Unten steht jeweils der **heutige** Wortlaut und darunter die
**endgültige neue Fassung**, wörtlich und vollständig — so, wie sie
nach deiner Freigabe eingesetzt wird. Es ist nichts gekürzt und nichts
angedeutet.

> **Kein Rechtsrat.** Ich bin kein Anwalt. Die Formulierungen unten
> beschreiben, was der Code tatsächlich tut — sie sind ein Entwurf zur
> anwaltlichen Prüfung, keine geprüfte Fassung. Bei 3.4 und der
> Datenschutzangabe zu Stripe halte ich eine Prüfung für nötig, nicht
> nur für ratsam.

### 3.1 AGB Ziffer 3.5 — die Reservierung

**Heute:**

> 3.5 Der Platz wird ab dem Absenden für 30 Minuten reserviert, damit
> die Zahlung abgeschlossen werden kann. Wird in dieser Zeit nicht
> bezahlt, verfällt die Reservierung und der Platz steht wieder zur
> Verfügung. Die Anmeldung bleibt gespeichert und kann über den Link
> auf der Abschluss-Seite fortgesetzt werden, solange Plätze frei sind.

Nach dem Umbau ist **jeder** Satz darin falsch: Es wird kein Platz
reserviert, nichts verfällt, nichts bleibt gespeichert, und es gibt
keinen Link zum Fortsetzen.

**Vorschlag:**

> 3.5 Mit dem Absenden wird kein Platz reserviert. Die Anmeldung wird
> erst gespeichert, wenn die Zahlung eingegangen ist; bis dahin werden
> Ihre Angaben ausschließlich verschlüsselt an den Zahlungsvorgang
> übergeben und nicht bei VERA gespeichert. Wird der Bezahlvorgang
> abgebrochen oder nicht innerhalb von 30 Minuten abgeschlossen,
> entsteht keine Anmeldung und es wird nichts abgebucht; für eine
> Teilnahme ist das Anmeldeformular dann erneut auszufüllen.
>
> Zwischen dem Absenden und dem Eingang der Zahlung können die letzten
> freien Plätze anderweitig vergeben werden. Kommt aus diesem oder
> einem anderen Grund kein Vertrag zustande, obwohl eine Zahlung
> eingegangen ist, wird der gezahlte Betrag unverzüglich und
> vollständig auf demselben Weg erstattet, über den gezahlt wurde. Sie
> müssen dafür nichts veranlassen; VERA teilt Ihnen die Erstattung per
> E-Mail mit.

Der zweite Absatz ist neu und beschreibt einen Fall, den es vorher
nicht gab. Er ist der ehrliche Preis dafür, dass kein Platz mehr
gehalten wird — und er gehört genannt, bevor er eintritt.

Er ist bewusst **nicht** auf die Plätze beschränkt („aus diesem oder
einem anderen Grund"). Es gibt vier Lagen, in denen Geld eingeht, ohne
dass ein Vertrag zustande kommt; alle vier werden vollständig
erstattet, und alle vier sollen von diesem Satz gedeckt sein. Eine
Aufzählung im Vertragstext wäre bei der nächsten Änderung am Programm
unvollständig — und eine unvollständige Aufzählung ist schlechter als
keine.

### 3.2 AGB Ziffer 3.8 — verweist auf die Reservierung

**Heute:**

> 3.8 Eine Anmeldung ist erst mit vollständiger Zahlung verbindlich
> angenommen. Solange nicht bezahlt ist, besteht kein Anspruch auf
> einen Platz — auch nicht während der Reservierungszeit nach Ziffer
> 3.5, wenn diese abgelaufen ist.

**Vorschlag:**

> 3.8 Eine Anmeldung ist erst mit vollständiger Zahlung verbindlich
> angenommen. Solange nicht bezahlt ist, besteht kein Anspruch auf
> einen Platz.

### 3.3 AGB Ziffer 3.4 — die Eingangsbestätigung

**Heute:**

> 3.4 Der Eingang der Anmeldung wird unverzüglich elektronisch
> bestätigt. Diese Eingangsbestätigung ist noch keine Annahme des
> Angebots.

Nach dem Umbau gibt es vor der Zahlung keine Eingangsbestätigung mehr —
es gibt ja nichts, dessen Eingang zu bestätigen wäre. Die erste und
einzige Mail kommt nach der Zahlung, und sie ist zugleich die Annahme.

**Vorschlag:**

> 3.4 Nach Eingang der Zahlung wird die Anmeldung unverzüglich
> elektronisch bestätigt. Diese Bestätigung ist zugleich die Annahme
> des Angebots.

**Prüfauftrag an die anwaltliche Prüfung:** § 312i Abs. 1 Satz 1 Nr. 3
BGB verlangt, den Zugang einer Bestellung unverzüglich elektronisch zu
bestätigen. Meine Einschätzung: Die Pflicht ist gewahrt, weil jede
Bestellung, die VERA überhaupt erreicht, auch bestätigt wird — eine
abgebrochene Zahlung erreicht VERA nicht. Sicher bin ich mir nicht.
Das ist die Stelle, die ich am ehesten geprüft haben möchte.

### 3.4 Datenschutz — was an Stripe übermittelt wird

Das ist die wichtigste Änderung. **Heute:**

> Beim Bezahlen werden an Stripe übermittelt: der Betrag, die
> Anmeldenummer, die E-Mail-Adresse sowie der Titel der Veranstaltung
> und die Anzahl der Personen.

Nach dem Umbau stimmt das nicht mehr. Es gibt keine Anmeldenummer, und
es gehen **mehr** Daten mit: die vollständigen Anmeldedaten, wenn auch
verschlüsselt. Diese Aufzählung stehen zu lassen wäre eine falsche
Angabe an genau der Stelle, an der Genauigkeit zählt.

**Vorschlag:**

> Beim Bezahlen werden an Stripe übermittelt: der Betrag, die
> E-Mail-Adresse, der Titel der Veranstaltung und die Anzahl der
> Personen sowie ein verschlüsselter Datensatz mit den Angaben aus dem
> Anmeldeformular (Namen der anmeldenden Person und der Teilnehmenden,
> E-Mail-Adresse, gegebenenfalls Telefonnummer).
>
> Dieser Datensatz ist notwendig, weil VERA Ihre Angaben vor dem
> Zahlungseingang bewusst nicht speichert: Sie reisen verschlüsselt mit
> dem Bezahlvorgang mit und werden erst bei VERA gespeichert, wenn die
> Zahlung eingegangen ist. Er ist mit einem Schlüssel verschlüsselt,
> der ausschließlich VERA vorliegt; Stripe kann ihn nicht lesen.
> Spätestens 24 Stunden nach seiner Erzeugung ist er auch für VERA
> nicht mehr verwendbar. Wird der Bezahlvorgang abgebrochen, entsteht
> bei VERA kein Datensatz.
>
> Bezahlt wird ausschließlich auf der gesicherten Seite von Stripe.
> Kartennummern und Bankdaten erreichen diese Seite zu keinem
> Zeitpunkt — sie werden hier weder entgegengenommen noch gespeichert.
> Rechtsgrundlage ist Art. 6 Abs. 1 Buchst. b DSGVO.

**Prüfauftrag:** Ob die Verschlüsselung an der Einordnung etwas ändert
(Stripe hält Daten, die Stripe nicht lesen kann), ist eine Frage für
die anwaltliche Prüfung. Ich habe sie bewusst so formuliert, dass die
Übermittlung **genannt** wird, statt sich auf die Verschlüsselung zu
berufen.

### 3.5 Datenschutz — Speicherdauer

Zwei neue Absätze in Abschnitt 4 („Speicherdauer und Löschung"). Der
erste gehört an den Anfang, direkt unter die Einleitung:

> Angaben aus einem abgebrochenen oder nicht abgeschlossenen
> Bezahlvorgang werden gar nicht erst gespeichert. Es entsteht kein
> Datensatz, der gelöscht werden müsste.

Der zweite gehört in die Aufzählung der Fristen:

> Geht eine Zahlung ein, ohne dass daraus eine Anmeldung wird, hält
> VERA den Vorgang zur Buchführung und zum Nachweis der Erstattung
> fest: die Kennung des Bezahlvorgangs beim Zahlungsdienstleister, den
> Betrag, den Grund und die Zeitpunkte. Namen, E-Mail-Adressen und
> Telefonnummern werden dabei nicht gespeichert. Diese Angaben
> unterliegen den gesetzlichen Aufbewahrungsfristen nach § 147 der
> Abgabenordnung.

Das beschreibt die Tabelle `Fehlbuchung`. Sie ist der Grund, warum
sich jede automatische Rückbuchung Jahre später noch einem Vorgang
zuordnen lässt — und sie enthält bewusst keine Personendaten.

### 3.6 Neue Fassung, nicht stille Änderung

Beide Texte sind versioniert (`npm run rechtstext`). Die Änderungen
erzeugen eine **neue Fassung** mit eigener Nummer und Prüfsumme. Alte
Buchungen behalten die Fassung, unter der sie zustande kamen — das ist
gebaut und geprüft (Liste `U`).

Reihenfolge: Texte ändern → `npm run rechtstext` → **dann** ausrollen.
Sonst käme die erste Buchung nach dem Umbau unter der alten Fassung
zustande, die den Ablauf falsch beschreibt.

---

## 4. Alle Befehle, die Live-Daten oder den Server verändern

Vollständig. Was hier nicht steht, ändert nichts.

Jeder Block ist einzeln gedacht: **einen ausführen, Ausgabe ansehen,
dann den nächsten.**

### 4.1 Sicherung ziehen *(schreibt eine Sicherungsdatei)*

```bash
sudo systemctl start vera-sicherung.service
```

Prüfen, dass sie angekommen ist — **ändert nichts:**

```bash
journalctl -u vera-sicherung.service -n 20 --no-pager
```

Es muss eine Zeile mit `OK` und dem heutigen Datum kommen. Kommt sie
nicht, hier abbrechen.

### 4.2 „Test 2.1" ansehen *(ändert nichts)*

Vorab einmal prüfen, dass `tsx` auf dem Server vorhanden ist — die
beiden Skripte brauchen es. **Ändert nichts:**

```bash
cd /var/www/vera && sudo -u vera npx tsx --version
```

Kommt eine Versionsnummer, ist alles da. Kommt eine Fehlermeldung,
fehlen die Entwicklungs-Pakete; dann zuerst
`sudo -u vera env PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci` — das
ändert den Server und ist derselbe Befehl wie in Schritt 4.6.

Dann das Prüfskript anlegen. Es ist eine **neue** Datei, ändert keine
vorhandene und wird am Ende wieder entfernt. Den ganzen Block in einem
Stück einfügen:

```bash
sudo -u vera tee /var/www/vera/test-2-1-pruefen.mts > /dev/null <<'SKRIPTENDE'
/* ---------------------------------------------------------------
   „Test 2.1" ansehen — REIN LESEND.

   Dieses Skript ändert nichts. Es legt nichts an, es löscht nichts,
   es schreibt keine Zeile. Es beantwortet genau eine Frage:

       Ist zu dieser Anmeldung jemals Geld eingegangen?

   ── Warum es ein eigenes Skript ist ─────────────────────────────

   Der dafür vorgesehene Weg heisst `npm run anmeldung:pruefen`. Den
   gibt es auf dem Server noch nicht: Er kommt mit Stufe 1/2, und die
   sind noch nicht ausgerollt. Die Anmeldung soll aber VOR der
   Migration angesehen und entfernt werden — sonst setzt die Migration
   sie stillschweigend auf STORNIERT, und die Testdaten blieben
   liegen.

   Deshalb dieses Skript: Es läuft mit dem Stand, der HEUTE auf dem
   Server liegt, und bringt alles mit, was es braucht.

   ── Aufruf ──────────────────────────────────────────────────────

       cd /var/www/vera
       sudo -u vera npx tsx --env-file=.env ./test-2-1-pruefen.mts "Test 2.1"

   Die Datei liegt bewusst IM Projektordner und nicht in /tmp: Von
   dort aus fände Node die Pakete `@prisma/adapter-mariadb` und
   `stripe` nicht. Sie ändert keine vorhandene Datei und wird nach
   dem Lauf wieder entfernt.

   Der Suchbegriff wird gegen Vor- und Nachnamen der anmeldenden
   Person UND der Teilnehmer geprüft. Ohne Argument werden alle
   unbezahlten Anmeldungen gezeigt.
   --------------------------------------------------------------- */

import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "./generated/prisma/client.ts";
import Stripe from "stripe";

const VERBINDUNG = process.env.DATABASE_URL;
if (!VERBINDUNG) {
  console.error("DATABASE_URL ist nicht gesetzt. Wurde --env-file=.env vergessen?");
  process.exit(1);
}

const db = new PrismaClient({ adapter: new PrismaMariaDb(VERBINDUNG) });

const suche = process.argv[2] ?? null;

/* `reserviertBis` gibt es nur VOR der Migration. Das Skript soll vor
   und nach ihr laufen können, ohne umgeschrieben zu werden — also
   wird nachgesehen, statt es vorauszusetzen. */
async function spalteDa(tabelle: string, spalte: string): Promise<boolean> {
  const treffer = await db.$queryRaw<{ n: bigint }[]>`
    SELECT COUNT(*) AS n FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ${tabelle} AND COLUMN_NAME = ${spalte}`;
  return Number(treffer[0]?.n ?? 0) > 0;
}

const euro = (cents: number | null | undefined) =>
  cents === null || cents === undefined ? "—" : `${(cents / 100).toFixed(2).replace(".", ",")} €`;

async function hauptlauf() {
  const hatReserviertBis = await spalteDa("Registration", "reserviertBis");

  const alle = await db.registration.findMany({
    include: { teilnehmer: true, event: { select: { titel: true, slug: true } } },
    orderBy: { angemeldetAm: "desc" },
  });

  const passt = (a: (typeof alle)[number]) => {
    if (!suche) return a.zahlungsStatus !== "BEZAHLT";
    const n = suche.toLowerCase();
    /* Auch der ZUSAMMENGESETZTE Name wird geprüft. Wer im
       Adminbereich „Test 2.1" liest, tippt genau das — in der
       Datenbank steht es aber als Vor- und Nachname getrennt
       („Test" / „2.1"), und ein Vergleich Feld für Feld fände
       nichts. Beim ersten Anlauf war genau das der Fall. */
    const felder = [
      a.kontaktVorname, a.kontaktNachname, a.kontaktEmail,
      `${a.kontaktVorname} ${a.kontaktNachname}`,
      ...a.teilnehmer.flatMap((t) => [t.vorname, t.nachname, `${t.vorname} ${t.nachname}`]),
    ];
    return felder.some((f) => (f ?? "").toLowerCase().includes(n));
  };

  const treffer = alle.filter(passt);

  console.log(`\nDatenbank insgesamt: ${alle.length} Anmeldungen.`);
  console.log(
    suche
      ? `Suche nach „${suche}": ${treffer.length} Treffer.\n`
      : `Nicht bezahlte Anmeldungen: ${treffer.length}.\n`,
  );

  if (treffer.length === 0) {
    console.log("Nichts gefunden. Es gibt nichts zu entfernen.");
    return;
  }

  /* Der Zugang zum Zahlungsanbieter ist freiwillig: Fehlt der
     Schlüssel, wird die Datenbankseite trotzdem vollständig gezeigt
     und für die Zahlungsseite auf das Dashboard verwiesen. Ein
     Abbruch wäre hier das Falsche — die halbe Antwort ist besser als
     keine. */
  const schluessel = process.env.ZAHLUNG_GEHEIMSCHLUESSEL;
  const stripe = schluessel ? new Stripe(schluessel) : null;
  if (!stripe) {
    console.log(
      "HINWEIS: ZAHLUNG_GEHEIMSCHLUESSEL steht nicht in .env. Die Zahlungsseite\n" +
        "         lässt sich von hier aus nicht prüfen — bitte die unten genannte\n" +
        "         Sitzungskennung im Stripe-Dashboard nachschlagen.\n",
    );
  }

  for (const a of treffer) {
    console.log("─".repeat(64));
    console.log(`Anmeldenummer   ${a.id}`);
    console.log(`Veranstaltung   ${a.event.titel}  (/${a.event.slug})`);
    console.log(`Angemeldet am   ${a.angemeldetAm.toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}`);
    console.log(`Kontakt         ${a.kontaktVorname} ${a.kontaktNachname} <${a.kontaktEmail}>`);
    console.log(`Teilnehmer      ${a.teilnehmer.map((t) => `${t.vorname} ${t.nachname}`).join(", ") || "—"}`);
    console.log(`Status          ${a.status} / Zahlung: ${a.zahlungsStatus} (${a.zahlungsWeg})`);
    console.log(`Preis           ${euro(a.gesamtpreisCents)}`);
    console.log(`Bezahlt         ${euro(a.bezahlterBetragCents)}  am ${a.bezahltAm?.toISOString() ?? "—"}`);
    console.log(`Bezahlseite     ${a.zahlungsReferenz ?? "—"}`);
    console.log(`Zahlung         ${a.zahlungsAbsicht ?? "—"}`);
    if (hatReserviertBis) {
      const roh = await db.$queryRaw<{ reserviertBis: Date | null }[]>`
        SELECT reserviertBis FROM Registration WHERE id = ${a.id}`;
      console.log(`Reserviert bis  ${roh[0]?.reserviertBis?.toISOString() ?? "—"}`);
    }

    /* Die eigentliche Frage. Die Datenbank allein beantwortet sie
       NICHT: Bliebe eine Rückmeldung aus, stünde dort „offen",
       obwohl das Geld längst da ist. Gefragt wird deshalb beim
       Anbieter. */
    let geldEingegangen: boolean | null = null;
    if (stripe && a.zahlungsReferenz) {
      try {
        const sitzung = await stripe.checkout.sessions.retrieve(a.zahlungsReferenz);
        geldEingegangen = sitzung.payment_status === "paid";
        console.log(
          `Beim Anbieter   Zustand ${sitzung.status}, Zahlung ${sitzung.payment_status}, ` +
            `Betrag ${euro(sitzung.amount_total)}`,
        );
      } catch (e) {
        console.log(`Beim Anbieter   NICHT ABRUFBAR (${(e as Error).message})`);
      }
    } else if (!a.zahlungsReferenz) {
      // Ohne Bezahlseite gab es nie einen Vorgang, über den Geld
      // hätte fliessen können.
      geldEingegangen = false;
      console.log("Beim Anbieter   keine Bezahlseite angelegt — es gab keinen Zahlungsvorgang");
    }

    console.log("");
    if (geldEingegangen === false && a.zahlungsStatus !== "BEZAHLT") {
      console.log("URTEIL          Es ist KEIN Geld eingegangen. Löschen ist unbedenklich.");
    } else if (geldEingegangen === true || a.zahlungsStatus === "BEZAHLT") {
      console.log("URTEIL          ACHTUNG: Hier ist Geld geflossen. NICHT löschen.");
      console.log("                Erst erstatten, dann über den Storno-Weg gehen.");
    } else {
      console.log("URTEIL          Unklar — die Zahlungsseite liess sich nicht prüfen.");
      console.log("                Bitte die Bezahlseite oben im Stripe-Dashboard nachschlagen.");
    }
  }
  console.log("─".repeat(64));
  console.log("\nEs wurde NICHTS verändert. Dieses Skript liest nur.\n");
}

hauptlauf()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => db.$disconnect());
SKRIPTENDE
```

Dann ansehen:

```bash
cd /var/www/vera && sudo -u vera npx tsx --env-file=.env ./test-2-1-pruefen.mts "Test 2.1"
```

Die Ausgabe endet mit einem Urteil:

- `Es ist KEIN Geld eingegangen. Löschen ist unbedenklich.` → weiter
- `ACHTUNG: Hier ist Geld geflossen. NICHT löschen.` → **stopp**, das
  ist keine Testanmeldung mehr
- `Unklar` → die genannte Bezahlseite im Stripe-Dashboard nachschlagen

Die Anmeldenummer aus der Ausgabe wird im nächsten Schritt gebraucht.

### 4.3 „Test 2.1" entfernen *(**ändert Live-Daten**)*

Erst das Löschskript anlegen:

```bash
sudo -u vera tee /var/www/vera/test-2-1-loeschen.mts > /dev/null <<'SKRIPTENDE'
/* ---------------------------------------------------------------
   Eine Testanmeldung ENDGÜLTIG entfernen — der getrennte Weg.

   Dieses Skript löscht wirklich. Es ist absichtlich vom Prüfweg
   getrennt (server/test-2-1-pruefen.mts) und verlangt drei Dinge,
   bevor es etwas tut:

     1. die genaue Anmeldenummer — kein Suchbegriff, keine Auswahl
     2. die Bestätigung, dass kein Geld eingegangen ist (es prüft das
        selbst noch einmal und bricht sonst ab)
     3. den ausdrücklichen Schalter --wirklich

   Ohne --wirklich zeigt es nur, WAS es löschen würde.

   ── Warum so umständlich ────────────────────────────────────────

   Weil ein Löschbefehl, der auch ohne Nachdenken funktioniert,
   irgendwann ohne Nachdenken benutzt wird. Und weil eine gelöschte
   Buchung, zu der Geld eingegangen ist, ein Vorgang ohne Beleg wäre:
   Das Geld ist da, und niemand weiss mehr, wofür.

   ── Aufruf ──────────────────────────────────────────────────────

       cd /var/www/vera

       # Erst die Vorschau — löscht nichts:
       sudo -u vera npx tsx --env-file=.env ./test-2-1-loeschen.mts <nummer>

       # Dann, wenn die Vorschau stimmt:
       sudo -u vera npx tsx --env-file=.env ./test-2-1-loeschen.mts <nummer> --wirklich

   Vorher eine Sicherung ziehen. Der Befehl dafür steht im
   Ausrollplan (docs/stufe2-ausrollen.md, Schritt 2).
   --------------------------------------------------------------- */

import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "./generated/prisma/client.ts";
import Stripe from "stripe";

const VERBINDUNG = process.env.DATABASE_URL;
if (!VERBINDUNG) {
  console.error("DATABASE_URL ist nicht gesetzt. Wurde --env-file=.env vergessen?");
  process.exit(1);
}

const db = new PrismaClient({ adapter: new PrismaMariaDb(VERBINDUNG) });

const nummer = process.argv[2];
const wirklich = process.argv.includes("--wirklich");

if (!nummer || nummer.startsWith("--")) {
  console.error(
    "Aufruf: npx tsx --env-file=.env ./test-2-1-loeschen.mts <anmeldenummer> [--wirklich]\n" +
      "Die Anmeldenummer liefert ./test-2-1-pruefen.mts.",
  );
  process.exit(1);
}

const euro = (cents: number | null | undefined) =>
  cents === null || cents === undefined ? "—" : `${(cents / 100).toFixed(2).replace(".", ",")} €`;

async function hauptlauf() {
  const a = await db.registration.findUnique({
    where: { id: nummer },
    include: { teilnehmer: true, event: { select: { titel: true } }, aufnahmewidersprueche: true },
  });

  if (!a) {
    console.error(`Keine Anmeldung mit der Nummer ${nummer}. Nichts getan.`);
    process.exitCode = 1;
    return;
  }

  console.log("\nDas würde entfernt:");
  console.log("─".repeat(64));
  console.log(`Anmeldenummer   ${a.id}`);
  console.log(`Veranstaltung   ${a.event.titel}`);
  console.log(`Kontakt         ${a.kontaktVorname} ${a.kontaktNachname} <${a.kontaktEmail}>`);
  console.log(`Teilnehmer      ${a.teilnehmer.length}: ${a.teilnehmer.map((t) => `${t.vorname} ${t.nachname}`).join(", ")}`);
  console.log(`Status          ${a.status} / Zahlung: ${a.zahlungsStatus}`);
  console.log(`Preis           ${euro(a.gesamtpreisCents)}`);
  console.log(`Bezahlt         ${euro(a.bezahlterBetragCents)}`);
  console.log(`Aufnahme-Widersprüche  ${a.aufnahmewidersprueche.length}`);
  console.log("─".repeat(64));

  /* ── Der Riegel ──────────────────────────────────────────────
     Wird hier ein zweites Mal geprüft, obwohl der Prüfweg es schon
     getan hat. Zwischen beiden Läufen kann Zeit vergangen sein, und
     eine verspätete Zahlung ändert die Antwort. */
  if (a.zahlungsStatus === "BEZAHLT" || a.zahlungsStatus === "TEILWEISE_ERSTATTET") {
    console.error(
      `\nABBRUCH: Diese Buchung steht auf „${a.zahlungsStatus}". Es ist Geld eingegangen.\n` +
        "Eine bezahlte Buchung wird nicht gelöscht, sondern storniert und erstattet.",
    );
    process.exitCode = 1;
    return;
  }

  const schluessel = process.env.ZAHLUNG_GEHEIMSCHLUESSEL;
  if (a.zahlungsReferenz) {
    if (!schluessel) {
      console.error(
        "\nABBRUCH: Zu dieser Buchung gehört eine Bezahlseite " +
          `(${a.zahlungsReferenz}), aber ohne ZAHLUNG_GEHEIMSCHLUESSEL lässt sich nicht\n` +
          "prüfen, ob Geld eingegangen ist. Bitte erst im Stripe-Dashboard nachsehen.",
      );
      process.exitCode = 1;
      return;
    }
    try {
      const sitzung = await new Stripe(schluessel).checkout.sessions.retrieve(a.zahlungsReferenz);
      console.log(
        `Beim Anbieter   Zustand ${sitzung.status}, Zahlung ${sitzung.payment_status}, ` +
          `Betrag ${euro(sitzung.amount_total)}`,
      );
      if (sitzung.payment_status === "paid") {
        console.error("\nABBRUCH: Beim Anbieter gilt diese Bezahlseite als BEZAHLT. Nicht löschen.");
        process.exitCode = 1;
        return;
      }
    } catch (e) {
      console.error(
        `\nABBRUCH: Die Bezahlseite liess sich nicht abrufen (${(e as Error).message}).\n` +
          "Solange das unklar ist, wird nichts gelöscht.",
      );
      process.exitCode = 1;
      return;
    }
  }

  /* Ein Aufnahmewiderspruch ist KEIN Teil der Buchung.
     
     Er ist ein eigener Widerspruch nach Art. 21 DS-GVO, mit eigener
     Löschklasse und eigener Frist (K8). Die Beziehung zur Anmeldung
     steht im Schema auf `onDelete: SetNull` — der Widerspruch bliebe
     also stehen, nur ohne Buchung daneben. Für eine Testanmeldung
     darf es das gar nicht erst geben; gibt es doch einen, ist das
     kein Testfall mehr und gehört angesehen. */
  if (a.aufnahmewidersprueche.length > 0) {
    console.error(
      `\nABBRUCH: An dieser Anmeldung hängen ${a.aufnahmewidersprueche.length} ` +
        "Aufnahme-Widersprüche nach Art. 21 DS-GVO.\n" +
        "Sie gehören nicht zur Buchung und dürfen nicht mit ihr verschwinden.\n" +
        "Bitte im Adminbereich ansehen und getrennt entscheiden.",
    );
    process.exitCode = 1;
    return;
  }

  if (!wirklich) {
    console.log(
      "\nVORSCHAU — es wurde NICHTS gelöscht.\n" +
        "Wenn das oben stimmt, denselben Befehl noch einmal mit --wirklich aufrufen.\n",
    );
    return;
  }

  /* Teilnehmer und Anmeldung in EINER Transaktion. Bricht etwas ab,
     bleibt nichts halb gelöscht zurück. */
  const ergebnis = await db.$transaction(async (tx) => {
    const teilnehmer = await tx.participant.deleteMany({ where: { registrationId: a.id } });
    await tx.registration.delete({ where: { id: a.id } });
    return { teilnehmer: teilnehmer.count };
  });

  console.log(`\nGELÖSCHT: 1 Anmeldung, ${ergebnis.teilnehmer} Teilnehmer.`);

  const rest = await db.registration.count({ where: { id: a.id } });
  console.log(rest === 0 ? "Gegenprobe: die Zeile ist fort.\n" : "ACHTUNG: die Zeile ist noch da!\n");
}

hauptlauf()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => db.$disconnect());
SKRIPTENDE
```

Dann die **Vorschau** — sie löscht nichts:

```bash
cd /var/www/vera && sudo -u vera npx tsx --env-file=.env ./test-2-1-loeschen.mts <ANMELDENUMMER>
```

Stimmt die Vorschau, erst dann:

```bash
cd /var/www/vera && sudo -u vera npx tsx --env-file=.env ./test-2-1-loeschen.mts <ANMELDENUMMER> --wirklich
```

Das Skript bricht von selbst ab, wenn die Buchung als bezahlt geführt
wird, wenn der Anbieter sie als bezahlt führt, wenn sich das nicht
prüfen lässt — oder wenn ein Aufnahmewiderspruch daran hängt.

Danach beide Skripte wieder entfernen:

```bash
sudo rm -f /var/www/vera/test-2-1-pruefen.mts /var/www/vera/test-2-1-loeschen.mts
```

### 4.4 Offene Bezahlseiten nachsehen *(ändert nichts)*

```bash
cd /var/www/vera && sudo -u vera npm run --silent zahlung:pruefen
```

Steht dort eine offene Bezahlseite, sind zwei Wege möglich:

1. **Warten**, bis sie verfällt (die alten Seiten laufen 24 Stunden).
2. Sie beim Anbieter **schliessen** — das ist ein Eingriff und trifft
   im Zweifel jemanden, der gerade bezahlt. Nur bei einer Seite tun,
   von der sicher ist, dass sie niemand mehr benutzt.

### 4.5 Doppelte Zahlungsreferenzen nachsehen *(ändert nichts)*

Die Migration legt einen eindeutigen Index auf `zahlungsReferenz`.
Gäbe es Dubletten, schlüge sie fehl — mitten im Umbau.

```bash
cd /var/www/vera && sudo -u vera npx prisma db execute --stdin <<'SQL'
SELECT zahlungsReferenz, COUNT(*) AS anzahl FROM Registration
 WHERE zahlungsReferenz IS NOT NULL
 GROUP BY zahlungsReferenz HAVING anzahl > 1;
SQL
```

> Am 25.09.2026 schon einmal gelaufen: keine Dubletten. Trotzdem
> wiederholen — seitdem ist Zeit vergangen, und der Befehl kostet
> nichts.

### 4.6 Neuen Stand holen und bauen *(**ändert den Server**)*

```bash
cd /var/www/vera && sudo -u vera git fetch origin && sudo -u vera git log --oneline -1 origin/claude/frontend-design-skill-folder-luremb
```

Es muss `2b8f1c3` erscheinen (oder neuer, falls noch etwas dazukommt).

```bash
cd /var/www/vera && sudo -u vera git checkout claude/frontend-design-skill-folder-luremb && sudo -u vera git pull --ff-only
```

```bash
cd /var/www/vera && sudo -u vera env PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci
```

```bash
cd /var/www/vera && sudo -u vera npm run build
```

### 4.7 Dienst anhalten, beide Migrationen ausführen, starten *(**ändert Server und Live-Daten**)*

Die drei Befehle gehören unmittelbar hintereinander. Dazwischen ist
die Seite nicht erreichbar.

```bash
sudo systemctl stop vera
```

```bash
cd /var/www/vera && sudo -u vera npm run db:deploy
```

Es müssen **zwei** Migrationen als angewendet gemeldet werden:
`20260926120000_ohne_reserviert` und
`20260926150000_fehlbuchung_erledigt`.

```bash
sudo systemctl start vera
```

### 4.8 Erste Sichtprüfung *(ändert nichts)*

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://veraevents.de/ && curl -s -o /dev/null -w "%{http_code}\n" https://veraevents.de/admin/login
```

```bash
journalctl -u vera -n 40 --no-pager
```

### 4.9 Nginx-Bremse einbauen *(**ändert den Server**)*

Die Datei anlegen:

```bash
sudo tee /etc/nginx/conf.d/vera-bremse.conf > /dev/null <<'CONFENDE'
# === BREMSE GEGEN MASSEN-EINSENDUNGEN ===
#
# Abgelegt auf dem Server als /etc/nginx/conf.d/vera-bremse.conf
# Angelegt am 25.09.2026.
#
# WARUM HIER UND NICHT IN DER DATENBANK
#
# Vor einer erfolgreichen Zahlung darf in der VERA-Datenbank nichts
# gespeichert werden - auch keine Zeile der Bremse. Die bisherige
# Bremse schrieb bei jedem Absenden die IP-Adresse weg. Nginx haelt
# seine Zaehler in einem geteilten Speicherbereich: nichts auf der
# Festplatte, kein Aufraeumen, kein Loeschkonzept. Nach einem Neustart
# von Nginx sind sie weg - das ist zugelassen.
#
# WARUM NUR POST GEZAEHLT WIRD
#
# Ein leerer Schluessel bedeutet fuer limit_req "nicht mitzaehlen".
# Seitenaufrufe (GET) laufen damit ungebremst durch; gezaehlt wird nur,
# wer wirklich etwas absendet. Ohne diesen Kniff braeuchte es eine
# eigene location je Formular, und jede vergessene waere ein Loch.
#
# WARUM DER WEBHOOK AUSGENOMMEN IST
#
# /zahlung/rueckmeldung ist der Weg, auf dem der Zahlungsanbieter
# meldet, dass bezahlt wurde. Stripe stellt Rueckmeldungen teils in
# Schueben zu. Eine gebremste Rueckmeldung waere eine verlorene
# Zahlung - der teuerste Fehler, den diese Datei anrichten koennte.
# Der Pfad hat seine eigene, staerkere Pruefung: eine Signatur.
# Dieselbe Ausnahme macht vera-sperre.conf.

map $request_method$uri $vera_bremse_schluessel {
    # Vorgabe: nicht mitzaehlen.
    default                          "";
    # Jedes POST zaehlt, nach IP-Adresse.
    ~^POST                           $binary_remote_addr;
    # ... ausser der Rueckmeldung des Zahlungsanbieters.
    ~^POST/zahlung/rueckmeldung      "";
}

# 10 Einsendungen je Minute und Adresse. 10 MB fassen rund 160.000
# Adressen gleichzeitig - weit mehr, als je gleichzeitig kommen.
limit_req_zone $vera_bremse_schluessel zone=vera_anmeldung:10m rate=10r/m;

# 429 statt 503: "zu viele Anfragen" ist die zutreffende Antwort und
# wird von Suchmaschinen und Browsern richtig verstanden.
limit_req_status 429;

# ── EINBAUEN ──────────────────────────────────────────────────────
#
# In /etc/nginx/sites-available/vera in den location-Block, der an die
# Anwendung weiterreicht:
#
#     limit_req zone=vera_anmeldung burst=5 nodelay;
#
# burst=5 nodelay laesst einen kurzen Schwung sofort durch und bremst
# erst danach. Ohne nodelay wuerden Anfragen verzoegert statt
# abgelehnt - das sieht fuer einen ehrlichen Besucher wie eine haengende
# Seite aus.
#
# Danach:  nginx -t && systemctl reload nginx
CONFENDE
```

In `/etc/nginx/sites-available/vera` in den `location`-Block, der an
die Anwendung weiterreicht, diese eine Zeile ergänzen:

```
limit_req zone=vera_anmeldung burst=5 nodelay;
```

Dann — **erst prüfen, dann laden:**

```bash
sudo nginx -t
```

```bash
sudo systemctl reload nginx
```

> Ohne diese Bremse läuft alles trotzdem. Sie ist der Ersatz für den
> früheren Bremszähler in der Datenbank, den es nicht mehr geben darf.
> Zusätzlich zählt der Dienst selbst im Arbeitsspeicher mit
> (`lib/bremseFluechtig.ts`), fünf Versuche je Stunde und Adresse.

### 4.10 Abgleichlauf einrichten *(**ändert den Server**)*

Er holt Zahlungen nach, deren Rückmeldung ausgeblieben ist — die
einzige Stelle, an der eine eingegangene Zahlung ohne ihn liegenbliebe.

```bash
sudo install -m 755 /var/www/vera/server/vera-zahlungsabgleich.sh /usr/local/bin/vera-zahlungsabgleich.sh
```

```bash
sudo install -m 644 /var/www/vera/server/vera-zahlungsabgleich.service /etc/systemd/system/vera-zahlungsabgleich.service
sudo install -m 644 /var/www/vera/server/vera-zahlungsabgleich.timer /etc/systemd/system/vera-zahlungsabgleich.timer
```

```bash
sudo systemctl daemon-reload && sudo systemctl enable --now vera-zahlungsabgleich.timer
```

Einmal von Hand starten und ansehen:

```bash
sudo systemctl start vera-zahlungsabgleich.service && journalctl -u vera-zahlungsabgleich.service -n 30 --no-pager
```

### 4.11 Sicherung einspielen — nur im Rückkehrfall *(**ändert Live-Daten**)*

```bash
sudo /usr/local/bin/vera-nach-wiederherstellung.sh
```

Der genaue Weg samt Entschlüsselung steht in
[sicherung.md](sicherung.md). **Er überschreibt die Datenbank
vollständig.**

### 4.12 Notausgang: das alte Schema wiederherstellen *(**ändert Live-Daten**)*

Nur, wenn erst nach Stunden etwas auffällt und die Sicherung deshalb
keine Option mehr ist:

```bash
cd /var/www/vera && sudo -u vera npx prisma db execute --stdin <<'SQL'
ALTER TABLE `Registration`
  MODIFY `status` ENUM('RESERVIERT','BESTAETIGT','WARTELISTE','STORNIERT')
  NOT NULL DEFAULT 'BESTAETIGT';
ALTER TABLE `Registration` ADD COLUMN `reserviertBis` DATETIME(3) NULL;
SQL
```

Danach den alten Commit auschecken, bauen und starten. Die Werte in
`reserviertBis` sind fort — der alte Code kommt damit zurecht (`NULL`
heisst dort „keine laufende Reservierung"), die betroffenen Zeilen
stehen auf `STORNIERT` und müssten von Hand angesehen werden.

Die drei Spalten der zweiten Migration bleiben dabei stehen. Das ist
Absicht: Der alte Code kennt sie nicht und stört sich nicht an ihnen,
und wer sie entfernte, verlöre die Vermerke darin.

---

## 5. Die Abschlussprüfung

Nach Schritt 10 einmal den ganzen Weg gehen — mit einer echten
Testzahlung, im Stripe-**Testmodus**.

1. Auf `veraevents.de` eine Anmeldung absenden.
2. **Abbrechen.** Dann im Adminbereich nachsehen: Es darf **nichts**
   stehen — keine Anmeldung, kein belegter Platz, nirgends der Name.
3. Erneut anmelden, diesmal **bezahlen** (Testkarte `4242 4242 4242
   4242`, beliebiges künftiges Datum, beliebige Prüfziffer).
4. Die Abschluss-Seite muss „Zahlung erfolgreich" zeigen.
5. Die Bestätigungsmail muss ankommen.
6. Im Adminbereich muss die Buchung stehen, mit belegtem Platz.
7. Oben im Adminbereich darf **keine** Fehlbuchungs-Warnung stehen.
8. Die Testbuchung wieder entfernen — über den Storno-Weg im
   Adminbereich, nicht über die Datenbank.
9. Nach dem Storno muss die Buchung in der Rückschau des Anbieters als
   erstattet erscheinen.

Schlägt einer der Punkte 2 bis 7 fehl: Abschnitt 2, Rückkehrplan.

### Der neue Knopf, einmal ausprobiert

Der Knopf „Als erledigt markieren" erscheint nur, wenn es wirklich
eine Fehlbuchung gibt — und die entsteht nur, wenn etwas schiefgeht.
Er lässt sich deshalb nicht nebenbei mitprüfen, und dafür eigens eine
Fehlbuchung von Hand anzulegen hiesse, in der Live-Datenbank eine
Zeile zu erfinden.

Er ist in der Entwicklungsumgebung durchgespielt (Liste `J`,
Prüfungen 18 bis 30: abhaken, Datensatz bleibt vollständig stehen,
Protokolleintrag, Warnung verschwindet, Vorgang steht in der
Rückschau; Liste `F`: ohne gültige Anmeldung passiert nichts).

Auf dem Server gilt deshalb: **Beim ersten Mal, wenn eine Fehlbuchung
auftaucht**, den Knopf benutzen und danach nachsehen, dass die Zeile
unten in der Rückschau steht. Nicht vorher eine erfinden.

---

## 6. Was sich für Besucher sichtbar ändert

Damit es niemanden überrascht:

- Nach einem Abbruch steht nicht mehr „Deine Anmeldung ist noch nicht
  abgeschlossen" mit einem Bezahlknopf, sondern **„Es wurde nichts
  gespeichert"** mit dem Weg zurück zum Formular.
- Wer den Bezahlvorgang abbricht, muss das Formular **neu ausfüllen**.
  Das ist unbequemer als vorher — und der Preis dafür, dass vor der
  Zahlung nichts gespeichert wird.
- Die Bezahlseite läuft nach **30 Minuten** ab statt nach 24 Stunden.
  Gehalten wird dadurch nichts; es verhindert nur, dass jemand am
  Abend eine Seite vom Vormittag bezahlt, wenn längst ausgebucht ist.
- Wer bezahlt hat, ohne dass eine Anmeldung zustande kam, bekommt sein
  Geld **von selbst** zurück und dazu eine Mail, die den Grund nennt.
  In vier von fünf Lagen geschieht das ohne Zutun; nur bei einem
  abweichenden Betrag wartet der Vorgang auf eine Entscheidung.

Und für dich im Adminbereich:

- Ganz oben steht eine Warnung, wenn Geld eingegangen ist, ohne dass
  eine Anmeldung daraus wurde — mit Betrag, Grund im Klartext und der
  Kennung, mit der sich der Vorgang beim Anbieter wiederfinden lässt.
  Sie sagt dazu, ob automatisch erstattet wird oder nicht.
- Darunter eine Rückschau „Zahlungen ohne Anmeldung — letzte 30 Tage":
  was erstattet wurde, wann, und unter welcher Kennung.
- In der Warnung ein Feld für einen Vermerk und der Knopf „Als
  erledigt markieren". Er löscht nichts.
