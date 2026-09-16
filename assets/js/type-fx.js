/* Redaction decay.
   The wordmark's letters drift through the typeface's halftone grades on their
   own clocks; titles decay while hovered. Every element is pinned to the width
   of its widest grade first, because the grades are NOT metrically identical
   (they vary by a few px) — without pinning, decaying text would shift or
   re-wrap. Replaces the old logo-fx.js. */
(() => {
  const GRADES = ['Redaction', 'Redaction 20', 'Redaction 35',
                  'Redaction 50', 'Redaction 70', 'Redaction 100'];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = matchMedia('(hover: hover)').matches;

  const face = g => `"${g}", Georgia, serif`;

  // Measure the element's text in every grade and freeze the box at the widest.
  async function pin(el) {
    const cs = getComputedStyle(el);
    const probe = document.createElement('span');
    probe.style.cssText = `position:absolute;left:-9999px;top:0;visibility:hidden;
      white-space:nowrap;font-size:${cs.fontSize};font-weight:${cs.fontWeight};
      letter-spacing:${cs.letterSpacing};text-transform:${cs.textTransform}`;
    probe.textContent = el.textContent;
    document.body.appendChild(probe);
    let max = 0;
    for (const g of GRADES) {
      try { await document.fonts.load(`${cs.fontSize} "${g}"`); } catch (e) { /* keep going */ }
      probe.style.fontFamily = face(g);
      max = Math.max(max, probe.getBoundingClientRect().width);
    }
    probe.remove();
    // Only reserve the width — never touch display. Forcing inline-block here
    // silently turned the stacked works links into a two-column grid.
    if (max > 0) el.style.minWidth = Math.ceil(max) + 'px';
  }

  // ---------- header wordmark ----------
  async function wordmark() {
    const el = document.querySelector('.logo-type');
    if (!el) return;
    const text = el.dataset.word || el.textContent.trim();
    el.textContent = '';
    const rnd = (a, b) => a + Math.random() * (b - a);
    const letters = [...text].map(ch => {
      const s = document.createElement('span');
      s.textContent = ch === ' ' ? ' ' : ch;
      if (ch !== ' ') {
        // Knocked slightly out of line, re-rolled every page load. Applied
        // before pinning below, so the reserved widths account for it.
        s.style.transform = `rotate(${rnd(-3, 3).toFixed(2)}deg) `
          + `translateY(${rnd(-0.04, 0.04).toFixed(3)}em)`;
        s.style.fontSize = (1 + rnd(-0.06, 0.06)).toFixed(3) + 'em';
      }
      el.appendChild(s);
      return s;
    });
    await document.fonts.ready;
    for (const s of letters) await pin(s);
    if (reduced) return;
    letters.forEach((s, i) => {
      if (s.textContent === ' ') return;
      let g = Math.floor(Math.random() * GRADES.length);
      const step = () => {
        g = (g + 1) % GRADES.length;
        s.style.fontFamily = face(GRADES[g]);
      };
      // Show movement quickly, then settle into the slower staggered rhythm.
      // Waiting the full interval for the first change meant several seconds of
      // apparent stillness on a phone, where measuring the letters takes longer.
      setTimeout(() => {
        step();
        setInterval(step, 1500 + i * 220 + Math.random() * 400);
      }, 200 + i * 110 + Math.random() * 250);
    });
  }

  // ---------- titles decay while hovered ----------
  async function hoverDecay() {
    if (!canHover || reduced) return;
    const els = document.querySelectorAll(
      '.works-list a, .work-head .title, .banner .label .title');
    if (!els.length) return;
    await document.fonts.ready;
    for (const el of els) {
      await pin(el);
      let i = 0, timer = null;
      const step = dir => {
        clearInterval(timer);
        timer = setInterval(() => {
          i += dir;
          if (i <= 0) { i = 0; clearInterval(timer); }
          if (i >= GRADES.length - 1) { i = GRADES.length - 1; clearInterval(timer); }
          el.style.fontFamily = face(GRADES[i]);
        }, 65);
      };
      const target = el.closest('.banner') || el;
      target.addEventListener('pointerenter', () => step(1));
      target.addEventListener('pointerleave', () => step(-1));
    }
  }

  wordmark();
  hoverDecay();
})();
