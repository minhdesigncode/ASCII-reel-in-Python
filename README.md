# ASCII-reel-in-Python

Hero section for **Nora's space** with four procedural ASCII animations, drawn live in the browser on a 96 × 68 character grid. No footage, images or 3D engine: every frame is math on a grid of cells.

The rendering pipeline follows Aviva Shishta's [ASCII reels in Python](https://www.avivashishta.com/blog/ascii-reels-eye-roses-sunflower-python), ported to JavaScript + `<canvas>`.

## Scenes

| Scene | What it does |
| --- | --- |
| Sunflower | Seeds placed at the golden angle (`θ = n · 137.508°`, `r = c·√n`); alternate arms lit; 34 petals over a ring of 21 |
| Roses | Five stems typed with `\|`, `/`, `\` by slope; 5 layers × 5 petals, `sh = (0.06 + 0.94·cup^1.6) · crease^1.5` |
| Eye → Heart | Lids, lashes, fibred iris, catchlight; exponential zoom into the pupil, then a lub-dub heart `(x² + y² − 1)³ − x²y³ < 0` |
| Guitar | Acoustic guitar with frets at `L · (1 − 2^(−n/12))`; plucked strings shiver and notes float away along a wavy staff |

## Pipeline

- **Density ramp** — brightness picks a character from `` .'`^",:;Il!i><~+_-?][}{1)(|\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$``
- **Glyph atlas** — each glyph rendered once per colour; frames are `drawImage` copies
- **Soft tone curve** — `lum = 1 − exp(−2 · v^1.2)` instead of a hard clip
- **Shimmer** — per-frame noise so characters near a threshold flicker
- **Bloom + vignette** — a downscaled copy added back, edges darkened

## Run locally

It's a static site, no build step:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

URL options: `?scene=sunflower|roses|eye|guitar` to start on a scene, `?autoplay=0` to loop one scene. `prefers-reduced-motion` shows a still frame.

## Files

- `index.html` — hero markup
- `assets/style.css` — styles (cream `#F4F1E8`, forest `#2F5D46`)
- `assets/ascii-reel.js` — grid, scenes and player
