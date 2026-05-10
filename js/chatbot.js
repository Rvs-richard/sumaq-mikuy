// ===== CHATBOT IA NUTRICIONISTA – Sumaq Mikuy (VERSIÓN CORREGIDA) =====

const ChatBot = {
  messages: [],
  history: [],
  isTyping: false,

  SYSTEM_PROMPT: `Eres Sumaq, nutricionista virtual del restaurante "Sumaq Mikuy" en Ayacucho, Perú.
Tu rol es orientar a los clientes sobre nutrición personalizada y los productos del menú.

MENÚ DISPONIBLE:
- 🥗 Bowl Light (S/15) – 320 kcal
- ⚖️ Bowl Balanceado (S/18) – 450 kcal
- 💪 Bowl Proteico (S/20) – 580 kcal
- ⚡ Bowl Energía (S/22) – 520 kcal

Responde en español, claro, breve y amigable.`,

  init() {
    this.messages = [];
    this.history = [];
    this.renderMessages();
    setTimeout(() => this.addMessage('bot', this.getWelcome()), 400);
  },

  getWelcome() {
    const perfil = Store.get('perfil_usuario', {});
    const nombre = perfil.nombre ? `, ${perfil.nombre}` : '';
    const hora = new Date().getHours();
    const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';
    return `${saludo}${nombre}! 🌿 Soy **Sumaq**, tu nutricionista virtual. ¿En qué te ayudo hoy?`;
  },

  // 🔥 NUEVA FUNCIÓN (usa tu backend)
  async callAPI(userMessage) {
    try {
      const perfil = Store.get('perfil_usuario', {});
      let contextMsg = userMessage;

      if (perfil.nombre || perfil.imc || perfil.objetivo) {
        const ctx = [];
        if (perfil.nombre) ctx.push(`nombre: ${perfil.nombre}`);
        if (perfil.imc) ctx.push(`IMC: ${perfil.imc}`);
        if (perfil.objetivo) ctx.push(`objetivo: ${perfil.objetivo}`);
        if (perfil.caloriasObjetivo) ctx.push(`calorías objetivo/día: ${perfil.caloriasObjetivo}`);
        contextMsg = `[Perfil del cliente – ${ctx.join(', ')}]\n${userMessage}`;
      }

      const response = await fetch("/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mensaje: contextMsg
        })
      });

      if (!response.ok) {
        throw new Error(response.status);
      }

      const data = await response.json();
      return data.respuesta;

    } catch (error) {
      throw error;
    }
  },

  detectAction(texto) {
    const t = texto.toLowerCase();
    if (/bowl light/.test(t))      return { label: '➕ Agregar Bowl Light', bowlId: 'light' };
    if (/bowl proteico/.test(t))   return { label: '➕ Agregar Bowl Proteico', bowlId: 'proteico' };
    if (/bowl balanceado/.test(t)) return { label: '➕ Agregar Bowl Balanceado', bowlId: 'balanceado' };
    if (/bowl energ/.test(t))      return { label: '➕ Agregar Bowl Energía', bowlId: 'energia' };
     if (/bowl energ/.test(t))      return { label: '➕ Agregar Bowl Energía', bowlId: 'energia' };
    return null;
  },

  async send(texto) {
    if (!texto.trim() || this.isTyping) return;

    this.addMessage('user', texto);
    this.isTyping = true;
    this.showTyping();

    try {
      const respuesta = await this.callAPI(texto);

      this.hideTyping();
      this.isTyping = false;

      const action = this.detectAction(respuesta);
      this.addMessage('bot', respuesta, action);

    } catch (err) {
      this.hideTyping();
      this.isTyping = false;

      console.error("Chat error:", err);

      let msg = '⚠️ Error al conectar con la IA';

      if (err.message.includes('401')) {
        msg = '⚠️ Error de autenticación en el servidor';
      } else if (err.message.includes('500')) {
        msg = '⚠️ Error interno del servidor';
      }

      this.addMessage('bot', msg);
    }
  },

  addMessage(role, content, action = null) {
    this.messages.push({ role, content, action, ts: Date.now() });
    this.renderMessages();
    this.scrollToBottom();
  },

  showTyping() {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    const typing = document.createElement('div');
    typing.id = 'typing-indicator';
    typing.className = 'chat-msg bot';
    typing.innerHTML = `
      <div class="chat-avatar">🌿</div>
      <div class="chat-bubble typing-bubble">
        <span></span><span></span><span></span>
      </div>`;
    container.appendChild(typing);
  },

  hideTyping() {
    const t = document.getElementById('typing-indicator');
    if (t) t.remove();
  },

  renderMessages() {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    container.innerHTML = this.messages.map(msg => this.renderMsg(msg)).join('');
  },

  renderMsg(msg) {
    const isBot = msg.role === 'bot';

    const text = (msg.content || '')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');

    const actionBtn = msg.action ? `
      <button class="btn btn-green btn-sm" onclick="Cart.add('${msg.action.bowlId}','centro')">
        ${msg.action.label}
      </button>` : '';

    return `
      <div class="chat-msg ${isBot ? 'bot' : 'user'}">
        ${isBot ? '<div class="chat-avatar">🌿</div>' : ''}
        <div class="chat-bubble">
          <div>${text}</div>
          ${actionBtn}
        </div>
      </div>`;
  },

  scrollToBottom() {
    const c = document.getElementById('chat-messages');
    if (c) setTimeout(() => c.scrollTop = c.scrollHeight, 50);
  }
};