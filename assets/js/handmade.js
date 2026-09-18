/* Handmade layer.
   1. The menu and the category banners are knocked out of line, re-rolled on
      every page load, so neither is laid out twice the same way.
   2. Interface marks — the active nav item, the buttons — are drawn as
      wobbling strokes rather than boxes and rules. Each stroke is generated
      fresh and drawn twice, the way a pen goes round a word a second time.
   Both (1) are desktop only: a rotated full-bleed banner would overhang the
   viewport, and on a phone the menu already wraps onto four rows with no room
   to spare. */
(() => {
  const rnd = (a, b) => a + Math.random() * (b - a);
  const wide = () => matchMedia('(min-width: 801px)').matches;

  // ---------- 1a. the menu out of line ----------
  // Top-level items only: WORKS is wrapped in .has-menu, which carries its
  // dropdown along with it.
  const navItems = document.querySelectorAll('.nav > a, .nav > .has-menu');
  if (navItems.length && wide()) {
    navItems.forEach(el => {
      el.style.transform = `translateY(${rnd(-14, 14).toFixed(1)}px)`;
      el.style.marginLeft = Math.round(rnd(0, 18)) + 'px';
      // The transform gives this item its own stacking context; lift it so
      // the WORKS dropdown stays above the page. Set here as well as in the
      // stylesheet so a stale cached style.css can't reintroduce the bug.
      if (el.classList.contains('has-menu')) el.style.zIndex = '50';
    });
  }

  // ---------- 1b. banners out of line ----------
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
  // A mark is positioned against its host, so the host must be a positioning
  // context. Don't rely on the stylesheet for that: a browser holding a stale
  // style.css would drop every mark into the top-left corner of the page.
  function anchor(el) {
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
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

  // A boxed-in label: each edge wobbles and overshoots at the corners, the way
  // a pen does when you box something in by hand.
  function roughRect(w, h, inset, wobble) {
    const x0 = inset, y0 = inset, x1 = w - inset, y1 = h - inset, over = 3.5;
    const edge = (ax, ay, bx, by) => {
      const pts = [];
      for (let i = 0; i <= 4; i++) pts.push([ax + (bx - ax) * i / 4, ay + (by - ay) * i / 4]);
      return roughPath(pts, wobble);
    };
    return [edge(x0 - over, y0, x1 + over, y0), edge(x1, y0 - over, x1, y1 + over),
            edge(x1 + over, y1, x0 - over, y1), edge(x0, y1 + over, x0, y0 - over)].join(' ');
  }

  function drawnBox(el) {
    el.querySelectorAll('svg[data-mark]').forEach(s => s.remove());
    const r = el.getBoundingClientRect();
    if (!r.width) return;
    anchor(el);
    const pad = 7;
    const w = Math.round(r.width) + pad * 2, h = Math.round(r.height) + pad * 2;
    const s = makeSvg(w, h, `position:absolute;left:${-pad}px;top:${-pad}px;width:${w}px;height:${h}px`);
    stroke(s, roughRect(w, h, 3, 1.5), 1.6);
    stroke(s, roughRect(w, h, 5.5, 2.1), 1.0);
    el.appendChild(s);
    if (!el.dataset.boxBound) {            // re-scribble when pointed at
      el.dataset.boxBound = '1';
      el.addEventListener('pointerenter', () => drawnBox(el));
    }
  }

  function circleNav(el) {
    const r = el.getBoundingClientRect();
    if (!r.width) return;
    anchor(el);
    // generous vertical overshoot, or a wide short link reads as a flat lens
    const padX = 10, padY = 15;
    const w = r.width + padX * 2, h = r.height + padY * 2;
    const s = makeSvg(w, h, `position:absolute;left:${-padX}px;top:${-padY}px;width:${w}px;height:${h}px`);
    stroke(s, roughEllipse(w / 2, h / 2, w / 2 - 3, h / 2 - 3, 1.7), 1.6);
    stroke(s, roughEllipse(w / 2, h / 2, w / 2 - 5, h / 2 - 5, 2.3), 1.1);
    el.appendChild(s);
    el.style.background = 'none';               // retire the grey chip
  }

  function drawMarks() {
    document.querySelectorAll('[data-mark]').forEach(s => s.remove());
    const active = document.querySelector('.nav a.active');
    if (active) circleNav(active);
    document.querySelectorAll('.contact-form button, .photo-band .btn').forEach(drawnBox);
  }

  // Metrics change once the webfonts land and whenever the window resizes.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawMarks);
  else drawMarks();

  let t = null;
  addEventListener('resize', () => { clearTimeout(t); t = setTimeout(drawMarks, 180); });
})();
