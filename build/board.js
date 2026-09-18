/* 岗位板的新版渲染。由 patch_board.py 替换进 js/ui.js。
   左栏滚动列表（对口优先，行内直接给底薪和录用率），右栏常驻详情。 */
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

