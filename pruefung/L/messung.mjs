/* Fließende Responsiv-Messung.
   ------------------------------------------------------------------
   Bisher wurde an ein paar festen Breiten geprüft. Das findet nur, was
   zufällig genau dort bricht. Hier wird das Fenster in 10-Pixel-
   Schritten von 320 bis 1920 verändert und nach JEDEM Schritt neu
   gemessen.

   Der Trick: Die Seite wird EINMAL geladen, danach nur noch die
   Fenstergröße verändert. Umbrüche sind reines CSS und richten sich
   nach der Fensterbreite — ein Neuladen bringt nichts und würde die
   Messung hundertfach verlangsamen.

   Vier Messungen, nicht eine:
     1. seitliches Scrollen  — lässt sich die Seite schieben?
     2. abgeschnittene Inhalte — steht etwas über seinem Kasten hinaus
        UND wird weggeschnitten? Genau das fehlte bisher; so ist die
        abgeschnittene Wortmarke im Fuß lange unbemerkt geblieben.
     3. Überlappungen — decken sich zwei Textelemente im normalen Fluss?
     4. Tippziele und Schriftgrößen auf Touch-Breiten.
   ------------------------------------------------------------------ */
export const MESSUNG = `(() => {
  const d = document.documentElement;
  const sichtbar = d.clientWidth;
  const funde = [];

  const merke = (art, el, zusatz) => {
    const kl = (el.className || "").toString().replace(/[A-Za-z]+-module__\\w+__/g, "").trim();
    funde.push({ art, tag: el.tagName, klasse: kl.slice(0, 40),
      text: (el.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 45), ...zusatz });
  };

  // ── 1. Seitliches Scrollen ────────────────────────────────────
  const vorher = window.scrollX;
  window.scrollTo(9999, window.scrollY);
  const geschoben = window.scrollX;
  window.scrollTo(vorher, window.scrollY);
  if (geschoben > 0) funde.push({ art: "scrollt", px: geschoben });

  /* Absicht ist kein Fehler. Vier Dinge bleiben draußen:

       - Text nur für Screenreader (auf 1 Pixel geklemmt) und der
         Honigtopf gegen Bots (weit außerhalb des Bildes) — beides
         gehört so.
       - Zierschichten mit aria-hidden: Verläufe über Fotos, Court-
         Linien, der Ball in der Preiskachel. Die ragen mit Absicht
         über ihren Kasten hinaus und werden mit Absicht beschnitten.
       - Inhalte in einem ZUGEKLAPPTEN <details>: Der Browser meldet
         dafür weiter Kästen an derselben Stelle. Sie sind unsichtbar,
         sähen in der Messung aber wie ein Stapel Überlappungen aus. */
  const versteckt = (el) => {
    if (el.getAttribute("aria-hidden") === "true") return true;
    if (el.closest("[aria-hidden='true']")) return true;
    const zu = el.closest("details:not([open])");
    if (zu && !zu.querySelector("summary")?.contains(el)) return true;
    const r = el.getBoundingClientRect();
    // Auf 1 Pixel geklemmt oder aus dem Bild geschoben.
    if (r.width <= 2 && r.height <= 2) return true;
    if (r.right < -500 || r.left > window.innerWidth + 2000) return true;
    return false;
  };

  const alle = [...document.querySelectorAll("body *")].filter((el) => {
    if (["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "HEAD"].includes(el.tagName)) return false;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return false;
    return !versteckt(el);
  });

  /* Ragt nur eine ABSOLUT positionierte Zierschicht über den Kasten
     hinaus, ist das kein abgeschnittener Inhalt. Deshalb wird nicht
     scrollWidth genommen (das zählt alles mit), sondern die äußerste
     Kante der Kinder IM NORMALEN FLUSS. */
  const flussKanten = (el) => {
    let rechts = 0, unten = 0;
    const r = el.getBoundingClientRect();
    for (const k of el.children) {
      const ks = getComputedStyle(k);
      if (ks.position === "absolute" || ks.position === "fixed") continue;
      if (versteckt(k)) continue;
      const kr = k.getBoundingClientRect();
      if (kr.width === 0 && kr.height === 0) continue;
      rechts = Math.max(rechts, kr.right - r.left);
      unten = Math.max(unten, kr.bottom - r.top);
    }
    // Blätter: der eigene Inhalt zählt.
    if (el.children.length === 0) { rechts = el.scrollWidth; unten = el.scrollHeight; }
    return { rechts, unten };
  };

  for (const el of alle) {
    const s = getComputedStyle(el);

    // ── 2. Abgeschnittene Inhalte ───────────────────────────────
    // Nur zählen, wenn der Überlauf auch WEGGESCHNITTEN wird. Ist er
    // scrollbar, kann man ihn erreichen — das ist kein Fehler.
    const schneidetX = s.overflowX === "hidden" || s.overflowX === "clip";
    const schneidetY = s.overflowY === "hidden" || s.overflowY === "clip";
    if (schneidetX || schneidetY) {
      const kante = flussKanten(el);
      if (schneidetX && kante.rechts > el.clientWidth + 2) {
        merke("abgeschnitten-quer", el, { inhalt: Math.round(kante.rechts), kasten: el.clientWidth });
      }
      // Fotos in einem Rahmen mit fester Höhe sind Absicht (object-fit).
      const nurBild = el.children.length === 1 &&
        ["IMG", "VIDEO", "PICTURE", "SVG"].includes(el.children[0].tagName);
      if (schneidetY && !nurBild && el.clientHeight > 0 && kante.unten > el.clientHeight + 2) {
        merke("abgeschnitten-hoch", el, { inhalt: Math.round(kante.unten), kasten: el.clientHeight });
      }
    }

    // Ragt ein Element über den rechten Fensterrand hinaus, obwohl
    // irgendein Vorfahr abschneidet? Dann ist es unsichtbar weg.
    const r = el.getBoundingClientRect();
    if (r.right > sichtbar + 1 || r.left < -1) {
      // Zierschichten sind hier schon aussortiert (siehe „versteckt").
      let p = el.parentElement, versteckt = false;
      while (p) {
        const ps = getComputedStyle(p);
        if (ps.overflowX === "hidden" || ps.overflowX === "clip") {
          const pr = p.getBoundingClientRect();
          if (r.right > pr.right + 1 || r.left < pr.left - 1) { versteckt = true; break; }
        }
        p = p.parentElement;
      }
      if (versteckt) merke("ragt-heraus", el, { rechts: Math.round(r.right), rand: sichtbar });
    }
  }

  // ── 3. Überlappungen ──────────────────────────────────────────
  // Nur Elemente im normalen Fluss, die selbst Text tragen. Absolut
  // positionierte Zierschichten (Verläufe über Fotos, Court-Linien)
  // überlappen mit Absicht und bleiben draußen.
  const kandidaten = alle.filter((el) => {
    const s = getComputedStyle(el);
    if (s.position === "absolute" || s.position === "fixed" || s.position === "sticky") return false;
    // nur Blätter mit sichtbarem Text
    if (el.children.length > 0) return false;
    return (el.textContent || "").trim().length > 0;
  });

  for (let i = 0; i < kandidaten.length; i += 1) {
    const a = kandidaten[i].getBoundingClientRect();
    for (let j = i + 1; j < kandidaten.length; j += 1) {
      const b = kandidaten[j].getBoundingClientRect();
      const breite = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const hoehe = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      // 2 Pixel Toleranz: Zeilenkästen berühren sich normal.
      if (breite > 2 && hoehe > 2) {
        funde.push({ art: "ueberlappt",
          eins: (kandidaten[i].textContent || "").trim().slice(0, 30),
          zwei: (kandidaten[j].textContent || "").trim().slice(0, 30),
          quer: Math.round(breite), hoch: Math.round(hoehe) });
      }
    }
  }

  // ── 4. Tippziele und Schriftgrößen ────────────────────────────
  if (sichtbar <= 820) {
    const ziele = [...document.querySelectorAll("a, button, input, select, textarea, summary")]
      .filter((el) => {
        const s = getComputedStyle(el);
        if (s.display === "none" || s.visibility === "hidden" || s.opacity === "0") return false;
        if (el.type === "hidden") return false;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return false;
        return !versteckt(el);
      });

    for (const el of ziele) {
      const r = el.getBoundingClientRect();
      /* Maßstab ist die Regel aus WCAG 2.2 (24 × 24 Pixel) — mit der
         dort vorgesehenen Ausnahme: Ein zu kleines Ziel ist in Ordnung,
         solange genug ABSTAND zum nächsten Ziel bleibt. Ein Textlink in
         einer Liste ist naturgemäß nur so hoch wie seine Zeile; er wird
         trotzdem sicher getroffen, wenn darüber und darunter Luft ist.
         Ohne diese Ausnahme meldete die Prüfung jeden Fußzeilen-Link
         als Fehler und man sähe die echten nicht mehr. */
      if (r.height < 24 || r.width < 24) {
        const mx = (r.left + r.right) / 2, my = (r.top + r.bottom) / 2;
        let zuNah = false;
        for (const anderes of ziele) {
          if (anderes === el) continue;
          const a = anderes.getBoundingClientRect();
          const ax = (a.left + a.right) / 2, ay = (a.top + a.bottom) / 2;
          if (Math.hypot(mx - ax, my - ay) < 24) { zuNah = true; break; }
        }
        if (zuNah) {
          merke("tippziel-eng", el, { breit: Math.round(r.width), hoch: Math.round(r.height) });
        }
      }
      const gr = parseFloat(getComputedStyle(el).fontSize);
      if (gr && gr < 12 && (el.textContent || "").trim()) {
        merke("schrift-klein", el, { px: Math.round(gr * 10) / 10 });
      }
    }
  }

  return funde;
})()`;
