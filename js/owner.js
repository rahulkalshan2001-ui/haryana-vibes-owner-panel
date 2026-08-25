/* Haryana Vibes Cafe â€” Owner Panel logic */

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 1800);
}
function money(n) { return 'â‚¹' + Number(n).toFixed(0); }

function showView(name) {
  document.getElementById('view-login').classList.toggle('hidden', name !== 'login');
  document.getElementById('view-forgot').classList.toggle('hidden', name !== 'forgot');
}

function boot() {
  if (Store.isLoggedIn()) {
    document.getElementById('app').classList.remove('hidden');
    document.getElementById('view-login').classList.add('hidden');
    document.getElementById('view-forgot').classList.add('hidden');
    initTabs();
    switchTab('dashboard');
    checkNewOrders();
    setInterval(checkNewOrders, 4000);
  } else {
    showView('login');
  }
}

function doLogin() {
  const id = document.getElementById('loginId').value;
  const pass = document.getElementById('loginPass').value;
  if (Store.login(id, pass)) { window.location.reload(); }
  else toast('Invalid Owner ID or password');
}
function doLogout() { Store.logout(); window.location.reload(); }

function doRecover() {
  const id = document.getElementById('forgotId').value;
  const answer = document.getElementById('forgotAnswer').value;
  const newPass = document.getElementById('forgotNewPass').value;
  if (!newPass || newPass.length < 4) { toast('New password must be at least 4 characters'); return; }
  if (Store.recoverPassword(id, answer, newPass)) {
    toast('Password reset! Please login.');
    showView('login');
  } else toast('Owner ID or answer is incorrect');
}
document.getElementById('forgotQ').textContent = Store.getOwnerAuth().recoveryQuestion;

/* ---------- Tabs ---------- */
const TABS = ['dashboard', 'orders', 'menu', 'offers', 'gallery', 'settings', 'integrations', 'account'];
function initTabs() {
  document.querySelectorAll('#tabbar button').forEach(btn => {
    btn.onclick = () => switchTab(btn.dataset.tab);
  });
}
function switchTab(tab) {
  document.querySelectorAll('#tabbar button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  TABS.forEach(t => document.getElementById('tab-' + t).classList.toggle('hidden', t !== tab));
  const renderers = {
    dashboard: renderDashboard, orders: renderOrdersTab, menu: renderMenuTab,
    offers: renderOffersTab, gallery: renderGalleryTab, settings: renderSettingsTab,
    integrations: renderIntegrationsTab, account: renderAccountTab
  };
  renderers[tab]();
  if (tab === 'orders') { localStorage.setItem('hvc_last_seen_order_count', Store.getOrders().length); checkNewOrders(); }
}

function checkNewOrders() {
  const count = Store.getOrders().length;
  const lastSeen = Number(localStorage.getItem('hvc_last_seen_order_count') || 0);
  document.getElementById('newOrderDot').classList.toggle('hidden', count <= lastSeen);
  const activeTab = document.querySelector('#tabbar button.active')?.dataset.tab;
  if (activeTab === 'orders') renderOrdersTab();
  if (activeTab === 'dashboard') renderDashboard();
}

/* ---------- Dashboard ---------- */
function renderDashboard() {
  const orders = Store.getOrders();
  const today = new Date().toDateString();
  const todaysOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
  const newCount = orders.filter(o => o.status === 'New').length;
  const revenue = orders.filter(o => o.status === 'Completed').reduce((s, o) => s + o.total, 0);
  const el = document.getElementById('tab-dashboard');
  el.innerHTML = `
    <div class="stat-grid">
      <div class="stat-card"><div class="num">${newCount}</div><div class="lbl">ðŸ†• New Orders</div></div>
      <div class="stat-card"><div class="num">${todaysOrders.length}</div><div class="lbl">ðŸ“… Today's Orders</div></div>
      <div class="stat-card"><div class="num">${orders.length}</div><div class="lbl">ðŸ“¦ Total Orders</div></div>
      <div class="stat-card"><div class="num">${money(revenue)}</div><div class="lbl">ðŸ’° Completed Revenue</div></div>
    </div>
    <div class="section"><h2>Recent Orders</h2></div>
    <div>${orders.slice(0, 5).map(o => ownerOrderCardHtml(o)).join('') || '<div class="empty-state">No orders yet.</div>'}</div>
  `;
  bindOrderActions(el);
}

/* ---------- Orders ---------- */
function renderOrdersTab() {
  const orders = Store.getOrders();
  const el = document.getElementById('tab-orders');
  el.innerHTML = `
    <div class="section-sub" style="padding:14px 14px 0;">${orders.length} total orders</div>
    <div>${orders.map(o => ownerOrderCardHtml(o)).join('') || '<div class="empty-state">No orders yet.</div>'}</div>
  `;
  bindOrderActions(el);
}

function ownerOrderCardHtml(order) {
  const statusClass = 'status-' + order.status.replace(/\s+/g, '-');
  const isTerminal = order.status === 'Completed' || order.status === 'Cancelled';
  const nextStatusMap = {
    New: 'Accepted', Accepted: 'Preparing', Preparing: order.fulfillment === 'delivery' ? 'Out for Delivery' : 'Ready',
    Ready: 'Completed', 'Out for Delivery': 'Completed'
  };
  const next = nextStatusMap[order.status];
  return `
    <div class="order-card" data-order-id="${order.id}">
      <div class="order-head">
        <strong>#${order.number} â€” ${order.customer.name}</strong>
        <span class="status-pill ${statusClass}">${order.status}</span>
      </div>
      <div style="font-size:.72rem;color:var(--muted);margin-bottom:6px;">
        ${new Date(order.createdAt).toLocaleString()} Â· ${order.fulfillment === 'delivery' ? 'ðŸ›µ Delivery' : 'ðŸƒ Pickup'}
      </div>
      <div style="font-size:.78rem;">ðŸ“ž ${order.customer.phone}${order.customer.address ? '<br/>ðŸ“ ' + order.customer.address : ''}</div>
      ${order.customer.instructions ? `<div style="font-size:.75rem;color:var(--muted);margin-top:4px;">ðŸ“ ${order.customer.instructions}</div>` : ''}
      <div style="margin-top:8px;font-size:.78rem;">${order.items.map(i => `${i.qty} Ã— ${i.name} â€” ${money(i.price * i.qty)}`).join('<br/>')}</div>
      <div class="summary-row total" style="margin-top:8px;"><span>Total</span><span>${money(order.total)}</span></div>
      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
        ${order.status === 'New' ? `
          <button class="small-btn primary" data-action="accept">Accept</button>
          <button class="small-btn danger" data-action="reject">Reject</button>` : ''}
        ${!isTerminal && order.status !== 'New' && next ? `<button class="small-btn primary" data-action="advance" data-next="${next}">Mark as ${next}</button>` : ''}
        ${!isTerminal ? `<button class="small-btn danger" data-action="cancel">Cancel</button>` : ''}
      </div>
    </div>`;
}
function bindOrderActions(container) {
  container.querySelectorAll('.order-card').forEach(card => {
    const id = card.dataset.orderId;
    card.querySelectorAll('button[data-action]').forEach(btn => {
      btn.onclick = () => {
        const action = btn.dataset.action;
        if (action === 'accept') Store.updateOrderStatus(id, 'Accepted');
        if (action === 'reject') Store.updateOrderStatus(id, 'Cancelled');
        if (action === 'cancel') { if (confirm('Cancel this order?')) Store.updateOrderStatus(id, 'Cancelled'); else return; }
        if (action === 'advance') Store.updateOrderStatus(id, btn.dataset.next);
        localStorage.setItem('hvc_last_seen_order_count', Store.getOrders().length);
        renderOrdersTab(); renderDashboard();
      };
    });
  });
}

/* ---------- Modal helper ---------- */
function openModal(title, bodyHtml, onSave) {
  const root = document.getElementById('modalRoot');
  root.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-sheet">
        <div class="modal-head"><h3>${title}</h3><button class="icon-btn" id="modalCloseBtn">âœ•</button></div>
        <div id="modalBody">${bodyHtml}</div>
        <button class="primary-btn" id="modalSaveBtn">Save</button>
      </div>
    </div>`;
  document.getElementById('modalCloseBtn').onclick = closeModal;
  document.getElementById('modalSaveBtn').onclick = () => { if (onSave() !== false) closeModal(); };
}
function closeModal() { document.getElementById('modalRoot').innerHTML = ''; }

/* ---------- Menu (categories + items) ---------- */
function renderMenuTab() {
  const cats = Store.getCategories();
  const menu = Store.getMenu();
  const el = document.getElementById('tab-menu');
  let html = `<div class="admin-card"><div class="row-between"><strong>Categories</strong><button class="small-btn primary" id="addCatBtn">+ Category</button></div></div>`;
  cats.forEach(cat => {
    html += `<div class="admin-card"><div class="row-between">
      <span>${cat.name}</span>
      <span><button class="small-btn" data-editcat="${cat.id}">Edit</button> <button class="small-btn danger" data-delcat="${cat.id}">Delete</button></span>
    </div></div>`;
  });
  html += `<div class="admin-card"><div class="row-between"><strong>Menu Items</strong><button class="small-btn primary" id="addItemBtn">+ Item</button></div></div>`;
  menu.forEach(item => {
    const catName = cats.find(c => c.id === item.categoryId)?.name || 'â€”';
    html += `<div class="admin-card">
      <div class="row-between">
        <div style="display:flex;gap:8px;align-items:center;">
          <img src="${item.photo}" style="width:40px;height:40px;border-radius:8px;object-fit:cover;" />
          <div><div style="font-size:.85rem;font-weight:700;">${item.name}</div><div style="font-size:.7rem;color:var(--muted);">${catName} Â· ${money(item.price)}</div></div>
        </div>
        <label class="switch"><input type="checkbox" data-toggleitem="${item.id}" ${item.available !== false ? 'checked' : ''}><span class="slider"></span></label>
      </div>
      <div style="display:flex;gap:8px;margin-top:8px;">
        <button class="small-btn" data-edititem="${item.id}">Edit</button>
        <button class="small-btn danger" data-delitem="${item.id}">Delete</button>
      </div>
    </div>`;
  });
  el.innerHTML = html;

  document.getElementById('addCatBtn').onclick = () => categoryModal();
  document.getElementById('addItemBtn').onclick = () => itemModal();
  el.querySelectorAll('[data-editcat]').forEach(b => b.onclick = () => categoryModal(cats.find(c => c.id === b.dataset.editcat)));
  el.querySelectorAll('[data-delcat]').forEach(b => b.onclick = () => { if (confirm('Delete this category and its items?')) { Store.deleteCategory(b.dataset.delcat); renderMenuTab(); } });
  el.querySelectorAll('[data-edititem]').forEach(b => b.onclick = () => itemModal(menu.find(m => m.id === b.dataset.edititem)));
  el.querySelectorAll('[data-delitem]').forEach(b => b.onclick = () => { if (confirm('Delete this item?')) { Store.deleteMenuItem(b.dataset.delitem); renderMenuTab(); } });
  el.querySelectorAll('[data-toggleitem]').forEach(b => b.onchange = () => { Store.updateMenuItem(b.dataset.toggleitem, { available: b.checked }); renderMenuTab(); });
}

function categoryModal(cat) {
  openModal(cat ? 'Edit Category' : 'Add Category', `
    <div class="field"><label>Category Name</label><input id="mCatName" value="${cat ? cat.name : ''}" /></div>
  `, () => {
    const name = document.getElementById('mCatName').value.trim();
    if (!name) { toast('Name is required'); return false; }
    if (cat) Store.updateCategory(cat.id, { name }); else Store.addCategory(name);
    renderMenuTab();
  });
}

function itemModal(item) {
  const cats = Store.getCategories();
  openModal(item ? 'Edit Item' : 'Add Item', `
    <div class="field"><label>Name</label><input id="mItemName" value="${item ? item.name : ''}" /></div>
    <div class="field"><label>Category</label><select id="mItemCat">${cats.map(c => `<option value="${c.id}" ${item && item.categoryId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}</select></div>
    <div class="field"><label>Price (â‚¹)</label><input id="mItemPrice" type="number" value="${item ? item.price : ''}" /></div>
    <div class="field"><label>Description</label><textarea id="mItemDesc">${item ? item.description || '' : ''}</textarea></div>
    <div class="field"><label>Photo URL</label><input id="mItemPhoto" value="${item ? item.photo : ''}" placeholder="https://..." /></div>
  `, () => {
    const name = document.getElementById('mItemName').value.trim();
    const categoryId = document.getElementById('mItemCat').value;
    const price = Number(document.getElementById('mItemPrice').value);
    const description = document.getElementById('mItemDesc').value.trim();
    const photo = document.getElementById('mItemPhoto').value.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80';
    if (!name || !price || !categoryId) { toast('Name, category and price are required'); return false; }
    if (item) Store.updateMenuItem(item.id, { name, categoryId, price, description, photo });
    else Store.addMenuItem({ name, categoryId, price, description, photo });
    renderMenuTab();
  });
}

/* ---------- Offers ---------- */
function renderOffersTab() {
  const offers = Store.getOffers();
  const el = document.getElementById('tab-offers');
  el.innerHTML = `<div class="admin-card"><div class="row-between"><strong>Offers</strong><button class="small-btn primary" id="addOfferBtn">+ Offer</button></div></div>` +
    offers.map(o => `
      <div class="admin-card">
        <div class="row-between">
          <div style="display:flex;gap:8px;align-items:center;">
            <img src="${o.photo}" style="width:40px;height:40px;border-radius:8px;object-fit:cover;" />
            <div style="font-size:.82rem;font-weight:700;">${o.title}</div>
          </div>
          <label class="switch"><input type="checkbox" data-toggleoffer="${o.id}" ${o.active ? 'checked' : ''}><span class="slider"></span></label>
        </div>
        <div style="display:flex;gap:8px;margin-top:8px;">
          <button class="small-btn" data-editoffer="${o.id}">Edit</button>
          <button class="small-btn danger" data-deloffer="${o.id}">Delete</button>
        </div>
      </div>`).join('') || '';
  document.getElementById('addOfferBtn').onclick = () => offerModal();
  el.querySelectorAll('[data-editoffer]').forEach(b => b.onclick = () => offerModal(offers.find(o => o.id === b.dataset.editoffer)));
  el.querySelectorAll('[data-deloffer]').forEach(b => b.onclick = () => { if (confirm('Delete this offer?')) { Store.deleteOffer(b.dataset.deloffer); renderOffersTab(); } });
  el.querySelectorAll('[data-toggleoffer]').forEach(b => b.onchange = () => { Store.updateOffer(b.dataset.toggleoffer, { active: b.checked }); renderOffersTab(); });
}
function offerModal(offer) {
  openModal(offer ? 'Edit Offer' : 'Add Offer', `
    <div class="field"><label>Title</label><input id="mOfferTitle" value="${offer ? offer.title : ''}" /></div>
    <div class="field"><label>Description</label><textarea id="mOfferDesc">${offer ? offer.description || '' : ''}</textarea></div>
    <div class="field"><label>Photo URL</label><input id="mOfferPhoto" value="${offer ? offer.photo : ''}" placeholder="https://..." /></div>
  `, () => {
    const title = document.getElementById('mOfferTitle').value.trim();
    const description = document.getElementById('mOfferDesc').value.trim();
    const photo = document.getElementById('mOfferPhoto').value.trim() || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=500&q=80';
    if (!title) { toast('Title is required'); return false; }
    if (offer) Store.updateOffer(offer.id, { title, description, photo });
    else Store.addOffer({ title, description, photo });
    renderOffersTab();
  });
}

/* ---------- Gallery ---------- */
function renderGalleryTab() {
  const gallery = Store.getGallery();
  const el = document.getElementById('tab-gallery');
  el.innerHTML = `<div class="admin-card"><div class="row-between"><strong>Gallery Photos</strong><button class="small-btn primary" id="addGalBtn">+ Photo</button></div></div>
    <div class="gallery-grid" style="margin:0 14px;">
      ${gallery.map(g => `<div style="position:relative;"><img src="${g.photo}" /><button class="small-btn danger" data-delgal="${g.id}" style="position:absolute;top:2px;right:2px;padding:2px 6px;">âœ•</button></div>`).join('')}
    </div>`;
  document.getElementById('addGalBtn').onclick = () => {
    openModal('Add Photo', `
      <div class="field"><label>Photo URL</label><input id="mGalPhoto" placeholder="https://..." /></div>
      <div class="field"><label>Caption</label><input id="mGalCaption" placeholder="Optional caption" /></div>
    `, () => {
      const photo = document.getElementById('mGalPhoto').value.trim();
      if (!photo) { toast('Photo URL is required'); return false; }
      Store.addGalleryPhoto(photo, document.getElementById('mGalCaption').value.trim());
      renderGalleryTab();
    });
  };
  el.querySelectorAll('[data-delgal]').forEach(b => b.onclick = () => { Store.deleteGalleryPhoto(b.dataset.delgal); renderGalleryTab(); });
}

/* ---------- Settings (cafe/owner info shown to customers) ---------- */
function renderSettingsTab() {
  const s = Store.getSettings();
  const el = document.getElementById('tab-settings');
  el.innerHTML = `
    <div class="admin-card">
      <div class="field"><label>Cafe Name</label><input id="sCafeName" value="${s.cafeName}" /></div>
      <div class="field"><label>Tagline</label><input id="sTagline" value="${s.tagline}" /></div>
      <div class="field"><label>About</label><textarea id="sAbout">${s.about}</textarea></div>
      <div class="field"><label>Logo URL</label><input id="sLogo" value="${s.logo}" /></div>
      <div class="field"><label>Cover Photo URL</label><input id="sCover" value="${s.cover}" /></div>
      <div class="field"><label>Owner Name</label><input id="sOwnerName" value="${s.ownerName}" /></div>
      <div class="field"><label>Owner Photo URL</label><input id="sOwnerPhoto" value="${s.ownerPhoto}" /></div>
      <div class="field"><label>Address</label><textarea id="sAddress">${s.address}</textarea></div>
      <div class="field"><label>Phone</label><input id="sPhone" value="${s.phone}" /></div>
      <div class="field"><label>WhatsApp Number</label><input id="sWhatsapp" value="${s.whatsapp}" /></div>
      <div class="field"><label>Email (Gmail)</label><input id="sEmail" value="${s.email}" /></div>
      <div class="field"><label>Google Maps URL</label><input id="sMaps" value="${s.mapsUrl}" /></div>
      <div class="field"><label>Instagram URL</label><input id="sInsta" value="${s.social.instagram || ''}" /></div>
      <div class="field"><label>Facebook URL</label><input id="sFb" value="${s.social.facebook || ''}" /></div>
      <div class="field"><label>YouTube URL</label><input id="sYt" value="${s.social.youtube || ''}" /></div>
    </div>
    <div class="admin-card">
      <strong style="font-size:.85rem;">Opening Hours</strong>
      ${['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(d => `
        <div class="day-row" style="margin-top:10px;"><label>${d.toUpperCase()}</label><input id="sTime_${d}" value="${s.timings[d] || ''}" placeholder="e.g. 9:00 AM - 11:00 PM" /></div>
      `).join('')}
    </div>
    <div class="admin-card">
      <div class="day-row"><label style="width:auto;flex:1;">Pickup Enabled</label><label class="switch"><input type="checkbox" id="sPickup" ${s.pickupEnabled ? 'checked' : ''}><span class="slider"></span></label></div>
      <div class="day-row"><label style="width:auto;flex:1;">Delivery Enabled</label><label class="switch"><input type="checkbox" id="sDelivery" ${s.deliveryEnabled ? 'checked' : ''}><span class="slider"></span></label></div>
      <div class="field"><label>Delivery Fee (â‚¹)</label><input id="sDeliveryFee" type="number" value="${s.deliveryFee}" /></div>
    </div>
    <button class="primary-btn" id="saveSettingsBtn">Save Settings</button>
  `;
  document.getElementById('save
