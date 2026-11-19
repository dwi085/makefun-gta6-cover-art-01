// Vice Cover Studio — cover renderer.
// Draws multi-panel GTA-style poster art on a canvas: diagonal panel slices,
// sunset / neon colour grades, bold Anton caption lettering, retro sun and
// skyline silhouettes drawn in code. All original, no borrowed artwork.

export const LAYOUTS = {
  diagonal3: { name: "Diagonal 3", panels: ["hero", "street", "night"] },
  heroStrip: { name: "Hero Strip", panels: ["hero", "strip 1", "strip 2", "strip 3"] },
  split2: { name: "Split 2", panels: ["left", "right"] },
  quad4: { name: "Quad 4", panels: ["top-left", "top-right", "bottom-left", "bottom-right"] },
  poster: { name: "Poster", panels: ["full"] },
};

// Panel polygons as fractions of cover width/height, in draw order.
export function panelShapes(layout, W, H) {
  const x = (f) => f * W;
  const y = (f) => f * H;
  switch (layout) {
    case "heroStrip":
      // One big hero panel on top, then a strip of three small panels below.
      // The hero's bottom edge slopes gently; each strip top follows that
      // same line so the panels meet without gaps.
      return [
        { name: "Panel 1 — hero", poly: [[0, 0], [W, 0], [W, y(0.58)], [0, y(0.64)]] },
        { name: "Panel 2 — strip 1", poly: [[0, y(0.64)], [x(0.36), y(0.618)], [x(0.31), H], [0, H]] },
        { name: "Panel 3 — strip 2", poly: [[x(0.36), y(0.618)], [x(0.68), y(0.599)], [x(0.63), H], [x(0.31), H]] },
        { name: "Panel 4 — strip 3", poly: [[x(0.68), y(0.599)], [W, y(0.58)], [W, H], [x(0.63), H]] },
      ];
    case "split2":
      return [
        { name: "Panel 1 — left", poly: [[0, 0], [x(0.56), 0], [x(0.47), H], [0, H]] },
        { name: "Panel 2 — right", poly: [[x(0.56), 0], [W, 0], [W, H], [x(0.47), H]] },
      ];
    case "quad4":
      return [
        { name: "Panel 1 — top left", poly: [[0, 0], [x(0.52), 0], [x(0.47), y(0.52)], [0, y(0.48)]] },
        { name: "Panel 2 — top right", poly: [[x(0.52), 0], [W, 0], [W, y(0.48)], [x(0.47), y(0.52)]] },
        { name: "Panel 3 — bottom left", poly: [[0, y(0.48)], [x(0.47), y(0.52)], [x(0.52), H], [0, H]] },
        { name: "Panel 4 — bottom right", poly: [[x(0.47), y(0.52)], [W, y(0.48)], [W, H], [x(0.52), H]] },
      ];
    case "poster":
      return [{ name: "Panel 1 — full", poly: [[0, 0], [W, 0], [W, H], [0, H]] }];
    case "diagonal3":
    default:
      return [
        { name: "Panel 1 — hero", poly: [[0, 0], [W, 0], [W, y(0.55)], [0, y(0.63)]] },
        { name: "Panel 2 — street", poly: [[0, y(0.63)], [x(0.55), y(0.55)], [x(0.47), H], [0, H]] },
        { name: "Panel 3 — night", poly: [[x(0.55), y(0.55)], [W, y(0.55)], [W, H], [x(0.47), H]] },
      ];
  }
}

export function panelAt(layout, W, H, px, py) {
  const shapes = panelShapes(layout, W, H);
  for (let i = shapes.length - 1; i >= 0; i--) {
    if (pointInPoly(px, py, shapes[i].poly)) return i;
  }
  return 0;
}

function pointInPoly(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function polyBounds(poly) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [px, py] of poly) {
    minX = Math.min(minX, px); minY = Math.min(minY, py);
    maxX = Math.max(maxX, px); maxY = Math.max(maxY, py);
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function tracePoly(ctx, poly) {
  ctx.beginPath();
  ctx.moveTo(poly[0][0], poly[0][1]);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]);
  ctx.closePath();
}

// Colour grades: each is a list of [composite, gradient-stops] washes laid
// over the photos after they are drawn.
const GRADES = {
  sunset: [
    ["overlay", [[0, "rgba(255,110,40,0.30)"], [1, "rgba(255,40,110,0.34)"]]],
    ["multiply", [[0, "rgba(255,170,80,0.10)"], [1, "rgba(120,20,90,0.22)"]]],
  ],
  neon: [
    ["screen", [[0, "rgba(255,0,140,0.22)"], [0.5, "rgba(120,0,180,0.10)"], [1, "rgba(0,220,255,0.24)"]]],
    ["overlay", [[0, "rgba(0,200,255,0.16)"], [1, "rgba(255,0,160,0.20)"]]],
  ],
  dusk: [
    ["multiply", [[0, "rgba(70,30,140,0.30)"], [1, "rgba(20,40,120,0.34)"]]],
    ["screen", [[0, "rgba(255,120,200,0.10)"], [1, "rgba(80,120,255,0.16)"]]],
  ],
  gold: [
    ["overlay", [[0, "rgba(255,200,90,0.30)"], [1, "rgba(255,120,20,0.26)"]]],
    ["soft-light", [[0, "rgba(255,230,160,0.30)"], [1, "rgba(160,80,0,0.20)"]]],
  ],
  vice: [
    ["overlay", [[0, "rgba(255,0,160,0.30)"], [0.5, "rgba(140,0,200,0.18)"], [1, "rgba(0,220,255,0.26)"]]],
    ["multiply", [[0, "rgba(120,0,160,0.16)"], [1, "rgba(0,40,90,0.22)"]]],
  ],
};

function applyGrade(ctx, W, H, grade) {
  const washes = GRADES[grade] || GRADES.sunset;
  for (const [op, stops] of washes) {
    const g = ctx.createLinearGradient(0, 0, W * 0.35, H);
    for (const [at, color] of stops) g.addColorStop(at, color);
    ctx.save();
    ctx.globalCompositeOperation = op;
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  // Warm horizon glow, low in the frame.
  const glow = ctx.createRadialGradient(W * 0.72, H * 0.62, 0, W * 0.72, H * 0.62, W * 0.55);
  glow.addColorStop(0, "rgba(255,150,60,0.20)");
  glow.addColorStop(1, "rgba(255,150,60,0)");
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function drawPhotoInPanel(ctx, img, poly, cfg) {
  const b = polyBounds(poly);
  if (!img || !img.naturalWidth) return;
  const zoom = (cfg.zoom || 100) / 100;
  const scale = Math.max(b.w / img.naturalWidth, b.h / img.naturalHeight) * zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  // Wide panel + tall photo: anchor the crop on the photo's upper third, so a
  // person's face stays in frame instead of being cropped to their torso.
  // Near-square panels keep the classic centred crop.
  const panelAspect = b.w / b.h;
  const imgAspect = img.naturalWidth / img.naturalHeight;
  const anchorY = panelAspect > imgAspect * 1.6 ? 0.3 : 0.5;
  const anchorX = 0.5;
  const cx = b.x + b.w / 2 + (0.5 - anchorX) * dw + ((cfg.posX || 0) / 100) * b.w * 0.45;
  const cy = b.y + b.h / 2 + (0.5 - anchorY) * dh + ((cfg.posY || 0) / 100) * b.h * 0.45;
  ctx.save();
  tracePoly(ctx, poly);
  ctx.clip();
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
  // Per-panel warmth: positive warms, negative cools.
  const warm = cfg.warm || 0;
  if (warm !== 0) {
    ctx.globalCompositeOperation = warm > 0 ? "overlay" : "soft-light";
    ctx.fillStyle = warm > 0
      ? `rgba(255,140,40,${Math.min(0.45, Math.abs(warm) / 100)})`
      : `rgba(40,110,255,${Math.min(0.45, Math.abs(warm) / 100)})`;
    ctx.fillRect(b.x, b.y, b.w, b.h);
  }
  ctx.restore();
}

function drawPanelPlaceholder(ctx, poly, label, W) {
  const b = polyBounds(poly);
  const g = ctx.createLinearGradient(b.x, b.y, b.x + b.w, b.y + b.h);
  g.addColorStop(0, "#241a3d");
  g.addColorStop(1, "#120a24");
  ctx.save();
  tracePoly(ctx, poly);
  ctx.clip();
  ctx.fillStyle = g;
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 1;
  for (let i = -b.h; i < b.w; i += 46) {
    ctx.beginPath();
    ctx.moveTo(b.x + i, b.y + b.h);
    ctx.lineTo(b.x + i + b.h, b.y);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = `600 ${Math.max(18, W * 0.022)}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, b.x + b.w / 2, b.y + b.h / 2);
  ctx.restore();
}

// Retro sun with horizontal slits, drawn in code — no borrowed artwork.
// Rendered on a scratch canvas first, so the slits stay transparent and the
// photo shows through them instead of black holes.
function drawRetroSun(ctx, cx, cy, r) {
  const s = document.createElement("canvas");
  s.width = Math.ceil(r * 2) + 4;
  s.height = Math.ceil(r * 2) + 4;
  const sc = s.getContext("2d");
  const ox = s.width / 2;
  const oy = s.height / 2;
  const g = sc.createLinearGradient(ox, oy - r, ox, oy + r);
  g.addColorStop(0, "#ffd23c");
  g.addColorStop(0.55, "#ff7a18");
  g.addColorStop(1, "#ff2e88");
  sc.fillStyle = g;
  sc.beginPath();
  sc.arc(ox, oy, r, 0, Math.PI * 2);
  sc.fill();
  sc.globalCompositeOperation = "destination-out";
  let y = oy + r * 0.08;
  let h = r * 0.05;
  while (y < oy + r) {
    sc.fillRect(ox - r - 2, y, r * 2 + 4, h);
    y += h + r * 0.16;
    h *= 1.5;
  }
  ctx.drawImage(s, cx - s.width / 2, cy - s.height / 2);
}

// Simple skyline silhouette with lit windows, drawn in code.
function drawSkyline(ctx, W, H) {
  const base = H * 0.985;
  const heights = [0.05, 0.085, 0.06, 0.11, 0.07, 0.095, 0.055, 0.12, 0.065, 0.09, 0.05, 0.08];
  const bw = W / heights.length;
  ctx.save();
  ctx.fillStyle = "rgba(16,6,32,0.92)";
  heights.forEach((f, i) => {
    const h = f * H;
    ctx.fillRect(i * bw + 1, base - h, bw - 2, h + H * 0.02);
  });
  ctx.fillStyle = "rgba(255,201,60,0.85)";
  for (let i = 0; i < heights.length; i++) {
    const h = heights[i] * H;
    for (let wy = base - h + 6; wy < base - 8; wy += 14) {
      for (let wx = i * bw + 6; wx < (i + 1) * bw - 8; wx += 12) {
        if ((wx * 7 + wy * 13) % 5 < 2) ctx.fillRect(wx, wy, 3.5, 5);
      }
    }
  }
  ctx.restore();
}

// Palm tree silhouette, drawn in code: a leaning trunk and seven drooping
// fronds. Two of these flanking the caption band are the Vice City shorthand.
function drawPalm(ctx, x, baseY, h, lean) {
  const crownX = x + lean * h;
  const crownY = baseY - h;
  ctx.save();
  ctx.strokeStyle = "rgba(14,5,28,0.96)";
  ctx.fillStyle = "rgba(14,5,28,0.96)";
  ctx.lineCap = "round";
  // Trunk: three tapering strokes along one curve so it narrows to the crown.
  const segs = 3;
  for (let s = 0; s < segs; s++) {
    const t0 = s / segs, t1 = (s + 1) / segs;
    const px0 = x + lean * h * t0 * t0, py0 = baseY - h * t0;
    const px1 = x + lean * h * t1 * t1, py1 = baseY - h * t1;
    ctx.lineWidth = Math.max(2.5, h * 0.055 * (1 - t0 * 0.55));
    ctx.beginPath();
    ctx.moveTo(px0, py0);
    ctx.quadraticCurveTo(px0 + lean * h * 0.08, (py0 + py1) / 2, px1, py1);
    ctx.stroke();
  }
  // Fronds: six thick arcs fanning out from the crown, bowing up first and
  // then drooping at the tips — the droop is what reads as "palm", not a star.
  ctx.lineWidth = Math.max(2.5, h * 0.032);
  const fronds = 6;
  for (let i = 0; i < fronds; i++) {
    const a = ((-165 + (i / (fronds - 1)) * 150) * Math.PI) / 180;
    const len = h * (0.44 + 0.18 * Math.sin((i / (fronds - 1)) * Math.PI));
    const mx = crownX + Math.cos(a) * len * 0.5;
    const my = crownY + Math.sin(a) * len * 0.5 - len * 0.14;
    const ex = crownX + Math.cos(a) * len;
    const ey = crownY + Math.sin(a) * len * 0.55 + len * 0.42;
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(mx, my, ex, ey);
    ctx.stroke();
  }
  // Coconuts under the crown.
  ctx.beginPath();
  ctx.arc(crownX - h * 0.02, crownY + h * 0.03, h * 0.028, 0, Math.PI * 2);
  ctx.arc(crownX + h * 0.035, crownY + h * 0.04, h * 0.024, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

let grainTile = null;
function grainPattern(ctx) {
  if (grainTile) return grainTile;
  const t = document.createElement("canvas");
  t.width = 140;
  t.height = 140;
  const tc = t.getContext("2d");
  const data = tc.createImageData(140, 140);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = Math.floor(Math.random() * 255);
    data.data[i] = v; data.data[i + 1] = v; data.data[i + 2] = v; data.data[i + 3] = 26;
  }
  tc.putImageData(data, 0, 0);
  grainTile = ctx.createPattern(t, "repeat");
  return grainTile;
}

function titleFill(ctx, W, H, style) {
  switch (style) {
    case "white": return "#ffffff";
    case "neon": {
      const g = ctx.createLinearGradient(0, H * 0.8, 0, H);
      g.addColorStop(0, "#ff7ad9"); g.addColorStop(1, "#ff2e88");
      return g;
    }
    case "gold": {
      const g = ctx.createLinearGradient(0, H * 0.8, 0, H);
      g.addColorStop(0, "#ffe98a"); g.addColorStop(0.5, "#ffc93c"); g.addColorStop(1, "#ff7a18");
      return g;
    }
    case "sunset":
    default: {
      const g = ctx.createLinearGradient(0, H * 0.78, 0, H * 0.99);
      g.addColorStop(0, "#fff3b0"); g.addColorStop(0.45, "#ff9a3c"); g.addColorStop(1, "#ff2e88");
      return g;
    }
  }
}

function drawCaption(ctx, W, H, state) {
  const title = (state.title || "").toUpperCase().trim();
  const sub = (state.subtitle || "").toUpperCase().trim();
  const scale = W / 1080;
  const bandH = Math.round(H * 0.16);
  const bandY = H - bandH;

  // Scrim so lettering reads over any photo.
  const scrim = ctx.createLinearGradient(0, bandY - H * 0.05, 0, H);
  scrim.addColorStop(0, "rgba(10,4,24,0)");
  scrim.addColorStop(0.35, "rgba(10,4,24,0.55)");
  scrim.addColorStop(1, "rgba(10,4,24,0.82)");
  ctx.save();
  ctx.fillStyle = scrim;
  ctx.fillRect(0, bandY - H * 0.05, W, H * 0.21);
  ctx.restore();

  // Subtitle sits at a fixed distance from the bottom; the title is stacked
  // above it, so the two can never overlap at any aspect ratio.
  const subSize = Math.round(26 * scale);
  const subY = H - Math.round(30 * scale);
  let size = Math.round((state.titleSize || 118) * scale);

  if (title) {
    ctx.save();
    ctx.font = `${size}px Anton, "Arial Black", sans-serif`;
    // Shrink the title until it fits the cover width.
    const maxW = W * 0.96;
    const tw = ctx.measureText(title).width;
    if (tw > maxW) {
      size = Math.floor(size * (maxW / tw));
      ctx.font = `${size}px Anton, "Arial Black", sans-serif`;
    }
    const titleCenterY = subY - Math.round(16 * scale) - size / 2;
    ctx.translate(W / 2, titleCenterY);
    ctx.rotate(-0.035);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = Math.max(4, size * 0.07);
    ctx.strokeStyle = "#12081c";
    ctx.lineJoin = "round";
    // Retro hard offset: a solid copy of the title shifted down-right first,
    // so the lettering pops off the photo like a poster. The offset colour
    // contrasts the fill — cyan behind neon pink, hot pink behind the rest.
    ctx.save();
    ctx.shadowColor = "transparent";
    ctx.fillStyle = state.titleColor === "neon" ? "#2ee6ff" : "#ff2e88";
    ctx.fillText(title, size * 0.045, size * 0.05);
    ctx.restore();
    ctx.strokeText(title, 0, 0);
    ctx.fillStyle = titleFill(ctx, W, H, state.titleColor);
    ctx.fillText(title, 0, 0);
    ctx.restore();
  }

  if (sub) {
    ctx.save();
    ctx.font = `600 ${subSize}px system-ui, sans-serif`;
    try { ctx.letterSpacing = `${Math.round(7 * scale)}px`; } catch (e) { /* older canvas */ }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = Math.max(3, 5 * scale);
    ctx.strokeStyle = "rgba(10,4,24,0.9)";
    ctx.lineJoin = "round";
    ctx.strokeText(sub, W / 2, subY);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(sub, W / 2, subY);
    ctx.restore();
  }
}

// The main render. state: { layout, grade, title, subtitle, titleSize,
// titleColor, grain, frames, panels: [{ photo: Image|null, zoom, posX, posY, warm }] }
export function renderCover(canvas, W, H, state) {
  const ctx = canvas.getContext("2d");
  canvas.width = W;
  canvas.height = H;
  ctx.fillStyle = "#120a24";
  ctx.fillRect(0, 0, W, H);

  const shapes = panelShapes(state.layout || "diagonal3", W, H);
  shapes.forEach((shape, i) => {
    const cfg = (state.panels && state.panels[i]) || {};
    if (cfg.photo) drawPhotoInPanel(ctx, cfg.photo, shape.poly, cfg);
    else drawPanelPlaceholder(ctx, shape.poly, "ADD A PHOTO", W);
  });

  applyGrade(ctx, W, H, state.grade || "sunset");

  // Gentle vignette for depth before the graphic elements go on.
  const vg = ctx.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.42, W / 2, H * 0.5, Math.max(W, H) * 0.72);
  vg.addColorStop(0, "rgba(10,4,24,0)");
  vg.addColorStop(1, "rgba(10,4,24,0.30)");
  ctx.save();
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // Retro sun, big and placed where a face rarely is. Wide hero layouts get
  // the top-right corner (sky in most photos); split and quad layouts get
  // the panel-seam centre, where four photo edges meet and no face sits.
  // A corner sun crossed a face in the right panel of split2/quad4, and a
  // seam sun crossed foreheads in diagonal3's lower panels — each layout
  // keeps the anchor that proved clean for it.
  const sunAnchors = {
    diagonal3: [0.88, 0.12, 0.11],
    heroStrip: [0.88, 0.12, 0.11],
    split2: [0.5, 0.5, 0.12],
    quad4: [0.5, 0.5, 0.11],
    poster: [0.84, 0.16, 0.1],
  };
  const [sx, sy, sr] = sunAnchors[state.layout || "diagonal3"] || sunAnchors.diagonal3;
  const sunR = Math.round(Math.min(W, H) * sr);
  const sunGlow = ctx.createRadialGradient(W * sx, H * sy, 0, W * sx, H * sy, sunR * 2.4);
  sunGlow.addColorStop(0, "rgba(255,120,60,0.42)");
  sunGlow.addColorStop(1, "rgba(255,120,60,0)");
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = sunGlow;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  drawRetroSun(ctx, W * sx, H * sy, sunR);

  if (state.frames !== false) {
    ctx.save();
    ctx.lineWidth = Math.max(5, W * 0.006);
    ctx.strokeStyle = "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = W * 0.008;
    ctx.shadowOffsetY = W * 0.003;
    for (const shape of shapes) {
      tracePoly(ctx, shape.poly);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawSkyline(ctx, W, H);

  // Palm silhouettes flanking the caption band, short enough to stay clear
  // of the title and subtitle text.
  drawPalm(ctx, W * 0.045, H * 1.005, H * 0.2, 0.3);
  drawPalm(ctx, W * 0.955, H * 1.005, H * 0.22, -0.3);

  drawCaption(ctx, W, H, state);

  if (state.grain !== false) {
    ctx.save();
    ctx.globalCompositeOperation = "overlay";
    ctx.fillStyle = grainPattern(ctx);
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  return canvas;
}

export function exportCover(state, W, H) {
  const canvas = document.createElement("canvas");
  return renderCover(canvas, W, H, state);
}
