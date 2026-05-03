// ==================== SHIPPING MODULE ====================

function renderShipping() {
  const orders = DATA.orders.filter(o => o.status === 'completed');
  const pending = orders.filter(o => !o.shipped);
  const shipped = orders.filter(o => o.shipped);

  let h = `
  <div style="padding:16px 16px 8px;display:flex;justify-content:space-between;align-items:center">
    <div>
      <div style="font-size:18px;font-weight:700">Giao hàng / 出貨管理</div>
      <div style="font-size:12px;color:var(--text2);margin-top:2px">
        待寄出 <span style="color:var(--amber);font-weight:600">${pending.length}</span> 筆・
        已寄出 <span style="color:var(--green);font-weight:600">${shipped.length}</span> 筆
      </div>
    </div>
    <button onclick="logout()" style="background:var(--bg3);border:1px solid var(--border);color:var(--text2);padding:7px 14px;border-radius:100px;font-size:12px;cursor:pointer;font-family:inherit">登出</button>
  </div>

  <!-- 篩選頁籤 -->
  <div style="display:flex;gap:8px;padding:0 16px 12px">
    <button onclick="renderShippingFilter('pending')" id="ship-tab-pending"
      style="flex:1;padding:8px;border-radius:var(--r);border:1px solid var(--amber);background:var(--abg);color:var(--amber);font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">
      📦 待寄出 (${pending.length})
    </button>
    <button onclick="renderShippingFilter('shipped')" id="ship-tab-shipped"
      style="flex:1;padding:8px;border-radius:var(--r);border:1px solid var(--border);background:var(--bg2);color:var(--text2);font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">
      ✅ 已寄出 (${shipped.length})
    </button>
  </div>

  <div id="shipping-list"></div>`;

  document.getElementById('shipping-screen').innerHTML = h;
  renderShippingFilter('pending');
}

function renderShippingFilter(filter) {
  // 更新頁籤樣式
  const pendingTab = document.getElementById('ship-tab-pending');
  const shippedTab = document.getElementById('ship-tab-shipped');
  if (pendingTab && shippedTab) {
    if (filter === 'pending') {
      pendingTab.style.borderColor = 'var(--amber)';
      pendingTab.style.background = 'var(--abg)';
      pendingTab.style.color = 'var(--amber)';
      shippedTab.style.borderColor = 'var(--border)';
      shippedTab.style.background = 'var(--bg2)';
      shippedTab.style.color = 'var(--text2)';
    } else {
      shippedTab.style.borderColor = 'var(--green)';
      shippedTab.style.background = 'var(--gbg)';
      shippedTab.style.color = 'var(--green)';
      pendingTab.style.borderColor = 'var(--border)';
      pendingTab.style.background = 'var(--bg2)';
      pendingTab.style.color = 'var(--text2)';
    }
  }

  const orders = DATA.orders.filter(o => o.status === 'completed');
  const list = filter === 'pending'
    ? orders.filter(o => !o.shipped)
    : orders.filter(o => o.shipped);

  const el = document.getElementById('shipping-list');
  if (!el) return;

  if (list.length === 0) {
    el.innerHTML = `<div style="padding:48px;text-align:center;color:var(--text3)">
      ${filter === 'pending' ? '🎉 全部已寄出！' : '尚無已寄出訂單'}
    </div>`;
    return;
  }

  el.innerHTML = list.map(o => {
    const items = (o.order_items || []).map(i => i.item_name + (i.qty > 1 ? ' ×' + i.qty : '')).join('、');
    const isShipped = !!o.shipped;
    return `
    <div style="background:var(--bg2);border:1px solid ${isShipped ? 'var(--gborder)' : 'var(--border)'};border-radius:var(--rl);padding:14px;margin:0 16px 10px;${isShipped ? 'opacity:0.7' : ''}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
        <div>
          <div style="font-size:12px;color:var(--text2)">#${String(o.id).padStart(4,'0')} · ${o.order_date}</div>
          <div style="font-size:16px;font-weight:700;margin-top:2px">${o.customer}</div>
        </div>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:6px 12px;background:${isShipped ? 'var(--gbg)' : 'var(--bg3)'};border:1px solid ${isShipped ? 'var(--gborder)' : 'var(--border)'};border-radius:var(--r)">
          <input type="checkbox" ${isShipped ? 'checked' : ''} onchange="toggleShipped(${o.id}, this.checked)"
            style="width:18px;height:18px;accent-color:var(--acc);cursor:pointer">
          <span style="font-size:12px;font-weight:600;color:${isShipped ? 'var(--green)' : 'var(--text2)'}">
            ${isShipped ? '✅ 已寄出' : '待寄出'}
          </span>
        </label>
      </div>

      <div style="display:grid;gap:6px;font-size:12px">
        ${o.contact ? `<div style="display:flex;gap:8px;align-items:center">
          <span style="color:var(--text2);min-width:36px">📞</span>
          <span style="font-weight:500">${o.contact}</span>
        </div>` : ''}
        ${o.address ? `<div style="display:flex;gap:8px;align-items:flex-start">
          <span style="color:var(--text2);min-width:36px">📍</span>
          <span>${o.address}</span>
        </div>` : `<div style="display:flex;gap:8px;align-items:center">
          <span style="color:var(--text2);min-width:36px">📍</span>
          <span style="color:var(--text3)">Tự lấy / 自取</span>
        </div>`}
        <div style="display:flex;gap:8px;align-items:center">
          <span style="color:var(--text2);min-width:36px">🌿</span>
          <span>${items || '-'}</span>
        </div>
      </div>
    </div>`;
  }).join('');
}

async function toggleShipped(orderId, shipped) {
  const ok = await DB.updateShipped(orderId, shipped);
  if (ok) {
    // 更新 DATA
    const o = DATA.orders.find(x => x.id === orderId);
    if (o) o.shipped = shipped;
    showToast(shipped ? '✅ 已標記為寄出' : '↩ 已取消寄出標記');
    renderShipping();
  }
}
