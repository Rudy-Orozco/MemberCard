/**
 * main.js
 *
 * ID format: {INITIALS}-{4-digit random}-VT
 * e.g. "Jane Doe" → JD-4821-VT
 */

import './style.css';
import { createScene } from './scene.js';
import { CARD_STYLES } from './cardTexture.js';

// Load Cropper.js from CDN — the npm package ESM build is broken in this version
await new Promise((resolve, reject) => {
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.js';
  s.onload = resolve;
  s.onerror = reject;
  document.head.appendChild(s);
});

const scene = createScene();
let memberData   = null;
let photoDataURL = null;
let cropper      = null;

// ── Style picker ──
let selectedStyle = CARD_STYLES[0].id;

function initStylePicker() {
  const stylePicker = document.getElementById('style-picker');
  if (!stylePicker) return;
  stylePicker.innerHTML = '';

  CARD_STYLES.forEach(s => {
    const opt = document.createElement('div');
    opt.className = 'style-opt' + (s.id === selectedStyle ? ' selected' : '');
    opt.dataset.id = s.id;
    opt.innerHTML = `
      <img src="${s.preview}" alt="${s.label}"/>
      <span class="style-opt-label">${s.label}</span>
      <span class="style-opt-check">✓</span>
    `;
    opt.addEventListener('click', () => {
      selectedStyle = s.id;
      stylePicker.querySelectorAll('.style-opt').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
    });
    stylePicker.appendChild(opt);
  });
}

// DOM is ready here — await above means this runs after page load
initStylePicker();

// ── ID generation ──
function getInitials(name) {
  return name.trim().split(/\s+/).map(w => w[0].toUpperCase()).join('');
}
function randomNum4() {
  return String(Math.floor(1000 + Math.random() * 9000));
}
function buildId(name) {
  return [getInitials(name), randomNum4(), 'VT'].join('-');
}

// ── Live ID preview ──
const nameInput = document.getElementById('f-name');
const idDisplay = document.getElementById('id-display');
nameInput.addEventListener('input', () => {
  const name = nameInput.value.trim();
  idDisplay.textContent = name.length > 0 ? buildId(name) : '—';
});

// ── Default issued date = today ──
document.getElementById('f-date').value = new Date().toISOString().split('T')[0];

// ── Photo upload + crop ──
const photoUpload      = document.getElementById('photo-upload');
const photoInput       = document.getElementById('f-photo');
const photoPreview     = document.getElementById('photo-preview');
const photoPlaceholder = document.getElementById('photo-placeholder');
const cropModal        = document.getElementById('crop-modal');
const cropImg          = document.getElementById('crop-img');
const cropCancel       = document.getElementById('crop-cancel');
const cropConfirm      = document.getElementById('crop-confirm');

// Matches the card photo box dimensions
const PHOTO_W      = 271;
const PHOTO_H      = 276;
const PHOTO_ASPECT = PHOTO_W / PHOTO_H;

photoUpload.addEventListener('click', (e) => {
  if (e.target === photoInput) return;
  if (e.target === photoPreview) return; // clicking preview shouldn't re-open picker
  photoInput.click();
});

photoInput.addEventListener('change', () => {
  const file = photoInput.files[0];
  if (!file) return;

  // Reset input so same file can be re-selected
  photoInput.value = '';

  const objectURL = URL.createObjectURL(file);

  // Destroy old cropper if any
  if (cropper) { cropper.destroy(); cropper = null; }

  // Set image src directly (object URL is always new, never cached)
  cropImg.src = objectURL;

  // Open modal
  cropModal.classList.add('open');

  // Init cropper after a short tick so the modal is painted and img has size
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      cropper = new window.Cropper(cropImg, {
        aspectRatio:  PHOTO_ASPECT,
        viewMode:     1,
        autoCropArea: 0.9,
        movable:      true,
        zoomable:     true,
        rotatable:    false,
        scalable:     false,
        guides:       true,
        highlight:    true,
        dragMode:     'move',
        ready() {
          // Cropper is fully initialized
          URL.revokeObjectURL(objectURL);
        },
      });
    });
  });
});

cropCancel.addEventListener('click', () => {
  cropModal.classList.remove('open');
  if (cropper) { cropper.destroy(); cropper = null; }
  photoInput.value = '';
});

cropConfirm.addEventListener('click', () => {
  if (!cropper) {
    console.warn('No cropper instance');
    return;
  }

  const croppedCanvas = cropper.getCroppedCanvas({
    width:  PHOTO_W,
    height: PHOTO_H,
    imageSmoothingQuality: 'high',
  });

  if (!croppedCanvas) {
    console.warn('getCroppedCanvas returned null');
    return;
  }

  photoDataURL = croppedCanvas.toDataURL('image/jpeg', 0.92);

  // Update the form preview
  photoPreview.src = photoDataURL;
  photoPreview.style.display = 'block';
  photoPlaceholder.style.display = 'none';

  // Close modal and clean up
  cropModal.classList.remove('open');
  cropper.destroy();
  cropper = null;
});

// ── Shake helper ──
function shake(el) {
  el.animate([
    { transform: 'translateX(0)' }, { transform: 'translateX(-6px)' },
    { transform: 'translateX(6px)' }, { transform: 'translateX(-4px)' },
    { transform: 'translateX(0)' }
  ], { duration: 260 });
}

// ── Format date dd/mm/yyyy ──
function formatDate(str) {
  if (!str) {
    const d = new Date();
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  }
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y}`;
}

// ── Submit ──
document.getElementById('signup-btn').addEventListener('click', () => {
  const name    = document.getElementById('f-name').value.trim();
  const book    = document.getElementById('f-book').value.trim();
  const date    = document.getElementById('f-date').value;
  const credits = document.getElementById('f-credits').value.trim();

  if (!name) {
    shake(document.getElementById('f-name').parentElement);
    return;
  }

  memberData = {
    name,
    book:    book    || '—',
    issued:  formatDate(date),
    id:      buildId(name),
    credits: credits || '',
    photo:   photoDataURL || null,
    style:   selectedStyle,
  };

  document.getElementById('wname').textContent = name.split(' ')[0];
  document.getElementById('form-overlay').classList.add('gone');

  setTimeout(() => {
    document.getElementById('welcome').classList.add('show');
    document.getElementById('hud').classList.add('show');
    scene.reveal(memberData);
  }, 600);
});

// ── Save ──
document.getElementById('save-btn').addEventListener('click', () => {
  scene.saveCardPng(memberData);
});

// ── Vite HMR ──
if (import.meta.hot) {
  import.meta.hot.accept('./cardTexture.js', () => {
    scene.rebake(memberData);
  });
}