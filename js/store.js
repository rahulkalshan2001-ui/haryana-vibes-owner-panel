/* Haryana Vibes Cafe â€” shared data layer
   Everything lives in localStorage today. Every read/write goes through
   this module so swapping localStorage for Google Sheets + Apps Script
   later only means editing the functions below, not the UI code. */

const STORAGE_KEYS = {
  SETTINGS: 'hvc_settings',
  MENU: 'hvc_menu',
  CATEGORIES: 'hvc_categories',
  OFFERS: 'hvc_offers',
  GALLERY: 'hvc_gallery',
  ORDERS: 'hvc_orders',
  CART: 'hvc_cart',
  OWNER_AUTH: 'hvc_owner_auth',
  OWNER_SESSION: 'hvc_owner_session',
  INTEGRATIONS: 'hvc_integrations',
  SEQ: 'hvc_order_seq'
};

/* ---------- Google Sheets / Apps Script integration (future) ----------
   Fill these in once an Apps Script Web App is deployed. Until then all
   orders/notifications stay local. See README/AGENTS for the expected
   Apps Script contract (POST JSON -> appends a row / sends notification). */
const DEFAULT_INTEGRATIONS = {
  appsScriptWebAppUrl: '',
  googleSheetId: '',
  googleSheetUrl: '',
  googleDriveFolderId: '',
  googleDriveFolderUrl: '',
  enabled: false
};

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse', key, e);
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* ---------- Defaults / seed data ---------- */

const DEFAULT_SETTINGS = {
  cafeName: 'Haryana Vibes Cafe',
  tagline: 'Desi Swag, Desi Taste ðŸŒ¾',
  about:
    'Haryana Vibes Cafe brings the heart of Haryana to your plate â€” rustic flavours, ' +
    'generous portions and the warmth of home-style cooking. From sizzling tawa dishes ' +
    'to creamy lassi, every item is made fresh with love.',
  ownerName: 'Rajveer Singh',
  ownerPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rajveer&backgroundColor=b6e3f4',
  logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=HaryanaVibes&backgroundColor=fde68a',
  cover: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
  address: 'Shop No. 12, Model Town, Rohtak, Haryana 124001',
  phone: '+91 98765 43210',
  whatsapp: '+91 98765 43210',
  email: 'haryanavibescafe@gmail.com',
  mapsUrl: 'https://maps.google.com/?q=Model+Town+Rohtak+Haryana',
  social: {
    instagram: 'https://instagram.com/haryanavibescafe',
    facebook: 'https://facebook.com/haryanavibescafe',
    youtube: 'https://youtube.com/@haryanavibescafe'
  },
  timings: {
    mon: '9:00 AM - 11:00 PM', tue: '9:00 AM - 11:00 PM', wed: '9:00 AM - 11:00 PM',
    thu: '9:00 AM - 11:00 PM', fri: '9:00 AM - 11:00 PM', sat: '9:00 AM - 11:30 PM',
    sun: '9:00 AM - 11:30 PM'
  },
  deliveryEnabled: true,
  pickupEnabled: true,
  minOrderForDelivery: 150,
  deliveryFee: 30
};

const DEFAULT_CATEGORIES = [
  { id: 'cat-1', name: 'Tawa Specials', order: 1 },
  { id: 'cat-2', name: 'Snacks & Starters', order: 2 },
  { id: 'cat-3', name: 'Lassi & Drinks', order: 3 },
  { id: 'cat-4', name: 'Rotis & Breads', order: 4 },
  { id: 'cat-5', name: 'Desserts', order: 5 }
];

const DEFAULT_MENU = [
  { id: 'item-1', categoryId: 'cat-1', name: 'Desi Ghee Tawa Paneer', price: 220, veg: true, available: true, description: 'Paneer cooked in desi ghee with onions & capsicum.', photo: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80' },
  { id: 'item-2', categoryId: 'cat-1', name: 'Haryanvi Kadhi Chawal', price: 150, veg: true, available: true, description: 'Traditional buttermilk kadhi served with steamed rice.', photo: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?auto=format&fit=crop&w=500&q=80' },
  { id: 'item-3', categoryId: 'cat-2', name: 'Bajra Khichda', price: 130, veg: true, available: true, description: 'Slow-cooked pearl millet khichda, a Haryanvi classic.', photo: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=500&q=80' },
  { id: 'item-4', categoryId: 'cat-2', name: 'Pyaaz Kachori', price: 60, veg: true, available: true, description: 'Crispy onion kachori served with tangy chutney.', photo: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=500&q=80' },
  { id: 'item-5', categoryId: 'cat-3', name: 'Meetha Lassi', price: 70, veg: true, available: true, description: 'Thick sweet yogurt lassi topped with malai.', photo: 'https://images.unsplash.com/photo-1626200926749-1937e1c5f8a5?auto=format&fit=crop&w=500&q=80' },
  { id: 'item-6', categoryId: 'cat-3', name: 'Namkeen Chaas', price: 40, veg: true, available: true, description: 'Spiced buttermilk, the perfect summer cooler.', photo: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=500&q=80' },
  { id: 'item-7', categoryId: 'cat-4', name: 'Bajre Ki Roti (2 pc)', price: 40, veg: true, available: true, description: 'Pearl millet flatbread served with white butter.', photo: 'https://images.unsplash.com/photo-1574653853027-5382a3d23a15?auto=format&fit=crop&w=500&q=80' },
  { id: 'item-8', categoryId: 'cat-5', name: 'Ghevar', price: 90, veg: true, available: true, description: 'Disc-shaped sweet soaked in sugar syrup, topped with rabri.', photo: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=500&q=80' }
];

const DEFAULT_OFFERS = [
  { id: 'off-1', title: 'Flat 20% off on orders above â‚¹300', description: 'Use code HARYANA20 at checkout.', active: true, photo: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=500&q=80' },
  { id: 'off-2', title: 'Free Lassi on your first order', description: 'New customers get a free Meetha Lassi.', active: true, photo: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=500&q=80' }
];

const DEFAULT_GALLERY = [
  { id: 'gal-1', photo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80', caption: 'Our cozy seating area' },
  { id: 'gal-2', photo: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=600&q=80', caption: 'Fresh tawa cooking' },
  { id: 'gal-3', photo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80', caption: 'Cafe front view' },
  { id: 'gal-4', photo: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=600&q=80', caption: 'Weekend crowd' }
];

const ORDER_STATUSES = ['New', 'Accepted', 'Preparing', 'Ready', 'Out for Delivery', 'Completed', 'Cancelled'];

const DEFAULT_OWNER_AUTH = {
  ownerId: 'owner',
  // demo only: plain text is fine for a localStorage prototype, replace with real auth on the backend later
  password: 'haryana123',
  recoveryQuestion: 'What city is the cafe located in?',
  recoveryAnswer: 'rohtak'
};

function uid(prefix) {
  return prefix + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function ensureSeeded() {
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) writeJSON(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) writeJSON(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
  if (!localStorage.getItem(STORAGE_KEYS.MENU)) writeJSON(STORAGE_KEYS.MENU, DEFAULT_MENU);
  if (!localStorage.getItem(STORAGE_KEYS.OFFERS)) writeJSON(STORAGE_KEYS.OFFERS, DEFAULT_OFFERS);
  if (!localStorage.getItem(STORAGE_KEYS.GALLERY)) writeJSON(STORAGE_KEYS.GALLERY, DEFAULT_GALLERY);
  if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) writeJSON(STORAGE_KEYS.ORDERS, []);
  if (!localStorage.getItem(STORAGE_KEYS.OWNER_AUTH)) writeJSON(STORAGE_KEYS.OWNER_AUTH, DEFAULT_OWNER_AUTH);
  if (!localStorage.getItem(STORAGE_KEYS.INTEGRATIONS)) writeJSON(STORAGE_KEYS.INTEGRATIONS, DEFAULT_INTEGRATIONS);
  if (!localStorage.getItem(STORAGE_KEYS.SEQ)) writeJSON(STORAGE_KEYS.SEQ, 1000);
}

const Store = {
  keys: STORAGE_KEYS,
  orderStatuses: ORDER_STATUSES,

  getSettings() { return readJSON(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS); },
  saveSettings(s) { writeJSON(STORAGE_KEYS.SETTINGS, s); },

  getCategories() { return readJSON(STORAGE_KEYS.CATEGORIES, []).sort((a, b) => a.order - b.order); },
  saveCategories(list) { writeJSON(STORAGE_KEYS.CATEGORIES, list); },
  addCategory(name) {
    const list = this.getCategories();
    list.push({ id: uid('cat'), name, order: list.length + 1 });
    this.saveCategories(list);
  },
  updateCategory(id, patch) {
    const list = this.getCategories().map(c => c.id === id ? { ...c, ...patch } : c);
    this.saveCategories(list);
  },
  deleteCategory(id) {
    this.saveCategories(this.getCategories().filter(c => c.id !== id));
    this.saveMenu(this.getMenu().filter(m => m.categoryId !== id));
  },

  getMenu() { return readJSON(STORAGE_KEYS.MENU, []); },
  saveMenu(list) { writeJSON(STORAGE_KEYS.MENU, list); },
  addMenuItem(item) {
    const list = this.getMenu();
    list.push({ id: uid('item'), available: true, veg: true, ...item });
    this.saveMenu(list);
  },
  updateMenuItem(id, patch) {
    this.saveMenu(this.getMenu().map(m => m.id === id ? { ...m, ...patch } : m));
  },
  deleteMenuItem(id) {
    this.saveMenu(this.getMenu().filter(m => m.id !== id));
  },

  getOffers() { return readJSON(STORAGE_KEYS.OFFERS, []); },
  saveOffers(list) { writeJSON(STORAGE_KEYS.OFFERS, list); },
  addOffer(offer) {
    const list = this.getOffers();
    list.push({ id: uid('off'), active: true, ...offer });
    this.saveOffers(list);
  },
  updateOffer(id, patch) {
    this.saveOffers(this.getOffers().map(o => o.id === id ? { ...o, ...patch } : o));
  },
  deleteOffer(id) {
    this.saveOffers(this.getOffers().filter(o => o.id !== id));
  },

  getGallery() { return readJSON(STORAGE_KEYS.GALLERY, []); },
  saveGallery(list) { writeJSON(STORAGE_KEYS.GALLERY, list); },
  addGalleryPhoto(photo, caption) {
    const list = this.getGallery();
    list.push({ id: uid('gal'), photo, caption: caption || '' });
    this.saveGallery(list);
  },
  deleteGalleryPhoto(id) {
    this.saveGallery(this.getGallery().filter(g => g.id !== id));
  },

  getOrders() { return readJSON(STORAGE_KEYS.ORDERS, []).sort((a, b) => b.createdAt - a.createdAt); },
  saveOrders(list) { writeJSON(STORAGE_KEYS.ORDERS, list); },
  getOrder(id) { return this.getOrders().find(o => o.id === id) || null; },
  nextOrderNumber() {
    const seq = readJSON(STORAGE_KEYS.SEQ, 1000) + 1;
    writeJSON(STORAGE_KEYS.SEQ, seq);
    return seq;
  },
  createOrder(order) {
    const list = this.getOrders();
    const fullOrder = {
      id: uid('order'),
      number: this.nextOrderNumber(),
      status: 'New',
      createdAt: Date.now(),
      statusHistory: [{ status: 'New', at: Date.now() }],
      ...order
    };
    list.push(fullOrder);
    this.saveOrders(list);
    this.notifyIntegration(fullOrder);
    return fullOrder;
  },
  updateOrderStatus(id, status) {
    const list = this.getOrders().map(o => {
      if (o.id !== id) return o;
      return { ...o, status, statusHistory: [...(o.statusHistory || []), { status, at: Date.now() }] };
    });
    this.saveOrders(list);
  },
  getOrdersForCustomer(phone) {
    return this.getOrders().filter(o => o.customer && o.customer.phone === phone);
  },

  /* Cart is per-browser, not synced anywhere */
  getCart() { return readJSON(STORAGE_KEYS.CART, []); },
  saveCart(cart) { writeJSON(STORAGE_KEYS.CART, cart); window.dispatchEvent(new Event('hvc-cart-changed')); },
  clearCart() { this.saveCart([]); },

  getIntegrations() { return readJSON(STORAGE_KEYS.INTEGRATIONS, DEFAULT_INTEGRATIONS); },
  saveIntegrations(v) { writeJSON(STORAGE_KEYS.INTEGRATIONS, v); },

  /* Sends the order to the configured Apps Script Web App, if any.
     Fire-and-forget, never blocks placing the order locally. Apps Script
     is expected to accept a POST with JSON body { type: 'order', order }
     and append it to the connected Google Sheet / send a notification. */
  notifyIntegration(order) {
    const cfg = this.getIntegrations();
    if (!cfg.enabled || !cfg.appsScriptWebAppUrl) return;
    fetch(cfg.appsScriptWebAppUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ type: 'order', order, sheetId: cfg.googleSheetId })
    }).catch(err => console.warn('Apps Script notify failed (expected until configured):', err));
  },

  /* Owner auth */
  getOwnerAuth() { return readJSON(STORAGE_KEYS.OWNER_AUTH, DEFAULT_OWNER_AUTH); },
  saveOwnerAuth(v) { writeJSON(STORAGE_KEYS.OWNER_AUTH, v); },
  login(ownerId, password) {
    const auth = this.getOwnerAuth();
    if (auth.ownerId === ownerId.trim() && auth.password === password) {
      sessionStorage.setItem(STORAGE_KEYS.OWNER_SESSION, 'true');
      return true;
    }
    return false;
  },
  isLoggedIn() { return sessionStorage.getItem(STORAGE_KEYS.OWNER_SESSION) === 'true'; },
  logout() { sessionStorage.removeItem(STORAGE_KEYS.OWNER_SESSION); },
  recoverPassword(ownerId, answer, newPassword) {
    const auth = this.getOwnerAuth();
    if (auth.ownerId === ownerId.trim() && auth.recoveryAnswer.toLowerCase() === answer.trim().toLowerCase()) {
      this.saveOwnerAuth({ ...auth, password: newPassword });
      return true;
    }
    return false;
  }
};

ensureSeeded();
