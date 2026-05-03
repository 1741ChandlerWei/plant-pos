// ==================== ORDERS MODULE ====================
let orderFilterMonth = null;

function getOrderItemsStr(o) {
  return (o.order_items || []).map(i => i.item_name + (i.qty > 1 ? ' ×' + i.qty : '')).join('、');
}

function renderHome() {
  const today = todayStr();
  const now = new Date();
  const yr = now.getFullYear(), mo = now.getMonth();
  const toOrds = DATA.orders.filter(o => o.order_date === today && o.status === 'completed');
  const moOrds = DATA.orders.filter(o => {
    const d = new Date(o.order_date);
    return d.getFullYear() === yr && d.getMonth() === mo && o.status === 'completed';
  });
  const toRev = toOrds.reduce((s, o) => s + o.total, 0);
  const toP = toOrds.reduce((s, o) => s + o.profit, 0);
  const moRev = moOrds.reduce((s, o) => s + o.total, 0);
  const moP = moOrds.reduce((s, o) => s + o.profit, 0);
  document.getElementById('home-metrics').innerHTML = `
    <div class="metric"><div class="ml">Doanh thu hôm nay / 今日營收</div><div class="mv blue">${vnd(toRev)}</div></div>
    <div class="metric"><div class="ml">Lợi nhuận hôm nay / 今日毛利</div><div class="mv green">${vnd(toP)}</div></div>
    <div class="metric"><div class="ml">Doanh thu tháng / 本月營收</div><div class="mv blue">${vnd(moRev)}</div></div>
    <div class="metric"><div class="ml">Lợi nhuận tháng / 本月毛利</div><div class="mv green">${vnd(moP)}</div></div>`;
  const toEl = document.getElementById('today-orders');
  toEl.innerHTML = toOrds.length === 0
    ? '<div style="padding:18px;text-align:center;color:var(--text3);font-size:13px">Chưa có đơn hôm nay / 今日尚無訂單</div>'
    : toOrds.map(o => {
        const items = getOrderItemsStr(o);
        return `<div class="pi" onclick="showReceipt(${o.id})">
          <div class="pdot" style="background:var(--green)"></div>
          <div class="pinfo">
            <div class="pname"><span style="color:var(--text2);font-size:11px">#${String(o.id).padStart(4,'0')}</span> ${o.customer}</div>
            <div class="pmeta">${items || '-'}</div>
          </div>
          <div class="pright"><div class="pprice">${vnd(o.total)}</div><div class="psub" style="color:var(--green)">+${vnd(o.profit)}</div></div>
        </div>`;
      }).join('');
  const low = DATA.plants.filter(p => p.qty <= 2 && p.status === 'ok');
  document.getElementById('low-stock').innerHTML = low.length === 0
    ? '<div style="padding:13px 18px;color:var(--text3);font-size:12px">Không có SL thấp / 目前無低庫存</div>'
    : low.map(p => `<div class="pi">
        <div class="pdot" style="background:var(--amber)"></div>
        <div class="pinfo"><div class="pname">${p.name}</div><div class="pmeta">${p.cat} · ${LOC_LABELS[p.loc]}</div></div>
        <div class="pright"><span class="badge ${p.qty === 0 ? 'br' : 'ba'}">${p.qty === 0 ? 'Hết hàng / 缺貨' : p.qty + '株'}</span></div>
      </div>`).join('');
}

function renderOrders(filterMonth) {
  orderFilterMonth = filterMonth;

  // 月份頁籤
  const allMonths = [...new Set(DATA.orders.map(o => o.order_date.substring(0, 7)))].sort().reverse();
  document.getElementById('orders-tabs').innerHTML = `
    <div style="display:flex;gap:8px;overflow-x:auto;padding:12px 16px 8px;scrollbar-width:none;-webkit-overflow-scrolling:touch">
      <button onclick="renderOrders(null)" style="flex-shrink:0;padding:6px 14px;border-radius:100px;border:1px solid var(--border);background:${!filterMonth ? 'var(--acc)' : 'var(--bg2)'};color:${!filterMonth ? '#000' : 'var(--text)'};font-size:12px;font-weight:600;cursor:pointer;font-family:inherit">
        Tất cả / 全部
      </button>
      ${allMonths.map(m => {
        const [yr, mo] = m.split('-');
        const isActive = filterMonth === m;
        return `<button onclick="renderOrders('${m}')" style="flex-shrink:0;padding:6px 14px;border-radius:100px;border:1px solid var(--border);background:${isActive ? 'var(--acc)' : 'var(--bg2)'};color:${isActive ? '#000' : 'var(--text)'};font-size:12px;font-weight:600;cursor:pointer;font-family:inherit">
          ${yr}/${mo}
        </button>`;
      }).join('')}
    </div>`;

  const orders = filterMonth
    ? DATA.orders.filter(o => o.order_date.startsWith(filterMonth))
    : DATA.orders;

  if (orders.length === 0) {
    document.getElementById('orders-list').innerHTML = '<div style="padding:32px;text-align:center;color:var(--text3)">Chưa có đơn hàng / 無訂單記錄</div>';
    return;
  }

  const monthly = {};
  orders.forEach(o => {
    const k = monthKey(o.order_date);
    if (!monthly[k]) monthly[k] = { label: monthLabel(o.order_date), orders: [], rev: 0, profit: 0 };
    monthly[k].orders.push(o);
    if (o.status === 'completed') { monthly[k].rev += o.total; monthly[k].profit += o.profit; }
  });

  let html = '';
  Object.keys(monthly).sort().reverse().forEach(k => {
    const m = monthly[k];
    const mg = m.rev > 0 ? (m.profit / m.rev * 100).toFixed(1) : 0;
    const mgc = parseFloat(mg) > 40 ? 'var(--green)' : parseFloat(mg) > 20 ? 'var(--amber)' : 'var(--red)';
    html += `<div class="month-card">
      <div class="month-hdr" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'':'none'">
        <div>
          <div style="font-size:14px;font-weight:700">${m.label}</div>
          <div style="font-size:11px;color:var(--text2);margin-top:2px">${m.orders.filter(o=>o.status==='completed').length} đơn · ${vnd(m.rev)}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:13px;font-weight:700;color:${mgc}">${mg}%</span>
        </div>
      </div>
      <div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;padding:12px 16px;background:var(--bg3);border-bottom:1px solid var(--border)">
          <div style="text-align:center"><div style="font-size:9px;color:var(--text2)">Doanh thu / 營收</div><div style="font-size:12px;font-weight:700;font-family:DM Mono,monospace;color:var(--blue)">${vnd(m.rev)}</div></div>
          <div style="text-align:center"><div style="font-size:9px;color:var(--text2)">Lợi nhuận / 毛利</div><div style="font-size:12px;font-weight:700;font-family:DM Mono,monospace;color:var(--green)">${vnd(m.profit)}</div></div>
          <div style="text-align:center"><div style="font-size:9px;color:var(--text2)">Tỷ lệ / 毛利率</div><div style="font-size:12px;font-weight:700;color:${mgc}">${mg}%</div></div>
        </div>
        ${m.orders.map(o => {
          const items = getOrderItemsStr(o);
          return `<div class="order-row" onclick="showReceipt(${o.id})">
            <div>
              <div style="font-size:13px;font-weight:500">
                <span style="color:var(--text2);font-size:11px">#${String(o.id).padStart(4,'0')}</span>
                <span style="margin-left:4px">${o.order_date.slice(5)}</span>
                <span style="margin-left:6px">${o.customer}</span>
                ${o.status === 'cancelled' ? '<span class="cancelled-badge">Đã hủy / 已取消</span>' : ''}
              </div>
              <div style="font-size:11px;color:var(--text2);margin-top:2px">${items || '-'}</div>
            </div>
            <div style="text-align:right">
              <div style="font-size:13px;font-weight:500;font-family:DM Mono,monospace;${o.status==='cancelled'?'text-decoration:line-through;color:var(--text3)':''}">${vnd(o.total)}</div>
              ${o.status === 'completed' ? `<div style="font-size:11px;color:var(--green)">+${vnd(o.profit)}</div>` : ''}
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  });
  document.getElementById('orders-list').innerHTML = html;
}

function showReceipt(id) {
  const o = DATA.orders.find(x => x.id === id);
  if (!o) return;
  const items = o.order_items || [];
  let h = `<div class="receipt" id="printable">
    <div class="rshop">根莖葉 / Gốc Thân Lá</div>
    <div class="rsub">Đơn #${String(o.id).padStart(4,'0')} · ${o.order_date} ${o.status === 'cancelled' ? '· [ĐÃ HỦY / 已取消]' : ''}</div>
    <div class="rsec"><div class="rlabel">Người nhận / 收件人</div>
      <div style="font-size:14px;font-weight:700">${o.customer}</div>
      ${o.contact ? `<div style="font-size:11px;color:#444;margin-top:2px">${o.contact}</div>` : ''}
      ${o.address ? `<div style="font-size:11px;color:#444;margin-top:2px">📦 ${o.address}</div>` : '<div style="font-size:11px;color:#888;margin-top:2px">Tự lấy / 自取</div>'}
    </div>
    <div class="rsec"><div class="rlabel">Chi tiết / 商品明細</div>`;
  items.forEach(item => {
    h += `<div class="rrow"><span>${item.item_name} × ${item.qty}</span><span>${vnd(item.price * item.qty)}</span></div>`;
  });
  h += `<div class="rtotal"><span>Tổng / 合計</span><span>${vnd(o.total)}</span></div></div>
    <div class="rsec">
      <div class="rrow"><span style="color:#888">Thanh toán / 付款</span><span>${o.payment}</span></div>
      <div class="rrow"><span style="color:#888">Người bán / 售出者</span><span>${o.seller}</span></div>
      <div class="rrow"><span style="color:#888">Nguồn / 來源</span><span>${o.source}</span></div>
      ${o.note ? `<div class="rrow"><span style="color:#888">Ghi chú / 備註</span><span>${o.note}</span></div>` : ''}
    </div>
  </div>`;
  document.getElementById('receipt-body').innerHTML = h;
  const cancelBtn = document.getElementById('receipt-cancel-btn');
  if (cancelBtn) cancelBtn.style.display = (ROLE === 'owner' && o.status === 'completed') ? 'flex' : 'none';
  if (cancelBtn) cancelBtn.onclick = () => openCancelOrder(id);
  openM('m-receipt');
}

let cancelOrderId = null;
function openCancelOrder(id) {
  cancelOrderId = id;
  closeM('m-receipt');
  document.getElementById('cancel-reason').value = '';
  openM('m-cancel');
}

async function doCancelOrder() {
  const reason = document.getElementById('cancel-reason').value.trim();
  if (!reason) { showToast('Vui lòng nhập lý do / 請填寫原因', 'error'); return; }
  const o = DATA.orders.find(x => x.id === cancelOrderId);
  if (!o) return;
  showLoading(true);
  await DB.cancelOrder(cancelOrderId, reason, ROLE === 'owner' ? 'Chandler Wei' : ROLE);
  const items = o.order_items || [];
  for (const item of items) {
    if (item.item_type === 'plant') {
      const p = DATA.plants.find(x => x.name === item.item_name && x.loc === item.loc && x.status === 'ok');
      if (p) await DB.updatePlant(p.id, { qty: p.qty + item.qty });
      else await DB.addPlant({ name: item.item_name, cat: '植物', cost_ntd: 0, cost_vnd: item.cost, price: item.price, qty: item.qty, purchase_date: todayStr(), loc: item.loc, note: 'Hoàn trả / 退貨退回', status: 'ok' });
    } else {
      const b = DATA.boards.find(x => x.name === item.item_name);
      if (b) { const field = 'qty_' + item.loc; await DB.updateBoard(b.id, { [field]: b[field] + item.qty }); }
    }
  }
  await loadAllData();
  showLoading(false);
  closeM('m-cancel');
  renderOrders(orderFilterMonth);
  renderHome();
  showToast('Đã hủy đơn / 已取消訂單，庫存已退回');
}
