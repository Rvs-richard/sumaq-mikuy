=====================================
SUMAQ MIKUY v3 – Nutrición Inteligente
=====================================

MEJORAS EN ESTA VERSIÓN:
★ Diseño completamente renovado (hero section como la imagen de referencia)
★ Autenticación real con usuario/contraseña (guarda en localStorage por usuario)
★ Panel Admin protegido con contraseña propia (usuario: admin / contraseña: sumaq2024)
★ Chat IA sin que el cliente ingrese API key — se configura desde el Admin
★ Registro de nuevos usuarios con validación
★ Carrito mejorado con cantidades
★ Sistema más dinámico y atractivo

CREDENCIALES ADMIN:
Usuario: admin
Contraseña: sumaq2024

CONFIGURAR CHAT IA:
1. Ingresa al Panel Admin (admin.html)
2. Ve a "Configuración"
3. Ingresa tu API Key de Anthropic (console.anthropic.com)
4. Haz clic en "Guardar API Key"
5. El chat IA estará disponible para todos los clientes automáticamente

CÓMO USAR:
1. Abre frontend/login.html en tu navegador
2. Regístrate o inicia sesión
3. ¡Disfruta la app!

NOTA: Para el Chat IA, también puedes ingresar la API key
directamente en frontend/index.html línea 9:
window.SUMAQ_AI_KEY = 'tu-api-key-aqui';

ESTRUCTURA:
/frontend/
  ├── index.html     → App principal
  ├── login.html     → Login / Registro
  ├── admin.html     → Panel admin (protegido)
  ├── css/main.css   → Estilos
  └── js/
      ├── store.js      → Storage + Auth + Métricas
      ├── nutrition.js  → Motor nutricional
      ├── cart.js       → Carrito
      ├── chatbot.js    → Chat IA (Claude)
      └── app.js        → Controlador principal
=====================================
