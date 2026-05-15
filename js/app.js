// ===== APP CONTROLLER – Sumaq Mikuy v2 =====

if (!Auth.isLoggedIn()) { window.location.href = 'login.html'; }

// ===== STATE =====
let selectedToppings = [];
let notasPedido = '';

document.addEventListener('DOMContentLoaded', () => {
  Cart.init();
  renderBowls();
  populateBowlSelect();
  renderHistorial();
  renderPerfil();
  renderMetricas();
  renderPlanSemanal();
  ChatBot.init();
  loadSavedData();
  Cart.updateBadge();
  renderToppings();
  // Welcome stagger
  setTimeout(() => {
    document.querySelectorAll('.bowl-card').forEach((card, i) => {
      card.style.animationDelay = (i * 0.07) + 's';
      card.classList.add('animate-fade-up');
    });
  }, 80);
});
function agregarAlCarrito() {
  const bowlId = document.getElementById("bowl-select")?.value;
  const zona = document.getElementById("zona-select")?.value;
  const notas = document.getElementById("notas-pedido")?.value || "";

  // obtener toppings marcados
  const checks = document.querySelectorAll("#toppings-container input:checked");
  const toppings = Array.from(checks).map(c => c.value);

  // VALIDACIÓN
  if (!bowlId) {
    alert("Selecciona un bowl");
    return;
  }

  // llamar a tu sistema real
  Cart.add(bowlId, zona, toppings, notas);

  showToast("✅ Pedido agregado correctamente");
}

// ===== NAVEGACIÓN =====
function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const section = document.getElementById('section-' + name);
  if (section) section.classList.add('active');
  document.querySelectorAll('.nav-link').forEach(l => {
    if (l.getAttribute('onclick')?.includes(`'${name}'`)) l.classList.add('active');
  });
  if (name === 'metricas') renderMetricas();
  if (name === 'perfil') renderPerfil();
  if (name === 'pedido') { renderHistorial(); renderPedidoPreview(); Maps.onSectionShow('pedido'); }
  if (name === 'plan') renderPlanSemanal();
  if (name === 'ubicacion') Maps.onSectionShow('ubicacion');
  if (name === 'seguimiento') Maps.onSectionShow('seguimiento');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleCarrito() {
  const panel = document.getElementById('carrito-panel');
  const isOpen = panel.style.display === 'flex';
  panel.style.display = isOpen ? 'none' : 'flex';
  if (!isOpen) { panel.style.flexDirection = 'column'; Cart.render(); }
}

// ===== EVALUACIÓN NUTRICIONAL =====
function evaluarNutricion() {
  const edad = parseInt(document.getElementById('edad').value);
  const peso = parseFloat(document.getElementById('peso').value);
  const talla = parseFloat(document.getElementById('talla').value);
  const objetivo = document.getElementById('objetivo').value;
  const sexo = document.getElementById('sexo').value;

  if (!edad || !peso || !talla) { showToast('Por favor completa todos los campos', 'error'); return; }
  if (edad<10||edad>99||peso<20||peso>300||talla<100||talla>250) { showToast('Verifica los valores ingresados','warning'); return; }

  const imc = calcularIMC(peso, talla);
  const estado = obtenerEstadoNutricional(imc);
  const tmb = calcularTMB(peso, talla, edad, sexo);
  const caloriasObjetivo = calcularCaloriasObjetivo(tmb, objetivo);
  const recomendaciones = generarRecomendaciones({ objetivo, imc });

  const perfil = {
    ...Store.get('perfil_usuario', {}),
    edad, peso, talla, objetivo, sexo,
    imc: parseFloat(imc.toFixed(1)),
    tmb: Math.round(tmb),
    caloriasObjetivo,
    ultimaEvaluacion: new Date().toISOString()
  };
  Store.set('perfil_usuario', perfil);
  Metrics.track('recomendacion', { objetivo, imc });

  const resultCard = document.getElementById('resultado-card');
  const imcDisplay = document.getElementById('imc-display');
  const resultContent = document.getElementById('resultado-content');

  imcDisplay.style.background = `${estado.color}14`;
  imcDisplay.style.borderColor = `${estado.color}40`;
  imcDisplay.innerHTML = `
    <div class="imc-emoji">${estado.emoji}</div>
    <div class="imc-number" style="color:${estado.color}">${imc.toFixed(1)}</div>
    <div class="imc-label" style="color:${estado.color}">${estado.estado}</div>`;

  const top = recomendaciones[0];
  resultContent.innerHTML = `
    <div class="resultado-row"><span class="label">TMB</span><span class="value">${Math.round(tmb)} kcal/día</span></div>
    <div class="resultado-row"><span class="label">Calorías objetivo</span><span class="value">${caloriasObjetivo} kcal/día</span></div>
    <div class="resultado-row"><span class="label">Objetivo</span><span class="value">${getObjetivoLabel(objetivo)}</span></div>
    <div class="divider"></div>
    <div style="text-align:center;margin-top:16px">
      <div class="recommended-badge">⭐ Top Recomendado para ti</div>
      <div style="margin:16px 0">

  <img 
    src="${top.emoji}" 
    alt="${top.nombre}"
    style="
      width:110px;
      height:110px;
      object-fit:cover;
      border-radius:20px;
      box-shadow:0 8px 20px rgba(0,0,0,.15);
    "
  >

</div>
      <div style="font-weight:700;font-size:20px;color:var(--text)">${top.nombre}</div>
      <div style="color:var(--text-muted);font-size:13px;margin:6px 0">${top.descripcion}</div>
      <div style="font-size:22px;font-weight:700;color:var(--accent);margin:10px 0">${formatMoney(top.precio)}</div>
      <button class="btn btn-green btn-full" style="margin-top:4px" onclick="abrirPersonalizacion('${top.id}')">
        🎨 Personalizar y Agregar
      </button>
    </div>`;

  resultCard.style.display = 'block';
  resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  renderBowls(recomendaciones.map(r => r.id));
  renderPlanSemanal();
  showToast('¡Evaluación completada! 🎉', 'success');
}

function getObjetivoLabel(o) {
  const map={bajar:'🔻 Bajar de peso',mantener:'⚖️ Mantener peso',subir:'🔺 Ganar masa muscular'};
  return map[o]||o;
}

function loadSavedData() {
  const perfil = Store.get('perfil_usuario', {});
  if (perfil.edad) document.getElementById('edad').value = perfil.edad;
  if (perfil.peso) document.getElementById('peso').value = perfil.peso;
  if (perfil.talla) document.getElementById('talla').value = perfil.talla;
  if (perfil.objetivo) document.getElementById('objetivo').value = perfil.objetivo;
  if (perfil.sexo) document.getElementById('sexo').value = perfil.sexo;
  if (perfil.imc) renderBowls(generarRecomendaciones(perfil).map(r=>r.id));
}

// ===== BOWLS RENDER =====
function renderBowls(recomendadosIds=[]) {
  const container = document.getElementById('bowls-grid');
  if (!container) return;
  container.innerHTML = Object.values(BOWLS).map(bowl => {
    const isRec = recomendadosIds.includes(bowl.id);
    return `
      <div class="bowl-card ${isRec?'recommended':''}" onclick="abrirDetalleBowl('${bowl.id}')">
        ${isRec?'<div class="recommended-badge">⭐ Recomendado para ti</div>':''}
        <img src="${bowl.emoji}" alt="${bowl.nombre}" class="bowl-emoji-big" style="width:72px;height:72px;object-fit:cover;border-radius:50%;">
        <div class="bowl-name">${bowl.nombre}</div>
        <div class="bowl-price">${formatMoney(bowl.precio)}</div>
        <div class="bowl-desc">${bowl.descripcion}</div>
        <div class="bowl-macros">
          <span class="macro">🔥 ${bowl.calorias} kcal</span>
          <span class="macro">💪 ${bowl.proteinas}g prot</span>
          <span class="macro">🌾 ${bowl.carbos}g carbos</span>
        </div>
        <div class="bowl-benefits">${bowl.beneficios.map(b=>`<span class="tag">${b}</span>`).join('')}</div>
        <div style="display:flex;gap:8px;margin-top:12px">
          <button class="btn btn-secondary btn-sm" style="flex:1" onclick="event.stopPropagation();seleccionarBowl('${bowl.id}')">📦 Pedir</button>
          <button class="btn btn-green btn-sm" style="flex:1" onclick="event.stopPropagation();abrirPersonalizacion('${bowl.id}')">🎨 Personalizar</button>
        </div>
      </div>`;
  }).join('');
}

function abrirDetalleBowl(id) {
  const bowl = BOWLS[id];
  if (!bowl) return;
  openModal(`
    <div style="text-align:center;padding:8px 0 16px">
     <img src="${bowl.emoji}" alt="${bowl.nombre}" style="width:90px;height:90px;object-fit:cover;border-radius:50%;margin-bottom:8px;">
      <h2 style="font-family:var(--font-display);font-size:24px;margin-bottom:4px">${bowl.nombre}</h2>
      <div style="font-size:22px;font-weight:700;color:var(--accent);margin-bottom:12px">${formatMoney(bowl.precio)}</div>
      <p style="color:var(--text-muted);font-size:14px;margin-bottom:16px">${bowl.descripcion}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
        <div style="background:var(--bg-card2);border-radius:12px;padding:12px">
          <div style="font-size:22px">🔥</div><div style="font-weight:700">${bowl.calorias} kcal</div><div style="font-size:11px;color:var(--text-muted)">Calorías</div>
        </div>
        <div style="background:var(--bg-card2);border-radius:12px;padding:12px">
          <div style="font-size:22px">💪</div><div style="font-weight:700">${bowl.proteinas}g</div><div style="font-size:11px;color:var(--text-muted)">Proteínas</div>
        </div>
        <div style="background:var(--bg-card2);border-radius:12px;padding:12px">
          <div style="font-size:22px">🌾</div><div style="font-weight:700">${bowl.carbos}g</div><div style="font-size:11px;color:var(--text-muted)">Carbos</div>
        </div>
        <div style="background:var(--bg-card2);border-radius:12px;padding:12px">
          <div style="font-size:22px">🫒</div><div style="font-weight:700">${bowl.grasas}g</div><div style="font-size:11px;color:var(--text-muted)">Grasas</div>
        </div>
      </div>
      <div style="margin-bottom:16px">${bowl.beneficios.map(b=>`<span class="tag" style="margin:3px">${b}</span>`).join('')}</div>
      <div style="display:flex;gap:10px">
        <button class="btn btn-secondary btn-full" onclick="closeModal();abrirPersonalizacion('${id}')">🎨 Personalizar</button>
        <button class="btn btn-green btn-full" onclick="closeModal();Cart.add('${id}','centro');showToast('Agregado al carrito','success')">🛒 Agregar rápido</button>
      </div>
      <button class="btn btn-ghost btn-sm btn-full" style="margin-top:8px" onclick="closeModal()">Cerrar</button>
    </div>`);
}

function seleccionarBowl(id) {
  const bowlSelect = document.getElementById('bowl-select');
  if (bowlSelect) {
    bowlSelect.value = id;
    renderPedidoPreview();
    selectedToppings = [];
    renderToppings();
    showSection('pedido');
  }
}

// ===== PEDIDO CON TOPPINGS =====
function populateBowlSelect() {

  const select = document.getElementById('bowl-select');

  if (!select) return;

  select.innerHTML = Object.values(BOWLS).map(b => `
    <option value="${b.id}">
      ${b.nombre} — ${formatMoney(b.precio)}
    </option>
  `).join('');

  select.addEventListener('change', () => {
    renderPedidoPreview();
  });

  document.getElementById('zona-select')
    ?.addEventListener('change', renderPedidoPreview);
}

function renderToppings() {
  const container = document.getElementById('toppings-container');
  if (!container) return;
  container.innerHTML = Object.entries(TOPPINGS).map(([catKey, cat]) => `
    <div class="topping-category">
      <div class="topping-cat-label">${cat.label}</div>
      <div class="topping-items">
        ${Object.values(cat.items).map(t => {
          const sel = selectedToppings.includes(t.id);
          return `
            <button class="topping-btn ${sel?'selected':''}" onclick="toggleTopping('${t.id}')" data-tid="${t.id}">
              <span class="topping-emoji">${t.emoji}</span>
              <span class="topping-name">${t.nombre}</span>
              <span class="topping-price">${t.precio>0?'+'+formatMoney(t.precio):'Gratis'}</span>
            </button>`;
        }).join('')}
      </div>
    </div>`).join('');
  renderPedidoPreview();
}

function toggleTopping(id) {
  const idx = selectedToppings.indexOf(id);
  if (idx >= 0) selectedToppings.splice(idx, 1);
  else selectedToppings.push(id);
  // Update button state
  document.querySelectorAll(`[data-tid="${id}"]`).forEach(btn => {
    btn.classList.toggle('selected', selectedToppings.includes(id));
  });
  renderPedidoPreview();
}

function renderPedidoPreview() {
  const bowlId = document.getElementById('bowl-select')?.value;
  const zona = document.getElementById('zona-select')?.value;
  const preview = document.getElementById('pedido-preview');
  if (!preview || !bowlId) return;
  const bowl = BOWLS[bowlId];
  const delivery = calcularDelivery(zona);
  const {caloriasExtra, precioExtra} = calcularNutricionToppings(selectedToppings);
  const total = bowl.precio + precioExtra + delivery;
  const calTotal = bowl.calorias + caloriasExtra;

  const toppingLines = selectedToppings.map(tid => {
    const info = getToppingInfo(tid);
    return info ? `<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--green-400)">
      <span>${info.emoji} ${info.nombre}</span><span>+${formatMoney(info.precio)}</span></div>` : '';
  }).join('');

  preview.innerHTML = `
    <div style="background:var(--bg-card2);border-radius:12px;padding:14px;margin-top:12px">
      <div style="
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:10px;
">

  <div style="
    display:flex;
    align-items:center;
    gap:12px;
  ">

    <img 
      src="${bowl.emoji}" 
      alt="${bowl.nombre}"
      style="
        width:60px;
        height:60px;
        object-fit:cover;
        border-radius:14px;
      "
    >

    <div>

      <div style="
        color:var(--text-light);
        font-weight:700;
      ">
        ${bowl.nombre}
      </div>

      <div style="
        font-size:12px;
        color:var(--text-muted);
      ">
        Bowl saludable
      </div>

    </div>

  </div>

  <span style="
    font-weight:700;
    font-size:18px;
  ">
    ${formatMoney(bowl.precio)}
  </span>

</div>
      ${toppingLines}
      ${precioExtra>0?`<div style="display:flex;justify-content:space-between;font-size:13px;color:var(--text-muted)">
        <span>Toppings (${selectedToppings.length})</span><span>+${formatMoney(precioExtra)}</span></div>`:''}
      <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--text-muted)">
        <span>🛵 Delivery (${zona})</span><span>${formatMoney(delivery)}</span>
      </div>
      <div class="divider" style="margin:8px 0"></div>
      <div style="display:flex;justify-content:space-between;font-weight:700;font-size:18px">
        <span>Total</span><span style="color:var(--accent)">${formatMoney(total)}</span>
      </div>
      <div style="font-size:12px;color:var(--text-muted);margin-top:6px;text-align:center">
        🔥 ${calTotal} kcal estimadas
      </div>
    </div>`;
}

function agregarAlCarrito() {
  const bowlId = document.getElementById('bowl-select')?.value;
  const zona = document.getElementById('zona-select')?.value;
  const notas = document.getElementById('notas-pedido')?.value?.trim() || '';
  if (!bowlId) return;
  Cart.add(bowlId, zona, [...selectedToppings], notas);
  selectedToppings = [];
  document.querySelectorAll('.topping-btn').forEach(b => b.classList.remove('selected'));
  if (document.getElementById('notas-pedido')) document.getElementById('notas-pedido').value = '';
  renderPedidoPreview();
}

function abrirPersonalizacion(bowlId) {
  const bowl = BOWLS[bowlId];
  if (!bowl) return;
  // Navigate to pedido section and preselect bowl
  const select = document.getElementById('bowl-select');
  if (select) select.value = bowlId;
  selectedToppings = [];
  renderToppings();
  showSection('pedido');
  setTimeout(() => {
    document.getElementById('toppings-container')?.scrollIntoView({behavior:'smooth',block:'start'});
  }, 300);
  showToast(`🎨 Personalizando ${bowl.nombre}`, 'info');
}

// ===== HISTORIAL =====
function renderHistorial() {
  const container = document.getElementById('historial-pedidos');
  if (!container) return;
  const historial = Store.get('historial_pedidos', []);
  if (!historial.length) {
    container.innerHTML=`<div class="empty-state"><span class="empty-icon">📦</span><p>Sin pedidos aún. ¡Haz tu primer pedido!</p></div>`;
    return;
  }
  container.innerHTML = historial.slice(0,10).map(p=>{
    const toppingCount = p.items?.reduce((s,i)=>s+(i.toppings?.length||0),0)||0;
    return `
      <div class="historial-item">
        <div class="historial-header">
          <span class="historial-date">📅 ${formatDate(p.fecha)}</span>
          <span class="historial-total">${formatMoney(p.total)}</span>
        </div>
        <div class="historial-items">

  ${p.items?.map(i => `

    <div style="
      display:flex;
      align-items:center;
      gap:10px;
      margin-bottom:10px;
    ">

      <img 
        src="${i.emoji}" 
        alt="${i.nombre}"
        style="
          width:50px;
          height:50px;
          object-fit:cover;
          border-radius:12px;
        "
      >

      <div>

        <div style="
          font-weight:700;
          color:var(--text-light);
        ">
          ${i.nombre}
          ${i.cantidad > 1 ? ` ×${i.cantidad}` : ''}
        </div>

      </div>

    </div>

  `).join('') || ''}

</div>
        ${toppingCount>0?`<div style="font-size:11px;color:var(--green-400);margin-top:4px">✨ ${toppingCount} topping(s) personalizado(s)</div>`:''}
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn btn-secondary btn-sm" onclick="Cart.repeatOrder(${p.id})">🔁 Repetir</button>
          <button class="btn btn-ghost btn-sm" onclick="verDetallePedido(${p.id})">👁 Ver detalle</button>
        </div>
      </div>`; 
  }).join('');
}

function verDetallePedido(pedidoId) {
  const historial = Store.get('historial_pedidos',[]);
  const pedido = historial.find(p=>p.id===pedidoId);
  if (!pedido) return;
  const itemsHTML = pedido.items?.map(item=>{
    const toppingNames = (item.toppings||[]).map(t=>{const i=getToppingInfo(t);return i?`${i.emoji} ${i.nombre}`:''}).filter(Boolean).join(', ');
    return `
      <div style="background:var(--bg-card2);border-radius:10px;padding:10px;margin-bottom:8px">
        <div style="font-weight:700">${item.emoji||'🥗'} ${item.nombre} × ${item.cantidad||1}</div>
        ${toppingNames?`<div style="font-size:12px;color:var(--green-400)">+${toppingNames}</div>`:''}
        ${item.notas?`<div style="font-size:12px;color:var(--text-muted);font-style:italic">📝 ${item.notas}</div>`:''}
      </div>`;
  }).join('')||'';
  openModal(`
    <div>
      <h3 style="font-family:var(--font-display);font-size:20px;margin-bottom:4px">📦 Detalle del Pedido</h3>
      <p style="color:var(--text-muted);font-size:13px;margin-bottom:16px">📅 ${formatDate(pedido.fecha)}</p>
      ${itemsHTML}
      <div class="divider" style="margin:12px 0"></div>
      <div style="display:flex;justify-content:space-between;font-weight:700;font-size:18px">
        <span>Total</span><span style="color:var(--accent)">${formatMoney(pedido.total)}</span>
      </div>
      <div style="display:flex;gap:8px;margin-top:16px">
        <button class="btn btn-green btn-full" onclick="closeModal();Cart.repeatOrder(${pedidoId})">🔁 Repetir pedido</button>
        <button class="btn btn-ghost btn-full btn-sm" onclick="closeModal()">Cerrar</button>
      </div>
    </div>`);
}

// ===== PERFIL =====
function renderPerfil() {
  const container = document.getElementById('perfil-content');
  if (!container) return;
  const perfil = Store.get('perfil_usuario',{});
  const historial = Store.get('historial_pedidos',[]);
  const metrics = Metrics.get();
  container.innerHTML = `
    <div class="perfil-grid">
      <div class="card card-elevated" style="text-align:center">
        <div class="perfil-avatar" id="perfil-avatar-emoji" onclick="cambiarAvatar()" title="Cambiar avatar" style="cursor:pointer">${perfil.avatar||'😊'}</div>
        <h3 style="font-size:22px;margin-bottom:4px" id="perfil-nombre-display">${perfil.nombre||'Usuario'}</h3>
        <p style="color:var(--text-muted);font-size:13px;margin-bottom:16px">${perfil.usuario||''}</p>
        ${perfil.imc?`
          <div style="background:var(--green-100);border-radius:var(--radius-lg);padding:16px;margin-bottom:16px;border:1px solid var(--border)">
            <div style="font-size:36px;font-weight:900;color:var(--accent);font-family:var(--font-display)">${perfil.imc}</div>
            <div style="font-size:12px;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:.05em">IMC Actual</div>
          </div>`:'<p style="color:var(--text-muted);font-size:13px;margin-bottom:16px">Sin evaluación nutricional</p>'}
        <div style="display:flex;flex-direction:column;gap:8px">
          <button class="btn btn-secondary btn-full btn-sm" onclick="editarPerfil()">✏️ Editar perfil</button>
          <button class="btn btn-secondary btn-full btn-sm" onclick="showSection('nutricion')">📋 Nueva evaluación</button>
        </div>
      </div>
      <div>
        <div class="card card-elevated" style="margin-bottom:16px">
          <h4 style="margin-bottom:16px;font-family:var(--font-display);font-size:18px">📊 Datos Nutricionales</h4>
          ${[
            ['Edad', perfil.edad?perfil.edad+' años':'—'],
            ['Peso', perfil.peso?perfil.peso+' kg':'—'],
            ['Talla', perfil.talla?perfil.talla+' cm':'—'],
            ['IMC', perfil.imc?perfil.imc+' kg/m²':'—'],
            ['TMB', perfil.tmb?perfil.tmb+' kcal/día':'—'],
            ['Calorías objetivo', perfil.caloriasObjetivo?perfil.caloriasObjetivo+' kcal/día':'—'],
            ['Objetivo', perfil.objetivo?getObjetivoLabel(perfil.objetivo):'—'],
            ['Última evaluación', perfil.ultimaEvaluacion?formatDate(perfil.ultimaEvaluacion):'—']
          ].map(([label,value])=>`
            <div class="perfil-stat">
              <span class="label">${label}</span>
              <span class="value">${value}</span>
            </div>`).join('')}
        </div>
        <div class="card">
          <h4 style="margin-bottom:16px;font-family:var(--font-display);font-size:18px">🛒 Actividad</h4>
          ${[
            ['Total pedidos', historial.length],
            ['Gasto total', formatMoney(historial.reduce((s,p)=>s+p.total,0))],
            ['Toppings usados', historial.reduce((s,p)=>s+(p.items?.reduce((ss,i)=>ss+(i.toppings?.length||0),0)||0),0)],
            ['Evaluaciones', metrics.recomendaciones],
          ].map(([label,value])=>`
            <div class="perfil-stat">
              <span class="label">${label}</span>
              <span class="value">${value}</span>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
}

function editarPerfil() {
  const perfil = Store.get('perfil_usuario',{});
  openModal(`
    <h3 style="font-family:var(--font-display);font-size:20px;margin-bottom:20px">✏️ Editar Perfil</h3>
    <div class="form-group"><label class="form-label">Nombre</label>
      <input class="input-field" id="ep-nombre" value="${perfil.nombre||''}" placeholder="Tu nombre">
    </div>
    <div class="form-group"><label class="form-label">Teléfono</label>
      <input class="input-field" id="ep-tel" value="${perfil.telefono||''}" placeholder="999 999 999" type="tel">
    </div>
    <div class="form-group"><label class="form-label">Dirección de entrega</label>
      <input class="input-field" id="ep-dir" value="${perfil.direccion||''}" placeholder="Calle, número, referencia">
    </div>
    <div class="form-group"><label class="form-label">Alergias / Restricciones</label>
      <input class="input-field" id="ep-alergia" value="${perfil.alergias||''}" placeholder="Ej: sin gluten, sin lactosa">
    </div>
    <div style="display:flex;gap:8px;margin-top:16px">
      <button class="btn btn-green btn-full" onclick="guardarPerfil()">💾 Guardar</button>
      <button class="btn btn-ghost btn-full btn-sm" onclick="closeModal()">Cancelar</button>
    </div>`);
}

function guardarPerfil() {
  const perfil = Store.get('perfil_usuario',{});
  const nombre = document.getElementById('ep-nombre')?.value?.trim();
  const telefono = document.getElementById('ep-tel')?.value?.trim();
  const direccion = document.getElementById('ep-dir')?.value?.trim();
  const alergias = document.getElementById('ep-alergia')?.value?.trim();
  Store.set('perfil_usuario',{...perfil,nombre,telefono,direccion,alergias});
  closeModal();
  renderPerfil();
  showToast('Perfil actualizado ✅','success');
}

const AVATARS = ['😊','🙋','🧑‍🦱','👩‍🦰','🧔','👨‍🦳','🧑‍🍳','💪','🌿','🏃'];
function cambiarAvatar() {
  openModal(`
    <h3 style="font-family:var(--font-display);font-size:18px;margin-bottom:16px">Elige tu avatar</h3>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:16px">
      ${AVATARS.map(a=>`<button onclick="setAvatar('${a}')" style="font-size:32px;background:var(--bg-card2);border:2px solid var(--border);border-radius:12px;padding:10px;cursor:pointer" title="${a}">${a}</button>`).join('')}
    </div>
    <button class="btn btn-ghost btn-sm btn-full" onclick="closeModal()">Cancelar</button>`);
}
function setAvatar(emoji) {
  Store.update('perfil_usuario',p=>({...p,avatar:emoji}),{});
  closeModal();
  renderPerfil();
}

// ===== MÉTRICAS =====
function renderMetricas() {
  const container = document.getElementById('metricas-content');
  if (!container) return;
  const m = Metrics.get();
  const historial = Store.get('historial_pedidos',[]);
  const bowlCount = {};
  historial.forEach(p => p.items?.forEach(i => {
    bowlCount[i.bowlId] = (bowlCount[i.bowlId]||0) + (i.cantidad||1);
  }));
  const topBowl = Object.entries(bowlCount).sort((a,b)=>b[1]-a[1])[0];

  // Evolución últimos 7 pedidos
  const ultimos = historial.slice(0,7).reverse();
  const maxTotal = Math.max(...ultimos.map(p=>p.total),1);
  const sparkline = ultimos.map(p=>{
    const h = Math.round((p.total/maxTotal)*40)+5;
    return `<div style="width:24px;background:var(--green-400);border-radius:3px 3px 0 0;height:${h}px;opacity:.85" title="${formatMoney(p.total)}"></div>`;
  }).join('');

  container.innerHTML = `
    <div class="metricas-grid">
      ${[
        {label:'Evaluaciones',value:m.recomendaciones,icon:'🎯',color:'var(--green-400)'},
        {label:'Compras realizadas',value:m.compras,icon:'🛒',color:'var(--gold)'},
        {label:'Tasa de Conversión',value:m.conversion+'%',icon:'📈',color:'#3b82f6'},
        {label:'Total Gastado',value:formatMoney(m.totalVentas),icon:'💰',color:'#22c55e'},
        {label:'Ticket Promedio',value:formatMoney(m.ticketPromedio),icon:'🎫',color:'#a855f7'},
        {label:'Bowl Favorito',value:topBowl?(BOWLS[topBowl[0]]?.nombre||'—'):'—',icon:'⭐',color:'var(--gold-light)'},
      ].map(card=>`
        <div class="metric-card" style="border-top-color:${card.color}">
          <div style="font-size:28px">${card.icon}</div>
          <div class="metric-value" style="color:${card.color}">${card.value}</div>
          <div class="metric-label">${card.label}</div>
        </div>`).join('')}
    </div>
    ${ultimos.length>0?`
    <div class="card card-elevated" style="margin-bottom:16px">
      <h3 style="margin-bottom:16px;font-family:var(--font-display);font-size:20px">📈 Últimos Pedidos</h3>
      <div style="display:flex;align-items:flex-end;gap:6px;height:50px;padding:0 4px">${sparkline}</div>
      <div style="font-size:11px;color:var(--text-muted);margin-top:6px">Evolución de gasto (últimos ${ultimos.length} pedidos)</div>
    </div>`:''}
    <div class="card card-elevated">
      <h3 style="margin-bottom:16px;font-family:var(--font-display);font-size:20px">📦 Bowls Pedidos</h3>
      ${Object.keys(bowlCount).length===0
        ?`<div class="empty-state"><span class="empty-icon">📊</span><p>Sin datos de pedidos aún</p></div>`
        :Object.entries(bowlCount).sort((a,b)=>b[1]-a[1]).map(([id,count])=>{
          const bowl=BOWLS[id];
          const pct=Math.round((count/(m.totalItems||1))*100);
          return `
            <div style="margin-bottom:16px">
              <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:14px">
                <span>${bowl?.emoji||'🥗'} ${bowl?.nombre||id}</span>
                <span style="font-weight:700;color:var(--accent)">${count} pedidos</span>
              </div>
              <div style="background:var(--bg-card2);border-radius:var(--radius-full);height:8px;overflow:hidden">
                <div style="background:linear-gradient(90deg,var(--green-500),var(--accent));width:${pct}%;height:100%;border-radius:var(--radius-full);transition:width .6s ease"></div>
              </div>
            </div>`;
        }).join('')}
    </div>`;
}

// ===== PLAN SEMANAL =====
function renderPlanSemanal() {
  const container = document.getElementById('plan-container');
  if (!container) return;
  const perfil = Store.get('perfil_usuario',{});
  if (!perfil.objetivo) {
    container.innerHTML=`
      <div class="empty-state">
        <span class="empty-icon">📅</span>
        <h3>Primero realiza tu evaluación</h3>
        <p>Necesitamos tu IMC y objetivo para generar tu plan semanal</p>
        <button class="btn btn-green" style="margin-top:20px" onclick="showSection('nutricion')">Evaluar ahora</button>
      </div>`;
    return;
  }
  const plan = generarPlanSemanal(perfil);
  const tabsHTML = plan.map((d,i)=>`<button class="plan-tab ${i===0?'active':''}" onclick="selectPlanDay(${i})">${d.dia.slice(0,3)}</button>`).join('');
  const daysHTML = plan.map((d,i)=>`
    <div class="plan-day-card ${i===0?'active':''}" id="plan-day-${i}">
      <h3 style="margin-bottom:20px;font-size:22px">${d.dia}</h3>
      <div class="meal-slot">
        <div class="meal-slot-title">☀️ Desayuno</div>
        <div class="meal-slot-name">${d.desayuno.emoji} ${d.desayuno.nombre}</div>
        <div class="meal-slot-cal">~${d.desayuno.cal} kcal</div>
      </div>
      <div class="meal-slot" style="border-left-color:var(--green-500)">
        <div class="meal-slot-title" style="color:var(--green-400)">🌿 Almuerzo</div>
        <div class="meal-slot-name">${d.almuerzo.emoji} ${d.almuerzo.nombre}</div>
        <div class="meal-slot-cal">~${d.almuerzo.cal} kcal</div>
        ${d.almuerzo.bowlId?`<button class="btn btn-green btn-sm" style="margin-top:8px" onclick="abrirPersonalizacion('${d.almuerzo.bowlId}')">🎨 Pedir y personalizar</button>`:''}
      </div>
      <div class="meal-slot" style="border-left-color:var(--green-700)">
        <div class="meal-slot-title" style="color:var(--text-muted)">🌙 Cena</div>
        <div class="meal-slot-name">${d.cena.emoji} ${d.cena.nombre}</div>
        <div class="meal-slot-cal">~${d.cena.cal} kcal</div>
      </div>
      <div class="plan-total-cal">
        🔥 Total: ~${d.totalCal} kcal
        ${perfil.caloriasObjetivo?` · Objetivo: ${perfil.caloriasObjetivo} kcal`:''}
      </div>
    </div>`).join('');
  container.innerHTML=`<div class="plan-tabs">${tabsHTML}</div>${daysHTML}`;
}

function selectPlanDay(index) {
  document.querySelectorAll('.plan-tab').forEach((t,i)=>t.classList.toggle('active',i===index));
  document.querySelectorAll('.plan-day-card').forEach((d,i)=>d.classList.toggle('active',i===index));
}

// ===== CHAT =====
function enviarMensaje() {
  const input = document.getElementById('chat-input');
  const texto = input.value.trim();
  if (!texto) return;
  input.value = '';
  ChatBot.send(texto);
}
function enviarRapido(texto) { ChatBot.send(texto); }
document.addEventListener('keydown', e => {
  if (e.key==='Enter') {
    const input=document.getElementById('chat-input');
    if (document.activeElement===input) enviarMensaje();
  }
});

// ===== AUTH =====
function cerrarSesion() {
  Auth.logout();
  window.location.href='login.html';
}
function agregarAlCarrito() {
  const bowlId = document.getElementById("bowl-select").value;
  const zona = document.getElementById("zona-select").value;
  const notas = document.getElementById("notas-pedido").value;

  // obtener toppings seleccionados
  const checks = document.querySelectorAll("#toppings-container input:checked");
  const toppings = Array.from(checks).map(c => c.value);

  Cart.add(bowlId, zona, toppings, notas);
}