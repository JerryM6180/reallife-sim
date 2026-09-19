/* 无头回归机器人。
   引擎零 DOM 依赖，所以可以不开浏览器，让机器人一口气活几百辈子 ——
   谁的逗号漏了、哪条事件的文案里冒出 undefined、哪次改动让同种子不再复现，
   都在合进 main 之前炸在这里，而不是炸在朋友正在玩的那个链接上。

     node tools/bot.js                  默认 200 辈子
     node tools/bot.js --lives 50       少跑点
     node tools/bot.js --seed 1234      只重放出事的那一辈子（失败信息里会给种子）
     node tools/bot.js --never          顺便列出一次都没触发过的事件

   机器人自己的随机数也是种子化的：同一条命令，任何机器上结果都一样。 */
'use strict';

/* ══════════════════════ 核心：不依赖 Node，浏览器里也能跑 ══════════════════════ */

function mulberry(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 五种活法。数字是偏好倍数，没写的行动权重是 1 —— 所以谁都有可能点到任何按钮。
const PERSONAS = {
  grinder: { work_full: 6, work_ot: 4, work_promo: 9, study_hard: 6, study_major: 5, study_class: 3, study_exam_gov: 3 },
  drifter: { rest_lie: 5, rest_game: 5, work_slack: 7, money_lottery: 2, money_odd: 2 },
  hustler: { money_side: 5, money_live: 4, money_stall: 4, money_invest: 6, money_gamble: 3, house_look: 3, house_buy: 7, house_prepay: 3, work_full: 3 },
  social: { soc_colleague: 4, soc_drink: 4, soc_classmate: 4, soc_blind: 5, soc_path: 5, soc_ask: 4, soc_gift: 3, fam_parents: 5, fam_care: 5, life_confess: 7, fam_partner: 5, work_full: 3 },
  chaos: {},
};
const PERSONA_IDS = Object.keys(PERSONAS);
// 不压一压的话，随机点出来的人生全是「辞职 → 搬家 → 辞职」
const RARE = { life_quit: 0.12, life_move: 0.12, life_home: 0.08, life_breakup: 0.15 };

const BAD_TEXT = /undefined|NaN|\[object /;
const MAX_TICKS = 1300;   // 16 岁起 108 年。活过这个数说明死亡模型坏了。

function makeBot(win) {
  const C = win.CONTENT, Eng = win.Engine;
  const fails = [];
  const seenFail = {};

  function fail(ctx, msg) {
    const key = msg.replace(/\d+/g, '#');
    if (seenFail[key]) { seenFail[key].n++; return; }
    seenFail[key] = { n: 1 };
    fails.push({ ctx, msg, ref: seenFail[key] });
  }

  function lint(ctx, where, str) {
    if (typeof str === 'string' && BAD_TEXT.test(str)) {
      fail(ctx, `文案里漏出了 ${str.match(BAD_TEXT)[0]} —— ${where}：「${str.slice(0, 90)}」`);
    }
  }

  function checkState(ctx, s) {
    const p = s.p;
    ['cash', 'debt', 'mortgage', 'gross', 'net', 'health', 'stress', 'age', 'perf', 'rep'].forEach((k) => {
      if (!Number.isFinite(p[k])) fail(ctx, `p.${k} 不是数：${p[k]}`);
    });
    Object.keys(p.skills).forEach((k) => {
      if (!Number.isFinite(p.skills[k])) fail(ctx, `技能「${k}」不是数：${p.skills[k]}`);
    });
    if (p.health < 0 || p.health > 100) fail(ctx, `健康出界：${p.health}`);
    if (p.stress < 0 || p.stress > 100) fail(ctx, `压力出界：${p.stress}`);
    if (p.job && p.track) {
      const tr = C.TRACK_MAP[p.track];
      if (!tr) fail(ctx, `在岗，但职业线 ${p.track} 不存在`);
      else if (!tr.ranks[p.rank]) fail(ctx, `${p.track} 线没有第 ${p.rank} 格`);
    }
  }

  function lintResult(ctx, r) {
    if (r.need === 'choice') {
      const ch = r.choice;
      if (!ch.options || !ch.options.length) fail(ctx, `选择「${ch.title}」一个选项都没有 —— 玩家会卡死在这里`);
      lint(ctx, '选择标题', ch.title); lint(ctx, '选择正文', ch.text);
      (ch.options || []).forEach((o) => { lint(ctx, `「${ch.title}」的选项`, o.label); lint(ctx, `「${ch.title}」的选项说明`, o.sub); });
    } else if (r.summary) {
      r.summary.msgs.forEach((m) => lint(ctx, '月结消息', m));
      (r.summary.rumors || []).forEach((x) => lint(ctx, '传闻', x.text));
    }
  }

  /** 活一辈子。返回 { s, ticks, promos, hadJob } */
  function playLife(seed, bgId, persona) {
    const rnd = mulberry((seed ^ 0x9E3779B9) >>> 0);
    const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
    const pref = PERSONAS[persona];
    const s = Eng.newGame({ bgId, talent: 'random', name: '', seed });
    const ctx = { seed, bgId, persona, tick: 0, last: null };
    let promos = 0, hadJob = false;

    function answer(r) {
      // 一格时间里可能连着弹几个选择（关口 → 事件）
      let guard = 0;
      while (r && r.need === 'choice') {
        if (++guard > 12) { fail(ctx, '同一格时间里连弹了 12 个以上的选择，像是死循环'); break; }
        lintResult(ctx, r);
        const ch = r.choice;
        if (ch.kind === 'jobs') {
          const open = Eng.jobBoard(s).open;
          for (let i = 0; i < 3 && open.length; i++) {
            const it = persona === 'grinder' ? open[Math.min(open.length - 1, Math.floor(rnd() * 4))] : pick(open);
            const a = Eng.submitApply(s, it.job.id);
            lint(ctx, '投递结果', a.msg);
            if (a.ok) break;
          }
          r = Eng.choose(s, 0);
        } else if (ch.kind === 'market') {
          const roll = rnd();
          if (roll < 0.5 && s.p.cash > 3000) {
            lint(ctx, '买入结果', Eng.trade(s, pick(C.INSTRUMENTS).id, Math.floor(s.p.cash * 0.25)).msg);
          } else if (roll < 0.75) {
            const held = Object.keys(s.holdings.pos).filter((id) => s.holdings.pos[id].shares > 0);
            if (held.length) lint(ctx, '卖出结果', Eng.trade(s, pick(held), 0, true).msg);
          }
          r = Eng.choose(s, 0);
        } else {
          r = Eng.choose(s, Math.floor(rnd() * Math.max(1, ch.options.length)));
        }
      }
      return r;
    }

    let r = null;
    while (s.stage !== 'dead' && s.tick < MAX_TICKS) {
      ctx.tick = s.tick;
      const acts = Eng.actionsFor(s);
      if (!acts.length) { fail(ctx, `阶段 ${s.stage} 下一个能点的行动都没有`); break; }

      let total = 0;
      const w = acts.map((a) => {
        let x = pref[a.id] || 1;
        if (persona !== 'chaos' && RARE[a.id]) x *= RARE[a.id];
        if (s.stage === 'gap' && (a.id === 'work_find' || a.id === 'work_interview')) x *= 8;
        total += x; return x;
      });
      let t = rnd() * total, idx = 0;
      while (idx < acts.length - 1 && (t -= w[idx]) > 0) idx++;
      const act = acts[idx];
      ctx.last = act.id;

      const rankBefore = s.p.rank, jobBefore = s.p.job;
      r = Eng.step(s, act.id);
      if (r.error) { fail(ctx, `行动 ${act.id} 报错：${r.error}`); break; }
      r = answer(r);
      if (!r) { fail(ctx, `行动 ${act.id} 之后引擎什么都没返回`); break; }
      lintResult(ctx, r);
      checkState(ctx, s);
      if (s.p.job) hadJob = true;
      if (s.p.job && s.p.job === jobBefore && s.p.rank > rankBefore) promos++;

      // 引擎会吞掉 when() 里的异常（当作条件不满足），于是写坏的条件只表现为
      // 「这条事件永远不出」。每两年把所有条件明着跑一遍，让它炸出来。
      if (s.tick % 24 === 0) {
        C.EVENTS.forEach((e) => {
          if (!e.when) return;
          try { e.when(s); } catch (err) { fail(ctx, `事件 ${e.id} 的触发条件抛了异常：${err.message}`); }
        });
      }
    }
    if (s.stage !== 'dead') fail(ctx, `活到了第 ${s.tick} 格（${s.p.age} 岁）还没死`);
    return { s, ticks: s.tick, promos, hadJob };
  }

  /** 不用开局就能查的东西：重复的 id、接不上的线、写错的线名 */
  function staticChecks() {
    const ctx = { static: true };
    const dup = (arr, what) => {
      const seen = {};
      arr.forEach((x) => { if (seen[x.id]) fail(ctx, `${what} id 重复：${x.id}`); seen[x.id] = 1; });
    };
    dup(C.EVENTS, '事件'); dup(C.JOBS, '岗位'); dup(C.TRACKS, '职业线'); dup(C.ACTIONS, '行动');

    C.TRACKS.forEach((tr) => {
      if (!tr.ranks || tr.ranks.length < 2) fail(ctx, `职业线 ${tr.id} 不到两格，算不上一条线`);
      (tr.ranks || []).forEach((rk, i) => {
        if (!rk.name || !Number.isFinite(rk.gross)) fail(ctx, `职业线 ${tr.id} 第 ${i} 格缺名字或工资`);
      });
    });
    C.JOBS.forEach((j) => {
      if (j.track && !C.TRACK_MAP[j.track]) fail(ctx, `岗位 ${j.id} 挂在不存在的职业线 ${j.track} 上`);
      if (!Number.isFinite(j.gross)) fail(ctx, `岗位 ${j.id} 没有工资`);
    });
    const rep = C.JOBTRACK_REPORT;
    if (rep && rep.miss && rep.miss.length) {
      fail(ctx, `jobtracks.js 里有 ${rep.miss.length} 个岗位没对上：${rep.miss.join('、')}`);
    }
    C.EVENTS.forEach((e) => {
      if (e.job && !C.TRACK_MAP[e.track]) fail(ctx, `岗位事件 ${e.id} 写的职业线 ${e.track} 不存在 —— 它永远不会触发`);
      if (e.options && !e.options.length) fail(ctx, `事件 ${e.id} 的 options 是空的`);
      (e.options || []).forEach((o, i) => {
        if (!o.label) fail(ctx, `事件 ${e.id} 第 ${i + 1} 个选项没有 label`);
        if (typeof o.apply !== 'function') fail(ctx, `事件 ${e.id} 第 ${i + 1} 个选项没有 apply`);
      });
    });
  }

  function runAll(opts) {
    const lives = opts.lives || 200, seed0 = opts.seed0 || 1;
    staticChecks();

    const bgs = C.BACKGROUNDS.map((b) => b.id);
    const ages = [], fired = {};
    let worked = 0, promos = 0, ticks = 0;
    for (let i = 0; i < lives; i++) {
      const seed = seed0 + i * 7919;
      const bgId = opts.bg || bgs[i % bgs.length];
      const persona = opts.persona || PERSONA_IDS[i % PERSONA_IDS.length];
      let life;
      try { life = playLife(seed, bgId, persona); } catch (err) {
        fail({ seed, bgId, persona, crashed: true }, `崩了：${err && err.stack ? err.stack.split('\n').slice(0, 4).join(' ⏎ ') : err}`);
        continue;
      }
      ages.push(life.s.p.age); ticks += life.ticks; promos += life.promos;
      if (life.hadJob) worked++;
      Object.keys(life.s.seen).forEach((id) => { if (id !== 'jobs') fired[id] = (fired[id] || 0) + life.s.seen[id]; });

      // 同种子必须同人生。前几辈子各重放一遍，存档逐字节比。
      if (i < 4) {
        try {
          const again = playLife(seed, bgId, persona);
          if (Eng.save(again.s) !== Eng.save(life.s)) {
            fail({ seed, bgId, persona }, '同一个种子、同样的选择，两次活出了不一样的人生 —— 有人绕过 RNG 取了随机，或者改到了共享的内容数据');
          }
        } catch (err) { /* 上面已经报过了 */ }
      }
    }

    ages.sort((a, b) => a - b);
    const never = C.EVENTS.filter((e) => !fired[e.id]).map((e) => e.id);
    return {
      fails, lives, ticks,
      medianAge: ages.length ? ages[ages.length >> 1] : null,
      minAge: ages[0], maxAge: ages[ages.length - 1],
      worked, promos,
      events: C.EVENTS.length, eventsFired: C.EVENTS.length - never.length,
      jobEvents: C.EVENTS.filter((e) => e.job).length,
      jobEventsFired: C.EVENTS.filter((e) => e.job && fired[e.id]).length,
      never,
      content: { tracks: C.TRACKS.length, ranks: C.TRACKS.reduce((n, t) => n + t.ranks.length, 0), jobs: C.JOBS.length },
    };
  }

  return { runAll, playLife, staticChecks, fails };
}

/* ══════════════════════ Node 外壳 ══════════════════════ */

if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
  const fs = require('fs'), path = require('path'), vm = require('vm');
  const ROOT = path.join(__dirname, '..');
  const argv = process.argv.slice(2);
  const arg = (name, dflt) => { const i = argv.indexOf('--' + name); return i >= 0 ? argv[i + 1] : dflt; };
  const problems = [];

  // 1. 加载顺序以 index.html 为准 —— 玩家实际跑的就是它
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const scripts = [];
  html.replace(/<script\s+src="([^"?]+)[^"]*"/g, (m, src) => { scripts.push(src); return m; });

  // 2. 新文件要登记三处：js/ 里有它、index.html 里有它、build.py 里有它
  const onDisk = fs.readdirSync(path.join(ROOT, 'js')).filter((f) => f.endsWith('.js')).sort();
  const inHtml = scripts.map((x) => x.replace(/^js\//, ''));
  const py = fs.readFileSync(path.join(ROOT, 'build.py'), 'utf8');
  const pyList = (py.match(/for f in \[([^\]]+)\]/) || [, ''])[1].split(',').map((x) => x.trim().replace(/['"]/g, '')).filter(Boolean);
  onDisk.forEach((f) => { if (inHtml.indexOf(f) < 0) problems.push(`js/${f} 没有登记进 index.html —— 线上试玩不会加载它`); });
  inHtml.forEach((f) => { if (onDisk.indexOf(f) < 0) problems.push(`index.html 引用了不存在的 js/${f}`); });
  if (inHtml.join(',') !== pyList.join(',')) {
    problems.push(`index.html 和 build.py 的脚本清单对不上：\n      index.html: ${inHtml.join(' ')}\n      build.py:   ${pyList.join(' ')}`);
  }

  // 3. 逐个编译（语法），再按顺序装进一个假的 window。ui.js 要 DOM，只查语法不执行。
  const sandbox = { console };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  let loaded = true;
  scripts.forEach((src) => {
    if (!loaded) return;
    const file = path.join(ROOT, src);
    if (!fs.existsSync(file)) { loaded = false; return; }
    let code;
    try { code = new vm.Script(fs.readFileSync(file, 'utf8'), { filename: src }); } catch (err) {
      problems.push(`${src} 语法错误：${err.message}\n${(err.stack || '').split('\n').slice(0, 3).join('\n')}`);
      loaded = false; return;
    }
    if (/(^|\/)ui\.js$/.test(src)) return;
    try { code.runInContext(sandbox); } catch (err) {
      problems.push(`${src} 加载时崩了：${err.stack || err}`);
      loaded = false;
    }
  });

  let rep = null;
  if (loaded) {
    const bot = makeBot(sandbox);
    const one = arg('seed');
    const t0 = Date.now();
    rep = bot.runAll(one
      ? { lives: 1, seed0: +one, bg: arg('bg'), persona: arg('persona') }
      : { lives: +arg('lives', 200), seed0: 1 });
    rep.ms = Date.now() - t0;
    rep.fails.forEach((f) => {
      const c = f.ctx;
      const where = c.static ? '静态检查'
        : `种子 ${c.seed} · ${c.bgId} · ${c.persona}` + (c.tick !== undefined ? ` · 第 ${c.tick + 1} 格 · 刚点了 ${c.last}` : '');
      const again = c.static ? '' : `\n      重放：node tools/bot.js --seed ${c.seed} --bg ${c.bgId} --persona ${c.persona}`;
      problems.push(`${f.msg}\n      ${where}${f.ref.n > 1 ? ` · 同类问题共 ${f.ref.n} 次` : ''}${again}`);
    });
  }

  if (rep) {
    const c = rep.content;
    console.log(`内容    ${c.tracks} 条职业线 · ${c.ranks} 个职级 · ${c.jobs} 个岗位 · ${rep.events} 条事件（其中岗位事件 ${rep.jobEvents}）`);
    console.log(`机器人  活了 ${rep.lives} 辈子 · ${rep.ticks} 格时间 · ${(rep.ms / 1000).toFixed(1)} 秒`);
    console.log(`        寿命中位数 ${rep.medianAge}（${rep.minAge}–${rep.maxAge}） · ${rep.worked} 人上过班 · 升职 ${rep.promos} 次`);
    console.log(`        触发过的事件 ${rep.eventsFired}/${rep.events} · 岗位事件 ${rep.jobEventsFired}/${rep.jobEvents}`);
    if (argv.indexOf('--never') >= 0 && rep.never.length) console.log(`        一次都没出过：${rep.never.join(' ')}`);
  }
  if (problems.length) {
    console.log(`\n✗ ${problems.length} 个问题\n`);
    problems.forEach((p, i) => console.log(`  ${i + 1}. ${p}\n`));
    process.exit(1);
  }
  console.log('\n✓ 没发现问题');
}
