// v5 - 2026-05-02 17:40
// ==================== INVENTORY MODULE ====================

function invTab(t) {
  ['plant','board','member','rehab'].forEach(x => {
    document.getElementById('itab-' + x).classList.toggle('active', x === t);
    document.getElementById('inv-' + x).style.display = x === t ? 'block' : 'none';
  });
  if (t === 'plant') renderInvPlants();
  if (t === 'board') renderBoardInv();
  if (t === 'member') renderMember();
  if (t === 'rehab') renderRehab();
}

function renderInv() {
  document.getElementById('inv-addbtn').innerHTML = ROLE === 'owner'
    ? '<button class="btn btnp btnsm" onclick="openM(\'m-addplant\')">+ Thêm / 新增</button>' : '';
  renderInvPlants();
}

function renderInvPlants() {
  const plants = DATA.plants.filter(p => p.status === 'ok');
  document.getElementById('inv-plant').innerHTML = plants.length === 0
    ? '<div style="padding:32px;text-align:center;color:var(--text3)">Không có cây / 無植物庫存</div>'
    : plants.map(p => {
        const ac = agedCost(p.cost_vnd, p.purchase_date);
        const mg = parseFloat(margin(p.price, p.cost_vnd, p.purchase_date));
        const mc = mg > 40 ? 'var(--green)' : mg > 20 ? 'var(--amber)' : 'var(--red)';
        const days = daysSince(p.purchase_date);
        const pct = Math.min(days / 90 * 100, 100);
        const bc = pct > 66 ? 'var(--red)' : pct > 33 ? 'var(--amber)' : 'var(--green)';
        const lb = ROLE === 'owner' ? `<span class="${LOC_CLASS[p.loc]}">${LOC_LABELS[p.loc]}</span>` : '';
        const btns = ROLE === 'owner'
          ? `<div style="display:flex;gap:4px;margin-top:6px">
              <button class="btn btns btnsm" onclick="event.stopPropagation();openMoveModal(${p.id})">Di chuyển / 移動</button>
              <button class="btn btnw btnsm" onclick="event.stopPropagation();openRehabModal(${p.id})">Chỉnh sửa / 修整</button>
             </div>` : '';
        return `<div class="pi" onclick="openPlantDetail(${p.id})" style="align-items:flex-start;padding:13px 18px">
          <div class="pdot" style="background:${mc};margin-top:4px"></div>
          <div class="pinfo">
            <div class="pname">${p.name} ${lb}</div>
            <div class="pmeta">${p.cat} · ${p.qty}株 · ${days}ngày/天</div>
            <div class="age-bar"><div class="age-fill" style="width:${pct}%;background:${bc}"></div></div>
            ${ROLE === 'owner' ? `<div style="font-size:10px;color:var(--text3);margin-top:3px">CP ${vnd(ac)} · Lợi nhuận / 毛利 ${mg}%</div>` : ''}
            ${btns}
          </div>
          <div class="pright"><div class="pprice">${vnd(p.price)}</div></div>
        </div>`;
      }).join('');
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
  document.getElementById('inv-board').innerHTML = h || '<div style="padding:32px;text-align:center;color:var(--text3)">Không có tấm gỗ / 無板子庫存</div>';
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
          <div style="font-size:11px;color:var(--text2)">Cây / 植物 ${mp.reduce((s, p) => s + p.qty, 0)}株 · Tấm / 板子 ${mb.reduce((s, b) => s + b.qty, 0)}片</div>
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
    <div class="metric"><div class="ml">Tỷ lệ LN / 毛利率</div><div class="mv" style="font-size:15px;color:${parseFloat(mg) > 30 ? 'var(--green)' : 'var(--red)'}">${mg}%</div></div>
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
    ${ROLE === 'owner' ? `<button class="btn btnd" style="flex:1" onclick="closeM('m-detail');openRehabModal(${p.id})">→ Khu CS / 修整區</button>` : ''}
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
    // 部分移動 — 更新原記錄，新增目標位置記錄
    await DB.updatePlant(p.id, { qty: p.qty - qty });
    const existing = DATA.plants.find(x => x.name === p.name && x.loc === toLoc && x.status === 'ok');
    if (existing) {
      await DB.updatePlant(existing.id, { qty: existing.qty + qty });
    } else {
      await DB.addPlant({ name: p.name, cat: p.cat, cost_ntd: p.cost_ntd, cost_vnd: p.cost_vnd, price: p.price, qty, purchase_date: p.purchase_date, loc: toLoc, note: note || p.note, status: 'ok' });
    }
  } else {
    await DB.updatePlant(p.id, { loc: toLoc, note: note || p.note });
  }
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

// EDIT PLANT (admin)
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
    cost_ntd: costNtd,
    cost_vnd: costVnd,
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
  const rid = await DB.getNextRid();
  await DB.addRehab({
    rid, plant_id: p.id, plant_name: p.name, qty,
    purchase_date: p.purchase_date, rehab_date: todayStr(),
    note, loc: p.loc, status: 'rehab'
  });
  await DB.updatePlant(p.id, { qty: p.qty - qty });
  await loadAllData();
  showLoading(false);
  closeM('m-rehab');
  renderInv();
  invTab('rehab');
  showToast(`Đã chuyển vào khu CS / 已移入修整區 · ${rid}`);
}

function renderRehab() {
  const el = document.getElementById('inv-rehab');
  if (DATA.rehab.length === 0) { el.innerHTML = '<div style="padding:32px;text-align:center;color:var(--text3)">Không có cây trong khu CS / 修整區無植物</div>'; return; }
  let h = '';
  DATA.rehab.forEach(r => {
    const stockDays = daysSince(r.purchase_date);
    const rehabDays = daysSince(r.rehab_date);
    h += `<div style="margin:0 16px 10px;background:var(--bg2);border:1px solid var(--aborder);border-radius:var(--rl);padding:13px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <span style="font-family:DM Mono,monospace;font-size:13px;color:var(--amber);font-weight:700">${r.rid}</span>
        <span class="badge ba">${r.qty}株 Đang CS / 修整中</span>
      </div>
      <div style="font-size:14px;font-weight:600;margin-bottom:4px">${r.plant_name}</div>
      <div style="font-size:11px;color:var(--text2);margin-bottom:8px"><span class="${LOC_CLASS[r.loc]}">${LOC_LABELS[r.loc]}</span></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
        <div style="background:var(--bg3);border-radius:var(--r);padding:9px;text-align:center">
          <div style="font-size:10px;color:var(--text2);margin-bottom:3px">Ngày trong kho / 在庫天數</div>
          <div style="font-size:16px;font-weight:700;font-family:DM Mono,monospace">${stockDays}</div>
        </div>
        <div style="background:var(--rbg);border:1px solid var(--rborder);border-radius:var(--r);padding:9px;text-align:center">
          <div style="font-size:10px;color:var(--text2);margin-bottom:3px">Ngày chỉnh sửa / 修整天數</div>
          <div style="font-size:16px;font-weight:700;font-family:DM Mono,monospace;color:var(--red)">${rehabDays}</div>
        </div>
      </div>
      ${r.note ? `<div style="font-size:11px;color:var(--text3);margin-bottom:8px">${r.note}</div>` : ''}
      ${ROLE === 'owner' ? `<div style="display:flex;gap:8px">
        <button class="btn btns btnsm" style="flex:1" onclick="openEditRehab('${r.rid}')">Sửa ngày / 編輯日期</button>
        <button class="btn btns btnsm" style="flex:1" onclick="openReleaseRehab('${r.rid}')">Chuyển lại kho / 移回庫存</button>
      </div>` : ''}
    </div>`;
  });
  el.innerHTML = h;
}

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
  await DB.updateRehab(r.id, { rehab_date: document.getElementById('er-date').value, note: document.getElementById('er-note').value });
  await loadAllData();
  showLoading(false);
  closeM('m-editrehab');
  renderRehab();
  showToast('Đã lưu / 已儲存');
}

function openReleaseRehab(rid) {
  const r = DATA.rehab.find(x => x.rid === rid);
  if (!r) return;
  document.getElementById('rr-rid').value = rid;
  document.getElementById('rr-info').innerHTML = `<span style="font-weight:500">${r.rid} ${r.plant_name}</span> · ${r.qty}株`;
  document.getElementById('rr-qty').value = r.qty;
  document.getElementById('rr-qty').max = r.qty;
  document.getElementById('rr-loc').value = r.loc;
  openM('m-releaserhab');
}

async function doReleaseRehab() {
  const rid = document.getElementById('rr-rid').value;
  const r = DATA.rehab.find(x => x.rid === rid);
  if (!r) return;
  const qty = parseInt(document.getElementById('rr-qty').value) || 1;
  const toLoc = document.getElementById('rr-loc').value;
  if (qty > r.qty) { showToast('Vượt SL / 數量超過修整區庫存', 'error'); return; }
  showLoading(true);
  const existing = DATA.plants.find(p => p.name === r.plant_name && p.loc === toLoc && p.status === 'ok');
  if (existing) {
    await DB.updatePlant(existing.id, { qty: existing.qty + qty });
  } else {
    await DB.addPlant({ name: r.plant_name, cat: '植物', cost_ntd: 0, cost_vnd: 0, price: 0, qty, purchase_date: r.purchase_date || todayStr(), loc: toLoc, note: 'Từ khu CS / 從修整區移回', status: 'ok' });
  }
  if (qty >= r.qty) {
    await DB.releaseRehab(r.id);
  } else {
    await DB.updateRehab(r.id, { qty: r.qty - qty });
  }
  await loadAllData();
  showLoading(false);
  closeM('m-releaserhab');
  renderRehab();
  renderInv();
  showToast('Đã chuyển lại kho / 已移回庫存');
}
