// v6 - 物流查詢員角色
// ==================== AUTH MODULE ====================
let pendingUserId = null;

function renderLoginScreen() {
  const roles = [
    { id: 'owner', emoji: '👑', name: 'Chandler Wei', desc: 'Toàn quyền quản lý / 完整後台權限' },
    { id: 'quang', emoji: '🌱', name: 'Quang', desc: 'Thành viên / Xem cây, tạo đơn' },
    { id: 'helper', emoji: '🪴', name: 'Trợ lý / 小幫手', desc: 'Thành viên / Xem cây, tạo đơn' },
    { id: 'shipping', emoji: '📦', name: 'Giao hàng / 物流查詢', desc: 'Xem đơn & xác nhận giao / 查閱訂單及確認寄出' },
  ];
  document.getElementById('role-list').innerHTML = roles.map(r =>
    `<button class="role-btn" onclick="selectRole('${r.id}')">
      <span style="font-size:26px">${r.emoji}</span>
      <div>
        <div style="font-size:14px;font-weight:600;color:var(--text)">${r.name}</div>
        <div style="font-size:11px;color:var(--text2)">${r.desc}</div>
      </div>
    </button>`
  ).join('');
}

function selectRole(userId) {
  // 物流查詢員不需要密碼，直接進入
  if (userId === 'shipping') {
    startApp('shipping');
    return;
  }
  pendingUserId = userId;
  const names = { owner: 'Chandler Wei', quang: 'Quang', helper: 'Trợ lý / 小幫手' };
  document.getElementById('login-title').textContent = names[userId] || userId;
  document.getElementById('login-pw').value = '';
  openM('m-login');
}

async function doLogin() {
  const pw = document.getElementById('login-pw').value;
  const ok = await DB.verifyUser(pendingUserId, pw);
  if (!ok) { showToast('Sai mật khẩu / 密碼錯誤', 'error'); return; }
  closeM('m-login');
  await startApp(pendingUserId);
}

async function startApp(userId) {
  showLoading(true);
  ROLE = userId;
  USER = userId;

  const badgeMap = {
    owner: ['Chandler Wei', 'badge ba'],
    quang: ['Quang', 'badge bg'],
    helper: ['Trợ lý', 'badge br'],
    shipping: ['物流', 'badge bb']
  };
  const [label, cls] = badgeMap[userId] || [userId, 'badge'];
  ['role-badge','role-badge-pos','role-badge-inv','role-badge-orders','role-badge-rep'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.textContent = label; el.className = cls; }
  });

  document.getElementById('home-date').textContent = new Date().toLocaleDateString('zh-TW', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const indicator = document.getElementById('user-indicator');
  const dot = document.getElementById('user-dot');
  const namePill = document.getElementById('user-name-pill');
  const colors = { owner: '#fbbf24', quang: '#4ade80', helper: '#f87171', shipping: '#60a5fa' };
  const names = { owner: 'Chandler Wei', quang: 'Quang', helper: 'Trợ lý', shipping: '物流查詢' };
  indicator.style.display = 'block';
  dot.style.background = colors[userId] || '#888';
  namePill.textContent = names[userId] || userId;

  await DB.getConfig();
  await loadAllData();
  showLoading(false);

  // 物流查詢員只顯示出貨頁面
  if (userId === 'shipping') {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'none';
    document.getElementById('shipping-screen').style.display = 'flex';
    renderShipping();
    return;
  }

  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  buildRepTabs();
  renderHome();
  renderPos();
  renderInv();
  renderOrders(null);
}

function logout() {
  ROLE = null;
  USER = null;
  cart = [];
  document.getElementById('app').style.display = 'none';
  document.getElementById('shipping-screen').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('user-indicator').style.display = 'none';
}

function showLoading(show) {
  document.getElementById('loading').style.display = show ? 'flex' : 'none';
}
