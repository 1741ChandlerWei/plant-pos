// ==================== POS MODULE ====================
let cart = [];

function posTab(t) {
  ['plant','board','writeoff','cart'].forEach(x => {
    document.getElementById('ptab-' + x).classList.toggle('active', x === t);
    document.getElementById('pos-' + x).style.display = x === t ? 'block' : 'none';
  });
  if (t === 'plant' || t === 'board') renderPos();
  if (t === 'cart') renderCart();
  if (t === 'writeoff') renderWriteoffForm();
}

function renderPos() {
  // 一般庫存植物
  const avail = DATA.plants.filter(p => p.qty > 0 && p.status === 'ok');

  // 修整區中可售 + 追蹤中的植物（R 編號獨立個體）
  const rehabAvail = DATA.rehab.filter(r => r.status === 'available' || r.status === 'tracking');

  // 渲染一般植物
  let plantHtml = avail.length === 0 && rehabAvail.length === 0
    ? '<div style="padding:32px;text-align:center;color:var(--text3)">Không có cây / 無庫存</div>'
    : '';

  // 先顯示追蹤中和可售的 R 編號植物
  if (rehabAvail.length > 0) {
    plantHtml += rehabAvail.map(r => {
      const days = daysSince(r.purchase_date);
      const rehabDays = daysSince(r.rehab_date);
      const isTracking = r.status === 'tracking';
      const statusLabel = isTracking ? '🎬 追蹤中' : '✅ 可售';
      const statusColor = isTracking ? 'var(--acc)' : 'var(--green)';
      return `<div class="pi" onclick="addCartRehab('${r.rid}')">
        <div class="pdot" style="background:${statusColor}"></div>
        <div class="pinfo">
          <div class="pname">
            ${r.plant_name}
            <span style="font-size:10px;font-weight:700;color:var(--amber);font-family:DM Mono,monospace;margin-left:4px">${r.rid}</span>
            <span class="${LOC_CLASS[r.loc]}">${LOC_LABELS[r.loc]}</span>
          </div>
          <div class="pmeta">${statusLabel} · 1株 · 在庫${days}天 · 追蹤${rehabDays}天</div>
        </div>
        <div class="pright"><div class="pprice" style="font-size:13px;color:var(--text2)">點擊開單</div></div>
      </div>`;
    }).join('');
  }

  // 再顯示一般庫存植物
  if (avail.length > 0) {
    plantHtml += avail.map(p => {
      const ac = agedCost(p.cost_vnd, p.purchase_date);
      const mg = parseFloat(margin(p.price, p.cost_vnd, p.purchase_date));
      const mc = mg > 40 ? 'var(--green)' : mg > 20 ? 'var(--amber)' : 'var(--red)';
      const days = daysSince(p.purchase_date);
      const pct = Math.min(days / 90 * 100, 100);
      const bc = pct > 66 ? 'var(--red)' : pct > 33 ? 'var(--amber)' : 'var(--green)';
      return `<div class="pi" onclick="addCart('plant',${p.id})">
        <div class="pdot" style="background:${mc}"></div>
        <div class="pinfo">
          <div class="pname">${p.name} <span class="${LOC_CLASS[p.loc]}">${LOC_LABELS[p.loc]}</span></div>
          <div class="pmeta">${p.cat} · ${p.qty}株 · ${days}天</div>
          <div class="age-bar"><div class="age-fill" style="width:${pct}%;background:${bc}"></div></div>
        </div>
        <div class="pright"><div class="pprice">${vnd(p.price)}</div><div class="psub" style="color:${mc}">${vnd(p.price - ac)}</div><div class="psub" style="color:${mc}">${mg}%</div></div>
      </div>`;
    }).join('');
  }

  document.getElementById('pos-plant').innerHTML = plantHtml;

  // 板材
  let boardHtml = '';
  DATA.boards.forEach(b => {
    const locs = { mine: b.qty_mine, quang: b.qty_quang, helper: b.qty_helper };
    Object.keys(locs).forEach(loc => {
      if (locs[loc] <= 0) return;
      boardHtml += `<div class="pi" onclick="addCartBoard(${b.id},'${loc}')">
        <div class="pdot" style="background:var(--blue)"></div>
        <div class="pinfo">
          <div class="pname">${b.name} <span class="${LOC_CLASS[loc]}">${LOC_LABELS[loc]}</span></div>
          <div class="pmeta">Tồn kho / 庫存 ${locs[loc]}</div>
        </div>
        <div class="pright"><div class="pprice">${vnd(b.price)}</div></div>
      </div>`;
    });
  });
  document.getElementById('pos-board').innerHTML = boardHtml || '<div style="padding:32px;text-align:center;color:var(--text3)">Không có tấm / 無庫存</div>';
}

// 加入購物車 — 一般植物
function addCart(type, id) {
  const p = DATA.plants.find(x => x.id === id);
  if (!p || p.qty === 0) return;
  const key = 'plant-' + id;
  const ex = cart.find(c => c.key === key);
  if (ex) { if (ex.qty < p.qty) ex.qty++; }
  else cart.push({ key, type: 'plant', id, name: p.name, qty: 1, price: p.price, cost: agedCost(p.cost_vnd, p.purchase_date), loc: p.loc });
  updateBadge();
}

// 加入購物車 — R 編號植物（修整區可售/追蹤中）
function addCartRehab(rid) {
  const r = DATA.rehab.find(x => x.rid === rid);
  if (!r) return;
  const key = 'rehab-' + rid;
  const ex = cart.find(c => c.key === key);
  if (ex) { showToast('此株已在購物車中', 'error'); return; }
  const price = r.price || 0;
  cart.push({
    key, type: 'rehab', rid, id: r.id,
    name: `${r.plant_name} [${rid}]`,
    qty: 1, price, cost: 0, loc: r.loc,
    isRehab: true
  });
  updateBadge();
  showToast(`${rid} 已加入購物車，可在購物車修改售價`);
}

function addCartBoard(id, loc) {
  const b = DATA.boards.find(x => x.id === id);
  if (!b) return;
  const locQty = { mine: b.qty_mine, quang: b.qty_quang, helper: b.qty_helper }[loc] || 0;
  if (locQty === 0) return;
  const key = 'board-' + id + '-' + loc;
  const ex = cart.find(c => c.key === key);
  if (ex) { if (ex.qty < locQty) ex.qty++; }
  else cart.push({ key, type: 'board', id, name: b.name, qty: 1, price: b.price, cost: b.cost_vnd, loc });
  updateBadge();
}

function updateBadge() {
  const t = cart.reduce((s, c) => s + c.qty, 0);
  document.getElementById('cart-badge').textContent = t > 0 ? '(' + t + ')' : '';
}

function renderCart() {
  const el = document.getElementById('pos-cart');
  if (cart.length === 0) { el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text3)">Giỏ hàng trống / 購物車為空</div>'; return; }
  const sub = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const cost = cart.reduce((s, c) => s + c.cost * c.qty, 0);
  const prof = sub - cost;
  const mg = sub > 0 ? (prof / sub * 100).toFixed(1) : 0;
  let h = '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:var(--rl);padding:14px;margin-bottom:10px">';
  cart.forEach((c, i) => {
    h += `<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">
      <div style="flex:1">
        <div style="font-size:13px;font-weight:500">${c.name} <span class="${LOC_CLASS[c.loc]}">${LOC_LABELS[c.loc]}</span></div>
        <div style="margin-top:5px"><input style="width:100%;padding:6px 10px;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-size:13px;font-family:inherit" type="number" value="${c.price}" onchange="updPrice(${i},this.value)"></div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
        <div style="display:flex;align-items:center;gap:5px">
          <button class="qbtn" onclick="chgQty(${i},-1)">−</button>
          <span style="font-size:14px;min-width:18px;text-align:center">${c.qty}</span>
          <button class="qbtn" onclick="chgQty(${i},1)">+</button>
        </div>
        <div style="font-size:12px;font-family:DM Mono,monospace">${vnd(c.price * c.qty)}</div>
      </div>
    </div>`;
  });
  h += `<div style="height:1px;background:var(--border);margin:10px 0"></div>
    <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--text2);padding:3px 0"><span>Tạm tính / 小計</span><span>${vnd(sub)}</span></div>
    <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--green);padding:3px 0"><span>Lợi nhuận / 毛利</span><span>${vnd(prof)} (${mg}%)</span></div>
    <div style="display:flex;justify-content:space-between;font-size:17px;font-weight:700;padding:10px 0 0;border-top:1px solid var(--border2);margin-top:6px"><span>Tổng / 合計</span><span>${vnd(sub)}</span></div>
  </div>
  <button class="btn btnp btnf" onclick="openCheckout()">Thanh toán → / 結帳</button><div style="height:10px"></div>`;
  el.innerHTML = h;
}

function updPrice(i, v) { cart[i].price = parseInt(v) || cart[i].price; renderCart(); }

function chgQty(i, d) {
  const c = cart[i];
  let max;
  if (c.type === 'rehab') { max = 1; }
  else if (c.type === 'plant') { const p = DATA.plants.find(x => x.id === c.id); max = p ? p.qty : 0; }
  else { const b = DATA.boards.find(x => x.id === c.id); max = b ? { mine: b.qty_mine, quang: b.qty_quang, helper: b.qty_helper }[c.loc] || 0 : 0; }
  c.qty += d;
  if (c.qty <= 0) cart.splice(i, 1);
  if (c.qty > max) c.qty = max;
  updateBadge();
  renderCart();
}

function clearCart() { cart = []; updateBadge(); renderPos(); }

function openCheckout() {
  const sub = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const prof = sub - cart.reduce((s, c) => s + c.cost * c.qty, 0);
  ['co-name','co-contact','co-addr','co-note'].forEach(id => document.getElementById(id).value = '');
  const coDate = document.getElementById('co-date');
  if (coDate) coDate.value = new Date().toISOString().split('T')[0];
  document.getElementById('co-summary').innerHTML = '<div style="font-size:12px;color:var(--text2);margin-bottom:6px">Sản phẩm / 品項</div>'
    + cart.map(c => `<div style="font-size:12px;padding:2px 0">${c.name} × ${c.qty} <span class="${LOC_CLASS[c.loc]}">${LOC_LABELS[c.loc]}</span> = ${vnd(c.price * c.qty)}</div>`).join('')
    + `<div style="display:flex;justify-content:space-between;font-size:17px;font-weight:700;padding:10px 0 0;border-top:1px solid var(--border2);margin-top:8px"><span>Tổng / 合計</span><span>${vnd(sub)}</span></div>
    <div style="font-size:12px;color:var(--green)">Lợi nhuận / 毛利 ${vnd(prof)}</div>`;
  openM('m-checkout');
}

async function completeOrder() {
  const name = document.getElementById('co-name').value.trim();
  if (!name) { showToast('Vui lòng nhập tên khách / 請填寫客戶姓名', 'error'); return; }
  const sub = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const cost = cart.reduce((s, c) => s + c.cost * c.qty, 0);
  const coDateEl = document.getElementById('co-date');
  const orderDate = (coDateEl && coDateEl.value) ? coDateEl.value : todayStr();
  const order = {
    order_date: orderDate, customer: name,
    contact: document.getElementById('co-contact').value,
    address: document.getElementById('co-addr').value,
    source: document.getElementById('co-src').value,
    payment: document.getElementById('co-pay').value,
    seller: document.getElementById('co-seller').value,
    note: document.getElementById('co-note').value,
    total: sub, profit: sub - cost, status: 'completed'
  };
  const items = cart.map(c => ({
    item_type: c.type, item_name: c.name,
    qty: c.qty, price: c.price, cost: c.cost, loc: c.loc
  }));
  showLoading(true);
  const o = await DB.addOrder(order, items);
  if (!o) { showLoading(false); return; }

  // 扣庫存
  for (const c of cart) {
    if (c.type === 'plant') {
      const p = DATA.plants.find(x => x.id === c.id);
      if (p) await DB.updatePlant(p.id, { qty: p.qty - c.qty });
    } else if (c.type === 'rehab') {
      // R 編號植物售出，更新狀態為 sold
      await DB.updateRehab(c.id, { status: 'sold' });
    } else {
      const b = DATA.boards.find(x => x.id === c.id);
      if (b) { const field = 'qty_' + c.loc; await DB.updateBoard(b.id, { [field]: b[field] - c.qty }); }
    }
  }

  cart = [];
  updateBadge();
  await loadAllData();
  showLoading(false);
  closeM('m-checkout');
  showReceipt(o.id);
  renderHome();
  renderPos();
}

// WRITEOFF
function renderWriteoffForm() {
  const avail = DATA.plants.filter(p => p.qty > 0 && p.status === 'ok');
  const rehabAvail = DATA.rehab.filter(r => r.status === 'rehab' || r.status === 'tracking' || r.status === 'available');

  let h = '<div style="background:var(--rbg);border:1px solid var(--rborder);border-radius:var(--r);padding:12px;margin-bottom:14px;font-size:12px;color:var(--red)">Cây chết/hỏng sẽ trừ khỏi kho và lưu vào báo cáo / 死亡報廢將從庫存中扣除並記錄</div>';
  h += '<div class="field"><label class="flabel">Cây / 植物</label><select class="inp" id="wo-plant" onchange="woTypeChange(this)">';

  // 一般庫存植物
  if (avail.length > 0) {
    h += '<optgroup label="── 一般庫存 ──">';
    avail.forEach(p => { h += `<option value="plant-${p.id}">${p.name} (${LOC_LABELS[p.loc]}) · ${p.qty}株</option>`; });
    h += '</optgroup>';
  }

  // 修整區和追蹤區植物
  if (rehabAvail.length > 0) {
    h += '<optgroup label="── 修整/追蹤區 ──">';
    rehabAvail.forEach(r => {
      const label = r.status === 'rehab' ? '修整中' : r.status === 'tracking' ? '追蹤中' : '可售';
      h += `<option value="rehab-${r.id}">${r.plant_name} [${r.rid}] (${label})</option>`;
    });
    h += '</optgroup>';
  }

  h += '</select></div>';
  h += '<div class="field" id="wo-qty-wrap"><label class="flabel">Số lượng / 報廢數量</label><input class="inp" id="wo-qty" type="number" min="1" value="1"></div>';
  h += '<div class="field"><label class="flabel">Lý do / 死亡原因</label><input class="inp" id="wo-reason" placeholder="Rễ bị thối / 根部腐爛..."></div>';
  h += '<div class="field"><label class="flabel">Người thực hiện / 操作人員</label><select class="inp" id="wo-op"><option>Chandler Wei</option><option>Quang</option><option>Trợ lý / 小幫手</option></select></div>';
  h += '<button class="btn btnd btnf" onclick="confirmWriteoff()">Xác nhận hao hụt / 確認報廢</button>';
  document.getElementById('pos-writeoff').innerHTML = h;
  woTypeChange(document.getElementById('wo-plant'));
}

function woTypeChange(sel) {
  const val = sel.value;
  const qtyWrap = document.getElementById('wo-qty-wrap');
  // rehab 植物固定1株，隱藏數量
  if (val && val.startsWith('rehab-')) {
    qtyWrap.style.display = 'none';
  } else {
    qtyWrap.style.display = '';
  }
}

async function confirmWriteoff() {
  const val = document.getElementById('wo-plant').value;
  const reason = document.getElementById('wo-reason').value;
  const op = document.getElementById('wo-op').value;
  if (!reason) { showToast('Vui lòng nhập lý do / 請填寫死亡原因', 'error'); return; }

  if (val.startsWith('rehab-')) {
    // 修整/追蹤區植物報廢
    const rid_id = parseInt(val.replace('rehab-', ''));
    const r = DATA.rehab.find(x => x.id === rid_id);
    if (!r) return;
    if (!confirm(`確認報廢 ${r.plant_name} [${r.rid}]？`)) return;
    const actualCost = agedCost(r.cost_vnd || 0, r.purchase_date);
    showLoading(true);
    await DB.addWriteoff({ writeoff_date: todayStr(), plant_name: `${r.plant_name} [${r.rid}]`, qty: 1, reason, loc: r.loc, operator: op, cost: actualCost });
    await DB.updateRehab(r.id, { status: 'writeoff' });
  } else {
    // 一般庫存植物報廢
    const pid = parseInt(val.replace('plant-', ''));
    const qty = parseInt(document.getElementById('wo-qty').value) || 1;
    const p = DATA.plants.find(x => x.id === pid);
    if (!p) return;
    if (qty > p.qty) { showToast('Vượt SL tồn kho / 數量超過庫存', 'error'); return; }
    if (!confirm(`Xác nhận hao hụt / 確認報廢 ${p.name} × ${qty}？`)) return;
    const actualCost = agedCost(p.cost_vnd, p.purchase_date) * qty;
    showLoading(true);
    await DB.addWriteoff({ writeoff_date: todayStr(), plant_name: p.name, qty, reason, loc: p.loc, operator: op, cost: actualCost });
    await DB.updatePlant(p.id, { qty: p.qty - qty });
  }

  await loadAllData();
  showLoading(false);
  showToast('Đã ghi nhận hao hụt / 已記錄報廢');
  renderWriteoffForm();
  renderHome();
}
