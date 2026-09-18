/* 岗位遭遇事件 · 第三批：服务 / 物流 / 文化传媒 / 法律 */
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

  /* ══════════════════ 服务 · 销售 ══════════════════ */

  J('sales', {
    id: 'ks_bigdeal', weight: 19, cooldown: 26,
    title: '快签了',
    text: () => '谈了五个月的单子，对方采购说下周就走流程。\n\n' +
      '今天他打电话来，问你「有没有什么表示」。',
    options: [
      { label: '按公司政策走', apply: (c) => {
        const { E, rng } = c;
        E.stress(+9);
        if (rng.chance(0.45)) { E.rep(+6); E.perf(+9); E.cash(c.rng.int(4000, 20000), '提成'); return '你把返点政策和服务方案摆出来，没接那句话。单子签了 —— 对方老板本来就想换供应商。'; }
        E.perf(-9); E.rep(+2);
        return '单子给了别家。五个月，一百多次拜访，最后卡在一通电话上。';
      } },
      { label: '想办法办了', apply: (c) => {
        const { E, rng } = c;
        E.cash(-c.rng.int(5000, 25000), '「费用」');
        E.perf(+13); E.stress(+11);
        if (rng.chance(0.75)) { E.rep(-2); E.cash(c.rng.int(8000, 35000), '提成'); return '签了。这笔费用你自己出的，报销单上写的是招待。提成够覆盖，还有得剩。'; }
        E.rep(-14); E.perf(-20); E.flag('layoffComing', 10);
        return '对方公司内部审计翻出来了。采购被辞退，你这边被列进了他们的黑名单，公司也收到了函。';
      } },
    ],
  });

  J('sales', {
    id: 'ks_lose', minRank: 3, weight: 15, cooldown: 36,
    title: '客户被划走了',
    text: () => '公司调整区域，你手上最大的两个客户划给了新来的总监。\n\n' +
      '「资源要盘活。」文件上是这么写的。',
    options: [
      { label: '认，重新跑新区域', apply: (c) => {
        const { E, rng } = c;
        E.perf(-8); E.stress(+13); E.health(-1);
        if (rng.chance(0.5)) { E.rep(+6); E.perf(+10); return '你用一年在新区域做出了两个客户。这一次是真的自己的 —— 至少在下次调整之前是。'; }
        return '新区域跑了一年，量只有原来的四成。年底述职，你讲的是「基础工作」。';
      } },
      { label: '带着客户走', apply: (c) => {
        const { E, rng } = c;
        E.stress(+14);
        if (rng.chance(0.4)) { E.flag('referral', 8); E.rep(+2); return '你跟客户吃了顿饭，对方说「你去哪我跟到哪」。现在你需要一个去处 —— 竞业协议你签过，但没人当真。'; }
        E.rep(-8); E.perf(-14);
        return '客户没跟。他们认的是那家公司的账期和售后，不是你。公司知道了你在谈这件事。';
      } },
    ],
  });

  /* ══════════════════ 服务 · 房产中介 ══════════════════ */

  J('realty', {
    id: 'kr_zero', maxRank: 2, weight: 20, cooldown: 18,
    title: '第三个月',
    text: () => '连着三个月没开单。今天早会，店长念名字念到你，停了一下。\n\n' +
      '「再给你一个月。」',
    options: [
      { label: '住店里，见人就发', apply: (c) => {
        const { E, rng } = c;
        E.stress(+13); E.health(-2);
        if (rng.chance(0.45)) { const got = c.rng.int(8000, 40000); E.cash(got, '佣金'); E.perf(+12); E.rep(+5);
          return `第二十六天开了一单，佣金 ${E.money(got)}。全店给你鼓掌。前面那五个月没人提。`; }
        E.perf(-10);
        return '一个月，带看三十一组，零单。店长没再说什么，把你调去了另一家店。';
      } },
      { label: '不干了', apply: (c) => {
        const { E } = c;
        E.quitJob(); E.stress(+9);
        return '你把工牌放在了前台。这一行来去都很快，走的时候没有人挽留，也没有人意外。';
      } },
    ],
  });

  J('realty', {
    id: 'kr_flip', minRank: 2, weight: 14, cooldown: 38,
    title: '业主要跳单',
    text: () => '带看了七次的那套房，客户和业主私下加了微信。\n\n' +
      '今天你路过小区，看见他们在楼下谈。',
    options: [
      { label: '拿合同去谈', apply: (c) => {
        const { E, rng } = c;
        E.stress(+12);
        if (rng.chance(0.5)) { const got = c.rng.int(6000, 30000); E.cash(got, '佣金'); E.rep(+3);
          return `你把带看确认书拿出来了。最后按合同走了流程，佣金拿到 ${E.money(got)}。这单之后业主逢人就说中介难缠。`; }
        E.perf(-8); E.rep(-2);
        return '他们说是「自己认识的」。带看确认书签了字，但打官司要三个月，这单不值三个月。';
      } },
      { label: '算了', apply: (c) => {
        const { E } = c;
        E.perf(-9); E.stress(+9);
        return '你转身走了。七次带看，一次不算数。\n\n' +
          '这个月的底薪是两千一。';
      } },
    ],
  });

  /* ══════════════════ 服务 · 零售餐饮 ══════════════════ */

  J('retail', {
    id: 'kt_complaint', weight: 20, cooldown: 20,
    title: '投诉',
    text: () => '一位顾客坚持说少找了二十块。监控看了三遍，没少找。\n\n' +
      '他说要投诉到总部。',
    options: [
      { label: '按流程，不认', apply: (c) => {
        const { E, rng } = c;
        E.stress(+10);
        if (rng.chance(0.5)) { E.rep(+3); return '你调了监控给他看。他看完什么也没说就走了。这件事到此为止。'; }
        E.perf(-7); E.rep(-2);
        return '总部工单下来了。不管监控怎么样，工单本身就是扣分 —— 这个考核项叫「顾客满意度」。';
      } },
      { label: '自己掏二十块', apply: (c) => {
        const { E } = c;
        E.cash(-20, '自己贴的'); E.perf(+2); E.stress(+5); E.rep(-1);
        return '你从自己兜里拿了二十。他拿了钱，说「早这样不就完了」。\n\n' +
          '这个月你贴过第三次了。';
      } },
    ],
  });

  J('retail', {
    id: 'kt_shift', minRank: 2, weight: 16, cooldown: 26,
    title: '排班',
    text: () => '春节七天，店里要人。手下五个人，三个是外地的。\n\n' +
      '排班表你来写。',
    options: [
      { label: '自己顶上', apply: (c) => {
        const { E } = c;
        E.perf(+6); E.rep(+7); E.stress(+12); E.health(-1.5);
        E.rel('mother', { close: -8 }); E.rel('father', { close: -6 });
        return `你排了自己七天。三个外地的孩子回家了。\n\n`
          + `大年三十你${C.pw(c.s)}打来电话，你在收银台后面接的。`;
      } },
      { label: '按工龄排', apply: (c) => {
        const { E, rng } = c;
        E.stress(+6);
        return rng.chance(0.5) ? (E.relGroup('同事', -6), '你按工龄排的，最新来的那两个留下了。他们没说什么，年后一个走了。')
          : (E.rep(+2), '你按工龄排的，也跟每个人谈了。大家认这个规矩。');
      } },
    ],
  });

  /* ══════════════════ 服务 · 家政 ══════════════════ */

  J('domestic', {
    id: 'kd_employer', weight: 19, cooldown: 24,
    title: '雇主',
    text: () => '这一户的老太太说你「手脚不干净」，因为一个玉镯找不到了。\n\n' +
      '两天后镯子在她自己的抽屉里找到了。没有人跟你说这件事。',
    options: [
      { label: '要一个说法', apply: (c) => {
        const { E, rng } = c;
        E.stress(+11);
        if (rng.chance(0.4)) { E.rep(+3); return '儿媳妇跟你道了歉，加了两百块。老太太全程没出来。'; }
        E.rep(-3);
        return '家政公司说「客户就是这样，你多担待」。这一单做完，公司给你的评级降了半档。';
      } },
      { label: '当没这回事', apply: (c) => {
        const { E } = c;
        E.stress(+9); E.rep(+1);
        return '你把这一单做完了，做得比之前还仔细。\n\n' +
          '这一行的口碑经不起一次事故，也经不起一次误会 —— 而误会你连辩解的地方都没有。';
      } },
    ],
  });

  J('domestic', {
    id: 'kd_gap', minRank: 2, weight: 16, cooldown: 28,
    title: '下户',
    text: () => '二十六天做完，下户了。下一单还没定。\n\n' +
      '中介说「过完这阵就有」。',
    options: [
      { label: '在中介那儿等', apply: (c) => {
        const { s, E, rng } = c;
        const wait = c.rng.int(1, 3);
        E.cash(-Math.round(s.p.net * 0.5), '空档期的开销'); E.stress(+9);
        return `等了 ${wait} 个月才接上。没有社保，没有底薪 —— 空的这几个月，就是空的。`;
      } },
      { label: '自己找活', apply: (c) => {
        const { E, rng } = c;
        E.stress(+7); E.health(-0.8);
        if (rng.chance(0.55)) { E.cash(c.rng.int(2000, 6000), '零散的活'); E.rep(+2); return '你去老客户那儿问了一圈，接了几个钟点工的活，接上了。绕过中介的那部分，全是你的。'; }
        E.rep(-1);
        return '问了一圈没问着。中介知道你在私下接活，下一单排得更靠后了。';
      } },
    ],
  });

  /* ══════════════════ 服务 · 保安物业 ══════════════════ */

  J('guard', {
    id: 'kg_owner', weight: 19, cooldown: 22,
    title: '业主',
    text: () => '一辆车停在消防通道上。你贴了条，车主下来了。\n\n' +
      '「你知道我是谁吗。」',
    options: [
      { label: '按规定说', apply: (c) => {
        const { E, rng } = c;
        E.stress(+9);
        if (rng.chance(0.5)) { E.rep(+4); return '你说消防通道是硬规定，说了三遍。他骂了几句，把车挪了。'; }
        E.perf(-6); E.rep(-2);
        return '他投诉到了物业经理。经理让你去道个歉。你去了。';
      } },
      { label: '算了，让他停', apply: (c) => {
        const { E, rng } = c;
        E.stress(+4);
        if (rng.chance(0.9)) { E.rep(-2); return '你把条撕了。这一栋楼的消防通道上，现在长期停着四辆车。'; }
        E.rep(-12); E.perf(-16);
        return '当天夜里三楼失火，消防车进不来。这件事上了新闻，物业换了一整套人。';
      } },
    ],
  });

  J('guard', {
    id: 'kg_night', maxRank: 2, weight: 17, cooldown: 20,
    title: '夜班',
    text: () => '监控室，凌晨三点。十六块屏，没有一块在动。',
    options: [
      { label: '（无法选择）', apply: (c) => {
        const { E, rng } = c;
        E.health(-1.6); E.stress(+4);
        return R([
          '你把整栋楼的巡更点走了一遍，回来是四点二十。剩下的两个小时你盯着屏幕，什么也没想。',
          '你在监控室看完了一整部电视剧。天亮的时候交班，接班的那位问你昨晚有没有事，你说没事。',
          '有一块屏突然动了一下，是只猫。你盯着它走出画面。',
        ], c.rng);
      } },
    ],
  });

  /* ══════════════════ 物流 · 骑手司机 ══════════════════ */

  J('rider', {
    id: 'kk_timeout', maxRank: 2, weight: 21, cooldown: 16,
    title: '还有四分钟',
    text: () => '导航说十二分钟，系统给了八分钟。\n\n' +
      '前面是一条单行道，逆行能省六分钟。',
    options: [
      { label: '逆行', apply: (c) => {
        const { E, rng } = c;
        const r = rng.next();
        if (r > 0.86) { E.health(-c.rng.int(8, 24)); E.cash(-c.rng.int(2000, 12000), '修车与医药费'); E.stress(+20);
          return '一辆车从路口出来。你在地上躺了一会儿，第一反应是去看那个餐盒。\n\n没有保险，钱自己出。'; }
        if (r > 0.7) { E.cash(-200, '罚单'); E.stress(+7); return '被交警拦下，罚了两百。单还是超时了，差评扣一百。'; }
        E.cash(c.rng.int(6, 12), '一单'); E.perf(+3); E.stress(+6); E.health(-0.8);
        return '赶上了。这一单挣了八块。';
      } },
      { label: '按规矩走', apply: (c) => {
        const { E, rng } = c;
        E.stress(+8);
        if (rng.chance(0.55)) { E.cash(-100, '超时罚款'); E.perf(-4); return '超时六分钟。系统扣了一百，客户还给了个差评，再扣。\n\n这一单你倒贴。'; }
        E.cash(c.rng.int(6, 12), '一单');
        return '客户没催，也没差评。这种客户你会记住。';
      } },
    ],
  });

  J('rider', {
    id: 'kk_station', minRank: 3, weight: 14, cooldown: 34,
    title: '站里出事了',
    text: () => '一个骑手撞了人，对方在住院。他没有保险。\n\n' +
      '你是站长。',
    options: [
      { label: '陪他去处理', apply: (c) => {
        const { s, E, rng } = c;
        E.stress(+16); E.health(-1.2);
        const pay = Math.min(s.p.cash, c.rng.int(3000, 15000));
        E.cash(-pay, '垫的医药费');
        E.rep(+7);
        return `你陪他去了医院、交警队、又去了对方家里。垫了 ${E.money(pay)}。\n\n站里的骑手都知道了这件事，这一年站里的离职率是全区最低的。`;
      } },
      { label: '按平台规则走', apply: (c) => {
        const { E, rng } = c;
        E.stress(+11);
        E.rep(-5); E.relGroup('同事', -8);
        return '你把平台的规则发给了他：接单期间的责任由骑手自负。\n\n' +
          '规则是对的。他退了群，第二天站里走了三个人。';
      } },
    ],
  });

  /* ══════════════════ 物流 · 仓储履约 ══════════════════ */

  J('warehouse', {
    id: 'kw_dacu', weight: 20, cooldown: 18,
    title: '大促',
    text: () => '双十一。仓库的灯连着七天没关过。\n\n' +
      '临时工不够，正式工全部两班倒。',
    options: [
      { label: '硬扛过去', apply: (c) => {
        const { s, E } = c;
        const add = Math.round(s.p.net * 0.3);
        E.cash(add, '大促补贴'); E.health(-3); E.stress(+11); E.perf(+7); E.rep(+3);
        return `七天走了二十一万步，多拿 ${E.money(add)}。第八天早上你在更衣室的凳子上睡着了。`;
      } },
      { label: '把流程改一改', apply: (c) => {
        const { E, rng } = c;
        E.stress(+9); E.health(-1.5);
        if (rng.chance(0.5)) { E.rep(+8); E.perf(+9); return '你把拣货路径重排了一遍，波次拆细。效率上去两成，第五天开始能按时下班了。这件事被区域拿去当了案例。'; }
        E.perf(-5);
        return '改到一半出了几单错拣，主管让你先按老办法干完这一波。改的那部分，年后没人再提。';
      } },
    ],
  });

  /* ══════════════════ 文化传媒 · 内容采编 ══════════════════ */

  J('media', {
    id: 'km_spike', weight: 19, cooldown: 26,
    title: '这个先放放',
    text: () => '跑了三周的稿子，采访了十一个人，写完了。\n\n' +
      '主编看完说：「这个先放放。」',
    options: [
      { label: '再争取一次', apply: (c) => {
        const { E, rng } = c;
        E.stress(+11);
        if (rng.chance(0.35)) { E.rep(+8); E.perf(+7); return '改了角度，删了两段，发了。反响不小。你知道被删的是哪两段。'; }
        E.rep(-3); E.perf(-4);
        return '主编说：「我知道你写得好。」这句话后面没有别的了。';
      } },
      { label: '收起来', apply: (c) => {
        const { E } = c;
        E.stress(+9); E.rep(+1);
        return '你把稿子存进了一个文件夹。那个文件夹里现在有九篇。\n\n' +
          '「放放」的意思你入职半年就懂了。';
      } },
    ],
  });

  J('media', {
    id: 'km_traffic', minRank: 3, weight: 15, cooldown: 32,
    title: '流量',
    text: () => '这个月部门的阅读量指标差得远。\n\n' +
      '有个选题很容易起量，但那是一件还没查实的事。',
    options: [
      { label: '不做', apply: (c) => {
        const { E, rng } = c;
        E.perf(-8); E.stress(+7);
        return rng.chance(0.5) ? (E.rep(+5), '你没做。月底考核倒数第二。半个月后那件事被证伪，做了的号在删稿。')
          : '你没做。月底考核倒数第二。那件事后来也没人提，做了的号也没删稿。';
      } },
      { label: '做，但留出口', apply: (c) => {
        const { E, rng } = c;
        E.perf(+9); E.stress(+10);
        if (rng.chance(0.6)) { E.rep(-2); return '你加了「据知情人士」「有待核实」。阅读量到了三十万，指标完成。\n\n这几个词是干什么用的，你比谁都清楚。'; }
        E.rep(-11); E.perf(-10);
        return '当事人发了律师函。单位撤稿、道歉，你写了检讨。「据知情人士」这五个字挡不住任何东西。';
      } },
    ],
  });

  /* ══════════════════ 文化传媒 · 视觉设计 ══════════════════ */

  J('design', {
    id: 'kn_free', weight: 20, cooldown: 22,
    title: '这个案子',
    text: () => '「预算不多，但这个案子做出来对你作品集特别好。」\n\n' +
      '这句话你今年听了第四次。',
    options: [
      { label: '接', apply: (c) => {
        const { E, rng } = c;
        E.stress(+9); E.health(-0.8);
        if (rng.chance(0.4)) { E.rep(+6); E.perf(+5); return '做出来确实好。这一版进了你的作品集，一年后有人拿着它来找你。'; }
        E.perf(+2); E.rep(-1);
        return '改了十一版，最后上线的是甲方内部做的那版。作品集里放不了。';
      } },
      { label: '报个正常价', apply: (c) => {
        const { E, rng } = c;
        E.stress(+5);
        return rng.chance(0.35) ? (E.cash(c.rng.int(3000, 12000), '外快'), E.rep(+3), '对方居然同意了。原来一直可以报这个价。')
          : (E.perf(-4), '对方说「那我们再看看」。后来找了个刚毕业的，价是你的三成。');
      } },
    ],
  });

  /* ══════════════════ 文化传媒 · 主播 ══════════════════ */

  J('streamer', {
    id: 'kb_rule', weight: 20, cooldown: 24,
    title: '规则改了',
    text: () => '平台调整了推荐逻辑。公告发在后台，写了六百字。\n\n' +
      '你今天的在线人数是上周的两成。',
    options: [
      { label: '硬播，等它回来', apply: (c) => {
        const { s, E, rng } = c;
        E.stress(+12); E.health(-1.5);
        if (rng.chance(0.35)) { E.perf(+6); E.rep(+3); return '播了两个月，量慢慢回来了一些。你不知道是规则变回去了，还是你做对了什么。'; }
        E.perf(-9);
        return '播了两个月，量没回来。合同上的时长要求还在，播不够扣钱。';
      } },
      { label: '改内容方向', apply: (c) => {
        const { E, rng } = c;
        E.stress(+10);
        if (rng.chance(0.4)) { E.perf(+9); E.rep(+5); E.cash(c.rng.int(1000, 8000), '打赏与坑位费'); return '换了个方向，起来了。你现在做的东西，跟当初想做的不是一回事。'; }
        E.perf(-7); E.rep(-2);
        return '换了三个方向，老粉丝走了一半，新的没来。';
      } },
    ],
  });

  /* ══════════════════ 法律 · 律师 ══════════════════ */

  J('lawyer', {
    id: 'kl_source', minRank: 1, maxRank: 3, weight: 20, cooldown: 24,
    title: '案源',
    text: () => '所里开会，主任说了句「三年了，也该有自己的案子了」。\n\n' +
      '你手上确实一个都没有。',
    options: [
      { label: '出去跑', apply: (c) => {
        const { E, rng } = c;
        E.cash(-c.rng.int(1500, 6000), '饭局与会员费'); E.stress(+11); E.health(-1);
        if (rng.chance(0.45)) { E.cash(c.rng.int(8000, 45000), '第一笔自己的代理费'); E.rep(+7); E.perf(+8);
          return '一个商会的饭局，认识了一位做建材的老板。半年后他有个合同纠纷，找了你。\n\n这是你第一个自己的客户。'; }
        E.perf(-4);
        return '跑了半年，加了两百个微信，接到零个案子。饭局上的人都说「以后有事一定找你」。';
      } },
      { label: '继续做合伙人分下来的活', apply: (c) => {
        const { E, rng } = c;
        E.perf(+5); E.stress(+8); E.health(-0.8);
        return rng.chance(0.5) ? '你把手上的活做到了极致。合伙人越来越离不开你 —— 这既是好事，也是你一直没有自己客户的原因。'
          : (E.rep(-3), '又是一年。所里比你晚来的两个已经开始自己带案子了。');
      } },
    ],
  });

  J('lawyer', {
    id: 'kl_client', minRank: 2, weight: 15, cooldown: 34,
    title: '当事人',
    text: () => '当事人要求你在庭上说一件你知道不是事实的事。\n\n' +
      '「我付钱了。」他是这么说的。',
    options: [
      { label: '拒绝，只做能做的', apply: (c) => {
        const { E, rng } = c;
        E.stress(+10);
        if (rng.chance(0.5)) { E.rep(+7); return '你跟他讲了执业规则，也讲了如果被戳穿会是什么后果。他最后听进去了。案子按事实打，结果没那么好，但结了。'; }
        E.perf(-9); E.cash(-c.rng.int(3000, 15000), '退回的代理费');
        return '他换了律师，还要求退费。所里为了息事宁人退了一部分，从你的提成里扣。';
      } },
      { label: '照他说的做', apply: (c) => {
        const { E, rng } = c;
        E.perf(+8); E.stress(+13);
        if (rng.chance(0.7)) { E.cash(c.rng.int(5000, 25000), '代理费'); E.rep(-3); return '赢了。他很满意，介绍了两个朋友过来。\n\n这两个朋友的案子是什么性质，你大概能猜到。'; }
        E.rep(-16); E.perf(-20);
        return '对方当庭出示了相反的证据。法官看了你一眼。\n\n事后律协收到了投诉，你的执业档案上多了一条。';
      } },
    ],
  });
})(window);
