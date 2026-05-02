// ==================== APP MAIN ====================
// 全域資料快取
let DATA = {
  plants: [],
  boards: [],
  orders: [],
  purchases: [],
  rehab: [],
  writeoffs: []
};

async function loadAllData() {
  const [plants, boards, orders, purchases, rehab, writeoffs] = await Promise.all([
    DB.getPlants(),
    DB.getBoards(),
    DB.getOrders(),
    DB.getPurchases(),
    DB.getRehab(),
    DB.getWriteoffs()
  ]);
  DATA.plants = plants;
  DATA.boards = boards;
  DATA.orders = orders;
  DATA.purchases = purchases;
  DATA.rehab = rehab;
  DATA.writeoffs = writeoffs;
}

async function refreshData() {
  showLoading(true);
  await loadAllData();
  showLoading(false);
  renderHome();
  renderPos();
  renderInv();
  renderOrders(null);
}

// NAV
function go(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.ni').forEach(b => b.classList.remove('active'));
  document.getElementById('screen-' + name).classList.add('active');
  document.getElementById('nav-' + name).classList.add('active');
}

function goOrdersFiltered(k) {
  orderFilterMonth = k;
  renderOrders(k);
  go('orders');
}

function clearOrderFilter() {
  orderFilterMonth = null;
  renderOrders(null);
  document.getElementById('orders-clear-filter').style.display = 'none';
}

// MODAL UTILS
function openM(id) { document.getElementById(id).classList.add('open'); }
function closeM(id) { document.getElementById(id).classList.remove('open'); }
function bgClose(e, id) { if (e.target.id === id) closeM(id); }
function doPrint() {
  const h = document.getElementById('printable').outerHTML;
  document.getElementById('print-area').innerHTML = h;
  window.print();
  setTimeout(() => { document.getElementById('print-area').innerHTML = ''; }, 1000);
}

// INIT
document.addEventListener('DOMContentLoaded', async () => {
  showLoading(true);
  await DB.getConfig();
  renderLoginScreen();
  showLoading(false);
  document.getElementById('login-screen').style.display = 'flex';
  
  // Enter key on password field
  document.getElementById('login-pw').addEventListener('keypress', e => {
    if (e.key === 'Enter') doLogin();
  });
});
