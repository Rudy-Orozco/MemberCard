/**
 * cardTexture.js
 *
 * Edit drawFront() and drawBack() to design your card.
 * Save this file → card updates instantly in the browser (Vite HMR).
 *
 * Canvas: 1024 × 576 px
 *
 * data = {
 *   name:    'Jane Doe',
 *   book:    'Pride and Prejudice',
 *   issued:  'Jan 1, 2025',
 *   id:      'JD-4821-VT',
 *   credits: 'Founding Member',
 *   photo:   null | base64DataURL,
 * }
 */

// ── Preload card background image ──
// Put your PNG in the /public folder and set the filename here.
const CARD_IMAGE_SRC      = 'Member_card_Blue_ver.png'; // or null
const CARD_BACK_IMAGE_SRC = '/card-back.png';  // or null

const cardImg = CARD_IMAGE_SRC ? (() => {
  const img = new Image(); img.src = CARD_IMAGE_SRC; return img;
})() : null;

const cardBackImg = CARD_BACK_IMAGE_SRC ? (() => {
  const img = new Image(); img.src = CARD_BACK_IMAGE_SRC; return img;
})() : null;

// ─────────────────────────────────────────
//  FRONT FACE — edit below
// ─────────────────────────────────────────
export function drawFront(ctx, data) {
  const W = 1024, H = 576;

  // Background image or fallback
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
  ctx.fillStyle = '#328EFF';
  ctx.font = '600 40px "Inter", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(data.name, 569, 196-flip);

  // Member ID
  ctx.fillStyle = '#328EFF';
  ctx.font = '600 40px "Inter", sans-serif';
  ctx.fillText(data.id, 518, 258-flip);

  // Favourite book
  ctx.fillStyle = '#328EFF';
  ctx.font = '600 40px "Inter", sans-serif';
  ctx.fillText(data.book, 585, 325-flip);

  // Issued date
  ctx.fillStyle = '#328EFF';
  ctx.font = '600 40px "Inter", sans-serif';
  ctx.fillText(data.issued, 578, 390-flip);

  // Credits
  if (data.credits) {
    ctx.fillStyle = '#328EFF';
    ctx.font = '400 32px "Inter", sans-serif';
    ctx.fillText(data.credits, 193, 489-flip-8);
  }

  // Photo — adjust px/py/pw/ph to position on your card
  if (data.photo) {
    const img = new Image();
    img.src = data.photo;
    const px = 78, py = 191, pw = 271, ph = 276, pr = 17;
    const draw = () => drawRoundedPhoto(ctx, img, px, py, pw, ph, pr);
    img.complete ? draw() : (img.onload = draw);
  }
}

// ─────────────────────────────────────────
//  BACK FACE — edit below
// ─────────────────────────────────────────
export function drawBack(ctx, data) {
  const W = 1024, H = 576;

  if (cardBackImg && cardBackImg.complete && cardBackImg.naturalWidth > 0) {
    ctx.drawImage(cardBackImg, 0, 0, W, H);
  } else {
    // Fallback plain back
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#ffffff'); bg.addColorStop(1, '#ffffff');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#000000';
    ctx.font = 'italic bold 32px "Playfair Display", serif';
    ctx.textAlign = 'center';
    ctx.fillText('Bookemia Cards', W/2, H/2 - 10);

    ctx.fillStyle = '#070707';
    ctx.font = '400 18px "DM Mono", monospace';
    ctx.fillText('A REKAA_85 Software Solution', W/2, H/2 + 24);
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
