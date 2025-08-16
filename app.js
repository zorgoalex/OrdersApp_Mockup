// Код приложения - логика работы с интерфейсом

// =============================================================================
// FILTERS MODULE
// =============================================================================

const LS_KEY = 'client-filters-v1';

function loadFilters(){
  try{ return JSON.parse(localStorage.getItem(LS_KEY)) || null; }catch{ return null; }
}
function saveFilters(f){ localStorage.setItem(LS_KEY, JSON.stringify(f)); }

function defaultFilters(projects){
  return {
    q: '',
    statuses: new Set(['draft','submitted','approved','revision']),
    project: 'all',
    period: '90', // дни
    showArchived: false,
    perPage: 15,
    page: 1,
    sort: { by: 'created_at', dir: 'desc' }
  };
}

function initFilters(root, state, projects, onChange){
  root.innerHTML = '';
  const row1 = document.createElement('div');
  row1.className = 'row';
  row1.innerHTML = `
    <input id="fltQ" class="input" placeholder="Поиск: номер, название" value="${state.q||''}" />
    <select id="fltProject">
      <option value="all">Все проекты</option>
      ${projects.map(p=>`<option value="${p.id}">${p.name}</option>`).join('')}
    </select>
    <select id="fltPeriod">
      <option value="30">За 30 дней</option>
      <option value="90" selected>За 90 дней</option>
      <option value="365">За год</option>
      <option value="all">За всё время</option>
    </select>
    <label class="switch"><input id="fltArchived" type="checkbox" ${state.showArchived?'checked':''}/> Показывать архив</label>
    <label class="switch"><input id="fltOnlyEditable" type="checkbox"/> Только редактируемые</label>
  `;

  const row2 = document.createElement('div');
  row2.className = 'row';
  row2.innerHTML = `
    <span class="help">Статусы:</span>
    ${['draft','submitted','approved','revision'].map(code=>
      `<label class="switch"><input type="checkbox" class="st" data-code="${code}" ${state.statuses.has(code)?'checked':''}/> ${statusLabel(code)}</label>`
    ).join('')}
    <div class="spacer"></div>
    <label>На странице
      <select id="fltPerPage">
        ${[10,15,25,50].map(n=>`<option value="${n}" ${state.perPage===n?'selected':''}>${n}</option>`).join('')}
      </select>
    </label>
  `;

  root.appendChild(row1);
  root.appendChild(row2);

  // Слушатели
  const emit = () => { saveFilters(state); onChange?.(state); };

  // Поиск с debounce
  const q = row1.querySelector('#fltQ');
  let t;
  q.addEventListener('input', () => { clearTimeout(t); t = setTimeout(()=>{ state.q = q.value.trim(); state.page=1; emit(); }, 300); });

  row1.querySelector('#fltProject').addEventListener('change', e=>{ state.project = e.target.value; state.page=1; emit(); });
  row1.querySelector('#fltPeriod').addEventListener('change', e=>{ state.period = e.target.value; state.page=1; emit(); });
  row1.querySelector('#fltArchived').addEventListener('change', e=>{ state.showArchived = e.target.checked; state.page=1; emit(); });
  row1.querySelector('#fltOnlyEditable').addEventListener('change', e=>{ state.onlyEditable = e.target.checked; state.page=1; emit(); });
  row2.querySelector('#fltPerPage').addEventListener('change', e=>{ state.perPage = parseInt(e.target.value,10); state.page=1; emit(); });

  row2.querySelectorAll('.st').forEach(cb=> cb.addEventListener('change', e=>{
    const code = e.target.dataset.code; if(e.target.checked) state.statuses.add(code); else state.statuses.delete(code);
    state.page=1; emit();
  }));
}

function statusLabel(code){
  switch(code){
    case 'draft': return 'Черновик';
    case 'submitted': return 'На проверке';
    case 'approved': return 'Принят';
    case 'revision': return 'На доработку';
    default: return code;
  }
}

// =============================================================================
// TABLE MODULE
// =============================================================================

function renderOrdersTable(host, paginationHost, state, data, handlers){
  const { orders } = data;
  const start = (state.page-1)*state.perPage;
  const slice = orders.slice(start, start + state.perPage);

  host.innerHTML = `
    <div class="table-wrap-inner">
    <table class="table" role="table" aria-label="Список заказов">
      <thead>
        <tr>
          <th style="width:42px"><input type="checkbox" id="chkAll" aria-label="Выбрать все"/></th>
          ${th('order_no','Номер',state)}
          ${th('name','Название',state)}
          ${th('status_code','Статус',state)}
          ${th('updated_at','Обновлён',state)}
          <th>Проект</th>
          <th style="text-align:right">Деталей</th>
          <th style="text-align:right">Файлов</th>
          <th style="width:360px">Действия</th>
        </tr>
      </thead>
      <tbody>
        ${slice.map(row => tr(row)).join('')}
      </tbody>
    </table>
    </div>
  `;

  // выбор
  const checkAll = host.querySelector('#chkAll');
  const rowChecks = host.querySelectorAll('.row-check');
  if(checkAll){
    checkAll.addEventListener('change', ()=> { rowChecks.forEach(ch=> ch.checked = checkAll.checked); handlers.onBulkTick?.(); });
  }
  rowChecks.forEach(ch=> ch.addEventListener('change', handlers.onBulkTick));

  // сортировка
  host.querySelectorAll('th[data-by]').forEach(th => th.addEventListener('click', ()=>{
    const by = th.dataset.by;
    if(state.sort.by===by) state.sort.dir = state.sort.dir==='asc'?'desc':'asc'; else {state.sort.by=by; state.sort.dir='asc';}
    state.page=1; handlers.onSortChange?.(state.sort);
  }));

  // действия
  host.querySelectorAll('[data-act]').forEach(btn => btn.addEventListener('click', ()=>{
    const act = btn.dataset.act; const id = btn.dataset.id; handlers.onAction?.(act, id);
  }));

  renderPagination(paginationHost, state, orders.length, handlers.onPageChange);
}

function th(key, title, state){
  const sortable = ['order_no','name','status_code','updated_at'].includes(key);
  if(!sortable) return `<th>${title}</th>`;
  const dir = state.sort.by===key? (state.sort.dir==='asc'?'▲':'▼') : '';
  return `<th data-by="${key}" role="button" aria-sort="${state.sort.by===key?state.sort.dir:'none'}" title="Сортировать">${title} ${dir}</th>`;
}

function tr(o){
  const status = o.status_code;
  const reason = o.last_event?.reason;
  return `<tr data-id="${o.id}">
    <td><input type="checkbox" class="row-check" data-id="${o.id}"/></td>
    <td><button class="link" data-act="open" data-id="${o.id}">${o.order_no}</button></td>
    <td>${escapeHtml(o.name)}</td>
    <td>${statusChip(status, reason)}</td>
    <td><span title="${new Date(o.updated_at).toLocaleString()}">${new Date(o.updated_at).toLocaleDateString()}</span></td>
    <td>${o.project_name||'—'}</td>
    <td style="text-align:right"><span class="badge">${o.items.length}</span></td>
    <td style="text-align:right"><span class="badge">${o.files.length}</span></td>
    <td>
      <div class="row-actions">
        ${o.is_archived? '' : `<button class="btn small" data-act="edit" data-id="${o.id}" ${editable(o)?'':'disabled'}>Редактировать</button>`}
        <button class="btn small" data-act="duplicate" data-id="${o.id}">Дублировать</button>
        ${o.status_code==='draft'||o.status_code==='revision'? `<button class="btn small" data-act="submit" data-id="${o.id}" ${o.items?.length? '':'disabled'}>Отправить</button>`:''}
        <button class="btn small" data-act="files" data-id="${o.id}">Файлы</button>
        <button class="btn small danger" data-act="archive" data-id="${o.id}" ${o.status_code==='approved'?'disabled':''}>В архив</button>
      </div>
    </td>
  </tr>`;
}

function editable(o){ return !o.is_archived && (o.status_code==='draft' || o.status_code==='revision'); }

function statusChip(code, reason){
  const cls = `status ${code}`;
  const label = statusLabel(code);
  const extra = code==='revision' && reason? `<span class="help" title="${escapeHtml(reason)}">ⓘ</span>`: '';
  return `<span class="${cls}">${label}${extra}</span>`;
}

function renderPagination(host, state, total, onPage){
  const pages = Math.max(1, Math.ceil(total/state.perPage));
  state.page = clamp(state.page, 1, pages);
  host.innerHTML = '';
  const wrap = document.createElement('div'); wrap.className = 'pagination';
  const mkBtn = (p, label=p) => { const b = document.createElement('button'); b.className='btn'; b.textContent=label; b.disabled = p===state.page; b.addEventListener('click', ()=> onPage?.(p)); return b; };
  wrap.appendChild(mkBtn(1,'⏮'));
  wrap.appendChild(mkBtn(Math.max(1, state.page-1),'◀'));
  const info = document.createElement('span'); info.className='info'; info.textContent = `${state.page} / ${pages}`; wrap.appendChild(info);
  wrap.appendChild(mkBtn(Math.min(pages, state.page+1),'▶'));
  wrap.appendChild(mkBtn(pages,'⏭'));
  host.appendChild(wrap);
}

function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }

// =============================================================================
// POPUPS MODULE
// =============================================================================

function toast(text){
  const host = document.getElementById('toastHost');
  const el = document.createElement('div'); el.className='toast'; el.textContent=text;
  host.appendChild(el); setTimeout(()=> el.remove(), 2600);
}

function confirmModal({title='Подтвердите', text='', okText='OK', cancelText='Отмена'}){
  return new Promise(resolve => {
    const host = document.getElementById('modalHost');
    host.innerHTML = `<div class="modal" role="dialog" aria-modal="true">
      <div class="window">
        <div class="header"><strong>${title}</strong><button class="btn" id="mClose">✕</button></div>
        <div class="content"><p>${text}</p></div>
        <div class="footer">
          <button class="btn" id="mCancel">${cancelText}</button>
          <button class="btn primary" id="mOk">${okText}</button>
        </div>
      </div>
    </div>`;
    const close=()=> host.innerHTML='';
    host.querySelector('#mClose').onclick = ()=>{ close(); resolve(false); };
    host.querySelector('#mCancel').onclick= ()=>{ close(); resolve(false); };
    host.querySelector('#mOk').onclick    = ()=>{ close(); resolve(true); };
  });
}

function openOrderDrawer({mode='view', order, onSave}){
  const host = document.getElementById('modalHost');
  const canEdit = !order.is_archived && (order.status_code==='draft' || order.status_code==='revision');
  const editable = canEdit && mode!=='view';
  host.innerHTML = `<div class="drawer-overlay">
    <div class="drawer open" role="dialog" aria-label="Заказ">
    <div class="hdr">
      <div>
        <button class="btn" id="btnBack">← Назад к списку</button>
        <div class="help">${order.order_no}</div>
        <strong>${escapeHtml(order.name)}</strong>
      </div>
      <div>
        ${canEdit? `<button class="btn" id="btnEditToggle">${editable?'Просмотр':'Редактировать'}</button>`:''}
        <button class="btn" id="btnClose">✕</button>
      </div>
    </div>
    <div class="bd">
      <div class="form-grid">
        <label>Название
          <input id="fName" class="input" maxlength="250" value="${order.name}" ${editable?'':'disabled'} />
          <div class="counter" id="nameCounter">${order.name.length}/250</div>
        </label>
        <label>Примечание
          <input id="fNote" class="input" maxlength="500" value="${order.note||''}" ${editable?'':'disabled'} />
          <div class="counter" id="noteCounter">${(order.note||'').length}/500</div>
        </label>
      </div>

      ${order.status_code==='revision' && order.last_event?.reason? `<p class="tag">Причина возврата: <strong>${escapeHtml(order.last_event.reason)}</strong></p>`:''}

      <h3>Детали <span class="badge">${order.items.length}</span></h3>
      <div id="items"></div>
      ${editable? `<button class="btn" id="addItem">+ Добавить деталь</button>`:''}
      <p class="help">Единицы измерения — мм. Правило: только один размер может быть &gt; 2070 мм.</p>

      <h3>Файлы <span class="badge">${order.files.length}</span></h3>
      <div id="files"></div>
      ${editable? `<label class="btn"><input type="file" id="fileInput" hidden />Загрузить файл</label>`:''}
      <p class="help">До 5 файлов на заказ, PDF/JPG/PNG/DWG, ≤ 5 МБ каждый.</p>

      <div id="saveState" class="help">● Не сохранено</div>
      <div style="height:16px"></div>
      <div class="footer">
        <button class="btn" id="btnSave" ${editable?'':'disabled'}>Сохранить</button>
      </div>
    </div>
  </div>
  </div>`;

  const close = ()=> host.innerHTML='';
  host.querySelector('#btnClose').onclick = close;
  host.querySelector('#btnBack').onclick = close;
  host.querySelector('.drawer-overlay').addEventListener('click', e => { if(e.target.classList.contains('drawer-overlay')) close(); });
  const btnToggle = host.querySelector('#btnEditToggle'); if(btnToggle) btnToggle.onclick = ()=>openOrderDrawer({mode: editable?'view':'edit', order, onSave});

  // counters
  const fName = host.querySelector('#fName'); const fNote = host.querySelector('#fNote');
  const nameCounter = host.querySelector('#nameCounter'); const noteCounter = host.querySelector('#noteCounter');
  if(fName) fName.addEventListener('input', ()=> nameCounter.textContent = `${fName.value.length}/250`);
  if(fNote) fNote.addEventListener('input', ()=> noteCounter.textContent = `${fNote.value.length}/500`);

  // items
  const itemsHost = host.querySelector('#items');
  renderItems(itemsHost, order.items, { editable });
  if(editable){
    host.querySelector('#addItem').onclick = ()=>{
      order.items.push({ id: crypto.randomUUID(), width: 500, height: 500, quantity:1, material_id: materials[0].id, milling_type_id: millingTypes[0].id, finish_code: 'raw', film_id:null, paint_id:null, note:'' });
      renderItems(itemsHost, order.items, { editable });
      markUnsaved();
    };
  }

  // files
  const filesHost = host.querySelector('#files'); renderFiles(filesHost, order, { editable });
  if(editable){
    host.querySelector('#fileInput').addEventListener('change', (e)=>{
      const file = e.target.files[0]; if(!file) return;
      if(order.files.length >= 5){ toast('Превышен лимит: максимум 5 файлов'); return; }
      const ext = file.name.split('.').pop().toLowerCase();
      if(!['pdf','jpg','jpeg','png','dwg'].includes(ext)){ toast('Недопустимый формат'); return; }
      if(file.size > 5*1024*1024){ toast('Файл больше 5 МБ'); return; }
      order.files.push({ id: crypto.randomUUID(), file_name:file.name, content_type:file.type||'application/octet-stream', size_bytes:file.size, note:'' });
      renderFiles(filesHost, order, { editable }); markUnsaved();
      e.target.value='';
    });
  }

  // autosave imitation
  let dirty=false; let timer=null; const markUnsaved=()=>{ dirty=true; host.querySelector('#saveState').textContent='● Не сохранено'; if(timer) clearTimeout(timer); timer=setTimeout(()=>{ if(dirty){ host.querySelector('#saveState').textContent='✓ Сохранено'; dirty=false; } }, 1200); };
  if(fName) fName.addEventListener('input', markUnsaved); if(fNote) fNote.addEventListener('input', markUnsaved);

  const btnSave = host.querySelector('#btnSave'); if(btnSave) btnSave.onclick = ()=>{
    if(editable){ order.name = fName.value.trim()||order.name; order.note = fNote.value.trim(); toast('Сохранено'); onSave?.(order); }
  };
}

function renderItems(host, items, {editable}){
  host.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'table-wrap';
  const tbl = document.createElement('table'); tbl.className='table';
  tbl.innerHTML = `<thead><tr>
    <th>Ширина, мм</th><th>Высота, мм</th><th>Кол-во</th><th>Материал</th><th>Фрезеровка</th><th>Финиш</th><th>Примечание</th><th></th>
  </tr></thead><tbody></tbody>`;
  const tb = tbl.querySelector('tbody');
  items.forEach((it,idx)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${editable? `<input class="input w" type="number" step="0.01" min="20" max="2800" value="${it.width}">` : it.width}</td>
      <td>${editable? `<input class="input h" type="number" step="0.01" min="20" max="2800" value="${it.height}">` : it.height}</td>
      <td>${editable? `<input class="input q" type="number" min="1" value="${it.quantity}">` : it.quantity}</td>
      <td>${editable? select(materials,'material_id', it.material_id) : lookup(materials,it.material_id)}</td>
      <td>${editable? select(millingTypes,'milling_type_id', it.milling_type_id) : lookup(millingTypes,it.milling_type_id)}</td>
      <td>${editable? finishSelect(it) : finishText(it)}</td>
      <td>${editable? `<input class="input note" maxlength="500" value="${it.note||''}">` : (it.note||'')}</td>
      <td>${editable? `<button class="btn small" data-del="${idx}">Удалить</button>`:''}</td>
    `;
    tb.appendChild(tr);
    if(editable){
      const w=tr.querySelector('.w'), h=tr.querySelector('.h'), q=tr.querySelector('.q');
      const note=tr.querySelector('.note');
      const selects = tr.querySelectorAll('select');
      const invalidate = ()=> validateRow(tr, it);
      [w,h,q,note].forEach(inp=> inp && inp.addEventListener('input', ()=>{
        it.width = parseFloat(w.value); it.height=parseFloat(h.value); it.quantity=parseInt(q.value,10)||1; it.note=note.value;
        invalidate();
      }));
      selects.forEach(sel=> sel.addEventListener('change', (e)=>{
        const name = e.target.name; it[name]= e.target.value; if(name==='finish_code'){ it.film_id=null; it.paint_id=null; }
        invalidate();
      }));
      const delBtn = tr.querySelector('[data-del]'); delBtn?.addEventListener('click', ()=>{ items.splice(idx,1); renderItems(host, items, {editable}); });
      validateRow(tr, it);
    }
  });
  wrap.appendChild(tbl);
  host.appendChild(wrap);
}

function validateRow(tr, it){
  const bothOver = it.width>2070 && it.height>2070;
  tr.querySelectorAll('.w, .h').forEach(inp=> inp.classList.toggle('invalid', bothOver));
  tr.title = bothOver? 'Недопустимо: оба размера > 2070 мм' : '';
}

function renderFiles(host, order, {editable}){
  host.innerHTML = '';
  if(order.files.length===0){ host.innerHTML = '<div class="help">Файлы не прикреплены</div>'; return; }
  const list = document.createElement('div'); list.style.display='grid'; list.style.gap='6px';
  order.files.forEach((f,idx)=>{
    const row = document.createElement('div'); row.className='form-row';
    row.innerHTML = `
      <span class="badge">${idx+1}</span>
      <span>${f.file_name}</span>
      <span class="help">${Math.round(f.size_bytes/1024)} КБ</span>
      ${editable? `<input class="input" style="flex:1" placeholder="Примечание" value="${f.note||''}">` : (f.note? `<span class="tag">${f.note}</span>`:'')}
      ${editable? `<button class="btn small" data-del="${f.id}">Удалить</button>`:''}
    `;
    if(editable){
      row.querySelector('input')?.addEventListener('input', e=> f.note = e.target.value);
      row.querySelector('[data-del]')?.addEventListener('click', ()=>{ order.files = order.files.filter(x=>x.id!==f.id); renderFiles(host, order, {editable}); });
    }
    list.appendChild(row);
  });
  host.appendChild(list);
}

function select(list, name, val){
  return `<select name="${name}">` + list.map(x=>`<option value="${x.id}" ${x.id===val?'selected':''}>${x.name}</option>`).join('') + `</select>`;
}
function lookup(list, id){ return list.find(x=>x.id===id)?.name || '—'; }

function finishSelect(it){
  const opts = FINISHES.map(x=>`<option value="${x.code}" ${x.code===it.finish_code?'selected':''}>${x.name}</option>`).join('');
  const ex = it.finish_code==='film' ? select(films, 'film_id', it.film_id)
    : it.finish_code==='paint'? select(paints, 'paint_id', it.paint_id)
    : '<span class="help">—</span>';
  return `<div class="form-row"><select name="finish_code">${opts}</select>${ex}</div>`;
}
function finishText(it){
  const map = { raw:'Черновой', film:'Плёнка', paint:'Краска' };
  const extra = it.finish_code==='film'? ` / ${lookup(films,it.film_id)}` : it.finish_code==='paint'? ` / ${lookup(paints,it.paint_id)}` : '';
  return `${map[it.finish_code]}${extra}`;
}

function escapeHtml(s=''){ return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

// =============================================================================
// MAIN MODULE
// =============================================================================

// Глобальный обработчик ошибок, чтобы кнопки "не молчали"
window.addEventListener('error', (e)=>{
  try{ toast('Ошибка: ' + (e.message||'см. консоль')); }catch{}
  console.error(e);
});

const appState = {
  data: null,
  view: { filters: null, selection: new Set() }
};

window.addEventListener('DOMContentLoaded', () => {
  try{
    console.log('Инициализация приложения...');
    const data = generateDemo();
    // денормализация для таблицы
    data.orders.forEach(o=> o.project_name = data.projects.find(p=>p.id===o.project_id)?.name || null);
    appState.data = data;

    const profileName = document.getElementById('profileName');
    if(profileName) profileName.textContent = data.profile.full_name;

    // Фильтры
    const fromLs = loadFilters();
    appState.view.filters = Object.assign(defaultFilters(data.projects), fromLs||{});
    // починим Set из localStorage (если там оказался {})
    if(!(appState.view.filters.statuses instanceof Set)){
      const setVal = new Set(['draft','submitted','approved','revision']);
      appState.view.filters.statuses = setVal;
    }
    initFilters(document.getElementById('filters'), appState.view.filters, data.projects, refresh);

    // Кнопки хедера
    document.getElementById('btnCreateOrder')?.addEventListener('click', onCreateOrder);
    document.getElementById('btnClearFilters')?.addEventListener('click', ()=>{
      localStorage.removeItem('client-filters-v1');
      appState.view.filters = defaultFilters(appState.data.projects);
      initFilters(document.getElementById('filters'), appState.view.filters, appState.data.projects, refresh);
      refresh();
    });

    console.log('Первый рендер...');
    refresh();
    console.log('Инициализация завершена');
  }catch(err){
    console.error('Критическая ошибка инициализации:', err); 
    toast('Критическая ошибка инициализации');
  }
});

function refresh(){
  console.log('Обновление списка...');
  const { data } = appState;
  const f = appState.view.filters;
  let list = [...data.orders];

  if(!f.showArchived) list = list.filter(o=> !o.is_archived);
  if(f.onlyEditable) list = list.filter(o=> (o.status_code==='draft'||o.status_code==='revision') && !o.is_archived);
  if(f.project && f.project!=='all') list = list.filter(o=> o.project_id===f.project);
  if(f.q){ const q=f.q.toLowerCase(); list = list.filter(o=> (o.order_no+o.name).toLowerCase().includes(q)); }
  if(f.period && f.period!=='all'){
    const days = parseInt(f.period,10); const dt = Date.now()-days*86400000; list = list.filter(o=> new Date(o.created_at).getTime() >= dt);
  }
  if(f.statuses && f.statuses.size>0){ list = list.filter(o=> f.statuses.has(o.status_code)); }

  list.sort((a,b)=> cmp(a,b,f.sort.by,f.sort.dir));

  appState.view.selection.clear();
  const ordersTable = document.getElementById('ordersTable');
  const pagination = document.getElementById('pagination');
  renderOrdersTable(ordersTable, pagination, f, { orders:list }, {
    onBulkTick: updateBulkBar,
    onPageChange: p=>{ f.page=p; saveFilters(f); refresh(); },
    onSortChange: ()=>{ saveFilters(f); refresh(); },
    onAction: handleRowAction
  });

  updateBulkBar();
  console.log(`Отображено ${list.length} заказов`);
}

function updateBulkBar(){
  const host = document.getElementById('ordersTable');
  const bulkBar = document.getElementById('bulkBar');
  const checks = host.querySelectorAll('.row-check');
  const sel = appState.view.selection;
  sel.clear(); checks.forEach(ch=> ch.checked && sel.add(ch.dataset.id));
  document.getElementById('bulkCount').textContent = `${sel.size} выбрано`;
  bulkBar.classList.toggle('hidden', sel.size===0);
  document.getElementById('bulkDuplicate').onclick = ()=> onBulk('duplicate');
  document.getElementById('bulkArchive').onclick = ()=> onBulk('archive');
}

async function onBulk(action){
  console.log(`Групповое действие: ${action}`);
  const sel = appState.view.selection; if(sel.size===0) return;
  if(action==='duplicate'){
    const ok = await confirmModal({ title:'Дублирование', text:`Создать копии для ${sel.size} заказов?` });
    if(!ok) return;
    [...sel].forEach(id=> duplicateOrder(id));
    toast('Созданы копии'); refresh();
  } else if(action==='archive'){
    const ok = await confirmModal({ title:'Архив', text:`Переместить ${sel.size} заказ(ов) в архив?` });
    if(!ok) return;
    [...sel].forEach(id=> archiveOrder(id));
    toast('Перемещено в архив'); refresh();
  }
}

function handleRowAction(act, id){
  console.log(`Действие: ${act} для заказа ${id}`);
  switch(act){
    case 'open': openView(id); break;
    case 'edit': openEdit(id); break;
    case 'duplicate': duplicateOrder(id); toast('Создана копия'); refresh(); break;
    case 'submit': submitOrder(id); break;
    case 'files': openFiles(id); break;
    case 'archive': archiveOrder(id); toast('Заказ отправлен в архив'); refresh(); break;
  }
}

function findOrder(id){ return appState.data.orders.find(o=>o.id===id); }

function openView(id){ const o=findOrder(id); openOrderDrawer({ mode:'view', order:o, onSave:()=> refresh() }); }
function openEdit(id){ const o=findOrder(id); openOrderDrawer({ mode:'edit', order:o, onSave:()=> refresh() }); }
function openFiles(id){ const o=findOrder(id); openOrderDrawer({ mode:'edit', order:o, onSave:()=> refresh() }); }

function onCreateOrder(){
  console.log('Создание нового заказа...');
  const { data } = appState;
  const created = new Date();
  const order = {
    id: crypto.randomUUID(),
    order_no: nextOrderNo(data.orders),
    prefix: 'W',
    client_id: data.profile.id,
    project_id: null,
    name: `Заказ ${created.toLocaleDateString('ru-KZ')} — новый`,
    note: '', status_code:'draft', is_archived:false, archived_at:null,
    submitted_at:null, approved_at:null, manager_id:null, version:1,
    created_at: created, updated_at: created,
    items:[], files:[]
  };
  data.orders.unshift(order);
  toast('Черновик создан');
  openOrderDrawer({ mode:'edit', order, onSave:()=> refresh() });
  refresh();
}

function duplicateOrder(id){
  console.log(`Дублирование заказа ${id}...`);
  const src = findOrder(id); if(!src) return;
  const { data } = appState;
  const copy = JSON.parse(JSON.stringify(src));
  copy.id = crypto.randomUUID();
  copy.order_no = nextOrderNo(data.orders);
  copy.name = `Копия: ${src.name}`;
  copy.status_code='draft'; copy.is_archived=false; copy.archived_at=null; copy.submitted_at=null; copy.approved_at=null; copy.last_event=null;
  data.orders.unshift(copy);
}

async function submitOrder(id){
  console.log(`Отправка заказа ${id}...`);
  const o=findOrder(id); if(!o) return; if(!(o.status_code==='draft'||o.status_code==='revision')) return;
  if(o.items.length===0){ toast('Добавьте хотя бы одну деталь'); return; }
  const ok = await confirmModal({ title:'Отправка на проверку', text:'После отправки редактирование будет недоступно. Отправить?' });
  if(!ok) return;
  o.status_code='submitted'; o.submitted_at=new Date(); o.updated_at=new Date();
  toast('Отправлено на проверку'); refresh();
}

function archiveOrder(id){
  console.log(`Архивирование заказа ${id}...`);
  const o=findOrder(id); if(!o) return; if(o.status_code==='approved'){ toast('Нельзя архивировать оформленный заказ (для клиента)'); return; }
  o.is_archived=true; o.archived_at=new Date(); o.updated_at=new Date();
}



function cmp(a,b,by,dir){
  const va = a[by]; const vb = b[by];
  let res = 0;
  if(va==null && vb!=null) res=-1; else if(va!=null && vb==null) res=1;
  else if(va instanceof Date || vb instanceof Date){ res = new Date(va) - new Date(vb); }
  else if(typeof va==='number' && typeof vb==='number'){ res = va - vb; }
  else { res = String(va||'').localeCompare(String(vb||''), 'ru'); }
  return dir==='asc'? res : -res;
}

function statusRu(code){ return ({draft:'Черновик', submitted:'На проверке', approved:'Принят', revision:'На доработку'})[code] || code; }
function csvEscape(v){ const s=String(v??''); return /[",\n]/.test(s)? '"'+s.replaceAll('"','""')+'"' : s; }
function clean(s=''){ return s.replaceAll('\n',' ').replaceAll('\r',' ').trim(); }
