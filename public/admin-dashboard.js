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
    console.log('✅ Menu items loaded:', data.length);
    state.menuItems = data;
    return data;
  } catch (error) {
    console.error('❌ Failed to load menu:', error.message);
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
    console.log('✅ Orders loaded:', data.length);
    state.orders = data || [];
    return data;
  } catch (error) {
    console.error('❌ Failed to load orders:', error.message);
    state.orders = [];
    return [];
  }
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

// ==================== UI MANAGEMENT ====================

function toggleSidebar() {
  console.log('🔄 Toggling sidebar...');
  const sidebar = document.getElementById('dashboard-sidebar');
  if (sidebar) sidebar.classList.toggle('open');
}

function showSection(section, event) {
  if (event) event.preventDefault();
  console.log('📄 Showing section:', section);
  
  state.currentSection = section;
  
  // Hide all sections
  document.querySelectorAll('[id$="-section"]').forEach(el => {
    el.style.display = 'none';
  });

  // Show selected section
  const sectionId = 'section-' + section;
  const sectionEl = document.getElementById(sectionId);
  if (sectionEl) {
    sectionEl.style.display = 'block';
    console.log('✅ Section displayed:', sectionId);
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
  } else if (section === 'reviews') {
    renderReviewsList();
  } else if (section === 'messages') {
    renderMessagesList();
  }

  // Close sidebar on mobile
  if (window.innerWidth <= 768) {
    const sidebar = document.getElementById('dashboard-sidebar');
    if (sidebar) sidebar.classList.remove('open');
  }

  sessionStorage.setItem('admin_current_section', section);
}

// ==================== DASHBOARD RENDERING ====================

async function renderDashboard() {
  try {
    console.log('🎨 Rendering dashboard...');
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
      'stat-pending': state.orders.filter(o => o.status === 'pending').length,
      'stat-completed': state.orders.filter(o => o.status === 'delivered').length
    };

    for (const [id, value] of Object.entries(statElements)) {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
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
      container.innerHTML = '<p style="text-align:center;color:#999;">No orders</p>';
      return;
    }

    const html = state.orders.map(order => `
      <div style="background:white;border-radius:12px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,0.1);margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;">
          <div>
            <h4 style="margin:0;color:#2d3748;">#${order.id?.substring(0,8)}</h4>
            <p style="margin:4px 0;color:#666;font-size:14px;">${order.name || 'N/A'}</p>
          </div>
          <span style="background:${order.status === 'delivered' ? '#48bb78' : '#ed8936'};color:white;padding:4px 8px;border-radius:4px;font-size:12px;">${order.status || 'pending'}</span>
        </div>
        <p style="margin:8px 0;color:#666;font-size:14px;">📍 ${order.address || 'No address'}</p>
        <p style="margin:8px 0;font-weight:600;color:#2d3748;">Total: ${order.total} DZD</p>
      </div>
    `).join('');

    container.innerHTML = html;
    console.log('✅ Orders list rendered');
  } catch (error) {
    console.error('❌ Error rendering orders:', error);
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

    console.log('✅ Dashboard initialized');
    showSection('dashboard');
  } catch (error) {
    console.error('❌ Dashboard initialization failed:', error);
  }
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

console.log('✅ Admin dashboard script loaded');
