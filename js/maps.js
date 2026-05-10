// ===== MAPS MODULE – Sumaq Mikuy v2 =====
// Usa Leaflet.js (OpenStreetMap, sin API key)

const Maps = {

  // Coordenadas del restaurante (Plaza Mayor de Ayacucho)
  RESTAURANTE: { lat: -13.1589, lng: -74.2237 },
  RESTAURANTE_NOMBRE: 'Sumaq Mikuy 🌿',

  // Radios de zona para calcular delivery (en km)
  ZONAS: [
    { nombre: 'centro', label: 'Centro',      radio: 2.0, precio: 3, tiempo: '20-30 min', color: '#22c55e' },
    { nombre: 'media',  label: 'Zona media',  radio: 4.5, precio: 5, tiempo: '30-45 min', color: '#f59e0b' },
    { nombre: 'lejos',  label: 'Zona lejana', radio: 8.0, precio: 7, tiempo: '45-60 min', color: '#ef4444' },
  ],

  mapPicker: null,       // mapa selector de ubicación
  mapRestaurante: null,  // mapa con ubicación del restaurante
  mapSeguimiento: null,  // mapa de seguimiento de delivery
  markerCliente: null,
  markerRider: null,
  clientePos: null,
  seguimientoInterval: null,

  // ─── 1. MAPA SELECTOR DE UBICACIÓN ─────────────────────────────
  initPickerMap() {
    if (this.mapPicker) { this.mapPicker.invalidateSize(); return; }

    this.mapPicker = L.map('map-picker', { zoomControl: true }).setView(
      [this.RESTAURANTE.lat, this.RESTAURANTE.lng], 14
    );
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 19
    }).addTo(this.mapPicker);

    // Marcador del restaurante
    const iconRest = L.divIcon({
      html: `<div style="background:#4a8c2a;color:#fff;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 8px rgba(0,0,0,.3)">🌿</div>`,
      className: '', iconAnchor: [18, 18]
    });
    L.marker([this.RESTAURANTE.lat, this.RESTAURANTE.lng], { icon: iconRest })
      .addTo(this.mapPicker)
      .bindPopup('<strong>Sumaq Mikuy</strong><br>Tu restaurante 🌿', { closeButton: false })
      .openPopup();

    // Círculos de zonas
    this.ZONAS.forEach(z => {
      L.circle([this.RESTAURANTE.lat, this.RESTAURANTE.lng], {
        radius: z.radio * 1000, color: z.color,
        fillColor: z.color, fillOpacity: 0.07,
        weight: 2, dashArray: '6 4'
      }).addTo(this.mapPicker)
        .bindTooltip(`${z.label} — S/${z.precio} · ${z.tiempo}`, { permanent: false });
    });

    // Click en el mapa para poner marcador
    this.mapPicker.on('click', (e) => this.setClientePos(e.latlng));

    // Botón "Usar mi ubicación"
    document.getElementById('btn-mi-ubicacion')?.addEventListener('click', () => this.usarMiUbicacion());
  },

  setClientePos(latlng) {
    if (this.markerCliente) this.markerCliente.remove();
    const iconCliente = L.divIcon({
      html: `<div style="background:#3b82f6;color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,.35)">📍</div>`,
      className: '', iconAnchor: [16, 16]
    });
    this.markerCliente = L.marker(latlng, { icon: iconCliente, draggable: true })
      .addTo(this.mapPicker)
      .bindPopup('📍 Tu ubicación<br><small>Arrastra para ajustar</small>')
      .openPopup();
    this.markerCliente.on('dragend', (e) => this.calcularZonaDelivery(e.target.getLatLng()));
    this.clientePos = latlng;
    this.calcularZonaDelivery(latlng);
  },

  calcularZonaDelivery(latlng) {
    const distKm = this._distancia(latlng.lat, latlng.lng, this.RESTAURANTE.lat, this.RESTAURANTE.lng);
    let zona = this.ZONAS[this.ZONAS.length - 1]; // default: lejos
    for (const z of this.ZONAS) {
      if (distKm <= z.radio) { zona = z; break; }
    }

    // Actualizar UI
    const infoEl = document.getElementById('zona-info-mapa');
    if (infoEl) {
      infoEl.innerHTML = `
        <div class="zona-info-badge" style="border-color:${zona.color};background:${zona.color}18">
          <span style="font-size:22px">📍</span>
          <div>
            <div style="font-weight:700;color:${zona.color}">${zona.label}</div>
            <div style="font-size:13px;color:var(--text-muted)">${distKm.toFixed(1)} km del restaurante</div>
          </div>
          <div style="margin-left:auto;text-align:right">
            <div style="font-weight:800;font-size:18px;color:${zona.color}">S/${zona.precio}</div>
            <div style="font-size:12px;color:var(--text-muted)">${zona.tiempo}</div>
          </div>
        </div>`;
    }

    // Sincronizar con selector de zona del pedido
    const zonaSelect = document.getElementById('zona-select');
    if (zonaSelect) { zonaSelect.value = zona.nombre; zonaSelect.dispatchEvent(new Event('change')); }

    // Guardar dirección aproximada
    this.clientePos = latlng;
    this._geocodingReverso(latlng);

    return zona;
  },

  async _geocodingReverso(latlng) {
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latlng.lat}&lon=${latlng.lng}&format=json&accept-language=es`);
      const d = await r.json();
      const dir = d.display_name?.split(',').slice(0,3).join(', ') || 'Ubicación seleccionada';
      const el = document.getElementById('direccion-detectada');
      if (el) {
        el.textContent = dir;
        el.style.display = 'block';
      }
      // Guardar en perfil
      Store.update('perfil_usuario', p => ({ ...p, ultimaDireccion: dir, ultimaPos: { lat: latlng.lat, lng: latlng.lng } }), {});
    } catch {}
  },

  usarMiUbicacion() {
    const btn = document.getElementById('btn-mi-ubicacion');
    if (btn) { btn.textContent = '📡 Buscando...'; btn.disabled = true; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        this.mapPicker.flyTo(latlng, 16, { animate: true, duration: 1.2 });
        this.setClientePos(latlng);
        if (btn) { btn.textContent = '📍 Mi ubicación'; btn.disabled = false; }
      },
      () => {
        showToast('No se pudo obtener tu ubicación', 'warning');
        if (btn) { btn.textContent = '📍 Mi ubicación'; btn.disabled = false; }
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  },

  // ─── 2. MAPA DEL RESTAURANTE ───────────────────────────────────
  initRestauranteMap() {
    if (this.mapRestaurante) { this.mapRestaurante.invalidateSize(); return; }
    this.mapRestaurante = L.map('map-restaurante', { zoomControl: true, scrollWheelZoom: false })
      .setView([this.RESTAURANTE.lat, this.RESTAURANTE.lng], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 19
    }).addTo(this.mapRestaurante);

    const icon = L.divIcon({
      html: `<div style="background:#4a8c2a;color:#fff;border-radius:14px;padding:8px 12px;font-weight:700;font-size:13px;white-space:nowrap;box-shadow:0 3px 12px rgba(74,140,42,.4)">🌿 Sumaq Mikuy</div>`,
      className: '', iconAnchor: [60, 20]
    });
    L.marker([this.RESTAURANTE.lat, this.RESTAURANTE.lng], { icon })
      .addTo(this.mapRestaurante)
      .bindPopup(`
        <div style="text-align:center;padding:4px">
          <div style="font-size:24px">🌿</div>
          <strong>Sumaq Mikuy</strong><br>
          <small>Jr. Lima 123, Ayacucho</small><br>
          <small>Lun–Sáb 8am–6pm</small>
        </div>`)
      .openPopup();

    // Pulso animado
    L.circle([this.RESTAURANTE.lat, this.RESTAURANTE.lng], {
      radius: 80, color: '#4a8c2a', fillColor: '#4a8c2a', fillOpacity: 0.15, weight: 2
    }).addTo(this.mapRestaurante);

    // Botón "Cómo llegar"
    document.getElementById('btn-como-llegar')?.addEventListener('click', () => {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${this.RESTAURANTE.lat},${this.RESTAURANTE.lng}`, '_blank');
    });
  },

  // ─── 3. MAPA DE SEGUIMIENTO ────────────────────────────────────
  initSeguimientoMap(pedido) {
    if (!pedido) {
      document.getElementById('seguimiento-empty')?.style.setProperty('display', 'block');
      document.getElementById('map-seguimiento-wrap')?.style.setProperty('display', 'none');
      return;
    }
    document.getElementById('seguimiento-empty')?.style.setProperty('display', 'none');
    document.getElementById('map-seguimiento-wrap')?.style.setProperty('display', 'block');

    const destino = pedido.clientePos || this.RESTAURANTE; // fallback

    if (this.mapSeguimiento) {
      this.mapSeguimiento.invalidateSize();
    } else {
      this.mapSeguimiento = L.map('map-seguimiento', { zoomControl: true })
        .setView([this.RESTAURANTE.lat, this.RESTAURANTE.lng], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap', maxZoom: 19
      }).addTo(this.mapSeguimiento);
    }

    // Marcador restaurante
    const iconRest = L.divIcon({
      html: `<div style="background:#4a8c2a;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 8px rgba(0,0,0,.3)">🌿</div>`,
      className: '', iconAnchor: [17, 17]
    });
    L.marker([this.RESTAURANTE.lat, this.RESTAURANTE.lng], { icon: iconRest })
      .addTo(this.mapSeguimiento).bindPopup('🌿 Sumaq Mikuy – Origen');

    // Marcador destino
    const iconDest = L.divIcon({
      html: `<div style="background:#3b82f6;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 8px rgba(0,0,0,.3)">🏠</div>`,
      className: '', iconAnchor: [17, 17]
    });
    L.marker([destino.lat, destino.lng], { icon: iconDest })
      .addTo(this.mapSeguimiento).bindPopup('🏠 Tu ubicación');

    // Línea de ruta
    const ruta = L.polyline([
      [this.RESTAURANTE.lat, this.RESTAURANTE.lng],
      [destino.lat, destino.lng]
    ], { color: '#4a8c2a', weight: 3, dashArray: '8 6', opacity: 0.7 }).addTo(this.mapSeguimiento);
    this.mapSeguimiento.fitBounds(ruta.getBounds(), { padding: [40, 40] });

    // Rider simulado
    this._simularRider(destino);
  },

  _simularRider(destino) {
    if (this.seguimientoInterval) clearInterval(this.seguimientoInterval);
    if (this.markerRider) this.markerRider.remove();

    const iconRider = L.divIcon({
      html: `<div style="background:#f59e0b;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 2px 10px rgba(0,0,0,.3);animation:pulse-rider 1s infinite">🛵</div>`,
      className: '', iconAnchor: [18, 18]
    });

    let t = 0;
    const steps = 60;
    const startLat = this.RESTAURANTE.lat, startLng = this.RESTAURANTE.lng;
    const endLat = destino.lat, endLng = destino.lng;

    this.markerRider = L.marker([startLat, startLng], { icon: iconRider })
      .addTo(this.mapSeguimiento).bindPopup('🛵 Tu delivery en camino!');

    this.seguimientoInterval = setInterval(() => {
      t++;
      const ratio = t / steps;
      const lat = startLat + (endLat - startLat) * ratio;
      const lng = startLng + (endLng - startLng) * ratio;
      this.markerRider.setLatLng([lat, lng]);

      const minRestantes = Math.max(0, Math.round((1 - ratio) * 25));
      const etaEl = document.getElementById('eta-tiempo');
      if (etaEl) etaEl.textContent = minRestantes > 0 ? `~${minRestantes} min` : '¡Llegando!';

      const pctEl = document.getElementById('seguimiento-pct');
      if (pctEl) pctEl.style.width = Math.round(ratio * 100) + '%';

      if (t >= steps) {
        clearInterval(this.seguimientoInterval);
        showToast('🎉 ¡Tu pedido llegó!', 'success');
        this.markerRider.bindPopup('✅ ¡Entregado!').openPopup();
        if (etaEl) etaEl.textContent = '¡Entregado! ✅';
      }
    }, 1500);
  },

  // ─── UTILIDADES ────────────────────────────────────────────────
  _distancia(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  },

  // Inicializar mapa cuando se muestra la sección
  onSectionShow(section) {
    setTimeout(() => {
      if (section === 'pedido')      this.initPickerMap();
      if (section === 'ubicacion')   this.initRestauranteMap();
      if (section === 'seguimiento') {
        const historial = Store.get('historial_pedidos', []);
        const perfil    = Store.get('perfil_usuario', {});
        const ultimo    = historial[0] || null;
        if (ultimo && perfil.ultimaPos) ultimo.clientePos = perfil.ultimaPos;
        this.initSeguimientoMap(ultimo);
      }
    }, 200);
  }
};
