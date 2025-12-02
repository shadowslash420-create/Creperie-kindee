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

async function loadCategoriesData() {
  try {
    console.log('📂 Admin: Loading categories from Firestore...');
    const data = await dbService.getAllCategories();
    console.log('✅ Admin: Categories loaded:', data.length);
    state.categories = data || [];
    return data;
  } catch (error) {
    console.error('❌ Admin: Failed to load categories:', error);
    state.categories = [];
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

async function loadReviews() {
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

async function loadMessages() {
  try {
    console.log('📧 Admin: Loading messages from Firestore...');
    const data = await dbService.getAllContactMessages();
    console.log('✅ Admin: Messages loaded:', data.length);
    state.messages = data || [];
    return data;
  } catch (error) {
    console.error('❌ Admin: Failed to load messages:', error);
    state.messages = [];
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

async function loadSettings() {
  try {
    console.log('⚙️ Admin: Loading settings from Firestore...');
    const data = await dbService.getSettings();
    console.log('✅ Admin: Settings loaded');
    state.settings = data || {};
    return data;
  } catch (error) {
    console.error('❌ Admin: Failed to load settings:', error);
    state.settings = {};
    return {};
  }
}

// ==================== ADMIN INIT & AUTH ====================

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('adm-user').value.trim();
  const password = document.getElementById('adm-pass').value;

  if (!email || !password) {
    document.getElementById('login-error').textContent = '❌ Please enter email and password';
    document.getElementById('login-error').style.display = 'block';
    return;
  }

  try {
    const auth = await getAuthInstance();
    await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Email login successful');
    
    // Check if user is staff or admin
    await checkUserStaffStatus();
    
    // Auto-initialize dashboard
    await initializeDashboard();
  } catch (error) {
    console.error('Email login error:', error);
    document.getElementById('login-error').textContent = '❌ Login failed: ' + error.message;
    document.getElementById('login-error').style.display = 'block';
  }
}

async function initializeDashboard() {
  try {
    const auth = await getAuthInstance();
    if (!auth.currentUser) {
      console.log('ℹ️ No user logged in');
      return;
    }

    console.log('✅ Admin user auto-logged in:', auth.currentUser.email);
    await checkUserStaffStatus();
    console.log('✅ Staff status checked:', state.currentUserRole);

    // Show dashboard, hide login
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('admin-section').classList.remove('hidden');

    // Load all data
    console.log('📋 Admin: Loading menu items from Firestore...');
    console.log('📦 Admin: Loading orders from Firestore...');
    console.log('📂 Admin: Loading categories from Firestore...');
    console.log('🎫 Admin: Loading coupons from Firestore...');
    console.log('⭐ Admin: Loading reviews from Firestore...');
    console.log('👨‍💼 Admin: Loading staff from Firestore...');
    console.log('⚙️ Admin: Loading settings from Firestore...');

    await Promise.all([
      loadMenuData(),
      loadOrdersData(),
      loadCategoriesData(),
      loadCouponsData(),
      loadReviews(),
      loadMessages(),
      loadStaffData(),
      loadSettings()
    ]);

    console.log('✅ Admin: Menu items loaded:', state.menuItems.length);
    console.log('✅ Admin: Orders loaded:', state.orders.length);
    console.log('✅ Admin: Categories loaded:', state.categories.length);
    console.log('⭐ Admin: Reviews loaded:', state.reviews.length);

    // Setup real-time listeners
    console.log('👂 Setting up real-time listeners for admin dashboard...');
    setupRealtimeListeners();

    // Render initial views
    showSection('dashboard');
    setupSettingsHandlers();
  } catch (error) {
    console.error('Failed to initialize dashboard:', error);
  }
}

function setupRealtimeListeners() {
  console.log('📋 Admin: Loading menu items from Firestore...');
  console.log('📦 Admin: Loading orders from Firestore...');

  dbService.onMenuUpdated((items) => {
    console.log('🔄 Admin: Menu updated in real-time:', items.length, 'items');
    state.menuItems = items;
    console.log('✅ Admin: Menu items loaded:', items.length);
    if (state.currentSection === 'menu') {
      renderMenuGrid();
    }
  });

  dbService.onOrdersUpdated((orders) => {
    console.log('🔄 Admin: Orders updated in real-time:', orders.length, 'orders');
    state.orders = orders;
    console.log('✅ Admin: Orders loaded:', orders.length);
    if (state.currentSection === 'orders') {
      renderOrdersList();
    }
  });

  dbService.onCategoriesUpdated((categories) => {
    console.log('🔄 Admin: Categories updated in real-time:', categories.length, 'categories');
    state.categories = categories;
  });
}

async function handleLogout() {
  try {
    const auth = await getAuthInstance();
    await signOut(auth);
    console.log('✅ Logged out');
    
    // Show login, hide dashboard
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('admin-section').classList.add('hidden');
    
    // Clear form
    document.getElementById('admin-login-form').reset();
    document.getElementById('login-error').style.display = 'none';
  } catch (error) {
    console.error('Logout error:', error);
    alert('Error logging out');
  }
}

// ==================== UI MANAGEMENT ====================

function showSection(section, event) {
  if (event) event.preventDefault();
  
  // Check permissions for certain sections
  if (section === 'reviews' || section === 'messages') {
    if (state.currentUserRole !== 'Admin' && state.currentUserRole !== 'Staff B') {
      alert('❌ You do not have permission to manage ' + section);
      return;
    }
  }

  state.currentSection = section;
  
  // Hide all sections
  document.querySelectorAll('[id$="-section"]').forEach(el => {
    el.style.display = 'none';
  });

  // Show selected section
  const sectionId = section + '-section';
  const sectionEl = document.getElementById(sectionId);
  if (sectionEl) {
    sectionEl.style.display = 'block';
  }

  // Update active nav item
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  event?.target?.closest('.nav-item')?.classList.add('active');

  // Load/render section data
  if (section === 'dashboard') {
    renderDashboard();
  } else if (section === 'menu') {
    renderMenuGrid();
  } else if (section === 'orders') {
    renderOrdersList();
  } else if (section === 'reviews') {
    renderReviewsList();
  } else if (section === 'messages') {
    renderMessagesList();
  } else if (section === 'coupons') {
    renderCouponsGrid();
  } else if (section === 'staff') {
    renderStaffTable();
  } else if (section === 'settings') {
    loadSettings();
  }

  // Close sidebar on mobile
  if (window.innerWidth <= 768) {
    document.getElementById('dashboard-sidebar').classList.remove('open');
  }

  sessionStorage.setItem('admin_current_section', section);
}

function toggleSidebar() {
  const sidebar = document.getElementById('dashboard-sidebar');
  sidebar.classList.toggle('open');
}

// ==================== DASHBOARD RENDERING ====================

async function renderDashboard() {
  const dashboardContent = document.getElementById('dashboard-content');
  if (!dashboardContent) return;

  const totalOrders = state.orders.length;
  const totalReviews = state.reviews.length;
  const totalMessages = state.messages?.length || 0;
  const totalRevenue = state.orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const avgRating = state.reviews.length > 0 
    ? (state.reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / state.reviews.length).toFixed(1)
    : 0;

  dashboardContent.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
        <div style="font-size: 12px; opacity: 0.9;">Total Orders</div>
        <div style="font-size: 32px; font-weight: bold; margin-top: 8px;">${totalOrders}</div>
      </div>
      <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
        <div style="font-size: 12px; opacity: 0.9;">Reviews</div>
        <div style="font-size: 32px; font-weight: bold; margin-top: 8px;">${totalReviews}</div>
      </div>
      <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
        <div style="font-size: 12px; opacity: 0.9;">Messages</div>
        <div style="font-size: 32px; font-weight: bold; margin-top: 8px;">${totalMessages}</div>
      </div>
      <div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
        <div style="font-size: 12px; opacity: 0.9;">Avg Rating</div>
        <div style="font-size: 32px; font-weight: bold; margin-top: 8px;">⭐ ${avgRating}</div>
      </div>
    </div>
  `;
}

// ==================== MENU MANAGEMENT ====================

async function renderMenuGrid() {
  const menuContainer = document.getElementById('menu-grid');
  if (!menuContainer) return;

  if (!state.menuItems || state.menuItems.length === 0) {
    menuContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">No menu items yet. Add one to get started!</p>';
    return;
  }

  const html = state.menuItems.map(item => `
    <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: transform 0.2s;">
      ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 100%; height: 200px; object-fit: cover;">` : '<div style="width: 100%; height: 200px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #999;">No image</div>'}
      <div style="padding: 16px;">
        <h3 style="margin: 0 0 8px 0; color: #2d3748;">${item.name}</h3>
        <p style="margin: 0 0 12px 0; color: #666; font-size: 14px;">${item.description || 'No description'}</p>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: #E30613; font-size: 18px;">${item.price} DZD</strong>
          <div style="display: flex; gap: 8px;">
            <button onclick="editMenuItem('${item.id}')" style="padding: 6px 12px; background: #3182ce; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">✏️ Edit</button>
            <button onclick="deleteMenuItem('${item.id}')" style="padding: 6px 12px; background: #e53e3e; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">🗑️ Delete</button>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  menuContainer.innerHTML = html;
}

async function openAddModal() {
  document.getElementById('menu-item-modal').classList.add('active');
  document.getElementById('menu-item-form').reset();
  state.editingItem = null;
}

async function closeModal() {
  document.getElementById('menu-item-modal').classList.remove('active');
  document.getElementById('menu-item-form').reset();
  state.editingItem = null;
}

async function editMenuItem(itemId) {
  const item = state.menuItems.find(m => m.id === itemId);
  if (!item) return;

  state.editingItem = item;
  document.getElementById('menu-name').value = item.name;
  document.getElementById('menu-price').value = item.price;
  document.getElementById('menu-description').value = item.description || '';
  document.getElementById('menu-image-url').value = item.image || '';
  
  state.uploadedImageUrl = item.image;

  document.getElementById('menu-item-modal').classList.add('active');
}

async function deleteMenuItem(itemId) {
  if (!confirm('Are you sure you want to delete this menu item?')) return;

  try {
    await dbService.deleteMenuItem(itemId);
    await loadMenuData();
    renderMenuGrid();
    alert('✅ Menu item deleted successfully!');
  } catch (error) {
    console.error('Error deleting menu item:', error);
    alert('❌ Failed to delete menu item');
  }
}

function clearImage() {
  state.uploadedImageUrl = null;
  document.getElementById('menu-image-url').value = '';
  document.getElementById('image-preview').innerHTML = '';
}

async function saveMenuItem(e) {
  e.preventDefault();

  const name = document.getElementById('menu-name').value.trim();
  const price = parseFloat(document.getElementById('menu-price').value);
  const description = document.getElementById('menu-description').value.trim();
  const image = state.uploadedImageUrl || document.getElementById('menu-image-url').value;

  if (!name || !price) {
    alert('❌ Please fill required fields');
    return;
  }

  try {
    const itemData = { name, price, description, image };

    if (state.editingItem) {
      await dbService.updateMenuItem(state.editingItem.id, itemData);
      alert('✅ Menu item updated successfully!');
    } else {
      await dbService.addMenuItem(itemData);
      alert('✅ Menu item added successfully!');
    }

    await loadMenuData();
    renderMenuGrid();
    closeModal();
  } catch (error) {
    console.error('Error saving menu item:', error);
    alert('❌ Failed to save menu item: ' + error.message);
  }
}

function handleImageUrlInput() {
  const url = document.getElementById('menu-image-url').value.trim();
  if (url) {
    state.uploadedImageUrl = url;
  }
}

function openImgBBUpload() {
  window.open('https://imgbb.com/', '_blank');
}

// ==================== ORDERS MANAGEMENT ====================

async function renderOrdersList() {
  const ordersContainer = document.getElementById('orders-grid');
  if (!ordersContainer) return;

  if (!state.orders || state.orders.length === 0) {
    ordersContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">No orders yet</p>';
    return;
  }

  const filteredOrders = state.orderFilter === 'all' 
    ? state.orders 
    : state.orders.filter(o => o.status === state.orderFilter);

  const html = filteredOrders.map(order => `
    <div onclick="viewOrderDetails('${order.id}')" style="background: white; border-radius: 12px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='translateY(0)'">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
        <div>
          <h4 style="margin: 0; color: #2d3748;">#${order.id?.substring(0, 8)}</h4>
          <p style="margin: 4px 0; color: #666; font-size: 14px;">${order.name || 'N/A'}</p>
        </div>
        <span style="background: ${order.status === 'delivered' ? '#48bb78' : order.status === 'pending' ? '#ed8936' : '#4299e1'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
          ${order.status || 'pending'}
        </span>
      </div>
      <div style="font-size: 14px; color: #666; margin-bottom: 8px;">
        📍 ${order.address || 'No address'}
      </div>
      <div style="font-size: 14px; font-weight: 600; color: #2d3748;">
        Total: ${order.total} DZD
      </div>
    </div>
  `).join('');

  ordersContainer.innerHTML = html;
}

function filterOrdersByStatus(status) {
  state.orderFilter = status;
  renderOrdersList();
}

function filterOrders(event) {
  const searchTerm = event.target.value.toLowerCase();
  state.orders = state.orders.filter(o => 
    o.name?.toLowerCase().includes(searchTerm) ||
    o.phone?.includes(searchTerm) ||
    o.email?.toLowerCase().includes(searchTerm)
  );
  renderOrdersList();
}

async function viewOrderDetails(orderId) {
  const order = state.orders.find(o => o.id === orderId);
  if (!order) return;

  const modal = document.createElement('div');
  modal.id = 'order-details-modal';
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
    z-index: 1000;
  `;

  let locationHtml = '';
  if (order.location && order.location.lat && order.location.lng && window.L) {
    locationHtml = `
      <div style="margin-top: 16px;">
        <h4 style="margin-top: 16px; margin-bottom: 8px;">📍 Delivery Location</h4>
        <div id="order-map-${orderId}" style="width: 100%; height: 200px; border-radius: 8px; border: 2px solid #e0e0e0;"></div>
        <p style="font-size: 12px; color: #666; margin-top: 8px;">
          Latitude: ${order.location.lat.toFixed(4)}<br>
          Longitude: ${order.location.lng.toFixed(4)}
        </p>
      </div>
    `;
  }

  modal.innerHTML = `
    <div style="background: white; border-radius: 12px; padding: 24px; max-width: 600px; max-height: 80vh; overflow-y: auto; width: 90%;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #2d3748;">Order #${order.id?.substring(0, 8)}</h2>
        <button onclick="document.getElementById('order-details-modal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer;">✕</button>
      </div>

      <div style="background: #f7fafc; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div>
            <p style="margin: 0; color: #666; font-size: 12px;">Customer Name</p>
            <p style="margin: 4px 0 0 0; color: #2d3748; font-weight: 600;">${order.name || 'N/A'}</p>
          </div>
          <div>
            <p style="margin: 0; color: #666; font-size: 12px;">Phone</p>
            <p style="margin: 4px 0 0 0; color: #2d3748; font-weight: 600;">${order.phone || 'N/A'}</p>
          </div>
          <div>
            <p style="margin: 0; color: #666; font-size: 12px;">Email</p>
            <p style="margin: 4px 0 0 0; color: #2d3748; font-weight: 600;">${order.email || 'N/A'}</p>
          </div>
          <div>
            <p style="margin: 0; color: #666; font-size: 12px;">Status</p>
            <select onchange="updateOrderStatus('${order.id}', this.value)" style="margin-top: 4px; padding: 6px; border: 1px solid #ddd; border-radius: 4px; width: 100%;">
              <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
              <option value="in-progress" ${order.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
              <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
              <option value="refused" ${order.status === 'refused' ? 'selected' : ''}>Refused</option>
            </select>
          </div>
        </div>
      </div>

      <h4 style="margin-top: 16px; margin-bottom: 12px; color: #2d3748;">Items</h4>
      <div style="background: #f7fafc; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
        ${order.items?.map(item => `
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>${item.name} x ${item.qty}</span>
            <strong>${(item.price * item.qty).toFixed(2)} DZD</strong>
          </div>
        `).join('') || '<p style="color: #999;">No items</p>'}
      </div>

      <h4 style="margin-top: 16px; margin-bottom: 12px; color: #2d3748;">Pricing</h4>
      <div style="background: linear-gradient(135deg, #FFF5F5, #FFE8E8); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span>Subtotal:</span>
          <strong>${order.subtotal || 0} DZD</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span>Delivery Fee:</span>
          <strong>${order.deliveryFee || 0} DZD</strong>
        </div>
        <div style="border-top: 2px solid rgba(0,0,0,0.1); padding-top: 8px; display: flex; justify-content: space-between;">
          <span style="font-weight: 600;">Total:</span>
          <strong style="color: #E30613; font-size: 18px;">${order.total || 0} DZD</strong>
        </div>
      </div>

      ${order.specialInstructions ? `
        <h4 style="margin-top: 16px; margin-bottom: 8px; color: #2d3748;">Special Instructions</h4>
        <p style="background: #f7fafc; padding: 12px; border-radius: 8px; color: #2d3748;">${order.specialInstructions}</p>
      ` : ''}

      ${locationHtml}

      <div style="display: flex; gap: 12px; margin-top: 20px;">
        <button onclick="quickDeleteOrder('${order.id}')" style="flex: 1; padding: 12px; background: #e53e3e; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">🗑️ Delete Order</button>
        <button onclick="document.getElementById('order-details-modal').remove()" style="flex: 1; padding: 12px; background: #cbd5e0; color: #2d3748; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Close</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Initialize map if location exists
  if (order.location && order.location.lat && order.location.lng && window.L) {
    setTimeout(() => {
      const mapElement = document.getElementById(`order-map-${orderId}`);
      if (mapElement) {
        const map = L.map(mapElement).setView([order.location.lat, order.location.lng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap',
          maxZoom: 19
        }).addTo(map);

        const redIcon = L.divIcon({
          className: 'custom-marker',
          html: '<div style="background:#E30613;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        L.marker([order.location.lat, order.location.lng], { icon: redIcon }).addTo(map);
        
        setTimeout(() => {
          map.invalidateSize();
        }, 100);
      }
    }, 100);
  }
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    await dbService.updateOrder(orderId, { status: newStatus });
    const order = state.orders.find(o => o.id === orderId);
    if (order) order.status = newStatus;
    alert('✅ Order status updated!');
  } catch (error) {
    console.error('Error updating order status:', error);
    alert('❌ Failed to update status');
  }
}

async function deleteOrder(orderId) {
  if (!confirm('Are you sure you want to delete this order?')) return;

  try {
    await dbService.deleteOrder(orderId);
    state.orders = state.orders.filter(o => o.id !== orderId);
    renderOrdersList();
    alert('✅ Order deleted successfully!');
  } catch (error) {
    console.error('Error deleting order:', error);
    alert('❌ Failed to delete order');
  }
}

async function quickDeleteOrder(orderId) {
  if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) return;

  try {
    await dbService.deleteOrder(orderId);
    state.orders = state.orders.filter(o => o.id !== orderId);
    document.getElementById('order-details-modal').remove();
    renderOrdersList();
    alert('✅ Order deleted successfully!');
  } catch (error) {
    console.error('Error deleting order:', error);
    alert('❌ Failed to delete order');
  }
}

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

  try {
    await dbService.addCategory({ id: categoryId, name: categoryName });
    await loadCategoriesData();
    document.getElementById('category-form').reset();
    renderCategoriesList();
    alert('✅ Category added successfully!');
  } catch (error) {
    console.error('Error adding category:', error);
    alert('❌ Failed to add category: ' + error.message);
  }
}

async function deleteCategory(categoryId) {
  if (!confirm('Are you sure you want to delete this category?')) return;

  try {
    await dbService.deleteCategory(categoryId);
    await loadCategoriesData();
    renderCategoriesList();
    alert('✅ Category deleted successfully!');
  } catch (error) {
    console.error('Error deleting category:', error);
    alert('❌ Failed to delete category');
  }
}

function renderCategoriesList() {
  const list = document.getElementById('categories-list');
  if (!list) return;

  const html = state.categories.map(cat => `
    <div style="background: white; padding: 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <div>
        <p style="margin: 0; font-weight: 600; color: #2d3748;">${cat.name}</p>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">ID: ${cat.id}</p>
      </div>
      <button onclick="deleteCategory('${cat.id}')" style="padding: 6px 12px; background: #e53e3e; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">🗑️ Delete</button>
    </div>
  `).join('');

  list.innerHTML = html || '<p style="text-align: center; color: #999;">No categories yet</p>';
}

function filterMenuByCategory(category) {
  state.menuFilter = category;
  renderMenuGrid();
}

// ==================== STAFF MANAGEMENT ====================

function openAddStaffModal() {
  document.getElementById('staff-modal').classList.add('active');
  document.getElementById('staff-form').reset();
}

function closeAddStaffModal() {
  document.getElementById('staff-modal').classList.remove('active');
  document.getElementById('staff-form').reset();
}

async function saveStaffMember(e) {
  e.preventDefault();

  const staffId = document.getElementById('staff-id').value.trim().toLowerCase();
  const staffName = document.getElementById('staff-name').value.trim();
  const staffRole = document.getElementById('staff-role').value;

  if (!staffId || !staffName || !staffRole) {
    alert('❌ Please fill all fields');
    return;
  }

  try {
    const staffData = {
      id: staffId,
      name: staffName,
      role: staffRole,
      email: staffId
    };

    await dbService.addStaff(staffData);
    await loadStaffData();
    document.getElementById('staff-form').reset();
    closeAddStaffModal();
    renderStaffTable();
    alert('✅ Staff member added successfully!');
  } catch (error) {
    console.error('Error saving staff:', error);
    alert('❌ Failed to save staff member: ' + error.message);
  }
}

async function deleteStaff(staffId) {
  if (!confirm('Are you sure you want to delete this staff member?')) return;

  try {
    await dbService.deleteStaff(staffId);
    await loadStaffData();
    renderStaffTable();
    alert('✅ Staff member deleted successfully!');
  } catch (error) {
    console.error('Error deleting staff:', error);
    alert('❌ Failed to delete staff member');
  }
}

function renderStaffTable() {
  const table = document.getElementById('staff-table');
  if (!table) return;

  if (!state.staff || state.staff.length === 0) {
    table.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No staff members yet</p>';
    return;
  }

  const html = `
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background: #f7fafc; border-bottom: 2px solid #e2e8f0;">
          <th style="padding: 12px; text-align: left; color: #2d3748; font-weight: 600;">Name</th>
          <th style="padding: 12px; text-align: left; color: #2d3748; font-weight: 600;">Email</th>
          <th style="padding: 12px; text-align: left; color: #2d3748; font-weight: 600;">Role</th>
          <th style="padding: 12px; text-align: left; color: #2d3748; font-weight: 600;">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${state.staff.map(staff => `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px; color: #2d3748;">${staff.name}</td>
            <td style="padding: 12px; color: #666;">${staff.email}</td>
            <td style="padding: 12px;">
              <span style="background: ${staff.role === 'Admin' ? '#e53e3e' : staff.role === 'Staff A' ? '#3182ce' : '#48bb78'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                ${staff.role}
              </span>
            </td>
            <td style="padding: 12px;">
              <button onclick="deleteStaff('${staff.id}')" style="padding: 6px 12px; background: #e53e3e; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">🗑️ Delete</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  table.innerHTML = html;
}

// ==================== MESSAGES MANAGEMENT ====================

async function renderMessagesList() {
  const container = document.getElementById('messages-list');
  if (!container) return;

  if (!state.messages || state.messages.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#999;padding:40px;">No contact messages yet</p>';
    return;
  }

  const totalCount = document.getElementById('total-messages');
  if (totalCount) totalCount.textContent = state.messages.length;

  const html = state.messages.map((message) => {
    const date = message.createdAt ? new Date(message.createdAt.toDate ? message.createdAt.toDate() : message.createdAt).toLocaleDateString() : 'N/A';
    const time = message.createdAt ? new Date(message.createdAt.toDate ? message.createdAt.toDate() : message.createdAt).toLocaleTimeString() : 'N/A';

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
  // Permission check: Only Admin and Staff B can delete messages
  if (state.currentUserRole !== 'Admin' && state.currentUserRole !== 'Staff B') {
    alert('❌ Only Admin and Staff B can delete messages. Your role: ' + state.currentUserRole);
    console.warn('⛔ User role', state.currentUserRole, 'not authorized to delete messages');
    return;
  }
  
  if (!confirm('Are you sure you want to delete this message?')) return;
  
  try {
    await dbService.deleteContactMessage(messageId);
    await loadMessages();
    alert('✅ Message deleted successfully!');
  } catch (error) {
    console.error('❌ Failed to delete message:', error);
    alert('❌ Failed to delete message: ' + error.message);
  }
}

// ==================== REVIEWS MANAGEMENT ====================

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
  // Permission check: Only Admin and Staff B can delete reviews
  if (state.currentUserRole !== 'Admin' && state.currentUserRole !== 'Staff B') {
    alert('❌ Only Admin and Staff B can delete reviews. Your role: ' + state.currentUserRole);
    console.warn('⛔ User role', state.currentUserRole, 'not authorized to delete reviews');
    return;
  }
  
  if (!confirm('Are you sure you want to delete this review?')) return;
  
  try {
    await dbService.deleteReview(reviewId);
    await loadReviews();
    alert('✅ Review deleted successfully!');
  } catch (error) {
    console.error('❌ Failed to delete review:', error);
    alert('❌ Failed to delete review: ' + error.message);
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
        showStyledAlert('Saved', 'Operating hours saved successfully!');
      } catch (error) {
        console.error('❌ Failed to save hours:', error);
        showStyledAlert('Error', 'Failed to save hours: ' + error.message);
      }
    });
  }
}

function showStyledAlert(title, message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    z-index: 10000;
    font-weight: 600;
    font-size: 14px;
    max-width: 400px;
    font-size: 14px;
    font-weight: 500;
    animation: slideIn 0.3s ease-out;
  `;
  notification.innerHTML = `<strong>${title}:</strong> ${message}`;
  document.body.appendChild(notification);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 5000);
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
  window.quickDeleteOrder = quickDeleteOrder;
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
  window.deleteMessage = deleteMessage;
  window.deleteFeedback = deleteFeedback;
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

  try {
    await dbService.addCategory({ id: categoryId, name: categoryName });
    await loadCategoriesData();
    document.getElementById('category-form').reset();
    renderCategoriesList();
    alert('✅ Category added successfully!');
  } catch (error) {
    console.error('Error adding category:', error);
    alert('❌ Failed to add category: ' + error.message);
  }
}

async function deleteCategory(categoryId) {
  if (!confirm('Are you sure you want to delete this category?')) return;

  try {
    await dbService.deleteCategory(categoryId);
    await loadCategoriesData();
    renderCategoriesList();
    alert('✅ Category deleted successfully!');
  } catch (error) {
    console.error('Error deleting category:', error);
    alert('❌ Failed to delete category');
  }
}

function renderCategoriesList() {
  const list = document.getElementById('categories-list');
  if (!list) return;

  const html = state.categories.map(cat => `
    <div style="background: white; padding: 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <div>
        <p style="margin: 0; font-weight: 600; color: #2d3748;">${cat.name}</p>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">ID: ${cat.id}</p>
      </div>
      <button onclick="deleteCategory('${cat.id}')" style="padding: 6px 12px; background: #e53e3e; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">🗑️ Delete</button>
    </div>
  `).join('');

  list.innerHTML = html || '<p style="text-align: center; color: #999;">No categories yet</p>';
}

function filterMenuByCategory(category) {
  state.menuFilter = category;
  renderMenuGrid();
}

// ==================== COUPON MANAGEMENT ====================

async function openAddCouponModal() {
  document.getElementById('coupon-modal').classList.add('active');
  document.getElementById('coupon-form').reset();
  state.editingCoupon = null;
}

async function editCoupon(couponId) {
  const coupon = state.coupons.find(c => c.id === couponId);
  if (!coupon) return;

  state.editingCoupon = coupon;
  document.getElementById('coupon-code').value = coupon.code;
  document.getElementById('coupon-discount').value = coupon.discount;
  document.getElementById('coupon-type').value = coupon.type;
  
  document.getElementById('coupon-modal').classList.add('active');
}

async function saveCoupon(e) {
  e.preventDefault();

  const code = document.getElementById('coupon-code').value.trim().toUpperCase();
  const discount = parseFloat(document.getElementById('coupon-discount').value);
  const type = document.getElementById('coupon-type').value;

  if (!code || !discount || !type) {
    alert('❌ Please fill all fields');
    return;
  }

  const saveBtn = e.target.querySelector('button[type="submit"]');
  saveBtn.disabled = true;
  saveBtn.textContent = '⏳ Saving...';

  try {
    const couponData = { code, discount, type };

    if (state.editingCoupon) {
      await dbService.updateCoupon(state.editingCoupon.id, couponData);
      alert('✅ Coupon updated successfully!');
    } else {
      await dbService.addCoupon(couponData);
      alert('✅ Coupon added successfully!');
    }

    await loadCouponsData();
    renderCouponsGrid();
    closeCouponModal();
  } catch (error) {
    console.error('Error saving coupon:', error);
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
    await loadCouponsData();
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

function renderCouponsGrid() {
  const container = document.getElementById('coupons-grid');
  if (!container) return;

  if (!state.coupons || state.coupons.length === 0) {
    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">No coupons yet. Add one to get started!</p>';
    return;
  }

  const html = state.coupons.map(coupon => `
    <div style="background: white; border-radius: 12px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <div style="margin-bottom: 12px;">
        <h4 style="margin: 0 0 8px 0; color: #2d3748; font-family: monospace; font-size: 18px;">${coupon.code}</h4>
        <p style="margin: 0; color: #666; font-size: 14px;">
          ${coupon.type === 'percentage' ? coupon.discount + '%' : coupon.discount + ' DZD'} off
        </p>
      </div>
      <div style="display: flex; gap: 8px;">
        <button onclick="editCoupon('${coupon.id}')" style="flex: 1; padding: 8px; background: #3182ce; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">✏️ Edit</button>
        <button onclick="deleteCoupon('${coupon.id}')" style="flex: 1; padding: 8px; background: #e53e3e; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">🗑️ Delete</button>
      </div>
    </div>
  `).join('');

  container.innerHTML = html;
}

function renderCustomersTable() {
  const table = document.getElementById('customers-table');
  if (!table) return;

  if (!state.customers || state.customers.length === 0) {
    table.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No customers yet</p>';
    return;
  }

  const html = `
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background: #f7fafc; border-bottom: 2px solid #e2e8f0;">
          <th style="padding: 12px; text-align: left; color: #2d3748; font-weight: 600;">Name</th>
          <th style="padding: 12px; text-align: left; color: #2d3748; font-weight: 600;">Email</th>
          <th style="padding: 12px; text-align: left; color: #2d3748; font-weight: 600;">Phone</th>
          <th style="padding: 12px; text-align: left; color: #2d3748; font-weight: 600;">Orders</th>
        </tr>
      </thead>
      <tbody>
        ${state.customers.map(customer => `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px; color: #2d3748;">${customer.name}</td>
            <td style="padding: 12px; color: #666;">${customer.email}</td>
            <td style="padding: 12px; color: #2d3748;">${customer.phone}</td>
            <td style="padding: 12px; color: #2d3748;">${customer.orderCount || 0}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  table.innerHTML = html;
}

// ==================== EXPOSE FUNCTIONS GLOBALLY FOR HTML EVENT HANDLERS ====================

// Make all functions available globally for onclick/onchange/onsubmit handlers
window.toggleSidebar = toggleSidebar;
window.showSection = showSection;
window.handleAdminLogout = handleAdminLogout;
window.openAddModal = openAddModal;
window.closeModal = closeModal;
window.editMenuItem = editMenuItem;
window.deleteMenuItem = deleteMenuItem;
window.filterOrdersByStatus = filterOrdersByStatus;
window.filterOrders = filterOrders;
window.viewOrderDetails = viewOrderDetails;
window.openCategoryModal = openCategoryModal;
window.closeCategoryModal = closeCategoryModal;
window.addCategory = addCategory;
window.deleteCategory = deleteCategory;
window.filterMenuByCategory = filterMenuByCategory;
window.handleImageUrlInput = handleImageUrlInput;
window.openImgBBUpload = openImgBBUpload;
window.clearImage = clearImage;
window.resetImageUpload = resetImageUpload;
window.saveMenuItem = saveMenuItem;
window.saveStaffMember = saveStaffMember;
window.openAddStaffModal = openAddStaffModal;
window.closeAddStaffModal = closeAddStaffModal;
window.deleteStaff = deleteStaff;
window.deleteMessage = deleteMessage;
window.deleteFeedback = deleteFeedback;
window.handleLogin = handleLogin;
window.initializeDashboard = initializeDashboard;
window.setupSettingsHandlers = setupSettingsHandlers;
