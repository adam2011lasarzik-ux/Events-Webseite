# Video im Hero-Bereich

Hier liegt das Video, das oben rechts auf der Startseite läuft.

## So schaltest du es ein

1. Lege die Videodatei in diesen Ordner, z. B. `padel-hero.mp4`
2. Trage sie in `content/events.ts` ein:

```ts
export const heroVideo: string | null = "/videos/padel-hero.mp4";
```

Steht dort `null`, erscheint stattdessen die Court-Grafik mit dem
Platzhalter-Hinweis. Sonst muss nichts angepasst werden.

## Anforderungen an die Datei

**Format: MP4 mit H.264.** Das spielt jeder Browser ab.

Nicht geeignet ist HEVC/H.265 (oft die Voreinstellung beim iPhone,
Dateiendung `.mov`): Auf iPhone und iPad läuft das zwar einwandfrei,
in Chrome und Firefox bleibt der Bereich aber leer. Beim Export also
auf „H.264" oder „Höchste Kompatibilität" achten, nicht auf
„Hohe Effizienz".

Sinnvolle Werte:

- Auflösung: 720p reicht völlig, mehr bringt hier nichts
- Länge: 5 bis 15 Sekunden
- Dateigröße: möglichst unter 5 MB, damit die Seite auf dem Handy
  schnell lädt
- Ton: wird ohnehin stumm abgespielt und kann entfernt werden

## Wie es sich verhält

Das Video startet automatisch, sobald der Bereich sichtbar wird, läuft
**genau einmal** durch und wiederholt sich nicht. Erst wenn man
weggescrollt hat und zurückkommt, beginnt es wieder von vorn. Es hat
keinen Ton und keine Bedienelemente.

Wer im Gerät „Bewegung reduzieren" eingeschaltet hat, bekommt das Video
nicht automatisch gestartet und sieht das erste Bild.
