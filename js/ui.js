/* UI 层：只负责渲染和输入。所有规则都在 engine.js 里。 */
(function () {
  'use strict';
  const C = window.CONTENT, Eng = window.Engine;
  const app = document.getElementById('app');
  const SAVE_KEY = 'reallife_demo_save_v2';

  let S = null;             // 游戏状态
  let verb = null;          // 当前展开的动词
  let pending = null;       // 待选择
  let market = null;        // 行情窗口：{ trading, sel, msg }
  let screen = 'start';

  const esc = (t) => String(t == null ? '' : t).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const money = (n) => (Math.abs(n) >= 10000 ? (n / 10000).toFixed(Math.abs(n) % 10000 === 0 ? 0 : 1) + '万' : String(Math.round(n)));
  const px = (v) => (v >= 100 ? String(Math.round(v)) : v.toFixed(2));
  const STAGE = { hs: '高中', uni: '大学', work: '工作', gap: '待业', dead: '——' };
  const MAIN_VERB = { hs: '学习', uni: '学习', work: '工作', gap: '工作' };

  /* ══════════════ 开局 ══════════════ */
  let cfg = { bgId: 'worker', talent: 'random', name: '', seed: (Math.random() * 1e9) | 0 };

  function renderStart() {
    app.innerHTML = `
      <h1>人 生 模 拟 器</h1>
      <div class="sub">DEMO v0.2 &nbsp;·&nbsp; 16 岁 → 26 岁 &nbsp;·&nbsp; 一格时间 = 一个月 = 干一件事</div>

      <div class="card">
        <div class="hd"><div class="t">出身</div><div class="a">你不能选的东西，恰恰决定最多</div></div>
        <div class="pick">${C.BACKGROUNDS.map((b) => `
          <button class="pk ${cfg.bgId === b.id ? 'on' : ''}" data-bg="${b.id}">
            ${b.name}<span class="d">${esc(b.desc)}</span>
            ${b.note ? `<span class="n">${esc(b.note)}</span>` : ''}
          </button>`).join('')}</div>
      </div>

      <div class="card">
        <div class="hd"><div class="t">天赋</div><div class="a">不显示数值，只在结果上体现</div></div>
        <div class="pick">
          <button class="pk ${cfg.talent === 'random' ? 'on' : ''}" data-tal="random">随机<span class="d">大概率什么天赋都没有。绝大多数人是这样。</span></button>
          ${C.TALENTS.map((t) => `<button class="pk ${cfg.talent === t.id ? 'on' : ''}" data-tal="${t.id}">${t.name}<span class="d">${esc(t.desc)}</span></button>`).join('')}
        </div>
      </div>

      <div class="card">
        <div class="foot">
          <span class="lbl">名字</span><input type="text" id="nm" placeholder="留空则随机" value="${esc(cfg.name)}">
          <span class="lbl">种子</span><input type="text" id="sd" style="width:112px" value="${cfg.seed}">
          <button class="btn main" id="go">开 始</button>
          ${localStorage.getItem(SAVE_KEY) ? '<button class="btn" id="ld">读取存档</button>' : ''}
        </div>
        <div class="note">同一个种子 + 同样的选择 = 完全相同的一生。改一个选择，看看会走到哪。</div>
      </div>`;

    app.querySelectorAll('[data-bg]').forEach((b) => { b.onclick = () => { cfg.bgId = b.dataset.bg; renderStart(); }; });
    app.querySelectorAll('[data-tal]').forEach((b) => { b.onclick = () => { cfg.talent = b.dataset.tal; renderStart(); }; });
    app.querySelector('#go').onclick = () => {
      cfg.name = app.querySelector('#nm').value.trim();
      const sd = parseInt(app.querySelector('#sd').value, 10);
      cfg.seed = isNaN(sd) ? (Math.random() * 1e9) | 0 : sd;
      S = Eng.newGame(cfg); verb = null; pending = null; market = null; screen = 'game'; render();
    };
    const ld = app.querySelector('#ld');
    if (ld) ld.onclick = () => {
      try {
        const s = Eng.load(localStorage.getItem(SAVE_KEY));
        if (!s.market) throw new Error('旧版本存档，格式已经变了');
        S = s; screen = 'game'; verb = null; pending = null; market = null; render();
      } catch (e) { alert('存档读不了：' + e.message); }
    };
  }

  /* ══════════════ 左：状态栏 ══════════════ */
  function panel() {
    const p = S.p, city = C.CITIES[p.city];
    const tone = (v, inv) => { const x = inv ? 100 - v : v; return x > 65 ? 'var(--gain)' : x > 35 ? 'var(--loss)' : 'var(--alarm)'; };
    const inc = p.job ? p.net : (S.stage === 'hs' || S.stage === 'uni' ? p.allowance : 0);

    const rows = [
      ['姓名', p.name + ' · ' + p.gender],
      ['城市', city.name],
      ['学历', S.stage === 'hs' ? C.HS_SCHOOLS[p.hs].name : (p.schoolName ? p.schoolName + ' · ' + p.edu : p.edu)],
      ...(p.major ? [['专业', C.MAJOR_MAP[p.major].name]] : []),
      ['职业', p.jobName || (S.stage === 'hs' ? '学生' : S.stage === 'uni' ? '大学生' : '无')],
      ...(p.track ? [['职级', `第 ${p.rank + 1} / ${C.TRACK_MAP[p.track].ranks.length} 格 · 已 ${Math.floor((p.rankMonths || 0) / 12)} 年`]] : []),
      ['月收入', p.job ? money(p.net) + '（税前 ' + money(p.gross) + '）' : (inc ? money(inc) : '0')],
      ['存款', money(p.cash)],
      ['负债', p.debt > 0 ? money(p.debt) + '（' + p.debtKind + '）' : '—'],
      ['住房', p.housing],
      ['户籍', p.hukou + ' · ' + C.CITIES[S.family.home].name],
      ['婚恋', p.partner ? ((S.npcs.find((n) => n.id === p.partner) || {}).name || '有') : '单身'],
    ];

    const skills = Object.keys(p.skills).map((k) => {
      let w;
      if (k === '学业' && S.stage === 'hs') {
        // 第128章：你不知道自己确切什么水平，只知道上次模考排第几
        w = p.mock ? `年级 ${p.mock.rank} / ${p.mock.size}<em>${p.mock.year}.${String(p.mock.month).padStart(2, '0')} 模考</em>`
                   : '还没考过模考';
      } else if (k === '学业' && p.gaokao) {
        w = `高考 ${p.gaokao} 分`;
      } else if (k === '专业') {
        if (!p.major) { w = '还没有专业'; }
        else {
          const lv = C.majorLevel(p.majorExp), pr = C.majorProgress(p.majorExp);
          w = `${C.LEVEL_NAMES[lv - 1]}<em>${C.MAJOR_MAP[p.major].name} · ${lv} 级`
            + (lv < 10 ? `　<span class="pbar"><i style="width:${Math.round(pr * 100)}%"></i></span>` : '　已到顶')
            + '</em>';
        }
      } else {
        w = esc(C.skillWord(k, p.skills[k]));
      }
      return `<div class="sk"><span class="n">${k}</span><span class="w">${w}</span></div>`;
    }).join('');

    const dis = p.diseases.map((d) => `<span class="chip bad">${C.DISEASE_MAP[d.id].name}</span>`).join('') || '<span class="chip">无</span>';
    const hpTone = (v) => (v > 65 ? 'var(--ink2)' : v > 45 ? 'var(--loss)' : 'var(--alarm)');
    const fam = S.npcs.filter((n) => n.family).map((n) => {
      if (!n.alive) return `<div class="fam"><span class="who">${n.kind}</span><span class="hp">已故</span></div>`;
      return `<div class="fam">
        <span class="who">${n.kind}<em>${n.age} 岁</em></span>
        <span class="hp" style="color:${hpTone(n.health)}">健康 ${Math.round(n.health)}</span>
        <span class="job">${n.retired ? '已退休' : esc(n.job)} · ${n.retired ? '养老金' : '月入'} ${money(n.income)}${n.sick ? ' · <b>' + esc(n.sick) + '</b>' : ''}</span>
      </div>`;
    }).join('');

    return `<div class="card side">
      <div class="hd"><div class="t">${S.year} 年 ${S.month} 月</div><div class="a">${p.age} 岁 · ${STAGE[S.stage]}</div></div>
      ${rows.map((r) => `<div class="row"><span class="k">${r[0]}</span><span class="v">${esc(r[1])}</span></div>`).join('')}

      <div class="sect">
        <div class="bar"><i style="width:${Math.max(0, Math.min(100, p.health))}%;background:${tone(p.health)}"></i></div>
        <div class="barlab"><span>健康</span><span>${Math.round(p.health)} / 100</span></div>
        <div class="bar" style="margin-top:10px"><i style="width:${Math.max(0, Math.min(100, p.stress))}%;background:${tone(p.stress, true)}"></i></div>
        <div class="barlab"><span>压力</span><span>${Math.round(p.stress)} / 100${p.stress > 80 ? ' · 濒临' : p.stress > 60 ? ' · 紧绷' : ''}</span></div>
        <div style="margin-top:9px">${dis}</div>
      </div>

      <div class="sect"><div class="h">你 大 概 是 这 样 的 人</div>${skills}
        ${S.stage === 'hs' ? `<div class="schnote">${esc(C.HS_SCHOOLS[p.hs].note)}</div>` : ''}
      </div>
      <div class="sect"><div class="h">家 庭</div>${fam}
        <div class="row"><span class="k">家底</span><span class="v">${money(S.family.cash)}${
          S.family.flow !== undefined
            ? ` <span class="${S.family.flow >= 0 ? 'up' : 'dn'}">${S.family.flow >= 0 ? '+' : '−'}${money(Math.abs(S.family.flow))}/月</span>`
            : ''}</span></div>
      </div>
    </div>`;
  }

  /* ══════════════ 中：时间流 ══════════════ */
  function entry(h, cur) {
    const rum = (h.rumors || []).map((r) =>
      `<div class="rum"><span class="s">【${r.label}】</span><span class="rt">${esc(r.text)}</span><span class="st">${'★'.repeat(r.stars)}${'☆'.repeat(3 - r.stars)}</span></div>`).join('');
    const msgs = h.msgs.length
      ? h.msgs.map((m) => `<div class="msg${/【|——/.test(m) ? ' hi' : ''}">${esc(m)}</div>`).join('')
      : (rum ? '' : '<div class="msg empty">这个月没有发生什么。</div>');
    const flow = h.flow && h.flow.length
      ? '<div class="flow">' + h.flow.map((f) => `<span class="${f.n >= 0 ? 'p' : 'm'}">${esc(f.note)} ${f.n >= 0 ? '+' : '−'}${money(Math.abs(f.n))}</span>`).join('') + '</div>'
      : '';
    return `<div class="ent${cur ? ' cur' : ''}">
      <div class="month">${h.year} 年 ${String(h.month).padStart(2, '0')} 月 · ${h.age} 岁${h.action ? ' &nbsp;·&nbsp; ' + esc(h.action) : ''}</div>
      ${msgs}${rum}${flow}
    </div>`;
  }

  function feed() {
    const hist = S.history.slice(-80).reverse();
    if (!hist.length) {
      return `<div class="card feedcard">
        <div class="hd"><div class="t">发生过的事</div><div class="a">最近的在最上面 · 往下翻能看到更早的月份</div></div>
        <div class="scroll"><div class="ent cur">
          <div class="msg">${esc(S.log.length ? S.log[0].text : '')}</div>
          <div class="msg empty">选一件事，把这个月过掉。</div>
        </div></div></div>`;
    }
    return `<div class="card feedcard">
      <div class="hd"><div class="t">发生过的事</div><div class="a">最近的在最上面 · 往下翻能看到更早的月份</div></div>
      <div class="scroll">${hist.map((h, i) => entry(h, i === 0)).join('')}</div>
    </div>`;
  }

  /* ══════════════ 中：行动 ══════════════ */
  function actionArea() {
    const acts = Eng.actionsFor(S);
    const verbs = [];
    acts.forEach((a) => { if (verbs.indexOf(a.verb) < 0) verbs.push(a.verb); });
    const main = MAIN_VERB[S.stage];
    if (!verb || verbs.indexOf(verb) < 0) verb = verbs.indexOf(main) >= 0 ? main : verbs[0];

    const lastId = S.p._lastAction;
    const lastAct = lastId && acts.find((a) => a.id === lastId);

    return `<div class="card">
      <div class="hd"><div class="t">这个月你要做什么</div><div class="a">一格时间 = 一件事</div></div>
      <div class="verbs">${verbs.map((v) =>
        `<button class="verb ${verb === v ? 'on' : ''}${v === main ? ' key' : ''}" data-v="${v}">${v}</button>`).join('')}</div>
      <div class="acts">${promoRow()}${acts.filter((a) => a.verb === verb).map((a) => {
        if (a.id === 'work_promo') {
          const pc = Eng.promoChance(S);
          if (pc) {
            const pay = Math.round(pc.next.gross * C.CITIES[S.p.city].salaryMul);
            return `<button class="act promo" data-a="${a.id}">争取晋升 · 升 ${esc(pc.next.name)}
              <span class="pr">${Math.round(pc.chance * 100)}%</span>
              <span class="hint"><b>${money(pay)}</b>　${esc(pc.next.blurb)}</span>
              <span class="hint tr">代价：${esc(pc.next.trap)}</span>
              <span class="hint wy">${pc.parts.slice(0, 3).map((x) =>
                `${esc(x.label)} ${x.v >= 0 ? '+' : '−'}${Math.round(Math.abs(x.v) * 100)}`).join('　')}</span>
            </button>`;
          }
        }
        return `<button class="act" data-a="${a.id}">${a.label}${a.hint ? `<span class="hint">${esc(a.hint)}</span>` : ''}</button>`;
      }).join('')}</div>
      <div class="foot">
        ${lastAct ? `<button class="btn main" data-a="${lastId}">沿用上月：${lastAct.label} →</button>` : ''}
        <button class="btn" id="mkt">行情</button>
        <button class="btn" id="tl">年表</button>
        <button class="btn" id="sv">存档</button>
        <button class="btn" id="rs">重开</button>
        <span class="tick">第 ${S.tick + 1} 格 · 种子 ${S.seed}</span>
      </div></div>`;
  }

  /* 「争取晋升」这一行永远在工作栏里。
     点不了的时候要说清楚是为什么 —— 按钮凭空消失比按不动更让人困惑。 */
  function promoRow() {
    if (verb !== '工作') return '';
    const st = Eng.promoStatus(S);
    if (st.state === 'nojob' || st.state === 'ok') return '';   // ok 由下面的正常按钮渲染
    if (st.state === 'cooling') {
      const n = st.info;
      return `<div class="act promo off">争取晋升 · 冷却中
        <span class="pr">${st.months} 月</span>
        <span class="hint">上次没成。领导那边的话还没过去，再等 ${st.months} 个月才好再提。</span>
        ${n ? `<span class="hint wy">下一格是${esc(n.next.name)} · 到时候大约 ${Math.round(n.chance * 100)}%</span>` : ''}
      </div>`;
    }
    const head = st.state === 'top'
      ? `到顶了 · ${esc(st.track.name)}线第 ${S.p.rank + 1} / ${st.track.ranks.length} 格`
      : '这个岗位没有台阶';
    return `<div class="act promo off">${head}
      <span class="hint tr">${esc(st.why)}</span>
      <span class="hint wy">想往上走，只能换一条线 —— 去「工作 · 投简历面试」看看别的位置。</span>
    </div>`;
  }

  /* ══════════════ 折线图 ══════════════ */
  function lineChart(vals, opt) {
    opt = opt || {};
    const W = 560, H = opt.h || 150, PL = 54, PR = 12, PT = 12, PB = 20;
    if (!vals || vals.length < 2) return '<div class="chart empty">还没有足够的数据。</div>';
    const iw = W - PL - PR, ih = H - PT - PB;
    let lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    if (opt.zero) { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
    if (hi - lo < 1e-9) hi = lo + Math.abs(lo || 1) * 0.1 + 1;
    const pad = (hi - lo) * 0.12; lo -= pad; hi += pad;
    const X = (i) => PL + (i / (vals.length - 1)) * iw;
    const Y = (v) => PT + (1 - (v - lo) / (hi - lo)) * ih;
    const fmt = (v) => (Math.abs(v) >= 10000 ? (v / 10000).toFixed(1) + '万' : (Math.abs(v) >= 100 ? String(Math.round(v)) : v.toFixed(2)));
    const d = vals.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ',' + Y(v).toFixed(1)).join(' ');
    const base = opt.zero ? 0 : lo;
    const area = d + ' L' + X(vals.length - 1).toFixed(1) + ',' + Y(base).toFixed(1) + ' L' + X(0).toFixed(1) + ',' + Y(base).toFixed(1) + ' Z';
    const up = vals[vals.length - 1] >= (opt.zero ? 0 : vals[0]);
    const col = up ? 'var(--gain)' : 'var(--alarm)';
    const zeroLine = opt.zero
      ? `<line x1="${PL}" y1="${Y(0).toFixed(1)}" x2="${W - PR}" y2="${Y(0).toFixed(1)}" stroke="var(--line2)" stroke-width="1" stroke-dasharray="3 3"></line>`
      : '';
    return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" preserveAspectRatio="none" role="img" aria-label="${esc(opt.label || '走势')}">
      <line x1="${PL}" y1="${PT}" x2="${PL}" y2="${PT + ih}" stroke="var(--line)" stroke-width="1"></line>
      <line x1="${PL}" y1="${PT + ih}" x2="${W - PR}" y2="${PT + ih}" stroke="var(--line)" stroke-width="1"></line>
      ${zeroLine}
      <path d="${area}" fill="${col}" opacity="0.10"></path>
      <path d="${d}" fill="none" stroke="${col}" stroke-width="1.7" stroke-linejoin="round"></path>
      <circle cx="${X(vals.length - 1).toFixed(1)}" cy="${Y(vals[vals.length - 1]).toFixed(1)}" r="3" fill="${col}"></circle>
      <text x="${PL - 7}" y="${PT + 4}" class="ax" text-anchor="end">${fmt(hi)}</text>
      <text x="${PL - 7}" y="${(PT + ih + 4).toFixed(1)}" class="ax" text-anchor="end">${fmt(lo)}</text>
      ${opt.zero ? `<text x="${PL - 7}" y="${(Y(0) + 3.5).toFixed(1)}" class="ax" text-anchor="end">0</text>` : ''}
      <text x="${PL}" y="${H - 5}" class="ax">${esc(opt.x0 || '')}</text>
      <text x="${W - PR}" y="${H - 5}" class="ax" text-anchor="end">${esc(opt.x1 || '现在')}</text>
    </svg></div>`;
  }

  function spark(vals) {
    if (!vals || vals.length < 2) return '<span class="spk"></span>';
    const v = vals.slice(-24), W = 76, H = 20;
    const lo = Math.min.apply(null, v), hi = Math.max.apply(null, v), rg = (hi - lo) || 1;
    const d = v.map((x, i) => (i ? 'L' : 'M') + (i / (v.length - 1) * W).toFixed(1) + ',' + (H - 2 - ((x - lo) / rg) * (H - 4)).toFixed(1)).join(' ');
    const col = v[v.length - 1] >= v[0] ? 'var(--gain)' : 'var(--alarm)';
    return `<svg class="spk" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><path d="${d}" fill="none" stroke="${col}" stroke-width="1.3"></path></svg>`;
  }

  /* ══════════════ 行情窗口 ══════════════ */
  function openMarket(trading) {
    market = { trading: !!trading, sel: (market && market.sel) || 'fund', msg: '' };
    renderMarket();
  }

  function renderMarket() {
    document.querySelectorAll('.mask').forEach((m) => m.remove());
    const H = S.holdings, M = S.market;
    const val = Eng.portfolioValue(S);
    const pnl = Math.round(val - H.netIn);
    const series = H.pnl.slice(-60).map((x) => x.v - x.n);
    const inst = C.INSTRUMENT_MAP[market.sel];
    const hist = (M.hist[market.sel] || []).slice(-60);
    const pos = H.pos[market.sel] || { shares: 0, cost: 0 };
    const posVal = pos.shares * (M.px[market.sel] || 0);
    // 不占格子的钱 —— 这个游戏真正想让你盯着的那一行
    const passive = Math.round(C.INSTRUMENTS.reduce((a, x) => {
      const q = H.pos[x.id];
      return a + (q && !M.delisted[x.id] ? q.shares * M.px[x.id] * x.drift : 0);
    }, 0));

    const rows = C.INSTRUMENTS.map((x) => {
      const q = H.pos[x.id] || { shares: 0 };
      const v = q.shares * M.px[x.id];
      const dead = M.delisted[x.id];
      return `<button class="irow${market.sel === x.id ? ' on' : ''}${dead ? ' dead' : ''}" data-i="${x.id}">
        <span class="nm">${x.name}<em>${x.sector}</em></span>
        ${spark(M.hist[x.id])}
        <span class="pxv">${dead ? '退市' : px(M.px[x.id])}</span>
        <span class="hold">${v > 1 ? money(v) : '—'}</span>
      </button>`;
    }).join('');

    const amounts = [5000, 10000, 30000, 100000];
    const tradebar = market.trading ? `
      <div class="tradebar">
        ${amounts.map((a) => `<button class="btn sm" data-buy="${a}"${S.p.cash < a ? ' disabled' : ''}>买 ${money(a)}</button>`).join('')}
        <button class="btn sm" data-buy="half"${S.p.cash < 200 ? ' disabled' : ''}>买 一半现金</button>
        <button class="btn sm sell" data-sell="all"${pos.shares <= 0 ? ' disabled' : ''}>全部卖出</button>
      </div>`
      : '<div class="note">这是只读行情。要真的买卖，用「搞钱 → 投资」花掉这一格。</div>';

    const m = document.createElement('div');
    m.className = 'mask';
    m.innerHTML = `<div class="modal wide">
      <h2>行情</h2>
      <div class="tier">${market.trading ? '本月你在看盘 · 可以买卖' : '只读'} · 现金 ${money(S.p.cash)}</div>

      <div class="mkhead">
        <div><span class="lb">持仓市值</span><b>${money(Math.round(val))}</b></div>
        <div><span class="lb">累计投入</span><b>${money(Math.round(H.netIn))}</b></div>
        <div><span class="lb">总盈亏</span><b class="${pnl >= 0 ? 'up' : 'dn'}">${pnl >= 0 ? '+' : '−'}${money(Math.abs(pnl))}</b></div>
        <div><span class="lb">不占格子的钱</span><b class="${passive >= 0 ? 'up' : 'dn'}">${passive >= 0 ? '+' : '−'}${money(Math.abs(passive))}/月</b></div>
      </div>
      ${series.length > 1 && series.some((v) => Math.abs(v) > 0.5)
        ? lineChart(series, { zero: true, h: 128, label: '总盈亏走势', x0: '开户', x1: '现在' })
        : '<div class="chart empty">' + (H.netIn > 0 ? '刚建仓，还没有盈亏可看。' : '你还没有买过任何东西。') + '</div>'}

      <div class="mkgrid">
        <div class="ilist">${rows}</div>
        <div class="idet">
          <div class="ihd">${inst.name}<em>${inst.sector} · ${inst.kind}</em></div>
          ${lineChart(hist, { h: 128, label: inst.name + ' 走势', x0: '两年前', x1: '现价 ' + px(M.px[inst.id]) })}
          <div class="blurb">${esc(inst.blurb)}</div>
          <div class="mypos">${pos.shares > 0
            ? '持有 ' + money(Math.round(posVal)) + '（成本 ' + money(Math.round(pos.cost)) + '，<span class="' + (posVal >= pos.cost ? 'up' : 'dn') + '">'
              + (posVal >= pos.cost ? '浮盈' : '浮亏') + ' ' + money(Math.abs(Math.round(posVal - pos.cost))) + '</span>）'
            : '没有持仓'}</div>
          ${tradebar}
          ${market.msg ? `<div class="mkmsg">${esc(market.msg)}</div>` : ''}
        </div>
      </div>

      <div class="foot" style="margin-top:14px">
        <button class="btn main" id="mkdone">${market.trading ? '看完了，这个月过去了' : '关闭'}</button>
        <span class="note" style="margin:0">别人说的话不是信息。走势图也只画到今天为止。</span>
      </div>
    </div>`;
    document.body.appendChild(m);

    m.querySelectorAll('[data-i]').forEach((b) => { b.onclick = () => { market.sel = b.dataset.i; market.msg = ''; renderMarket(); }; });
    m.querySelectorAll('[data-buy]').forEach((b) => {
      b.onclick = () => {
        const v = b.dataset.buy === 'half' ? Math.round(S.p.cash / 2) : +b.dataset.buy;
        market.msg = Eng.trade(S, market.sel, v).msg; renderMarket();
      };
    });
    m.querySelectorAll('[data-sell]').forEach((b) => {
      b.onclick = () => { market.msg = Eng.trade(S, market.sel, 0, true).msg; renderMarket(); };
    });
    m.querySelector('#mkdone').onclick = () => {
      const wasTrading = market.trading;
      market = null; m.remove();
      if (wasTrading && pending) { pending = null; advance(Eng.choose(S, 0)); }
      else render();
    };
  }

  /* ══════════════ 岗位板：可投 / 够不着 / ??? ══════════════ */
  let board = null;

  const INT_WORD = ['', '清闲', '正常', '忙', '996'];

  function openBoard() { board = { sel: null, msg: '', applied: 0 }; renderBoard(); }

  function renderBoard() {
    document.querySelectorAll('.mask').forEach((m) => m.remove());
    const b = Eng.jobBoard(S), p = S.p;
    const city = C.CITIES[p.city];
    const lv = p.major ? C.majorLevel(p.majorExp) : 0;
    const myField = p.major ? C.MAJOR_MAP[p.major].field : null;
    const myInds = (C.FIELD_IND[myField] || []);

    // 对口程度：0 正好对口 / 1 同方向 / 2 行业对口 / 3 不相关
    const fitOf = (j) => {
      if (j.majors.length && j.majors.indexOf(p.major) >= 0) return 0;
      if (j.majors.length) return 1;
      if (myInds.indexOf(j.ind) >= 0) return 2;
      return 3;
    };
    const FIT_TAG = ['对口', '跨专业', '沾边', ''];

    const open = b.open.map((x) => {
      const est = Eng.applyJob(S, x.job);
      return { job: x.job, fit: fitOf(x.job), chance: est.chance, est,
               pay: Math.round(x.job.gross * city.salaryMul) };
    }).sort((a, c2) => a.fit - c2.fit || c2.pay - a.pay);

    const locked = b.locked.map((x) => ({ ...x, fit: fitOf(x.job) }))
      .sort((a, c2) => a.gates.length - c2.gates.length || a.fit - c2.fit || c2.job.gross - a.job.gross);

    if (!board.sel && open.length) board.sel = open[0].job.id;

    const openRows = open.map((o) => `
      <button class="jr${board.sel === o.job.id ? ' on' : ''} f${o.fit}" data-j="${o.job.id}">
        <span class="t">${esc(o.job.name)}${o.fit < 3 ? `<em class="tag t${o.fit}">${FIT_TAG[o.fit]}</em>` : ''}</span>
        <span class="p">${money(o.pay)}</span>
        <span class="c">${Math.round(o.chance * 100)}%</span>
        <span class="s">${o.job.ind} · ${INT_WORD[o.job.intensity]}${o.job.shebao ? '' : ' · 无社保'}${o.job.hazard ? ' · 工伤风险' : ''}</span>
      </button>`).join('') || '<div class="jempty">你现在一个岗位都投不了。</div>';

    const lockRows = locked.slice(0, 40).map((x) => {
      const r = Eng.rumoredPay(S, x.job, x.via);
      const g0 = x.gates[0];
      return `<div class="jr lock f${x.fit}">
        <span class="t">${esc(x.job.name)}</span>
        <span class="p dim">${money(r.lo)}–${money(r.hi)}</span>
        <span class="c dim">传闻</span>
        <span class="s"><i>${esc(g0.text)}</i>${x.gates.length > 1 ? `<em>还差 ${x.gates.length - 1} 项</em>` : ''}</span>
      </div>`;
    }).join('') || '<div class="jempty">没有你够不着的位置 —— 也可能只是你还没看见。</div>';

    const unk = Object.keys(b.unknown).map((ind) =>
      `<div class="jr unk"><span class="t">? ? ?</span><span class="p dim"></span><span class="c dim"></span>
       <span class="s">${ind} · 这行还有你不知道的位置</span></div>`).join('');

    const sel = board.sel ? open.find((o) => o.job.id === board.sel) : null;
    const detail = sel ? `
      <div class="jdn">${esc(sel.job.name)}${sel.fit < 3 ? `<em class="tag t${sel.fit}">${FIT_TAG[sel.fit]}</em>` : ''}</div>
      <div class="jmeta">${sel.job.ind} · ${INT_WORD[sel.job.intensity]} · 声望 ${'★'.repeat(sel.job.prestige)}${sel.job.shebao ? ' · 有社保' : ' · 无社保'}</div>
      <div class="jpay"><b>${money(sel.pay)}</b><span>税前 · 到手约 ${money(Eng.netFromGross(sel.pay))}</span></div>
      ${sel.job.track ? `<div class="jtrack">这是一条职业线的第一格 · 共 ${C.TRACK_MAP[sel.job.track].ranks.length} 格</div>` : ''}
      <div class="jblurb">${esc(sel.job.blurb)}</div>
      <div class="jtrap">代价：${esc(sel.job.trap)}</div>
      <div class="why">${sel.est.parts.map((x) =>
        `<span class="${x.v >= 0 ? 'p' : 'm'}">${esc(x.label)} <b>${x.v >= 0 ? '+' : '−'}${Math.round(Math.abs(x.v) * 100)}</b></span>`).join('')}</div>
      ${board.msg ? `<div class="mkmsg">${esc(board.msg)}</div>` : ''}
      <button class="btn main wide" id="japply">投这个 · 录用率 ${Math.round(sel.chance * 100)}%</button>
      <div class="note">投中直接入职。投不中，这个月还能接着投别的。</div>`
      : `<div class="jempty">左边选一个。</div>${board.msg ? `<div class="mkmsg">${esc(board.msg)}</div>` : ''}`;

    const m = document.createElement('div');
    m.className = 'mask';
    m.innerHTML = `<div class="modal wide board">
      <h2>找工作</h2>
      <div class="tier">${city.name} · ${p.edu}${p.major ? ' · ' + C.MAJOR_MAP[p.major].name + ' ' + lv + ' 级' : ''} · 已投 ${board.applied} 份</div>
      <div class="bgrid">
        <div class="bleft">
          <div class="jhead"><span>可以投 ${open.length}</span><span class="rt">底薪　录用率</span></div>
          ${openRows}
          <div class="jhead lk"><span>看得见 · 够不着 ${locked.length}</span><span class="rt">传闻区间</span></div>
          ${lockRows}
          ${unk ? `<div class="jhead lk"><span>还没发现</span></div>${unk}` : ''}
        </div>
        <div class="bright">${detail}</div>
      </div>
      <div class="foot" style="margin-top:12px">
        <button class="btn main" id="jdone">结束这个月</button>
        <span class="note" style="margin:0">薪资只有你够得着的才是真数。别人说的是传闻。</span>
      </div>
    </div>`;
    document.body.appendChild(m);

    m.querySelectorAll('[data-j]').forEach((btn) => {
      btn.onclick = () => { board.sel = btn.dataset.j; board.msg = ''; renderBoard(); };
    });
    const ap = m.querySelector('#japply');
    if (ap) ap.onclick = () => {
      const r = Eng.submitApply(S, board.sel);
      board.applied++; board.msg = r.msg;
      if (r.ok) { board = null; m.remove(); pending = null; advance(Eng.choose(S, 0)); return; }
      renderBoard();
    };
    m.querySelector('#jdone').onclick = () => {
      board = null; m.remove();
      if (pending) { pending = null; advance(Eng.choose(S, 0)); } else render();
    };
  }

  /* ══════════════ 渲染 ══════════════ */
  function render() {
    document.querySelectorAll('.mask').forEach((m) => m.remove());
    if (screen === 'start') return renderStart();
    if (screen === 'end') return renderEnd();

    app.innerHTML = `<h1>人 生 模 拟 器</h1><div class="sub">DEMO v0.2 · 16 → 26 岁</div>
      <div class="grid"><div>${panel()}</div><div>${feed()}${actionArea()}</div></div>`;

    app.querySelectorAll('[data-v]').forEach((b) => { b.onclick = () => { verb = b.dataset.v; render(); }; });
    app.querySelectorAll('[data-a]').forEach((b) => { b.onclick = () => advance(Eng.step(S, b.dataset.a)); });
    app.querySelector('#mkt').onclick = () => openMarket(false);
    app.querySelector('#tl').onclick = showTimeline;
    app.querySelector('#sv').onclick = () => { localStorage.setItem(SAVE_KEY, Eng.save(S)); toast('已存档'); };
    app.querySelector('#rs').onclick = () => { if (confirm('重新开始？当前进度不会保存。')) { screen = 'start'; render(); } };

    if (board) renderBoard();
    else if (market) renderMarket();
    else if (pending) renderModal();
  }

  function advance(r) {
    if (!r || r.error) return;
    if (r.need === 'choice') {
      pending = r.choice;
      if (r.choice.kind === 'market') { openMarket(true); return; }
      if (r.choice.kind === 'jobs') { openBoard(); return; }
      render(); return;
    }
    pending = null;
    if (r.dead || S.p.age >= 26) screen = 'end';
    render();
  }

  function renderModal() {
    const ch = pending;
    const m = document.createElement('div');
    m.className = 'mask';
    m.innerHTML = `<div class="modal">
      <h2>${esc(ch.title)}</h2>
      <div class="tier">${ch.tier === 'gate' ? '关口' : ch.tier === 'situation' ? '境遇 · 由你的位置触发'
        : ch.tier === 'social' ? '人际' : ch.tier === 'accident' ? '意外' : '选择'}</div>
      <div class="body">${esc(ch.text)}</div>
      ${ch.options.map((o, i) => `<button class="opt" data-i="${i}">${esc(o.label)}${o.sub ? `<span class="s">${esc(o.sub)}</span>` : ''}</button>`).join('')}
    </div>`;
    document.body.appendChild(m);
    m.querySelectorAll('[data-i]').forEach((b) => {
      b.onclick = () => { const i = +b.dataset.i; m.remove(); pending = null; advance(Eng.choose(S, i)); };
    });
  }

  /* ══════════════ 年表 / 结局 ══════════════ */
  function showTimeline() {
    const m = document.createElement('div');
    m.className = 'mask';
    m.innerHTML = `<div class="modal"><h2>年表</h2><div class="tier">你这一生到目前为止</div>
      ${S.log.map((l) => `<div class="tl"><span class="y">${l.year}.${String(l.month).padStart(2, '0')} · ${l.age}岁</span><span>${esc(l.text)}</span></div>`).join('')}
      <button class="btn" style="margin-top:14px" id="cl">关闭</button></div>`;
    document.body.appendChild(m);
    m.querySelector('#cl').onclick = () => m.remove();
  }

  function renderEnd() {
    const p = S.p, H = S.holdings;
    const seenTxt = {};
    const rum = (S.rumorLog || []).filter((r) => (seenTxt[r.text + r.truth] ? false : (seenTxt[r.text + r.truth] = 1)))
      .slice(-22).map((r) =>
      `<div class="rev"><span style="color:var(--note)">【${r.label}】</span> ${esc(r.text)}
        <span class="${r.truth ? 'T' : 'F'}">— ${r.truth ? '这是真的' : '这是假的'}</span></div>`).join('')
      || '<div class="rev empty">没有记录。</div>';

    const owed = S.npcs.filter((n) => n.owesYou > 0);
    const gone = S.npcs.filter((n) => !n.family && n.close <= 3);
    const hidden = [];
    if (p._fanCap) hidden.push('你做直播那阵子，那个账号的天花板其实是 ' + p._fanCap + ' 个粉丝。你当时不知道。');
    if (owed.length) hidden.push(owed.map((n) => n.name).join('、') + '欠你的钱，最后也没还。');
    if (gone.length) hidden.push(gone.slice(0, 3).map((n) => n.name).join('、') + '和你彻底断了联系。你说不出是哪一年开始的。');
    const alive = C.INSTRUMENTS.filter((x) => !S.market.delisted[x.id]);
    const best = alive.slice().sort((a, b) => (S.market.px[b.id] / b.p0) - (S.market.px[a.id] / a.p0))[0];
    if (best) {
      const held = H.pos[best.id] && H.pos[best.id].shares > 0;
      hidden.push('这些年涨得最多的是' + best.name + '，' + (S.market.px[best.id] / best.p0).toFixed(1) + ' 倍。' + (held ? '你手上有。' : '你一股也没买。'));
    }
    const bestInd = C.INDUSTRIES.slice().sort((a, b) => S.world.ind[b] - S.world.ind[a])[0];
    hidden.push('最后这一年，最景气的行业是' + bestInd + '。' + (p.ind === bestInd ? '你正好在这一行。' : '你从来没进过这一行。'));

    const val = Eng.portfolioValue(S);
    const series = H.pnl.slice(-90).map((x) => x.v - x.n);

    app.innerHTML = `
      <h1>一 生</h1><div class="sub">${S.year} 年 · ${p.age} 岁 · ${S.stage === 'dead' ? '你死了' : 'DEMO 到此为止'}</div>
      <div class="grid">
        <div>
          <div class="card"><div class="hd"><div class="t">年表</div><div class="a">${esc(p.name)}</div></div>
            ${S.log.map((l) => `<div class="tl"><span class="y">${l.year} · ${l.age}岁</span><span>${esc(l.text)}</span></div>`).join('')}
          </div>
          <div class="card"><div class="hd"><div class="t">结算</div><div class="a">不评分</div></div>
            <div class="row"><span class="k">存款</span><span class="v">${money(p.cash)}</span></div>
            <div class="row"><span class="k">持仓</span><span class="v">${money(Math.round(val))}</span></div>
            <div class="row"><span class="k">负债</span><span class="v">${money(p.debt)}</span></div>
            <div class="row"><span class="k">去过</span><span class="v">${p.travels || 0} 次旅行</span></div>
            <div class="row"><span class="k">认识</span><span class="v">${S.npcs.length} 个人</span></div>
            <div class="row"><span class="k">还亲近的</span><span class="v">${S.npcs.filter((n) => n.close > 50 && n.alive).length} 个</span></div>
          </div>
        </div>
        <div>
          <div class="card"><div class="hd"><div class="t">你没看见的世界</div><div class="a">现在可以说了</div></div>
            ${hidden.map((h) => `<div class="rev">${esc(h)}</div>`).join('')}
          </div>
          ${series.length > 1 ? '<div class="card"><div class="hd"><div class="t">你的账户</div><div class="a">总盈亏</div></div>'
            + lineChart(series, { zero: true, h: 140, x0: '开户', x1: '最后' }) + '</div>' : ''}
          <div class="card"><div class="hd"><div class="t">那些传闻，后来</div><div class="a">当时你只看得到星级</div></div>${rum}</div>
          <div class="card"><div class="foot">
            <button class="btn main" id="again">再来一次</button>
            <span class="note" style="margin:0">继承系统（接手弟弟/侄子继续玩）在下一版。</span>
          </div></div>
        </div>
      </div>`;
    app.querySelector('#again').onclick = () => { screen = 'start'; render(); };
  }

  function toast(t) {
    const d = document.createElement('div');
    d.className = 'toast'; d.textContent = t;
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 1400);
  }

  render();
})();
