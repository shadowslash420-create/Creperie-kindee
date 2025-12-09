/* ==================== CREPERIE KINDER ADMIN DASHBOARD ==================== */
/* Works with classic script loading - all functions are exposed to window */

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
    if (!window.getAuthInstance) {
      console.error('❌ Firebase not available yet');
      return;
    }
    const auth = await window.getAuthInstance();
    if (!auth || !auth.currentUser) {
      state.isStaffUser = false;
      state.currentUserRole = null;
      return;
    }

    const userEmail = auth.currentUser.email;
    if (userEmail === 'oussamaanis2005@gmail.com') {
      state.isStaffUser = true;
      state.currentUserRole = 'Admin';
      console.log('✅ Admin user detected:', userEmail);
      return;
    }

    if (!window.dbService) return;
    await window.dbService.init();
    const allStaff = await window.dbService.getAllStaff();
    const staffMember = allStaff.find(s => s.email?.toLowerCase() === userEmail?.toLowerCase());

    if (staffMember) {
      state.isStaffUser = true;
      state.currentUserRole = staffMember.role;
      console.log('✅ Staff user detected:', userEmail, 'Role:', staffMember.role);
    } else {
      state.isStaffUser = false;
      state.currentUserRole = null;
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
    console.log('📋 Loading menu items...');
    if (!window.dbService) throw new Error('dbService not available');
    await window.dbService.init();
    const data = await window.dbService.getAllMenuItems();
    console.log('✅ Menu items loaded:', data?.length || 0, 'items:', data);
    state.menuItems = data || [];
    return data;
  } catch (error) {
    console.error('❌ Failed to load menu:', error.message, error);
    state.menuItems = [];
    return [];
  }
}

async function loadOrdersData() {
  try {
    console.log('📦 Loading orders...');
    if (!window.dbService) throw new Error('dbService not available');
    await window.dbService.init();
    const data = await window.dbService.getAllOrders();
    console.log('✅ Orders loaded:', data?.length || 0, 'items:', data);
    state.orders = data || [];
    return data;
  } catch (error) {
    console.error('❌ Failed to load orders:', error.message, error);
    state.orders = [];
    return [];
  }
}

// Setup real-time order listener for admin
function setupOrdersListener() {
  if (!window.dbService) return;
  window.dbService.listenToOrderChanges((updatedOrders) => {
    console.log('🔄 Orders updated in real-time:', updatedOrders.length);
    state.orders = updatedOrders;
    if (state.currentSection === 'orders') {
      renderOrdersList();
    }
    if (state.currentSection === 'dashboard') {
      renderDashboard();
    }
  });
}

async function loadCategoriesData() {
  try {
    console.log('📂 Loading categories...');
    if (!window.dbService) throw new Error('dbService not available');
    const data = await window.dbService.getAllCategories();
    console.log('✅ Categories loaded:', data.length);
    state.categories = data || [];
    return data;
  } catch (error) {
    console.error('❌ Failed to load categories:', error.message);
    state.categories = [];
    return [];
  }
}

async function loadReviews() {
  try {
    console.log('⭐ Loading reviews...');
    if (!window.dbService) throw new Error('dbService not available');
    await window.dbService.init();
    const data = await window.dbService.getAllReviews();
    console.log('✅ Reviews loaded:', data.length);
    state.reviews = data || [];
    return data;
  } catch (error) {
    console.error('❌ Failed to load reviews:', error.message);
    state.reviews = [];
    return [];
  }
}

async function loadMessages() {
  try {
    console.log('📧 Loading messages...');
    if (!window.dbService) throw new Error('dbService not available');
    const data = await window.dbService.getAllContactMessages();
    console.log('✅ Messages loaded:', data.length);
    state.messages = data || [];
    return data;
  } catch (error) {
    console.error('❌ Failed to load messages:', error.message);
    state.messages = [];
    return [];
  }
}

async function loadStaffData() {
  try {
    console.log('👨‍💼 Loading staff...');
    if (!window.dbService) throw new Error('dbService not available');
    const data = await window.dbService.getAllStaff();
    console.log('✅ Staff loaded:', data.length);
    state.staff = data || [];
    return data;
  } catch (error) {
    console.error('❌ Failed to load staff:', error.message);
    state.staff = [];
    return [];
  }
}

async function loadCustomersData() {
  try {
    console.log('👥 Loading customers from orders...');
    if (!state.orders || state.orders.length === 0) {
      console.log('No orders available to extract customers');
      state.customers = [];
      return [];
    }

    // Extract unique customers from orders
    const customerMap = new Map();

    state.orders.forEach(order => {
      if (order.email) {
        const email = order.email.toLowerCase();
        if (!customerMap.has(email)) {
          customerMap.set(email, {
            email: order.email,
            name: order.name || 'N/A',
            phone: order.phone || 'N/A',
            address: order.address || 'N/A',
            totalOrders: 0,
            totalSpent: 0,
            lastOrderDate: null
          });
        }

        const customer = customerMap.get(email);
        customer.totalOrders++;
        customer.totalSpent += (order.total || 0);

        const orderDate = order.createdAt ? (order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt)) : null;
        if (orderDate && (!customer.lastOrderDate || orderDate > customer.lastOrderDate)) {
          customer.lastOrderDate = orderDate;
        }
      }
    });

    state.customers = Array.from(customerMap.values());
    console.log('✅ Customers loaded:', state.customers.length);
    return state.customers;
  } catch (error) {
    console.error('❌ Failed to load customers:', error.message);
    state.customers = [];
    return [];
  }
}

// ==================== UI MANAGEMENT ====================

function toggleSidebar() {
  console.log('🔄 Toggling sidebar...');
  const sidebar = document.getElementById('dashboard-sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');

  if (!sidebar) return;

  const isActive = sidebar.classList.contains('active');

  if (isActive) {
    sidebar.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    if (mobileMenuBtn) mobileMenuBtn.classList.remove('active');
  } else {
    sidebar.classList.add('active');
    if (overlay) overlay.classList.add('active');
    if (mobileMenuBtn) mobileMenuBtn.classList.add('active');
  }
}

function showSection(section, event) {
  if (event) event.preventDefault();
  console.log('📄 Showing section:', section);

  state.currentSection = section;

  // Hide ALL sections - use more specific selector
  document.querySelectorAll('.content-section, [id^="section-"]').forEach(el => {
    el.classList.remove('active');
    el.style.display = 'none';
  });

  // Show ONLY the selected section
  const sectionId = 'section-' + section;
  const sectionEl = document.getElementById(sectionId);
  if (sectionEl) {
    sectionEl.classList.add('active');
    sectionEl.style.display = 'block';
    console.log('✅ Section displayed:', sectionId);
  } else {
    console.warn('⚠️ Section not found:', sectionId);
  }

  // Update active nav item
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  if (event?.target) {
    event.target.closest('.nav-item')?.classList.add('active');
  }

  // Load/render section data
  if (section === 'dashboard') {
    renderDashboard();
  } else if (section === 'menu') {
    renderMenuGrid();
  } else if (section === 'orders') {
    renderOrdersList();
  } else if (section === 'customers') {
    renderCustomersTable();
  } else if (section === 'reviews') {
    renderReviewsList();
  } else if (section === 'messages') {
    renderMessagesList();
  } else if (section === 'staff') {
    renderStaffTable();
  }

  // ALWAYS close sidebar and overlay after selecting a section
  const sidebar = document.getElementById('dashboard-sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');

  if (sidebar) sidebar.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
  if (mobileMenuBtn) mobileMenuBtn.classList.remove('active');

  sessionStorage.setItem('admin_current_section', section);
}

// ==================== DASHBOARD RENDERING ====================

async function renderDashboard() {
  try {
    console.log('🎨 Rendering dashboard...');
    console.log('State data:', { orders: state.orders.length, reviews: state.reviews.length, messages: state.messages?.length });
    const totalOrders = state.orders.length;
    const totalReviews = state.reviews.length;
    const totalMessages = state.messages?.length || 0;
    const totalRevenue = state.orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const avgRating = state.reviews.length > 0
      ? (state.reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / state.reviews.length).toFixed(1)
      : 0;

    // Update stat cards
    const statElements = {
      'stat-revenue': `${totalRevenue.toFixed(2)} DZD`,
      'stat-total-orders': totalOrders,
      'stat-pending': state.orders.filter(o => o.status === 'received').length,
      'stat-completed': state.orders.filter(o => o.status === 'in_transit').length
    };

    console.log('Updating stat elements:', statElements);
    for (const [id, value] of Object.entries(statElements)) {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = value;
        console.log(`✅ Updated ${id} = ${value}`);
      } else {
        console.warn(`⚠️ Element ${id} not found`);
      }
    }

    console.log('✅ Dashboard rendered');
  } catch (error) {
    console.error('❌ Error rendering dashboard:', error);
  }
}

// ==================== MENU MANAGEMENT ====================

async function renderMenuGrid() {
  try {
    console.log('🎨 Rendering menu grid...');
    const container = document.getElementById('menu-items-grid');
    if (!container) return;

    if (!state.menuItems || state.menuItems.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:#999;">No menu items</p>';
      return;
    }

    const html = state.menuItems.map(item => `
      <div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
        ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width:100%;height:200px;object-fit:cover;">` : '<div style="width:100%;height:200px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;color:#999;">No image</div>'}
        <div style="padding:16px;">
          <h3 style="margin:0 0 8px 0;color:#2d3748;">${item.name}</h3>
          <p style="margin:0 0 12px 0;color:#666;font-size:14px;">${item.description || ''}</p>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <strong style="color:#E30613;font-size:18px;">${item.price} DZD</strong>
            <div style="display:flex;gap:8px;">
              <button onclick="editMenuItem('${item.id}')" style="padding:6px 12px;background:#3182ce;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px;">✏️ Edit</button>
              <button onclick="deleteMenuItem('${item.id}')" style="padding:6px 12px;background:#e53e3e;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px;">🗑️ Delete</button>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    container.innerHTML = html;
    console.log('✅ Menu grid rendered');
  } catch (error) {
    console.error('❌ Error rendering menu grid:', error);
  }
}

async function deleteMenuItem(itemId) {
  if (!confirm('Delete this item?')) return;
  try {
    console.log('🗑️ Deleting menu item:', itemId);
    if (!window.dbService) throw new Error('dbService not available');
    await window.dbService.deleteMenuItem(itemId);
    await loadMenuData();
    renderMenuGrid();
    alert('✅ Menu item deleted!');
    console.log('✅ Menu item deleted successfully');
  } catch (error) {
    console.error('❌ Error deleting menu item:', error);
    alert('❌ Failed to delete: ' + error.message);
  }
}

// ==================== ORDERS MANAGEMENT ====================

async function renderOrdersList() {
  try {
    console.log('🎨 Rendering orders list...');
    const container = document.getElementById('orders-table');
    if (!container) return;

    if (!state.orders || state.orders.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:#999;padding:40px;">No orders yet</p>';
      return;
    }

    // Calculate order stats for all status types
    const total = state.orders.length;
    const pending = state.orders.filter(o => o.status === 'pending').length;
    const received = state.orders.filter(o => o.status === 'received').length;
    const preparing = state.orders.filter(o => o.status === 'preparing').length;
    const ready = state.orders.filter(o => o.status === 'ready').length;
    const picked_up = state.orders.filter(o => o.status === 'picked_up').length;
    const in_transit = state.orders.filter(o => o.status === 'in_transit').length;
    const completed = state.orders.filter(o => o.status === 'completed').length; // Added for completed

    // Apply filter if exists
    let filteredOrders = state.orders;
    if (state.orderFilter && state.orderFilter !== 'all') {
      filteredOrders = state.orders.filter(o => o.status === state.orderFilter);
    }

    // Stats cards HTML with click handlers - matching staff-a layout with proper contrast
    const statsHtml = `
      <div class="stats-grid">
        <div class="stat-card ${state.orderFilter === 'all' ? 'active' : ''}" onclick="filterOrdersByStatus('all')">
          <div class="stat-info">
            <div class="stat-value">${total}</div>
            <div class="stat-label">الكل / All</div>
          </div>
        </div>
        <div class="stat-card ${state.orderFilter === 'pending' ? 'active' : ''}" onclick="filterOrdersByStatus('pending')">
          <div class="stat-info">
            <div class="stat-value">${pending}</div>
            <div class="stat-label">🔴 قيد الانتظار / Pending</div>
          </div>
        </div>
        <div class="stat-card ${state.orderFilter === 'received' ? 'active' : ''}" onclick="filterOrdersByStatus('received')">
          <div class="stat-info">
            <div class="stat-value">${received}</div>
            <div class="stat-label">📦 تم الاستلام / Received</div>
          </div>
        </div>
        <div class="stat-card ${state.orderFilter === 'preparing' ? 'active' : ''}" onclick="filterOrdersByStatus('preparing')">
          <div class="stat-info">
            <div class="stat-value">${preparing}</div>
            <div class="stat-label">👨‍🍳 جاري التحضير / Preparing</div>
          </div>
        </div>
        <div class="stat-card ${state.orderFilter === 'ready' ? 'active' : ''}" onclick="filterOrdersByStatus('ready')">
          <div class="stat-info">
            <div class="stat-value">${ready}</div>
            <div class="stat-label">✅ جاهز / Ready</div>
          </div>
        </div>
        <div class="stat-card ${state.orderFilter === 'picked_up' ? 'active' : ''}" onclick="filterOrdersByStatus('picked_up')">
          <div class="stat-info">
            <div class="stat-value">${picked_up}</div>
            <div class="stat-label">🚗 تم الاستلام / Picked Up</div>
          </div>
        </div>
        <div class="stat-card ${state.orderFilter === 'in_transit' ? 'active' : ''}" onclick="filterOrdersByStatus('in_transit')">
          <div class="stat-info">
            <div class="stat-value">${in_transit}</div>
            <div class="stat-label">🚚 في الطريق / In Transit</div>
          </div>
        </div>
        <div class="stat-card ${state.orderFilter === 'completed' ? 'active' : ''}" onclick="filterOrdersByStatus('completed')">
          <div class="stat-info">
            <div class="stat-value">${completed}</div>
            <div class="stat-label">✔️ مكتمل / Completed</div>
          </div>
        </div>
      </div>
    `;

    // Orders table HTML with scrollable container - styled like customers table
    const tableHtml = `
      <div class="section">
        <div class="section-title">📋 Current Orders</div>
        <p style="color: #718096; font-size: 13px; margin-bottom: 16px; font-weight: 500;">💡 Click on order status to update it</p>
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
            <thead>
              <tr style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);color:white;">
                <th style="padding:16px;text-align:left;font-weight:600;">🆔 Order ID</th>
                <th style="padding:16px;text-align:left;font-weight:600;">👤 Customer</th>
                <th style="padding:16px;text-align:left;font-weight:600;">📧 Email</th>
                <th style="padding:16px;text-align:left;font-weight:600;">📱 Phone</th>
                <th style="padding:16px;text-align:left;font-weight:600;">💰 Total</th>
                <th style="padding:16px;text-align:left;font-weight:600;">📊 Status</th>
                <th style="padding:16px;text-align:left;font-weight:600;">📅 Date</th>
                <th style="padding:16px;text-align:left;font-weight:600;">⚡ Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filteredOrders.map((order, index) => {
                const date = order.createdAt ? new Date(order.createdAt.toDate ? order.createdAt.toDate() : order.createdAt).toLocaleDateString() + ' ' + new Date(order.createdAt.toDate ? order.createdAt.toDate() : order.createdAt).toLocaleTimeString() : 'N/A';
                const bgColor = index % 2 === 0 ? '#f7fafc' : 'white';
                return `
                  <tr style="background:${bgColor};border-bottom:1px solid #e2e8f0;">
                    <td style="padding:16px;font-weight:700;color:#E30613;" title="${order.id}">#${order.id?.substring(0,6).toUpperCase()}</td>
                    <td style="padding:16px;color:#2d3748;font-weight:600;" title="${order.name || 'N/A'}">${(order.name || 'N/A').substring(0, 15)}${(order.name || '').length > 15 ? '...' : ''}</td>
                    <td style="padding:16px;color:#2d3748;font-weight:500;" title="${order.email || 'N/A'}">${(order.email || 'N/A').substring(0, 20)}${(order.email || '').length > 20 ? '...' : ''}</td>
                    <td style="padding:16px;color:#2d3748;">${order.phone || 'N/A'}</td>
                    <td style="padding:16px;color:#E30613;font-weight:700;">${(order.total || 0).toFixed(0)} DZD</td>
                    <td style="padding:16px;">
                      <select onchange="updateOrderStatus('${order.id}', this.value)" style="padding:8px 12px;border:2px solid #e2e8f0;border-radius:8px;cursor:pointer;font-weight:600;font-size:12px;background:white;width:100%;max-width:140px;">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>🔴 Pending</option>
                        <option value="received" ${order.status === 'received' ? 'selected' : ''}>📦 Received</option>
                        <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>👨‍🍳 Preparing</option>
                        <option value="ready" ${order.status === 'ready' ? 'selected' : ''}>✅ Ready</option>
                        <option value="picked_up" ${order.status === 'picked_up' ? 'selected' : ''}>🚗 Picked Up</option>
                        <option value="in_transit" ${order.status === 'in_transit' ? 'selected' : ''}>🚚 In Transit</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>❌ Cancelled</option>
                        <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>✔️ Completed</option>
                      </select>
                    </td>
                    <td style="padding:16px;color:#718096;font-size:13px;">${date.split(' ')[0]}<br/><span style="font-size:11px;color:#999;">${date.split(' ')[1] || ''}</span></td>
                    <td style="padding:16px;">
                      <div style="display:flex;gap:8px;flex-wrap:wrap;">
                        <button onclick="viewOrderDetails('${order.id}')" style="padding:8px 16px;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:12px;white-space:nowrap;">👁️ View</button>
                        <button onclick="deleteOrder('${order.id}')" style="padding:8px 16px;background:linear-gradient(135deg, #e53e3e 0%, #c53030 100%);color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:12px;white-space:nowrap;">🗑️ Delete</button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div style="margin-top:24px;padding:16px;background:#f7fafc;border-radius:8px;border-left:4px solid #667eea;">
          <p style="margin:0;color:#2d3748;font-weight:600;">📊 Total Orders: ${filteredOrders.length}${state.orderFilter && state.orderFilter !== 'all' ? ' (filtered)' : ''}</p>
          <p style="margin:8px 0 0 0;color:#718096;font-size:13px;">Click on a row's View button to see full order details</p>
        </div>
      </div>
    `;

    container.innerHTML = statsHtml + tableHtml;
    console.log('✅ Orders list rendered');
  } catch (error) {
    console.error('❌ Error rendering orders:', error);
  }
}

function viewOrderDetails(orderId) {
  const order = state.orders.find(o => o.id === orderId);
  if (!order) {
    alert('Order not found');
    return;
  }

  const date = order.createdAt ? new Date(order.createdAt.toDate ? order.createdAt.toDate() : order.createdAt).toLocaleDateString() + ' ' + new Date(order.createdAt.toDate ? order.createdAt.toDate() : order.createdAt).toLocaleTimeString() : 'N/A';

  const itemsRows = (order.items || []).map(item => `
    <tr style="border-bottom:1px solid #e2e8f0;">
      <td style="padding:12px;text-align:left;color:#2d3748;font-weight:500;">${item.name || 'N/A'}</td>
      <td style="padding:12px;text-align:center;color:#2d3748;font-weight:600;">${item.qty || 1}</td>
      <td style="padding:12px;text-align:right;color:#FF1111;font-weight:600;">${(item.price || 0).toFixed(2)} DZD</td>
      <td style="padding:12px;text-align:right;color:#2d3748;font-weight:700;">${((item.price || 0) * (item.qty || 1)).toFixed(2)} DZD</td>
    </tr>
  `).join('');

  // Create modal overlay
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'modal-overlay';
  modalOverlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:99999;padding:20px;overflow-y:auto;';

  const modalContent = document.createElement('div');
  modalContent.style.cssText = 'background:white;border-radius:16px;max-width:700px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3);';

  modalContent.innerHTML = `
    <div style="position:sticky;top:0;background:linear-gradient(135deg,#FF1111 0%,#E60000 100%);color:white;padding:24px;border-radius:16px 16px 0 0;z-index:1000;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <h2 style="margin:0;font-size:24px;font-weight:700;">📋 Order Details</h2>
        <button onclick="this.closest('.modal-overlay').remove()" style="background:rgba(255,255,255,0.2);border:none;color:white;font-size:28px;width:40px;height:40px;border-radius:8px;cursor:pointer;transition:all 0.3s;">✕</button>
      </div>
      <p style="margin:8px 0 0 0;opacity:0.9;font-size:14px;">Order ID: ${orderId.substring(0, 12)}</p>
    </div>

    <div style="padding:24px;">
      <div style="background:#f7fafc;padding:20px;border-radius:12px;margin-bottom:20px;border:2px solid #e2e8f0;">
        <h3 style="color:#2d3748;margin:0 0 16px 0;font-size:16px;font-weight:700;display:flex;align-items:center;gap:8px;">
          <span style="font-size:24px;">👤</span> Customer Information
        </h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;font-size:14px;">
          <div style="color:#2d3748;"><strong style="color:#718096;">Name:</strong> ${order.name || 'N/A'}</div>
          <div style="color:#2d3748;"><strong style="color:#718096;">Email:</strong> ${order.email || 'N/A'}</div>
          <div style="color:#2d3748;"><strong style="color:#718096;">Phone:</strong> ${order.phone || 'N/A'}</div>
          <div style="color:#2d3748;"><strong style="color:#718096;">Date:</strong> ${date}</div>
          <div style="grid-column:1/-1;color:#2d3748;"><strong style="color:#718096;">Address:</strong> ${order.address || 'N/A'}</div>
        </div>
      </div>

      ${order.location && order.location.lat && order.location.lng ? `
      <div style="background:#f7fafc;padding:20px;border-radius:12px;margin-bottom:20px;border:2px solid #e2e8f0;">
        <h3 style="color:#2d3748;margin:0 0 16px 0;font-size:16px;font-weight:700;display:flex;align-items:center;gap:8px;">
          <span style="font-size:24px;">📍</span> Delivery Location
        </h3>
        <div id="order-location-map-${orderId}" style="width:100%;height:350px;min-height:350px;border-radius:8px;border:2px solid #cbd5e0;background:#e2e8f0;"></div>
        <p style="margin:12px 0 0 0;color:#718096;font-size:13px;">📌 Coordinates: ${order.location.lat.toFixed(6)}, ${order.location.lng.toFixed(6)}</p>
      </div>
      ` : ''}

      <div style="background:#f7fafc;padding:20px;border-radius:12px;margin-bottom:20px;border:2px solid #e2e8f0;">
        <h3 style="color:#2d3748;margin:0 0 16px 0;font-size:16px;font-weight:700;display:flex;align-items:center;gap:8px;">
          <span style="font-size:24px;">📦</span> Order Items
        </h3>
        <table style="width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;">
          <thead>
            <tr style="background:linear-gradient(135deg,#2d3748 0%,#4a5568 100%);color:white;">
              <th style="padding:12px;text-align:left;font-weight:600;font-size:13px;">ITEM</th>
              <th style="padding:12px;text-align:center;font-weight:600;font-size:13px;">QTY</th>
              <th style="padding:12px;text-align:right;font-weight:600;font-size:13px;">PRICE</th>
              <th style="padding:12px;text-align:right;font-weight:600;font-size:13px;">TOTAL</th>
            </tr>
          </thead>
          <tbody>${itemsRows}</tbody>
        </table>
      </div>

      <div style="background:linear-gradient(135deg,#FF1111 0%,#E60000 100%);color:white;padding:24px;border-radius:12px;box-shadow:0 4px 20px rgba(255,17,17,0.3);">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;font-size:15px;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.2);">
          <div><strong>Subtotal:</strong> ${(order.subtotal || 0).toFixed(2)} DZD</div>
          <div><strong>Delivery Fee:</strong> ${(order.deliveryFee || 0).toFixed(2)} DZD</div>
        </div>
        <div style="font-size:20px;font-weight:bold;text-align:right;">
          Total: ${(order.total || 0).toFixed(2)} DZD
        </div>
      </div>
    </div>
  `;

  modalOverlay.appendChild(modalContent);
  document.body.appendChild(modalOverlay);

  // Initialize Google Maps embed if location exists
  if (order.location && order.location.lat && order.location.lng) {
    setTimeout(() => {
      const mapElement = document.getElementById(`order-location-map-${orderId}`);
      if (mapElement) {
        const embedUrl = `https://www.google.com/maps?q=${order.location.lat},${order.location.lng}&output=embed`;
        mapElement.innerHTML = `
          <iframe 
            width="100%" 
            height="100%"
            style="border:none;border-radius:8px;" 
            src="${embedUrl}">
          </iframe>
        `;
        console.log('✅ Google Maps embed loaded for order:', orderId);
      }
    }, 100);
  }

  // Close on outside click
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.remove();
    }
  });
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    console.log('🔄 Updating order status:', orderId, '→', newStatus);
    if (!window.dbService) throw new Error('dbService not available');

    // Get order details before updating
    const order = state.orders.find(o => o.id === orderId);
    const customerEmail = order?.email;

    // Update in database
    await window.dbService.updateOrder(orderId, { status: newStatus });
    await loadOrdersData();
    renderOrdersList();

    // Update dashboard statistics if on dashboard section
    if (state.currentSection === 'dashboard') {
      renderDashboard();
    }

    // Send notification to customer via OneSignal (using new unified endpoint)
    if (customerEmail) {
      try {
        const notifyResponse = await fetch('/api/send-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'customer',
            orderId,
            customerEmail
          })
        });

        if (notifyResponse.ok) {
          const result = await notifyResponse.json();
          console.log('✅ Customer notification sent:', result.recipients, 'recipients');
        }
      } catch (notifyError) {
        console.warn('⚠️ Could not send customer notification:', notifyError);
      }
    }

    console.log('✅ Order status updated');
  } catch (error) {
    console.error('❌ Error updating order:', error);
    alert('❌ Failed to update order: ' + error.message);
  }
}

async function deleteOrder(orderId) {
  if (!confirm('⚠️ Are you sure you want to delete this order? This action cannot be undone.')) {
    return;
  }

  try {
    console.log('🗑️ Deleting order:', orderId);
    if (!window.dbService) throw new Error('dbService not available');

    await window.dbService.deleteOrder(orderId);
    
    // Remove from state
    state.orders = state.orders.filter(o => o.id !== orderId);
    
    // Re-render the orders list
    renderOrdersList();
    
    // Update dashboard if on dashboard section
    if (state.currentSection === 'dashboard') {
      renderDashboard();
    }

    alert('✅ Order deleted successfully!');
    console.log('✅ Order deleted successfully');
  } catch (error) {
    console.error('❌ Error deleting order:', error);
    alert('❌ Failed to delete order: ' + error.message);
  }
}

// ==================== REVIEWS MANAGEMENT ====================

async function renderReviewsList() {
  try {
    console.log('🎨 Rendering reviews...');
    const container = document.getElementById('reviews-list');
    if (!container) return;

    if (!state.reviews || state.reviews.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:#999;">No reviews</p>';
      return;
    }

    const avgRating = state.reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / state.reviews.length;
    const totalReviews = document.getElementById('total-reviews');
    if (totalReviews) totalReviews.textContent = state.reviews.length;
    const avgRatingEl = document.getElementById('avg-rating');
    if (avgRatingEl) avgRatingEl.textContent = avgRating.toFixed(1) + ' ⭐';

    const html = state.reviews.map(review => `
      <div style="background:white;border-radius:12px;padding:20px;margin-bottom:16px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
        <div style="display:flex;justify-content:space-between;align-items:start;">
          <div>
            <h4 style="margin:0;color:#2d3748;">${review.customerName || 'Anonymous'}</h4>
            <p style="margin:8px 0;color:#FF6B35;font-size:18px;">${'★'.repeat(review.rating || 0)}${'☆'.repeat(5-(review.rating || 0))}</p>
          </div>
          <button onclick="deleteFeedback('${review.id}')" style="padding:6px 12px;background:#e53e3e;color:white;border:none;border-radius:6px;cursor:pointer;">🗑️ Delete</button>
        </div>
        <p style="margin:12px 0;color:#2d3748;">${review.comment || ''}</p>
      </div>
    `).join('');

    container.innerHTML = html;
    console.log('✅ Reviews rendered');
  } catch (error) {
    console.error('❌ Error rendering reviews:', error);
  }
}

async function deleteFeedback(reviewId) {
  if (!confirm('Delete this review?')) return;
  try {
    console.log('🗑️ Deleting review:', reviewId);
    if (!window.dbService) throw new Error('dbService not available');
    await window.dbService.deleteReview(reviewId);
    await loadReviews();
    renderReviewsList();
    alert('✅ Review deleted!');
  } catch (error) {
    console.error('❌ Error deleting review:', error);
    alert('❌ Failed to delete: ' + error.message);
  }
}

// ==================== MESSAGES MANAGEMENT ====================

async function renderMessagesList() {
  try {
    console.log('🎨 Rendering messages...');
    const container = document.getElementById('messages-list');
    if (!container) return;

    if (!state.messages || state.messages.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:#999;">No messages</p>';
      return;
    }

    const totalCount = document.getElementById('total-messages');
    if (totalCount) totalCount.textContent = state.messages.length;

    const html = state.messages.map(msg => {
      const date = msg.createdAt ? new Date(msg.createdAt.toDate ? msg.createdAt.toDate() : msg.createdAt).toLocaleDateString() : 'N/A';
      return `
        <div style="background:white;border-radius:12px;padding:20px;margin-bottom:16px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px;">
            <div>
              <h4 style="margin:0;color:#2d3748;">${msg.name || 'Anonymous'}</h4>
              <p style="margin:4px 0;color:#666;font-size:13px;">✉️ ${msg.email || 'N/A'} | 📅 ${date}</p>
            </div>
            <button onclick="deleteMessage('${msg.id}')" style="padding:6px 12px;background:#e53e3e;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px;">🗑️ Delete</button>
          </div>
          <p style="margin:0;color:#2d3748;background:#f7fafc;padding:12px;border-radius:8px;border-left:4px solid #FF6B35;">${msg.message || ''}</p>
        </div>
      `;
    }).join('');

    container.innerHTML = html;
    console.log('✅ Messages rendered');
  } catch (error) {
    console.error('❌ Error rendering messages:', error);
  }
}

async function deleteMessage(messageId) {
  if (!confirm('Delete this message?')) return;
  try {
    console.log('🗑️ Deleting message:', messageId);
    if (!window.dbService) throw new Error('dbService not available');
    await window.dbService.deleteContactMessage(messageId);
    await loadMessages();
    renderMessagesList();
    alert('✅ Message deleted!');
  } catch (error) {
    console.error('❌ Error deleting message:', error);
    alert('❌ Failed to delete: ' + error.message);
  }
}

// ==================== INITIALIZATION ====================

// Check if user is already logged in via Firebase Auth
async function checkExistingAuth() {
  try {
    const auth = await window.getAuthInstance();
    if (auth.currentUser) {
      console.log('✅ User already authenticated:', auth.currentUser.email);

      // Check if user is admin
      const ADMIN_EMAILS = ['oussamaanis2005@gmail.com'];
      if (ADMIN_EMAILS.includes(auth.currentUser.email)) {
        console.log('✅ Admin user detected, auto-logging in');
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('admin-section').classList.remove('hidden');
        await initializeDashboard();
        return true;
      }

      // Check if user is staff
      const isStaff = await checkIfUserIsStaff(auth.currentUser.email);
      if (isStaff) {
        console.log('✅ Staff user detected, auto-logging in');
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('admin-section').classList.remove('hidden');
        await initializeDashboard();
        return true;
      }

      console.log('❌ User is not authorized as admin/staff');
      return false;
    }
  } catch (error) {
    console.error('Error checking existing auth:', error);
  }
  return false;
}

async function checkIfUserIsStaff(email) {
  try {
    if (!window.dbService) return false;
    await window.dbService.init();
    const staff = await window.dbService.getAllStaff();
    return staff.some(s => s.email?.toLowerCase() === email?.toLowerCase());
  } catch (error) {
    console.error('Error checking staff status:', error);
    return false;
  }
}

async function initializeDashboard() {
  try {
    console.log('🔄 Initializing dashboard...');
    if (!window.getAuthInstance) {
      throw new Error('Firebase not initialized');
    }

    const auth = await window.getAuthInstance();
    if (!auth.currentUser) {
      console.log('No user logged in');
      return;
    }

    console.log('✅ Admin user logged in:', auth.currentUser.email);
    await checkUserStaffStatus();

    // Load all data
    await Promise.all([
      loadMenuData(),
      loadOrdersData(),
      loadCategoriesData(),
      loadReviews(),
      loadMessages(),
      loadStaffData()
    ]);

    // Setup real-time listeners
    setupOrdersListener();

    console.log('✅ Dashboard initialized');
    showSection('dashboard');
  } catch (error) {
    console.error('❌ Dashboard initialization failed:', error);
  }
}

// ==================== ADMIN LOGIN HANDLER ====================

// Expose globally for auto-login
window.checkExistingAuth = checkExistingAuth;

async function handleAdminLogin(e) {
  e.preventDefault();
  const email = document.getElementById('adm-user').value.trim();
  const password = document.getElementById('adm-pass').value;
  const loginError = document.getElementById('login-error');
  const loginBtn = document.getElementById('admin-login-btn');

  if (!email || !password) {
    loginError.textContent = 'Please enter email and password';
    loginError.style.display = 'block';
    return;
  }

  try {
    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';
    loginError.style.display = 'none';

    console.log('🔐 Admin login attempt for:', email);

    // Step 1: Get custom token from backend
    const loginResponse = await fetch('/api/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!loginResponse.ok) {
      const error = await loginResponse.json();
      loginError.textContent = error.error || 'Login failed';
      loginError.style.display = 'block';
      loginBtn.disabled = false;
      loginBtn.textContent = 'Login';
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Received admin token');

    // Step 2: Use custom token to sign in with Firebase
    const auth = await window.getAuthInstance();
    const { signInWithCustomToken } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');

    const userCredential = await signInWithCustomToken(auth, loginData.token);
    console.log('✅ Admin signed in successfully:', userCredential.user.email);

    // Store admin token and user info
    sessionStorage.setItem('admin_token', loginData.token);
    sessionStorage.setItem('admin_user', JSON.stringify(loginData.user));

    // Hide login page, show dashboard
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('admin-section').classList.remove('hidden');

    // Load dashboard data
    await initializeDashboard();

    console.log('✅ Admin dashboard loaded');
  } catch (error) {
    console.error('❌ Login error:', error);
    loginError.textContent = error.message || 'Login failed';
    loginError.style.display = 'block';
    loginBtn.disabled = false;
    loginBtn.textContent = 'Login';
  }
}

async function handleAdminLogout() {
  if (!confirm('Are you sure you want to logout?')) return;

  try {
    console.log('🚪 Admin logout');
    const auth = await window.getAuthInstance();
    const { signOut } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');

    await signOut(auth);

    // Clear session storage
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_user');

    // Show login page, hide dashboard
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('admin-section').classList.add('hidden');

    // Reset form
    document.getElementById('admin-login-form').reset();
    document.getElementById('login-error').style.display = 'none';

    console.log('✅ Admin logged out');
  } catch (error) {
    console.error('❌ Logout error:', error);
    alert('Logout failed: ' + error.message);
  }
}

// ==================== MENU ITEM MANAGEMENT ====================

async function openAddModal() {
  document.getElementById('menu-item-modal').classList.add('active');
  document.getElementById('menu-item-form').reset();
  state.editingItem = null;

  // Populate category dropdown
  const categorySelect = document.getElementById('item-category');
  if (categorySelect && state.categories) {
    categorySelect.innerHTML = '<option value="">Select category</option>';
    state.categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.id;
      option.textContent = cat.name;
      categorySelect.appendChild(option);
    });
    console.log('✅ Populated category dropdown with', state.categories.length, 'categories');
  }
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

  // Populate category dropdown first
  const categorySelect = document.getElementById('item-category');
  if (categorySelect && state.categories) {
    categorySelect.innerHTML = '<option value="">Select category</option>';
    state.categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.id;
      option.textContent = cat.name;
      categorySelect.appendChild(option);
    });
  }

  document.getElementById('item-name').value = item.name;
  document.getElementById('item-price').value = item.price;
  document.getElementById('item-desc').value = item.description || '';
  document.getElementById('item-category').value = item.category || '';
  document.getElementById('item-image-url').value = item.image || item.img || '';
  document.getElementById('menu-item-modal').classList.add('active');
}

async function saveMenuItem(e) {
  e.preventDefault();
  const name = document.getElementById('item-name').value.trim();
  const price = parseFloat(document.getElementById('item-price').value);
  const description = document.getElementById('item-desc').value.trim();
  const category = document.getElementById('item-category').value;
  const imageUrl = document.getElementById('item-image-url').value.trim();

  if (!name || !price || !category) {
    alert('❌ Please fill required fields');
    return;
  }

  try {
    const itemData = {
      name,
      price,
      description,
      category,
      image: imageUrl,
      img: imageUrl  // Store in both fields for backwards compatibility
    };
    if (state.editingItem) {
      await window.dbService.updateMenuItem(state.editingItem.id, itemData);
      alert('✅ Menu item updated!');
    } else {
      await window.dbService.addMenuItem(itemData);
      alert('✅ Menu item added!');
    }
    await loadMenuData();
    renderMenuGrid();
    closeModal();
  } catch (error) {
    console.error('Error saving menu item:', error);
    alert('❌ Failed to save: ' + error.message);
  }
}

// ==================== ORDERS MANAGEMENT ====================

window.filterOrdersByStatus = function(status) {
  state.orderFilter = status;
  renderOrdersList();
};

function filterOrders(event) {
  const searchTerm = event.target.value.toLowerCase();
  renderOrdersList();
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    await window.dbService.updateOrder(orderId, { status: newStatus });
    const order = state.orders.find(o => o.id === orderId);
    if (order) order.status = newStatus;
    alert('✅ Order status updated!');
  } catch (error) {
    console.error('Error updating order status:', error);
    alert('❌ Failed to update status');
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

  if (!/^[a-z0-9_-]+$/.test(categoryId)) {
    alert('❌ Category ID must be lowercase with no spaces');
    return;
  }

  try {
    await window.dbService.addCategory({ id: categoryId, name: categoryName });
    await loadCategoriesData();
    document.getElementById('category-id').value = '';
    document.getElementById('category-name').value = '';
    renderCategoriesList();
    alert('✅ Category added!');
  } catch (error) {
    console.error('Error adding category:', error);
    alert('❌ Failed to add category: ' + error.message);
  }
}

function renderCategoriesList() {
  const list = document.getElementById('categories-list');
  if (!list) return;
  const html = (state.categories || []).map(cat => `
    <div style="background: white; padding: 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 8px;">
      <div>
        <p style="margin: 0; font-weight: 600; color: #2d3748;">${cat.name}</p>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">ID: ${cat.id}</p>
      </div>
      <button onclick="deleteCategory('${cat.id}')" style="padding: 6px 12px; background: #e53e3e; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">🗑️</button>
    </div>
  `).join('');
  list.innerHTML = html || '<p style="text-align: center; color: #999;">No categories yet</p>';
}

async function deleteCategory(categoryId) {
  if (!confirm('Delete this category?')) return;
  try {
    await window.dbService.deleteCategory(categoryId);
    await loadCategoriesData();
    renderCategoriesList();
    alert('✅ Category deleted!');
  } catch (error) {
    console.error('Error deleting category:', error);
    alert('❌ Failed to delete category');
  }
}

function filterMenuByCategory(category) {
  state.menuFilter = category;
  renderMenuGrid();
  const buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

// ==================== CUSTOMERS MANAGEMENT ====================

async function renderCustomersTable() {
  try {
    console.log('🎨 Rendering customers table...');
    const container = document.getElementById('customers-table');
    if (!container) {
      console.warn('⚠️ customers-table element not found');
      return;
    }

    // Load customers from orders
    await loadCustomersData();

    if (!state.customers || state.customers.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:#999;padding:40px;">No customers found. Customers will appear here once orders are placed.</p>';
      return;
    }

    const html = `
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
          <thead>
            <tr style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);color:white;">
              <th style="padding:16px;text-align:left;font-weight:600;">📧 Email</th>
              <th style="padding:16px;text-align:left;font-weight:600;">👤 Name</th>
              <th style="padding:16px;text-align:left;font-weight:600;">📱 Phone</th>
              <th style="padding:16px;text-align:left;font-weight:600;">📦 Orders</th>
              <th style="padding:16px;text-align:left;font-weight:600;">💰 Total Spent</th>
              <th style="padding:16px;text-align:left;font-weight:600;">📅 Last Order</th>
            </tr>
          </thead>
          <tbody>
            ${state.customers.map((customer, index) => {
              const lastOrderDate = customer.lastOrderDate
                ? customer.lastOrderDate.toLocaleDateString() + ' ' + customer.lastOrderDate.toLocaleTimeString()
                : 'N/A';
              const bgColor = index % 2 === 0 ? '#f7fafc' : 'white';

              return `
                <tr style="background:${bgColor};border-bottom:1px solid #e2e8f0;">
                  <td style="padding:16px;color:#2d3748;font-weight:500;">${customer.email}</td>
                  <td style="padding:16px;color:#2d3748;">${customer.name}</td>
                  <td style="padding:16px;color:#2d3748;">${customer.phone}</td>
                  <td style="padding:16px;text-align:center;">
                    <span style="background:#667eea;color:white;padding:4px 12px;border-radius:12px;font-weight:600;font-size:13px;">
                      ${customer.totalOrders}
                    </span>
                  </td>
                  <td style="padding:16px;color:#E30613;font-weight:700;">${customer.totalSpent.toFixed(2)} DZD</td>
                  <td style="padding:16px;color:#718096;font-size:13px;">${lastOrderDate}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <div style="margin-top:24px;padding:16px;background:#f7fafc;border-radius:8px;border-left:4px solid #667eea;">
        <p style="margin:0;color:#2d3748;font-weight:600;">📊 Total Customers: ${state.customers.length}</p>
        <p style="margin:8px 0 0 0;color:#718096;font-size:13px;">Customer data is automatically extracted from order history</p>
      </div>
    `;

    container.innerHTML = html;
    console.log('✅ Customers table rendered with', state.customers.length, 'customers');
  } catch (error) {
    console.error('❌ Error rendering customers table:', error);
    const container = document.getElementById('customers-table');
    if (container) {
      container.innerHTML = '<p style="text-align:center;color:#e53e3e;padding:40px;">Error loading customers. Please try again.</p>';
    }
  }
}

// ==================== STAFF MANAGEMENT ====================

function openAddStaffModal() {
  document.getElementById('staff-modal')?.classList.add('active');
  document.getElementById('staff-form')?.reset();
}

function closeAddStaffModal() {
  document.getElementById('staff-modal')?.classList.remove('active');
  document.getElementById('staff-form')?.reset();
}

async function saveStaffMember(e) {
  e.preventDefault();
  const staffEmail = document.getElementById('staff-email').value.trim();
  const staffName = document.getElementById('staff-name').value.trim();
  const staffRole = document.getElementById('staff-role').value;

  if (!staffEmail || !staffName || !staffRole) {
    alert('❌ Please fill all fields');
    return;
  }

  try {
    const staffData = { id: staffEmail, name: staffName, role: staffRole, email: staffEmail };
    await window.dbService.addStaff(staffData);
    await loadStaffData();
    renderStaffTable();
    closeAddStaffModal();
    alert('✅ Staff member added!');
  } catch (error) {
    console.error('Error saving staff:', error);
    alert('❌ Failed to save staff: ' + error.message);
  }
}

async function deleteStaff(staffId) {
  if (!confirm('Delete this staff member?')) return;
  try {
    await window.dbService.deleteStaff(staffId);
    await loadStaffData();
    renderStaffTable();
    alert('✅ Staff member deleted!');
  } catch (error) {
    console.error('Error deleting staff:', error);
    alert('❌ Failed to delete staff');
  }
}

function renderStaffTable() {
  const table = document.getElementById('staff-table');
  if (!table) {
    console.warn('⚠️ staff-table element not found');
    return;
  }

  if (!state.staff || state.staff.length === 0) {
    table.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No staff members yet</p>';
    return;
  }

  const html = state.staff.map(staff => `
    <div style="background:white;border-radius:12px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,0.1);margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;">
      <div style="flex:1;">
        <h4 style="margin:0 0 4px 0;color:#2d3748;font-weight:600;">${staff.name || 'N/A'}</h4>
        <p style="margin:0;color:#666;font-size:14px;">${staff.email || 'N/A'}</p>
        <span style="background:${staff.role === 'Admin' ? '#e53e3e' : staff.role === 'Staff A' ? '#3182ce' : '#48bb78'};color:white;padding:4px 8px;border-radius:4px;font-size:11px;display:inline-block;margin-top:4px;">${staff.role || 'N/A'}</span>
      </div>
      <button onclick="deleteStaff('${staff.id}')" style="padding:8px 12px;background:#e53e3e;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;white-space:nowrap;">🗑️ Delete</button>
    </div>
  `).join('');

  table.innerHTML = html;
  console.log('✅ Staff table rendered with', state.staff.length, 'members');
}

// ==================== EXPOSE TO WINDOW ====================
window.toggleSidebar = toggleSidebar;
window.showSection = showSection;
window.renderDashboard = renderDashboard;
window.renderMenuGrid = renderMenuGrid;
window.renderOrdersList = renderOrdersList;
window.renderReviewsList = renderReviewsList;
window.renderMessagesList = renderMessagesList;
window.deleteMenuItem = deleteMenuItem;
window.deleteFeedback = deleteFeedback;
window.deleteMessage = deleteMessage;
window.initializeDashboard = initializeDashboard;
window.handleAdminLogin = handleAdminLogin;
window.handleAdminLogout = handleAdminLogout;
window.openAddModal = openAddModal;
window.closeModal = closeModal;
window.editMenuItem = editMenuItem;
window.saveMenuItem = saveMenuItem;
window.filterOrdersByStatus = filterOrdersByStatus;
window.filterOrders = filterOrders;
window.updateOrderStatus = updateOrderStatus;
window.openCategoryModal = openCategoryModal;
window.closeCategoryModal = closeCategoryModal;
window.addCategory = addCategory;
window.renderCategoriesList = renderCategoriesList;
window.deleteCategory = deleteCategory;
window.filterMenuByCategory = filterMenuByCategory;
window.openAddStaffModal = openAddStaffModal;
window.closeAddStaffModal = closeAddStaffModal;
window.saveStaffMember = saveStaffMember;
window.deleteStaff = deleteStaff;
window.renderStaffTable = renderStaffTable;
window.renderCustomersTable = renderCustomersTable;
window.updateOrderStatus = updateOrderStatus;
window.viewOrderDetails = viewOrderDetails;
window.filterOrdersByStatus = filterOrdersByStatus;
window.deleteOrder = deleteOrder;

console.log('✅ Admin dashboard script loaded');

// ==================== CACHE CLEARING ====================
function clearAdminCache() {
  console.log('🧹 Clearing admin cache...');
  const keysToKeep = ['kc_google_user', 'firebase_auth'];
  Object.keys(localStorage).forEach(key => {
    if (!keysToKeep.includes(key) && !key.startsWith('firebase:')) {
      localStorage.removeItem(key);
      console.log(`🗑️ Removed cache: ${key}`);
    }
  });
  console.log('✅ Admin cache cleared');
}

// ==================== AUTO-INITIALIZE WITH RETRY ====================
async function waitForDependencies(maxWait = 5000) {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWait) {
    if (window.dbService && window.getAuthInstance && window.firebaseLoaded) {
      console.log('✅ All dependencies ready!');
      return true;
    }
    await new Promise(r => setTimeout(r, 100));
  }
  console.error('❌ Dependencies timeout - some may be missing');
  return false;
}

(async () => {
  // Clear cache first for admin panel
  clearAdminCache();

  await waitForDependencies();

  try {
    console.log('🔍 Checking if user is logged in...');
    const auth = await window.getAuthInstance();
    console.log('Auth instance:', auth);
    if (auth && auth.currentUser) {
      console.log('🚀 User logged in:', auth.currentUser.email, '- auto-initializing dashboard...');
      await initializeDashboard();
      console.log('✅ Dashboard auto-initialized');
      // Automatically show dashboard section
      showSection('dashboard');
    } else {
      console.log('ℹ️ No user logged in yet');
    }
  } catch (err) {
    console.error('❌ Auto-init error:', err.message);
  }
})();

// Listen for auth changes and reinit dashboard when user logs in
if (window.onAuthChange) {
  window.onAuthChange((user) => {
    if (user && document.getElementById('admin-section') && !document.getElementById('admin-section').classList.contains('hidden')) {
      console.log('👤 Auth changed, reinitializing dashboard...');
      initializeDashboard().catch(err => console.error('❌ Reinit error:', err));
    }
  });
}