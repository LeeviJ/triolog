const DATE_PATTERNS = [
  /(\d{1,2})\.(\d{1,2})\.(\d{4})/,
  /(\d{1,2})\.(\d{1,2})\.(\d{2})(?!\d)/,
];

const TIME_PATTERN = /(\d{1,2}):(\d{2})(?::(\d{2}))?/;

const STORE_NAMES = [
  'K-Market', 'K-Supermarket', 'K-Citymarket', 'Prisma', 'S-Market',
  'Lidl', 'Alepa', 'Sale', 'ABC', 'Neste', 'Tokmanni', 'Biltema',
  'Motonet', 'Gigantti', 'Power', 'Clas Ohlson', 'Stockmann',
  'Sokos', 'R-kioski', 'Shell', 'Teboil', 'St1',
];

export function parseReceipt(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  let date = null;
  let time = null;
  let storeName = null;
  let address = null;

  // Find store name
  const lowerText = text.toLowerCase();
  for (const store of STORE_NAMES) {
    if (lowerText.includes(store.toLowerCase())) {
      storeName = store;
      break;
    }
  }
  // Fallback: use first non-empty line as store name
  if (!storeName && lines.length > 0) {
    storeName = lines[0];
  }

  // Find date
  for (const pattern of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      let [, d, m, y] = match;
      if (y.length === 2) y = '20' + y;
      date = `${d.padStart(2, '0')}.${m.padStart(2, '0')}.${y}`;
      break;
    }
  }

  // Find time
  const timeMatch = text.match(TIME_PATTERN);
  if (timeMatch) {
    time = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
  }

  // Try to find address (line with street number pattern)
  for (const line of lines) {
    if (/\d+\s*[a-zA-ZäöåÄÖÅ]/.test(line) && /katu|tie|väylä|kuja|polku|kaari/i.test(line)) {
      address = line;
      break;
    }
  }

  return { date, time, storeName, address, raw: text };
}

export function receiptTimeToTimestamp(date, time) {
  if (!date || !time) return null;
  const [d, m, y] = date.split('.');
  const [h, min] = time.split(':');
  return new Date(+y, +m - 1, +d, +h, +min).getTime();
}
