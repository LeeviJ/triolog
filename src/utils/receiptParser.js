const DATE_PATTERNS = [
  /(\d{1,2})\.(\d{1,2})\.(\d{4})/,
  /(\d{1,2})\.(\d{1,2})\.(\d{2})(?!\d)/,
];

const TIME_PATTERN = /(\d{1,2}):(\d{2})(?::(\d{2}))?/;

const COMMON_STORES = [
  'K-Market', 'K-Supermarket', 'K-Citymarket', 'K-Rauta',
  'Prisma', 'S-Market', 'Sale', 'Alepa',
  'Lidl', 'Tokmanni', 'Biltema', 'Motonet',
  'Gigantti', 'Power', 'Clas Ohlson',
  'Stockmann', 'Sokos', 'R-kioski',
  'ABC', 'Neste', 'Shell', 'Teboil', 'St1',
  'Hesburger', 'McDonald', 'Subway',
  'Würth', 'IKH', 'Hong Kong', 'Puuilo',
];

const TOTAL_KEYWORDS = [
  'yhteensä', 'summa', 'total', 'maksettava',
  'kortilla', 'pankkikortti', 'debit', 'credit',
];

// Match amounts like 12,50 or 123,99 or 1 234,56 with optional €
const AMOUNT_PATTERN = /(\d[\d\s]*,\d{2})\s*€?/g;

function parseTotal(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Strategy 1: Find line with total keyword + amount
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (TOTAL_KEYWORDS.some(kw => lower.includes(kw))) {
      const amounts = [...line.matchAll(AMOUNT_PATTERN)];
      if (amounts.length > 0) {
        const last = amounts[amounts.length - 1][1].replace(/\s/g, '');
        return last;
      }
    }
  }

  // Strategy 2: Find € symbol on any line
  for (const line of lines) {
    if (line.includes('€')) {
      const amounts = [...line.matchAll(AMOUNT_PATTERN)];
      if (amounts.length > 0) {
        const last = amounts[amounts.length - 1][1].replace(/\s/g, '');
        return last;
      }
    }
  }

  // Strategy 3: Best guess - collect all amounts and pick the largest
  const allAmounts = [...text.matchAll(AMOUNT_PATTERN)]
    .map(m => m[1].replace(/\s/g, ''))
    .map(s => ({ str: s, val: parseFloat(s.replace(',', '.')) }))
    .filter(a => !isNaN(a.val) && a.val > 0);

  if (allAmounts.length > 0) {
    allAmounts.sort((a, b) => b.val - a.val);
    return allAmounts[0].str;
  }

  return null;
}

export function parseReceipt(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  let date = null;
  let time = null;
  let storeName = null;
  let total = null;
  let confidence = 'low';

  // 1. Find store name from common stores list (fast path)
  const lowerText = text.toLowerCase();
  for (const store of COMMON_STORES) {
    if (lowerText.includes(store.toLowerCase())) {
      storeName = store;
      break;
    }
  }
  // Fallback: first non-empty line
  if (!storeName && lines.length > 0) {
    storeName = lines[0];
  }

  // 2. Find date (critical)
  for (const pattern of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      let [, d, m, y] = match;
      if (y.length === 2) y = '20' + y;
      date = `${d.padStart(2, '0')}.${m.padStart(2, '0')}.${y}`;
      break;
    }
  }

  // 3. Find time
  const timeMatch = text.match(TIME_PATTERN);
  if (timeMatch) {
    time = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
  }

  // 4. Find total (critical)
  total = parseTotal(text);

  // Determine confidence
  if (date && total) {
    confidence = 'high';
  } else if (date || total) {
    confidence = 'medium';
  }

  return { date, time, storeName, total, confidence, raw: text };
}

export function receiptTimeToTimestamp(date, time) {
  if (!date || !time) return null;
  const [d, m, y] = date.split('.');
  const [h, min] = time.split(':');
  return new Date(+y, +m - 1, +d, +h, +min).getTime();
}
