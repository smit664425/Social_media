const API_URL = 'http://localhost:5000/api';

/* ===== ALERTS ===== */
function showAlert(message, type = 'error') {
  const container = document.getElementById('alert-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `alert alert-${type}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

/* ===== TOKEN / USER ===== */
function setToken(t) { localStorage.setItem('token', t); }
function getToken() { return localStorage.getItem('token'); }
function removeToken() { localStorage.removeItem('token'); }
function setUser(u) { localStorage.setItem('user', JSON.stringify(u)); }
function getUser() { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; }

function logout() {
  removeToken();
  localStorage.removeItem('user');
  window.location.href = 'auth.html';
}

/* ===== AUTH GUARD ===== */
function checkAuth() {
  const token = getToken();
  const page = window.location.pathname.split('/').pop();
  if (!token && page !== 'auth.html') {
    window.location.href = 'auth.html';
    return false;
  }
  if (token && page === 'auth.html') {
    window.location.href = 'index.html';
    return false;
  }
  document.body.classList.remove('hidden');
  return true;
}

/* ===== AVATAR ===== */
function getAvatarColor(name = '') {
  const colors = ['avatar-c1', 'avatar-c2', 'avatar-c3', 'avatar-c4', 'avatar-c5'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function avatarHTML(username, sizeClass = '') {
  const initials = username ? username.slice(0, 2).toUpperCase() : '??';
  const color = getAvatarColor(username);
  return `<div class="avatar ${color} ${sizeClass}">${initials}</div>`;
}

/* ===== RELATIVE TIME ===== */
function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ===== CURRENT PAGE ===== */
function currentPage() {
  const p = window.location.pathname.split('/').pop();
  return p || 'index.html';
}

/* ===== DOM READY ===== */
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();

  const logoutBtn = document.getElementById('logout');
  if (logoutBtn) logoutBtn.addEventListener('click', e => { e.preventDefault(); logout(); });

  // active nav link
  const page = currentPage();
  if (page === 'index.html' || page === '') {
    document.getElementById('nav-feed')?.classList.add('active');
  } else if (page === 'profile.html') {
    document.getElementById('nav-profile')?.classList.add('active');
  }
});
