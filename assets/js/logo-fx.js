/* Header logo: continuous sound-ripple + periodic glitch bursts.
   The ripple idles gently, swells when the pointer moves across the logo,
   and every few seconds horizontal slices shear with red/cyan ghosts. */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const img = document.querySelector('.logo img');
  if (!img) return;

  function start() {
    const W = 191;
    const H = Math.max(1, Math.round(W * img.naturalHeight / img.naturalWidth));
    const PAD = 8;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    const canvas = document.createElement('canvas');
    canvas.width = W * DPR; canvas.height = (H + PAD * 2) * DPR;
    canvas.style.width = W + 'px'; canvas.style.height = (H + PAD * 2) + 'px';
    canvas.style.display = 'block';
    canvas.style.margin = `-${PAD}px 0`;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    img.replaceWith(canvas);

    // pre-tinted ghost copies (Safari has no ctx.filter)
    function tinted(color) {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const x = c.getContext('2d');
      x.drawImage(img, 0, 0);
      x.globalCompositeOperation = 'source-in';
      x.fillStyle = color;
      x.fillRect(0, 0, c.width, c.height);
      return c;
    }
    const RED = tinted('rgba(255,45,85,0.85)');
    const CYAN = tinted('rgba(0,200,255,0.85)');

    let t = 0, amp = 0, target = 0, lastX = null;
    const host = canvas.closest('a') || canvas;
    host.addEventListener('pointermove', e => {
      if (lastX !== null) target = Math.min(6, Math.abs(e.clientX - lastX) * .45 + 1.5);
      lastX = e.clientX;
    });
    host.addEventListener('pointerleave', () => { lastX = null; });

    let burstEnd = 0, nextBurst = performance.now() + 2200 + Math.random() * 2500;
    let bands = [];

    function drawRippled(src, dx, alpha) {
      const SL = 2;
      ctx.globalAlpha = alpha;
      for (let x = 0; x < W; x += SL) {
        const dy = Math.sin(x * .11 + t) * amp;
        ctx.drawImage(src, x / W * img.naturalWidth, 0, SL / W * img.naturalWidth, img.naturalHeight,
                      x + dx, PAD + dy, SL, H);
      }
      ctx.globalAlpha = 1;
    }

    function frame(now) {
      t += .14;
      // idle breathing + pointer swell, decaying
      const idle = .7 + Math.sin(t * .22) * .35;
      amp += (Math.max(idle, target) - amp) * .06;
      target *= .95;

      if (now >= nextBurst) {
        burstEnd = now + 230;
        nextBurst = now + 2800 + Math.random() * 3200;
        bands = [0, 1].map(() => {
          const y = Math.random() * (H - 10);
          return { y, h: 6 + Math.random() * (H * .3), dx: (Math.random() - .5) * 13 };
        });
      }
      const bursting = now < burstEnd;
      if (bursting && Math.random() < .4) {
        bands = bands.map(b => ({ ...b, dx: (Math.random() - .5) * 13 }));
      }

      ctx.clearRect(0, 0, W, H + PAD * 2);
      drawRippled(img, bursting && Math.random() < .3 ? (Math.random() - .5) * 3 : 0, 1);

      if (bursting) {
        const srcs = [RED, CYAN];
        bands.forEach((b, i) => {
          const sy = b.y / H * img.naturalHeight;
          const sh = b.h / H * img.naturalHeight;
          ctx.drawImage(srcs[i % 2], 0, sy, img.naturalWidth, sh,
                        b.dx, PAD + b.y, W, b.h);
        });
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  if (img.complete && img.naturalWidth) start();
  else img.addEventListener('load', start, { once: true });
})();
