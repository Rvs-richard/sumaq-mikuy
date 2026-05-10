// ===== STORAGE MODULE =====
const Store = {
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem('sumaq_' + key);
      return v ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem('sumaq_' + key, JSON.stringify(value)); } catch {}
  },
  remove(key) {
    try { localStorage.removeItem('sumaq_' + key); } catch {}
  },
  update(key, updater, fallback = {}) {
    this.set(key, updater(this.get(key, fallback)));
  }
};

// ===== AUTH MODULE =====
const Auth = {
  // Usuarios registrados (en una app real esto sería en backend)
  ADMIN_USER: 'admin',
  ADMIN_PASS: 'sumaq2024',

  login(usuario, password, perfil = {}) {
    const users = Store.get('usuarios', []);
    const existing = users.find(u => u.usuario === usuario);

    if (existing) {
      if (existing.password !== password) return { ok: false, msg: 'Contraseña incorrecta' };
      Store.set('sesion_activa', true);
      Store.set('sesion_usuario', existing.usuario);
      // Actualizar perfil si vino info nueva
      if (perfil.nombre) {
        const nuevoPerfil = { ...Store.get('perfil_usuario', {}), ...perfil, usuario };
        Store.set('perfil_usuario', nuevoPerfil);
      }
      return { ok: true, nombre: existing.nombre || existing.usuario };
    } else {
      // Nuevo usuario
      const newUser = { usuario, password, nombre: perfil.nombre || usuario.split('@')[0], creadoEn: new Date().toISOString() };
      users.push(newUser);
      Store.set('usuarios', users);
      Store.set('sesion_activa', true);
      Store.set('sesion_usuario', usuario);
      const nuevoPerfil = { ...perfil, usuario, nombre: newUser.nombre, loginDate: new Date().toISOString() };
      Store.set('perfil_usuario', nuevoPerfil);
      return { ok: true, nombre: newUser.nombre, nuevo: true };
    }
  },

  loginAdmin(usuario, password) {
    if (usuario === this.ADMIN_USER && password === this.ADMIN_PASS) {
      Store.set('admin_sesion', true);
      return true;
    }
    return false;
  },

  isAdmin() {
    return Store.get('admin_sesion') === true;
  },

  logout() {
    Store.set('sesion_activa', false);
    Store.remove('sesion_usuario');
  },

  logoutAdmin() {
    Store.remove('admin_sesion');
  },

  isLoggedIn() {
    return Store.get('sesion_activa') === true;
  }
};

// ===== TOAST =====
function showToast(msg, type = 'success', duration = 3200) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', error: '❌', info: '💡', warning: '⚠️' };
  const t = document.createElement('div');
  t.className = `toast ${type} animate-fade-up`;
  t.innerHTML = `<span>${icons[type] || '✅'}</span><span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => {
    t.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => t.remove(), 300);
  }, duration);
}

// ===== MODAL =====
function openModal(contentHTML, id = 'generic-modal') {
  closeModal(id);
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = id + '-overlay';
  overlay.innerHTML = `<div class="modal" id="${id}">${contentHTML}</div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(id); });
  document.body.appendChild(overlay);
}
function closeModal(id = 'generic-modal') {
  const el = document.getElementById(id + '-overlay');
  if (el) el.remove();
}

// ===== FORMATTERS =====
function formatMoney(n) { return 'S/' + parseFloat(n || 0).toFixed(2); }
function formatDate(d) {
  return new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ===== METRICS TRACKER =====
const Metrics = {
  track(event, data = {}) {
    Store.update('metrics_log', log => {
      if (!Array.isArray(log)) log = [];
      log.push({ event, data, ts: Date.now() });
      if (log.length > 200) log = log.slice(-200);
      return log;
    }, []);
    Store.update('metrics', m => {
      if (!m) m = { recomendaciones: 0, compras: 0, totalVentas: 0, totalItems: 0 };
      if (event === 'recomendacion') m.recomendaciones++;
      if (event === 'compra') {
        m.compras++;
        m.totalVentas = (m.totalVentas || 0) + (data.total || 0);
        m.totalItems = (m.totalItems || 0) + (data.items || 0);
      }
      return m;
    }, {});
  },
  get() {
    const m = Store.get('metrics', { recomendaciones: 0, compras: 0, totalVentas: 0, totalItems: 0 });
    const conv = m.recomendaciones > 0 ? ((m.compras / m.recomendaciones) * 100).toFixed(1) : 0;
    const ticket = m.compras > 0 ? (m.totalVentas / m.compras).toFixed(2) : 0;
    return { ...m, conversion: conv, ticketPromedio: ticket };
  }
};
