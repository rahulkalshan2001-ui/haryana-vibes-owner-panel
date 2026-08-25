/* Haryana Vibes Cafe — Customer App logic (hash-router SPA) */

let activeCategoryId = null;
let checkoutMode = 'pickup';

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 1800);
}

function money(n) { return '₹' + Number(n).toFixed(0); }

function callOwner() { window.location.href = 'tel:' + Store.getSettings().phone.replace(/\s/g, ''); }
function whatsappOwner() {
  const s = Store.getSettings();
  window.open('https://wa.me/' + s.whatsapp.replace(/[^\d]/g, ''), '_blank');
}

/* ---------- Routing ---------- */
const VIEWS = ['home', 'menu', 'cart', 'checkout', 'orders', 'info'];
function currentRoute() {
  const hash = window.location.hash.replace('#/', '') || 'home';
  return VIEWS.includes(hash) ? hash : 'home';
}
function render() {
  const route = currentRoute();
  VIEWS.forEach(v => document.getElementById('view-' + v).classList.toggle('hidden', v !== route));
  document.querySelectorAll('#bottomNav a').forEach(a => a.classList.toggle('active', a.dataset.route === route));
  document.getElementById('bottomNav').classList.toggle('hidden', route === 'checkout');
  window.scrollTo(0, 0);
  if (route === 'menu') renderMenu();
  if (route === 'cart') renderCart();
  if (route === 'checkout') renderCheckout();
  if (route === 'orders') renderOrders();
  if (route === 'info') renderInfo();
  if (route === 'home') renderHome();
  updateCartBadge();
}
window.addEventListener('hashchange', render);
window.addEventListener('hvc-cart-changed', updateCartBadge);

function goto(route) { window.location.hash = '#/' + route; }

/* ---------- Home ---------- */
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
function renderHome() {
  const s = Store.getSettings();
  document.getElementById('coverBg').style.backgroundImage = `url('${s.cover}')`;
  document.getElementById('logoImg').src = s.logo;
  document.getElementById('cafeNameH').textContent = s.cafeName;
  document.getElementById('taglineP').textContent = s.tagline;
  document.getElementById('ownerPhotoImg').src = s.ownerPhoto;
  document.getElementById('ownerNameP').textContent = s.ownerName;
  document.getElementById('ownerCafeNameSpan').textContent = s.cafeName;
  document.getElementById('aboutP').textContent = s.about;

  const offers = Store.getOffers().filter(o => o.active);
  const offersSection = document.getElementById('offersSection');
  offersSection.classList.toggle('hidden', offers.length === 0);
  document.getElementById('offersScroll').innerHTML = offers.map(o => `
    <div class="offer-card">
      <img src="${o.photo}" alt="" />
      <div class="offer-body"><h3>${o.title}</h3><p>${o.description || ''}</p></div>
    </div>`).join('');

  document.getElementById('galleryGrid').innerHTML = Store.getGallery().map(g =>
    `<img src="${g.photo}" alt="${g.caption || ''}" title="${g.caption || ''}" />`).join('');

  renderTimingsTable('timingsTable', s);
}

function renderTimingsTable(elId, s) {
  const todayIdx = new Date().getDay();
  const rows = DAY_KEYS.map((k, i) => {
    const label = { sun: 'Sunday', mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday' }[k];
    return `<tr class="${i === todayIdx ? 'today' : ''}"><td>${label}</td><td>${s.timings[k] || 'Closed'}</td></tr>`;
  }).join('');
  document.getElementById(elId).innerHTML = rows;
}

/* ---------- Menu ---------- */
function renderMenu() {
  const cats = Store.getCategories();
  if (!activeCategoryId) activeCategoryId = 'all';
  document.getElementById('catChips').innerHTML = ['all', ...cats.map(c => c.id)].map(id => {
    const label = id === 'all' ? 'All' : cats.find(c => c.id === id).name;
    return `<button class="cat-chip ${id === activeCategoryId ? 'active' : ''}" data-cat="${id}">${label}</button>`;
  }).join('');
  document.querySelectorAll('.cat-chip').forEach(btn => {
    btn.onclick = () => { activeCategoryId = btn.dataset.cat; renderMenu(); };
  });

  const menu = Store.getMenu();
  const cart = Store.getCart();
  const catsToShow = activeCategoryId === 'all' ? cats : cats.filter(c => c.id === activeCategoryId);

  let html = '';
  catsToShow.forEach(cat => {
    const items = menu.filter(m => m.categoryId === cat.id);
    if (!items.length) return;
    html += `<div class="menu-cat-title">${cat.name}</div>`;
    items.forEach(item => {
      const cartLine = cart.find(c => c.itemId === item.id);
      const qty = cartLine ? cartLine.qty : 0;
      html += `
        <div class="menu-item">
          <img src="${item.photo}" alt="${item.name}" />
          <div class="info">
            <h4><span class="veg-dot"></span>${item.name}</h4>
            <p class="desc">${item.description || ''}</p>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span class="price">${money(item.price)}</span>
              ${item.available === false
                ? '<span class="unavailable-badge">Unavailable</span>'
                : qty === 0
                  ? `<button class="add-btn" onclick="addToCart('${item.id}')">ADD</button>`
                  : `<div class="stepper">
                      <button onclick="changeQty('${item.id}', -1)">−</button>
                      <span class="count">${qty}</span>
                      <button onclick="changeQty('${item.id}', 1)">+</button>
                    </div>`
              }
            </div>
          </div>
        </div>`;
    });
  });
  document.getElementById('menuList').innerHTML = html || '<div class="empty-state"><span class="big-icon">🍽️</span>No items in this category yet.</div>';
}

function addToCart(itemId) {
  const cart = Store.getCart();
  const line = cart.find(c => c.itemId === itemId);
  if (line) line.qty += 1; else cart.push({ itemId, qty: 1 });
  Store.saveCart(cart);
  renderMenu();
  toast('Added to cart');
}
function changeQty(itemId, delta) {
  let cart = Store.getCart();
  const line = cart.find(c => c.itemId === itemId);
  if (!line) return;
  line.qty += delta;
  if (line.qty <= 0) cart = cart.filter(c => c.itemId !== itemId);
  Store.saveCart(cart);
  renderMenu();
}
function updateCartBadge() {
  const count = Store.getCart().reduce((a, c) => a + c.qty, 0);
  const badge = document.getElementById('cartBadge');
  badge.textContent = count;
  badge.classList.toggle('hidden', count === 0);
}

/* ---------- Cart ---------- */
function cartLinesWithItems() {
  const menu = Store.getMenu();
  return Store.getCart().map(c => ({ ...c, item: menu.find(m => m.id === c.itemId) })).filter(c => c.item);
}
function cartTotal() {
  return cartLinesWithItems().reduce((sum, c) => sum + c.item.price * c.qty, 0);
}
function renderCart() {
  const lines = cartLinesWithItems();
  const listEl = document.getElementById('cartList');
  const summaryEl = document.getElementById('cartSummaryWrap');
  if (!lines.length) {
    listEl.innerHTML = '<div class="empty-state"><span class="big-icon">🛒</span>Your cart is empty.<br/><br/><a class="secondary-btn" style="display:inline-block;padding:10px 20px;" href="#/menu">Browse Menu</a></div>';
    summaryEl.innerHTML = '';
    return;
  }
  listEl.innerHTML = lines.map(c => `
    <div class="cart-item">
      <img src="${c.item.photo}" alt="" />
      <div class="info">
        <h4>${c.item.name}</h4>
        <span class="price">${money(c.item.price)}</span>
      </div>
      <div class="stepper">
        <button onclick="changeQty('${c.itemId}', -1)">−</button>
        <span class="count">${c.qty}</span>
        <button onclick="changeQty('${c.itemId}', 1)">+</button>
      </div>
    </div>`).join('');
  const total = cartTotal();
  summaryEl.innerHTML = `
    <div class="cart-summary">
      <div class="summary-row"><span>Item Total</span><span>${money(total)}</span></div>
      <div class="summary-row total"><span>To Pay</span><span>${money(total)}</span></div>
    </div>
    <button class="primary-btn" onclick="goto('checkout')">Proceed to Checkout</button>`;
}

/* ---------- Checkout ---------- */
function setFulfillment(mode) {
  checkoutMode = mode;
  document.getElementById('pickupBtn').classList.toggle('active', mode === 'pickup');
  document.getElementById('deliveryBtn').classList.toggle('active', mode === 'delivery');
  document.getElementById('addressField').classList.toggle('hidden', mode !== 'delivery');
  renderCheckoutSummary();
}
function renderCheckoutSummary() {
  const s = Store.getSettings();
  const subtotal = cartTotal();
  const deliveryFee = checkoutMode === 'delivery' ? s.deliveryFee : 0;
  const total = subtotal + deliveryFee;
  document.getElementById('checkoutSummary').innerHTML = `
    <div class="summary-row"><span>Subtotal</span><span>${money(subtotal)}</span></div>
    ${checkoutMode === 'delivery' ? `<div class="summary-row"><span>Delivery Fee</span><span>${money(deliveryFee)}</span></div>` : ''}
    <div class="summary-row total"><span>Total</span><span>${money(total)}</span></div>`;
}
function renderCheckout() {
  const s = Store.getSettings();
  document.getElementById('pickupBtn').classList.toggle('hidden', !s.pickupEnabled);
  document.getElementById('deliveryBtn').classList.toggle('hidden', !s.deliveryEnabled);
  checkoutMode = s.pickupEnabled ? 'pickup' : 'delivery';
  setFulfillment(checkoutMode);
  document.getElementById('pickupBtn').onclick = () => setFulfillment('pickup');
  document.getElementById('deliveryBtn').onclick = () => setFulfillment('delivery');
  document.getElementById('placeOrderBtn').onclick = placeOrder;
}
function placeOrder() {
  const lines = cartLinesWithItems();
  if (!lines.length) { toast('Your cart is empty'); return; }
  const name = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const address = document.getElementById('custAddress').value.trim();
  const instructions = document.getElementById('custInstructions').value.trim();
  if (!name || !phone) { toast('Please enter your name and phone number'); return; }
  if (!/^\d{10}$/.test(phone.replace(/\D/g, '').slice(-10))) { toast('Please enter a valid phone number'); return; }
  if (checkoutMode === 'delivery' && !address) { toast('Please enter a delivery address'); return; }

  const s = Store.getSettings();
  const subtotal = cartTotal();
  const deliveryFee = checkoutMode === 'delivery' ? s.deliveryFee : 0;
  const order = Store.createOrder({
    items: lines.map(l => ({ itemId: l.itemId, name: l.item.name, price: l.item.price, qty: l.qty })),
    fulfillment: checkoutMode,
    subtotal, deliveryFee, total: subtotal + deliveryFee,
    customer: { name, phone, address: checkoutMode === 'delivery' ? address : '', instructions }
  });
  Store.clearCart();
  toast('Order #' + order.number + ' placed!');
  document.getElementById('trackPhoneInput') && (document.getElementById('trackPhoneInput').value = phone);
  localStorage.setItem('hvc_last_phone', phone);
  goto('orders');
}

/* ---------- Orders ---------- */
function renderOrders() {
  const savedPhone = localStorage.getItem('hvc_last_phone') || '';
  const input = document.getElementById('trackPhoneInput');
  input.value = savedPhone;
  const draw = () => {
    const phone = input.value.trim();
    localStorage.setItem('hvc_last_phone', phone);
    const orders = phone ? Store.getOrdersForCustomer(phone) : [];
    const listEl = document.getElementById('ordersList');
    if (!phone) { listEl.innerHTML = '<div class="empty-state"><span class="big-icon">📱</span>Enter your phone number above to see your orders.</div>'; return; }
    if (!orders.length) { listEl.innerHTML = '<div class="empty-state"><span class="big-icon">📦</span>No orders found for this number.</div>'; return; }
    listEl.innerHTML = orders.map(orderCardHtml).join('');
  };
  input.oninput = draw;
  draw();
}

function orderCardHtml(order) {
  const statusClass = 'status-' + order.status.replace(/\s+/g, '-');
  const steps = ['New', 'Accepted', 'Preparing', 'Ready', order.fulfillment === 'delivery' ? 'Out for Delivery' : 'Ready', 'Completed'];
  const uniqueSteps = order.fulfillment === 'delivery'
    ? ['New', 'Accepted', 'Preparing', 'Out for Delivery', 'Completed']
    : ['New', 'Accepted', 'Preparing', 'Ready', 'Completed'];
  const isCancelled = order.status === 'Cancelled';
  const currentIdx = uniqueSteps.indexOf(order.status);
  const progressHtml = isCancelled ? '' : `<div class="progress-track">${uniqueSteps.map((st, i) => `
    <div class="progress-step ${i < currentIdx ? 'done' : ''} ${i === currentIdx ? 'current' : ''}">
      <div class="line"></div><div class="dot">${i <= currentIdx ? '✓' : ''}</div><span class="label">${st}</span>
    </div>`).join('')}</div>`;

  return `
    <div class="order-card">
      <div class="order-head">
        <strong>Order #${order.number}</strong>
        <span class="status-pill ${statusClass}">${order.status}</span>
      </div>
      <div style="font-size:.72rem;color:var(--muted);margin-bottom:6px;">
        ${new Date(order.createdAt).toLocaleString()} · ${order.fulfillment === 'delivery' ? 'Delivery' : 'Pickup'}
      </div>
      ${progressHtml}
      <div style="margin-top:8px;font-size:.78rem;">
        ${order.items.map(i => `${i.qty} × ${i.name}`).join('<br/>')}
      </div>
      <div class="summary-row total" style="margin-top:8px;"><span>Total</span><span>${money(order.total)}</span></div>
    </div>`;
}

/* ---------- Info ---------- */
function renderInfo() {
  const s = Store.getSettings();
  document.getElementById('infoCafeName').textContent = s.cafeName;
  document.getElementById('infoAddress').textContent = s.address;
  document.getElementById('waLink').href = 'https://wa.me/' + s.whatsapp.replace(/[^\d]/g, '');
  document.getElementById('callLink').href = 'tel:' + s.phone.replace(/\s/g, '');
  document.getElementById('mailLink').href = 'mailto:' + s.email;
  document.getElementById('mapsLink').href = s.mapsUrl;
  const socialIcons = { instagram: '📷', facebook: '📘', youtube: '▶️' };
  document.getElementById('socialRow').innerHTML = Object.entries(s.social || {})
    .filter(([, url]) => url)
    .map(([key, url]) => `<a href="${url}" target="_blank" title="${key}">${socialIcons[key] || '🔗'}</a>`).join('');
  renderTimingsTable('timingsTable2', s);
}

render()
