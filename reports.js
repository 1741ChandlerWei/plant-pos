// ==================== REPORTS MODULE ====================
function buildRepTabs() {
  const tabs = [
    { id: 'summary', label: 'Tháng / 月度' },
    { id: 'orders', label: 'Đơn / 訂單' },
    { id: 'members', label: 'TV / 成員' },
    { id: 'plants-sold', label: 'Cây / 植物銷售' },
    { id: 'invstatus', label: 'Kho / 庫存' },
    { id: 'rehab-log', label: 'CS / 修整' },
    { id: 'writeoff', label: 'Hao hụt / 報廢' },
    { id: 'purchase', label: 'Nhập / 進貨' },
  ];
  if (ROLE === 'owner') tabs.push({ id: 'admin', label: 'Cài đặt / 設定' });
  document.getElementById('rep-tabs').innerHTML = tabs.map((t, i) =>
    `<button class="tab${i === 0 ? ' active' : ''}" id="rtab-${t.id}" onclick="repTab('${t.id}')">${t.label}</button>`
  ).join('');
  repTab('summary');
}

function repTab(t) {
  const all = ['summary','orders','members','plants-sold','invstatus','rehab-log','writeoff','purchase','admin'];
  all.forEach(x => {
    const tb = document.getElementById('rtab-' + x);
    if (tb) tb.classList.toggle('active', x === t);
    const el = document.getElementById('rep-' + x);
    if (el) el.style.display = x === t ? 'block' : 'none';
  });
  const fn = {
    summary: renderRepSummary,
    orders: renderRepOrders,
    members: renderRepMembers,
    'plants-sold': renderRepPlantsSold,
    invstatus: renderInvStatus,
    'rehab-log': renderRehabLog,
    writeoff: renderWriteoffRep,
    purchase: renderPur,
    admin: renderAdmin
  };
  if (fn[t]) fn[t]();
}

function renderRepSummary() {
  const completed = DATA.orders.filter(o => o.status === 'completed');
  const tv = completed.reduce((s, o) => s + o.total, 0);
  const tp = completed.reduce((s, o) => s + o.profit, 0);
  const am = tv > 0 ? (tp / tv * 100).toFixed(1) : 0;
  let h = `<div style="margin:12px 16px 4px;display:flex;justify-content:space-between;align-items:center">
    <span style="font-size:13px;font-weight:500">Tổng hợp tháng / 月度摘要</span>
    <button class="csv-btn" onclick="exportCSV('summary')">⬇ Xuất CSV</button>
  </div>
  <div class="metrics">
    <div class="metric"><div class="ml">Tổng doanh thu / 總營收</div><div class="mv blue">${vnd(tv)}</div></div>
    <div class="metric"><div class="ml">Tổng lợi nhuận / 總毛利</div><div class="mv green">${vnd(tp)}</div></div>
    <div class="metric"><div class="ml">Tỷ lệ LN TB / 平均毛利率</div><div class="mv">${am}%</div></div>
    <div class="metric"><div class="ml">Tổng đơn / 訂單總數</div><div class="mv">${completed.length}</div></div>
  </div>`;
  const monthly = {};
  completed.forEach(o => {
    const k = monthKey(o.order_date);
    if (!monthly[k]) monthly[k] = { label: monthLabel(o.order_date), rev: 0, profit: 0, count: 0 };
    monthly[k].rev += o.total; monthly[k].profit += o.profit; monthly[k].count++;
  });
  h += '<div style="padding:0 16px">';
  Object.keys(monthly).sort().reverse().forEach(k => {
    const m = monthly[k];
    const mg = m.rev > 0 ? (m.profit / m.rev * 100).toFixed(1) : 0;
    const mgc = parseFloat(mg) > 40 ? 'var(--green)' : parseFloat(mg) > 20 ? 'var(--amber)' : 'var(--red)';
    h += `<div style="background:var(--bg2);border:1px solid var(--border);border-radius:var(--rl);padding:15px;margin-bottom:12px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:11px">
        <span style="font-size:14px;font-weight:700">${m.label}</span>
        <button onclick="goOrdersFiltered('${k}')" style="background:var(--bbg);color:var(--blue);border:1px solid var(--bborder);border-radius:100px;padding:3px 12px;font-size:12px;cursor:pointer;font-family:inherit">${m.count} đơn →</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px">
        <div style="background:var(--bg3);border-radius:var(--r);padding:9px"><div style="font-size:9px;color:var(--text2)">Doanh thu / 營收</div><div style="font-size:11px;font-weight:700;font-family:DM Mono,monospace;color:var(--blue)">${vnd(m.rev)}</div></div>
        <div style="background:var(--bg3);border-radius:var(--r);padding:9px"><div style="font-size:9px;color:var(--text2)">Lợi nhuận / 毛利</div><div style="font-size:11px;font-weight:700;font-family:DM Mono,monospace;color:var(--green)">${vnd(m.profit)}</div></div>
        <div style="background:var(--bg3);border-radius:var(--r);padding:9px"><div style="font-size:9px;color:var(--text2)">Tỷ lệ / 毛利率</div><div style="font-size:11px;font-weight:700;color:${mgc}">${mg}%</div></div>
      </div>
    </div>`;
  });
  h += '</div>';
  document.getElementById('rep-summary').innerHTML = h;
}

let repOrdersMonth = null;
function renderRepOrders(filterMonth) {
  if (filterMonth !== undefined) repOrdersMonth = filterMonth;
  const allOrders = DATA.orders.filter(o => o.status === 'completed');
  const allMonths = [...new Set(allOrders.map(o => o.order_date.substring(0, 7)))].sort().reverse();
  const completed = repOrdersMonth ? allOrders.filter(o => o.order_date.startsWith(repOrdersMonth)) : allOrders;
  let h = `<div style="margin:12px 16px 4px;display:flex;justify-content:space-between;align-items:center">
    <span style="font-size:13px;font-weight:500">Chi tiết đơn hàng / 訂單明細</span>
    <button class="csv-btn" onclick="exportCSV('orders')">⬇ Xuất CSV</button>
  </div>
  <div style="padding:4px 16px 10px;display:flex;align-items:center;gap:8px">
    <span style="font-size:11px;color:var(--text2);flex-shrink:0">月份 / Tháng</span>
    <select onchange="renderRepOrders(this.value||null)" style="flex:1;padding:6px 10px;background:var(--bg2);border:1px solid var(--border2);border-radius:var(--r);color:var(--text);font-family:inherit;font-size:13px;cursor:pointer">
      <option value="">全部</option>
      ${allMonths.map(m => { const [yr, mo] = m.split('-'); return \`<option value="\${m}" \${repOrdersMonth === m ? 'selected' : ''}>\${yr}年\${mo}月</option>\`; }).join('')}
    </select>
  </div>
  <div style="overflow-x:auto;margin:0 16px">
  <table style="width:100%;border-collapse:collapse;font-size:11px">
  <tr style="background:var(--bg3);color:var(--text2)">
    <th style="padding:8px 6px;text-align:left;border-bottom:1px solid var(--border)"># / 編號</th>
    <th style="padding:8px 6px;text-align:left;border-bottom:1px solid var(--border)">Ngày / 日期</th>
    <th style="padding:8px 6px;text-align:left;border-bottom:1px solid var(--border)">Khách / 客戶</th>
    <th style="padding:8px 6px;text-align:right;border-bottom:1px solid var(--border)">Tổng / 金額</th>
    <th style="padding:8px 6px;text-align:right;border-bottom:1px solid var(--border)">LN / 毛利</th>
    <th style="padding:8px 6px;text-align:right;border-bottom:1px solid var(--border)">LN% / 毛利率</th>
    <th style="padding:8px 6px;text-align:left;border-bottom:1px solid var(--border)">Người bán / 成交人</th>
  </tr>`;
  completed.forEach(o => {
    const mg = o.total > 0 ? (o.profit / o.total * 100).toFixed(0) : 0;
    const items = (o.order_items || []).map(i => i.item_name + (i.qty > 1 ? ' ×' + i.qty : '')).join('、');
    h += `<tr style="border-bottom:1px solid var(--border);cursor:pointer" onclick="showReceipt(${o.id})">
      <td style="padding:8px 6px;color:var(--amber);font-family:DM Mono,monospace;font-weight:600">#${String(o.id).padStart(4,'0')}</td>
      <td style="padding:8px 6px;color:var(--text2)">${o.order_date.slice(5)}</td>
      <td style="padding:8px 6px"><div style="font-weight:500">${o.customer}</div><div style="font-size:10px;color:var(--text2);margin-top:2px">${items || '-'}</div></td>
      <td style="padding:8px 6px;text-align:right;font-family:DM Mono,monospace">${vnd(o.total)}</td>
      <td style="padding:8px 6px;text-align:right;color:var(--green);font-family:DM Mono,monospace">${vnd(o.profit)}</td>
      <td style="padding:8px 6px;text-align:right;color:var(--green)">${mg}%</td>
      <td style="padding:8px 6px;color:var(--text2)">${o.seller}</td>
    </tr>`;
  });
  h += '</table></div>';
  document.getElementById('rep-orders').innerHTML = h;
}

function renderRepMembers() {
  const completed = DATA.orders.filter(o => o.status === 'completed');
  const members = {};
  completed.forEach(o => {
    if (!members[o.seller]) members[o.seller] = { rev: 0, profit: 0, count: 0 };
    members[o.seller].rev += o.total; members[o.seller].profit += o.profit; members[o.seller].count++;
  });
  let h = `<div style="margin:12px 16px 4px;display:flex;justify-content:space-between;align-items:center">
    <span style="font-size:13px;font-weight:500">Doanh số thành viên / 成員業績</span>
    <button class="csv-btn" onclick="exportCSV('members')">⬇ Xuất CSV</button>
  </div><div style="padding:0 16px">`;
  Object.keys(members).forEach(name => {
    const m = members[name];
    const mg = m.rev > 0 ? (m.profit / m.rev * 100).toFixed(1) : 0;
    h += `<div style="background:var(--bg2);border:1px solid var(--border);border-radius:var(--rl);padding:14px;margin-bottom:12px">
      <div style="font-size:15px;font-weight:600;margin-bottom:10px">${name}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px">
        <div style="background:var(--bg3);border-radius:var(--r);padding:9px"><div style="font-size:9px;color:var(--text2)">Số đơn / 筆數</div><div style="font-size:16px;font-weight:700">${m.count}</div></div>
        <div style="background:var(--bg3);border-radius:var(--r);padding:9px"><div style="font-size:9px;color:var(--text2)">Doanh thu / 營收</div><div style="font-size:13px;font-weight:700;font-family:DM Mono,monospace;color:var(--blue)">${vnd(m.rev)}</div></div>
        <div style="background:var(--bg3);border-radius:var(--r);padding:9px"><div style="font-size:9px;color:var(--text2)">Lợi nhuận / 毛利</div><div style="font-size:13px;font-weight:700;font-family:DM Mono,monospace;color:var(--green)">${vnd(m.profit)}</div></div>
        <div style="background:var(--bg3);border-radius:var(--r);padding:9px"><div style="font-size:9px;color:var(--text2)">Tỷ lệ / 毛利率</div><div style="font-size:14px;font-weight:700;color:var(--green)">${mg}%</div></div>
      </div>
    </div>`;
  });
  h += '</div>';
  document.getElementById('rep-members').innerHTML = h;
}

let repPlantsSoldMonth = null;
function renderRepPlantsSold(filterMonth) {
  if (filterMonth !== undefined) repPlantsSoldMonth = filterMonth;
  const allOrders = DATA.orders.filter(o => o.status === 'completed');
  const allMonths = [...new Set(allOrders.map(o => o.order_date.substring(0, 7)))].sort().reverse();
  const ps = {};
  const filteredOrders = repPlantsSoldMonth ? allOrders.filter(o => o.order_date.startsWith(repPlantsSoldMonth)) : allOrders;
  filteredOrders.forEach(o => {
    (o.order_items || []).forEach(item => {
      if (!ps[item.item_name]) ps[item.item_name] = { qty: 0, rev: 0, profit: 0 };
      ps[item.item_name].qty += item.qty;
      ps[item.item_name].rev += item.price * item.qty;
      ps[item.item_name].profit += (item.price - item.cost) * item.qty;
    });
  });
  let h = `<div style="margin:12px 16px 4px;display:flex;justify-content:space-between;align-items:center">
    <span style="font-size:13px;font-weight:500">Thống kê doanh số cây / 植物銷售統計</span>
    <button class="csv-btn" onclick="exportCSV('plants-sold')">⬇ Xuất CSV</button>
  </div>
  <div style="padding:4px 16px 10px;display:flex;align-items:center;gap:8px">
    <span style="font-size:11px;color:var(--text2);flex-shrink:0">月份 / Tháng</span>
    <select onchange="renderRepPlantsSold(this.value||null)" style="flex:1;padding:6px 10px;background:var(--bg2);border:1px solid var(--border2);border-radius:var(--r);color:var(--text);font-family:inherit;font-size:13px;cursor:pointer">
      <option value="">全部</option>
      \${allMonths.map(m => { const [yr, mo] = m.split('-'); return \`<option value="\${m}" \${repPlantsSoldMonth === m ? 'selected' : ''}>\${yr}年\${mo}月</option>\`; }).join('')}
    </select>
  </div>
  <div style="overflow-x:auto;margin:0 16px">
  <table style="width:100%;border-collapse:collapse;font-size:11px">
  <tr style="background:var(--bg3);color:var(--text2)">
    <th style="padding:8px 6px;text-align:left;border-bottom:1px solid var(--border)">Tên cây / 品名</th>
    <th style="padding:8px 6px;text-align:right;border-bottom:1px solid var(--border)">SL / 數量</th>
    <th style="padding:8px 6px;text-align:right;border-bottom:1px solid var(--border)">Doanh thu / 營收</th>
    <th style="padding:8px 6px;text-align:right;border-bottom:1px solid var(--border)">LN / 毛利</th>
    <th style="padding:8px 6px;text-align:right;border-bottom:1px solid var(--border)">LN% / 毛利率</th>
  </tr>`;
  Object.keys(ps).sort((a, b) => ps[b].rev - ps[a].rev).forEach(name => {
    const s = ps[name];
    const mg = s.rev > 0 ? (s.profit / s.rev * 100).toFixed(0) : 0;
    h += `<tr style="border-bottom:1px solid var(--border)">
      <td style="padding:8px 6px;font-weight:500">${name}</td>
      <td style="padding:8px 6px;text-align:right">${s.qty}</td>
      <td style="padding:8px 6px;text-align:right;font-family:DM Mono,monospace">${vnd(s.rev)}</td>
      <td style="padding:8px 6px;text-align:right;color:var(--green);font-family:DM Mono,monospace">${vnd(s.profit)}</td>
      <td style="padding:8px 6px;text-align:right;color:var(--green)">${mg}%</td>
    </tr>`;
  });
  h += '</table></div>';
  document.getElementById('rep-plants-sold').innerHTML = h;
}

// 庫存狀態 — 加月份頁籤
let invStatusMonth = null;
function renderInvStatus(filterMonth) {
  if (filterMonth !== undefined) invStatusMonth = filterMonth;
  const active = DATA.plants.filter(p => p.status === 'ok').sort((a, b) => daysSince(b.purchase_date) - daysSince(a.purchase_date));

  // 月份頁籤
  const allMonths = [...new Set(active.map(p => p.purchase_date.substring(0, 7)))].sort().reverse();
  let h = `<div style="margin:12px 16px 4px;display:flex;justify-content:space-between;align-items:center">
    <span style="font-size:13px;font-weight:500">Trạng thái kho / 當前庫存狀態</span>
    <button class="csv-btn" onclick="exportCSV('invstatus')">⬇ Xuất CSV</button>
  </div>`;

  // 月份篩選下拉選單
  h += `<div style="padding:4px 16px 10px;display:flex;align-items:center;gap:8px">
    <span style="font-size:11px;color:var(--text2);flex-shrink:0">月份 / Tháng</span>
    <select onchange="renderInvStatus(this.value||null)" style="flex:1;padding:6px 10px;background:var(--bg2);border:1px solid var(--border2);border-radius:var(--r);color:var(--text);font-family:inherit;font-size:13px;cursor:pointer">
      <option value="">全部</option>
      ${allMonths.map(m => { const [yr, mo] = m.split('-'); return `<option value="${m}" ${invStatusMonth === m ? 'selected' : ''}>${yr}年${mo}月</option>`; }).join('')}
    </select>
  </div>`;

  const filtered = invStatusMonth ? active.filter(p => p.purchase_date.startsWith(invStatusMonth)) : active;

  h += `<div style="overflow-x:auto;margin:0 16px">
  <table style="width:100%;border-collapse:collapse;font-size:11px">
  <tr style="background:var(--bg3);color:var(--text2)">
    <th style="padding:8px 6px;text-align:left;border-bottom:1px solid var(--border)">Cây / 植物</th>
    <th style="padding:8px 6px;text-align:left;border-bottom:1px solid var(--border)">Vị trí / 位置</th>
    <th style="padding:8px 6px;text-align:right;border-bottom:1px solid var(--border)">Ngày / 天數</th>
    <th style="padding:8px 6px;text-align:right;border-bottom:1px solid var(--border)">Giá vốn HT / 當前成本</th>
    <th style="padding:8px 6px;text-align:right;border-bottom:1px solid var(--border)">預估LN / Est.毛利</th>
    <th style="padding:8px 6px;text-align:right;border-bottom:1px solid var(--border)">預估LN% / Est.毛利率</th>
  </tr>`;
  filtered.forEach(p => {
    const days = daysSince(p.purchase_date);
    const ac = agedCost(p.cost_vnd, p.purchase_date);
    const mg = margin(p.price, p.cost_vnd, p.purchase_date);
    const mgc = parseFloat(mg) > 30 ? 'var(--green)' : 'var(--red)';
    const profit = p.price - ac;
    h += `<tr style="border-bottom:1px solid var(--border)">
      <td style="padding:8px 6px;font-weight:500">${p.name} ×${p.qty}</td>
      <td style="padding:8px 6px"><span class="${LOC_CLASS[p.loc]}">${LOC_LABELS[p.loc]}</span></td>
      <td style="padding:8px 6px;text-align:right">${days}</td>
      <td style="padding:8px 6px;text-align:right;font-family:DM Mono,monospace">${vnd(ac)}</td>
      <td style="padding:8px 6px;text-align:right;color:var(--green);font-family:DM Mono,monospace">${vnd(profit)}</td>
      <td style="padding:8px 6px;text-align:right;color:${mgc}">${mg}%</td>
    </tr>`;
  });
  h += '</table></div>';
  document.getElementById('rep-invstatus').innerHTML = h;
}

function renderRehabLog() {
  let h = `<div style="margin:12px 16px 4px;display:flex;justify-content:space-between;align-items:center">
    <span style="font-size:13px;font-weight:500">Lịch sử chỉnh sửa / 修整記錄</span>
    <button class="csv-btn" onclick="exportCSV('rehab-log')">⬇ Xuất CSV</button>
  </div>`;
  if (DATA.rehab.length === 0) {
    h += '<div style="padding:24px;text-align:center;color:var(--text3)">Không có / 無修整記錄</div>';
    document.getElementById('rep-rehab-log').innerHTML = h; return;
  }
  h += `<div style="overflow-x:auto;margin:0 16px"><table style="width:100%;border-collapse:collapse;font-size:11px">
  <tr style="background:var(--bg3);color:var(--text2)">
    <th style="padding:8px 6px;text-align:left;border-bottom:1px solid var(--border)">Mã / 編號</th>
    <th style="padding:8px 6px;text-align:left;border-bottom:1px solid var(--border)">Cây / 植物</th>
    <th style="padding:8px 6px;text-align:right;border-bottom:1px solid var(--border)">Ngày kho / 在庫天</th>
    <th style="padding:8px 6px;text-align:right;border-bottom:1px solid var(--border)">Ngày CS / 修整天</th>
    <th style="padding:8px 6px;text-align:left;border-bottom:1px solid var(--border)">Trạng thái / 狀態</th>
    <th style="padding:8px 6px;text-align:left;border-bottom:1px solid var(--border)">Lý do / 原因</th>
  </tr>`;
  DATA.rehab.forEach(r => {
    const statusMap = { rehab: '修整中', tracking: '待販售', available: '可販售', sold: '已售出', writeoff: '報廢' };
    const statusColor = { rehab: 'var(--amber)', tracking: 'var(--blue)', available: 'var(--acc)', sold: 'var(--green)', writeoff: 'var(--red)' };
    h += `<tr style="border-bottom:1px solid var(--border)">
      <td style="padding:8px 6px;color:var(--amber);font-family:DM Mono,monospace">${r.rid}</td>
      <td style="padding:8px 6px">${r.plant_name} ×${r.qty}</td>
      <td style="padding:8px 6px;text-align:right">${daysSince(r.purchase_date)}</td>
      <td style="padding:8px 6px;text-align:right;color:var(--red)">${daysSince(r.rehab_date)}</td>
      <td style="padding:8px 6px;color:${statusColor[r.status] || 'var(--text2)'}">${statusMap[r.status] || r.status}</td>
      <td style="padding:8px 6px;color:var(--text2)">${r.note || '-'}</td>
    </tr>`;
  });
  h += '</table></div>';
  document.getElementById('rep-rehab-log').innerHTML = h;
}

function renderWriteoffRep() {
  const totalQty = DATA.writeoffs.reduce((s, w) => s + w.qty, 0);
  const totalCost = DATA.writeoffs.reduce((s, w) => s + (w.cost || 0), 0);
  let h = `<div style="margin:12px 16px 4px;display:flex;justify-content:space-between;align-items:center">
    <span style="font-size:13px;font-weight:500">Danh sách hao hụt / 死亡報廢記錄</span>
    <button class="csv-btn" onclick="exportCSV('writeoff')">⬇ Xuất CSV</button>
  </div>
  <div class="metrics" style="margin-bottom:8px">
    <div class="metric"><div class="ml">Tổng hao hụt / 報廢總數</div><div class="mv red">${totalQty}株</div></div>
    <div class="metric"><div class="ml">Chi phí thiệt hại / 損失成本</div><div class="mv red">${vnd(totalCost)}</div></div>
  </div>`;
  if (DATA.writeoffs.length === 0) {
    h += '<div style="padding:24px;text-align:center;color:var(--text3)">Chưa có ghi nhận / 無報廢記錄</div>';
    document.getElementById('rep-writeoff').innerHTML = h; return;
  }
  h += `<div style="overflow-x:auto;margin:0 16px"><table style="width:100%;border-collapse:collapse;font-size:11px">
  <tr style="background:var(--bg3);color:var(--text2)">
    <th style="padding:8px 6px;text-align:left;border-bottom:1px solid var(--border)">Ngày / 日期</th>
    <th style="padding:8px 6px;text-align:left;border-bottom:1px solid var(--border)">Cây / 植物</th>
    <th style="padding:8px 6px;text-align:right;border-bottom:1px solid var(--border)">SL / 數量</th>
    <th style="padding:8px 6px;text-align:right;border-bottom:1px solid var(--border)">Thiệt hại / 損失</th>
    <th style="padding:8px 6px;text-align:left;border-bottom:1px solid var(--border)">Lý do / 原因</th>
  </tr>`;
  DATA.writeoffs.forEach(w => {
    h += `<tr style="border-bottom:1px solid var(--border)">
      <td style="padding:8px 6px;color:var(--text2)">${w.writeoff_date}</td>
      <td style="padding:8px 6px;font-weight:500">${w.plant_name}</td>
      <td style="padding:8px 6px;text-align:right;color:var(--red)">${w.qty}株</td>
      <td style="padding:8px 6px;text-align:right;font-family:DM Mono,monospace;color:var(--red)">${vnd(w.cost || 0)}</td>
      <td style="padding:8px 6px;color:var(--text2)">${w.reason}</td>
    </tr>`;
  });
  h += '</table></div>';
  document.getElementById('rep-writeoff').innerHTML = h;
}

// 進貨記錄 — 加月份頁籤
let purFilterMonth = null;
function renderPur(filterMonth) {
  if (filterMonth !== undefined) purFilterMonth = filterMonth;
  const tv = DATA.purchases.reduce((s, p) => s + p.total_vnd, 0);

  // 月份頁籤
  const allMonths = [...new Set(DATA.purchases.map(p => p.purchase_date.substring(0, 7)))].sort().reverse();

  let h = `<div style="margin:12px 16px 4px;display:flex;justify-content:space-between;align-items:center">
    <span style="font-size:13px;font-weight:500">Lịch sử nhập hàng / 進貨記錄</span>
    <button class="csv-btn" onclick="exportCSV('purchase')">⬇ Xuất CSV</button>
  </div>
  <div class="metrics" style="margin-bottom:8px">
    <div class="metric"><div class="ml">Số lô / 批次數</div><div class="mv">${DATA.purchases.length}</div></div>
    <div class="metric"><div class="ml">Tổng chi phí / 總進貨成本</div><div class="mv amber">${vnd(tv)}</div></div>
  </div>`;

  // 月份篩選下拉選單
  h += `<div style="padding:4px 16px 10px;display:flex;align-items:center;gap:8px">
    <span style="font-size:11px;color:var(--text2);flex-shrink:0">月份 / Tháng</span>
    <select onchange="renderPur(this.value||null)" style="flex:1;padding:6px 10px;background:var(--bg2);border:1px solid var(--border2);border-radius:var(--r);color:var(--text);font-family:inherit;font-size:13px;cursor:pointer">
      <option value="">全部</option>
      ${allMonths.map(m => { const [yr, mo] = m.split('-'); return `<option value="${m}" ${purFilterMonth === m ? 'selected' : ''}>${yr}年${mo}月</option>`; }).join('')}
    </select>
  </div>`;

  h += `<div style="padding:0 16px 10px;display:flex;justify-content:flex-end">
    <button class="btn btnp btnsm" onclick="openM('m-newpur')">+ Thêm lô / 新增進貨</button>
  </div>`;

  const filtered = purFilterMonth ? DATA.purchases.filter(p => p.purchase_date.startsWith(purFilterMonth)) : DATA.purchases;

  filtered.forEach(p => {
    const items = p.purchase_items || [];
    h += `<div style="background:var(--bg2);border:1px solid var(--border);border-radius:var(--rl);padding:14px;margin:0 16px 10px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <div><span style="font-weight:500;font-size:14px">${p.vendor}</span><span style="color:var(--text2);font-size:12px;margin-left:8px">${p.purchase_date}</span></div>
        <span class="badge bb">${items.reduce((s, i) => s + i.qty, 0)}株</span>
      </div>
      ${p.note ? `<div style="font-size:11px;color:var(--text2);margin-bottom:8px">${p.note}</div>` : ''}
      ${items.map(i => `<div style="display:flex;justify-content:space-between;font-size:11px;padding:3px 0;border-bottom:1px solid var(--border)"><span>${i.item_name} × ${i.qty}</span><span style="color:var(--text2)">${vnd(i.total_vnd)}</span></div>`).join('')}
      <div style="display:flex;justify-content:flex-end;margin-top:8px"><span style="font-weight:700;font-family:DM Mono,monospace">${vnd(p.total_vnd)}</span></div>
    </div>`;
  });
  document.getElementById('rep-purchase').innerHTML = h;
}

// ADMIN
function renderAdmin() {
  let h = '<div style="height:12px"></div>';
  h += `<div class="admin-section">
    <div class="admin-title">Cài đặt hệ thống / 系統設定</div>
    <div style="padding:14px 16px">
      <div class="field"><label class="flabel">Tỷ giá: 1 NTD = ? VND / 匯率</label><input class="inp" id="cfg-rate" type="number" value="${CFG.rate}"></div>
      <div class="field"><label class="flabel">Chi phí tăng/tháng (VND) / 每月成本增加</label><input class="inp" id="cfg-monthly-inc" type="number" value="${CFG.monthly_inc}"></div>
      <div class="field"><label class="flabel">Giới hạn tăng tối đa (VND) / 最高上限</label><input class="inp" id="cfg-max-inc" type="number" value="${CFG.max_inc}"></div>
      <button class="btn btnp btnf" onclick="saveAdminConfig()">Lưu cài đặt / 儲存設定</button>
    </div>
  </div>`;
  h += `<div class="admin-section">
    <div class="admin-title">Quản lý cây / 植物管理</div>`;
  DATA.plants.filter(p => p.status === 'ok').forEach(p => {
    h += `<div class="admin-row">
      <div><div style="font-size:13px;font-weight:500">${p.name}</div><div style="font-size:11px;color:var(--text2)">${vnd(p.price)} · ${p.qty}株 · <span class="${LOC_CLASS[p.loc]}">${LOC_LABELS[p.loc]}</span></div></div>
      <button class="btn btns btnsm" onclick="openEditPlant(${p.id})">Sửa / 編輯</button>
    </div>`;
  });
  h += '</div>';
  h += `<div class="admin-section">
    <div class="admin-title">Quản lý tấm gỗ / 板子管理</div>`;
  DATA.boards.forEach(b => {
    h += `<div class="admin-row">
      <div><div style="font-size:13px;font-weight:500">${b.name}</div><div style="font-size:11px;color:var(--text2)">${vnd(b.price)} · 總 ${b.qty_mine + b.qty_quang + b.qty_helper}</div></div>
      <button class="btn btns btnsm" onclick="openEditBoard(${b.id})">Sửa / 編輯</button>
    </div>`;
  });
  h += `<div style="padding:12px 16px"><button class="btn btns btnf" onclick="openEditBoard(0)">+ Thêm loại tấm / 新增板子</button></div></div>`;
  h += `<div class="admin-section">
    <div class="admin-title">Đặt lại mật khẩu / 重設密碼</div>
    <div style="padding:14px 16px">
      <div class="field"><label class="flabel">Thành viên / 成員</label>
        <select class="inp" id="pw-user"><option value="owner">Chandler Wei</option><option value="quang">Quang</option><option value="helper">Trợ lý / 小幫手</option></select>
      </div>
      <div class="field"><label class="flabel">Mật khẩu mới / 新密碼</label><input class="inp" id="pw-new" type="password" placeholder="Nhập mật khẩu mới..."></div>
      <button class="btn btnp btnf" onclick="savePassword()">Lưu mật khẩu / 儲存密碼</button>
    </div>
  </div>
  <div style="height:20px"></div>`;
  document.getElementById('rep-admin').innerHTML = h;
}

async function saveAdminConfig() {
  const cfg = {
    rate: parseInt(document.getElementById('cfg-rate').value) || 900,
    monthly_inc: parseInt(document.getElementById('cfg-monthly-inc').value) || 50000,
    max_inc: parseInt(document.getElementById('cfg-max-inc').value) || 300000
  };
  await DB.saveConfig(cfg);
  renderInv(); renderPos();
}

async function savePassword() {
  const userId = document.getElementById('pw-user').value;
  const pw = document.getElementById('pw-new').value;
  if (!pw) { showToast('Vui lòng nhập mật khẩu / 請填寫密碼', 'error'); return; }
  const ok = await DB.setPassword(userId, pw);
  if (ok) showToast('Đã cập nhật mật khẩu / 密碼已更新');
  document.getElementById('pw-new').value = '';
}

// PURCHASE FORM
let purItems = [];
function addPurItem() {
  purItems.push({ name: '', qty: 1, cost_ntd: 0, price: 0 });
  renderPurItems();
}

function renderPurItems() {
  document.getElementById('pur-items-wrap').innerHTML = purItems.map((item, i) => `
    <div style="background:var(--bg3);border-radius:var(--r);padding:11px;margin-bottom:9px">
      <div class="field" style="margin-bottom:7px"><input class="inp" id="pur-name-${i}" placeholder="Tên cây / 品名" value="${item.name || ''}" oninput="purItems[${i}].name=this.value"></div>
      <div class="irow" style="margin-bottom:7px">
        <div class="field" style="margin-bottom:0"><input class="inp" id="pur-qty-${i}" type="number" placeholder="SL / 數量" value="${item.qty || ''}" oninput="purItems[${i}].qty=parseInt(this.value)||0"></div>
        <div class="field" style="margin-bottom:0"><input class="inp" id="pur-cost-${i}" type="number" placeholder="Giá vốn NTD / 成本NTD" value="${item.cost_ntd || ''}" oninput="purItems[${i}].cost_ntd=parseInt(this.value)||0"></div>
      </div>
      <div class="field" style="margin-bottom:0"><input class="inp" id="pur-price-${i}" type="number" placeholder="Giá bán VND / 建議售價 VND" value="${item.price || ''}" oninput="purItems[${i}].price=parseInt(this.value)||0"></div>
    </div>`).join('');
}

async function savePurchase() {
  const vendor = document.getElementById('pur-vendor').value.trim();
  if (!vendor || purItems.length === 0) { showToast('Vui lòng nhập đầy đủ / 請填寫廠商和品項', 'error'); return; }
  const addToStock = document.getElementById('pur-add-stock').checked;
  const stockLoc = document.getElementById('pur-stock-loc').value;
  purItems.forEach((item, i) => {
    const n = document.getElementById('pur-name-' + i);
    const q = document.getElementById('pur-qty-' + i);
    const c = document.getElementById('pur-cost-' + i);
    const p = document.getElementById('pur-price-' + i);
    if (n) item.name = n.value;
    if (q) item.qty = parseInt(q.value) || 0;
    if (c) item.cost_ntd = parseInt(c.value) || 0;
    if (p) item.price = parseInt(p.value) || 0;
  });
  const items = purItems.map(i => ({
    item_name: i.name, qty: i.qty, cost_ntd: i.cost_ntd,
    cost_vnd: i.cost_ntd * CFG.rate, total_vnd: i.qty * i.cost_ntd * CFG.rate
  }));
  const itemPrices = purItems.map(i => i.price || 0);
  const totalVnd = items.reduce((s, i) => s + i.total_vnd, 0);
  const purchaseDate = document.getElementById('pur-date').value || todayStr();
  showLoading(true);
  await DB.addPurchase({ vendor, purchase_date: purchaseDate, note: document.getElementById('pur-note').value, total_vnd: totalVnd }, items);
  if (addToStock) {
    for (let idx = 0; idx < items.length; idx++) {
      const i = items[idx];
      if (!i.item_name) continue;
      const existing = DATA.plants.find(p => p.name === i.item_name && p.loc === stockLoc && p.status === 'ok');
      if (existing) { await DB.updatePlant(existing.id, { qty: existing.qty + i.qty }); }
      else { await DB.addPlant({ name: i.item_name, cat: '植物', cost_ntd: i.cost_ntd, cost_vnd: i.cost_vnd, price: itemPrices[idx], qty: i.qty, purchase_date: purchaseDate, loc: stockLoc, note: vendor, status: 'ok' }); }
    }
  }
  purItems = [];
  ['pur-vendor','pur-note'].forEach(id => document.getElementById(id).value = '');
  await loadAllData();
  showLoading(false);
  closeM('m-newpur');
  renderPur();
  showToast(addToStock ? 'Đã lưu và thêm vào kho / 已儲存並加入庫存' : 'Đã lưu lô hàng / 已儲存進貨批次');
}

// BOARD EDIT
function openEditBoard(id) {
  const b = id ? DATA.boards.find(x => x.id === id) : null;
  document.getElementById('eb-id').value = id || '';
  document.getElementById('eb-name').value = b ? b.name : '';
  document.getElementById('eb-cost').value = b ? b.cost_vnd : '';
  document.getElementById('eb-price').value = b ? b.price : '';
  document.getElementById('eb-qty').value = b ? b.qty_mine + b.qty_quang + b.qty_helper : '';
  openM('m-addboard');
}

async function saveBoard() {
  const id = parseInt(document.getElementById('eb-id').value) || 0;
  const name = document.getElementById('eb-name').value.trim();
  if (!name) return;
  const cost_vnd = parseInt(document.getElementById('eb-cost').value) || 0;
  const price = parseInt(document.getElementById('eb-price').value) || 0;
  const qty = parseInt(document.getElementById('eb-qty').value) || 0;
  showLoading(true);
  if (id) { await DB.updateBoard(id, { name, cost_vnd, price }); }
  else { await DB.addBoard({ name, cost_vnd, price, qty_mine: qty, qty_quang: 0, qty_helper: 0 }); }
  await loadAllData();
  showLoading(false);
  closeM('m-addboard');
  renderBoardInv();
  renderPur();
  showToast('Đã lưu / 已儲存');
}

// CSV EXPORT
function exportCSV(type) {
  let rows = [], filename = '';
  const completed = DATA.orders.filter(o => o.status === 'completed');
  if (type === 'summary') {
    filename = '月度摘要.csv';
    rows.push(['Tháng/月份','Doanh thu/營收(VND)','Lợi nhuận/毛利(VND)','Tỷ lệ/毛利率','Số đơn/訂單數']);
    const monthly = {};
    completed.forEach(o => {
      const k = monthKey(o.order_date);
      if (!monthly[k]) monthly[k] = { label: monthLabel(o.order_date), rev: 0, profit: 0, count: 0 };
      monthly[k].rev += o.total; monthly[k].profit += o.profit; monthly[k].count++;
    });
    Object.keys(monthly).sort().reverse().forEach(k => {
      const m = monthly[k];
      const mg = m.rev > 0 ? (m.profit / m.rev * 100).toFixed(1) : 0;
      rows.push([m.label, m.rev, m.profit, mg + '%', m.count]);
    });
  } else if (type === 'orders') {
    filename = '訂單明細.csv';
    rows.push(['Ngày/日期','#','Khách/客戶','Liên hệ/聯絡','Địa chỉ/地址','Nguồn/來源','Thanh toán/付款','Người bán/成交人','Sản phẩm/品項','Tổng/金額(VND)','LN/毛利(VND)','Tỷ lệ/毛利率','Ghi chú/備註']);
    completed.forEach(o => {
      const mg = o.total > 0 ? (o.profit / o.total * 100).toFixed(1) : 0;
      const items = (o.order_items || []).map(i => i.item_name + '×' + i.qty).join(' | ');
      rows.push([o.order_date, '#' + String(o.id).padStart(4,'0'), o.customer, o.contact, o.address, o.source, o.payment, o.seller, items, o.total, o.profit, mg + '%', o.note]);
    });
  } else if (type === 'members') {
    filename = '成員業績.csv';
    rows.push(['Thành viên/成員','Số đơn/訂單數','Doanh thu/總營收(VND)','Lợi nhuận/總毛利(VND)','Tỷ lệ/毛利率']);
    const members = {};
    completed.forEach(o => {
      if (!members[o.seller]) members[o.seller] = { rev: 0, profit: 0, count: 0 };
      members[o.seller].rev += o.total; members[o.seller].profit += o.profit; members[o.seller].count++;
    });
    Object.keys(members).forEach(name => {
      const m = members[name];
      const mg = m.rev > 0 ? (m.profit / m.rev * 100).toFixed(1) : 0;
      rows.push([name, m.count, m.rev, m.profit, mg + '%']);
    });
  } else if (type === 'plants-sold') {
    filename = '植物銷售.csv';
    rows.push(['Tên cây/植物名稱','Số lượng/售出數量','Doanh thu/總營收(VND)','Lợi nhuận/總毛利(VND)','Tỷ lệ/毛利率']);
    const ps = {};
    completed.forEach(o => {
      (o.order_items || []).forEach(item => {
        if (!ps[item.item_name]) ps[item.item_name] = { qty: 0, rev: 0, profit: 0 };
        ps[item.item_name].qty += item.qty;
        ps[item.item_name].rev += item.price * item.qty;
        ps[item.item_name].profit += (item.price - item.cost) * item.qty;
      });
    });
    Object.keys(ps).sort((a, b) => ps[b].rev - ps[a].rev).forEach(name => {
      const s = ps[name];
      const mg = s.rev > 0 ? (s.profit / s.rev * 100).toFixed(1) : 0;
      rows.push([name, s.qty, s.rev, s.profit, mg + '%']);
    });
  } else if (type === 'invstatus') {
    filename = '庫存狀態.csv';
    rows.push(['Tên cây/植物名稱','Phân loại/分類','Vị trí/位置','Số lượng/數量','Số ngày kho/在庫天數','Giá vốn gốc/原始成本(VND)','Giá vốn HT/當前成本(VND)','Giá bán/售價(VND)','Tỷ lệ LN/毛利率','Ngày nhập/進貨日期']);
    DATA.plants.filter(p => p.status === 'ok').forEach(p => {
      const ac = agedCost(p.cost_vnd, p.purchase_date);
      const mg = margin(p.price, p.cost_vnd, p.purchase_date);
      rows.push([p.name, p.cat, LOC_LABELS[p.loc], p.qty, daysSince(p.purchase_date), p.cost_vnd, ac, p.price, mg + '%', p.purchase_date]);
    });
  } else if (type === 'rehab-log') {
    filename = '修整記錄.csv';
    rows.push(['Mã/編號','Tên cây/植物','Số lượng/數量','Vị trí/位置','Ngày nhập/進貨日期','Ngày CS/修整開始日','Ngày kho/在庫天數','Ngày CS/修整天數','Lý do/原因']);
    DATA.rehab.forEach(r => {
      rows.push([r.rid, r.plant_name, r.qty, LOC_LABELS[r.loc], r.purchase_date, r.rehab_date, daysSince(r.purchase_date), daysSince(r.rehab_date), r.note]);
    });
  } else if (type === 'writeoff') {
    filename = '死亡報廢.csv';
    rows.push(['Ngày/日期','Tên cây/植物名稱','Số lượng/數量','Vị trí/位置','Lý do/死亡原因','Người TH/操作人員','Thiệt hại/損失成本(VND)']);
    DATA.writeoffs.forEach(w => {
      rows.push([w.writeoff_date, w.plant_name, w.qty, LOC_LABELS[w.loc] || '', w.reason, w.operator, w.cost || 0]);
    });
  } else if (type === 'purchase') {
    filename = '進貨記錄.csv';
    rows.push(['Ngày/批次日期','NCC/廠商','Tên cây/品名','Số lượng/數量','Giá NTD/成本NTD','Giá VND/成本VND','Tổng VND/小計VND','Ghi chú/備註']);
    DATA.purchases.forEach(p => {
      (p.purchase_items || []).forEach(i => {
        rows.push([p.purchase_date, p.vendor, i.item_name, i.qty, i.cost_ntd, i.cost_vnd, i.total_vnd, p.note]);
      });
    });
  }
  const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
