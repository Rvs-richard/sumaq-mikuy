// ===== CARRITO MODULE – Sumaq Mikuy v2 =====
const Cart = {
  items: [],

  init() {
    this.items = Store.get('carrito_actual', []);
    this.render();
    this.updateBadge();
  },

  add(bowlId, zona='centro', toppings=[], notas='') {
    const bowl = BOWLS[bowlId];
    if (!bowl) return;
    const delivery = calcularDelivery(zona);
    const {precioExtra} = calcularNutricionToppings(toppings);
    const precioUnitario = bowl.precio + precioExtra;
    // Buscar item igual (mismo bowl, zona, toppings y notas)
    const key = bowlId + zona + toppings.sort().join(',') + notas;
    const existing = this.items.find(i => i._key === key);
    if (existing) {
      existing.cantidad = (existing.cantidad||1) + 1;
      existing.total = (precioUnitario * existing.cantidad) + delivery;
    } else {
      this.items.push({
        id: Date.now(), _key: key,
        bowlId, nombre: bowl.nombre, emoji: bowl.emoji,
        precio: bowl.precio, precioExtra, precioUnitario, delivery, zona,
        cantidad: 1, toppings: [...toppings], notas,
        total: precioUnitario + delivery
      });
    }
    Store.set('carrito_actual', this.items);
    this.render();
    const toppingCount = toppings.length ? ` + ${toppings.length} extras` : '';
    showToast(`${bowl.emoji} ${bowl.nombre}${toppingCount} agregado`, 'success');
    this.updateBadge();
    const badge = document.querySelector('.cart-count');
    if (badge) { badge.style.transform='scale(1.4)'; setTimeout(()=>badge.style.transform='',300); }
  },

  updateItem(id, qty) {
    const item = this.items.find(i=>i.id===id);
    if (!item) return;
    if (qty<=0) { this.remove(id); return; }
    item.cantidad = qty;
    const bowl = BOWLS[item.bowlId];
    const precioUnitario = (bowl?.precio||item.precio) + (item.precioExtra||0);
    item.total = (precioUnitario * qty) + item.delivery;
    Store.set('carrito_actual', this.items);
    this.render();
    this.updateBadge();
  },

  remove(id) {
    this.items = this.items.filter(i=>i.id!==id);
    Store.set('carrito_actual', this.items);
    this.render();
    this.updateBadge();
  },

  clear() {
    this.items = [];
    Store.set('carrito_actual',[]);
    this.render();
    this.updateBadge();
  },

  getTotal() {
    return this.items.reduce((s,i)=>{
      const bowl = BOWLS[i.bowlId];
      const precio = (bowl?bowl.precio:i.precio) + (i.precioExtra||0);
      return s + (precio*(i.cantidad||1)) + i.delivery;
    },0);
  },

  getTotalItems() {
    return this.items.reduce((s,i)=>s+(i.cantidad||1),0);
  },

  updateBadge() {
    const count = this.getTotalItems();
    document.querySelectorAll('.cart-count').forEach(b=>{
      b.textContent=count;
      b.style.display=count>0?'flex':'none';
    });
    const old=document.getElementById('cart-count');
    if(old) old.textContent=count;
  },

  render() {
    const container = document.getElementById('carrito-items');
    const totalEl   = document.getElementById('carrito-total');
    if (!container) return;
    if (this.items.length===0) {
      container.innerHTML=`<div class="empty-state" style="padding:32px"><span class="empty-icon">🛒</span><p>Tu carrito está vacío</p></div>`;
      if(totalEl) totalEl.textContent='S/0.00';
      return;
    }
    container.innerHTML = this.items.map(item=>{
      const bowl = BOWLS[item.bowlId];
      const precioU = (bowl?bowl.precio:item.precio)+(item.precioExtra||0);
      const subtotal = (precioU*(item.cantidad||1))+item.delivery;
      const toppingNames = (item.toppings||[]).map(t=>{
        const info=getToppingInfo(t); return info?`${info.emoji}${info.nombre}`:'';
      }).filter(Boolean).join(', ');
      return `
        <div class="cart-item animate-fade-up" data-id="${item.id}">
          <div class="cart-item-info">
         <img src="${bowl?.emoji || item.emoji || ''}" alt="${item.nombre}"
     style="width:48px;height:48px;object-fit:cover;border-radius:50%;flex-shrink:0">
            <div style="flex:1">
              <div class="cart-item-name">${item.nombre}</div>
              ${toppingNames?`<div style="font-size:11px;color:var(--green-400);margin-top:2px">+${toppingNames}</div>`:''}
              ${item.notas?`<div style="font-size:11px;color:var(--text-muted);margin-top:2px;font-style:italic">📝 ${item.notas}</div>`:''}
              <div class="cart-item-detail">${formatMoney(precioU)} × ${item.cantidad||1} + delivery ${formatMoney(item.delivery)}</div>
            </div>
          </div>
          <div class="cart-item-right">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
              <button class="qty-btn" onclick="Cart.updateItem(${item.id},(${item.cantidad||1})-1)">−</button>
              <span style="font-weight:700;min-width:18px;text-align:center">${item.cantidad||1}</span>
              <button class="qty-btn" onclick="Cart.updateItem(${item.id},(${item.cantidad||1})+1)">+</button>
            </div>
            <span class="cart-item-price">${formatMoney(subtotal)}</span>
            <button class="btn btn-ghost btn-sm" onclick="Cart.remove(${item.id})" title="Eliminar">🗑️</button>
          </div>
        </div>`;
    }).join('');
    if(totalEl) totalEl.textContent=formatMoney(this.getTotal());
  },

  checkout() {
    if (this.items.length===0) { showToast('Tu carrito está vacío','error'); return; }
    const perfil = Store.get('perfil_usuario',{});
    const nombre = perfil.nombre||'Cliente';
    const total  = this.getTotal();
    let msg = `¡Hola! Soy ${nombre}, quiero pedir desde *Sumaq Mikuy* 🌿\n\n📦 *MI PEDIDO:*\n`;
    this.items.forEach(item=>{
      const bowl=BOWLS[item.bowlId];
      const precio=(bowl?bowl.precio:item.precio)+(item.precioExtra||0);
      msg += `• ${item.emoji} ${item.nombre} × ${item.cantidad||1} — ${formatMoney(precio*(item.cantidad||1))}\n`;
      if (item.toppings?.length) {
        item.toppings.forEach(t=>{ const info=getToppingInfo(t); if(info) msg+=`  ➕ ${info.emoji} ${info.nombre} (+${formatMoney(info.precio)})\n`; });
      }
      if (item.notas) msg += `  📝 Nota: ${item.notas}\n`;
      msg += `  🛵 Delivery (${item.zona}): ${formatMoney(item.delivery)}\n`;
    });
    msg += `\n💰 *TOTAL: ${formatMoney(total)}*\n¡Muchas gracias! 🙏`;
    const pedido = {
      id:Date.now(), fecha:new Date().toISOString(),
      items:[...this.items], total, nombre
    };
    Store.update('historial_pedidos',h=>{ if(!Array.isArray(h))h=[]; h.unshift(pedido); return h.slice(0,50); },[]);
    Metrics.track('compra',{total,items:this.getTotalItems()});
   window.open(`https://wa.me/51958368689?text=${encodeURIComponent(msg)}`, '_blank');

    showToast('¡Pedido enviado por WhatsApp! 🎉','success');
    this.clear();
  },

  repeatOrder(pedidoId) {
    const historial = Store.get('historial_pedidos',[]);
    const pedido = historial.find(p=>p.id===pedidoId);
    if (!pedido) return;
    pedido.items.forEach(item=>{
      this.items.push({...item, id:Date.now()+Math.random()});
    });
    Store.set('carrito_actual',this.items);
    this.render();
    this.updateBadge();
    showToast('¡Pedido repetido! 🔁','success');
  }
};
