/* Handmade layer.
   1. Category banners are knocked fractionally out of line, re-rolled on every
      page load, so the stack is never laid out twice the same way.
   2. Interface marks — the active nav item, press headings — are drawn as
      wobbling strokes rather than boxes and rules. Each stroke is generated
      fresh and drawn twice, the way a pen goes round a word a second time.
   Desktop only for the banners: a rotated full-bleed block would overhang the
   viewport, and the phone layout has no room for indents. */
(() => {
  const rnd = (a, b) => a + Math.random() * (b - a);
  const wide = () => matchMedia('(min-width: 801px)').matches;

  // ---------- 1. banners out of line ----------
  const banners = document.querySelectorAll('.banner-list .banner');
  if (banners.length && wide()) {
    banners.forEach(b => {
      b.style.marginLeft = rnd(1, 12).toFixed(1) + '%';
      b.style.marginRight = rnd(1, 12).toFixed(1) + '%';
      b.style.transform = `rotate(${rnd(-0.6, 0.6).toFixed(2)}deg)`;
    });
  }

  // ---------- 2. drawn marks ----------
  const NS = 'http://www.w3.org/2000/svg';

  function roughPath(pts, wobble) {
    return pts.map((p, i) =>
      (i ? 'L ' : 'M ') + (p[0] + rnd(-wobble, wobble)).toFixed(1)
      + ' ' + (p[1] + rnd(-wobble, wobble)).toFixed(1)).join(' ');
  }
  function roughEllipse(cx, cy, rx, ry, wobble) {
    const pts = [], start = rnd(-0.4, 0.4);
    for (let a = start; a <= Math.PI * 2 + start + 0.5; a += 0.28) {
      pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    return roughPath(pts, wobble);
  }
  function makeSvg(w, h, css) {
    const s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', `0 0 ${w} ${h}`);
    s.setAttribute('aria-hidden', 'true');
    s.dataset.mark = '1';
    s.style.cssText = css + ';overflow:visible;pointer-events:none';
    return s;
  }
  function stroke(parent, d, width) {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d);
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke', 'currentColor');   // follows the text colour
    p.setAttribute('stroke-width', width);
    p.setAttribute('stroke-linecap', 'round');
    parent.appendChild(p);
  }

  function circleNav(el) {
    const r = el.getBoundingClientRect();
    if (!r.width) return;
    // generous vertical overshoot, or a wide short link reads as a flat lens
    const padX = 10, padY = 15;
    const w = r.width + padX * 2, h = r.height + padY * 2;
    const s = makeSvg(w, h, `position:absolute;left:${-padX}px;top:${-padY}px;width:${w}px;height:${h}px`);
    stroke(s, roughEllipse(w / 2, h / 2, w / 2 - 3, h / 2 - 3, 1.7), 1.6);
    stroke(s, roughEllipse(w / 2, h / 2, w / 2 - 5, h / 2 - 5, 2.3), 1.1);
    el.appendChild(s);
    el.style.background = 'none';               // retire the grey chip
  }

  // Underline the words, not the column: a block heading is far wider than its
  // text, so measure the text run itself.
  function underline(el) {
    const range = document.createRange();
    range.selectNodeContents(el);
    const rects = range.getClientRects();
    if (!rects.length) return;
    const line = rects[rects.length - 1];        // last line, if it wrapped
    const host = el.getBoundingClientRect();
    const w = Math.round(line.width), h = 12;
    if (w < 20) return;
    const left = Math.round(line.left - host.left);
    const top = Math.round(line.bottom - host.top);
    const s = makeSvg(w, h, `position:absolute;left:${left}px;top:${top}px;width:${w}px;height:${h}px`);
    stroke(s, roughPath([[1, 4], [w * .28, 4], [w * .61, 4], [w - 1, 4]], 2.0), 1.6);
    stroke(s, roughPath([[5, 6.8], [w * .47, 6.8], [w - 5, 6.8]], 2.6), 1.0);
    el.appendChild(s);
  }

  function drawMarks() {
    document.querySelectorAll('[data-mark]').forEach(s => s.remove());
    const active = document.querySelector('.nav a.active');
    if (active) circleNav(active);
    document.querySelectorAll('.press h2').forEach(underline);
  }

  // Metrics change once the webfonts land and whenever the window resizes.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawMarks);
  else drawMarks();

  let t = null;
  addEventListener('resize', () => { clearTimeout(t); t = setTimeout(drawMarks, 180); });
})();
