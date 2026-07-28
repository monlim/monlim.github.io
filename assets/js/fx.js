/* Cursor-following animation, one effect chosen at random per page view.
   Modes: landmarks | data | warp | wave
   Force one with ?fx=warp (or #fx=warp) for testing. */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'fx';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const BLUE = '#002AF5';
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0;
  function resize() {
    W = innerWidth; H = innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize(); addEventListener('resize', resize);

  const ptr = { x: innerWidth / 2, y: innerHeight / 2, speed: 0, moved: false, seen: false };
  function track(x, y) {
    ptr.speed = Math.hypot(x - ptr.x, y - ptr.y);
    ptr.x = x; ptr.y = y;
    ptr.moved = true; ptr.seen = true;
  }
  addEventListener('pointermove', e => track(e.clientX, e.clientY), { passive: true });
  addEventListener('touchmove', e => track(e.touches[0].clientX, e.touches[0].clientY), { passive: true });

  // ---------- landmarks ----------
  const dots = [];
  function landmarks(dt) {
    if (ptr.moved && ptr.speed > 1) {
      for (let i = 0; i < Math.min(2 + ptr.speed / 8, 5); i++) {
        dots.push({
          x: ptr.x + (Math.random() - .5) * 26, y: ptr.y + (Math.random() - .5) * 26,
          vx: (Math.random() - .5) * .5, vy: (Math.random() - .5) * .5,
          life: 1, id: Math.floor(Math.random() * 21)
        });
      }
    }
    for (let i = dots.length - 1; i >= 0; i--) {
      const d = dots[i];
      d.x += d.vx; d.y += d.vy; d.life -= dt / 1.25;
      if (d.life <= 0) dots.splice(i, 1);
    }
    ctx.lineWidth = 1;
    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        const a = dots[i], b = dots[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < 70) {
          ctx.strokeStyle = `rgba(0,42,245,${0.5 * Math.min(a.life, b.life) * (1 - dist / 70)})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    ctx.font = '9px "Source Code Pro", monospace';
    for (const d of dots) {
      ctx.fillStyle = `rgba(0,42,245,${d.life})`;
      ctx.beginPath(); ctx.arc(d.x, d.y, 2.4, 0, 7); ctx.fill();
      if (d.id < 6) ctx.fillText(d.id, d.x + 5, d.y - 4);
    }
  }

  // ---------- data ----------
  const GLYPHS = '01{}<>/=+*#$%&?!;:~^|10♪♫▪▫∆†';
  const glyphs = [];
  function data(dt) {
    if (ptr.moved && ptr.speed > 1) {
      for (let i = 0; i < Math.min(1 + ptr.speed / 6, 4); i++) {
        glyphs.push({
          c: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
          x: ptr.x + (Math.random() - .5) * 18, y: ptr.y + (Math.random() - .5) * 18,
          vy: .35 + Math.random() * .8, life: 1, s: 10 + Math.random() * 6
        });
      }
    }
    for (let i = glyphs.length - 1; i >= 0; i--) {
      const g = glyphs[i];
      g.y += g.vy; g.life -= dt / 1.4;
      if (g.life <= 0) glyphs.splice(i, 1);
    }
    for (const g of glyphs) {
      ctx.font = g.s + 'px "Courier Prime", monospace';
      ctx.fillStyle = g.life > .5 ? `rgba(0,42,245,${g.life})` : `rgba(100,100,100,${g.life})`;
      ctx.fillText(g.c, g.x, g.y);
    }
  }

  // ---------- warp ----------
  const soft = { x: innerWidth / 2, y: innerHeight / 2 };
  function warp() {
    if (!ptr.seen) return;              // stay invisible until the pointer exists
    soft.x += (ptr.x - soft.x) * .12;
    soft.y += (ptr.y - soft.y) * .12;
    const STEP = 44, SEG = 10, SIGMA = 110, F = 34;
    ctx.strokeStyle = 'rgba(0,42,245,0.14)';
    ctx.lineWidth = 1;
    const bend = (x, y) => {
      const dx = x - soft.x, dy = y - soft.y;
      const d2 = dx * dx + dy * dy;
      const f = F * Math.exp(-d2 / (2 * SIGMA * SIGMA));
      const d = Math.sqrt(d2) || 1;
      return [x + dx / d * f, y + dy / d * f];
    };
    for (let gx = 0; gx <= W; gx += STEP) {
      ctx.beginPath();
      for (let y = 0; y <= H + SEG; y += SEG) {
        const [bx, by] = bend(gx, y);
        y === 0 ? ctx.moveTo(bx, by) : ctx.lineTo(bx, by);
      }
      ctx.stroke();
    }
    for (let gy = 0; gy <= H; gy += STEP) {
      ctx.beginPath();
      for (let x = 0; x <= W + SEG; x += SEG) {
        const [bx, by] = bend(x, gy);
        x === 0 ? ctx.moveTo(bx, by) : ctx.lineTo(bx, by);
      }
      ctx.stroke();
    }
  }

  // ---------- wave ----------
  const trail = [];
  let t = 0;
  function wave(dt) {
    t += dt;
    if (ptr.moved) trail.push({ x: ptr.x, y: ptr.y, v: ptr.speed });
    if (trail.length > 90) trail.shift();
    if (trail.length < 3) return;
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = BLUE;
    ctx.beginPath();
    for (let i = 0; i < trail.length; i++) {
      const p = trail[i];
      const age = i / trail.length;
      const amp = Math.min(p.v, 30) * .5 * age;
      const y = p.y + Math.sin(i * .8 + t * 9) * amp;
      i === 0 ? ctx.moveTo(p.x, y) : ctx.lineTo(p.x, y);
    }
    ctx.globalAlpha = .9; ctx.stroke(); ctx.globalAlpha = 1;
    const last = trail[trail.length - 1];
    ctx.fillStyle = BLUE;
    ctx.fillRect(last.x - 3, last.y - 3, 6, 6);
  }

  // ---------- pick one per page view ----------
  const fns = { landmarks, data, warp, wave };
  const names = Object.keys(fns);
  const forced = (location.search + location.hash).match(/fx=(landmarks|data|warp|wave)/);
  const mode = forced ? forced[1] : names[Math.floor(Math.random() * names.length)];

  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, .05);
    last = now;
    ctx.clearRect(0, 0, W, H);
    fns[mode](dt);
    ptr.moved = false;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
