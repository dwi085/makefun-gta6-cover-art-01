// Neon Nights cover renderer — draws a GTA-style multi-panel cover on a canvas.
// The look is Vice after dark: a starry night sky, a lit downtown skyline, a glowing
// neon grid floor, and tilted photo panels under a big chrome title. No photo is ever
// uploaded anywhere; everything is drawn locally from images the user loaded.
export const SIZES = {
  square: [1080, 1080],
  portrait: [1080, 1350],
  wide: [1920, 1080],
};

export const LOOKS = {
  neon: {
    label: 'Neon Nights',
    skyTop: '#05010f', skyBottom: '#2a0a4a', glow: '#ff2e88',
    accentA: '#ff2e88', accentB: '#22e6ff', grid: '#ff2e88',
    titleTop: '#ffffff', titleMid: '#ff9ecf', titleBottom: '#22e6ff',
    panelEdge: '#22e6ff', gradeA: '#ff2e88', gradeB: '#22e6ff',
    floorTop: '#1c0533', floorBottom: '#05010f', building: '#0a0518',
  },
  ultra: {
    label: 'Ultraviolet',
    skyTop: '#0a0118', skyBottom: '#3b0a63', glow: '#b14bff',
    accentA: '#c44bff', accentB: '#ff3df0', grid: '#b14bff',
    titleTop: '#ffffff', titleMid: '#d9a7ff', titleBottom: '#ff3df0',
    panelEdge: '#e07bff', gradeA: '#8b2ff5', gradeB: '#ff3df0',
    floorTop: '#20073d', floorBottom: '#0a0118', building: '#0d0419',
  },
  dusk: {
    label: 'Chrome Dusk',
    skyTop: '#0a0208', skyBottom: '#4a1200', glow: '#ff7a18',
    accentA: '#ff7a18', accentB: '#2de2c5', grid: '#ff7a18',
    titleTop: '#ffffff', titleMid: '#ffd9a0', titleBottom: '#2de2c5',
    panelEdge: '#ffc46b', gradeA: '#ff7a18', gradeB: '#2de2c5',
    floorTop: '#2a0d05', floorBottom: '#0a0208', building: '#12040a',
  },
};

export const LAYOUTS = {
  diagonal: 'Diagonal Split',
  duo: 'Duo Stack',
  bleed: 'Full Bleed',
};

// Tiny deterministic random source so a cover renders the same way every time.
export function seededRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function nightSky(ctx, W, H, look, rand) {
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.62);
  sky.addColorStop(0, look.skyTop);
  sky.addColorStop(1, look.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H * 0.62);
  // Stars, denser near the top of the frame.
  for (let i = 0; i < 110; i++) {
    const x = rand() * W;
    const y = Math.pow(rand(), 1.6) * H * 0.52;
    const r = 0.6 + rand() * 1.7;
    ctx.globalAlpha = 0.25 + rand() * 0.65;
    ctx.fillStyle = rand() > 0.85 ? look.accentB : '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, (r / 1080) * W, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // Low neon haze hugging the horizon.
  const haze = ctx.createRadialGradient(W * 0.5, H * 0.6, 0, W * 0.5, H * 0.6, W * 0.62);
  haze.addColorStop(0, look.glow + '55');
  haze.addColorStop(1, look.glow + '00');
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, W, H * 0.66);
}

function skyline(ctx, W, H, look, rand) {
  const horizon = H * 0.6;
  let x = -W * 0.02;
  ctx.fillStyle = look.building;
  while (x < W * 1.02) {
    const bw = W * (0.04 + rand() * 0.075);
    const bh = H * (0.06 + rand() * 0.2);
    const top = horizon - bh;
    ctx.fillRect(x, top, bw, bh);
    // Rooftop antenna on a few towers.
    if (rand() > 0.72) {
      ctx.fillRect(x + bw * 0.45, top - H * 0.03, W * 0.004, H * 0.03);
      ctx.fillStyle = look.accentA;
      ctx.beginPath();
      ctx.arc(x + bw * 0.45 + W * 0.002, top - H * 0.032, (2.2 / 1080) * W, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = look.building;
    }
    // Lit windows: a sparse seeded scatter inside the tower.
    const cols = Math.max(2, Math.floor(bw / (W * 0.016)));
    const rows = Math.max(2, Math.floor(bh / (H * 0.022)));
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (rand() > 0.62) {
          ctx.globalAlpha = 0.35 + rand() * 0.55;
          ctx.fillStyle = rand() > 0.8 ? look.accentB : '#ffd9a0';
          ctx.fillRect(x + (c + 0.25) * (bw / cols), top + (r + 0.3) * (bh / rows), W * 0.006, H * 0.008);
        }
      }
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = look.building;
    x += bw + W * (0.004 + rand() * 0.012);
  }
}

function neonGrid(ctx, W, H, look) {
  const horizon = H * 0.6;
  const floor = ctx.createLinearGradient(0, horizon, 0, H);
  floor.addColorStop(0, look.floorTop);
  floor.addColorStop(1, look.floorBottom);
  ctx.fillStyle = floor;
  ctx.fillRect(0, horizon, W, H - horizon);
  // Horizon glow line.
  ctx.save();
  ctx.shadowColor = look.grid;
  ctx.shadowBlur = (18 / 1080) * W;
  ctx.strokeStyle = look.grid;
  ctx.lineWidth = Math.max(2, W * 0.003);
  ctx.beginPath();
  ctx.moveTo(0, horizon);
  ctx.lineTo(W, horizon);
  ctx.stroke();
  ctx.restore();
  // Perspective rails fanning out from the vanishing point.
  const vpX = W * 0.5;
  ctx.strokeStyle = look.grid;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = Math.max(1, W * 0.0016);
  for (let i = -9; i <= 9; i++) {
    const bx = vpX + (i / 9) * W * 1.15;
    ctx.beginPath();
    ctx.moveTo(vpX + (i / 9) * W * 0.06, horizon);
    ctx.lineTo(bx, H);
    ctx.stroke();
  }
  // Cross lines, packed tighter near the horizon and wider toward the viewer.
  for (let s = 0; s < 8; s++) {
    const t = s / 7;
    const y = horizon + (H - horizon) * t * t;
    ctx.globalAlpha = 0.18 + t * 0.5;
    ctx.lineWidth = Math.max(1, W * (0.001 + t * 0.002));
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// Draws one photo into a tilted panel: cover-fit crop with the user's zoom and pan,
// a neon colour grade, a vignette, and a glowing neon frame.
function photoPanel(ctx, img, rect, angle, zoom, panX, panY, look, W, H) {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.rect(-rect.w / 2, -rect.h / 2, rect.w, rect.h);
  ctx.clip();
  if (img && img.naturalWidth > 0) {
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const base = Math.max(rect.w / iw, rect.h / ih) * zoom;
    const dw = iw * base;
    const dh = ih * base;
    ctx.drawImage(img, -dw / 2 + panX * rect.w, -dh / 2 + panY * rect.h, dw, dh);
    // Neon grade: warm wash from one corner, cool wash from the other.
    ctx.globalCompositeOperation = 'overlay';
    const wash = ctx.createLinearGradient(-rect.w / 2, -rect.h / 2, rect.w / 2, rect.h / 2);
    wash.addColorStop(0, look.gradeA + '44');
    wash.addColorStop(1, look.gradeB + '44');
    ctx.fillStyle = wash;
    ctx.fillRect(-rect.w / 2, -rect.h / 2, rect.w, rect.h);
    ctx.globalCompositeOperation = 'source-over';
    // Vignette so the panel edges fall off into the night.
    const vig = ctx.createRadialGradient(0, 0, Math.min(rect.w, rect.h) * 0.32, 0, 0, Math.max(rect.w, rect.h) * 0.72);
    vig.addColorStop(0, '#00000000');
    vig.addColorStop(1, '#00000066');
    ctx.fillStyle = vig;
    ctx.fillRect(-rect.w / 2, -rect.h / 2, rect.w, rect.h);
  } else {
    const ph = ctx.createLinearGradient(-rect.w / 2, -rect.h / 2, rect.w / 2, rect.h / 2);
    ph.addColorStop(0, look.skyBottom);
    ph.addColorStop(1, look.floorTop);
    ctx.fillStyle = ph;
    ctx.fillRect(-rect.w / 2, -rect.h / 2, rect.w, rect.h);
    ctx.fillStyle = '#ffffffcc';
    ctx.font = `700 ${Math.round(rect.h * 0.07)}px Anton, "Arial Black", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ADD A PHOTO', 0, 0);
  }
  ctx.restore();
  // Neon frame drawn unrotated around the same tilted rect.
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.shadowColor = look.panelEdge;
  ctx.shadowBlur = (16 / 1080) * W;
  ctx.strokeStyle = look.panelEdge;
  ctx.lineWidth = Math.max(3, W * 0.004);
  ctx.strokeRect(-rect.w / 2, -rect.h / 2, rect.w, rect.h);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#ffffff55';
  ctx.lineWidth = Math.max(1, W * 0.001);
  ctx.strokeRect(-rect.w / 2 + W * 0.006, -rect.h / 2 + W * 0.006, rect.w - W * 0.012, rect.h - W * 0.012);
  ctx.restore();
}

function halftoneCorner(ctx, W, H, look, rand) {
  // A field of fading dots in the top-right sky, a print-poster texture.
  ctx.save();
  const step = W * 0.028;
  for (let gy = 0; gy < 7; gy++) {
    for (let gx = 0; gx < 9; gx++) {
      const x = W - W * 0.03 - gx * step;
      const y = H * 0.03 + gy * step;
      const d = Math.hypot(gx, gy) / 11;
      const r = Math.max(0.4, (1 - d) * (4.4 / 1080) * W * (0.7 + rand() * 0.6));
      ctx.globalAlpha = 0.5 * (1 - d);
      ctx.fillStyle = look.accentA;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function fitTitleFont(ctx, text, maxW, startPx) {
  let px = startPx;
  ctx.font = `${px}px Anton, "Arial Black", sans-serif`;
  while (px > 28 && ctx.measureText(text).width > maxW) {
    px -= 4;
    ctx.font = `${px}px Anton, "Arial Black", sans-serif`;
  }
  return px;
}

function titleBlock(ctx, W, H, look, state, centered) {
  const title = (state.title || 'NEON NIGHTS').toUpperCase();
  const kicker = (state.kicker || 'AFTER DARK IN VICE').toUpperCase();
  const maxW = W * 0.9;
  const titlePx = fitTitleFont(ctx, title, maxW, Math.round(W * 0.115));
  const titleY = H * (state.layout === 'bleed' ? 0.88 : 0.9);
  const kickerPx = Math.max(13, Math.round(W * 0.021));
  const tx = centered ? W / 2 : W * 0.055;
  ctx.save();
  ctx.textAlign = centered ? 'center' : 'left';
  // Kicker with flanking rules.
  ctx.font = `700 ${kickerPx}px "Arial Narrow", Arial, sans-serif`;
  try { ctx.letterSpacing = `${Math.round(W * 0.006)}px`; } catch (e) { /* older canvas: ignore */ }
  ctx.fillStyle = look.accentA;
  ctx.textBaseline = 'alphabetic';
  const kickerY = titleY - titlePx * 1.02;
  ctx.fillText(kicker, tx, kickerY);
  const kw = ctx.measureText(kicker).width;
  ctx.strokeStyle = look.accentA;
  ctx.lineWidth = Math.max(1.5, W * 0.0018);
  const ruleGap = W * 0.02;
  const ruleY = kickerY - kickerPx * 0.35;
  if (centered) {
    ctx.beginPath();
    ctx.moveTo(tx - kw / 2 - ruleGap - W * 0.07, ruleY);
    ctx.lineTo(tx - kw / 2 - ruleGap, ruleY);
    ctx.moveTo(tx + kw / 2 + ruleGap, ruleY);
    ctx.lineTo(tx + kw / 2 + ruleGap + W * 0.07, ruleY);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(tx + kw + ruleGap, ruleY);
    ctx.lineTo(tx + kw + ruleGap + W * 0.09, ruleY);
    ctx.stroke();
  }
  try { ctx.letterSpacing = '0px'; } catch (e) { /* older canvas: ignore */ }
  // Chrome title: bright gradient, dark outline, neon glow, slight forward lean.
  ctx.translate(tx, titleY);
  ctx.transform(1, 0, -0.06, 1, 0, 0);
  ctx.textBaseline = 'alphabetic';
  ctx.font = `${titlePx}px Anton, "Arial Black", sans-serif`;
  const chrome = ctx.createLinearGradient(0, -titlePx * 0.85, 0, titlePx * 0.12);
  chrome.addColorStop(0, look.titleTop);
  chrome.addColorStop(0.45, look.titleMid);
  chrome.addColorStop(0.55, look.titleTop);
  chrome.addColorStop(1, look.titleBottom);
  ctx.shadowColor = look.accentB;
  ctx.shadowBlur = (22 / 1080) * W;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#0a0212';
  ctx.lineWidth = Math.max(3, W * 0.007);
  ctx.strokeText(title, 0, 0);
  ctx.shadowBlur = 0;
  ctx.fillStyle = chrome;
  ctx.fillText(title, 0, 0);
  // Thin hot edge along the top of the letters.
  ctx.strokeStyle = '#ffffff88';
  ctx.lineWidth = Math.max(1, W * 0.0012);
  ctx.strokeText(title, 0, -titlePx * 0.02);
  ctx.restore();
  // Small corner tag, top-left.
  ctx.save();
  ctx.font = `700 ${Math.max(12, Math.round(W * 0.016))}px "Arial Narrow", Arial, sans-serif`;
  ctx.fillStyle = '#ffffffd9';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('VOL. 06 — VICE', W * 0.045, H * 0.055);
  ctx.fillStyle = look.accentB;
  ctx.fillRect(W * 0.045, H * 0.062, W * 0.05, Math.max(2, H * 0.004));
  ctx.restore();
}

function scanlines(ctx, W, H) {
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = '#000000';
  for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
  ctx.restore();
}

// state: { title, kicker, look, layout, size, photos: [{img, zoom, x, y}, ...] }
export function drawCover(canvas, state) {
  const [W, H] = SIZES[state.size] || SIZES.square;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const look = LOOKS[state.look] || LOOKS.neon;
  const rand = seededRandom(20261120);
  nightSky(ctx, W, H, look, rand);
  skyline(ctx, W, H, look, rand);
  neonGrid(ctx, W, H, look);
  const A = state.photos && state.photos[0];
  const B = state.photos && state.photos[1];
  if (state.layout === 'bleed') {
    if (A && A.img) {
      ctx.save();
      const iw = A.img.naturalWidth;
      const ih = A.img.naturalHeight;
      const base = Math.max(W / iw, H / ih) * (A.zoom || 1);
      const dw = iw * base;
      const dh = ih * base;
      ctx.drawImage(A.img, (W - dw) / 2 + (A.x || 0) * W * 0.2, (H - dh) / 2 + (A.y || 0) * H * 0.2, dw, dh);
      ctx.restore();
      ctx.globalCompositeOperation = 'overlay';
      const wash = ctx.createLinearGradient(0, 0, W, H);
      wash.addColorStop(0, look.gradeA + '33');
      wash.addColorStop(1, look.gradeB + '33');
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
    }
    const shade = ctx.createLinearGradient(0, H * 0.45, 0, H);
    shade.addColorStop(0, '#00000000');
    shade.addColorStop(1, '#000000b8');
    ctx.fillStyle = shade;
    ctx.fillRect(0, H * 0.45, W, H * 0.55);
    titleBlock(ctx, W, H, look, state, true);
  } else if (state.layout === 'duo') {
    photoPanel(ctx, A && A.img, { x: W * 0.05, y: H * 0.1, w: W * 0.43, h: H * 0.44 }, -0.035, (A && A.zoom) || 1, (A && A.x) || 0, (A && A.y) || 0, look, W, H);
    photoPanel(ctx, B && B.img, { x: W * 0.52, y: H * 0.1, w: W * 0.43, h: H * 0.44 }, 0.035, (B && B.zoom) || 1, (B && B.x) || 0, (B && B.y) || 0, look, W, H);
    titleBlock(ctx, W, H, look, state, false);
  } else {
    // Diagonal Split: one big tilted panel up-left, a second overlapping down-right.
    photoPanel(ctx, B && B.img, { x: W * 0.4, y: H * 0.42, w: W * 0.55, h: H * 0.4 }, 0.045, (B && B.zoom) || 1, (B && B.x) || 0, (B && B.y) || 0, look, W, H);
    photoPanel(ctx, A && A.img, { x: W * 0.05, y: H * 0.08, w: W * 0.62, h: H * 0.5 }, -0.06, (A && A.zoom) || 1, (A && A.x) || 0, (A && A.y) || 0, look, W, H);
    titleBlock(ctx, W, H, look, state, false);
  }
  halftoneCorner(ctx, W, H, look, seededRandom(77));
  scanlines(ctx, W, H);
  // Outer frame.
  ctx.save();
  ctx.strokeStyle = look.accentA + '99';
  ctx.lineWidth = Math.max(3, W * 0.004);
  ctx.strokeRect(W * 0.012, H * 0.012, W * 0.976, H * 0.976);
  ctx.restore();
  return canvas;
}

// Renders a fresh full-size canvas for export; the preview reuses drawCover directly.
export function renderCover(state) {
  return drawCover(document.createElement('canvas'), state);
}
