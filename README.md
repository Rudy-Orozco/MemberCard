# Inner Circle — Membership Card

A WebGL membership card with a signup form, 3D card reveal, and hot-reloading card design.

## Setup

```bash
npm install
npm run dev
```

Then open http://localhost:5173

## Editing the card design

**Open `src/cardTexture.js`** — this is the only file you need to touch to change how the card looks.

Every time you save it, Vite hot-reloads the card texture instantly in the browser (no page refresh, no re-filling the form).

### What's in cardTexture.js

| Export | What it does |
|--------|-------------|
| `TIER_PALETTE` | Accent colours for Bronze / Silver / Gold |
| `drawFront(ctx, data)` | Draws the front face on a 1024×640 canvas |
| `drawBack(ctx, data)` | Draws the back face on a 1024×640 canvas |

### The `data` object

```js
data = {
  name:  'JANE DOE',      // full name uppercased
  first: 'Jane',
  last:  'Doe',
  tier:  'Gold',          // 'Bronze' | 'Silver' | 'Gold'
  since: 'Jan 2025',
  num:   '4821   9302   1847   5563',  // card number
  email: 'jane@example.com'
}
```

### Quick examples

**Change the background colour:**
```js
// in drawFront(), replace the bg gradient:
ctx.fillStyle = '#1a0030';
ctx.fillRect(0, 0, W, H);
```

**Add a logo image:**
```js
// at the top of drawFront():
const img = new Image();
img.src = '/logo.png'; // put logo.png in the /public folder
// inside drawFront(), after background is drawn:
if (img.complete) ctx.drawImage(img, 40, 40, 120, 60);
```

**Change fonts:**
```js
ctx.font = 'bold 80px "Your Font", sans-serif';
```
Add any Google Font to `index.html` and use its name here.

**Remove the EMV chip:**
Delete the "EMV chip" block in `drawFront()`.

## Project structure

```
index.html          ← HTML structure (form, canvas, HUD)
src/
  main.js           ← Entry point, form logic, HMR hook
  style.css         ← All CSS (form, HUD, body background)
  cardTexture.js    ← ✏️  EDIT THIS — card drawing functions
  scene.js          ← Three.js scene, card mesh, animation
```

## Build for production

```bash
npm run build
```

Output goes to `/dist`.
