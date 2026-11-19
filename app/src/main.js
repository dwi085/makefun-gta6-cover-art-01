// Vice Cover Studio — editor wiring: photos, panels, controls, export.
// Photos are read on the user's own machine (FileReader / object URLs) and
// never uploaded anywhere; the app makes zero network requests.

import { renderCover, exportCover, panelShapes, panelAt } from "./cover.js";

const $ = (id) => document.getElementById(id);
const preview = $("preview");

const state = {
  layout: "diagonal3",
  grade: "sunset",
  title: "SUNSET HEIST",
  subtitle: "VICE CITY · SUMMER 2026",
  titleSize: 118,
  titleColor: "sunset",
  grain: true,
  frames: true,
  size: "1080x1080",
  selected: 0,
  panels: [
    { photo: 0, zoom: 105, posX: 0, posY: 0, warm: 0 },
    { photo: 1, zoom: 110, posX: 0, posY: 0, warm: 0 },
    { photo: 0, zoom: 125, posX: 0, posY: -8, warm: 10 },
  ],
};

// Loaded photos: { img: HTMLImageElement, name: string, url: string }
const photos = [];
let fontReady = false;

function currentSize() {
  const [w, h] = state.size.split("x").map(Number);
  return { w, h };
}

function renderState() {
  const { w, h } = currentSize();
  const panels = panelShapes(state.layout, w, h).map((shape, i) => {
    const cfg = state.panels[i] || { photo: null, zoom: 100, posX: 0, posY: 0, warm: 0 };
    return { ...cfg, photo: cfg.photo == null ? null : (photos[cfg.photo] || {}).img || null };
  });
  renderCover(preview, w, h, { ...state, panels });
}

function renderSoon() {
  requestAnimationFrame(renderState);
}

function setStatus(msg) {
  $("status").textContent = msg;
}

function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, name: file.name || "photo", url });
    img.onerror = () => reject(new Error("Could not read " + (file.name || "photo")));
    img.src = url;
  });
}

async function addPhotos(fileList) {
  const files = [...fileList].filter((f) => f.type.startsWith("image/"));
  if (!files.length) { setStatus("Pick an image file to add a photo."); return; }
  let added = 0;
  for (const file of files) {
    try {
      photos.push(await loadImageFile(file));
      added++;
    } catch (e) { setStatus(e.message); }
  }
  if (added) {
    // Fill any empty panel slots with the new photos.
    const shapes = panelShapes(state.layout, 1080, 1080);
    shapes.forEach((_, i) => {
      if (state.panels[i] && state.panels[i].photo == null) {
        state.panels[i].photo = photos.length - added + (i % added);
      }
    });
    buildPhotoStrip();
    renderSoon();
    setStatus(`Added ${added} photo${added > 1 ? "s" : ""}. Click a panel, then a thumbnail, to place it.`);
  }
}

async function loadSamples() {
  setStatus("Loading sample photos…");
  for (const name of ["boulevard.jpg", "pier.jpg"]) {
    if (photos.some((p) => p.name === name)) continue;
    try {
      const res = await fetch(`./samples/${name}`);
      const blob = await res.blob();
      photos.push(await loadImageFile(new File([blob], name, { type: blob.type || "image/jpeg" })));
    } catch (e) { setStatus("Sample photos could not load: " + e.message); return; }
  }
  buildPhotoStrip();
  renderSoon();
  setStatus("Sample photos loaded — pick a panel, then a thumbnail.");
}

function buildPhotoStrip() {
  const strip = $("photoStrip");
  strip.innerHTML = "";
  if (!photos.length) {
    const p = document.createElement("p");
    p.className = "none";
    p.textContent = "No photos yet — add one, or try the samples.";
    strip.appendChild(p);
    return;
  }
  photos.forEach((p, i) => {
    const thumb = document.createElement("img");
    thumb.src = p.url;
    thumb.alt = p.name;
    thumb.title = p.name;
    if (state.panels[state.selected] && state.panels[state.selected].photo === i) thumb.classList.add("on");
    thumb.addEventListener("click", () => {
      state.panels[state.selected].photo = i;
      buildPhotoStrip();
      renderSoon();
    });
    strip.appendChild(thumb);
  });
}

function syncPanelControls() {
  const shapes = panelShapes(state.layout, 1080, 1080);
  const i = Math.min(state.selected, shapes.length - 1);
  state.selected = i;
  const cfg = state.panels[i] || { photo: null, zoom: 100, posX: 0, posY: 0, warm: 0 };
  $("panelName").textContent = shapes[i].name;
  $("zoomRange").value = cfg.zoom;
  $("posXRange").value = cfg.posX;
  $("posYRange").value = cfg.posY;
  $("warmRange").value = cfg.warm;
  buildPhotoStrip();
}

function ensurePanels() {
  const n = panelShapes(state.layout, 1080, 1080).length;
  while (state.panels.length < n) {
    state.panels.push({ photo: photos.length ? (state.panels.length % photos.length) : null, zoom: 110, posX: 0, posY: 0, warm: 0 });
  }
  state.panels.length = n;
  if (state.selected >= n) state.selected = 0;
}

// ---- Controls -------------------------------------------------------------
$("photoInput").addEventListener("change", (e) => addPhotos(e.target.files));
$("sampleBtn").addEventListener("click", loadSamples);

$("layoutSeg").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-layout]");
  if (!btn) return;
  state.layout = btn.dataset.layout;
  for (const b of $("layoutSeg").querySelectorAll("button")) b.classList.toggle("on", b === btn);
  ensurePanels();
  syncPanelControls();
  renderSoon();
});

$("gradeSelect").addEventListener("change", (e) => { state.grade = e.target.value; renderSoon(); });
$("titleInput").addEventListener("input", (e) => { state.title = e.target.value; renderSoon(); });
$("subInput").addEventListener("input", (e) => { state.subtitle = e.target.value; renderSoon(); });
$("titleSize").addEventListener("input", (e) => { state.titleSize = Number(e.target.value); renderSoon(); });
$("titleColor").addEventListener("change", (e) => { state.titleColor = e.target.value; renderSoon(); });
$("grainToggle").addEventListener("change", (e) => { state.grain = e.target.checked; renderSoon(); });
$("frameToggle").addEventListener("change", (e) => { state.frames = e.target.checked; renderSoon(); });
$("sizeSelect").addEventListener("change", (e) => { state.size = e.target.value; renderSoon(); });

function bindPanelRange(id, key) {
  $(id).addEventListener("input", (e) => {
    const cfg = state.panels[state.selected];
    if (cfg) cfg[key] = Number(e.target.value);
    renderSoon();
  });
}
bindPanelRange("zoomRange", "zoom");
bindPanelRange("posXRange", "posX");
bindPanelRange("posYRange", "posY");
bindPanelRange("warmRange", "warm");

// Click a panel on the cover to select it.
preview.addEventListener("click", (e) => {
  const rect = preview.getBoundingClientRect();
  const { w, h } = currentSize();
  const px = ((e.clientX - rect.left) / rect.width) * w;
  const py = ((e.clientY - rect.top) / rect.height) * h;
  state.selected = panelAt(state.layout, w, h, px, py);
  syncPanelControls();
});

// ---- Export ---------------------------------------------------------------
function downloadPNG(canvas, filename) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error("Export failed")); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      resolve(blob.size);
    }, "image/png");
  });
}

async function exportNow() {
  const { w, h } = currentSize();
  setStatus("Rendering PNG…");
  try {
    const panels = panelShapes(state.layout, w, h).map((shape, i) => {
      const cfg = state.panels[i] || { photo: null, zoom: 100, posX: 0, posY: 0, warm: 0 };
      return { ...cfg, photo: cfg.photo == null ? null : (photos[cfg.photo] || {}).img || null };
    });
    const canvas = exportCover({ ...state, panels }, w, h);
    const bytes = await downloadPNG(canvas, `vice-cover-${w}x${h}.png`);
    setStatus(`Exported vice-cover-${w}x${h}.png (${Math.round(bytes / 1024)} KiB).`);
  } catch (e) {
    setStatus("Export failed: " + e.message);
  }
}
$("exportBtn").addEventListener("click", exportNow);

// ---- Init -----------------------------------------------------------------
// Small hook for automated screenshots: renders the current cover at a size
// and returns a PNG data URL. The app itself never calls it.
window.viceCover = {
  state,
  photos,
  async renderExport(size) {
    const [w, h] = size.split("x").map(Number);
    const panels = panelShapes(state.layout, w, h).map((shape, i) => {
      const cfg = state.panels[i] || { photo: null, zoom: 100, posX: 0, posY: 0, warm: 0 };
      return { ...cfg, photo: cfg.photo == null ? null : (photos[cfg.photo] || {}).img || null };
    });
    const canvas = exportCover({ ...state, panels }, w, h);
    return canvas.toDataURL("image/png");
  },
};

document.fonts.load('118px Anton').then(() => { fontReady = true; renderSoon(); }).catch(() => {});
ensurePanels();
syncPanelControls();
loadSamples().then(() => {
  // Default panels: hero gets the pier, lower panels the boulevard.
  if (photos.length >= 2) {
    state.panels[0].photo = 1;
    if (state.panels[1]) state.panels[1].photo = 0;
    if (state.panels[2]) state.panels[2].photo = 0;
    buildPhotoStrip();
  }
  renderSoon();
});
renderSoon();
