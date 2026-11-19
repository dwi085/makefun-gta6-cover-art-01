[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/dwi085/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/dwi085/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Vice Cover Studio

Turn your photos into bold multi-panel cover art in the style of GTA 6 posters — diagonal panel slices, big Anton caption lettering, a Vice City sunset / neon colour grade — and export a PNG to share. Built for the [make.fun](https://make.fun/c/gta6-cover-art-01) bounty **gta6-cover-art-01**.

## How it works

1. **Add photos** from your machine (or try the bundled samples).
2. **Pick a layout** — Diagonal 3, Hero Strip, Split 2, Quad 4, or Poster — and a colour grade (Sunset, Neon Nights, Palm Dusk, Golden Hour, Vice). Or hit **Shuffle look** for a random combination.
3. **Click a panel** on the live preview to select it (a dashed outline marks it), then crop and position its photo (zoom, X/Y, warmth) and choose which photo fills it.
4. **Write your caption** — big title + subtitle, size and colour.
5. **Export PNG** in 1080×1080, 1080×1350, or 1920×1080.

Everything runs offline: the app is static files under `app/`, served by any static HTTP server (`python3 -m http.server` from `app/`, or `node serve.ts`). Photos are read on your own machine and never uploaded. No network requests at runtime.

## Files

- `app/index.html` — the editor page
- `app/style.css` — the editor UI
- `app/src/cover.js` — the cover renderer (panels, grades, lettering, retro sun + skyline + palms drawn in code)
- `app/src/main.js` — editor wiring (photos, panels, controls, export)
- `app/fonts/Anton-Regular.ttf` — Anton display font (SIL Open Font License, see `app/fonts/OFL.txt`)
- `app/samples/` — two sample photos made with an image model, free to use
- `main.ts` — entry program: copies `app/` + `screenshots/` to `/output` and writes `dossier.json`
- `screenshots/` — screenshots of the app and covers it exported

## Try it

```sh
cd app && python3 -m http.server 8080
# open http://localhost:8080
```

## License

MIT. The Anton font is under the SIL Open Font License 1.1 (`app/fonts/OFL.txt`).

---
Entered on [make.fun](https://make.fun/?ref=h6y3kbkw&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards
