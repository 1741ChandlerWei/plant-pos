// ==================== MODALS MODULE ====================
// 動態插入所有 modal HTML
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('modals-container').innerHTML = `
    <!-- 新增植物 -->
    <div class="modal-overlay" id="m-addplant" onclick="bgClose(event,'m-addplant')">
      <div class="modal">
        <div class="mhandle"></div>
        <div class="mtitle">Thêm cây vào kho / 新增植物庫存</div>
        <div class="field"><label class="flabel">Tên cây / 植物名稱</label><input class="inp" id="np-name" placeholder="AR SP, mew..."></div>
        <div class="field"><label class="flabel">Phân loại / 分類</label>
          <select class="inp" id="np-cat"><option>植物</option><option>植物（代）</option><option>植物（自）</option><option>植物（批）</option></select>
        </div>
        <div class="irow">
          <div class="field"><label class="flabel">Giá vốn NTD / 成本 NTD</label><input class="inp" id="np-cntd" type="number" placeholder="500" oninput="document.getElementById('np-cvnd').value=Math.round(this.value*CFG.rate).toLocaleString()"></div>
          <div class="field"><label class="flabel">≈ VND</label><input class="inp" id="np-cvnd" readonly></div>
        </div>
        <div class="irow">
          <div class="field"><label class="flabel">Giá bán ước tính VND / 預估售價</label><input class="inp" id="np-price" type="number" placeholder="950000"></div>
          <div class="field"><label class="flabel">Số lượng / 數量</label><input class="inp" id="np-qty" type="number" value="1" min="1"></div>
        </div>
        <div class="field"><label class="flabel">Ngày nhập / 進貨日期</label><input class="inp" id="np-date" type="date"></div>
        <div class="field"><label class="flabel">Vị trí / 位置</label>
          <select class="inp" id="np-loc">
            <option value="mine">Nhà chủ / 我家</option>
            <option value="quang">Nhà Quang / Quang家</option>
            <option value="helper">Nhà trợ lý / 小幫手家</option>
          </select>
        </div>
        <div class="field"><label class="flabel">NCC / Ghi chú / 廠商備註</label><input class="inp" id="np-note" placeholder="廠商名稱 / Tên nhà cung cấp..."></div>
        <button class="btn btnp btnf" onclick="addPlant()">Lưu / 儲存</button>
      </div>
    </div>

    <!-- 編輯植物 -->
    <div class="modal-overlay" id="m-editplant" onclick="bgClose(event,'m-editplant')">
      <div class="modal">
        <div class="mhandle"></div>
        <div class="mtitle">Chỉnh sửa cây / 編輯植物</div>
        <input type="hidden" id="ep-id">
        <div class="field"><label class="flabel">Tên cây / 植物名稱</label><input class="inp" id="ep-name"></div>
        <div class="irow">
          <div class="field"><label class="flabel">Giá vốn NTD / 成本 NTD</label><input class="inp" id="ep-cost-ntd" type="number" min="0" oninput="document.getElementById('ep-cost-vnd').value=Math.round(this.value*CFG.rate)"></div>
          <div class="field"><label class="flabel">Giá vốn VND / 成本 VND</label><input class="inp" id="ep-cost-vnd" type="number" min="0"></div>
        </div>
        <div class="irow">
          <div class="field"><label class="flabel">Giá bán ước tính VND / 預估售價</label><input class="inp" id="ep-price" type="number"></div>
          <div class="field"><label class="flabel">Số lượng / 庫存數量</label><input class="inp" id="ep-qty" type="number" min="0"></div>
        </div>
        <div class="field"><label class="flabel">Ngày nhập / 進貨日期</label><input class="inp" id="ep-date" type="date"></div>
        <div class="field"><label class="flabel">Vị trí / 位置</label>
          <select class="inp" id="ep-loc">
            <option value="mine">Nhà chủ / 我家</option>
            <option value="quang">Nhà Quang / Quang家</option>
            <option value="helper">Nhà trợ lý / 小幫手家</option>
          </select>
        </div>
        <div class="field"><label class="flabel">Ghi chú / 備註</label><input class="inp" id="ep-note"></div>
        <button class="btn btnp btnf" onclick="savePlantEdit()">Lưu / 儲存</button>
      </div>
    </div>

    <!-- 新增/編輯物料 -->
    <div class="modal-overlay" id="m-addboard" onclick="bgClose(event,'m-addboard')">
      <div class="modal">
        <div class="mhandle"></div>
        <div class="mtitle">Vật liệu / 物料管理</div>
        <input type="hidden" id="eb-id">
        <div class="field"><label class="flabel">Tên vật liệu / 物料名稱</label><input class="inp" id="eb-name" placeholder="Ví dụ: Gỗ, Phân bón... / 例：木板、肥料..."></div>
        <div class="irow">
          <div class="field"><label class="flabel">Giá vốn VND / 成本</label><input class="inp" id="eb-cost" type="number"></div>
          <div class="field"><label class="flabel">Giá bán VND / 售價</label><input class="inp" id="eb-price" type="number"></div>
        </div>
        <div class="field"><label class="flabel">Số lượng ban đầu (nhà chủ) / 初始數量（我家）</label><input class="inp" id="eb-qty" type="number" min="0"></div>
        <button class="btn btnp btnf" onclick="saveBoard()">Lưu / 儲存</button>
      </div>
    </div>

    <!-- 移動植物 -->
    <div class="modal-overlay" id="m-moveplant" onclick="bgClose(event,'m-moveplant')">
      <div class="modal">
        <div class="mhandle"></div>
        <div class="mtitle">Di chuyển cây / 移動植物</div>
        <div id="move-info" style="margin-bottom:14px;padding:11px;background:var(--bg3);border-radius:var(--r);font-size:13px"></div>
        <div class="field"><label class="flabel">Di chuyển đến / 移至</label>
          <select class="inp" id="move-loc">
            <option value="mine">Nhà chủ / 我家</option>
            <option value="quang">Nhà Quang / Quang家</option>
            <option value="helper">Nhà trợ lý / 小幫手家</option>
          </select>
        </div>
        <div class="field"><label class="flabel">Số lượng / 數量</label><input class="inp" id="move-qty" type="number" min="1" value="1"></div>
        <div class="field"><label class="flabel">Ghi chú / 備註</label><input class="inp" id="move-note" placeholder="備註 / Tưới nước mỗi ngày..."></div>
        <button class="btn btnp btnf" onclick="doMove()">Xác nhận / 確認移動</button>
      </div>
    </div>

    <!-- 移動物料 -->
    <div class="modal-overlay" id="m-moveboard" onclick="bgClose(event,'m-moveboard')">
      <div class="modal">
        <div class="mhandle"></div>
        <div class="mtitle">Di chuyển vật liệu / 移動物料</div>
        <div id="moveboard-info" style="margin-bottom:14px;padding:11px;background:var(--bg3);border-radius:var(--r);font-size:13px"></div>
        <div class="irow">
          <div class="field"><label class="flabel">Từ / 從</label>
            <select class="inp" id="moveboard-from">
              <option value="mine">Nhà chủ / 我家</option>
              <option value="quang">Nhà Quang</option>
              <option value="helper">Nhà trợ lý</option>
            </select>
          </div>
          <div class="field"><label class="flabel">Đến / 到</label>
            <select class="inp" id="moveboard-to">
              <option value="mine">Nhà chủ / 我家</option>
              <option value="quang">Nhà Quang</option>
              <option value="helper">Nhà trợ lý</option>
            </select>
          </div>
        </div>
        <div class="field"><label class="flabel">Số lượng / 數量</label><input class="inp" id="moveboard-qty" type="number" min="1" value="1"></div>
        <button class="btn btnp btnf" onclick="doMoveBoard()">Xác nhận / 確認</button>
      </div>
    </div>

    <!-- 修整區移入 -->
    <div class="modal-overlay" id="m-rehab" onclick="bgClose(event,'m-rehab')">
      <div class="modal">
        <div class="mhandle"></div>
        <div class="mtitle">Khu chỉnh sửa / 移入修整區</div>
        <div id="rehab-info" style="margin-bottom:12px;padding:11px;background:var(--bg3);border-radius:var(--r);font-size:13px"></div>
        <div class="field"><label class="flabel">Số lượng / 數量</label><input class="inp" id="rehab-qty" type="number" min="1" value="1"></div>
        <div class="field"><label class="flabel">Lý do chỉnh sửa / 修整原因</label><input class="inp" id="rehab-note" placeholder="Lá bị hư / 葉片受損..."></div>
        <div style="background:var(--abg);border:1px solid var(--aborder);border-radius:var(--r);padding:10px;margin-bottom:13px;font-size:11px;color:var(--amber)">
          自動分配 R-XXX 編號並產生 QR Code / Tự động cấp mã R-XXX và tạo QR Code
        </div>
        <button class="btn btnp btnf" onclick="confirmRehab()">Xác nhận chuyển vào / 確認移入</button>
      </div>
    </div>

    <!-- 縮時追蹤移入 -->
    <div class="modal-overlay" id="m-tracking" onclick="bgClose(event,'m-tracking')">
      <div class="modal">
        <div class="mhandle"></div>
        <div class="mtitle">🎬 開始縮時追蹤 / Bắt đầu theo dõi</div>
        <div id="tracking-info" style="margin-bottom:12px;padding:11px;background:var(--bg3);border-radius:var(--r);font-size:13px"></div>
        <div class="field"><label class="flabel">數量 / Số lượng</label><input class="inp" id="tracking-qty" type="number" min="1" value="1"></div>
        <div class="field"><label class="flabel">備註 / Ghi chú</label><input class="inp" id="tracking-note" placeholder="開始追蹤原因 / Lý do bắt đầu theo dõi..."></div>
        <div style="background:var(--gbg);border:1px solid var(--gborder);border-radius:var(--r);padding:10px;margin-bottom:13px;font-size:11px;color:var(--green)">
          每株自動分配獨立 R-XXX 編號並產生 QR Code
        </div>
        <button class="btn btnp btnf" onclick="confirmTracking()">🎬 確認開始追蹤 / Xác nhận theo dõi</button>
      </div>
    </div>

    <!-- 編輯修整記錄 -->
    <div class="modal-overlay" id="m-editrehab" onclick="bgClose(event,'m-editrehab')">
      <div class="modal">
        <div class="mhandle"></div>
        <div class="mtitle">Chỉnh sửa ghi chú / 編輯修整記錄</div>
        <input type="hidden" id="er-rid">
        <div class="field"><label class="flabel">Ngày bắt đầu CS / 修整開始日期</label><input class="inp" id="er-date" type="date"></div>
        <div class="field"><label class="flabel">Ghi chú / 備註</label><input class="inp" id="er-note"></div>
        <button class="btn btnp btnf" onclick="saveRehabEdit()">Lưu / 儲存</button>
      </div>
    </div>

    <!-- 修整區報廢 -->
    <div class="modal-overlay" id="m-rehabwriteoff" onclick="bgClose(event,'m-rehabwriteoff')">
      <div class="modal">
        <div class="mhandle"></div>
        <div class="mtitle">報廢 / Thanh lý</div>
        <div id="rwo-info" style="margin-bottom:12px;padding:11px;background:var(--rbg);border:1px solid var(--rborder);border-radius:var(--r);font-size:13px;color:var(--red)"></div>
        <div class="field"><label class="flabel">報廢原因 / Lý do thanh lý *</label><input class="inp" id="rwo-reason" placeholder="死亡 / 無法復原..."></div>
        <div style="background:var(--rbg);border:1px solid var(--rborder);border-radius:var(--r);padding:10px;margin-bottom:13px;font-size:11px;color:var(--red)">
          報廢後將記錄損失，QR Code 頁面保留歷史記錄
        </div>
        <button class="btn btnd btnf" onclick="confirmRehabWriteoff()">確認報廢 / Xác nhận thanh lý</button>
      </div>
    </div>

    <!-- 結帳 -->
    <div class="modal-overlay" id="m-checkout" onclick="bgClose(event,'m-checkout')">
      <div class="modal">
        <div class="mhandle"></div>
        <div class="mtitle">Hoàn tất thanh toán / 完成結帳</div>
        <div class="field"><label class="flabel">Tên khách / 客戶姓名 *</label><input class="inp" id="co-name" placeholder="客戶姓名 / Tên khách hàng..."></div>
        <div class="field"><label class="flabel">Ngày đặt hàng / 訂單日期</label><input class="inp" id="co-date" type="date"></div>
        <div class="field"><label class="flabel">Liên hệ / 聯絡方式</label><input class="inp" id="co-contact" placeholder="聯絡方式 / LINE / Zalo / SĐT"></div>
        <div class="field"><label class="flabel">Địa chỉ giao hàng (tự lấy bỏ trống) / 收件地址</label><input class="inp" id="co-addr" placeholder="Tự lấy / 自取"></div>
        <div class="field"><label class="flabel">Nguồn đơn / 訂單來源</label>
          <select class="inp" id="co-src"><option>FB Messenger</option><option>Đến nhà chọn / 來家選購</option><option>Zalo / LINE</option><option>Khác / 其他</option></select>
        </div>
        <div class="field"><label class="flabel">Thanh toán / 付款方式</label>
          <select class="inp" id="co-pay"><option>Tiền mặt / 現金</option><option>Chuyển khoản / 銀行轉帳</option><option>Momo / LINE Pay</option><option>Khác / 其他</option></select>
        </div>
        <div class="field"><label class="flabel">Người bán / 成交人員</label>
          <select class="inp" id="co-seller"><option>Chandler Wei</option><option>Quang</option><option>Trợ lý / 小幫手</option></select>
        </div>
        <div class="field"><label class="flabel">Ghi chú / 備註</label><input class="inp" id="co-note" placeholder="備註 / Ghi chú..."></div>
        <div id="co-summary" style="background:var(--bg3);border-radius:var(--r);padding:13px;margin-bottom:14px"></div>
        <button class="btn btnp btnf" onclick="completeOrder()">Xác nhận & xuất phiếu / 確認成交</button>
      </div>
    </div>

    <!-- 出貨單 -->
    <div class="modal-overlay" id="m-receipt">
      <div class="modal">
        <div class="mhandle"></div>
        <div class="mtitle">Phiếu xuất hàng / 出貨單</div>
        <div id="receipt-body"></div>
        <div style="display:flex;gap:10px;margin-top:14px">
          <button class="btn btns" style="flex:1" onclick="closeM('m-receipt')">Đóng / 關閉</button>
          <button class="btn btnd" id="receipt-cancel-btn" style="flex:1;display:none">Hủy đơn / 取消訂單</button>
          <button class="btn btnp" style="flex:1" onclick="doPrint()">🖨 In phiếu / 列印</button>
        </div>
      </div>
    </div>

    <!-- 取消訂單 -->
    <div class="modal-overlay" id="m-cancel" onclick="bgClose(event,'m-cancel')">
      <div class="modal">
        <div class="mhandle"></div>
        <div class="mtitle">Hủy đơn hàng / 取消訂單</div>
        <div style="background:var(--rbg);border:1px solid var(--rborder);border-radius:var(--r);padding:12px;margin-bottom:14px;font-size:12px;color:var(--red)">
          Hàng sẽ được hoàn trả về kho / 取消後庫存自動退回
        </div>
        <div class="field"><label class="flabel">Lý do hủy / 取消原因 *</label><input class="inp" id="cancel-reason" placeholder="Khách đổi ý / 客戶取消..."></div>
        <button class="btn btnd btnf" onclick="doCancelOrder()">Xác nhận hủy / 確認取消</button>
      </div>
    </div>

    <!-- 植物詳情 -->
    <div class="modal-overlay" id="m-detail" onclick="bgClose(event,'m-detail')">
      <div class="modal"><div id="detail-inner"></div></div>
    </div>

    <!-- 新增進貨 -->
    <div class="modal-overlay" id="m-newpur" onclick="bgClose(event,'m-newpur')">
      <div class="modal">
        <div class="mhandle"></div>
        <div class="mtitle">Thêm lô nhập hàng / 新增進貨批次</div>
        <div class="field"><label class="flabel">NCC / 廠商</label><input class="inp" id="pur-vendor" placeholder="Chen Ying..."></div>
        <div class="field"><label class="flabel">Ngày nhập / 進貨日期</label><input class="inp" id="pur-date" type="date"></div>
        <div class="field"><label class="flabel">Ghi chú / 備註</label><input class="inp" id="pur-note" placeholder="備註 / Ghi chú..."></div>
        <div id="pur-items-wrap"></div>
        <button class="btn btns btnf" onclick="addPurItem()" style="margin-bottom:11px">+ Thêm mặt hàng / 新增品項</button>
        <div style="background:var(--gbg);border:1px solid var(--gborder);border-radius:var(--r);padding:12px;margin-bottom:12px">
          <label style="display:flex;align-items:center;gap:10px;cursor:pointer;margin-bottom:10px">
            <input type="checkbox" id="pur-add-stock" checked style="width:16px;height:16px;accent-color:var(--acc)">
            <span style="font-size:13px;font-weight:500;color:var(--green)">Tự động thêm vào kho / 自動加入庫存</span>
          </label>
          <div class="field" style="margin-bottom:0">
            <label class="flabel">Nhập vào kho tại / 入庫位置</label>
            <select class="inp" id="pur-stock-loc">
              <option value="mine">Nhà chủ / 我家</option>
              <option value="quang">Nhà Quang / Quang家</option>
              <option value="helper">Nhà trợ lý / 小幫手家</option>
            </select>
          </div>
        </div>
        <button class="btn btnp btnf" onclick="savePurchase()">Lưu lô hàng / 儲存批次</button>
      </div>
    </div>
  `;

  // 設定今天日期
  const today = new Date().toISOString().split('T')[0];
  const purDate = document.getElementById('pur-date');
  if (purDate) purDate.value = today;
  const npDate = document.getElementById('np-date');
  if (npDate) npDate.value = today;
  const coDate = document.getElementById('co-date');
  if (coDate) coDate.value = today;

  // Enter key on password - 由auth.js處理
});
