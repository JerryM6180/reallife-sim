/* 岗位遭遇事件 · 第二批：互联网 / 金融 / 制造 / 建筑 */
(function (global) {
  'use strict';
  const C = global.CONTENT;
  const R = (arr, rng) => arr[Math.floor(rng.next() * arr.length)];

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

  /* ══════════════════ 互联网 · 研发 ══════════════════ */

  J('dev', {
    id: 'jv_incident', weight: 20, cooldown: 22,
    title: '线上出了故障',
    text: () => '晚上八点十分，报警群炸了。核心接口全线超时。\n\n' +
      '最近一次上线是你的。',
    options: [
      { label: '先回滚，再查原因', apply: (c) => {
        const { E, rng } = c;
        E.stress(+13); E.health(-1.2);
        if (rng.chance(0.7)) { E.rep(+4); E.perf(+5); return '八分钟恢复。复盘会上你把根因讲清楚了，顺手提了个监控告警的改进 —— 那个改进后来救过两次。'; }
        E.rep(-4); E.perf(-8);
        return '回滚以后还是有问题。查到凌晨三点，是上游改了个字段没通知。故障时长四十七分钟，定级 P1，责任人那一栏写你。';
      } },
      { label: '硬查，不回滚', apply: (c) => {
        const { E, rng } = c;
        E.stress(+16); E.health(-1.8);
        if (rng.chance(0.4)) { E.rep(+7); E.perf(+9); return '你二十分钟定位到了一行边界判断。修完直接热更，没有回滚，数据一条没丢。这件事组里传了很久。'; }
        E.rep(-8); E.perf(-13);
        return '查了五十分钟没查出来，最后还是回滚。多出来的这五十分钟写进了故障报告的时间线里，每一分钟都是。';
      } },
    ],
  });

  J('dev', {
    id: 'jv_refactor', minRank: 2, weight: 15, cooldown: 36,
    title: '那个没人敢动的模块',
    text: () => '五年前离职的人写的，八千行，没有测试，没有文档。\n\n' +
      '每次改需求都要绕着它走，绕了三年。',
    options: [
      { label: '重构掉', apply: (c) => {
        const { E, rng } = c;
        E.stress(+12); E.health(-1);
        if (rng.chance(0.5)) { E.rep(+8); E.perf(+6); return '花了两个月，拆成了四个模块，补了测试。后面半年这块再没出过故障 —— 但半年之后就没人记得为什么不出故障了。'; }
        E.rep(-6); E.perf(-10);
        return '重构到一半赶上业务插需求，两套逻辑并行跑了四个月，出了两次线上问题。现在它是九千行。';
      } },
      { label: '继续绕', apply: (c) => {
        const { E } = c;
        E.perf(+3); E.rep(-1);
        return '你也绕过去了。需求按时上线，没有人会因为「绕过去了」表扬你，也没有人会因此怪你。';
      } },
    ],
  });

  J('dev', {
    id: 'jv_35', minRank: 3, weight: 14, cooldown: 44,
    cond: (s) => s.p.age >= 32,
    title: '新来的那个',
    text: (s) => '组里进了个应届。第一周就把你上个月写的那个脚本重写了一遍，快了六倍。\n\n' +
      '他晚上十一点还在群里发消息。',
    options: [
      { label: '把他带起来', apply: (c) => {
        const { E, rng } = c;
        E.stress(+6); E.perf(+4);
        if (rng.chance(0.6)) { E.rep(+6); return '你带了他半年。绩效评的时候他给你写了一段很长的评价 —— 在这个公司里，这东西是有分量的。'; }
        E.rep(+1);
        return '你带了他半年。年底他升了一级，你没有。这不怪他。';
      } },
      { label: '把手上的东西攥紧一点', apply: (c) => {
        const { E } = c;
        E.rep(-5); E.perf(+2); E.stress(+9);
        return '你把几个关键模块留在自己手上，文档也没补。短期内谁也动不了你。\n\n' +
          '组织架构调整的时候，「只有他会」这件事，有时候是护身符，有时候是理由。';
      } },
    ],
  });

  /* ══════════════════ 互联网 · 产品运营 ══════════════════ */

  J('pm', {
    id: 'jq_pivot', weight: 19, cooldown: 24,
    title: '方向变了',
    text: () => '做了四个月的需求，评审前一天被叫停。\n\n' +
      '「上面对这块的判断有调整。」老板是这么说的。',
    options: [
      { label: '把已经做的东西存下来复用', apply: (c) => {
        const { E, rng } = c;
        E.stress(+8);
        if (rng.chance(0.5)) { E.rep(+4); E.perf(+5); return '你把调研、数据和方案整理成了一份文档。半年后新方向撞上同一个问题，这份文档被翻了出来。'; }
        E.perf(-2);
        return '你整理了两天。那份文档后来没有人打开过。';
      } },
      { label: '当没做过，跟新方向', apply: (c) => {
        const { E } = c;
        E.perf(+4); E.stress(+5); E.rep(-1);
        return '你当天就切了过去。开发那边有人问了一句「之前那个呢」，你说「不做了」。\n\n' +
          '这句话你今年说了第三次。';
      } },
    ],
  });

  J('pm', {
    id: 'jq_number', minRank: 2, weight: 15, cooldown: 34,
    title: '这个数不太好看',
    text: () => '季度复盘，你负责那块的留存跌了 4 个点。\n\n' +
      '有一种口径能让它看起来只跌了 1 个点。',
    options: [
      { label: '按原口径报', apply: (c) => {
        const { E, rng } = c;
        E.stress(+10);
        if (rng.chance(0.55)) { E.rep(+7); E.perf(-4); return '你报了 4 个点，也报了原因和三条改进。老板当场没说什么，会后单独找你聊了半小时 —— 是好的那种。'; }
        E.perf(-10); E.rep(+3);
        return '你报了 4 个点。会上被追问了二十分钟。隔壁组报的是 1 个点，没人问他们口径。';
      } },
      { label: '换口径', apply: (c) => {
        const { E, rng } = c;
        E.perf(+7); E.stress(+6);
        if (rng.chance(0.6)) { E.rep(-2); return '会开得很顺。下个季度你还得用这个口径，因为改回去就等于承认。'; }
        E.rep(-10); E.perf(-12);
        return '数据分析师在群里问了一句「这个口径是从哪版开始的」。没有人回复，但所有人都看到了。';
      } },
    ],
  });

  /* ══════════════════ 互联网 · 外包与基础岗 ══════════════════ */

  J('outsource', {
    id: 'jw_badge', weight: 19, cooldown: 26,
    title: '工牌',
    text: () => '甲方组织团建，通知发在大群里。你在群里。\n\n' +
      '报名表在另一个群，你不在那个群。',
    options: [
      { label: '问一句', apply: (c) => {
        const { E, rng } = c;
        E.stress(+6);
        return rng.chance(0.4) ? (E.relGroup('同事', +5), '对接人说「你也来吧」，报了名。那天你坐在最边上，大部分时间在看手机。')
          : (E.rep(-1), '对接人说「这个是内部的」，说得很客气。你说「好的好的」。');
      } },
      { label: '不问', apply: (c) => {
        const { E } = c;
        E.stress(+7);
        return '你没问。周一大家聊团建的事，你在工位上戴着耳机。\n\n' +
          '你在这栋楼里已经三年了。';
      } },
    ],
  });

  J('outsource', {
    id: 'jw_swap', weight: 14, cooldown: 40,
    title: '换供应商',
    text: () => '甲方招标结果出来了，换了一家。\n\n' +
      '新公司说：人可以留，走新的合同。',
    options: [
      { label: '签，留下来', apply: (c) => {
        const { s, E, rng } = c;
        E.stress(+10);
        const cut = rng.chance(0.5);
        if (cut) { s.p.gross = Math.round(s.p.gross * 0.92 / 100) * 100; s.p.net = Math.round(s.p.gross * 0.8); E.rep(+1);
          return '签了。工龄清零，工资降了一截，工位没动 —— 连显示器都是原来那台。'; }
        E.rep(+2);
        return '签了。工龄清零，工资没变。三年白干了工龄这一项，别的照旧。';
      } },
      { label: '不签，跟原公司走', apply: (c) => {
        const { E } = c;
        E.quitJob(); E.stress(+13);
        return '原公司说给你安排新项目，安排了两个月没安排出来。\n\n你现在待业。';
      } },
    ],
  });

  /* ══════════════════ 金融 · 银行 ══════════════════ */

  J('bank', {
    id: 'jb_task', weight: 20, cooldown: 20,
    title: '任务',
    text: () => '季末最后一周，存款还差三百万。\n\n' +
      '支行长在群里发了个表格，每个人一行，红的绿的。',
    options: [
      { label: '找亲戚朋友帮忙冲一冲', apply: (c) => {
        const { E, rng } = c;
        E.perf(+9); E.stress(+11);
        E.relGroup('老乡', -6); E.relGroup('同学', -5);
        return rng.chance(0.6) ? '凑上了。月初资金就走了，账面上过了一下。这样的电话你一年要打四次。'
          : (E.rep(-2), '没凑上。你姑说「上次刚帮过你」。表格上你那一行是红的。');
      } },
      { label: '不找了，红就红', apply: (c) => {
        const { E } = c;
        E.perf(-10); E.rep(-3); E.stress(+6);
        return '你没打那些电话。绩效扣了，通讯录还在。';
      } },
    ],
  });

  J('bank', {
    id: 'jb_bad_loan', minRank: 3, weight: 14, cooldown: 42,
    title: '一笔贷款',
    text: () => '你两年前经办的那笔企业贷，逾期了。\n\n' +
      '企业主的电话打不通，厂房上了封条。',
    options: [
      { label: '自己去跑清收', apply: (c) => {
        const { E, rng } = c;
        E.stress(+15); E.health(-1.5);
        if (rng.chance(0.45)) { E.rep(+5); E.perf(+4); return '你跑了七趟，找到了他老婆，谈成了分期。收回了六成，剩下的走核销。行里认了你的态度。'; }
        E.rep(-6); E.perf(-11);
        return '跑了七趟，人是真的找不到了。这笔进了不良，跟着你的档案 —— 不良贷款是终身追责的。';
      } },
      { label: '按流程移交清收部门', apply: (c) => {
        const { E } = c;
        E.rep(-3); E.perf(-6); E.stress(+9);
        return '移交了。流程上你没有错，但「经办人」那一栏改不了。\n\n' +
          '以后每次评先进，这笔都会被翻出来看一眼。';
      } },
    ],
  });

  /* ══════════════════ 金融 · 券商投行 ══════════════════ */

  J('ib', {
    id: 'ji_withdraw', weight: 19, cooldown: 30,
    title: '撤了',
    text: () => '做了两年的项目，昨天决定撤材料。\n\n' +
      '底稿装了十七个箱子，出差记录三百二十天。',
    options: [
      { label: '接着上下一个', apply: (c) => {
        const { E, rng } = c;
        E.stress(+13); E.health(-1.2);
        if (rng.chance(0.5)) { E.rep(+5); E.perf(+6); return '一周后进了新项目。两年的底稿写不进简历，但那两年练出来的东西在你身上。'; }
        E.perf(-4);
        return '新项目排了三个月才下来。这三个月你拿的是底薪，而底薪在这行是个很难看的数。';
      } },
      { label: '休一段', apply: (c) => {
        const { E } = c;
        E.stress(-16); E.health(+3); E.perf(-9); E.rep(-3);
        return '你请了三周假，睡了三周。回来发现组里的人已经分完了新项目。';
      } },
    ],
  });

  J('ib', {
    id: 'ji_sign', minRank: 4, weight: 12, cooldown: 50,
    title: '签字',
    text: () => '这个项目有一处存货，函证回来的数和账上差了一点。\n\n' +
      '不大。合伙人说「不影响」，让你签。',
    options: [
      { label: '再核一遍', apply: (c) => {
        const { E, rng } = c;
        E.stress(+12);
        if (rng.chance(0.5)) { E.rep(+8); return '核出来是个真问题。项目延了三个月，合伙人当时脸很难看，一年后他在会上提了这件事。'; }
        E.rep(-2); E.perf(-5);
        return '核了两周，确实不影响。合伙人说了句「你这个性格」。项目组的人加了两周班。';
      } },
      { label: '签', apply: (c) => {
        const { E, rng } = c;
        E.perf(+7); E.stress(+9);
        if (rng.chance(0.8)) { return '签了。项目顺利过会，奖金分了一笔。这件事你偶尔会想起来。'; }
        E.rep(-18); E.perf(-25); E.cash(-c.rng.int(50000, 200000), '罚没与退回的奖金');
        E.flag('layoffComing', 12);
        return '三年后这家公司出了事，倒查底稿。签字责任是终身的 —— 那四个字不是一句形容。';
      } },
    ],
  });

  /* ══════════════════ 金融 · 会计财务 ══════════════════ */

  J('account', {
    id: 'jf_adjust', weight: 18, cooldown: 28,
    title: '调一下',
    text: () => '老板看完报表，说这个数「不太合适」，让你想想办法。\n\n' +
      '他没说具体怎么办。这也是一种说法。',
    options: [
      { label: '在准则范围内调', apply: (c) => {
        const { E, rng } = c;
        E.stress(+9); E.perf(+4);
        return rng.chance(0.6) ? (E.rep(+4), '你调了折旧年限和几项计提，都在准则里，附注写清楚了。老板看了说「行」。')
          : (E.rep(+2), '你调完还是不到他要的数。他说「你再想想」，然后自己找了别人。');
      } },
      { label: '照他的意思做', apply: (c) => {
        const { E, rng } = c;
        E.perf(+9); E.stress(+12);
        if (rng.chance(0.72)) { E.rep(-2); return '数出来了。年报审计过了，事务所出了标准无保留意见。\n\n分录是你做的，凭证上是你的名字。'; }
        E.rep(-14); E.perf(-16);
        return '税务稽查来了。老板说他不懂财务，都是财务在做。\n\n这句话你早该想到的。';
      } },
    ],
  });

  /* ══════════════════ 金融 · 保险代理 ══════════════════ */

  J('insur', {
    id: 'jz_yuangu', weight: 20, cooldown: 22,
    title: '缘故单',
    text: () => '这个月又差三单。培训课上讲的是「先从身边人开始」。\n\n' +
      '你的通讯录还剩十几个没打过的名字。',
    options: [
      { label: '打', apply: (c) => {
        const { E, rng } = c;
        E.perf(+8); E.stress(+10);
        E.relGroup('同学', -8); E.relGroup('老乡', -6);
        return rng.chance(0.5) ? (E.cash(c.rng.int(1500, 6000), '佣金'), '成了两单。一个老同学说「就当帮你」，之后他不怎么回你消息了。')
          : (E.rep(-2), '打了十一个，成了零单。有三个人没接。');
      } },
      { label: '去街上陌拜', apply: (c) => {
        const { E, rng } = c;
        E.stress(+9); E.health(-1.2);
        return rng.chance(0.3) ? (E.cash(c.rng.int(800, 3000), '佣金'), E.perf(+5), '站了六天，成了一单。这一单是自己跑出来的，跟通讯录没关系。')
          : (E.perf(-5), '站了六天，一单没有。回去主任说「你的心态有问题」。');
      } },
    ],
  });

  J('insur', {
    id: 'jz_tuoluo', minRank: 2, weight: 13, cooldown: 40,
    title: '增员',
    text: () => '主任说，你现在该带人了。带三个人进来，你的收入结构就变了。\n\n' +
      '「他们的单，你有一份。」',
    options: [
      { label: '拉人', apply: (c) => {
        const { E, rng } = c;
        E.perf(+9); E.stress(+8);
        E.relGroup('老乡', -10); E.relGroup('同学', -8);
        if (rng.chance(0.5)) { E.cash(c.rng.int(2000, 9000), '增员奖与团队佣金'); E.rep(+3);
          return '拉进来三个，两个三个月后走了，一个留了下来。你现在有团队了。\n\n走的那两个，是你介绍进来的。'; }
        E.rep(-4);
        return '拉进来三个，三个月内全走了。他们把自己的保单退了 —— 退保的那部分佣金从你这儿扣。';
      } },
      { label: '自己做单就行', apply: (c) => {
        const { E } = c;
        E.perf(-4); E.rep(-2); E.stress(+4);
        return '你说自己不擅长带人。主任说「那你这辈子就是个业务员」。\n\n这句话在这个行业里，基本是准确的。';
      } },
    ],
  });

  /* ══════════════════ 制造 · 研发设计 ══════════════════ */

  J('mfg_rd', {
    id: 'jx_recall', weight: 17, cooldown: 34,
    title: '批量退回',
    text: () => '客户那边退回来一批。查下来是一个配合公差，你画的那张图。\n\n' +
      '已经生产了六百套。',
    options: [
      { label: '认，然后把标准改了', apply: (c) => {
        const { E, rng } = c;
        E.perf(-9); E.stress(+12);
        if (rng.chance(0.6)) { E.rep(+5); return '你认了，然后花两周把这一类配合的校核做成了检查表，全组照着用。年底评优的时候有人提了这件事。'; }
        E.rep(-3);
        return '你认了。老板在会上说了二十分钟。检查表你也做了，没人用。';
      } },
      { label: '说是工艺没按图做', apply: (c) => {
        const { E, rng } = c;
        E.stress(+10);
        if (rng.chance(0.45)) { E.perf(-3); E.rep(-6); return '责任划到了车间。工艺那边的老师傅从此见你不说话 —— 而设计出问题最先发现的就是他们。'; }
        E.perf(-14); E.rep(-8);
        return '把图纸调出来一对，公差就是图上写的。你说的那句话，会议室里十几个人都听见了。';
      } },
    ],
  });

  /* ══════════════════ 制造 · 工艺质检 ══════════════════ */

  J('mfg_process', {
    id: 'jy_release', weight: 18, cooldown: 28,
    title: '这批放不放',
    text: () => '抽检有两件超差，比例在临界线上。\n\n' +
      '生产主管站在旁边，说客户的车明天早上就来拉。',
    options: [
      { label: '拦下来', apply: (c) => {
        const { E, rng } = c;
        E.stress(+11);
        if (rng.chance(0.55)) { E.rep(+6); E.perf(+3); return '全检了一夜，挑出来十九件。客户那边晚了半天，但没有退货。厂长后来在会上提了一句。'; }
        E.perf(-7); E.rep(+2);
        return '全检了一夜，只有那两件。耽误了发货，生产主管在群里阴阳了两天。你没说什么。';
      } },
      { label: '放', apply: (c) => {
        const { E, rng } = c;
        E.perf(+5); E.stress(+8);
        if (rng.chance(0.65)) { E.rep(-2); return '货发出去了，客户没发现。生产主管请你抽了根烟。'; }
        E.rep(-12); E.perf(-15);
        return '客户装配的时候发现了，整批退回。放行单上签的是你的名字 —— 质检这个岗位，签字就是全部的意义。';
      } },
    ],
  });

  /* ══════════════════ 制造 · 产线工人 ══════════════════ */

  J('mfg_line', {
    id: 'jl_overtime', weight: 20, cooldown: 18,
    title: '赶货',
    text: () => '大单来了，班组通知连上十二天。\n\n' +
      '算下来这个月能多两千三。',
    options: [
      { label: '上', apply: (c) => {
        const { s, E, rng } = c;
        const add = Math.round(s.p.net * 0.35);
        E.cash(add, '加班费'); E.health(-3.5); E.stress(+9); E.perf(+5); E.rep(+2);
        return `连上了十二天，多拿 ${E.money(add)}。第十三天休息的那个白天，你睡到下午四点。`;
      } },
      { label: '请两天', apply: (c) => {
        const { E } = c;
        E.perf(-8); E.rep(-4); E.stress(-4); E.health(+1);
        return '你请了两天。班长准了，但排班表上下个月的好班次没有你。';
      } },
    ],
  });

  J('mfg_line', {
    id: 'jl_hand', weight: 12, cooldown: 48,
    title: '手',
    text: () => '设备卡了一下，你伸手去拨。\n\n' +
      '安全罩是三个月前拆掉的，为了提速。',
    options: [
      { label: '（无法选择）', apply: (c) => {
        const { s, E, rng } = c;
        const bad = rng.chance(0.35);
        E.health(bad ? -22 : -8); E.stress(+20);
        if (s.p.shebao) { E.cash(-c.rng.int(1000, 5000), '自付部分');
          return bad ? '两根手指的肌腱断了。工伤认定下来了，能报大部分。评了十级伤残，一次性补助拿到手是六位数的前半段。'
            : '缝了七针，休了半个月。工伤走了流程，这次算运气好。'; }
        E.cash(-c.rng.int(8000, 45000), '医药费');
        return bad ? '两根手指没保住。你是劳务派遣，劳务公司说要走认定，认定走了十一个月。'
          : '缝了七针。没有工伤保险，钱自己出。班长说「下次注意」。';
      } },
    ],
  });

  /* ══════════════════ 建筑 · 施工管理 ══════════════════ */

  J('construct', {
    id: 'jn_pour', weight: 19, cooldown: 26,
    title: '已经浇了',
    text: () => '一处做法和图纸对不上。发现的时候混凝土已经浇了两天。\n\n' +
      '监理还没查到这里。',
    options: [
      { label: '报上去，返工', apply: (c) => {
        const { E, rng } = c;
        E.stress(+15); E.perf(-6);
        if (rng.chance(0.55)) { E.rep(+8); return '凿了三天，返了工。工期延了五天，成本进了签证。项目经理当时骂了你，半年后把一个关键分部工程交给了你。'; }
        E.rep(+3); E.perf(-11);
        return '返工的钱最后没算进签证，摊在了项目成本上。年底考核，你这一项是扣分的。';
      } },
      { label: '盖过去', apply: (c) => {
        const { E, rng } = c;
        E.stress(+13);
        if (rng.chance(0.7)) { E.rep(-2); return '后续工序压上去，没人再看得见。这栋楼会站很多年 —— 大概率会。'; }
        E.rep(-15); E.perf(-18); E.flag('layoffComing', 10);
        return '第三方检测钻芯取样，正好取在那一处。质监站下了整改通知，事情捅到了建设单位。';
      } },
    ],
  });

  J('construct', {
    id: 'jn_wages', minRank: 4, weight: 14, cooldown: 40,
    title: '腊月二十六',
    text: () => '劳务队的工人堵在项目部门口，四十来个。\n\n' +
      '甲方的进度款还没到。他们要的是回家过年的钱。',
    options: [
      { label: '自己先垫一部分', apply: (c) => {
        const { s, E, rng } = c;
        const pay = Math.min(s.p.cash, c.rng.int(20000, 80000));
        E.cash(-pay, '垫的工资'); E.stress(+17); E.rep(+7);
        return `你垫了 ${E.money(pay)}。人散了。\n\n开春之后甲方的款到了，公司认了这笔账 —— 认了不等于当月还你。`;
      } },
      { label: '按公司口径解释', apply: (c) => {
        const { E, rng } = c;
        E.stress(+19); E.health(-1.5);
        if (rng.chance(0.5)) { E.rep(+1); return '你在门口站了四个小时，一遍遍说。晚上他们走了。第二天还是来了。'; }
        E.rep(-5); E.perf(-8);
        return '有人报了警，也有人拍了视频。这件事上了本地的号，公司要一个书面说明，写说明的是你。';
      } },
    ],
  });

  /* ══════════════════ 建筑 · 建筑设计 ══════════════════ */

  J('archdesign', {
    id: 'jh_revision', weight: 20, cooldown: 20,
    title: '再大气一点',
    text: () => '第十七版。甲方看完说，还是第二版的感觉好。\n\n' +
      '第二版的源文件在离职那位的电脑里。',
    options: [
      { label: '照着截图重画一遍', apply: (c) => {
        const { E, rng } = c;
        E.stress(+11); E.health(-1); E.perf(+4);
        return rng.chance(0.5) ? (E.rep(+3), '你重画了三天，比第二版还好一点。甲方定了这一版。这一版署名第一个是院总。')
          : '你重画了三天。甲方说「差点意思」，让你再看看第七版。';
      } },
      { label: '跟甲方讲清楚代价', apply: (c) => {
        const { E, rng } = c;
        E.stress(+8);
        if (rng.chance(0.4)) { E.rep(+5); return '你把改图的工时和节点风险摆出来了。甲方那位项目负责人愣了一下，说「那就按现在这版推」。'; }
        E.rep(-4); E.perf(-6);
        return '甲方给院里打了电话。院总跟你说：「他们要什么你就画什么，这不是能讲道理的事。」';
      } },
    ],
  });

  /* ══════════════════ 建筑 · 造价 ══════════════════ */

  J('cost', {
    id: 'jt_settle', weight: 18, cooldown: 30,
    title: '对量',
    text: () => '年底结算对量，甲方换了个人。\n\n' +
      '前任认的口径，这位不认。三个月的活要重来。',
    options: [
      { label: '把前面的依据全翻出来', apply: (c) => {
        const { E, rng } = c;
        E.stress(+12); E.health(-0.8);
        if (rng.chance(0.55)) { E.rep(+6); E.perf(+5); E.cash(c.rng.int(2000, 9000), '结算提成'); return '会议纪要、往来函件、签证单，一份一份摆出来。对方认了大部分。这笔结算的提成年后到账。'; }
        E.perf(-4);
        return '依据是齐的，但对方说「我们领导不认」。最后各让一步，砍掉了七个点。';
      } },
      { label: '让一步，先把款要回来', apply: (c) => {
        const { s, E } = c;
        E.perf(+3); E.rep(-3); E.stress(+7);
        return '你让了十二个点，款三个月内到了。公司拿到了钱，你的提成基数少了十二个点。\n\n' +
          '这一行的钱，是从别人拖着不给的那部分里抠出来的。';
      } },
    ],
  });

  /* ══════════════════ 建筑 · 工地技术工种 ══════════════════ */

  J('site_trade', {
    id: 'jj_cash', weight: 19, cooldown: 24,
    title: '结账',
    text: () => '这个活干完了。老板说「过两天给你」。\n\n' +
      '过两天是上上个月说的。',
    options: [
      { label: '天天去要', apply: (c) => {
        const { s, E, rng } = c;
        E.stress(+11);
        if (rng.chance(0.6)) { const got = Math.round(s.p.net * c.rng.float(0.6, 1.1)); E.cash(got, '要回来的工钱'); E.rep(+2);
          return `跑了五趟，拿到了 ${E.money(got)}。剩下的他说「年底一起结」。`; }
        E.rep(-2);
        return '跑了五趟，人躲着不见。这一行没有合同，只有一句「过两天」。';
      } },
      { label: '换个老板干', apply: (c) => {
        const { E, rng } = c;
        E.stress(+8);
        E.flag('jobHunting', 6);
        return rng.chance(0.5) ? '你换了个班组。上一笔钱基本要不回来了 —— 这一行大家都知道，走了就是走了。'
          : '你换了个班组。新的这个按周结，钱少一点，但准。';
      } },
    ],
  });
})(window);
