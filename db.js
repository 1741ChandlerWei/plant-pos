// ==================== DB MODULE ====================
// 所有 Supabase 資料庫操作集中在這裡
const DB = {
  // CONFIG
  async getConfig() {
    const { data } = await sb.from('config').select('*').single();
    if (data) {
      CFG.rate = data.rate;
      CFG.monthly_inc = data.monthly_inc;
      CFG.max_inc = data.max_inc;
      CFG.promo_discount = data.promo_discount;
      CFG.promo_end = data.promo_end;
      CFG.wholesale_name = data.wholesale_name;
      CFG.wholesale_pct = data.wholesale_pct;
    }
  },
  async saveConfig(cfg) {
    const { error } = await sb.from('config').update(cfg).eq('id', 1);
    if (!error) { Object.assign(CFG, cfg); showToast('Đã lưu cài đặt / 設定已儲存'); }
    else showToast('Lỗi / 錯誤: ' + error.message, 'error');
  },

  // USERS
  async verifyUser(userId, password) {
    const { data } = await sb.from('users').select('*').eq('id', userId).single();
    if (!data) return false;
    if (data.password_hash === '' || data.password_hash === password) return true;
    return false;
  },
  async setPassword(userId, password) {
    const { error } = await sb.from('users').update({ password_hash: password }).eq('id', userId);
    return !error;
  },

  // PLANTS
  async getPlants() {
    const { data } = await sb.from('plants').select('*').order('created_at', { ascending: false });
    return data || [];
  },
  async addPlant(plant) {
    const { data, error } = await sb.from('plants').insert(plant).select().single();
    if (error) showToast('Lỗi / 錯誤: ' + error.message, 'error');
    return data;
  },
  async updatePlant(id, updates) {
    const { error } = await sb.from('plants').update(updates).eq('id', id);
    if (error) showToast('Lỗi / 錯誤: ' + error.message, 'error');
    return !error;
  },
  async deletePlant(id) {
    const { error } = await sb.from('plants').delete().eq('id', id);
    return !error;
  },

  // BOARDS
  async getBoards() {
    const { data } = await sb.from('boards').select('*').order('id');
    return data || [];
  },
  async addBoard(board) {
    const { data, error } = await sb.from('boards').insert(board).select().single();
    if (error) showToast('Lỗi / 錯誤: ' + error.message, 'error');
    return data;
  },
  async updateBoard(id, updates) {
    const { error } = await sb.from('boards').update(updates).eq('id', id);
    return !error;
  },

  // ORDERS
  async getOrders() {
    const { data } = await sb.from('orders').select('*, order_items(*)').order('order_date', { ascending: false });
    return data || [];
  },
  async addOrder(order, items) {
    const { data: o, error } = await sb.from('orders').insert(order).select().single();
    if (error) { showToast('Lỗi / 錯誤: ' + error.message, 'error'); return null; }
    const itemsWithId = items.map(i => ({ ...i, order_id: o.id }));
    await sb.from('order_items').insert(itemsWithId);
    return o;
  },
  async cancelOrder(orderId, reason, operator) {
    await sb.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
    await sb.from('cancellations').insert({ order_id: orderId, cancel_date: todayStr(), reason, operator });
  },
  async updateShipped(orderId, shipped) {
    const { error } = await sb.from('orders').update({ shipped }).eq('id', orderId);
    return !error;
  },

  // PURCHASES
  async getPurchases() {
    const { data } = await sb.from('purchases').select('*, purchase_items(*)').order('purchase_date', { ascending: false });
    return data || [];
  },
  async addPurchase(purchase, items) {
    const { data: p, error } = await sb.from('purchases').insert(purchase).select().single();
    if (error) { showToast('Lỗi / 錯誤: ' + error.message, 'error'); return null; }
    const itemsWithId = items.map(i => ({ ...i, purchase_id: p.id }));
    await sb.from('purchase_items').insert(itemsWithId);
    return p;
  },

  // REHAB
  async getRehab() {
    const { data } = await sb.from('rehab').select('*').in('status', ['rehab', 'tracking', 'available', 'sold']).order('rehab_date', { ascending: false });
    return data || [];
  },
  async addRehab(rehab) {
    const { data, error } = await sb.from('rehab').insert(rehab).select().single();
    if (error) showToast('Lỗi / 錯誤: ' + error.message, 'error');
    return data;
  },
  async updateRehab(id, updates) {
    const { error } = await sb.from('rehab').update(updates).eq('id', id);
    if (error) showToast('Lỗi / 錯誤: ' + error.message, 'error');
    return !error;
  },
  async updateRehabStatus(id, status) {
    const { error } = await sb.from('rehab').update({ status }).eq('id', id);
    if (error) showToast('Lỗi / 錯誤: ' + error.message, 'error');
    return !error;
  },
  async releaseRehab(id) {
    const { error } = await sb.from('rehab').update({ status: 'released' }).eq('id', id);
    return !error;
  },

  // WRITEOFFS
  async getWriteoffs() {
    const { data } = await sb.from('writeoffs').select('*').order('writeoff_date', { ascending: false });
    return data || [];
  },
  async addWriteoff(writeoff) {
    const { data, error } = await sb.from('writeoffs').insert(writeoff).select().single();
    if (error) showToast('Lỗi / 錯誤: ' + error.message, 'error');
    return data;
  },

  // REHAB COUNT for RID generation
  async getNextRid() {
    const { count } = await sb.from('rehab').select('*', { count: 'exact', head: true });
    return 'R-' + String((count || 0) + 1).padStart(4, '0');
  }
};
