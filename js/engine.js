/* 引擎：纯逻辑，零 DOM 依赖。
   将来改名 engine.ts 加类型即可，逻辑不用动。
   对外只暴露 Engine.newGame / Engine.step / Engine.choose / Engine.actionsFor / Engine.save / Engine.load */
(function (global) {
  'use strict';

  const C = global.CONTENT;
  const SKILLS = ['学业', '专业', '沟通', '经营', '体能'];

  const SURNAME = '王李张刘陈杨黄赵周吴徐孙马朱胡林郭何高罗郑梁谢宋唐许韩冯邓曹彭曾'.split('');
  const GIVEN = '伟芳娜秀敏静丽强磊洋艳勇军杰娟涛明超霞平刚桂英华玉兰凤莲云建国志远浩然子轩雨欣梓涵一鸣佳怡思远嘉豪雅婷'.split('');

  /* ══════════════════════ 状态构造 ══════════════════════ */

  function newGame(cfg) {
    buildTrackEntries();
    const rng = new global.RNG(cfg.seed);
    const bg = C.BACKGROUNDS.find((b) => b.id === cfg.bgId) || C.BACKGROUNDS[1];
    const startYear = 2026;

    const s = {
      seed: cfg.seed, rngState: rng.save(),
      year: startYear, month: 9, tick: 0,
      stage: 'hs',
      p: {
        name: cfg.name || (rng.pick(SURNAME) + rng.pick(GIVEN)),
        gender: cfg.gender || (rng.chance(0.5) ? '男' : '女'),
        age: 16, talent: cfg.talent || 'none',
        edu: '在读高中', city: bg.home, hukou: bg.hukou,
        job: null, jobName: null, ind: null, gross: 0, net: 0,
        jobIntensity: 0, jobMonths: 0, perf: 50, promo: 0, title: 0,
        hazard: false, shebao: false,
        cash: 0, debt: 0, debtKind: null, mortgage: 0,
        health: 88 + rng.int(-4, 6), stress: 22 + rng.int(-6, 10),
        diseases: [],
        skills: { 学业: 18 + rng.int(0, 14), 专业: 0, 沟通: 12 + rng.int(0, 12), 经营: 0, 体能: 30 + rng.int(0, 20) },
        housing: '住在家里', allowance: bg.allowance,
        partner: null, examPrep: 0, english: 0, sideLevel: 0, fans: 0,
        commute: 1, travels: 0, gambleCount: 0, gaokao: null, hTier: 1, broke2: 0, rich2: 0, gaokaoYear: startYear + 2, gradYear: null,
        hs: bg.hs || 'normal', mock: null, retake: 0, field: null, schoolName: null,
        major: null, majorExp: 0, indMonths: {},
        track: null, rank: 0, rankMonths: 0, promoTries: 0, rep: 0,
        _repeat: {}, _lastAction: null, _streak: 0,
      },
      family: { bgId: bg.id, home: bg.home, cash: bg.familyCash, support: bg.support, infoRadius: bg.infoRadius, expect: bg.expect },
      npcs: [],
      world: { priceIdx: 1, ind: {}, market: 55 },
      holdings: { pos: {}, netIn: 0, pnl: [] },
      market: { px: {}, hist: {}, mood: 0, delisted: {} },
      flags: {}, scheduled: [], log: [], rumors: [], history: [],
      cd: {}, seen: { jobs: {} }, rumorLog: [],
      rentAdj: 1,
    };

    C.INDUSTRIES.forEach((i) => { s.world.ind[i] = i === '体制内' ? 70 : 45 + rng.int(0, 30); });

    // 行情：先跑 24 个月的历史，这样开局就有一条线可看，而不是一条直线
    C.INSTRUMENTS.forEach((x) => { s.market.px[x.id] = x.p0; s.market.hist[x.id] = []; });
    for (let m = 0; m < 24; m++) {
      const mood = rng.normal(0, 0.028);
      C.INSTRUMENTS.forEach((x) => {
        const r = x.drift + x.beta * mood + rng.normal(0, x.vol);
        s.market.px[x.id] = Math.max(0.01, s.market.px[x.id] * (1 + r));
        s.market.hist[x.id].push(round2(s.market.px[x.id]));
      });
    }

    // 天赋随机
    if (cfg.talent === 'random') {
      s.p.talent = rng.weighted(C.TALENTS, (t) => (t.id === 'none' ? 45 : 11)).id;
    }

    // 家人
    const fs = rng.pick(SURNAME);
    s.p.name = cfg.name || (fs + rng.pick(GIVEN) + (rng.chance(0.4) ? rng.pick(GIVEN) : ''));
    s.npcs.push(mkNpc(rng, { id: 'father', name: fs + '·父亲', kind: '父亲', family: true, age: 46 + rng.int(-4, 6), job: bg.parent.job, income: bg.parent.income, health: bg.parent.health, city: bg.home, close: 62, trust: 70 }));
    // 单亲家庭只有一个大人 —— 这直接砍掉一半家庭收入
    if (bg.mom && bg.mom.job) {
      s.npcs.push(mkNpc(rng, { id: 'mother', name: '母亲', kind: '母亲', family: true,
        age: 44 + rng.int(-4, 6), job: bg.mom.job,
        income: Math.round(bg.parent.income * bg.mom.ratio),
        health: bg.parent.health + 3, city: bg.home, close: 72, trust: 75 }));
    }
    for (let i = 0; i < 4; i++) {
      s.npcs.push(mkNpc(rng, { id: 'cls' + i, name: rng.pick(SURNAME) + rng.pick(GIVEN), kind: '高中同学', age: 16, city: bg.home, close: 30 + rng.int(0, 30), trust: 40 + rng.int(0, 25), years: 2, romance: rng.chance(0.3) }));
    }

    // family：出生就带的信息半径。你没做任何事，但你已经比别人多知道几件事。
    s.seen.jobs = s.seen.jobs || {};
    const famInds = s.npcs.filter((x) => x.family && x.jobInd).map((x) => x.jobInd);
    C.JOBS.filter((j) => j.hidden && j.discover === 'family' && famInds.indexOf(j.ind) >= 0)
      .forEach((j) => { s.seen.jobs[j.id] = { tick: 0, via: 'family' }; });
    // 信息半径大的家庭，还额外知道一两件别的
    const extra = C.JOBS.filter((j) => j.hidden && j.discover === 'family' && !s.seen.jobs[j.id]);
    for (let i = 0; i < Math.max(0, bg.infoRadius - 2) && extra.length; i++) {
      const j = extra.splice(Math.floor(rng.next() * extra.length), 1)[0];
      s.seen.jobs[j.id] = { tick: 0, via: 'family' };
    }

    pushLog(s, `${s.year}年 · 你 16 岁，在${C.CITIES[bg.home].name}读高二。家里是${bg.name}。`);
    return s;
  }

  function mkNpc(rng, o) {
    return Object.assign({
      id: 'n' + Math.floor(rng.next() * 1e9), name: '某人', kind: '朋友',
      family: false, work: false, romance: false,
      age: 25, city: 'provincial', job: '职员', income: 6000,
      health: 85, sick: null, close: 30, trust: 40, favor: 0, owesYou: 0,
      years: 1, alive: true, story: [], retired: false,
      jobInd: C.JOB_IND ? (C.JOB_IND[o.job] || null) : null,
    }, o, { pension: C.PENSION[o.job] !== undefined ? C.PENSION[o.job] : 0.4 });
  }

  /* ══════════════════════ 经济 ══════════════════════ */

  function netFromGross(gross) {
    const insur = gross * 0.195;              // 五险一金个人部分（近似）
    let taxable = gross - insur - 5000;       // 起征点
    let tax = 0;
    const brackets = [[3000, 0.03], [9000, 0.10], [13000, 0.20], [10000, 0.25], [15000, 0.30]];
    for (const [w, r] of brackets) {
      if (taxable <= 0) break;
      tax += Math.min(taxable, w) * r; taxable -= w;
    }
    if (taxable > 0) tax += taxable * 0.35;
    return Math.max(0, Math.round(gross - insur - tax));
  }

  function livingCost(s) {
    const city = C.CITIES[s.p.city];
    let c = city.cost * (1500 + 300 * (s.p.commute || 1) + 450 + 250);
    if (s.stage === 'hs') c = 0;
    if (s.stage === 'uni') c = city.cost * 1500;
    return Math.round(c);
  }

  // 住房档位。人住不起会往下住，这是真实的出口。
  const HOUSING = [
    { name: '整租一居', mul: 1.55, hp: 0.15, st: -1.0 },
    { name: '合租', mul: 1.00, hp: 0, st: 0 },
    { name: '隔断合租', mul: 0.62, hp: -0.25, st: 0.8 },
    { name: '城中村单间', mul: 0.42, hp: -0.5, st: 1.3 },
  ];
  function housingTier(s) {
    const i = s.p.hTier;
    return HOUSING[i === undefined ? 1 : Math.max(0, Math.min(HOUSING.length - 1, i))];
  }
  function housingCost(s) {
    if (s.stage === 'hs') return 0;
    if (s.stage === 'uni') return 200; // 宿舍
    if (s.p.mortgage) return s.p.mortgage;
    if (s.p.house) return 0;
    if (s.p.housing === '住在家里') return 0;
    return Math.round(C.CITIES[s.p.city].rent * housingTier(s).mul * (s.rentAdj || 1));
  }

  /* ══════════════════════ 专业等级 ══════════════════════ */

  const FIELD_TALENT = { art: 'art', med: 'study', law: 'study', general: 'study', finance: 'biz', tech: 'study', eng: 'study', edu: 'social' };
  const EDU_MUL = { '985': 1.25, '211': 1.15, '一本': 1.00, '二本': 0.88, '专科': 0.78 };

  /** 花一格学专业课能拿到多少经验 */
  function majorExpGain(s) {
    const m = C.MAJOR_MAP[s.p.major];
    if (!m) return 0;
    const base = 14 - 1.6 * m.hardness;                       // 难度越高涨得越慢
    const edu = EDU_MUL[s.p.edu] || 0.85;
    let tal = 1;
    if (s.p.talent === FIELD_TALENT[m.field]) tal = 1.30;
    else if (s.p.talent === 'study') tal = 1.12;
    const rep2 = 1 / (1 + 0.13 * Math.max(0, s.p._streak - 3));
    const scene = s.stage === 'uni' ? 1.0 : s.stage === 'gap' ? 0.9 : 0.85;
    return base * edu * tal * rep2 * scene;
  }

  /** 在职被动经验 —— 干着对口的活，本身就是在练 */
  function majorPassive(s) {
    if (!s.p.major || !s.p.job) return 0;
    const m = C.MAJOR_MAP[s.p.major];
    const job = C.JOBS.find((j) => j.id === s.p.job);
    if (!m || !job) return 0;
    const inds = C.FIELD_IND[m.field] || [];
    if (inds.indexOf(job.ind) < 0) return 0.6;                // 不对口，只能练到一点边角
    return (2.5 + 0.8 * (job.prestige || 1)) * (job.intensity >= 4 ? 1.15 : 1);
  }

  /** 加经验，并把 0-100 的专业技能同步过去，旧代码继续能用 */
  function addMajorExp(s, v) {
    if (!s.p.major || v <= 0) return 0;
    const before = C.majorLevel(s.p.majorExp);
    s.p.majorExp += v;
    s.p.skills.专业 = C.majorToSkill(s.p.majorExp);
    const after = C.majorLevel(s.p.majorExp);
    return after > before ? after : 0;
  }

  /* ══════════════════════ 成长（第134章：防数值刷子）══════════════════════ */

  function skillCap(s, key) {
    if (key === '学业') return 100;
    if (key === '专业') {
      const job = s.p.job ? C.JOBS.find((j) => j.id === s.p.job) : null;
      const base = s.stage === 'uni' ? 45 : 30;
      return Math.min(100, base + (job ? job.prestige * 13 : 0) + (s.p.edu === '985' ? 15 : s.p.edu === '211' ? 10 : 0));
    }
    return 100;
  }

  /* ══════════════════════ 主循环 ══════════════════════ */

  let S = null, RNG_ = null, TURN = null;

  function bind(s) {
    S = s; RNG_ = new global.RNG(s.rngState); RNG_.load(s.rngState);
    s.city = C.CITIES[s.p.city];   // 便捷引用，每次 bind 刷新
  }
  function unbind() { if (S) S.rngState = RNG_.save(); }
  /** 从回合外调用引擎（UI 里的投递、升职）时，先把状态和随机数接上 */
  function ensureBound(s) {
    if (S !== s || !RNG_) { bind(s); return true; }
    return false;
  }

  /* —— 供内容层调用的变更 API —— */
  const E = {
    money: (n) => (Math.abs(n) >= 10000 ? (n / 10000).toFixed(n % 10000 === 0 ? 0 : 1) + ' 万' : Math.round(n) + ' 元'),
    log: (t) => { TURN.msgs.push(t); },
    cash: (n, note) => {
      S.p.cash += n;
      if (note) TURN.flow.push({ note, n });
      if (S.p.cash < 0) { S.p.debt += -S.p.cash; S.p.debtKind = S.p.debtKind || '消费贷/信用卡'; S.p.cash = 0; }
    },
    familyCash: (n) => { S.family.cash = Math.max(0, S.family.cash + n); },
    health: (n) => { S.p.health = clamp(S.p.health + n, 0, 100); },
    stress: (n) => { S.p.stress = clamp(S.p.stress + n, 0, 100); },
    perf: (n) => { S.p.perf = clamp(S.p.perf + n, 0, 100); },
    /** 风评：单位里对你这个人的印象。绩效是季度的，风评是年头攒的。
        它不出现在状态栏的数字里，只在提名单的那一刻起作用。 */
    rep: (n) => { S.p.rep = clamp((S.p.rep || 0) + n, -30, 30); },
    /** 涨薪。在职业线上时封在本格基准的 1.3 倍 —— 想再涨只能升格。 */
    raise: (mul) => {
      const p = S.p;
      let want = Math.round(p.gross * mul / 100) * 100;
      const r = curRank(S);
      if (r) {
        const cap = Math.round(r.gross * C.CITIES[p.city].salaryMul * 1.30 / 100) * 100;
        if (want > cap) want = Math.max(p.gross, cap);
      }
      const moved = want > p.gross;
      p.gross = want; p.net = netFromGross(p.gross);
      return moved;
    },
    promo: (n) => { S.p.promo = clamp(S.p.promo + n, 0, 100); },
    skill: (k, n) => { S.p.skills[k] = clamp((S.p.skills[k] || 0) + n, 0, 100); },
    growth: (key, base) => {
      const cur = S.p.skills[key] !== undefined ? S.p.skills[key] : 0;
      const cap = skillCap(S, key);
      const env = Math.max(0.12, 1 - cur / cap);
      const rep = key === '学业' ? 1 : 1 / (1 + 0.13 * Math.max(0, S.p._streak - 3));
      // 学区：同样刷一个月题，在省重点和在乡镇中学不是一回事
      const sch = (key === '学业' && S.stage === 'hs') ? C.HS_SCHOOLS[S.p.hs].strength : 1;
      const retakeDrag = (key === '学业' && S.p.retake > 0) ? 0.85 : 1;
      return base * env * rep * sch * retakeDrag;
    },
    flag: (k, months) => { S.flags[k] = S.tick + months; },
    schedule: (delay, key, data) => { S.scheduled.push({ tick: S.tick + delay, key, data }); },
    rel: (id, d) => {
      const n = S.npcs.find((x) => x.id === id); if (!n) return;
      if (d.close) n.close = clamp(n.close + d.close, 0, 100);
      if (d.trust) n.trust = clamp(n.trust + d.trust, 0, 100);
      if (d.favor) n.favor = clamp(n.favor + d.favor, -100, 100);
    },
    relGroup: (kindLike, d) => {
      S.npcs.filter((n) => n.kind.indexOf(kindLike) >= 0 || (kindLike === '圈子')).forEach((n) => { n.close = clamp(n.close + d * 0.6, 0, 100); });
    },
    groupLevel: (kindLike) => {
      const g = S.npcs.filter((n) => n.kind.indexOf(kindLike) >= 0);
      return g.length ? g.reduce((a, b) => a + b.close, 0) / g.length : 0;
    },
    quitJob: () => {
      S.p.job = null; S.p.jobName = null; S.p.ind = null; S.p.gross = 0; S.p.net = 0;
      S.p.jobIntensity = 0; S.p.jobMonths = 0; S.p.perf = 50; S.p.promo = 0; S.p.rep = 0;
      S.p.hazard = false; S.p.shebao = false; S.stage = 'gap';
    },
    moveCity: (id) => { S.p.city = id; S.rentAdj = 1; S.p.commute = 1; },
    rumorNow: (src, isTrue, text) => { S.rumors.push({ src, label: C.RUMOR_SOURCES[src].label, stars: C.RUMOR_SOURCES[src].stars, text, truth: isTrue, tick: S.tick }); },
    tryRumor: (srcs, n) => { for (let i = 0; i < n; i++) genRumor(srcs); },
    jobHunt: (fullTime) => doJobHunt(fullTime),
    majorExp: (v) => {
      const up = addMajorExp(S, v);
      if (up) { TURN.msgs.push(`【${C.MAJOR_MAP[S.p.major].name}】升到 ${up} 级：${C.LEVEL_NAMES[up - 1]}。`); pushLog(S, `${C.MAJOR_MAP[S.p.major].name} 到 ${up} 级。`); }
      return up;
    },
    majorGain: () => majorExpGain(S),
    promo2: () => tryPromo(S),
    checkup: () => doCheckup(),
    treat: () => doTreat(),
    favorAsk: () => doFavorAsk(),
    blindDate: () => doBlindDate(),
    confess: () => doConfess(),
    pullStrings: (what) => doPullStrings(what),
  };

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ncdf(z) {
    const t2 = 1 / (1 + 0.2316419 * Math.abs(z)), d = 0.3989423 * Math.exp(-z * z / 2);
    const pp = d * t2 * (0.3193815 + t2 * (-0.3565638 + t2 * (1.781478 + t2 * (-1.821256 + t2 * 1.330274))));
    return z > 0 ? 1 - pp : pp;
  }
  /** 你在自己学校的年级排名。学校越好，同学水平越高 —— 所以县中第一名
      和省重点第三十名，可能是完全相反的两个未来。玩家看不到这层。 */
  function runMock(s) {
    const sch = C.HS_SCHOOLS[s.p.hs];
    const peerMean = 26 * sch.strength + 14, peerSd = 15;
    const pct = ncdf((s.p.skills.学业 - peerMean) / peerSd);   // 你压过多少人
    const trueRank = Math.max(1, Math.round((1 - pct) * sch.size));
    const shown = clamp(Math.round(trueRank * (1 + RNG_.normal(0, 0.18))), 1, sch.size);
    s.p.mock = { rank: shown, size: sch.size, year: s.year, month: s.month };
    return shown;
  }
  function pushLog(s, t) { s.log.push({ year: s.year, month: s.month, age: s.p.age, text: t }); }

  /* —— 一步 = 一格时间 —— */
  function step(s, actionId) {
    bind(s);
    TURN = { msgs: [], flow: [], events: [], head: '' };
    s._turn = TURN;

    const a = C.ACTIONS.find((x) => x.id === actionId);
    if (!a) { unbind(); return { error: '未知行动' }; }

    // 连续重复计数（第134章）
    if (s.p._lastAction === actionId) s.p._streak++; else s.p._streak = 1;
    s.p._lastAction = actionId;
    s.p.lastActionLabel = a.verb + ' · ' + a.label;

    const r = a.run({ s, rng: RNG_, E });
    if (r && r.__choose) return awaitChoice(buildActionChoice(r));
    if (Array.isArray(r)) TURN.msgs.push.apply(TURN.msgs, r);
    return afterAction();
  }

  function awaitChoice(ch) {
    S._await = ch;
    unbind();
    return { need: 'choice', choice: ch, turn: TURN };
  }

  function choose(s, idx) {
    bind(s); TURN = s._turn;
    const ch = s._await; s._await = null;
    idx = Math.max(0, Math.min(ch.options.length - 1, idx | 0));
    const opt = ch.options[idx];
    const res = ch.resolve(opt, idx);
    if (res) TURN.msgs.push(res);
    if (ch.after === 'afterAction') return afterAction();
    return finish();
  }

  function buildActionChoice(r) {
    if (r.__choose === 'city') {
      const opts = C.CITY_LIST.filter((c) => c.id !== S.p.city).map((c) => ({
        label: `${c.name}`, sub: `租 ${c.rent}/月 · 房价 ${c.price}/㎡ · 薪资系数 ${c.salaryMul}`,
      }));
      return {
        title: '换城市', text: '搬到哪里？租金、薪资、房价、落户门槛全部重算，关系网会疏远一部分。',
        options: opts, after: 'afterAction',
        resolve: (o, i) => {
          const c = C.CITY_LIST.filter((x) => x.id !== S.p.city)[i];
          E.moveCity(c.id);
          if (S.p.job) E.quitJob();
          E.cash(-4000, '搬家');
          S.npcs.forEach((n) => { if (!n.family) n.close = Math.max(0, n.close - 8); });
          E.stress(+10);
          return `你搬到了${c.name}。行李比想象中少。`;
        },
      };
    }
    if (r.__choose === 'market') {
      // 行情窗口由 UI 自己画（要折线图）。买卖直接走 Engine.trade，
      // 这里只留一个"看完了"来把这一格用掉。
      return { kind: 'market', title: '行情', text: '', options: [{ label: '看完了' }],
        after: 'afterAction', resolve: () => null };
    }
    if (r.__choose === 'jobs') {
      // 岗位板由 UI 自己画（三态 + 传闻薪资）。投递走 Engine.submitApply。
      return { kind: 'jobs', title: '找工作', text: '', options: [{ label: '结束这个月' }],
        after: 'afterAction', resolve: () => null };
    }
    if (r.__choose === 'offers') {
      return {
        title: '你拿到的 offer', text: r.offers.length ? '选一个。或者一个都不选。' : '这个月没有任何回音。',
        options: r.offers.map((o) => ({ label: o.name, sub: `${C.CITIES[o.city].name} · 税前 ${o.gross} · 到手约 ${netFromGross(o.gross)} · ${['', '清闲', '正常', '忙', '996'][o.intensity]}` }))
          .concat([{ label: '都不接受', sub: '继续等' }]),
        after: 'afterAction',
        resolve: (o, i) => {
          if (i >= r.offers.length) { E.stress(+4); return '你都没接。'; }
          return takeJob(r.offers[i]);
        },
      };
    }
    return { title: '?', text: '', options: [{ label: '继续' }], resolve: () => null, after: 'afterAction' };
  }

  function afterAction() {
    // 一格时间只结算一次。带选项的关口/换城市/选 offer 会二次进入这里，
    // 没有这个闸门就会重复发工资、重复扣房租、重复掷病。
    if (!TURN.settled) { TURN.settled = true; settle(); }
    if (S.stage === 'dead') return finish();

    // 模考（高二期末 / 高三期中 / 一模 / 二模）
    if (S.stage === 'hs' && [11, 1, 3, 5].indexOf(S.month) >= 0) {
      const r = runMock(S);
      const sch = C.HS_SCHOOLS[S.p.hs];
      const pctTop = r / sch.size;
      const line = pctTop < 0.01 ? '班主任把你叫去办公室，说了半小时，全是"稳住"。'
        : pctTop < 0.05 ? '班主任在走廊上拍了拍你的肩膀，没说话。'
        : pctTop < 0.25 ? '排名贴出来了。你在中上游那一段。'
        : pctTop < 0.6 ? '你在名单中间偏后的位置找到自己的名字。'
        : '你从后面往前数，很快就找到了自己。';
      TURN.msgs.push(`【模考】成绩出来了。年级 ${r} / ${sch.size}。${line}`);
    }

    // 关口
    const gate = checkGates();
    if (gate) return awaitChoice(gate);

    // 事件
    const ev = rollEvent();
    if (ev) {
      if (ev.options) {
        const visible = ev.options.filter((o) => !(o.hidden && o.hidden(S)));
        return awaitChoice({
          title: ev.title, text: ev._text, tier: ev.tier,
          options: visible.map((o) => ({ label: o.label })),
          resolve: (o, i) => visible[i].apply({ s: S, rng: RNG_, E, d: ev._d }),
        });
      }
      const t = ev.apply ? ev.apply({ s: S, rng: RNG_, E }) : ev._text;
      if (t) TURN.msgs.push(t);
    }
    return finish();
  }

  function finish() {
    const before = S.rumors.length;
    genRumors();
    const fresh = S.rumors.filter((r) => r.tick === S.tick);
    const oy = S.year, om = S.month, oa = S.p.age;
    if (S.stage !== 'dead') {
      S.tick++; S.month++;
      if (S.month > 12) { S.month = 1; S.year++; yearTick(); }
      if (S.month === 9) S.p.age++;
    }
    const summary = {
      year: oy, month: om, age: oa,
      msgs: TURN.msgs.filter(Boolean), flow: TURN.flow, rumors: fresh.map((r) => ({ label: r.label, text: r.text, stars: r.stars })),
      action: S.p.lastActionLabel,
    };
    S.history.push(summary);
    if (S.history.length > 400) S.history.shift();
    unbind();
    return { need: null, summary, dead: S.stage === 'dead' };
  }

  /* ══════════════════════ 月度结算 ══════════════════════ */

  function settle() {
    const p = S.p;

    // 收入
    if (p.job) {
      p.net = netFromGross(p.gross);
      let pay = p.net;
      if (S.flags.wageDelay && S.flags.wageDelay > S.tick) pay = 0;
      E.cash(pay, pay ? '工资' : '工资（缓发）');
      p.jobMonths++;
      // 绩效自然回落
      p.perf = clamp(p.perf - 1.2, 0, 100);
      // 年终奖
      if (S.month === 1) {
        const mult = S.flags.bonusCut && S.flags.bonusCut > S.tick ? 0.4 : 1;
        const bonus = Math.round(p.net * (0.5 + p.perf / 100 * 1.8) * mult);
        E.cash(bonus, '年终奖');
        TURN.msgs.push(`年终奖到账 ${E.money(bonus)}。`);
      }
    } else if (S.stage === 'hs' || S.stage === 'uni') {
      E.cash(p.allowance, '家里给的生活费');
      E.familyCash(-p.allowance);
    }

    // 支出
    const h = housingCost(S); if (h > 0) E.cash(-h, p.mortgage ? '房贷' : '房租');
    const l = livingCost(S); if (l > 0) E.cash(-l, '生活开销');

    // 在职的被动专业经验，以及行业年限（tenure 解锁要用）
    if (p.job && p.ind) {
      p.indMonths = p.indMonths || {};
      p.indMonths[p.ind] = (p.indMonths[p.ind] || 0) + 1;
      if (p.track) p.rankMonths = (p.rankMonths || 0) + 1;
      const up = addMajorExp(S, majorPassive(S));
      if (up) TURN.msgs.push(`【${C.MAJOR_MAP[p.major].name}】干着干着到了 ${up} 级：${C.LEVEL_NAMES[up - 1]}。`);
    }

    discoveryTick();
    familyTick();

    // 住不起就往下住。第86章：不同住法，成本与生活质量不同。
    if (S.stage === 'work' && !p.house && p.housing !== '住在家里') {
      if (p.hTier === undefined) p.hTier = 1;
      const short = p.cash < livingCost(S) + housingCost(S);
      p.broke2 = short ? (p.broke2 || 0) + 1 : 0;
      // 手里宽裕了就往上搬。人不会一直住在最差的地方。
      if (!short && p.hTier > 0) {
        const better = Math.round(C.CITIES[p.city].rent * HOUSING[p.hTier - 1].mul * (S.rentAdj || 1));
        const room = p.net - livingCost(S) - better;
        p.rich2 = (room > 1200 && p.cash > better * 4) ? (p.rich2 || 0) + 1 : 0;
        if (p.rich2 >= 6) {
          p.hTier--; p.rich2 = 0; p.commute = Math.max(1, (p.commute || 1) - 0.25);
          const h = housingTier(S);
          p.housing = h.name;
          E.cash(-Math.round(better * 1.5), '押一付二与搬家');
          TURN.msgs.push(`你搬去了${h.name}。${p.hTier === 0 ? '第一次一个人住一整套房子，晚上安静得有点不习惯。' : '总算有个窗户了。'}`);
          pushLog(S, `搬去${h.name}。`);
        }
      } else { p.rich2 = 0; }

      if (p.broke2 >= 2 && p.hTier < HOUSING.length - 1) {
        p.hTier++; p.broke2 = 0; p.commute = Math.min(2.2, (p.commute || 1) + 0.25);
        const h = housingTier(S);
        p.housing = h.name;
        TURN.msgs.push(`你搬了。${h.name}，${p.hTier >= 3 ? '楼下是条巷子，晚上有人打牌。' : '没有窗户，但便宜了一截。'}`);
        pushLog(S, `搬去${h.name}。`);
      }
      const h2 = housingTier(S);
      E.health(h2.hp); E.stress(h2.st);
    }

    // 家里兜底 —— 第103章：阶层的真正含义是容错空间
    if (!p.job && p.cash < 900 && S.family.cash > 0 && S.family.support >= 1) {
      const gap = livingCost(S) + housingCost(S) + 400 - p.cash;
      const help = Math.min(S.family.cash, Math.max(900, gap) * Math.min(2, S.family.support));
      E.familyCash(-help); E.cash(help, '家里打来的钱');
      TURN.msgs.push(`家里给你打了 ${E.money(help)}。你${C.pw(S)}说"不够再说"。`);
      E.rel('mother', { favor: -6 }); E.rel('father', { favor: -6 });
    }

    // 持仓被动波动 —— 不占格子的钱
    tickMarket();

    // 负债利息
    if (p.debt > 0 && p.debtKind !== '房贷') {
      const int = Math.round(p.debt * 0.011);
      p.debt += int;
      if (p.cash > int * 3) { E.cash(-int, '利息'); p.debt -= int; }
    }
    if (p.debtKind === '房贷' && p.mortgage) p.debt = Math.max(0, p.debt - Math.round(p.mortgage * 0.35));

    // 压力源
    let st = -(2.4 + p.stress * 0.06); // 自然消解：均值回归，压力越高回落越快
    if (p.stress > 80) st -= (p.stress - 80) * 0.25; // 80 以上人会本能地垮一下、逃一下，很难真的顶到 100
    // 强度的压力由「上班/加班」这个动作本身给，这里不再重复计一遍
    if (p.mortgage) st += Math.min(10, (p.mortgage / Math.max(1, p.net)) * 12);
    if (p.debt > 0 && p.debtKind !== '房贷') st += Math.min(14, p.debt / 12000);
    if (p.cash < livingCost(S) + housingCost(S)) st += 6;
    if (p.age >= 27 && !p.partner) st += 1.2;
    if (S.stage === 'gap') st += 5;
    if (S.stage === 'hs') st += 3;
    p.diseases.forEach((d) => { st += C.DISEASE_MAP[d.id].stress; });
    E.stress(st);

    // 健康 —— 「健康线」模型
    // 你现在的身体状况 + 生活方式，共同决定一条线：慢性病、长期高压、重体力活
    // 都不是无底洞，它们只是把这条线往下压，然后把你按在线上。人会被拖垮，不会被拖死。
    // 线不管的只有两样：身体上的重病，和年龄。最后收走所有人的也是这两样。
    const SEV_LINE = [0, 6, 14, 26, 40, 100];
    const age = p.age;
    let line = 100, rate = 0, deep = 0;
    p.diseases.forEach((d) => {
      const def = C.DISEASE_MAP[d.id];
      if (def.sev >= 5) { deep += def.hp; line -= 100; } // 重病：没有线
      else { line -= SEV_LINE[def.sev] || 12; rate += def.hp; }
    });
    if (p.stress > 85) { line -= 30; rate -= 1.2; }
    else if (p.stress > 70) { line -= 15; rate -= 0.5; }
    if (p.job && p.jobIntensity >= 4) { line -= 10; rate -= 0.4; }
    // 年龄压的是线本身。五十岁以后这条线自己就在走低，而且越走越快 ——
    // 九十岁上下它会落到 0。这是唯一一件谁也躲不掉的事。
    if (age > 50) line -= (age - 50) * (age - 50) * 0.06;
    line = Math.max(age < 55 ? 15 : 0, line);

    const gap = p.health - line;
    let hp;
    if (gap > 0) {
      // 往线上掉：差得越远掉得越快，但一个月不会直接掉穿
      hp = Math.max(Math.min(rate, -Math.max(0.35, gap * 0.08)), -gap);
    } else {
      hp = Math.min(1.0, -gap * 0.06 + 0.15); // 在线下面，慢慢往回爬
    }
    E.health(hp + deep);

    // 疾病：发病与自愈
    rollDisease();

    // 定时效果（第130章：因果可以延迟十年结算）
    const due = S.scheduled.filter((x) => x.tick <= S.tick);
    S.scheduled = S.scheduled.filter((x) => x.tick > S.tick);
    due.forEach((x) => { const h2 = HANDLERS[x.key]; if (h2) h2(S, E, x.data, RNG_); });

    // 过期 flag
    Object.keys(S.flags).forEach((k) => { if (S.flags[k] <= S.tick) delete S.flags[k]; });

    // 走投无路：没工作、没钱、家里也兜不住，你只能去干任何能干的活
    if (!p.job && p.cash < 300 && S.family.cash < 500 && S.stage !== 'hs' && S.stage !== 'uni') {
      p.broke = (p.broke || 0) + 1;
      if (p.broke >= 4) {
        const edu = p.edu === '在读高中' ? '高中' : p.edu;
        let pool = C.JOBS.filter((j) => !j.exam && j.edu.indexOf(edu) >= 0);
        if (!pool.length) pool = C.JOBS.filter((j) => j.edu.indexOf('高中') >= 0);
        const j = pool.sort((a, b) => a.prestige - b.prestige)[0];
        TURN.msgs.push(takeJob({ ...j, city: p.city, gross: Math.round(j.gross * C.CITIES[p.city].salaryMul) }));
        TURN.msgs.push('你没得挑。房租下周就到期。');
        p.broke = 0; E.stress(+10);
      }
    } else { p.broke = 0; }

    // 死亡
    if (p.health <= 0) {
      S.stage = 'dead';
      TURN.msgs.push('——');
      TURN.msgs.push(`${S.year}年${S.month}月，你死了。享年 ${p.age} 岁。`);
      pushLog(S, `你去世，${p.age} 岁。`);
    }
  }

  function round2(v) { return v >= 100 ? Math.round(v) : Math.round(v * 100) / 100; }

  function tickMarket() {
    const M = S.market;
    // 大盘情绪：所有股票共享的那一部分。牛市熊市不是每只票各走各的。
    M.mood = M.mood * 0.55 + RNG_.normal(0, 0.03);
    C.INSTRUMENTS.forEach((x) => {
      if (M.delisted[x.id]) return;
      const r = x.drift + x.beta * M.mood + RNG_.normal(0, x.vol);
      M.px[x.id] = Math.max(0.01, M.px[x.id] * (1 + r));
      // *ST 会真的退市。第135章：不能存在只赚不赔的口子。
      if (x.id === 'st' && M.px[x.id] < x.p0 * 0.10) {
        M.delisted[x.id] = S.tick;
        const held = S.holdings.pos[x.id];
        if (held && held.shares > 0) {
          TURN.msgs.push(`【行情】${x.name}退市了。你账户里那 ${E.money(Math.round(held.shares * M.px[x.id]))} 归零。`);
          pushLog(S, `${x.name}退市，持仓归零。`);
          E.stress(+20);
        }
        held && (held.shares = 0);
      }
      M.hist[x.id].push(round2(M.px[x.id]));
      if (M.hist[x.id].length > 400) M.hist[x.id].shift();
    });
    // 存款是按月计息，不是价格波动
    const H = S.holdings;
    const val = portfolioValue(S);
    H.pnl.push({ t: S.tick, v: Math.round(val), n: Math.round(H.netIn) });
    if (H.pnl.length > 400) H.pnl.shift();
    S.world.market = clamp(50 + M.mood * 900, 8, 95);
  }

  function portfolioValue(s) {
    let v = 0;
    Object.keys(s.holdings.pos).forEach((id) => {
      if (s.market.delisted[id]) return;
      v += (s.holdings.pos[id].shares || 0) * (s.market.px[id] || 0);
    });
    return v;
  }

  /** 买卖。yuan > 0 买入；yuan < 0 卖出该金额；sellAll 清掉这一只。 */
  function trade(s, id, yuan, sellAll) {
    const inst = C.INSTRUMENT_MAP[id];
    if (!inst) return { ok: false, msg: '没有这个标的' };
    if (s.market.delisted[id]) return { ok: false, msg: inst.name + ' 已经退市了' };
    const px = s.market.px[id];
    const pos = s.holdings.pos[id] || (s.holdings.pos[id] = { shares: 0, cost: 0 });
    if (sellAll || yuan < 0) {
      const want = sellAll ? pos.shares : Math.min(pos.shares, -yuan / px);
      if (want <= 0) return { ok: false, msg: '没有持仓' };
      const gross = want * px;
      const costPart = pos.shares > 0 ? pos.cost * (want / pos.shares) : 0;
      pos.shares -= want; pos.cost -= costPart;
      if (pos.shares < 1e-9) { pos.shares = 0; pos.cost = 0; }
      s.p.cash += Math.round(gross);
      s.holdings.netIn -= Math.round(gross);
      const pl = Math.round(gross - costPart);
      return { ok: true, msg: `卖出 ${inst.name}，到账 ${fmtMoney(Math.round(gross))}，这一笔${pl >= 0 ? '赚' : '亏'} ${fmtMoney(Math.abs(pl))}。` };
    }
    const amt = Math.min(Math.round(yuan), s.p.cash);
    if (amt < 100) return { ok: false, msg: '钱不够' };
    pos.shares += amt / px; pos.cost += amt;
    s.p.cash -= amt; s.holdings.netIn += amt;
    return { ok: true, msg: `买入 ${fmtMoney(amt)} 的${inst.name}，成交价 ${round2(px)}。` };
  }

  function fmtMoney(v) { return Math.abs(v) >= 10000 ? (v / 10000).toFixed(1) + ' 万' : Math.round(v) + ' 元'; }

  function rollDisease() {
    const p = S.p;
    // 自愈 / 缓解
    p.diseases = p.diseases.filter((d) => {
      const def = C.DISEASE_MAP[d.id];
      d.months++;
      if (def.selfHeal && d.months >= def.selfHeal) { TURN.msgs.push(`${def.name}好了。`); return false; }
      // 心理疾病：压力真正降下来以后会慢慢缓解（第89章：压力可以被消化）
      if (def.kind === 'mind' && p.stress < 45 && d.months > 3 && RNG_.chance(0.14)) {
        TURN.msgs.push(`${def.name}的情况好转了。你已经很久没有那种感觉了。`);
        return false;
      }
      return true;
    });
    if (p.diseases.length >= 2) return;   // 并发上限：不让病叠成必死螺旋

    let pr = 0.004;
    if (p.stress > 60) pr += (p.stress - 60) * 0.0022;
    if (p.age > 40) pr += (p.age - 40) * 0.0009;
    if (p.health < 55) pr += 0.012;
    if (p.job && p.jobIntensity >= 4) pr += 0.004;
    if (!RNG_.chance(pr)) return;

    const mindBias = p.stress > 72;
    const pool = C.DISEASES.filter((d) => d.minAge <= p.age && !p.diseases.some((x) => x.id === d.id));
    if (!pool.length) return;
    const pick = RNG_.weighted(pool, (d) => {
      let w = 10 / (d.sev * d.sev);
      if (mindBias && d.kind === 'mind') w *= 3.5;
      if (!mindBias && d.kind === 'mind') w *= 0.5;
      if (d.sev >= 5 && p.age < 45) w *= 0.15;
      return w;
    });
    p.diseases.push({ id: pick.id, months: 0 });
    TURN.msgs.push(`【身体】你被诊断为${pick.name}。${pick.kind === 'mind' ? '医生说和长期压力有关。' : ''}`);
    pushLog(S, `确诊${pick.name}。`);
    E.stress(+6);
  }

  /** 家底不是一个只会减少的数字：父母每个月在挣钱，也在花钱。
      退休以后，挣的那一半换成养老金 —— 而养老金差着十倍。 */
  function familyTick() {
    const alive = S.npcs.filter((n) => n.family && n.alive);
    if (!alive.length) { S.family.flow = 0; return; }

    // 术后恢复是有期限的。原来 sick 一旦设上就永远摘不掉 ——
    // 状态栏里挂一辈子「术后恢复」，医药费也一辈子在扣。
    // 慢性病（高血压、糖尿病这些）不清，那本来就是跟一辈子的。
    alive.forEach((n) => {
      if (n.sick !== '术后恢复') return;
      n.sickMonths = (n.sickMonths || 0) + 1;
      if (n.sickMonths < 5) return;
      // 底子好的养回来；底子差的也出院，只是从此下不了床 ——
      // 无论哪种，「术后恢复」这四个字都不该挂一辈子。
      if (n.health > 45) {
        n.sick = null; n.sickMonths = 0;
        if (TURN) TURN.msgs.push(`【家里】${n.kind}出院了。复查说恢复得还行，能自己下楼了。`);
        pushLog(S, `${n.kind}出院。`);
      } else {
        n.sick = '长期卧床'; n.sickMonths = 0;
        if (TURN) TURN.msgs.push(`【家里】${n.kind}出院了，但下不了床。以后要有人一直看着。`);
        pushLog(S, `${n.kind}出院，长期卧床。`);
      }
    });
    const income = alive.reduce((a, n) => a + (n.income || 0), 0);
    const cityCost = C.CITIES[S.family.home].cost;
    // 父母的开销：城市底线和收入比例取大的那个（挣得多也花得多）
    const cost = Math.round(Math.max(cityCost * (900 + alive.length * 900), income * 0.72));
    const med = alive.reduce((a, n) => a + (n.sick ? Math.round(320 * cityCost) : 0), 0);
    const flow = income - cost - med;
    S.family.cash = Math.max(0, S.family.cash + flow);
    S.family.flow = flow;
    S.family.income = income;
  }

  /* ══════════════════════ 年度：世界与 NPC ══════════════════════ */

  function yearTick() {
    // 房价：跟随周期，不看玩家
    const soft = S.flags.priceSoft && S.flags.priceSoft > S.tick;
    S.world.priceIdx = clamp(S.world.priceIdx * (1 + RNG_.normal(soft ? -0.02 : 0.012, 0.055)), 0.55, 3.2);
    // 行业景气各自游走
    C.INDUSTRIES.forEach((i) => {
      S.world.ind[i] = clamp(S.world.ind[i] + RNG_.normal(0, 7), 8, 95);
    });
    // NPC 各自过各自的日子（第92章）
    S.npcs.forEach((n) => { npcYear(n); });
  }

  function npcYear(n) {
    if (!n.alive) return;
    n.age++; n.years++;
    n.health -= n.age > 55 ? RNG_.float(0.8, 2.6) : RNG_.float(0, 0.8);
    const retireAge = (n.job === '务农' || n.job === '个体户' || n.job === '小老板' || n.job === '外来务工')
      ? 62 : (n.kind === '母亲' ? 55 : 60);
    if (!n.retired && n.age >= retireAge) {
      n.retired = true;
      n.income = Math.max(120, Math.round(n.income * n.pension));
      if (n.family && TURN) {
        TURN.msgs.push(`【家里】${n.kind}退休了。养老金每月 ${E.money(n.income)}。`
          + (n.pension < 0.2 ? '这个数你算了两遍，确认自己没看错。' : ''));
        pushLog(S, `${n.kind}退休，养老金 ${n.income}/月。`);
      }
    }
    const vol = n.job === '小老板' || n.job === '个体户' ? 0.13 : 0.045;   // 做生意的本来就波动大
    n.income = Math.round(n.income * (1 + RNG_.normal(n.retired ? 0.002 : 0.025, n.retired ? 0.004 : vol)));
    if (!n.family && RNG_.chance(0.06)) { n.city = RNG_.pick(C.CITY_LIST).id; n.story.push(`${S.year} 搬到了${C.CITIES[n.city].name}`); }
    if (n.age > 50 && RNG_.chance(0.05 + (85 - n.health) / 600)) {
      n.sick = RNG_.pick(['高血压', '糖尿病', '腰椎间盘突出', '心脏问题']);
      if (n.family) TURN && TURN.msgs.push(`【家里】${n.kind}查出${n.sick}。`);
    }
    if (n.health <= 0) {
      n.alive = false;
      if (n.family) { TURN && TURN.msgs.push(`${n.kind}走了。`); pushLog(S, `${n.kind}去世。`); E.stress(+30); }
    }
    // 关系自然疏远（不维护会坏掉）
    if (!n.family) n.close = clamp(n.close - RNG_.float(1, 4), 0, 100);
  }

  /* ══════════════════════ 关口：高考 / 毕业 / 求职 ══════════════════════ */

  function checkGates() {
    const p = S.p;
    // 高考：出分
    if (S.stage === 'hs' && S.year === p.gaokaoYear && S.month === 6 && !p.gaokao) {
      const sch = C.HS_SCHOOLS[p.hs];
      // 满分 750。学业 0-100 通过 ×7.05 映射到分数，档线见 EDU_TIERS。
      const talentB = p.talent === 'study' ? 25 : 0;
      // 压力不再扣固定分，它放大方差 —— 拼到最后一刻的人，可能超常，也可能崩掉
      const sigma = 41 + Math.max(0, p.stress - 55) * 0.9 + (p.retake ? 22 : 0);
      let score = p.skills.学业 * 7.05 - 30 + talentB + (p.health < 60 ? -38 : 0) + RNG_.normal(0, sigma);
      let blew = false;
      if (p.stress > 85 && RNG_.chance(0.12)) { score -= RNG_.int(45, 105); blew = true; }
      score = clamp(score, 0, 750);
      p.gaokao = Math.round(score);
      const tier = C.EDU_TIERS.find((x) => score >= x.min);
      const mockLine = p.mock ? `最后一次模考你是年级 ${p.mock.rank} / ${p.mock.size}。` : '';
      const blewLine = blew ? '\n\n考完数学那天中午你就知道不对了。你没跟任何人说。' : '';
      pushLog(S, `高考出分：${p.gaokao}。`);
      return {
        title: '出分', tier: 'gate',
        text: `六月七号早上，你${C.pw(S)}在楼下等着，没说话。${blewLine}\n\n${mockLine}\n\n分数下来了：${p.gaokao} 分（满分 750）。\n（${sch.name} · 压力 ${Math.round(p.stress)} · 健康 ${Math.round(p.health)}）`,
        options: (score >= 44 ? [{ label: '看志愿表' }] : [])
          .concat([{ label: '复读一年', sub: p.retake ? '你已经复读过一次了' : '再来一年。学业保留，但代价是真的' },
                   { label: '不读了，出去打工' }]),
        after: 'afterAction',
        resolve: (o) => {
          if (o.label === '看志愿表') return null;             // 下一道关口接着填志愿
          if (o.label.indexOf('复读') >= 0) {
            const fee = RNG_.int(8000, 16000);
            E.familyCash(-fee);
            p.gaokao = null; p.gaokaoYear += 1; p.retake++;
            p.stress = Math.max(p.stress, 58);
            E.rel('father', { favor: -15 }); E.rel('mother', { favor: -12 });
            S.npcs.filter((x) => x.kind.indexOf('同学') >= 0).forEach((x) => { x.close = Math.max(0, x.close - 18); });
            return `复读费 ${E.money(fee)}，家里出了。\n\n九月开学，教室里坐的全是生面孔。你原来的同班同学，朋友圈里已经在发大学的照片了。`;
          }
          p.edu = '高中'; S.stage = 'gap'; p.housing = '住在家里';
          return '你没再读书。八月份，表哥说厂里在招人。';
        },
      };
    }

    // 高考：填志愿
    if (S.stage === 'hs' && p.gaokao != null && p.edu === '在读高中') {
      const sc = p.gaokao;
      let pool = C.SCHOOLS.filter((x) => sc >= x.min);
      // 考砸到没有一所收你，也得有个去处 —— 给分数线最低的那所。
      if (!pool.length) pool = C.SCHOOLS.slice().sort((a, b) => a.min - b.min).slice(0, 1);
      pool = pool.sort((a, b) => b.min - a.min).slice(0, 9);
      const FIELDNAME = { tech: '偏计算机/电子', finance: '偏金融财会', edu: '偏师范', med: '偏医学', eng: '偏工科', general: '综合' };
      return {
        title: '填志愿', tier: 'gate',
        text: `${p.gaokao} 分。这张表上，你够得着的都在这里了。\n\n去外地的好学校，还是留在近处读个稳的；奔着学校的名字去，还是奔着一个能吃饭的专业去 —— 这一栏填完就改不了了。`,
        options: pool.map((x) => ({
          label: x.name,
          sub: `${C.CITIES[x.city].name} · ${x.tier} · ${FIELDNAME[x.field]}${x.note ? ' · ' + x.note : ''}`,
        })),
        after: 'afterAction',
        resolve: (o, i) => {
          const x = pool[i];
          p.edu = x.tier; p.field = x.field; p.schoolName = x.name;
          p.gradYear = S.year + 4;
          p.housing = '学校宿舍'; p.city = x.city;
          p.allowance = Math.round((S.family.support * 380 + 900) * C.CITIES[x.city].cost);
          pushLog(S, `你去${C.CITIES[x.city].name}读${x.name}了。`);
          return null;   // 接着选专业
        },
      };
    }

    // 高考：选专业
    if (S.stage === 'hs' && p.schoolName && !p.major) {
      const eduRank = { '985': 5, '211': 4, '一本': 3, '二本': 2, '专科': 1 };
      const mine = eduRank[p.edu] || 1;
      // 学校的方向决定哪些专业更可能开设；够不着的专业不出现在这张表上
      let pool = C.MAJORS.filter((m) => mine >= (eduRank[m.minEdu] || 1));
      const same = pool.filter((m) => m.field === p.field);
      const other = RNG_.shuffle(pool.filter((m) => m.field !== p.field)).slice(0, Math.max(3, 8 - same.length));
      pool = same.concat(other);
      if (pool.length > 10) pool = same.concat(other).slice(0, 10);
      return {
        title: '选专业', tier: 'gate',
        text: `${p.schoolName}的专业目录摊在桌上。

${C.parentCount(S) > 1 ? '你爸说选个好就业的，你妈说选个稳定的' : `你${C.pw(S)}说选个稳一点的`}，你自己其实不知道这些名字背后是什么。

这一栏填完，四年就定了。`,
        options: pool.map((m) => ({
          label: m.name,
          sub: `${m.desc}`,
        })),
        after: 'afterAction',
        resolve: (o, i) => {
          const m = pool[i];
          p.major = m.id; p.majorExp = 0; p.skills.专业 = 0;
          S.stage = 'uni';
          for (let i2 = 0; i2 < 3; i2++) {
            S.npcs.push(mkNpc(RNG_, { id: 'uni' + i2, name: RNG_.pick(SURNAME) + RNG_.pick(GIVEN), kind: '大学同学',
              age: 18, city: p.city, close: 25 + RNG_.int(0, 25), trust: 40, romance: RNG_.chance(0.35) }));
          }
          pushLog(S, `你读了${m.name}。`);
          return `九月，你拖着箱子到了${C.CITIES[p.city].name}。${p.schoolName}，${m.name}，宿舍在六楼，没有电梯。`;
        },
      };
    }

    // 毕业
    if (S.stage === 'uni' && S.year === p.gradYear && S.month === 6) {
      S.stage = 'gap'; p.housing = '暂住';
      p.allowance = 0;
      pushLog(S, `你从大学毕业了。`);
      return {
        title: '毕业', tier: 'gate',
        text: `毕业照拍完，宿舍空了。行李寄回家一半。\n\n从这个月开始，家里不再给生活费。`,
        options: [{ label: '开始找工作' }, { label: '先备考公务员', sub: '第38章：上岸需要长期积累' }, { label: '回老家再说' }],
        after: 'afterAction',
        resolve: (o, i) => {
          if (i === 1) { E.flag('examMode', 24); return '你在家附近租了个小房间，开始全职备考。'; }
          if (i === 2) { E.moveCity(S.family.home); p.housing = '住在家里'; return '你回了老家。爸妈没说什么，但家里的气氛变了。'; }
          return '你把简历投了出去。';
        },
      };
    }
    // 考公上岸判定：十一月，一年一次
    if (p.examPrep >= 6 && S.month === 11 && !p.job) {
      const myTier = C.CITIES[p.city].tier;
      // 你能去考的，是学历专业够得着、而且这个城市真的有的那些岗
      const pool = C.JOBS.filter((j) => {
        if (!j.exam) return false;
        const tr = j.tier || [1, 5];
        if (myTier < tr[0] || myTier > tr[1]) return false;
        return jobGates(S, j).every((g) => g.kind === 'exam');   // 除了"要考进去"，别的都满足
      });
      if (!pool.length) {
        TURN.msgs.push('报名的时候才发现，能报的岗位一个都没有 —— 学历或专业不符。');
        E.stress(+10);
      } else {
        // 好岗位的报录比是另一个量级
        const diff = (j) => 1 + (j.prestige - 2) * 0.35 + Math.max(0, j.gross - 6000) / 12000;
        const target = RNG_.weighted(pool, (j) => 1 / (diff(j) * diff(j)));
        const base = 0.02 + p.examPrep * 0.012 + p.skills.学业 / 900;
        const pr = clamp(base / diff(target), 0.01, 0.40);
        if (RNG_.chance(pr)) {
          const gross = Math.round(target.gross * C.CITIES[p.city].salaryMul / 100) * 100;
          TURN.msgs.push(takeJob({ ...target, city: p.city, gross }));
          TURN.msgs.push(`成绩出来了。你上岸了。你${C.pw(S)}在电话那头哭了。`);
          pushLog(S, `上岸：${target.name}。`);
          p.examPrep = 0;
        } else {
          TURN.msgs.push(`你报的是${target.name}。笔试差了 ${RNG_.float(0.5, 12).toFixed(1)} 分。`
            + `（已备考 ${p.examPrep} 个月 · 上岸率约 ${Math.round(pr * 100)}%）`);
          E.stress(+12);
        }
      }
    }

    return null;
  }

  /* ══════════════════════ 求职 ══════════════════════ */

  function doJobHunt(fullTime) {
    E.stress(+(fullTime ? 6 : 3));
    return { __choose: 'jobs', fullTime: !!fullTime };
  }

  /** 投一份简历的最终结算 */
  function submitApply(s, jobId) {
    const own = ensureBound(s);
    const j = C.JOB_MAP[jobId];
    if (!j) { if (own) unbind(); return { ok: false, msg: '没有这个岗位' }; }
    if (jobGates(s, j).length) { if (own) unbind(); return { ok: false, msg: '你还够不着这个位置' }; }
    const r = applyJob(s, j);
    s.p.applied = (s.p.applied || 0) + 1;
    if (!RNG_.chance(r.chance)) {
      const m = RNG_.pick([
        '简历投出去了。没有回音。',
        '一面过了，二面之后再也没人联系你。',
        'HR 说岗位暂时冻结，让你保持关注。',
        '收到一封模板邮件，说你很优秀但不匹配。',
      ]);
      if (own) unbind();
      return { ok: false, msg: m };
    }
    const city = s.p.city;
    const mkt = S.world.ind[j.ind] !== undefined ? S.world.ind[j.ind] / 55 : 1;
    const lv = s.p.major ? C.majorLevel(s.p.majorExp) : 0;
    const gross = Math.round(j.gross * C.CITIES[city].salaryMul
      * (0.90 + Math.max(0, lv - j.level) * 0.035)
      * clamp(mkt, 0.75, 1.3) / 100) * 100;
    const msg = takeJob({ ...j, city, gross });
    if (own) unbind();
    return { ok: true, msg };
  }

  function takeJob(o) {
    const p = S.p;
    p.job = o.id; p.jobName = o.name; p.ind = o.ind;
    p.gross = o.gross; p.net = netFromGross(o.gross);
    p.jobIntensity = o.intensity; p.jobMonths = 0; p.perf = 50; p.promo = 0; p.rep = 0;
    p.hazard = !!o.hazard;
    p.shebao = typeof o.shebao === 'boolean' ? o.shebao : (o.ind === '体制内' || o.prestige >= 3);
    p.noSocial = !!o.noSocial; p.commission = !!o.commission;
    if (o.city !== p.city) { E.moveCity(o.city); E.cash(-3000, '搬家'); }
    if (p.housing === '暂住' || p.housing === '学校宿舍' || p.housing === '住在家里') {
      p.hTier = C.CITIES[p.city].tier <= 2 ? 1 : 0;
      p.housing = housingTier(S).name;
    }
    if (o.track) {
      const tr0 = C.TRACK_MAP[o.track];
      p.trackBest = p.trackBest || {};
      // atRank：散岗接在某条线的中间。没有它的是线的第一格。
      const base = o.atRank || 0;
      const back = Math.max(0, (p.trackBest[o.track] || 0) - 1);   // 回老本行，降一格认资历
      p.track = o.track;
      p.rank = Math.min(tr0.ranks.length - 1, Math.max(base, back));
      p.rankMonths = 0;
      const r0 = tr0.ranks[p.rank];
      if (o.atRank === undefined) {
        // 从第一格进来的，岗位名就是职级名
        p.jobName = tr0.name + ' · ' + r0.name;
        p.jobIntensity = r0.intensity;
      } else {
        // 散岗保留自己的名字和工资 —— 升上去那天才换成职级的叫法
        p.jobIntensity = o.intensity;
      }
      if (p.rank > base) {
        p.jobName = tr0.name + ' · ' + r0.name;
        p.jobIntensity = r0.intensity;
        p.gross = Math.round(r0.gross * C.CITIES[p.city].salaryMul / 100) * 100;
        p.net = netFromGross(p.gross);
        TURN.msgs.push('新东家认了你之前的资历，从' + r0.name + '干起。');
      }
    } else { p.track = null; p.rank = 0; p.rankMonths = 0; }
    S.stage = 'work';
    for (let i = 0; i < 2; i++) S.npcs.push(mkNpc(RNG_, { id: 'co' + S.tick + i, name: RNG_.pick(SURNAME) + RNG_.pick(GIVEN), kind: '同事', work: true, age: 24 + RNG_.int(0, 12), city: p.city, job: o.name, income: Math.round(o.gross * RNG_.float(0.7, 1.6)), close: 20 + RNG_.int(0, 20), trust: 35 }));
    pushLog(S, `入职${o.name}（${C.CITIES[p.city].name}），税前 ${o.gross}。`);
    return `你入职了${o.name}，在${C.CITIES[p.city].name}。税前 ${E.money(o.gross)}，到手大约 ${E.money(p.net)}。`;
  }


  /* ══════════════════════ 升职 ══════════════════════ */

  /** 把每条职业线的第一格变成岗位板上的入口。只跑一次。 */
  function buildTrackEntries() {
    if (C._trackEntriesBuilt) return;
    C._trackEntriesBuilt = true;
    C.TRACKS.forEach((tr) => {
      if (!tr.ranks || !tr.ranks.length) return;
      const id = 'tk_' + tr.id;
      if (C.JOB_MAP[id]) return;
      const r0 = tr.ranks[0];
      const j = {
        id: id, name: tr.name + ' · ' + r0.name, ind: tr.ind, track: tr.id,
        gross: r0.gross, intensity: r0.intensity, prestige: r0.prestige,
        skill: (tr.entry.level || 0) * 7, tier: tr.tier || [1, 5],
        edu: tr.entry.edu || [], majors: tr.entry.majors || [],
        level: tr.entry.level || 0, capital: 0, minYears: 0,
        exam: !!tr.exam, shebao: r0.prestige >= 3 || tr.ind === '体制内',
        blurb: r0.blurb,
        trap: r0.trap || (tr.ceilingNote || ('这条线一共 ' + tr.ranks.length + ' 格，多数人停在第 ' + tr.stopAt + ' 格。')),
      };
      C.JOBS.push(j); C.JOB_MAP[id] = j;
    });
  }


  function trackOf(s) { return s.p.track ? C.TRACK_MAP[s.p.track] : null; }
  function curRank(s) { const tr = trackOf(s); return tr ? tr.ranks[s.p.rank] : null; }
  function nextRank(s) { const tr = trackOf(s); return tr && s.p.rank + 1 < tr.ranks.length ? tr.ranks[s.p.rank + 1] : null; }

  /** 争取晋升的成功率。年限是主项，其余是加减。 */
  function promoChance(s) {
    const tr = trackOf(s), cur = curRank(s), nxt = nextRank(s);
    if (!nxt) return null;
    const p = s.p, parts = [];
    const add = (label, v) => { if (Math.abs(v) >= 0.005) parts.push({ label, v }); return v; };
    const need = Math.max(12, cur.years * 12);
    const served = p.rankMonths || 0;
    let c = 0.04;

    // ① 熬够年份 —— 这一格的主项
    if (served >= need) {
      c += add('在这一格干满 ' + Math.floor(served / 12) + ' 年', 0.20 + Math.min(0.20, (served - need) / need * 0.35));
    } else {
      c += add('才干了 ' + Math.floor(served / 12) + ' 年，这一格通常要 ' + cur.years + ' 年',
               0.20 * (served / need) * 0.45);
    }
    // ② 绩效
    c += add('绩效 ' + Math.round(p.perf), (p.perf - 50) * 0.005);
    // ③ 专业等级
    const lv = p.major ? C.majorLevel(p.majorExp) : 0;
    if (nxt.level > 0) c += add('专业等级 ' + lv + ' / 这一格要 ' + nxt.level, clamp((lv - nxt.level) * 0.045, -0.30, 0.10));
    // ④ 关系 —— 谁提你，是人决定的
    const co = s.npcs.filter((x) => x.alive && x.kind.indexOf('同事') >= 0);
    const rel = co.length ? co.reduce((a, b) => a + b.close, 0) / co.length : 0;
    if (rel > 25) c += add('单位里有人替你说话', Math.min(0.14, (rel - 25) / 300));
    // ⑤ 风评 —— 这些年在这个岗位上做过的事，攒下来的那点东西
    const rep = p.rep || 0;
    if (rep) c += add(rep > 0 ? '这些年你办成过几件事' : '你手上出过事，有人记着',
                      clamp(rep * 0.006, -0.18, 0.18));
    // ⑤ 名额
    const mkt = Number.isFinite(s.world.ind[p.ind]) ? s.world.ind[p.ind] / 55 : 1;
    c += add(mkt >= 1 ? '这两年单位在扩' : '这两年单位在收', clamp((mkt - 1) * 0.20, -0.16, 0.16));
    // ⑥ 越往上越挤
    c += add('越往上位置越少', -p.rank * 0.022);
    if (p.age > 40) c += add('你已经 ' + p.age + ' 岁', -(p.age - 40) * 0.012);

    return { chance: clamp(c, 0.02, 0.85), parts: parts.sort((a, b) => Math.abs(b.v) - Math.abs(a.v)), next: nxt, cur: cur, track: tr };
  }

  /** 给 UI 用：这一格「争取晋升」能不能点，不能点是因为什么。
      按钮凭空消失是最糟的一种反馈 —— 玩家该看见「这里到头了」或者「还在冷却」。 */
  function promoStatus(s) {
    const p = s.p;
    if (!p.job) return { state: 'nojob' };
    if (!p.track) {
      const j = C.JOB_MAP[p.job] || {};
      return { state: 'noladder', why: j.noLadder || '这个位置上面没有下一格。' };
    }
    const tr = C.TRACK_MAP[p.track];
    if (!tr) return { state: 'noladder', why: '这个位置上面没有下一格。' };
    if (p.rank + 1 >= tr.ranks.length) {
      return { state: 'top', track: tr, why: '这条线你已经站在最上面一格了。再往上不是靠升的。' };
    }
    const cool = (s.flags && s.flags.promoCool) || 0;
    if (cool > s.tick) return { state: 'cooling', months: cool - s.tick, info: promoChance(s), track: tr };
    return { state: 'ok', info: promoChance(s), track: tr };
  }

  /** 结算一次晋升。失败只扣数值。 */
  function tryPromo(s) {
    const own = ensureBound(s);
    const info = promoChance(s);
    if (!info) { if (own) unbind(); return ['这条线到头了。再往上的位置不是靠升的。']; }
    const p = s.p;
    p.promoTries = (p.promoTries || 0) + 1;
    E.stress(+6);
    if (RNG_.chance(info.chance)) {
      p.rank++; p.rankMonths = 0; p.perf = 55;
      p.trackBest = p.trackBest || {};
      p.trackBest[p.track] = Math.max(p.trackBest[p.track] || 0, p.rank);
      const r = info.next, tr = info.track;
      p.jobName = tr.name + ' · ' + r.name;
      // 有些位置本来就挣得比自己的级别多（竞赛教练、提成岗）。
      // 升上去不该反而降薪 —— 升职只把工资往上推，不往下拉。
      p.gross = Math.max(p.gross, Math.round(r.gross * C.CITIES[p.city].salaryMul / 100) * 100);
      p.net = netFromGross(p.gross);
      p.jobIntensity = r.intensity;
      pushLog(S, '升为' + r.name + '。');
      if (own) unbind();
      return ['公示贴出来了。你升为' + r.name + '。', r.blurb];
    }
    E.perf(-8); E.stress(+8);
    E.flag('promoCool', 18);
    const msg2 = RNG_.pick([
      '这次是别人。名单贴出来那天，办公室里谁都没提这件事。',
      '领导找你谈了话，说"再压一压对你有好处"。',
      '名额今年没批下来。明年再说。',
    ]);
    if (own) unbind();
    return [msg2];
  }

  /* ══════════════════════ 岗位三态：可投 / 够不着 / 还没发现 ══════════════════════ */
  /* 第128章：玩家不能自动知道世界的全貌。
     A 可投  —— 条件全满足，薪资显示真值
     B 够不着 —— 看得见名字，薪资只给传闻区间，最多列两条门槛
     C ???   —— 还没发现，只有行业和一条粗略的薪资条 */

  const VIA_ACC = { family: 0.08, npc: 0.15, tenure: 0.15, city: 0.18, event: 0.18, skill: 0.20, ask: 0.25, media: 0.40 };

  function eduOf(s) { return s.p.edu === '在读高中' ? '高中' : s.p.edu; }

  // 学历是门槛，不是标签：招一本的岗位不会把 985 挡在门外
  const EDU_RANK = { '高中': 1, '专科': 2, '二本': 3, '一本': 4, '211': 5, '985': 6 };
  function eduRankOf(x) { return EDU_RANK[x] || 1; }
  function eduFloor(list) {
    if (!list || !list.length) return 0;
    return Math.min.apply(null, list.map(eduRankOf));
  }

  /** 这条岗位差什么。返回空数组表示可投。hard 越大代表这道门越硬，显示时优先。 */
  function jobGates(s, j) {
    const p = s.p, g = [];
    const edu = eduOf(s);
    const need = eduFloor(j.edu);
    if (eduRankOf(edu) < need) {
      const label = Object.keys(EDU_RANK).find((k) => EDU_RANK[k] === need) || j.edu[0];
      g.push({ kind: 'edu', hard: 3, text: `要 ${label} 以上（你是 ${edu}）` });
    }
    const myField = p.major ? (C.MAJOR_MAP[p.major] || {}).field : null;
    let lvNeed = j.level;
    if (j.majors && j.majors.length && j.majors.indexOf(p.major) < 0) {
      // 同一个方向的专业算数，但要多一级 —— 电子信息能去写软件，只是起步吃亏
      const sameField = myField && j.majors.some((id) => (C.MAJOR_MAP[id] || {}).field === myField);
      if (sameField) { lvNeed = j.level + 1; }
      else {
        const names = j.majors.slice(0, 2).map((id) => (C.MAJOR_MAP[id] || {}).name || id).join('/');
        g.push({ kind: 'major', hard: 4, text: `限 ${names} 相关专业（你读的是 ${p.major ? C.MAJOR_MAP[p.major].name : '没有专业'}）` });
      }
    }
    const lv = p.major ? C.majorLevel(p.majorExp) : 0;
    if (lvNeed > 0 && lv < lvNeed) {
      g.push({ kind: 'level', hard: 2, text: `专业 · 等级 ${lvNeed}（你现在 ${lv}）` + (lvNeed > j.level ? ' · 跨专业要多一级' : '') });
    }
    if (j.minYears > 0) {
      const yrs = Math.floor(((p.indMonths || {})[j.ind] || 0) / 12);
      // 校招：应届 + 学历够到 211 门槛的岗位，可以免工作年限。
      // 这是 985/211 应届唯一真正的特权，也是它和专科应届的全部区别。
      const neverWorked = !Object.keys(p.indMonths || {}).some((k) => p.indMonths[k] > 0);
      const fresh = neverWorked && p.gradYear && (s.year - p.gradYear) <= 1 && need >= 5;
      if (yrs < j.minYears && !fresh) {
        g.push({ kind: 'exp', hard: 3, text: `要 ${j.minYears} 年${j.ind}从业经历（你 ${yrs} 年）` });
      }
    }
    if (j.exam) g.push({ kind: 'exam', hard: 5, text: '要先考进去 · 一年一次' });
    if (j.capital > 0 && p.cash < j.capital) {
      g.push({ kind: 'capital', hard: 4, text: '启动资金约 ' + fmtMoney(j.capital) + '（你手上 ' + fmtMoney(p.cash) + '）' });
    }
    if (j.hukou && p.city !== s.family.home) {
      g.push({ kind: 'hukou', hard: 4, text: `要本地户口／社保满年限（你不是${C.CITIES[p.city].name}的）` });
    }
    return g;
  }

  /** 已经发现了吗 */
  function jobSeen(s, j) {
    if (!j.hidden) return { via: 'open' };
    return (s.seen.jobs || {})[j.id] || null;
  }

  /** 标记发现。via 决定薪资传闻的精度。 */
  function discover(s, jobId, via) {
    s.seen.jobs = s.seen.jobs || {};
    if (s.seen.jobs[jobId]) return false;
    s.seen.jobs[jobId] = { tick: s.tick, via: via };
    return true;
  }

  /** 传闻薪资区间 —— 你越是道听途说，区间越宽，而且短视频还会往上说 */
  function rumoredPay(s, j, via) {
    const real = Math.round(j.gross * C.CITIES[s.p.city].salaryMul);
    const acc = VIA_ACC[via] !== undefined ? VIA_ACC[via] : 0.25;
    const skew = via === 'media' ? 1.22 : 1;              // 人说自己收入的时候会往上说
    const lo = Math.round(real * (1 - acc) / 100) * 100;
    const hi = Math.round(real * (1 + acc) * skew / 100) * 100;
    return { lo, hi };
  }

  /** 按途径解锁一批隐藏岗位。返回解锁的岗位数组。 */
  function revealBy(s, via, filter, max) {
    const pool = C.JOBS.filter((j) => j.hidden && j.discover === via
      && !(s.seen.jobs || {})[j.id] && (!filter || filter(j)));
    if (!pool.length) return [];
    const got = [];
    for (let i = 0; i < (max || 1) && pool.length; i++) {
      const j = RNG_.pick(pool);
      pool.splice(pool.indexOf(j), 1);
      if (discover(s, j.id, via)) got.push(j);
    }
    return got;
  }

  const REVEAL_LINE = {
    family: (j) => `你才知道${j.ind}里还有「${j.name}」这种位置——家里有人干这行，只是从来没细说过。`,
    tenure: (j) => `在${j.ind}待久了，你开始看见一些以前不知道存在的位置：${j.name}。`,
    ask: (j) => `你托人打听了一圈，有人提了一句「${j.name}」。他说这种位置不挂在网上。`,
    media: (j) => `刷到一条视频，说有人在做${j.name}。评论区一半在问怎么进，一半在骂博主。`,
    skill: (j) => `你现在看得懂${j.name}这种岗位在干什么了。以前看了也看不进去。`,
    npc: (j) => `聊到一半才知道，对方的家里人就在做${j.name}。`,
    city: (j) => `在这座城市住久了，你发现这里有${j.name}这种工作。`,
    event: (j) => `这一趟折腾下来，你意外知道了${j.name}这条路。`,
  };

  /** 每月自动跑的发现途径 */
  function discoveryTick() {
    const p = S.p, got = [];
    // tenure：在一个行业熬满三年，才看得见这行的纵深
    if (p.ind && ((p.indMonths || {})[p.ind] || 0) === 36) {
      got.push.apply(got, revealBy(S, 'tenure', (j) => j.ind === p.ind, 2));
    }
    // skill：专业等级过线，你才"看得懂"某些岗位的存在
    const lv = p.major ? C.majorLevel(p.majorExp) : 0;
    if (lv >= 6 && !S.flags._skillReveal) {
      S.flags._skillReveal = 1e9;
      got.push.apply(got, revealBy(S, 'skill', null, 1));
    }
    // media：不花任何东西，人人都有，但它的信息最不可靠
    if (RNG_.chance(0.035)) got.push.apply(got, revealBy(S, 'media', null, 1));
    // npc：关系够深的人，会不经意说出你不知道的世界
    if (RNG_.chance(0.05) && S.npcs.some((x) => x.alive && x.close >= 65 && x.trust >= 55)) {
      got.push.apply(got, revealBy(S, 'npc', null, 1));
    }
    got.forEach((j) => {
      TURN.msgs.push('【路子】' + REVEAL_LINE[j.discover](j));
    });
  }

  /** 岗位板：把所有岗位分成三态 */
  function jobBoard(s) {
    const open = [], locked = [], unknownByInd = {};
    if (!s.seen) s.seen = { jobs: {} };
    const myTier = C.CITIES[s.p.city].tier;
    C.JOBS.forEach((j) => {
      const tr = j.tier || [1, 5];
      if (myTier < tr[0] || myTier > tr[1]) return;   // 这个城市没有这种岗位
      const seen = jobSeen(s, j);
      if (!seen) {
        // 完全没接触过的行业，连 ??? 都不给 —— 第四态
        const touched = (s.p.indMonths || {})[j.ind] || 0;
        const familyInd = s.npcs.some((n) => n.family && n.jobInd === j.ind);
        if (touched > 0 || familyInd || j.ind === s.p.ind) {
          unknownByInd[j.ind] = (unknownByInd[j.ind] || 0) + 1;
        }
        return;
      }
      const g = jobGates(s, j);
      const item = { job: j, via: seen.via, gates: g };
      if (g.length === 0) open.push(item); else locked.push(item);
    });
    locked.forEach((x) => x.gates.sort((a, b) => b.hard - a.hard));
    open.sort((a, b) => b.job.gross - a.job.gross);
    locked.sort((a, b) => a.gates.length - b.gates.length || b.job.gross - a.job.gross);
    return { open, locked, unknown: unknownByInd };
  }

  /** 投一份简历。信息是公开的，结果不是。
      返回 {chance, parts} —— parts 是给玩家看的拆解，因为"为什么是这个数"比"是多少"更重要。 */
  function applyJob(s, j) {
    const p = s.p;
    const lv = p.major ? C.majorLevel(p.majorExp) : 0;
    const myField = p.major ? (C.MAJOR_MAP[p.major] || {}).field : null;
    const myInds = C.FIELD_IND[myField] || [];
    const parts = [];
    const add = (label, v) => { if (Math.abs(v) >= 0.005) parts.push({ label, v }); return v; };

    let c = 0.26;

    // ① 专业相关度 —— 最重的一项。学什么，决定别人愿不愿意看你的简历。
    let fit, fitLabel;
    if (j.majors.length && j.majors.indexOf(p.major) >= 0) { fit = 0.22; fitLabel = '专业正好对口'; }
    else if (j.majors.length) { fit = 0.02; fitLabel = '同方向跨专业'; }
    else if (myInds.indexOf(j.ind) >= 0) { fit = 0.14; fitLabel = '不限专业，但你这行是对的'; }
    else if (!p.major) { fit = -0.10; fitLabel = '你没有专业'; }
    else { fit = -0.13; fitLabel = '不限专业，但和你学的没关系'; }
    c += add(fitLabel, fit);

    // ② 专业等级余量
    c += add('专业等级 ' + lv + ' / 要求 ' + j.level,
             clamp((lv - j.level) * 0.06, -0.18, 0.24));

    // ③ 同行业干过多久
    const yrs = Math.floor(((p.indMonths || {})[j.ind] || 0) / 12);
    if (yrs > j.minYears) c += add(j.ind + '干了 ' + yrs + ' 年', clamp((yrs - j.minYears) * 0.03, 0, 0.15));
    else if (yrs === 0 && j.prestige >= 4) c += add('没在这行干过', -0.08);

    // ④ 学历余量
    const er = eduRankOf(eduOf(s)) - eduFloor(j.edu);
    if (er > 0) c += add('学历高于门槛', clamp(er * 0.04, 0, 0.12));

    // ⑤ 世界层
    const mkt = Number.isFinite(s.world.ind[j.ind]) ? s.world.ind[j.ind] / 55 : 1;
    c += add(j.ind + (mkt >= 1 ? '在招人' : '在收缩'), clamp((mkt - 1) * 0.25, -0.2, 0.2));
    if (s.flags && s.flags.referral && s.flags.referral > s.tick) c += add('有人内推', 0.22);
    c += add(j.prestige >= 3 ? '这个位置本身抢手' : '这个位置没什么人抢',
             -(j.prestige - 2) * 0.055);
    if (p.age > 35) c += add('你已经 ' + p.age + ' 岁', -(p.age - 35) * 0.02);

    return { chance: clamp(c, 0.03, 0.92), parts: parts.sort((a, b) => Math.abs(b.v) - Math.abs(a.v)) };
  }

  /* ══════════════════════ 情报（第97/128章）══════════════════════ */

  /** 信源要说得通：没工作的人没有同事，学生也没有领导。 */
  function srcOk(src) {
    if (src === 'colleague' || src === 'boss' || src === 'inside') return !!S.p.job;
    if (src === 'classmate') return S.p.age >= 17;
    return true;
  }

  function genRumor(srcFilter) {
    const pool = C.RUMORS.filter((r) => {
      if (!r.when(S)) return false;
      if ((S.rumorLog || []).some((x) => x.id === r.id && S.tick - x.tick < 18)) return false;  // 同一条别刷两遍
      return r.src.some((x) => srcOk(x) && (!srcFilter || srcFilter.indexOf(x) >= 0));
    });
    if (!pool.length) return;
    const r = RNG_.pick(pool);
    const cands = r.src.filter((x) => srcOk(x) && (!srcFilter || srcFilter.indexOf(x) >= 0));
    const src = RNG_.pick(cands);
    const def = C.RUMOR_SOURCES[src];
    const isTrue = RNG_.chance(def.truth);
    const item = { id: r.id, src, label: def.label, stars: def.stars, text: r.text(S), truth: isTrue, tick: S.tick, resolved: false };
    S.rumors.push(item);
    if (!S.rumorLog) S.rumorLog = [];
    S.rumorLog.push({ id: r.id, label: def.label, text: item.text, truth: isTrue, tick: S.tick });
    if (S.rumorLog.length > 200) S.rumorLog.shift();
    if (isTrue && r.onTrue) r.onTrue(S, E);
    if (!isTrue && r.onFalse) r.onFalse(S, E);
  }

  function genRumors() {
    S.rumors = S.rumors.filter((r) => S.tick - r.tick < 4);
    const radius = S.family.infoRadius + (S.p.job ? 1 : 0) + Math.floor(E.groupLevel('同学') / 40);
    // 传闻现在直接进当月记录，密度要压住，否则会把真正的事件淹掉
    const n = RNG_.chance(0.45) ? 0 : RNG_.int(1, Math.min(2, Math.max(1, radius)));
    for (let i = 0; i < n; i++) genRumor(null);
  }

  function doInvestigate() {
    if (!S.rumors.length) { E.stress(+1); return ['你到处打听了一圈，没听到什么。']; }
    const r = RNG_.pick(S.rumors.filter((x) => !x.verified)) || S.rumors[0];
    const acc = clamp(0.55 + E.groupLevel('同事') / 250 + E.groupLevel('同学') / 250 + (S.p.talent === 'social' ? 0.15 : 0), 0, 0.95);
    const correct = RNG_.chance(acc);
    r.verified = true;
    r.verdict = correct ? r.truth : !r.truth;
    E.stress(+2);
    return [`你专门去打听了"${r.text}"这件事。\n\n多方问下来：${r.verdict ? '看起来是真的。' : '大概率是谣传。'}${correct ? '' : ''}`];
  }
  E.investigate = doInvestigate;

  /** 打听路子：花一格去问人。问得到什么，取决于你认识谁。 */
  function doAskPath() {
    const social = E.groupLevel('同事') + E.groupLevel('同学') + E.groupLevel('老乡');
    const pr = clamp(0.28 + social / 320 + (S.p.talent === 'social' ? 0.15 : 0), 0.15, 0.8);
    E.stress(+3);
    E.cash(-RNG_.int(100, 400), '请人吃饭');
    if (!RNG_.chance(pr)) return ['你问了一圈。大家都说"我帮你留意着"，然后就没了。'];
    const got = revealBy(S, 'ask', null, 1);
    if (!got.length) return ['这回真问出点东西 —— 但都是你已经知道的。'];
    return ['【路子】' + REVEAL_LINE.ask(got[0])];
  }
  E.askPath = doAskPath;

  /* ══════════════════════ 医疗 ══════════════════════ */

  function doCheckup() {
    const p = S.p;
    E.cash(-Math.round(600 * C.CITIES[p.city].cost), '体检');
    const lines = [`体检报告出来了。健康 ${Math.round(p.health)}，压力 ${Math.round(p.stress)}。`];
    if (!p.diseases.length) {
      // 提前发现潜在风险
      if (p.stress > 70) lines.push('医生看了眼你的指标，说"你这个压力有点大了，长期这样要出问题"。');
      else if (p.health < 65) lines.push('几项指标在临界线上。医生建议半年后复查。');
      else lines.push('没什么大问题。');
    } else {
      p.diseases.forEach((d) => lines.push(`已确诊：${C.DISEASE_MAP[d.id].name}（已 ${d.months} 个月）。`));
    }
    // 体检本身不给数值收益，它只把看不见的变成看得见的
    return lines;
  }

  function doTreat() {
    const p = S.p;
    if (!p.diseases.length) return ['你去了趟医院，排了半天队，医生说没什么事。'];
    const d = p.diseases[0];
    const def = C.DISEASE_MAP[d.id];
    const gross = def.cost;
    const rate = p.shebao ? 0.28 : 1;
    const pay = Math.round(gross * rate);
    if (p.cash < pay) {
      const need = pay - p.cash;
      const fromFam = Math.min(S.family.cash, need);
      E.familyCash(-fromFam); E.cash(fromFam, '家里凑的钱');
      if (p.cash < pay) { p.debt += pay - p.cash; p.debtKind = p.debtKind || '医疗欠款'; E.cash(pay - p.cash, '借款'); }
    }
    E.cash(-pay, '医药费');
    E.stress(+4);
    if (def.incurable) { E.health(+1); return [`${def.name}控制住了，但治不好，只能一直吃药。这个月花了 ${E.money(pay)}${p.shebao ? '（已报销）' : '（全自费）'}。`]; }
    const p2 = def.acute ? 0.72 : 0.56;
    if (def.kind === 'mind') E.stress(-12);
    if (RNG_.chance(p2)) {
      p.diseases = p.diseases.filter((x) => x.id !== d.id);
      E.health(+3);
      return [`${def.name}治好了。花了 ${E.money(pay)}${p.shebao ? '（医保报了大部分）' : '（没有医保，全自费）'}。`];
    }
    return [`还在治${def.name}，这个月花了 ${E.money(pay)}。没什么起色。`];
  }

  /* ══════════════════════ 人情 ══════════════════════ */

  function doFavorAsk() {
    const cands = S.npcs.filter((n) => n.alive && n.close > 35);
    if (!cands.length) return ['你想找个人帮忙，翻了一遍通讯录，发现没人可找。'];
    const n = RNG_.weighted(cands, (x) => Math.max(1, x.close + x.favor)) || RNG_.pick(cands);
    const cost = RNG_.int(800, 3000);
    E.cash(-cost, '烟酒/礼品');
    n.favor -= 18; n.close += 3;
    // 第126章：贵人有自己的处境
    const busy = n.health < 60 || RNG_.chance(0.3);
    E.stress(+3);
    if (busy) return [`你带着东西去了${n.name}家。他很客气地收下了，说"这事儿我问问看"。\n\n然后就没有然后了。`];
    E.flag('referral', 8);
    return [`${n.name}收了东西，也真的上心了。他说"我给你问问"，语气不一样。`];
  }

  function doPullStrings(what) {
    const cands = S.npcs.filter((n) => n.alive && n.favor > 20 && n.work);
    if (!cands.length) return '你想找人说情，但真到这时候，发现没有能开口的人。';
    const n = RNG_.pick(cands);
    n.favor -= 40;
    const p = clamp(0.25 + n.favor / 200 + n.close / 300, 0, 0.75);
    if (RNG_.chance(p)) { E.stress(+8); return `${n.name}帮你说了话。名单改了，你留下来了。这份人情你欠着。`; }
    const pay = Math.round(S.p.net * 2);
    E.cash(pay, '赔偿'); E.quitJob(); E.stress(+22);
    return `${n.name}试了，但他自己也顶不住。你还是走了。人情用掉了，事没办成。`;
  }

  /* ══════════════════════ 婚恋 ══════════════════════ */

  function doBlindDate() {
    const p = S.p;
    const has = { 房: !!p.house, 车: false, 户口: p.hukou === '城镇', 收入: p.net };
    const score = (p.net / 1000) + (p.house ? 12 : 0) + (p.edu === '985' ? 8 : p.edu === '211' ? 6 : p.edu === '一本' ? 4 : 0) + (p.ind === '体制内' ? 10 : 0) + p.skills.沟通 / 12 - (p.age > 30 ? (p.age - 30) * 1.5 : 0);
    E.cash(-RNG_.int(200, 600), '相亲');
    E.stress(+4);
    if (RNG_.chance(clamp(0.15 + score / 90, 0.05, 0.7))) {
      const n = mkNpc(RNG_, { id: 'rom' + S.tick, name: RNG_.pick(SURNAME) + RNG_.pick(GIVEN), kind: '相亲对象', age: p.age + RNG_.int(-3, 3), city: p.city, close: 45, trust: 40, romance: true });
      S.npcs.push(n);
      return [`见了一面，聊得还行。加了微信。\n\n（对方叫${n.name}。介绍人事后跟你说，人家条件不差，主要看你有没有房。）`];
    }
    return ['见了一面。吃了顿饭，聊了收入、房子、户口、父母。第二天没有下文。'];
  }

  function doConfess() {
    const cands = S.npcs.filter((n) => n.romance && n.close > 55 && n.alive);
    if (!cands.length) return ['现在没有这样的人。'];
    const n = RNG_.pick(cands);
    const p = clamp(n.close / 130 + S.p.skills.沟通 / 300, 0.1, 0.85);
    if (RNG_.chance(p)) {
      S.p.partner = n.id; n.kind = '伴侣'; n.close += 15;
      E.stress(-8);
      pushLog(S, `你和${n.name}在一起了。`);
      return [`你和${n.name}在一起了。`];
    }
    n.close -= 25; n.romance = false; E.stress(+12);
    return [`${n.name}说，还是做朋友吧。之后你们聊天少了很多。`];
  }

  /* ══════════════════════ 事件抽取 ══════════════════════ */

  function rollEvent() {
    // 第132章：大量平淡日子。基础触发率压得很低。
    // 例外：春节。第85章 —— 它是家庭关系的年度大考，不该被随机吞掉。
    const base = (S.month === 2 && S.p.age >= 18) ? 0.85 : 0.30;
    if (!RNG_.chance(base)) return null;

    const pool = C.EVENTS.filter((e) => {
      if (e.once && S.seen[e.id]) return false;
      if (S.cd[e.id] && S.tick < S.cd[e.id]) return false;
      try { return e.when ? e.when(S) : true; } catch (err) { return false; }
    });
    if (!pool.length) return null;
    // 岗位事件是这份工作的质感。全池子一百多条通用事件会把它们稀释成几年一次，
    // 所以只要在岗，就给它们留一块固定份额 —— 你干的这份活，得让你感觉得到。
    let use = pool;
    if (S.p.job && RNG_.chance(0.42)) {
      const only = pool.filter((x) => x.job);
      if (only.length) use = only;
    }
    // 出过的次数越多，再出的权重越低 —— 免得一辈子反复经历同三件事
    const e = RNG_.weighted(use, (x) => {
      const base = (typeof x.weight === 'function' ? x.weight(S) : x.weight) || 1;
      const times = S.seen[x.id] || 0;
      return base / (1 + 0.75 * times);
    });
    if (!e) return null;

    S.cd[e.id] = S.tick + (e.cooldown || 6);
    S.seen[e.id] = (S.seen[e.id] || 0) + 1;
    const d = e.dynamic ? e.dynamic(S, RNG_) : null;
    if (e.dynamic && (!d || !d.npc)) return null;
    e._d = d;
    e._text = d && e.text2 ? e.text2(S, d) : (typeof e.text === 'function' ? e.text(S) : e.text);
    return e;
  }

  /* ══════════════════════ 定时效果处理器（可序列化）══════════════════════ */

  const HANDLERS = {
    repay: (s, E2, d, rng) => {
      const n = s.npcs.find((x) => x.id === d.npcId); if (!n) return;
      if (rng.chance(0.5 + n.trust / 200)) { E2.cash(d.amt, `${n.name}还钱`); n.owesYou = 0; E2.log(`${n.name}把 ${d.amt} 块还了。`); }
      else { n.close = Math.max(0, n.close - 20); n.trust = Math.max(0, n.trust - 30); E2.log(`${n.name}的钱一直没还。你发消息，他隔很久才回。`); }
    },
    lateDiag: (s, E2, d, rng) => {
      const pool = C.DISEASES.filter((x) => x.minAge <= s.p.age && !s.p.diseases.some((y) => y.id === x.id) && x.sev >= 2);
      if (!pool.length || s.p.diseases.length >= 2) return;
      const pick = rng.weighted(pool, (x) => 10 / x.sev);
      s.p.diseases.push({ id: pick.id, months: 6 });
      E2.log(`【身体】撑不住了，去医院查了。${pick.name}。医生看着片子说："怎么拖到现在才来。"`);
      E2.stress(12);
    },
    gymDust: (s, E2) => { E2.log('健身卡到期了。后半年一次也没去。'); },
    scamBust: (s, E2, d) => {
      E2.log(`平台跑路了。${E2.money(d.amt)} 没了。${d.heavy ? '老同学的电话也打不通——后来才知道，他投得比你多。' : '幸好你只投了一点。'}`);
      E2.stress(d.heavy ? 30 : 12);
    },
  };

  /* ══════════════════════ 可选行动列表 ══════════════════════ */

  function actionsFor(s) {
    return C.ACTIONS.filter((a) => {
      if (a.stages.indexOf(s.stage) < 0) return false;
      if (a.avail) { try { return a.avail(s); } catch (e) { return false; } }
      return true;
    });
  }

  /* ══════════════════════ 存档 ══════════════════════ */

  function save(s) {
    const c = JSON.parse(JSON.stringify({ ...s, _turn: null, _await: null }));
    return JSON.stringify(c);
  }
  function load(str) {
    buildTrackEntries();
    const s = JSON.parse(str);
    C.INDUSTRIES.forEach((i) => { if (!Number.isFinite(s.world.ind[i])) s.world.ind[i] = 55; });
    if (!Number.isFinite(s.p.rep)) s.p.rep = 0;
    s._turn = null; s._await = null;
    return s;
  }

  global.Engine = {
    newGame, step, choose, actionsFor, save, load, trade, portfolioValue,
    jobBoard, jobGates, applyJob, discover, rumoredPay, submitApply, revealBy, REVEAL_LINE,
    promoChance, promoStatus, tryPromo, trackOf, curRank, nextRank,
    netFromGross, livingCost, housingCost, skillCap, SKILLS,
    money: E.money,
  };
})(window);
