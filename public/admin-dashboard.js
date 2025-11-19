/* Admin Dashboard - Rebuilt from Scratch */

import { getAuthInstance } from './firebase-config.js';
import {signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// State management
const state = {
  currentSection: 'dashboard',
  currentFilter: 'all',
  currentUser: null,
  menuFilter: 'all',
  editingItem: null,
  selectedImage: null,
  uploadedImageUrl: null,
  categories: []
};

// ==================== AUTHENTICATION ====================

async function adminLogin(event) {
  event.preventDefault();
  const email = document.getElementById('adm-user').value;
  const password = document.getElementById('adm-pass').value;
  const loginBtn = document.getElementById('admin-login-btn');
  const errorDiv = document.getElementById('login-error');

  loginBtn.disabled = true;
  loginBtn.textContent = 'Logging in...';
  errorDiv.style.display = 'none';

  try {
    const auth = await getAuthInstance();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    state.currentUser = userCredential.user;

    localStorage.setItem('kc_admin', 'true');
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('admin-section').classList.remove('hidden');

    const lastSection = localStorage.getItem('kc_current_section') || 'dashboard';
    showSection(lastSection);
  } catch (error) {
    console.error('Login failed:', error);
    errorDiv.textContent = getErrorMessage(error.code);
    errorDiv.style.display = 'block';
    loginBtn.disabled = false;
    loginBtn.textContent = 'Login';
  }
}

function getErrorMessage(code) {
  const messages = {
    'auth/invalid-email': 'Invalid email address',
    'auth/user-disabled': 'This account has been disabled',
    'auth/user-not-found': 'No account found with this email',
    'auth/wrong-password': 'Incorrect password',
    'auth/invalid-credential': 'Invalid email or password',
    'auth/too-many-requests': 'Too many failed attempts. Try again later.'
  };
  return messages[code] || 'Login failed. Please check your credentials.';
}

async function adminLogout() {
  try {
    const auth = await getAuthInstance();
    await signOut(auth);
    state.currentUser = null;
    localStorage.removeItem('kc_admin');
    localStorage.removeItem('kc_current_section');
    localStorage.removeItem('kc_current_filter');
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Logout failed:', error);
    window.location.href = 'index.html';
  }
}

// ==================== NAVIGATION ====================

function showSection(section) {
  state.currentSection = section;
  localStorage.setItem('kc_current_section', section);

  // Update nav items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    const navText = item.textContent.trim().toLowerCase();
    if (navText.includes(section.toLowerCase())) {
      item.classList.add('active');
    }
  });

  // Update content sections
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

  // Close sidebar on mobile
  if (window.innerWidth <= 768) closeSidebar();
}

function toggleSidebar() {
  const sidebar = document.getElementById('dashboard-sidebar');
  sidebar.classList.toggle('active');

  let overlay = document.getElementById('sidebar-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'sidebar-overlay';
    overlay.className = 'sidebar-overlay';
    overlay.onclick = closeSidebar;
    document.body.appendChild(overlay);
  }
  overlay.classList.toggle('active');
}

function closeSidebar() {
  const sidebar = document.getElementById('dashboard-sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
}

// ==================== DASHBOARD ====================

async function loadDashboard() {
  try {
    const dbService = (await import('./db-service.js')).default;
    const orders = await dbService.getAllOrders();

    updateDashboardStats(orders);
    loadRecentOrders(orders);
    loadBestSellers(orders);

    dbService.listenToOrderChanges((updatedOrders) => {
      updateDashboardStats(updatedOrders);
      loadRecentOrders(updatedOrders);
      loadBestSellers(updatedOrders);
    });
  } catch (error) {
    console.error('Failed to load dashboard:', error);
  }
}

function updateDashboardStats(orders) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayOrders = orders.filter(o => {
    const orderDate = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.timestamp || o.createdAt);
    orderDate.setHours(0, 0, 0, 0);
    return orderDate.getTime() === today.getTime();
  });

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const completedToday = todayOrders.filter(o => o.status === 'delivered');
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  document.getElementById('stat-revenue').textContent = todayRevenue.toFixed(2) + ' DZD';
  document.getElementById('stat-total-orders').textContent = orders.length;
  document.getElementById('stat-pending').textContent = pendingOrders.length;
  document.getElementById('stat-completed').textContent = completedToday.length;
}

function loadRecentOrders(orders) {
  const recentOrders = orders.slice(0, 5);
  let html = '<table class="simple-table"><thead><tr>';
  html += '<th>Order ID</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead><tbody>';

  if (recentOrders.length === 0) {
    html += '<tr><td colspan="4" style="text-align:center;color:#999;padding:40px;">No orders yet</td></tr>';
  } else {
    recentOrders.forEach(order => {
      html += '<tr>';
      html += '<td class="order-id">#' + (order.id ? order.id.substring(0, 8) : 'N/A') + '</td>';
      html += '<td>' + (order.customerName || 'N/A') + '</td>';
      html += '<td>' + (order.total || 0).toFixed(2) + ' DZD</td>';
      html += '<td><span class="status-badge status-' + order.status + '">' + order.status + '</span></td>';
      html += '</tr>';
    });
  }

  html += '</tbody></table>';
  document.getElementById('recent-orders-table').innerHTML = html;
}

function loadBestSellers(orders) {
  const itemCounts = {};
  const itemRevenue = {};

  orders.forEach(order => {
    if (order.items) {
      order.items.forEach(item => {
        const name = item.name || item.id;
        itemCounts[name] = (itemCounts[name] || 0) + (item.qty || 1);
        itemRevenue[name] = (itemRevenue[name] || 0) + ((item.price || 0) * (item.qty || 1));
      });
    }
  });

  const sortedItems = Object.keys(itemCounts)
    .map(name => ({ name, count: itemCounts[name], revenue: itemRevenue[name] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  let html = '';
  if (sortedItems.length === 0) {
    html = '<p style="text-align:center;color:#999;padding:40px 0;">No sales data yet</p>';
  } else {
    sortedItems.forEach(item => {
      html += '<div class="best-seller-item">';
      html += '<div class="item-info">';
      html += '<p class="item-name">' + item.name + '</p>';
      html += '<p class="item-sales">' + item.count + ' sold</p>';
      html += '</div>';
      html += '<div class="item-revenue">' + item.revenue.toFixed(2) + ' DZD</div>';
      html += '</div>';
    });
  }

  document.getElementById('best-sellers-list').innerHTML = html;
}

// ==================== ORDERS ====================

async function loadOrders() {
  try {
    const dbService = (await import('./db-service.js')).default;
    const orders = await dbService.getAllOrders();

    renderOrdersTable(orders);

    dbService.listenToOrderChanges((updatedOrders) => {
      renderOrdersTable(updatedOrders);
    });
  } catch (error) {
    console.error('Failed to load orders:', error);
  }
}

function renderOrdersTable(orders) {
  const filtered = state.currentFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === state.currentFilter);

  const searchTerm = document.getElementById('order-search')?.value?.toLowerCase() || '';
  const searchFiltered = filtered.filter(order => 
    order.customerName?.toLowerCase().includes(searchTerm) ||
    order.id?.toLowerCase().includes(searchTerm)
  );

  if (searchFiltered.length === 0) {
    document.getElementById('orders-table').innerHTML = `
      <div style="padding:60px 20px;text-align:center;color:#999;">
        <h3 style="margin:0 0 8px 0;">No orders found</h3>
        <p style="font-size:0.9em;">Try changing the filter or search term</p>
      </div>
    `;
    return;
  }

  let html = '<table class="orders-table"><thead><tr>';
  html += '<th>Order ID</th><th>Customer</th><th>Phone</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th>';
  html += '</tr></thead><tbody>';

  searchFiltered.forEach(order => {
    const date = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
    const statusClass = order.status || 'pending';

    html += '<tr>';
    html += `<td><strong>${order.id.substring(0, 8)}</strong></td>`;
    html += `<td>${order.customerName || 'N/A'}</td>`;
    html += `<td>${order.customerPhone || 'N/A'}</td>`;
    html += `<td>${order.items?.length || 0} items</td>`;
    html += `<td><strong>${(order.total || 0).toFixed(2)} DZD</strong></td>`;
    html += `<td><span class="status-badge ${statusClass}">${order.status || 'pending'}</span></td>`;
    html += `<td>${date.toLocaleDateString()}</td>`;
    html += `<td>
      <select onchange="updateOrderStatus('${order.id}', this.value)" class="status-select">
        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
        <option value="in-progress" ${order.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
      </select>
    </td>`;
    html += '</tr>';
  });

  html += '</tbody></table>';
  document.getElementById('orders-table').innerHTML = html;
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    const dbService = (await import('./db-service.js')).default;
    await dbService.updateOrderStatus(orderId, newStatus);
  } catch (error) {
    console.error('Failed to update order status:', error);
    alert('❌ Failed to update order status');
  }
}

function filterOrdersByStatus(status, evt) {
  state.currentFilter = status;
  localStorage.setItem('kc_current_filter', status);

  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.classList.remove('active');
  });

  if (evt && evt.target) {
    evt.target.classList.add('active');
  }

  loadOrders();
}

function filterOrders() {
  loadOrders();
}

// ==================== MENU ====================

async function loadMenu() {
  try {
    const dbService = (await import('./db-service.js')).default;
    const menu = await dbService.getAllMenuItems();

    renderMenuItems(menu);

    dbService.listenToMenuChanges((updatedMenu) => {
      renderMenuItems(updatedMenu);
    });
  } catch (error) {
    console.error('Failed to load menu:', error);
  }
}

async function renderMenuItems(menu) {
  const filtered = state.menuFilter === 'all' 
    ? menu 
    : menu.filter(item => item.category === state.menuFilter);

  if (filtered.length === 0) {
    document.getElementById('menu-items-grid').innerHTML = `
      <div style="grid-column:1/-1;padding:60px 20px;text-align:center;color:#999;">
        <h3 style="margin:0 0 8px 0;">No items found</h3>
        <p style="font-size:0.9em;">Try adding a new menu item or changing the filter</p>
      </div>
    `;
    return;
  }

  const categories = await loadCategories();

  let html = '';
  filtered.forEach(item => {
    const category = categories.find(cat => cat.id === item.category);
    const categoryName = category ? category.name : item.category;
    const imgSrc = item.img || '';

    html += `
      <div class="menu-item-card">
        ${imgSrc ? `<img src="${imgSrc}" alt="${item.name}" class="menu-item-image" />` : `<div class="menu-item-placeholder">${item.name.charAt(0)}</div>`}
        <div class="menu-item-content">
          <div class="menu-item-header">
            <h4 class="menu-item-name">${item.name}</h4>
            <span class="menu-item-category ${item.category}">${categoryName}</span>
          </div>
          <p class="menu-item-desc">${item.desc}</p>
          <p class="menu-item-price">${item.price.toFixed(2)} DZD</p>
          <div class="menu-item-actions">
            <button class="btn-edit" onclick="openEditModal('${item.id}')">✏️ Edit</button>
            <button class="btn-delete" onclick="deleteItem('${item.id}', '${item.name.replace(/'/g, "\\'")}')">🗑️ Delete</button>
          </div>
        </div>
      </div>
    `;
  });

  document.getElementById('menu-items-grid').innerHTML = html;
}

function filterMenuByCategory(category, event) {
  if (event) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    event.target.classList.add('active');
  }

  state.menuFilter = category;
  loadMenu();
}

// ==================== MENU ITEM MODAL ====================

async function openAddModal() {
  state.editingItem = null;
  state.selectedImage = null;
  state.uploadedImageUrl = null;

  document.getElementById('modal-title').textContent = '➕ Add New Menu Item';
  document.getElementById('menu-item-form').reset();
  document.getElementById('item-id').value = '';

  resetImageUpload();
  await updateCategorySelect();
  document.getElementById('menu-item-modal').classList.add('active');
}

async function openEditModal(itemId) {
  try {
    const dbService = (await import('./db-service.js')).default;
    const item = await dbService.getMenuItem(itemId);

    if (!item) {
      alert('Item not found');
      return;
    }

    state.editingItem = item;
    state.selectedImage = null;
    state.uploadedImageUrl = null;

    document.getElementById('modal-title').textContent = '✏️ Edit Menu Item';
    document.getElementById('item-id').value = item.id;
    document.getElementById('item-name').value = item.name;
    document.getElementById('item-price').value = item.price;
    document.getElementById('item-desc').value = item.desc;
    document.getElementById('item-category').value = item.category;

    resetImageUpload();

    if (item.img) {
      document.getElementById('upload-placeholder').innerHTML = `
        <div style="font-size: 48px; margin-bottom: 12px;">📷</div>
        <p style="color: #4a5568; font-weight: 500; margin-bottom: 8px;">Current Image</p>
        <img src="${item.img}" alt="Current" style="max-width: 200px; max-height: 150px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); margin-bottom: 12px;" />
        <p style="color: #718096; font-size: 13px; margin-bottom: 8px;">Click to upload a new image</p>
        <p style="color: #FF6B35; font-size: 12px;">✨ Or keep the current image</p>
      `;
    }

    await updateCategorySelect();
    document.getElementById('menu-item-modal').classList.add('active');
  } catch (error) {
    console.error('Failed to load item:', error);
    alert('Failed to load item details');
  }
}

function closeModal() {
  document.getElementById('menu-item-modal').classList.remove('active');
  state.editingItem = null;
  state.selectedImage = null;
  state.uploadedImageUrl = null;
  resetImageUpload();
}

// ==================== IMAGE UPLOAD ====================

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

  const MAX_SIZE = 5 * 1024 * 1024;
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

// ==================== SAVE MENU ITEM ====================

async function saveMenuItem(event) {
  event.preventDefault();

  const saveBtn = document.getElementById('save-item-btn');
  const originalText = saveBtn.textContent;
  saveBtn.disabled = true;
  saveBtn.textContent = '💾 Saving...';

  try {
    const dbService = (await import('./db-service.js')).default;

    const itemId = document.getElementById('item-id').value;
    const itemName = document.getElementById('item-name').value.trim();
    const itemPrice = parseFloat(document.getElementById('item-price').value);
    const itemDesc = document.getElementById('item-desc').value.trim();
    const itemCategory = document.getElementById('item-category').value;

    if (!itemName || !itemDesc || !itemCategory || isNaN(itemPrice) || itemPrice <= 0) {
      alert('❌ Please fill all fields correctly');
      saveBtn.disabled = false;
      saveBtn.textContent = originalText;
      return;
    }

    let imageUrl = '';

    if (state.uploadedImageUrl) {
      console.log('✅ Using newly uploaded image:', state.uploadedImageUrl);
      imageUrl = state.uploadedImageUrl;
    } else if (state.editingItem?.img) {
      console.log('✅ Keeping existing image:', state.editingItem.img);
      imageUrl = state.editingItem.img;
    }

    const itemData = {
      name: itemName,
      price: itemPrice,
      desc: itemDesc,
      category: itemCategory,
      img: imageUrl
    };

    console.log('Saving item:', itemData);

    saveBtn.textContent = '💾 Saving to database...';

    if (itemId) {
      await dbService.updateMenuItem(itemId, itemData);
      alert('✅ Menu item updated successfully!');
    } else {
      await dbService.addMenuItem(itemData);
      alert('✅ Menu item added successfully!');
    }

    state.selectedImage = null;
    state.uploadedImageUrl = null;
    state.editingItem = null;
    closeModal();
    loadMenu();
  } catch (error) {
    console.error('Failed to save item:', error);
    alert('❌ Failed to save menu item: ' + error.message);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = originalText;
  }
}

async function deleteItem(itemId, itemName) {
  if (confirm(`Are you sure you want to delete "${itemName}"?\n\nThis action cannot be undone.`)) {
    try {
      const dbService = (await import('./db-service.js')).default;
      await dbService.deleteMenuItem(itemId);
      alert('✅ Menu item deleted successfully!');
      loadMenu();
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('❌ Failed to delete menu item: ' + error.message);
    }
  }
}

// ==================== CATEGORIES ====================

async function loadCategories() {
  try {
    const dbService = (await import('./db-service.js')).default;
    state.categories = await dbService.getAllCategories();

    if (state.categories.length === 0) {
      await dbService.initializeDefaultCategories();
      state.categories = await dbService.getAllCategories();
    }

    return state.categories;
  } catch (error) {
    console.error('Failed to load categories:', error);
    return [];
  }
}

async function updateCategorySelect() {
  const categories = await loadCategories();

  const categorySelect = document.getElementById('item-category');
  if (categorySelect) {
    const currentValue = categorySelect.value;
    categorySelect.innerHTML = '<option value="">Select category</option>';
    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.id;
      option.textContent = cat.name;
      categorySelect.appendChild(option);
    });
    if (currentValue) {
      categorySelect.value = currentValue;
    }
  }

  const filtersContainer = document.getElementById('menu-category-filters');
  if (filtersContainer) {
    filtersContainer.innerHTML = '<button class="filter-btn active" onclick="filterMenuByCategory(\'all\', event)">All</button>';
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.textContent = cat.name;
      btn.onclick = (e) => filterMenuByCategory(cat.id, e);
      filtersContainer.appendChild(btn);
    });
  }
}

// ==================== ANALYTICS ====================

function loadAnalytics() {
  console.log('Analytics loaded');
}

// ==================== GLOBAL FUNCTIONS ====================

// Expose all functions globally
window.adminLogin = adminLogin;
window.adminLogout = adminLogout;
window.showSection = showSection;
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;
window.filterOrdersByStatus = filterOrdersByStatus;
window.filterOrders = filterOrders;
window.updateOrderStatus = updateOrderStatus;
window.openAddModal = openAddModal;
window.openEditModal = openEditModal;
window.closeModal = closeModal;
window.filterMenuByCategory = filterMenuByCategory;
window.handleImageSelect = handleImageSelect;
window.clearImage = clearImage;
window.saveMenuItem = saveMenuItem;
window.deleteItem = deleteItem;
window.loadMenu = loadMenu;
window.renderMenuItems = renderMenuItems;

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', async () => {
  const loginForm = document.getElementById('admin-login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', adminLogin);
  }

  // Attach image input handler
  const imageInput = document.getElementById('item-image');
  if (imageInput) {
    imageInput.addEventListener('change', handleImageSelect);
  }

  try {
    const auth = await getAuthInstance();
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        state.currentUser = user;
        localStorage.setItem('kc_admin', 'true');

        if (document.getElementById('admin-section')) {
          document.getElementById('login-section').classList.add('hidden');
          document.getElementById('admin-section').classList.remove('hidden');

          const lastSection = localStorage.getItem('kc_current_section') || 'dashboard';
          showSection(lastSection);
        }
      } else {
        state.currentUser = null;
        localStorage.removeItem('kc_admin');

        if (document.getElementById('login-section')) {
          document.getElementById('login-section').classList.remove('hidden');
          document.getElementById('admin-section').classList.add('hidden');
        }
      }
    });
  } catch (error) {
    console.error('Auth initialization failed:', error);
  }

  await updateCategorySelect();
});