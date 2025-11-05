/* Admin Dashboard JavaScript */

let currentSection = 'dashboard';
let currentFilter = 'all';

// Show specific section
function showSection(section, evt) {
  currentSection = section;
  
  // Update navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // Only update active state if event is provided
  if (evt && evt.target) {
    const navItem = evt.target.closest('.nav-item');
    if (navItem) {
      navItem.classList.add('active');
    }
  } else {
    // Programmatically set active based on section
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      if (item.textContent.trim().toLowerCase().includes(section)) {
        item.classList.add('active');
      }
    });
  }
  
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
    loadAllOrders();
  } else if (section === 'menu') {
    loadMenuItems();
  } else if (section === 'analytics') {
    loadAnalytics();
  }
  
  // Close sidebar on mobile
  if (window.innerWidth <= 768) {
    toggleSidebar();
  }
}

// Toggle sidebar on mobile
function toggleSidebar() {
  const sidebar = document.getElementById('dashboard-sidebar');
  sidebar.classList.toggle('active');
}

// Load Dashboard
function loadDashboard() {
  const orders = JSON.parse(localStorage.getItem('kc_orders') || '[]');
  
  // Calculate stats
  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.timestamp).toDateString() === today);
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const completedToday = todayOrders.filter(o => o.status === 'delivered');
  
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
  
  // Update stat cards
  document.getElementById('stat-revenue').textContent = '$' + todayRevenue.toFixed(2);
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
      html += '<td>$' + order.total.toFixed(2) + '</td>';
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
      html += '<div class="item-revenue">$' + item.revenue.toFixed(2) + '</div>';
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
      .filter(o => new Date(o.timestamp).toDateString() === dateStr)
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
    ctx.fillText('$' + sale.toFixed(0), x + barWidth / 2, y - 5);
    
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
      html += '<td>' + order.items.length + ' items</td>';
      html += '<td>$' + order.total.toFixed(2) + '</td>';
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
  
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  if (evt && evt.target) {
    evt.target.classList.add('active');
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
      html += '<td>' + order.items.length + ' items</td>';
      html += '<td>$' + order.total.toFixed(2) + '</td>';
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
    item.qty + 'x ' + item.name + ' ($' + item.price.toFixed(2) + ')'
  ).join('\n');
  
  alert('Order #' + order.id + '\n\n' +
    'Customer: ' + order.name + '\n' +
    'Phone: ' + order.phone + '\n' +
    'Address: ' + order.address + '\n' +
    'Status: ' + order.status + '\n\n' +
    'Items:\n' + itemsList + '\n\n' +
    'Total: $' + order.total.toFixed(2));
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

// Export Orders to CSV
function exportOrdersToCSV() {
  const orders = JSON.parse(localStorage.getItem('kc_orders') || '[]');
  
  if (orders.length === 0) {
    alert('No orders to export');
    return;
  }
  
  let csv = 'Order ID,Customer,Phone,Address,Items,Total,Status,Date\n';
  
  orders.forEach(order => {
    const items = order.items.map(i => i.qty + 'x ' + i.name).join('; ');
    const date = new Date(order.timestamp).toLocaleString();
    csv += '"' + order.id + '","' + order.name + '","' + order.phone + '","' + 
           order.address + '","' + items + '",' + order.total + ',"' + 
           order.status + '","' + date + '"\n';
  });
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'orders_' + new Date().toISOString().split('T')[0] + '.csv';
  a.click();
}

// Load Menu Items
function loadMenuItems() {
  const menu = JSON.parse(localStorage.getItem('kc_menu') || '[]');
  
  let html = '';
  menu.forEach(item => {
    html += '<div class="menu-item-card">';
    html += '<h4>' + item.name + '</h4>';
    html += '<p>' + item.desc + '</p>';
    html += '<p class="price">$' + item.price.toFixed(2) + '</p>';
    html += '<p style="font-size:12px;color:#999;text-transform:capitalize;">' + item.category + '</p>';
    html += '</div>';
  });
  
  document.getElementById('menu-items-grid').innerHTML = html;
}

// Load Analytics
function loadAnalytics() {
  const orders = JSON.parse(localStorage.getItem('kc_orders') || '[]');
  
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const avgOrder = orders.length > 0 ? totalRevenue / orders.length : 0;
  
  // Find best day
  const dayRevenue = {};
  orders.forEach(order => {
    const day = new Date(order.timestamp).toDateString();
    dayRevenue[day] = (dayRevenue[day] || 0) + order.total;
  });
  
  const bestDay = Object.keys(dayRevenue).reduce((a, b) => 
    dayRevenue[a] > dayRevenue[b] ? a : b, '-'
  );
  
  document.getElementById('total-revenue').textContent = '$' + totalRevenue.toFixed(2);
  document.getElementById('avg-order').textContent = '$' + avgOrder.toFixed(2);
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
    loadDashboard();
  }
});
