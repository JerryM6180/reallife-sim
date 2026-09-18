/* 内容层：城市、家庭、职业、疾病、行动、事件、传闻。
   全部是数据，引擎不认识任何具体内容。将来加内容只动这个文件。 */
(function (global) {
  'use strict';

  /* ─────────────────────────── 城市 ─────────────────────────── */
  // rent = 合租主卧月租；price = 房价元/㎡；salaryMul = 同岗位薪资系数；cost = 生活成本系数
  const CITIES = {
    beijing: { id: 'beijing', name: '北京', tier: 1, rent: 3500, price: 58000, salaryMul: 1.35, cost: 1.20, hukou: 5 },
    shanghai: { id: 'shanghai', name: '上海', tier: 1, rent: 3400, price: 56000, salaryMul: 1.33, cost: 1.20, hukou: 5 },
    shenzhen: { id: 'shenzhen', name: '深圳', tier: 1, rent: 3000, price: 52000, salaryMul: 1.28, cost: 1.15, hukou: 3 },
    guangzhou: { id: 'guangzhou', name: '广州', tier: 1, rent: 2400, price: 32000, salaryMul: 1.15, cost: 1.05, hukou: 3 },
    hangzhou: { id: 'hangzhou', name: '杭州', tier: 2, rent: 2600, price: 33000, salaryMul: 1.15, cost: 1.05, hukou: 2 },
    chengdu: { id: 'chengdu', name: '成都', tier: 2, rent: 1800, price: 18000, salaryMul: 0.95, cost: 0.92, hukou: 2 },
    wuhan: { id: 'wuhan', name: '武汉', tier: 2, rent: 1700, price: 17000, salaryMul: 0.92, cost: 0.90, hukou: 2 },
    provincial: { id: 'provincial', name: '省会', tier: 3, rent: 1400, price: 12000, salaryMul: 0.82, cost: 0.82, hukou: 1 },
    prefecture: { id: 'prefecture', name: '地级市', tier: 4, rent: 1000, price: 8000, salaryMul: 0.70, cost: 0.72, hukou: 1 },
    county: { id: 'county', name: '县城', tier: 5, rent: 700, price: 6200, salaryMul: 0.60, cost: 0.62, hukou: 0 },
  };
  const CITY_LIST = Object.keys(CITIES).map((k) => CITIES[k]);

  /* ─────────────────────────── 家庭背景 ─────────────────────────── */
  /* 阶层不是数值（第103章）。它只影响四件事：
     起点资源 / 容错空间(support) / 信息半径(infoRadius) / 社会期望(expect) */
  const BACKGROUNDS = [
    {
      id: 'system', name: '体制内家庭', desc: '父母在机关或事业单位。房子是单位早年分的，日子不紧不慢，但对你的路径有明确设想。',
      hs: 'prov', home: 'provincial', hukou: '城镇', allowance: 800, familyCash: 280000,
      parent: { job: '公务员', income: 7000, health: 82 }, mom: { job: '事业单位职员', ratio: 0.72 }, support: 4, infoRadius: 3, expect: 'kaobian',
      note: '父母能在本地说上话，但也只在本地。',
    },
    {
      id: 'worker', name: '城市工薪家庭', desc: '父母都在厂里或单位上班，有套小两居还剩几年贷款。最普通的那种普通。',
      hs: 'normal', home: 'prefecture', hukou: '城镇', allowance: 500, familyCash: 120000,
      parent: { job: '工人', income: 5200, health: 78 }, mom: { job: '普通职员', ratio: 0.85 }, support: 2, infoRadius: 2, expect: 'stable',
    },
    {
      id: 'boss', name: '企业主家庭', desc: '家里开厂或做贸易。现金看着多，但都在生意里滚，而生意有周期。',
      hs: 'city', home: 'prefecture', hukou: '城镇', allowance: 2000, familyCash: 900000,
      parent: { job: '小老板', income: 22000, health: 70 }, mom: { job: '个体户', ratio: 0.55 }, support: 5, infoRadius: 4, expect: 'money',
      note: '父母的钱不等于你的钱，而且它可能一夜之间不见。',
    },
    {
      id: 'shop', name: '县城小生意家庭', desc: '父母守着一间店，起早贪黑，一年到头没休过。',
      hs: 'county', home: 'county', hukou: '城镇', allowance: 400, familyCash: 160000,
      parent: { job: '个体户', income: 8000, health: 68 }, mom: { job: '个体户', ratio: 0.8 }, support: 2, infoRadius: 2, expect: 'stable',
    },
    {
      id: 'farm', name: '农村务农家庭', desc: '家在村里。父母种地，也打点零工。他们不太懂你在外面做什么。',
      hs: 'town', home: 'county', hukou: '农村', allowance: 250, familyCash: 35000,
      parent: { job: '务农', income: 2600, health: 64 }, mom: { job: '务农', ratio: 0.7 }, support: 1, infoRadius: 1, expect: 'stable',
      note: '容错空间几乎为零：一场大病就能压垮全家。',
    },
    {
      id: 'migrant', name: '进城务工家庭', desc: '父母在外地打工，你在老家跟着爷爷奶奶长大。',
      hs: 'town', home: 'county', hukou: '农村', allowance: 300, familyCash: 48000,
      parent: { job: '外来务工', income: 6000, health: 66 }, mom: { job: '外来务工', ratio: 0.72 }, support: 1, infoRadius: 1, expect: 'money',
      note: '你和父母一年见两次面。这会一直影响你们的关系。',
    },
    {
      id: 'demolition', name: '拆迁家庭', desc: '几年前老房子拆了，账上突然多了一笔钱。父母还没想好怎么用。',
      hs: 'normal', home: 'prefecture', hukou: '城镇', allowance: 1200, familyCash: 1600000,
      parent: { job: '无固定职业', income: 3000, health: 72 }, mom: { job: '无固定职业', ratio: 0.7 }, support: 4, infoRadius: 1, expect: 'none',
      note: '一次性财富，没有持续造血能力。这笔钱会怎么花完，是这局的看点。',
    },
    {
      id: 'single', name: '单亲家庭', desc: '父母很早就分开了，你跟着其中一个。另一个偶尔出现。',
      hs: 'normal', home: 'prefecture', hukou: '城镇', allowance: 400, familyCash: 70000,
      parent: { job: '销售', income: 6500, health: 72 }, mom: { job: null, ratio: 0 }, support: 1, infoRadius: 2, expect: 'stable',
    },
    {
      id: 'intellectual', name: '知识分子家庭', desc: '父母是老师或医生。家里书多，规矩也多。',
      hs: 'prov', home: 'provincial', hukou: '城镇', allowance: 700, familyCash: 260000,
      parent: { job: '教师', income: 8200, health: 80 }, mom: { job: '护士', ratio: 0.8 }, support: 3, infoRadius: 3, expect: 'study',
    },
  ];

  /* ─────────────────────────── 天赋 ─────────────────────────── */
  /* 天赋不显示数值，只在结果上体现（第133章：不给默认光环） */
  const TALENTS = [
    { id: 'none', name: '无', desc: '什么都不特别突出。绝大多数人是这样。' },
    { id: 'study', name: '学习天赋', desc: '同样的时间，你比别人多学进去一点。' },
    { id: 'sport', name: '运动天赋', desc: '身体底子好，扛得住。' },
    { id: 'art', name: '艺术天赋', desc: '有点审美和手感。不一定能变现。' },
    { id: 'social', name: '社交天赋', desc: '别人愿意跟你说话，也愿意跟你说实话。' },
    { id: 'biz', name: '商业天赋', desc: '你对钱的流向有直觉。' },
  ];

  /* ─────────────────────────── 疾病 ─────────────────────────── */
  const DISEASES = [
    { id: 'cold', name: '感冒', kind: 'body', hp: -0.5, stress: 1, selfHeal: 2, cost: 200, work: 0.9, minAge: 0, sev: 1 },
    { id: 'gastritis', name: '胃病', kind: 'body', hp: -0.8, stress: 2, chronic: true, cost: 900, work: 0.95, minAge: 18, sev: 2 },
    { id: 'cervical', name: '颈椎病', kind: 'body', hp: -0.6, stress: 2, chronic: true, cost: 700, work: 0.95, minAge: 20, sev: 2 },
    { id: 'insomnia', name: '失眠', kind: 'mind', hp: -0.4, stress: 2.5, chronic: true, cost: 500, work: 0.9, minAge: 16, sev: 2 },
    { id: 'anxiety', name: '焦虑症', kind: 'mind', hp: -0.6, stress: 4, chronic: true, cost: 1500, work: 0.85, minAge: 16, sev: 3 },
    { id: 'depression', name: '抑郁症', kind: 'mind', hp: -1.1, stress: 5, chronic: true, cost: 2600, work: 0.6, minAge: 16, sev: 4 },
    { id: 'burnout', name: '职业耗竭', kind: 'mind', hp: -0.7, stress: 3.5, chronic: true, cost: 0, work: 0.7, minAge: 22, sev: 3 },
    { id: 'hyperten', name: '高血压', kind: 'body', hp: -1.1, stress: 2, chronic: true, incurable: true, cost: 400, work: 0.95, minAge: 30, sev: 3 },
    { id: 'diabetes', name: '糖尿病', kind: 'body', hp: -1.3, stress: 3, chronic: true, incurable: true, cost: 800, work: 0.9, minAge: 35, sev: 4 },
    { id: 'heart', name: '心梗', kind: 'body', hp: -6, stress: 10, acute: true, cost: 90000, work: 0.4, minAge: 28, sev: 5 },
    { id: 'cancer', name: '恶性肿瘤', kind: 'body', hp: -3.5, stress: 14, chronic: true, cost: 300000, work: 0.3, minAge: 30, sev: 5 },
  ];
  const DISEASE_MAP = {};
  DISEASES.forEach((d) => { DISEASE_MAP[d.id] = d; });

  /* ─────────────────────────── 行业与职位 ─────────────────────────── */
  const INDUSTRIES = ['互联网', '制造', '金融', '教育', '医疗', '服务', '体制内', '建筑', '物流', '文化传媒'];

  /* ─────────────────────────── 职业线 ─────────────────────────── */
  /* 一条线 = 入口门槛 + 若干职级。玩家进的是线，站在第几格由升职决定。
     stopAt 是多数人停下的地方，对玩家隐藏，只以传闻出现。 */
  const TRACKS = [
    { id: "bank", name: "银行", ind: "金融", tier: [1, 5], stopAt: 3,
      entry: { edu: ["985", "211", "一本", "二本", "专科"],
               majors: ["finance", "acct", "marketing", "admin_mgmt", "english"], level: 1 },
      ranks: [
        { name: "柜员", gross: 5000, intensity: 3, prestige: 2, years: 3, level: 0,
          blurb: "隔着玻璃，一天数一百多次钱。系统里每笔都留痕，错一笔要写情况说明。",
          trap: "劳务派遣，和柜台里面那些人不是一家公司。三年不动窗口，人就废在这儿了。" },
        { name: "高级柜员", gross: 6000, intensity: 3, prestige: 2, years: 3, level: 0,
          blurb: "会办的业务多了，排队的人还是那么多。新来的柜员开始问我流程。",
          trap: "涨的这一千块是熬出来的，不是学出来的。再往上要看有没有人退。" },
        { name: "大堂经理", gross: 6800, intensity: 3, prestige: 2, years: 3, level: 0,
          blurb: "站在门口，一天说两百遍「您好，请问办什么业务」。也拦客诉。",
          trap: "从坐着变成站着。这一格是个岔路口：过不去就一直站在门口。" },
        { name: "客户经理", gross: 8000, intensity: 4, prestige: 3, years: 4, level: 2,
          blurb: "开始背指标了。存款、保险、基金，每季度一张表，红的绿的都在群里。",
          trap: "指标是逐年涨的，客户是逐年老的。完不成扣绩效，完成了明年基数更高。" },
        { name: "高级客户经理", gross: 11000, intensity: 4, prestige: 3, years: 4, level: 3,
          blurb: "手上有几个大客户，他们认的是我这个人，不是这家行。",
          trap: "客户在你手上，也在别人眼里。你这几年攒的东西，一纸调令就能拆散。" },
        { name: "网点副行长", gross: 14000, intensity: 3, prestige: 4, years: 5, level: 4,
          blurb: "不用自己跑客户了，改成看别人跑。周一开会，周五还开会。",
          trap: "开始为别人的指标负责。下面的人完不成，写检查的是你。" },
        { name: "支行行长", gross: 18000, intensity: 3, prestige: 5, years: 6, level: 5,
          blurb: "一个网点几十号人，存款规模、不良率、合规，都算在我名下。",
          trap: "出了合规问题，第一个签字的是你。这个位置上的人，很少是自己走的。" },
        { name: "分行部门总", gross: 26000, intensity: 3, prestige: 5, years: 0, level: 6,
          blurb: "楼层高了，见客户少了，见领导多了。",
          trap: "再往上就不是靠业绩了。多数人在这一格坐到退休，或者被换掉。" },
      ] },
  ];
  const TRACK_MAP = {};
  TRACKS.forEach((t) => { TRACK_MAP[t.id] = t; });

  /* ─────────────────────────── 岗位库 ─────────────────────────── */
  /* 110 条。门槛只有：学历 / 专业 / 专业等级 / 行业年限 / 启动资金 / 户籍 / 是否要考进去。
     hidden+discover 决定它一开始在不在你的世界里，tier 限定它存在于哪些城市。
     gross 是杭州基准税前，引擎再乘城市系数。 */
  const JOBS = [
    { id: "algo", name: "互联网大厂 · 算法工程师（推荐／搜索）", ind: "互联网",
      gross: 29000, intensity: 4, prestige: 5, skill: 56, tier: [1, 2],
      edu: ["985", "211"], majors: ["cs", "math_applied", "ee_info"], level: 8, capital: 0, minYears: 4,
      shebao: true,
      blurb: "指标涨 0.3% 能发全员邮件，跌 0.3% 要写复盘。我每天在调一个我也解释不清为什么会变好的东西。",
      trap: "你的价值绑在一条业务线上，线砍了方向就没了，而这个方向三年一变，上一波的经验不一定接得住下一波。到那时候你没有时间同时干活和追新的，招进来的应届生有。" },
    { id: "gray_offshore", name: "境外「支付／棋牌」项目 · 技术岗", ind: "互联网",
      gross: 28000, intensity: 4, prestige: 1, skill: 35, tier: [1, 2],
      edu: ["一本", "二本", "专科"], majors: [], level: 5, capital: 0, minYears: 1,
      hazard: true, noSocial: true, hidden: true,
      discover: "npc",
      blurb: "钱是两三倍，打过来是没有备注的。护照放在公司保险柜，说是怕丢。",
      trap: "没有合同，没有社保，断缴影响你落户、买房、孩子上学。这份工作在法律上算什么不由你决定，回国之后可能要向人解释这几年在哪、在做什么。想走的时候能不能走，写不进合同里；已经走成的人，你一个也联系不上。" },
    { id: "aesth_injector", name: "医美机构 · 注射与光电医师", ind: "医疗",
      gross: 26000, intensity: 3, prestige: 2, skill: 63, tier: [1, 2],
      edu: ["985", "211", "一本", "二本"], majors: ["clinical_med"], level: 9, capital: 0, minYears: 9,
      commission: true, hidden: true,
      discover: "npc",
      blurb: "\"我在公立缝了六年伤口，现在给没病的人打玻尿酸，收入翻了三倍。\"",
      trap: "注射归美容外科项目，要从事相关临床满六年；光电归美容皮肤科，满三年——主诊备案上写了哪几项，决定你能碰哪台机器。多数机构走多点执业和劳务，没有社保没有职称，临床履历从跳出来那天起停止累积，想回公立基本没人要。出一次栓塞或者感染，赔钱的是机构，吊证的是你；机构半年换一次名字，跑路时客户和押金一起消失。" },
    { id: "chip_digital", name: "芯片设计公司 · 数字 IC 设计", ind: "制造",
      gross: 24000, intensity: 3, prestige: 4, skill: 49, tier: [1, 2],
      edu: ["985", "211"], majors: ["ee_info"], level: 7, capital: 0, minYears: 4,
      shebao: true,
      blurb: "一次流片一千多万，写错一行你得等半年才知道。我们组说话都慢，因为不敢说错。",
      trap: "项目周期以年计，方向做错的那两年，简历上写不出任何东西。行业周期一到，整个赛道冻结招聘两三年，而你的技能只在这个赛道有用——隔壁互联网不认，你也回不去。" },
    { id: "edu_private_tutor", name: "私人家教 · 高净值家庭", ind: "教育",
      gross: 22000, intensity: 4, prestige: 2, skill: 35, tier: [1, 2],
      edu: ["985", "211"], majors: ["math_applied", "english", "chinese_lit", "cs"], level: 5, capital: 0, minYears: 2,
      noSocial: true, hidden: true,
      discover: "npc",
      blurb: "包吃包住，住在雇主家的次卧。我的生活是他们家的一个房间。",
      trap: "没有合同、没有社保、没有下班，雇主家的规矩就是你的规矩。这种活只在几个一线城市的圈子里口口相传，回了老家就不存在。孩子出国那天你失业，而这几年在任何一所学校的简历上都写不进去。" },
    { id: "fin_fund_research", name: "公募基金 · 行业研究员", ind: "金融",
      gross: 22000, intensity: 4, prestige: 5, skill: 42, tier: [1, 2],
      edu: ["985"], majors: ["finance", "math_applied", "acct", "cs"], level: 6, capital: 0, minYears: 0,
      shebao: true,
      blurb: "\"我写了三十页深度报告，基金经理看了两分钟。他说他看的是最后一页。\"",
      trap: "三年内做不出被验证的推荐，就转去做销售支持或产品，很少有第二次机会。推荐涨了是基金经理的判断，跌了是你的研究不扎实。限薪之后天花板已经降下来了。一年两百天在调研路上，三十岁体检，同批进来的人报告都差不多。" },
    { id: "bigtech_dev", name: "互联网大厂 · 后端研发", ind: "互联网",
      gross: 21000, intensity: 4, prestige: 5, skill: 42, tier: [1, 2],
      edu: ["985", "211"], majors: ["cs", "ee_info", "math_applied"], level: 6, capital: 0, minYears: 2,
      shebao: true,
      blurb: "钱是真的多。周三晚上十一点在工位吃盒饭，抬头看了一眼，这层楼还亮着一半。",
      trap: "绩效每半年排一次序，末位有明确的处理办法。股票四年归属，而你不确定这条业务线能撑四年。三十五岁之后你会发现，同一个岗位在招比你便宜五千的人，而他能干到十一点，你不能。" },
    { id: "fin_ib", name: "券商投行部 · 承做", ind: "金融",
      gross: 21000, intensity: 4, prestige: 4, skill: 49, tier: [1, 2],
      edu: ["985", "211"], majors: ["finance", "acct", "law", "math_applied"], level: 7, capital: 0, minYears: 0,
      shebao: true, commission: true,
      blurb: "\"招股书的每个字我都改过八遍。项目撤了以后，那两年就当没有过。\"",
      trap: "收入跟发行节奏走，审核一收紧整个部门一年没有奖金。奖金四成以上递延三年发，项目后来出问题，发过的还要扣回来。项目撤回或被否，两年的底稿和出差清零，履历上也写不了。签字责任是终身的。" },
    { id: "logi_planner", name: "电商平台 · 履约规划", ind: "物流",
      gross: 20000, intensity: 4, prestige: 4, skill: 49, tier: [1, 2],
      edu: ["985", "211", "一本"], majors: ["math_applied", "cs"], level: 7, capital: 0, minYears: 5,
      shebao: true,
      blurb: "我把\"预计送达\"往前挪了四分钟，系统跑出来说履约成本降了 0.7%。那四分钟是从哪儿挪出来的，报告里没写。",
      trap: "你调的参数落在骑手的接单密度和拣货员的行走路线上。除此之外它就是一份普通的大厂工作——同样的 996，同样的三十五岁，同样在组织架构调整时被合并掉，只不过被合并掉的时候，你已经很难再去做别的行业。" },
    { id: "edu_competition_coach", name: "省重点中学 · 学科竞赛教练", ind: "教育",
      gross: 19000, intensity: 4, prestige: 4, skill: 63, tier: [1, 2],
      edu: ["985", "211"], majors: ["math_applied", "cs", "bio"], level: 9, capital: 0, minYears: 5,
      shebao: true, commission: true, hidden: true,
      discover: "skill",
      blurb: "我的价值就是那几个孩子。今年没出省一，明年就没人提我了。",
      trap: "收入由校内绩效、集训营讲课费和外面的课时费拼起来，一届没成绩第二年直接少一块。金牌是学生和学校的，台上站的不是你。带竞赛这些年，常规教学的职称你一节课都没攒下。" },
    { id: "con_pm", name: "施工单位 · 项目经理", ind: "建筑",
      gross: 18000, intensity: 4, prestige: 3, skill: 63, tier: [1, 2],
      edu: ["985", "211", "一本", "二本", "专科"], majors: ["civil", "mech"], level: 9, capital: 0, minYears: 5,
      hazard: true, shebao: true, commission: true,
      blurb: "证挂在我名下。真出了事，第一个进去的是我，不是老板。",
      trap: "账面是月薪，大头压在项目结算奖里——上个项目的奖金还没兑现，下个项目已经开工了。一建考出来只是入场券，难的是单位肯把一个标段交给你。常年在外地，孩子从上小学到毕业你可能只开过两次家长会。年底农民工工资发不出来，堵门的人找的是你。安全事故一旦定性，一建吊销，年限归零，还可能有刑责。" },
    { id: "dentist_private", name: "民营口腔连锁 · 种植正畸医师", ind: "医疗",
      gross: 18000, intensity: 3, prestige: 3, skill: 49, tier: [1, 2],
      edu: ["211", "一本", "二本"], majors: ["clinical_med"], level: 7, capital: 0, minYears: 3,
      shebao: true, commission: true,
      blurb: "\"我的技术值多少钱不好说，我谈下一个全口种植拿多少提成是明码的。\"",
      trap: "底薪只占三成，其余挂在种植和正畸的成交量上，淡季自己慌；厂商的种植培训班自费三五万，行业默认你上过，可它不是国家承认的资质，种植技术备案在机构名下，不在你名下。院长会要求你把一颗牙的方案说成全口的方案，签字的是你的执照。诊所关门那天，客户名单是老板的。" },
    { id: "attending_surgeon", name: "三甲医院 · 普外科主治医师", ind: "医疗",
      gross: 17000, intensity: 4, prestige: 5, skill: 63, tier: [1, 5],
      edu: ["985", "211", "一本"], majors: ["clinical_med"], level: 9, capital: 0, minYears: 8,
      hazard: true, shebao: true,
      blurb: "\"一台手术站四个小时，下来先蹲会儿，腰是自己的，病人是医院的。\"",
      trap: "住院医满五年加中级考试，通常三十一二岁才拿到；论文省里早就不强制了，可科里排名额的时候还是数你有几篇。社会评价满格，阳光收入折成时薪不如互联网中层；一次医疗纠纷能把几年的积累和睡眠一起清空，副高的名额按年论资，熬到四十五岁才知道有没有你。" },
    { id: "ka_manager", name: "快消品牌 · 重点客户经理", ind: "服务",
      gross: 16000, intensity: 4, prestige: 3, skill: 42, tier: [1, 5],
      edu: ["985", "211", "一本", "二本"], majors: [], level: 6, capital: 0, minYears: 5,
      shebao: true,
      blurb: "谈的是几千万的年框，签完回酒店，点一份二十八块的外卖。",
      trap: "业绩由促销费用和渠道政策决定，这两样都在总部手里——好的年份是你能干，坏的年份是你不行。换一个总监就换一套打法，你前三年攒的客户关系归零重来。常年出差，一个月在家八天。这个市场只招 KA 经理，不招四十岁的 KA 经理，而总监的位置一个大区只有一个。" },
    { id: "labor_sub", name: "工地劳务班组 · 小包工头", ind: "建筑",
      gross: 16000, intensity: 4, prestige: 1, skill: 28, tier: [1, 5],
      edu: ["二本", "专科", "高中"], majors: [], level: 4, capital: 150000, minYears: 3,
      hazard: true, commission: true, hidden: true,
      discover: "npc",
      blurb: "年底我算的不是能挣多少，是工资能不能发出去。发不出来，人会带着铺盖睡在我家门口。",
      trap: "一万六是把拖欠和坏账扣掉之后剩下的数，账面产值比这高一倍。开工前自己垫三个月工人工资，总包拖三个月，甲方拖半年，最后一笔尾款可能拖三年，也可能永远拖没了。还得挂靠一家有劳务资质的公司，管理费从产值里扣。工人出了工伤，你先掏钱。行情一转，欠的是你借来的钱，追债的人找的是你，不是那家挂靠的公司。" },
    { id: "game_numeric", name: "游戏公司 · 数值策划", ind: "互联网",
      gross: 15000, intensity: 4, prestige: 2, skill: 42, tier: [1, 5],
      edu: ["211", "一本", "二本", "专科"], majors: [], level: 6, capital: 0, minYears: 3,
      shebao: true, hidden: true,
      discover: "ask",
      blurb: "我设计的是让人愿意再抽一次的那个数。我妈问我做什么工作，我说做游戏的，她说那挺好玩吧。",
      trap: "项目黄了整组一起走，而游戏项目黄的概率比你想的高——两年做完一个没上线的东西是常事。经验只在游戏圈值钱，出了这个圈没人看得懂你的简历。还有一件你得自己消化的事：你每天在优化的，是让人多花一点钱的那个概率。" },
    { id: "arch_lead", name: "建筑设计院 · 主创建筑师", ind: "建筑",
      gross: 14000, intensity: 4, prestige: 4, skill: 56, tier: [1, 3],
      edu: ["985", "211", "一本"], majors: ["architecture"], level: 8, capital: 0, minYears: 5,
      shebao: true,
      blurb: "这栋楼上会那天，我在会议室外面站了两个小时。批下来以后，署名第一个是院总。",
      trap: "你签的字是要负一辈子责任的。项目出问题，二十年后还能找到你。而且这个位置上面只有两格，坐着的人不会走。" },
    { id: "pm", name: "互联网公司 · 产品经理", ind: "互联网",
      gross: 14000, intensity: 4, prestige: 3, skill: 35, tier: [1, 5],
      edu: ["985", "211", "一本", "二本"], majors: [], level: 5, capital: 0, minYears: 2,
      shebao: true,
      blurb: "没有一个人向我汇报，但所有人的延期都算我头上。上次找工作猎头问我核心竞争力，我说沟通，他就不说话了。",
      trap: "你没有任何硬技能可以带走。裁员名单上产品经理永远排在开发前面，因为砍掉之后活还是有人干。转行的时候你会发现，你会的东西别的行业也有人会，而且更便宜。" },
    { id: "edu_uni_faculty", name: "高校 · 专任教师（预聘制）", ind: "教育",
      gross: 13500, intensity: 4, prestige: 5, skill: 63, tier: [1, 5],
      edu: ["985", "211"], majors: [], level: 9, capital: 0, minYears: 7,
      shebao: true, commission: true,
      blurb: "我不是老师，我是一个要在六年内发够文章的人。上课是那个占用我科研时间的东西。",
      trap: "首聘期 3+3 年，评不上副教授就得走，那年你三十八岁，履历上只有论文。基本工资只占工资条的一小半，剩下靠科研奖励和人才补贴凑，两样都不写进合同。课教得好在考核表上几乎不加分。进人年龄卡三十五周岁，博士读完你只剩一次机会。" },
    { id: "dev_mid", name: "互联网公司 · 后端研发（中厂）", ind: "互联网",
      gross: 13000, intensity: 3, prestige: 4, skill: 35, tier: [1, 5],
      edu: ["985", "211", "一本"], majors: ["cs", "ee_info", "math_applied"], level: 5, capital: 0, minYears: 2,
      shebao: true,
      blurb: "招我进来的时候说要做技术升级，来了半年在给三个老系统对账。工资比大厂少一截，周末基本是我自己的。",
      trap: "中厂的位置是两头挤出来的：上面是降薪过来的大厂的人，下面是比你便宜的应届。这里没有职级也没有背书，简历上只有一个出了本地没人听说过的公司名。业务不赚钱的那一年，先砍的是你们组做的那个新方向，而它正好是你唯一能写进简历的东西。" },
    { id: "device_rep", name: "骨科耗材 · 手术跟台", ind: "医疗",
      gross: 13000, intensity: 4, prestige: 1, skill: 7, tier: [1, 5],
      edu: ["一本", "二本", "专科", "高中"], majors: [], level: 1, capital: 50000, minYears: 2,
      hazard: true, commission: true, hidden: true,
      discover: "tenure",
      blurb: "\"凌晨三点开车送一颗螺钉过去，穿上手术衣站在角落，谁都可以吼我。\"",
      trap: "手机不能静音，一年有半年在夜里出门；台上吃 C 臂的射线，可你不是医院的人，没有放射津贴也没有体检。车和垫的货款是你自己的，跟经销商签的是劳务，社保得按灵活就业自己交。集采一轮下来提成砍半，代理商换产品线，攒了三年的经验当天清零。" },
    { id: "fin_bad_asset", name: "资产处置公司 · 项目经办", ind: "金融",
      gross: 13000, intensity: 3, prestige: 2, skill: 42, tier: [1, 5],
      edu: ["985", "211", "一本", "二本"], majors: ["law", "finance", "acct"], level: 6, capital: 0, minYears: 3,
      hazard: true, shebao: true, hidden: true,
      discover: "npc",
      blurb: "\"我们做的是别人做坏了的生意。去看厂房要带两个人，一个人不安全。\"",
      trap: "回款周期两三年，提成也要两三年后到账，中间公司换了老板未必认。对手方是走投无路的人：查封的厂房里有人住，清场那天你站最前面。跑异地法院，一年有小半年在路上。做久了看什么都先算法拍打几折。" },
    { id: "fleet_owner", name: "网约车租赁 · 车队主", ind: "物流",
      gross: 13000, intensity: 3, prestige: 1, skill: 21, tier: [1, 5],
      edu: ["高中", "专科", "二本"], majors: [], level: 3, capital: 300000, minYears: 3,
      hidden: true,
      discover: "tenure",
      blurb: "我从司机身上挣钱。以前我也是司机，所以我知道这钱好挣在哪儿。",
      trap: "三十万押进八九台车，走融资租赁，一台首付三四万，剩下的按月还。你赚的是租金差和保险返点，这一层是从一群比你更没得选的人身上抽走的。每台车要办网约车运输证，司机自己得有网约车驾驶员证——招不到有证的司机，车就趴在停车场，租金收不上来而贷款照还。平台补贴一调，司机跑不动，退车的排到下个月。司机跑单出了事，车主是你。" },
    { id: "edu_private_school", name: "民办寄宿学校 · 教师", ind: "教育",
      gross: 12000, intensity: 4, prestige: 3, skill: 42, tier: [1, 5],
      edu: ["985", "211", "一本"], majors: ["math_applied", "chinese_lit", "english", "primary_edu"], level: 6, capital: 0, minYears: 2,
      shebao: true,
      blurb: "六点十分到校，学生六点半起床。一周里真正属于我的，只有周日下午那半天。",
      trap: "工资是公立的一倍半，代价是没有编制、住在学校、一年一签，聘期考核直接挂升学成绩。义务教育阶段的民办招生被压下去之后，还在给高薪的基本是高中和国际化学校；招生不足就整校裁员，学校的生死不由你决定，但由你承担。" },
    { id: "struct_designer", name: "建筑设计院 · 结构设计师", ind: "建筑",
      gross: 12000, intensity: 4, prestige: 4, skill: 49, tier: [1, 5],
      edu: ["985", "211", "一本", "二本"], majors: ["civil"], level: 7, capital: 0, minYears: 4,
      shebao: true, commission: true,
      blurb: "一栋楼站得住是本分，站不住是命案。所以配筋我永远往多了算，哪怕甲方骂我保守。",
      trap: "院里的钱是产值提成，房地产一冷，提成一年比一年薄，去年下半年的产值到现在没结。通宵改图是常态，改的往往只是甲方一句话。院里能在图纸上盖章的就那几个人，一注平均要考五到八年，通过率个位数——考不出来，你就一直是替别人算的那个。" },
    { id: "ndt_rt", name: "特种设备 · 射线探伤工", ind: "制造",
      gross: 11800, intensity: 4, prestige: 2, skill: 35, tier: [1, 5],
      edu: ["二本", "专科", "高中"], majors: [], level: 5, capital: 0, minYears: 2,
      hazard: true, shebao: true, noSocial: true, hidden: true,
      discover: "tenure",
      blurb: "我们的活都在半夜干，因为白天设备不能停，人也不能留在现场。剂量片三个月一换，换下来的数字进档案，只增不减。",
      trap: "比同学历岗位高的那几千叫辐射津贴，那是明码标价买你身上的剂量。跟着大修项目跑，一年换五六个省，白天睡觉晚上清场，认识的人只剩队里那几个。体检一旦超标直接调离辐射岗，而你会的只有这一门手艺，转出去要从五千块重新开始。" },
    { id: "deco_trade", name: "家装 · 水电工（自己接活）", ind: "建筑",
      gross: 11500, intensity: 3, prestige: 1, skill: 28, tier: [1, 5],
      edu: ["高中", "专科"], majors: [], level: 4, capital: 40000, minYears: 2,
      hazard: true, commission: true,
      blurb: "现结，不打欠条，这是这行唯一的好处。但没人给我交社保，也没人管我六十岁以后靠什么。",
      trap: "四万块是工具加一辆二手面包车，拉不动材料就接不了远处的单。摔一次、电一次，医药费和停工全算你自己头上。旺季一个月做二十六天，年后两个月一个电话都没有。客源在装修公司和物业手里，他们从你的工钱里抽走的比你以为的多。" },
    { id: "dev_onsite", name: "外包公司 · 驻场开发（派驻大厂）", ind: "互联网",
      gross: 11500, intensity: 4, prestige: 2, skill: 28, tier: [1, 5],
      edu: ["一本", "二本", "专科"], majors: [], level: 4, capital: 0, minYears: 0,
      shebao: true,
      blurb: "我在那栋楼里写了三年代码，工牌是外包的，食堂刷不了，年会不发我。简历上不敢写甲方名字，写了 HR 要问，不写 HR 也要问。",
      trap: "现金比小公司高，但没有年终、没有股票、没有调薪机制，三年后还是这个数。甲方一句话你当天离场，中间没有缓冲。跳槽时没人认你在甲方大楼里的三年，只认合同上那家外包公司的名字。公司会催你考软考，因为投标要凑持证人数；证挂在公司，补贴给你一次性两千。" },
    { id: "fin_fp_analyst", name: "企业 · 财务分析（FP&A）", ind: "金融",
      gross: 11500, intensity: 3, prestige: 3, skill: 42, tier: [1, 5],
      edu: ["985", "211", "一本"], majors: ["acct", "finance", "math_applied"], level: 6, capital: 0, minYears: 3,
      shebao: true,
      blurb: "\"我做完模型，老板说这个数不对。我就把它改成对的数，然后管它叫预算。\"",
      trap: "你算得再准，最后还是老板定数，再让你把表倒推成那个数。业务部门觉得你只会说不，老板觉得你只会做表。裁员季你是第一批被问这个岗位创造什么价值的人。天花板卡在财务总监，而那个位置一般留给老板信得过的人。" },
    { id: "elec_commission", name: "自动化设备 · 电气调试工程师", ind: "制造",
      gross: 11200, intensity: 4, prestige: 2, skill: 35, tier: [1, 5],
      edu: ["211", "一本", "二本", "专科"], majors: ["elec_power", "ee_info", "mech"], level: 5, capital: 0, minYears: 2,
      hazard: true, shebao: true,
      blurb: "客户的设备一天不动，我一天走不了。行李箱常年放在后备箱，里面有换洗衣服和万用表。",
      trap: "出差补贴是拿三百六十天里的两百四十天换的。带电调试，触电和机械伤害是真实概率。报销要贴票，一次贴四十张，财务退回来三次，钱两个月后才到账。" },
    { id: "cost_engineer", name: "工程咨询 · 造价工程师", ind: "建筑",
      gross: 11000, intensity: 3, prestige: 3, skill: 56, tier: [1, 5],
      edu: ["211", "一本", "二本", "专科"], majors: ["civil", "acct"], level: 8, capital: 0, minYears: 4,
      shebao: true, commission: true,
      blurb: "算量的时候一个平方都不能差。到了结算，甲方一句「这部分不认」，你算的三个月就白算。",
      trap: "不用晒太阳，但提成绑在工程款上——甲方拖着不结算，你的钱也跟着拖，两年前的项目今年还在追。年底对量，甲方的人换了一个，前任认的口径新来的不认，重来一遍。证书注册在执业单位名下，审计一来翻的是你签字的那份清单。" },
    { id: "fin_rural_bank", name: "农商行 · 客户经理（县域）", ind: "金融",
      gross: 11000, intensity: 3, prestige: 4, skill: 14, tier: [4, 5],
      edu: ["一本", "二本"], majors: ["finance", "acct", "marketing"], level: 2, capital: 0, minYears: 0,
      shebao: true, commission: true, hukou: true, hidden: true,
      discover: "family",
      blurb: "\"过年回家，我姑父先问今年任务还差多少，再问我什么时候结婚。\"",
      trap: "要本地户籍，笔试面试之外还得有人替你说话。存款任务最后落到父母和亲戚头上；贷款出问题得自己去催，催的是同村人。在县城这是最体面的工作之一，但它把你钉在这里，出去以后这段经历不值钱。入职一年内要考出银行业初级。" },
    { id: "fin_tax_advisor", name: "税务师事务所 · 税务顾问", ind: "金融",
      gross: 11000, intensity: 3, prestige: 3, skill: 56, tier: [1, 5],
      edu: ["985", "211", "一本", "二本"], majors: ["acct", "finance", "law"], level: 8, capital: 0, minYears: 2,
      shebao: true,
      blurb: "\"客户问有没有别的办法，这句话后面能接的东西，一半我不能接。\"",
      trap: "政策一年一变，去年背熟的口径今年作废。客户来找你时通常已经出事了，指望你把发生过的事说成没发生。方案是你出的，字是老板签的，但你的名字在委托合同上。真正赚钱的活儿在灰色边缘，接不接每年都要重新回答一次。" },
    { id: "ghost_writer", name: "传记代笔 · 自由撰稿", ind: "文化传媒",
      gross: 11000, intensity: 3, prestige: 1, skill: 35, tier: [1, 5],
      edu: ["985", "211", "一本", "二本", "专科"], majors: ["chinese_lit", "journalism", "english"], level: 5, capital: 0, minYears: 3,
      commission: true, hidden: true,
      discover: "npc",
      blurb: "“这是我的故事，你只是帮我整理一下。”第一次见面他就这么说，然后我们聊了六十个小时。",
      trap: "单本八到三十万，先付三成，一年能稳定接到两本的人很少——空着的那几个月也算在这份收入里。合同写得清清楚楚：作者不是你，你也不能对外说是你写的。写得越好越没人知道你写过，四十岁时作品集依旧一片空白。传主随时可能改主意，改主意那天尾款也一起没了，而你手上那份协议不会帮你去仲裁。" },
    { id: "rope_access", name: "幕墙高空作业（蜘蛛人）", ind: "建筑",
      gross: 11000, intensity: 4, prestige: 1, skill: 14, tier: [1, 5],
      edu: ["高中"], majors: [], level: 2, capital: 6000, minYears: 0,
      hazard: true, commission: true,
      blurb: "上去之前先看两根绳的磨损，主绳一根，副绳一根。风到五级就不上，这不是我说了算。",
      trap: "日薪五百到九百，但一年干不满一百八十天——下雨、大风、甲方停工都不算钱。没有社保，这个工种的意外险要么不保要么保额压得很低，真出事多半是私了。体检不过就干不了：恐高、高血压、心脏问题一票否决。四十五岁以后没人敢用你，而你没有第二门手艺。" },
    { id: "fin_credit_risk", name: "银行 · 授信审批岗", ind: "金融",
      gross: 10800, intensity: 2, prestige: 4, skill: 49, tier: [1, 5],
      edu: ["985", "211", "一本", "二本"], majors: ["finance", "acct", "math_applied", "law"], level: 7, capital: 0, minYears: 4,
      shebao: true, noSocial: true,
      blurb: "\"我批的每一笔，退休以后出问题还是算我头上。所以我学会了怎么把'不'说得好听。\"",
      trap: "不加班，社保按最高基数交，代价是收入低于拉存款的客户经理，而且到顶。不良贷款终身追责，五年前签的字五年后来找你。整天对着材料不见客户，做三年没有能带走的资源，跳槽才发现自己只在这一家银行有用。" },
    { id: "hw_embedded", name: "电子厂 · 嵌入式软件工程师", ind: "制造",
      gross: 10800, intensity: 3, prestige: 3, skill: 35, tier: [1, 5],
      edu: ["985", "211", "一本", "二本"], majors: ["ee_info", "mech"], level: 5, capital: 0, minYears: 1,
      shebao: true,
      blurb: "调了两个月的板子，最后发现是电源纹波。互联网那帮人一年换三家，我们组的人一待八年——出去也没别的地方要。",
      trap: "涨薪按年，一年百分之五，十年之后你还是比不过互联网干三年的。厂区在开发区，班车单程一小时十分；产线出问题要驻厂，一年有两三个月不在家。你的经验只在硬件圈子里值钱，而这是制造业，跳去互联网那天，攒的行业年头从零开始算。" },
    { id: "gov_tobacco", name: "省烟草专卖局 · 综合岗", ind: "体制内",
      gross: 10500, intensity: 2, prestige: 4, skill: 42, tier: [1, 5],
      edu: ["985", "211"], majors: ["acct", "finance", "admin_mgmt", "chinese_lit", "law"], level: 6, capital: 0, minYears: 0,
      shebao: true, hukou: true, exam: true, hidden: true,
      discover: "media",
      blurb: "我不太知道该怎么跟你形容我每天在干什么。但我这辈子都不会辞职。",
      trap: "报录比常年三位数，多数岗位限本省户籍或生源，还挑专业——哪个岗位当年报的人少，公告上看不出来，得有人告诉你。你在手机上刷到的那个数字，比工资条上的高四成。进去之后你会拿到这个系统里最高的收入，同时失去离开的任何可能：墙外面没有一个岗位给得起这个数，而这里的活教不会你任何能带走的东西。清闲不是奖励，是一种缓慢的报废。" },
    { id: "nev_process", name: "动力电池厂 · 产线工艺工程师", ind: "制造",
      gross: 10400, intensity: 4, prestige: 3, skill: 35, tier: [1, 5],
      edu: ["985", "211", "一本", "二本", "专科"], majors: ["mech", "ee_info", "elec_power"], level: 5, capital: 0, minYears: 0,
      hazard: true, shebao: true, noSocial: true, commission: true,
      blurb: "扩产那年一个月招八百人，食堂排队排到门外。两年后整条线停掉，人跟着线一起停。",
      trap: "薪水里一大半是夜班津贴和产能奖金，产能一降就露出底薪。厂区在郊区园区，最近的地铁站十二公里，宿舍走到车间十分钟，方圆五公里没有别的生活——半年之后你会发现除了同事没有别人可以联系。行业三年一轮，你的简历会被写死在某一种电芯上。" },
    { id: "dev_sme", name: "中小软件公司 · 后端开发", ind: "互联网",
      gross: 10000, intensity: 3, prestige: 3, skill: 28, tier: [1, 5],
      edu: ["211", "一本", "二本", "专科"], majors: ["cs", "ee_info", "math_applied"], level: 4, capital: 0, minYears: 0,
      shebao: true,
      blurb: "三个人维护八个项目，没有文档，因为写文档那位两年前走了。工资比不上大厂，但我六点能走——有时候。",
      trap: "公司随时可能没钱，老板说的期权在 PPT 里。技术栈是五年前的，你在这待得越久，出去面试第一轮被问住的概率越大。工资涨幅每年谈一次，谈的是你敢不敢走。" },
    { id: "legal_counsel", name: "公司 · 法务", ind: "服务",
      gross: 10000, intensity: 2, prestige: 3, skill: 49, tier: [1, 5],
      edu: ["985", "211", "一本", "二本"], majors: ["law"], level: 7, capital: 0, minYears: 3,
      shebao: true,
      blurb: "“你就说能不能做吧。”能做。风险我都写在邮件里了，抄送了你领导。",
      trap: "你永远是成本部门。业务把字签完了才拿来让你“看看有没有风险”，扩张时最后加人，收缩时第一批优化。一个人的法务部，干十年还是一个人的法务部——这个岗位上面没有下一级。" },
    { id: "edu_key_high", name: "省重点高中 · 在编教师", ind: "教育",
      gross: 9800, intensity: 4, prestige: 5, skill: 42, tier: [1, 5],
      edu: ["985", "211"], majors: ["math_applied", "chinese_lit", "english", "bio"], level: 6, capital: 0, minYears: 0,
      shebao: true, exam: true,
      blurb: "高三一轮复习下来瘦十斤。我带出去的学生上的学校，比我自己当年的好。",
      trap: "公告写本科，实际进的都是硕士，一个岗位几十个人报，试讲那天走廊里坐满了人。进来之后是每次月考排名到人，晚自习、周末、寒暑假补课都写着「自愿」。嗓子和腰会在四十岁之前用完。" },
    { id: "mech_designer", name: "非标设备 · 机械设计工程师", ind: "制造",
      gross: 9800, intensity: 3, prestige: 3, skill: 21, tier: [1, 5],
      edu: ["211", "一本", "二本", "专科"], majors: ["mech"], level: 3, capital: 0, minYears: 0,
      shebao: true,
      blurb: "画图的时候老板站在背后看。改一版，已经下料的板子和订好的外协件就当废铁卖了。",
      trap: "制造业的涨薪只发生在跳槽那天，跳一次涨一千五。每年调薪季老板说行情不好，涨三百，这句话他连着说了三年。图纸出问题是你的，设备卖得好是销售的。" },
    { id: "truck_city", name: "城配货车司机", ind: "物流",
      gross: 9600, intensity: 4, prestige: 1, skill: 7, tier: [1, 5],
      edu: ["高中", "专科"], majors: [], level: 1, capital: 60000, minYears: 0,
      hazard: true, noSocial: true,
      blurb: "车是我的，油是我的，罚单也是我的。货不是我的。",
      trap: "四点五吨以下蓝牌轻卡免办道路运输证，C1 就能上路——所以谁都能进来，运价也就压到了底。名义上你是老板：油价、罚单、限行时段、卸货排队三小时，全部由你吸收，运价由平台和货主定。要三年以上驾龄、没有重大事故记录；车多为自购或挂靠，挂靠每月交管理费。你看到的这个数是扣掉油钱、维修、保险之后、还车贷之前的，车停一天就是净亏一天。" },
    { id: "arch_designer", name: "建筑设计院 · 建筑师", ind: "建筑",
      gross: 9500, intensity: 4, prestige: 3, skill: 35, tier: [1, 4],
      edu: ["985", "211", "一本", "二本"], majors: ["architecture"], level: 5, capital: 0, minYears: 2,
      shebao: true,
      blurb: "方案改了十七版，最后甲方选了第二版。我把第二版重新画了一遍，因为原图找不到了。",
      trap: "设计费一年比一年低，人却没少几个。你画的图，署名栏里没有你。" },
    { id: "fin_loan_broker", name: "助贷 · 企业融资顾问", ind: "金融",
      gross: 9500, intensity: 4, prestige: 1, skill: 0, tier: [1, 5],
      edu: ["高中", "专科", "二本", "一本"], majors: [], level: 0, capital: 15000, minYears: 0,
      commission: true, hidden: true,
      discover: "ask",
      blurb: "\"银行不会告诉客户还有第二个方案。我告诉他，收三个点。\"",
      trap: "挂靠中介公司，纯提成，获客要自己垫钱买线索和请客。赚的是信息差和材料包装费，包装过了头就是骗取贷款罪，而银行的信贷员不担这个责。行业一收紧整月零单，好的时候一个月顶别人半年。没有社保没有合同，通讯录里最后全是急着用钱的人。" },
    { id: "notary", name: "公证处 · 公证员", ind: "体制内",
      gross: 9400, intensity: 1, prestige: 4, skill: 49, tier: [1, 5],
      edu: ["985", "211", "一本", "二本"], majors: ["law"], level: 7, capital: 0, minYears: 0,
      shebao: true, hukou: true, exam: true, hidden: true,
      discover: "family",
      blurb: "“别人以为我们就是盖个章。章盖错了，责任是我的，不是买房那个人的。”",
      trap: "一次招个位数，多数岗位写着限本地户籍，考不考得上跟你法考多少分关系不大。进去了就基本不动了：一个县城公证处三五个人，二十年没换过面孔，升迁按年头排。你出具的每一份公证书终身追责，退休了也算在你头上。工资今天看着不低，十年后还是这个数——所里没有第二个台阶。" },
    { id: "yuesao", name: "月嫂 · 住家上户", ind: "服务",
      gross: 9300, intensity: 4, prestige: 2, skill: 14, tier: [1, 5],
      edu: ["高中", "专科"], majors: [], level: 2, capital: 4000, minYears: 0,
      noSocial: true,
      blurb: "上户二十六天，夜里起三次。第二十七天回家，我妈问我什么时候能歇歇，我说下一单还没定。",
      trap: "中介广告上写的价是雇主付的价，不是你拿到的价，家政公司抽走一到两成半。等级和单价由公司评，评的依据是上一家雇主怎么说。一单二十六天住在婴儿房的折叠床上，全天待命；下户就断收入，下一单什么时候接上没人会提前告诉你——你看到的这个数已经把断单的月份摊进去了。没有社保，没有工龄。多数雇主指定已育女性、四十五岁以下，四十五岁之后单价开始往下掉。" },
    { id: "drama_writer", name: "微短剧 · 编剧（写手工作室）", ind: "文化传媒",
      gross: 9000, intensity: 4, prestige: 1, skill: 21, tier: [1, 5],
      edu: ["211", "一本", "二本", "专科"], majors: [], level: 3, capital: 0, minYears: 0,
      commission: true, hidden: true,
      discover: "media",
      blurb: "“这集结尾得让观众骂出声。”制片今年二十三，他说得对。",
      trap: "一集三百到八百，写顺了一天两三集——但十集里有三集会被打回来重写，重写不另算钱，被毙了白写。不署名、不分成、不签劳动合同。招募视频里那个“月入三万”确实有人拿到过，那个人不是派单的，是收单的。平台改一次推荐逻辑，整条赛道停摆，工作室的群当天就解散。" },
    { id: "resident_3a", name: "三甲医院 · 住院医师", ind: "医疗",
      gross: 9000, intensity: 4, prestige: 4, skill: 42, tier: [1, 5],
      edu: ["985", "211", "一本"], majors: ["clinical_med"], level: 6, capital: 0, minYears: 0,
      hazard: true, shebao: true,
      blurb: "\"二十六，规培刚结束，工资条我没敢给我妈看，她在老家跟人说我是三甲的医生。\"",
      trap: "本科五年加规培三年，规培那三年每月三四千，同届别的专业已经还了三年房贷；病历写到凌晨，还要挤时间发文章，不发就停在这一格，而这一格没有年龄上限。好科室要硕博，你进的是最缺人的那个。" },
    { id: "gov_powergrid", name: "省级电网 · 一线技术岗", ind: "体制内",
      gross: 8800, intensity: 3, prestige: 4, skill: 35, tier: [1, 5],
      edu: ["985", "211", "一本", "二本"], majors: ["elec_power", "ee_info"], level: 5, capital: 0, minYears: 0,
      hazard: true, shebao: true, exam: true,
      blurb: "台风天要上塔，抢修津贴按小时算，一晚上顶半个月。平时是巡线、填表、等电话。",
      trap: "待遇是真的，代价是前几年在县供电所或者山上的变电站，地点由不得你。统一招聘一年两批，本科岗位卡英语四级，专科基本只进农电班组，两批的岗位表不一样。轮值抢修、登高作业，出事的概率不高但不是零。等你想调回市区，前面排着队，队伍不动。" },
    { id: "con_supervisor", name: "房建项目 · 专业监理工程师", ind: "建筑",
      gross: 8600, intensity: 3, prestige: 2, skill: 21, tier: [1, 5],
      edu: ["一本", "二本", "专科"], majors: ["civil"], level: 3, capital: 0, minYears: 2,
      hazard: true, shebao: true,
      blurb: "我签的字最多，说话最不管用。旁站一天，日志写满一页，混凝土该怎么浇还是怎么浇。",
      trap: "常年驻场，项目在哪住哪，一样跟着工程换城市。名义上你管着施工方，工资却是建设方给的，真要较真，换掉的是你不是他。一旦出事故，第一个被翻出来的是你签过的那本监理日志。三十岁以下监理单位不太敢用你，这行得先熬老。" },
    { id: "edu_jiaoyanyuan", name: "区教研室 · 学科教研员", ind: "教育",
      gross: 8600, intensity: 2, prestige: 4, skill: 56, tier: [1, 5],
      edu: ["985", "211", "一本", "二本"], majors: ["chinese_lit", "english", "math_applied", "primary_edu"], level: 8, capital: 0, minYears: 7,
      shebao: true, hidden: true,
      discover: "tenure",
      blurb: "我现在不教书了。我听别人教书，然后告诉他哪里不对。",
      trap: "转岗当月工资是往下走的：没有班主任津贴，也没有超课时费，「当教研员钱还少了」在这个圈子里是常识。位子是等出来的，前任不退你就不动。离开讲台五年之后你已经上不动课了，退路是自己关上的。" },
    { id: "edu_org_teacher", name: "校外培训机构 · 高中学科／成人考培老师", ind: "教育",
      gross: 8600, intensity: 4, prestige: 2, skill: 28, tier: [1, 5],
      edu: ["985", "211", "一本", "二本"], majors: ["math_applied", "english", "chinese_lit", "cs", "acct"], level: 4, capital: 0, minYears: 0,
      shebao: true, commission: true,
      blurb: "旺季在高三一模前后，淡季盯续报率。政策一变，整个校区一个星期就没了。",
      trap: "义务教育阶段的学科班 2021 年以后就没有了，还开着的是高中、考研、公考和成人考证，赛道一年比一年挤。收入按课时和续报算，淡季能腰斩。教龄不被认定，四十岁被优化之后你回不了公立。" },
    { id: "radiology_tech", name: "三甲医院 · 影像技师（放射科）", ind: "医疗",
      gross: 8600, intensity: 3, prestige: 3, skill: 35, tier: [1, 5],
      edu: ["211", "一本", "二本"], majors: ["clinical_med"], level: 5, capital: 0, minYears: 0,
      hazard: true, shebao: true,
      blurb: "\"一天两百多个片子，我记得住每台机器的脾气，记不住一个病人的脸。\"",
      trap: "技师不是医师，报告轮不到你签字，天花板在入职那天就画好了；大型设备上岗证早就取消了，现在是科里自己带、自己考，也就是说你会什么由科主任说了算。剂量在标准以内，但累计剂量表上的数每年都往上走。" },
    { id: "community_gp", name: "社区卫生服务中心 · 全科医生", ind: "医疗",
      gross: 8200, intensity: 2, prestige: 3, skill: 42, tier: [1, 5],
      edu: ["985", "211", "一本", "二本"], majors: ["clinical_med"], level: 6, capital: 0, minYears: 0,
      shebao: true, exam: true,
      blurb: "\"我这儿最常见的病是高血压，最常做的事是填表。\"",
      trap: "一半工时花在建档、随访和公卫报表上，手上的技术三年就退化；协议里写着五年服务期，提前走要赔培训费，赔多少按你还剩几年算。等你想回大医院，人家看简历只会问这几年做了什么。" },
    { id: "con_site_eng", name: "房建项目 · 施工员", ind: "建筑",
      gross: 8200, intensity: 4, prestige: 1, skill: 14, tier: [1, 5],
      edu: ["一本", "二本", "专科"], majors: ["civil"], level: 2, capital: 0, minYears: 0,
      hazard: true, shebao: true,
      blurb: "六点半上塔吊底下点人，晚上十点写日志。项目干完换个城市，微信定位一年换三次。",
      trap: "存下的钱是拿生活换的：你的一整年装在项目部那间板房里。项目结束就地解散，下一个在哪没人提前告诉你。谈恋爱、结婚、生病、父母住院，在这一行都得排在工期后面。包吃住的另一面是你没有理由回城里，一年在家待不满一个月。" },
    { id: "gov_chengtou", name: "地方城投 · 项目管理岗", ind: "建筑",
      gross: 8200, intensity: 3, prestige: 3, skill: 21, tier: [1, 5],
      edu: ["985", "211", "一本", "二本"], majors: ["civil", "acct", "finance"], level: 3, capital: 0, minYears: 2,
      shebao: true,
      blurb: "名义上是国企。实际上市里的项目停一停，我们绩效那一栏就变成一个很小的数。",
      trap: "挂着国企的牌子，跟的是地方财政的周期。项目停绩效就停，债务紧的年份连基本工资都会晚。社招要两年以上项目经验，有二建优先但不是必需；初筛这一步，本地认识人是有用的。真到收缩那天，\"国企\"这两个字保护不了一个合同制员工。" },
    { id: "gov_lixuan", name: "省直机关 · 公开遴选（在编）", ind: "体制内",
      gross: 8200, intensity: 4, prestige: 5, skill: 35, tier: [1, 5],
      edu: ["985", "211", "一本", "二本"], majors: [], level: 5, capital: 0, minYears: 3,
      shebao: true, exam: true, hidden: true,
      discover: "tenure",
      blurb: "遴选进来的都是各县市写材料最好的那几个。现在我们坐在一间办公室里，比谁交得晚。",
      trap: "报名的前提是你已经在编、满两三年、原单位肯放人——三条里最难的是第三条。考的是材料能力，进来干的也是材料，只是纸的抬头换了。以前你是单位里写得最好的，现在你是这层楼里最普通的一个。原单位那张桌子当天就有人坐了，回不去。" },
    { id: "edu_special", name: "特殊教育学校 · 教师（在编）", ind: "教育",
      gross: 8100, intensity: 3, prestige: 3, skill: 35, tier: [1, 5],
      edu: ["985", "211", "一本", "二本"], majors: ["primary_edu", "nursing"], level: 5, capital: 0, minYears: 0,
      hazard: true, shebao: true, exam: true,
      blurb: "教了六年，他今年会自己上厕所了。这是我今年最大的成果，写进年度总结只有一行。",
      trap: "学生会咬你、抓你、把你推到墙上，你不能还手，也不能记恨——这写在岗位职责里。比普通在编多出来的那几百块就是特教津贴，它是补偿，不是奖励。这行的人转岗回普通学校的很少，普通学校也不认这几年。" },
    { id: "gov_town_civil", name: "乡镇机关 · 公务员（定向乡镇岗）", ind: "体制内",
      gross: 8000, intensity: 3, prestige: 4, skill: 14, tier: [4, 5],
      edu: ["一本", "二本", "专科"], majors: [], level: 2, capital: 0, minYears: 0,
      shebao: true, hukou: true, exam: true,
      blurb: "考的时候分数线是全省最低的，来了才明白为什么。",
      trap: "乡镇工作补贴按服务年限涨，钱不比市里少——少的是别的。最低服务五年，五年内调不走、遴选也报不了。防火期上山、汛期上堤，周末加班叫值班，值班没有加班费。定向岗多数还要本县户籍或生源。生活半径会收缩到镇上那几十个人，包括你找对象的范围。" },
    { id: "medical_rep", name: "医药代表", ind: "医疗",
      gross: 8000, intensity: 3, prestige: 2, skill: 28, tier: [1, 5],
      edu: ["一本", "二本", "专科"], majors: ["pharmacy", "clinical_med", "bio", "marketing"], level: 4, capital: 0, minYears: 1,
      shebao: true, commission: true,
      blurb: "\"集采之后这行的黄金时代过去了，剩下的是拜访记录和打卡定位。\"",
      trap: "底薪低、奖金跟着标外品种走，一轮集采就能砍掉半条产品线；市区几家三甲骑电动车就能跑，要跑县里的医院才需要车。合规红线一年比一年细，出事时公司说那是个人行为；和医生喝出来的关系属于产品，不属于你——换一家公司，所有人得重新认一遍。" },
    { id: "pharmacist_hosp", name: "三甲医院 · 药剂科药师", ind: "医疗",
      gross: 8000, intensity: 3, prestige: 3, skill: 35, tier: [1, 5],
      edu: ["211", "一本", "二本"], majors: ["pharmacy"], level: 5, capital: 0, minYears: 0,
      shebao: true,
      blurb: "\"读五年药学，现在的工作是把药从这个架子拿到那个窗口。\"",
      trap: "专业感一年年蒸发，离职时你会发现简历上写不出一件具体的事；药品零加成之后科室早就不产生收入了，DRG 一收紧，第一个被压绩效的就是不产生收入的那个科。很多人顺手考了执业药师，医院评职称不认，那张证只在你想跳去药企或药店时才用得上。轻松是真的轻松，但它也是把你留在这儿的东西。" },
    { id: "store_mgr", name: "连锁餐饮 · 门店店长", ind: "服务",
      gross: 8000, intensity: 4, prestige: 2, skill: 21, tier: [1, 5],
      edu: ["高中", "专科", "二本"], majors: [], level: 3, capital: 0, minYears: 2,
      shebao: true,
      blurb: "总部要毛利，顾客要出餐快，员工要排班好看。这三样凑不齐的时候，扣的是我的绩效。",
      trap: "两年从服务员或领班熬上来，一张食品安全管理员证，一套看得懂的报表——门槛比只要一本 C1 的城配司机高，工资比人家低。换来的是社保、空调，和一条到区域经理为止的线：一个区域十家店，那个位置只有一个。规矩是店做不起来先换店长，不关店。你手下的人一年换三轮，每一轮你都要重新教一遍。" },
    { id: "edu_bianzhi", name: "公立中小学 · 在编教师", ind: "教育",
      gross: 7600, intensity: 3, prestige: 4, skill: 35, tier: [1, 5],
      edu: ["985", "211", "一本", "二本"], majors: ["chinese_lit", "english", "math_applied", "primary_edu", "music"], level: 5, capital: 0, minYears: 0,
      shebao: true, exam: true,
      blurb: "考了三年才上岸。上岸的意思是，四十岁的我长什么样，现在就能看见了。",
      trap: "考编报名一般卡三十周岁，你能考的次数是有限的，而且录取比例和你有多想要没关系。稳定的另一面是三十年一眼望到头：班主任津贴几百块，要管四十个孩子和四十个家庭。等你想跳出去的时候会发现，这份履历在校外一文不值。" },
    { id: "nurse_ward", name: "三甲医院 · 病房护士（合同制）", ind: "医疗",
      gross: 7600, intensity: 4, prestige: 3, skill: 28, tier: [1, 5],
      edu: ["一本", "二本", "专科"], majors: ["nursing"], level: 4, capital: 0, minYears: 0,
      hazard: true, shebao: true,
      blurb: "\"上完夜班回家躺着，天亮了也睡不着，就那么睁着眼到中午。\"",
      trap: "合同制和编制护士干一样的活，工资和退休金差一截，而编制十年不开一次；本科是新一线三甲的硬门槛，专科的位置在地级市以下的医院，或者同一家医院的劳务派遣岗。倒班没有尽头，三十五岁你还在跑同一条走廊。" },
    { id: "guoqi_it", name: "国企 · 信息中心信息化岗", ind: "体制内",
      gross: 7500, intensity: 2, prestige: 3, skill: 28, tier: [1, 5],
      edu: ["985", "211", "一本", "二本"], majors: ["cs", "ee_info", "admin_mgmt"], level: 4, capital: 0, minYears: 0,
      shebao: true, hukou: true, exam: true, hidden: true,
      discover: "family",
      blurb: "我不写代码了，我写招标文件、验收报告和迎检材料。工资一眼看到六十岁，但外面裁员那阵，我一点不慌。",
      trap: "你的行业变了，在互联网攒的年头归零。单位会催你考软考，考过每月补两百，证挂在单位名下用来投标。三年之后出去面试，你会发现自己既不写代码了，也没有可迁移的管理经验，只有一套只在这个单位管用的流程。往上走要的不是技术，而那个东西不一定轮得到你。" },
    { id: "startup_founder", name: "创业公司 · 创始人", ind: "互联网",
      gross: 7500, intensity: 4, prestige: 3, skill: 21, tier: [1, 5],
      edu: ["985", "211", "一本", "二本", "专科", "高中"], majors: [], level: 3, capital: 400000, minYears: 3,
      commission: true,
      blurb: "“我们还在打磨产品。”投资人听得懂这句话什么意思，我也听得懂。",
      trap: "估值和你的银行卡是两回事。公司关掉的时候你不是失业，你是先把员工工资、房租和欠款结清，剩下的才算你的。再去面试，简历上这三年别人只问一句“为什么没做成”。这几年你没交社保，也没攒下工龄。" },
    { id: "edu_counselor", name: "高校 · 辅导员", ind: "教育",
      gross: 7400, intensity: 4, prestige: 4, skill: 35, tier: [1, 5],
      edu: ["985", "211", "一本", "二本"], majors: [], level: 5, capital: 0, minYears: 0,
      shebao: true,
      blurb: "手机二十四小时开机。学生半夜出事，第一个电话打给我，第二个才打给他爸妈。",
      trap: "你不上课，所以在学校里你不算老师；职称走管理线，天花板矮得能看见。想转教学岗要博士，这道门在你进来那天就已经关上了。学生出任何事，第一责任人那一栏写的是你的名字。" },
    { id: "gov_city_civil", name: "市直机关 · 公务员（综合文字岗）", ind: "体制内",
      gross: 7400, intensity: 3, prestige: 5, skill: 28, tier: [1, 5],
      edu: ["985", "211", "一本", "二本"], majors: ["law", "chinese_lit", "admin_mgmt", "finance", "acct", "journalism"], level: 4, capital: 0, minYears: 0,
      shebao: true, exam: true,
      blurb: "去年我大概写了四十万字，没有一篇署我的名。这也是好事——出了事也不署我的名。",
      trap: "材料。一年写几十万字，没一个字是自己的。省考市直岗，笔试面试体检政审全过；同城的国考岗位属于税务、海关那些垂管系统，是另一套表、另一张工资单。应届身份在多数好岗位上是硬门槛，往届只能报少数不限的岗。晋升拼资历也拼运气，科级往上每一级都要等前面的人退。三十五岁那年你会发现除了写材料什么都不会，而这门手艺在墙外面一文不值。" },
    { id: "courier", name: "快递 · 加盟网点派件员", ind: "物流",
      gross: 7200, intensity: 4, prestige: 1, skill: 0, tier: [1, 5],
      edu: ["高中", "专科"], majors: [], level: 0, capital: 6000, minYears: 0,
      hazard: true,
      blurb: "派一件一块二，客户一个差评扣一百。所以我送一天，是在替一个差评打工。",
      trap: "派费按件，罚款按次，两边的定价权都不在你手上。全年无休才有这个数，请一天假就是当天白干。三轮车自己买，网点还要押一笔钱，押金离职时退不退得回来，看网点老板当时的现金流。你签的合同上写的是加盟商的名字，网点老板欠薪跑路这行每年都有，总部会告诉你那是两家公司。没有社保，撞一次车全自费。" },
    { id: "test_manual", name: "软件公司 · 功能测试", ind: "互联网",
      gross: 7200, intensity: 3, prestige: 2, skill: 14, tier: [1, 5],
      edu: ["一本", "二本", "专科"], majors: [], level: 2, capital: 0, minYears: 0,
      shebao: true,
      blurb: "点了两年，闭着眼睛都知道哪儿会崩。提了单开发不改，说这不算 bug，这是特性。",
      trap: "涨薪极慢，天花板是测试主管，而主管上面没有位置。这行一半人是转行进来的，你会的东西别人练三个月也会。自动化每年吃掉一批手工测试的坑，你得赶在被吃完之前学会写代码——而学写代码这件事，公司不会给你时间。" },
    { id: "cdc_phys", name: "区疾控中心 · 公共卫生医师", ind: "医疗",
      gross: 7000, intensity: 2, prestige: 3, skill: 35, tier: [1, 5],
      edu: ["985", "211", "一本", "二本"], majors: ["clinical_med", "bio"], level: 5, capital: 0, minYears: 0,
      hazard: true, shebao: true, exam: true,
      blurb: "\"平时没人知道我们是干什么的，出事的时候全网都知道我们是干什么的。\"",
      trap: "同一届考进医院的那几个同学，第三年收入是你的一倍半；一个区疾控的岗位常年三十几个人报，进来之后干得好没人看见，出一次事故先问责的是你这一层。没有处方权，转不回临床。" },
    { id: "fin_audit_firm", name: "会计师事务所 · 审计助理", ind: "金融",
      gross: 7000, intensity: 4, prestige: 3, skill: 14, tier: [1, 5],
      edu: ["985", "211", "一本", "二本", "专科"], majors: ["acct", "finance"], level: 2, capital: 0, minYears: 0,
      shebao: true,
      blurb: "\"一到四月住客户那儿，剩下八个月补觉。CPA 六门我过了三门，考了三年。\"",
      trap: "前三年是底稿、盘点、函证，一年跑七八个城市。年审季日均十四小时，加班费折成调休，调休用不掉。CPA 不过升不上去，过了也只是拿到继续熬的资格。底稿上有你的名字，事务所出事时它还在。" },
    { id: "realty_agent", name: "房产中介 · 门店经纪人", ind: "服务",
      gross: 7000, intensity: 4, prestige: 1, skill: 14, tier: [1, 5],
      edu: ["高中", "专科", "二本"], majors: [], level: 2, capital: 0, minYears: 0,
      shebao: true, commission: true,
      blurb: "上个月开了一单，全店给我鼓掌。前面五个月，没人提我。",
      trap: "底薪只保前几个月，连续三个月不开单就劝退。上岗要在住建部门做经纪从业人员实名登记；协理证公司鼓励你考，但没人真查。你看到的这个月薪是把好月份和空月份平均出来的，真实的顺序是零、零、零、一笔大的、零。开单靠房源、客户和运气，三样都不完全归你。二手房成交量一冷，整条街的门店一起关，你手机里攒了两年的客户微信一夜之间不值钱。" },
    { id: "hospice_nurse", name: "安宁疗护病房 · 护士", ind: "医疗",
      gross: 6900, intensity: 2, prestige: 2, skill: 35, tier: [1, 5],
      edu: ["一本", "二本", "专科"], majors: ["nursing"], level: 5, capital: 0, minYears: 3,
      shebao: true, hidden: true,
      discover: "event",
      blurb: "\"别的科护士送病人出院，我们科送病人走。这个月第七个。\"",
      trap: "夜班比普通病房少，钱也少，绩效跟着床位周转走，而这个科室的周转是那个意思；家属的情绪你得接着，自己的没人接。专科护士培训班要进来一两年后科里才送你去读，一年一个名额。干满两年你会发现对亲人的病也麻木了，想调走时科里说\"你走了他们怎么办\"。" },
    { id: "gov_county_shiye", name: "县直事业单位 · 综合管理岗", ind: "体制内",
      gross: 6800, intensity: 2, prestige: 4, skill: 14, tier: [4, 5],
      edu: ["一本", "二本", "专科"], majors: [], level: 2, capital: 0, minYears: 0,
      shebao: true, hukou: true, exam: true,
      blurb: "我这张办公桌，前面坐过三个人。他们都是坐到退休的。",
      trap: "综合管理岗不等于没事干：包村、创城、值班、被抽调，一样轮得到你。天花板一眼看得到，多数人退休时的职级只比入职时高一级。县财政紧的年份，绩效那一栏会比同事口中的数字小一截，没人跟你解释为什么。事少的月份是真的，而事少会把手艺磨没，三十五岁想出去时你会发现简历上没有一句能写。" },
    { id: "gov_xuandiao", name: "定向选调生 · 省委组织部储备", ind: "体制内",
      gross: 6800, intensity: 3, prestige: 5, skill: 28, tier: [1, 5],
      edu: ["985", "211"], majors: [], level: 4, capital: 0, minYears: 0,
      shebao: true, exam: true, hidden: true,
      discover: "npc",
      blurb: "同学去大厂第一年就买了车。我在乡里驻村。十年后不好说——也可能十年后也是这样。",
      trap: "党员、学生干部、应届，三个条件缺一不可，而且都要从大一大二开始攒，大四才听说的人补不上。定向只面向指定的那几十所学校，通知发在他们自己的就业群里。先驻村两年，回机关重新熬，起薪低于同期考进市直的同学。同一批进来的人里只有少数走得远，其余的和普通公务员没有区别，只是当年被寄予过更多期望，落差也就更难受。" },
    { id: "gd_designer", name: "品牌设计公司 · 平面设计", ind: "文化传媒",
      gross: 6500, intensity: 3, prestige: 2, skill: 28, tier: [1, 5],
      edu: ["211", "一本", "二本", "专科"], majors: ["visual_design"], level: 4, capital: 0, minYears: 0,
      shebao: true,
      blurb: "“预算不多，但这个案子做出来对你作品集特别好。”这句话我听了七年。",
      trap: "改稿不加钱，第三版之后客户会说“还是第一版好”。社保按最低基数交，公积金也是。手艺涨得慢，报价涨得更慢；三十五岁以后，甲方更愿意把这个价给便宜的年轻人。" },
    { id: "shop_owner", name: "街边小店 · 店主（餐饮／奶茶）", ind: "服务",
      gross: 6500, intensity: 4, prestige: 2, skill: 0, tier: [1, 5],
      edu: ["985", "211", "一本", "二本", "专科", "高中"], majors: [], level: 0, capital: 200000, minYears: 0,
      commission: true,
      blurb: "“刨掉房租人工水电，我一个月比我雇的店长多挣两千。多的那两千是我自己不用发工资。”",
      trap: "二十万买的是自己给自己打工的权利。转让费和装修是沉没的，关店那天一分钱拿不回来。一年三百六十五天开门，你发烧那天店也得开；社保得自己以灵活就业的身份交，没人给你出那一半。第二年续租，房东看了眼你门口的队，涨了三成。" },
    { id: "hosp_caregiver", name: "医院 · 护工（一对一陪护）", ind: "医疗",
      gross: 6400, intensity: 4, prestige: 1, skill: 0, tier: [1, 5],
      edu: ["专科", "高中"], majors: [], level: 0, capital: 0, minYears: 0,
      hazard: true,
      blurb: "\"一个病人管一天，包吃住——住是病床边那张折叠椅。\"",
      trap: "没有社保没有合同，病人出院或者走了，收入当天归零；护工公司每月抽走一到两成，抽多少你说了不算。腰是最先坏的，可你不属于任何一家单位，坏了没人给你认工伤。" },
    { id: "mcn_edit", name: "MCN 机构 · 拍摄剪辑", ind: "文化传媒",
      gross: 6300, intensity: 4, prestige: 2, skill: 21, tier: [1, 5],
      edu: ["二本", "专科", "高中"], majors: [], level: 3, capital: 0, minYears: 0,
      shebao: true,
      blurb: "“前三秒没抓住人就废了。”这句话我一天听十遍，说的人比我小四岁。",
      trap: "账号火了是运营的功劳，不火先裁剪辑。社保按最低基数交，交了三年，会的还是这套软件——干到第三年，你能干的活和第一年一样多，而应届生要价比你低一千二。" },
    { id: "arch_assist", name: "建筑设计院 · 助理建筑师", ind: "建筑",
      gross: 6000, intensity: 4, prestige: 3, skill: 21, tier: [1, 4],
      edu: ["985", "211", "一本", "二本"], majors: ["architecture"], level: 3, capital: 0, minYears: 0,
      shebao: true,
      blurb: "我这一年画的都是别人方案里的楼梯和卫生间。晚上十一点所里还有一半人。",
      trap: "加班没有加班费，说是「项目奖」，年底发多少看甲方给不给钱。行业在缩，去年招八个今年招两个。" },
    { id: "gov_enforce", name: "参公执法队 · 一线执法队员", ind: "体制内",
      gross: 6000, intensity: 3, prestige: 2, skill: 14, tier: [1, 5],
      edu: ["985", "211", "一本", "二本", "专科"], majors: [], level: 2, capital: 0, minYears: 0,
      hazard: true, shebao: true, exam: true,
      blurb: "我们每次出去都默认对面有人在拍。所以话术比法条背得熟。",
      trap: "你穿上制服的第一天就成了别人手机里的素材。冲突是常态，被拍是常态，网上先判你输也是常态。行政执法资格证是入职一年内单位组织考的，考不出来转岗——它不是你进来之前能准备的东西。有编制、有社保、被亲戚问起来说不出口。" },
    { id: "news_reporter", name: "地方报业集团 · 记者（采编岗）", ind: "文化传媒",
      gross: 6000, intensity: 3, prestige: 3, skill: 21, tier: [1, 5],
      edu: ["985", "211", "一本", "二本"], majors: ["journalism", "chinese_lit", "law"], level: 3, capital: 0, minYears: 0,
      shebao: true,
      blurb: "“这个选题先放放。”放放的意思是不会再提了，这个我入职半年就懂了。",
      trap: "体面在名片上，不在工资条上。毙掉的稿子比发出来的多，稿费在缩、版面在减，采编部三年没进过新人。记者证由单位统一申领，人走了，证也就注销了。" },
    { id: "mfg_line_op", name: "电子厂 · 流水线操作工", ind: "制造",
      gross: 5600, intensity: 4, prestige: 1, skill: 0, tier: [1, 5],
      edu: ["高中"], majors: [], level: 0, capital: 0, minYears: 0,
      commission: true,
      blurb: "上班十二小时，一天说不到十句话。手比脑子记得清楚，下了班还在空气里拧螺丝。",
      trap: "计件工资，旺季能拿七千，淡季四千五还得等排班。劳务派遣，社保按最低基数交，断过两次没人通知你。站十二个小时，先坏的是腰和颈椎，那不算工伤。升班组长多一千二，从此罚款单上写的是你的名字。" },
    { id: "edu_tegang", name: "乡村学校 · 特岗教师", ind: "教育",
      gross: 5500, intensity: 2, prestige: 3, skill: 21, tier: [4, 5],
      edu: ["一本", "二本", "专科"], majors: ["primary_edu", "chinese_lit", "english", "math_applied", "music"], level: 3, capital: 0, minYears: 0,
      shebao: true, noSocial: true, exam: true,
      blurb: "全校六个年级一百来个学生。我教两个年级的数学，兼着音乐课，住在学校后面那排平房里。周末回县城要坐一个多小时中巴。",
      trap: "三年服务期内不能调动，也不好考出去。期满入编入的是乡镇学校的编，后面还有最低服务年限。等你想回城的时候会发现，市里已经没有你认识的人了。" },
    { id: "lawyer_junior", name: "律师事务所 · 授薪律师（执业前三年）", ind: "服务",
      gross: 5500, intensity: 4, prestige: 4, skill: 42, tier: [1, 5],
      edu: ["985", "211", "一本", "二本"], majors: ["law"], level: 6, capital: 0, minYears: 0,
      shebao: true,
      blurb: "“我们所是提成制。”没有案源的时候，这句话和“没有工资”是一个意思。",
      trap: "法考通过率不到两成；考过了，第一年还是实习期，只有补贴。你办的是别人的案源，前两年靠底薪；第三年所里开始看你自己能不能带案子进来。带不进来的那批陆续走了，去哪儿的都有，所里没人再提他们。" },
    { id: "fin_agency_acct", name: "代账公司 · 会计", ind: "金融",
      gross: 5400, intensity: 2, prestige: 2, skill: 21, tier: [1, 5],
      edu: ["专科", "二本"], majors: ["acct"], level: 3, capital: 0, minYears: 0,
      shebao: true,
      blurb: "\"我手上四十二家公司。客户打电话来，我得先问一句您是哪家。\"",
      trap: "按户数计件，单价年年被同行压。征期通宵，其余日子闲着。票据是客户给的，出了问题税务局先找经办会计。小微企业的账做十年，你会的还是小微企业的账。" },
    { id: "it_onsite", name: "IT 外包 · 驻场桌面运维", ind: "互联网",
      gross: 5400, intensity: 2, prestige: 1, skill: 7, tier: [1, 5],
      edu: ["一本", "二本", "专科"], majors: [], level: 1, capital: 0, minYears: 0,
      shebao: true, noSocial: true,
      blurb: "一天最多的活是重装系统和爬到桌子底下插网线。我的卡刷不开十二层以上，五年了也没申请过。",
      trap: "社保和公积金都按最低基数交，同一栋楼里别人一个月进两千七，你三百二，买房的时候这笔差额在首付里。这栋楼里没有一个人是你的同事，散伙饭轮不到你，内推也轮不到你。甲方换服务商的那天，你不知道自己算谁的人。" },
    { id: "security_guard", name: "商业综合体 · 保安（消控值班）", ind: "服务",
      gross: 5400, intensity: 4, prestige: 1, skill: 7, tier: [1, 5],
      edu: ["高中", "专科"], majors: [], level: 1, capital: 0, minYears: 0,
      shebao: true,
      blurb: "十二个小时里，真正需要我的大概三分钟。剩下的时间我在想怎么把这三分钟等到。",
      trap: "两班倒一次十二小时，白夜轮换，作息坏掉之后就没再好过。保安员证是保安公司统一办的，消防设施操作员证要自己去考——有证的进监控室，没证的在门口站岗，两边的工资差着一大截。这份活一天吃掉你十二个格子，干十年和干一年，简历上是同一行字。招聘启事上写\"45 岁以下\"，写了就是真的；四十五岁之后，同样的岗位只招你去更远、更旧的地方。入职要开无犯罪记录证明。" },
    { id: "fin_broker_branch", name: "券商营业部 · 客户经理", ind: "金融",
      gross: 5300, intensity: 3, prestige: 2, skill: 14, tier: [1, 5],
      edu: ["211", "一本", "二本", "专科"], majors: [], level: 2, capital: 0, minYears: 0,
      shebao: true, commission: true,
      blurb: "\"指数一涨，我爸都问我怎么开户。指数一跌，营业部就剩我和保安。\"",
      trap: "底薪三四千，剩下看客户资产，而行情不归你管。开户佣金被互联网券商打到万一，拉一个客户的边际收入逐年下降。做的是销售，简历上写金融，面试时对方一眼看出来。" },
    { id: "retail_guide", name: "商场专柜 · 导购", ind: "服务",
      gross: 5200, intensity: 3, prestige: 1, skill: 0, tier: [1, 5],
      edu: ["高中", "专科", "二本"], majors: [], level: 0, capital: 0, minYears: 0,
      commission: true,
      blurb: "客流一年比一年少。经理开会说是我们不会拉客，不是商场没人。",
      trap: "底薪就是当地最低工资，剩下全靠提成，提成按专柜当月流水算，不是按你卖了多少。多数专柜是代理商用工，社保没有，或者只交一份工伤。你的收入挂在一个正在缩小的池子上：商场客流下滑不是你能改变的变量，扣的却是你的提成。整层撤柜那天你才去翻劳动合同，甲方是一家你没听说过的公司，而它已经注销了。" },
    { id: "mfg_pc_qc", name: "装配式构件厂 · 质检员", ind: "制造",
      gross: 5100, intensity: 3, prestige: 1, skill: 7, tier: [1, 5],
      edu: ["专科"], majors: [], level: 1, capital: 0, minYears: 0,
      shebao: true,
      blurb: "拿回弹仪在构件上敲，一天敲两百下，填表。说不合格没人理我，说合格出了事签字的是我。",
      trap: "六天工作制，夏天蒸养车间四十度。厂在镇上，班车早六点四十在镇口发一班，错过就自己打车，二十八块。三年后你和新来的做一样的事，工资差四百。厂子是跟着装配式补贴那两年建起来的，去年停了两条线。" },
    { id: "fin_teller", name: "银行 · 柜员", ind: "金融", track: "bank",
      gross: 5000, intensity: 3, prestige: 3, skill: 7, tier: [1, 5],
      edu: ["专科", "二本", "一本"], majors: [], level: 1, capital: 0, minYears: 0,
      shebao: true,
      blurb: "\"制服是银行发的，工牌是银行的。劳动合同是劳务公司的。\"",
      trap: "同工不同酬，一个支行一年转正一两个人。柜面短款自己补。柜台本身在缩编，干着干着岗位就没了。五年下来会的是点钞和录入。" },
    { id: "gov_auxpolice", name: "公安分局 · 辅警", ind: "体制内",
      gross: 5000, intensity: 4, prestige: 2, skill: 0, tier: [1, 5],
      edu: ["专科", "高中"], majors: [], level: 0, capital: 0, minYears: 0,
      hazard: true, shebao: true,
      blurb: "出警的时候我在前面，写材料的时候我在后面，发奖金的时候名单上没有我。",
      trap: "同工不同酬写在制度里。三班倒、出警、拉架的风险归你，警号和职级不归你。招录要过体能和政审，本人和直系亲属都查，有一条不干净就到此为止。年龄一到没人赶你走，也没人告诉你下一步该去哪。" },
    { id: "gov_sanzhi", name: "三支一扶 · 服务期人员", ind: "体制内",
      gross: 5000, intensity: 3, prestige: 2, skill: 7, tier: [4, 5],
      edu: ["一本", "二本", "专科"], majors: [], level: 1, capital: 0, minYears: 0,
      shebao: true, exam: true,
      blurb: "两年。合同上写得清清楚楚。两年之后的事，合同上一个字都没有。",
      trap: "补贴参照当地事业单位新聘人员的最低一档发。名义上支农支教，实际多半被抽去写材料、报表、值班、包村。服务期满考编加分是真的，加的那几分不够也是真的。招募只面向毕业两年内还没就业的人，一年一次，过了这个窗口这一行就再也不出现。你把二十三到二十五岁押在了一个不属于你的编制上，而两年后那个编制不一定还在招人。" },
    { id: "gov_community", name: "社区 · 专职工作者", ind: "体制内",
      gross: 4800, intensity: 3, prestige: 2, skill: 7, tier: [1, 5],
      edu: ["一本", "二本", "专科"], majors: [], level: 1, capital: 0, minYears: 0,
      shebao: true, hukou: true,
      blurb: "居民觉得我是政府，政府觉得我是临时工。中间那层，就是我。",
      trap: "创卫、普查、独居老人、垃圾分类、调解夫妻吵架——凡是没人认领的活最后都归社区。多数城市只招本地户籍或本地生源，三十五岁以上不收。社工证不是门槛，是入职后自己去考的月补贴，一个月两三百。合同三年一签，转编名额一年零到一个，排队的有十几个。" },
    { id: "live_host", name: "直播基地 · 签约主播", ind: "文化传媒",
      gross: 4800, intensity: 4, prestige: 1, skill: 0, tier: [1, 5],
      edu: ["二本", "专科", "高中"], majors: [], level: 0, capital: 0, minYears: 0,
      noSocial: true, commission: true,
      blurb: "“在线八十六人。其中两个是运营，一个是我妈。”",
      trap: "底薪挂在开播时长上，请假要赔钱；能不能多拿，看那个月有没有人给你刷。作息整个倒过来，白天睡觉，认识的人只剩下运营和弹幕。签的是经纪合约不是劳动合同，没人给你交五险一金。二十七八岁那年合同到期，机构不跟你续，理由不用写。" },
    { id: "pharm_clerk", name: "连锁药店 · 营业员", ind: "医疗",
      gross: 4800, intensity: 2, prestige: 1, skill: 7, tier: [1, 5],
      edu: ["专科", "高中"], majors: [], level: 1, capital: 0, minYears: 0,
      shebao: true, commission: true,
      blurb: "\"顾客问哪个感冒药好，我得先想想这个月哪个提成高。\"",
      trap: "底薪压在最低工资线上，社保按最低基数交，差额靠推高毛利品种和保健品补；上岗前的 GSP 培训教的是怎么不说错话。店里挂着一张执业药师证，那个人不是你，也不常在。" },
    { id: "freelance_trans", name: "自由译者 · 笔译", ind: "文化传媒",
      gross: 4500, intensity: 3, prestige: 2, skill: 35, tier: [1, 5],
      edu: ["985", "211", "一本", "二本", "专科"], majors: ["english"], level: 5, capital: 0, minYears: 0,
      noSocial: true, commission: true,
      blurb: "“千字一百二，明天早上要。”给我报价的人自己也是转包的。",
      trap: "机翻把千字单价打回十年前，客户现在管这活叫“润色一下”，而润色的价只有翻译的三成。没有直客之前只能接翻译公司的转包单，价砍一半，结算压三十到六十天。时间自由等于没有下班，一整个月说不上十句话，生病那天就是没有收入那天。" },
    { id: "edu_public_contract", name: "公立中小学 · 编外聘用教师", ind: "教育",
      gross: 4400, intensity: 3, prestige: 3, skill: 28, tier: [1, 5],
      edu: ["一本", "二本"], majors: ["chinese_lit", "english", "math_applied", "primary_edu"], level: 4, capital: 0, minYears: 0,
      shebao: true,
      blurb: "我和隔壁班老师上一样的课、带一样的班、开一样的家长会，工资是她的一半。区别就是她考上了，我没考上。",
      trap: "同工不同酬，而且这个差距每年只会变大——她涨职称，你不涨。合同一年一签，每年七月重新等一次通知。三十五岁以后学校更愿意招应届的，你随时能走，所以你随时能被换掉。" },
    { id: "hotel_front", name: "连锁酒店 · 前台", ind: "服务",
      gross: 4400, intensity: 2, prestige: 2, skill: 0, tier: [1, 5],
      edu: ["高中", "专科", "二本"], majors: [], level: 0, capital: 0, minYears: 0,
      shebao: true,
      blurb: "三点到五点最难熬。那两个小时我记得清楚的事很少。",
      trap: "三班倒，夜班一个人从二十三点值到七点。制服、大堂、有社保，家里人说出去也好听，代价是你的作息永久性地坏掉一部分，而且客人的火从来不冲经理冲你。往上是大堂副理，通常要五年，加的钱不多，班还是照倒。" },
    { id: "data_label", name: "数据标注公司 · 标注员", ind: "互联网",
      gross: 4200, intensity: 3, prestige: 1, skill: 0, tier: [1, 5],
      edu: ["二本", "专科", "高中"], majors: [], level: 0, capital: 0, minYears: 0,
      blurb: "一天八百条，标错三条扣钱。我们标的这个东西，组长说以后能自己写标注规则。",
      trap: "计件工资，项目在就有活，项目结束整个组当天解散。没有社保，简历上这段经历下家不认——你干两年和干两个月，出去是一样的价钱。" },
    { id: "edu_kinder_teacher", name: "民办幼儿园 · 带班老师", ind: "教育",
      gross: 4200, intensity: 3, prestige: 2, skill: 21, tier: [1, 5],
      edu: ["二本", "专科"], majors: ["primary_edu", "music"], level: 3, capital: 0, minYears: 0,
      blurb: "早上七点半开门，接完孩子先量体温。一天弯腰接近两百次。家长群晚上十一点还有人问今天吃了几口，我一条一条回。",
      trap: "很多园不交社保，交的也按最低基数——这件事的分量要到三十五岁以后才看得出来。出生率一年比一年低，园所先并班后减人，新来的第一个走。" },
    { id: "fin_insur_agent", name: "保险公司 · 个人代理人", ind: "金融",
      gross: 4200, intensity: 3, prestige: 2, skill: 0, tier: [1, 5],
      edu: ["高中", "专科", "二本", "一本"], majors: [], level: 0, capital: 0, minYears: 0,
      commission: true,
      blurb: "\"入职第一个月的业绩是我自己买的。第二个月是我妈买的。\"",
      trap: "无底薪，前三个月基本没有收入，社保要自己按灵活就业交。卖的是缘故单，通讯录用完的那个月收入归零。做满两年的人不到三成，走的时候续期佣金一起没了。" },
    { id: "gov_gridworker", name: "街道 · 网格员（第三方派遣）", ind: "体制内",
      gross: 3900, intensity: 3, prestige: 1, skill: 0, tier: [1, 5],
      edu: ["专科", "高中"], majors: [], level: 0, capital: 0, minYears: 0,
      shebao: true,
      blurb: "APP一天要打八次卡，定位飘了就算旷工。下雨也得把网格走完，因为系统要看轨迹。",
      trap: "第三方派遣，社保按最低基数交，退休那年你会看见这个基数的后果。合同一年一签，四十五岁以上的简历派遣公司不会回。干得再好也不会转成社区专职，更不会有编——这条路上面没有下一级台阶。" },
    { id: "phd_cand", name: "高校 · 在读博士研究生", ind: "教育",
      gross: 3600, intensity: 4, prestige: 4, skill: 35, tier: [1, 5],
      edu: ["985", "211", "一本"], majors: ["bio", "env", "chinese_lit", "clinical_med", "math_applied", "cs"], level: 5, capital: 0, minYears: 0,
      exam: true,
      blurb: "“快了。”我导师这么说。第三年了。",
      trap: "每月三千六，包括你三十岁那年。同龄人这几年在攒首付、评职称、生孩子，你在等一份审稿意见。毕业时三十二三，学校那边是非升即走。真到要出去找工作那天，这个学位值多少钱，全看你当年读的是哪个方向——而那个方向是你二十三岁定的，定的时候没人跟你说这件事。" },
    { id: "edu_tuoguan", name: "校外托管班 · 晚托老师", ind: "教育",
      gross: 2800, intensity: 1, prestige: 1, skill: 0, tier: [1, 5],
      edu: ["二本", "专科", "高中"], majors: [], level: 0, capital: 0, minYears: 0,
      blurb: "六点到八点，二十个孩子写作业。我不备课，也不讲题，就是坐在教室后面看着谁在说话、谁在哭。八点家长陆续来接。",
      trap: "一天只上两三个小时，寒暑假停课，月总数在哪个城市都不够一个人过。没有社保、不算工龄，机构说关就关，押着的半个月工资跟着一起没。" },
  ];
  const JOB_MAP = {};
  JOBS.forEach((j) => { JOB_MAP[j.id] = j; });

  /* ─────────────────────────── 学历 ─────────────────────────── */
  const EDU_TIERS = [
    { id: '985', name: '985', min: 660 },
    { id: '211', name: '211', min: 600 },
    { id: '一本', name: '一本', min: 517 },
    { id: '二本', name: '二本', min: 420 },
    { id: '专科', name: '专科', min: 300 },
    { id: '高中', name: '高中毕业', min: 0 },
  ];




  /* ─────────────────────────── 养老金替代率 ─────────────────────────── */
  /* 第64章养老 + 第67章社保。同样干了一辈子，退休后差十倍。
     这是整个游戏里最直白的一处阶层差异，而且它是真实的。 */
  const PENSION = {
    '公务员': 0.82, '教师': 0.78, '普通职员': 0.45, '工人': 0.42,
    '销售': 0.40, '个体户': 0.30, '小老板': 0.28, '外来务工': 0.22,
    '无固定职业': 0.15, '务农': 0.06, '事业单位职员': 0.75, '护士': 0.55,
  };


  /* 父母的职业属于哪个行业 —— family 解锁途径要用（第103章：信息半径） */
  const JOB_IND = {
    '公务员': '体制内', '事业单位职员': '体制内', '教师': '教育', '护士': '医疗',
    '工人': '制造', '普通职员': '服务', '个体户': '服务', '小老板': '制造',
    '销售': '服务', '务农': null, '外来务工': '建筑', '无固定职业': null,
  };

  /* ─────────────────────────── 高中 ─────────────────────────── */
  /* 第16章学区系统的落地：你读哪所高中，出生时就定了，
     而它直接决定同样一个月刷题能刷出多少。 */
  const HS_SCHOOLS = {
    prov:   { id:'prov',   name:'省重点中学', size:1200, strength:1.26, note:'走廊里挂满了历年考上清北的照片，每张下面都写着名字。' },
    city:   { id:'city',   name:'市重点中学', size:1000, strength:1.13, note:'每次月考成绩都贴在楼道里，从第一名贴到最后一名。' },
    normal: { id:'normal', name:'普通高中',   size:800,  strength:1.00, note:'老师们尽力了。也就这样了。' },
    county: { id:'county', name:'县中',       size:600,  strength:0.88, note:'全县最好的学校。对很多人来说也是唯一的出路。' },
    town:   { id:'town',   name:'乡镇中学',   size:380,  strength:0.76, note:'物理老师同时带三个班，还兼着体育课。' },
  };

  /* ─────────────────────────── 大学 ─────────────────────────── */
  /* min = 解锁分数线。field 决定毕业后哪一类 offer 更容易拿到。 */
  const SCHOOLS = [
    { min:690, name:'清华大学',       city:'beijing',   tier:'985', field:'tech',    note:'县里给你家送了块牌匾。' },
    { min:690, name:'北京大学',       city:'beijing',   tier:'985', field:'general', note:'家里把录取通知书拍了照，发到了所有群里。' },
    { min:652, name:'上海交通大学',   city:'shanghai',  tier:'985', field:'eng' },
    { min:652, name:'复旦大学',       city:'shanghai',  tier:'985', field:'general' },
    { min:645, name:'浙江大学',       city:'hangzhou',  tier:'985', field:'tech' },
    { min:638, name:'中国人民大学',   city:'beijing',   tier:'985', field:'finance' },
    { min:630, name:'武汉大学',       city:'wuhan',     tier:'985', field:'general' },
    { min:630, name:'华中科技大学',   city:'wuhan',     tier:'985', field:'tech' },
    { min:630, name:'中山大学',       city:'guangzhou', tier:'985', field:'med' },
    { min:630, name:'四川大学',       city:'chengdu',   tier:'985', field:'med' },

    { min:615, name:'北京邮电大学',   city:'beijing',   tier:'211', field:'tech',    note:'计算机的分数比不少 985 还高。' },
    { min:615, name:'北京师范大学',   city:'beijing',   tier:'211', field:'edu' },
    { min:615, name:'上海财经大学',   city:'shanghai',  tier:'211', field:'finance' },
    { min:608, name:'电子科技大学',   city:'chengdu',   tier:'211', field:'tech' },
    { min:608, name:'华东师范大学',   city:'shanghai',  tier:'211', field:'edu' },
    { min:600, name:'西南财经大学',   city:'chengdu',   tier:'211', field:'finance' },
    { min:600, name:'华南理工大学',   city:'guangzhou', tier:'211', field:'eng' },
    { min:600, name:'武汉理工大学',   city:'wuhan',     tier:'211', field:'eng' },

    { min:562, name:'首都医科大学',   city:'beijing',   tier:'一本', field:'med' },
    { min:555, name:'深圳大学',       city:'shenzhen',  tier:'一本', field:'tech',    note:'不是 211。但它在深圳。' },
    { min:532, name:'浙江工商大学',   city:'hangzhou',  tier:'一本', field:'finance' },
    { min:532, name:'省医科大学',     city:'provincial',tier:'一本', field:'med' },
    { min:525, name:'省财经大学',     city:'provincial',tier:'一本', field:'finance' },
    { min:518, name:'省属重点大学',   city:'provincial',tier:'一本', field:'general' },
    { min:518, name:'省师范大学',     city:'provincial',tier:'一本', field:'edu',     note:'毕业包分配的年代早就过去了，但它还是最稳的那条路。' },

    { min:450, name:'省二本理工学院', city:'provincial',tier:'二本', field:'eng' },
    { min:435, name:'省二本师范学院', city:'provincial',tier:'二本', field:'edu' },
    { min:420, name:'市属学院',       city:'prefecture',tier:'二本', field:'general' },
    { min:420, name:'民办本科学院',   city:'prefecture',tier:'二本', field:'general', note:'学费一年两万四。你爸问了三遍这个数对不对。' },

    { min:315, name:'卫生职业学院',   city:'prefecture',tier:'专科', field:'med' },
    { min:300, name:'高等专科学校',   city:'prefecture',tier:'专科', field:'eng' },
    { min:300, name:'职业技术学院',   city:'county',    tier:'专科', field:'eng',     note:'离家二十公里，坐公交要一个小时。' },
  ];
  const FIELD_IND = { tech:['互联网'], finance:['金融'], edu:['教育'], med:['医疗'], eng:['制造','建筑'], general:[] };


  /* ─────────────────────────── 专业 ─────────────────────────── */
  /* 每个专业一条独立的经验条。hardness 越高，每月涨得越慢，
     但对口岗位的起薪和在职被动经验更高 —— 难专业是先亏后赚。 */
  const LEVEL_EXP = [0, 20, 50, 95, 160, 250, 380, 560, 820, 1200];
  const LEVEL_NAMES = [
    "只知道这个专业是哪四个字", "期末靠划重点混过去了", "照着教程能抄出来", "有人带着能干活", "一个人能扛一摊事", "组里出事第一个找你", "别的组也绕过来问你", "面试官问不倒你", "这行里有人知道你名字", "别人把你说过的话当行规"
  ];
  const MAJORS = [
    { id: "clinical_med", name: "临床医学", field: "med", hardness: 5, minEdu: "二本",
      desc: "五年本科加一年医院实习，解剖生理内外妇儿一门都躲不掉，毕业后还有三年规培才算真正上岗。",
      ceiling: "多数人的终点是三甲主治或副高，收入曲线三十五岁以后才立起来；进不去大医院的，落在二级医院和社区卫生中心，一眼看得到头。",
      hidden: "本科学历在三甲连简历都递不进去——你签的其实是一份再读五到八年的合同，中间那几年基本没有工资。" },
    { id: "nursing", name: "护理学", field: "med", hardness: 3, minEdu: "专科",
      desc: "基护、解剖、药理，最后一整年在病房轮转，毕业进医院，起薪不高但一直缺人。",
      ceiling: "护士长是绝大多数人能望到的最高处，而编制内和合同制的差距，比职称的差距大得多。",
      hidden: "夜班不是熬几年就过去的事，是一辈子的事；三十五岁还在倒班的人比你现在想象的多。" },
    { id: "pharmacy", name: "药学", field: "med", hardness: 3, minEdu: "二本",
      desc: "学有机化学和药理药剂，毕业去药企、CRO、医院药房或者连锁药店。",
      ceiling: "医院药剂科要研究生而且几年才招一个，多数人落在药企销售或药店店长，前者看业绩后者看排班。",
      hidden: "一半以上的药学毕业生最后干的是卖药，不是做药。" },
    { id: "cs", name: "计算机科学与技术", field: "tech", hardness: 4, minEdu: "专科",
      desc: "数据结构、操作系统、计算机网络，剩下的靠自己写；就业面最宽，同届的人也最多。",
      ceiling: "大厂给的钱是真的，给到什么时候不一定；三十五岁那年简历上要么有职级，要么得有别的说法。",
      hidden: "这个专业每年毕业的人是十年前的好几倍，而学校教的东西和面试问的东西基本是两回事。" },
    { id: "ee_info", name: "电子信息工程", field: "tech", hardness: 4, minEdu: "二本",
      desc: "电路、信号与系统、通信原理，做硬件、嵌入式或者通信设备。",
      ceiling: "硬件的工资天花板明显低于软件，但四十岁被劝退的概率也低一些——这笔账要过很多年才算得清。",
      hidden: "本科四年学的东西不够做硬件，大部分人最后还是转去写软件，用比科班低一档的起薪。" },
    { id: "math_applied", name: "数学与应用数学", field: "general", hardness: 5, minEdu: "二本",
      desc: "数分、高代、概率统计，本身不对应任何一个岗位，但它是不少岗位的入场券。",
      ceiling: "走得远的去做算法、量化或者精算；走不远的考编去中学教数学，也不算差的结局。",
      hidden: "这是个必须再配一门手艺的专业——不配的话，简历上写不出你到底会干什么。" },
    { id: "mech", name: "机械设计制造及其自动化", field: "eng", hardness: 3, minEdu: "专科",
      desc: "制图、材料力学、机械原理，毕业去工厂做设计、工艺或者设备维护。",
      ceiling: "往上是技术主管或项目经理，涨得慢但稳；换工作基本要跟着厂走，厂在哪你在哪。",
      hidden: "起薪常年被计算机压一大截，但到了四十岁那年，两边的差距会比你想的小。" },
    { id: "architecture", name: "建筑学", field: "eng", hardness: 4, minEdu: "二本",
      desc: "五年制。画图、模型、建筑史加力学，通宵赶图是常态，毕业多数进设计院。",
      ceiling: "主创建筑师是多数人的终点，往上是专业负责人和总建筑师；行业在收缩，往上的位置比排队的人少。",
      hidden: "一级注册建筑师九科、成绩滚动八年，多数人考五到八年，很多人一辈子没考出来——而没有这张证，你在设计院就是个画图的。" },
    { id: "civil", name: "土木工程", field: "eng", hardness: 3, minEdu: "专科",
      desc: "结构、施工、工程造价，去向是设计院或者工地，宿舍多半在项目上。",
      ceiling: "项目经理靠熬年份，注册结构靠考证；行业在收缩，往上的位置比排队的人少。",
      hidden: "这个专业的录取分几年里掉了很多，掉的原因你大二那年就会在师兄群里看到。" },
    { id: "elec_power", name: "电气工程及其自动化", field: "eng", hardness: 4, minEdu: "二本",
      desc: "电机、电力系统分析、自动控制，最好的去向是电网，其次是设备厂和新能源。",
      ceiling: "进了电网就是稳定但封顶的一生，五十岁和三十岁的差别主要在工龄；进不去的，在设备厂和工地之间挑一个。",
      hidden: "所有人都在讲电网，但电网一年招的人数，是这个专业毕业人数的零头。" },
    { id: "env", name: "环境工程", field: "eng", hardness: 3, minEdu: "二本",
      desc: "水处理、大气、固废、环评，名字听起来像朝阳产业。",
      ceiling: "环评工程师、检测公司技术员，或者去企业做安环，工资中下且很多年不动。",
      hidden: "环保的活多不多，取决于当年查得严不严——这个专业的就业跟着政策走，不跟着你的努力走。" },
    { id: "bio", name: "生物科学", field: "med", hardness: 4, minEdu: "二本",
      desc: "细胞、遗传、分子生物，实验做得比谁都多，对口的工作机会比谁都少。",
      ceiling: "不读到博士基本进不了真正的研发岗，读到了也是在等一个坑位；本科毕业的多数人去做了试剂销售、教培或者干脆转行。",
      hidden: "二十一世纪是生物的世纪这句话，说的不是你这一代人的就业。" },
    { id: "law", name: "法学", field: "law", hardness: 4, minEdu: "二本",
      desc: "民法刑法诉讼法，背和理解各占一半，真正的门槛是毕业前那场考试。",
      ceiling: "律所前三年几乎没有底薪，熬过去的人收入很高；熬不过去的去做企业法务、合规或者回头考公。",
      hidden: "法考不过，这四年在就业市场上约等于没读——而且它一年只有一次。" },
    { id: "acct", name: "会计学", field: "finance", hardness: 3, minEdu: "专科",
      desc: "借贷记账、成本核算、审计与税法，最不缺岗位，也最不缺人。",
      ceiling: "出纳到主管会计到财务经理，路径清楚而缓慢；想跳出来要么考注会，要么去事务所熬几年审计。",
      hidden: "基础岗位的工资十年没怎么涨，因为永远有一个刚毕业的人愿意拿得更少。" },
    { id: "finance", name: "金融学", field: "finance", hardness: 3, minEdu: "二本",
      desc: "货币银行学、公司金融、投资学，课本很漂亮，名字更漂亮。",
      ceiling: "绝大多数人去了银行，从柜台或客户经理做起，背存款指标；券商投行只认几所学校的研究生。",
      hidden: "这个专业的头部和普通毕业生之间不是差距，是两个不相干的行业。" },
    { id: "marketing", name: "市场营销", field: "general", hardness: 2, minEdu: "专科",
      desc: "消费者行为、渠道、品牌管理，学的时候偏理论，用的时候全靠人。",
      ceiling: "做到市场经理或销售总监都有可能，但走的是业绩的路，不是学历的路，业绩不好的年份没人看你专业。",
      hidden: "招聘写市场营销专业优先的岗位，八成是销售，只是标题换了个词。" },
    { id: "admin_mgmt", name: "行政管理", field: "general", hardness: 2, minEdu: "二本",
      desc: "管理学、公文写作、公共政策，课不难，班里一半人从大三开始准备考公。",
      ceiling: "公司行政的天花板是行政经理，钱少事杂；这个专业真正的出口在考公考编，不在企业。",
      hidden: "它教你怎么管理一个组织，但没有一家公司会让应届生管理任何东西。" },
    { id: "chinese_lit", name: "汉语言文学", field: "edu", hardness: 2, minEdu: "专科",
      desc: "古代文学、现当代、语言学，四年读得舒服，就业方向要自己找。",
      ceiling: "考编当语文老师，或者进机关写材料，是两条最稳的路；剩下的做编辑、新媒体和文案，收入看行业不看你。",
      hidden: "这是考公岗位数量最多的专业之一——它一大半的价值不在文学上，在报名表的专业代码上。" },
    { id: "primary_edu", name: "小学教育", field: "edu", hardness: 2, minEdu: "专科",
      desc: "教育学、心理学、各科教法加一段实习，目标从第一天起就很明确：教资，然后考编。",
      ceiling: "编制内一眼看到退休，工资稳、假期真、涨得慢，评职称拼的是年份和名额。",
      hidden: "生源在减少，编制在收紧——现在一个县城小学的岗位，报名的人能排满一整天。" },
    { id: "english", name: "英语", field: "edu", hardness: 2, minEdu: "专科",
      desc: "精读泛读听力口语，加一点语言学和翻译，四年主要是在练一门工具。",
      ceiling: "外贸、教培、翻译或者考编教英语；单靠语言本身，议价能力每年都在往下走。",
      hidden: "机器已经把大部分笔译的价格压到接近于零，剩下的活给了懂行业的人，不是给语言最好的人。" },
    { id: "journalism", name: "新闻传播学", field: "general", hardness: 2, minEdu: "二本",
      desc: "采写编评加传播理论，实习去电视台、报社或者公众号，看你那年能找到什么。",
      ceiling: "传统媒体在缩，多数人去了互联网做运营和内容；写得好的那部分人，收入并不比隔壁工位高。",
      hidden: "你以为学的是新闻，招聘市场上买的是会写稿的运营。" },
    { id: "visual_design", name: "视觉传达设计", field: "art", hardness: 2, minEdu: "专科",
      desc: "平面、版式、品牌、软件，作品集比成绩单重要得多。",
      ceiling: "甲方设计师或者自己开工作室，改稿是一辈子的事，年龄在这行不加分。",
      hidden: "艺考和四年学费花掉的钱，要工作八到十年才回得来，前提是你一直没离开这行。" },
    { id: "music", name: "音乐学", field: "art", hardness: 3, minEdu: "二本",
      desc: "主修一门乐器或声乐，加乐理、视唱练耳和教学法，专业课一对一，其余时间在琴房。",
      ceiling: "最现实的出口是中小学音乐老师和机构授课，收入取决于你手里有多少学生，不取决于你弹得多好。",
      hidden: "从小学琴花掉的钱，不会有任何一份工作替你算回来；这个专业最稳的用法，是拿它去考编。" },
  ];
  const MAJOR_MAP = {};
  MAJORS.forEach((m) => { MAJOR_MAP[m.id] = m; });

  /** 累计经验 → 等级 1-10 */
  function majorLevel(exp) {
    let lv = 1;
    for (let i = 0; i < LEVEL_EXP.length; i++) if (exp >= LEVEL_EXP[i]) lv = i + 1;
    return lv;
  }
  /** 当前等级内的进度 0-1 */
  function majorProgress(exp) {
    const lv = majorLevel(exp);
    if (lv >= 10) return 1;
    const a = LEVEL_EXP[lv - 1], b = LEVEL_EXP[lv];
    return Math.max(0, Math.min(1, (exp - a) / (b - a)));
  }
  /** 专业等级映射回既有的 0-100 技能值，让旧代码继续能用 */
  function majorToSkill(exp) {
    return Math.max(0, Math.min(100, Math.round(((majorLevel(exp) - 1) + majorProgress(exp)) * 11)));
  }

  /* ─────────────────────────── 技能描述 ─────────────────────────── */
  /* 玩家不该盯着一个 73 去凑整。技能只给一句话，让人知道自己大概在什么位置。 */
  const SKILL_WORDS = {
    学业: [[12,'上课主要在睡觉'],[26,'及格全靠老师心软'],[40,'中不溜秋，谁也不得罪'],[54,'班里前二十'],
           [66,'年级排得上号'],[76,'一模完老师会找你谈话'],[87,'重点班第一梯队'],[101,'老师拿你当招牌']],
    专业: [[1,'完全不会'],[14,'只会照着教程抄'],[28,'能干活，但得有人盯着'],[42,'一个人能扛一摊'],
           [56,'组里出事第一个找你'],[70,'别的组也来找你'],[84,'面试官问不倒你'],[101,'这行里有人知道你名字']],
    沟通: [[12,'电话响了要先深呼吸'],[26,'能把话说清楚'],[40,'饭桌上不至于冷场'],[54,'挺会来事'],
           [68,'谁都愿意跟你聊两句'],[82,'能把不熟的人变成熟人'],[101,'你一进门，气氛就变了']],
    经营: [[1,'没做过生意'],[14,'知道进价和售价的区别'],[28,'会算账了'],[42,'知道什么货压手'],
           [58,'看一眼铺面就知道行不行'],[76,'同行开始打听你'],[101,'你说的话，别人当行情']],
    体能: [[18,'爬六楼要歇两次'],[32,'走两步就喘'],[46,'普通人水平'],[60,'还算扛得住'],
           [74,'熬夜第二天照常起'],[88,'很久没生过病了'],[101,'身体好得有点招人恨']],
  };
  /* 单亲家庭只有一个大人。全篇台词默认写的是「你妈」，
     可那个人在这一局里根本不存在 —— pw() 返回一个真的在场的称呼。 */
  function pw(s, prefer) {
    const list = ((s && s.npcs) || []).filter((n) => n.family && n.alive
      && (n.kind === '父亲' || n.kind === '母亲'));
    if (!list.length) return '家里';
    const want = list.find((n) => n.kind === (prefer || '母亲'));
    return (want || list[0]).kind === '母亲' ? '妈' : '爸';
  }
  /** 家里还有几个大人 —— 有些台词只在双亲的时候说得通 */
  function parentCount(s) {
    return ((s && s.npcs) || []).filter((n) => n.family && n.alive
      && (n.kind === '父亲' || n.kind === '母亲')).length;
  }

  function skillWord(key, v) {
    const tab = SKILL_WORDS[key] || [[101, '—']];
    for (const [max, w] of tab) if (v < max) return w;
    return tab[tab.length - 1][1];
  }

  /* ─────────────────────────── 行情 ─────────────────────────── */
  /* 每一句 blurb 都是"别人说的话"，不是信息（第128章）。
     drift/vol 是月度参数，玩家永远看不到。beta 决定它跟不跟大盘。 */
  const INSTRUMENTS = [
    { id:'maotai',  name:'贵州茅苔',      kind:'股票', sector:'白酒',   p0:1680, drift:0.0095, vol:0.052, beta:0.6,
      blurb:'"这个只涨不跌，我丈母娘都买。"' },
    { id:'ningde',  name:'宁德时贷',      kind:'股票', sector:'新能源', p0:210,  drift:0.0130, vol:0.132, beta:1.4,
      blurb:'"风口上的猪都能飞，闭眼买。"' },
    { id:'tengxun', name:'腾讯控鼓',      kind:'股票', sector:'互联网', p0:330,  drift:0.0075, vol:0.084, beta:1.1,
      blurb:'"都跌到这个价了，还能跌到哪去。"' },
    { id:'haiyun',  name:'中远海控股',    kind:'股票', sector:'航运',   p0:14,   drift:0.0040, vol:0.158, beta:1.3,
      blurb:'"周期到了。这次真的不一样。"' },
    { id:'yinxing', name:'工商银杏',      kind:'股票', sector:'银行',   p0:5.4,  drift:0.0030, vol:0.026, beta:0.5,
      blurb:'"分红比存银行高，图个安稳。"' },
    { id:'shiyou',  name:'中石油田',      kind:'股票', sector:'石油',   p0:7.2,  drift:-0.0012,vol:0.044, beta:0.7,
      blurb:'"我爸 48 块买的，现在还在等回本。"' },
    { id:'caifu',   name:'东方财福',      kind:'股票', sector:'券商',   p0:16,   drift:0.0055, vol:0.142, beta:1.8,
      blurb:'"牛市第一根阳线，冲进去就对了。"' },
    { id:'st',      name:'*ST 未来',      kind:'股票', sector:'保壳中', p0:2.3,  drift:-0.013, vol:0.255, beta:1.0,
      blurb:'"重组的消息我有内部渠道，你别外传。"' },
    { id:'fund',    name:'稳健增利混合A', kind:'基金', sector:'混合基金',p0:1.42, drift:0.0042, vol:0.025, beta:0.7,
      blurb:'"基金经理是明星，历史业绩看得见。"' },
    { id:'gold',    name:'黄金 ETF',      kind:'基金', sector:'贵金属', p0:4.8,  drift:0.0038, vol:0.036, beta:-0.2,
      blurb:'"家里老人说买点金子踏实。"' },
    { id:'deposit', name:'三年定期',      kind:'存款', sector:'银行',   p0:100,  drift:0.0016, vol:0,     beta:0,
      blurb:'"跑不赢房价，但你晚上睡得着。"' },
  ];
  const INSTRUMENT_MAP = {};
  INSTRUMENTS.forEach((x) => { INSTRUMENT_MAP[x.id] = x; });

  /* ─────────────────────────── 行动 ─────────────────────────── */
  /* 一格时间 = 干一件事。9个固定动词，子选项随阶段生长。
     每个 run(c) 里 c = { s, rng, E }，返回 string[] 作为本月记录。 */

  const A = [];
  function act(o) { A.push(o); return o; }

  /* —— 工作 —— */
  act({
    id: 'work_full', verb: '工作', label: '全力上班', stages: ['work'],
    hint: '正常出勤、认真干活。绩效上升，晋升进度推进。',
    avail: (s) => !!s.p.job,
    run: (c) => {
      const { s, E, rng } = c;
      E.perf(+4);
      E.promo(+1 + (s.p.skills.专业 > 50 ? 1 : 0));
      E.skill('专业', 0.9 + rng.float(0, 0.5));
      E.stress(+s.p.jobIntensity * 1.4);
      return ['你按部就班地上了一个月班。'];
    },
  });
  act({
    id: 'work_ot', verb: '工作', label: '加班', stages: ['work'],
    hint: '换取奖金和晋升，代价是压力和健康。',
    avail: (s) => !!s.p.job,
    run: (c) => {
      const { s, E, rng } = c;
      const bonus = Math.round(s.p.gross * rng.float(0.10, 0.22));
      E.cash(bonus, '加班费/项目奖金');
      E.perf(+8); E.promo(+3);
      E.skill('专业', 1.2);
      E.stress(+s.p.jobIntensity * 2.6 + 5);
      E.health(-1.2);
      return [`你连着加了一个月班，拿到 ${E.money(bonus)} 额外收入。`];
    },
  });
  act({
    id: 'work_slack', verb: '工作', label: '摸鱼', stages: ['work'],
    hint: '工资照发，但绩效掉到底，裁员名单上会有你。',
    avail: (s) => !!s.p.job,
    run: (c) => {
      const { E } = c;
      E.perf(-10); E.promo(-1);
      E.stress(-6);
      return ['你这个月基本在划水。轻松，但组长看在眼里。'];
    },
  });
  act({
    id: 'work_promo', verb: '工作', label: '争取晋升', stages: ['work'],
    hint: '成功率主要看你在这一格干了几年，其次是绩效、专业等级、和有没有人替你说话。失败要冷 18 个月。',
    avail: (s) => !!s.p.track && !(s.flags.promoCool && s.flags.promoCool > s.tick)
      && s.p.rank + 1 < TRACK_MAP[s.p.track].ranks.length,
    run: (c) => c.E.promo2(),
  });
  act({
    id: 'work_interview', verb: '工作', label: '投简历面试', stages: ['work', 'gap'],
    hint: '寻找新的 offer。学历、技能、行业景气、人脉都算数。',
    run: (c) => c.E.jobHunt(false),
  });
  act({
    id: 'work_find', verb: '工作', label: '找工作', stages: ['gap'],
    hint: '待业中全力找工作。',
    run: (c) => c.E.jobHunt(true),
  });

  /* —— 学习 —— */
  act({
    id: 'study_hard', verb: '学习', label: '刷题', stages: ['hs'],
    hint: '最有效，也最费人。压力堆到考前，会变成发挥失常的概率。',
    run: (c) => {
      const { s, E, rng } = c;
      const g = E.growth('学业', 8.0) * (s.p.talent === 'study' ? 1.28 : 1);
      E.skill('学业', g);
      E.stress(+6); E.health(-0.5);
      return ['你刷了一个月的题。'];
    },
  });
  act({
    id: 'study_class', verb: '学习', label: '上课 · 正常听讲', stages: ['hs'],
    hint: '不拼命，也不落下。压力涨得慢。',
    run: (c) => {
      const { E } = c;
      E.skill('学业', E.growth('学业', 3.4));
      E.stress(+3);
      return ['按部就班地上了一个月课。'];
    },
  });
  act({
    id: 'study_cram', verb: '学习', label: '补习班', stages: ['hs'],
    hint: '补短板最快，补到后面就没用了。花的是家里的钱 —— 那笔钱本来是你将来的容错空间。',
    avail: (s) => s.family.cash > 2500,
    run: (c) => {
      const { s, E, rng } = c;
      const cost = 1800 + rng.int(0, 1400);
      E.familyCash(-cost);
      // 补课是补短板的：底子越差效果越好，学业过了 45 就基本只剩心理安慰
      const boost = 1 + Math.max(0, (45 - s.p.skills.学业) / 45) * 0.45;
      const g = E.growth('学业', 8.2) * boost;
      E.skill('学业', g);
      E.stress(+9); E.health(-0.6);
      const left = s.family.cash;
      return [`父母掏了 ${E.money(cost)} 给你报班。` + (left < 30000 ? `家底只剩 ${E.money(left)} 了。` : '')];
    },
  });
  act({
    id: 'study_major', verb: '学习', label: '学专业课', stages: ['uni', 'work', 'gap'],
    hint: '专业等级决定你能投哪些岗位。难的专业涨得慢，但对口岗位的门槛和起薪都更高。',
    avail: (s) => !!s.p.major,
    run: (c) => {
      const { s, E } = c;
      E.majorExp(E.majorGain());
      E.stress(+4);
      return [`你啃了一个月${MAJOR_MAP[s.p.major].name}。`];
    },
  });
  act({
    id: 'study_exam_gov', verb: '学习', label: '备考 · 考公考编', stages: ['uni', 'work', 'gap'],
    hint: '上岸需要长期积累，而且录取比例极低。',
    run: (c) => {
      const { s, E } = c;
      s.p.examPrep = (s.p.examPrep || 0) + 1;
      E.skill('学业', E.growth('学业', 1.4));
      E.stress(+7);
      return [`你在准备考公。（已备考 ${s.p.examPrep} 个月）`];
    },
  });
  act({
    id: 'study_english', verb: '学习', label: '学英语', stages: ['uni', 'work', 'gap'],
    hint: '慢，但影响一部分岗位和出国的可能。',
    run: (c) => {
      const { s, E } = c;
      s.p.english = (s.p.english || 0) + E.growth('english', 1.5);
      E.stress(+3);
      return ['你背了一个月单词。'];
    },
  });

  /* —— 搞钱 —— */
  act({
    id: 'money_odd', verb: '搞钱', label: '日结零工', stages: ['uni', 'work', 'gap'],
    hint: '来钱快，门槛零，但纯粹用时间换钱。',
    run: (c) => {
      const { s, E, rng } = c;
      const base = 3600 * (s.city.cost || 1);
      const got = Math.round(base * rng.float(0.75, 1.25));
      E.cash(got, '零工');
      E.stress(+6); E.health(-1.4);
      E.skill('体能', 0.3);
      return [`你打了一个月零工，到手 ${E.money(got)}。累。`];
    },
  });
  act({
    id: 'money_side', verb: '搞钱', label: '做副业', stages: ['uni', 'work', 'gap'],
    hint: '慢热，可能起飞，也可能白干一年。',
    run: (c) => {
      const { s, E, rng } = c;
      s.p.sideLevel = (s.p.sideLevel || 0) + E.growth('side', 1.0);
      const lv = s.p.sideLevel;
      let earn = 0;
      if (lv > 4) earn = Math.round(rng.float(200, 400) * (lv - 3) * (s.p.talent === 'biz' ? 1.5 : 1));
      if (earn > 0) E.cash(earn, '副业收入');
      E.stress(+5); E.health(-0.5);
      return [earn > 0 ? `副业这个月进账 ${E.money(earn)}。` : '副业还在起步，这个月没什么收入。'];
    },
  });
  act({
    id: 'money_live', verb: '搞钱', label: '做直播 / 自媒体', stages: ['uni', 'work', 'gap'],
    hint: '幂律分布：绝大多数人投很久什么也没有。你看不出自己属于哪种。',
    run: (c) => {
      const { s, E, rng } = c;
      s.p.fans = s.p.fans || 0;
      // 隐藏天花板：开局就抽定，玩家永远看不到
      if (s.p._fanCap === undefined) {
        const r = rng.next();
        s.p._fanCap = r > 0.985 ? rng.int(300000, 2000000) : r > 0.9 ? rng.int(8000, 60000) : rng.int(80, 3000);
      }
      const cap = s.p._fanCap;
      const grow = Math.max(0, Math.round((cap - s.p.fans) * rng.float(0.02, 0.12) * (s.p.talent === 'art' || s.p.talent === 'social' ? 1.6 : 1)));
      s.p.fans += grow;
      const earn = Math.round(s.p.fans * rng.float(0.004, 0.02));
      if (earn > 0) E.cash(earn, '直播/广告收入');
      E.stress(+5); E.health(-0.6);
      return [`涨了 ${grow} 个粉，现在 ${s.p.fans} 个。${earn > 0 ? '收入 ' + E.money(earn) + '。' : '没有收入。'}`];
    },
  });
  act({
    id: 'money_stall', verb: '搞钱', label: '摆摊', stages: ['work', 'gap'],
    hint: '要本钱，要选址，要看城管和天气。',
    avail: (s) => s.p.cash > 3000,
    run: (c) => {
      const { s, E, rng } = c;
      if (!s.p.stall) { E.cash(-3000, '摊车与首批货'); s.p.stall = 1; }
      const rev = Math.round(rng.normal(4200, 1800) * (s.city.cost || 1));
      const net = Math.max(-800, rev - 2200);
      E.cash(net, '摆摊净收入');
      E.stress(+6); E.health(-1.6);
      E.skill('经营', E.growth('经营', 1.2));
      return [`摆了一个月摊，净${net >= 0 ? '赚' : '亏'} ${E.money(Math.abs(net))}。`];
    },
  });
  act({
    id: 'money_invest', verb: '搞钱', label: '投资', stages: ['uni', 'work', 'gap'],
    hint: '打开行情，自己挑。买进去以后它每个月自己跑，不再占你的格子。',
    run: () => ({ __choose: 'market' }),
  });
  act({
    id: 'money_lottery', verb: '搞钱', label: '买彩票', stages: ['hs', 'uni', 'work', 'gap'],
    hint: '期望值极负。但它是最便宜的希望。',
    avail: (s) => s.p.cash > 200 || s.p.allowance > 200,
    run: (c) => {
      const { E, rng } = c;
      E.cash(-200, '彩票');
      const r = rng.next();
      if (r > 0.99997) { E.cash(5000000, '一等奖'); return ['……你中了一等奖。五百万。你盯着那张纸看了很久。']; }
      if (r > 0.9993) { E.cash(30000, '中奖'); return ['你中了三万块。心跳了一整天。']; }
      if (r > 0.985) { E.cash(600, '小奖'); return ['中了六百。够回本还剩点。']; }
      if (r > 0.85) { E.cash(30, '末等奖'); return ['中了三十块，又买了几注。']; }
      return ['一个号都没对上。'];
    },
  });
  act({
    id: 'money_gamble', verb: '搞钱', label: '赌博', stages: ['work', 'gap', 'uni'],
    hint: '负期望，极高方差。它是绝望的人数学上仅剩的机会，也会毁掉绝大多数选它的人。',
    avail: (s) => s.p.cash > 500 || s.p.debt < 500000,
    run: (c) => {
      const { s, E, rng } = c;
      s.p.gambleCount = (s.p.gambleCount || 0) + 1;
      const addicted = s.p.gambleCount > 3;
      // 下注额随成瘾程度失控
      let bet = Math.round(Math.max(500, s.p.cash * (addicted ? rng.float(0.35, 0.9) : rng.float(0.1, 0.35))));
      bet = Math.min(bet, s.p.cash + (addicted ? 20000 : 3000));
      if (bet > s.p.cash) { // 借钱赌
        const borrow = bet - s.p.cash;
        s.p.debt += borrow;
        s.p.debtKind = '网贷/私人借款';
        E.log(`你手上不够，借了 ${E.money(borrow)}。`);
      }
      E.cash(-Math.min(bet, s.p.cash), '下注');
      const r = rng.next();
      let back = 0, line;
      if (r > 0.965) { back = bet * rng.int(5, 14); line = `你赢麻了。${E.money(back)} 回到账上。`; }
      else if (r > 0.80) { back = Math.round(bet * rng.float(1.4, 2.6)); line = `赢了。${E.money(back)}。`; }
      else if (r > 0.55) { back = Math.round(bet * rng.float(0.8, 1.2)); line = '来回拉锯，基本打平。'; }
      else { back = 0; line = `${E.money(bet)} 一分不剩。`; }
      if (back > 0) E.cash(back, '赌博');
      E.stress(addicted ? +12 : +6);
      E.health(-1.0);
      if (s.p.gambleCount === 4) E.log('你开始惦记着回本了。');
      return [line];
    },
  });

  /* —— 房产 —— */
  act({
    id: 'house_look', verb: '房产', label: '看房', stages: ['work'],
    hint: '不买也能看。中介会跟你说很多话，真假参半。',
    run: (c) => {
      const { s, E, rng } = c;
      const p = Math.round(s.city.price * s.world.priceIdx);
      s.p.sawHouse = true;
      E.rumorNow('agent', rng.chance(0.35), `中介说 ${s.city.name} 明年新盘要涨，让你早点上车。`);
      return [`你跑了几个楼盘。${s.city.name}现在大概 ${E.money(p)}/㎡，一套 90 平首付要 ${E.money(Math.round(p * 90 * 0.3))}。`];
    },
  });
  act({
    id: 'house_buy', verb: '房产', label: '买房', stages: ['work'],
    hint: '三十年，绑定你的职业选择、婚姻稳定和风险承受能力。',
    avail: (s) => !s.p.house && s.p.cash + s.family.cash > s.city.price * s.world.priceIdx * 78 * 0.3,
    run: (c) => {
      const { s, E } = c;
      const unit = Math.round(s.city.price * s.world.priceIdx);
      const area = 78;
      const total = unit * area;
      const down = Math.round(total * 0.3);
      let fromFamily = 0;
      if (s.p.cash < down) { fromFamily = Math.min(s.family.cash, down - s.p.cash); E.familyCash(-fromFamily); E.cash(fromFamily, '父母支援首付'); }
      if (s.p.cash < down) return ['首付还是不够。你从售楼处走出来，外面在下雨。'];
      E.cash(-down, '首付');
      s.p.house = { city: s.city.id, area, unit, total };
      s.p.debt += total - down;
      s.p.debtKind = '房贷';
      s.p.mortgage = Math.round((total - down) * 0.0049 / (1 - Math.pow(1.0049, -360)));
      s.p.housing = '自有住房（有贷）';
      E.stress(+10);
      return [
        `你在${s.city.name}买了一套 ${area} 平，总价 ${E.money(total)}。`,
        fromFamily > 0 ? `父母拿出了 ${E.money(fromFamily)}。` : '',
        `首付 ${E.money(down)}，贷款 ${E.money(total - down)}，月供 ${E.money(s.p.mortgage)}，还三十年。`,
      ].filter(Boolean);
    },
  });
  act({
    id: 'house_prepay', verb: '房产', label: '提前还贷', stages: ['work'],
    avail: (s) => s.p.debtKind === '房贷' && s.p.cash > 50000,
    hint: '减少利息，但也吃掉你的现金缓冲。',
    run: (c) => {
      const { s, E } = c;
      const amt = Math.round(Math.min(s.p.cash * 0.6, s.p.debt));
      E.cash(-amt, '提前还贷');
      s.p.debt -= amt;
      if (s.p.debt <= 0) { s.p.debt = 0; s.p.mortgage = 0; s.p.housing = '自有住房（无贷）'; return ['你还清了房贷。那一刻很安静。']; }
      return [`你提前还了 ${E.money(amt)}，还剩 ${E.money(s.p.debt)}。`];
    },
  });

  /* —— 社交 —— */
  act({
    id: 'soc_colleague', verb: '社交', label: '同事聚餐', stages: ['work'],
    hint: '维系同事关系，顺带听到点消息。',
    avail: (s) => !!s.p.job,
    run: (c) => {
      const { E, rng } = c;
      E.cash(-rng.int(150, 400), '聚餐');
      E.relGroup('同事', +4);
      E.stress(-3);
      E.tryRumor(['colleague'], 1);
      return ['你和同事吃了顿饭。'];
    },
  });
  act({
    id: 'soc_drink', verb: '社交', label: '酒桌', stages: ['work'],
    hint: '关系涨得快，身体掉得也快。',
    avail: (s) => !!s.p.job,
    run: (c) => {
      const { E, rng } = c;
      E.cash(-rng.int(300, 900), '酒局');
      E.relGroup('同事', +7);
      E.relGroup('圈子', +4);
      E.health(-2.2); E.stress(-2);
      E.tryRumor(['colleague', 'boss'], 2);
      return ['一场酒局。第二天头很疼，但有些话只有在桌上才听得到。'];
    },
  });
  act({
    id: 'soc_classmate', verb: '社交', label: '约老同学', stages: ['uni', 'work', 'gap'],
    hint: '同学是最长的关系线。十年后可能变成内推、合伙人，或者债主。',
    run: (c) => {
      const { E, rng } = c;
      E.cash(-rng.int(100, 350), '');
      E.relGroup('同学', +6);
      E.tryRumor(['classmate'], 1);
      return ['你和老同学见了一面。'];
    },
  });
  act({
    id: 'soc_hometown', verb: '社交', label: '老乡聚会', stages: ['uni', 'work', 'gap'],
    hint: '老乡网络的信息质量参差，但它是很多人唯一的信息来源。',
    run: (c) => {
      const { E, rng } = c;
      E.cash(-rng.int(80, 260), '');
      E.relGroup('老乡', +6);
      E.tryRumor(['hometown'], 2);
      return ['一桌老乡，聊了很多老家的事。'];
    },
  });
  act({
    id: 'soc_gift', verb: '社交', label: '送礼请托', stages: ['work', 'gap'],
    hint: '花钱花格子，换一次请托机会。对方帮不帮，看他自己的处境。',
    avail: (s) => s.p.cash > 2000,
    run: (c) => c.E.favorAsk(),
  });
  act({
    id: 'soc_blind', verb: '社交', label: '相亲', stages: ['work', 'gap'],
    hint: '你的条件是明码标价的：城市、房、车、学历、收入、户口。',
    avail: (s) => s.p.age >= 23 && !s.p.partner,
    run: (c) => c.E.blindDate(),
  });
  act({
    id: 'soc_ask', verb: '社交', label: '打听消息', stages: ['hs', 'uni', 'work', 'gap'],
    hint: '花一格去核实一条传闻。信息是能用时间买的资源。',
    run: (c) => c.E.investigate(),
  });
  act({
    id: 'soc_path', verb: '社交', label: '打听路子', stages: ['uni', 'work', 'gap'],
    hint: '有些位置不挂在网上。你得去问人，而且不一定问得到。',
    run: (c) => c.E.askPath(),
  });

  /* —— 家庭 —— */
  act({
    id: 'fam_parents', verb: '家庭', label: '回家陪父母', stages: ['hs', 'uni', 'work', 'gap'],
    hint: '不产生任何数值收益。但你不去，他们会老得更快。',
    run: (c) => {
      const { s, E, rng } = c;
      if (s.p.city !== s.family.home) E.cash(-rng.int(300, 900), '路费');
      E.rel('father', { close: +6, trust: +3 });
      E.rel('mother', { close: +6, trust: +3 });
      E.stress(-6);
      E.tryRumor(['family'], 2);
      return [parentCount(s) > 1
        ? '你回了趟家。妈做了一桌子菜，爸没说几句话。'
        : `你回了趟家。你${pw(s)}做了一桌子菜，问的还是那几件事。`];
    },
  });
  act({
    id: 'fam_money', verb: '家庭', label: '给家里钱', stages: ['work', 'gap'],
    hint: '养老系统的日常形态。',
    avail: (s) => s.p.cash > 1000,
    run: (c) => {
      const { s, E } = c;
      const amt = Math.min(3000, Math.round(s.p.cash * 0.2));
      E.cash(-amt, '给家里');
      E.familyCash(+amt);
      E.rel('father', { close: +3, favor: +2 });
      E.rel('mother', { close: +4, favor: +2 });
      return [`你给家里打了 ${E.money(amt)}。妈在电话里说别乱花钱。`];
    },
  });
  act({
    id: 'fam_care', verb: '家庭', label: '照顾病人', stages: ['hs', 'uni', 'work', 'gap'],
    hint: '家里有人病了，你必须花掉这一格。中年人的格子永远不够分。',
    avail: (s) => s.npcs.some((n) => n.family && n.sick),
    run: (c) => {
      const { s, E } = c;
      const sick = s.npcs.filter((n) => n.family && n.sick);
      sick.forEach((n) => { n.health += 2.5; n.careMonths = (n.careMonths || 0) + 1; });
      E.rel('father', { close: +4 }); E.rel('mother', { close: +4 });
      E.stress(+7); E.health(-0.8);
      return [`你在医院陪了${sick.map((n) => n.name).join('、')}一个月。`];
    },
  });
  act({
    id: 'fam_partner', verb: '家庭', label: '陪伴侣', stages: ['uni', 'work', 'gap'],
    avail: (s) => !!s.p.partner,
    hint: '关系不维护会自己坏掉。',
    run: (c) => {
      const { E, rng } = c;
      E.cash(-rng.int(200, 800), '约会');
      E.rel('partner', { close: +8, trust: +4 });
      E.stress(-5);
      return ['你们一起过了个不错的月份。'];
    },
  });

  /* —— 身体 —— */
  act({
    id: 'body_gym', verb: '身体', label: '锻炼', stages: ['hs', 'uni', 'work', 'gap'],
    hint: '唯一能把健康加回来的东西。',
    run: (c) => {
      const { s, E } = c;
      const g = 2.2 * (s.p.talent === 'sport' ? 1.4 : 1);
      E.health(+g);
      E.skill('体能', E.growth('体能', 1.4));
      E.stress(-7);
      return [`你规律锻炼了一个月。（健康 +${g.toFixed(1)}）`];
    },
  });
  act({
    id: 'body_check', verb: '身体', label: '体检', stages: ['uni', 'work', 'gap'],
    hint: '不产生任何数值收益。它只做一件事：把看不见的变成看得见的。',
    avail: (s) => s.p.cash > 500,
    run: (c) => c.E.checkup(),
  });
  act({
    id: 'body_treat', verb: '身体', label: '看病治疗', stages: ['hs', 'uni', 'work', 'gap'],
    hint: '花钱花时间。报销比例取决于社保。',
    avail: (s) => s.p.diseases.length > 0,
    run: (c) => c.E.treat(),
  });

  /* —— 休息 —— */
  act({
    id: 'rest_lie', verb: '休息', label: '躺平', stages: ['hs', 'uni', 'work', 'gap'],
    hint: '系统不评判。但格子确实消失了。',
    run: (c) => {
      const { E } = c;
      E.stress(-14); E.health(+0.6);
      return ['你什么也没干。睡觉，刷手机，发呆。'];
    },
  });
  act({
    id: 'rest_travel', verb: '休息', label: '旅游', stages: ['uni', 'work', 'gap'],
    avail: (s) => s.p.cash > 3000,
    hint: '花钱换心情，顺带看看别的地方长什么样。',
    run: (c) => {
      const { s, E, rng } = c;
      const cost = Math.round(rng.int(2500, 7000) * (s.city.cost || 1));
      E.cash(-cost, '旅行');
      E.stress(-20); E.health(+1.2);
      s.p.travels = (s.p.travels || 0) + 1;
      return [`你出去玩了一趟，花了 ${E.money(cost)}。回来那天，觉得城市有点陌生。`];
    },
  });
  act({
    id: 'rest_game', verb: '休息', label: '打游戏 / 追剧', stages: ['hs', 'uni', 'work', 'gap'],
    hint: '便宜的快乐。',
    run: (c) => {
      const { E } = c;
      E.stress(-11); E.health(-0.5);
      return ['你打了一个月游戏。'];
    },
  });

  /* —— 人生决策（第116章：身份不锁定）—— */
  act({
    id: 'life_quit', verb: '人生决策', label: '辞职', stages: ['work'],
    hint: '随时可以掀桌子。掀完之后是待业。',
    avail: (s) => !!s.p.job,
    run: (c) => {
      const { s, E } = c;
      const old = s.p.jobName;
      E.quitJob();
      E.stress(-8);
      return [`你从${old}辞职了。第二天早上醒来不用去任何地方。`];
    },
  });
  act({
    id: 'life_move', verb: '人生决策', label: '换城市', stages: ['work', 'gap'],
    hint: '成本、租金、薪资、房价、关系网全部重算。',
    run: (c) => ({ __choose: 'city' }),
  });
  act({
    id: 'life_home', verb: '人生决策', label: '回老家', stages: ['work', 'gap'],
    hint: '世界在内卷，你有权不参与。',
    avail: (s) => s.p.city !== s.family.home,
    run: (c) => {
      const { s, E } = c;
      E.moveCity(s.family.home);
      if (s.p.job) E.quitJob();
      E.rel('father', { close: +8 }); E.rel('mother', { close: +10 });
      E.stress(-12);
      return [`你回了${CITIES[s.family.home].name}。父母嘴上说"回来也好"，眼睛是亮的。`];
    },
  });
  act({
    id: 'life_confess', verb: '人生决策', label: '确定关系', stages: ['uni', 'work'],
    avail: (s) => !s.p.partner && s.npcs.some((n) => n.romance && n.close > 55),
    hint: '',
    run: (c) => c.E.confess(),
  });
  act({
    id: 'life_breakup', verb: '人生决策', label: '分手', stages: ['uni', 'work', 'gap'],
    avail: (s) => !!s.p.partner,
    hint: '',
    run: (c) => {
      const { s, E } = c;
      const n = s.npcs.find((x) => x.id === s.p.partner);
      s.p.partner = null;
      if (n) { n.romance = false; n.close = Math.max(0, n.close - 40); }
      E.stress(+14);
      return [`你和${n ? n.name : '对方'}分开了。`];
    },
  });

  /* ─────────────────────────── 传闻 ─────────────────────────── */
  /* 第97章：不同来源可信程度不同。第128章：玩家不能自动知道真相。
     每条传闻在生成时就已经确定真假，但玩家只看到星级。 */
  const RUMOR_SOURCES = {
    family: { label: '家里', truth: 0.85, stars: 3 },
    colleague: { label: '同事', truth: 0.62, stars: 2 },
    boss: { label: '领导', truth: 0.72, stars: 3 },
    classmate: { label: '老同学', truth: 0.58, stars: 2 },
    hometown: { label: '老乡群', truth: 0.40, stars: 1 },
    agent: { label: '中介', truth: 0.30, stars: 1 },
    news: { label: '新闻', truth: 0.80, stars: 3 },
    video: { label: '短视频', truth: 0.22, stars: 1 },
    inside: { label: '内部消息', truth: 0.78, stars: 3 },
  };

  const RUMORS = [
    { id: 'r_layoff', src: ['colleague', 'inside', 'boss'], when: (s) => !!s.p.job && s.p.ind !== '体制内', text: (s) => `听说下季度要砍一个组。`, onTrue: (s, E) => E.flag('layoffComing', 8) },
    { id: 'r_bonus', src: ['colleague'], when: (s) => !!s.p.job, text: () => `今年年终奖听说要缩水。`, onTrue: (s, E) => E.flag('bonusCut', 12) },
    { id: 'r_gov_hire', src: ['hometown', 'family'], when: (s) => s.p.age >= 21, text: (s) => `县里事业单位好像要招人了。`, onTrue: (s, E) => E.flag('govHiring', 10) },
    { id: 'r_price_up', src: ['agent', 'video'], when: () => true, text: (s) => `${s.city.name}房价明年要涨。` },
    { id: 'r_price_down', src: ['news', 'colleague'], when: () => true, text: (s) => `${s.city.name}二手房挂牌量在涨，卖不动。`, onTrue: (s, E) => E.flag('priceSoft', 18) },
    { id: 'r_industry', src: ['news', 'inside'], when: (s) => !!s.p.ind, text: (s) => `${s.p.ind}这行今年不太好过。`, onTrue: (s, E) => E.flag('indBad', 12) },
    { id: 'r_refer', src: ['classmate'], when: (s) => s.p.age >= 22, text: () => `有个老同学说他们公司在招人，可以帮你递简历。`, onTrue: (s, E) => E.flag('referral', 6) },
    { id: 'r_parent_ill', src: ['family'], when: (s) => s.npcs.some((n) => n.family && n.health < 72), text: (s) => (parentCount(s) > 1
      ? `你妈说你爸最近老喊腰疼，让他去查也不去。`
      : `你${pw(s)}最近老喊腰疼，你让${pw(s) === '妈' ? '她' : '他'}去查，说没事。`) },
    { id: 'r_scam', src: ['classmate', 'hometown'], when: (s) => s.p.cash > 30000, text: () => `有个"稳赚年化18%"的项目，老同学介绍的，说名额不多了。`, onTrue: (s, E) => E.flag('goodDeal', 4), onFalse: (s, E) => E.flag('scamComing', 6) },
    { id: 'r_marry', src: ['family', 'hometown'], when: (s) => s.p.age >= 24 && !s.p.partner, text: () => `你姑说给你介绍个对象，条件"很不错"。` },
    { id: 'r_promo', src: ['boss', 'colleague'], when: (s) => !!s.p.job && s.p.promo > 40, text: () => `听说要提一个人上去。`, onTrue: (s, E) => E.flag('promoWindow', 6) },
    { id: 'r_crypto', src: ['video', 'classmate'], when: (s) => s.p.age >= 20, text: () => `有人说现在进场还来得及，去年翻了三倍。` },
  ];

  /* ─────────────────────────── 事件 ─────────────────────────── */
  /* tier: world 世界层 / situation 境遇层（由你的位置条件触发，不是随机）
           social 人际层（从关系图长出来）/ accident 意外层（真随机，但被结构调制） */
  const CONTENT_DIS_EARLY = ['gastritis', 'cervical', 'insomnia', 'hyperten'];
  const EVENTS = [];
  function ev(o) { EVENTS.push(o); return o; }

  /* —— 境遇层 —— */
  ev({
    id: 'layoff', tier: 'situation',
    // 绩效决定你在不在名单上。行业和年龄只是放大器。
    weight: (s) => {
      const f = s.p.perf;
      let w = f >= 75 ? 0.8 : f >= 60 ? 2.2 : f >= 45 ? 6 : f >= 30 ? 15 : 28;
      if (s.world.ind[s.p.ind] < 40) w *= 2.0;
      if (s.flags.layoffComing) w *= 2.5;
      if (s.p.age >= 35) w *= 1 + (s.p.age - 35) * 0.05;
      return w;
    },
    when: (s) => !!s.p.job && s.p.ind !== '体制内' && s.p.jobMonths > 10, cooldown: 36,
    title: '优化', text: (s) => `周一早上，HR 把你叫进了小会议室。门关上的时候你就知道了。\n\n组要砍掉三分之一。你在名单上。`,
    options: [
      { label: '接受赔偿，走人', apply: (c) => { const { s, E } = c; const n = Math.max(1, Math.round(s.p.jobMonths / 12)); const pay = Math.round(s.p.net * (n + 1)); E.cash(pay, 'N+1 赔偿'); E.quitJob(); E.stress(+18); return `你拿了 ${E.money(pay)} 走人。工牌在保安室交掉，刷不开门的那一下有点不真实。`; } },
      { label: '争取转岗', hidden: (s) => s.p.perf < 55 && s.p.skills.专业 < 45, apply: (c) => { const { s, E, rng } = c; if (rng.chance(0.35 + s.p.perf / 300 + s.p.skills.专业 / 400)) { s.p.gross = Math.round(s.p.gross * 0.85); E.stress(+10); return '你留下来了，换了个边缘一点的组，薪资降了一些。'; } const pay = Math.round(s.p.net * 2); E.cash(pay, '赔偿'); E.quitJob(); E.stress(+22); return '没转成。多争取了一点赔偿，还是走了。'; } },
      { label: '找关系说情', hidden: (s) => !s.npcs.some((n) => n.work && n.favor > 20), apply: (c) => c.E.pullStrings('layoff') },
    ],
  });
  ev({
    id: 'promo', tier: 'situation', weight: (s) => (s.flags.promoWindow ? 45 : 10),
    when: (s) => !!s.p.job && !s.p.track && s.p.promo > 55 && s.p.jobMonths > 10, cooldown: 30,
    title: '晋升', text: () => `组里空出一个位置。你和另一个人是候选。`,
    options: [
      { label: '正面竞争，靠业绩', apply: (c) => { const { s, E, rng } = c; const p = 0.3 + s.p.perf / 250 + s.p.skills.专业 / 400; if (rng.chance(p)) { s.p.gross = Math.round(s.p.gross * 1.28); s.p.promo = 0; s.p.title = (s.p.title || 0) + 1; E.stress(+6); return `你升了。薪资涨到 ${E.money(s.p.gross)}（税前）。`; } s.p.promo = 20; E.stress(+14); return '是另一个人。你在工位上坐了很久。'; } },
      { label: '找领导喝一顿', apply: (c) => { const { s, E, rng } = c; E.cash(-1200, '酒局'); E.health(-2); const p = 0.42 + s.p.perf / 300 + E.groupLevel('同事') / 300; if (rng.chance(p)) { s.p.gross = Math.round(s.p.gross * 1.26); s.p.promo = 0; s.p.title = (s.p.title || 0) + 1; return `酒桌上事情就定了。你升了，${E.money(s.p.gross)}（税前）。`; } s.p.promo = 20; E.stress(+16); return '喝到吐，位置还是别人的。'; } },
      { label: '算了，不争', apply: (c) => { c.E.stress(-4); c.s.p.promo = 25; return '你没去争。心里松了一口气，又有一点说不出的东西。'; } },
    ],
  });
  ev({
    id: 'pua_ot', tier: 'situation', weight: 18,
    when: (s) => !!s.p.job && s.p.jobIntensity >= 3, cooldown: 14,
    title: '这个需求今晚必须上', text: () => `晚上九点半，群里 @所有人。明天早上要看到结果。`,
    options: [
      { label: '干到凌晨', apply: (c) => { c.E.perf(+5); c.E.stress(+9); c.E.health(-1.8); return '凌晨三点打车回家。司机问你怎么这么晚，你说习惯了。'; } },
      { label: '装没看见', apply: (c) => { c.E.perf(-7); c.E.stress(+3); return '你关了手机。第二天早会上没人提，但也没人看你。'; } },
    ],
  });
  ev({
    id: 'wage_delay', tier: 'situation', weight: (s) => (s.world.ind[s.p.ind] < 35 ? 26 : 5),
    when: (s) => !!s.p.job && s.p.ind !== '体制内', cooldown: 10,
    title: '工资缓发', text: () => `财务说这个月资金周转有点问题，工资往后压半个月。`,
    options: [
      { label: '等着', apply: (c) => { c.E.flag('wageDelay', 2); c.E.stress(+8); return '你等着。房租还是要交的。'; } },
      { label: '开始投简历', apply: (c) => { c.E.stress(+6); c.E.flag('jobHunting', 6); return '你把简历更新了一遍。'; } },
    ],
  });

  /* —— 人际层 —— */
  ev({
    id: 'borrow', tier: 'social', weight: 14,
    when: (s) => s.stage !== 'hs' && s.p.cash > 20000 && s.npcs.some((n) => n.close > 40 && !n.family), cooldown: 18,
    title: '借钱', text: (c) => `有人找你借钱。`,
    dynamic: (s, rng) => { const n = rng.pick(s.npcs.filter((x) => x.close > 40 && !x.family)); const amt = Math.round(Math.min(s.p.cash * 0.4, rng.int(5000, 60000)) / 1000) * 1000; return { npc: n, amt }; },
    text2: (s, d) => `${d.npc.name}找你借 ${d.amt} 块。说是家里急用，年底一定还。\n\n你们认识 ${d.npc.years} 年了。`,
    options: [
      { label: '借', apply: (c) => { const { s, E, d, rng } = c; E.cash(-d.amt, `借给${d.npc.name}`); d.npc.owesYou = (d.npc.owesYou || 0) + d.amt; d.npc.favor += 25; d.npc.close += 8; E.schedule(rng.int(8, 30), 'repay', { npcId: d.npc.id, amt: d.amt }); return `你把钱转过去了。他说了很多感谢的话。`; } },
      { label: '推说手头也紧', apply: (c) => { const { d, E } = c; d.npc.close -= 14; d.npc.trust -= 8; E.stress(+4); return `你找了个理由。他说"没事没事"，然后聊天就冷下来了。`; } },
      { label: '借一半', apply: (c) => { const { E, d } = c; const half = Math.round(d.amt / 2); E.cash(-half, `借给${d.npc.name}`); d.npc.owesYou = half; d.npc.favor += 10; return `你借了一半。他没说什么。`; } },
    ],
  });
  ev({
    id: 'wedding', tier: 'social', weight: (s) => (s.p.age >= 23 && s.p.age <= 34 ? 22 : 6),
    when: (s) => s.p.age >= 22, cooldown: 5,
    title: '份子钱', text: () => `又有人结婚了。群里发了请柬。`,
    options: [
      { label: '去，随份子', apply: (c) => { const { s, E, rng } = c; const amt = Math.round((s.city.tier <= 2 ? 800 : 400) * rng.float(0.8, 1.8) / 100) * 100; E.cash(-amt, '份子钱'); E.relGroup('同学', +4); return `你随了 ${E.money(amt)}，吃了一顿饭，见到几个很久没见的人。`; } },
      { label: '不去，微信转账', apply: (c) => { const { s, E } = c; const amt = s.city.tier <= 2 ? 600 : 300; E.cash(-amt, '份子钱'); return `你转了 ${E.money(amt)}，发了句"新婚快乐"。`; } },
      { label: '装作没看见', apply: (c) => { c.E.relGroup('同学', -8); return '你没回。这种事不用说破，但大家都记得。'; } },
    ],
  });
  ev({
    id: 'parent_push_marry', tier: 'social', weight: (s) => Math.max(0, (s.p.age - 23) * 7),
    when: (s) => s.p.age >= 24 && !s.p.partner, cooldown: 6,
    title: '催婚', text: (s) => `又是那个电话。\n\n"你表妹都生二胎了。"`,
    options: [
      { label: '敷衍过去', apply: (c) => { c.E.stress(+6); return '"嗯，知道了，在看呢。"挂了电话，房间里很安静。'; } },
      { label: '摊牌：我暂时不想结', apply: (c) => { const { E } = c; E.rel('mother', { close: -10, trust: +6 }); E.rel('father', { close: -8, trust: +5 }); E.stress(+12); return `你说清楚了。你${pw(c.s)}哭了。但从那以后，${pw(c.s) === '妈' ? '她' : '他'}催得少了一点。`; } },
      { label: '答应去相亲', apply: (c) => { c.E.flag('willBlindDate', 3); c.E.rel('mother', { close: +6 }); return '你答应了。周末就有安排。'; } },
    ],
  });
  ev({
    id: 'scam', tier: 'social', weight: (s) => (s.flags.scamComing ? 60 : 0),
    when: (s) => s.stage !== 'hs' && s.p.cash > 30000, cooldown: 40, once: true,
    title: '稳赚的项目', text: (s) => `老同学请你吃饭，说了一个项目。年化 18%，有平台、有合同、有他自己投的截图。\n\n他很诚恳。他自己也确实投了。`,
    options: [
      { label: '投一笔', apply: (c) => { const { s, E, rng } = c; const amt = Math.round(s.p.cash * 0.5); E.cash(-amt, '投资'); E.schedule(rng.int(4, 12), 'scamBust', { amt, heavy: true }); return `你投了 ${E.money(amt)}。前两个月利息真的到账了。`; } },
      { label: '投一点试试', apply: (c) => { const { s, E, rng } = c; const amt = Math.round(Math.min(s.p.cash * 0.12, 20000)); E.cash(-amt, '投资'); E.schedule(rng.int(4, 12), 'scamBust', { amt, heavy: false }); return `你投了 ${E.money(amt)}，留了个心眼。`; } },
      { label: '不投', apply: (c) => { c.E.relGroup('同学', -4); return '你委婉地拒绝了。他有点失望。半年后你才知道自己躲过了什么。'; } },
    ],
  });

  /* —— 意外层（真随机，但概率被结构调制）—— */
  ev({
    id: 'accident_work', tier: 'accident', weight: (s) => (s.p.hazard ? 20 : 2),
    when: (s) => !!s.p.job, cooldown: 36,
    title: '工伤', text: () => `一个不留神。送到医院的时候你还在想明天的活谁干。`,
    options: [
      { label: '（无法选择）', apply: (c) => { const { s, E, rng } = c; E.health(-rng.int(10, 25)); E.stress(+18); const covered = s.p.shebao; const cost = rng.int(8000, 40000); if (covered) { E.cash(-Math.round(cost * 0.2), '自付部分'); return `工伤认定下来了，大部分能报。自付 ${E.money(Math.round(cost * 0.2))}。`; } E.cash(-cost, '医药费'); return `没有工伤保险。${E.money(cost)} 全部自己出。老板说"下次注意"。`; } },
    ],
  });
  ev({
    id: 'phone_scam', tier: 'accident', weight: 5, when: (s) => s.stage !== 'hs' && s.p.cash > 5000, cooldown: 60,
    title: '电话', text: () => `一个自称是"某某公安"的电话。对方知道你的名字、身份证号、和你上个月办的业务。`,
    options: [
      { label: '按他说的做', apply: (c) => { const { s, E } = c; const amt = Math.round(s.p.cash * 0.7); E.cash(-amt, '转账'); E.stress(+32); return `你转了 ${E.money(amt)}。挂断以后过了十分钟，你才反应过来。`; } },
      { label: '挂掉，打110核实', apply: (c) => { c.E.stress(+5); return '你挂了。派出所说这就是诈骗。你出了一身汗。'; } },
    ],
  });
  ev({
    id: 'landlord', tier: 'accident', weight: 12,
    when: (s) => s.p.housing && s.p.housing.indexOf('租') >= 0, cooldown: 14,
    title: '房东要涨租', text: (s) => `房东发消息：下个月起涨 ${Math.round(CITIES[s.p.city].rent * (s.rentAdj||1) * 0.12)}。不同意就搬。`,
    options: [
      { label: '接受', apply: (c) => { const { s, E } = c; s.rentAdj = (s.rentAdj || 1) * 1.12; E.stress(+7); return '你同意了。这个月的账又紧了一点。'; } },
      { label: '搬到更远的地方', apply: (c) => { const { s, E, rng } = c; s.rentAdj = (s.rentAdj || 1) * 0.82; E.cash(-rng.int(1500, 4000), '搬家'); s.p.commute = (s.p.commute || 1) + 0.5; E.stress(+10); E.health(-1); return '你搬到了更远的地方。通勤从四十分钟变成一个半小时。'; } },
    ],
  });

  /* —— 世界层（不看玩家，你只是读到）—— */
  ev({
    id: 'w_regulation', tier: 'world', weight: 8, when: () => true, cooldown: 40,
    title: '行业整顿', auto: true,
    apply: (c) => { const { s, rng, E } = c; const ind = rng.pick(INDUSTRIES.filter((i) => i !== '体制内')); s.world.ind[ind] = Math.max(10, s.world.ind[ind] - rng.int(15, 30)); return `【新闻】${ind}行业迎来新一轮监管。${s.p.ind === ind ? '你们公司群里今天特别安静。' : '和你暂时没关系。'}`; },
  });
  ev({
    id: 'w_boom', tier: 'world', weight: 7, when: () => true, cooldown: 40,
    title: '风口', auto: true,
    apply: (c) => { const { s, rng } = c; const ind = rng.pick(INDUSTRIES.filter((i) => i !== '体制内')); s.world.ind[ind] = Math.min(95, s.world.ind[ind] + rng.int(12, 28)); return `【新闻】${ind}突然火了，到处在招人、涨薪。${s.p.ind === ind ? '你们组一下子来了五个新人。' : '你只是在短视频里刷到。'}`; },
  });
  ev({
    id: 'w_neighbor', tier: 'world', weight: 9, when: (s) => s.p.age > 20, cooldown: 30, auto: true,
    title: '别人的人生',
    apply: (c) => { const { s, rng } = c; const n = rng.pick(s.npcs.filter((x) => !x.family)); if (!n) return null; return rng.pick([
      `${n.name}在朋友圈晒了新房，${rng.pick(CITY_LIST).name}的。定位下面一堆点赞。`,
      `${n.name}发了张体检报告，配文"还好发现得早"。`,
      `${n.name}辞职了，说要去做自己的事。评论区都在说加油。`,
      `${n.name}把朋友圈设成了三天可见。`,
      `${n.name}结婚了。你是从别人转发里知道的。`,
    ]); },
  });


  /* —— 补充事件 —— */
  ev({
    id: 'spring_festival', tier: 'social', weight: 200,
    when: (s) => s.month === 2 && s.p.age >= 18, cooldown: 10,
    title: '春节', text: (s) => `又是一年。饭桌上坐满了人。\n\n"一个月挣多少？" "买房了没？" "对象呢？"\n\n第85章：春节不是假期，是家庭关系的年度大考。`,
    options: [
      { label: '说实话', apply: (c) => { const { s, E } = c; const good = s.p.net > 9000 || s.p.house; E.rel('father', { close: good ? 6 : -4, trust: +8 }); E.rel('mother', { close: good ? 6 : -3, trust: +8 }); E.stress(good ? -4 : +12); E.relGroup('老乡', good ? +6 : -4); return good ? '你如实说了。桌上安静了一秒，然后是"我早说这孩子行"。' : `你如实说了。你${pw(s)}在旁边给你夹菜，说"慢慢来"。你姑换了个话题。`; } },
      { label: '往高了说', apply: (c) => { const { E } = c; E.relGroup('老乡', +8); E.rel('mother', { trust: -6 }); E.stress(+8); return '你把数字说大了一点。他们信了。回程的高铁上你一直在看窗外。'; } },
      { label: '不回去了', apply: (c) => { const { E } = c; E.rel('father', { close: -12 }); E.rel('mother', { close: -14 }); E.stress(-6); return `你说加班走不开。你${pw(c.s)}"哦"了一声，说"那你自己吃好点"。`; } },
    ],
  });
  ev({
    id: 'checkup_abnormal', tier: 'situation', weight: 26,
    when: (s) => s.p.health < 68 && !s.p.diseases.length, cooldown: 20,
    title: '不太对劲', text: () => `最近总觉得哪里不对。说不上来是哪里。`,
    options: [
      { label: '去医院查一下', apply: (c) => { const { s, E, rng } = c; E.cash(-900, '检查'); if (rng.chance(0.45)) { const d = rng.pick(CONTENT_DIS_EARLY); s.p.diseases.push({ id: d, months: 0 }); return `查出来了：${DISEASE_MAP[d].name}。医生说发现得早，好好治问题不大。`; } E.stress(-5); return '查了一圈，没什么大事。医生说注意休息。'; } },
      { label: '忍忍就过去了', apply: (c) => { const { E, rng } = c; E.schedule(rng.int(6, 24), 'lateDiag', {}); return '你没去。过几天好像真的好了。'; } },
    ],
  });
  ev({
    id: 'raise_talk', tier: 'situation', weight: 16,
    when: (s) => !!s.p.job && s.p.jobMonths > 14 && s.p.perf > 55, cooldown: 24,
    title: '谈涨薪', text: (s) => `你在这个岗位上一年多了，工资没动过。同期进来的那个人跳槽走了，据说涨了四成。`,
    options: [
      { label: '找领导谈', apply: (c) => { const { s, E, rng } = c; const p = 0.3 + s.p.perf / 300 + (s.world.ind[s.p.ind] > 60 ? 0.15 : -0.1); if (rng.chance(p)) {
          const up = E.raise(rng.float(1.08, 1.18));
          return up ? `谈成了。涨到 ${E.money(s.p.gross)}（税前）。`
                    : '谈成了，但只象征性地加了一点 —— 这一格的工资到头了，再想涨得换个位置。';
        } E.perf(-6); E.stress(+10); return '领导说"今年整体都紧张，明年一定考虑"。你知道这话的意思。'; } },
      { label: '不谈，先骑驴找马', apply: (c) => { c.E.flag('jobHunting', 8); c.E.stress(+4); return '你把简历更新了，没跟任何人说。'; } },
      { label: '算了', apply: (c) => { c.E.stress(+6); return '你没提。日子照过。'; } },
    ],
  });
  ev({
    id: 'parent_sick', tier: 'social',
    weight: (s) => (s.npcs.some((n) => n.family && n.alive && (n.sick || n.health < 62)) ? 40 : 0),
    when: (s) => s.p.age >= 20, cooldown: 30,
    title: '家里来电话',
    // 病的是谁就说谁。原来这里写死了「你爸」，而触发的可能是你妈；
    // 更要命的是原来两个选项都把全家人一起标成「术后恢复」——只有一个人住院。
    dynamic: (s, rng) => ({ npc: rng.pick(s.npcs.filter((n) => n.family && n.alive && (n.sick || n.health < 62))) }),
    text2: (s, d) => `凌晨的电话。你${d.npc.kind === '母亲' ? '妈' : '爸'}住院了，说是要做个手术。

「不用回来，不严重。」`,
    options: [
      { label: '立刻回去', apply: (c) => {
        const { s, E, rng, d } = c;
        const cost = rng.int(15000, 60000), pay = Math.round(cost * 0.4);
        E.cash(-pay - 1200, '医药费与路费');
        d.npc.sick = '术后恢复'; d.npc.sickMonths = 0;
        d.npc.health = Math.min(100, d.npc.health + 6);
        E.rel(d.npc.id, { close: +14, trust: +10 });
        const other = s.npcs.find((n) => n.family && n.alive && n.id !== d.npc.id);
        if (other) E.rel(other.id, { close: +8 });
        E.perf(-8); E.stress(+16);
        return `你订了最早的一班。手术花了 ${E.money(cost)}，你出了 ${E.money(pay)}。`;
      } },
      { label: '打钱，人回不去', apply: (c) => {
        const { s, E, rng, d } = c;
        const pay = rng.int(10000, 30000);
        E.cash(-pay, '给家里'); E.familyCash(+pay);
        d.npc.sick = '术后恢复'; d.npc.sickMonths = 0;
        d.npc.health = Math.min(100, d.npc.health + 3);
        E.rel(d.npc.id, { close: +2 });
        const other = s.npcs.find((n) => n.family && n.alive && n.id !== d.npc.id);
        if (other) E.rel(other.id, { close: -6 });
        E.stress(+18);
        const who = other ? '你' + (other.kind === '母亲' ? '妈' : '爸') : '你' + (d.npc.kind === '母亲' ? '妈' : '爸');
        return `你转了 ${E.money(pay)}。${who}说「你忙你的」。你在工位上坐了一下午没干活。`;
      } },
    ],
  });
  ev({
    id: 'classmate_flex', tier: 'social', weight: 14, when: (s) => s.p.age >= 22, cooldown: 12,
    title: '同学群', auto: true,
    apply: (c) => { const { s, rng } = c; const n = rng.pick(s.npcs.filter((x) => !x.family)) || { name: '一个老同学' }; return rng.pick([
      `${n.name}在群里发了张购房合同，配文"上车了"。你划过去，点了个赞。`,
      `${n.name}说他年终发了三十万。有人问真的假的，他发了个笑脸。`,
      `${n.name}问群里有没有人认识做HR的，他被裁了。群里安静了十分钟。`,
      `${n.name}结婚了，在群里发红包。你抢到 3 块 8。`,
    ]); },
  });
  ev({
    id: 'boss_pie', tier: 'situation', weight: 14, when: (s) => !!s.p.job && s.p.ind !== '体制内', cooldown: 18,
    title: '谈心', text: () => `老板单独找你聊，说了很多"公司正在爬坡"、"你是我最看好的人"、"明年上市了大家都有"。\n\n全程没提钱。`,
    options: [
      { label: '被说动了', apply: (c) => { c.E.perf(+8); c.E.promo(+6); c.E.stress(+4); return '你干得更起劲了。至少这个月是。'; } },
      { label: '听着，心里在算', apply: (c) => { c.E.stress(+3); c.E.flag('jobHunting', 6); return '你点头，回工位第一件事是刷了半小时招聘软件。'; } },
    ],
  });
  ev({
    id: 'w_house_news', tier: 'world', weight: 10, when: () => true, cooldown: 22, auto: true,
    title: '房价',
    apply: (c) => { const { s } = c; const up = s.world.priceIdx > (s.p._lastPriceIdx || 1); s.p._lastPriceIdx = s.world.priceIdx; const unit = Math.round(s.city.price * s.world.priceIdx); return `【新闻】${s.city.name}新房均价 ${unit} 元/㎡，${up ? '同比小幅上涨' : '同比回落'}。${s.p.house ? '你名下那套跟着动了。' : '和你目前没有关系。'}`; },
  });

  global.CONTENT = {
    CITIES, CITY_LIST, BACKGROUNDS, TALENTS, DISEASES, DISEASE_MAP,
    INDUSTRIES, JOBS, JOB_MAP, TRACKS, TRACK_MAP, EDU_TIERS, ACTIONS: A, EVENTS, RUMORS, RUMOR_SOURCES,
    INSTRUMENTS, INSTRUMENT_MAP, SKILL_WORDS, skillWord, pw, parentCount,
    HS_SCHOOLS, SCHOOLS, FIELD_IND, PENSION, JOB_IND,
    MAJORS, MAJOR_MAP, LEVEL_EXP, LEVEL_NAMES, majorLevel, majorProgress, majorToSkill,
  };
})(window);
