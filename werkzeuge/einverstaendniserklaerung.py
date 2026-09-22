#!/usr/bin/env python3
"""Erzeugt public/dokumente/einverstaendniserklaerung-minderjaehrige.pdf.

Warum dieses Skript im Repository liegt
---------------------------------------
Das Formular ist ein Rechtsdokument: Sein Wortlaut muss mit den
Teilnahmebedingungen (content/de.ts, Ziffer 6) und dem Hinweis im
Anmeldebereich übereinstimmen — die drei Stellen dürfen nur gemeinsam
geändert werden. Bis zum 22.09.2026 lag der Generator nur im
vergänglichen Arbeitsverzeichnis und ging bei einem Neustart verloren;
das PDF war danach nur noch als fertige Datei vorhanden und ohne
Aufwand nicht mehr änderbar. Genau das soll nicht wieder passieren.

Aufruf:
    python3 werkzeuge/einverstaendniserklaerung.py

Braucht reportlab. Prüfen lässt sich das Ergebnis mit:
    pdftoppm -png -r 110 public/dokumente/...pdf /tmp/kontrolle
"""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_JUSTIFY
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

# ── Marke ────────────────────────────────────────────────────────────
# Dieselben Werte wie styles/tokens.css: Die gedruckte Erklärung und
# die Webseite sollen erkennbar dasselbe Dokument sein.
TIEFBLAU = colors.HexColor("#0C3157")
CHAMPAGNER = colors.HexColor("#C6A566")
SAND = colors.HexColor("#F6F3ED")
TEXT = colors.HexColor("#221E19")
LEISE = colors.HexColor("#6B6B6B")
LINIE = colors.HexColor("#D8D2C6")

STAND = "22.09.2026"
FUSS_LINKS = "VERA Events – Inhaber Adam Lasarzik – kontakt@veraevents.de"

ZIEL = Path(__file__).resolve().parent.parent / "public" / "dokumente" / (
    "einverstaendniserklaerung-minderjaehrige.pdf"
)

RAND_X = 18 * mm
RAND_OBEN = 34 * mm
RAND_UNTEN = 20 * mm
BREITE, HOEHE = A4
INHALT_BREITE = BREITE - 2 * RAND_X

pdfmetrics.registerFont(TTFont("Dejavu", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
pdfmetrics.registerFont(
    TTFont("Dejavu-Bold", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")
)
# Ohne diese Verknüpfung bleibt <b> im Fließtext wirkungslos — der Satz
# zum selbstständigen Verlassen soll aber hervorgehoben sein.
pdfmetrics.registerFontFamily(
    "Dejavu", normal="Dejavu", bold="Dejavu-Bold", italic="Dejavu", boldItalic="Dejavu-Bold"
)


def stil(name, **kwargs):
    grund = dict(
        fontName="Dejavu",
        fontSize=9,
        leading=12.5,
        textColor=TEXT,
        spaceAfter=0,
        spaceBefore=0,
    )
    grund.update(kwargs)
    return ParagraphStyle(name, **grund)


H1 = stil("h1", fontName="Dejavu-Bold", fontSize=18, leading=21.5, textColor=TIEFBLAU)
H2 = stil("h2", fontName="Dejavu-Bold", fontSize=11.5, leading=15, textColor=TIEFBLAU)
FLIESS = stil("fliess")
FLIESS_LEISE = stil("fliess_leise", textColor=LEISE)
BLOCK = stil("block", alignment=TA_JUSTIFY, fontSize=8.3, leading=11)
ZELLE_LABEL = stil("zelle_label", fontSize=8.8)
ZELLE_WERT = stil("zelle_wert", fontSize=8.8, leading=12)


def kopf_und_fuss(canvas, doc):
    """Blaue Kopfleiste, Goldlinie, Fußzeile — auf jeder Seite gleich."""
    canvas.saveState()

    canvas.setFillColor(TIEFBLAU)
    canvas.rect(0, HOEHE - 26 * mm, BREITE, 26 * mm, stroke=0, fill=1)

    canvas.setFillColor(colors.white)
    canvas.setFont("Dejavu-Bold", 15)
    canvas.drawString(RAND_X, HOEHE - 16.5 * mm, "VERA EVENTS")
    canvas.setFont("Dejavu", 9.5)
    canvas.drawRightString(
        BREITE - RAND_X, HOEHE - 16 * mm, "Sicher teilnehmen. Gemeinsam erleben."
    )

    canvas.setStrokeColor(CHAMPAGNER)
    canvas.setLineWidth(1.1)
    canvas.line(RAND_X, HOEHE - 28 * mm, BREITE - RAND_X, HOEHE - 28 * mm)

    canvas.setStrokeColor(LINIE)
    canvas.setLineWidth(0.6)
    canvas.line(RAND_X, 15 * mm, BREITE - RAND_X, 15 * mm)
    canvas.setFillColor(LEISE)
    canvas.setFont("Dejavu", 7.8)
    canvas.drawString(RAND_X, 11 * mm, FUSS_LINKS)
    canvas.drawRightString(
        BREITE - RAND_X,
        11 * mm,
        f"Seite {canvas.getPageNumber()} von 2 | Stand {STAND}",
    )

    canvas.restoreState()


def eingabetabelle(zeilen):
    """Label links auf Sand, rechts eine leere Schreibfläche."""
    daten = [[Paragraph(z, ZELLE_LABEL), ""] for z in zeilen]
    t = Table(daten, colWidths=[INHALT_BREITE * 0.42, INHALT_BREITE * 0.58], rowHeights=7.4 * mm)
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), SAND),
                ("BACKGROUND", (1, 0), (1, -1), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.6, LINIE),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    return t


def hervorgehoben(text, stilart=BLOCK):
    """Cremefarbener Kasten mit Goldrahmen — für zustimmungspflichtigen Text."""
    t = Table([[Paragraph(text, stilart)]], colWidths=[INHALT_BREITE])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), SAND),
                ("BOX", (0, 0), (-1, -1), 0.9, CHAMPAGNER),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return t


def definitionstabelle(zeilen):
    """Zwei Spalten: Begriff links auf Sand, Erläuterung rechts."""
    daten = [
        [Paragraph(begriff, ZELLE_LABEL), Paragraph(wert, ZELLE_WERT)] for begriff, wert in zeilen
    ]
    t = Table(daten, colWidths=[INHALT_BREITE * 0.26, INHALT_BREITE * 0.74], repeatRows=0)
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), SAND),
                ("BACKGROUND", (1, 0), (1, -1), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.6, LINIE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    return t


def ankreuzzeile(text):
    """Leeres Kästchen links, Text rechts — für die Einwilligung."""
    kasten = Table([[""]], colWidths=[4.5 * mm], rowHeights=[4.5 * mm])
    kasten.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), 0.8, TIEFBLAU)]))
    t = Table(
        [[kasten, Paragraph(text, stil("ankreuz", fontSize=8.6, leading=12))]],
        colWidths=[9 * mm, INHALT_BREITE - 9 * mm],
    )
    t.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (0, 0), "TOP"),
                ("VALIGN", (1, 0), (1, 0), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 1),
            ]
        )
    )
    return t


def unterschriftsfeld():
    t = Table(
        [
            ["", ""],
            [
                Paragraph("Ort, Datum", FLIESS_LEISE),
                Paragraph("Unterschrift der erziehungsberechtigten Person", FLIESS_LEISE),
            ],
        ],
        colWidths=[INHALT_BREITE * 0.45, INHALT_BREITE * 0.55],
        rowHeights=[9 * mm, 5.5 * mm],
    )
    t.setStyle(
        TableStyle(
            [
                ("LINEBELOW", (0, 0), (-1, 0), 0.8, TEXT),
                ("VALIGN", (0, 1), (-1, 1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 1), (-1, 1), 2),
            ]
        )
    )
    return t


# ── Der Wortlaut ─────────────────────────────────────────────────────
#
# Abschnitt 3 ist mit content/de.ts (AGB Ziffer 6 und 9.6) wörtlich
# abgestimmt. Am 22.09.2026 gestrichen: „ich bleibe erreichbar und hole
# es bei Bedarf ab". Minderjährige dürfen die Veranstaltung seither
# jederzeit selbstständig verlassen; VERA holt niemanden ab und
# beaufsichtigt niemanden bis zum Eintreffen der Eltern. Die
# Mobilnummer bleibt — aber ausdrücklich als Notfallkontakt.

EINVERSTAENDNIS = (
    "Ich bin damit einverstanden, dass mein oben genanntes Kind an der Veranstaltung "
    "teilnimmt. Ich bin erziehungsberechtigt und darf diese Erklärung abgeben; eine "
    "gegebenenfalls erforderliche Zustimmung einer weiteren sorgeberechtigten Person liegt "
    "vor. Mein Kind muss die Sicherheits-, Verhaltens- und Hausregeln sowie die Anweisungen "
    "des Personals beachten. Bei erheblichen oder wiederholten Regelverstößen kann es von "
    "der weiteren Teilnahme ausgeschlossen werden; ich werde darüber unter der oben "
    "angegebenen Mobilnummer informiert. "
    "<b>Mein Kind darf die Veranstaltung jederzeit selbstständig verlassen; eine Abmeldung "
    "ist dafür nicht erforderlich. VERA Events holt mein Kind nicht ab und beaufsichtigt es "
    "auch nicht bis zu meinem Eintreffen.</b> Für die Organisation des Hin- und Rückwegs "
    "bin ich verantwortlich. VERA Events übernimmt keine Aufsicht über mein Kind; es erhält "
    "vor dem ersten Spielen eine Sicherheitseinweisung und kann sich jederzeit an erkennbare "
    "Ansprechpersonen wenden. In einem Notfall dürfen Erste Hilfe geleistet sowie "
    "Rettungsdienst oder ärztliche Hilfe verständigt werden. Die gesetzliche Haftung von "
    "VERA Events bleibt unberührt."
)

GESUNDHEIT_EINWILLIGUNG = (
    "Ich willige ausdrücklich ein, dass die freiwillig eingetragenen Gesundheitsangaben zum "
    "Zweck der sicheren Veranstaltungsdurchführung und Notfallhilfe verarbeitet werden. Ich "
    "kann diese Einwilligung jederzeit für die Zukunft widerrufen. Ohne Einwilligung bitte "
    "dieses Feld leer lassen."
)

DATENSCHUTZ = [
    (
        "Verantwortlicher",
        "VERA Events, Inhaber Adam Lasarzik. Postanschrift siehe aktuelles Impressum unter "
        "veraevents.de/impressum. Kontakt: kontakt@veraevents.de.",
    ),
    (
        "Zwecke",
        "Entgegennahme des Formulars am Empfang, Organisation und Durchführung der "
        "Veranstaltung, Prüfung der Teilnahmeberechtigung Minderjähriger, Kontaktaufnahme "
        "während des Events, Sicherheit, Notfallhilfe und Dokumentation der erteilten "
        "Erklärung.",
    ),
    (
        "Rechtsgrundlagen",
        "Teilnahmebezogene Daten: Art. 6 Abs. 1 Buchst. b DSGVO. Erreichbarkeit, Sicherheit "
        "und Dokumentation: Art. 6 Abs. 1 Buchst. f DSGVO. In einem akuten Notfall "
        "gegebenenfalls Art. 6 Abs. 1 Buchst. d DSGVO. Freiwillige Gesundheitsangaben: "
        "ausdrückliche Einwilligung nach Art. 9 Abs. 2 Buchst. a in Verbindung mit Art. 6 "
        "Abs. 1 Buchst. a DSGVO; in einem akuten Notfall gegebenenfalls Art. 9 Abs. 2 "
        "Buchst. c DSGVO.",
    ),
    (
        "Empfänger",
        "Mitarbeiter der jeweiligen Veranstaltungslocation dürfen die Formulare am Empfang "
        "ausschließlich für VERA Events entgegennehmen, kurzfristig sicher verwahren und "
        "vollständig an VERA Events weitergeben. Die Location behält keine Kopie und "
        "verwendet die Angaben nicht für eigene Zwecke. Zugriff erhalten im Übrigen nur "
        "Personen, die die Daten für die Veranstaltungsdurchführung benötigen. Im Notfall "
        "können erforderliche Angaben an Rettungsdienst oder medizinisches Personal "
        "weitergegeben werden.",
    ),
    (
        "Speicherdauer",
        "Freiwillige Gesundheitsangaben werden grundsätzlich spätestens 7 Tage nach "
        "Veranstaltungsende gelöscht oder vernichtet. Übrige Angaben werden gelöscht, sobald "
        "sie für die genannten Zwecke nicht mehr erforderlich sind. Soweit die Erklärung zur "
        "Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen benötigt wird oder "
        "gesetzliche Aufbewahrungspflichten bestehen, erfolgt die Löschung erst nach Wegfall "
        "dieses Grundes.",
    ),
    (
        "Bereitstellung",
        "Die Pflichtangaben sind für die Teilnahme Minderjähriger erforderlich. "
        "Gesundheitsangaben und E-Mail-Adresse sind freiwillig. Ohne notwendige "
        "Pflichtangaben kann eine Teilnahme abgelehnt werden.",
    ),
    (
        "Rechte",
        "Es bestehen nach Maßgabe der DSGVO Rechte auf Auskunft, Berichtigung, Löschung, "
        "Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Eine "
        "Einwilligung kann jederzeit mit Wirkung für die Zukunft widerrufen werden. Die "
        "Rechtmäßigkeit der bis zum Widerruf erfolgten Verarbeitung bleibt unberührt.",
    ),
    (
        "Beschwerde",
        "Es besteht ein Beschwerderecht bei einer Datenschutzaufsichtsbehörde, insbesondere "
        "bei der Landesbeauftragten für den Datenschutz und für das Recht auf Akteneinsicht "
        "Brandenburg, Stahnsdorfer Damm 77, 14532 Kleinmachnow, "
        "Poststelle@LDA.Brandenburg.de.",
    ),
]


def bauen():
    doc = BaseDocTemplate(
        str(ZIEL),
        pagesize=A4,
        leftMargin=RAND_X,
        rightMargin=RAND_X,
        topMargin=RAND_OBEN,
        bottomMargin=RAND_UNTEN,
        title="Einverständniserklärung für minderjährige Teilnehmer",
        author="VERA Events",
        subject="Einverständniserklärung für minderjährige Teilnehmer",
    )
    rahmen = Frame(
        RAND_X,
        RAND_UNTEN,
        INHALT_BREITE,
        HOEHE - RAND_OBEN - RAND_UNTEN,
        leftPadding=0,
        rightPadding=0,
        topPadding=0,
        bottomPadding=0,
    )
    doc.addPageTemplates([PageTemplate(id="seite", frames=[rahmen], onPage=kopf_und_fuss)])

    inhalt = []

    # ── Seite 1: das Formular ────────────────────────────────────────
    inhalt.append(Paragraph("Einverständniserklärung für<br/>minderjährige Teilnehmer", H1))
    inhalt.append(Spacer(1, 2 * mm))
    inhalt.append(
        Paragraph(
            "Bitte vollständig ausfüllen, unterschreiben und spätestens beim Check-in abgeben. "
            "Die Online-Anmeldung allein ersetzt diese Erklärung nicht.",
            FLIESS_LEISE,
        )
    )

    inhalt.append(Spacer(1, 2.5 * mm))
    inhalt.append(Paragraph("1. Veranstaltung und Teilnehmer", H2))
    inhalt.append(Spacer(1, 1.5 * mm))
    inhalt.append(
        eingabetabelle(
            [
                "Veranstaltung / Ort",
                "Datum / Uhrzeit",
                "Vor- und Nachname des Kindes",
                "Geburtsdatum",
            ]
        )
    )

    inhalt.append(Spacer(1, 2.5 * mm))
    inhalt.append(Paragraph("2. Erziehungsberechtigte Person und Notfallkontakt", H2))
    inhalt.append(Spacer(1, 1.5 * mm))
    inhalt.append(
        eingabetabelle(
            [
                "Vor- und Nachname",
                "Mobilnummer während des Events (Notfallkontakt)",
                "E-Mail (optional)",
            ]
        )
    )

    inhalt.append(Spacer(1, 2.5 * mm))
    inhalt.append(Paragraph("3. Einverständnis", H2))
    inhalt.append(Spacer(1, 1.5 * mm))
    inhalt.append(hervorgehoben(EINVERSTAENDNIS))

    inhalt.append(Spacer(1, 2.5 * mm))
    inhalt.append(Paragraph("4. Freiwillige Gesundheitsangaben", H2))
    inhalt.append(Spacer(1, 1.5 * mm))
    inhalt.append(
        Paragraph(
            "Nur Angaben eintragen, die für eine sichere Teilnahme oder Hilfe im Notfall "
            "wirklich erforderlich sind (zum Beispiel schwere Allergie, relevante Erkrankung "
            "oder notwendiges Notfallmedikament):",
            FLIESS,
        )
    )
    inhalt.append(Spacer(1, 1.5 * mm))
    leerfeld = Table([[""]], colWidths=[INHALT_BREITE], rowHeights=[8 * mm])
    leerfeld.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), 0.6, LINIE)]))
    inhalt.append(leerfeld)
    inhalt.append(Spacer(1, 2 * mm))
    inhalt.append(ankreuzzeile(GESUNDHEIT_EINWILLIGUNG))

    inhalt.append(Spacer(1, 2.5 * mm))
    inhalt.append(
        KeepTogether(
            [
                Paragraph("5. Bestätigung und Unterschrift", H2),
                Spacer(1, 1.5 * mm),
                Paragraph(
                    "Mit meiner Unterschrift bestätige ich die Richtigkeit meiner Angaben, "
                    "mein Einverständnis mit den vorstehenden Punkten und den Erhalt der "
                    "Datenschutzinformation auf Seite 2. Diese Erklärung enthält keine "
                    "Einwilligung in Foto- oder Videoaufnahmen.",
                    FLIESS,
                ),
                Spacer(1, 4 * mm),
                unterschriftsfeld(),
            ]
        )
    )

    # ── Seite 2: Datenschutzinformation ──────────────────────────────
    inhalt.append(PageBreak())
    inhalt.append(Paragraph("Datenschutzinformation", H1))
    inhalt.append(Spacer(1, 2.5 * mm))
    inhalt.append(
        hervorgehoben(
            "Datenschutzinformation nach Art. 13 DSGVO<br/>"
            "Diese Information gilt für die Daten auf diesem Papierformular. Die allgemeine "
            "Datenschutzerklärung für die Webseite ist unter veraevents.de/datenschutz "
            "abrufbar.",
            FLIESS,
        )
    )
    inhalt.append(Spacer(1, 2.5 * mm))
    inhalt.append(definitionstabelle(DATENSCHUTZ))

    doc.build(inhalt)


if __name__ == "__main__":
    bauen()
    print(f"geschrieben: {ZIEL}")
