/**
 * main.js
 * ID format: {INITIALS}-{4-digit random}-VT
 */

import './style.css';
import { createScene } from './scene.js';
import { CARD_STYLES } from './cardTexture.js';

// Load Cropper.js from CDN, then run the app
function loadCropper() {
  return new Promise((resolve, reject) => {
    if (window.Cropper) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.js';
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

loadCropper().then(init);

function init() {

  const scene      = createScene();
  let memberData   = null;
  let photoDataURL = null;
  let cropper      = null;

  // ── Style picker ──
  let selectedStyle = CARD_STYLES[0].id;

  function initStylePicker() {
    const picker = document.getElementById('style-picker');
    if (!picker) return;
    picker.innerHTML = '';
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
        picker.querySelectorAll('.style-opt').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
      });
      picker.appendChild(opt);
    });
  }

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

  // ── Issued date = today, read only ──
  const todayISO = new Date().toISOString().split('T')[0];
  const [ty, tm, td] = todayISO.split('-');
  document.getElementById('f-date').value = todayISO;
  document.getElementById('f-date-display').textContent = `${td}/${tm}/${ty}`;

  // ── Photo upload + crop ──
  const photoUpload      = document.getElementById('photo-upload');
  const photoInput       = document.getElementById('f-photo');
  const photoPreview     = document.getElementById('photo-preview');
  const photoPlaceholder = document.getElementById('photo-placeholder');
  const cropModal        = document.getElementById('crop-modal');
  const cropImg          = document.getElementById('crop-img');
  const cropCancel       = document.getElementById('crop-cancel');
  const cropConfirm      = document.getElementById('crop-confirm');

  const PHOTO_W      = 271;
  const PHOTO_H      = 276;
  const PHOTO_ASPECT = PHOTO_W / PHOTO_H;

  photoUpload.addEventListener('click', (e) => {
    if (e.target === photoInput || e.target === photoPreview) return;
    photoInput.click();
  });

  photoInput.addEventListener('change', () => {
    const file = photoInput.files[0];
    if (!file) return;
    photoInput.value = '';

    const objectURL = URL.createObjectURL(file);
    if (cropper) { cropper.destroy(); cropper = null; }
    cropImg.src = objectURL;
    cropModal.classList.add('open');

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
          ready() { URL.revokeObjectURL(objectURL); },
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
    if (!cropper) return;
    const canvas = cropper.getCroppedCanvas({ width: PHOTO_W, height: PHOTO_H, imageSmoothingQuality: 'high' });
    if (!canvas) return;
    photoDataURL = canvas.toDataURL('image/jpeg', 0.92);
    photoPreview.src = photoDataURL;
    photoPreview.style.display = 'block';
    photoPlaceholder.style.display = 'none';
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

    if (!name) { shake(document.getElementById('f-name').parentElement); return; }

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

} // end init