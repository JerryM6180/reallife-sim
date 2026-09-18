/* 第二批事件。单独一个文件，方便继续往里堆。
   写作规矩：克制、具体、不煽情、不把苦难浪漫化；每个选择都有代价，没有纯赚的选项。 */
(function (global) {
  'use strict';
  const C = global.CONTENT;
  const ev = (o) => { C.EVENTS.push(o); return o; };
  const R = (arr, rng) => arr[Math.floor(rng.next() * arr.length)];

  /* ══════════ 工作期 ══════════ */

  ev({
    id: 'w_colleague_quit', tier: 'social', weight: 20, cooldown: 20,
    when: (s) => !!s.p.job && s.p.jobMonths > 8,
    title: '有人走了', auto: true,
    apply: (c) => {
      const { s, rng, E } = c;
      const n = s.npcs.filter((x) => x.work && x.alive);
      const who = n.length ? R(n, rng).name : '带你的那个人';
      E.stress(+3);
      return R([
        `${who}提离职了。最后一天他把工位收拾得很干净，走的时候只有你送到电梯口。`,
        `${who}走了，去了同行。群里发了个红包，说"以后常联系"。你知道不会。`,
        `${who}最后一天请大家喝奶茶。他的活分给了三个人，你占两份。`,
      ], rng);
    },
  });

  ev({
    id: 'w_reorg', tier: 'situation', weight: 16, cooldown: 30,
    when: (s) => !!s.p.job && s.p.jobMonths > 12,
    title: '部门重组',
    text: () => '组织架构调整。你的汇报线换人了。\n\n新领导上周才从别的部门过来，还没记住所有人的名字。',
    options: [
      { label: '主动去汇报一次工作', apply: (c) => {
        const { E, rng } = c;
        E.stress(+4);
        if (rng.chance(0.55)) { E.perf(+8); E.relGroup('同事', +5); return '他听完了，还问了两个具体问题。你们算是认识了。'; }
        E.perf(-2); return '他一边看手机一边听。你讲完他说"行，你先按原来的做"。';
      } },
      { label: '等他来找你', apply: (c) => {
        const { E, rng } = c;
        if (rng.chance(0.3)) { E.perf(+3); return '两周后他找你聊了一次，看过你做的东西。'; }
        E.perf(-6); E.stress(+6);
        return '一个月过去了，他没找过你。开会时点名点到别人。';
      } },
    ],
  });

  ev({
    id: 'w_blame', tier: 'situation', weight: 15, cooldown: 26,
    when: (s) => !!s.p.job && s.p.jobMonths > 6,
    title: '出事了',
    text: (s) => {
      const m = { 互联网: '线上出了故障，一个下午没恢复。', 金融: '一笔账对不上，差了六位数。',
        医疗: '一个病人的用药记录出了问题。', 教育: '一份成绩单发错了家长群。',
        建筑: '现场一处做法和图纸对不上，已经浇了。', 制造: '一批货流到客户那边被退回来了。' };
      return (m[s.p.ind] || '一件事办砸了，客户直接打到了领导那里。')
        + '\n\n复盘会上，需要有人的名字写在"责任人"那一栏。';
    },
    options: [
      { label: '认下来', apply: (c) => {
        const { E, rng } = c;
        E.perf(-12); E.stress(+10); E.relGroup('同事', +8);
        return rng.chance(0.4)
          ? '你认了。领导当场没说什么，散会后跟你说"这次算了"。组里的人后来都记得这件事。'
          : '你认了。绩效那一栏当季写了"待改进"。但没有人再提这件事。';
      } },
      { label: '说清楚不是你的问题', apply: (c) => {
        const { E, rng } = c;
        E.stress(+8);
        if (rng.chance(0.5)) { E.perf(-3); E.relGroup('同事', -10); return '你说清楚了。责任落到了另一个人身上。他后来再没主动跟你说过话。'; }
        E.perf(-9); E.relGroup('同事', -6);
        return '你说了很多，但会议室里没人接话。最后那一栏还是写了你的名字。';
      } },
      { label: '沉默', apply: (c) => {
        const { E } = c; E.perf(-8); E.stress(+12);
        return '你一句话没说。散会以后，那件事就成了"上次那个事"，每次提起都会看你一眼。';
      } },
    ],
  });

  ev({
    id: 'w_poach', tier: 'social', weight: 14, cooldown: 30,
    when: (s) => !!s.p.job && s.p.jobMonths > 18 && s.p.perf > 55,
    title: '老同事来问你',
    text: () => '一个跳槽走的老同事发来消息：他们那边在招人，让你考虑一下。\n\n他没说具体给多少，只说"肯定比你现在多"。',
    options: [
      { label: '去聊聊', apply: (c) => {
        const { E, rng } = c;
        E.stress(+5); E.flag('referral', 10);
        return rng.chance(0.6)
          ? '聊完了，对方让你等消息。这几天你上班时总在想别的。'
          : '聊完发现和他说的不太一样。回来的地铁上你有点烦。';
      } },
      { label: '不去，现在挺好', apply: (c) => {
        const { E } = c; E.stress(-2);
        return '你回了句"再看看"。半年后听说他们那边裁了一半。';
      } },
    ],
  });

  ev({
    id: 'w_teambuild', tier: 'social', weight: 18, cooldown: 22,
    when: (s) => !!s.p.job && s.p.jobIntensity >= 2,
    title: '团建',
    text: () => '周末团建。通知发在群里，末尾写着"自愿参加"。\n\n但是接龙已经开始了。',
    options: [
      { label: '去', apply: (c) => {
        const { E, rng } = c;
        E.cash(-rng.int(0, 200), '份子');
        E.relGroup('同事', +7); E.stress(+5);
        return '两天一夜。回来那天晚上你在床上躺了很久，周一还是要上班。';
      } },
      { label: '找理由不去', apply: (c) => {
        const { E } = c; E.relGroup('同事', -8); E.stress(-3);
        return '你说家里有事。周一大家聊团建的梗，你插不上话。';
      } },
    ],
  });

  ev({
    id: 'w_newbie_pay', tier: 'situation', weight: 13, cooldown: 34,
    when: (s) => !!s.p.job && s.p.jobMonths > 24,
    title: '新人的工资',
    text: () => '新来的人和你干一样的活。有一天你无意中知道了他的工资。\n\n比你高。',
    options: [
      { label: '去找领导谈', apply: (c) => {
        const { s, E, rng } = c;
        E.stress(+8);
        if (rng.chance(0.35 + s.p.perf / 400)) {
          E.raise(rng.float(1.06, 1.14));
          return `谈了。下个月工资条上多了一点，涨到 ${E.money(s.p.gross)}（税前）。领导说"这事别外传"。`;
        }
        E.perf(-4);
        return '领导说"人家是市场价招进来的，你的是历史原因"。这句话你想了很久也没想明白。';
      } },
      { label: '当不知道', apply: (c) => { c.E.stress(+9); return '你没提。但每次开会看见他，都会想起那个数字。'; } },
      { label: '开始骑驴找马', apply: (c) => { c.E.flag('jobHunting', 8); c.E.perf(-3); return '你把简历更新了。这次是认真的。'; } },
    ],
  });

  ev({
    id: 'w_review', tier: 'situation', weight: 22, cooldown: 14,
    when: (s) => !!s.p.job && (s.month === 6 || s.month === 12),
    title: '绩效面谈', auto: true,
    apply: (c) => {
      const { s, rng, E } = c;
      const f = s.p.perf;
      if (f >= 80) { E.promo(+6); return '半年度面谈。领导说这半年看在眼里，让你"再稳一稳"。稳多久没说。'; }
      if (f >= 55) { return '半年度面谈。二十分钟，一半时间在聊公司的战略。'; }
      E.stress(+8);
      return R(['半年度面谈。领导让你说说"自己觉得哪里不足"。你说了三条，他记了两条。',
        '半年度面谈。评级下来是 C。他说"不代表否定你这个人"。'], rng);
    },
  });

  ev({
    id: 'w_biz_trip', tier: 'situation', weight: 14, cooldown: 18,
    when: (s) => !!s.p.job && s.p.prestige !== 1 && s.p.jobMonths > 6,
    title: '出差',
    text: () => '临时出差，周日走，说不准哪天回。',
    options: [
      { label: '去', apply: (c) => {
        const { E, rng } = c;
        E.perf(+5); E.health(-1.5); E.stress(+6);
        if (c.s.p.partner) E.rel(c.s.p.partner, { close: -5 });
        return R(['出差十天。回来发现工位上落了一层灰，绿植死了。',
          '出差期间在酒店改了三个通宵。回程飞机上睡得像块石头。'], rng);
      } },
      { label: '推掉', apply: (c) => { c.E.perf(-7); return '你说身体不舒服。领导"嗯"了一声，换了别人去。'; } },
    ],
  });

  ev({
    id: 'w_annual', tier: 'social', weight: 30, cooldown: 11,
    when: (s) => !!s.p.job && s.month === 1,
    title: '年会', auto: true,
    apply: (c) => {
      const { rng, E } = c;
      E.relGroup('同事', +4);
      return R(['年会。抽奖抽到一箱洗衣液，同事帮你搬到了地铁站。',
        '年会。老板讲了四十分钟，说明年是"关键的一年"。去年也这么说。',
        '年会。你上台表演了节目，视频被发到群里，删不掉。',
        '年会。一等奖是隔壁部门去年刚入职的女生。大家鼓掌鼓得很整齐。'], rng);
    },
  });

  ev({
    id: 'w_office_move', tier: 'situation', weight: 10, cooldown: 40,
    when: (s) => !!s.p.job && s.p.jobMonths > 12,
    title: '公司搬家',
    text: () => '公司要搬到新园区。租金便宜，地方大。\n\n就是离你住的地方远了很多。',
    options: [
      { label: '忍了，每天多花一小时', apply: (c) => {
        const { s, E } = c;
        s.p.commute = Math.min(2.4, (s.p.commute || 1) + 0.6);
        E.stress(+6); E.health(-1);
        return '早上要早起五十分钟。地铁上能睡一觉，但那不算休息。';
      } },
      { label: '搬去公司附近', apply: (c) => {
        const { s, E, rng } = c;
        E.cash(-rng.int(4000, 9000), '押金与搬家');
        s.p.commute = 1; s.rentAdj = (s.rentAdj || 1) * 1.1;
        E.stress(+4);
        return '你搬了。通勤短了，房租贵了一成。周末不用出门就能吃到公司楼下的饭。';
      } },
    ],
  });

  /* ══════════ 家庭与人际 ══════════ */

  ev({
    id: 'f_parents_move_in', tier: 'social', weight: 12, cooldown: 40,
    when: (s) => s.p.age >= 26 && s.npcs.some((n) => n.family && n.alive && n.health < 76),
    title: '父母想过来',
    text: (s) => (C.parentCount(s) > 1 ? `你妈在电话里说，你爸身体不如从前了，两个人在老家"没什么意思"。\n\n她问你那边房子够不够住。`
      : `你${C.pw(s)}在电话里说，一个人在老家"没什么意思"。\n\n${C.pw(s) === '妈' ? '她' : '他'}问你那边房子够不够住。`),
    options: [
      { label: '接过来', apply: (c) => {
        const { s, E } = c;
        s.p.hTier = Math.max(0, (s.p.hTier || 1) - 1);
        s.rentAdj = (s.rentAdj || 1) * 1.45;
        E.rel('father', { close: +14 }); E.rel('mother', { close: +16 });
        E.stress(+10);
        return '你换了个大一点的房子。他们来了以后，家里每天有饭，也每天有话要接。';
      } },
      { label: '再等等', apply: (c) => {
        const { E } = c;
        E.rel('mother', { close: -8 }); E.stress(+9);
        return `你说等你稳定一点。你${C.pw(c.s)}说"应该的，你先忙"。挂了以后你在阳台站了一会儿。`;
      } },
    ],
  });

  ev({
    id: 'f_reunion', tier: 'social', weight: 15, cooldown: 30,
    when: (s) => s.p.age >= 25,
    title: '同学聚会',
    text: () => '毕业多少年了，有人张罗聚会。群里在报名。\n\n你翻了翻通讯录，想起来有几个人已经很久没说过话。',
    options: [
      { label: '去', apply: (c) => {
        const { s, E, rng } = c;
        E.cash(-rng.int(300, 800), '聚会');
        E.relGroup('同学', +10);
        const rich = s.p.net > 12000 || s.p.house;
        E.stress(rich ? -4 : +10);
        E.tryRumor(['classmate'], 2);
        return rich
          ? '一桌人，问你在哪儿高就。你说了公司名字，有人"哦"了一声，然后话题继续。'
          : '一桌人。有人换了车，有人在讲学区房。你大部分时间在低头吃菜。';
      } },
      { label: '不去', apply: (c) => { c.E.relGroup('同学', -6); return '你说那天有事。后来看到群里发的合照，认不全里面的人。'; } },
    ],
  });

  ev({
    id: 'f_wedding_role', tier: 'social', weight: 13, cooldown: 24,
    when: (s) => s.p.age >= 24 && s.p.age <= 36,
    title: '当伴郎伴娘',
    text: () => '好朋友结婚，让你当伴郎/伴娘。\n\n"就当帮个忙，不用你花什么钱。"',
    options: [
      { label: '答应', apply: (c) => {
        const { E, rng } = c;
        const cost = rng.int(1500, 4000);
        E.cash(-cost, '礼服、路费、份子');
        E.relGroup('同学', +12); E.stress(+3);
        return `前后花了 ${E.money(cost)}。婚礼那天你忙了一整天，照片里基本看不见你。`;
      } },
      { label: '婉拒', apply: (c) => { c.E.relGroup('同学', -10); return '你说那几天走不开。他说"没事没事"。'; } },
    ],
  });

  ev({
    id: 'f_ex_married', tier: 'social', weight: 8, cooldown: 60, once: true,
    when: (s) => s.p.age >= 26,
    title: '朋友圈', auto: true,
    apply: (c) => { c.E.stress(+7); return '刷到一条九宫格。是很多年前那个人。\n\n你点进去看了一遍，退出来，什么也没做。'; },
  });

  ev({
    id: 'f_relative_favor', tier: 'social', weight: 12, cooldown: 28,
    when: (s) => s.p.age >= 24 && !!s.p.job,
    title: '亲戚托事',
    text: () => '你姑打电话来，说她儿子今年毕业，问你能不能"帮着看看"。\n\n你和这个表弟上次见面是六年前。',
    options: [
      { label: '帮着问问', apply: (c) => {
        const { E, rng } = c;
        E.stress(+5); E.relGroup('老乡', +8);
        return rng.chance(0.35)
          ? '你真的帮他递了简历。后来他进了，逢年过节你姑对你格外热情。'
          : '你问了两圈，没有合适的。你姑后来跟别人说"他也没怎么使劲"。';
      } },
      { label: '实话说帮不上', apply: (c) => { c.E.relGroup('老乡', -8); return '你说你也只是个打工的。电话那头沉默了两秒，说"那行吧"。'; } },
    ],
  });

  /* ══════════ 健康与意外 ══════════ */

  ev({
    id: 'h_palpitation', tier: 'situation', weight: (s) => (s.p.stress > 70 ? 26 : 4), cooldown: 20,
    when: (s) => s.p.age >= 24,
    title: '半夜醒了',
    text: () => '凌晨三点心跳得厉害，躺着能听见自己的心跳声。\n\n过了二十分钟又好了。',
    options: [
      { label: '第二天去医院查', apply: (c) => {
        const { s, E, rng } = c;
        E.cash(-rng.int(400, 1200), '检查');
        if (rng.chance(0.3)) { E.stress(+10); return '心电图有点异常，医生让你戴动态心电监测。报告说"窦性心律不齐"，让你别熬夜。'; }
        E.stress(-6); return '各项都正常。医生说是压力大。你说知道了。';
      } },
      { label: '没当回事', apply: (c) => {
        const { E, rng } = c;
        E.health(-1.5);
        if (rng.chance(0.25)) E.schedule(rng.int(8, 30), 'lateDiag', {});
        return '你继续上班。后来又醒过几次，慢慢也就习惯了。';
      } },
    ],
  });

  ev({
    id: 'h_ebike_stolen', tier: 'accident', weight: 10, cooldown: 36,
    when: (s) => s.stage === 'work',
    title: '车没了', auto: true,
    apply: (c) => {
      const { rng, E } = c;
      E.cash(-rng.int(1200, 2600), '重新买一辆');
      E.stress(+5);
      return '电动车停在楼下，早上下来就不见了。报了警，登记了，没有下文。';
    },
  });

  ev({
    id: 'h_leak', tier: 'accident', weight: 9, cooldown: 30,
    when: (s) => s.stage === 'work' && !s.p.house,
    title: '房子漏水',
    text: () => '楼上漏水，你的天花板洇了一大片，衣柜里的东西都是潮的。\n\n房东说"你先联系楼上"。',
    options: [
      { label: '自己去交涉', apply: (c) => {
        const { E, rng } = c;
        E.stress(+8);
        return rng.chance(0.45) ? '楼上赔了你两千块，修了防水。前后跑了三趟。'
          : '楼上说不是他家的问题。物业让你找房东，房东让你找物业。最后你自己买了除湿机。';
      } },
      { label: '直接搬走', apply: (c) => {
        const { s, E, rng } = c;
        E.cash(-rng.int(3000, 7000), '押金没退+搬家');
        s.p.commute = Math.min(2.2, (s.p.commute || 1) + 0.2);
        E.stress(+5);
        return '押金没要回来。新住处离地铁远了两站。';
      } },
    ],
  });

  /* ══════════ 钱与消费 ══════════ */

  ev({
    id: 'm_double11', tier: 'situation', weight: 34, cooldown: 11,
    when: (s) => s.stage !== 'hs' && s.month === 11,
    title: '双十一', auto: true,
    apply: (c) => {
      const { s, rng, E } = c;
      const base = Math.min(s.p.cash * 0.25, rng.int(600, 4500));
      const amt = Math.round(base);
      if (amt < 100) return '今年什么也没买。购物车里的东西看了一遍又清空了。';
      E.cash(-amt, '双十一');
      return `双十一花了 ${E.money(amt)}。快递陆续到了两个星期，有几件到现在没拆。`;
    },
  });

  ev({
    id: 'm_gym_card', tier: 'situation', weight: 11, cooldown: 40,
    when: (s) => s.stage === 'work' && s.p.cash > 4000,
    title: '办卡',
    text: () => '楼下健身房在推年卡，销售追着你说了二十分钟。\n\n"你这个体态再不练就来不及了。"',
    options: [
      { label: '办了', apply: (c) => {
        const { E, rng } = c;
        E.cash(-rng.int(1800, 3600), '健身年卡');
        E.schedule(rng.int(4, 10), 'gymDust', {});
        return '办了张年卡。第一个月去了六次。';
      } },
      { label: '没办', apply: (c) => '你说考虑一下，然后绕开了那条路。' },
    ],
  });

  ev({
    id: 'm_big_buy', tier: 'situation', weight: 12, cooldown: 30,
    when: (s) => s.stage === 'work' && s.p.cash > 15000,
    title: '想买个大件',
    text: (s) => `攒了点钱。你在想要不要换个东西 —— 手机、电脑、或者一直想买的那个。\n\n账上有 ${Math.round(s.p.cash / 1000)} 千。`,
    options: [
      { label: '买', apply: (c) => {
        const { s, E, rng } = c;
        const amt = Math.round(Math.min(s.p.cash * 0.35, rng.int(4000, 14000)));
        E.cash(-amt, '大件');
        E.stress(-8);
        return `花了 ${E.money(amt)}。用上的头两周确实很高兴。`;
      } },
      { label: '算了，存着', apply: (c) => { c.E.stress(+3); return '你把页面关了。存款那个数字看着让人踏实一点。'; } },
    ],
  });

  /* ══════════ 世界层 ══════════ */

  ev({
    id: 'w_ai_wave', tier: 'world', weight: 9, cooldown: 44, auto: true,
    title: '新的东西来了',
    apply: (c) => {
      const { s, rng } = c;
      const hit = R(['互联网', '教育', '文化传媒', '金融', '服务'], rng);
      if (!Number.isFinite(s.world.ind[hit])) s.world.ind[hit] = 55;
      s.world.ind[hit] = Math.max(12, s.world.ind[hit] - rng.int(6, 16));
      return `【新闻】新的工具铺开了，${hit}这一行开始有人被替掉。`
        + (s.p.ind === hit ? '你们组这个月没招人，走了两个也没补。' : '你在短视频里刷到过，划过去了。');
    },
  });

  ev({
    id: 'w_public_health', tier: 'world', weight: 5, cooldown: 90, once: true, auto: true,
    title: '公共事件',
    apply: (c) => {
      const { s, E, rng } = c;
      C.INDUSTRIES.forEach((i) => {
        if (!Number.isFinite(s.world.ind[i])) s.world.ind[i] = 55;
        s.world.ind[i] = Math.max(10, s.world.ind[i] - rng.int(4, 14));
      });
      E.stress(+8);
      return '【新闻】情况从一月份开始变了。小区门口设了岗，公司改成居家办公。\n\n那几个月的日子后来很难向人描述。';
    },
  });

  ev({
    id: 'w_hometown_demolition', tier: 'world', weight: 6, cooldown: 80, once: true,
    when: (s) => s.p.age >= 22,
    title: '老家的消息',
    text: (s) => `老家那片传要拆。你${C.pw(s)}在电话里说得含含糊糊，隔壁几家已经在算面积了。`,
    options: [
      { label: '回去一趟', apply: (c) => {
        const { s, E, rng } = c;
        E.cash(-rng.int(600, 1600), '路费');
        if (rng.chance(0.4)) {
          const amt = rng.int(180000, 900000);
          E.familyCash(+amt);
          return `回去待了几天。规划确实下来了，家里能分到 ${E.money(amt)} 左右。你爸这几天睡得比平时早。`;
        }
        E.rel('mother', { close: +6 });
        return `回去待了几天。所谓的消息是隔壁村的事，跟你家这一片没关系。你${C.pw(c.s)}做了顿饭，很高兴你回来。`;
      } },
      { label: '让他们自己看着办', apply: (c) => {
        const { E, rng } = c;
        if (rng.chance(0.4)) { const amt = rng.int(150000, 700000); E.familyCash(+amt); return `后来听说真拆了，家里进账 ${E.money(amt)} 左右。你是从你表哥那儿知道的。`; }
        return `后来就没下文了。过了两年你${C.pw(c.s)}才提起，说那事早黄了。`;
      } },
    ],
  });

  /* ══════════ 定时效果 ══════════ */
  C.LATE_HANDLERS = {
    gymDust: (s, E) => { E.log('健身卡到期了。后半年一次也没去。'); },
  };
})(window);
