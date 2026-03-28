/**
 * cardTexture.js
 *
 * ── ADDING A NEW STYLE ──
 * 1. Add your PNGs to /public  (e.g. /card-front-rose.png, /card-back-rose.png)
 * 2. Add an entry to CARD_STYLES below
 * 3. That's it — the style picker in the form updates automatically
 *
 * Canvas: 1024 × 576 px
 *
 * data = {
 *   name, book, issued, id, credits,
 *   photo: null | base64DataURL,
 *   style: 'classic' (the id from CARD_STYLES)
 * }
 */

// ═══════════════════════════════════════
//  CARD STYLES CONFIG  ← edit this
// ═══════════════════════════════════════
const BASE = import.meta.env.BASE_URL;
export const CARD_STYLES = [
  {
    id:        'blue',           // unique key, used internally
    label:     'Blue',           // shown in the picker
    front:     `${BASE}Member_card_Blue_ver.png`,   // path in /public
    back:      null,    // path in /public
    preview:   `${BASE}Member_card_Blue_ver.png`,   // thumbnail shown in picker (can be same as front)
    fontColor: '#328EFF'
  },
  {
    id:        'green',          
    label:     'Green',          
    front:     `${BASE}Member_card_Green_ver.png`,   
    back:      null,    
    preview:   `${BASE}Member_card_Green_ver.png`,   
    fontColor: '#00AF0B'
  },
  {
    id:        'lightPurple',           
    label:     'Light Purple',        
    front:     `${BASE}Member_card_Light_Purple_ver.png`,  
    back:      null,    
    preview:   `${BASE}Member_card_Light_Purple_ver.png`,   
    fontColor: '#A44BFF'
  },
  {
    id:        'orange',           
    label:     'Orange',        
    front:     `${BASE}Member_card_Orange_ver.png`,   
    back:      null,  
    preview:   `${BASE}Member_card_Orange_ver.png`,   
    fontColor: '#FF9900'
  },
  {
    id:        'purple',           
    label:     'Dark Purple',           
    front:     `${BASE}Member_card_Purple_ver.png`,   
    back:      null,    
    preview:   `${BASE}Member_card_Purple_ver.png`,   
    fontColor: '#790BEA'
  },
  {
    id:        'red',           
    label:     'red',           
    front:     `${BASE}Member_card_Red_ver.png`,   
    back:      null,    
    preview:   `${BASE}Member_card_Red_ver.png`,   
    fontColor: '#CC1515'
  },
  {
    id:        'sage',           
    label:     'Sage',           
    front:     `${BASE}Member_card_Sage_green_ver.png`,   
    back:      null,    
    preview:   `${BASE}Member_card_Sage_green_ver.png`,   
    fontColor: '#98A869'
  },
  {
    id:        'yellow',           
    label:     'Yellow',           
    front:     `${BASE}Member_card_Yellow_ver.png`,   
    back:      null,    
    preview:   `${BASE}Member_card_Yellow_ver.png`,   
    fontColor: '#FFD800'
  },
    {
    id:        'purple2',           
    label:     'Purple',           
    front:     `${BASE}Member_card_Purple_ver.png`,   
    back:      null,    
    preview:   `${BASE}Member_card_Purple_ver.png`,   
    fontColor: '#790BEA'
  },
];

// ── Preload all style images ──
const imageCache = {};

function preload(src) {
  if (!src || imageCache[src]) return;
  const img = new Image();
  img.src = src;
  imageCache[src] = img;
}

CARD_STYLES.forEach(s => {
  preload(s.front);
  preload(s.back);
  preload(s.preview);
});

function getImg(src) {
  return imageCache[src] || null;
}

// ─────────────────────────────────────────
//  FRONT FACE
// ─────────────────────────────────────────
export function drawFront(ctx, data) {
  const W = 1024, H = 576;

  // Find the style config — fall back to first style if not found
  const style  = CARD_STYLES.find(s => s.id === data.style) || CARD_STYLES[0];
  const cardImg = style.front ? getImg(style.front) : null;

  // Draw background image or fallback
  if (cardImg && cardImg.complete && cardImg.naturalWidth > 0) {
    ctx.drawImage(cardImg, 0, 0, W, H);
  } else {
    ctx.fillStyle = '#fdf6ee';
    ctx.fillRect(0, 0, W, H);
  }

  // ── Text overlays ──
  // Adjust x/y to match your card design's blank fields.
  const flip = -39;
  // Member name
  ctx.fillStyle = style.fontColor;
  ctx.font = '600 40px "Inter", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(data.name, 569, 196-flip);

  // Member ID
  ctx.fillStyle = style.fontColor;
  ctx.font = '600 40px "Inter", sans-serif';
  ctx.fillText(data.id, 518, 258-flip);

  // Favourite book
  ctx.fillStyle = style.fontColor;
  ctx.font = '600 40px "Inter", sans-serif';
  ctx.fillText(data.book, 585, 325-flip);

  // Issued date
  ctx.fillStyle = style.fontColor;
  ctx.font = '600 40px "Inter", sans-serif';
  ctx.fillText(data.issued, 578, 390-flip);

  // Credits
  if (data.credits) {
    ctx.fillStyle = style.fontColor;
    ctx.font = '400 32px "Inter", sans-serif';
    ctx.fillText(data.credits, 193, 489-flip-8);
  }

  // Photo
  if (data.photo) {
    const img = new Image();
    img.src = data.photo;
    const px = 78, py = 191, pw = 271, ph = 276, pr = 17;
    const draw = () => drawRoundedPhoto(ctx, img, px, py, pw, ph, pr);
    img.complete ? draw() : (img.onload = draw);
  }
}

// ─────────────────────────────────────────
//  BACK FACE
// ─────────────────────────────────────────
export function drawBack(ctx, data) {
  const W = 1024, H = 576;

  const style    = CARD_STYLES.find(s => s.id === data.style) || CARD_STYLES[0];
  const backImg  = style.back ? getImg(style.back) : null;

  if (backImg && backImg.complete && backImg.naturalWidth > 0) {
    ctx.drawImage(backImg, 0, 0, W, H);
  } else {
    // Fallback plain back
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#ffffff'); bg.addColorStop(1, '#ffffff');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#000000';
    ctx.font = 'italic bold 32px "Playfair Display", serif';
    ctx.textAlign = 'center';
    ctx.fillText('Designed by LiaNweVT', W/2, H/2 - 10);

    ctx.fillStyle = '#000000';
    ctx.font = '400 18px "DM Mono", monospace';
    ctx.fillText('REKAA_85 Software Solutions', W/2, H/2 + 24);
  }
}

// ── Helper: image clipped to rounded rect ──
function drawRoundedPhoto(ctx, img, x, y, w, h, r) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y); ctx.arcTo(x+w,y,x+w,y+r,r);
  ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
  ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
  ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r);
  ctx.closePath(); ctx.clip();
  ctx.drawImage(img, x, y, w, h);
  ctx.restore();
}