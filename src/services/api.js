import {

  initialLands,

  initialProducts,

  initialLeaseApplications,

  initialLeases,

  initialTransactions,

  initialOrders,

  initialUsers

} from '../data.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Helper for persistent local storage synced stores

function getStoredItem(key, defaultValue) {

  try {

    const saved = localStorage.getItem(key);

    if (!saved) return defaultValue;

    const parsed = JSON.parse(saved);

    if (Array.isArray(parsed)) {

      return parsed;

    }

    return parsed;

  } catch (e) {

    return defaultValue;

  }

}

function setStoredItem(key, value) {

  try {

    localStorage.setItem(key, JSON.stringify(value));

  } catch (e) {

    console.error('Storage error:', e);

  }

}

// IDs created only for browser/localStorage fallback data.
// Never use Date.now() as a PostgreSQL primary key.

function makeLocalId(prefix = 'local') {

  try {

    if (globalThis.crypto?.randomUUID) {

      return `${prefix}_${globalThis.crypto.randomUUID()}`;

    }

  } catch (_) {

    // Use the fallback below when randomUUID is unavailable.

  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

}

function makeLocalTransactionId(prefix = 'AGRI') {

  return `${prefix}-${makeLocalId('tx')}`;

}

function isLocalId(value) {

  return typeof value === 'string' && (

    value.startsWith('local_') ||

    value.startsWith('transaction_') ||

    value.startsWith('order_') ||

    value.startsWith('payout_')

  );

}

// Stores backed by LocalStorage for real persistent state

let usersStore = getStoredItem('agribridge_users', []);

let landsStore = getStoredItem('agribridge_lands', []);

let productsStore = getStoredItem('agribridge_products', []);

let applicationsStore = getStoredItem('agribridge_applications', []);

let leasesStore = getStoredItem('agribridge_leases', []);

let transactionsStore = getStoredItem('agribridge_transactions', []);

let ordersStore = getStoredItem('agribridge_orders', []);

let cartStore = getStoredItem('agribridge_cart', []);

// Remove simulated browser-only lease credits. Server data is the source of truth.

const retainedTransactions = transactionsStore.filter((transaction) => !(

  transaction?.direction === 'credit' &&

  /-CR\d\*$/.test(String(transaction.transaction_id || '')) &&

  /^Lease payment received for lease #/i.test(String(transaction.description || ''))

));

if (retainedTransactions.length !== transactionsStore.length) {

  transactionsStore = retainedTransactions;

  setStoredItem('agribridge_transactions', transactionsStore);

}

// Remove the two specifically requested temporary transaction records.

const removedTransactionIds = new Set(['AGRI1789624729053-CR1', 'AGRI1789620218127']);

const retainedRequestedTransactions = transactionsStore.filter((transaction) => !removedTransactionIds.has(String(transaction?.transaction_id || '')));

if (retainedRequestedTransactions.length !== transactionsStore.length) {

  transactionsStore = retainedRequestedTransactions;

  setStoredItem('agribridge_transactions', transactionsStore);

}

// Remove the specifically requested stale local crop listing. It is not present in MySQL.

const retainedProducts = productsStore.filter((product) => !(

  String(product?.product_name || "").trim().toLowerCase() === "paddy" &&

  Number(product?.price_per_unit) === 24 &&

  String(product?.unit || "").trim().toLowerCase() === "kg" &&

  String(product?.location || "").trim().toLowerCase() === "ongole, andhra pradesh"

));

if (retainedProducts.length !== productsStore.length) {

  productsStore = retainedProducts;

  setStoredItem("agribridge_products", productsStore);

}

// Remove the specifically requested stale local land listing. It is not in MySQL.

const retainedLands = landsStore.filter((land) => !(

  String(land?.location || "").trim().toLowerCase() === "ongole, andhra pradesh" &&

  String(land?.land_type ?? land?.land_name ?? "").trim().toLowerCase() === "paddy farm" &&

  Number(land?.area_acres ?? land?.acres) === 5.9 &&

  Number(land?.price_per_year ?? land?.lease_price) === 30000

));

if (retainedLands.length !== landsStore.length) {

  landsStore = retainedLands;

  setStoredItem("agribridge_lands", landsStore);

}

function getCurrentUser() {

  try { return JSON.parse(localStorage.getItem('agribridge_user') || 'null'); } catch { return null; }

}

function belongsToUser(record, user, idField, emailFields = []) {

  if (!user) return false;

  if (record[idField] != null && String(record[idField]) === String(user.id)) return true;

  const email = String(user.email || "").toLowerCase().trim();

  return emailFields.some(field => String(record[field] || "").toLowerCase().trim() === email);

}

// Helper to handle API fetch with fallback to stateful storage

async function fetchWithFallback(endpoint, options = {}, fallbackData = null) {

  try {

    const token = localStorage.getItem('agribridge_token');

    const headers = {

      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),

      ...(token ? { Authorization: `Bearer ${token}` } : {}),

      ...(options.headers || {})

    };

    const timeoutMs = options.timeout || 8000;

    const controller = new AbortController();

    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {

      ...options,

      headers,

      signal: controller.signal

    });

    clearTimeout(timeoutId);

    if (response.ok) return await response.json();

    const errorData = await response.json().catch(() => ({}));

    return { success: false, message: errorData.message || "Request failed." };

  } catch (err) {

    return { success: true, data: fallbackData, isMock: true };

  }

}

function buildFileFormData(data, fileField = "file") {

  const formData = new FormData();

  Object.entries(data || {}).forEach(([key, value]) => {

    if (key === fileField || value === undefined || value === null) return;

    formData.append(key, String(value));

  });

  if (data?.[fileField]) formData.append(fileField, data[fileField]);

  return formData;

}

export const api = {

  // AUTHENTICATION

  async login({ email, password }) {

    const cleanEmail = (email || '').toLowerCase().trim();

    usersStore = getStoredItem('agribridge_users', []);

    const res = await fetchWithFallback('/auth/login', {

      method: 'POST',

      body: JSON.stringify({ email: cleanEmail, password })

    }, null);

    if (res && res.data && res.data.user) {

      localStorage.setItem('agribridge_token', res.data.token || 'mock_token');

      return { success: true, user: res.data.user };

    }

    // Check local persistent users DB

    const found = usersStore.find(u => u.email.toLowerCase() === cleanEmail);

    if (!found) {

      return { success: false, message: 'Account not found. Please register a new account.' };

    }

    if (found.password && found.password !== password) {

      return { success: false, message: 'Invalid email or password. Please check your credentials.' };

    }

    const userData = {

      id: found.id,

      full_name: found.full_name,

      email: found.email,

      role: found.role,

      avatar: found.avatar || null,

      phone: found.phone || ''

    };

    localStorage.setItem('agribridge_token', `token_${Date.now()}`);

    return { success: true, user: userData };

  },

  async register({ full_name, email, password, phone, role, avatar }) {

    const cleanEmail = (email || '').toLowerCase().trim();

    usersStore = getStoredItem('agribridge_users', []);

    const existing = usersStore.find(u => u.email.toLowerCase() === cleanEmail);

    if (existing) {

      return { success: false, message: 'An account with this email address already exists.' };

    }

    const newUser = {

      id: makeLocalId('user'),

      full_name,

      email: cleanEmail,

      password,

      role,

      avatar: avatar || null,

      phone: phone || '',

      status: 'active',

      created_at: new Date().toISOString().split('T')[0]

    };

    usersStore.push(newUser);

    setStoredItem('agribridge_users', usersStore);

    await fetchWithFallback('/auth/register', {

      method: 'POST',

      body: JSON.stringify({ full_name, email: cleanEmail, password, phone, role })

    }, newUser);

    const userData = {

      id: newUser.id,

      full_name: newUser.full_name,

      email: newUser.email,

      role: newUser.role,

      avatar: newUser.avatar,

      phone: newUser.phone

    };

    localStorage.setItem('agribridge_token', `token_${Date.now()}`);

    return { success: true, user: userData };

  },

  async sendRegistrationVerification(email) {

    try {

      const response = await fetch(API_BASE_URL + "/auth/send-registration-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: (email || "").trim() }) });

      return await response.json();

    } catch {

      return { success: false, message: "Unable to send the verification code. Please try again when the server is available." };

    }

  },

  async verifyRegistrationAndRegister(payload) {

    try {

      const response = await fetch(API_BASE_URL + "/auth/verify-registration", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

      const result = await response.json();

      if (!result.success || !result.data?.user) return result;

      usersStore = getStoredItem("agribridge_users", []);

      const user = { ...result.data.user, password: payload.password, email_verified: true };

      const index = usersStore.findIndex(item => item.email.toLowerCase() === user.email.toLowerCase());

      if (index >= 0) usersStore[index] = { ...usersStore[index], ...user }; else usersStore.push(user);

      setStoredItem("agribridge_users", usersStore);

      localStorage.setItem("agribridge_token", result.data.token);

      return { success: true, user: result.data.user, message: result.message };

    } catch {

      return { success: false, message: "Unable to verify the email. Please try again when the server is available." };

    }

  },

  // GOOGLE OAUTH LOGIN / REGISTER

  async googleAuth({ email, full_name, avatar, role = 'farmer' }) {

    const cleanEmail = (email || '').toLowerCase().trim();

    usersStore = getStoredItem('agribridge_users', []);

    let user = usersStore.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {

      user = {

        id: makeLocalId('user'),

        full_name: full_name || 'Google User',

        email: cleanEmail,

        password: 'GoogleOAuth@123',

        role: role,

        avatar: avatar || 'https://lh3.googleusercontent.com/a/default-user=s96-c',

        phone: '+91 98765 00000',

        status: 'active',

        created_at: new Date().toISOString().split('T')[0]

      };

      usersStore.push(user);

      setStoredItem('agribridge_users', usersStore);

    }

    const userData = {

      id: user.id,

      full_name: user.full_name,

      email: user.email,

      role: user.role,

      avatar: user.avatar,

      phone: user.phone

    };

    localStorage.setItem('agribridge_token', `google_oauth_token_${Date.now()}`);

    return { success: true, user: userData };

  },

  // FORGOT PASSWORD DISPATCH VIA BACKEND REST API

  async sendForgotPasswordOtp(target, channel = 'email') {

    const cleanTarget = (target || '').trim();

    try {

      const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ target: cleanTarget, channel })

      });

      const data = await response.json();

      return data;

    } catch (err) {

      return {

        success: false,

        message: err.message || 'Unable to connect to authentication server.'

      };

    }

  },

  async verifyOtpAndResetPassword({ target, otp, newPassword }) {

    const cleanTarget = (target || '').trim();

    try {

      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ target: cleanTarget, otp, newPassword })

      });

      const data = await response.json();

      if (data.success) {

        usersStore = getStoredItem('agribridge_users', []);

        const cleanTargetDigits = cleanTarget.replace(/\D/g, '');

        let user = usersStore.find(u =>

          u.email.toLowerCase() === cleanTarget.toLowerCase() ||

          (u.phone && cleanTargetDigits && u.phone.replace(/\D/g, '').includes(cleanTargetDigits))

        );

        if (user) {

          user.password = newPassword;

          setStoredItem('agribridge_users', usersStore);

        }

      }

      return data;

    } catch (err) {

      return {

        success: false,

        message: err.message || 'Unable to connect to authentication server.'

      };

    }

  },

  async resetPassword({ email, newPassword }) {

    const cleanEmail = (email || '').toLowerCase().trim();

    usersStore = getStoredItem('agribridge_users', []);

    const user = usersStore.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {

      return { success: false, message: 'No registered user account found with this email address.' };

    }

    user.password = newPassword;

    setStoredItem('agribridge_users', usersStore);

    return { success: true, message: 'Password reset successful! You can now log in.' };

  },

  async uploadAvatar(file) {

    const response = await fetchWithFallback("/profile/avatar", { method: "PUT", body: buildFileFormData({ file }) }, null);

    const newAvatar = response?.data?.avatar || response?.data?.avatar_url;

    if (newAvatar) {

      const current = getCurrentUser();

      if (current) {

        const updated = { ...current, avatar: newAvatar, avatar_url: newAvatar };

        localStorage.setItem("agribridge_user", JSON.stringify(updated));

        usersStore = getStoredItem("agribridge_users", []);

        const index = usersStore.findIndex(item => String(item.id) === String(current.id));

        if (index >= 0) {

          usersStore[index] = { ...usersStore[index], avatar: newAvatar, avatar_url: newAvatar };

          setStoredItem("agribridge_users", usersStore);

        }

      }

    }

    return response;

  },

  async deleteAvatar() {

    const response = await fetchWithFallback("/profile/avatar", { method: "DELETE" }, null);

    if (response?.success) {

      const current = getCurrentUser();

      if (current) {

        const updated = { ...current, avatar: null, avatar_url: null };

        localStorage.setItem("agribridge_user", JSON.stringify(updated));

        usersStore = getStoredItem("agribridge_users", []);

        const index = usersStore.findIndex(item => String(item.id) === String(current.id));

        if (index >= 0) {

          usersStore[index] = { ...usersStore[index], avatar: null, avatar_url: null };

          setStoredItem("agribridge_users", usersStore);

        }

      }

    }

    return response;

  },

  async updateProfile(profileData) {

    const current = getCurrentUser();

    const updatedUser = { ...current, ...profileData };

    const response = await fetchWithFallback("/profile", {

      method: "PUT",

      body: JSON.stringify(profileData)

    }, updatedUser);

    const savedUser = response?.data?.user || updatedUser;

    localStorage.setItem("agribridge_user", JSON.stringify(savedUser));

    usersStore = getStoredItem("agribridge_users", []);

    const index = usersStore.findIndex(item => String(item.id) === String(savedUser.id));

    if (index >= 0) {

      usersStore[index] = { ...usersStore[index], ...savedUser };

      setStoredItem("agribridge_users", usersStore);

    }

    return { ...response, data: { ...(response.data || {}), user: savedUser } };

  },

  async uploadIdProof(file) {

    return fetchWithFallback("/profile/id-proof", { method: "PUT", body: buildFileFormData({ file }) }, null);

  },

  // LANDS

  async getLands(filters = {}) {

    landsStore = getStoredItem('agribridge_lands', []);

    const res = await fetchWithFallback('/lands', { method: 'GET' }, landsStore);

    // A reachable API is the source of truth; cached records may not exist in the database.

    let result = res.isMock ? landsStore : (Array.isArray(res.data) ? res.data : []);

    if (filters.search) {

      const s = filters.search.toLowerCase();

      result = result.filter(l =>

        (l.land_name && l.land_name.toLowerCase().includes(s)) ||

        (l.location && l.location.toLowerCase().includes(s)) ||

        (l.soil_type && l.soil_type.toLowerCase().includes(s))

      );

    }

    if (filters.soil_type) {

      result = result.filter(l => l.soil_type && l.soil_type.toLowerCase() === filters.soil_type.toLowerCase());

    }

    return result;

  },

  async getMyLands() {

    landsStore = getStoredItem("agribridge_lands", []);

    const user = getCurrentUser();

    const ownedLocally = landsStore.filter(land => belongsToUser(land, user, "landowner_id", ["owner_email", "created_by"]) || belongsToUser(land, user, "owner_id", ["owner_email", "created_by"]));

    const res = await fetchWithFallback("/lands/mine", { method: "GET" }, ownedLocally);

    return res.isMock ? ownedLocally : (Array.isArray(res.data) ? res.data : []);

  },

  async getLandById(id) {

    landsStore = getStoredItem('agribridge_lands', []);

    const found = landsStore.find(l => String(l.id) === String(id)) || null;

    const res = await fetchWithFallback(`/lands/${id}`, { method: 'GET' }, found);

    return res.isMock ? found : (res.data || null);

  },

  async createLand(landData) {

    const { file, ...fields } = landData || {};

    const body = file ? buildFileFormData(landData) : JSON.stringify(fields);

    return fetchWithFallback("/lands", { method: "POST", body }, null);

  },

  async updateLand(id, landData) {

    const { file, ...fields } = landData || {};

    const body = file ? buildFileFormData(landData) : JSON.stringify(fields);

    return fetchWithFallback("/lands/" + id, { method: "PUT", body }, null);

  },

  async deleteLand(id) {

    return fetchWithFallback("/lands/" + id, { method: "DELETE" }, null);

  },

  // LEASES & APPLICATIONS

  async applyForLease(appData) {

    return fetchWithFallback("/farmer/leases/apply", { method: "POST", body: JSON.stringify(appData) }, null);

  },

  async getFarmerApplications() {

    applicationsStore = getStoredItem('agribridge_applications', []);

    const user = getCurrentUser();

    const ownedApplications = applicationsStore.filter(app => belongsToUser(app, user, 'farmer_id', ['farmer_email']));

    const res = await fetchWithFallback('/farmer/applications', { method: 'GET' }, ownedApplications);

    return res.isMock ? ownedApplications : (Array.isArray(res.data) ? res.data : [])

  },

  async getLandownerApplications() {

    applicationsStore = getStoredItem('agribridge_applications', []);

    landsStore = getStoredItem('agribridge_lands', []);

    const user = getCurrentUser();

    const myLandIds = landsStore.filter(land => belongsToUser(land, user, 'landowner_id', ['owner_email', 'created_by']) || belongsToUser(land, user, 'owner_id', ['owner_email', 'created_by'])).map(land => String(land.id));

    const ownedApplications = applicationsStore.filter(app => belongsToUser(app, user, 'owner_id', ['owner_email']) || myLandIds.includes(String(app.land_id)));

    const res = await fetchWithFallback('/landowner/applications', { method: 'GET' }, ownedApplications);

    return res.isMock ? ownedApplications : (Array.isArray(res.data) ? res.data : [])

  },

  async updateApplicationStatus(id, status) {

    return fetchWithFallback("/landowner/applications/" + id + "/status", { method: "PUT", body: JSON.stringify({ status }) }, null);

  },

  async getFarmerLeases() {

    leasesStore = getStoredItem('agribridge_leases', []);

    const res = await fetchWithFallback('/farmer/leases', { method: 'GET' }, leasesStore);

    return res.isMock ? leasesStore : (Array.isArray(res.data) ? res.data : []);

  },

  // PRODUCTS & CROPS

  async getProducts(filters = {}) {

    productsStore = getStoredItem('agribridge_products', []);

    const res = await fetchWithFallback('/buyer/products', { method: 'GET' }, productsStore);

    let result = res.isMock ? productsStore : (Array.isArray(res.data) ? res.data : []);

    if (filters.category) {

      result = result.filter(p => p.category === filters.category);

    }

    if (filters.search) {

      const s = filters.search.toLowerCase();

      result = result.filter(p => (p.product_name && p.product_name.toLowerCase().includes(s)) || (p.location && p.location.toLowerCase().includes(s)));

    }

    return result.filter((product) => product.status !== "out_of_stock" && Number(product.available_qty ?? product.quantity ?? 1) > 0);
  },

  async getProductById(id) {
    productsStore = getStoredItem("agribridge_products", []);
    const local = productsStore.find(p => String(p.id) === String(id)) || null;
    const res = await fetchWithFallback(`/farmer/products/${encodeURIComponent(id)}`, { method: "GET" }, local);
    return res.isMock ? local : (res.data || null);
  },

  async getMyProducts() {

    productsStore = getStoredItem("agribridge_products", []);

    const user = getCurrentUser();

    const ownedLocally = productsStore.filter(product => belongsToUser(product, user, "farmer_id", ["farmer_email", "created_by"]));

    const res = await fetchWithFallback("/farmer/my-products", { method: "GET" }, ownedLocally);

    return res.isMock ? ownedLocally : (Array.isArray(res.data) ? res.data : []);

  },

  async createProduct(productData) {

    const { file, ...fields } = productData || {};

    const body = file ? buildFileFormData(productData) : JSON.stringify(fields);

    return fetchWithFallback("/farmer/products", { method: "POST", body }, null);

  },

  async updateProduct(id, productData) {

    const { file, ...fields } = productData || {};

    const body = file ? buildFileFormData(productData) : JSON.stringify(fields);

    return fetchWithFallback("/farmer/products/" + id, { method: "PUT", body }, null);

  },

  async deleteProduct(id) {

    return fetchWithFallback("/farmer/products/" + id, { method: "DELETE" }, null);

  },

  async getCart() {

    cartStore = getStoredItem('agribridge_cart', []);

    const user = getCurrentUser();

    const ownedCart = cartStore.filter(

      item =>

        belongsToUser(item, user, 'buyer_id', ['buyer_email']) ||

        belongsToUser(item, user, 'user_id', ['buyer_email'])

    );

    const res = await fetchWithFallback(

      '/buyer/cart',

      { method: 'GET' },

      ownedCart

    );

    if (res?.isMock || res?.success === false) {

      return ownedCart;

    }

    if (Array.isArray(res?.data)) {

      cartStore = res.data;

      setStoredItem('agribridge_cart', cartStore);

      return res.data;

    }

    return [];

  },

  async addToCart(product, quantity = 1) {

    const safeQuantity = Math.max(1, Number(quantity) || 1);

    const response = await fetchWithFallback(

      "/buyer/cart",

      {

        method: "POST",

        body: JSON.stringify({

          product_id: product.id,

          quantity: safeQuantity

        })

      },

      null

    );

    if (!response?.success) return response;

    /*

     * PostgreSQL generates cart.id using cart_id_seq.

     * Never create cart_id with Date.now().
     * Reload the server cart so the frontend receives the real integer ID.

     */

    const refreshed = await fetchWithFallback(

      '/buyer/cart',

      { method: 'GET' },

      null

    );

    if (

      !refreshed?.isMock &&

      refreshed?.success !== false &&

      Array.isArray(refreshed?.data)

    ) {

      cartStore = refreshed.data;

      setStoredItem('agribridge_cart', cartStore);

      return {

        success: true,

        data: response.data,

        cart: refreshed.data

      };

    }

    if (refreshed?.isMock && Array.isArray(refreshed.data)) {

      cartStore = refreshed.data;

      setStoredItem('agribridge_cart', cartStore);

    }

    return response;

  },

  async updateCartQuantity(cartId, quantity) {

    const safeQuantity = Math.max(1, Number(quantity) || 1);

    // Local fallback records must never be sent to PostgreSQL.

    if (isLocalId(cartId)) {

      cartStore = getStoredItem('agribridge_cart', []);

      const item = cartStore.find(

        c => String(c.cart_id ?? c.id) === String(cartId)

      );

      if (item) {

        item.quantity = safeQuantity;

        setStoredItem('agribridge_cart', cartStore);

      }

      return {

        success: true,

        data: { quantity: safeQuantity },

        isMock: true

      };

    }

    const response = await fetchWithFallback(

      `/buyer/cart/${encodeURIComponent(cartId)}`,

      {

        method: "PUT",

        body: JSON.stringify({ quantity: safeQuantity })

      },

      null

    );

    if (!response?.success) return response;

    cartStore = getStoredItem('agribridge_cart', []);

    const item = cartStore.find(

      c => String(c.cart_id ?? c.id) === String(cartId)

    );

    if (item) {

      item.quantity = Number(

        response.data?.quantity ?? safeQuantity

      );

    }

    setStoredItem('agribridge_cart', cartStore);

    return {

      success: true,

      data: response.data || { quantity: safeQuantity }

    };

  },

  async removeFromCart(cartId) {

    cartStore = getStoredItem('agribridge_cart', []);

    // Local fallback record: remove locally and do not call the database.

    if (isLocalId(cartId)) {

      cartStore = cartStore.filter(

        c => String(c.cart_id ?? c.id) !== String(cartId)

      );

      setStoredItem('agribridge_cart', cartStore);

      return true;

    }

    const response = await fetchWithFallback(

      `/buyer/cart/${encodeURIComponent(cartId)}`,

      { method: 'DELETE' },

      true

    );

    cartStore = cartStore.filter(

      c => String(c.cart_id ?? c.id) !== String(cartId)

    );

    setStoredItem('agribridge_cart', cartStore);

    return response?.success !== false;

  },

  async validateCartStock() {

    return fetchWithFallback('/buyer/cart/validate', { method: 'POST' }, { success: true });

  },

  // PAYMENTS & TRANSACTIONS

  async makeFarmerPayment({ leaseId, amount, paymentMethod }) {

    transactionsStore = getStoredItem('agribridge_transactions', []);

    leasesStore = getStoredItem('agribridge_leases', []);

    landsStore = getStoredItem('agribridge_lands', []);

    const user = getCurrentUser();

    const paymentResponse = await fetchWithFallback("/farmer/payment", { method: "POST", body: JSON.stringify({ lease_id: leaseId, amount, payment_method: paymentMethod }) }, null);

    if (!paymentResponse.success) return paymentResponse;

    const txId = paymentResponse.data?.transaction_id || makeLocalTransactionId();

    const settledAmount = Number(paymentResponse.data?.amount ?? amount);

    const lease = leasesStore.find(l => String(l.id) === String(leaseId));

    // Resolve the landowner for this lease, falling back to the linked land record if needed

    const land = lease ? landsStore.find(l => String(l.id) === String(lease.land_id)) : null;

    const ownerId = (lease && (lease.owner_id ?? lease.landowner_id)) ?? (land && (land.landowner_id ?? land.owner_id)) ?? null;

    const ownerEmail = (lease && (lease.owner_email ?? lease.landowner_email)) ?? (land && land.owner_email) ?? '';

    // Debit-side transaction (farmer)

    const newTx = {

      id: makeLocalId('transaction'),

      transaction_id: txId,

      user_id: user ? user.id : null,

      user_email: user ? user.email : '',

      type: "lease_payment",

      direction: "debit",

      amount: settledAmount,

      payment_method: paymentMethod,

      status: "successful",

      reference_id: `LEASE-${leaseId}`,

      description: `Lease payment for lease #${leaseId}`,

      created_at: new Date().toLocaleString()

    };

    transactionsStore.unshift(newTx);

    setStoredItem('agribridge_transactions', transactionsStore);

    if (lease) {

      lease.payment_status = 'paid';

      setStoredItem('agribridge_leases', leasesStore);

    }

    return { success: true, ...newTx };

  },

  async makeBuyerPayment({ items, totalAmount, shippingAddress, paymentMethod }) {

    ordersStore = getStoredItem('agribridge_orders', []);

    transactionsStore = getStoredItem('agribridge_transactions', []);

    productsStore = getStoredItem('agribridge_products', []);

    const user = getCurrentUser();

    const checkoutResponse = await fetchWithFallback("/buyer/orders", { method: "POST", body: JSON.stringify({ items, total_amount: totalAmount, shipping_address: shippingAddress, payment_method: paymentMethod }) }, null);

    if (!checkoutResponse.success) return checkoutResponse;

    const txId = checkoutResponse.data?.transaction_id || makeLocalTransactionId();

    const completedOrderId = checkoutResponse.data?.order_id || makeLocalId('order');

    const grandTotal = Number(checkoutResponse.data?.grand_total ?? (Number(totalAmount) + 150 + 50));

    const newOrder = {

      id: completedOrderId,

      buyer_id: user ? user.id : null,

      buyer_email: user ? user.email : '',

      total_amount: Number(totalAmount),

      delivery_fee: 150,

      platform_fee: 50,

      grand_total: grandTotal,

      shipping_address: shippingAddress,

      payment_method: paymentMethod,

      payment_status: "successful",

      order_status: "processing",

      items,

      created_at: new Date().toISOString().split('T')[0]

    };

    ordersStore.unshift(newOrder);

    setStoredItem('agribridge_orders', ordersStore);

    // Buyer's debit transaction

    const newTx = {

      id: makeLocalId('transaction'),

      transaction_id: txId,

      user_id: user ? user.id : null,

      user_email: user ? user.email : '',

      type: "order_payment",

      direction: "debit",

      amount: grandTotal,

      payment_method: paymentMethod,

      status: "successful",

      reference_id: `ORD-${newOrder.id}`,

      description: "Marketplace produce checkout payment",

      created_at: new Date().toLocaleString()

    };

    transactionsStore.unshift(newTx);

    // Per-item: decrement stock for the sold product and credit the owning farmer

    (items || []).forEach((item, idx) => {

      const product = productsStore.find(p => String(p.id) === String(item.product_id ?? item.id));

      const lineSubtotal = Number(item.price_per_unit) * Number(item.quantity);

      if (product) {

        const remaining = Number(product.available_qty ?? product.quantity ?? 0) - Number(item.quantity || 0);

        product.available_qty = Math.max(0, remaining);

        product.quantity = product.available_qty;

        product.status = product.available_qty === 0 ? "out_of_stock" : "available";

      }

      const farmerId = (product && (product.farmer_id ?? null)) ?? item.farmer_id ?? null;

      const farmerEmail = (product && (product.farmer_email ?? product.created_by)) ?? item.farmer_email ?? '';

      const creditTx = {

        id: makeLocalId(`payout_${idx + 1}`),

        transaction_id: `${txId}-CR${idx + 1}`,

        user_id: farmerId,

        user_email: farmerEmail,

        type: "payout",

        direction: "credit",

        amount: lineSubtotal,

        payment_method: paymentMethod,

        status: "successful",

        reference_id: `ORD-${newOrder.id}`,

        description: `Produce sale: ${item.product_name || 'item'} (Order #${newOrder.id})`,

        created_at: new Date().toLocaleString()

      };

      transactionsStore.unshift(creditTx);

    });

    setStoredItem('agribridge_products', productsStore);

    setStoredItem('agribridge_transactions', transactionsStore);

    cartStore = cartStore.filter(item => !belongsToUser(item, user, 'buyer_id', ['buyer_email']));

    setStoredItem('agribridge_cart', cartStore);

    return { success: true, order: newOrder, transaction: newTx };

  },

  async getTransactions() {

    transactionsStore = getStoredItem('agribridge_transactions', []);

    const user = getCurrentUser();

    const ownedTransactions = transactionsStore.filter(tx => belongsToUser(tx, user, 'user_id', ['user_email']));

    const endpoint = user?.role === 'buyer' ? '/buyer/transactions' : user?.role === 'admin' ? '/admin/transactions' : '/farmer/transactions';

    const res = await fetchWithFallback(endpoint, { method: 'GET' }, ownedTransactions);

    return Array.isArray(res.data) ? res.data : ownedTransactions;

  },

  async downloadReceipt(id) {
    const token = localStorage.getItem('agribridge_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${API_BASE_URL}/transactions/${encodeURIComponent(id)}/receipt`, {
      method: 'GET',
      headers
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Unable to download transaction receipt PDF.');
    }
    const blob = await res.blob();
    const filename = `AgriBridge_Receipt_${String(id).replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 15000);
    return true;
  },

  async getLandownerEarnings() {

    transactionsStore = getStoredItem('agribridge_transactions', []);

    const user = getCurrentUser();

    const ownedTransactions = transactionsStore.filter(

      tx =>

        belongsToUser(tx, user, 'user_id', ['user_email']) &&

        (

          tx.type === 'lease_payment' ||

          tx.type === 'payout'

        )

    );

    try {

      const res = await fetchWithFallback(

        '/landowner/earnings',

        { method: 'GET' },

        ownedTransactions

      );

      if (res?.isMock) {

        const leasePayments = ownedTransactions.filter(

          tx =>

            tx.type === 'lease_payment' &&

            tx.status === 'successful'

        );

        const payouts = ownedTransactions.filter(

          tx =>

            tx.type === 'payout' &&

            tx.status === 'successful'

        );

        return {

          success: true,

          data: {

            total_earnings: leasePayments.reduce(

              (sum, tx) => sum + Number(tx.amount || 0),

              0

            ),

            pending_payments: ownedTransactions

              .filter(

                tx =>

                  tx.type === 'lease_payment' &&

                  ['pending', 'processing'].includes(

                    String(tx.status || '').toLowerCase()

                  )

              )

              .reduce(

                (sum, tx) => sum + Number(tx.amount || 0),

                0

              ),

            completed_payouts: payouts.length,

            transactions: ownedTransactions

          }

        };

      }

      // Some older backend versions return the transaction rows but leave the
      // aggregate fields at zero. Recalculate from returned rows when possible.

      if (res?.success !== false && Array.isArray(res?.data?.transactions)) {

        const serverTransactions = res.data.transactions;

        const successfulLeasePayments = serverTransactions.filter(

          tx =>

            String(tx?.type || '').toLowerCase() === 'lease_payment' &&

            String(tx?.status || '').toLowerCase() === 'successful'

        );

        const pendingLeasePayments = serverTransactions.filter(

          tx =>

            String(tx?.type || '').toLowerCase() === 'lease_payment' &&

            ['pending', 'processing'].includes(

              String(tx?.status || '').toLowerCase()

            )

        );

        const successfulPayouts = serverTransactions.filter(

          tx =>

            String(tx?.type || '').toLowerCase() === 'payout' &&

            String(tx?.status || '').toLowerCase() === 'successful'

        );

        const calculatedTotal = successfulLeasePayments.reduce(

          (sum, tx) => sum + Number(tx?.amount || 0),

          0

        );

        const calculatedPending = pendingLeasePayments.reduce(

          (sum, tx) => sum + Number(tx?.amount || 0),

          0

        );

        res.data = {
          ...res.data,
          total_earnings:
            Number(res.data.total_earnings || 0) > 0
              ? Number(res.data.total_earnings)
              : calculatedTotal,
          pending_payments:
            Number(res.data.pending_payments ?? res.data.pending_earnings ?? 0) > 0
              ? Number(res.data.pending_payments ?? res.data.pending_earnings)
              : calculatedPending,
          pending_earnings:
            Number(res.data.pending_payments ?? res.data.pending_earnings ?? 0) > 0
              ? Number(res.data.pending_payments ?? res.data.pending_earnings)
              : calculatedPending,
          completed_payouts:
            Number(res.data.completed_payouts || 0) > 0
              ? Number(res.data.completed_payouts)
              : successfulPayouts.length
        };
      }

      if (res?.data) {
        res.total_earnings = res.data.total_earnings;
        res.pending_payments = res.data.pending_payments;
        res.pending_earnings = res.data.pending_earnings;
        res.completed_payouts = res.data.completed_payouts;
        res.transactions = res.data.transactions;
      }

      return res;

    } catch (error) {

      console.error(

        'Failed to load landowner earnings:',

        error

      );

      return {

        success: false,

        data: {

          total_earnings: 0,

          pending_payments: 0,

          completed_payouts: 0,

          transactions: []

        },

        message:

          error.message || 'Unable to load earnings.'

      };

    }

  },

  async getOrders() {

    ordersStore = getStoredItem('agribridge_orders', []);

    const user = getCurrentUser();

    const ownedOrders = ordersStore.filter(order => belongsToUser(order, user, 'buyer_id', ['buyer_email']));

    const res = await fetchWithFallback('/buyer/orders', { method: 'GET' }, ownedOrders);

    return Array.isArray(res.data) ? res.data : ownedOrders

  },

  // DYNAMIC DASHBOARD STATS CALCULATED FROM REAL USER ACTIONS

  async getDashboardStats(role) {

    landsStore = getStoredItem('agribridge_lands', []);

    productsStore = getStoredItem('agribridge_products', []);

    applicationsStore = getStoredItem('agribridge_applications', []);

    leasesStore = getStoredItem('agribridge_leases', []);

    transactionsStore = getStoredItem('agribridge_transactions', []);

    ordersStore = getStoredItem('agribridge_orders', []);

    usersStore = getStoredItem('agribridge_users', []);

    const user = getCurrentUser();

    const myLands = landsStore.filter(land => belongsToUser(land, user, 'landowner_id', ['owner_email', 'created_by']) || belongsToUser(land, user, 'owner_id', ['owner_email', 'created_by']));

    const myProducts = productsStore.filter(product => belongsToUser(product, user, 'farmer_id', ['farmer_email', 'created_by']));

    const myApplications = applicationsStore.filter(app => belongsToUser(app, user, 'farmer_id', ['farmer_email']));

    const myLeases = leasesStore.filter(lease => role === 'landowner' ? belongsToUser(lease, user, 'owner_id', ['owner_email']) : belongsToUser(lease, user, 'farmer_id', ['farmer_email']));

    const myTransactions = transactionsStore.filter(tx => belongsToUser(tx, user, 'user_id', ['user_email']));

    const myOrders = ordersStore.filter(order => belongsToUser(order, user, 'buyer_id', ['buyer_email']));

    let calculated = {};

    if (role === 'farmer') {

      const totalSpending = myTransactions

        .filter(t => t.type === 'lease_payment')

        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      const totalEarnings = myTransactions

        .filter(t => t.type === 'payout')

        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      calculated = {

        total_leases: myLeases.length,

        total_crops: myProducts.length,

        pending_applications: myApplications.filter(a => a.status === 'pending').length,

        approved_applications: myApplications.filter(a => a.status === 'approved').length,

        total_spending: totalSpending,

        total_earnings: totalEarnings,

        recent_transactions: myTransactions

      };

    } else if (role === 'landowner') {

      const totalEarnings = myTransactions

        .filter(t => t.type === 'lease_payment')

        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      calculated = {

        total_lands: myLands.length,

        active_leases: myLeases.length,

        pending_applications: applicationsStore.filter(a => a.status === 'pending' && myLands.some(land => String(land.id) === String(a.land_id))).length,

        total_earnings: totalEarnings,

        recent_applications: applicationsStore.filter(app => myLands.some(land => String(land.id) === String(app.land_id)))

      };

    } else if (role === 'buyer') {

      const totalSpending = myOrders.reduce((sum, o) => sum + Number(o.grand_total || 0), 0);

      calculated = {

        total_orders: myOrders.length,

        pending_orders: myOrders.filter(o => o.order_status === 'processing').length,

        completed_orders: myOrders.filter(o => o.order_status === 'delivered').length,

        total_spending: totalSpending,

        recent_orders: myOrders

      };

    } else if (role === 'admin') {

      const totalRevenue = transactionsStore.reduce((sum, t) => sum + Number(t.amount || 0), 0);

      calculated = {

        total_users: usersStore.length,

        total_farmers: usersStore.filter(u => u.role === 'farmer').length,

        total_buyers: usersStore.filter(u => u.role === 'buyer').length,

        total_landowners: usersStore.filter(u => u.role === 'landowner').length,

        total_lands: landsStore.length,

        total_products: productsStore.length,

        pending_land_approvals: landsStore.filter(l => l.status === 'pending').length,

        total_orders: ordersStore.length,

        total_transactions: transactionsStore.length,

        total_revenue: totalRevenue

      };

    }

    const res = await fetchWithFallback(`/${role}/dashboard`, { method: 'GET' }, calculated);

    return res.data || calculated;

  },

  // USERS

  async getUsers() {

    usersStore = getStoredItem('agribridge_users', []);

    const res = await fetchWithFallback('/admin/users', { method: 'GET' }, usersStore);

    return res.data || usersStore;

  },

  // SMART IRRIGATION MODULE APIs

  async getIrrigationFields(farmerId = 1) {

    const res = await fetchWithFallback(`/irrigation/fields?farmer_id=${farmerId}`, { method: 'GET' }, [

      { id: 1, field_name: 'Green Acres Field A', area_acres: 2.5, crop_type: 'Tomato', growth_stage: 'Vegetative', soil_type: 'Loamy', irrigation_method: 'Drip' }

    ]);

    return res.data || [];

  },

  async generateIrrigationRecommendation(data) {

    const res = await fetchWithFallback('/irrigation/recommend', {

      method: 'POST',

      body: JSON.stringify(data)

    }, {

      is_required: true,

      priority: 'High',

      water_litres: 2500,

      duration_minutes: 40,

      best_method: 'Drip',

      best_time_window: '06:00 AM - 08:00 AM',

      reason_text: 'Soil moisture (28%) is below optimal level (35%) for Tomato at Vegetative stage.',

      ai_insights: 'Applying 2,500 Litres during 06:00 AM - 08:00 AM reduces evaporative loss by up to 28%.',

      crop_water_req: 4.80

    });

    return res.data || res;

  },

  async getLatestIrrigationRecommendation(farmerId = 1) {

    const res = await fetchWithFallback(`/irrigation/latest?farmer_id=${farmerId}`, { method: 'GET' }, {

      is_required: true,

      priority: 'High',

      water_litres: 2500,

      duration_minutes: 40,

      best_method: 'Drip',

      best_time_window: '06:00 AM - 08:00 AM',

      reason_text: 'Soil moisture is below optimal level for selected crop.',

      ai_insights: 'Recommendation generated by AgriBridge LLM Agronomic Engine.',

      crop_water_req: 4.5

    });

    return res.data || res;

  },

  async getIrrigationHistory(farmerId = 1) {

    const res = await fetchWithFallback(`/irrigation/history?farmer_id=${farmerId}`, { method: 'GET' }, {

      records: [

        { id: 1, water_used_litres: 2500, duration_minutes: 40, method_used: 'Drip', status: 'completed', created_at: new Date().toISOString() }

      ],

      recommendations: []

    });

    return res.data || res;

  },

  async recordIrrigation(data) {

    const res = await fetchWithFallback('/irrigation/record', {

      method: 'POST',

      body: JSON.stringify(data)

    }, { success: true, message: 'Irrigation recorded successfully' });

    return res.data || res;

  },

  async scheduleIrrigation(data) {

    const res = await fetchWithFallback('/irrigation/schedule', {

      method: 'POST',

      body: JSON.stringify(data)

    }, { success: true, message: 'Irrigation scheduled successfully' });

    return res.data || res;

  },

  async getIrrigationStats(farmerId = 1) {

    const res = await fetchWithFallback(`/irrigation/stats?farmer_id=${farmerId}`, { method: 'GET' }, {

      total_consumed_litres: 18500,

      total_saved_litres: 4625,

      total_events: 7,

      efficiency_score: 92.5

    });

    return res.data || res;

  },

  async getIrrigationWeather(lat = 15.5057, lon = 80.0499) {

    const res = await fetchWithFallback(`/irrigation/weather?lat=${lat}&lon=${lon}`, { method: 'GET' }, {

      temperature: 32.5,

      humidity: 46.0,

      rainfall_mm: 0.0,

      rain_probability: 12.0,

      wind_speed: 11.5,

      solar_radiation: 21.0,

      source: 'AgriBridge Automated Weather Station'

    });

    return res.data || res;

  },

  // AGRI-AI ASSISTANT CHATBOT APIs

  async sendAIChatMessage(data) {

    const res = await fetchWithFallback('/ai/chat', {

      method: 'POST',

      body: JSON.stringify(data)

    }, {

      success: true,

      answer: '🌾 **AgriAI Assistant Guidance**:\n\nFor Paddy crop, split Nitrogen fertilizer application during basal (50%), tillering (25%), and panicle initiation (25%) stages. Apply DAP 50 kg/acre and MOP 25 kg/acre during final puddling.',

      sources: [

        { title: 'Paddy Fertilizer & NPK Application Schedule', source: 'ICAR National Rice Research Institute & PJTSAU Agronomy Guide', category: 'FERTILIZER' }

      ],

      usedMarketData: false

    });

    return res;

  },

  async getAIChatHistory(conversationId = null) {

    const queryStr = conversationId ? `?conversationId=${conversationId}` : '';

    const res = await fetchWithFallback(`/ai/history${queryStr}`, { method: 'GET' }, {

      conversations: [],

      messages: []

    });

    return res;

  },

  async clearAIChatHistory(conversationId = null) {

    const res = await fetchWithFallback('/ai/clear', {

      method: 'DELETE',

      body: JSON.stringify({ conversationId })

    }, { success: true });

    return res;

  },

  async getAISuggestedQuestions(language = 'en') {

    const res = await fetchWithFallback(`/ai/suggested-questions?language=${language}`, { method: 'GET' }, {

      questions: language === 'te' ? [

        '🌾 నా నేలకు ఏ పంట బాగా సరిపోతుంది?',

        '💧 నేను ఈ రోజు వరి చేనుకి నీరు పారించవచ్చా?',

        '🌱 టమోటా పంటలో ఎరువుల మోతాదు ఎంత?',

        '🐛 నా మిరప ఆకులు ముడుచుకుపోతున్నాయి, ఏ మందు చల్లాలి?'

      ] : [

        '🌾 What is the best crop for my loamy soil?',

        '💧 Should I irrigate my paddy field today?',

        '🌱 What fertilizer schedule is best for Tomato?',

        '🐛 My chilli leaves are curling upward. What pest spray to use?'

      ]

    });

    return res.questions || [];

  },

};

export default api;