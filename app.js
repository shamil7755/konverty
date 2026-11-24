'use strict';
/* =====================================================================
   Конверты — семейный бюджет по системе фондов
   ===================================================================== */

/* ================= Утилиты ================= */
const KEY = 'konverty-v1', KEY_REAL = 'konverty-real-backup';
const GROUPS = { mandatory: 'Обязательные', personal: 'Личные', life: 'Образ жизни', goal: 'Цели и резервы' };
const GORDER = ['mandatory', 'personal', 'life', 'goal'];
const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const MONTHS_GEN = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const MONTHS_PREP = ['январе','феврале','марте','апреле','мае','июне','июле','августе','сентябре','октябре','ноябре','декабре'];
const MSHORT = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
const WD = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const WD_FULL = ['понедельник','вторник','среда','четверг','пятница','суббота','воскресенье'];
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = v => { const n = parseFloat(String(v ?? '').replace(/\s/g, '').replace(',', '.')); return isFinite(n) ? n : 0; };
const r2 = n => Math.round(n * 100) / 100;
const sum = (a, f = x => x) => a.reduce((s, x) => s + f(x), 0);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const NF = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });
const NF0 = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
let _mf = null, _mfCur = null;
function money(n, cur) {
  const c = cur || S.currency || 'RUB';
  if (!cur && _mfCur !== c) { _mfCur = c; _mf = mkMoneyFmt(c); }
  const f = cur ? mkMoneyFmt(cur) : _mf;
  return f ? f.format(r2(n)) : NF.format(r2(n)) + ' ' + c;
}
function mkMoneyFmt(c) { try { return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: c, currencyDisplay: 'narrowSymbol', maximumFractionDigits: 2, minimumFractionDigits: 0 }); } catch (e) { return null; } }
const curSym = () => { try { return mkMoneyFmt(S.currency).formatToParts(0).find(p => p.type === 'currency').value; } catch (e) { return S.currency; } };

// Даты (строки YYYY-MM-DD, локальное время)
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const D0 = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const today = () => iso(new Date());
const addDays = (s, n) => { const d = D0(s); d.setDate(d.getDate() + n); return iso(d); };
const daysBetween = (a, b) => Math.round((D0(b) - D0(a)) / 864e5);
const ymOf = d => d.slice(0, 7);
const dim = ym => { const [y, m] = ym.split('-').map(Number); return new Date(y, m, 0).getDate(); };
const ymLabel = ym => { const [y, m] = ym.split('-'); return MONTHS[m - 1] + ' ' + y; };
const ymShift = (ym, k) => { let [y, m] = ym.split('-').map(Number); m += k; while (m < 1) { m += 12; y--; } while (m > 12) { m -= 12; y++; } return y + '-' + String(m).padStart(2, '0'); };
const dateLabel = d => { const [y, m, dd] = d.split('-'); return +dd + ' ' + MSHORT[m - 1] + (y != today().slice(0, 4) ? ' ' + y : ''); };
const weekStart = s => addDays(s, -((D0(s).getDay() + 6) % 7));
const wdOf = s => (D0(s).getDay() + 6) % 7;

/* ================= Валюты ================= */
const EXTRA_CUR = ['USDT', 'USDC', 'BTC', 'ETH', 'TON'];
let _curList = null;
function currencyList() {
  if (_curList) return _curList;
  let codes = [];
  try { codes = Intl.supportedValuesOf('currency'); } catch (e) {}
  if (!codes.length) codes = 'AED AMD AUD AZN BGN BRL BYN CAD CHF CNY CZK DKK EGP EUR GBP GEL HKD HUF IDR ILS INR JPY KGS KRW KZT MDL MXN NOK NZD PLN RON RSD RUB SAR SEK SGD THB TJS TMT TRY UAH USD UZS VND ZAR'.split(' ');
  let dn = null; try { dn = new Intl.DisplayNames(['ru'], { type: 'currency' }); } catch (e) {}
  const names = { USDT: 'Tether (USDT)', USDC: 'USD Coin', BTC: 'Биткоин', ETH: 'Эфир', TON: 'Toncoin' };
  _curList = [...new Set([...codes, ...EXTRA_CUR])].map(c => ({ c, n: names[c] || (dn ? dn.of(c) : c) }));
  const top = ['RUB', 'USD', 'EUR', 'USDT', 'TRY', 'KZT', 'AZN', 'GEL', 'AED', 'CNY', 'BYN', 'UZS', 'KGS', 'AMD', 'GBP'];
  _curList.sort((a, b) => { const ia = top.indexOf(a.c), ib = top.indexOf(b.c); if (ia >= 0 || ib >= 0) return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib); return a.n.localeCompare(b.n, 'ru'); });
  return _curList;
}
const curOptions = sel => currencyList().map(x => `<option value="${x.c}" ${x.c === sel ? 'selected' : ''}>${x.c} — ${esc(x.n)}</option>`).join('');
const RATES_MIN_DATE = '2024-03-02';
const _rateCache = {};
/** Курсы: 1 base = X других валют. date = 'latest' или YYYY-MM-DD */
async function fetchRates(base, date = 'latest') {
  const b = base.toLowerCase(), k = b + '@' + date;
  if (_rateCache[k]) return _rateCache[k];
  const urls = [`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/v1/currencies/${b}.min.json`,
    `https://${date}.currency-api.pages.dev/v1/currencies/${b}.min.json`];
  for (const u of urls) {
    try { const r = await fetch(u); if (!r.ok) continue; const j = await r.json(); if (j[b]) return (_rateCache[k] = j[b]); } catch (e) {}
  }
  throw new Error('Не удалось получить курс на ' + date);
}
async function refreshRates(silent) {
  try {
    const base = S.currency, data = await fetchRates(base);
    const need = new Set([...S.accounts.map(a => a.currency), ...Object.keys(S.rates)]);
    for (const c of need) { if (c === base) { S.rates[c] = 1; continue; } const v = data[c.toLowerCase()]; if (v) S.rates[c] = r2(1 / v * 1e6) / 1e6; }
    S.rates[base] = 1; S.ratesAt = Date.now(); save(); if (!silent) { toast('Курсы обновлены'); render(); }
  } catch (e) { if (!silent) toast('Нет интернета, курсы не обновлены'); }
}

/* ================= Данные ================= */
function seed() {
  const F = (name, group, plan = 0, o = {}) => ({ id: uid(), name, group, plan, start: 0, pct: 0, capType: 'none', cap: 0, emoji: '💰', archived: false, cushion: false, showPct: false, showToday: false, ...o });
  const funds = [
    F('Продукты', 'mandatory', 30000, { emoji: '🛒', showToday: true, showPct: true }), F('Связь', 'mandatory', 1200, { emoji: '📱', lump: true }),
    F('Транспорт', 'mandatory', 3000, { emoji: '🚌', showToday: true }), F('Аренда и ЖКУ', 'mandatory', 40000, { emoji: '🏠', lump: true }),
    F('Хоз. нужды', 'mandatory', 3000, { emoji: '🧽' }), F('Здоровье', 'mandatory', 1500, { emoji: '🩺' }),
    F('Красота', 'mandatory', 8000, { emoji: '💄' }), F('Кредит', 'mandatory', 3000, { emoji: '💳', lump: true }),
    F('Одежда Гуля', 'personal', 10000, { emoji: '👗' }), F('Личное Гуля', 'personal', 0, { emoji: '🌸' }), F('Техника Гуля', 'personal', 0, { emoji: '🎧' }),
    F('Одежда Шамиль', 'personal', 10000, { emoji: '👕' }), F('Личное Шамиль', 'personal', 0, { emoji: '🎯' }), F('Техника Шамиль', 'personal', 0, { emoji: '💻' }),
    F('Развлечения', 'life', 5000, { emoji: '🎳', capType: 'mult', cap: 1.5 }), F('Витамины', 'life', 3000, { emoji: '💊', capType: 'mult', cap: 1.5 }),
    F('Ресторан', 'life', 5000, { emoji: '🍣', capType: 'mult', cap: 1.5, showToday: true, showPct: true }), F('Подарки', 'life', 3000, { emoji: '🎁', capType: 'mult', cap: 1.5 }),
    F('Спорт', 'life', 2500, { emoji: '🏋️', lump: true }),
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
    v: 2, currency: 'RUB', funds, cats, tx: [], accounts, debts: [],
    rates: { RUB: 1, USD: 90, USDT: 90, EUR: 98 }, ratesAt: 0,
    people: ['Гуля', 'Шамиль'],
    cushion: { months: 12, infl: 1.2, mid: 0.7, danger: 0.3 },
    reminders: [], inbox: [], resolved: {},
    lastBackup: null, lastRecon: null, onboard: true, demo: false,
  };
}
function migrate(d) {
  const s = { ...seed(), ...d };
  s.currency ||= 'RUB'; s.reminders ||= []; s.inbox ||= []; s.resolved ||= {};
  s.funds.forEach(f => { f.showPct ??= false; f.showToday ??= false; f.lump ??= ['Аренда и ЖКУ', 'Связь', 'Кредит', 'Спорт'].includes(f.name); });
  s.v = 2; return s;
}
function load() {
  try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && Array.isArray(d.funds)) return migrate(d); } catch (e) {}
  return seed();
}
let S = load();
function save() { localStorage.setItem(KEY, JSON.stringify(S)); }

const fundById = id => S.funds.find(f => f.id === id);
const catById = id => S.cats.find(c => c.id === id);
const active = () => S.funds.filter(f => !f.archived);
const planFunds = () => active().filter(f => f.group !== 'goal' && f.plan > 0);
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
/** Движение за период [from..to] */
function flow(from, to) {
  const inn = {}, out = {}, exp = {}; let income = 0, expense = 0; const byCat = {};
  for (const t of S.tx) {
    if (t.date < from || t.date > to) continue; const a = +t.amount;
    if (t.type === 'expense') { out[t.fundId] = (out[t.fundId] || 0) + a; exp[t.fundId] = (exp[t.fundId] || 0) + a; expense += a; byCat[t.catId || ''] = (byCat[t.catId || ''] || 0) + a; }
    else if (t.type === 'income') { income += a; if (t.fundId) inn[t.fundId] = (inn[t.fundId] || 0) + a; }
    else if (t.type === 'alloc') inn[t.fundId] = (inn[t.fundId] || 0) + a;
    else if (t.type === 'transfer') { out[t.fundId] = (out[t.fundId] || 0) + a; inn[t.toFundId] = (inn[t.toFundId] || 0) + a; }
  }
  return { inn, out, exp, income, expense, byCat };
}
const monthRange = ym => [ym + '-01', ym + '-' + String(dim(ym)).padStart(2, '0')];
const expOf = (fid, from, to) => sum(S.tx.filter(t => t.type === 'expense' && t.fundId === fid && t.date >= from && t.date <= to), t => +t.amount);
/** План фонда на отрезок дней (месячный план делится по дням месяца) */
function planFor(f, from, to) {
  if (!f || f.group === 'goal' || !(f.plan > 0) || from > to) return 0;
  let s = 0, d = from;
  while (d <= to) { const ym = ymOf(d), last = monthRange(ym)[1], end = last < to ? last : to; s += f.plan / dim(ym) * (daysBetween(d, end) + 1); d = addDays(end, 1); }
  return s;
}

/** Сколько «должно быть потрачено» к дате until. Для разовых платежей (аренда, абонемент)
 *  оплата раньше срока не считается перерасходом: ожидание = факт, но не больше плана периода */
function planTDOf(f, from, until, to, fact) {
  const prop = planFor(f, from, until);
  if (!f.lump) return prop;
  return clamp(fact, prop, planFor(f, from, to));
}
/* ================= Статус бюджета ================= */
function budgetStatus() {
  const t = today(), ym = ymOf(t), [from] = monthRange(ym), fs = planFunds();
  const [, to] = monthRange(ym), ex = {}; fs.forEach(f => ex[f.id] = expOf(f.id, from, t));
  const td = f => planTDOf(f, from, t, to, ex[f.id]);
  const monthPlan = sum(fs, f => f.plan), planTD = sum(fs, td);
  const fact = sum(fs, f => ex[f.id]);
  const daily = monthPlan / dim(ym), diff = fact - planTD;
  // «На сколько процентов укладываемся»: 100% и выше = в графике, 80–100% = допустимо, ниже = плохо
  const score = fact > 0 ? planTD / fact * 100 : 100;
  const level = fact <= planTD ? 'ok' : score >= 80 ? 'warn' : 'bad';
  const days = daily > 0 ? diff / daily : 0;
  const over = fs.map(f => ({ f, d: ex[f.id] - td(f) })).filter(x => x.d > 1).sort((a, b) => b.d - a.d);
  return { monthPlan, planTD, fact, diff, days, score, level, over, day: +t.slice(8), dimm: dim(ym) };
}
function daysWord(n) { n = Math.abs(Math.round(n)); const a = n % 10, b = n % 100; return n + ' ' + (a === 1 && b !== 11 ? 'день' : a >= 2 && a <= 4 && (b < 10 || b >= 20) ? 'дня' : 'дней'); }

/* ================= Навигация ================= */
const ICONS = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  ops: '<path d="M4 6h16M4 12h16M4 18h10"/>',
  dist: '<path d="M12 3v6m0 0l-6 6m6-6l6 6M6 15v5m12-5v5M12 9v11"/>',
  report: '<path d="M4 20V10m6 10V4m6 16v-7m4 7H2"/>',
  more: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
};
const TABS = [['home', 'Главная'], ['ops', 'Операции'], ['dist', 'Распределить'], ['report', 'Отчёт'], ['more', 'Ещё']];
const SUB = { funds: 'Фонды', cats: 'Статьи', cushion: 'Подушка', recon: 'Сверка счетов', debts: 'Долги', settings: 'Настройки', reminders: 'Напоминания', data: 'Данные', help: 'Как пользоваться' };
let view = 'home';
const OPS = { ym: ymOf(today()), fund: '', type: '', q: '' };
const REP = { period: 'month', anchor: today(), filter: '', mode: 'chart' };
const VIEWS = {}, AFTER = {};
let D = null; // состояние распределения

function go(v) { if (v === 'dist') D = null; view = v; try { history.replaceState(null, '', v === 'home' ? location.pathname : '#' + v); } catch (e) {} render(); window.scrollTo(0, 0); }
function render() {
  const tab = SUB[view] ? 'more' : view;
  $('#tabs').innerHTML = TABS.map(([k, n]) => `<button class="${tab === k ? 'on' : ''}" onclick="go('${k}')"><svg viewBox="0 0 24 24">${ICONS[k]}</svg>${n}</button>`).join('');
  const title = SUB[view] || TABS.find(t => t[0] === view)[1];
  $('#top').innerHTML = (SUB[view] ? `<button class="back" onclick="go('more')">‹</button>` : '') + `<h1>${view === 'home' ? 'Конверты' : title}</h1>` + (S.demo ? `<span class="demo-badge" onclick="go('data')">ДЕМО</span>` : '');
  $('#fab').style.display = ['home', 'ops'].includes(view) ? '' : 'none';
  $('#app').innerHTML = VIEWS[view]();
  AFTER[view]?.();
}

/* ================= Главная ================= */
function fundCard(f, b, spent) {
  const bal = b[f.id] || 0; let bar = '', sub = '', extra = '';
  const t = today(), ym = ymOf(t), pDay = +t.slice(8) / dim(ym);
  if (f.group !== 'goal' && f.plan > 0) {
    const p = clamp(spent / f.plan * 100, 0, 100);
    const behind = f.showToday && !f.lump && spent > f.plan * pDay * 1.0001;
    bar = `<div class="bar ${f.showToday ? 'has-tick' : ''}"><i class="${spent > f.plan ? 'over' : behind ? 'warnb' : ''}" style="width:${p}%"></i>${f.showToday ? `<b class="tick" style="left:${pDay * 100}%"></b>` : ''}</div>`;
    sub = `потрачено ${NF0.format(spent)} из ${NF0.format(f.plan)}`;
    if (f.showPct) extra = `<span class="pct ${spent > f.plan ? 'neg' : behind ? 'warn' : ''}">${Math.round(spent / f.plan * 100)}%</span>`;
    if (f.showToday && !f.lump) sub += behind ? ` · <span class="warn">выше графика</span>` : ' · в графике';
  } else if (isFinite(capOf(f)) && capOf(f) > 0) {
    const p = clamp(bal / capOf(f) * 100, 0, 100);
    bar = `<div class="bar"><i style="width:${p}%"></i></div>`; sub = `цель ${NF0.format(capOf(f))}`;
    if (f.showPct) extra = `<span class="pct">${Math.round(p)}%</span>`;
  } else sub = spent ? `потрачено ${NF0.format(spent)}` : (f.pct ? `${f.pct}% от остатка` : '&nbsp;');
  return `<button class="fund" onclick="OPS.fund='${f.id}';OPS.type='';OPS.ym=ymOf(today());go('ops')"><div class="fe">${esc(f.emoji)}${extra}</div><div class="fn">${esc(f.name)}</div><div class="fb ${bal < 0 ? 'neg' : ''}">${money(bal)}</div>${bar}<div class="fs">${sub}</div></button>`;
}
function statusCard() {
  const s = budgetStatus(); if (!s.monthPlan) return '';
  const face = { ok: '😊', warn: '😐', bad: '😟' }[s.level];
  const title = { ok: 'Укладываемся в бюджет', warn: 'Чуть выше плана, но терпимо', bad: 'Не укладываемся в бюджет' }[s.level];
  let txt;
  if (s.diff <= 0) txt = `К ${s.day} числу по плану можно было потратить <b>${money(s.planTD)}</b>, потрачено <b>${money(s.fact)}</b>. Запас ${money(-s.diff)}, это примерно ${daysWord(s.days)} бюджета.`;
  else txt = `К ${s.day} числу по плану должно быть потрачено не больше <b>${money(s.planTD)}</b>, а потрачено <b>${money(s.fact)}</b>. Перерасход ${money(s.diff)}: мы опережаем график на ${daysWord(s.days)}, как будто сегодня уже ${clamp(Math.round(s.day + s.days), 1, 99)} число.`;
  const pFact = clamp(s.fact / s.monthPlan * 100, 0, 100), pToday = s.day / s.dimm * 100;
  return `<div class="status ${s.level}" onclick="REP.period='month';REP.anchor=today();REP.filter='';REP.mode='chart';go('report')">
    <div class="sface">${face}</div><div class="sbody"><b>${title}</b> <span class="sscore">${Math.round(Math.min(s.score, 999))}%</span>
    <div class="stxt">${txt}</div>
    <div class="bar has-tick" style="margin-top:8px"><i class="${s.level === 'ok' ? '' : s.level === 'warn' ? 'warnb' : 'over'}" style="width:${pFact}%"></i><b class="tick" style="left:${pToday}%"></b></div>
    <div class="slegend"><span>потрачено ${NF0.format(s.fact)} из ${NF0.format(s.monthPlan)}</span><span>● сегодня</span></div>
    ${s.over.length ? `<div class="stxt" style="margin-top:6px">Больше всего выше графика: ${s.over.slice(0, 3).map(x => esc(x.f.name) + ' +' + NF0.format(x.d)).join(', ')}</div>` : ''}
    </div></div>`;
}
/** Предложения: покрыть перерасход прошлого месяца, пересмотреть план */
function suggestions() {
  const pm = ymShift(ymOf(today()), -1), mName = MONTHS_PREP[+pm.slice(5) - 1];
  const { b } = balances();
  const over = (f, ym) => { const [x, z] = monthRange(ym); return expOf(f.id, x, z) - f.plan; };
  const rank = x => x.cushion ? 3 : x.group === 'mandatory' ? 2 : x.group === 'goal' ? 1 : 0;
  const covers = [], plans = [];
  for (const f of planFunds()) {
    const o = over(f, pm);
    if (o > 1 && !S.resolved['cover:' + pm + ':' + f.id]) covers.push({ f, o });
    const ms = [pm, ymShift(pm, -1), ymShift(pm, -2)];
    if (ms.every(m => over(f, m) > 1) && !S.resolved['plan:' + pm + ':' + f.id]) {
      const avg = sum(ms, m => over(f, m) + f.plan) / 3; plans.push({ f, avg, np: Math.ceil(avg / 500) * 500 });
    }
  }
  let h = '';
  if (covers.length) {
    const donors = f => active().filter(x => x.id !== f.id && (b[x.id] || 0) > 0).sort((x, y) => rank(x) - rank(y) || (b[y.id] || 0) - (b[x.id] || 0));
    h += `<div class="card sug"><b>Перерасход в ${mName}: ${money(sum(covers, x => x.o))}</b><div class="note">Покройте переплату из фонда, где остались деньги, чтобы новый месяц начался честно.</div>
      ${covers.map(({ f, o }) => `<div class="sugrow"><div class="sugh"><span>${esc(f.emoji + ' ' + f.name)}</span><b class="neg">+${money(o)}</b></div>
        <div class="toolbar" style="flex-wrap:nowrap;margin:4px 0 0"><select class="inp" id="don_${f.id}" style="flex:1;min-width:0;padding:9px">${donors(f).map(x => `<option value="${x.id}">из ${esc(x.emoji + ' ' + x.name)} · ${money(b[x.id])}</option>`).join('')}</select>
        <button class="btn sm pri" onclick="coverOver('${f.id}','${pm}',${r2(o)})">Покрыть</button><button class="btn sm" title="Не покрывать" onclick="S.resolved['cover:${pm}:${f.id}']=1;save();render()">✕</button></div></div>`).join('')}</div>`;
  }
  h += plans.map(({ f, avg, np }) => `<div class="card sug"><div>🔁 <b>${esc(f.name)}</b> перерасходован <b>3 месяца подряд</b>: в среднем ${money(avg)} при плане ${money(f.plan)}. Похоже, план занижен.</div>
    <div class="btns"><button class="btn sm pri" onclick="setPlan('${f.id}',${np},'${pm}')">Новый план ${money(np)}</button><button class="btn sm" onclick="S.resolved['plan:${pm}:${f.id}']=1;save();render()">Оставить</button></div></div>`).join('');
  return h;
}
function coverOver(fid, pm, amt) {
  const don = $('#don_' + fid)?.value; if (!don) return toast('Нет фондов с остатком');
  const { b } = balances(); const a = r2(Math.min(amt, b[don] || 0)); if (!(a > 0)) return toast('В этом фонде нет денег');
  S.tx.push({ id: uid(), ts: Date.now(), type: 'transfer', amount: a, date: today(), fundId: don, toFundId: fid, catId: '', note: 'Покрытие перерасхода в ' + MONTHS_PREP[+pm.slice(5) - 1], who: '' });
  S.resolved['cover:' + pm + ':' + fid] = 1; save(); render(); toast('Переведено ' + money(a));
}
function setPlan(fid, p, pm) { fundById(fid).plan = p; S.resolved['plan:' + pm + ':' + fid] = 1; save(); render(); toast('План обновлён'); }

VIEWS.home = () => {
  checkReminders(true);
  const { b, pool } = balances(); const t = today(), ym = ymOf(t), [from, to] = monthRange(ym); const fl = flow(from, to);
  const funds = active(); const total = sum(funds, f => b[f.id] || 0) + pool;
  const negs = funds.filter(f => (b[f.id] || 0) < -0.009);
  let h = `<div class="card hero"><div class="lbl">Всего во всех фондах</div><div class="big">${money(total)}</div>
    <div class="row"><div class="pill"><span>Доход · ${MONTHS[+ym.slice(5) - 1]}</span><b>${money(fl.income)}</b></div>
    <div class="pill"><span>Расходы · ${MONTHS[+ym.slice(5) - 1]}</span><b>${money(fl.expense)}</b></div></div>
    ${Math.abs(pool) > 0.009 ? `<div class="pool"><div><span style="font-size:12px;opacity:.85">Нераспределено</span><br><b>${money(pool)}</b></div>${pool > 0 ? `<button onclick="go('dist')">Распределить</button>` : ''}</div>` : ''}</div>`;
  h += statusCard();
  h += S.inbox.map(m => `<div class="alert g inbox"><div class="grow" onclick="${m.view ? `go('${m.view}')` : ''}"><b>${esc(m.title)}</b><br>${esc(m.body)}</div><button class="x" onclick="S.inbox=S.inbox.filter(x=>x.id!=='${m.id}');save();render()">✕</button></div>`).join('');
  if (S.onboard) h += `<div class="alert g"><div class="grow"><b>С чего начать.</b> Впишите текущие остатки в каждом фонде (Ещё → Фонды → «Остаток на старте»). Потом добавляйте доходы и раскладывайте их во вкладке «Распределить». Хотите сначала посмотреть, как всё работает? Включите демо-режим.</div></div>
    <div class="btns" style="margin-top:-2px"><button class="btn sm pri" onclick="go('funds')">Открыть фонды</button><button class="btn sm" onclick="demoOn()">Демо</button><button class="btn sm" onclick="S.onboard=false;save();render()">Скрыть</button></div>`;
  const days = S.lastBackup ? (Date.now() - S.lastBackup) / 864e5 : Infinity;
  if (!S.demo && S.tx.length > 5 && days > 14) h += `<div class="alert y"><div class="grow">Данные хранятся только на этом устройстве. ${S.lastBackup ? 'Последняя копия ' + Math.floor(days) + ' дн. назад.' : 'Резервной копии ещё нет.'}</div><button class="btn sm" onclick="exportJSON()">Сохранить</button></div>`;
  if (negs.length) h += `<div class="alert r"><div class="grow">В минусе: ${negs.map(f => esc(f.name) + ' ' + money(b[f.id])).join(', ')}. Переложите деньги из другого фонда.</div><button class="btn sm" onclick="openTx({type:'transfer',toFundId:'${negs[0].id}'})">Перевод</button></div>`;
  h += suggestions();
  for (const g of GORDER) {
    const fs = funds.filter(f => f.group === g); if (!fs.length) continue;
    h += `<h2><span>${GROUPS[g]}</span><span>${money(sum(fs, f => b[f.id] || 0))}</span></h2><div class="grid">${fs.map(f => fundCard(f, b, expOf(f.id, from, to))).join('')}</div>`;
  }
  return h;
};

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
function txListHTML(list) {
  let h = '', cur = '';
  for (const t of list) {
    if (t.date !== cur) {
      if (cur) h += '</div>'; cur = t.date;
      const de = sum(list.filter(x => x.date === cur && x.type === 'expense'), x => +x.amount);
      h += `<div class="day"><span>${dateLabel(cur)}, ${WD[wdOf(cur)].toLowerCase()}</span><span>${de ? '−' + money(de) : ''}</span></div><div class="list">`;
    }
    h += txLine(t);
  }
  return h + (cur ? '</div>' : '');
}
const sortTx = l => l.sort((a, b) => b.date.localeCompare(a.date) || (b.ts || 0) - (a.ts || 0));
VIEWS.ops = () => {
  const q = OPS.q.trim().toLowerCase();
  const list = sortTx(S.tx.filter(t => ymOf(t.date) === OPS.ym && (!OPS.fund || t.fundId === OPS.fund || t.toFundId === OPS.fund) && (!OPS.type || t.type === OPS.type || (OPS.type === 'income' && t.type === 'alloc'))
    && (!q || [t.note, catById(t.catId)?.name, fundById(t.fundId)?.name, String(t.amount)].join(' ').toLowerCase().includes(q))));
  const types = [['', 'Все'], ['expense', 'Расходы'], ['income', 'Доходы'], ['transfer', 'Переводы']];
  let h = `<div class="toolbar"><div class="mswitch"><button onclick="OPS.ym=ymShift(OPS.ym,-1);render()">‹</button><span>${ymLabel(OPS.ym)}</span><button onclick="OPS.ym=ymShift(OPS.ym,1);render()">›</button></div>
    <select class="inp grow" onchange="OPS.fund=this.value;render()"><option value="">Все фонды</option>${fundOptions(OPS.fund, true)}</select></div>
    <div class="chips">${types.map(([k, n]) => `<button class="chip ${OPS.type === k ? 'on' : ''}" onclick="OPS.type='${k}';render()">${n}</button>`).join('')}</div>
    <input class="inp" id="opsQ" style="margin-top:8px" type="search" placeholder="Поиск по заметке, статье, сумме" value="${esc(OPS.q)}" oninput="OPS.q=this.value;clearTimeout(window._qt);window._qt=setTimeout(opsRefresh,250)">
    <div id="opsList">${opsListHTML(list)}</div>`;
  return h;
};
function opsListHTML(list) {
  let h = '';
  if (OPS.fund) { const { b } = balances(); h += `<div class="note">Остаток фонда «${esc(fundById(OPS.fund)?.name)}»: <b>${money(b[OPS.fund] || 0)}</b></div>`; }
  if (!list.length) return h + `<div class="empty"><div class="e">🗒️</div>Операций нет.<br>Нажмите «+», чтобы добавить.</div>`;
  const exp = sum(list.filter(t => t.type === 'expense'), t => +t.amount), inc = sum(list.filter(t => t.type === 'income'), t => +t.amount);
  return h + `<div class="note">Расходы: <b>${money(exp)}</b> · Доходы: <b class="pos">${money(inc)}</b> · ${list.length} шт.</div>` + txListHTML(list);
}
// Обновляем только список, чтобы поле поиска не теряло фокус
function opsRefresh() { const st = view; if (st !== 'ops') return; const tmp = document.createElement('div'); tmp.innerHTML = VIEWS.ops(); $('#opsList').innerHTML = $('#opsList', tmp).innerHTML; }
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
  let h = `<h3>${t.id ? 'Операция' : 'Новая операция'}</h3>`;
  if (!isAlloc) h += `<div class="seg">${[['expense', 'Расход', 'e'], ['income', 'Доход', 'i'], ['transfer', 'Перевод', 't']].map(([k, n, c]) => `<button class="${c} ${t.type === k ? 'on' : ''}" onclick="txSet('type','${k}')">${n}</button>`).join('')}</div>`;
  else h += `<div class="note">Пополнение фонда из нераспределённого дохода</div>`;
  h += `<label class="f"><input id="txAmt" class="inp amount" inputmode="decimal" placeholder="0 ${esc(curSym())}" value="${t.amount}" oninput="TX.amount=this.value;txHint()"></label>`;
  if (t.orig) h += `<div class="note" style="text-align:center;margin-top:-4px">исходно ${money(t.orig.amount, t.orig.cur)} по курсу на ${dateLabel(t.date)}</div>`;
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
  if (t.id) { const old = S.tx.find(x => x.id === t.id); if (old && +old.amount !== a) delete rec.orig; S.tx[S.tx.findIndex(x => x.id === t.id)] = rec; }
  else { rec.id = uid(); rec.ts = Date.now(); S.tx.push(rec); }
  if (S.onboard && S.tx.length > 3) S.onboard = false;
  save(); closeSheet(); render(); toast(t.id ? 'Сохранено' : 'Добавлено');
}
function txDup() { TX = { ...TX, id: null, date: today() }; delete TX.orig; drawTx(); }
function txDel() { if (!confirm('Удалить операцию?')) return; S.tx = S.tx.filter(x => x.id !== TX.id); save(); closeSheet(); render(); toast('Удалено'); }

/* ================= Распределение ================= */
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
    <label class="f"><span>Сколько распределяем</span><input class="inp amount" inputmode="decimal" value="${esc(D.amount)}" placeholder="0 ${esc(curSym())}" onchange="D.amount=this.value;D.rows=planDist(num(this.value));render()"></label>
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
function distCommit(silent) {
  const { pool } = balances(); const amount = r2(num(D.amount)), total = r2(sum(D.rows, r => r.give));
  if (!(amount > 0) || !(total > 0)) return toast('Нечего распределять');
  if (total - amount > 0.009) return toast('Распределено больше суммы');
  const extra = r2(Math.max(0, total - pool));
  if (extra > 0) S.tx.push({ id: uid(), ts: Date.now(), type: 'income', amount: extra, date: D.date, fundId: '', catId: D.catId, note: 'Доход для распределения', who: '' });
  D.rows.filter(r => r.give > 0).forEach(r => S.tx.push({ id: uid(), ts: Date.now(), type: 'alloc', amount: r.give, date: D.date, fundId: r.id, catId: '', note: 'Распределение', who: '' }));
  S.onboard = false; save(); D = null; if (silent) return; toast('Распределено ' + money(total)); go('home');
}

/* ================= Отчёт ================= */
function repRange() {
  const a = REP.anchor;
  if (REP.period === 'day') return { from: a, to: a, label: dateLabel(a) + ', ' + WD_FULL[wdOf(a)] };
  if (REP.period === 'week') { const f = weekStart(a), t = addDays(f, 6); return { from: f, to: t, label: `${dateLabel(f)} – ${dateLabel(t)}` }; }
  const ym = ymOf(a), [f, t] = monthRange(ym); return { from: f, to: t, label: ymLabel(ym) };
}
function repShift(k) {
  const a = REP.anchor;
  REP.anchor = REP.period === 'day' ? addDays(a, k) : REP.period === 'week' ? addDays(a, 7 * k) : ymShift(ymOf(a), k) + '-01';
  render();
}
/** Отбор операций по фильтру отчёта */
function repFilter() {
  const [kind, id] = (REP.filter || ':').split(':');
  return {
    kind, id,
    fundOk: f => kind !== 'fund' || f.id === id,
    txOk: t => kind === 'cat' ? t.catId === id : kind === 'fund' ? (t.fundId === id || t.toFundId === id) : true,
  };
}
/** Строка «план/прогноз/факт» в виде наложенных столбцов */
function overlayBar(x, scale) {
  const w = v => clamp(v / scale * 100, 0, 100);
  const st = x.fact > x.planTD + 0.5 ? 'over' : 'okb';
  return `<div class="ov">
    ${x.plan ? `<i class="ov-plan" style="width:${w(x.plan)}%"></i>` : ''}
    ${x.forecast > x.fact ? `<i class="ov-fc ${x.plan && x.forecast > x.plan ? 'over' : ''}" style="width:${w(x.forecast)}%"></i>` : ''}
    <i class="ov-fact ${x.plan ? st : 'nop'}" style="width:${w(x.fact)}%"></i>
    ${x.plan && x.planTD < x.plan - 0.5 ? `<b class="ov-tick" style="left:${w(x.planTD)}%"></b>` : ''}</div>`;
}
function devLabel(x) {
  if (!x.plan) return '';
  const d = x.planTD - x.fact;
  return Math.abs(d) < 1 ? '<span class="dv">в графике</span>' : d > 0 ? `<span class="dv pos">отстаёт −${NF0.format(d)}</span>` : `<span class="dv neg">опережает +${NF0.format(-d)}</span>`;
}
VIEWS.report = () => {
  const { from, to, label } = repRange(), t = today(), F = repFilter();
  const isCur = from <= t && t <= to, until = to < t ? to : t, started = from <= t;
  const totalDays = daysBetween(from, to) + 1, elapsed = started ? daysBetween(from, until) + 1 : 0;
  const txs = S.tx.filter(x => x.date >= from && x.date <= to && F.txOk(x));
  const income = sum(txs.filter(x => x.type === 'income'), x => +x.amount);
  const expense = sum(txs.filter(x => x.type === 'expense' && (F.kind !== 'fund' || x.fundId === F.id)), x => +x.amount);
  // Строки по фондам
  const rows = S.funds.filter(f => F.fundOk(f) && (!f.archived || txs.some(x => x.fundId === f.id))).map(f => {
    const fact = sum(txs.filter(x => x.type === 'expense' && x.fundId === f.id), x => +x.amount);
    const plan = F.kind === 'cat' ? 0 : planFor(f, from, to);
    const planTD = started ? planTDOf(f, from, until, to, fact) : 0;
    const forecast = f.lump ? Math.max(fact, plan) : isCur && elapsed ? fact / elapsed * totalDays : fact;
    return { f, fact, plan, planTD: F.kind === 'cat' ? 0 : planTD, forecast };
  }).filter(x => x.fact > 0 || x.plan > 0);
  const P = { plan: sum(rows, x => x.plan), planTD: sum(rows, x => x.planTD), fact: sum(rows, x => x.fact) };
  P.forecast = sum(rows, x => x.forecast);
  const filterSel = `<select class="inp grow" onchange="REP.filter=this.value;render()"><option value="">Все фонды и статьи</option>
    <optgroup label="Фонд">${S.funds.filter(f => !f.archived).map(f => `<option value="fund:${f.id}" ${REP.filter === 'fund:' + f.id ? 'selected' : ''}>${esc(f.emoji + ' ' + f.name)}</option>`).join('')}</optgroup>
    <optgroup label="Статья">${S.cats.map(c => `<option value="cat:${c.id}" ${REP.filter === 'cat:' + c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</optgroup></select>`;
  let h = `<div class="seg">${[['day', 'День'], ['week', 'Неделя'], ['month', 'Месяц']].map(([k, n]) => `<button class="${REP.period === k ? 'on' : ''}" onclick="REP.period='${k}';render()">${n}</button>`).join('')}</div>
    <div class="toolbar" style="margin-top:8px"><div class="mswitch wide"><button onclick="repShift(-1)">‹</button><span>${label}</span><button onclick="repShift(1)">›</button></div>
    ${!isCur ? `<button class="btn sm" onclick="REP.anchor=today();render()">Сегодня</button>` : ''}</div>
    <div class="toolbar">${filterSel}<div class="seg mini">${[['chart', '📊'], ['table', '📋']].map(([k, n]) => `<button class="${REP.mode === k ? 'on' : ''}" onclick="REP.mode='${k}';render()">${n}</button>`).join('')}</div></div>`;
  const dev = P.planTD - P.fact;
  h += `<div class="kpi"><div><span>Расходы</span><b>${money(expense)}</b></div>
    ${P.plan ? `<div><span>План ${isCur ? 'на сегодня' : 'за период'}</span><b>${money(isCur ? P.planTD : P.plan)}</b></div>
    <div><span>${dev >= 0 ? 'Экономия' : 'Перерасход'}</span><b class="${dev >= 0 ? 'pos' : 'neg'}">${money(Math.abs(dev))}</b></div>`
    : `<div><span>Доходы</span><b class="pos">${money(income)}</b></div><div><span>Операций</span><b>${txs.length}</b></div>`}</div>`;
  if (P.plan && isCur && REP.period !== 'day') h += `<div class="note">Прогноз к концу периода при текущем темпе: <b class="${P.forecast > P.plan ? 'neg' : 'pos'}">${money(P.forecast)}</b> при плане ${money(P.plan)}.</div>`;

  if (REP.mode === 'chart') {
    // Динамика по дням
    if (REP.period !== 'day') {
      const days = []; for (let d = from; d <= to; d = addDays(d, 1)) days.push(d);
      const ex = d => sum(txs.filter(x => x.type === 'expense' && x.date === d && (F.kind !== 'fund' || x.fundId === F.id) && (F.kind || !fundById(x.fundId)?.lump)), x => +x.amount);
      const pl = d => F.kind === 'cat' ? 0 : sum(rows.filter(x => !x.f.lump), x => planFor(x.f, d, d));
      const data = days.map(d => ({ d, e: ex(d), p: pl(d) }));
      const mx = Math.max(1, ...data.map(x => Math.max(x.e, x.p)));
      let cum = 0, cumP = 0;
      h += `<div class="card"><b>По дням</b><div class="cols ${days.length > 10 ? 'dense' : ''}">${data.map(x => `<div class="c ${x.d === t ? 'cur' : ''} ${x.d > t ? 'fut' : ''}" onclick="REP.period='day';REP.anchor='${x.d}';render()"><div>${x.p ? `<i class="pl" style="height:${x.p / mx * 100}%"></i>` : ''}<i class="out ${x.p && x.e > x.p ? 'hi' : ''}" style="height:${x.e / mx * 100}%"></i></div><span>${REP.period === 'week' ? WD[wdOf(x.d)] : (+x.d.slice(8) % 5 === 1 || days.length <= 10 ? +x.d.slice(8) : '')}</span></div>`).join('')}</div>
        <div class="legend"><span><i style="background:var(--acc2)"></i>факт</span>${P.plan ? '<span><i class="lg-plan"></i>план на день (без разовых)</span><span><i style="background:var(--red)"></i>выше плана</span>' : ''}</div></div>`;
      // Накопительно
      if (P.plan) {
        
        const lumpFc = sum(rows.filter(x => !x.f.lump), x => x.forecast);
        const pts = data.map(x => { cum += x.e; cumP += x.p; return { d: x.d, c: cum, p: cumP }; });
        const m2 = Math.max(1, ...pts.map(x => Math.max(x.c, x.p)), lumpFc);
        const W = 300, H = 120, X = i => i / Math.max(1, pts.length - 1) * W, Y = v => H - v / m2 * H;
        const lastI = pts.findIndex(x => x.d >= until), li = lastI < 0 ? pts.length - 1 : lastI;
        const factPts = started ? pts.slice(0, li + 1) : [];
        h += `<div class="card"><b>Накопительно: план и факт</b><div class="note">Без разовых платежей (аренда, связь и т.п.)</div><svg class="line" viewBox="-4 -6 ${W + 8} ${H + 12}" preserveAspectRatio="none">
          <polyline class="lp" points="${pts.map((x, i) => X(i) + ',' + Y(x.p)).join(' ')}"/>
          ${factPts.length ? `<polyline class="lf ${factPts[factPts.length - 1].c > factPts[factPts.length - 1].p ? 'bad' : ''}" points="${factPts.map((x, i) => X(i) + ',' + Y(x.c)).join(' ')}"/>` : ''}
          ${isCur && factPts.length ? `<line class="lfc" x1="${X(li)}" y1="${Y(factPts[li].c)}" x2="${X(pts.length - 1)}" y2="${Y(lumpFc)}"/>` : ''}</svg>
          <div class="legend"><span><i class="lg-plan"></i>план</span><span><i style="background:var(--acc2)"></i>факт</span>${isCur ? '<span><i class="lg-fc"></i>прогноз</span>' : ''}</div></div>`;
      }
    }
    // План/факт по фондам
    if (rows.length) {
      const sorted = [...rows].sort((a, b) => (b.fact - b.planTD) - (a.fact - a.planTD));
      const scale = Math.max(1, ...rows.map(x => Math.max(x.plan, x.fact, x.forecast)));
      h += `<div class="card"><b>${F.kind === 'cat' ? 'Из каких фондов' : 'Фонды: кто отстаёт, кто опережает'}</b>
        ${F.kind !== 'cat' ? `<div class="note">Светлая полоса показывает план на период, яркая — факт, штриховка — прогноз до конца периода, черта — где по плану надо быть сегодня. «Опережает» значит, что тратим быстрее плана.</div>` : ''}
        ${sorted.map(x => `<div class="ovrow" onclick="REP.filter='fund:${x.f.id}';render()"><div class="ovh"><span>${esc(x.f.emoji + ' ' + x.f.name)}</span><span><b>${NF0.format(x.fact)}</b>${x.plan ? ' / ' + NF0.format(x.plan) : ''} ${devLabel(x)}</span></div>${overlayBar(x, scale)}</div>`).join('')}
        ${F.kind === 'fund' ? `<button class="linkbtn" onclick="REP.filter='';render()">← все фонды</button>` : ''}</div>`;
    } else h += `<div class="empty"><div class="e">📭</div>За этот период трат нет</div>`;
    // По статьям
    const byCat = {}; txs.filter(x => x.type === 'expense').forEach(x => byCat[x.catId || ''] = (byCat[x.catId || ''] || 0) + +x.amount);
    const cs = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    if (cs.length > 1 || (cs.length && F.kind !== 'cat')) {
      const m = cs[0][1];
      h += `<div class="card"><b>По статьям</b>${cs.map(([id, v]) => `<div class="hbar" onclick="${id ? `REP.filter='cat:${id}';render()` : ''}"><div class="n">${esc(catById(id)?.name || 'Без статьи')}</div><div class="b"><i style="width:${v / m * 100}%"></i></div><div class="v">${NF0.format(v)}</div></div>`).join('')}</div>`;
    }
    if (REP.period === 'month' && !F.kind) h += yearChart(ymOf(from));
  } else {
    // Таблица
    if (rows.length) h += `<div class="card"><b>План и факт</b><div class="scroll"><table class="t"><tr><th>Фонд</th><th>План</th>${isCur ? '<th>На сегодня</th>' : ''}<th>Факт</th><th>Откл.</th><th>%</th></tr>
      ${rows.map(x => { const d = x.planTD - x.fact; return `<tr><td>${esc(x.f.emoji + ' ' + x.f.name)}</td><td>${x.plan ? NF0.format(x.plan) : '—'}</td>${isCur ? `<td>${x.plan ? NF0.format(x.planTD) : '—'}</td>` : ''}<td><b>${NF0.format(x.fact)}</b></td><td class="${x.plan ? (d >= 0 ? 'pos' : 'neg') : ''}">${x.plan ? (d >= 0 ? '+' : '−') + NF0.format(Math.abs(d)) : ''}</td><td>${x.plan ? Math.round(x.fact / x.plan * 100) + '%' : ''}</td></tr>`; }).join('')}
      <tr class="tot"><td>Итого</td><td>${NF0.format(P.plan)}</td>${isCur ? `<td>${NF0.format(P.planTD)}</td>` : ''}<td>${NF0.format(P.fact)}</td><td class="${dev >= 0 ? 'pos' : 'neg'}">${(dev >= 0 ? '+' : '−') + NF0.format(Math.abs(dev))}</td><td>${P.plan ? Math.round(P.fact / P.plan * 100) + '%' : ''}</td></tr></table></div></div>`;
    if (REP.period === 'month' && !F.kind) {
      const st = balances(x => x.date < from).b, en = balances(x => x.date <= to).b, fl = flow(from, to);
      const fs = S.funds.filter(f => !f.archived || st[f.id] || en[f.id]);
      h += `<div class="card"><b>Остатки по фондам</b><div class="scroll"><table class="t"><tr><th>Фонд</th><th>Начало</th><th>Приход</th><th>Расход</th><th>Конец</th></tr>
        ${GORDER.map(g => fs.filter(f => f.group === g).map(f => `<tr><td>${esc(f.emoji + ' ' + f.name)}</td><td>${NF0.format(st[f.id] || 0)}</td><td class="pos">${fl.inn[f.id] ? NF0.format(fl.inn[f.id]) : ''}</td><td>${fl.out[f.id] ? NF0.format(fl.out[f.id]) : ''}</td><td class="${(en[f.id] || 0) < 0 ? 'neg' : ''}"><b>${NF0.format(en[f.id] || 0)}</b></td></tr>`).join('')).join('')}
        <tr class="tot"><td>Итого</td><td>${NF0.format(sum(fs, f => st[f.id] || 0))}</td><td></td><td></td><td>${NF0.format(sum(fs, f => en[f.id] || 0))}</td></tr></table></div></div>`;
    }
    h += `<h2>Операции</h2>` + (txs.length ? txListHTML(sortTx([...txs])) : '<div class="note">Нет операций</div>');
  }
  h += `<button class="btn" style="margin-top:12px" onclick="exportCSV('${from}','${to}')">Выгрузить период в CSV (Excel)</button>`;
  return h;
};
function yearChart(ym) {
  const y = ym.slice(0, 4); const ms = Array.from({ length: 12 }, (_, i) => `${y}-${String(i + 1).padStart(2, '0')}`).map(m => { const [a, z] = monthRange(m); return { m, ...flow(a, z), plan: sum(planFunds(), f => f.plan) }; });
  const mx = Math.max(1, ...ms.map(m => Math.max(m.income, m.expense, m.plan)));
  return `<div class="card"><b>${y} год</b><div class="cols">${ms.map((m, i) => `<div class="c ${m.m === ym ? 'cur' : ''}" onclick="REP.anchor='${m.m}-01';render()"><div><i class="in" style="height:${m.income / mx * 100}%"></i><span class="stack"><i class="pl" style="height:${m.plan / mx * 100}%"></i><i class="out ${m.expense > m.plan ? 'hi' : ''}" style="height:${m.expense / mx * 100}%"></i></span></div><span>${MSHORT[i]}</span></div>`).join('')}</div>
    <div class="legend"><span><i style="background:var(--acc)"></i>доходы</span><span><i style="background:var(--acc2)"></i>расходы</span><span><i class="lg-plan"></i>план</span></div></div>`;
}

/* ================= Ещё ================= */
VIEWS.more = () => {
  const { b } = balances(); const cf = active().filter(f => f.cushion);
  const items = [
    ['funds', '🗂️', 'Фонды', `${active().length} фондов · планы, лимиты, проценты`],
    ['cats', '🏷️', 'Статьи', `${S.cats.length} статей · привязка к фондам`],
    ['cushion', '🛟', 'Подушка безопасности', money(sum(cf, f => b[f.id] || 0))],
    ['recon', '🏦', 'Сверка со счетами', S.lastRecon ? 'последняя ' + new Date(S.lastRecon).toLocaleDateString('ru-RU') : 'ещё не делали'],
    ['debts', '🤝', 'Долги', `${S.debts.filter(d => !d.paid).length} открытых`],
    ['reminders', '🔔', 'Напоминания и отчёты', `${S.reminders.filter(r => r.on).length} включено`],
    ['settings', '⚙️', 'Настройки', `валюта ${S.currency} · вид карточек · участники`],
    ['data', '💾', 'Данные и демо', S.demo ? 'сейчас включён демо-режим' : 'копия, импорт, CSV, демо'],
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
  const mand = sum(planFunds(), f => +f.plan || 0);
  h += `<div class="card">Все планы в месяц: <b>${money(mand)}</b><div class="note">Если доход больше, разница уйдёт в цели по процентам.</div></div>
    <button class="btn pri" onclick="openFund()">+ Новый фонд</button>`;
  return h;
};
let FE = null;
function openFund(id) {
  const f = id ? fundById(id) : null;
  FE = f ? { ...f } : { id: null, name: '', group: 'life', plan: 0, start: 0, pct: 0, capType: 'none', cap: 0, emoji: '💰', archived: false, cushion: false, showPct: false, showToday: false, lump: false };
  const e = FE;
  openSheet(`<h3>${f ? 'Фонд' : 'Новый фонд'}</h3>
    <div class="row2" style="grid-template-columns:70px 1fr"><label class="f"><span>Значок</span><input class="inp" style="text-align:center;font-size:22px;padding:8px" value="${esc(e.emoji)}" oninput="FE.emoji=this.value"></label>
    <label class="f"><span>Название</span><input class="inp" value="${esc(e.name)}" oninput="FE.name=this.value"></label></div>
    <label class="f"><span>Группа</span><select class="inp" onchange="FE.group=this.value;openFundRe()">${GORDER.map(g => `<option value="${g}" ${g === e.group ? 'selected' : ''}>${GROUPS[g]}</option>`).join('')}</select></label>
    <div id="fundDyn"></div>
    <label class="f"><span>Остаток на старте (сколько денег уже лежит в фонде до первой операции)</span><input class="inp" inputmode="decimal" value="${e.start}" oninput="FE.start=num(this.value)"></label>
    <label class="sw"><input type="checkbox" ${e.lump ? 'checked' : ''} onchange="FE.lump=this.checked"><span></span>Оплачивается разом раз в месяц (аренда, абонемент, кредит)</label>
    <div class="h3s">Карточка на главной</div>
    <label class="sw"><input type="checkbox" ${e.showPct ? 'checked' : ''} onchange="FE.showPct=this.checked"><span></span>Показывать % потраченного</label>
    <label class="sw"><input type="checkbox" ${e.showToday ? 'checked' : ''} onchange="FE.showToday=this.checked"><span></span>Отмечать на шкале сегодняшнюю дату</label>
    <div class="h3s">Прочее</div>
    <label class="sw"><input type="checkbox" ${e.cushion ? 'checked' : ''} onchange="FE.cushion=this.checked"><span></span>Это подушка безопасности</label>
    <label class="sw"><input type="checkbox" ${e.archived ? 'checked' : ''} onchange="FE.archived=this.checked"><span></span>В архиве (скрыт, история сохраняется)</label>
    <div class="btns"><button class="btn pri" onclick="fundSave()">Сохранить</button></div>
    ${f ? `<div class="btns"><button class="btn red" onclick="fundDel()">Удалить фонд</button></div>` : ''}`);
  openFundRe();
}
function openFundRe() {
  const e = FE;
  $('#fundDyn').innerHTML = (e.group === 'goal'
    ? `<label class="f"><span>Процент от остатка после планов</span><input class="inp" inputmode="decimal" value="${e.pct}" oninput="FE.pct=num(this.value)"></label>`
    : `<label class="f"><span>План в месяц, ${esc(curSym())}</span><input class="inp" inputmode="decimal" value="${e.plan}" oninput="FE.plan=num(this.value)"></label>`)
    + `<div class="row2"><label class="f"><span>Лимит фонда</span><select class="inp" onchange="FE.capType=this.value;if(this.value==='mult'&&!FE.cap)FE.cap=1.5;openFundRe()">
      <option value="none" ${e.capType === 'none' ? 'selected' : ''}>Без лимита</option><option value="mult" ${e.capType === 'mult' ? 'selected' : ''}>× от плана</option><option value="fixed" ${e.capType === 'fixed' ? 'selected' : ''}>Сумма</option></select></label>
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
const rateOf = c => c === S.currency ? 1 : +S.rates[c] || 0;
VIEWS.recon = () => {
  const { b, pool } = balances();
  const inFunds = r2(sum(S.funds, f => b[f.id] || 0) + pool);
  const onAcc = r2(sum(S.accounts, a => num(a.amount) * rateOf(a.currency)));
  const diff = r2(onAcc - inFunds);
  const noRate = [...new Set(S.accounts.filter(a => !rateOf(a.currency)).map(a => a.currency))];
  let h = `<div class="note">Раз в месяц впишите, сколько реально лежит на каждом счёте. Сумма должна совпасть с суммой всех фондов. Если не совпадает, значит какая-то трата не записана или записана дважды.</div>
  <div class="kpi"><div><span>На счетах</span><b>${money(onAcc)}</b></div><div><span>В фондах</span><b>${money(inFunds)}</b></div><div><span>Разница</span><b class="${Math.abs(diff) < 1 ? 'pos' : 'neg'}">${money(diff)}</b></div></div>
  ${noRate.length ? `<div class="alert y">Нет курса для ${noRate.join(', ')}. Нажмите «Обновить курсы».</div>` : ''}
  ${Math.abs(diff) < 1 ? '<div class="alert g">Всё сходится 👌</div>' : `<div class="alert ${diff > 0 ? 'y' : 'r'}">${diff > 0 ? 'На счетах больше, чем в фондах: возможно, не записан доход.' : 'В фондах больше, чем на счетах: возможно, не записан расход.'}</div>`}`;
  for (const p of [...new Set(S.accounts.map(a => a.owner))]) {
    const as = S.accounts.filter(a => a.owner === p);
    h += `<h2><span>${esc(p || 'Общие')}</span><span>${money(sum(as, a => num(a.amount) * rateOf(a.currency)))}</span></h2><div class="list">${as.map(a => `<div class="distrow"><div class="n">${esc(a.name)}<small>${a.currency}${a.currency !== S.currency ? ' · ' + money(num(a.amount) * rateOf(a.currency)) : ''}</small></div><input class="inp" inputmode="decimal" value="${a.amount}" onchange="accSet('${a.id}',this.value)"><button class="btn sm" onclick="openAcc('${a.id}')">✎</button></div>`).join('')}</div>`;
  }
  const curs = [...new Set(S.accounts.map(a => a.currency))].filter(c => c !== S.currency);
  h += `<div class="btns"><button class="btn" onclick="openAcc()">+ Счёт</button><button class="btn pri" onclick="S.lastRecon=Date.now();save();render();toast('Отмечено')">Сверено сегодня</button></div>
  ${curs.length ? `<div class="card"><b>Курсы к ${S.currency}</b><div class="row2">${curs.map(c => `<label class="f"><span>1 ${c} =</span><input class="inp" inputmode="decimal" value="${S.rates[c] || ''}" onchange="S.rates['${c}']=num(this.value);save();render()"></label>`).join('')}</div>
  <div class="btns"><button class="btn" onclick="refreshRates()">Обновить курсы из интернета</button></div>
  <div class="note">${S.ratesAt ? 'Обновлено ' + new Date(S.ratesAt).toLocaleString('ru-RU') + '. ' : ''}Валютные счета пересчитываются в ${S.currency}, чтобы разные валюты не складывались между собой.</div></div>` : ''}`;
  return h;
};
function accSet(id, v) { S.accounts.find(a => a.id === id).amount = num(v); save(); render(); }
let AE = null;
function openAcc(id) {
  const a = id ? S.accounts.find(x => x.id === id) : null; AE = a ? { ...a } : { id: null, name: '', owner: S.people[0] || '', currency: S.currency, amount: 0 };
  openSheet(`<h3>${a ? 'Счёт' : 'Новый счёт'}</h3>
    <label class="f"><span>Название</span><input class="inp" value="${esc(AE.name)}" oninput="AE.name=this.value"></label>
    <label class="f"><span>Владелец</span><select class="inp" onchange="AE.owner=this.value">${[...S.people, 'Общие'].map(p => `<option ${p === AE.owner ? 'selected' : ''}>${esc(p)}</option>`).join('')}</select></label>
    <label class="f"><span>Валюта</span><select class="inp" onchange="AE.currency=this.value">${curOptions(AE.currency)}</select></label>
    <div class="btns"><button class="btn pri" onclick="accSave()">Сохранить</button></div>
    ${a ? `<div class="btns"><button class="btn red" onclick="if(confirm('Удалить счёт?')){S.accounts=S.accounts.filter(x=>x.id!==AE.id);save();closeSheet();render()}">Удалить</button></div>` : ''}`);
}
function accSave() {
  AE.name = AE.name.trim(); if (!AE.name) return toast('Введите название');
  if (AE.id) S.accounts[S.accounts.findIndex(a => a.id === AE.id)] = AE; else { AE.id = uid(); S.accounts.push(AE); }
  save(); closeSheet(); render(); if (!rateOf(AE.currency)) refreshRates();
}

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
    <label class="sw"><input type="checkbox" ${DE.paid ? 'checked' : ''} onchange="DE.paid=this.checked"><span></span>Закрыт</label>
    <div class="btns"><button class="btn pri" onclick="debtSave()">Сохранить</button></div>
    ${d ? `<div class="btns"><button class="btn red" onclick="if(confirm('Удалить?')){S.debts=S.debts.filter(x=>x.id!==DE.id);save();closeSheet();render()}">Удалить</button></div>` : ''}`);
}
function debtSave() { DE.name = DE.name.trim(); DE.amount = r2(num(DE.amount)); if (!DE.name || !(DE.amount > 0)) return toast('Заполните имя и сумму'); if (DE.id) S.debts[S.debts.findIndex(d => d.id === DE.id)] = DE; else { DE.id = uid(); S.debts.push(DE); } save(); closeSheet(); render(); }

/* --- Настройки --- */
VIEWS.settings = () => {
  const pf = active().filter(f => f.group !== 'goal' || isFinite(capOf(f)));
  return `<div class="card"><b>Валюта приложения</b><div class="note">Все суммы, планы и отчёты ведутся в этой валюте.</div>
    <select class="inp" onchange="currencyChange(this.value);this.value='${S.currency}'">${curOptions(S.currency)}</select></div>
  <div class="card"><b>Карточки фондов на главной</b><div class="note"><b>%</b> показывает процент потраченного от плана. <b>Сегодня</b> ставит на шкале точку текущей даты: если полоса заходит за точку, траты идут быстрее графика.</div>
    <div class="tgl-head"><span></span><span>%</span><span>Сегодня</span></div>
    ${pf.map(f => `<div class="tgl"><span>${esc(f.emoji + ' ' + f.name)}</span>
      <label class="sw nolabel"><input type="checkbox" ${f.showPct ? 'checked' : ''} onchange="fundById('${f.id}').showPct=this.checked;save()"><span></span></label>
      ${f.group !== 'goal' ? `<label class="sw nolabel"><input type="checkbox" ${f.showToday ? 'checked' : ''} onchange="fundById('${f.id}').showToday=this.checked;save()"><span></span></label>` : '<span></span>'}</div>`).join('')}
    <div class="btns"><button class="btn sm" onclick="pf_all(true)">Включить всё</button><button class="btn sm" onclick="pf_all(false)">Выключить всё</button></div></div>
  <div class="card"><b>Участники</b><div class="row2">${S.people.map((p, i) => `<label class="f"><span>Участник ${i + 1}</span><input class="inp" value="${esc(p)}" onchange="S.people[${i}]=this.value.trim()||'Участник';save()"></label>`).join('')}</div></div>`;
};
function pf_all(v) { active().forEach(f => { f.showPct = v; if (f.group !== 'goal') f.showToday = v; }); save(); render(); }

/* --- Смена валюты с пересчётом истории --- */
function currencyChange(n) {
  const o = S.currency; if (n === o) return;
  const hasData = S.tx.length || S.funds.some(f => f.start || f.plan) || S.debts.length;
  if (!hasData) { S.currency = n; save(); refreshRates(true).then(render); render(); return; }
  const dates = [...new Set(S.tx.map(t => t.date))];
  openSheet(`<h3>Сменить валюту ${o} → ${n}</h3>
    <div class="note">Все суммы сейчас записаны в ${o}. Что с ними сделать?</div>
    <button class="btn pri" style="margin-top:8px" onclick="convertAll('${o}','${n}','hist')">Пересчитать историю по курсу на дату каждой операции</button>
    <div class="note">Загрузит курсы за ${dates.length} дат (нужен интернет). Курсы есть с 2 марта 2024 года, для более ранних операций возьмётся курс на эту дату. Планы, лимиты и остатки на старте пересчитаются по сегодняшнему курсу.</div>
    <button class="btn" style="margin-top:8px" onclick="convertAll('${o}','${n}','now')">Пересчитать всё по сегодняшнему курсу</button>
    <button class="btn" style="margin-top:8px" onclick="convertAll('${o}','${n}','none')">Только сменить значок валюты (суммы не трогать)</button>
    <div class="note">Перед пересчётом автоматически сохраняется резервная копия на этом устройстве. Её можно восстановить в разделе «Данные».</div>
    <div id="convProg"></div>`);
}
async function convertAll(o, n, mode) {
  const prog = $('#convProg'), setP = s => prog && (prog.innerHTML = `<div class="alert g">${s}</div>`);
  $$('.sheet .btn').forEach(b => b.disabled = true);
  localStorage.setItem('konverty-before-currency', JSON.stringify(S));
  try {
    if (mode !== 'none') {
      setP('Загружаю текущий курс…');
      const now = await fetchRates(o), kNow = now[n.toLowerCase()];
      if (!kNow) throw new Error('Нет курса ' + o + '→' + n);
      const rateAt = {};
      if (mode === 'hist') {
        const t = today(), dates = [...new Set(S.tx.map(x => x.date < RATES_MIN_DATE ? RATES_MIN_DATE : x.date > t ? t : x.date))];
        let done = 0; const queue = [...dates];
        const worker = async () => { while (queue.length) { const d = queue.shift(); let r; try { r = await fetchRates(o, d); } catch (e) { r = d === t ? now : null; } if (!r || !r[n.toLowerCase()]) throw new Error('Нет курса на ' + d); rateAt[d] = r[n.toLowerCase()]; done++; setP(`Загружаю курсы: ${done} из ${dates.length}…`); } };
        await Promise.all([worker(), worker(), worker(), worker()]);
        const t2 = today();
        S.tx.forEach(x => { const d = x.date < RATES_MIN_DATE ? RATES_MIN_DATE : x.date > t2 ? t2 : x.date; x.orig ||= { amount: x.amount, cur: o }; x.amount = r2(x.amount * rateAt[d]); });
      } else S.tx.forEach(x => { x.orig ||= { amount: x.amount, cur: o }; x.amount = r2(x.amount * kNow); });
      S.funds.forEach(f => { f.plan = r2(f.plan * kNow); f.start = r2(f.start * kNow); if (f.capType === 'fixed') f.cap = r2(f.cap * kNow); });
      S.debts.forEach(d => d.amount = r2(d.amount * kNow));
    }
    S.currency = n; S.rates = { [n]: 1 }; save();
    await refreshRates(true);
    closeSheet(); render(); toast('Валюта: ' + n);
  } catch (e) {
    S = load(); setP('⚠️ ' + esc(e.message) + '. Ничего не изменено, проверьте интернет.'); $$('.sheet .btn').forEach(b => b.disabled = false);
  }
}

/* --- Напоминания --- */
const R_TYPES = {
  log: ['✍️ Записать траты', 'Короткое напоминание внести расходы за день', 'ops'],
  status: ['📊 Статус бюджета', 'Укладываемся ли в бюджет на сегодня', 'home'],
  week: ['🗓️ Отчёт за неделю', 'Траты за прошедшую неделю против плана', 'report'],
  month: ['📅 Итоги месяца', 'Доход, расход и перерасходы прошлого месяца', 'report'],
  dist: ['💸 Распределить доход', 'Есть нераспределённые деньги', 'dist'],
  recon: ['🏦 Сверка счетов', 'Сверить фонды с реальными остатками', 'recon'],
  backup: ['💾 Резервная копия', 'Сохранить копию данных', 'data'],
  debts: ['🤝 Долги', 'Сроки по долгам', 'debts'],
};
function reminderMsg(type) {
  const t = today();
  if (type === 'log') { const n = S.tx.filter(x => x.date === t && x.type === 'expense').length; return n ? `Сегодня записано трат: ${n}. Ничего не забыли?` : 'Сегодня ещё нет записанных трат. Внесите их, пока помните.'; }
  if (type === 'status') { const s = budgetStatus(); return `${{ ok: '😊', warn: '😐', bad: '😟' }[s.level]} План на сегодня ${money(s.planTD)}, потрачено ${money(s.fact)}. ${s.diff <= 0 ? 'Запас ' + money(-s.diff) : 'Перерасход ' + money(s.diff) + ' (' + daysWord(s.days) + ')'}.`; }
  if (type === 'week') { const from = addDays(t, -7), to = addDays(t, -1); const fs = planFunds(); const fact = sum(fs, f => expOf(f.id, from, to)), plan = sum(fs, f => planFor(f, from, to)); return `За 7 дней потрачено ${money(fact)} при плане ${money(plan)}. ${fact <= plan ? 'Отлично, в рамках 👍' : 'Перерасход ' + money(fact - plan)}.`; }
  if (type === 'month') { const pm = ymShift(ymOf(t), -1), [a, z] = monthRange(pm), fl = flow(a, z); const ov = planFunds().filter(f => expOf(f.id, a, z) > f.plan).map(f => f.name); return `${ymLabel(pm)}: доход ${money(fl.income)}, расход ${money(fl.expense)}.${ov.length ? ' Перерасход: ' + ov.join(', ') + '.' : ' Все фонды в плане.'}`; }
  if (type === 'dist') { const { pool } = balances(); return pool > 0 ? `Нераспределено ${money(pool)}. Разложите по фондам.` : 'Нераспределённых денег нет 👍'; }
  if (type === 'recon') return 'Впишите реальные остатки на счетах и проверьте, всё ли сходится.';
  if (type === 'backup') return 'Сохраните резервную копию, чтобы не потерять данные.';
  if (type === 'debts') { const od = S.debts.filter(d => !d.paid && d.due && d.due <= addDays(t, 7)); return od.length ? 'Скоро срок: ' + od.map(d => d.name + ' ' + money(d.amount)).join(', ') : 'Ближайших сроков по долгам нет.'; }
  return '';
}
function lastOccurrence(r, now = new Date()) {
  const [hh, mm] = (r.time || '20:00').split(':').map(Number);
  const d = new Date(now); d.setHours(hh, mm, 0, 0);
  for (let i = 0; i < 70; i++) {
    const ok = r.freq === 'daily' || (r.freq === 'weekly' && (d.getDay() + 6) % 7 === +r.dow) || (r.freq === 'monthly' && d.getDate() === Math.min(+r.dom, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
    if (ok && d <= now) return d.getTime();
    d.setDate(d.getDate() - 1);
  }
  return 0;
}
function fireReminder(r, test) {
  const [title, , v] = R_TYPES[r.type], body = reminderMsg(r.type);
  S.inbox = [{ id: uid(), title, body, view: v, ts: Date.now() }, ...S.inbox.filter(m => m.title !== title)].slice(0, 6);
  if (!test) r.last = Date.now();
  save();
  if ('Notification' in window && Notification.permission === 'granted') {
    navigator.serviceWorker?.getRegistration().then(reg => reg ? reg.showNotification(title, { body, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: r.id, data: { view: v } }) : new Notification(title, { body })).catch(() => {});
  }
}
function checkReminders(noRender) {
  let fired = false;
  for (const r of S.reminders) {
    if (!r.on || !R_TYPES[r.type]) continue;
    const occ = lastOccurrence(r);
    if (occ && occ > Math.max(r.last || 0, r.created || 0)) { fireReminder(r); fired = true; }
  }
  if (fired && !noRender && view === 'home') render();
}
const freqLabel = r => r.freq === 'daily' ? 'каждый день' : r.freq === 'weekly' ? 'каждую неделю, ' + WD_FULL[r.dow] : `каждый месяц, ${r.dom} числа`;
VIEWS.reminders = () => {
  const perm = 'Notification' in window ? Notification.permission : 'unsupported';
  return `<div class="note">Напоминания и отчёты приходят по расписанию: появляются карточкой на главной и (если разрешить) системным уведомлением. Пропущенные напоминания покажутся при следующем открытии приложения.</div>
  ${perm === 'default' ? `<div class="alert y"><div class="grow">Уведомления не разрешены.</div><button class="btn sm" onclick="askNotif()">Разрешить</button></div>`
    : perm === 'denied' ? `<div class="alert r">Уведомления запрещены в настройках браузера/телефона. Напоминания будут только внутри приложения.</div>`
    : perm === 'unsupported' ? `<div class="alert y">Этот браузер не поддерживает уведомления. На iPhone добавьте приложение на экран «Домой» (iOS 16.4+), затем разрешите уведомления.</div>` : ''}
  <div class="list">${S.reminders.length ? S.reminders.map(r => `<div class="item"><div class="ic">${R_TYPES[r.type][0].split(' ')[0]}</div><div class="mid" onclick="openRem('${r.id}')"><div class="t">${esc(R_TYPES[r.type][0].replace(/^\S+\s/, ''))}</div><div class="s">${freqLabel(r)} в ${r.time}</div></div>
    <label class="sw nolabel"><input type="checkbox" ${r.on ? 'checked' : ''} onchange="remToggle('${r.id}',this.checked)"><span></span></label></div>`).join('') : '<div class="empty" style="padding:20px">Напоминаний пока нет</div>'}</div>
  <div class="btns"><button class="btn pri" onclick="openRem()">+ Напоминание</button>${!S.reminders.length ? `<button class="btn" onclick="remDefaults()">Набор по умолчанию</button>` : ''}</div>
  <div class="card note">ℹ️ Приложение работает без сервера, поэтому уведомления срабатывают, когда приложение открыто или недавно сворачивалось. Если телефон долго не открывал приложение, напоминание придёт при следующем входе. Для гарантированных пушей в точное время нужен сервер, например Telegram-бот. Его можно подключить отдельно.</div>`;
};
function remToggle(id, on) { const r = S.reminders.find(x => x.id === id); r.on = on; if (on) r.created = Date.now(); save(); }
function remDefaults() {
  const R = (type, freq, time, o = {}) => ({ id: uid(), type, freq, time, dow: 6, dom: 1, on: true, created: Date.now(), last: 0, ...o });
  S.reminders = [R('log', 'daily', '21:00'), R('status', 'daily', '12:00'), R('week', 'weekly', '19:00', { dow: 6 }), R('month', 'monthly', '10:00', { dom: 1 }), R('recon', 'monthly', '11:00', { dom: 1 }), R('backup', 'weekly', '20:00', { dow: 6 })];
  save(); render(); askNotif();
}
async function askNotif() { if (!('Notification' in window)) return toast('Уведомления не поддерживаются'); const p = await Notification.requestPermission(); toast(p === 'granted' ? 'Уведомления включены' : 'Уведомления не разрешены'); render(); }
let RE = null;
function openRem(id) {
  const r = id ? S.reminders.find(x => x.id === id) : null;
  RE = r ? { ...r } : { id: null, type: 'status', freq: 'daily', time: '20:00', dow: 6, dom: 1, on: true, last: 0 };
  drawRem(!!r);
}
function drawRem(ex) {
  openSheet(`<h3>${ex ? 'Напоминание' : 'Новое напоминание'}</h3>
    <label class="f"><span>Что присылать</span><select class="inp" onchange="RE.type=this.value;drawRem(${ex})">${Object.entries(R_TYPES).map(([k, [n, d]]) => `<option value="${k}" ${k === RE.type ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
    <div class="note">${R_TYPES[RE.type][1]}. Пример: «${esc(reminderMsg(RE.type))}»</div>
    <label class="f"><span>Как часто</span><div class="seg">${[['daily', 'Каждый день'], ['weekly', 'Неделя'], ['monthly', 'Месяц']].map(([k, n]) => `<button class="${RE.freq === k ? 'on' : ''}" onclick="RE.freq='${k}';drawRem(${ex})">${n}</button>`).join('')}</div></label>
    ${RE.freq === 'weekly' ? `<label class="f"><span>День недели</span><div class="chips">${WD.map((w, i) => `<button class="chip ${+RE.dow === i ? 'on' : ''}" onclick="RE.dow=${i};drawRem(${ex})">${w}</button>`).join('')}</div></label>` : ''}
    ${RE.freq === 'monthly' ? `<label class="f"><span>Число месяца</span><input class="inp" type="number" min="1" max="31" value="${RE.dom}" onchange="RE.dom=clamp(Math.round(num(this.value)),1,31)"></label>` : ''}
    <label class="f"><span>Время</span><input class="inp" type="time" value="${RE.time}" onchange="RE.time=this.value"></label>
    <div class="btns"><button class="btn pri" onclick="remSave()">Сохранить</button><button class="btn" onclick="fireReminder(RE,true);toast('Отправлено, смотрите на главной')">Проверить</button></div>
    ${ex ? `<div class="btns"><button class="btn red" onclick="S.reminders=S.reminders.filter(x=>x.id!==RE.id);save();closeSheet();render()">Удалить</button></div>` : ''}`);
}
function remSave() {
  if (!/^\d\d:\d\d$/.test(RE.time || '')) return toast('Укажите время');
  if (RE.id) S.reminders[S.reminders.findIndex(r => r.id === RE.id)] = RE; else { RE.id = uid(); RE.created = Date.now(); S.reminders.push(RE); }
  save(); closeSheet(); render(); if ('Notification' in window && Notification.permission === 'default') askNotif();
}

/* --- Данные и демо --- */
VIEWS.data = () => `${S.demo ? `<div class="alert y"><div class="grow"><b>Сейчас включён демо-режим.</b> Это примерные данные для знакомства с возможностями. Ваши настоящие данные сохранены и вернутся при выходе.</div></div><button class="btn pri" onclick="demoOff()">Выйти из демо и вернуть мои данные</button>`
  : `<div class="card"><b>🎬 Демо-режим</b><div class="note">Заполнит приложение примерными данными за 4 месяца: доходы, распределения, траты, переводы, перерасходы, долги, счета и напоминания. Так можно посмотреть все отчёты и подсказки. Ваши данные сохранятся и вернутся по кнопке «Выйти из демо».</div><button class="btn pri" onclick="demoOn()">Включить демо</button></div>`}
  <div class="card"><b>Резервная копия</b><div class="note">Все данные хранятся только в этом браузере на этом телефоне. Регулярно сохраняйте копию (например, в Файлы или Telegram «Избранное»). Эту копию можно открыть на другом устройстве.</div>
  <div class="btns"><button class="btn pri" onclick="exportJSON()">Сохранить копию</button><button class="btn" onclick="$('#imp').click()">Загрузить копию</button></div>
  <input type="file" id="imp" accept=".json,application/json" hidden onchange="importJSON(this.files[0])">
  <div class="note">${S.lastBackup ? 'Последняя копия: ' + new Date(S.lastBackup).toLocaleString('ru-RU') : 'Копий ещё не было'}</div>
  ${localStorage.getItem('konverty-before-currency') ? `<button class="linkbtn" onclick="if(confirm('Вернуть данные к состоянию до последней смены валюты?')){S=migrate(JSON.parse(localStorage.getItem('konverty-before-currency')));save();go('home')}">↩︎ Вернуть данные до смены валюты</button>` : ''}</div>
  <div class="card"><b>Выгрузка</b><div class="btns"><button class="btn" onclick="exportCSV()">Все операции в CSV</button></div></div>
  ${!S.demo ? `<div class="card"><b>Сброс</b><div class="note">Удалит все операции и вернёт начальные фонды. Перед этим сохраните копию.</div><div class="btns"><button class="btn red" onclick="if(confirm('Точно стереть ВСЕ данные?')&&confirm('Последнее предупреждение. Стереть?')){S=seed();save();go('home')}">Стереть всё</button></div></div>` : ''}
  <div class="note" style="text-align:center">Операций: ${S.tx.length} · Фондов: ${S.funds.length} · Статей: ${S.cats.length} · v2</div>`;
function demoOn() {
  if (S.demo) return;
  localStorage.setItem(KEY_REAL, JSON.stringify(S));
  makeDemo(); save(); toast('Демо-режим включён'); go('home');
}
function demoOff() {
  const r = localStorage.getItem(KEY_REAL);
  S = r ? migrate(JSON.parse(r)) : seed(); S.demo = false;
  localStorage.removeItem(KEY_REAL); save(); toast('Ваши данные возвращены'); go('home');
}
function makeDemo() {
  let seedN = 7; const rnd = () => (seedN = (seedN * 16807) % 2147483647) / 2147483647;
  const pick = a => a[Math.floor(rnd() * a.length)];
  S = seed(); S.demo = true; S.onboard = false;
  const id = n => S.funds.find(f => f.name === n).id, cat = n => S.cats.find(c => c.name === n).id;
  S.funds.forEach(f => { if (['Подушка безопасности'].includes(f.name)) f.start = 180000; if (f.name === 'Отпуск') { f.start = 25000; f.pct = 20; } if (f.name === 'Инвестиции') f.pct = 20; });
  S.funds.find(f => f.name === 'Подушка безопасности').pct = 60;
  S.funds.forEach(f => { if (f.group !== 'goal' && f.plan > 0 && ['mandatory', 'life'].includes(f.group)) { f.showToday = true; f.showPct = true; } });
  const t = today(), cur = ymOf(t);
  const add = o => S.tx.push({ id: uid(), ts: Date.now() + S.tx.length, note: '', who: '', catId: '', fundId: '', ...o });
  // [фонд, статья, доля от плана, кол-во, заметки]
  const T = [
    ['Продукты', 'Покупка еды', .97, 13, ['Лента', 'Пятёрочка', 'ВкусВилл', 'рынок', 'Магнит', 'Перекрёсток']],
    ['Связь', 'Сотовая связь и интернет', 1, 2, ['МТС', 'домашний интернет']],
    ['Транспорт', 'Транспорт, такси, бензин', 1.05, 8, ['метро', 'такси', 'бензин', 'автобус']],
    ['Аренда и ЖКУ', 'Аренда и ЖКУ', 1, 1, ['аренда квартиры']],
    ['Хоз. нужды', 'Хозяйственные товары', .8, 3, ['Фикс Прайс', 'порошок, губки', 'лампочки']],
    ['Здоровье', 'Лекарства, анализы, врачи', .7, 2, ['аптека', 'анализы']],
    ['Красота', 'Косметика и уход', .85, 3, ['Золотое яблоко', 'маникюр', 'шампуни']],
    ['Кредит', 'Оплата кредитов', 1, 1, ['кредитка']],
    ['Одежда Гуля', 'Одежда Гуля', .6, 2, ['Zara', 'кроссовки', 'платье']],
    ['Одежда Шамиль', 'Одежда Шамиль', .45, 1, ['куртка', 'джинсы']],
    ['Развлечения', 'Развлечения', .9, 3, ['кино', 'боулинг', 'квест']],
    ['Витамины', 'Витамины, БАДы, протеин', .75, 1, ['омега-3, D3', 'протеин']],
    ['Ресторан', 'Ресторан, кафе, фастфуд', 1.32, 6, ['суши', 'хинкальная', 'кофейня', 'бургерная', 'пиццерия']],
    ['Подарки', 'Подарки', .5, 1, ['подарок маме', 'день рождения друга']],
    ['Спорт', 'Спортзал', 1, 1, ['абонемент']],
  ];
  for (let k = -3; k <= 0; k++) {
    const ym = ymShift(cur, k), last = k === 0 ? +t.slice(8) : dim(ym), dd = n => `${ym}-${String(clamp(n, 1, last)).padStart(2, '0')}`;
    if (k === 0 && last < 1) break;
    const inc = [[dd(1), 92000 + Math.round(rnd() * 8000), 'Доход Шамиля', 'Шамиль'], [dd(5), 58000, 'Зарплата Гуля', 'Гуля']];
    for (const [d, a, c, w] of inc) if (d <= t) { add({ type: 'income', amount: a, date: d, catId: cat(c), who: w, note: c === 'Доход Шамиля' ? 'оплата от клиента' : 'аванс + зарплата' }); }
    const { pool } = balances(); if (pool > 0) { D = { amount: String(pool), date: dd(5) > t ? t : dd(5), catId: '', rows: planDist(pool) }; distCommit(true); }
    for (const [fn, cn, k2, cnt, notes] of T) {
      const f = S.funds.find(x => x.name === fn); const share = k === 0 ? last / dim(ym) : 1;
      const total = f.plan * k2 * (0.92 + rnd() * 0.16) * share; const n = Math.max(1, Math.round(cnt * share));
      if (fn === 'Аренда и ЖКУ' || fn === 'Кредит' || fn === 'Спорт' || fn === 'Связь') { if (k === 0 && last < 10) continue; add({ type: 'expense', amount: Math.round(f.plan * k2), date: dd(fn === 'Аренда и ЖКУ' ? 3 : 10), fundId: f.id, catId: cat(cn), note: pick(notes) }); continue; }
      const parts = Array.from({ length: n }, () => 0.5 + rnd()); const ps = sum(parts);
      parts.forEach(p => add({ type: 'expense', amount: Math.round(total * p / ps / 10) * 10, date: dd(1 + Math.floor(rnd() * last)), fundId: f.id, catId: cat(cn), note: pick(notes), who: rnd() > .5 ? 'Гуля' : rnd() > .5 ? 'Шамиль' : '' }));
    }
    if (k === -2) add({ type: 'transfer', amount: 1500, date: dd(20), fundId: id('Развлечения'), toFundId: id('Ресторан'), note: 'не хватило на ресторан' });
    if (k === -1) add({ type: 'expense', amount: 38000, date: dd(14), fundId: id('Отпуск'), catId: cat('Билеты, отели в отпуск'), note: 'билеты в Казань' });
  }
  // перерасход прошлого месяца по продуктам, чтобы показать предложение покрыть
  add({ type: 'expense', amount: 6200, date: ymShift(cur, -1) + '-27', fundId: id('Продукты'), catId: cat('Покупка еды'), note: 'закупка к празднику' });
  const { b, pool } = balances(); const total = sum(S.funds, f => b[f.id] || 0) + pool;
  const accs = S.accounts; accs.forEach(a => a.amount = 0);
  accs[0].amount = Math.round(total * .25); accs[3].amount = Math.round(total * .1); accs[4].amount = 4500;
  accs[7].amount = Math.round(total * .35); accs[9].amount = Math.round(total * .15) - 4500 - 3200;
  accs[11].amount = r2(total * .15 / (S.rates.USDT || 90));
  S.debts = [{ id: uid(), dir: 'owe', name: 'Брат Рустам', amount: 15000, due: addDays(t, 5), note: 'по 5000 в месяц', paid: false },
    { id: uid(), dir: 'owed', name: 'Коллега Андрей', amount: 7000, due: addDays(t, -3), note: 'обещал до конца месяца', paid: false }];
  remDefaultsSilent();
  S.inbox = [{ id: uid(), title: '📊 Статус бюджета', body: reminderMsg('status'), view: 'home', ts: Date.now() }];
  S.lastRecon = Date.now() - 20 * 864e5; S.lastBackup = Date.now();
}
function remDefaultsSilent() { const R = (type, freq, time, o = {}) => ({ id: uid(), type, freq, time, dow: 6, dom: 1, on: true, created: Date.now(), last: Date.now(), ...o }); S.reminders = [R('log', 'daily', '21:00'), R('status', 'daily', '12:00'), R('week', 'weekly', '19:00'), R('month', 'monthly', '10:00')]; }

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
  r.onload = () => { try { const d = JSON.parse(r.result); if (!Array.isArray(d.funds) || !Array.isArray(d.tx)) throw 0; if (!confirm(`Загрузить копию (${d.tx.length} операций)? Текущие данные будут заменены.`)) return; S = migrate(d); save(); go('home'); toast('Загружено'); } catch (e) { alert('Это не файл копии Конвертов'); } };
  r.readAsText(file);
}
function exportCSV(from, to) {
  const T = { expense: 'Расход', income: 'Доход', alloc: 'Пополнение', transfer: 'Перевод' };
  const rows = [['Дата', 'Тип', 'Сумма (' + S.currency + ')', 'Фонд', 'В фонд', 'Статья', 'Кто', 'Заметка', 'Исходная сумма']];
  S.tx.filter(t => !from || (t.date >= from && t.date <= to)).sort((a, b) => a.date.localeCompare(b.date)).forEach(t => rows.push([t.date, T[t.type], String(t.amount).replace('.', ','), fundById(t.fundId)?.name || (t.type === 'income' ? 'Нераспределённое' : ''), fundById(t.toFundId)?.name || '', catById(t.catId)?.name || '', t.who || '', t.note || '', t.orig ? t.orig.amount + ' ' + t.orig.cur : '']));
  download(`konverty-${from ? from + '_' + to : 'all'}.csv`, '\ufeff' + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n'), 'text/csv');
}

/* --- Помощь --- */
VIEWS.help = () => `<div class="card"><b>✉️ Принцип конвертов</b><p class="note">Каждый рубль дохода сразу получает назначение: он лежит в своём фонде (конверте). Тратить можно только из конверта, и тогда видно, сколько ещё можно потратить на еду, рестораны или одежду.</p></div>
  <div class="card"><b>1. Пришли деньги</b><p class="note">«+» → Доход. Деньги попадают в «Нераспределено».</p></div>
  <div class="card"><b>2. Распределите</b><p class="note">Вкладка «Распределить» сама разложит деньги: обязательные → личные → образ жизни по планам, остаток в цели по процентам. Фонды, упёршиеся в лимит (×1,5), пропускаются.</p></div>
  <div class="card"><b>3. Записывайте траты</b><p class="note">«+» → Расход. Выберите статью, фонд подставится сам. Если фонд уходит в минус, приложение предупредит.</p></div>
  <div class="card"><b>4. Следите за статусом</b><p class="note">На главной смайлик показывает, укладываетесь ли вы в план на сегодняшнюю дату. 😊 значит в графике, 😐 — тратим чуть быстрее (до 20%), 😟 — сильно выше плана.</p></div>
  <div class="card"><b>5. Перерасход</b><p class="note">Если в прошлом месяце фонд потратил больше плана, приложение предложит покрыть разницу из другого фонда. Если перерасход повторяется 3 месяца подряд, предложит увеличить план.</p></div>
  <div class="card"><b>6. Отчёты</b><p class="note">День, неделя или месяц, по всем фондам, одному фонду или одной статье. Можно смотреть графиком или таблицей. Наложенные полосы показывают план, факт и прогноз.</p></div>
  <div class="card"><b>📲 На домашний экран</b><p class="note">iPhone: Safari → «Поделиться» → «На экран Домой». Android: Chrome → ⋮ → «Добавить на гл. экран». Приложение работает и без интернета.</p></div>`;

/* ================= Шторка и тосты ================= */
function openSheet(html) { $('#sheetBody').innerHTML = html; $('#sheet').classList.add('on'); document.body.classList.add('noscroll'); }
function closeSheet() { $('#sheet').classList.remove('on'); document.body.classList.remove('noscroll'); }
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 2200); }
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });
// Запрет масштабирования двойным тапом и щипком (iOS игнорирует user-scalable)
let _lastTouch = 0;
document.addEventListener('touchend', e => { const n = Date.now(); if (n - _lastTouch < 350 && !e.target.closest('input,textarea,select')) e.preventDefault(); _lastTouch = n; }, { passive: false });
document.addEventListener('gesturestart', e => e.preventDefault());

/* ================= Старт ================= */
{ const h = location.hash.slice(1); if (VIEWS[h]) view = h; }
render();
setInterval(() => checkReminders(), 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { checkReminders(); if (view === 'home') render(); } });
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
if (navigator.storage?.persist) navigator.storage.persist();
if (S.accounts.some(a => a.currency !== S.currency) && Date.now() - (S.ratesAt || 0) > 864e5 && navigator.onLine) refreshRates(true);
