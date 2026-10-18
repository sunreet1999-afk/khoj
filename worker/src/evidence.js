// Evidence check: code se, AI se nahi.
// Source page ka text nikaal ke dekhte hain ki evidence sentence usme (lagbhag) hubahu hai ya nahi.

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: "'", lsquo: "'", rdquo: '"', ldquo: '"', ndash: '-', mdash: '-', hellip: '...' };

export function htmlToText(html) {
  return String(html)
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg|template)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? ' ');
}

export function norm(s) {
  return String(s).toLowerCase()
    .replace(/[‘’‚‛]/g, "'").replace(/[“”]/g, '"')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ').trim();
}

function lev(a, b) {
  if (a === b) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}
const ratio = (a, b) => 1 - lev(a, b) / Math.max(a.length, b.length, 1);

// 0..1 score: 1 = hubahu mila.
export function matchScore(sentence, pageText) {
  const s = norm(sentence).slice(0, 400), p = norm(pageText);
  if (!s || !p) return 0;
  if (p.includes(s)) return 1;
  const st = s.split(' '), pt = p.split(' '), n = st.length;
  if (pt.length < n) return ratio(s, p);
  // Pehle sasta token-overlap se best windows dhoondo, phir unpe edit-distance.
  const need = new Map();
  for (const t of st) need.set(t, (need.get(t) || 0) + 1);
  const have = new Map();
  let overlap = 0;
  const add = (t, d) => {
    const before = Math.min(have.get(t) || 0, need.get(t) || 0);
    have.set(t, (have.get(t) || 0) + d);
    overlap += Math.min(have.get(t), need.get(t) || 0) - before;
  };
  const best = [];
  for (let i = 0; i < pt.length; i++) {
    add(pt[i], 1);
    if (i >= n) add(pt[i - n], -1);
    if (i >= n - 1) {
      best.push([overlap, i - n + 1]);
      if (best.length > 12) { best.sort((a, b) => b[0] - a[0]); best.length = 6; }
    }
  }
  best.sort((a, b) => b[0] - a[0]);
  let top = 0;
  for (const [, start] of best.slice(0, 6)) {
    for (const d of [-2, -1, 0, 1, 2]) {
      const w = pt.slice(Math.max(0, start), Math.max(0, start) + n + d).join(' ');
      top = Math.max(top, ratio(s, w));
    }
  }
  return top;
}

export async function fetchPageText(url, timeoutMs = 10000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { redirect: 'follow', signal: ctrl.signal, headers: { 'user-agent': 'Mozilla/5.0 (KhojFactFactory)' } });
    if (!r.ok) throw new Error('http ' + r.status);
    const html = (await r.text()).slice(0, 2_000_000);
    return { text: htmlToText(html), finalUrl: r.url || url };
  } finally {
    clearTimeout(t);
  }
}
