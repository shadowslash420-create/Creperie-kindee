/* Admin Dashboard JavaScript */

let currentSection = 'dashboard';
let currentFilter = 'all';

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
function loadDashboard() {
  const orders = JSON.parse(localStorage.getItem('kc_orders') || '[]');
  
  // Calculate stats
  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.timestamp || o.createdAt).toDateString() === today);
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const completedToday = todayOrders.filter(o => o.status === 'delivered');
  
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
  
  // Update stat cards
  document.getElementById('stat-revenue').textContent = todayRevenue.toFixed(2) + ' DZD';
  document.getElementById('stat-total-orders').textContent = orders.length;
  document.getElementById('stat-pending').textContent = pendingOrders.length;
  document.getElementById('stat-completed').textContent = completedToday.length;
  
  // Load recent orders
  loadRecentOrders();
  
  // Load best sellers
  loadBestSellers();
  
  // Load charts
  loadSalesChart();
  loadStatusChart();
}

// Load Recent Orders
function loadRecentOrders() {
  const orders = JSON.parse(localStorage.getItem('kc_orders') || '[]');
  const recentOrders = orders.slice(-5).reverse();
  
  let html = '<table class="simple-table"><thead><tr>';
  html += '<th>Order ID</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead><tbody>';
  
  if (recentOrders.length === 0) {
    html += '<tr><td colspan="4" style="text-align:center;color:#999;padding:40px;">No orders yet</td></tr>';
  } else {
    recentOrders.forEach(order => {
      html += '<tr>';
      html += '<td class="order-id">#' + order.id + '</td>';
      html += '<td>' + order.name + '</td>';
      html += '<td>' + order.total.toFixed(2) + ' DZD</td>';
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
  const itemCounts = {};
  const itemRevenue = {};
  
  orders.forEach(order => {
    order.items.forEach(item => {
      const name = item.name;
      itemCounts[name] = (itemCounts[name] || 0) + item.qty;
      itemRevenue[name] = (itemRevenue[name] || 0) + (item.price * item.qty);
    });
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

// Load All Orders
function loadAllOrders() {
  const orders = JSON.parse(localStorage.getItem('kc_orders') || '[]');
  let filteredOrders = orders;
  
  if (currentFilter !== 'all') {
    filteredOrders = orders.filter(o => o.status === currentFilter);
  }
  
  let html = '<table class="orders-table"><thead><tr>';
  html += '<th>Order ID</th><th>Customer</th><th>Phone</th><th>Address</th>';
  html += '<th>Items</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
  
  if (filteredOrders.length === 0) {
    html += '<tr><td colspan="8" style="text-align:center;color:#999;padding:40px;">No orders found</td></tr>';
  } else {
    filteredOrders.reverse().forEach(order => {
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

// Load Menu Items
async function loadMenuItems() {
  const menu = await getMenuFromServer();
  
  let html = '<button class="add-menu-btn" onclick="showAddMenuModal()">+ Add New Item</button>';
  html += '<div class="menu-grid">';
  
  menu.forEach(item => {
    html += '<div class="menu-item-card">';
    html += '<img src="' + item.img + '" alt="' + item.name + '" class="menu-item-image" />';
    html += '<h4>' + item.name + '</h4>';
    html += '<p>' + item.desc + '</p>';
    html += '<p class="price">' + item.price.toFixed(2) + ' DZD</p>';
    html += '<p style="font-size:12px;color:#999;text-transform:capitalize;margin:8px 0;">' + item.category + '</p>';
    html += '<div class="menu-item-actions">';
    html += '<button class="action-btn btn-edit" onclick="editMenuItem(\'' + item.id + '\')">Edit</button>';
    html += '<button class="action-btn btn-delete" onclick="deleteMenuItem(\'' + item.id + '\')">Delete</button>';
    html += '</div>';
    html += '</div>';
  });
  
  html += '</div>';
  
  document.getElementById('menu-items-grid').innerHTML = html;
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

// Initialize dashboard on admin login
window.addEventListener('DOMContentLoaded', () => {
  // Check if already logged in
  const isAdminLoggedIn = localStorage.getItem('kc_admin') === 'true';
  
  if (isAdminLoggedIn && document.getElementById('admin-section')) {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('admin-section').classList.remove('hidden');
    
    // Restore last visited section or default to dashboard
    const lastSection = localStorage.getItem('kc_current_section') || 'dashboard';
    showSection(lastSection);
  }
});
