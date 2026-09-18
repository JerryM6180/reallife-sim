/* 岗位遭遇事件 · 第一批：体制内 / 教育 / 医疗
   按「职业线 + 职级」挂，不按岗位挂 —— 主治医师遇到的难手术，
   三甲主治、社区全科、口腔种植走的是同一条线，事件也就都归它。

   写作规矩沿用 events2.js：具体，克制，不煽情。
   每个选项都有代价，没有纯赚的那一项。
   好结果给的是钱和风评，坏结果扣的是绩效、健康和风评 ——
   风评不显示在状态栏里，但提名单的那天它在。 */
(function (global) {
  'use strict';
  const C = global.CONTENT;
  const R = (arr, rng) => arr[Math.floor(rng.next() * arr.length)];

  /** J(线, {...}) —— 只在这条线上、这个职级区间内、干够月数之后才可能撞上 */
  const J = (track, o) => {
    const ev = Object.assign({ tier: 'situation', weight: 16, cooldown: 30 }, o);
    ev.job = true;   // 打上标记：抽事件的时候这类有单独的份额
    ev.when = (s) => s.p.track === track && !!s.p.job
      && (s.p.rank || 0) >= (o.minRank || 0)
      && (o.maxRank === undefined || (s.p.rank || 0) <= o.maxRank)
      && s.p.jobMonths > (o.after === undefined ? 5 : o.after)
      && (!o.cond || o.cond(s));
    C.EVENTS.push(ev);
    return ev;
  };

  /* ══════════════════ 体制内 · 公务员 ══════════════════ */

  J('civil', {
    id: 'jc_material', maxRank: 2, weight: 20, cooldown: 20,
    title: '这个稿子再改一版',
    text: () => '材料交上去第七遍。领导圈了三处，说「意思是对的，就是不够到位」。\n\n' +
      '明天上午八点要用。现在是晚上九点四十。',
    options: [
      { label: '改到满意为止', apply: (c) => {
        const { E, rng } = c;
        E.perf(+7); E.rep(+2); E.stress(+9); E.health(-1.2);
        return rng.chance(0.5)
          ? '凌晨一点半发出去。第二天会上领导念了你写的那段，念完停了一下，说「这句好」。'
          : '凌晨两点发出去。第二天会上用的是另一版，你那七遍没人再提。';
      } },
      { label: '把前几版拼一拼交上去', apply: (c) => {
        const { E } = c;
        E.perf(-6); E.rep(-3); E.stress(+2);
        return '你拼了一版交上去。领导没说什么。后来有几次这种活，就不找你了 —— 这在机关里不是好事。';
      } },
    ],
  });

  J('civil', {
    id: 'jc_jiediao', minRank: 1, weight: 15,
    title: '抽调',
    text: () => '成立了一个专班，从各处室抽人，抽到了你。\n\n' +
      '「就三个月。」通知上是这么写的。',
    options: [
      { label: '去', apply: (c) => {
        const { s, E, rng } = c;
        E.stress(+8); E.health(-1);
        if (rng.chance(0.45)) {
          E.rep(+6); E.perf(+6);
          return '专班干了十一个月。那位副职记住了你的名字 —— 在这个系统里，被上面的人记住名字是一件很具体的事。';
        }
        E.rep(+1); E.perf(-3);
        return '专班干了十一个月。回原处室那天，你的活别人干了大半年，位置还在，但节奏对不上了。';
      } },
      { label: '推掉', apply: (c) => {
        const { E } = c;
        E.rep(-5); E.stress(+4);
        return '你说家里有事。处长「嗯」了一声，换了隔壁桌的人。那个人后来提得比你快。';
      } },
    ],
  });

  J('civil', {
    id: 'jc_wenze', minRank: 2, weight: 13, cooldown: 45,
    title: '一份你签过字的东西',
    text: () => '两年前的一份材料被翻出来了。数据是下面报上来的，字是你签的。\n\n' +
      '现在要一个说法。',
    options: [
      { label: '按流程说清楚', apply: (c) => {
        const { E, rng } = c;
        E.stress(+14);
        if (rng.chance(0.55)) { E.rep(-3); return '你把当时的签报、会议纪要、来文都调了出来。认定是下面报错，你负审核不严的责任，谈话提醒。'; }
        E.rep(-9); E.perf(-12);
        return '流程走完了，责任还是落在签字那一栏。一个处分，影响三年 —— 三年里你不用想提拔的事。';
      } },
      { label: '找人问问', apply: (c) => {
        const { E, rng } = c;
        E.cash(-c.rng.int(2000, 6000), '打点');
        E.stress(+16);
        if (rng.chance(0.4)) { E.rep(-2); return '事情压下去了，没有走到处分那一步。但知道这件事的人，从此看你的眼神不一样。'; }
        E.rep(-11); E.perf(-10);
        return '托的人自己也不方便。处分照下，还多了一条「不老实」的印象。';
      } },
    ],
  });

  /* ══════════════════ 体制内 · 事业单位 ══════════════════ */

  J('shiye', {
    id: 'js_yingjian', weight: 19, cooldown: 22,
    title: '迎检',
    text: () => '上级要来检查。台账补三年的，制度上墙，走廊重新刷。\n\n' +
      '你负责补 2023 年那一摞。',
    options: [
      { label: '一页一页补齐', apply: (c) => {
        const { E } = c;
        E.perf(+6); E.rep(+2); E.stress(+7); E.health(-0.8);
        return '连着五个晚上。检查那天翻到你补的那一册，看了两页就合上了。';
      } },
      { label: '找同事分摊', apply: (c) => {
        const { E, rng } = c;
        E.relGroup('同事', -6); E.stress(+3);
        return rng.chance(0.5) ? '几个人分了，赶在前一天弄完。请了一顿饭，钱是你出的。'
          : '有人应了没做。最后那两册是空的，检查组没翻到 —— 这次没翻到。';
      } },
    ],
  });

  J('shiye', {
    id: 'js_zhicheng', minRank: 2, weight: 15, cooldown: 40,
    title: '职称评审',
    text: (s) => '今年单位有一个名额。够条件的有四个人，你是其中之一。\n\n' +
      '评审看的是年限、成果、和「综合表现」—— 前两样大家都差不多。',
    options: [
      { label: '把材料做扎实', apply: (c) => {
        const { s, E, rng } = c;
        E.stress(+10);
        const p = 0.3 + (s.p.rep || 0) * 0.012 + (s.p.perf - 50) * 0.004;
        if (rng.chance(Math.max(0.15, Math.min(0.7, p)))) {
          E.rep(+4); E.perf(+8);
          return '公示那天名单上是你。同办公室那位比你早来两年，那天下午请了假。';
        }
        E.stress(+8);
        return '不是你。理由没有明说 —— 这种事从来不会明说。明年还有一个名额，还是四个人。';
      } },
      { label: '去找领导表个态', apply: (c) => {
        const { s, E, rng } = c;
        E.cash(-c.rng.int(800, 2500), '烟酒'); E.stress(+8);
        const p = 0.36 + (s.p.rep || 0) * 0.01;
        if (rng.chance(Math.max(0.15, Math.min(0.72, p)))) {
          E.rep(+2); return '成了。这份人情记在账上，你知道它早晚要还。';
        }
        E.rep(-3);
        return '领导收了东西，说「你的情况我知道」。结果出来不是你，东西也没退回来。';
      } },
    ],
  });

  /* ══════════════════ 体制内 · 国企 ══════════════════ */

  J('soe', {
    id: 'jo_duibiao', weight: 17,
    title: '对标先进',
    text: () => '集团下发了对标方案。你们部门的几项指标排在末位。\n\n' +
      '整改报告要在周五之前报上去。',
    options: [
      { label: '真去改流程', apply: (c) => {
        const { E, rng } = c;
        E.stress(+8); E.perf(+5);
        if (rng.chance(0.5)) { E.rep(+5); return '你把那条流程从十一个签批砍到六个。半年后指标真的上去了，报告里写的是「在集团指导下」。'; }
        E.rep(+1);
        return '你改了流程，两个月后又被加回去了 —— 加回去的理由是「合规要求」。';
      } },
      { label: '把报告写漂亮', apply: (c) => {
        const { E } = c;
        E.perf(+3); E.rep(-2); E.stress(+4);
        return '报告写得很好，被集团当成范文转发了。指标还是末位，但那是明年的事。';
      } },
    ],
  });

  J('soe', {
    id: 'jo_jiangben', minRank: 2, weight: 14, cooldown: 40,
    title: '降本增效',
    text: () => '集团下了指标：三项费用压降百分之十五。\n\n' +
      '分到你手上，最容易压的那一块是劳务派遣的人。',
    options: [
      { label: '按指标压人', apply: (c) => {
        const { E } = c;
        E.perf(+10); E.rep(+3); E.stress(+13);
        return '你报上去七个名字。其中一个在这儿干了九年，去年还帮你搬过家。名单是你签的字。';
      } },
      { label: '从别的地方抠', apply: (c) => {
        const { E, rng } = c;
        E.stress(+9);
        if (rng.chance(0.45)) { E.perf(+5); E.rep(+6); return '差旅、会务、外包服务一项项抠，抠到了百分之十三。上面认了。'; }
        E.perf(-8); E.rep(-2);
        return '抠到百分之八就抠不动了。上面说「你们部门态度有问题」，名单最后还是报了，只是晚了两个月。';
      } },
    ],
  });

  /* ══════════════════ 体制内 · 辅警 / 执法 ══════════════════ */

  J('auxpolice', {
    id: 'ja_hurt', weight: 18, cooldown: 34,
    title: '出警',
    text: () => '一个醉汉，两个人拉不住。\n\n' +
      '你手臂被划了一道，不深，但见血了。',
    options: [
      { label: '去医院处理', apply: (c) => {
        const { s, E, rng } = c;
        E.health(-4); E.stress(+8);
        const pay = rng.int(400, 1400);
        if (s.p.shebao) { E.cash(-Math.round(pay * 0.3), '自付'); return '缝了四针。走的工伤流程，报了大部分。队里给了两天假。'; }
        E.cash(-pay, '医药费');
        return '缝了四针。你是辅警，工伤认定那一栏走得很慢，钱先自己垫上。';
      } },
      { label: '贴个创可贴接着干', apply: (c) => {
        const { E, rng } = c;
        E.health(-7); E.perf(+4); E.rep(+3); E.stress(+5);
        if (rng.chance(0.3)) { E.schedule(rng.int(3, 10), 'lateDiag', {}); }
        return '当班到凌晨。队长说了句「小伙子行」。这句话不写进档案，也不折成钱。';
      } },
    ],
  });

  J('auxpolice', {
    id: 'ja_bonus', weight: 14, cooldown: 40,
    title: '表彰名单',
    text: () => '上个月那起案子办得漂亮，市局发了通报表彰。\n\n' +
      '名单贴在公告栏上。你从头看到尾，看了两遍。',
    options: [
      { label: '（无法选择）', apply: (c) => {
        const { E } = c;
        E.stress(+9); E.rep(+1);
        return '现场跑在最前面的是你，名单上没有你。同事拍了拍你，说「都知道」。\n\n' +
          '奖金按警号发，你没有警号。';
      } },
    ],
  });

  J('enforce', {
    id: 'je_filmed', weight: 19, cooldown: 26,
    title: '有人在拍',
    text: () => '例行检查，商户不配合，围观的人举起了手机。\n\n' +
      '你知道这段视频今天晚上会出现在什么地方。',
    options: [
      { label: '按流程走完', apply: (c) => {
        const { E, rng } = c;
        E.stress(+11); E.perf(+5);
        if (rng.chance(0.5)) { E.rep(+4); return '你全程录像、亮证、告知、送达。视频传上去了，评论区骂了两天，然后没人再提。'; }
        E.rep(-4);
        return '视频被剪了。剪完的那段里你只有伸手那一下。单位让你写情况说明，写了三遍。';
      } },
      { label: '算了，下次再来', apply: (c) => {
        const { E } = c;
        E.perf(-8); E.rep(-3); E.stress(+5);
        return '你收了队。回去被中队长说了一顿 —— 这条街上其他几家都在看着，这次退了，下次更难。';
      } },
    ],
  });

  /* ══════════════════ 教育 · 中小学教师 ══════════════════ */

  J('teacher', {
    id: 'jt_parent', weight: 20, cooldown: 20,
    title: '家长',
    text: () => '晚上十点二十，家长在微信上发来第七条语音。\n\n' +
      '孩子这次月考掉了十二名。',
    options: [
      { label: '一条条回', apply: (c) => {
        const { E, rng } = c;
        E.stress(+8); E.health(-0.6); E.rep(+2);
        return rng.chance(0.55)
          ? '你回到十一点半。家长最后发了「谢谢老师」。这四个字是你今天唯一的收获。'
          : '你回到十一点半。第二天家长把聊天记录发到了班级群里。';
      } },
      { label: '明天上班再说', apply: (c) => {
        const { E, rng } = c;
        E.stress(+4);
        if (rng.chance(0.35)) { E.rep(-5); E.perf(-6); return '第二天家长打到了教务处。校长找你谈话，说「家长工作也是工作」。'; }
        return '第二天你回了。家长没再提。';
      } },
    ],
  });

  J('teacher', {
    id: 'jt_accident', weight: 13, cooldown: 45,
    title: '课间',
    text: () => '课间十分钟，两个孩子在走廊追跑，一个撞在了消防栓上。\n\n' +
      '缝了三针。你是班主任。',
    options: [
      { label: '第一时间处理并如实上报', apply: (c) => {
        const { E, rng } = c;
        E.stress(+16); E.perf(-4);
        if (rng.chance(0.6)) { E.rep(+3); return '你送医院、通知家长、写了完整的经过。家长通情理，学校认定是课间意外，事情三天就过去了。'; }
        E.rep(-4); E.cash(-c.rng.int(1000, 4000), '垫的医药费');
        return '家长认为学校监管不到位。赔了一笔，学校出大头，你担了「管理责任」那一栏。';
      } },
      { label: '先跟家长私下说', apply: (c) => {
        const { E, rng } = c;
        E.stress(+18);
        if (rng.chance(0.4)) { E.cash(-c.rng.int(2000, 6000), '私下赔付'); return '你自己掏了钱，家长没闹。这件事学校不知道 —— 也就没人替你担着。'; }
        E.rep(-9); E.perf(-12);
        return '家长转头还是找了学校，还多了一条「老师想瞒」。这一条比事故本身严重。';
      } },
    ],
  });

  J('teacher', {
    id: 'jt_banner', minRank: 3, weight: 12, cooldown: 50,
    title: '一封信',
    text: () => '一个毕业很多年的学生寄了封信到学校。\n\n' +
      '信里说，高二那年你留他谈过一次话。他说那次谈话改了他后来走的路。',
    options: [
      { label: '（无法选择）', apply: (c) => {
        const { E } = c;
        E.stress(-14); E.rep(+5);
        return '你想了很久，想不起来那次谈话说了什么。\n\n' +
          '信你收在抽屉里。这行大部分年份没有反馈，偶尔有一次，就够撑一阵。';
      } },
    ],
  });

  /* ══════════════════ 教育 · 民办与培训 ══════════════════ */

  J('edu_private', {
    id: 'jp_renewal', weight: 20, cooldown: 18,
    title: '续报率',
    text: () => '这一期快结课了。校长把续报表贴在了办公室墙上，一栏一个老师的名字。\n\n' +
      '你那一栏是百分之六十一。',
    options: [
      { label: '挨个给家长打电话', apply: (c) => {
        const { E, rng } = c;
        E.stress(+9); E.health(-0.6);
        if (rng.chance(0.55)) { E.perf(+9); E.rep(+3); E.cash(c.rng.int(600, 2200), '续报提成'); return '打到七十八。提成到账那天你算了一下，一通电话一块二。'; }
        E.perf(-3);
        return '打到六十五。有几个家长说「孩子说不想上了」，这句话你没法接。';
      } },
      { label: '把课上好，不打电话', apply: (c) => {
        const { E, rng } = c;
        E.rep(+2); E.stress(+3);
        return rng.chance(0.4) ? '这一期口碑起来了，下一期自己续了七成。校长没说什么。'
          : '续报还是六十一。校长在会上点了名，说「教学好不等于结果好」。';
      } },
    ],
  });

  J('edu_private', {
    id: 'jp_shutdown', minRank: 2, weight: 12, cooldown: 50,
    title: '校区',
    text: () => '总部下了通知：本市三个校区合并成一个。\n\n' +
      '合并之后，教学主管只需要一个。',
    options: [
      { label: '争', apply: (c) => {
        const { s, E, rng } = c;
        E.stress(+15);
        if (rng.chance(0.35 + (s.p.rep || 0) * 0.012 + s.p.perf / 400)) {
          E.rep(+5); E.perf(+6);
          return '留下的是你。另外两位一个转去做销售，一个走了。你现在管的班是原来的三倍。';
        }
        E.quitJob(); E.stress(+18);
        return '不是你。合同到期不续，赔了一个月。你在这行攒的东西，出了这家机构没人认。';
      } },
      { label: '不争，自己找下家', apply: (c) => {
        const { E } = c;
        E.flag('jobHunting', 8); E.stress(+8);
        return '你提前两个月开始投简历。走的那天，学生问你还回不回来，你说「有空回来看你们」。';
      } },
    ],
  });

  /* ══════════════════ 教育 · 高校 ══════════════════ */

  J('univ', {
    id: 'ju_paper', maxRank: 3, weight: 20, cooldown: 20,
    title: '审稿意见',
    text: () => '压了七个月的稿子回来了。三位审稿人，两位小修，一位大修。\n\n' +
      '大修那位要求补一整组实验。',
    options: [
      { label: '补', apply: (c) => {
        const { E, rng } = c;
        E.stress(+12); E.health(-1.4);
        if (rng.chance(0.55)) { E.rep(+6); E.perf(+8); E.cash(c.rng.int(3000, 15000), '论文奖励'); return '补了四个月，接收了。学校的科研奖励打过来那天，你算了算这篇文章的时薪。'; }
        E.rep(+1); E.stress(+8);
        return '补了四个月，还是被拒了。换个刊物重投，又是七个月。';
      } },
      { label: '改投一个容易的', apply: (c) => {
        const { E } = c;
        E.rep(-2); E.perf(+2); E.cash(c.rng.int(800, 3000), '论文奖励');
        return '两个月就接收了。数量上算一篇，考核表上算一篇。评职称的时候，看的人知道这一篇是什么分量。';
      } },
    ],
  });

  J('univ', {
    id: 'ju_clock', maxRank: 2, weight: 15, cooldown: 40,
    title: '倒计时',
    text: (s) => '首聘期还剩不到两年。系里新来的那位比你晚一年，已经有两篇了。\n\n' +
      '你手上有三个方向，哪个都还没到能发的程度。',
    options: [
      { label: '砍到一个方向，全押上去', apply: (c) => {
        const { E, rng } = c;
        E.stress(+14); E.health(-1.2);
        if (rng.chance(0.45)) { E.rep(+9); E.perf(+10); return '押对了。这一年出了两篇，其中一篇是这些年你最满意的东西。'; }
        E.rep(-4);
        return '押错了。一年下来什么也没出。剩下那两个方向，别人已经在做了。';
      } },
      { label: '三个都推一推', apply: (c) => {
        const { E } = c;
        E.stress(+11); E.rep(-1); E.perf(+2);
        return '三个都推了一点，三个都没到能投的程度。考核表上填的是「在研」。';
      } },
    ],
  });

  /* ══════════════════ 教育 · 幼教 ══════════════════ */

  J('kinder', {
    id: 'jk_bump', weight: 19, cooldown: 24,
    title: '磕了',
    text: () => '午睡起来，一个孩子从床沿滑下去，额头磕了个包。\n\n' +
      '不严重。但四点半家长要来接。',
    options: [
      { label: '主动打电话说清楚', apply: (c) => {
        const { E, rng } = c;
        E.stress(+9);
        if (rng.chance(0.65)) { E.rep(+4); return '家长来的时候已经知道了，看了看包，说「小孩子哪有不磕的」。'; }
        E.rep(-3); E.perf(-5);
        return '家长要求调监控，看了四十分钟。最后没说什么，但从那以后每天都要问一遍。';
      } },
      { label: '等家长自己发现', apply: (c) => {
        const { E, rng } = c;
        E.stress(+12);
        if (rng.chance(0.35)) return '家长没注意到。你晚上没怎么睡好。';
        E.rep(-8); E.perf(-9);
        return '家长在门口就看见了。「为什么不第一时间告诉我」—— 这句话园长第二天也问了你一遍。';
      } },
    ],
  });

  J('kinder', {
    id: 'jk_merge', weight: 13, cooldown: 44,
    title: '并班',
    text: () => '这一届招生比去年少了三成。园里决定把两个中班并成一个。\n\n' +
      '两个主班老师，留一个。',
    options: [
      { label: '留下来，接三十五个孩子', apply: (c) => {
        const { E } = c;
        E.perf(+4); E.rep(+2); E.stress(+14); E.health(-1.5);
        return '你留下了。一个人带三十五个，配班还是原来那个。工资没变。';
      } },
      { label: '不接，看看别的园', apply: (c) => {
        const { E } = c;
        E.flag('jobHunting', 8); E.stress(+9);
        return '你开始投别的园。出生率这件事，投到哪家都一样 —— 只是你还得亲自确认一遍。';
      } },
    ],
  });

  /* ══════════════════ 医疗 · 医师 ══════════════════ */

  J('doctor', {
    id: 'jd_hard_surgery', minRank: 2, weight: 20, cooldown: 24,
    title: '一台不好做的',
    text: (s) => '这个病人别的组推过来的。片子你看了三遍，粘连的位置不好，年纪也大。\n\n' +
      '家属在门外，说「都听大夫的」。',
    options: [
      { label: '上', apply: (c) => {
        const { s, E, rng } = c;
        E.stress(+15); E.health(-2);
        const skill = 0.42 + (s.p.rank || 0) * 0.06 + (C.majorLevel(s.p.majorExp) - 6) * 0.03;
        if (rng.chance(Math.max(0.25, Math.min(0.85, skill)))) {
          E.rep(+9); E.perf(+10);
          return '站了六个小时，下来先蹲了会儿。\n\n' +
            '一周后家属送来一面锦旗，挂在了科室走廊上。上面写的是主任的名字和你的名字，主任的在前面。';
        }
        E.rep(-7); E.perf(-10); E.stress(+18);
        return '术中出血比预想的多，转了 ICU。人保住了，但恢复得很差。\n\n' +
          '家属没有闹。他们只是每天来问一遍，问了十九天。这件事你会记很多年。';
      } },
      { label: '转给上级', apply: (c) => {
        const { E } = c;
        E.rep(-2); E.stress(+6);
        return '你把病人推给了主任。主任接了，什么也没说。\n\n' +
          '这种时候没有人会怪你。但科里排手术的时候，难的那些会越来越少地落到你手上。';
      } },
    ],
  });

  J('doctor', {
    id: 'jd_dispute', minRank: 1, weight: 15, cooldown: 36,
    title: '纠纷',
    text: () => '一个术后并发症。流程上没有问题，病历也完整。\n\n' +
      '家属在医办室门口坐了一天，不走，也不吵。',
    options: [
      { label: '坐下来，把话说完', apply: (c) => {
        const { E, rng } = c;
        E.stress(+16); E.health(-1);
        if (rng.chance(0.55)) { E.rep(+4); return '你陪他们坐了三个小时，把每一步说了一遍。他们最后走了，临走那位大姐说「大夫你也不容易」。'; }
        E.rep(-3); E.stress(+10);
        return '说了三个小时，他们说「我们不懂这些，我们就要个说法」。第二天来了更多人。';
      } },
      { label: '交给医务科', apply: (c) => {
        const { E, rng } = c;
        E.stress(+11);
        if (rng.chance(0.5)) { return '医务科按流程走了鉴定。三个月后认定无过错。这三个月你每天睡四个小时。'; }
        E.rep(-5); E.cash(-c.rng.int(3000, 20000), '科室分摊的赔付');
        return '医院选择了调解。赔了一笔，科室分摊。没有人说是你的错，但那笔钱是从科室绩效里出的。';
      } },
    ],
  });

  J('doctor', {
    id: 'jd_night', maxRank: 3, weight: 18, cooldown: 16,
    title: '夜班',
    text: () => '连着第三个夜班。凌晨四点终于躺下，四点二十急诊又来了。',
    options: [
      { label: '（无法选择）', apply: (c) => {
        const { E, rng } = c;
        E.health(-2.5); E.stress(+7); E.perf(+2);
        return R([
          '天亮的时候你在办公室的椅子上睡着了，护士叫醒你去交班。交完班你还有一整个白天的门诊。',
          '早上七点你去食堂打了份粥，端到手上才想起来昨天午饭也没吃。',
          '下夜班骑车回家，在红灯前停住，绿灯亮了你还站着，后面的人按了两下喇叭。',
        ], c.rng);
      } },
    ],
  });

  /* ══════════════════ 医疗 · 护理 ══════════════════ */

  J('nurse', {
    id: 'jn_needle', weight: 16, cooldown: 40,
    title: '针刺伤',
    text: () => '拔针的时候手滑了一下。\n\n' +
      '那个病人的化验单还没出来。',
    options: [
      { label: '立刻上报走流程', apply: (c) => {
        const { E, rng } = c;
        E.stress(+18); E.health(-1);
        if (rng.chance(0.9)) { E.rep(+2); return '挤血、冲洗、上报、抽血、阻断药吃了一个月。结果是阴性。\n\n那一个月你每天都在算日子。'; }
        E.health(-12); E.rep(+2);
        return '结果不是阴性。后面的事，医院会管，但也只是管。';
      } },
      { label: '自己处理一下算了', apply: (c) => {
        const { E, rng } = c;
        E.stress(+14);
        if (rng.chance(0.85)) return '你自己挤了血冲了水，没报。后来什么也没发生。你把这件事忘了很久，又想起来过几次。';
        E.health(-14); E.rep(-3);
        return '几个月后体检查出来了。没有上报记录，职业暴露认定不了 —— 这件事在制度上等于没发生过。';
      } },
    ],
  });

  J('nurse', {
    id: 'jn_family', weight: 19, cooldown: 22,
    title: '床位',
    text: () => '三床的家属又来了，要求换个靠窗的床。\n\n' +
      '靠窗那张躺着一个刚做完手术的老人。',
    options: [
      { label: '解释，坚持不换', apply: (c) => {
        const { E, rng } = c;
        E.stress(+8);
        if (rng.chance(0.6)) { E.rep(+3); return '你说了两遍，他们不高兴，但没再提。这一班剩下的时间还算安静。'; }
        E.rep(-2); E.perf(-4);
        return '他们投诉到了护士长那里。护士长在走廊上跟他们说了同样的话，然后回头跟你说「以后语气软一点」。';
      } },
      { label: '想办法协调一下', apply: (c) => {
        const { E } = c;
        E.stress(+11); E.rep(+1); E.health(-0.5);
        return '你去跟另外两个床商量，挪了两次床。忙到下班晚了四十分钟，没有加班费。';
      } },
    ],
  });

  /* ══════════════════ 医疗 · 医技药剂 ══════════════════ */

  J('medtech', {
    id: 'jm_report', weight: 17, cooldown: 30,
    title: '一份报告',
    text: () => '复核的时候发现，上周发出去的一份报告，参考值区间用错了版本。\n\n' +
      '那个病人已经按结果开始吃药了。',
    options: [
      { label: '马上报科主任', apply: (c) => {
        const { E, rng } = c;
        E.stress(+15); E.perf(-6);
        if (rng.chance(0.6)) { E.rep(+3); return '主任立刻联系了临床，病人换了方案，没出事。事后科里改了复核流程 —— 那是你提的。'; }
        E.rep(-5);
        return '临床那边已经调整过一次方案，多折腾了两周。差错登记上写了你的名字，年度考核扣分。';
      } },
      { label: '悄悄改掉系统里的', apply: (c) => {
        const { E, rng } = c;
        E.stress(+16);
        if (rng.chance(0.55)) { E.rep(-1); return '你改了。系统留了修改痕迹，但没有人去看。这件事就过去了。'; }
        E.rep(-12); E.perf(-14);
        return '修改痕迹被质控抽到了。差错本身是小事，改记录不是 —— 这一条会一直跟着你的档案。';
      } },
    ],
  });

  /* ══════════════════ 医疗 · 医药器械销售 ══════════════════ */

  J('medsales', {
    id: 'jr_jicai', weight: 18, cooldown: 36,
    title: '集采结果',
    text: () => '你负责的那个品种，中选价砍到了原来的三成。\n\n' +
      '公司通知：这条线的提成系数下调。',
    options: [
      { label: '转做没进集采的品种', apply: (c) => {
        const { E, rng } = c;
        E.stress(+11);
        if (rng.chance(0.5)) { E.rep(+4); E.perf(+6); return '你花了半年重新铺科室。新品种量小，但单价还在，年底算下来没差多少。'; }
        E.perf(-6); E.cash(-c.rng.int(2000, 8000), '自己垫的拜访费用');
        return '新品种铺了半年没起来。攒了三年的那些关系，是围着老品种建的。';
      } },
      { label: '把量做上去', apply: (c) => {
        const { E, rng } = c;
        E.stress(+13); E.health(-1.2);
        return rng.chance(0.5) ? '量翻了一倍，钱少了三成。你算了一下，多跑的那些路是白跑的。'
          : (E.perf(-8), '量没上去。医院的采购量是文件定的，不是你跑出来的。');
      } },
    ],
  });

  J('medsales', {
    id: 'jr_compliance', minRank: 2, weight: 13, cooldown: 44,
    title: '一顿饭',
    text: () => '科室主任的女儿在国外读书。他绕着圈子说了三次。\n\n' +
      '这个月你的指标还差四成。',
    options: [
      { label: '装作没听懂', apply: (c) => {
        const { E, rng } = c;
        E.perf(-7); E.stress(+8);
        return rng.chance(0.5) ? '你装傻过去了。这个月的量没上来，但你晚上睡得着。'
          : (E.rep(-2), '你装傻过去了。下个月这个科室的量转给了另一家的代表。');
      } },
      { label: '想办法办了', apply: (c) => {
        const { E, rng } = c;
        E.cash(-c.rng.int(20000, 80000), '「学术支持」');
        E.perf(+12); E.stress(+14);
        if (rng.chance(0.78)) { E.rep(+2); return '量上来了。这笔钱走的是公司的学术推广费，报销单上写的是会议。'; }
        E.rep(-15); E.perf(-25); E.flag('layoffComing', 10);
        return '合规部门查到了这笔。公司的说法是「个人行为」。你现在需要一个律师，而不是一个主管。';
      } },
    ],
  });

  /* ══════════════════ 医疗 · 护工 ══════════════════ */

  J('caregiver', {
    id: 'jg_gone', weight: 18, cooldown: 26,
    title: '床空了',
    text: () => '你陪了两个月的那位老人，昨天夜里走了。\n\n' +
      '家属结了钱，收拾东西的时候给了你一件他的旧毛衣，说「你穿正好」。',
    options: [
      { label: '（无法选择）', apply: (c) => {
        const { E, rng } = c;
        E.stress(+10);
        if (rng.chance(0.5)) { E.rep(+3); return '家属后来把你推荐给了同病区的另一家。这一行的活是这么接上的。\n\n毛衣你没穿，收起来了。'; }
        return '第二天你就得接下一单，不然这个月的收入就断在这里。\n\n' +
          '走廊还是那条走廊，换了个床号。';
      } },
    ],
  });

  J('caregiver', {
    id: 'jg_back', minRank: 1, weight: 15, cooldown: 40,
    title: '腰',
    text: () => '一个人把一百六十斤的病人从床上挪到轮椅上，第三次的时候腰上「咯」了一下。\n\n' +
      '直不起来了。',
    options: [
      { label: '歇几天', apply: (c) => {
        const { s, E, rng } = c;
        E.health(-5); E.stress(+9);
        const lost = Math.round(s.p.net * 0.4);
        E.cash(-lost, '停工的这几天');
        return '躺了六天。没有病假，没有工伤 —— 你不属于任何一家单位。这六天就是六天的收入。';
      } },
      { label: '贴膏药接着上', apply: (c) => {
        const { E, rng } = c;
        E.health(-9); E.stress(+6); E.rep(+2);
        if (rng.chance(0.4)) { E.schedule(rng.int(6, 24), 'lateDiag', {}); }
        return '你贴着膏药干完了这一单。腰从此再没好利索过 —— 这一行最先坏的就是腰，而坏了没人认。';
      } },
    ],
  });
})(window);
