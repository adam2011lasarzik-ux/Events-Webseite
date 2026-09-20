# 14 — Vergleichsrecherche und Quellen-Update (18.09.2026)

> Ergänzt Dokument 10 (Prüfprotokoll vom 16.09.2026). Zwei Recherchen,
> die dort noch fehlten: ein Blick auf vergleichbare Veranstalter- und
> Ticket-Webseiten (Struktur, nicht Wortlaut), und eine erneute Prüfung,
> ob amtliche Quellen inzwischen direkt abrufbar sind.

---

## 1. Netzwerkzugriff erneut gemessen — Ergebnis unverändert

| Quelle | Ergebnis |
|---|---|
| `www.gesetze-im-internet.de` | **weiterhin blockiert** (`EGRESS_BLOCKED`) |
| `dejure.org` | **weiterhin blockiert** (`EGRESS_BLOCKED`) |
| `www.buzer.de` | **weiterhin blockiert** (`EGRESS_BLOCKED`) |
| Websuche (Suchergebnis-Zusammenfassungen) | funktioniert |

**Damit gilt unverändert, was Dokument 10 schon festgehalten hat:** Jede
Norm ist als Prüfauftrag zu lesen, nicht als im Volltext nachgewiesenes
Ergebnis. Vor der Verwendung ist jeder Paragraf im amtlichen Text
nachzulesen — das kann diese Arbeitsumgebung nicht leisten, ein
Smartphone mit Internetzugang kann es in einer Minute.

---

## 2. Neu recherchiert (Such-Zusammenfassungen, mit Datum)

| Thema | Ergebnis | Quellenart | Datum |
|---|---|---|---|
| **Anschrift der Berliner Aufsichtsbehörde** | Berliner Beauftragte für Datenschutz und Informationsfreiheit, **Alt-Moabit 59–61, 10555 Berlin**, Tel. 030 138890, mailbox@datenschutz-berlin.de | Behördenseite `datenschutz-berlin.de` laut Suchtreffer | 18.09.2026 |
| **Rolle von Stripe** | verbreitet als **doppelte Rolle** beschrieben: Auftragsverarbeiter (Art. 28 DSGVO) für die reine Zahlungsabwicklung, zugleich eigenständig Verantwortlicher für eigene regulatorische Pflichten (z. B. Geldwäscheprävention) | Fachbeiträge, Muster-Anbieter | 18.09.2026 |
| **Rolle von PayPal** | verbreitet als **nicht** Auftragsverarbeiter beschrieben, sondern durchgehend als eigenständig Verantwortlicher | Fachbeiträge, Muster-Anbieter | 18.09.2026 |
| **§ 312g Abs. 2 Nr. 9 BGB** | bestätigt wie in Dokument 10: Ausschluss des Widerrufsrechts bei Dienstleistungen im Zusammenhang mit Freizeitbetätigungen, wenn ein spezifischer Termin oder Zeitraum vorgesehen ist; BGH hat dies auf Eintrittskarten angewendet | Fachbeiträge, u. a. it-recht-kanzlei.de, haerting.de | 18.09.2026 |
| **§ 5 DDG** | bestätigt wie in Dokument 10: löst seit 14.05.2024 § 5 TMG ab, inhaltlich unverändert; Pflichtangaben u. a. Name, ladungsfähige Anschrift, schnelle elektronische Kontaktaufnahme | IHK-Veröffentlichungen, Fachportale | 18.09.2026 |

**Nicht neu und nicht erneut vertieft**, weil Dokument 10 sie bereits
mit vergleichbarer Quellenlage dokumentiert: § 356a BGB
(Widerrufsbutton), § 36 VSBG (Kleinunternehmer-Ausnahme), BFSG-Ausnahme
für Kleinstunternehmen, Abschaltung der EU-OS-Plattform.

## 2b. Dienstleister-Firmierungen (recherchiert auf Wunsch von Adam, 18.09.2026)

**Direkter Abruf der Anbieter-Rechtsseiten war blockiert** (`stripe.com`,
`www.hostinger.com`, `uptimerobot.com` — alle `EGRESS_BLOCKED`). Die
folgenden Angaben stammen aus Websuche-Zusammenfassungen fremder
Quellen (Handelsregisterauszüge, LEI-Register, Drittanbieter-DPAs), die
diese Angaben zitieren — **nicht aus den Originaldokumenten selbst.**
Vor Verwendung im eigenen Konto/den eigenen Vertragsunterlagen
gegenprüfen.

| Anbieter | Recherchiertes Ergebnis | Sicherheit | Quelle |
|---|---|---|---|
| Backblaze | Backblaze, Inc., 500 Ben Franklin Ct, San Mateo, CA 94401, USA | hoch — nur eine Gesellschaft gefunden | Backblaze-eigene Datenschutzseiten, BBB-Eintrag |
| UptimeRobot | UptimeRobot s. r. o., Obchodná 507/2, 811 06 Bratislava, Slowakei | hoch — aus dem öffentlichen UptimeRobot-DPA | UptimeRobot DPA-Seite (per Suchtreffer, nicht direkt abgerufen) |
| Stripe | Stripe Payments Europe, Limited, One Wilton Park, Wilton Place, Dublin 2, D02 FX04, Irland | **mittel** — für deutsche Kunden in Stripes „Services Agreement — Germany" genannt, aber Stripe weist ausdrücklich auf ggf. mehrere beteiligte Gesellschaften hin | Stripe-eigene Rechtsseiten (`stripe.com/en-de/legal`), LEI-Register |
| Hostinger | **nicht eindeutig** — mindestens vier Gesellschaften je nach Kundensitz: Hostinger International Limited (Zypern), Hostinger UK Limited, Hostinger Global S.à r.l. (Luxemburg), weitere für Asien | niedrig — Kundensitz Deutschland fiel in keinem Treffer eindeutig einer bestimmten Gesellschaft zu | Hostinger-eigene Rechtsseiten, DPA-Zusammenfassungen |

**Für Stripe und Hostinger bleibt die endgültige Zuordnung eine
Ablesearbeit im eigenen Konto** (Dokument 15, Abschnitt A) — Recherche
kann eine unternehmerspezifische Vertragsbeziehung nicht ersetzen.

## 2c. Auftragsverarbeitungsverträge — automatisch oder gesondert? (18.09.2026)

Auf Wunsch von Adam recherchiert, statt pauschal als „fehlend"
markiert:

| Anbieter | Ergebnis | Quelle |
|---|---|---|
| Hostinger | DPA per Verweis in die Nutzungsbedingungen eingebunden; Kunde „gilt als unterzeichnet" (inkl. EU-Standardvertragsklauseln) ab elektronischer Annahme der Nutzungsbedingungen | `hostinger.com/legal/dpa` (per Suchtreffer) |
| Stripe | DPA (inkl. „Data Transfers Addendum") per Verweis in die Stripe Services Agreement eingebunden, ohne separate Unterschrift | `stripe.com/legal/dpa`, `stripe.com/legal/ssa` (per Suchtreffer) |
| Backblaze | DPA per Verweis in die Nutzungsbedingungen eingebunden; eigene „DPA for EEA/EU Residents"-Fassung mit Vorrang bei Widerspruch | `backblaze.com/company/dpa.html` (per Suchtreffer) |
| UptimeRobot | **Abweichende Formulierung:** DPA „verfügbar" für Verantwortliche, „zugänglich auf Anfrage" — deutet auf einen aktiven Schritt statt automatischer Einbindung hin | `uptimerobot.com/dpa/` (per Suchtreffer, nicht direkt abgerufen) |

**Auch hier gilt die Einschränkung aus Abschnitt 1:** Direkter Abruf
der Originaldokumente war blockiert; die Einschätzung stammt aus
Suchergebnis-Zusammenfassungen und ist vor Verwendung im eigenen Konto
gegenzuprüfen — für UptimeRobot ausdrücklich, für die anderen drei zur
eigenen Sicherheit.

---

## 2d. Checkout-Pflichten (Fragen 2.12–2.14), recherchiert 18.09.2026

| Thema | Ergebnis | Quellenart |
|---|---|---|
| **§ 312j Abs. 2 BGB** — wesentliche Merkmale | Müssen **unmittelbar vor Abgabe der Bestellung** klar, verständlich und hervorgehoben bereitstehen; maßgeblich ist die Bestellübersicht/Checkout-Seite selbst. **OLG Nürnberg** hat das ausdrücklich für die wesentlichen Eigenschaften entschieden — eine Darstellung nur eine Ebene davor genügt nicht. | Fachbeiträge (it-recht-kanzlei.de, shopbetreiber-blog.de) zu OLG Nürnberg |
| **§ 312f Abs. 2 BGB** — Vertragsbestätigung | Die Bestätigung auf dauerhaftem Datenträger muss den **gesamten Vertragsinhalt einschließlich der einbezogenen AGB** und die Informationen nach Art. 246a EGBGB enthalten. E-Mail ist ein dauerhafter Datenträger; ein Link auf eine änderbare Website ist keiner. | Fachbeiträge (it-recht-kanzlei.de zur AGB-Übermittlung in Textform, website-check.de zu nachvertraglichen Informationspflichten) |
| **§ 305 Abs. 2 BGB** — Einbeziehung | Findet **im Bestellvorgang** statt (Häkchen), nicht in der Bestätigungsmail. Beide Pflichten bestehen nebeneinander und ersetzen einander nicht. | Skill-Prüfraster `agb-pruefung-kaltstart` |
| Absagegrund | **Keine** gesetzliche Pflicht zur Begründung einer Absage gefunden. Der Nutzen liegt in der Dokumentation, dass ein vertraglich vorbehaltenes Lösungsrecht (§ 308 Nr. 3 BGB) tatsächlich ausgeübt wurde. | eigene Subsumtion, keine Fundstelle |

**Einschränkung wie oben:** Das OLG-Nürnberg-Urteil wurde **nicht im
Volltext** gelesen — der Abruf amtlicher Entscheidungssammlungen ist aus
dieser Umgebung blockiert. Aktenzeichen und Randnummern sind deshalb
bewusst **nicht** zitiert; die Aussage stützt sich auf zwei unabhängige
Fachbeiträge, die den Entscheidungsinhalt übereinstimmend wiedergeben.
Vor Verwendung im Ernstfall im Digitalisat prüfen.

---

## 3. Vergleichsrecherche: Struktur bei vergleichbaren Anbietern

> **Zweck und Grenze dieser Recherche.** Es geht um **Aufbau und
> Themen**, die vergleichbare Seiten regeln — nicht um Wortlaut. Kein
> Satz aus den gefundenen Seiten wurde übernommen. Wo VERA von der
> gefundenen Praxis abweicht, steht das ausdrücklich dabei.

Untersucht wurden AGB, Hausordnungen und Haftungserklärungen von
Trampolinparks und Kletterhallen (u. a. JUMP Trampolinpark Halle,
Alpenverein-Südtirol-Kletteranlagen, mehrere Freizeitpark-Anbieter) —
das sind die Betriebe, deren Struktur der Sache am nächsten kommt:
Freizeitsport, offener Zugang, Minderjährige als große Zielgruppe,
Verletzungsrisiko.

**Wiederkehrende Bausteine, mit denen VERAs Entwürfe verglichen
wurden:**

| Baustein | Bei Vergleichsanbietern üblich | Bei VERA |
|---|---|---|
| Getrennte Haftungserklärung/Waiver für Minderjährige, von Eltern unterschrieben | ja, durchgängig | ja (Dokument 05) |
| Eigenverantwortliche Nutzung als Grundprinzip statt betreuter Programmablauf | ja, häufig ausdrücklich formuliert | ja (Anlagenmodell, Dokument 05/11) |
| Sicherheits- bzw. Einweisungspflicht vor der ersten Nutzung | ja, meist als Kurzbriefing oder Video | ja (Dokument 09, Ziffer 4.8) |
| Getrennte Hausordnung neben den AGB | ja | ja (Dokument 09) |
| Verweis auf die Hausordnung des Betreibers, wenn in fremden Räumen veranstaltet wird | seltener explizit geregelt, weil die Anbieter meist selbst Betreiber sind | ja, ausdrücklich (Dokument 09, Vorbemerkung) — **das ist bei VERA wichtiger als bei den Vergleichsanbietern**, weil VERA in fremden Hallen gastiert, nicht wie die meisten Vergleichsanbieter der Betreiber selbst ist |
| Pauschale „Eltern haften für ihre Kinder"-Formel | kommt in freien Mustertexten vor, ist aber rechtlich unzutreffend | **bewusst nicht verwendet** (Dokument 05, K-2) — hier weicht VERA absichtlich von einer verbreiteten, aber falschen Praxis ab |
| Bar- oder Kartenpfand für Ausrüstung/Bänder | kommt vor (v. a. bei Schlüssel-/Schließfachsystemen), unüblich als reine Alterskennzeichnung | **kein Pfand, kein Armband** — Adam hat sich am 17./18.09.2026 bewusst dagegen entschieden (Dokument 11, 3.14–3.21) |

**Ergebnis:** VERAs Entwürfe folgen im Aufbau demselben Muster wie die
untersuchten Vergleichsanbieter (getrennte Haftungserklärung,
Sicherheitseinweisung, Hausordnung, eigenverantwortliche Nutzung). Zwei
bewusste Abweichungen sind dokumentiert und begründet: der Verweis auf
eine fremde Hausordnung (weil VERA Gast in der Halle ist) und der
Verzicht auf die verbreitete, aber unwirksame „Eltern haften"-Formel.

---

## 4. Was diese Recherche nicht ersetzt

- **Keine Rechtsberatung.** Weder die amtlichen Quellen noch die
  Vergleichsseiten wurden im Volltext geprüft; beides bleibt in der
  fachlichen Prüfung zu bestätigen.
- **Keine Übernahme von Wortlaut.** Es wurde nichts aus den gefundenen
  Seiten kopiert oder umformuliert — nur die Themenliste diente als
  Prüfraster für die eigenen Entwürfe.

---

# Nachtrag 20.09.2026 — Vertragsgesellschaften der Dienstleister

Anlass: Punkt 1.5 aus Dokument 15. Für die Datenschutzerklärung müssen
die **Gesellschaften** der eingesetzten Dienstleister benannt werden,
nicht nur die Marken. Die Recherche vom 18.09.2026 hatte Hostinger und
Stripe als „nicht sicher zuordenbar" hinterlassen.

## Was jetzt feststeht

**Hostinger** — von Adam am 20.09.2026 anhand der eigenen
Vertragsunterlagen bestätigt:

> Hostinger International Ltd.
> 61 Lordou Vironos Street
> 6023 Larnaca
> Zypern

Damit ist die Alternative **Hostinger Global S.à r.l.** (Luxemburg), die
in der Recherche vom 18.09.2026 als zweite Möglichkeit aufgetaucht war,
ausgeschlossen. Zypern liegt in der EU; aus der Gesellschaft entsteht
kein Drittlandbezug. Dieselbe Gesellschaft gilt für **Server und
E-Mail** — beide laufen über denselben Vertrag, und beide Stellen der
Datenschutzerklärung müssen dieselbe Firmierung tragen.

**Stripe** — von Adam am 20.09.2026 anhand der Stripe-Rechtsdokumente
bestätigt:

- **Stripe Payments Europe, Limited (SPEL)** ist nach dem aktuellen
  Stripe-Datenverarbeitungsvertrag bei einem **deutschen Konto** für die
  Datenverarbeitung zuständig.
- Der **Stripe-Rahmenvertrag** nennt zusätzlich **Stripe Technology
  Europe, Limited (STEL)** als mögliche weitere Vertragspartei für
  bestimmte Zahlungsdienste.

Beide sitzen in **Irland**. Die frühere Formulierung „je nach genutzten
Diensten können mehrere Stripe-Gesellschaften beteiligt sein" ist damit
konkretisiert: Es sind diese beiden.

## Was offen bleibt — und warum

**Die Anschriften der beiden Stripe-Gesellschaften.** Sie sollten
ausdrücklich aus einer **Stripe-Primärquelle** übernommen werden. Das
ist aus dieser Arbeitsumgebung **nicht möglich**:

- `https://stripe.com/legal/dpa` → vom Egress-Proxy abgewiesen
  (`EGRESS_BLOCKED`), geprüft am 20.09.2026
- `https://support.stripe.com/…` → ebenso abgewiesen, geprüft am
  20.09.2026

Das deckt sich mit den bereits bekannten Sperren für `api.stripe.com`,
`dashboard.stripe.com` und `checkout.stripe.com`.

**Konsequenz, und sie ist bewusst so gewählt:** Die frühere Angabe
„One Wilton Park, Wilton Place, Dublin 2, D02 FX04" wurde aus dem
Entwurf der Datenschutzerklärung **entfernt**, nicht stehen gelassen.
Sie stammte aus Sekundärrecherche vom 18.09.2026 und war nie an einem
Stripe-Dokument geprüft. **Eine Anschrift, die plausibel aussieht und
nicht belegt ist, ist in einer Datenschutzerklärung gefährlicher als
eine sichtbare Lücke** — die Lücke wird beim Korrekturlesen bemerkt, die
falsche Angabe nicht.

An ihrer Stelle steht jetzt ein sichtbarer Platzhalter. Einzusetzen aus
dem Stripe-Datenverarbeitungsvertrag beziehungsweise der Stripe Services
Agreement, Abschnitt „Definitionen" — dort sind beide Gesellschaften mit
vollständiger Anschrift genannt.

## Verwendete Quellen

- **Primär, vom Auftraggeber gelesen:** Stripe-Datenverarbeitungsvertrag
  und Stripe-Rahmenvertrag (Zugriff über Adams Stripe-Konto, Stand
  20.09.2026) — Grundlage für SPEL und STEL.
- **Primär, vom Auftraggeber gelesen:** Hostinger-Vertragsunterlagen
  (Stand 20.09.2026) — Grundlage für Firmierung und Anschrift.
- **Sekundär, nur zur Vorabeinschätzung vor der Bestätigung und nicht in
  die Entwürfe übernommen:** `av-vertrag.org/dienst-anbieter/
  hostinger-international-ltd/` und `datenanfragen.de/company/hostinger/`
  (beide abgerufen am 20.09.2026). Sie deckten sich mit der späteren
  Bestätigung, waren aber nicht deren Grundlage.
- **Nicht verwendet:** die im Stripe-Konto angezeigten SOC-Berichte —
  sie betreffen die Prüfung interner Kontrollen und sagen zur
  Vertragsgesellschaft nichts aus.
