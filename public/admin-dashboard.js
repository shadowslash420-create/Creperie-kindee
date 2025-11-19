/* ==================== CREPERIE KINDER ADMIN DASHBOARD ==================== */
/* Rebuilt from scratch with ImgBB integration and menu_data.json support */

import { getAuthInstance } from './firebase-config.js';
import {signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import dbService from './db-service.js';

// ==================== STATE MANAGEMENT ====================
const state = {
  currentSection: 'dashboard',
  currentUser: null,
  menuItems: [],
  orders: [],
  categories: [],
  selectedImage: null,
  uploadedImageUrl: null,
  editingItem: null,
  menuFilter: 'all',
  orderFilter: 'all'
};

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
    showSection('dashboard');
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

  // Update page title
  const titles = {
    dashboard: 'Dashboard',
    orders: 'Orders Management',
    menu: 'Menu Management',
    analytics: 'Analytics & Reports'
  };
  document.getElementById('page-title').textContent = titles[section];

  // Load section data
  if (section === 'dashboard') loadDashboard();
  else if (section === 'orders') loadOrders();
  else if (section === 'menu') loadMenu();
  else if (section === 'analytics') loadAnalytics();
}

function toggleSidebar() {
  const sidebar = document.getElementById('dashboard-sidebar');
  sidebar.classList.toggle('active');
}

// ==================== DASHBOARD SECTION ====================

async function loadDashboard() {
  try {
    await Promise.all([loadMenuData(), loadOrdersData()]);
    updateDashboardStats();
    renderRecentOrders();
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
  const pending = state.orders.filter(o => o.status === 'pending').length;
  const completed = todayOrders.filter(o => o.status === 'delivered').length;

  document.getElementById('stat-revenue').textContent = todayRevenue.toFixed(2) + ' DZD';
  document.getElementById('stat-total-orders').textContent = state.orders.length;
  document.getElementById('stat-pending').textContent = pending;
  document.getElementById('stat-completed').textContent = completed;
}

function renderRecentOrders() {
  const container = document.getElementById('recent-orders-table');
  const recentOrders = state.orders.slice(0, 5);

  if (recentOrders.length === 0) {
    container.innerHTML = '<p style="padding: 20px; text-align: center; color: #666;">No orders yet</p>';
    return;
  }

  const html = `
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background: #f7fafc; text-align: left;">
          <th style="padding: 12px;">Order ID</th>
          <th style="padding: 12px;">Customer</th>
          <th style="padding: 12px;">Total</th>
          <th style="padding: 12px;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${recentOrders.map(order => `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px;">#${order.id || 'N/A'}</td>
            <td style="padding: 12px;">${order.customerName || 'Anonymous'}</td>
            <td style="padding: 12px; font-weight: 600;">${(order.total || 0).toFixed(2)} DZD</td>
            <td style="padding: 12px;">
              <span style="padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; 
                background: ${getStatusColor(order.status)};">
                ${order.status || 'pending'}
              </span>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  container.innerHTML = html;
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
    'pending': '#FFF3CD',
    'in-progress': '#D1ECF1',
    'delivered': '#D4EDDA',
    'cancelled': '#F8D7DA'
  };
  return colors[status] || '#E2E8F0';
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
      (o.id || '').toString().includes(searchTerm)
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = '<p style="padding: 40px; text-align: center; color: #666;">No orders found</p>';
    return;
  }

  const html = `
    <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
      <thead>
        <tr style="background: #f7fafc; text-align: left;">
          <th style="padding: 16px;">Order ID</th>
          <th style="padding: 16px;">Customer</th>
          <th style="padding: 16px;">Phone</th>
          <th style="padding: 16px;">Items</th>
          <th style="padding: 16px;">Total</th>
          <th style="padding: 16px;">Status</th>
          <th style="padding: 16px;">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${filtered.map(order => `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 16px; font-weight: 600;">#${order.id || 'N/A'}</td>
            <td style="padding: 16px;">${order.customerName || 'Anonymous'}</td>
            <td style="padding: 16px;">${order.customerPhone || '-'}</td>
            <td style="padding: 16px;">${(order.items || []).length} items</td>
            <td style="padding: 16px; font-weight: 600;">${(order.total || 0).toFixed(2)} DZD</td>
            <td style="padding: 16px;">
              <select onchange="updateOrderStatus('${order.id}', this.value)" 
                style="padding: 6px 12px; border: 1px solid #cbd5e0; border-radius: 6px; background: white;">
                <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                <option value="in-progress" ${order.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
              </select>
            </td>
            <td style="padding: 16px;">
              <button onclick="deleteOrder('${order.id}')" 
                style="padding: 6px 12px; background: #e53e3e; color: white; border: none; border-radius: 6px; cursor: pointer;">
                🗑️ Delete
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  container.innerHTML = html;
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    console.log('📝 Updating order status:', orderId, 'to', newStatus);
    await dbService.updateOrderStatus(orderId, newStatus);
    await loadOrdersData();
    renderOrdersTable();
    loadDashboard();
  } catch (error) {
    console.error('❌ Failed to update order status:', error);
    alert('Failed to update order status: ' + error.message);
  }
}

async function deleteOrder(orderId) {
  if (!confirm('Are you sure you want to delete this order?')) return;

  try {
    console.log('🗑️ Deleting order:', orderId);
    await dbService.deleteOrder(orderId);
    await loadOrdersData();
    renderOrdersTable();
    loadDashboard();
  } catch (error) {
    console.error('❌ Failed to delete order:', error);
    alert('Failed to delete order: ' + error.message);
  }
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
  
  // Show preview
  document.getElementById('image-url-input-container').style.display = 'none';
  document.getElementById('image-preview-container').style.display = 'block';
  document.getElementById('image-preview-img').src = url;
  document.getElementById('image-upload-area').style.borderColor = '#48bb78';
  
  console.log('✅ Image URL set:', url);
}

function resetImageUpload() {
  state.uploadedImageUrl = null;

  const urlInput = document.getElementById('image-url-input');
  if (urlInput) urlInput.value = '';

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

  document.getElementById('total-revenue').textContent = totalRevenue.toFixed(2) + ' DZD';
  document.getElementById('avg-order').textContent = avgOrder.toFixed(2) + ' DZD';
  document.getElementById('best-day').textContent = '-';

  // Popular items
  const popularContainer = document.getElementById('popular-items');
  const topItems = state.menuItems.slice(0, 5);

  if (topItems.length === 0) {
    popularContainer.innerHTML = '<p style="color: #666;">No menu items yet</p>';
  } else {
    popularContainer.innerHTML = topItems.map((item, index) => `
      <div style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
        <p style="margin: 0; font-weight: 600;">${index + 1}. ${item.name}</p>
        <p style="margin: 4px 0 0 0; color: #666; font-size: 14px;">${item.price} DZD</p>
      </div>
    `).join('');
  }
}

// ==================== INITIALIZATION ====================

async function initializeDashboard() {
  try {
    await dbService.init();
    await Promise.all([loadMenuData(), loadOrdersData(), loadCategories()]);
    setupCategoryManagement();
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
      renderRecentOrders();
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

// Update the manage categories button handler
function setupCategoryManagement() {
  const manageCategoriesBtn = document.querySelector('button[onclick*="Manage Categories"]');
  if (manageCategoriesBtn) {
    manageCategoriesBtn.onclick = openCategoryModal;
  }
}