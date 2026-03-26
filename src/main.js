/**
 * main.js
 *
 * ID format: {INITIALS}-{4-digit random}-VT
 * e.g. "Jane Doe" → JD-4821-VT
 *
 * Initials are taken from the first letter of each word in the name.
 * Number is a random 4-digit number generated fresh each card.
 * Suffix is always "VT".
 */

import './style.css';
import { createScene } from './scene.js';

const scene = createScene();
let memberData   = null;
let photoDataURL = null;

// ── ID generation ──
function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .map(w => w[0].toUpperCase())
    .join('');
}

function randomNum4() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function buildId(name) {
  const initials = getInitials(name);
  const num      = randomNum4();
  const parts    = [initials, num, 'VT'].filter(Boolean);
  return parts.join('-');
}

// ── Update ID preview as name is typed ──
const nameInput = document.getElementById('f-name');
const idDisplay = document.getElementById('id-display');

nameInput.addEventListener('input', () => {
  const name = nameInput.value.trim();
  if (name.length > 0) {
    idDisplay.textContent = buildId(name);
  } else {
    idDisplay.textContent = '—';
  }
});

// ── Default issued date = today ──
const today = new Date().toISOString().split('T')[0];
document.getElementById('f-date').value = today;

// ── Photo upload ──
const photoUpload      = document.getElementById('photo-upload');
const photoInput       = document.getElementById('f-photo');
const photoPreview     = document.getElementById('photo-preview');
const photoPlaceholder = document.getElementById('photo-placeholder');

photoUpload.addEventListener('click', () => photoInput.click());

photoInput.addEventListener('change', () => {
  const file = photoInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    photoDataURL = e.target.result;
    photoPreview.src = photoDataURL;
    photoPreview.style.display = 'block';
    photoPlaceholder.style.display = 'none';
  };
  reader.readAsDataURL(file);
});

// ── Shake helper ──
function shake(el) {
  el.animate([
    { transform: 'translateX(0)' }, { transform: 'translateX(-6px)' },
    { transform: 'translateX(6px)' }, { transform: 'translateX(-4px)' },
    { transform: 'translateX(0)' }
  ], { duration: 260 });
}

// ── Format date ──
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
