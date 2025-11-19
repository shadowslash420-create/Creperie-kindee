/* ==================== CREPERIE KINDER ADMIN DASHBOARD ==================== */
/* Rebuilt from scratch with ImgBB integration and menu_data.json support */

import { getAuthInstance } from './firebase-config.js';
import { signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

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
    const response = await fetch('/api/menu');
    const data = await response.json();
    state.menuItems = data;
    return data;
  } catch (error) {
    console.error('Failed to load menu data:', error);
    // Fallback to local JSON
    try {
      const fallbackResponse = await fetch('/menu_data.json');
      const fallbackData = await fallbackResponse.json();
      state.menuItems = fallbackData;
      return fallbackData;
    } catch (fallbackError) {
      console.error('Failed to load fallback menu data:', fallbackError);
      return [];
    }
  }
}

async function saveMenuData(menuData) {
  try {
    const response = await fetch('/api/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(menuData)
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to save menu data:', error);
    throw error;
  }
}

async function loadOrdersData() {
  try {
    const response = await fetch('/api/orders');
    const data = await response.json();
    state.orders = data || [];
    return data;
  } catch (error) {
    console.error('Failed to load orders:', error);
    return [];
  }
}

async function saveOrdersData(ordersData) {
  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ordersData)
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to save orders:', error);
    throw error;
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
    const orderIndex = state.orders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
      state.orders[orderIndex].status = newStatus;
      await saveOrdersData(state.orders);
      loadDashboard();
    }
  } catch (error) {
    console.error('Failed to update order status:', error);
    alert('Failed to update order status');
  }
}

async function deleteOrder(orderId) {
  if (!confirm('Are you sure you want to delete this order?')) return;

  try {
    state.orders = state.orders.filter(o => o.id !== orderId);
    await saveOrdersData(state.orders);
    renderOrdersTable();
    loadDashboard();
  } catch (error) {
    console.error('Failed to delete order:', error);
    alert('Failed to delete order');
  }
}

// ==================== MENU SECTION ====================

async function loadMenu() {
  try {
    await loadMenuData();
    loadCategories();
    renderCategoryFilters();
    renderMenuGrid();
  } catch (error) {
    console.error('Failed to load menu:', error);
  }
}

function loadCategories() {
  const uniqueCategories = [...new Set(state.menuItems.map(item => item.category))];
  state.categories = uniqueCategories.map(cat => ({
    id: cat,
    name: cat.charAt(0).toUpperCase() + cat.slice(1)
  }));
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
      id: itemId || 'c' + Date.now(),
      name: itemName,
      price: itemPrice,
      desc: itemDesc,
      category: itemCategory,
      img: imageUrl
    };

    if (itemId) {
      // Update existing item
      const index = state.menuItems.findIndex(i => i.id === itemId);
      if (index !== -1) {
        state.menuItems[index] = itemData;
      }
    } else {
      // Add new item
      state.menuItems.push(itemData);
    }

    await saveMenuData(state.menuItems);
    closeModal();
    loadMenu();
    alert('✅ Menu item saved successfully!');
  } catch (error) {
    console.error('Failed to save item:', error);
    alert('❌ Failed to save menu item');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = '💾 Save Item';
  }
}

async function deleteMenuItem(itemId) {
  if (!confirm('Are you sure you want to delete this menu item?')) return;

  try {
    state.menuItems = state.menuItems.filter(i => i.id !== itemId);
    await saveMenuData(state.menuItems);
    loadMenu();
    alert('✅ Menu item deleted successfully!');
  } catch (error) {
    console.error('Failed to delete item:', error);
    alert('❌ Failed to delete menu item');
  }
}

function closeModal() {
  document.getElementById('menu-item-modal').classList.remove('active');
  state.editingItem = null;
  state.uploadedImageUrl = null;
  state.selectedImage = null;
  resetImageUpload();
}

// ==================== IMAGE UPLOAD (ImgBB Integration) ====================

function handleImageSelect(event) {
  const file = event.target.files[0];
  console.log('📸 Image selected:', file ? file.name : 'None');

  if (!file) {
    resetImageUpload();
    return;
  }

  if (!file.type.startsWith('image/')) {
    alert('❌ Please select an image file (JPG, PNG, WebP)');
    event.target.value = '';
    resetImageUpload();
    return;
  }

  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  if (file.size > MAX_SIZE) {
    alert('❌ Image too large! Maximum size is 5MB');
    event.target.value = '';
    resetImageUpload();
    return;
  }

  state.selectedImage = file;
  console.log('✅ File validated, showing preview...');

  const reader = new FileReader();
  reader.onload = async (e) => {
    console.log('✅ File read successfully, updating UI...');

    document.getElementById('upload-placeholder').style.display = 'none';
    document.getElementById('image-preview-container').style.display = 'block';
    document.getElementById('image-preview-img').src = e.target.result;
    document.getElementById('image-upload-area').style.borderColor = '#48bb78';

    try {
      console.log('🚀 Starting upload to ImgBB...');
      await uploadToImgBB();
    } catch (error) {
      console.error('❌ Upload failed:', error);
      alert('⚠️ Failed to upload image, but you can continue and save');
    }
  };

  reader.onerror = (error) => {
    console.error('❌ Error reading file:', error);
    alert('❌ Failed to read file');
    resetImageUpload();
  };

  console.log('📖 Starting to read file...');
  reader.readAsDataURL(file);
}

async function uploadToImgBB() {
  if (!state.selectedImage) {
    console.log('⚠️ No file selected for upload');
    return false;
  }

  const uploadProgress = document.getElementById('upload-progress');
  const uploadSuccess = document.getElementById('upload-success');
  const progressBar = document.getElementById('progress-bar');
  const uploadText = document.getElementById('upload-text');

  try {
    uploadProgress.style.display = 'block';
    uploadSuccess.style.display = 'none';
    progressBar.style.width = '10%';
    uploadText.textContent = '📤 Preparing...';

    console.log('📤 Starting upload to ImgBB...', {
      fileName: state.selectedImage.name,
      fileSize: state.selectedImage.size,
      fileType: state.selectedImage.type
    });

    progressBar.style.width = '30%';
    uploadText.textContent = '📤 Converting image...';

    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result.split(',')[1];
        console.log('✅ Image converted to base64, length:', base64String.length);
        resolve(base64String);
      };
      reader.onerror = (error) => {
        console.error('❌ FileReader error:', error);
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(state.selectedImage);
    });

    progressBar.style.width = '50%';
    uploadText.textContent = 'Uploading to ImgBB...';

    const formData = new FormData();
    formData.append('image', base64);
    formData.append('folder', 'menu');
    formData.append('filename', state.selectedImage.name.replace(/\.[^/.]+$/, ''));

    console.log('📤 Sending request to /api/upload-image...');

    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData
    });

    progressBar.style.width = '80%';

    console.log('📡 Response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Server error response:', errorText);
      throw new Error(`Upload failed (${response.status})`);
    }

    const result = await response.json();
    console.log('📦 Response data:', result);

    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }

    progressBar.style.width = '100%';
    state.uploadedImageUrl = result.url;

    console.log('✅ Image uploaded successfully:', state.uploadedImageUrl);

    setTimeout(() => {
      uploadProgress.style.display = 'none';
      uploadSuccess.style.display = 'block';
    }, 500);

    return true;
  } catch (error) {
    console.error('❌ Upload failed:', error);

    uploadProgress.style.display = 'none';
    uploadSuccess.style.display = 'block';
    uploadSuccess.style.color = '#e53e3e';
    uploadSuccess.textContent = '⚠️ Upload failed - you can continue and save';

    console.log('⚠️ Upload failed but allowing user to continue with local preview');
    return false;
  }
}

function resetImageUpload() {
  state.selectedImage = null;
  state.uploadedImageUrl = null;

  const fileInput = document.getElementById('item-image');
  if (fileInput) fileInput.value = '';

  document.getElementById('upload-placeholder').style.display = 'block';
  document.getElementById('image-preview-container').style.display = 'none';
  document.getElementById('image-preview-img').src = '';
  document.getElementById('upload-progress').style.display = 'none';
  document.getElementById('upload-success').style.display = 'none';
  document.getElementById('progress-bar').style.width = '0%';
  document.getElementById('image-upload-area').style.borderColor = '#cbd5e0';

  document.getElementById('upload-placeholder').innerHTML = `
    <div style="font-size: 48px; margin-bottom: 12px;">📸</div>
    <p style="color: #4a5568; font-weight: 500; margin-bottom: 8px;">Click to upload image</p>
    <p style="color: #718096; font-size: 13px;">Supports: JPG, PNG, WebP (Max 5MB)</p>
    <p style="color: #FF6B35; font-size: 12px; margin-top: 8px;">✨ Images uploaded to ImgBB cloud storage</p>
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
    await Promise.all([loadMenuData(), loadOrdersData()]);
    loadCategories();
  } catch (error) {
    console.error('Failed to initialize dashboard:', error);
  }
}

// ==================== EVENT LISTENERS ====================

document.addEventListener('DOMContentLoaded', () => {
  // Login form
  document.getElementById('admin-login-form')?.addEventListener('submit', handleLogin);

  // Image upload
  document.getElementById('item-image')?.addEventListener('change', handleImageSelect);

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
});
