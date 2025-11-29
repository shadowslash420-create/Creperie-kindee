/* ==================== CREPERIE KINDER ADMIN DASHBOARD ==================== */
/* Rebuilt from scratch with ImgBB integration and menu_data.json support */

import { getAuthInstance } from './firebase-config.js';
import {signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import dbService from './db-service.js';

// ==================== STATE MANAGEMENT ====================
const state = {
  currentSection: 'dashboard',
  currentUser: null,
  currentUserRole: null,
  isStaffUser: false,
  menuItems: [],
  orders: [],
  categories: [],
  ingredients: [],
  customers: [],
  coupons: [],
  reviews: [],
  staff: [],
  settings: {},
  selectedImage: null,
  uploadedImageUrl: null,
  editingItem: null,
  editingIngredient: null,
  editingCoupon: null,
  menuFilter: 'all',
  orderFilter: 'all'
};

// ==================== STAFF PERMISSIONS FROM FIREBASE ====================

async function checkUserStaffStatus() {
  try {
    const auth = await getAuthInstance();
    if (!auth || !auth.currentUser) {
      state.isStaffUser = false;
      state.currentUserRole = null;
      return;
    }
    
    const userEmail = auth.currentUser.email;
    if (userEmail === 'oussamaanis2005@gmail.com') {
      state.isStaffUser = true;
      state.currentUserRole = 'Admin';
      console.log('👑 Admin user detected:', userEmail);
      return;
    }
    
    await dbService.init();
    const allStaff = await dbService.getAllStaff();
    const staffMember = allStaff.find(s => s.email?.toLowerCase() === userEmail?.toLowerCase());
    
    if (staffMember) {
      state.isStaffUser = true;
      state.currentUserRole = staffMember.role;
      console.log('👨‍💼 Staff user detected:', userEmail, 'Role:', staffMember.role);
    } else {
      state.isStaffUser = false;
      state.currentUserRole = null;
      console.log('❌ User is not staff:', userEmail);
    }
  } catch (error) {
    console.error('Error checking staff status:', error);
    state.isStaffUser = false;
    state.currentUserRole = null;
  }
}

// ==================== DATA LOADING ====================

async function loadMenuData() {
  try {
    console.log('📋 Admin: Loading menu items from Firestore...');
    await dbService.init();
    const data = await dbService.getAllMenuItems();
    console.log('✅ Admin: Menu items loaded:', data.length);
    state.menuItems = data;
    return data;
  } catch (error) {
    console.error('❌ Admin: Failed to load menu data from Firestore:', error);
    state.menuItems = [];
    return [];
  }
}

async function saveMenuData(menuData) {
  console.log('⚠️ saveMenuData is deprecated - items are saved individually through dbService');
  // This function is no longer needed as items are saved individually
  return { success: true };
}

async function loadOrdersData() {
  try {
    console.log('📦 Admin: Loading orders from Firestore...');
    await dbService.init();
    const data = await dbService.getAllOrders();
    console.log('✅ Admin: Orders loaded:', data.length);
    state.orders = data || [];
    return data;
  } catch (error) {
    console.error('❌ Admin: Failed to load orders from Firestore:', error);
    state.orders = [];
    return [];
  }
}

async function saveOrdersData(ordersData) {
  console.log('⚠️ saveOrdersData is deprecated - orders are updated individually through dbService');
  // This function is no longer needed as orders are updated individually
  return { success: true };
}

async function loadIngredientsData() {
  try {
    console.log('📋 Admin: Loading ingredients from Firestore...');
    const data = await dbService.getAllIngredients();
    console.log('✅ Admin: Ingredients loaded:', data.length);
    state.ingredients = data || [];
    return data;
  } catch (error) {
    console.error('❌ Admin: Failed to load ingredients:', error);
    state.ingredients = [];
    return [];
  }
}

async function loadCouponsData() {
  try {
    console.log('🎫 Admin: Loading coupons from Firestore...');
    const data = await dbService.getAllCoupons();
    console.log('✅ Admin: Coupons loaded:', data.length);
    state.coupons = data || [];
    return data;
  } catch (error) {
    console.error('❌ Admin: Failed to load coupons:', error);
    state.coupons = [];
    return [];
  }
}

async function loadReviewsData() {
  try {
    console.log('⭐ Admin: Loading reviews from Firestore...');
    const data = await dbService.getAllReviews();
    console.log('✅ Admin: Reviews loaded:', data.length);
    state.reviews = data || [];
    return data;
  } catch (error) {
    console.error('❌ Admin: Failed to load reviews:', error);
    state.reviews = [];
    return [];
  }
}

async function loadStaffData() {
  try {
    console.log('👨‍💼 Admin: Loading staff from Firestore...');
    const data = await dbService.getAllStaff();
    console.log('✅ Admin: Staff loaded:', data.length);
    state.staff = data || [];
    return data;
  } catch (error) {
    console.error('❌ Admin: Failed to load staff:', error);
    state.staff = [];
    return [];
  }
}

async function loadSettingsData() {
  try {
    console.log('⚙️ Admin: Loading settings from Firestore...');
    const data = await dbService.getSettings();
    console.log('✅ Admin: Settings loaded');
    state.settings = data;
    return data;
  } catch (error) {
    console.error('❌ Admin: Failed to load settings:', error);
    state.settings = {};
    return {};
  }
}

// ==================== AUTHENTICATION ====================

async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById('adm-user').value.trim();
  const password = document.getElementById('adm-pass').value;
  const loginBtn = document.getElementById('admin-login-btn');
  const errorDiv = document.getElementById('login-error');

  if (!email || !password) {
    errorDiv.textContent = 'Please enter both email and password';
    errorDiv.style.display = 'block';
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = 'Logging in...';
  errorDiv.style.display = 'none';

  try {
    const auth = await getAuthInstance();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    state.currentUser = userCredential.user;

    // Hide login, show dashboard
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('admin-section').classList.remove('hidden');

    // Initialize dashboard
    await initializeDashboard();
    
    // Restore the section the user was on before, or show dashboard
    const lastSection = sessionStorage.getItem('admin_current_section') || 'dashboard';
    showSection(lastSection);
  } catch (error) {
    console.error('Login failed:', error);
    errorDiv.textContent = getLoginErrorMessage(error.code);
    errorDiv.style.display = 'block';
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Login';
  }
}

function getLoginErrorMessage(code) {
  const errors = {
    'auth/invalid-email': 'Invalid email address',
    'auth/user-disabled': 'Account disabled',
    'auth/user-not-found': 'No account found',
    'auth/wrong-password': 'Incorrect password',
    'auth/invalid-credential': 'Invalid email or password'
  };
  return errors[code] || 'Login failed. Please try again.';
}

async function handleLogout() {
  try {
    const auth = await getAuthInstance();
    await signOut(auth);
    state.currentUser = null;
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Logout failed:', error);
    window.location.href = 'index.html';
  }
}

// ==================== NAVIGATION ====================

function showSection(section, event) {
  if (event) {
    event.preventDefault();
  }

  state.currentSection = section;
  sessionStorage.setItem('admin_current_section', section);

  // Update active nav item
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  if (event) {
    event.currentTarget.classList.add('active');
  }

  // Show correct section
  document.querySelectorAll('.content-section').forEach(sec => {
    sec.classList.remove('active');
  });
  document.getElementById('section-' + section)?.classList.add('active');

  // Close sidebar on mobile after navigation
  if (window.innerWidth <= 768) {
    const sidebar = document.getElementById('dashboard-sidebar');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (sidebar) sidebar.classList.remove('active');
    if (mobileMenuBtn) mobileMenuBtn.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
  }

  // Update page title
  const titles = {
    dashboard: 'Dashboard',
    orders: 'Orders Management',
    menu: 'Menu Management',
    inventory: 'Ingredients & Inventory',
    customers: 'Customer Management',
    reviews: 'Customer Reviews',
    messages: 'Contact Messages',
    analytics: 'Reports & Analytics',
    settings: 'Settings',
    staff: 'Staff & Permissions'
  };
  document.getElementById('page-title').textContent = titles[section] || 'Dashboard';

  // Load section data
  if (section === 'dashboard') loadDashboard();
  else if (section === 'orders') loadOrders();
  else if (section === 'menu') loadMenu();
  else if (section === 'customers') loadCustomers();
  else if (section === 'reviews') loadReviews();
  else if (section === 'messages') loadMessages();
  else if (section === 'analytics') loadAnalytics();
  else if (section === 'settings') loadSettings();
  else if (section === 'staff') loadStaff();
}

function toggleSidebar() {
  const sidebar = document.getElementById('dashboard-sidebar');
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const overlay = document.querySelector('.sidebar-overlay');
  
  sidebar.classList.toggle('active');
  
  // Toggle active state on mobile menu button
  if (mobileMenuBtn) {
    mobileMenuBtn.classList.toggle('active');
  }
  
  // Show/hide overlay
  if (overlay) {
    overlay.classList.toggle('active');
  } else if (sidebar.classList.contains('active')) {
    // Create overlay if it doesn't exist
    const newOverlay = document.createElement('div');
    newOverlay.className = 'sidebar-overlay active';
    newOverlay.onclick = () => toggleSidebar();
    document.body.appendChild(newOverlay);
  }
}

// ==================== DASHBOARD SECTION ====================

async function loadDashboard() {
  try {
    await Promise.all([loadMenuData(), loadOrdersData()]);
    updateDashboardStats();
    renderBestSellers();
  } catch (error) {
    console.error('Failed to load dashboard:', error);
  }
}

function updateDashboardStats() {
  const today = new Date().toDateString();
  const todayOrders = state.orders.filter(o => {
    if (!o.createdAt) return false;
    const orderDate = new Date(o.createdAt).toDateString();
    return orderDate === today;
  });

  const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  const pending = state.orders.filter(o => o.status === 'pending' || o.status === 'unconfirmed').length;
  // Count both delivered orders today and all delivered orders as confirmed
  const completed = state.orders.filter(o => o.status === 'delivered').length;

  document.getElementById('stat-revenue').textContent = todayRevenue.toFixed(2) + ' DZD';
  document.getElementById('stat-total-orders').textContent = state.orders.length;
  document.getElementById('stat-pending').textContent = pending;
  document.getElementById('stat-completed').textContent = completed;
}

function renderBestSellers() {
  const container = document.getElementById('best-sellers-list');
  const topItems = state.menuItems.slice(0, 5);

  if (topItems.length === 0) {
    container.innerHTML = '<p style="padding: 20px; text-align: center; color: #666;">No menu items yet</p>';
    return;
  }

  const html = topItems.map((item, index) => `
    <div style="display: flex; align-items: center; padding: 12px; border-bottom: 1px solid #e2e8f0;">
      <span style="font-size: 20px; font-weight: bold; color: #FF6B35; margin-right: 12px;">${index + 1}</span>
      <img src="${item.img || 'images/placeholder.svg'}" alt="${item.name}" 
        style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; margin-right: 12px;">
      <div style="flex: 1;">
        <p style="font-weight: 600; margin: 0 0 4px 0;">${item.name}</p>
        <p style="color: #666; font-size: 13px; margin: 0;">${item.price} DZD</p>
      </div>
    </div>
  `).join('');
  container.innerHTML = html;
}

function getStatusColor(status) {
  const colors = {
    'unconfirmed': '#FFE0E0',
    'pending': '#FFF3CD',
    'confirmed': '#D4EDDA'
  };
  return colors[status] || '#E2E8F0';
}

// ==================== STYLED MODAL FUNCTIONS ====================

function showStyledAlert(title, message) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 10001;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;
  
  const contentDiv = document.createElement('div');
  contentDiv.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 24px;
    max-width: 500px;
    width: 100%;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    text-align: center;
    max-height: 80vh;
    overflow-y: auto;
  `;
  
  const titleEl = document.createElement('h2');
  titleEl.style.cssText = 'margin: 0 0 12px 0; color: #2d3748; font-size: 20px;';
  titleEl.textContent = '✅ ' + title;
  
  const contentEl = document.createElement('div');
  contentEl.style.cssText = 'margin: 0; color: #666; line-height: 1.5; text-align: left;';
  contentEl.innerHTML = message;
  
  const btn = document.createElement('button');
  btn.textContent = 'OK';
  btn.style.cssText = `
    margin-top: 20px;
    padding: 10px 24px;
    background: linear-gradient(135deg, #E30613 0%, #B30510 100%);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
  `;
  btn.onclick = () => modal.remove();
  
  contentDiv.appendChild(titleEl);
  contentDiv.appendChild(contentEl);
  contentDiv.appendChild(btn);
  modal.appendChild(contentDiv);
  
  document.body.appendChild(modal);
  setTimeout(() => {
    if (modal.parentElement) modal.remove();
  }, 5000);
}

function showStyledConfirm(title, message, onConfirm) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 10001;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;
  
  modal.innerHTML = `
    <div style="
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      width: 100%;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      text-align: center;
    ">
      <h2 style="margin: 0 0 12px 0; color: #2d3748; font-size: 20px;">⚠️ ${title}</h2>
      <p style="margin: 0 0 24px 0; color: #666; line-height: 1.5;">${message}</p>
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button onclick="this.closest('div').parentElement.remove()" style="
          padding: 10px 24px;
          background: #cbd5e0;
          color: #2d3748;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
        ">Cancel</button>
        <button onclick="(${onConfirm.toString()})(); this.closest('div').parentElement.remove();" style="
          padding: 10px 24px;
          background: #e53e3e;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
        ">Delete</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

// ==================== ORDERS SECTION ====================

async function loadOrders() {
  try {
    await loadOrdersData();
    renderOrdersTable();
  } catch (error) {
    console.error('Failed to load orders:', error);
  }
}

function filterOrdersByStatus(status, event) {
  if (event) {
    document.querySelectorAll('.filter-tab').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
  }
  state.orderFilter = status;
  renderOrdersTable();
}

function filterOrders() {
  renderOrdersTable();
}

function renderOrdersTable() {
  const container = document.getElementById('orders-table');
  const searchTerm = document.getElementById('order-search')?.value.toLowerCase() || '';

  let filtered = state.orders;

  // Filter by status
  if (state.orderFilter !== 'all') {
    filtered = filtered.filter(o => o.status === state.orderFilter);
  }

  // Filter by search
  if (searchTerm) {
    filtered = filtered.filter(o => 
      (o.customerName || '').toLowerCase().includes(searchTerm) ||
      (o.phone || '').includes(searchTerm) ||
      (o.id || '').toString().includes(searchTerm) ||
      (o.email || '').toLowerCase().includes(searchTerm)
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = '<p style="padding: 40px; text-align: center; color: #666;">No orders found</p>';
    return;
  }

  // Sort by date descending (newest first)
  filtered.sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
    return dateB - dateA;
  });

  const html = `
    <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
      <thead>
        <tr style="background: #f7fafc; border-bottom: 2px solid #e2e8f0;">
          <th style="padding: 12px; text-align: left; color: #2d3748; font-weight: 600; font-size: 13px;">Order ID</th>
          <th style="padding: 12px; text-align: left; color: #2d3748; font-weight: 600; font-size: 13px;">Customer</th>
          <th style="padding: 12px; text-align: left; color: #2d3748; font-weight: 600; font-size: 13px;">Email</th>
          <th style="padding: 12px; text-align: left; color: #2d3748; font-weight: 600; font-size: 13px;">Phone</th>
          <th style="padding: 12px; text-align: center; color: #2d3748; font-weight: 600; font-size: 13px;">Items</th>
          <th style="padding: 12px; text-align: right; color: #2d3748; font-weight: 600; font-size: 13px;">Total</th>
          <th style="padding: 12px; text-align: center; color: #2d3748; font-weight: 600; font-size: 13px;">Status</th>
          <th style="padding: 12px; text-align: center; color: #2d3748; font-weight: 600; font-size: 13px;">Date</th>
          <th style="padding: 12px; text-align: center; color: #2d3748; font-weight: 600; font-size: 13px;">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${filtered.map(order => {
          const date = order.createdAt ? new Date(order.createdAt.toDate ? order.createdAt.toDate() : order.createdAt).toLocaleString() : 'N/A';
          const itemCount = (order.items || []).length;
          return `
            <tr style="border-bottom: 1px solid #e2e8f0; transition: background 0.2s;" onmouseover="this.style.background='#f7fafc'" onmouseout="this.style.background='white'">
              <td style="padding: 12px; color: #FF6B35; font-weight: 600;">#${order.id || 'N/A'}</td>
              <td style="padding: 12px; color: #2d3748; font-weight: 500;">${order.name || order.customerName || 'Anonymous'}</td>
              <td style="padding: 12px; color: #666; font-size: 13px;">${order.email || 'N/A'}</td>
              <td style="padding: 12px; color: #666;">📞 ${order.phone || order.customerPhone || 'N/A'}</td>
              <td style="padding: 12px; text-align: center; color: #FF6B35; font-weight: 600;">${itemCount}</td>
              <td style="padding: 12px; text-align: right; color: #2d3748; font-weight: 600;">${(order.total || 0).toFixed(2)} DZD</td>
              <td style="padding: 12px; text-align: center;">
                <select onchange="updateOrderStatus('${order.id}', this.value)" style="padding: 6px 8px; border: 1px solid #cbd5e0; border-radius: 4px; font-size: 12px; font-weight: 600; background: ${getStatusColor(order.status)};">
                  <option value="unconfirmed" ${order.status === 'unconfirmed' ? 'selected' : ''}>🔴 Unconfirmed</option>
                  <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>⏳ Pending</option>
                  <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>✅ Confirmed</option>
                </select>
              </td>
              <td style="padding: 12px; text-align: center; color: #666; font-size: 12px;">${date}</td>
              <td style="padding: 12px; text-align: center;">
                <button onclick="viewOrderDetails('${order.id}')" style="padding: 8px 16px; background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; margin-right: 8px; transition: transform 0.2s;">📋 Details</button>
                <button onclick="deleteOrder('${order.id}')" style="padding: 8px 16px; background: #e53e3e; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; transition: transform 0.2s;">🗑️ Delete</button>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
  container.innerHTML = html;
}

function viewOrderDetails(orderId) {
  console.log('👁️ Viewing order details:', orderId);
  const order = state.orders.find(o => o.id === orderId);
  if (!order) {
    console.error('Order not found:', orderId);
    showStyledAlert('Error', 'Order not found');
    return;
  }
  
  console.log('Order found:', order);
  const date = order.createdAt ? new Date(order.createdAt.toDate ? order.createdAt.toDate() : order.createdAt).toLocaleString() : 'N/A';
  const items = order.items || [];
  
  // Create rich modal
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 10001;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;
  
  const content = document.createElement('div');
  content.style.cssText = `
    background: white;
    border-radius: 16px;
    padding: 32px;
    max-width: 700px;
    width: 100%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    max-height: 90vh;
    overflow-y: auto;
  `;
  
  content.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 24px;">
      <h2 style="margin: 0; color: #E30613; font-size: 24px;">Order #${orderId}</h2>
      <button onclick="this.closest('[style*=fixed]').remove()" style="background: none; border: none; font-size: 28px; cursor: pointer; color: #999;">×</button>
    </div>
    
    <!-- Status Badge -->
    <div style="display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap;">
      <span style="padding: 8px 16px; border-radius: 20px; font-weight: 600; background: ${getStatusColor(order.status)}; color: #333;">
        ${order.status.toUpperCase()}
      </span>
      <span style="padding: 8px 16px; border-radius: 20px; font-size: 13px; background: #f0f0f0; color: #666;">
        📅 ${date}
      </span>
    </div>
    
    <!-- Customer Info -->
    <div style="background: #f9f9f9; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 16px 0; color: #2d3748; font-size: 16px;">👤 Customer Details</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div>
          <p style="margin: 0; color: #999; font-size: 12px; font-weight: 600;">NAME</p>
          <p style="margin: 8px 0 0 0; color: #2d3748; font-weight: 600;">${order.customerName || order.name || 'N/A'}</p>
        </div>
        <div>
          <p style="margin: 0; color: #999; font-size: 12px; font-weight: 600;">EMAIL</p>
          <p style="margin: 8px 0 0 0; color: #2d3748; font-weight: 600;">${order.email || 'N/A'}</p>
        </div>
        <div>
          <p style="margin: 0; color: #999; font-size: 12px; font-weight: 600;">PHONE</p>
          <p style="margin: 8px 0 0 0; color: #2d3748; font-weight: 600;">📞 ${order.phone || order.customerPhone || 'N/A'}</p>
        </div>
        <div>
          <p style="margin: 0; color: #999; font-size: 12px; font-weight: 600;">ADDRESS</p>
          <p style="margin: 8px 0 0 0; color: #2d3748; font-weight: 600;">📍 ${order.address || 'N/A'}</p>
        </div>
      </div>
    </div>

    ${order.location && order.location.lat && order.location.lng ? `
    <div style="margin-bottom: 24px;">
      <h3 style="margin: 0 0 12px 0; color: #2d3748; font-size: 16px;">📍 Delivery Location</h3>
      <div id="admin-order-location-map" style="width: 100%; height: 250px; border-radius: 8px; border: 2px solid #cbd5e0; background: #f7fafc;"></div>
      <p style="font-size: 12px; color: #666; margin-top: 8px; text-align: center;">
        📍 Latitude: <strong>${order.location.lat.toFixed(6)}</strong> | Longitude: <strong>${order.location.lng.toFixed(6)}</strong>
      </p>
    </div>
    ` : ''}
    
    <!-- Items -->
    <div style="margin-bottom: 24px;">
      <h3 style="margin: 0 0 12px 0; color: #2d3748; font-size: 16px;">🛒 Order Items</h3>
      ${items.length > 0 ? `
        <table style="width: 100%; border-collapse: collapse;">
          <tbody>
            ${items.map(item => `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px; color: #2d3748; font-weight: 600;">${item.name || 'Unknown'}</td>
                <td style="padding: 12px; text-align: center; color: #666;">×${item.quantity || item.qty || 1}</td>
                <td style="padding: 12px; text-align: right; color: #2d3748; font-weight: 600;">${(item.price || 0).toFixed(2)} DZD</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '<p style="color: #999;">No items in this order</p>'}
    </div>
    
    <!-- Summary -->
    <div style="background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%); padding: 20px; border-radius: 12px; color: white; margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span>Subtotal:</span>
        <span style="font-weight: 600;">${(order.subtotal || 0).toFixed(2)} DZD</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
        <span>Delivery:</span>
        <span style="font-weight: 600;">${(order.deliveryFee || 0).toFixed(2)} DZD</span>
      </div>
      <div style="border-top: 2px solid rgba(255,255,255,0.3); padding-top: 12px; display: flex; justify-content: space-between; font-size: 18px;">
        <span style="font-weight: bold;">Total:</span>
        <span style="font-weight: bold;">${(order.total || 0).toFixed(2)} DZD</span>
      </div>
    </div>
    
    <!-- Actions -->
    <div style="display: flex; gap: 12px; justify-content: flex-end;">
      <button onclick="this.closest('[style*=fixed]').remove()" style="padding: 10px 24px; background: #cbd5e0; color: #2d3748; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Close</button>
      <button style="padding: 10px 24px; background: #e53e3e; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;" id="delete-order-btn-${orderId}">🗑️ Delete</button>
    </div>
  `;
  
  modal.appendChild(content);
  document.body.appendChild(modal);

  // Attach delete button handler
  const deleteBtn = document.getElementById(`delete-order-btn-${orderId}`);
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async function(e) {
      e.preventDefault();
      try {
        await dbService.deleteOrder(orderId);
        modal.remove();
        await loadOrdersData();
        renderOrdersTable();
        loadDashboard();
      } catch (error) {
        alert('Error: ' + error.message);
      }
    });
  }

  // Initialize map if location exists
  if (order.location && order.location.lat && order.location.lng && window.L) {
    setTimeout(() => {
      const mapDiv = document.getElementById('admin-order-location-map');
      if (mapDiv && !mapDiv._leafletMap) {
        const map = L.map(mapDiv, {
          center: [order.location.lat, order.location.lng],
          zoom: 16,
          zoomControl: true
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap',
          maxZoom: 19
        }).addTo(map);

        const redIcon = L.divIcon({
          className: 'custom-marker',
          html: '<div style="background:#E30613;width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        L.marker([order.location.lat, order.location.lng], { icon: redIcon }).addTo(map);
        mapDiv._leafletMap = map;
        map.invalidateSize();
      }
    }, 200);
  }
}

function renderOrderCard(order) {
  const orderId = order.id || 'N/A';
  const items = order.items || [];
  const date = order.createdAt ? new Date(order.createdAt.toDate ? order.createdAt.toDate() : order.createdAt).toLocaleString() : 'N/A';

  return `
    <div class="order-card" style="border-bottom: 2px solid #e2e8f0; padding: 20px; transition: background 0.2s;" 
         onmouseover="this.style.background='#f7fafc'" onmouseout="this.style.background='white'">

      <!-- Order Header -->
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px; flex-wrap: wrap; gap: 16px;">
        <div style="flex: 1; min-width: 200px;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
            <h3 style="margin: 0; color: #FF6B35; font-size: 18px;">Order #${orderId}</h3>
            <span style="padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; background: ${getStatusColor(order.status)};">
              ${order.status || 'pending'}
            </span>
          </div>
          <p style="margin: 4px 0; color: #666; font-size: 13px;">📅 ${date}</p>
        </div>

        <div style="display: flex; gap: 8px; align-items: center;">
          <select onchange="updateOrderStatus('${orderId}', this.value)" 
            style="padding: 8px 12px; border: 2px solid #cbd5e0; border-radius: 6px; background: white; font-weight: 600; cursor: pointer;">
            <option value="unconfirmed" ${order.status === 'unconfirmed' ? 'selected' : ''}>🔴 Unconfirmed</option>
            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>⏳ Pending</option>
            <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>✅ Delivered</option>
          </select>
          <button onclick="deleteOrder('${orderId}')" 
            style="padding: 8px 16px; background: #e53e3e; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
            🗑️ Delete
          </button>
        </div>
      </div>

      <!-- Customer Information -->
      <div style="background: #f7fafc; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
        <h4 style="margin: 0 0 12px 0; color: #2d3748; font-size: 15px;">👤 Customer Information</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
          <div>
            <p style="margin: 0; color: #666; font-size: 12px;">Name</p>
            <p style="margin: 4px 0 0 0; font-weight: 600; color: #2d3748;">${order.customerName || 'Anonymous'}</p>
          </div>
          <div>
            <p style="margin: 0; color: #666; font-size: 12px;">Phone</p>
            <p style="margin: 4px 0 0 0; font-weight: 600; color: #2d3748;">📞 ${order.phone || order.customerPhone || 'N/A'}</p>
          </div>
          <div style="grid-column: 1 / -1;">
            <p style="margin: 0; color: #666; font-size: 12px;">Address</p>
            <p style="margin: 4px 0 0 0; font-weight: 600; color: #2d3748;">📍 ${order.address || 'N/A'}</p>
          </div>
          ${order.specialInstructions ? `
            <div style="grid-column: 1 / -1;">
              <p style="margin: 0; color: #666; font-size: 12px;">Special Instructions</p>
              <p style="margin: 4px 0 0 0; color: #2d3748; font-style: italic;">💬 ${order.specialInstructions}</p>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Order Items -->
      <div style="background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <h4 style="margin: 0 0 12px 0; color: #2d3748; font-size: 15px;">🛒 Order Items</h4>
        ${items.length > 0 ? `
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 2px solid #e2e8f0;">
                <th style="padding: 8px; text-align: left; color: #666; font-size: 12px; font-weight: 600;">ITEM</th>
                <th style="padding: 8px; text-align: center; color: #666; font-size: 12px; font-weight: 600;">QTY</th>
                <th style="padding: 8px; text-align: right; color: #666; font-size: 12px; font-weight: 600;">PRICE</th>
                <th style="padding: 8px; text-align: right; color: #666; font-size: 12px; font-weight: 600;">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr style="border-bottom: 1px solid #f0f0f0;">
                  <td style="padding: 12px 8px;">
                    <p style="margin: 0; font-weight: 600; color: #2d3748;">${item.name || 'Unknown Item'}</p>
                    ${item.desc ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">${item.desc}</p>` : ''}
                  </td>
                  <td style="padding: 12px 8px; text-align: center; font-weight: 600; color: #FF6B35;">×${item.quantity || 1}</td>
                  <td style="padding: 12px 8px; text-align: right; color: #2d3748;">${(item.price || 0).toFixed(2)} DZD</td>
                  <td style="padding: 12px 8px; text-align: right; font-weight: 600; color: #2d3748;">${((item.price || 0) * (item.quantity || 1)).toFixed(2)} DZD</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p style="color: #666; text-align: center;">No items</p>'}
      </div>

      <!-- Order Summary -->
      <div style="background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%); padding: 16px; border-radius: 8px; color: white;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span>Subtotal:</span>
          <span style="font-weight: 600;">${(order.subtotal || 0).toFixed(2)} DZD</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span>Delivery Fee:</span>
          <span style="font-weight: 600;">${(order.deliveryFee || 0).toFixed(2)} DZD</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.3); font-size: 18px;">
          <span style="font-weight: bold;">Total:</span>
          <span style="font-weight: bold;">${(order.total || 0).toFixed(2)} DZD</span>
        </div>
      </div>
    </div>
  `;
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    console.log('📝 Updating order status:', orderId, 'to', newStatus);
    await dbService.updateOrderStatus(orderId, newStatus);
    await loadOrdersData();
    renderOrdersTable();
    loadDashboard();
    showStyledAlert('Success', `Order status updated to <strong>${newStatus}</strong>`);
  } catch (error) {
    console.error('❌ Failed to update order status:', error);
    showStyledAlert('Error', 'Failed to update order status: ' + error.message);
  }
}

async function deleteOrder(orderId) {
  showStyledConfirm('Delete Order', `Are you sure you want to delete this order? This action cannot be undone.`, async () => {
    try {
      console.log('🗑️ Deleting order:', orderId);
      await dbService.deleteOrder(orderId);
      await loadOrdersData();
      renderOrdersTable();
      loadDashboard();
      showStyledAlert('Deleted', 'Order deleted successfully!');
    } catch (error) {
      console.error('❌ Failed to delete order:', error);
      showStyledAlert('Error', 'Failed to delete order: ' + error.message);
    }
  });
}


// ==================== MENU SECTION ====================

async function loadMenu() {
  try {
    await loadMenuData();
    await loadCategories();
    renderCategoryFilters();
    renderMenuGrid();
  } catch (error) {
    console.error('Failed to load menu:', error);
  }
}

async function loadCategories() {
  try {
    console.log('📂 Admin: Loading categories from Firestore...');
    await dbService.init();
    const categories = await dbService.getAllCategories();
    console.log('✅ Admin: Categories loaded:', categories.length);
    state.categories = categories.sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (error) {
    console.error('❌ Admin: Failed to load categories:', error);
    state.categories = [];
  }
}

function renderCategoryFilters() {
  const container = document.getElementById('menu-category-filters');
  const html = `
    <button class="filter-btn ${state.menuFilter === 'all' ? 'active' : ''}" 
      onclick="filterMenuByCategory('all', event)">All</button>
    ${state.categories.map(cat => `
      <button class="filter-btn ${state.menuFilter === cat.id ? 'active' : ''}" 
        onclick="filterMenuByCategory('${cat.id}', event)">${cat.name}</button>
    `).join('')}
  `;
  container.innerHTML = html;

  // Update category dropdown in modal
  const categorySelect = document.getElementById('item-category');
  categorySelect.innerHTML = `
    <option value="">Select category</option>
    ${state.categories.map(cat => `
      <option value="${cat.id}">${cat.name}</option>
    `).join('')}
  `;
}

function filterMenuByCategory(category, event) {
  if (event) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
  }
  state.menuFilter = category;
  renderMenuGrid();
}

function renderMenuGrid() {
  const container = document.getElementById('menu-items-grid');

  let filtered = state.menuItems;
  if (state.menuFilter !== 'all') {
    filtered = state.menuItems.filter(item => item.category === state.menuFilter);
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
        <div style="font-size: 64px; margin-bottom: 16px;">🍽️</div>
        <h3 style="color: #2d3748; margin-bottom: 8px;">No menu items yet</h3>
        <p style="color: #718096; margin-bottom: 24px;">Start by adding your first menu item</p>
        <button class="btn-primary" onclick="openAddModal()" 
          style="padding: 12px 24px; background: linear-gradient(135deg, #FF6B35, #FF8C42); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
          ➕ Add Menu Item
        </button>
      </div>
    `;
    return;
  }

  const html = filtered.map(item => `
    <div class="menu-item-card" style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: transform 0.2s;">
      <div style="position: relative; padding-bottom: 75%; overflow: hidden; background: #f7fafc;">
        <img src="${item.img || 'images/placeholder.svg'}" alt="${item.name}" 
          style="position: absolute; width: 100%; height: 100%; object-fit: cover;">
      </div>
      <div style="padding: 16px;">
        <h3 style="margin: 0 0 8px 0; color: #2d3748; font-size: 18px;">${item.name}</h3>
        <p style="margin: 0 0 12px 0; color: #718096; font-size: 14px; line-height: 1.5;">${item.desc}</p>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 20px; font-weight: bold; color: #FF6B35;">${item.price} DZD</span>
          <span style="padding: 4px 12px; background: #FFF3CD; color: #856404; border-radius: 12px; font-size: 12px; font-weight: 600;">
            ${item.category}
          </span>
        </div>
        <div style="display: flex; gap: 8px; margin-top: 16px;">
          <button onclick="editMenuItem('${item.id}')" 
            style="flex: 1; padding: 8px; background: #4299e1; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
            ✏️ Edit
          </button>
          <button onclick="deleteMenuItem('${item.id}')" 
            style="flex: 1; padding: 8px; background: #e53e3e; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  `).join('');

  container.innerHTML = html;
}

// ==================== MENU ITEM CRUD ====================

function openAddModal() {
  state.editingItem = null;
  state.uploadedImageUrl = null;
  state.selectedImage = null;

  document.getElementById('modal-title').textContent = '➕ Add New Menu Item';
  document.getElementById('item-id').value = '';
  document.getElementById('item-name').value = '';
  document.getElementById('item-price').value = '';
  document.getElementById('item-desc').value = '';
  document.getElementById('item-category').value = '';

  resetImageUpload();
  document.getElementById('menu-item-modal').classList.add('active');
}

function editMenuItem(itemId) {
  const item = state.menuItems.find(i => i.id === itemId);
  if (!item) return;

  state.editingItem = item;
  state.uploadedImageUrl = null;
  state.selectedImage = null;

  document.getElementById('modal-title').textContent = '✏️ Edit Menu Item';
  document.getElementById('item-id').value = item.id;
  document.getElementById('item-name').value = item.name;
  document.getElementById('item-price').value = item.price;
  document.getElementById('item-desc').value = item.desc;
  document.getElementById('item-category').value = item.category;

  // Show existing image
  if (item.img) {
    document.getElementById('upload-placeholder').style.display = 'none';
    document.getElementById('image-preview-container').style.display = 'block';
    document.getElementById('image-preview-img').src = item.img;
  } else {
    resetImageUpload();
  }

  document.getElementById('menu-item-modal').classList.add('active');
}

async function saveMenuItem(event) {
  event.preventDefault();

  const itemId = document.getElementById('item-id').value;
  const itemName = document.getElementById('item-name').value.trim();
  const itemPrice = parseFloat(document.getElementById('item-price').value);
  const itemDesc = document.getElementById('item-desc').value.trim();
  const itemCategory = document.getElementById('item-category').value;

  if (!itemName || !itemDesc || !itemCategory || isNaN(itemPrice) || itemPrice <= 0) {
    alert('❌ Please fill all fields correctly');
    return;
  }

  const saveBtn = document.getElementById('save-item-btn');
  saveBtn.disabled = true;
  saveBtn.textContent = '💾 Saving...';

  try {
    let imageUrl = '';

    // Use uploaded image URL if available
    if (state.uploadedImageUrl) {
      imageUrl = state.uploadedImageUrl;
    } else if (state.editingItem?.img) {
      imageUrl = state.editingItem.img;
    }

    const itemData = {
      name: itemName,
      price: itemPrice,
      desc: itemDesc,
      category: itemCategory,
      img: imageUrl
    };

    if (itemId) {
      // Update existing item in Firestore
      console.log('📝 Updating menu item:', itemId);
      await dbService.updateMenuItem(itemId, itemData);
    } else {
      // Add new item to Firestore
      console.log('➕ Adding new menu item');
      const newId = await dbService.addMenuItem(itemData);
      console.log('✅ Item added with ID:', newId);
    }

    closeModal();
    await loadMenu();
    alert('✅ Menu item saved successfully!');
  } catch (error) {
    console.error('❌ Failed to save item:', error);
    alert('❌ Failed to save menu item: ' + error.message);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = '💾 Save Item';
  }
}

async function deleteMenuItem(itemId) {
  if (!confirm('Are you sure you want to delete this menu item?')) return;

  try {
    console.log('🗑️ Deleting menu item:', itemId);
    await dbService.deleteMenuItem(itemId);
    await loadMenu();
    alert('✅ Menu item deleted successfully!');
  } catch (error) {
    console.error('❌ Failed to delete item:', error);
    alert('❌ Failed to delete menu item: ' + error.message);
  }
}

function closeModal() {
  document.getElementById('menu-item-modal').classList.remove('active');
  state.editingItem = null;
  state.uploadedImageUrl = null;
  state.selectedImage = null;
  resetImageUpload();
}

// ==================== IMAGE UPLOAD (Manual ImgBB) ====================

function openImgBBUpload() {
  // Open ImgBB in a new tab
  window.open('https://imgbb.com/', '_blank');

  // Show the URL input section
  document.getElementById('upload-placeholder').style.display = 'none';
  document.getElementById('image-url-input-container').style.display = 'block';

  // Focus on the input field
  setTimeout(() => {
    document.getElementById('image-url-input').focus();
  }, 100);
}

function handleImageUrlInput(event) {
  const url = event.target.value.trim();

  if (!url) {
    resetImageUpload();
    return;
  }

  // Basic URL validation
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    alert('❌ Please enter a valid URL starting with http:// or https://');
    return;
  }

  // Store the URL
  state.uploadedImageUrl = url;

  // Sync the URL to both input fields
  const visibleInput = document.getElementById('item-image-url');
  const hiddenInput = document.getElementById('image-url-input');
  if (visibleInput && event.target.id !== 'item-image-url') {
    visibleInput.value = url;
  }
  if (hiddenInput && event.target.id !== 'image-url-input') {
    hiddenInput.value = url;
  }

  // Show preview
  document.getElementById('upload-placeholder').style.display = 'none';
  document.getElementById('image-url-input-container').style.display = 'none';
  document.getElementById('image-preview-container').style.display = 'block';
  document.getElementById('image-preview-img').src = url;
  document.getElementById('image-upload-area').style.borderColor = '#48bb78';

  console.log('✅ Image URL set:', url);
}

function resetImageUpload() {
  state.uploadedImageUrl = null;

  const urlInput = document.getElementById('image-url-input');
  const visibleUrlInput = document.getElementById('item-image-url');
  if (urlInput) urlInput.value = '';
  if (visibleUrlInput) visibleUrlInput.value = '';

  document.getElementById('upload-placeholder').style.display = 'block';
  document.getElementById('image-url-input-container').style.display = 'none';
  document.getElementById('image-preview-container').style.display = 'none';
  document.getElementById('image-preview-img').src = '';
  document.getElementById('image-upload-area').style.borderColor = '#cbd5e0';

  document.getElementById('upload-placeholder').innerHTML = `
    <div style="font-size: 48px; margin-bottom: 12px;">📸</div>
    <p style="color: #4a5568; font-weight: 500; margin-bottom: 12px;">Upload to ImgBB</p>
    <button onclick="event.stopPropagation(); openImgBBUpload();" style="padding: 12px 24px; background: linear-gradient(135deg, #FF6B35, #FF8C42); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px;">
      🌐 Open ImgBB
    </button>
    <p style="color: #718096; font-size: 13px; margin-top: 12px;">Upload your image on ImgBB, then paste the link below</p>

    <!-- Link Input Field - Always Visible -->
    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #cbd5e0;">
      <label for="item-image-url" style="display: block; font-weight: 600; margin-bottom: 8px; color: #2d3748; font-size: 14px;">📎 Or paste image URL directly:</label>
      <input 
        type="url" 
        id="item-image-url" 
        placeholder="https://i.ibb.co/xxxxx/image.jpg or any image URL" 
        onchange="handleImageUrlInput(event)"
        style="width: 100%; padding: 12px; border: 2px solid #cbd5e0; border-radius: 8px; font-size: 14px; box-sizing: border-box;"
      />
    </div>
  `;
}

function clearImage() {
  resetImageUpload();
}

// ==================== ANALYTICS SECTION ====================

async function loadAnalytics() {
  try {
    await Promise.all([loadMenuData(), loadOrdersData()]);
    updateAnalytics();
  } catch (error) {
    console.error('Failed to load analytics:', error);
  }
}

function updateAnalytics() {
  const totalRevenue = state.orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const avgOrder = state.orders.length > 0 ? totalRevenue / state.orders.length : 0;

  // Calculate best day
  const dayStats = {};
  state.orders.forEach(order => {
    if (!order.createdAt) return;
    const date = new Date(order.createdAt.toDate ? order.createdAt.toDate() : order.createdAt);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    dayStats[dayName] = (dayStats[dayName] || 0) + 1;
  });

  const bestDay = Object.entries(dayStats).sort((a, b) => b[1] - a[1])[0];

  document.getElementById('total-revenue').textContent = totalRevenue.toFixed(2) + ' DZD';
  document.getElementById('avg-order').textContent = avgOrder.toFixed(2) + ' DZD';
  document.getElementById('best-day').textContent = bestDay ? `${bestDay[0]} (${bestDay[1]} orders)` : 'No data';

  // Popular items from actual orders
  const itemStats = {};
  state.orders.forEach(order => {
    if (!order.items) return;
    order.items.forEach(item => {
      if (!itemStats[item.name]) {
        itemStats[item.name] = { count: 0, revenue: 0 };
      }
      itemStats[item.name].count += item.quantity || item.qty || 1;
      itemStats[item.name].revenue += (item.price || 0) * (item.quantity || item.qty || 1);
    });
  });

  const topItems = Object.entries(itemStats)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  const popularContainer = document.getElementById('popular-items');
  if (topItems.length === 0) {
    popularContainer.innerHTML = '<p style="color: #666;">No order data yet</p>';
  } else {
    popularContainer.innerHTML = topItems.map(([name, stats], index) => `
      <div style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
        <p style="margin: 0; font-weight: 600;">${index + 1}. ${name}</p>
        <p style="margin: 4px 0 0 0; color: #666; font-size: 14px;">
          ${stats.count} sold • ${stats.revenue.toFixed(2)} DZD
        </p>
      </div>
    `).join('');
  }
}

// ==================== INITIALIZATION ====================

async function initializeDashboard() {
  try {
    await dbService.init();
    await checkUserStaffStatus();
    console.log('✅ Staff status checked:', state.currentUserRole);
    
    await Promise.all([
      loadMenuData(),
      loadOrdersData(),
      loadCategories(),
      loadCouponsData(),
      loadReviewsData(),
      loadStaffData(),
      loadSettingsData()
    ]);
    setupCategoryManagement();
    setupSettingsHandlers();
    setupRealtimeListeners();
  } catch (error) {
    console.error('Failed to initialize dashboard:', error);
  }
}

function setupRealtimeListeners() {
  console.log('👂 Setting up real-time listeners for admin dashboard...');

  // Listen to menu changes
  dbService.listenToMenuChanges((updatedMenu) => {
    console.log('🔄 Admin: Menu updated in real-time:', updatedMenu.length, 'items');
    state.menuItems = updatedMenu;
    if (state.currentSection === 'menu') {
      renderMenuGrid();
    }
    if (state.currentSection === 'dashboard') {
      renderBestSellers();
    }
  });

  // Listen to order changes
  dbService.listenToOrderChanges((updatedOrders) => {
    console.log('🔄 Admin: Orders updated in real-time:', updatedOrders.length, 'orders');
    state.orders = updatedOrders;
    if (state.currentSection === 'orders') {
      renderOrdersTable();
    }
    if (state.currentSection === 'dashboard') {
      updateDashboardStats();
    }
  });

  // Listen to category changes
  dbService.listenToCategoryChanges((updatedCategories) => {
    console.log('🔄 Admin: Categories updated in real-time:', updatedCategories.length, 'categories');
    state.categories = updatedCategories.sort((a, b) => (a.order || 0) - (b.order || 0));
    if (state.currentSection === 'menu') {
      renderCategoryFilters();
    }
  });

  // Listen to coupons changes
  dbService.listenToCouponChanges((updated) => {
    console.log('🔄 Admin: Coupons updated:', updated.length);
    state.coupons = updated;
    if (state.currentSection === 'coupons') {
      renderCouponsGrid();
    }
  });

  // Listen to reviews changes
  dbService.listenToReviewChanges((updated) => {
    console.log('🔄 Admin: Reviews updated:', updated.length);
    state.reviews = updated;
    if (state.currentSection === 'reviews') {
      renderReviewsList();
    }
  });

  // Listen to staff changes
  dbService.listenToStaffChanges((updated) => {
    console.log('🔄 Admin: Staff updated:', updated.length);
    state.staff = updated;
    if (state.currentSection === 'staff') {
      renderStaffTable();
    }
  });

  // Listen to settings changes
  dbService.listenToSettingsChanges((updated) => {
    console.log('🔄 Admin: Settings updated');
    state.settings = updated;
    if (state.currentSection === 'settings') {
      populateSettingsForm();
    }
  });
}

// ==================== EVENT LISTENERS ====================

document.addEventListener('DOMContentLoaded', () => {
  // Login form
  document.getElementById('admin-login-form')?.addEventListener('submit', handleLogin);

  // Menu item form
  document.getElementById('menu-item-form')?.addEventListener('submit', saveMenuItem);

  // Make functions globally available
  window.showSection = showSection;
  window.toggleSidebar = toggleSidebar;
  window.adminLogout = handleLogout;
  window.openAddModal = openAddModal;
  window.closeModal = closeModal;
  window.editMenuItem = editMenuItem;
  window.deleteMenuItem = deleteMenuItem;
  window.clearImage = clearImage;
  window.filterMenuByCategory = filterMenuByCategory;
  window.filterOrdersByStatus = filterOrdersByStatus;
  window.filterOrders = filterOrders;
  window.updateOrderStatus = updateOrderStatus;
  window.deleteOrder = deleteOrder;
  window.saveMenuItem = saveMenuItem;
  window.openCategoryModal = openCategoryModal;
  window.closeCategoryModal = closeCategoryModal;
  window.addCategory = addCategory;
  window.deleteCategory = deleteCategory;
  window.openImgBBUpload = openImgBBUpload;
  window.handleImageUrlInput = handleImageUrlInput;
  window.initializeDashboard = initializeDashboard;
  window.openAddCouponModal = openAddCouponModal;
  window.editCoupon = editCoupon;
  window.saveCoupon = saveCoupon;
  window.deleteCoupon = deleteCoupon;
  window.closeCouponModal = closeCouponModal;
  window.openAddStaffModal = openAddStaffModal;
  window.closeAddStaffModal = closeAddStaffModal;
  window.deleteStaff = deleteStaff;
  window.deleteReview = deleteReview;
  window.saveStaffMember = saveStaffMember;
  window.renderCouponsGrid = renderCouponsGrid;
  window.renderReviewsList = renderReviewsList;
  window.renderStaffTable = renderStaffTable;
  window.renderCustomersTable = renderCustomersTable;
  window.viewOrderDetails = viewOrderDetails;
});

// ==================== CATEGORY MANAGEMENT ====================

function openCategoryModal() {
  document.getElementById('category-modal').classList.add('active');
  renderCategoriesList();
}

function closeCategoryModal() {
  document.getElementById('category-modal').classList.remove('active');
}

async function addCategory(event) {
  event.preventDefault();

  const categoryId = document.getElementById('category-id').value.trim().toLowerCase();
  const categoryName = document.getElementById('category-name').value.trim();

  if (!categoryId || !categoryName) {
    alert('❌ Please fill all fields');
    return;
  }

  // Validate ID format
  if (!/^[a-z0-9_-]+$/.test(categoryId)) {
    alert('❌ Category ID must contain only lowercase letters, numbers, hyphens, and underscores');
    return;
  }

  // Check if category already exists
  if (state.categories.find(cat => cat.id === categoryId)) {
    alert('❌ Category ID already exists');
    return;
  }

  try {
    const newCategory = {
      id: categoryId,
      name: categoryName,
      order: state.categories.length
    };

    await dbService.addCategory(newCategory);

    state.categories.push(newCategory);

    // Clear form
    document.getElementById('category-id').value = '';
    document.getElementById('category-name').value = '';

    renderCategoriesList();
    renderCategoryFilters();

    alert('✅ Category added successfully!');
  } catch (error) {
    console.error('Failed to add category:', error);
    alert('❌ Failed to add category');
  }
}

async function deleteCategory(categoryId) {
  if (!confirm('Are you sure you want to delete this category?\n\nNote: Menu items in this category will remain but may need reassignment.')) {
    return;
  }

  try {
    await dbService.deleteCategory(categoryId);

    state.categories = state.categories.filter(cat => cat.id !== categoryId);

    renderCategoriesList();
    renderCategoryFilters();

    alert('✅ Category deleted successfully!');
  } catch (error) {
    console.error('Failed to delete category:', error);
    alert('❌ Failed to delete category');
  }
}

function renderCategoriesList() {
  const container = document.getElementById('categories-list');
  if (!container) return;

  if (state.categories.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">No categories yet</p>';
    return;
  }

  const html = state.categories.map(cat => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px;border:2px solid #e2e8f0;border-radius:8px;margin-bottom:8px;background:white;">
      <div>
        <div style="font-weight:600;color:#2d3748;margin-bottom:4px;">${cat.name}</div>
        <div style="font-size:12px;color:#718096;">ID: ${cat.id}</div>
      </div>
      <button onclick="deleteCategory('${cat.id}')" 
        style="padding:8px 16px;background:#e53e3e;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;">
        🗑️ Delete
      </button>
    </div>
  `).join('');

  container.innerHTML = html;
}

// ==================== NEW SECTIONS LOAD FUNCTIONS ====================

async function loadCustomers() {
  console.log('👥 Loading customers...');
  try {
    // Extract unique customers from orders
    const customersMap = new Map();

    state.orders.forEach(order => {
      const email = order.email || order.customerEmail || 'unknown';
      if (!customersMap.has(email)) {
        customersMap.set(email, {
          email: email,
          name: order.customerName || order.name || 'Anonymous',
          phone: order.customerPhone || order.phone || 'N/A',
          totalOrders: 0,
          totalSpent: 0,
          lastOrder: null
        });
      }

      const customer = customersMap.get(email);
      customer.totalOrders++;
      customer.totalSpent += order.total || 0;

      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt || Date.now());
      if (!customer.lastOrder || orderDate > customer.lastOrder) {
        customer.lastOrder = orderDate;
      }
    });

    state.customers = Array.from(customersMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent);

    renderCustomersTable();
  } catch (error) {
    console.error('Failed to load customers:', error);
  }
}

function renderCustomersTable() {
  const container = document.getElementById('customers-table');
  if (!container) return;

  if (state.customers.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#999;padding:40px;">No customers yet</p>';
    return;
  }

  const html = `
    <table style="width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;">
      <thead>
        <tr style="background:#f7fafc;text-align:left;">
          <th style="padding:12px;font-weight:600;color:#2d3748;">Name</th>
          <th style="padding:12px;font-weight:600;color:#2d3748;">Email</th>
          <th style="padding:12px;font-weight:600;color:#2d3748;">Phone</th>
          <th style="padding:12px;font-weight:600;color:#2d3748;">Total Orders</th>
          <th style="padding:12px;font-weight:600;color:#2d3748;">Total Spent</th>
          <th style="padding:12px;font-weight:600;color:#2d3748;">Last Order</th>
        </tr>
      </thead>
      <tbody>
        ${state.customers.map(customer => `
          <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="padding:12px;font-weight:600;color:#2d3748;">${customer.name}</td>
            <td style="padding:12px;color:#666;">${customer.email}</td>
            <td style="padding:12px;color:#666;">${customer.phone}</td>
            <td style="padding:12px;text-align:center;font-weight:600;color:#FF6B35;">${customer.totalOrders}</td>
            <td style="padding:12px;font-weight:600;color:#2d3748;">${customer.totalSpent.toFixed(2)} DZD</td>
            <td style="padding:12px;color:#666;">${customer.lastOrder ? customer.lastOrder.toLocaleDateString() : 'N/A'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}

async function loadCoupons() {
  console.log('🎫 Loading coupons...');
  try {
    await loadCouponsData();
    renderCouponsGrid();
  } catch (error) {
    console.error('Failed to load coupons:', error);
  }
}

function renderCouponsGrid() {
  const container = document.getElementById('coupons-grid');
  if (!container) return;

  if (state.coupons.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:60px 20px;">
        <div style="font-size:64px;margin-bottom:16px;">🎫</div>
        <h3 style="color:#2d3748;margin-bottom:8px;">No coupons yet</h3>
        <p style="color:#718096;margin-bottom:24px;">Create promotional codes for your customers</p>
        <button class="btn-primary" onclick="openAddCouponModal()" 
          style="padding:12px 24px;background:linear-gradient(135deg,#FF6B35,#FF8C42);color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;">
          ➕ Create Coupon
        </button>
      </div>
    `;
    return;
  }

  const html = state.coupons.map(coupon => {
    const isActive = coupon.active !== false;
    const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();

    return `
      <div class="coupon-card" style="background:white;border-radius:12px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px;">
          <div style="flex:1;">
            <h3 style="margin:0 0 4px 0;color:#FF6B35;font-size:20px;font-family:monospace;font-weight:700;">${coupon.code}</h3>
            <p style="margin:0;color:#666;font-size:14px;">${coupon.description || 'No description'}</p>
          </div>
          <span style="padding:4px 12px;background:${isExpired ? '#FEE' : isActive ? '#E8F5E9' : '#F5F5F5'};color:${isExpired ? '#C00' : isActive ? '#2E7D32' : '#666'};border-radius:12px;font-size:12px;font-weight:600;">
            ${isExpired ? '⏰ Expired' : isActive ? '✅ Active' : '❌ Inactive'}
          </span>
        </div>
        <div style="background:#f7fafc;padding:12px;border-radius:8px;margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span style="color:#666;font-size:14px;">Discount:</span>
            <strong style="color:#FF6B35;font-size:16px;">${coupon.discountType === 'percentage' ? coupon.discountValue + '%' : coupon.discountValue + ' DZD'}</strong>
          </div>
          ${coupon.minOrderAmount ? `
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
              <span style="color:#666;font-size:14px;">Min Order:</span>
              <strong style="color:#2d3748;">${coupon.minOrderAmount} DZD</strong>
            </div>
          ` : ''}
          ${coupon.expiresAt ? `
            <div style="display:flex;justify-content:space-between;">
              <span style="color:#666;font-size:14px;">Expires:</span>
              <span style="color:#2d3748;font-weight:500;">${new Date(coupon.expiresAt).toLocaleDateString()}</span>
            </div>
          ` : ''}
        </div>
        <div style="display:flex;gap:8px;">
          <button onclick="editCoupon('${coupon.id}')" 
            style="flex:1;padding:8px;background:#4299e1;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;">
            ✏️ Edit
          </button>
          <button onclick="deleteCoupon('${coupon.id}')" 
            style="flex:1;padding:8px;background:#e53e3e;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;">
            🗑️ Delete
          </button>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

async function loadReviews() {
  console.log('⭐ Loading customer feedback...');
  try {
    await loadReviewsData();
    renderReviewsList();
  } catch (error) {
    console.error('Failed to load reviews:', error);
  }
}

async function loadMessages() {
  console.log('📧 Loading contact messages...');
  try {
    state.messages = await dbService.getAllContactMessages();
    renderMessagesList();
  } catch (error) {
    console.error('Failed to load messages:', error);
  }
}

function renderMessagesList() {
  const container = document.getElementById('messages-list');
  if (!container) return;

  if (state.messages.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#999;padding:40px;">No contact messages yet</p>';
    return;
  }

  document.getElementById('total-messages').textContent = state.messages.length;

  const html = state.messages.map((message) => {
    const date = message.createdAt ? new Date(message.createdAt.toDate ? message.createdAt.toDate() : message.createdAt).toLocaleDateString() : 'N/A';
    const time = message.createdAt ? new Date(message.createdAt.toDate ? message.createdAt.toDate() : message.createdAt).toLocaleTimeString() : '';

    return `
      <div style="background:white;border-radius:12px;padding:20px;margin-bottom:16px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px;">
          <div style="flex:1;">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
              <h4 style="margin:0;color:#2d3748;font-size:16px;font-weight:600;">${message.name || 'Anonymous'}</h4>
              <span style="color:#666;font-size:13px;">✉️ ${message.email || 'N/A'}</span>
            </div>
            <p style="margin:0;color:#666;font-size:14px;">📅 ${date} ${time}</p>
          </div>
          <button onclick="deleteMessage('${message.id}')" 
            style="padding:8px 16px;background:#e53e3e;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;white-space:nowrap;">
            🗑️ Delete
          </button>
        </div>
        <div style="margin-top:12px;padding:12px;background:#f7fafc;border-radius:8px;border-left:4px solid #FF6B35;">
          <p style="margin:0;color:#2d3748;line-height:1.6;white-space:pre-wrap;word-wrap:break-word;">
            ${message.message || 'N/A'}
          </p>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

async function deleteMessage(messageId) {
  showStyledConfirm('Delete Message', 'Are you sure you want to delete this message?', async () => {
    try {
      await dbService.deleteContactMessage(messageId);
      await loadMessages();
      showStyledAlert('Deleted', 'Message deleted successfully!');
    } catch (error) {
      console.error('❌ Failed to delete message:', error);
      showStyledAlert('Error', 'Failed to delete message');
    }
  });
}

function renderReviewsList() {
  const container = document.getElementById('reviews-list');
  if (!container) return;

  if (state.reviews.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#999;padding:40px;">No customer feedback yet</p>';
    return;
  }

  const avgRating = state.reviews.reduce((sum, f) => sum + (f.rating || 0), 0) / state.reviews.length;
  document.getElementById('total-reviews').textContent = state.reviews.length;
  document.getElementById('avg-rating').textContent = avgRating.toFixed(1) + ' ⭐';

  const html = state.reviews.map((review) => {
    const stars = '★'.repeat(review.rating || 0) + '☆'.repeat(5 - (review.rating || 0));
    const date = review.createdAt ? new Date(review.createdAt.toDate ? review.createdAt.toDate() : review.createdAt).toLocaleDateString() : 'N/A';

    return `
      <div style="background:white;border-radius:12px;padding:20px;margin-bottom:16px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px;">
          <div style="flex:1;">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
              <h4 style="margin:0;color:#2d3748;font-size:16px;font-weight:600;">${review.customerName || review.name || 'Anonymous'}</h4>
              <span style="color:#FF6B35;font-size:18px;">${stars}</span>
            </div>
            <p style="margin:0;color:#666;font-size:14px;">📅 ${date}</p>
          </div>
          <button onclick="deleteFeedback('${review.id}')" 
            style="padding:8px 16px;background:#e53e3e;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;white-space:nowrap;">
            🗑️ Delete
          </button>
        </div>
        ${review.comment ? `
          <p style="margin:12px 0 0 0;color:#2d3748;line-height:1.6;padding:12px;background:#f7fafc;border-radius:8px;">
            "${review.comment}"
          </p>
        ` : ''}
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

async function deleteFeedback(reviewId) {
  if (!confirm('Are you sure you want to delete this feedback?')) return;

  try {
    await dbService.deleteReview(reviewId);
    await loadReviews();
    alert('✅ Feedback deleted successfully!');
  } catch (error) {
    console.error('❌ Failed to delete feedback:', error);
    alert('❌ Failed to delete feedback');
  }
}

// Alias for deleteReview (used globally)
const deleteReview = deleteFeedback;

function loadSettings() {
  console.log('⚙️ Loading settings...');
  // Settings are already loaded in the HTML, event handlers are attached in setupSettingsHandlers()
}

// Setup settings form handlers once during initialization
function setupSettingsHandlers() {
  const businessForm = document.getElementById('business-settings-form');
  if (businessForm) {
    businessForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const settings = {
        businessName: document.getElementById('business-name')?.value,
        businessEmail: document.getElementById('business-email')?.value,
        businessPhone: document.getElementById('business-phone')?.value,
        businessAddress: document.getElementById('business-address')?.value,
        deliveryFee: parseFloat(document.getElementById('delivery-fee')?.value) || 0,
        freeDeliveryMin: parseFloat(document.getElementById('free-delivery-min')?.value) || 0
      };

      console.log('💾 Saving business settings:', settings);
      try {
        await dbService.updateSettings(settings);
        state.settings = { ...state.settings, ...settings };
        console.log('✅ Business settings saved successfully!');
        showStyledAlert('Saved', 'Business settings saved successfully!');
        sessionStorage.setItem('admin_current_section', 'settings');
      } catch (error) {
        console.error('❌ Failed to save settings:', error);
        showStyledAlert('Error', 'Failed to save settings: ' + error.message);
      }
    });
  }

  const hoursForm = document.getElementById('hours-settings-form');
  if (hoursForm) {
    hoursForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const hours = {
        openTime: document.getElementById('open-time')?.value,
        closeTime: document.getElementById('close-time')?.value,
        workingDays: Array.from(document.querySelectorAll('input[name="working-days"]:checked')).map(cb => cb.value)
      };

      console.log('💾 Saving operating hours:', hours);
      try {
        await dbService.updateSettings({ hours });
        state.settings.hours = hours;
        console.log('✅ Operating hours saved successfully!');
        showStyledAlert('Saved', 'Operating hours updated successfully!');
        sessionStorage.setItem('admin_current_section', 'settings');
      } catch (error) {
        console.error('❌ Failed to update hours:', error);
        showStyledAlert('Error', 'Failed to update operating hours: ' + error.message);
      }
    });
  }
}

function populateSettingsForm() {
  if (!state.settings) return;

  if (state.settings.businessName) document.getElementById('business-name').value = state.settings.businessName;
  if (state.settings.businessEmail) document.getElementById('business-email').value = state.settings.businessEmail;
  if (state.settings.businessPhone) document.getElementById('business-phone').value = state.settings.businessPhone;
  if (state.settings.businessAddress) document.getElementById('business-address').value = state.settings.businessAddress;
  if (state.settings.deliveryFee !== undefined) document.getElementById('delivery-fee').value = state.settings.deliveryFee;
  if (state.settings.freeDeliveryMin !== undefined) document.getElementById('free-delivery-min').value = state.settings.freeDeliveryMin;

  if (state.settings.hours) {
    if (state.settings.hours.openTime) document.getElementById('open-time').value = state.settings.hours.openTime;
    if (state.settings.hours.closeTime) document.getElementById('close-time').value = state.settings.hours.closeTime;
  }
}

// ==================== STAFF MANAGEMENT ====================

async function loadStaff() {
  console.log('👨‍💼 Loading staff...');
  try {
    await loadStaffData();
    renderStaffTable();
  } catch (error) {
    console.error('Failed to load staff:', error);
  }
}

function renderStaffTable() {
  const container = document.getElementById('staff-table');
  if (!container) return;

  const adminRow = `
    <tr style="border-bottom:1px solid #e2e8f0;background:#f0f7ff;">
      <td style="padding:12px;font-weight:600;color:#2d3748;">Admin (Owner)</td>
      <td style="padding:12px;color:#666;">oussamaanis2005@gmail.com</td>
      <td style="padding:12px;">
        <span style="padding:4px 12px;background:#E30613;color:white;border-radius:12px;font-size:12px;font-weight:600;">
          Owner
        </span>
      </td>
      <td style="padding:12px;color:#666;font-size:14px;">Full Access</td>
      <td style="padding:12px;">
        <span style="color:#999;font-size:12px;">Default</span>
      </td>
    </tr>
  `;

  const staffRows = state.staff.map(member => `
    <tr style="border-bottom:1px solid #e2e8f0;">
      <td style="padding:12px;font-weight:600;color:#2d3748;">${member.name}</td>
      <td style="padding:12px;color:#666;">${member.email}</td>
      <td style="padding:12px;">
        <span style="padding:4px 12px;background:${member.role === 'Staff A' ? '#4299E1' : '#48BB78'};color:white;border-radius:12px;font-size:12px;font-weight:600;">
          ${member.role || 'Staff'}
        </span>
      </td>
      <td style="padding:12px;color:#666;font-size:14px;">
        ${member.role === 'Staff A' ? 'Manage Orders' : member.role === 'Staff B' ? 'Read Messages & Reviews' : 'None'}
      </td>
      <td style="padding:12px;">
        <button onclick="deleteStaff('${member.id}')" 
          style="padding:6px 12px;background:#e53e3e;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;">
          🗑️ Remove
        </button>
      </td>
    </tr>
  `).join('');

  const html = `
    <table style="width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;">
      <thead>
        <tr style="background:#f7fafc;text-align:left;">
          <th style="padding:12px;font-weight:600;color:#2d3748;">Name</th>
          <th style="padding:12px;font-weight:600;color:#2d3748;">Email</th>
          <th style="padding:12px;font-weight:600;color:#2d3748;">Role</th>
          <th style="padding:12px;font-weight:600;color:#2d3748;">Permissions</th>
          <th style="padding:12px;font-weight:600;color:#2d3748;">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${adminRow}
        ${staffRows}
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}

async function deleteStaff(staffId) {
  console.log('🗑️ Delete staff clicked for:', staffId);
  
  if (confirm('Are you sure you want to remove this staff member?')) {
    try {
      console.log('📝 Attempting to delete staff member with ID:', staffId);
      await dbService.deleteStaff(staffId);
      console.log('✅ Staff member deleted successfully from Firestore');
      await loadStaff();
      showStyledAlert('Removed', '✅ Staff member removed successfully!');
    } catch (error) {
      console.error('❌ Failed to remove staff:', error.code, error.message, error);
      showStyledAlert('Error', '❌ Failed to remove staff: ' + error.message);
    }
  }
}

function openAddStaffModal() {
  document.getElementById('staff-email').value = '';
  document.getElementById('staff-name').value = '';
  document.getElementById('staff-role').value = '';
  document.getElementById('staff-modal-title').textContent = '➕ Add Staff Member';
  document.getElementById('staff-modal').style.display = 'flex';
}

function closeAddStaffModal() {
  document.getElementById('staff-modal').style.display = 'none';
}

async function saveStaffMember(event) {
  event.preventDefault();
  
  const email = document.getElementById('staff-email').value.trim().toLowerCase();
  const name = document.getElementById('staff-name').value.trim();
  const role = document.getElementById('staff-role').value;
  
  if (!email || !name || !role) {
    alert('❌ Please fill all fields');
    return;
  }
  
  console.log('👨‍💼 Adding staff member:', { email, name, role });
  try {
    const staffId = email.toLowerCase();
    
    const staffData = {
      email: email.toLowerCase(),
      name,
      role,
      createdAt: new Date().toISOString()
    };
    
    console.log('📝 Staff data to save with ID:', staffId, staffData);
    await dbService.addStaffWithId(staffId, staffData);
    console.log('✅ Staff member added to database with ID:', staffId);
    
    closeAddStaffModal();
    document.getElementById('staff-email').value = '';
    document.getElementById('staff-name').value = '';
    document.getElementById('staff-role').value = '';
    await loadStaff();
    showStyledAlert('Added', `Staff member "<strong>${name}</strong>" added as <strong>${role}</strong>!`);
  } catch (error) {
    console.error('❌ Failed to add staff:', error);
    showStyledAlert('Error', 'Failed to add staff: ' + error.message);
  }
}

// ==================== NEW MODAL FUNCTIONS ====================

function openAddCouponModal() {
  state.editingCoupon = null;
  document.getElementById('coupon-modal-title').textContent = '➕ Create New Coupon';
  document.getElementById('coupon-id').value = '';
  document.getElementById('coupon-code').value = '';
  document.getElementById('coupon-description').value = '';
  document.getElementById('coupon-discount-type').value = 'percentage';
  document.getElementById('coupon-discount-value').value = '';
  document.getElementById('coupon-min-order').value = '';
  document.getElementById('coupon-expires-at').value = '';
  document.getElementById('coupon-active').checked = true;
  document.getElementById('coupon-modal').classList.add('active');
}

function editCoupon(couponId) {
  const coupon = state.coupons.find(c => c.id === couponId);
  if (!coupon) return;

  state.editingCoupon = coupon;
  document.getElementById('coupon-modal-title').textContent = '✏️ Edit Coupon';
  document.getElementById('coupon-id').value = coupon.id;
  document.getElementById('coupon-code').value = coupon.code;
  document.getElementById('coupon-description').value = coupon.description || '';
  document.getElementById('coupon-discount-type').value = coupon.discountType || 'percentage';
  document.getElementById('coupon-discount-value').value = coupon.discountValue;
  document.getElementById('coupon-min-order').value = coupon.minOrderAmount || '';
  document.getElementById('coupon-expires-at').value = coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : '';
  document.getElementById('coupon-active').checked = coupon.active !== false;
  document.getElementById('coupon-modal').classList.add('active');
}

async function saveCoupon(event) {
  event.preventDefault();

  const couponId = document.getElementById('coupon-id').value;
  const code = document.getElementById('coupon-code').value.trim().toUpperCase();
  const description = document.getElementById('coupon-description').value.trim();
  const discountType = document.getElementById('coupon-discount-type').value;
  const discountValue = parseFloat(document.getElementById('coupon-discount-value').value);
  const minOrderAmount = parseFloat(document.getElementById('coupon-min-order').value) || null;
  const expiresAt = document.getElementById('coupon-expires-at').value || null;
  const active = document.getElementById('coupon-active').checked;

  if (!code || isNaN(discountValue) || discountValue <= 0) {
    alert('❌ Please fill all required fields correctly');
    return;
  }

  const saveBtn = document.getElementById('save-coupon-btn');
  saveBtn.disabled = true;
  saveBtn.textContent = '💾 Saving...';

  try {
    const couponData = {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      expiresAt,
      active
    };

    if (couponId) {
      await dbService.updateCoupon(couponId, couponData);
    } else {
      await dbService.addCoupon(couponData);
    }

    closeCouponModal();
    await loadCoupons();
    alert('✅ Coupon saved successfully!');
  } catch (error) {
    console.error('❌ Failed to save coupon:', error);
    alert('❌ Failed to save coupon: ' + error.message);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = '💾 Save Coupon';
  }
}

async function deleteCoupon(couponId) {
  if (!confirm('Are you sure you want to delete this coupon?')) return;

  try {
    await dbService.deleteCoupon(couponId);
    await loadCoupons();
    alert('✅ Coupon deleted successfully!');
  } catch (error) {
    console.error('❌ Failed to delete coupon:', error);
    alert('❌ Failed to delete coupon: ' + error.message);
  }
}

function closeCouponModal() {
  document.getElementById('coupon-modal').classList.remove('active');
  state.editingCoupon = null;
}


// Update the manage categories button handler
function setupCategoryManagement() {
  const manageCategoriesBtn = document.querySelector('button[onclick*="Manage Categories"]');
  if (manageCategoriesBtn) {
    manageCategoriesBtn.onclick = openCategoryModal;
  }
}