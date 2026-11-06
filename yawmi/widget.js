// يومي — ويدجت الشاشة الرئيسية في الآيفون، يشتغل في تطبيق Scriptable.
// «يومي» يرفع ملخّص يومك لخادم «مصروف» كلما تغيّر شي، وهذا يقرؤه بالرمز تحت ويرسمه.
// الرمز سرّك: لا تنشر هالملف بعد ما ينحط فيه. ونسخته تجيك جاهزة من إعدادات «يومي».
const TOKEN = '__TOKEN__';
const API = 'https://dynamic-churros-f6908c.netlify.app/yawmi/widget/' + TOKEN + '.json';
const SITE = 'https://jshshsj007-create.github.io/saleh/yawmi/';

// ألوان «يومي» نفسها: فاتح، وليلي لما الجوال ليلي
const C = {
  bg: Color.dynamic(new Color('#f4f5f2'), new Color('#111413')),
  card: Color.dynamic(new Color('#ffffff'), new Color('#1a1e1c')),
  text: Color.dynamic(new Color('#1b1f1d'), new Color('#e9ece9')),
  mute: Color.dynamic(new Color('#6b726e'), new Color('#98a19c')),
  line: Color.dynamic(new Color('#e3e6e1'), new Color('#2a302d')),
  acc: Color.dynamic(new Color('#0f6b4f'), new Color('#3fb98a')),
  ok: Color.dynamic(new Color('#1f8a5b'), new Color('#4cc08e')),
  gold: Color.dynamic(new Color('#b7791f'), new Color('#f2c14e')),
  danger: Color.dynamic(new Color('#c0392b'), new Color('#ef6b5b')),
};
const AR = d => String(d).replace(/\d/g, x => '٠١٢٣٤٥٦٧٨٩'[x]);
const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const say = (k, one, two, few) => k == 1 ? one : k == 2 ? two : k >= 3 && k <= 10 ? `${AR(k)} ${few}` : `${AR(k)} ${one}`;
function hm(t) {
  if (!t) return '';
  let [h, m] = t.split(':').map(Number);
  const pm = h >= 12; h = h % 12 || 12;
  return `${AR(h)}:${AR(String(m).padStart(2, '0'))} ${pm ? 'م' : 'ص'}`;
}

// آخر نسخة تنحفظ في الجوال: لو ما فيه نت، الويدجت يعرض آخر ما وصله بدل ما يفضى
async function load() {
  const fm = FileManager.local(), file = fm.joinPath(fm.documentsDirectory(), 'yawmi-widget.json');
  try {
    const r = new Request(API);
    r.timeoutInterval = 10;
    const j = await r.loadJSON();
    if (j && j.ok) { fm.writeString(file, JSON.stringify(j)); return { ...j, fresh: true }; }
    if (j && j.error === 'not found') return { ok: false, error: 'not found' };
  } catch (e) { }
  if (fm.fileExists(file)) { try { return { ...JSON.parse(fm.readString(file)), fresh: false }; } catch (e) { } }
  return { ok: false, error: 'offline' };
}

// حلقة التقدّم بالرسم، مثل حلقة «جدول اليوم» في الموقع
function ring(frac, size) {
  const ctx = new DrawContext();
  ctx.size = new Size(size, size); ctx.opaque = false; ctx.respectScreenScale = true;
  const lw = size * 0.11, r = (size - lw) / 2, cx = size / 2, cy = size / 2;
  ctx.setStrokeColor(C.line); ctx.setLineWidth(lw);
  ctx.strokeEllipse(new Rect(lw / 2, lw / 2, size - lw, size - lw));
  if (frac > 0) {
    const p = new Path(), steps = Math.max(2, Math.round(80 * frac)), pts = [];
    for (let i = 0; i <= steps; i++) {
      const a = -Math.PI / 2 + 2 * Math.PI * frac * (i / steps);
      pts.push(new Point(cx + r * Math.cos(a), cy + r * Math.sin(a)));
    }
    p.addLines(pts);
    ctx.addPath(p); ctx.setStrokeColor(frac >= 1 ? C.ok : C.acc); ctx.setLineWidth(lw); ctx.strokePath();
  }
  return ctx.getImage();
}

// السطر يمين: Scriptable يرصّ من اليسار، فنبدأ بفراغ يدفع النص لليمين
function rtl(stack) { const s = stack.addStack(); s.layoutHorizontally(); s.centerAlignContent(); s.addSpacer(); return s; }
function text(stack, t, size, color, weight) {
  const x = stack.addText(t);
  x.font = weight === 'bold' ? Font.boldSystemFont(size) : weight === 'semi' ? Font.semiboldSystemFont(size) : Font.systemFont(size);
  x.textColor = color; x.lineLimit = 1; x.minimumScaleFactor = 0.7; x.rightAlignText();
  return x;
}
function taskRow(stack, t, size) {
  const row = rtl(stack);
  if (t.time) { text(row, hm(t.time), size - 2, C.acc, 'semi'); row.addSpacer(6); }
  const x = text(row, t.t, size, t.done ? C.mute : C.text, t.done ? '' : 'semi');
  row.addSpacer(6);
  text(row, t.done ? '✓' : '○', size, t.done ? C.ok : C.mute, 'bold');
  return x;
}

function build(res, family) {
  const w = new ListWidget();
  w.backgroundColor = C.bg;
  w.url = SITE + '?tab=today';
  w.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000);
  const pad = family === 'small' ? 14 : 16;
  w.setPadding(pad, pad, pad, pad);

  if (!res.ok) {
    const h = rtl(w); text(h, 'يومي', 16, C.acc, 'bold');
    w.addSpacer(6);
    const m = rtl(w);
    text(m, res.error === 'not found' ? 'افتح «يومي» مرة عشان يوصل ملخّصك' : 'ما فيه نت، وما وصلني شي للحين', 13, C.mute);
    return w;
  }
  const D = res.data || {}, now = new Date(), today = iso(now);
  const day = (D.days || {})[today] || { tasks: [] };
  const tasks = day.tasks || [], done = tasks.filter(t => t.done).length, left = tasks.length - done;
  const frac = tasks.length ? done / tasks.length : 0;
  const rems = (D.rems || []).filter(r => r.at > now.getTime()).slice(0, 3);
  const dateTxt = `${DAYS[now.getDay()]} ${AR(now.getDate())}/${AR(now.getMonth() + 1)}`;

  // الرأس: «يومي» والتاريخ، ونقطة لو البيانات قديمة (ما فيه نت)
  const head = w.addStack(); head.layoutHorizontally(); head.centerAlignContent();
  text(head, dateTxt, family === 'small' ? 11 : 12, C.mute);
  head.addSpacer();
  text(head, (res.fresh ? '' : '• ') + 'يومي', family === 'small' ? 13 : 14, C.acc, 'bold');
  w.addSpacer(family === 'small' ? 6 : 8);

  const statLine = tasks.length ? (left ? `باقي ${say(left, 'مهمة', 'مهمتين', 'مهام')}` : 'خلّصت كل شي 🎉') : 'ما فيه مهام اليوم';

  if (family === 'small') {
    const top = w.addStack(); top.layoutHorizontally(); top.centerAlignContent();
    const ri = top.addStack(); ri.size = new Size(54, 54);
    ri.backgroundImage = ring(frac, 54); ri.centerAlignContent();
    const pc = ri.addText(AR(Math.round(frac * 100)) + '٪'); pc.font = Font.boldSystemFont(13); pc.textColor = C.text; pc.centerAlignText();
    top.addSpacer(8);
    // عرضٌ ثابت للعمود: Scriptable يعطي العمود عرض أطول سطر فيه، فالسطور القصيرة ما تلصق يمين
    const st = top.addStack(); st.layoutVertically(); st.size = new Size(158 - 28 - 54 - 8, 0);
    const a = rtl(st); text(a, AR(done) + '/' + AR(tasks.length), 20, C.text, 'bold');
    const b = rtl(st); text(b, 'خلّصت', 11, C.mute);
    w.addSpacer(8);
    const l = rtl(w); text(l, statLine, 13, left ? C.acc : C.ok, 'semi');
    const next = tasks.find(t => !t.done);
    if (next) { w.addSpacer(3); const n = rtl(w); text(n, next.t, 12, C.text); }
    else if (rems[0]) { w.addSpacer(3); const n = rtl(w); text(n, '🔔 ' + rems[0].t, 12, C.text); }
    w.addSpacer();
    return w;
  }

  // متوسط وكبير: الحلقة يسار، والمهام يمين
  const body = w.addStack(); body.layoutHorizontally(); body.topAlignContent();
  const left_ = body.addStack(); left_.layoutVertically(); left_.centerAlignContent();
  const ri = left_.addStack(); ri.size = new Size(70, 70); ri.backgroundImage = ring(frac, 70); ri.centerAlignContent();
  const pc = ri.addText(AR(Math.round(frac * 100)) + '٪'); pc.font = Font.boldSystemFont(16); pc.textColor = C.text; pc.centerAlignText();
  left_.addSpacer(4);
  const lt = left_.addText(AR(done) + ' من ' + AR(tasks.length)); lt.font = Font.systemFont(11); lt.textColor = C.mute; lt.centerAlignText();
  body.addSpacer(12);
  const right = body.addStack(); right.layoutVertically(); right.size = new Size(338 - 32 - 70 - 12, 0);
  const s1 = rtl(right); text(s1, statLine, 14, left ? C.acc : C.ok, 'bold');
  right.addSpacer(4);
  const max = family === 'large' ? 5 : rems[0] ? 2 : 3;
  const list = [...tasks.filter(t => !t.done), ...tasks.filter(t => t.done)].slice(0, max);
  for (const t of list) { taskRow(right, t, 13); right.addSpacer(3); }
  if (family === 'large' && tasks.length > max) { const m = rtl(right); text(m, `و${say(tasks.length - max, 'مهمة', 'مهمتين', 'مهام')} غيرها`, 11, C.mute); }

  if (family === 'large') {
    w.addSpacer(10);
    const sep = w.addStack(); sep.size = new Size(0, 1); sep.backgroundColor = C.line;
    w.addSpacer(10);
    if (day.gym) {
      const g = rtl(w);
      text(g, day.gym.total ? `${day.gym.name} · ${AR(day.gym.done)}/${AR(day.gym.total)} تمارين` : day.gym.name, 13, C.text, 'semi');
      g.addSpacer(6); text(g, '🏋️', 13, C.text);
      w.addSpacer(4);
    }
    if (D.streak) { const s = rtl(w); text(s, `🔥 ${say(D.streak, 'يوم', 'يومين', 'أيام')} ورا بعض`, 12, C.gold, 'semi'); w.addSpacer(4); }
    for (const r of rems) {
      const d = new Date(r.at), when = iso(d) === today ? 'اليوم' : DAYS[d.getDay()];
      const x = rtl(w); text(x, `${when} ${hm(String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'))}`, 12, C.mute); x.addSpacer(6); text(x, '🔔 ' + r.t, 12, C.text, 'semi');
      w.addSpacer(3);
    }
    const lg = (D.longs || [])[0];
    if (lg) {
      const k = Math.round((new Date(lg.due + 'T12:00') - new Date(today + 'T12:00')) / 864e5);
      const x = rtl(w); text(x, k < 0 ? `متأخرة ${say(-k, 'يوم', 'يومين', 'أيام')}` : k === 0 ? 'اليوم آخر يوم' : `باقي ${say(k, 'يوم', 'يومين', 'أيام')}`, 12, k < 0 ? C.danger : k <= 3 ? C.gold : C.acc, 'semi');
      x.addSpacer(6); text(x, '🚩 ' + lg.t, 12, C.text);
    }
  } else if (rems[0]) {
    w.addSpacer(6);
    const r = rems[0], d = new Date(r.at);
    const x = rtl(w); text(x, (iso(d) === today ? '' : DAYS[d.getDay()] + ' ') + hm(String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')), 11, C.mute); x.addSpacer(6); text(x, '🔔 ' + r.t, 12, C.text, 'semi');
  }
  w.addSpacer();
  return w;
}

const res = await load();
const family = config.runsInWidget ? config.widgetFamily : 'medium';
const widget = build(res, family);
if (config.runsInWidget) Script.setWidget(widget);
else if (family === 'small') await widget.presentSmall();
else if (family === 'large') await widget.presentLarge();
else await widget.presentMedium();
Script.complete();
