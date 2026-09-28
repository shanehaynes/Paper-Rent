// Number formatters. Every figure on the page passes through one of these.
// Inputs are raw JSON values: $ millions, ratios as fractions, leverage as a multiple.

export const ND = 'n/d';
export const MINUS = '−';
const DASH = '–';

const sign = (v, plus) => (v < 0 ? MINUS : plus ? '+' : '');

// $787M below $1,000M; $1.54B at or above it.
export function usd(v, { decimals = 0, plus = false } = {}) {
  if (v == null) return ND;
  const a = Math.abs(v);
  if (Number(a.toFixed(decimals)) >= 1000) return `${sign(v, plus)}$${(a / 1000).toFixed(2)}B`;
  return `${sign(v, plus)}$${a.toFixed(decimals)}M`;
}

export function pct(v, { decimals = 1, plus = false } = {}) {
  if (v == null) return ND;
  return `${sign(v, plus)}${(Math.abs(v) * 100).toFixed(decimals)}%`;
}

// 47–51%: the one whole-percent form, used for ranges only.
export function pctRange(values) {
  const xs = values.filter((v) => v != null);
  if (!xs.length) return ND;
  const lo = Math.min(...xs);
  const hi = Math.max(...xs);
  return `${(lo * 100).toFixed(0)}${DASH}${(hi * 100).toFixed(0)}%`;
}

export function mult(v, { decimals = 2 } = {}) {
  if (v == null) return ND;
  return `${sign(v, false)}${Math.abs(v).toFixed(decimals)}×`;
}

export function multRange(values) {
  const xs = values.filter((v) => v != null);
  if (!xs.length) return ND;
  return `${mult(Math.min(...xs))}${DASH}${mult(Math.max(...xs))}`;
}

// Plain $M figure for dense tables (the column header carries the unit).
export function num(v, { decimals = 1, plus = false } = {}) {
  if (v == null) return ND;
  const a = Math.abs(v).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${sign(v, plus)}${a}`;
}

export function count(v) {
  if (v == null) return ND;
  return v.toLocaleString('en-US');
}

export const arrow = (parts) => parts.join(' → ');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function showDate(str) {
  const q = /^(\d{4})-Q(\d)$/.exec(str);
  if (q) return `Q${q[2]} ${q[1]}`;
  if (/^\d{4}$/.test(str)) return str;
  const [yy, mm, dd] = str.split('-').map(Number);
  return dd ? `${MONTHS[mm - 1]} ${dd}, ${yy}` : `${MONTHS[mm - 1]} ${yy}`;
}
