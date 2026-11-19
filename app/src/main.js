// Vice Cover Studio — editor wiring for the Neon Nights cover maker.
// State lives here; cover.js owns all drawing. Photos are read on the user's own
// machine with FileReader and never leave it; samples ship inside app/.
import { drawCover, renderCover, SIZES, LOOKS, LAYOUTS } from './cover.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const preview = $('previewCanvas');
const params = new URLSearchParams(location.search);

const state = {
  title: 'NEON NIGHTS',
  kicker: 'AFTER DARK IN VICE',
  look: 'neon',
  layout: 'diagonal',
  size: 'square',
  photos: [
    { img: null, zoom: 1.15, x: 0, y: 0, name: 'pier' },
    { img: null, zoom: 1.1, x: 0, y: 0, name: 'boulevard' },
  ],
};

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function loadSample(slot, name) {
  try {
    const img = await loadImage(`samples/${name}.jpg`);
    state.photos[slot].img = img;
    state.photos[slot].name = name;
  } catch (e) {
    state.photos[slot].img = null;
  }
  renderPreview();
}

function renderPreview() {
  // The preview canvas draws at the export aspect ratio, capped for speed —
  // except in a cover screenshot scene, where it renders at full export size
  // so the captured cover is crisp.
  const [W, H] = SIZES[state.size];
  const fullRes = document.body.classList.contains('shot-cover');
  const scale = fullRes ? 1 : Math.min(1, 860 / Math.max(W, H));
  preview.width = Math.round(W * scale);
  preview.height = Math.round(H * scale);
  const off = document.createElement('canvas');
  drawCover(off, state);
  const ctx = preview.getContext('2d');
  ctx.drawImage(off, 0, 0, preview.width, preview.height);
  const label = $('sizeLabel');
  if (label) label.textContent = `${W} × ${H} PNG — ${LOOKS[state.look].label} · ${LAYOUTS[state.layout]}`;
}

function markActive(group, value) {
  document.querySelectorAll(`[data-${group}]`).forEach((btn) => {
    btn.classList.toggle('active', btn.dataset[group] === value);
  });
}

function bindChoices(group, key) {
  document.querySelectorAll(`[data-${group}]`).forEach((btn) => {
    btn.addEventListener('click', () => {
      state[key] = btn.dataset[group];
      markActive(group, state[key]);
      renderPreview();
    });
  });
}

function bindPhotoSlot(slot) {
  const n = slot === 0 ? 'A' : 'B';
  const fileInput = $(`photo${n}`);
  const zoom = $(`zoom${n}`);
  const panX = $(`panX${n}`);
  const panY = $(`panY${n}`);
  const thumb = $(`thumb${n}`);
  const nameTag = $(`photoName${n}`);
  fileInput.addEventListener('change', () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const img = await loadImage(reader.result);
        state.photos[slot].img = img;
        state.photos[slot].name = file.name;
        thumb.src = reader.result;
        nameTag.textContent = file.name.length > 22 ? file.name.slice(0, 21) + '…' : file.name;
        renderPreview();
      } catch (e) { /* unreadable file: keep the previous photo */ }
    };
    reader.readAsDataURL(file);
  });
  zoom.addEventListener('input', () => { state.photos[slot].zoom = parseFloat(zoom.value); renderPreview(); });
  panX.addEventListener('input', () => { state.photos[slot].x = parseFloat(panX.value); renderPreview(); });
  panY.addEventListener('input', () => { state.photos[slot].y = parseFloat(panY.value); renderPreview(); });
  $(`sample${n}`).addEventListener('click', async () => {
    const sample = slot === 0 ? 'pier' : 'boulevard';
    await loadSample(slot, sample);
    thumb.src = `samples/${sample}.jpg`;
    nameTag.textContent = `sample: ${sample}.jpg`;
  });
}

function exportPng() {
  const [W, H] = SIZES[state.size];
  const canvas = renderCover(state);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const slug = (state.title || 'cover').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cover';
    a.href = url;
    a.download = `vice-cover-${slug}-${W}x${H}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    const note = $('exportNote');
    if (note) note.textContent = `Exported ${W} × ${H} PNG — check your downloads.`;
  }, 'image/png');
}

function remix() {
  // A new random combination of look + layout, keeping the user's photos and words.
  const lookKeys = Object.keys(LOOKS);
  const layoutKeys = Object.keys(LAYOUTS);
  state.look = lookKeys[Math.floor(Math.random() * lookKeys.length)];
  state.layout = layoutKeys[Math.floor(Math.random() * layoutKeys.length)];
  markActive('look', state.look);
  markActive('layout', state.layout);
  renderPreview();
}

function bindEditor() {
  bindChoices('look', 'look');
  bindChoices('layout', 'layout');
  bindChoices('size', 'size');
  bindPhotoSlot(0);
  bindPhotoSlot(1);
  $('titleInput').addEventListener('input', (e) => { state.title = e.target.value; renderPreview(); });
  $('kickerInput').addEventListener('input', (e) => { state.kicker = e.target.value; renderPreview(); });
  $('exportBtn').addEventListener('click', exportPng);
  $('remixBtn').addEventListener('click', remix);
  markActive('look', state.look);
  markActive('layout', state.layout);
  markActive('size', state.size);
}

async function boot() {
  // URL overrides let a screenshot scene (or a shared link) set the cover up.
  if (params.get('look') && LOOKS[params.get('look')]) state.look = params.get('look');
  if (params.get('layout') && LAYOUTS[params.get('layout')]) state.layout = params.get('layout');
  if (params.get('size') && SIZES[params.get('size')]) state.size = params.get('size');
  if (params.get('caption')) {
    state.title = params.get('caption');
    const ti = $('titleInput');
    if (ti) ti.value = state.title;
  }
  if (params.get('kicker')) {
    state.kicker = params.get('kicker');
    const ki = $('kickerInput');
    if (ki) ki.value = state.kicker;
  }
  bindEditor();
  // Default photos are the bundled samples so the preview is alive on first open.
  await Promise.all([loadSample(0, 'pier'), loadSample(1, 'boulevard')]);
  $('thumbA').src = 'samples/pier.jpg';
  $('thumbB').src = 'samples/boulevard.jpg';
  // Wait for the display font before the first paint so titles render in Anton.
  try { await document.fonts.load('100px Anton'); await document.fonts.ready; } catch (e) { /* system fallback */ }
  renderPreview();
  const shot = params.get('shot');
  if (shot) {
    await runShot(shot, params, loadSample);
    renderPreview();
  }
}

boot();
