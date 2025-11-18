/* Admin Dashboard JavaScript */

import { getAuthInstance } from './firebase-config.js';
import { signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

let currentSection = 'dashboard';
let currentFilter = 'all';
let currentUser = null;

// Server sync functions
async function getMenuFromServer() {
  try {
    const response = await fetch('/api/menu');
    const menu = await response.json();
    localStorage.setItem('kc_menu', JSON.stringify(menu));
    return menu;
  } catch(error) {
    return JSON.parse(localStorage.getItem('kc_menu') || '[]');
  }
}

async function saveMenuToServer(menu) {
  localStorage.setItem('kc_menu', JSON.stringify(menu));
  try {
    await fetch('/api/menu', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(menu)
    });
  } catch(error) {
    console.error('Failed to sync menu to server:', error);
  }
}

// Show specific section
function showSection(section, evt) {
  currentSection = section;
  
  // Save current section to localStorage
  localStorage.setItem('kc_current_section', section);
  
  // Update active state for navigation items
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.classList.remove('active');
    // Check if this nav item corresponds to the current section
    const navText = item.textContent.trim().toLowerCase();
    const sectionMap = {
      'dashboard': ['dashboard', '📊'],
      'orders': ['orders', '📦'],
      'menu': ['menu', '🍽️'],
      'analytics': ['analytics', '📈']
    };
    if (sectionMap[section] && sectionMap[section].some(keyword => navText.includes(keyword))) {
      item.classList.add('active');
    }
  });
  
  // Update content sections
  document.querySelectorAll('.content-section').forEach(sec => {
    sec.classList.remove('active');
  });
  document.getElementById('section-' + section).classList.add('active');
  
  // Update page title
  const titles = {
    dashboard: 'Dashboard',
    orders: 'Orders Management',
    menu: 'Menu Management',
    analytics: 'Analytics & Reports'
  };
  document.getElementById('page-title').textContent = titles[section];
  
  // Load section data
  if (section === 'dashboard') {
    loadDashboard();
  } else if (section === 'orders') {
    // Restore filter state if available
    const savedFilter = localStorage.getItem('kc_current_filter');
    if (savedFilter) {
      currentFilter = savedFilter;
      // Update filter tab active state
      setTimeout(() => {
        document.querySelectorAll('.filter-tab').forEach(tab => {
          tab.classList.remove('active');
          if (tab.textContent.trim().toLowerCase().includes(savedFilter) || 
              (savedFilter === 'all' && tab.textContent.trim().toLowerCase() === 'all')) {
            tab.classList.add('active');
          }
        });
      }, 100);
    }
    loadAllOrders();
  } else if (section === 'menu') {
    loadMenuItems();
  } else if (section === 'analytics') {
    loadAnalytics();
  }
  
  // Close sidebar on mobile
  if (window.innerWidth <= 768) {
    closeSidebar();
  }
}

// Toggle sidebar on mobile
function toggleSidebar() {
  const sidebar = document.getElementById('dashboard-sidebar');
  sidebar.classList.toggle('active');
  
  // Toggle overlay on mobile
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

// Close sidebar
function closeSidebar() {
  const sidebar = document.getElementById('dashboard-sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
}

// Load Dashboard
async function loadDashboard() {
  try {
    const dbService = (await import('./db-service.js')).default;
    const orders = await dbService.getAllOrders();
    
    updateDashboardStatsFromOrders(orders);
    loadRecentOrdersFromOrders(orders);
    loadBestSellersFromOrders(orders);
    loadSalesChartFromOrders(orders);
    loadStatusChartFromOrders(orders);
    
    dbService.listenToOrderChanges((updatedOrders) => {
      updateDashboardStatsFromOrders(updatedOrders);
      loadRecentOrdersFromOrders(updatedOrders);
      loadBestSellersFromOrders(updatedOrders);
      loadSalesChartFromOrders(updatedOrders);
      loadStatusChartFromOrders(updatedOrders);
    });
  } catch (error) {
    console.error('Failed to load dashboard from Firebase, using localStorage:', error);
    loadDashboardFallback();
  }
}

function loadDashboardFallback() {
  const orders = JSON.parse(localStorage.getItem('kc_orders') || '[]');
  updateDashboardStatsFromOrders(orders);
  loadRecentOrdersFromOrders(orders);
  loadBestSellersFromOrders(orders);
  loadSalesChart();
  loadStatusChart();
}

function updateDashboardStatsFromOrders(orders) {
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

// Load Recent Orders
function loadRecentOrders() {
  const orders = JSON.parse(localStorage.getItem('kc_orders') || '[]');
  loadRecentOrdersFromOrders(orders);
}

function loadRecentOrdersFromOrders(orders) {
  const recentOrders = orders.slice(0, 5);
  
  let html = '<table class="simple-table"><thead><tr>';
  html += '<th>Order ID</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead><tbody>';
  
  if (recentOrders.length === 0) {
    html += '<tr><td colspan="4" style="text-align:center;color:#999;padding:40px;">No orders yet</td></tr>';
  } else {
    recentOrders.forEach(order => {
      html += '<tr>';
      html += '<td class="order-id">#' + (order.id ? order.id.substring(0, 8) : 'N/A') + '</td>';
      html += '<td>' + (order.customerName || order.name || 'N/A') + '</td>';
      html += '<td>' + (order.total || 0).toFixed(2) + ' DZD</td>';
      html += '<td><span class="status-badge status-' + order.status + '">' + order.status + '</span></td>';
      html += '</tr>';
    });
  }
  
  html += '</tbody></table>';
  document.getElementById('recent-orders-table').innerHTML = html;
}

// Load Best Sellers
function loadBestSellers() {
  const orders = JSON.parse(localStorage.getItem('kc_orders') || '[]');
  loadBestSellersFromOrders(orders);
}

function loadBestSellersFromOrders(orders) {
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

// Load Sales Chart (Simple bars since we don't have Chart.js)
function loadSalesChart() {
  const canvas = document.getElementById('sales-chart');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth;
  canvas.height = 280;
  
  const orders = JSON.parse(localStorage.getItem('kc_orders') || '[]');
  const last7Days = [];
  const salesData = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toDateString();
    last7Days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    
    const daySales = orders
      .filter(o => new Date(o.timestamp || o.createdAt).toDateString() === dateStr)
      .reduce((sum, o) => sum + o.total, 0);
    salesData.push(daySales);
  }
  
  // Draw simple bar chart
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const maxSale = Math.max(...salesData, 100);
  const barWidth = canvas.width / 7 - 20;
  const chartHeight = 220;
  
  salesData.forEach((sale, i) => {
    const barHeight = (sale / maxSale) * chartHeight;
    const x = i * (barWidth + 20) + 10;
    const y = chartHeight - barHeight + 20;
    
    // Draw bar
    const gradient = ctx.createLinearGradient(0, y, 0, chartHeight + 20);
    gradient.addColorStop(0, '#FF6B35');
    gradient.addColorStop(1, '#FF8C42');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, barWidth, barHeight);
    
    // Draw value
    ctx.fillStyle = '#2d3748';
    ctx.font = '12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(sale.toFixed(0) + ' DZD', x + barWidth / 2, y - 5);
    
    // Draw label
    ctx.fillStyle = '#718096';
    ctx.font = '11px Inter';
    ctx.fillText(last7Days[i], x + barWidth / 2, chartHeight + 40);
  });
}

// Load Status Chart (Simple pie)
function loadStatusChart() {
  const canvas = document.getElementById('status-chart');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth;
  canvas.height = 280;
  
  const orders = JSON.parse(localStorage.getItem('kc_orders') || '[]');
  const statusCounts = {
    pending: orders.filter(o => o.status === 'pending').length,
    'in-progress': orders.filter(o => o.status === 'in-progress').length,
    delivered: orders.filter(o => o.status === 'delivered').length
  };
  
  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  
  if (total === 0) {
    ctx.fillStyle = '#999';
    ctx.font = '14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('No orders yet', canvas.width / 2, canvas.height / 2);
    return;
  }
  
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2 - 20;
  const radius = Math.min(centerX, centerY) - 20;
  
  const colors = {
    pending: '#e67e22',
    'in-progress': '#3498db',
    delivered: '#27ae60'
  };
  
  let currentAngle = -Math.PI / 2;
  
  Object.keys(statusCounts).forEach(status => {
    const count = statusCounts[status];
    const sliceAngle = (count / total) * 2 * Math.PI;
    
    ctx.fillStyle = colors[status];
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
    ctx.lineTo(centerX, centerY);
    ctx.fill();
    
    currentAngle += sliceAngle;
  });
  
  // Draw legend
  let legendY = canvas.height - 40;
  Object.keys(statusCounts).forEach(status => {
    ctx.fillStyle = colors[status];
    ctx.fillRect(20, legendY, 12, 12);
    ctx.fillStyle = '#2d3748';
    ctx.font = '12px Inter';
    ctx.textAlign = 'left';
    ctx.fillText(status + ': ' + statusCounts[status], 40, legendY + 10);
    legendY += 20;
  });
}

// Load All Orders (Firebase-powered)
async function loadAllOrders() {
  try {
    const dbService = (await import('./db-service.js')).default;
    const orders = await dbService.getAllOrders();
    
    renderOrdersTable(orders);
    
    dbService.listenToOrderChanges((updatedOrders) => {
      renderOrdersTable(updatedOrders);
      updateDashboardStats(updatedOrders);
    });
  } catch (error) {
    console.error('Failed to load orders:', error);
    document.getElementById('orders-table').innerHTML = `
      <div style="padding:40px;text-align:center;color:#999;">
        <p>⚠️ Failed to load orders</p>
        <p style="font-size:0.9em;">${error.message}</p>
        <button onclick="loadAllOrders()" style="margin-top:16px;padding:8px 16px;background:#FF6B35;color:white;border:none;border-radius:8px;cursor:pointer;">Retry</button>
      </div>
    `;
  }
}

// Filter Orders by Status
function filterOrdersByStatus(status, evt) {
  currentFilter = status;
  localStorage.setItem('kc_current_filter', status);
  
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  if (evt && evt.target) {
    evt.target.classList.add('active');
  } else {
    // Restore filter tab active state
    document.querySelectorAll('.filter-tab').forEach(tab => {
      if (tab.textContent.trim().toLowerCase().includes(status) || 
          (status === 'all' && tab.textContent.trim().toLowerCase() === 'all')) {
        tab.classList.add('active');
      }
    });
  }
  
  loadAllOrders();
}

// Filter Orders by Search
function filterOrders() {
  const searchText = document.getElementById('order-search').value.toLowerCase();
  const orders = JSON.parse(localStorage.getItem('kc_orders') || '[]');
  
  let filtered = orders.filter(o => 
    o.name.toLowerCase().includes(searchText) || 
    o.id.toString().includes(searchText)
  );
  
  if (currentFilter !== 'all') {
    filtered = filtered.filter(o => o.status === currentFilter);
  }
  
  // Render filtered orders (reuse the table rendering logic)
  let html = '<table class="orders-table"><thead><tr>';
  html += '<th>Order ID</th><th>Customer</th><th>Phone</th><th>Address</th>';
  html += '<th>Items</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
  
  if (filtered.length === 0) {
    html += '<tr><td colspan="8" style="text-align:center;color:#999;padding:40px;">No orders found</td></tr>';
  } else {
    filtered.reverse().forEach(order => {
      html += '<tr>';
      html += '<td class="order-id">#' + order.id + '</td>';
      html += '<td>' + order.name + '</td>';
      html += '<td>' + order.phone + '</td>';
      html += '<td>' + order.address + '</td>';
      html += '<td>' + order.items.length + ' items' + (order.specialInstructions ? ' <span style="color:#e67e22;" title="Has special instructions">📝</span>' : '') + '</td>';
      html += '<td>' + order.total.toFixed(2) + ' DZD</td>';
      html += '<td><span class="status-badge status-' + order.status + '">' + order.status + '</span></td>';
      html += '<td class="order-actions">';
      html += '<button class="action-btn btn-view" onclick="viewOrder(\'' + order.id + '\')">View</button>';
      html += '<button class="action-btn btn-update" onclick="updateOrderStatus(\'' + order.id + '\')">Update</button>';
      html += '</td>';
      html += '</tr>';
    });
  }
  
  html += '</tbody></table>';
  document.getElementById('orders-table').innerHTML = html;
}

// View Order Details
function viewOrder(orderId) {
  const orders = JSON.parse(localStorage.getItem('kc_orders') || '[]');
  const order = orders.find(o => o.id === orderId);
  
  if (!order) return;
  
  let itemsList = order.items.map(item => 
    item.qty + 'x ' + item.name + ' (' + item.price.toFixed(2) + ' DZD)'
  ).join('\n');
  
  let message = 'Order #' + order.id + '\n\n' +
    'Customer: ' + order.name + '\n' +
    'Phone: ' + order.phone + '\n' +
    'Address: ' + order.address + '\n' +
    'Status: ' + order.status + '\n\n' +
    'Items:\n' + itemsList + '\n\n';
  
  if(order.subtotal !== undefined){
    message += 'Subtotal: ' + order.subtotal.toFixed(2) + ' DZD\n';
    message += 'Delivery Fee: ' + (order.deliveryFee || 0).toFixed(2) + ' DZD\n';
  }
  message += 'Total: ' + order.total.toFixed(2) + ' DZD';
  
  if(order.specialInstructions){
    message += '\n\nSpecial Instructions:\n' + order.specialInstructions;
  }
  
  alert(message);
}

// Update Order Status
function updateOrderStatus(orderId) {
  const orders = JSON.parse(localStorage.getItem('kc_orders') || '[]');
  const orderIndex = orders.findIndex(o => o.id === orderId);
  
  if (orderIndex === -1) return;
  
  const order = orders[orderIndex];
  const statusFlow = ['pending', 'in-progress', 'delivered'];
  const currentIndex = statusFlow.indexOf(order.status);
  
  if (currentIndex < statusFlow.length - 1) {
    order.status = statusFlow[currentIndex + 1];
    
    // Add timestamp when order moves to in-progress (accepted for delivery)
    if (order.status === 'in-progress') {
      order.acceptedForDelivery = new Date().toISOString();
      order.acceptedBy = 'Admin';
    }
    
    localStorage.setItem('kc_orders', JSON.stringify(orders));
    
    if (currentSection === 'orders') {
      loadAllOrders();
    } else {
      loadDashboard();
    }
    
    const statusMessage = order.status === 'in-progress' 
      ? 'Order #' + orderId + ' accepted and sent to delivery!'
      : 'Order #' + orderId + ' status updated to: ' + order.status;
    
    alert(statusMessage);
  } else {
    alert('Order is already delivered!');
  }
}

// Load Menu Items (Firebase-powered)
async function loadMenuItems() {
  try {
    const dbService = (await import('./db-service.js')).default;
    const menu = await dbService.getAllMenuItems();
    
    renderMenuItems(menu);
    
    dbService.listenToMenuChanges((updatedMenu) => {
      renderMenuItems(updatedMenu);
    });
  } catch (error) {
    console.error('Failed to load menu:', error);
    document.getElementById('menu-items-grid').innerHTML = `
      <div style="padding:40px;text-align:center;color:#999;">
        <p>⚠️ Failed to load menu items</p>
        <p style="font-size:0.9em;">${error.message}</p>
        <button onclick="loadMenuItems()" style="margin-top:16px;padding:8px 16px;background:#FF6B35;color:white;border:none;border-radius:8px;cursor:pointer;">Retry</button>
      </div>
    `;
  }
}

// Show Add Menu Modal
function showAddMenuModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Add New Menu Item</h2>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <form id="add-menu-form" onsubmit="addMenuItem(event)">
        <div class="form-group">
          <label>Item Name *</label>
          <input type="text" id="item-name" required />
        </div>
        <div class="form-group">
          <label>Description *</label>
          <textarea id="item-desc" required rows="3"></textarea>
        </div>
        <div class="form-group">
          <label>Price (DZD) *</label>
          <input type="number" id="item-price" step="0.01" min="0" required />
        </div>
        <div class="form-group">
          <label>Category *</label>
          <select id="item-category" required>
            <option value="">Select category</option>
            <option value="sweet">Sweet Crêpes</option>
            <option value="savory">Savory Crêpes</option>
            <option value="kids">Kids Crêpes</option>
            <option value="drinks">Drinks</option>
          </select>
        </div>
        <div class="form-group">
          <label>Image Path *</label>
          <input type="text" id="item-img" value="images/crepe1.svg" required />
          <small style="color:#999;display:block;margin-top:4px;">Use existing images: crepe1.svg, crepe2.svg, crepe3.svg, crepe4.svg, crepe5.svg, drink1.svg</small>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-cancel" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn-save">Add Item</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
}

// Add Menu Item
async function addMenuItem(e) {
  e.preventDefault();
  
  const menu = await getMenuFromServer();
  
  const newItem = {
    id: 'c' + Date.now(),
    name: document.getElementById('item-name').value,
    desc: document.getElementById('item-desc').value,
    price: parseFloat(document.getElementById('item-price').value),
    category: document.getElementById('item-category').value,
    img: document.getElementById('item-img').value
  };
  
  menu.push(newItem);
  await saveMenuToServer(menu);
  
  closeModal();
  loadMenuItems();
  alert('Menu item added successfully!');
}

// Edit Menu Item
async function editMenuItem(itemId) {
  const menu = await getMenuFromServer();
  const item = menu.find(i => i.id === itemId);
  
  if (!item) return;
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Edit Menu Item</h2>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <form id="edit-menu-form" onsubmit="updateMenuItem(event, '${itemId}')">
        <div class="form-group">
          <label>Item Name *</label>
          <input type="text" id="edit-item-name" value="${item.name}" required />
        </div>
        <div class="form-group">
          <label>Description *</label>
          <textarea id="edit-item-desc" required rows="3">${item.desc}</textarea>
        </div>
        <div class="form-group">
          <label>Price (DZD) *</label>
          <input type="number" id="edit-item-price" step="0.01" min="0" value="${item.price}" required />
        </div>
        <div class="form-group">
          <label>Category *</label>
          <select id="edit-item-category" required>
            <option value="sweet" ${item.category === 'sweet' ? 'selected' : ''}>Sweet Crêpes</option>
            <option value="savory" ${item.category === 'savory' ? 'selected' : ''}>Savory Crêpes</option>
            <option value="kids" ${item.category === 'kids' ? 'selected' : ''}>Kids Crêpes</option>
            <option value="drinks" ${item.category === 'drinks' ? 'selected' : ''}>Drinks</option>
          </select>
        </div>
        <div class="form-group">
          <label>Image Path *</label>
          <input type="text" id="edit-item-img" value="${item.img}" required />
          <small style="color:#999;display:block;margin-top:4px;">Use existing images: crepe1.svg, crepe2.svg, crepe3.svg, crepe4.svg, crepe5.svg, drink1.svg</small>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-cancel" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn-save">Update Item</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
}

// Update Menu Item
async function updateMenuItem(e, itemId) {
  e.preventDefault();
  
  const menu = await getMenuFromServer();
  const itemIndex = menu.findIndex(i => i.id === itemId);
  
  if (itemIndex === -1) return;
  
  menu[itemIndex] = {
    ...menu[itemIndex],
    name: document.getElementById('edit-item-name').value,
    desc: document.getElementById('edit-item-desc').value,
    price: parseFloat(document.getElementById('edit-item-price').value),
    category: document.getElementById('edit-item-category').value,
    img: document.getElementById('edit-item-img').value
  };
  
  await saveMenuToServer(menu);
  
  closeModal();
  loadMenuItems();
  alert('Menu item updated successfully!');
}

// Delete Menu Item
async function deleteMenuItem(itemId) {
  if (!confirm('Are you sure you want to delete this menu item?')) return;
  
  let menu = await getMenuFromServer();
  menu = menu.filter(i => i.id !== itemId);
  
  await saveMenuToServer(menu);
  loadMenuItems();
  alert('Menu item deleted successfully for all users!');
}

// Close Modal
function closeModal() {
  const modal = document.querySelector('.modal-overlay');
  if (modal) modal.remove();
}

// Load Analytics
function loadAnalytics() {
  const orders = JSON.parse(localStorage.getItem('kc_orders') || '[]');
  
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const avgOrder = orders.length > 0 ? totalRevenue / orders.length : 0;
  
  // Find best day
  const dayRevenue = {};
  orders.forEach(order => {
    const day = new Date(order.timestamp || order.createdAt).toDateString();
    dayRevenue[day] = (dayRevenue[day] || 0) + order.total;
  });
  
  const bestDay = Object.keys(dayRevenue).reduce((a, b) => 
    dayRevenue[a] > dayRevenue[b] ? a : b, '-'
  );
  
  document.getElementById('total-revenue').textContent = totalRevenue.toFixed(2) + ' DZD';
  document.getElementById('avg-order').textContent = avgOrder.toFixed(2) + ' DZD';
  document.getElementById('best-day').textContent = bestDay !== '-' ? new Date(bestDay).toLocaleDateString() : '-';
  
  // Popular items
  const itemCounts = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      itemCounts[item.name] = (itemCounts[item.name] || 0) + item.qty;
    });
  });
  
  const sortedItems = Object.keys(itemCounts)
    .map(name => ({ name, count: itemCounts[name] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  let html = '<ol style="margin:0;padding-left:20px;">';
  sortedItems.forEach(item => {
    html += '<li style="margin:8px 0;">' + item.name + ' (' + item.count + ' sold)</li>';
  });
  html += '</ol>';
  
  document.getElementById('popular-items').innerHTML = html;
}

// Admin login with Firebase
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
    currentUser = userCredential.user;
    
    // Check if user has admin privileges (you should set custom claims in Firebase)
    const token = await currentUser.getIdTokenResult();
    
    // For now, accept any authenticated user as admin
    // Later, you should check: if (!token.claims.admin) throw new Error('Not an admin');
    
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
    currentUser = null;
    localStorage.removeItem('kc_admin');
    localStorage.removeItem('kc_current_section');
    localStorage.removeItem('kc_current_filter');
    
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Logout failed:', error);
    window.location.href = 'index.html';
  }
}

// Make functions globally available
window.adminLogin = adminLogin;
window.adminLogout = adminLogout;
window.showSection = showSection;
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;
window.filterOrdersByStatus = filterOrdersByStatus;
window.filterOrders = filterOrders;
window.viewOrder = viewOrder;
window.updateOrderStatus = updateOrderStatus;
window.openMenuItemModal = openMenuItemModal;
window.openEditMenuItemModal = openEditMenuItemModal;
window.closeMenuItemModal = closeMenuItemModal;
window.filterMenuByCategory = filterMenuByCategory;
window.previewImage = previewImage;
window.saveMenuItem = saveMenuItem;
window.confirmDeleteMenuItem = confirmDeleteMenuItem;
window.deleteMenuItemById = deleteMenuItemById;
window.updateOrderStatusQuick = updateOrderStatusQuick;

// Initialize dashboard on admin login
window.addEventListener('DOMContentLoaded', async () => {
  const loginForm = document.getElementById('admin-login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', adminLogin);
  }
  
  // Check if already logged in with Firebase
  try {
    const auth = await getAuthInstance();
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        currentUser = user;
        localStorage.setItem('kc_admin', 'true');
        
        if (document.getElementById('admin-section')) {
          document.getElementById('login-section').classList.add('hidden');
          document.getElementById('admin-section').classList.remove('hidden');
          
          const lastSection = localStorage.getItem('kc_current_section') || 'dashboard';
          showSection(lastSection);
        }
      } else {
        currentUser = null;
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
});

/* Firebase-Powered Menu Management */

let currentMenuFilter = 'all';
let currentEditingItem = null;

async function renderMenuItems(menu) {
  const filtered = currentMenuFilter === 'all' 
    ? menu 
    : menu.filter(item => item.category === currentMenuFilter);
  
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
            <button class="btn-edit" onclick="openEditMenuItemModal('${item.id}')">
              ✏️ Edit
            </button>
            <button class="btn-delete" onclick="confirmDeleteMenuItem('${item.id}', '${item.name.replace(/'/g, "\\'")}')">
              🗑️ Delete
            </button>
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
  
  currentMenuFilter = category;
  loadMenuItems();
}

async function openMenuItemModal() {
  currentEditingItem = null;
  document.getElementById('modal-title').textContent = 'Add New Menu Item';
  document.getElementById('menu-item-form').reset();
  document.getElementById('item-id').value = '';
  await updateCategoryUI();
  document.getElementById('menu-item-modal').classList.add('active');
}

async function openEditMenuItemModal(itemId) {
  try {
    const dbService = (await import('./db-service.js')).default;
    const item = await dbService.getMenuItem(itemId);
    
    if (!item) {
      alert('Item not found');
      return;
    }
    
    currentEditingItem = item;
    document.getElementById('modal-title').textContent = 'Edit Menu Item';
    document.getElementById('item-id').value = item.id;
    document.getElementById('item-name').value = item.name;
    document.getElementById('item-price').value = item.price;
    document.getElementById('item-desc').value = item.desc;
    document.getElementById('item-category').value = item.category;
    
    await updateCategoryUI();
    document.getElementById('menu-item-modal').classList.add('active');
  } catch (error) {
    console.error('Failed to load item:', error);
    alert('Failed to load item details');
  }
}

function closeMenuItemModal() {
  document.getElementById('menu-item-modal').classList.remove('active');
  currentEditingItem = null;
}

// Store the selected file globally so it doesn't get lost
let selectedImageFile = null;

function previewImage(event) {
  const file = event.target.files[0];
  console.log('previewImage called with file:', file ? file.name : 'No file');
  console.log('File object:', file);
  console.log('Event target:', event.target);
  console.log('Files array:', event.target.files);
  
  if (file) {
    selectedImageFile = file;
    console.log('✅ File stored for upload:', selectedImageFile.name, 'Size:', selectedImageFile.size, 'bytes');
    
    const reader = new FileReader();
    reader.onload = function(e) {
      const preview = document.getElementById('image-preview');
      preview.innerHTML = `
        <div style="text-align: center; padding: 16px; background: #f7fafc; border-radius: 8px; border: 2px solid #48bb78;">
          <div style="color: #48bb78; font-size: 14px; font-weight: 600; margin-bottom: 12px;">✅ Image Selected: ${file.name}</div>
          <img src="${e.target.result}" alt="Preview" style="max-width: 100%; max-height: 200px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); margin-bottom: 8px;" />
          <p style="color: #718096; font-size: 12px; margin: 0;">This image will be uploaded to ImgBB when you click "Save Item"</p>
        </div>
      `;
      preview.classList.add('active');
      preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  } else {
    console.log('❌ No file selected from input');
    selectedImageFile = null;
    const preview = document.getElementById('image-preview');
    preview.style.display = 'none';
  }
}

async function saveMenuItem(event) {
  console.log('saveMenuItem function called');
  event.preventDefault();
  
  const saveBtn = document.getElementById('save-item-btn');
  const originalText = saveBtn.textContent;
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';
  
  try {
    console.log('Importing db-service...');
    const dbService = (await import('./db-service.js')).default;
    
    const itemId = document.getElementById('item-id').value;
    
    const itemData = {
      name: document.getElementById('item-name').value,
      price: parseFloat(document.getElementById('item-price').value),
      desc: document.getElementById('item-desc').value,
      category: document.getElementById('item-category').value,
      img: ''
    };
    
    if (itemId) {
      await dbService.updateMenuItem(itemId, itemData);
      alert('✅ Menu item updated successfully!');
    } else {
      await dbService.addMenuItem(itemData);
      alert('✅ Menu item added successfully with ImgBB image!');
    }
    
    closeMenuItemModal();
    loadMenuItems();
    
  } catch (error) {
    console.error('Failed to save item:', error);
    alert('❌ Failed to save menu item: ' + error.message);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = originalText;
  }
}

async function confirmDeleteMenuItem(itemId, itemName) {
  if (confirm(`Are you sure you want to delete "${itemName}"?\n\nThis action cannot be undone.`)) {
    await deleteMenuItemById(itemId);
  }
}

async function deleteMenuItemById(itemId) {
  try {
    const dbService = (await import('./db-service.js')).default;
    await dbService.deleteMenuItem(itemId);
    alert('✅ Menu item deleted successfully!');
    loadMenuItems();
  } catch (error) {
    console.error('Failed to delete item:', error);
    alert('❌ Failed to delete menu item: ' + error.message);
  }
}

/* Firebase-Powered Order Management - moved to replace old loadAllOrders */



/* ==================== CATEGORY MIGRATION ==================== */

async function migrateCategoriesFromLocalStorage() {
  const localCategories = localStorage.getItem('kc_categories');
  if (!localCategories) return;
  
  try {
    const dbService = (await import('./db-service.js')).default;
    const categories = JSON.parse(localCategories);
    
    for (const category of categories) {
      await dbService.addCategory(category);
    }
    
    // Clear localStorage after successful migration
    localStorage.removeItem('kc_categories');
    console.log('Categories migrated to Firebase successfully');
  } catch (error) {
    console.error('Failed to migrate categories:', error);
  }
}

// Auto-run migration on page load
document.addEventListener('DOMContentLoaded', async () => {
  await migrateCategoriesFromLocalStorage();
});


function renderOrdersTable(orders) {
  const filtered = currentFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === currentFilter);
  
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
  
  let html = '<table class="orders-table">';
  html += '<thead><tr>';
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
      <select onchange="updateOrderStatusQuick('${order.id}', this.value)" class="status-select">
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

async function updateOrderStatusQuick(orderId, newStatus) {
  try {
    const dbService = (await import('./db-service.js')).default;
    await dbService.updateOrderStatus(orderId, newStatus);
  } catch (error) {
    console.error('Failed to update order status:', error);
    alert('❌ Failed to update order status');
  }
}

function updateDashboardStats(orders) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayOrders = orders.filter(order => {
    const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
    orderDate.setHours(0, 0, 0, 0);
    return orderDate.getTime() === today.getTime();
  });
  
  const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const todayCompleted = todayOrders.filter(o => o.status === 'delivered').length;
  
  document.getElementById('stat-revenue').textContent = todayRevenue.toFixed(2) + ' DZD';
  document.getElementById('stat-total-orders').textContent = orders.length;
  document.getElementById('stat-pending').textContent = pendingCount;
  document.getElementById('stat-completed').textContent = todayCompleted;
}


/* Override loadDashboard to use Firebase */
async function loadDashboardFromFirebase() {
  try {
    const dbService = (await import('./db-service.js')).default;
    const orders = await dbService.getAllOrders();
    
    updateDashboardStats(orders);
    loadRecentOrdersFromFirebase(orders);
    loadBestSellersFromFirebase(orders);
    loadSalesChartFromFirebase(orders);
    loadStatusChartFromFirebase(orders);
    
    dbService.listenToOrderChanges((updatedOrders) => {
      updateDashboardStats(updatedOrders);
      loadRecentOrdersFromFirebase(updatedOrders);
      loadBestSellersFromFirebase(updatedOrders);
    });
  } catch (error) {
    console.error('Failed to load dashboard from Firebase:', error);
    loadDashboard();
  }
}

function loadRecentOrdersFromFirebase(orders) {
  const recentOrders = orders.slice(0, 5);
  
  let html = '<table class="simple-table"><thead><tr>';
  html += '<th>Order ID</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead><tbody>';
  
  if (recentOrders.length === 0) {
    html += '<tr><td colspan="4" style="text-align:center;color:#999;padding:40px;">No orders yet</td></tr>';
  } else {
    recentOrders.forEach(order => {
      html += '<tr>';
      html += '<td class="order-id">#' + (order.id ? order.id.substring(0, 8) : 'N/A') + '</td>';
      html += '<td>' + (order.customerName || order.name || 'N/A') + '</td>';
      html += '<td>' + (order.total || 0).toFixed(2) + ' DZD</td>';
      html += '<td><span class="status-badge status-' + order.status + '">' + order.status + '</span></td>';
      html += '</tr>';
    });
  }
  
  html += '</tbody></table>';
  document.getElementById('recent-orders-table').innerHTML = html;
}

async function loadBestSellersFromFirebase(orders) {
  const itemCounts = {};
  
  orders.forEach(order => {
    if (order.items) {
      order.items.forEach(item => {
        if (!itemCounts[item.name || item.id]) {
          itemCounts[item.name || item.id] = { name: item.name || item.id, count: 0, revenue: 0 };
        }
        itemCounts[item.name || item.id].count += item.qty || 1;
        itemCounts[item.name || item.id].revenue += (item.price || 0) * (item.qty || 1);
      });
    }
  });
  
  const sorted = Object.values(itemCounts).sort((a, b) => b.count - a.count).slice(0, 5);
  
  let html = '';
  if (sorted.length === 0) {
    html = '<div style="text-align:center;color:#999;padding:20px;">No sales data yet</div>';
  } else {
    sorted.forEach((item, index) => {
      html += `
        <div class="best-seller-item">
          <div class="best-seller-rank">${index + 1}</div>
          <div class="best-seller-info">
            <div class="best-seller-name">${item.name}</div>
            <div class="best-seller-stats">${item.count} sold • ${item.revenue.toFixed(2)} DZD</div>
          </div>
        </div>
      `;
    });
  }
  
  document.getElementById('best-sellers-list').innerHTML = html;
}

function loadSalesChartFromFirebase(orders) {
  loadSalesChart();
}

function loadStatusChartFromFirebase(orders) {
  loadStatusChart();
}

window.loadDashboard = loadDashboardFromFirebase;

/* ==================== CATEGORY MANAGEMENT ==================== */

let categoriesCache = [];

async function loadCategories() {
  try {
    const dbService = (await import('./db-service.js')).default;
    categoriesCache = await dbService.getAllCategories();
    
    // If no categories in Firebase, initialize defaults
    if (categoriesCache.length === 0) {
      await dbService.initializeDefaultCategories();
      categoriesCache = await dbService.getAllCategories();
    }
    
    return categoriesCache;
  } catch (error) {
    console.error('Failed to load categories from Firebase:', error);
    throw error;
  }
}

async function updateCategoryUI() {
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
  
  loadCategoriesList();
}

async function loadCategoriesList() {
  const categories = await loadCategories();
  const listContainer = document.getElementById('categories-list');
  
  if (!listContainer) return;
  
  if (categories.length === 0) {
    listContainer.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">No categories yet</p>';
    return;
  }
  
  listContainer.innerHTML = categories.map(cat => `
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: #f7fafc; border-radius: 8px;">
      <div>
        <div style="font-weight: 600; color: #2d3748;">${cat.name}</div>
        <div style="font-size: 12px; color: #718096; margin-top: 4px;">ID: ${cat.id}</div>
      </div>
      <button onclick="deleteCategory('${cat.id}')" style="background: #fc8181; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;">
        Delete
      </button>
    </div>
  `).join('');
}

async function openCategoryModal() {
  document.getElementById('category-modal').classList.add('active');
  await loadCategoriesList();
  
  // Listen to real-time category changes
  try {
    const dbService = (await import('./db-service.js')).default;
    dbService.listenToCategoryChanges((categories) => {
      categoriesCache = categories;
      loadCategoriesList();
      updateCategoryUI();
    });
  } catch (error) {
    console.error('Failed to listen to category changes:', error);
  }
}

function closeCategoryModal() {
  document.getElementById('category-modal').classList.remove('active');
  document.getElementById('new-category-id').value = '';
  document.getElementById('new-category-name').value = '';
}

async function addCategory() {
  const id = document.getElementById('new-category-id').value.trim().toLowerCase();
  const name = document.getElementById('new-category-name').value.trim();
  
  if (!id || !name) {
    alert('Please fill in both Category ID and Category Name');
    return;
  }
  
  if (!/^[a-z0-9-]+$/.test(id)) {
    alert('Category ID must be lowercase letters, numbers, and hyphens only (no spaces)');
    return;
  }
  
  try {
    const dbService = (await import('./db-service.js')).default;
    const categories = await loadCategories();
    
    if (categories.find(cat => cat.id === id)) {
      alert('A category with this ID already exists');
      return;
    }
    
    await dbService.addCategory({ id, name });
    
    document.getElementById('new-category-id').value = '';
    document.getElementById('new-category-name').value = '';
    
    alert('✅ Category added successfully!');
    await loadCategoriesList();
    await updateCategoryUI();
  } catch (error) {
    console.error('Failed to add category:', error);
    alert('❌ Failed to add category: ' + error.message);
  }
}

async function deleteCategory(categoryId) {
  try {
    const dbService = (await import('./db-service.js')).default;
    const categories = await loadCategories();
    const category = categories.find(cat => cat.id === categoryId);
    
    if (!category) return;
    
    if (!confirm(`Are you sure you want to delete "${category.name}"?\n\nNote: Menu items in this category will still exist but may need their category updated.`)) {
      return;
    }
    
    await dbService.deleteCategory(categoryId);
    
    alert('✅ Category deleted successfully!');
    await loadCategoriesList();
    await updateCategoryUI();
  } catch (error) {
    console.error('Failed to delete category:', error);
    alert('❌ Failed to delete category: ' + error.message);
  }
}

window.openCategoryModal = openCategoryModal;
window.closeCategoryModal = closeCategoryModal;
window.addCategory = addCategory;
window.deleteCategory = deleteCategory;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await updateCategoryUI();
    
    // Listen to real-time category changes
    const dbService = (await import('./db-service.js')).default;
    const unsubscribe = await dbService.listenToCategoryChanges((categories) => {
      categoriesCache = categories;
      updateCategoryUI();
    });
    
    // Store unsubscribe function for cleanup if needed
    window.categoryListener = unsubscribe;
  } catch (error) {
    console.error('Failed to initialize category management:', error);
    alert('Failed to load categories from Firebase. Please check your connection and try again.');
  }
});

