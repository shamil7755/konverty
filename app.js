'use strict';
/* ================= Утилиты ================= */
const KEY = 'konverty-v1';
const GROUPS = { mandatory: 'Обязательные', personal: 'Личные', life: 'Образ жизни', goal: 'Цели и резервы' };
const GORDER = ['mandatory', 'personal', 'life', 'goal'];
const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const MSHORT = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = v => { const n = parseFloat(String(v ?? '').replace(/\s/g, '').replace(',', '.')); return isFinite(n) ? n : 0; };
const r2 = n => Math.round(n * 100) / 100;
const NF = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });
const money = n => NF.format(r2(n)) + ' ₽';
const today = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
const ymOf = d => d.slice(0, 7);
const ymLabel = ym => { const [y, m] = ym.split('-'); return MONTHS[m - 1] + ' ' + y; };
const ymShift = (ym, k) => { let [y, m] = ym.split('-').map(Number); m += k; while (m < 1) { m += 12; y--; } while (m > 12) { m -= 12; y++; } return y + '-' + String(m).padStart(2, '0'); };
const dateLabel = d => { const [y, m, dd] = d.split('-'); return +dd + ' ' + MSHORT[m - 1] + (y != today().slice(0, 4) ? ' ' + y : ''); };
const sum = (a, f = x => x) => a.reduce((s, x) => s + f(x), 0);

/* ================= Данные ================= */
function seed() {
  const F = (name, group, plan = 0, o = {}) => ({ id: uid(), name, group, plan, start: 0, pct: 0, capType: 'none', cap: 0, emoji: '💰', archived: false, cushion: false, ...o });
  const funds = [
    F('Продукты', 'mandatory', 30000, { emoji: '🛒' }), F('Связь', 'mandatory', 1200, { emoji: '📱' }),
    F('Транспорт', 'mandatory', 3000, { emoji: '🚌' }), F('Аренда и ЖКУ', 'mandatory', 40000, { emoji: '🏠' }),
    F('Хоз. нужды', 'mandatory', 3000, { emoji: '🧽' }), F('Здоровье', 'mandatory', 1500, { emoji: '🩺' }),
    F('Красота', 'mandatory', 8000, { emoji: '💄' }), F('Кредит', 'mandatory', 3000, { emoji: '💳' }),
    F('Одежда Гуля', 'personal', 10000, { emoji: '👗' }), F('Личное Гуля', 'personal', 0, { emoji: '🌸' }), F('Техника Гуля', 'personal', 0, { emoji: '🎧' }),
    F('Одежда Шамиль', 'personal', 10000, { emoji: '👕' }), F('Личное Шамиль', 'personal', 0, { emoji: '🎯' }), F('Техника Шамиль', 'personal', 0, { emoji: '💻' }),
    F('Развлечения', 'life', 5000, { emoji: '🎳', capType: 'mult', cap: 1.5 }), F('Витамины', 'life', 3000, { emoji: '💊', capType: 'mult', cap: 1.5 }),
    F('Ресторан', 'life', 5000, { emoji: '🍣', capType: 'mult', cap: 1.5 }), F('Подарки', 'life', 3000, { emoji: '🎁', capType: 'mult', cap: 1.5 }),
    F('Спорт', 'life', 2500, { emoji: '🏋️' }),
    F('Подушка безопасности', 'goal', 0, { emoji: '🛟', pct: 100, capType: 'fixed', cap: 1000000, cushion: true }),
    F('Отпуск', 'goal', 0, { emoji: '🏖️' }), F('Инвестиции', 'goal', 0, { emoji: '📈' }), F('Погашение долгов', 'goal', 0, { emoji: '🧾' }),
    F('Машина', 'goal', 0, { emoji: '🚗' }), F('Дом', 'goal', 0, { emoji: '🏡' }), F('Мебель', 'goal', 0, { emoji: '🛋️' }),
    F('Ремонт', 'goal', 0, { emoji: '🔨' }), F('Блогинг', 'goal', 0, { emoji: '🎥' }), F('Мечта', 'goal', 0, { emoji: '✨' }),
  ];
  const by = n => funds.find(f => f.name === n)?.id || '';
  const C = (name, type, fund) => ({ id: uid(), name, type, fundId: fund ? by(fund) : '' });
  const cats = [
    C('Покупка еды', 'expense', 'Продукты'), C('Сотовая связь и интернет', 'expense', 'Связь'),
    C('Транспорт, такси, бензин', 'expense', 'Транспорт'), C('Аренда и ЖКУ', 'expense', 'Аренда и ЖКУ'),
    C('Хозяйственные товары', 'expense', 'Хоз. нужды'), C('Лекарства, анализы, врачи', 'expense', 'Здоровье'),
    C('Витамины, БАДы, протеин', 'expense', 'Витамины'), C('Косметика и уход', 'expense', 'Красота'),
    C('Оплата кредитов', 'expense', 'Кредит'), C('Одежда Гуля', 'expense', 'Одежда Гуля'), C('Одежда Шамиль', 'expense', 'Одежда Шамиль'),
    C('Личные покупки Гуля', 'expense', 'Личное Гуля'), C('Личные покупки Шамиль', 'expense', 'Личное Шамиль'),
    C('Техника Гуля', 'expense', 'Техника Гуля'), C('Техника Шамиль', 'expense', 'Техника Шамиль'),
    C('Развлечения', 'expense', 'Развлечения'), C('Ресторан, кафе, фастфуд', 'expense', 'Ресторан'),
    C('Подарки', 'expense', 'Подарки'), C('Спортзал', 'expense', 'Спорт'), C('Билеты, отели в отпуск', 'expense', 'Отпуск'),
    C('Покупка инвестиций', 'expense', 'Инвестиции'), C('Возврат долгов', 'expense', 'Погашение долгов'),
    C('Расходы на блог', 'expense', 'Блогинг'), C('Мебель', 'expense', 'Мебель'), C('Ремонт', 'expense', 'Ремонт'),
    C('Расходы на бизнес', 'expense', ''), C('Прочее', 'expense', ''),
    C('Зарплата Гуля', 'income', ''), C('Доход Шамиля', 'income', ''),
    C('Доход от инвестиций (крипта, дивиденды)', 'income', ''), C('Прочие поступления', 'income', ''),
  ];
  const A = (name, owner, currency = 'RUB') => ({ id: uid(), name, owner, currency, amount: 0 });
  const accounts = [
    A('Альфа-Банк', 'Гуля'), A('Т-Банк дебет', 'Гуля'), A('Т-Инвестиции', 'Гуля'), A('Сбер', 'Гуля'), A('Наличные', 'Гуля'), A('Криптокошелёк', 'Гуля', 'USDT'),
    A('Альфа-Банк', 'Шамиль'), A('Т-Банк дебет', 'Шамиль'), A('Зират', 'Шамиль'), A('Сбер', 'Шамиль'), A('Наличные', 'Шамиль'), A('Binance', 'Шамиль', 'USDT'),
  ];
  return {
    v: 1, funds, cats, tx: [], accounts, debts: [],
    rates: { RUB: 1, USD: 90, USDT: 90, EUR: 98 },
    people: ['Гуля', 'Шамиль'],
    cushion: { months: 12, infl: 1.2, mid: 0.7, danger: 0.3 },
    lastBackup: null, lastRecon: null, onboard: true,
  };
}
function load() {
  try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && Array.isArray(d.funds)) return { ...seed(), ...d }; } catch (e) {}
  return seed();
}
let S = load();
function save() { localStorage.setItem(KEY, JSON.stringify(S)); }

const fundById = id => S.funds.find(f => f.id === id);
const catById = id => S.cats.find(c => c.id === id);
const active = () => S.funds.filter(f => !f.archived);
const capOf = f => f.capType === 'mult' ? f.plan * f.cap : f.capType === 'fixed' ? f.cap : Infinity;

/** Остатки фондов. pred — какие операции учитывать */
function balances(pred = () => true) {
  const b = {}; S.funds.forEach(f => b[f.id] = +f.start || 0); let pool = 0;
  for (const t of S.tx) {
    if (!pred(t)) continue; const a = +t.amount;
    if (t.type === 'expense') b[t.fundId] = (b[t.fundId] || 0) - a;
    else if (t.type === 'income') { if (t.fundId) b[t.fundId] = (b[t.fundId] || 0) + a; else pool += a; }
    else if (t.type === 'alloc') { pool -= a; b[t.fundId] = (b[t.fundId] || 0) + a; }
    else if (t.type === 'transfer') { b[t.fundId] = (b[t.fundId] || 0) - a; b[t.toFundId] = (b[t.toFundId] || 0) + a; }
  }
  return { b, pool: r2(pool) };
}
/** Движение по фондам за месяц */
function monthFlow(ym) {
  const inn = {}, out = {}; let income = 0, expense = 0; const byCat = {};
  for (const t of S.tx) {
    if (ymOf(t.date) !== ym) continue; const a = +t.amount;
    if (t.type === 'expense') { out[t.fundId] = (out[t.fundId] || 0) + a; expense += a; byCat[t.catId || ''] = (byCat[t.catId || ''] || 0) + a; }
    else if (t.type === 'income') { income += a; if (t.fundId) inn[t.fundId] = (inn[t.fundId] || 0) + a; }
    else if (t.type === 'alloc') inn[t.fundId] = (inn[t.fundId] || 0) + a;
    else if (t.type === 'transfer') { out[t.fundId] = (out[t.fundId] || 0) + a; inn[t.toFundId] = (inn[t.toFundId] || 0) + a; }
  }
  return { inn, out, income, expense, byCat };
}

/* ================= Навигация ================= */
const ICONS = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  ops: '<path d="M4 6h16M4 12h16M4 18h10"/>',
  dist: '<path d="M12 3v6m0 0l-6 6m6-6l6 6M6 15v5m12-5v5M12 9v11"/>',
  report: '<path d="M4 20V10m6 10V4m6 16v-7m4 7H2"/>',
  more: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
};
const TABS = [['home', 'Главная'], ['ops', 'Операции'], ['dist', 'Распределить'], ['report', 'Отчёт'], ['more', 'Ещё']];
const SUB = { funds: 'Фонды', cats: 'Статьи', cushion: 'Подушка', recon: 'Сверка счетов', debts: 'Долги', data: 'Данные и настройки', help: 'Как пользоваться' };
let view = 'home';
const OPS = { ym: ymOf(today()), fund: '', type: '', q: '' };
let REP_YM = ymOf(today());

function go(v) { if (v === 'dist') D = null; view = v; history.replaceState(null, '', v === 'home' ? location.pathname : '#' + v); render(); window.scrollTo(0, 0); }
function render() {
  const tab = SUB[view] ? 'more' : view;
  $('#tabs').innerHTML = TABS.map(([k, n]) => `<button class="${tab === k ? 'on' : ''}" onclick="go('${k}')"><svg viewBox="0 0 24 24">${ICONS[k]}</svg>${n}</button>`).join('');
  const title = SUB[view] || TABS.find(t => t[0] === view)[1];
  $('#top').innerHTML = (SUB[view] ? `<button class="back" onclick="go('more')">‹</button>` : '') + `<h1>${view === 'home' ? 'Конверты' : title}</h1>`;
  $('#fab').style.display = ['home', 'ops'].includes(view) ? '' : 'none';
  $('#app').innerHTML = VIEWS[view]();
  AFTER[view]?.();
}

/* ================= Главная ================= */
function fundCard(f, b, spent) {
  const bal = b[f.id] || 0; let bar = '', sub = '';
  if (f.group !== 'goal' && f.plan > 0) {
    const p = Math.min(100, spent / f.plan * 100);
    bar = `<div class="bar"><i class="${spent > f.plan ? 'over' : ''}" style="width:${p}%"></i></div>`;
    sub = `потрачено ${NF.format(r2(spent))} из ${NF.format(f.plan)}`;
  } else if (isFinite(capOf(f)) && capOf(f) > 0) {
    bar = `<div class="bar"><i style="width:${Math.max(0, Math.min(100, bal / capOf(f) * 100))}%"></i></div>`;
    sub = `цель ${NF.format(capOf(f))}`;
  } else sub = spent ? `потрачено ${NF.format(r2(spent))}` : (f.pct ? `${f.pct}% от остатка` : '&nbsp;');
  return `<button class="fund" onclick="OPS.fund='${f.id}';OPS.type='';go('ops')"><div class="fe">${esc(f.emoji)}</div><div class="fn">${esc(f.name)}</div><div class="fb ${bal < 0 ? 'neg' : ''}">${money(bal)}</div>${bar}<div class="fs">${sub}</div></button>`;
}
const VIEWS = {};
const AFTER = {};
VIEWS.home = () => {
  const { b, pool } = balances(); const ym = ymOf(today()); const fl = monthFlow(ym);
  const funds = active(); const total = sum(funds, f => b[f.id] || 0) + pool;
  const negs = funds.filter(f => (b[f.id] || 0) < 0);
  let h = `<div class="card hero"><div class="lbl">Всего во всех фондах</div><div class="big">${money(total)}</div>
    <div class="row"><div class="pill"><span>Доход · ${MONTHS[+ym.slice(5) - 1]}</span><b>${money(fl.income)}</b></div>
    <div class="pill"><span>Расходы · ${MONTHS[+ym.slice(5) - 1]}</span><b>${money(fl.expense)}</b></div></div>
    ${pool > 0.009 || pool < -0.009 ? `<div class="pool"><div><span style="font-size:12px;opacity:.85">Нераспределено</span><br><b>${money(pool)}</b></div>${pool > 0 ? `<button onclick="go('dist')">Распределить</button>` : ''}</div>` : ''}</div>`;
  if (S.onboard) h += `<div class="alert g"><div class="grow"><b>С чего начать.</b> Впишите текущие остатки в каждом фонде (Ещё → Фонды → «Остаток на старте»). Потом добавляйте доходы и раскладывайте их во вкладке «Распределить».</div></div>
    <div class="btns" style="margin-top:-2px"><button class="btn sm pri" onclick="go('funds')">Открыть фонды</button><button class="btn sm" onclick="S.onboard=false;save();render()">Скрыть</button></div>`;
  const days = S.lastBackup ? (Date.now() - S.lastBackup) / 864e5 : Infinity;
  if (S.tx.length > 5 && days > 14) h += `<div class="alert y"><div class="grow">Данные хранятся только на этом устройстве. ${S.lastBackup ? 'Последняя копия ' + Math.floor(days) + ' дн. назад.' : 'Резервной копии ещё нет.'}</div><button class="btn sm" onclick="exportJSON()">Сохранить</button></div>`;
  if (negs.length) h += `<div class="alert r"><div class="grow">В минусе: ${negs.map(f => esc(f.name) + ' ' + money(b[f.id])).join(', ')}. Переложите деньги из другого фонда.</div><button class="btn sm" onclick="openTx({type:'transfer',toFundId:'${negs[0].id}'})">Перевод</button></div>`;
  for (const g of GORDER) {
    const fs = funds.filter(f => f.group === g); if (!fs.length) continue;
    h += `<h2><span>${GROUPS[g]}</span><span>${money(sum(fs, f => b[f.id] || 0))}</span></h2><div class="grid">${fs.map(f => fundCard(f, b, sumExp(f.id, ym))).join('')}</div>`;
  }
  return h;
};
function sumExp(fid, ym) { return sum(S.tx.filter(t => t.type === 'expense' && t.fundId === fid && ymOf(t.date) === ym), t => +t.amount); }

/* ================= Операции ================= */
function txLine(t) {
  const f = fundById(t.fundId), c = catById(t.catId);
  let ic = f?.emoji || '💰', title, sub, amt, cls = '';
  if (t.type === 'expense') { title = c?.name || 'Расход'; sub = f?.name || '—'; amt = '−' + money(t.amount); }
  else if (t.type === 'income') { title = c?.name || 'Доход'; sub = f ? '→ ' + f.name : '→ нераспределённое'; amt = '+' + money(t.amount); cls = 'pos'; ic = '💵'; }
  else if (t.type === 'alloc') { title = 'Пополнение фонда'; sub = f?.name; amt = '+' + money(t.amount); cls = 'pos'; }
  else { const to = fundById(t.toFundId); title = 'Перевод'; sub = (f?.name || '?') + ' → ' + (to?.name || '?'); amt = money(t.amount); ic = '🔁'; cls = 'warn'; }
  if (t.note) sub += ' · ' + t.note; if (t.who) sub += ' · ' + t.who;
  return `<button class="item" onclick="openTx('${t.id}')"><div class="ic">${esc(ic)}</div><div class="mid"><div class="t">${esc(title)}</div><div class="s">${esc(sub)}</div></div><div class="amt ${cls}">${amt}</div></button>`;
}
VIEWS.ops = () => {
  const q = OPS.q.trim().toLowerCase();
  const list = S.tx.filter(t => ymOf(t.date) === OPS.ym && (!OPS.fund || t.fundId === OPS.fund || t.toFundId === OPS.fund) && (!OPS.type || t.type === OPS.type || (OPS.type === 'income' && t.type === 'alloc'))
    && (!q || [t.note, catById(t.catId)?.name, fundById(t.fundId)?.name, String(t.amount)].join(' ').toLowerCase().includes(q)))
    .sort((a, b) => b.date.localeCompare(a.date) || (b.ts || 0) - (a.ts || 0));
  const types = [['', 'Все'], ['expense', 'Расходы'], ['income', 'Доходы'], ['transfer', 'Переводы']];
  let h = `<div class="toolbar"><div class="mswitch"><button onclick="OPS.ym=ymShift(OPS.ym,-1);render()">‹</button><span>${ymLabel(OPS.ym)}</span><button onclick="OPS.ym=ymShift(OPS.ym,1);render()">›</button></div>
    <select class="inp" style="flex:1;min-width:140px;padding:9px" onchange="OPS.fund=this.value;render()"><option value="">Все фонды</option>${fundOptions(OPS.fund, true)}</select></div>
    <div class="chips">${types.map(([k, n]) => `<button class="chip ${OPS.type === k ? 'on' : ''}" onclick="OPS.type='${k}';render()">${n}</button>`).join('')}</div>
    <input class="inp" style="margin-top:8px" placeholder="Поиск по заметке, статье, сумме" value="${esc(OPS.q)}" oninput="OPS.q=this.value;clearTimeout(window._qt);window._qt=setTimeout(()=>{render();const i=$('main input');i.focus();i.setSelectionRange(i.value.length,i.value.length)},300)">`;
  if (OPS.fund) { const { b } = balances(); h += `<div class="note">Остаток фонда «${esc(fundById(OPS.fund)?.name)}»: <b>${money(b[OPS.fund] || 0)}</b></div>`; }
  if (!list.length) return h + `<div class="empty"><div class="e">🗒️</div>Операций нет.<br>Нажмите «+», чтобы добавить.</div>`;
  const exp = sum(list.filter(t => t.type === 'expense'), t => +t.amount), inc = sum(list.filter(t => t.type === 'income'), t => +t.amount);
  h += `<div class="note">Расходы: <b>${money(exp)}</b> · Доходы: <b class="pos">${money(inc)}</b> · ${list.length} шт.</div>`;
  let cur = '';
  for (const t of list) {
    if (t.date !== cur) {
      if (cur) h += '</div>'; cur = t.date;
      const de = sum(list.filter(x => x.date === cur && x.type === 'expense'), x => +x.amount);
      h += `<div class="day"><span>${dateLabel(cur)}</span><span>${de ? '−' + money(de) : ''}</span></div><div class="list">`;
    }
    h += txLine(t);
  }
  return h + '</div>';
};
function fundOptions(sel, withArchived) {
  return GORDER.map(g => { const fs = S.funds.filter(f => f.group === g && (withArchived || !f.archived || f.id === sel)); return fs.length ? `<optgroup label="${GROUPS[g]}">${fs.map(f => `<option value="${f.id}" ${f.id === sel ? 'selected' : ''}>${esc(f.emoji + ' ' + f.name)}</option>`).join('')}</optgroup>` : ''; }).join('');
}

/* ================= Форма операции ================= */
let TX = null;
function openTx(arg) {
  const ex = typeof arg === 'string' ? S.tx.find(t => t.id === arg) : null;
  TX = ex ? { ...ex } : { id: null, type: 'expense', amount: '', date: today(), fundId: OPS.fund || '', toFundId: '', catId: '', note: '', who: '', ...(typeof arg === 'object' ? arg : {}) };
  drawTx();
}
function drawTx() {
  const t = TX, isAlloc = t.type === 'alloc';
  const cats = S.cats.filter(c => c.type === (t.type === 'income' ? 'income' : 'expense'));
  const { b, pool } = balances(x => x.id !== t.id);
  let h = `<h3>${t.id ? 'Операция' : 'Новая операция'}</h3>`;
  if (!isAlloc) h += `<div class="seg">${[['expense', 'Расход', 'e'], ['income', 'Доход', 'i'], ['transfer', 'Перевод', 't']].map(([k, n, c]) => `<button class="${c} ${t.type === k ? 'on' : ''}" onclick="txSet('type','${k}')">${n}</button>`).join('')}</div>`;
  else h += `<div class="note">Пополнение фонда из нераспределённого дохода</div>`;
  h += `<label class="f"><input id="txAmt" class="inp amount" inputmode="decimal" placeholder="0 ₽" value="${t.amount}" oninput="TX.amount=this.value;txHint()"></label>`;
  if (t.type === 'expense' || t.type === 'income') h += `<label class="f"><span>Статья</span><select class="inp" onchange="txCat(this.value)"><option value="">— без статьи —</option>${cats.map(c => `<option value="${c.id}" ${c.id === t.catId ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>`;
  if (t.type === 'transfer') h += `<div class="row2"><label class="f"><span>Из фонда</span><select class="inp" onchange="TX.fundId=this.value;txHint()"><option value="">—</option>${fundOptions(t.fundId)}</select></label>
    <label class="f"><span>В фонд</span><select class="inp" onchange="TX.toFundId=this.value;txHint()"><option value="">—</option>${fundOptions(t.toFundId)}</select></label></div>`;
  else h += `<label class="f"><span>${t.type === 'income' ? 'Куда зачислить' : 'Из фонда'}</span><select class="inp" id="txFund" onchange="TX.fundId=this.value;txHint()">${t.type === 'income' ? `<option value="">Нераспределённое (потом распределю)</option>` : '<option value="">— выберите фонд —</option>'}${fundOptions(t.fundId)}</select></label>`;
  h += `<div class="row2"><label class="f"><span>Дата</span><input type="date" class="inp" value="${t.date}" onchange="TX.date=this.value"></label>
    <label class="f"><span>Кто</span><select class="inp" onchange="TX.who=this.value"><option value="">Общее</option>${S.people.map(p => `<option ${p === t.who ? 'selected' : ''}>${esc(p)}</option>`).join('')}</select></label></div>
    <label class="f"><span>Заметка</span><input class="inp" value="${esc(t.note)}" placeholder="например: продукты в Ленте" oninput="TX.note=this.value"></label>
    <div id="txHint"></div>
    <div class="btns"><button class="btn pri" onclick="txSave()">${t.id ? 'Сохранить' : 'Добавить'}</button></div>
    ${t.id ? `<div class="btns"><button class="btn" onclick="txDup()">Повторить</button><button class="btn red" onclick="txDel()">Удалить</button></div>` : ''}`;
  openSheet(h); txHint();
  if (!t.id) setTimeout(() => $('#txAmt')?.focus(), 250);
}
function txSet(k, v) { TX[k] = v; if (k === 'type') { TX.catId = ''; if (v === 'income') TX.fundId = ''; } drawTx(); }
function txCat(id) { TX.catId = id; const c = catById(id); if (c?.fundId && (TX.type === 'expense' || TX.type === 'income')) { TX.fundId = c.fundId; const s = $('#txFund'); if (s) s.value = c.fundId; } txHint(); }
function txHint() {
  const t = TX, a = num(t.amount), el = $('#txHint'); if (!el) return; const msgs = [];
  const { b } = balances(x => x.id !== t.id);
  if (t.type === 'expense' && t.fundId && a > 0) {
    const left = (b[t.fundId] || 0) - a;
    msgs.push(left < 0 ? `<div class="alert r">Фонд уйдёт в минус: ${money(left)}. Лучше сначала перевести деньги из другого фонда.</div>` : `<div class="note">В фонде останется ${money(left)}</div>`);
    const c = catById(t.catId); if (c?.fundId && c.fundId !== t.fundId) msgs.push(`<div class="alert y">Статья «${esc(c.name)}» обычно идёт из фонда «${esc(fundById(c.fundId)?.name)}». Проверьте, не ошибка ли это.</div>`);
  }
  if (t.type === 'transfer' && t.fundId && a > 0) msgs.push(`<div class="note">В «${esc(fundById(t.fundId)?.name)}» останется ${money((b[t.fundId] || 0) - a)}</div>`);
  el.innerHTML = msgs.join('');
}
function txSave() {
  const t = TX, a = r2(num(t.amount));
  if (!(a > 0)) return toast('Введите сумму больше нуля');
  if (t.type === 'expense' && !t.fundId) return toast('Выберите фонд');
  if (t.type === 'transfer' && (!t.fundId || !t.toFundId)) return toast('Выберите оба фонда');
  if (t.type === 'transfer' && t.fundId === t.toFundId) return toast('Фонды должны отличаться');
  if (t.type === 'alloc' && !t.fundId) return toast('Выберите фонд');
  if (!t.date) return toast('Укажите дату');
  if (!t.id) {
    const dup = S.tx.find(x => x.date === t.date && +x.amount === a && x.fundId === t.fundId && x.type === t.type);
    if (dup && !confirm('Такая операция (та же дата, сумма и фонд) уже есть. Всё равно добавить?')) return;
  }
  const rec = { ...t, amount: a, note: (t.note || '').trim() };
  if (t.id) S.tx[S.tx.findIndex(x => x.id === t.id)] = rec; else { rec.id = uid(); rec.ts = Date.now(); S.tx.push(rec); }
  if (S.onboard && S.tx.length > 3) S.onboard = false;
  save(); closeSheet(); render(); toast(t.id ? 'Сохранено' : 'Добавлено');
}
function txDup() { TX = { ...TX, id: null, date: today() }; drawTx(); }
function txDel() { if (!confirm('Удалить операцию?')) return; S.tx = S.tx.filter(x => x.id !== TX.id); save(); closeSheet(); render(); toast('Удалено'); }

/* ================= Распределение ================= */
let D = null;
function planDist(amount) {
  const { b } = balances(); let left = r2(amount); const rows = [];
  for (const g of ['mandatory', 'personal', 'life']) for (const f of active().filter(f => f.group === g && f.plan > 0)) {
    const room = Math.max(0, capOf(f) - (b[f.id] || 0));
    const give = r2(Math.max(0, Math.min(f.plan, room, left))); left = r2(left - give);
    let note = `план ${NF.format(f.plan)}`;
    if (room < f.plan) note += room <= 0 ? ' · лимит достигнут' : ` · до лимита ${NF.format(r2(room))}`;
    else if (give < f.plan && amount > 0) note += ' · не хватило денег';
    rows.push({ id: f.id, give, note });
  }
  const base = Math.max(0, left);
  for (const f of active().filter(f => f.group === 'goal' && f.pct > 0)) {
    const want = base * f.pct / 100, room = Math.max(0, capOf(f) - (b[f.id] || 0));
    const give = r2(Math.max(0, Math.min(want, room))); left = r2(left - give);
    rows.push({ id: f.id, give, note: `${f.pct}% остатка` + (room < want ? ' · лимит' : '') });
  }
  return rows;
}
VIEWS.dist = () => {
  const { pool } = balances();
  if (!D) D = { amount: pool > 0 ? String(pool) : '', date: today(), catId: S.cats.find(c => c.type === 'income')?.id || '', rows: planDist(pool > 0 ? pool : 0) };
  const amount = num(D.amount), total = r2(sum(D.rows, r => r.give)), left = r2(amount - total), extra = r2(amount - pool);
  const pct = sum(active().filter(f => f.group === 'goal'), f => +f.pct || 0);
  let h = `<div class="card"><div class="note" style="margin-top:0">Нераспределено сейчас: <b>${money(pool)}</b></div>
    <label class="f"><span>Сколько распределяем</span><input class="inp amount" inputmode="decimal" value="${esc(D.amount)}" placeholder="0 ₽" onchange="D.amount=this.value;D.rows=planDist(num(this.value));render()"></label>
    ${extra > 0.009 ? `<div class="alert y"><div class="grow">Это на ${money(extra)} больше нераспределённого остатка. Разница будет записана как новый доход:
      <select class="inp" style="margin-top:6px" onchange="D.catId=this.value">${S.cats.filter(c => c.type === 'income').map(c => `<option value="${c.id}" ${c.id === D.catId ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div></div>` : ''}
    <label class="f"><span>Дата</span><input type="date" class="inp" value="${D.date}" onchange="D.date=this.value"></label></div>`;
  if (Math.abs(pct - 100) > 0.01) h += `<div class="alert y">Проценты по целям в сумме дают ${NF.format(pct)}%, а должно быть 100%. Исправьте в Ещё → Фонды.</div>`;
  h += `<div class="note">Сначала полностью наполняются фонды с планом (обязательные → личные → образ жизни). Если фонд упёрся в лимит (например ×1,5 от плана), его пополнение пропускается. Остаток делится между целями по процентам. Любую сумму можно поправить вручную.</div>`;
  for (const g of GORDER) {
    const rs = D.rows.filter(r => fundById(r.id).group === g); if (!rs.length) continue;
    h += `<h2><span>${GROUPS[g]}</span><span>${money(sum(rs, r => r.give))}</span></h2><div class="list">${rs.map(r => { const f = fundById(r.id); return `<div class="distrow"><div class="ic" style="font-size:20px">${esc(f.emoji)}</div><div class="n">${esc(f.name)}<small>${esc(r.note)}</small></div><input class="inp" inputmode="decimal" value="${r.give}" onchange="distEdit('${r.id}',this.value)"></div>`; }).join('')}</div>`;
  }
  h += `<div class="card"><div class="row2"><div>Распределено<br><b style="font-size:18px">${money(total)}</b></div><div>Останется нераспределённым<br><b style="font-size:18px" class="${left < -0.009 ? 'neg' : ''}">${money(left)}</b></div></div>
    ${left < -0.009 ? '<div class="alert r">Распределено больше, чем есть. Уменьшите суммы.</div>' : ''}
    <div class="btns"><button class="btn" onclick="D.rows=planDist(num(D.amount));render()">Пересчитать</button><button class="btn pri" onclick="distCommit()">Распределить</button></div></div>`;
  return h;
};
function distEdit(id, v) { D.rows.find(r => r.id === id).give = r2(Math.max(0, num(v))); render(); }
function distCommit() {
  const { pool } = balances(); const amount = r2(num(D.amount)), total = r2(sum(D.rows, r => r.give));
  if (!(amount > 0) || !(total > 0)) return toast('Нечего распределять');
  if (total - amount > 0.009) return toast('Распределено больше суммы');
  const extra = r2(Math.max(0, total - pool));
  if (extra > 0) S.tx.push({ id: uid(), ts: Date.now(), type: 'income', amount: extra, date: D.date, fundId: '', catId: D.catId, note: 'Доход для распределения', who: '' });
  D.rows.filter(r => r.give > 0).forEach(r => S.tx.push({ id: uid(), ts: Date.now(), type: 'alloc', amount: r.give, date: D.date, fundId: r.id, catId: '', note: 'Распределение', who: '' }));
  S.onboard = false; save(); D = null; toast('Распределено ' + money(total)); go('home');
}

/* ================= Отчёт ================= */
VIEWS.report = () => {
  const ym = REP_YM, fl = monthFlow(ym);
  const st = balances(t => t.date < ym + '-01').b, en = balances(t => ymOf(t.date) <= ym).b;
  let h = `<div class="toolbar"><div class="mswitch"><button onclick="REP_YM=ymShift(REP_YM,-1);render()">‹</button><span>${ymLabel(ym)}</span><button onclick="REP_YM=ymShift(REP_YM,1);render()">›</button></div></div>
  <div class="kpi"><div><span>Доходы</span><b class="pos">${money(fl.income)}</b></div><div><span>Расходы</span><b>${money(fl.expense)}</b></div><div><span>Сальдо</span><b class="${fl.income - fl.expense < 0 ? 'neg' : 'pos'}">${money(fl.income - fl.expense)}</b></div></div>`;
  // Год
  const y = ym.slice(0, 4); const ms = Array.from({ length: 12 }, (_, i) => `${y}-${String(i + 1).padStart(2, '0')}`).map(m => ({ m, ...monthFlow(m) }));
  const mx = Math.max(1, ...ms.map(m => Math.max(m.income, m.expense)));
  h += `<div class="card"><b>${y} год</b><div class="cols">${ms.map((m, i) => `<div class="c ${m.m === ym ? 'cur' : ''}" onclick="REP_YM='${m.m}';render()"><div><i class="in" style="height:${m.income / mx * 100}%"></i><i class="out" style="height:${m.expense / mx * 100}%"></i></div><span>${MSHORT[i]}</span></div>`).join('')}</div>
    <div class="legend"><span><i style="background:var(--acc)"></i>доходы</span><span><i style="background:var(--red)"></i>расходы</span></div></div>`;
  // Расходы по фондам
  const ex = S.funds.map(f => ({ f, v: sum(S.tx.filter(t => t.type === 'expense' && t.fundId === f.id && ymOf(t.date) === ym), t => +t.amount) })).filter(x => x.v > 0).sort((a, b) => b.v - a.v);
  if (ex.length) {
    const m = ex[0].v;
    h += `<div class="card"><b>Расходы по фондам</b>${ex.map(x => `<div class="hbar"><div class="n">${esc(x.f.emoji + ' ' + x.f.name)}</div><div class="b"><i style="width:${x.v / m * 100}%"></i></div><div class="v">${NF.format(r2(x.v))}</div></div>`).join('')}</div>`;
    const plans = ex.filter(x => x.f.plan > 0 && x.v > x.f.plan && x.f.group !== 'goal');
    if (plans.length) h += `<div class="alert y">План превышен: ${plans.map(x => `${esc(x.f.name)} (+${NF.format(r2(x.v - x.f.plan))})`).join(', ')}</div>`;
    const cs = Object.entries(fl.byCat).sort((a, b) => b[1] - a[1]);
    h += `<div class="card"><b>По статьям</b><table class="t">${cs.map(([id, v]) => `<tr><td>${esc(catById(id)?.name || 'Без статьи')}</td><td>${money(v)}</td><td style="color:var(--mut)">${Math.round(v / fl.expense * 100)}%</td></tr>`).join('')}</table></div>`;
  }
  // Таблица остатков
  const fs = S.funds.filter(f => !f.archived || st[f.id] || en[f.id]);
  h += `<div class="card"><b>Остатки по фондам</b><div class="scroll"><table class="t"><tr><th>Фонд</th><th>Начало</th><th>Приход</th><th>Расход</th><th>Конец</th></tr>
    ${GORDER.map(g => fs.filter(f => f.group === g).map(f => `<tr><td>${esc(f.emoji + ' ' + f.name)}</td><td>${NF.format(r2(st[f.id] || 0))}</td><td class="pos">${fl.inn[f.id] ? NF.format(r2(fl.inn[f.id])) : ''}</td><td>${fl.out[f.id] ? NF.format(r2(fl.out[f.id])) : ''}</td><td class="${(en[f.id] || 0) < 0 ? 'neg' : ''}"><b>${NF.format(r2(en[f.id] || 0))}</b></td></tr>`).join('')).join('')}
    <tr class="tot"><td>Итого</td><td>${NF.format(r2(sum(fs, f => st[f.id] || 0)))}</td><td></td><td></td><td>${NF.format(r2(sum(fs, f => en[f.id] || 0)))}</td></tr></table></div>
    <div class="note">Остатки считаются автоматически по всем операциям. Начало месяца — это конец предыдущего.</div></div>
    <button class="btn" onclick="exportCSV('${ym}')">Выгрузить операции месяца в CSV (Excel)</button>`;
  return h;
};

/* ================= Ещё ================= */
VIEWS.more = () => {
  const { b } = balances(); const cf = active().filter(f => f.cushion);
  const items = [
    ['funds', '🗂️', 'Фонды', `${active().length} фондов · планы, лимиты, проценты`],
    ['cats', '🏷️', 'Статьи', `${S.cats.length} статей · привязка к фондам`],
    ['cushion', '🛟', 'Подушка безопасности', money(sum(cf, f => b[f.id] || 0))],
    ['recon', '🏦', 'Сверка со счетами', S.lastRecon ? 'последняя ' + new Date(S.lastRecon).toLocaleDateString('ru-RU') : 'ещё не делали'],
    ['debts', '🤝', 'Долги', `${S.debts.filter(d => !d.paid).length} открытых`],
    ['data', '💾', 'Данные и настройки', 'копия, импорт, CSV, участники'],
    ['help', '❓', 'Как пользоваться', 'принцип конвертов'],
  ];
  return `<div class="list">${items.map(([k, i, t, s]) => `<button class="item" onclick="go('${k}')"><div class="ic">${i}</div><div class="mid"><div class="t">${t}</div><div class="s">${esc(s)}</div></div><div class="chev">›</div></button>`).join('')}</div>`;
};

/* --- Фонды --- */
VIEWS.funds = () => {
  const { b } = balances(); const pct = sum(active().filter(f => f.group === 'goal'), f => +f.pct || 0);
  let h = `<div class="note">План — сколько класть в фонд каждый месяц. Лимит — потолок, после которого пополнение останавливается. Для целей задаётся % от того, что осталось после планов.</div>`;
  if (Math.abs(pct - 100) > 0.01) h += `<div class="alert y">Сумма процентов по целям: ${NF.format(pct)}% (нужно 100%)</div>`;
  for (const g of GORDER) {
    const fs = S.funds.filter(f => f.group === g); if (!fs.length) continue;
    const plan = sum(fs.filter(f => !f.archived), f => +f.plan || 0);
    h += `<h2><span>${GROUPS[g]}</span><span>${g === 'goal' ? NF.format(sum(fs.filter(f => !f.archived), f => +f.pct || 0)) + '%' : 'план ' + money(plan)}</span></h2><div class="list">${fs.map(f => `<button class="item" onclick="openFund('${f.id}')" style="${f.archived ? 'opacity:.45' : ''}"><div class="ic">${esc(f.emoji)}</div><div class="mid"><div class="t">${esc(f.name)}${f.archived ? ' (архив)' : ''}</div><div class="s">${g === 'goal' ? (f.pct || 0) + '%' : 'план ' + NF.format(f.plan)}${isFinite(capOf(f)) ? ' · лимит ' + NF.format(capOf(f)) : ''}${f.cushion ? ' · подушка' : ''}</div></div><div class="amt ${(b[f.id] || 0) < 0 ? 'neg' : ''}">${money(b[f.id] || 0)}</div></button>`).join('')}</div>`;
  }
  const mand = sum(active().filter(f => f.group !== 'goal'), f => +f.plan || 0);
  h += `<div class="card">Все планы в месяц: <b>${money(mand)}</b><div class="note">Если доход больше, разница уйдёт в цели по процентам.</div></div>
    <button class="btn pri" onclick="openFund()">+ Новый фонд</button>`;
  return h;
};
let FE = null;
function openFund(id) {
  const f = id ? fundById(id) : null;
  FE = f ? { ...f } : { id: null, name: '', group: 'life', plan: 0, start: 0, pct: 0, capType: 'none', cap: 0, emoji: '💰', archived: false, cushion: false };
  const e = FE;
  openSheet(`<h3>${f ? 'Фонд' : 'Новый фонд'}</h3>
    <div class="row2" style="grid-template-columns:70px 1fr"><label class="f"><span>Значок</span><input class="inp" style="text-align:center;font-size:22px;padding:8px" value="${esc(e.emoji)}" oninput="FE.emoji=this.value"></label>
    <label class="f"><span>Название</span><input class="inp" value="${esc(e.name)}" oninput="FE.name=this.value"></label></div>
    <label class="f"><span>Группа</span><select class="inp" onchange="FE.group=this.value;openFundRe()">${GORDER.map(g => `<option value="${g}" ${g === e.group ? 'selected' : ''}>${GROUPS[g]}</option>`).join('')}</select></label>
    <div id="fundDyn"></div>
    <label class="f"><span>Остаток на старте (сколько денег уже лежит в фонде до первой операции)</span><input class="inp" inputmode="decimal" value="${e.start}" oninput="FE.start=num(this.value)"></label>
    <label class="f" style="display:flex;gap:10px;align-items:center"><input type="checkbox" ${e.cushion ? 'checked' : ''} onchange="FE.cushion=this.checked"> Это подушка безопасности</label>
    <label class="f" style="display:flex;gap:10px;align-items:center"><input type="checkbox" ${e.archived ? 'checked' : ''} onchange="FE.archived=this.checked"> В архиве (скрыт, история сохраняется)</label>
    <div class="btns"><button class="btn pri" onclick="fundSave()">Сохранить</button></div>
    ${f ? `<div class="btns"><button class="btn red" onclick="fundDel()">Удалить фонд</button></div>` : ''}`);
  openFundRe();
}
function openFundRe() {
  const e = FE;
  $('#fundDyn').innerHTML = (e.group === 'goal'
    ? `<label class="f"><span>Процент от остатка после планов</span><input class="inp" inputmode="decimal" value="${e.pct}" oninput="FE.pct=num(this.value)"></label>`
    : `<label class="f"><span>План в месяц, ₽</span><input class="inp" inputmode="decimal" value="${e.plan}" oninput="FE.plan=num(this.value)"></label>`)
    + `<div class="row2"><label class="f"><span>Лимит фонда</span><select class="inp" onchange="FE.capType=this.value;if(this.value==='mult'&&!FE.cap)FE.cap=1.5;openFundRe()">
      <option value="none" ${e.capType === 'none' ? 'selected' : ''}>Без лимита</option><option value="mult" ${e.capType === 'mult' ? 'selected' : ''}>× от плана</option><option value="fixed" ${e.capType === 'fixed' ? 'selected' : ''}>Сумма, ₽</option></select></label>
      ${e.capType !== 'none' ? `<label class="f"><span>${e.capType === 'mult' ? 'Множитель' : 'Сумма'}</span><input class="inp" inputmode="decimal" value="${e.cap}" oninput="FE.cap=num(this.value)"></label>` : '<div></div>'}</div>`;
}
function fundSave() {
  const e = FE; e.name = e.name.trim(); if (!e.name) return toast('Введите название');
  if (S.funds.some(f => f.name.toLowerCase() === e.name.toLowerCase() && f.id !== e.id)) return toast('Фонд с таким названием уже есть');
  if (e.group === 'goal') e.plan = 0; else e.pct = 0;
  if (e.id) S.funds[S.funds.findIndex(f => f.id === e.id)] = e; else { e.id = uid(); S.funds.push(e); }
  save(); closeSheet(); render(); toast('Сохранено');
}
function fundDel() {
  const used = S.tx.some(t => t.fundId === FE.id || t.toFundId === FE.id);
  if (used) return alert('По этому фонду есть операции. Чтобы не испортить историю, отправьте его в архив.');
  if (!confirm('Удалить фонд?')) return;
  S.funds = S.funds.filter(f => f.id !== FE.id); S.cats.forEach(c => { if (c.fundId === FE.id) c.fundId = ''; });
  save(); closeSheet(); render();
}

/* --- Статьи --- */
VIEWS.cats = () => {
  let h = `<div class="note">У статьи можно указать фонд по умолчанию. Тогда при выборе статьи фонд подставится сам, а если выбрать другой, приложение предупредит.</div>`;
  for (const [type, name] of [['expense', 'Расходы'], ['income', 'Доходы']]) {
    h += `<h2>${name}</h2><div class="list">${S.cats.filter(c => c.type === type).map(c => { const f = fundById(c.fundId); return `<button class="item" onclick="openCat('${c.id}')"><div class="ic">${esc(f?.emoji || (type === 'income' ? '💵' : '🏷️'))}</div><div class="mid"><div class="t">${esc(c.name)}</div><div class="s">${f ? '→ ' + esc(f.name) : (type === 'income' ? 'в нераспределённое' : 'фонд выбирается вручную')}</div></div><div class="chev">›</div></button>`; }).join('')}</div>`;
  }
  return h + `<button class="btn pri" onclick="openCat()">+ Новая статья</button>`;
};
let CE = null;
function openCat(id) {
  const c = id ? catById(id) : null; CE = c ? { ...c } : { id: null, name: '', type: 'expense', fundId: '' };
  openSheet(`<h3>${c ? 'Статья' : 'Новая статья'}</h3>
    <label class="f"><span>Название</span><input class="inp" value="${esc(CE.name)}" oninput="CE.name=this.value"></label>
    <label class="f"><span>Тип</span><select class="inp" onchange="CE.type=this.value"><option value="expense" ${CE.type === 'expense' ? 'selected' : ''}>Расход</option><option value="income" ${CE.type === 'income' ? 'selected' : ''}>Доход</option></select></label>
    <label class="f"><span>Фонд по умолчанию</span><select class="inp" onchange="CE.fundId=this.value"><option value="">— не задан —</option>${fundOptions(CE.fundId)}</select></label>
    <div class="btns"><button class="btn pri" onclick="catSave()">Сохранить</button></div>
    ${c ? `<div class="btns"><button class="btn red" onclick="catDel()">Удалить</button></div>` : ''}`);
}
function catSave() {
  CE.name = CE.name.trim(); if (!CE.name) return toast('Введите название');
  if (CE.id) S.cats[S.cats.findIndex(c => c.id === CE.id)] = CE; else { CE.id = uid(); S.cats.push(CE); }
  save(); closeSheet(); render();
}
function catDel() {
  const n = S.tx.filter(t => t.catId === CE.id).length;
  if (!confirm(n ? `Статья используется в ${n} операциях. Они останутся, но без статьи. Удалить?` : 'Удалить статью?')) return;
  S.cats = S.cats.filter(c => c.id !== CE.id); S.tx.forEach(t => { if (t.catId === CE.id) t.catId = ''; }); save(); closeSheet(); render();
}

/* --- Подушка --- */
VIEWS.cushion = () => {
  const { b } = balances(); const cs = S.cushion;
  const have = sum(active().filter(f => f.cushion), f => b[f.id] || 0);
  const mand = sum(active().filter(f => f.group === 'mandatory'), f => +f.plan || 0);
  const target = mand * cs.months * cs.infl;
  const p = target ? Math.min(100, have / target * 100) : 0;
  const m = k => mand * k > 0 ? have / (mand * k) : 0;
  const fmtM = x => x >= 1 ? NF.format(Math.round(x * 10) / 10) + ' мес' : Math.round(x * 30) + ' дн';
  return `<div class="card hero"><div class="lbl">В подушке сейчас</div><div class="big">${money(have)}</div>
    <div class="lbl">Цель: ${money(target)} (${cs.months} мес обязательных расходов + ${Math.round((cs.infl - 1) * 100)}% на инфляцию)</div>
    <div class="bar" style="background:rgba(255,255,255,.2);height:8px;margin-top:8px"><i style="width:${p}%;background:#fff"></i></div><div class="lbl" style="margin-top:6px">${Math.round(p)}% собрано${target > have ? ' · осталось ' + money(target - have) : ''}</div></div>
    <div class="note">Обязательные расходы в месяц (сумма планов группы «Обязательные»): <b>${money(mand)}</b></div>
    <div class="mode"><div class="h"><b>🟢 Обычный режим</b><span class="m">${fmtM(m(1))}</span></div><p>Тратите ${money(mand)}/мес. Вы временно остались без дохода. Остаются только обязательные расходы, отдых и рестораны откладываются до стабильного дохода.</p></div>
    <div class="mode"><div class="h"><b>🟡 Средний режим</b><span class="m">${fmtM(m(cs.mid))}</span></div><p>Тратите ${money(mand * cs.mid)}/мес (−${Math.round((1 - cs.mid) * 100)}%). Без дохода долго: сокращаете обязательные расходы, каждый день ищете работу, работу ищут оба.</p></div>
    <div class="mode"><div class="h"><b>🔴 Режим опасности</b><span class="m">${fmtM(m(cs.danger))}</span></div><p>Тратите ${money(mand * cs.danger)}/мес. Кризис, пандемия, военное положение. Сокращаете всё до минимума, все траты согласовываете заранее, при необходимости переезжаете в жильё дешевле.</p></div>
    <div class="card"><b>Параметры</b><div class="row2">
    <label class="f"><span>Цель, месяцев</span><input class="inp" inputmode="decimal" value="${cs.months}" onchange="S.cushion.months=num(this.value)||12;save();render()"></label>
    <label class="f"><span>Запас на инфляцию, %</span><input class="inp" inputmode="decimal" value="${Math.round((cs.infl - 1) * 100)}" onchange="S.cushion.infl=1+num(this.value)/100;save();render()"></label>
    <label class="f"><span>Средний режим, % трат</span><input class="inp" inputmode="decimal" value="${Math.round(cs.mid * 100)}" onchange="S.cushion.mid=num(this.value)/100||.7;save();render()"></label>
    <label class="f"><span>Опасность, % трат</span><input class="inp" inputmode="decimal" value="${Math.round(cs.danger * 100)}" onchange="S.cushion.danger=num(this.value)/100||.3;save();render()"></label></div>
    <div class="note">Фонды подушки отмечаются галочкой в настройках фонда.</div></div>`;
};

/* --- Сверка --- */
VIEWS.recon = () => {
  const { b, pool } = balances();
  const inFunds = r2(sum(active(), f => b[f.id] || 0) + sum(S.funds.filter(f => f.archived), f => b[f.id] || 0) + pool);
  const rate = c => +S.rates[c] || 0;
  const onAcc = r2(sum(S.accounts, a => num(a.amount) * rate(a.currency)));
  const diff = r2(onAcc - inFunds);
  const curr = Object.keys(S.rates);
  let h = `<div class="note">Раз в месяц впишите, сколько реально лежит на каждом счёте. Сумма должна совпасть с суммой всех фондов. Если не совпадает, значит какая-то трата не записана или записана дважды.</div>
  <div class="kpi"><div><span>На счетах</span><b>${money(onAcc)}</b></div><div><span>В фондах</span><b>${money(inFunds)}</b></div><div><span>Разница</span><b class="${Math.abs(diff) < 1 ? 'pos' : 'neg'}">${money(diff)}</b></div></div>
  ${Math.abs(diff) < 1 ? '<div class="alert g">Всё сходится 👌</div>' : `<div class="alert ${diff > 0 ? 'y' : 'r'}">${diff > 0 ? 'На счетах больше, чем в фондах: возможно, не записан доход.' : 'В фондах больше, чем на счетах: возможно, не записан расход.'}</div>`}`;
  for (const p of [...new Set(S.accounts.map(a => a.owner))]) {
    const as = S.accounts.filter(a => a.owner === p);
    h += `<h2><span>${esc(p || 'Общие')}</span><span>${money(sum(as, a => num(a.amount) * rate(a.currency)))}</span></h2><div class="list">${as.map(a => `<div class="distrow"><div class="n">${esc(a.name)}<small>${a.currency}${a.currency !== 'RUB' ? ' · ' + money(num(a.amount) * rate(a.currency)) : ''}</small></div><input class="inp" inputmode="decimal" value="${a.amount}" onchange="accSet('${a.id}',this.value)"><button class="btn sm" onclick="openAcc('${a.id}')">✎</button></div>`).join('')}</div>`;
  }
  h += `<div class="btns"><button class="btn" onclick="openAcc()">+ Счёт</button><button class="btn pri" onclick="S.lastRecon=Date.now();save();render();toast('Отмечено')">Сверено сегодня</button></div>
  <div class="card"><b>Курсы валют к рублю</b><div class="row2">${curr.filter(c => c !== 'RUB').map(c => `<label class="f"><span>${c}</span><input class="inp" inputmode="decimal" value="${S.rates[c]}" onchange="S.rates['${c}']=num(this.value);save();render()"></label>`).join('')}</div>
  <div class="note">Валютные счета (например, USDT) пересчитываются в рубли по этому курсу, чтобы рубли не складывались с долларами.</div></div>`;
  return h;
};
function accSet(id, v) { S.accounts.find(a => a.id === id).amount = num(v); save(); render(); }
let AE = null;
function openAcc(id) {
  const a = id ? S.accounts.find(x => x.id === id) : null; AE = a ? { ...a } : { id: null, name: '', owner: S.people[0] || '', currency: 'RUB', amount: 0 };
  openSheet(`<h3>${a ? 'Счёт' : 'Новый счёт'}</h3>
    <label class="f"><span>Название</span><input class="inp" value="${esc(AE.name)}" oninput="AE.name=this.value"></label>
    <div class="row2"><label class="f"><span>Владелец</span><select class="inp" onchange="AE.owner=this.value">${[...S.people, 'Общие'].map(p => `<option ${p === AE.owner ? 'selected' : ''}>${esc(p)}</option>`).join('')}</select></label>
    <label class="f"><span>Валюта</span><select class="inp" onchange="AE.currency=this.value">${Object.keys(S.rates).map(c => `<option ${c === AE.currency ? 'selected' : ''}>${c}</option>`).join('')}</select></label></div>
    <div class="btns"><button class="btn pri" onclick="accSave()">Сохранить</button></div>
    ${a ? `<div class="btns"><button class="btn red" onclick="if(confirm('Удалить счёт?')){S.accounts=S.accounts.filter(x=>x.id!==AE.id);save();closeSheet();render()}">Удалить</button></div>` : ''}`);
}
function accSave() { AE.name = AE.name.trim(); if (!AE.name) return toast('Введите название'); if (AE.id) S.accounts[S.accounts.findIndex(a => a.id === AE.id)] = AE; else { AE.id = uid(); S.accounts.push(AE); } save(); closeSheet(); render(); }

/* --- Долги --- */
VIEWS.debts = () => {
  const block = (dir, title) => {
    const ds = S.debts.filter(d => d.dir === dir); const open = ds.filter(d => !d.paid);
    return `<h2><span>${title}</span><span>${money(sum(open, d => +d.amount))}</span></h2>` + (ds.length ? `<div class="list">${ds.map(d => `<button class="item" onclick="openDebt('${d.id}')" style="${d.paid ? 'opacity:.45' : ''}"><div class="ic">${d.paid ? '✅' : dir === 'owe' ? '📤' : '📥'}</div><div class="mid"><div class="t">${esc(d.name)}</div><div class="s">${d.due ? 'до ' + dateLabel(d.due) : 'срок не согласован'}${d.note ? ' · ' + esc(d.note) : ''}</div></div><div class="amt ${d.due && d.due < today() && !d.paid ? 'neg' : ''}">${money(d.amount)}</div></button>`).join('')}</div>` : `<div class="note">Пусто</div>`);
  };
  return block('owe', 'Мы должны') + block('owed', 'Нам должны') + `<div class="btns"><button class="btn pri" onclick="openDebt()">+ Добавить долг</button></div>
  <div class="card note" style="margin-top:14px">💡 Созвонитесь со всеми, кому должны, и договоритесь, когда и какими частями вернёте. С теми, кто должен вам, договоритесь о конкретной дате. Лучше вообще не брать и не давать в долг.<br><br>Когда отдаёте долг, запишите расход из фонда «Погашение долгов» (или «Кредит»), а здесь отметьте долг как закрытый.</div>`;
};
let DE = null;
function openDebt(id) {
  const d = id ? S.debts.find(x => x.id === id) : null; DE = d ? { ...d } : { id: null, dir: 'owe', name: '', amount: '', due: '', note: '', paid: false };
  openSheet(`<h3>${d ? 'Долг' : 'Новый долг'}</h3>
    <div class="seg">${[['owe', 'Мы должны'], ['owed', 'Нам должны']].map(([k, n]) => `<button class="${DE.dir === k ? 'on' : ''}" onclick="DE.dir='${k}';$$('.sheet .seg button').forEach(b=>b.classList.toggle('on',b===this))">${n}</button>`).join('')}</div>
    <label class="f"><span>Кто</span><input class="inp" value="${esc(DE.name)}" oninput="DE.name=this.value"></label>
    <div class="row2"><label class="f"><span>Сумма</span><input class="inp" inputmode="decimal" value="${DE.amount}" oninput="DE.amount=this.value"></label>
    <label class="f"><span>Вернуть до</span><input type="date" class="inp" value="${DE.due}" onchange="DE.due=this.value"></label></div>
    <label class="f"><span>Договорённость</span><input class="inp" value="${esc(DE.note)}" placeholder="например: по 5000 каждый месяц" oninput="DE.note=this.value"></label>
    <label class="f" style="display:flex;gap:10px;align-items:center"><input type="checkbox" ${DE.paid ? 'checked' : ''} onchange="DE.paid=this.checked"> Закрыт</label>
    <div class="btns"><button class="btn pri" onclick="debtSave()">Сохранить</button></div>
    ${d ? `<div class="btns"><button class="btn red" onclick="if(confirm('Удалить?')){S.debts=S.debts.filter(x=>x.id!==DE.id);save();closeSheet();render()}">Удалить</button></div>` : ''}`);
}
function debtSave() { DE.name = DE.name.trim(); DE.amount = r2(num(DE.amount)); if (!DE.name || !(DE.amount > 0)) return toast('Заполните имя и сумму'); if (DE.id) S.debts[S.debts.findIndex(d => d.id === DE.id)] = DE; else { DE.id = uid(); S.debts.push(DE); } save(); closeSheet(); render(); }

/* --- Данные --- */
VIEWS.data = () => `<div class="card"><b>Резервная копия</b><div class="note">Все данные хранятся только в этом браузере на этом телефоне. Регулярно сохраняйте копию (например, в Файлы или Telegram «Избранное»). Эту копию можно открыть на другом устройстве.</div>
  <div class="btns"><button class="btn pri" onclick="exportJSON()">Сохранить копию</button><button class="btn" onclick="$('#imp').click()">Загрузить копию</button></div>
  <input type="file" id="imp" accept=".json,application/json" hidden onchange="importJSON(this.files[0])">
  <div class="note">${S.lastBackup ? 'Последняя копия: ' + new Date(S.lastBackup).toLocaleString('ru-RU') : 'Копий ещё не было'}</div></div>
  <div class="card"><b>Участники</b><div class="row2">${S.people.map((p, i) => `<label class="f"><span>Участник ${i + 1}</span><input class="inp" value="${esc(p)}" onchange="S.people[${i}]=this.value.trim()||'Участник';save()"></label>`).join('')}</div></div>
  <div class="card"><b>Выгрузка</b><div class="btns"><button class="btn" onclick="exportCSV()">Все операции в CSV</button></div></div>
  <div class="card"><b>Сброс</b><div class="note">Удалит все операции и вернёт начальные фонды. Перед этим сохраните копию.</div><div class="btns"><button class="btn red" onclick="if(confirm('Точно стереть ВСЕ данные?')&&confirm('Последнее предупреждение. Стереть?')){S=seed();save();go('home')}">Стереть всё</button></div></div>
  <div class="note" style="text-align:center">Операций: ${S.tx.length} · Фондов: ${S.funds.length} · Статей: ${S.cats.length}</div>`;
function download(name, text, type) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); }
async function exportJSON() {
  const text = JSON.stringify(S, null, 1), name = `konverty-${today()}.json`;
  try {
    const file = new File([text], name, { type: 'application/json' });
    if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: 'Копия бюджета' }); else download(name, text, 'application/json');
  } catch (e) { if (e.name === 'AbortError') return; download(name, text, 'application/json'); }
  S.lastBackup = Date.now(); save(); render(); toast('Копия сохранена');
}
function importJSON(file) {
  if (!file) return; const r = new FileReader();
  r.onload = () => { try { const d = JSON.parse(r.result); if (!Array.isArray(d.funds) || !Array.isArray(d.tx)) throw 0; if (!confirm(`Загрузить копию (${d.tx.length} операций)? Текущие данные будут заменены.`)) return; S = { ...seed(), ...d }; save(); go('home'); toast('Загружено'); } catch (e) { alert('Это не файл копии Конвертов'); } };
  r.readAsText(file);
}
function exportCSV(ym) {
  const T = { expense: 'Расход', income: 'Доход', alloc: 'Пополнение', transfer: 'Перевод' };
  const rows = [['Дата', 'Тип', 'Сумма', 'Фонд', 'В фонд', 'Статья', 'Кто', 'Заметка']];
  S.tx.filter(t => !ym || ymOf(t.date) === ym).sort((a, b) => a.date.localeCompare(b.date)).forEach(t => rows.push([t.date, T[t.type], String(t.amount).replace('.', ','), fundById(t.fundId)?.name || (t.type === 'income' ? 'Нераспределённое' : ''), fundById(t.toFundId)?.name || '', catById(t.catId)?.name || '', t.who || '', t.note || '']));
  download(`konverty-${ym || 'all'}.csv`, '﻿' + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n'), 'text/csv');
}

/* --- Помощь --- */
VIEWS.help = () => `<div class="card"><b>✉️ Принцип конвертов</b><p class="note">Каждый рубль дохода сразу получает назначение: он лежит в своём фонде (конверте). Тратить можно только из конверта, и тогда видно, сколько ещё можно потратить на еду, рестораны или одежду.</p></div>
  <div class="card"><b>1. Пришли деньги</b><p class="note">«+» → Доход. Деньги попадают в «Нераспределено».</p></div>
  <div class="card"><b>2. Распределите</b><p class="note">Вкладка «Распределить» сама разложит деньги: обязательные → личные → образ жизни по планам, остаток в цели по процентам. Фонды, упёршиеся в лимит (×1,5), пропускаются.</p></div>
  <div class="card"><b>3. Записывайте траты</b><p class="note">«+» → Расход. Выберите статью, фонд подставится сам. Если фонд уходит в минус, приложение предупредит.</p></div>
  <div class="card"><b>4. Не хватает в фонде?</b><p class="note">«+» → Перевод: переложите деньги из одного фонда в другой. Так история остаётся честной, без «подгонки» остатков.</p></div>
  <div class="card"><b>5. Раз в месяц</b><p class="note">Сверка счетов: впишите реальные остатки на картах. Отчёт: посмотрите, где превышен план. Сохраните резервную копию.</p></div>
  <div class="card"><b>📲 На домашний экран</b><p class="note">iPhone: Safari → «Поделиться» → «На экран Домой». Android: Chrome → ⋮ → «Добавить на гл. экран». Приложение работает и без интернета.</p></div>`;

/* ================= Шторка и тосты ================= */
function openSheet(html) { $('#sheetBody').innerHTML = html; $('#sheet').classList.add('on'); document.body.style.overflow = 'hidden'; }
function closeSheet() { $('#sheet').classList.remove('on'); document.body.style.overflow = ''; }
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 2000); }
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });

/* ================= Старт ================= */

{ const h = location.hash.slice(1); if (VIEWS[h]) view = h; }
render();
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
if (navigator.storage?.persist) navigator.storage.persist();
