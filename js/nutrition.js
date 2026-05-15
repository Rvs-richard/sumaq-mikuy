// ===== NUTRITION ENGINE – Sumaq Mikuy v2 =====

const BOWLS = {
  light: {
    id: 'light', nombre: 'Bowl Light', precio: 15, emoji: 'img/bowl ligth.png',
    calorias: 320, proteinas: 18, carbos: 35, grasas: 8,
    descripcion: 'Ensalada de quinua, espinacas, pepino, tomate cherry y aderezo de limón',
    beneficios: ['Bajo en calorías', 'Alto en fibra', 'Hidratante', 'Antioxidantes'],
    tags: ['#bajarPeso', '#ligero', '#detox'], objetivos: ['bajar']
  },
  proteico: {
    id: 'proteico', nombre: 'Bowl Proteico', precio: 20, emoji: 'img/bolw proteico.png',
    calorias: 580, proteinas: 42, carbos: 48, grasas: 14,
    descripcion: 'Pollo a la plancha, huevo, quinua, camote, espinacas y salsa de maní',
    beneficios: ['Alto en proteína', 'Gana masa muscular', 'Saciante', 'Energizante'],
    tags: ['#musculo', '#proteina', '#fitness'], objetivos: ['subir']
  },
  balanceado: {
    id: 'balanceado', nombre: 'Bowl Balanceado', precio: 18, emoji:  'img/bowl balanceado.png',
    calorias: 450, proteinas: 28, carbos: 52, grasas: 11,
    descripcion: 'Arroz integral, legumbres, verduras salteadas, aguacate y vinagreta de hierbas',
    beneficios: ['Equilibrio nutricional', 'Energía sostenida', 'Digestión saludable', 'Vitaminas completas'],
    tags: ['#mantener', '#balanceado', '#salud'], objetivos: ['mantener']
  },
  energia: {
    id: 'energia', nombre: 'Bowl Energía', precio: 22, emoji: 'img/bowl energia.png',
    calorias: 520, proteinas: 22, carbos: 72, grasas: 12,
    descripcion: 'Avena, plátano, mango, granola casera, semillas de chía y miel de abeja',
    beneficios: ['Energía inmediata', 'Carbohidratos complejos', 'Rico en omega-3', 'Prebióticos'],
    tags: ['#energia', '#carbohidratos', '#activo'], objetivos: ['subir', 'mantener']
  },
  detox: {
    id: 'detox', nombre: 'Bowl Detox', precio: 16, emoji: 'img/bowl_detox.png',  
    calorias: 280, proteinas: 12, carbos: 42, grasas: 6,
    descripcion: 'Espinacas, pepino, apio, manzana verde, jengibre y semillas de linaza',
    beneficios: ['Depurativo', 'Antioxidante', 'Alcalinizante', 'Bajo en calorías'],
    tags: ['#detox', '#depurativo', '#verde'], objetivos: ['bajar']
  },
  andino: {
    id: 'andino', nombre: 'Bowl Andino Premium', precio: 24, emoji: 'img/bowl_andino.png',
    calorias: 490, proteinas: 35, carbos: 55, grasas: 13,
    descripcion: 'Quinua roja, kiwicha, cañihua, trucha andina, habas y rocoto suave',
    beneficios: ['Superalimentos andinos', 'Rico en hierro', 'Alta fibra', 'Proteína completa'],
    tags: ['#andino', '#premium', '#superalimento'], objetivos: ['mantener', 'subir']
  }
};

const TOPPINGS = {
  proteinas: {
    label: '🥩 Proteínas Extra',
    items: {
      pollo_extra:  { id:'pollo_extra',  nombre:'Pollo extra',       emoji:'🍗', precio:4, calorias:80,  proteinas:15 },
      huevo:        { id:'huevo',        nombre:'Huevo cocido',      emoji:'🥚', precio:2, calorias:70,  proteinas:6  },
      atun:         { id:'atun',         nombre:'Atún en agua',      emoji:'🐟', precio:3, calorias:60,  proteinas:14 },
      tofu:         { id:'tofu',         nombre:'Tofu marinado',     emoji:'🫘', precio:3, calorias:50,  proteinas:8  },
      queso_fresco: { id:'queso_fresco', nombre:'Queso fresco',      emoji:'🧀', precio:2, calorias:60,  proteinas:5  },
    }
  },
  carbos: {
    label: '🌾 Carbohidratos',
    items: {
      quinua_extra: { id:'quinua_extra', nombre:'Quinua extra',      emoji:'🌾', precio:2, calorias:60,  carbos:12 },
      camote:       { id:'camote',       nombre:'Camote asado',      emoji:'🍠', precio:2, calorias:80,  carbos:18 },
      arroz_int:    { id:'arroz_int',    nombre:'Arroz integral',    emoji:'🍚', precio:2, calorias:100, carbos:22 },
      granola:      { id:'granola',      nombre:'Granola casera',    emoji:'🥣', precio:2, calorias:90,  carbos:15 },
    }
  },
  vegetales: {
    label: '🥦 Vegetales Extra',
    items: {
      palta:      { id:'palta',      nombre:'Palta / Aguacate',  emoji:'🥑', precio:3, calorias:80 },
      brocoli:    { id:'brocoli',    nombre:'Brócoli al vapor',  emoji:'🥦', precio:2, calorias:25 },
      zanahoria:  { id:'zanahoria',  nombre:'Zanahoria rallada', emoji:'🥕', precio:1, calorias:20 },
      maiz:       { id:'maiz',       nombre:'Choclo peruano',    emoji:'🌽', precio:2, calorias:70 },
      pepino:     { id:'pepino',     nombre:'Pepino fresco',     emoji:'🥒', precio:1, calorias:10 },
      tomate:     { id:'tomate',     nombre:'Tomate cherry',     emoji:'🍅', precio:1, calorias:15 },
    }
  },
  semillas: {
    label: '✨ Semillas & Extras',
    items: {
      chia:      { id:'chia',      nombre:'Semillas de chía', emoji:'🌱', precio:2, calorias:40 },
      linaza:    { id:'linaza',    nombre:'Linaza molida',    emoji:'🌿', precio:1, calorias:35 },
      nueces:    { id:'nueces',    nombre:'Nueces',           emoji:'🥜', precio:3, calorias:90 },
      maca:      { id:'maca',      nombre:'Maca en polvo',    emoji:'💛', precio:2, calorias:20 },
      spirulina: { id:'spirulina', nombre:'Espirulina',       emoji:'💚', precio:3, calorias:10 },
    }
  },
  salsas: {
    label: '🫙 Salsas & Aderezos',
    items: {
      limon:        { id:'limon',        nombre:'Aderezo de limón',  emoji:'🍋', precio:0, calorias:5  },
      tahini:       { id:'tahini',       nombre:'Salsa tahini',      emoji:'🫙', precio:2, calorias:50 },
      mani:         { id:'mani',         nombre:'Salsa de maní',     emoji:'🥜', precio:2, calorias:60 },
      yogur_herb:   { id:'yogur_herb',   nombre:'Yogur con hierbas', emoji:'🌿', precio:2, calorias:30 },
      rocoto_suave: { id:'rocoto_suave', nombre:'Rocoto suave',      emoji:'🌶️', precio:1, calorias:8  },
    }
  }
};

const DELIVERY = { centro: 3, media: 5, lejos: 7 };

function calcularIMC(peso, tallaCm) {
  const talla = tallaCm / 100;
  return peso / (talla * talla);
}
function obtenerEstadoNutricional(imc) {
  if (imc < 18.5) return { estado:'Bajo peso', color:'#3b82f6', emoji:'📉' };
  if (imc < 25)   return { estado:'Normal',    color:'#22c55e', emoji:'✅' };
  if (imc < 30)   return { estado:'Sobrepeso', color:'#f59e0b', emoji:'⚠️' };
  return               { estado:'Obesidad',  color:'#ef4444', emoji:'🔴' };
}
function calcularTMB(peso, tallaCm, edad, sexo='m') {
  if (sexo==='f') return 655.1+(9.563*peso)+(1.85*tallaCm)-(4.676*edad);
  return 66.5+(13.75*peso)+(5.003*tallaCm)-(6.775*edad);
}
function calcularCaloriasObjetivo(tmb, objetivo) {
  const tdee = tmb*1.4;
  if (objetivo==='bajar') return Math.round(tdee-400);
  if (objetivo==='subir') return Math.round(tdee+400);
  return Math.round(tdee);
}
function generarRecomendaciones(perfil) {
  const { objetivo } = perfil;
  return Object.values(BOWLS).map(b => {
    let score=0;
    if (b.objetivos.includes(objetivo)) score+=3;
    if (objetivo==='bajar' && b.calorias<400) score+=2;
    if (objetivo==='subir' && b.proteinas>35) score+=2;
    if (objetivo==='mantener' && b.calorias>=400 && b.calorias<=500) score+=2;
    return {...b,score};
  }).sort((a,b)=>b.score-a.score);
}
function calcularNutricionToppings(toppingIds=[]) {
  let caloriasExtra=0, precioExtra=0;
  toppingIds.forEach(tid=>{
    for (const cat of Object.values(TOPPINGS)) {
      if (cat.items[tid]) { caloriasExtra+=cat.items[tid].calorias||0; precioExtra+=cat.items[tid].precio||0; }
    }
  });
  return {caloriasExtra,precioExtra};
}
function getToppingInfo(tid) {
  for (const cat of Object.values(TOPPINGS)) {
    if (cat.items[tid]) return cat.items[tid];
  }
  return null;
}
function calcularDelivery(zona) { return DELIVERY[zona]||5; }

function generarPlanSemanal(perfil) {
  const {objetivo} = perfil;
  const dias = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
  const D={
    bajar:[
      {nombre:'Avena con frutas rojas',cal:280,emoji:'🫐'},{nombre:'Smoothie verde detox',cal:220,emoji:'🥤'},
      {nombre:'Huevos revueltos + verduras',cal:260,emoji:'🥚'},{nombre:'Yogur griego + chía',cal:240,emoji:'🥛'},
      {nombre:'Tostadas integrales + palta',cal:300,emoji:'🥑'},{nombre:'Quinua con manzana',cal:270,emoji:'🍎'},
      {nombre:'Frutas con linaza',cal:200,emoji:'🍓'}
    ],
    subir:[
      {nombre:'Avena proteica + plátano + maní',cal:520,emoji:'🍌'},{nombre:'3 Huevos + tostadas + aguacate',cal:480,emoji:'🥚'},
      {nombre:'Batido proteico + granola + leche',cal:560,emoji:'🥛'},{nombre:'Pancakes de avena + miel',cal:500,emoji:'🥞'},
      {nombre:'Granola + yogur + nueces',cal:490,emoji:'🌾'},{nombre:'Pan + queso + jamón + huevo',cal:450,emoji:'🍳'},
      {nombre:'Quinua dulce + frutos secos',cal:510,emoji:'🌰'}
    ],
    mantener:[
      {nombre:'Avena con miel y canela',cal:350,emoji:'🍯'},{nombre:'Huevos + tostada + fruta',cal:380,emoji:'🍳'},
      {nombre:'Yogur + granola + fresas',cal:320,emoji:'🍓'},{nombre:'Smoothie bowl tropical',cal:360,emoji:'🥭'},
      {nombre:'Pan integral + palta + semillas',cal:340,emoji:'🥑'},{nombre:'Quinua con frutas secas',cal:370,emoji:'🫚'},
      {nombre:'Tortillas + huevo + verduras',cal:390,emoji:'🌮'}
    ]
  };
  const A={
    bajar:[
      {nombre:'Bowl Light',cal:320,emoji:'🥗',bowlId:'light'},{nombre:'Bowl Detox',cal:280,emoji:'🌿',bowlId:'detox'},
      {nombre:'Ensalada de atún + quinua',cal:310,emoji:'🥙'},{nombre:'Bowl Light',cal:320,emoji:'🥗',bowlId:'light'},
      {nombre:'Trucha al vapor + ensalada',cal:300,emoji:'🐟'},{nombre:'Caldo de pollo + kiwicha',cal:280,emoji:'🍵'},
      {nombre:'Bowl Light',cal:320,emoji:'🥗',bowlId:'light'}
    ],
    subir:[
      {nombre:'Bowl Proteico',cal:580,emoji:'💪',bowlId:'proteico'},{nombre:'Bowl Andino Premium',cal:490,emoji:'🏔️',bowlId:'andino'},
      {nombre:'Bowl Proteico',cal:580,emoji:'💪',bowlId:'proteico'},{nombre:'Pasta integral + atún',cal:560,emoji:'🍝'},
      {nombre:'Bowl Energía',cal:520,emoji:'⚡',bowlId:'energia'},{nombre:'Quinua + carne magra + batata',cal:600,emoji:'🥩'},
      {nombre:'Bowl Proteico',cal:580,emoji:'💪',bowlId:'proteico'}
    ],
    mantener:[
      {nombre:'Bowl Balanceado',cal:450,emoji:'⚖️',bowlId:'balanceado'},{nombre:'Bowl Andino Premium',cal:490,emoji:'🏔️',bowlId:'andino'},
      {nombre:'Bowl Balanceado',cal:450,emoji:'⚖️',bowlId:'balanceado'},{nombre:'Estofado de lentejas + arroz',cal:440,emoji:'🫘'},
      {nombre:'Bowl Energía',cal:520,emoji:'⚡',bowlId:'energia'},{nombre:'Ceviche + choclo + camote',cal:430,emoji:'🐠'},
      {nombre:'Bowl Balanceado',cal:450,emoji:'⚖️',bowlId:'balanceado'}
    ]
  };
  const C={
    bajar:[
      {nombre:'Caldo de pollo + vegetales',cal:200,emoji:'🍵'},{nombre:'Ensalada verde + proteína magra',cal:250,emoji:'🥬'},
      {nombre:'Sopa de kiwicha',cal:220,emoji:'🌿'},{nombre:'Omelet de claras + espinacas',cal:180,emoji:'🥚'},
      {nombre:'Ensalada tibia de quinua',cal:260,emoji:'🌾'},{nombre:'Pechuga al vapor + brócoli',cal:240,emoji:'🥦'},
      {nombre:'Infusión + tostada integral',cal:150,emoji:'☕'}
    ],
    subir:[
      {nombre:'Pollo + camote + ensalada',cal:420,emoji:'🍠'},{nombre:'Arroz + menestras + huevo',cal:460,emoji:'🥚'},
      {nombre:'Pasta + carne magra',cal:480,emoji:'🍝'},{nombre:'Quinua + leche + plátano',cal:400,emoji:'🍌'},
      {nombre:'Sándwich integral + pechuga',cal:440,emoji:'🥪'},{nombre:'Salmón + verduras al horno',cal:450,emoji:'🐟'},
      {nombre:'Tortilla + frijoles + aguacate',cal:420,emoji:'🌯'}
    ],
    mantener:[
      {nombre:'Sopa de verduras + pollo',cal:300,emoji:'🍲'},{nombre:'Ensalada tibia de garbanzos',cal:320,emoji:'🫘'},
      {nombre:'Tortilla de papa + ensalada',cal:310,emoji:'🥔'},{nombre:'Omelet + pan + frutas',cal:340,emoji:'🍳'},
      {nombre:'Crema de zapallo + pan',cal:290,emoji:'🎃'},{nombre:'Arroz integral + verduras',cal:360,emoji:'🥢'},
      {nombre:'Sopa de lentejas + crutones',cal:330,emoji:'🍵'}
    ]
  };
  const ob = objetivo in D ? objetivo : 'mantener';
  return dias.map((dia,i)=>({
    dia, desayuno:D[ob][i], almuerzo:A[ob][i], cena:C[ob][i],
    totalCal: D[ob][i].cal+A[ob][i].cal+C[ob][i].cal
  }));
}
