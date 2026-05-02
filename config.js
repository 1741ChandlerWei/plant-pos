// Supabase 設定
const SUPABASE_URL = 'https://edvklxnzhuhmijdwyzrl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkdmtseG56aHVobWlqZHd5enJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2OTE4MTQsImV4cCI6MjA5MzI2NzgxNH0.65Vf-XUlPZmhc-LWqzXq55bpR6RcG8iqNybf_bqyd60';

// 初始化 Supabase client
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 全域狀態
let ROLE = null;
let USER = null;
let CFG = {
  rate: 900,
  monthly_inc: 50000,
  max_inc: 300000,
  promo_discount: 0,
  promo_end: null,
  wholesale_name: '',
  wholesale_pct: 0
};

// 位置標籤
const LOC_LABELS = {
  mine: 'Nhà chủ / 我家',
  quang: 'Nhà Quang / Quang家',
  helper: 'Nhà trợ lý / 小幫手家'
};
const LOC_CLASS = {
  mine: 'loc-m',
  quang: 'loc-q',
  helper: 'loc-h'
};

// 工具函數
function todayStr() {
  return new Date().toISOString().split('T')[0];
}
function daysSince(d) {
  return Math.max(0, Math.floor((new Date() - new Date(d)) / 86400000));
}
function vnd(n) {
  return '₫' + Math.round(n).toLocaleString();
}
function agedCost(costVnd, purchaseDate) {
  const months = Math.floor(daysSince(purchaseDate) / 30.44);
  const inc = Math.min(months * CFG.monthly_inc, CFG.max_inc);
  return costVnd + inc;
}
function margin(price, costVnd, purchaseDate) {
  const ac = agedCost(costVnd, purchaseDate);
  return price > 0 ? ((price - ac) / price * 100).toFixed(1) : '0.0';
}
function monthKey(s) {
  const d = new Date(s);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}
function monthLabel(s) {
  const d = new Date(s);
  return d.getFullYear() + '年' + (d.getMonth() + 1) + '月';
}
function showToast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = 'toast toast-' + type;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
