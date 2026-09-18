/* 把散岗接到职业线上。
   在这之前，148 个岗位里只有 40 个（各条线的第一格）有「争取晋升」，
   剩下 108 个——恰恰是大厂算法、投行承做、主治医师这些真正有人去投的——
   进去就是干到被裁为止。

   一个散岗不是新的一条线，它是某条线中间的某一格：
   「三甲医院 · 普外科主治医师」就是医师线的主治那一格，
   「互联网大厂 · 后端研发」就是研发线上工资对得上的那一格。
   所以这里只写它属于哪条线，进哪一格由工资自动对齐 —— 免得手填 97 次还填错。

   真的没有下一格的，写清楚为什么。玩家该看见「这里到头了」，
   而不是看见按钮凭空消失。 */
(function (global) {
  'use strict';
  const C = global.CONTENT;

  /* 散岗 → 职业线 */
  const MAP = {
    /* ── 互联网 ── */
    algo: 'dev', bigtech_dev: 'dev', dev_mid: 'dev', dev_sme: 'dev',
    pm: 'pm', game_numeric: 'pm',
    dev_onsite: 'outsource', test_manual: 'outsource', it_onsite: 'outsource', data_label: 'outsource',

    /* ── 医疗 ── */
    attending_surgeon: 'doctor', resident_3a: 'doctor', community_gp: 'doctor',
    cdc_phys: 'doctor', dentist_private: 'doctor',
    nurse_ward: 'nurse', hospice_nurse: 'nurse',
    radiology_tech: 'medtech', pharmacist_hosp: 'medtech',
    medical_rep: 'medsales', device_rep: 'medsales',
    hosp_caregiver: 'caregiver',
    pharm_clerk: 'retail',

    /* ── 金融 ── */
    fin_fund_research: 'ib', fin_ib: 'ib', fin_bad_asset: 'ib',
    fin_fp_analyst: 'account', fin_tax_advisor: 'account',
    fin_audit_firm: 'account', fin_agency_acct: 'account',
    fin_credit_risk: 'bank', fin_rural_bank: 'bank', fin_broker_branch: 'bank',
    fin_insur_agent: 'insur', fin_loan_broker: 'insur',

    /* ── 教育 ── */
    edu_key_high: 'teacher', edu_bianzhi: 'teacher', edu_special: 'teacher',
    edu_tegang: 'teacher', edu_public_contract: 'teacher',
    edu_jiaoyanyuan: 'teacher', edu_competition_coach: 'teacher',
    edu_uni_faculty: 'univ', edu_counselor: 'univ', phd_cand: 'univ',
    edu_private_school: 'edu_private', edu_org_teacher: 'edu_private', edu_tuoguan: 'edu_private',
    edu_kinder_teacher: 'kinder',

    /* ── 体制内 ── */
    gov_city_civil: 'civil', gov_town_civil: 'civil', gov_lixuan: 'civil',
    gov_xuandiao: 'civil', gov_tobacco: 'civil',
    notary: 'shiye', gov_county_shiye: 'shiye',
    guoqi_it: 'soe', gov_powergrid: 'soe', gov_chengtou: 'soe',
    gov_enforce: 'enforce', gov_auxpolice: 'auxpolice',

    /* ── 制造 ── */
    chip_digital: 'mfg_rd', hw_embedded: 'mfg_rd', mech_designer: 'mfg_rd', elec_commission: 'mfg_rd',
    nev_process: 'mfg_process', ndt_rt: 'mfg_process', mfg_pc_qc: 'mfg_process',
    mfg_line_op: 'mfg_line',

    /* ── 建筑 ── */
    con_pm: 'construct', con_supervisor: 'construct', con_site_eng: 'construct',
    arch_lead: 'archdesign', arch_designer: 'archdesign', arch_assist: 'archdesign',
    struct_designer: 'archdesign',
    cost_engineer: 'cost',
    labor_sub: 'site_trade', deco_trade: 'site_trade', rope_access: 'site_trade',

    /* ── 物流 ── */
    logi_planner: 'warehouse',
    fleet_owner: 'rider', truck_city: 'rider', courier: 'rider',

    /* ── 服务 ── */
    ka_manager: 'sales',
    realty_agent: 'realty',
    store_mgr: 'retail', retail_guide: 'retail', hotel_front: 'retail',
    yuesao: 'domestic',
    security_guard: 'guard',
    lawyer_junior: 'lawyer',

    /* ── 文化传媒 ── */
    news_reporter: 'media', drama_writer: 'media',
    gd_designer: 'design', mcn_edit: 'design',
    live_host: 'streamer',
  };

  /* 真的没有下一格的位置。这不是遗漏，是这份工作本身的样子。 */
  const NO_LADDER = {
    gray_offshore: '这里没有职级，也没有人事。做多久都是这个数，走的那天什么也带不走。',
    startup_founder: '你就是最上面那一格。往上没有人可以提你 —— 只有把公司做成，或者做没。',
    aesth_injector: '从跳出公立那天起，你的职称就停在那儿了。这行按提成算钱，不按台阶算人。',
    edu_private_tutor: '雇主家里没有职级表。这份工作会在孩子出国那天结束，不会在你升职那天结束。',
    gov_sanzhi: '两年服务期，合同上写得清清楚楚。两年之后的事，合同上一个字都没有。',
    gov_community: '这个岗位不在编制序列里。转编的名额一年零到一个，排队的有十几个 —— 那不是靠干出来的。',
    gov_gridworker: '第三方派遣。干得再好也不会转成社区专职，更不会有编 —— 这条路上面没有下一级台阶。',
    legal_counsel: '一个人的法务部，干十年还是一个人的法务部。这个岗位上面没有下一级。',
    shop_owner: '你就是老板。上面没有人了 —— 往上只能是开第二家店，那是另一回事。',
    ghost_writer: '没有署名，也就没有职级。写得越好越没人知道你写过。',
    freelance_trans: '自由译者没有上级，也没有台阶。单价由市场定，而市场这些年一直在往下走。',
  };

  /* 进哪一格：工资最接近的那一格。
     再夹一道 —— 至少留一格可升，否则接上线和没接上是一回事。 */
  function rankByPay(tr, gross) {
    let best = 0, bestD = Infinity;
    tr.ranks.forEach((r, i) => {
      const d = Math.abs(r.gross - gross);
      if (d < bestD) { bestD = d; best = i; }
    });
    return Math.min(best, tr.ranks.length - 2);
  }

  let linked = 0, dead = 0, miss = [];
  C.JOBS.forEach((j) => {
    if (j.track) return;                       // 各条线的第一格，已经有线了
    if (NO_LADDER[j.id]) { j.noLadder = NO_LADDER[j.id]; dead++; return; }
    const tid = MAP[j.id];
    if (!tid) { miss.push(j.id); return; }
    const tr = C.TRACK_MAP[tid];
    if (!tr) { miss.push(j.id + '→' + tid); return; }
    j.track = tid;
    j.atRank = rankByPay(tr, j.gross);
    linked++;
  });

  C.JOBTRACK_REPORT = { linked, dead, miss };
})(window);
