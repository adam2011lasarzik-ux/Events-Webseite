---
name: event-backend-database
description: Best Practices und Architekturvorgaben für Backend, Datenbank, Event-Anmeldungen und Adminbereich dieser Event-Webseite. Diesen Skill IMMER konsultieren bei Aufgaben zu Datenbank-Design, Migrationen, Teilnehmer-Anmeldungen, Wartelisten, Adminbereich, Authentifizierung, Sicherheit, Datenschutz/DSGVO oder Hostinger-Deployment für dieses Projekt. Gilt für alle Backend-Aufgaben dieser Webseite, auch wenn der Nutzer nur "Anmeldung bauen", "Admin-Login" oder "Teilnehmerliste" sagt.
---

# Event-Backend & Datenbank

Dieser Skill legt fest, wie Backend, Datenbank, Event-Anmeldungen und der Adminbereich dieser Event-Webseite gebaut werden.

Der Nutzer ist Programmier-Anfänger und entwickelt hauptsächlich über Claude Code im Browser auf einem iPad + GitHub. Die Seite soll später bei Hostinger gehostet werden.

Grundprinzip: Bei jeder Aufgabe die einfachste, wartbare, sichere und Hostinger-kompatible Lösung wählen. Keine unnötigen Frameworks, Dienste oder Abhängigkeiten. Bestehenden Code nicht unnötig verändern.

---

## 1. Tech-Stack

Der aktuell vorgesehene Hostinger-Tarif des Nutzers ("Unlimited") unterstützt Node.js-Hosting. Damit gilt grundsätzlich:

- Framework: Next.js (React-basiert, gute Dokumentation, Frontend + Backend in einem Projekt).
- Datenbank: MySQL.
- DB-Zugriffsschicht: ORM, bevorzugt Prisma, sofern es mit der tatsächlichen Hostinger-Umgebung vollständig kompatibel ist.
- Prisma soll für Migrationen, strukturierte Datenbankzugriffe und typsichere Abfragen verwendet werden, sofern keine technischen Gründe dagegen sprechen.

Bevor die eigentliche Backend-/Datenbank-Architektur später produktiv umgesetzt wird, die tatsächlichen technischen Möglichkeiten des verwendeten Hostinger-Tarifs noch einmal prüfen.

Falls sich eine Annahme als falsch herausstellt oder eine vorgesehene Technologie nicht vollständig unterstützt wird, den Nutzer vor einer Änderung informieren und die einfachste Alternative erklären.

Nicht ungefragt auf einen komplett anderen Stack wechseln, z.B. PHP, MongoDB oder eine separate Backend-API.

---

## 2. Datenbankstruktur

- Mindestens zwei getrennte Tabellen/Modelle: Event und Registration.
- Niemals Event- und Teilnehmerdaten unstrukturiert in derselben Tabelle mischen.
- Eindeutige IDs verwenden.
- Bei öffentlich sichtbaren IDs bevorzugt cuid() oder uuid() bzw. eine vergleichbar sichere Lösung verwenden.
- Datenbankänderungen über nachvollziehbare Migrationen durchführen.
- Produktionsdatenbank nicht unkontrolliert manuell verändern.
- Alle Datenbankzugriffe über eine zentrale, klar strukturierte Datenbank-Schicht organisieren, z.B. lib/db.ts.
- Keine unnötig verstreuten direkten Datenbankzugriffe in einzelnen Seiten oder Komponenten.
- Schema so gestalten, dass später neue Funktionen ergänzt werden können, ohne bestehende Daten unnötig zu gefährden.

### Beispiel-Datenmodell

**Event**
- id
- title
- description
- date
- maxParticipants (optional, null = unbegrenzt)
- createdAt

**Registration**
- id
- eventId
- firstName
- lastName
- email
- phone (optional)
- status ("confirmed" | "waitlist" | "cancelled")
- registeredAt
- cancelledAt (optional)

---

## 3. Event-Anmeldungen

Pflichtfelder:
- Vorname
- Nachname
- E-Mail-Adresse

Optional:
- Telefonnummer

Zusätzlich:
- zugehöriges Event
- Anmeldezeitpunkt
- Anmeldestatus

### Duplikatsschutz

Für dieselbe E-Mail-Adresse und dasselbe Event darf es nicht mehrere parallele aktive Anmeldungen geben.

Eine aktive Anmeldung mit Status confirmed oder waitlist darf nicht doppelt angelegt werden.

Wenn bereits eine Anmeldung für dieselbe E-Mail-Adresse und dasselbe Event existiert und deren Status cancelled ist, soll bei einer erneuten Anmeldung nach Möglichkeit derselbe Datensatz reaktiviert bzw. aktualisiert werden, statt einen zweiten Datensatz anzulegen.

Dabei:
- Status wieder passend auf confirmed oder waitlist setzen.
- cancelledAt entsprechend zurücksetzen.
- Anmelde-/Reaktivierungszeitpunkt sauber dokumentieren.
- Falls für eine saubere Historie sinnvoll, einen separaten Reaktivierungszeitpunkt vorsehen.
- Datenbank-Constraint und Anwendungslogik müssen miteinander vereinbar sein.
- Eine stornierte Anmeldung darf eine spätere erneute Anmeldung technisch nicht blockieren.
- Die Lösung soll einfach, wartbar und mit MySQL/Prisma kompatibel bleiben.

### Teilnehmerlimit und Warteliste

- Maximale Teilnehmerzahl pro Event unterstützen.
- Bei jeder neuen oder reaktivierten Anmeldung serverseitig prüfen, ob noch ein Platz verfügbar ist.
- Wenn Plätze verfügbar sind → confirmed.
- Wenn das Teilnehmerlimit erreicht ist → waitlist.
- Teilnehmerzahl ausschließlich anhand aktiver confirmed-Anmeldungen berechnen.
- waitlist und cancelled nicht als bestätigte Teilnehmer zählen.
- Nach einer Stornierung prüfen können, ob eine Person von der Warteliste nachrücken kann.

### Spätere Funktionen

Die Architektur so vorbereiten, dass später ohne unnötigen Umbau ergänzt werden können:
- Bestätigungsmails
- Stornierungs-/Abmeldefunktion
- automatische Wartelisten-Nachrückung
- CSV-Export der Teilnehmerliste

Der CSV-Export soll später über eine klar abgegrenzte Funktion/Route im geschützten Adminbereich erfolgen und keinen externen Dienst benötigen.

---

## 4. Spam- und Missbrauchsschutz

Keinen Captcha-Drittanbieter einbauen, solange dies nicht notwendig ist.

Zunächst einfache Maßnahmen berücksichtigen:

### Honeypot

- Unsichtbares zusätzliches Formularfeld verwenden.
- Bots, die dieses Feld ausfüllen, serverseitig erkennen.
- Solche Anmeldungen verwerfen.
- Dem Bot nicht ausdrücklich mitteilen, dass er durch eine Bot-Falle erkannt wurde.

### Rate-Limiting

- Anmeldungen pro IP-Adresse und/oder E-Mail-Adresse innerhalb eines sinnvollen Zeitfensters begrenzen.
- Ein möglicher Ausgangswert wäre beispielsweise maximal 5 Anmeldeversuche pro IP-Adresse pro Stunde.
- Der konkrete Wert soll später bei Bedarf angepasst werden können.

Wichtig:
- In-Memory-Rate-Limiting darf nur für Entwicklung und Tests verwendet werden.
- Für die produktive Hostinger-Umgebung nicht davon ausgehen, dass In-Memory-Zähler Server-Neustarts überstehen.
- Für die produktive Webseite eine zuverlässige und Hostinger-kompatible Lösung verwenden.
- Falls eine einfache DB-basierte Rate-Limiting-Lösung über die vorhandene MySQL-Datenbank sinnvoll und sicher umgesetzt werden kann, diese bevorzugt prüfen.
- Bevor Redis, Upstash, Cloudflare oder ein anderer externer bzw. kostenpflichtiger Dienst eingeführt wird, den Nutzer informieren, Nutzen/Kosten erklären und Zustimmung einholen.

### Sehr wichtige Trennung

Anmeldungen, Teilnehmerzahlen, Eventdaten und Anmeldestatus dürfen niemals ausschließlich im Arbeitsspeicher/In-Memory gespeichert werden.

Diese Daten müssen persistent in der Datenbank gespeichert werden.

Ein Neustart der Node.js-Anwendung darf niemals dazu führen, dass:
- Teilnehmer verschwinden,
- Anmeldungen verloren gehen,
- Teilnehmerzahlen zurückgesetzt werden,
- Events verschwinden,
- Wartelisten verloren gehen.

Der Speicher für Rate-Limiting/Spam-Schutz ist technisch von den eigentlichen Event- und Teilnehmerdaten zu trennen.

---

## 5. Adminbereich

Der Adminbereich muss geschützt sein.

Niemals Verwaltungsfunktionen ungeschützt öffentlich zugänglich machen.

Der Adminbereich soll später ermöglichen:
- Events anzeigen und verwalten.
- Teilnehmerzahl je Event anzeigen.
- Teilnehmerlisten anzeigen.
- confirmed, waitlist und cancelled unterscheiden.
- Anmeldestatus verwalten.
- Warteliste einsehen.
- Teilnehmerdaten datenschutzkonform löschen/anonymisieren.
- CSV-Export auslösen.

### Authentifizierung

Für einen einzelnen Administrator zunächst eine möglichst einfache, aber sichere Lösung verwenden.

- Passwörter niemals im Klartext speichern.
- Etablierte Passwort-Hashing-Verfahren verwenden, z.B. bcrypt oder eine zum Zeitpunkt der Implementierung geeignete etablierte Alternative.
- Sichere Sessions/Cookies verwenden.
- Keine eigene unsichere Authentifizierungslogik „erfinden".
- Keine unnötig komplexe Multi-User-/Multi-Tenant-Lösung einführen, solange sie nicht benötigt wird.

---

## 6. Sicherheit

- Alle Eingaben serverseitig validieren.
- Frontend-Validierung niemals als einzigen Schutz betrachten.
- E-Mail-Format, Pflichtfelder, Datentypen und sinnvolle Längenbegrenzungen prüfen.
- Datenbankzugriffe über ORM bzw. parametrisierte Queries durchführen.
- Nutzereingaben niemals direkt in SQL-Strings einsetzen.
- Fehler serverseitig behandeln.
- Besuchern nur verständliche, generische Fehlermeldungen anzeigen.
- Keine Stacktraces, internen Pfade, Datenbankinformationen oder Secrets an Besucher ausgeben.
- Keine Secrets, API-Keys oder Datenbank-Zugangsdaten direkt im Quellcode speichern.
- Secrets ausschließlich über Umgebungsvariablen verwalten.
- .env mit echten Zugangsdaten niemals in GitHub committen.
- Später eine .env.example mit ausschließlich Platzhaltern verwenden, um benötigte Variablen zu dokumentieren.
- Keine personenbezogenen Daten oder Zugangsdaten unnötig in Logs schreiben.

---

## 7. Datenschutz / DSGVO

- Nur Daten speichern, die tatsächlich benötigt werden.
- Keine Tracking- oder Analyseinformationen „auf Vorrat" sammeln.
- Personenbezogene Daten niemals öffentlich zugänglich machen.
- Teilnehmerlisten dürfen nur im geschützten Adminbereich verfügbar sein.
- Für Entwicklung und Tests ausschließlich erfundene Testdaten verwenden.

### Stornierung vs. echte Löschung

status: cancelled ist keine vollständige Löschung personenbezogener Daten.

Eine Stornierung darf zunächst gespeichert bleiben, damit Wartelistenlogik und notwendige Verwaltungsfunktionen funktionieren.

Zusätzlich eine spätere echte Lösch-/Anonymisierungsfunktion vorsehen.

Damit sollen personenbezogene Daten eines Teilnehmers dauerhaft entfernt oder anonymisiert werden können.

Diese Funktion soll später über den geschützten Adminbereich verfügbar sein.

---

## 8. Entwicklung und Produktion

Entwicklungs-/Testumgebung und Produktion müssen sauber getrennt sein.

- Separate Datenbank für Entwicklung/Test und Produktion verwenden.
- Test- und Produktions-Konfiguration nicht vermischen.
- Umgebungsvariablen sauber trennen.
- Testdaten niemals versehentlich in die Produktionsdatenbank übernehmen.
- Anmeldung, Datenbankspeicherung, Teilnehmerzählung, Warteliste und Adminbereich sollen vor der Veröffentlichung vollständig in der Entwicklungs-/Cloud-Umgebung testbar sein.
- Die Entwicklung soll möglichst ohne komplizierte lokale Einrichtung auf dem iPad funktionieren.
- GitHub bleibt Repository für den Quellcode.

---

## 9. Vorgehen bei größeren Änderungen

Bevor größere Änderungen vorgenommen werden, dem Nutzer kurz und anfängerfreundlich erklären:

1. Was geändert werden soll.
2. Warum die Änderung notwendig oder sinnvoll ist.
3. Welche Auswirkungen sie auf das Projekt hat.
4. Ob dadurch zusätzliche Kosten oder externe Dienste entstehen.

Dies gilt insbesondere für:
- Datenbankstruktur
- Authentifizierung
- Adminbereich
- Hosting-Architektur
- neue externe Dienste
- kostenpflichtige Dienste
- sicherheitsrelevante Funktionen
- Änderungen am Tech-Stack

Bei mehreren möglichen Lösungen nicht eigenständig eine unnötig komplexe Variante auswählen.

Die einfachste passende, sichere, wartbare und Hostinger-kompatible Lösung bevorzugen.

---

## 10. Hostinger-Kompatibilität

Bei wichtigen technischen Entscheidungen prüfen:

- Funktioniert die Lösung mit dem tatsächlich verwendeten Hostinger-Tarif?
- Funktioniert sie mit Node.js-Hosting?
- Funktioniert die geplante Datenbanklösung mit Hostinger?
- Sind Next.js und die verwendeten Funktionen in der tatsächlichen Hosting-Umgebung vollständig nutzbar?
- Ist Prisma bzw. das gewählte ORM kompatibel?
- Werden keine unnötigen VPS-spezifischen Funktionen vorausgesetzt?
- Kann die Anwendung möglichst ohne Architektur-Umbau über GitHub zu Hostinger übertragen werden?

Falls etwas nicht unterstützt wird oder unklar ist:

Nicht einfach eine andere Architektur einführen.

Den Nutzer zuerst informieren und die einfachste Alternative erklären.

---

## 11. Verbesserungsvorschläge und wichtige Hinweise

Claude soll bei der Entwicklung aktiv mitdenken.

Wenn bei der Arbeit an diesem Skill oder später bei der Entwicklung der Webseite etwas auffällt, das:

- technisch wichtig ist,
- die Sicherheit verbessert,
- Datenverlust verhindern kann,
- die Benutzerfreundlichkeit verbessert,
- die Performance verbessert,
- für Datenschutz/DSGVO relevant ist,
- für Hostinger oder die spätere Veröffentlichung wichtig ist,
- die Wartbarkeit verbessert,
- oder eine Funktion sinnvoller bzw. zuverlässiger machen würde,

den Nutzer aktiv darauf hinweisen.

Dabei kurz und anfängerfreundlich erklären:

1. Was aufgefallen ist.
2. Warum es wichtig oder sinnvoll ist.
3. Was konkret verbessert werden könnte.
4. Ob dadurch zusätzliche Kosten, externe Dienste oder größere Änderungen entstehen.

Wichtig: Zusätzliche Verbesserungen, die über den eigentlichen Auftrag hinausgehen, nicht automatisch umsetzen.

Zuerst vorschlagen und auf die Zustimmung des Nutzers warten.

Kleine notwendige Korrekturen, ohne die ausdrücklich beauftragter Code nicht korrekt funktionieren würde, dürfen innerhalb des aktuellen Auftrags behoben werden. Anschließend den Nutzer darauf hinweisen.
