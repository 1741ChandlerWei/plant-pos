// ==================== INVENTORY MODULE ====================
function invTab(t) {
  ['plant','board','member','rehab','tracking'].forEach(x => {
    document.getElementById('itab-' + x).classList.toggle('active', x === t);
    document.getElementById('inv-' + x).style.display = x === t ? 'block' : 'none';
  });
  if (t === 'plant') renderInvPlants();
  if (t === 'board') renderBoardInv();
  if (t === 'member') renderMember();
  if (t === 'rehab') renderRehab();
  if (t === 'tracking') renderTracking(trackingSubTab);
}

function renderInv() {
  document.getElementById('inv-addbtn').innerHTML = ROLE === 'owner' ? '<button class="btn btnp btnsm" onclick="openM(\'m-addplant\')">+ Thêm / 新增</button>' : '';
  renderInvPlants();
}

function renderInvPlants() {
  const plants = DATA.plants.filter(p => p.status === 'ok');
  // 可販售的R編號植物（available狀態，不在plants表）
  const availableRehab = DATA.rehab.filter(r => r.status === 'available');

  let html = '';

  // 先顯示可販售R編號植物
  if (availableRehab.length > 0) {
    html += `<div style="margin:8px 16px 4px;font-size:11px;font-weight:700;color:var(--acc)">✅ 可販售（植物履歷）</div>`;
    availableRehab.forEach(r => {
      const trackDays = daysSince(r.rehab_date);
      const stockDays = daysSince(r.purchase_date);
      html += `<div class="pi" style="align-items:flex-start;padding:13px 18px">
        <div class="pdot" style="background:var(--acc);margin-top:4px"></div>
        <div class="pinfo">
          <div class="pname">📖 ${r.plant_name} <span style="font-family:DM Mono,monospace;font-size:11px;font-weight:700;color:var(--amber);background:var(--abg);border:1px solid var(--aborder);border-radius:6px;padding:1px 6px">${r.rid}</span> <span class="${LOC_CLASS[r.loc]}">${LOC_LABELS[r.loc]}</span></div>
          <div class="pmeta">✅ 可販售 · 在庫${stockDays}天 · 追蹤${trackDays}天</div>
          ${ROLE === 'owner' ? `<div style="display:flex;gap:4px;margin-top:6px">
            <button class="btn btnt btnsm" onclick="event.stopPropagation();invTab('tracking');renderTracking('available')">📖 植物履歷</button>
            <button class="btn btnd btnsm" onclick="event.stopPropagation();openRehabWriteoff('${r.rid}')">報廢</button>
          </div>` : ''}
        </div>
        <div class="pright">
          <div class="pprice">${vnd(r.price || 0)}</div>
          <div style="font-size:22px;font-weight:700;font-family:DM Mono,monospace;color:var(--text);margin-top:4px;text-align:right">1<span style="font-size:11px;color:var(--text2);font-weight:400">株</span></div>
        </div>
      </div>`;
    });
  }

  if (plants.length === 0 && availableRehab.length === 0) {
    document.getElementById('inv-plant').innerHTML = '<div style="padding:32px;text-align:center;color:var(--text3)">Không có cây / 無植物庫存</div>';
    return;
  }

  if (plants.length > 0) {
    if (availableRehab.length > 0) html += `<div style="margin:8px 16px 4px;font-size:11px;font-weight:700;color:var(--text2)">📦 一般庫存</div>`;
    html += plants.map(p => {
        const ac = agedCost(p.cost_vnd, p.purchase_date);
        const mg = parseFloat(margin(p.price, p.cost_vnd, p.purchase_date));
        const mc = mg > 40 ? 'var(--green)' : mg > 20 ? 'var(--amber)' : 'var(--red)';
        const days = daysSince(p.purchase_date);
        const pct = Math.min(days / 90 * 100, 100);
        const bc = pct > 66 ? 'var(--red)' : pct > 33 ? 'var(--amber)' : 'var(--green)';
        const lb = ROLE === 'owner' ? `<span class="${LOC_CLASS[p.loc]}">${LOC_LABELS[p.loc]}</span>` : '';
        // 找這株植物有沒有植物履歷
        const rehabRec = DATA.rehab.find(r => r.plant_id === p.id && ['rehab','tracking','available','sold'].includes(r.status));
        // 有履歷顯示📖，但R編號只在qty=1時顯示（批次庫存不顯示R編號）
        const ridBadge = (rehabRec && p.qty === 1) ? `<span style="font-family:DM Mono,monospace;font-size:11px;font-weight:700;color:var(--amber);background:var(--abg);border:1px solid var(--aborder);border-radius:6px;padding:1px 6px;margin-left:4px">${rehabRec.rid}</span>` : '';
        const profileIcon = rehabRec ? `<span style="font-size:13px;margin-left:2px" title="植物履歷">📖</span>` : '';
        const btns = ROLE === 'owner' ? `<div style="display:flex;gap:4px;margin-top:6px">
          <button class="btn btns btnsm" onclick="event.stopPropagation();openMoveModal(${p.id})">Di chuyển / 移動</button>
          <button class="btn btnw btnsm" onclick="event.stopPropagation();openRehabModal(${p.id})">Chỉnh sửa / 修整</button>
          <button class="btn btnt btnsm" onclick="event.stopPropagation();openTrackingModal(${p.id})">📖 植物履歷</button>
        </div>` : '';
        return `<div class="pi" onclick="openPlantDetail(${p.id})" style="align-items:flex-start;padding:13px 18px">
          <div class="pdot" style="background:${mc};margin-top:4px"></div>
          <div class="pinfo">
            <div class="pname">${p.name} ${profileIcon}${ridBadge} ${lb}</div>
            <div class="pmeta">${p.cat} · ${days}ngày/天</div>
            <div class="age-bar"><div class="age-fill" style="width:${pct}%;background:${bc}"></div></div>
            ${ROLE === 'owner' ? `<div style="font-size:10px;color:var(--text3);margin-top:3px">CP ${vnd(ac)} · LN ${vnd(p.price - ac)} (${mg}%)</div>` : ''}
            ${btns}
          </div>
          <div class="pright">
            <div class="pprice">${vnd(p.price)}</div>
            <div style="font-size:22px;font-weight:700;font-family:DM Mono,monospace;color:var(--text);margin-top:4px;text-align:right">${p.qty}<span style="font-size:11px;color:var(--text2);font-weight:400">株</span></div>
          </div>
        </div>`;
      }).join('');
  }
  document.getElementById('inv-plant').innerHTML = html;
}

function renderBoardInv() {
  let h = '';
  DATA.boards.forEach(b => {
    const total = b.qty_mine + b.qty_quang + b.qty_helper;
    h += `<div style="margin:0 16px 12px;background:var(--bg2);border:1px solid var(--border);border-radius:var(--rl);padding:13px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <div style="font-size:14px;font-weight:600">${b.name}</div>
        <span class="badge bb">Tổng / 總庫存 ${total}</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-bottom:10px">
        <div style="background:var(--bg3);border-radius:var(--r);padding:8px;text-align:center"><div style="font-size:9px;color:var(--text2);margin-bottom:3px">${LOC_LABELS.mine}</div><div style="font-size:15px;font-weight:700">${b.qty_mine}</div></div>
        <div style="background:var(--bg3);border-radius:var(--r);padding:8px;text-align:center"><div style="font-size:9px;color:var(--text2);margin-bottom:3px">${LOC_LABELS.quang}</div><div style="font-size:15px;font-weight:700">${b.qty_quang}</div></div>
        <div style="background:var(--bg3);border-radius:var(--r);padding:8px;text-align:center"><div style="font-size:9px;color:var(--text2);margin-bottom:3px">${LOC_LABELS.helper}</div><div style="font-size:15px;font-weight:700">${b.qty_helper}</div></div>
      </div>
      ${ROLE === 'owner' ? `<div style="display:flex;gap:7px">
        <button class="btn btns btnsm" style="flex:1" onclick="openMoveBoardModal(${b.id})">Di chuyển / 移動</button>
        <button class="btn btns btnsm" style="flex:1" onclick="openEditBoard(${b.id})">Sửa / 編輯</button>
      </div>` : ''}
    </div>`;
  });
  document.getElementById('inv-board').innerHTML = h || '<div style="padding:32px;text-align:center;color:var(--text3)">Không có tấm / 無板子庫存</div>';
}

function renderMember() {
  if (ROLE !== 'owner') { document.getElementById('inv-member').innerHTML = '<div style="padding:32px;text-align:center;color:var(--text3)">Không có quyền / 無權限</div>'; return; }
  const members = [{ key: 'quang', label: 'Quang', av: 'Q' }, { key: 'helper', label: 'Trợ lý / 小幫手', av: 'H' }];
  let h = '';
  members.forEach(m => {
    const mp = DATA.plants.filter(p => p.loc === m.key && p.status === 'ok');
    const mb = DATA.boards.filter(b => b['qty_' + m.key] > 0).map(b => ({ name: b.name, qty: b['qty_' + m.key], id: b.id }));
    h += `<div style="margin:0 16px 14px;background:var(--bg2);border:1px solid var(--border);border-radius:var(--rl);overflow:hidden">
      <div style="display:flex;align-items:center;gap:11px;padding:13px 15px;border-bottom:1px solid var(--border)">
        <div style="width:36px;height:36px;border-radius:50%;background:var(--accdim);display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;color:var(--acc)">${m.av}</div>
        <div>
          <div style="font-size:14px;font-weight:500">${m.label}</div>
          <div style="margin-top:3px">
            <span style="font-size:18px;font-weight:700;font-family:DM Mono,monospace;color:var(--green)">${mp.reduce((s, p) => s + p.qty, 0)}</span><span style="font-size:10px;color:var(--text2)">株</span>
            <span style="margin:0 6px;color:var(--border2)">·</span>
            <span style="font-size:18px;font-weight:700;font-family:DM Mono,monospace;color:var(--blue)">${mb.reduce((s, b) => s + b.qty, 0)}</span><span style="font-size:10px;color:var(--text2)">片板</span>
          </div>
        </div>
      </div>`;
    if (mp.length === 0 && mb.length === 0) { h += '<div style="padding:14px;color:var(--text3);font-size:13px">Chưa có hàng / 目前無庫存</div>'; }
    mp.forEach(p => {
      h += `<div style="display:flex;align-items:center;gap:10px;padding:10px 15px;border-bottom:1px solid var(--border)">
        <div class="pdot" style="background:var(--green)"></div>
        <div style="flex:1"><div style="font-size:13px;font-weight:500">${p.name}</div><div style="font-size:11px;color:var(--text2)">${p.qty}株 · ${daysSince(p.purchase_date)}ngày/天</div></div>
        <div style="display:flex;gap:5px">
          <button class="btn btns btnsm" onclick="openMoveModal(${p.id})">Di chuyển / 移動</button>
          <button class="btn btnw btnsm" onclick="openRehabModal(${p.id})">Chỉnh / 修整</button>
        </div>
      </div>`;
    });
    mb.forEach(b => {
      h += `<div style="display:flex;align-items:center;gap:10px;padding:10px 15px;border-bottom:1px solid var(--border)">
        <div class="pdot" style="background:var(--blue)"></div>
        <div style="flex:1"><div style="font-size:13px;font-weight:500">${b.name}（Tấm gỗ / 板子）</div><div style="font-size:11px;color:var(--text2)">${b.qty}片</div></div>
        <button class="btn btns btnsm" onclick="openMoveBoardModal(${b.id})">Di chuyển / 移動</button>
      </div>`;
    });
    h += '</div>';
  });
  document.getElementById('inv-member').innerHTML = h;
}

function openPlantDetail(id) {
  const p = DATA.plants.find(x => x.id === id);
  if (!p) return;
  const ac = agedCost(p.cost_vnd, p.purchase_date);
  const mg = margin(p.price, p.cost_vnd, p.purchase_date);
  const days = daysSince(p.purchase_date);
  const pct = Math.min(days / 90 * 100, 100);
  const bc = pct > 66 ? 'var(--red)' : pct > 33 ? 'var(--amber)' : 'var(--green)';
  let h = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
    <div style="font-size:16px;font-weight:700">${p.name}</div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
    <div class="metric"><div class="ml">Giá vốn HT / 當前成本</div><div class="mv amber" style="font-size:15px">${vnd(ac)}</div></div>
    <div class="metric"><div class="ml">Giá bán ĐX / 建議售價</div><div class="mv blue" style="font-size:15px">${vnd(p.price)}</div></div>
    <div class="metric"><div class="ml">Lợi nhuận / 毛利</div><div class="mv" style="font-size:13px;color:${parseFloat(mg) > 30 ? 'var(--green)' : 'var(--red)'}">${vnd(p.price - ac)}<br><span style='font-size:11px'>${mg}%</span></div></div>
    <div class="metric"><div class="ml">Ngày trong kho / 在庫天數</div><div class="mv" style="font-size:15px">${days}天</div></div>
  </div>
  <div style="background:var(--bg3);border-radius:var(--r);padding:12px;margin-bottom:12px;font-size:12px">
    <div style="display:flex;justify-content:space-between;padding:3px 0"><span style="color:var(--text2)">Phân loại / 分類</span><span>${p.cat}</span></div>
    <div style="display:flex;justify-content:space-between;padding:3px 0"><span style="color:var(--text2)">Giá vốn gốc / 原始成本</span><span>${vnd(p.cost_vnd)}</span></div>
    <div style="display:flex;justify-content:space-between;padding:3px 0"><span style="color:var(--text2)">Chi phí tăng thêm / 成本遞增</span><span style="color:var(--red)">+${vnd(ac - p.cost_vnd)}</span></div>
    <div style="display:flex;justify-content:space-between;padding:3px 0"><span style="color:var(--text2)">Tồn kho / 庫存</span><span>${p.qty}株</span></div>
    <div style="display:flex;justify-content:space-between;padding:3px 0"><span style="color:var(--text2)">Vị trí / 位置</span><span>${LOC_LABELS[p.loc]}</span></div>
    <div style="display:flex;justify-content:space-between;padding:3px 0"><span style="color:var(--text2)">Ngày nhập / 進貨日期</span><span>${p.purchase_date}</span></div>
    ${p.note ? `<div style="display:flex;justify-content:space-between;padding:3px 0"><span style="color:var(--text2)">Ghi chú / 備註</span><span>${p.note}</span></div>` : ''}
  </div>
  <div class="age-bar" style="height:7px;margin-bottom:14px"><div class="age-fill" style="width:${pct}%;background:${bc}"></div></div>
  <div style="display:flex;gap:10px">
    <button class="btn btns" style="flex:1" onclick="closeM('m-detail')">Đóng / 關閉</button>
    ${ROLE === 'owner' ? `<button class="btn btnw" style="flex:1" onclick="closeM('m-detail');openRehabModal(${p.id})">→ Khu CS / 修整區</button>` : ''}
    ${ROLE === 'owner' ? `<button class="btn btnt" style="flex:1" onclick="closeM('m-detail');openTrackingModal(${p.id})">🎬 追蹤</button>` : ''}
  </div>`;
  document.getElementById('detail-inner').innerHTML = h;
  openM('m-detail');
}

// MOVE PLANT
let movePlantId = null;
function openMoveModal(id) {
  movePlantId = id;
  closeM('m-detail');
  const p = DATA.plants.find(x => x.id === id);
  document.getElementById('move-info').innerHTML = `<span style="font-weight:500">${p.name}</span> <span class="${LOC_CLASS[p.loc]}">${LOC_LABELS[p.loc]}</span> · ${p.qty}株`;
  document.getElementById('move-loc').value = p.loc;
  document.getElementById('move-qty').value = 1;
  document.getElementById('move-qty').max = p.qty;
  document.getElementById('move-note').value = '';
  openM('m-moveplant');
}

async function doMove() {
  const p = DATA.plants.find(x => x.id === movePlantId);
  if (!p) return;
  const qty = parseInt(document.getElementById('move-qty').value) || 1;
  const toLoc = document.getElementById('move-loc').value;
  const note = document.getElementById('move-note').value;
  if (qty > p.qty) { showToast('Vượt SL / 數量超過庫存', 'error'); return; }
  if (toLoc === p.loc) { showToast('Vị trí giống nhau / 目標位置相同', 'error'); return; }
  showLoading(true);
  if (qty < p.qty) {
    await DB.updatePlant(p.id, { qty: p.qty - qty });
    const existing = DATA.plants.find(x => x.name === p.name && x.loc === toLoc && x.status === 'ok');
    if (existing) { await DB.updatePlant(existing.id, { qty: existing.qty + qty }); }
    else { await DB.addPlant({ name: p.name, cat: p.cat, cost_ntd: p.cost_ntd, cost_vnd: p.cost_vnd, price: p.price, qty, purchase_date: p.purchase_date, loc: toLoc, note: note || p.note, status: 'ok' }); }
  } else { await DB.updatePlant(p.id, { loc: toLoc, note: note || p.note }); }
  await loadAllData();
  showLoading(false);
  closeM('m-moveplant');
  renderInv();
  showToast('Đã di chuyển / 已移動');
}

// MOVE BOARD
let moveBoardId = null;
function openMoveBoardModal(id) {
  moveBoardId = id;
  const b = DATA.boards.find(x => x.id === id);
  document.getElementById('moveboard-info').innerHTML = `<span style="font-weight:500">${b.name}</span><br>
    <span class="loc-m">${LOC_LABELS.mine} ${b.qty_mine}</span>
    <span class="loc-q" style="margin:0 4px">${LOC_LABELS.quang} ${b.qty_quang}</span>
    <span class="loc-h">${LOC_LABELS.helper} ${b.qty_helper}</span>`;
  document.getElementById('moveboard-from').value = 'mine';
  document.getElementById('moveboard-to').value = 'quang';
  document.getElementById('moveboard-qty').value = 1;
  openM('m-moveboard');
}

async function doMoveBoard() {
  const b = DATA.boards.find(x => x.id === moveBoardId);
  if (!b) return;
  const qty = parseInt(document.getElementById('moveboard-qty').value) || 1;
  const fromLoc = document.getElementById('moveboard-from').value;
  const toLoc = document.getElementById('moveboard-to').value;
  if (fromLoc === toLoc) { showToast('Vị trí giống nhau / 位置相同', 'error'); return; }
  const fromField = 'qty_' + fromLoc;
  const toField = 'qty_' + toLoc;
  if (b[fromField] < qty) { showToast('Không đủ số lượng / 數量不足', 'error'); return; }
  showLoading(true);
  await DB.updateBoard(b.id, { [fromField]: b[fromField] - qty, [toField]: b[toField] + qty });
  await loadAllData();
  showLoading(false);
  closeM('m-moveboard');
  renderBoardInv();
  showToast('Đã di chuyển / 已移動');
}

// ADD PLANT
async function addPlant() {
  const name = document.getElementById('np-name').value.trim();
  if (!name) { showToast('Vui lòng nhập tên cây / 請填寫植物名稱', 'error'); return; }
  const cntd = parseInt(document.getElementById('np-cntd').value) || 0;
  const plant = {
    name, cat: document.getElementById('np-cat').value,
    cost_ntd: cntd, cost_vnd: cntd * CFG.rate,
    price: parseInt(document.getElementById('np-price').value) || 0,
    qty: parseInt(document.getElementById('np-qty').value) || 1,
    purchase_date: document.getElementById('np-date').value || todayStr(),
    loc: document.getElementById('np-loc').value,
    note: document.getElementById('np-note').value,
    status: 'ok'
  };
  showLoading(true);
  await DB.addPlant(plant);
  document.getElementById('np-name').value = '';
  await loadAllData();
  showLoading(false);
  closeM('m-addplant');
  renderInv();
  showToast('Đã thêm cây / 已新增植物');
}

// EDIT PLANT
let editPlantId = null;
function openEditPlant(id) {
  editPlantId = id;
  const p = DATA.plants.find(x => x.id === id);
  if (!p) return;
  document.getElementById('ep-id').value = id;
  document.getElementById('ep-name').value = p.name;
  document.getElementById('ep-cost-ntd').value = p.cost_ntd || 0;
  document.getElementById('ep-cost-vnd').value = p.cost_vnd || 0;
  document.getElementById('ep-price').value = p.price;
  document.getElementById('ep-qty').value = p.qty;
  document.getElementById('ep-date').value = p.purchase_date;
  document.getElementById('ep-loc').value = p.loc;
  document.getElementById('ep-note').value = p.note || '';
  openM('m-editplant');
}

async function savePlantEdit() {
  const id = parseInt(document.getElementById('ep-id').value);
  const costNtd = parseInt(document.getElementById('ep-cost-ntd').value) || 0;
  const costVnd = parseInt(document.getElementById('ep-cost-vnd').value) || costNtd * CFG.rate;
  const updates = {
    name: document.getElementById('ep-name').value,
    cost_ntd: costNtd, cost_vnd: costVnd,
    price: parseInt(document.getElementById('ep-price').value) || 0,
    qty: parseInt(document.getElementById('ep-qty').value) || 0,
    purchase_date: document.getElementById('ep-date').value,
    loc: document.getElementById('ep-loc').value,
    note: document.getElementById('ep-note').value
  };
  showLoading(true);
  await DB.updatePlant(id, updates);
  await loadAllData();
  showLoading(false);
  closeM('m-editplant');
  renderInv();
  renderPos();
  showToast('Đã lưu / 已儲存');
}

// REHAB
let rehabPlantId = null;
function openRehabModal(id) {
  closeM('m-detail');
  rehabPlantId = id;
  const p = DATA.plants.find(x => x.id === id);
  document.getElementById('rehab-info').innerHTML = `<span style="font-weight:500">${p.name}</span> <span class="${LOC_CLASS[p.loc]}">${LOC_LABELS[p.loc]}</span> · ${p.qty}株`;
  document.getElementById('rehab-qty').value = 1;
  document.getElementById('rehab-qty').max = p.qty;
  document.getElementById('rehab-note').value = '';
  openM('m-rehab');
}

async function confirmRehab() {
  const p = DATA.plants.find(x => x.id === rehabPlantId);
  if (!p) return;
  const qty = parseInt(document.getElementById('rehab-qty').value) || 1;
  const note = document.getElementById('rehab-note').value;
  if (qty > p.qty) { showToast('Vượt SL / 數量超過庫存', 'error'); return; }
  showLoading(true);
  const firstRid = await DB.getNextRid();
  const firstNum = parseInt(firstRid.replace('R-', ''));
  for (let i = 0; i < qty; i++) {
    const rid = 'R-' + String(firstNum + i).padStart(3, '0');
    const qrUrl = `https://plant-profile.vercel.app/plant/${rid}`;
    await DB.addRehab({
      rid, plant_id: p.id, plant_name: p.name, qty: 1,
      purchase_date: p.purchase_date, rehab_date: todayStr(),
      note, loc: p.loc, status: 'rehab', qr_code: qrUrl, price: p.price, cost_vnd: p.cost_vnd || 0
    });
  }
  await DB.updatePlant(p.id, { qty: p.qty - qty });
  await loadAllData();
  showLoading(false);
  closeM('m-rehab');
  renderInv();
  invTab('rehab');
  const lastRid = 'R-' + String(firstNum + qty - 1).padStart(3, '0');
  showToast(`已移入修整區 ${firstRid} ~ ${lastRid}`);
}

// TRACKING（縮時追蹤）
let trackingPlantId = null;
function openTrackingModal(id) {
  closeM('m-detail');
  trackingPlantId = id;
  const p = DATA.plants.find(x => x.id === id);
  document.getElementById('tracking-info').innerHTML = `<span style="font-weight:500">${p.name}</span> <span class="${LOC_CLASS[p.loc]}">${LOC_LABELS[p.loc]}</span> · ${p.qty}株`;
  document.getElementById('tracking-qty').value = 1;
  document.getElementById('tracking-qty').max = p.qty;
  document.getElementById('tracking-note').value = '';
  openM('m-tracking');
}

async function confirmTracking() {
  const p = DATA.plants.find(x => x.id === trackingPlantId);
  if (!p) return;
  const qty = parseInt(document.getElementById('tracking-qty').value) || 1;
  const note = document.getElementById('tracking-note').value;
  if (qty > p.qty) { showToast('數量超過庫存', 'error'); return; }
  if (p.qty <= 0) { showToast('庫存不足', 'error'); return; }
  showLoading(true);
  const firstRid = await DB.getNextRid();
  const firstNum = parseInt(firstRid.replace('R-', ''));
  for (let i = 0; i < qty; i++) {
    const rid = 'R-' + String(firstNum + i).padStart(3, '0');
    const qrUrl = `https://plant-profile.vercel.app/plant/${rid}`;
    await DB.addRehab({
      rid, plant_id: p.id, plant_name: p.name, qty: 1,
      purchase_date: p.purchase_date, rehab_date: todayStr(),
      note, loc: p.loc, status: 'tracking', qr_code: qrUrl, price: p.price, cost_vnd: p.cost_vnd || 0
    });
  }
  await DB.updatePlant(p.id, { qty: p.qty - qty });
  await loadAllData();
  showLoading(false);
  closeM('m-tracking');
  renderInv();
  invTab('tracking');
  const lastRid = 'R-' + String(firstNum + qty - 1).padStart(3, '0');
  showToast(`🎬 ${firstRid} ~ ${lastRid} 已開始追蹤`);
}

let trackingSubTab = 'tracking';

function renderTracking(sub) {
  if (sub) trackingSubTab = sub;
  const el = document.getElementById('inv-tracking');
  const trackingItems = DATA.rehab.filter(r => r.status === 'tracking');
  const availableItems = DATA.rehab.filter(r => r.status === 'available');
  const soldItems = DATA.rehab.filter(r => r.status === 'sold');

  const tabs = [
    { key: 'tracking', label: '待販售', count: trackingItems.length, color: 'var(--blue)' },
    { key: 'available', label: '可販售', count: availableItems.length, color: 'var(--acc)' },
    { key: 'sold', label: '售出', count: soldItems.length, color: 'var(--green)' },
  ];

  let h = `<div style="display:flex;gap:4px;padding:8px 16px 10px;border-bottom:1px solid var(--border)">`;
  tabs.forEach(t => {
    const active = trackingSubTab === t.key;
    h += `<button onclick="renderTracking('${t.key}')" style="flex:1;padding:6px 4px;border-radius:var(--r);border:1px solid ${active ? t.color : 'var(--border)'};background:${active ? 'rgba(0,0,0,0.3)' : 'transparent'};color:${active ? t.color : 'var(--text2)'};font-size:11px;font-weight:${active ? '700' : '400'};cursor:pointer;font-family:inherit;line-height:1.4">
      ${t.label}<br><span style="font-size:10px">(${t.count})</span>
    </button>`;
  });
  h += `</div>`;

  const items = trackingSubTab === 'tracking' ? trackingItems : trackingSubTab === 'available' ? availableItems : soldItems;

  if (items.length === 0) {
    h += '<div style="padding:32px;text-align:center;color:var(--text3)">此分類目前無植物</div>';
  } else {
    items.forEach(r => { h += renderTrackingRow(r); });
  }

  el.innerHTML = h;
}

function renderTrackingRow(r) {
  const trackDays = daysSince(r.rehab_date);
  const statusColor = r.status === 'sold' ? 'var(--green)' : r.status === 'available' ? 'var(--acc)' : 'var(--blue)';
  return `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid var(--border);background:var(--bg2);cursor:pointer"
    onclick="openTrackingDetail('${r.rid}')">
    <div class="pdot" style="background:${statusColor}"></div>
    <div style="flex:1;min-width:0">
      <div style="font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.plant_name}</div>
      <div style="font-size:10px;color:var(--text2);margin-top:1px">
        <span style="font-family:DM Mono,monospace;color:var(--amber)">${r.rid}</span>
        · 追蹤${trackDays}天
      </div>
    </div>
    <div style="text-align:right;flex-shrink:0">
      <div style="font-size:12px;font-weight:500;font-family:DM Mono,monospace">${vnd(r.price || 0)}</div>
    </div>
  </div>`;
}

let trackingDetailRid = null;
function openTrackingDetail(rid) {
  trackingDetailRid = rid;
  const r = DATA.rehab.find(x => x.rid === rid);
  if (!r) return;
  const isSold = r.status === 'sold';
  document.getElementById('detail-inner').innerHTML = renderTrackingCard(r, isSold);
  openM('m-detail');
}

function renderTrackingCard(r, isSold) {
  const stockDays = daysSince(r.purchase_date);
  const trackDays = daysSince(r.rehab_date);
  const bc = trackDays > 30 ? 'var(--green)' : trackDays > 14 ? 'var(--amber)' : 'var(--blue)';
  const borderColor = isSold ? 'var(--gborder)' : 'var(--bborder)';
  const bgColor = isSold ? 'var(--gbg)' : 'var(--bbg)';
  const badge = isSold ? '<span class="badge bg">✅ 已售出</span>' : '<span class="badge bb">🎬 追蹤中</span>';
  const qrUrl = r.qr_code || '';
  const qrImg = qrUrl ? `https://chart.googleapis.com/chart?chs=160x160&cht=qr&chl=${encodeURIComponent(qrUrl)}` : '';

  return `<div style="margin:0 16px 12px;background:var(--bg2);border:1px solid ${borderColor};border-radius:var(--rl);overflow:hidden">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:${bgColor};border-bottom:1px solid var(--border)">
      <div>
        <div style="font-size:14px;font-weight:700">${r.plant_name}</div>
        <div style="font-size:11px;color:var(--text2);margin-top:2px">${r.rid} · <span class="${LOC_CLASS[r.loc]}">${LOC_LABELS[r.loc]}</span></div>
      </div>
      ${badge}
    </div>
    <div style="padding:12px 14px">
      <div style="display:flex;gap:8px;margin-bottom:10px">
        <div style="background:var(--bg3);border-radius:var(--r);padding:8px 10px;text-align:center;flex:1">
          <div style="font-size:9px;color:var(--text2)">在庫天數</div>
          <div style="font-size:16px;font-weight:700;font-family:DM Mono,monospace">${stockDays}</div>
        </div>
        <div style="background:${bgColor};border:1px solid ${borderColor};border-radius:var(--r);padding:8px 10px;text-align:center;flex:1">
          <div style="font-size:9px;color:var(--text2)">追蹤天數</div>
          <div style="font-size:16px;font-weight:700;font-family:DM Mono,monospace;color:${bc}">${trackDays}</div>
        </div>
        <div style="background:var(--bg3);border-radius:var(--r);padding:8px 10px;text-align:center;flex:1">
          <div style="font-size:9px;color:var(--text2)">售價</div>
          <div style="font-size:13px;font-weight:700;font-family:DM Mono,monospace">${vnd(r.price || 0)}</div>
        </div>
      </div>
      ${qrUrl ? `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;padding:10px;background:var(--bg3);border-radius:var(--r)">
        <img src="${qrImg}" style="width:80px;height:80px;border-radius:6px;background:#fff;padding:4px" />
        <div style="flex:1;min-width:0">
          <div style="font-size:10px;color:var(--text2);margin-bottom:4px">客戶頁面網址</div>
          <div style="font-size:10px;color:var(--blue);word-break:break-all;margin-bottom:8px">${qrUrl}</div>
          <button class="btn btnt btnsm" style="width:100%" onclick="navigator.clipboard.writeText('${qrUrl}').then(()=>showToast('已複製網址！'))">複製連結</button>
        </div>
      </div>` : ''}
      ${r.note ? `<div style="font-size:11px;color:var(--text3);margin-bottom:8px;padding:6px 8px;background:var(--bg3);border-radius:6px">${r.note}</div>` : ''}
      ${ROLE === 'owner' && !isSold ? `<div style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn btns btnsm" style="flex:1" onclick="openEditRehab('${r.rid}')">編輯</button>
        ${r.status === 'available'
          ? `<button class="btn btnt btnsm" style="flex:1" onclick="setRehabStatus('${r.rid}','tracking')">↩ 待販售</button>`
          : `<button class="btn btnp btnsm" style="flex:1" onclick="setRehabStatus('${r.rid}','available')">✅ 標記可販售</button>`
        }
        <button class="btn btnd btnsm" style="flex:1" onclick="openRehabWriteoff('${r.rid}')">報廢</button>
      </div>` : ''}
    </div>
  </div>`;
}

function renderRehab() {
  const el = document.getElementById('inv-rehab');
  if (DATA.rehab.length === 0) {
    el.innerHTML = '<div style="padding:32px;text-align:center;color:var(--text3)">Không có cây trong khu CS / 修整區無植物</div>';
    return;
  }

  // 只顯示修整中
  const rehabItems = DATA.rehab.filter(r => r.status === 'rehab');

  let h = '';

  // 修整中區塊
  if (rehabItems.length > 0) {
    h += `<div style="margin:0 16px 6px;font-size:11px;font-weight:700;color:var(--amber);padding:8px 0">🔧 修整中 / Đang chỉnh sửa</div>`;
    // 按植物名稱分組
    const groups = {};
    rehabItems.forEach(r => {
      if (!groups[r.plant_name]) groups[r.plant_name] = [];
      groups[r.plant_name].push(r);
    });
    Object.keys(groups).forEach(plantName => {
      const plants = groups[plantName];
      h += `<div style="margin:0 16px 10px;background:var(--bg2);border:1px solid var(--aborder);border-radius:var(--rl);overflow:hidden">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:var(--bg3);border-bottom:1px solid var(--border)">
          <span style="font-size:14px;font-weight:700">${plantName}</span>
          <span class="badge ba">${plants.length}株 修整中</span>
        </div>`;
      plants.forEach(r => { h += renderRehabCardInner(r); });
      h += '</div>';
    });
  }

  el.innerHTML = rehabItems.length === 0 ? '<div style="padding:32px;text-align:center;color:var(--text3)">🔧 目前無修整中植物</div>' : h;
}

function renderRehabCard(r) {
  return `<div style="margin:0 16px 10px;background:var(--bg2);border:1px solid var(--border);border-radius:var(--rl);overflow:hidden">
    <div style="padding:12px 14px;border-bottom:1px solid var(--border)">
      <div style="font-size:14px;font-weight:700;margin-bottom:4px">${r.plant_name}</div>
      ${renderRehabCardInner(r)}
    </div>
  </div>`;
}

function renderRehabCardInner(r) {
  const stockDays = daysSince(r.purchase_date);
  const rehabDays = daysSince(r.rehab_date);
  const bc = rehabDays > 14 ? 'var(--red)' : rehabDays > 7 ? 'var(--amber)' : 'var(--green)';
  const statusLabel = r.status === 'tracking' ? '🎬 追蹤中' : r.status === 'available' ? '✅ 可售' : '🔧 修整中';
  const cardId = 'rc-' + r.rid;
  return `<div style="border-bottom:1px solid var(--border)">
    <div onclick="const d=document.getElementById('${cardId}');d.style.display=d.style.display==='none'?'block':'none'"
      style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;cursor:pointer">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-family:DM Mono,monospace;font-size:12px;color:var(--amber);font-weight:700">${r.rid}</span>
        <span class="${LOC_CLASS[r.loc]}" style="font-size:10px">${LOC_LABELS[r.loc]}</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        <span style="font-size:10px;color:var(--text2)">${rehabDays}天</span>
        <span style="font-size:10px;color:var(--text3)">▼</span>
      </div>
    </div>
    <div id="${cardId}" style="display:none;padding:0 14px 11px">
      <div style="font-size:10px;color:var(--text2);margin-bottom:6px">${statusLabel}</div>
      ${r.qr_code ? `<div style="font-size:10px;color:var(--blue);margin-bottom:8px;padding:6px 8px;background:var(--bbg);border-radius:6px;display:flex;align-items:center;gap:6px">
        <span style="flex:1;word-break:break-all">${r.qr_code}</span>
        <button class="btn btnt btnsm" style="flex-shrink:0;padding:3px 8px;font-size:10px" onclick="event.stopPropagation();navigator.clipboard.writeText('${r.qr_code}').then(()=>showToast('已複製！'))">複製</button>
      </div>` : ''}
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <div style="background:var(--bg3);border-radius:var(--r);padding:6px 10px;text-align:center;flex:1">
          <div style="font-size:9px;color:var(--text2)">在庫天數</div>
          <div style="font-size:14px;font-weight:700;font-family:DM Mono,monospace">${stockDays}</div>
        </div>
        <div style="background:var(--rbg);border:1px solid var(--rborder);border-radius:var(--r);padding:6px 10px;text-align:center;flex:1">
          <div style="font-size:9px;color:var(--text2)">修整天數</div>
          <div style="font-size:14px;font-weight:700;font-family:DM Mono,monospace;color:${bc}">${rehabDays}</div>
        </div>
      </div>
      ${r.note ? `<div style="font-size:11px;color:var(--text3);margin-bottom:7px;padding:6px 8px;background:var(--bg3);border-radius:6px">${r.note}</div>` : ''}
      ${ROLE === 'owner' ? `<div style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn btns btnsm" style="flex:1" onclick="openEditRehab('${r.rid}')">編輯</button>
        <button class="btn btnp btnsm" style="flex:1" onclick="setRehabStatus('${r.rid}','available')">✅ 可販售</button>
        <button class="btn btnd btnsm" style="flex:1" onclick="openRehabWriteoff('${r.rid}')">報廢</button>
      </div>` : ''}
    </div>
  </div>`;
}

async function setRehabStatus(rid, status) {
  const r = DATA.rehab.find(x => x.rid === rid);
  if (!r) return;
  showLoading(true);
  await DB.updateRehab(r.id, { status });
  await loadAllData();
  showLoading(false);
  renderRehab();
  renderPos();
  const msg = status === 'available' ? `${rid} 已標記可售，開單區可看到` : `${rid} 已開始縮時追蹤`;
  showToast(msg);
}

// 報廢修整區植物
let rehabWriteoffRid = null;
function openRehabWriteoff(rid) {
  rehabWriteoffRid = rid;
  const r = DATA.rehab.find(x => x.rid === rid);
  const cost = agedCost(r.cost_vnd || 0, r.purchase_date);
  document.getElementById('rwo-info').innerHTML = `
    <span style="font-weight:500">${r.rid} ${r.plant_name}</span>
    <div style="margin-top:8px;font-size:12px;color:var(--red)">
      預估損失成本：${vnd(cost)}
    </div>`;
  document.getElementById('rwo-reason').value = '';
  openM('m-rehabwriteoff');
}

async function confirmRehabWriteoff() {
  const reason = document.getElementById('rwo-reason').value.trim();
  if (!reason) { showToast('請填寫報廢原因', 'error'); return; }
  const r = DATA.rehab.find(x => x.rid === rehabWriteoffRid);
  if (!r) return;
  if (!confirm(`確認報廢 ${r.rid} ${r.plant_name}？`)) return;
  showLoading(true);
  const actualCost = agedCost(r.cost_vnd || 0, r.purchase_date);
  await DB.addWriteoff({
    writeoff_date: todayStr(), plant_name: r.plant_name,
    qty: 1, reason, loc: r.loc, operator: ROLE === 'owner' ? 'Chandler Wei' : ROLE,
    cost: actualCost
  });
  await DB.updateRehab(r.id, { status: 'writeoff' });
  await loadAllData();
  showLoading(false);
  closeM('m-rehabwriteoff');
  renderRehab();
  showToast(`${r.rid} 已報廢`);
}

// 編輯修整記錄
let editRehabRid = null;
function openEditRehab(rid) {
  editRehabRid = rid;
  const r = DATA.rehab.find(x => x.rid === rid);
  if (!r) return;
  document.getElementById('er-rid').value = rid;
  document.getElementById('er-date').value = r.rehab_date;
  document.getElementById('er-note').value = r.note || '';
  openM('m-editrehab');
}

async function saveRehabEdit() {
  const rid = document.getElementById('er-rid').value;
  const r = DATA.rehab.find(x => x.rid === rid);
  if (!r) return;
  showLoading(true);
  await DB.updateRehab(r.id, {
    rehab_date: document.getElementById('er-date').value,
    note: document.getElementById('er-note').value
  });
  await loadAllData();
  showLoading(false);
  closeM('m-editrehab');
  renderRehab();
  showToast('Đã lưu / 已儲存');
}
