// Fixed scenes for screenshots: ?shot=editor shows the page with a sample photo loaded;
// ?shot=cover shows the finished cover alone, edge to edge. `photo` picks the sample
// (samples/<photo>.jpg), `caption` the title words, `size` the export size, `look` and
// `layout` the cover style. window.__shotReady is set once the scene has painted.
// The cover scene loads both samples so both panels are filled: the named photo in
// panel A and the other sample in panel B.
export async function runShot(shot, query, load) {
  const photo = query.get('photo') ?? 'pier';
  const caption = query.get('caption') ?? 'Neon Nights';
  if (shot === 'cover') document.body.classList.add('shot-cover');
  await load(0, photo);
  await load(1, photo === 'pier' ? 'boulevard' : 'pier');
  const title = document.getElementById('titleInput');
  if (title) title.value = caption;
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
