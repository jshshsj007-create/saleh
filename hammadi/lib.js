/* ───────── مكتبة «الحمادي»: منطقٌ خالص بلا متصفّح ─────────
   يُستورد في الموقع، ويُختبر في Node، وتُنسخ دوالّ المذكرات منه حرفيًّا إلى سكربت الشيت
   (فما يستخرجه السكربت من المذكرات هو نفسه ما يُختبر هنا) */

// العربية تُكتب بأوجه: همزاتٌ وتاءٌ مربوطة وتشكيل، وقراءةُ الآلة تخلط الثاء بالتاء.
// فالبحث يقارن على صورةٍ واحدة لكل حرف، وإلا فاتت «الثالثة» من كتب «الثالته»
export function norm(s) {
  return String(s || '')
    .replace(/[ً-ٰٟـ‌-‏]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/ث/g, 'ت')
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .toLowerCase();
}

/* ── «المادة السادسة عشرة» = ١٦ ──
   الكلمات بعد التطبيع؛ والعشرات تُجمع مع الآحاد، و«عشر» تزيد عشرة، و«بعد المائة» مائة */
const UNITS = { 'الاول': 1, 'الاولي': 1, 'الحاديه': 1, 'الحادي': 1, 'الواحده': 1, 'الثانيه': 2, 'الثاني': 2, 'الثالثه': 3, 'الثالث': 3,
  'الرابعه': 4, 'الرابع': 4, 'الخامسه': 5, 'الخامس': 5, 'السادسه': 6, 'السادس': 6, 'السابعه': 7, 'السابع': 7,
  'الثامنه': 8, 'الثامن': 8, 'التاسعه': 9, 'التاسع': 9, 'العاشره': 10, 'العاشر': 10 };
const TENS = { 'العشرون': 20, 'العشرين': 20, 'الثلاثون': 30, 'الثلاثين': 30, 'الاربعون': 40, 'الاربعين': 40, 'الخمسون': 50, 'الخمسين': 50,
  'الستون': 60, 'الستين': 60, 'السبعون': 70, 'السبعين': 70, 'الثمانون': 80, 'الثمانين': 80, 'التسعون': 90, 'التسعين': 90 };
const key = w => norm(w).replace(/^و(?=ال)/, '');
const UK = Object.fromEntries(Object.entries(UNITS).map(([k, v]) => [key(k), v]));
const TK = Object.fromEntries(Object.entries(TENS).map(([k, v]) => [key(k), v]));
// قراءة الآلة تُسقط حرفًا أو تبدّله («الثلاتثون»): فيُقبل أقرب لفظٍ بفرق حرفٍ واحد في الكلمات الطويلة
function near(w, dict) {
  if (dict[w] != null) return dict[w];
  if (w.length < 6) return null;
  for (const k in dict) if (Math.abs(k.length - w.length) <= 1 && lev1(k, w)) return dict[k];
  return null;
}
function lev1(a, b) {
  if (a === b) return true;
  if (a.length === b.length) {
    const df = []; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) df.push(i);
    // حرفٌ مبدَّل، أو حرفان متجاوران تبادلا («التلاته» و«التالته»)
    return df.length <= 1 || (df.length === 2 && df[1] === df[0] + 1 && a[df[0]] === b[df[1]] && a[df[1]] === b[df[0]]);
  }
  if (a.length === b.length) return false;
  const [s, l] = a.length < b.length ? [a, b] : [b, a];
  for (let i = 0, j = 0, d = 0; j < l.length; i++, j++) if (s[i] !== l[j]) { if (++d > 1) return false; i--; }
  return true;
}
// يعيد رقم المادة من نصٍّ يلي كلمة «المادة»، أو null
export function ordinal(s) { return ordinalEx(s).n; }
// ومعه ما بقي بعد الترتيب: رأسُ المادة لا يبقى بعده إلا «:» أو نصُّها، لا «ولائحتها التنفيذية.»
export function ordinalEx(s) {
  const t = norm(s).replace(/[()\[\]«»]/g, ' ').trim();
  const m = t.match(/^(\d{1,3})(?!\d)\s*(.*)$/);
  if (m) return { n: +m[1], rest: m[2].replace(/^:\s*/, ''), colon: /^:/.test(m[2]) };
  const ws = t.split(/\s+/);
  let n = 0, seen = false, i = 0, colon = false;
  for (; i < Math.min(ws.length, 6); i++) {
    const w = key(ws[i].replace(/[:.\-–]+$/, ''));
    if (!w) continue;
    const end = /[:.]$/.test(ws[i]);
    // «عشر» تقرؤها الآلة «عشير» و«عدشير» و«عثشير»
    if (seen && /^ع.{0,2}ش.{0,2}ر?ه?$/.test(w) && w.length <= 6) { n += 10; if (end) { colon = /:$/.test(ws[i]); i++; break; } continue; }
    if (/^(بعد)$/.test(w) && seen) continue;
    let v = null;
    if (/^(الماي[هت]|الميه|الماييه|مايه|الماءه)$/.test(w)) v = 100;
    else if (/^(ال)?مايتين$/.test(w)) v = 200;
    else { v = near(w, UK); if (v == null) v = near(w, TK); }
    if (v == null) break;
    n += v; seen = true;
    if (end) { colon = /:$/.test(ws[i]); i++; break; }
  }
  if (!colon && /^:/.test(ws[i] || '')) { colon = true; ws[i] = ws[i].slice(1); }
  return seen ? { n, rest: ws.slice(i).join(' ').trim(), colon } : { n: null, rest: t };
}

/* ── تقطيع النظام إلى مواد ──
   الصفحات بنصّها المقروء آليًّا؛ رأسُ المادة سطرٌ يبدأ بـ«المادة» ويليه رقمٌ أو ترتيبٌ وسطرُه قصير.
   وإذا نزل الرقم إلى الأولى بعد مادةٍ متأخرة فقد بدأ نظامٌ آخر في الملف نفسه (لائحة بعد نظام) */
// تذييل الصفحة وشعارها تقرؤه الآلة حروفًا مبعثرة («هلظ_الندك | 84937 |»)، وروابط الوزارة وأرقام الصفحات
function noise(l) {
  if (/(www\.|\.gov\.sa|Page \d+ of|Ministry of|MOH|@)/i.test(l)) return true;
  if (/^(وزارة الصحة|وزارة الصـحة|المملكة العربية السعودية)$/.test(l)) return true;
  const ar = (l.match(/[\u0621-\u064A]/g) || []).length, all = l.replace(/\s/g, '').length;
  if ((l.match(/[|©<>_]/g) || []).length >= 2) return true;
  return all > 3 && ar / all < 0.45;
}
// آخر الصفحة تذييلٌ مصوَّر (رقم الصفحة وشعارٌ مقروءٌ حروفًا): سطورٌ قصيرة فيها أرقام بلا نهاية جملة
function dropFooter(lines) {
  const out = lines.slice();
  const junk = l => noise(l) || (l.length < 34 && /\d/.test(l) && !/[.:؛،)]$/.test(l) && !/ماد[ةه]/.test(l) && !/^[\d٠-٩]+\s*[-–]/.test(l));
  // من الأسفل (التذييل) ومن الأعلى (الترويسة)، حتى أول سطرٍ من المتن
  for (const dir of [-1, 1]) {
    for (let k = 0, i = dir < 0 ? out.length - 1 : 0; i >= 0 && i < out.length && k < 7; i += dir) {
      const l = out[i].trim();
      if (!l) continue;
      k++;
      if (junk(l)) out[i] = ''; else break;
    }
  }
  return out;
}
const HEAD = /^[\s\-–•|«"'\u200e\u200f]*(?:ال)?ماد[تة]*[ةه]\s*[:\-–]?\s*(.+)$/;
export function articles(pages) {
  const out = [];
  let cur = null, part = 1, pre = [], recent = [];
  const parts = {};
  pages.forEach((txt, pi) => {
    for (const raw of dropFooter(String(txt || '').split('\n'))) {
      const line = raw.replace(/\s+/g, ' ').trim();
      const h = line.match(HEAD);
      const words = line.split(' ').length;
      const o = h ? ordinalEx(h[1]) : { n: null };
      // ما بعد الترتيب: لا شيء، أو «:» ثم نص المادة. غير ذلك إحالةٌ في سطر («المادة الأربعون ولائحتها»)، لا رأس
      const n = o.n != null && ((!o.rest && words <= 8) || o.colon) ? o.n : null;
      if (n != null && n > 0 && n < 400) {
        if (cur && n === 1 && cur.n > 3) {
          part++;
          // عنوان الجزء الجديد: أقرب سطرٍ قبله يسمّي نظامًا أو لائحة أو قواعد
          const t = recent.slice().reverse().find(x => /(نظام|لائح|قواعد|ضوابط|تنظيم)/.test(x) && x.length < 120);
          if (t) parts[part] = t.replace(/[:.]+$/, '');
        }
        cur = { n, part, label: line.replace(/[:\s]+$/, ''), page: pi + 1, lines: [] };
        out.push(cur);
        if (o.colon && o.rest) cur.lines.push(line.replace(/^[^:]*:\s*/, ''));
        continue;
      }
      if (!line || /^[\d\s|.\-_]+$/.test(line) || noise(line)) { if (cur && cur.lines.length && cur.lines[cur.lines.length - 1] !== '') cur.lines.push(''); continue; }
      recent.push(line); if (recent.length > 6) recent.shift();
      if (cur) cur.lines.push(line); else pre.push(line);
    }
  });
  return { pre: pre.join('\n'), parts, list: out.map(a => ({ n: a.n, part: a.part, page: a.page, text: a.lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() })) };
}

/* ───────── المذكرات ───────── */

// «مذكرة رد من فلان» و«مقدمة من» مذكرةُ الخصم، لا مذكرتنا
export function memoTheirs(title) {
  return /(^|[\s_\-])(من|مقدمه|مقدمة)(?=[\s_\-]|$)/.test(String(title || '').replace(/\.[a-z]{2,5}$/i, ''));
}
export function memoKind(title) {
  const t = norm(title);
  if (/جوابي/.test(t)) return 'مذكرة جوابية';
  if (/مذكر[هة]\s*[_\s]*رد/.test(t) || /(^|\s)رد(\s|_|$)/.test(t)) return 'مذكرة رد';
  if (/كليش/.test(t)) return 'كليشة';
  if (/لايح|اعتراض|استيناف/.test(t)) return 'لائحة';
  return 'مذكرة';
}
// رقم القضية عشرُ خانات يبدأ بـ٤ في محاكم المملكة
export function caseNoOf(title, text) {
  const m = norm(title).match(/(?<!\d)4\d{9}(?!\d)/) || norm(String(text || '').slice(0, 3000)).match(/(?<!\d)4\d{9}(?!\d)/);
  return m ? m[0] : '';
}
// اسم الخصم من العنوان: ما بقي بعد نوع المذكرة والأرقام
export function oppOf(title) {
  return String(title || '').replace(/\.[a-z]{2,5}$/i, '').replace(/_/g, ' ')
    .replace(/مذكر[ةه]\s*(جوابي[ةه]|رد)?/g, '').replace(/\((كليشة|القاسم)\)/g, '')
    .replace(/(القضية|قضية)\s*رقم\s*\(?\d+\)?/g, '').replace(/\d{6,}/g, '').replace(/[-–×]/g, ' ')
    .replace(/^\s*(على|علي)\s+(اعتراض|الاستئناف|استئناف|أسئلة الدائرة|مذكرات المدعى عليه)\s*/, '').replace(/(^|\s)(استئناف|مسودة|من|مقدمة)(?=\s|$)/g, ' ').replace(/\s+\d{1,2}\s*$/, '').replace(/\s+/g, ' ').trim();
}

/* أقسام المذكرة: «أولاً: الرد على …» و«الطلبات». كل قسمٍ فقرةُ بحث، يحمل عنوانه ليُعرف
   في أي دفعٍ قيلت الجملة */
// تُقارن بعد التطبيع، والتطبيع يجعل الثاء تاءً: «ثانيًا» تصير «تانيا»
const ORD = /^(اولا|تانيا|تالتا|رابعا|خامسا|سادسا|سابعا|تامنا|تاسعا|عاشرا|الحادي عشر|التاني عشر)\s*[:\-–/]/;
export function memoSections(text) {
  const lines = String(text || '').replace(/\r/g, '').split('\n').map(l => l.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim());
  const secs = [];
  let cur = { h: '', t: [] };
  for (const l of lines) {
    if (!l) continue;
    const n = norm(l);
    const isHead = (ORD.test(n) && l.length < 160) || (/^(الطلبات|الخاتمه|الوقايع|الموضوع|الدفوع|الدفع)\s*:?$/.test(n));
    if (isHead) { if (cur.t.length || cur.h) secs.push(cur); cur = { h: l.replace(/:\s*$/, ''), t: [] }; const after = l.split(/:\s*/).slice(1).join(': ').trim(); if (after && l.length > 80) cur.t.push(after); continue; }
    cur.t.push(l);
  }
  if (cur.t.length || cur.h) secs.push(cur);
  return secs.map(s => ({ h: s.h, t: s.t.join('\n') }));
}

/* الاستشهاد: «المادة (15)» أو «الفقرة (2) من المادة (7) من اللائحة التنفيذية لنظام …»
   واسمُ النظام إن لم يأتِ بعدها أُخذ من آخر نظامٍ ذُكر في الفقرة نفسها («نظام مزاولة … إذ نصت المادة (9/أ)») */
const REG = /((?:اللائحة التنفيذية ل)?(?:نظام|لائحة|اللائحة|وثيقة|تنظيم|قواعد|معايير|دليل)\s+[^،,.؛:"«»()\n]{3,70})/;
function regName(s) {
  const m = s.match(REG);
  if (!m) return '';
  return m[1].replace(/\s+(على|في|أن|ان|إذ|اذ|وقد|حيث|والتي|التي|بأن|بان|وما|ما|بشأن)(\s.*)?$/, '').replace(/[\s،,]+$/, '').trim();
}
export function citations(text) {
  const out = [];
  const paras = String(text || '').replace(/\*\*/g, '').split(/\n+/);
  for (const p of paras) {
    let last = '';
    const re = /(?:(?:ال)?فقر[ةه]\s*\(?([^()\s]{1,4})\)?\s*من\s*)?(?:ال)?ماد[ةه]\s*(?:رقم\s*)?\(?\s*([0-9٠-٩]{1,3}(?:\s*[/\\-]\s*[0-9٠-٩أ-ي]{1,3})?|[^\s()]+(?:\s+(?:عشر[ةه]?|و[^\s()]+|بعد\s+[^\s()]+)){0,3})\s*\)?/g;
    let m;
    const regsBefore = [];
    for (let i = 0, mm, r2 = new RegExp(REG.source, 'g'); (mm = r2.exec(p));) regsBefore.push({ at: mm.index, name: regName(mm[0]) });
    while ((m = re.exec(p))) {
      const raw = m[2].trim();
      const sub = raw.match(/^([0-9٠-٩]+)\s*[/\\-]\s*(.+)$/);
      const n = sub ? +norm(sub[1]) : ordinal(raw);
      if (n == null || !(n > 0 && n < 400)) continue;
      const tail = p.slice(m.index + m[0].length, m.index + m[0].length + 120);
      let reg = '';
      const near = tail.match(/^\s*(?:من|في|ب)\s*(.*)$/);
      const prev = (regsBefore.filter(r => r.at < m.index).pop() || {}).name || last;
      const base = prev.replace(/^اللائحة التنفيذية ل/, '');
      // «من النظام» و«من اللائحة» يحيلان إلى ما ذُكر قبلها في الفقرة
      if (near && /^النظام(\s|$|[،,.])/.test(near[1]) && base) reg = base;
      else if (near && /^(اللائحة|لائحته|لائحتها)(\s|$|[،,.])/.test(near[1]) && base) reg = 'اللائحة التنفيذية ل' + base;
      else if (near) reg = regName(near[1]);
      if (!reg) reg = prev;
      if (reg) last = reg;
      const after = p.slice(m.index + m[0].length, m.index + m[0].length + 900);
      const q = after.match(/[\"“«]([^\"”»]{8,700})[\"”»]/);
      out.push({ reg, n, sub: sub ? norm(sub[2]) : (m[1] ? norm(m[1]) : ''), quote: q ? q[1].replace(/\*\*/g, '').trim() : '', ctx: p.slice(Math.max(0, m.index - 160), m.index + m[0].length + 260).trim() });
    }
  }
  return out;
}

/* الحجة كاملة: المذكرة تستشهد بالمادة ثم تعلّق عليها، فالمقصود ليس النص المنقول وحده بل
   النقطة كلها — من فقرة الاستشهاد إلى آخر قسمها («أولاً: …»)، أو إلى أول فقرةٍ بعدها تستشهد
   بمادةٍ غير التي فيها (فتلك حجةٌ أخرى) */
export function memoCites(secs) {
  const out = [];
  secs.forEach((sec, si) => {
    const paras = String(sec.t || '').split('\n').map(x => x.trim()).filter(Boolean);
    const cs = paras.map(p => citations(p));
    cs.forEach((list, pi) => {
      if (!list.length) return;
      const mine = new Set(list.map(c => c.n));
      let end = pi + 1;
      while (end < paras.length && !cs[end].some(c => !mine.has(c.n))) end++;
      const arg = paras.slice(pi, end).join('\n');
      for (const c of list) out.push({ ...c, h: sec.h, sec: si, arg });
    });
  });
  return out;
}

/* ───────── البحث ─────────
   الاستعلام كلماتٌ حرّة، وقد يحمل رقم مادة («م ١٦»، «المادة 16»، «المادة السادسة عشرة»)
   واسمَ نظام («المؤسسات الصحية»). فيُفصل الرقم، وكلماتُ الاسم تُرشّح النظام، والباقي يُبحث في النص */
const STOP = new Set(['من', 'في', 'على', 'الى', 'او', 'و', 'عن', 'ما', 'هو', 'هي', 'ان', 'التي', 'الذي', 'مع', 'ذلك', 'هذا', 'هذه', 'كل', 'لا', 'نظام', 'لايحه', 'اللايحه', 'ماده', 'الماده', 'م', 'التنفيذيه']);
export function parseQuery(q) {
  let t = norm(q).replace(/[«»"()،,.؛:]/g, ' ');
  let art = null;
  const m = t.match(/(?:^|\s)(?:ال)?(?:ماده|م)\s*\/?\s*(\d{1,3})(?:\s*[/\-]\s*(\d{1,2}))?(?=\s|$)/) || t.match(/(?:^|\s)(\d{1,3})(?:\s*[/\-]\s*(\d{1,2}))?(?=\s|$)/);
  let sub = null;
  if (m) { art = +m[1]; sub = m[2] ? +m[2] : null; t = t.replace(m[0], ' '); }
  else {
    const w = t.match(/(?:^|\s)(?:ال)?ماده\s+(.*)$/);
    if (w) { const o = ordinalEx(w[1]); if (o.n) { art = o.n; t = t.slice(0, w.index) + ' ' + o.rest; } }
  }
  const words = t.split(/\s+/).filter(w => w && !STOP.has(w) && !/^\d+$/.test(w));
  return { art, sub, words };
}
// الكلمة تطابق بسوابقها ولواحقها («الموافقة» = «بموافقة» و«موافقته») لا داخل كلمةٍ أخرى («بذل» ≠ «بذلك»)
const AL = '\u0621-\u064A';
const RE = new Map();
function wordRe(w) {
  if (RE.has(w)) return RE.get(w);
  let core = w.replace(/^(و|ف|ب|ك)?(ال|لل)/, '');
  // اللاحقة تُنزع إن بقي بعدها جذرٌ من ثلاثة أحرف («الخطية» لا تصير «خط» فتطابق «الخطة»)
  const cut = core.replace(/(ه|ات|ين|ون|يه)$/, '');
  if (cut.length >= 3) core = cut;
  if (core.length < 2) core = w;
  const esc = core.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const src = `(?<![${AL}])(?:[وفبكل]?(?:ال|لل)?|ل)${esc}(?:ه|ات|ين|ون|ها|هم|هما|ي|يه|يات|تها|ته|تهم|ا)?(?![${AL}])`;
  const r = { t: new RegExp(src), g: () => new RegExp(src, 'g'), G: new RegExp(src, 'g') };
  RE.set(w, r);
  return r;
}
const stem = w => w;
export function matchWord(hayNorm, w) {
  if (hayNorm.includes(w) && w.length >= 5) return true;
  return wordRe(w).t.test(hayNorm);
}
// يُبرز الكلمات في مقتطفٍ حول أول تطابق؛ يعيد [قبل، مطابق، بعد…] قطعًا يرسمها الموقع
export function snippet(text, words, size = 220) {
  const t = String(text || '');
  if (!words.length) return [{ t: t.slice(0, size) + (t.length > size ? '…' : '') }];
  const n = norm(t);
  // التطبيع يحفظ الطول إلا التشكيل؛ فنبني خريطةً من موضع المطبَّع إلى الأصل
  const map = [];
  for (let i = 0; i < t.length; i++) { const c = norm(t[i]); for (let j = 0; j < c.length; j++) map.push(i); }
  let first = -1;
  const hits = [];
  for (const w of words) {
    const r = wordRe(w).g();
    let m;
    while ((m = r.exec(n))) { const i = m.index; hits.push([map[i], map[Math.min(i + m[0].length - 1, map.length - 1)] + 1]); if (first < 0 || i < first) first = i; if (m[0].length === 0) r.lastIndex++; }
  }
  const at = first < 0 ? 0 : map[first];
  const a = Math.max(0, at - Math.floor(size / 3)), b = Math.min(t.length, a + size);
  hits.sort((x, y) => x[0] - y[0]);
  const out = [];
  let p = a;
  if (a > 0) out.push({ t: '…' });
  for (const [s, e] of hits) {
    if (e <= p || s >= b) continue;
    const s2 = Math.max(s, p), e2 = Math.min(e, b);
    if (s2 > p) out.push({ t: t.slice(p, s2) });
    out.push({ t: t.slice(s2, e2), hit: true });
    p = e2;
  }
  if (p < b) out.push({ t: t.slice(p, b) });
  if (b < t.length) out.push({ t: '…' });
  return out;
}

// كلماتٌ كلها في نافذةٍ واحدة من النص (أي ترتيب): «الموافقة … الخطية» قريبتان
function phraseNear(xn, ws, win) {
  const r0 = wordRe(ws[0]).g();
  let m;
  while ((m = r0.exec(xn))) { const seg = xn.slice(Math.max(0, m.index - win), m.index + win); if (ws.every(w => matchWord(seg, w))) return true; }
  return false;
}
/* المستند: {kind, title, n?, label?, text, docTitle?} — النتيجة مرتّبة بتغطية الكلمات ثم قربها.
   رقم المادة إن طُلب صار شرطًا، واسم النظام يرفع ولا يحجب إلا إذا طابق بعضُ الأنظمة */
export function search(docs, q, limit = 60) {
  const { art, sub, words } = parseQuery(q);
  if (!art && !words.length) return { art, words, hits: [] };
  // كلماتٌ تطابق عنوان نظامٍ بعينه تُعامل مرشِّحًا لا نصًّا
  const titleWords = words.filter(w => docs.some(d => d.kind === 'ماده' && matchWord(d.tn || (d.tn = norm(d.docTitle)), w)));
  const narrowing = art != null && titleWords.length > 0;
  const textWords = narrowing ? words.filter(w => !titleWords.includes(w)) : words;
  const hits = [];
  for (const d of docs) {
    if (art != null && d.n !== art && !(d.cites || []).some(c => c.n === art)) continue;
    const tn = d.tn || (d.tn = norm(d.docTitle || d.title || ''));
    const xn = d.xn || (d.xn = norm(d.text));
    let score = 0;
    if (narrowing) { const tw = titleWords.filter(w => matchWord(tn, w)).length; if (!tw) continue; score += tw * 3; }
    let got = 0;
    for (const w of textWords) {
      if (matchWord(xn, w)) {
        got++;
        score += xn.includes(w) ? 4 : 3;
        // تكرار الكلمة يرفع قليلًا، بسقف: المادة التي موضوعها الكلمة تتكرّر فيها
        const r = wordRe(w).G; r.lastIndex = 0; let k = 0; while (k < 6 && r.exec(xn)) k++;
        score += k * 0.6;
      } else if (matchWord(tn, w)) { got++; score += 2; }
    }
    if (textWords.length && !got) continue;
    if (textWords.length > 1 && got < Math.ceil(textWords.length * 0.6)) continue;
    if (got === textWords.length && textWords.length > 1) {
      // العبارة كما كُتبت أقوى ما يكون، ثم الكلمات متقاربة
      if (xn.includes(textWords.join(' '))) score += 10;
      else if (phraseNear(xn, textWords, 60)) score += 5;
    }
    if (art != null && d.n === art) score += 10;
    // النص القصير الذي فيه كل الكلمات أقرب للمقصود من صفحةٍ طويلة ذُكرت فيها عرضًا
    score -= Math.log2(1 + xn.length / 1500) * 1.5;
    if (d.kind === 'مذكره') score += 1.5;
    if (d.n === 0 || d.kind === 'صفحه') score -= 1;
    hits.push({ d, score });
  }
  hits.sort((a, b) => b.score - a.score);
  return { art, sub, words: textWords, hits: hits.slice(0, limit) };
}
