// Демонстрационные справочники и данные заказов (светлая тема/безопасные полифилы)

// Полифил для crypto.randomUUID (на случай старых браузеров)
if (typeof window !== 'undefined' && (!window.crypto || !crypto.randomUUID)) {
  window.crypto = window.crypto || {};
  window.crypto.randomUUID = function(){
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random()*16|0; const v = c==='x'?r:(r&0x3|0x8); return v.toString(16);
    });
  };
}

const STATUSES = [
  { code: 'draft', name: 'Черновик' },
  { code: 'submitted', name: 'На проверке' },
  { code: 'approved', name: 'Принят' },
  { code: 'revision', name: 'На доработку' }
];

const FINISHES = [
  { code: 'raw', name: 'Черновой' },
  { code: 'film', name: 'Плёнка' },
  { code: 'paint', name: 'Краска' }
];

const materials = [
  { id: 'mat-ldsp', name: 'ЛДСП 18мм' },
  { id: 'mat-mdf16', name: 'МДФ 16мм' },
  { id: 'mat-mdf18', name: 'МДФ 18мм' },
  { id: 'mat-plywood', name: 'Фанера 12мм' }
];

const millingTypes = [
  { id: 'mill-modern', name: 'Модерн' },
  { id: 'mill-lapsha-s', name: 'Мелкая лапша' },
  { id: 'mill-lapsha-m', name: 'Средняя лапша' },
  { id: 'mill-vybor', name: 'Выборка' }
];

const films = [
  { id: 'fl-glossy-white', name: 'Плёнка глянец белая' },
  { id: 'fl-wotan', name: 'Плёнка дуб Вотан' },
  { id: 'fl-black', name: 'Плёнка чёрная матовая' }
];

const paints = [
  { id: 'pt-ral-7035', name: 'RAL 7035' },
  { id: 'pt-milk', name: 'Белая матовая' },
  { id: 'pt-graphite', name: 'Графит' }
];

const rnd = (seed => { // детерминированный генератор
  let t = seed >>> 0;
  return () => (t = (t + 0x6D2B79F5) >>> 0, (t ^ t >>> 15) / 2**32);
})(123456);

function pick(arr){ return arr && arr.length > 0 ? arr[Math.floor(rnd()*arr.length)] : null; }
function randInt(min,max){ return Math.floor(rnd()*(max-min+1))+min; }

function nextOrderNo(existing){
  const year = new Date().getFullYear();
  const prefix = 'W';
  const sameYear = existing.filter(o => o.order_no?.startsWith(`${prefix}-${year}-`));
  const last = sameYear.map(o => parseInt(o.order_no.split('-')[2],10)).filter(n=>!isNaN(n)).sort((a,b)=>b-a)[0] || 0;
  const n = String(last+1).padStart(3,'0');
  return `${prefix}-${year}-${n}`;
}

function makeItem(){
  let w = randInt(250, 2600);
  let h = randInt(250, 2600);
  if(w>2070 && h>2070){ if(w>h) w = randInt(300, 1900); else h = randInt(300, 1900); }
  const finishObj = pick([{code:'raw'},{code:'film'},{code:'paint'}]);
  const finish = finishObj?.code || 'raw';
  const material = pick(materials);
  const millingType = pick(millingTypes);
  const itm = {
    id: crypto.randomUUID(),
    width: Math.abs(w),
    height: Math.abs(h),
    quantity: Math.max(1, randInt(1,8)),
    material_id: material?.id || materials[0]?.id,
    milling_type_id: millingType?.id || millingTypes[0]?.id,
    finish_code: finish,
    film_id: finish==='film' ? (pick(films)?.id || null) : null,
    paint_id: finish==='paint' ? (pick(paints)?.id || null) : null,
    note: Math.random()>.85? 'Скруглить кромки R3' : ''
  };
  return itm;
}

function randomDateBack(days){
  const d = new Date();
  d.setDate(d.getDate()-randInt(0,days));
  d.setHours(randInt(8,19), randInt(0,59), randInt(0,59), 0);
  return d;
}

const REVISION_REASONS = [
  'Уточните размеры: оба > 2070 мм недопустимы',
  'Просим приложить эскиз с размерами и допусками',
  'Несогласован финиш: выберите плёнку или краску',
  'Опечатка в названии — поправьте, пожалуйста'
];

function generateDemo(){
  const profile = {
    id: 'u-demo',
    full_name: 'Алихан Мырзаханов',
    phone: '+7 701 123 45 67',
    email: 'alihan@example.kz',
    address: 'Астана, ул. Сарыарка, 15'
  };

  const projects = [
    { id:'pr-1', project_no:'WPR-2025-001', name:'Проект кухня «Север»' },
    { id:'pr-2', project_no:'WPR-2025-002', name:'Проект шкаф-купе «Нура»' },
    { id:'pr-3', project_no:'WPR-2025-003', name:'Проект офис «Есиль»' }
  ];

  const orders = [];
  const statuses = ['draft','submitted','approved','revision'];
  const total = 60;
  for(let i=0;i<total;i++){
    const st = pick(statuses) || 'draft';
    const created = randomDateBack(180);
    const order = {
      id: crypto.randomUUID(),
      order_no: null,
      prefix: 'W',
      client_id: profile.id,
      project_id: Math.random()>.4? (pick(projects)?.id || null) : null,
      name: `Заказ ${created.toLocaleDateString('ru-KZ')} — ${i+1}`,
      note: Math.random()>.7? 'Нужна доставка до подъезда' : '',
      status_code: st,
      is_archived: false,
      archived_at: null,
      submitted_at: st==='submitted'||st==='approved'||st==='revision'? created : null,
      approved_at: st==='approved'? new Date(created.getTime()+86400000*randInt(1,14)): null,
      manager_id: null,
      version: 1,
      created_at: created,
      updated_at: randomDateBack(30),
      items: Array.from({length: randInt(1,6)}, makeItem),
      files: [],
      last_event: st==='revision'? {reason: pick(REVISION_REASONS) || 'Требует доработки', changed_at: randomDateBack(20)} : null
    };
    orders.push(order);
    order.order_no = nextOrderNo(orders);
    if(Math.random()>.88){ order.is_archived = true; order.archived_at = randomDateBack(120); }
    const fileCount = randInt(0,3);
    for(let f=0; f<fileCount; f++){
      order.files.push({
        id: crypto.randomUUID(),
        file_name: `чертёж_${f+1}.pdf`,
        content_type: 'application/pdf',
        size_bytes: 120*1024,
        note: f===0 && Math.random()>.5 ? 'Основной макет' : ''
      });
    }
  }
  return { profile, projects, orders };
}