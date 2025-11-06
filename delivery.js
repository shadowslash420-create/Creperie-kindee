
/* Delivery Dashboard JavaScript */

let currentDeliveryFilter = 'all';

// Delivery Login
function deliveryLogin(username, password) {
  if (username === 'delivery' && password === 'delivery123') {
    localStorage.setItem('kc_delivery', '1');
    return true;
  }
  return false;
}

function deliveryLogout() {
  localStorage.removeItem('kc_delivery');
  window.location.href = 'index.html';
}

function isDeliveryLoggedIn() {
  return localStorage.getItem('kc_delivery') === '1';
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

// Load Delivery Orders
function loadDeliveryOrders() {
  const orders = JSON.parse(localStorage.getItem('kc_orders') || '[]');
  let filteredOrders = orders;
  
  if (currentDeliveryFilter !== 'all') {
    filteredOrders = orders.filter(o => o.status === currentDeliveryFilter);
  }
  
  // Count new orders accepted for delivery
  const newOrders = orders.filter(o => o.status === 'in-progress' && o.acceptedForDelivery).length;
  updateNewOrdersBadge(newOrders);
  
  let html = '<table class="orders-table"><thead><tr>';
  html += '<th>Order ID</th><th>Customer</th><th>Phone</th><th>Address</th>';
  html += '<th>Items</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
  
  if (filteredOrders.length === 0) {
    html += '<tr><td colspan="8" style="text-align:center;color:#999;padding:40px;">No orders found</td></tr>';
  } else {
    filteredOrders.reverse().forEach(order => {
      const isNew = order.status === 'in-progress' && order.acceptedForDelivery;
      const rowStyle = isNew ? ' style="background-color:#fff3e0;"' : '';
      html += '<tr' + rowStyle + '>';
      html += '<td class="order-id">#' + order.id + (isNew ? ' <span style="color:#FF6B35;font-weight:bold;">NEW</span>' : '') + '</td>';
      html += '<td>' + order.name + '</td>';
      html += '<td>' + order.phone + '</td>';
      html += '<td>' + order.address + '</td>';
      html += '<td>' + order.items.length + ' items</td>';
      html += '<td>$' + order.total.toFixed(2) + '</td>';
      html += '<td><span class="status-badge status-' + order.status + '">' + order.status + '</span></td>';
      html += '<td class="order-actions">';
      html += '<button class="action-btn btn-view" onclick="viewDeliveryOrder(\'' + order.id + '\')">View</button>';
      html += '<button class="action-btn btn-update" onclick="updateDeliveryOrderStatus(\'' + order.id + '\')">Update</button>';
      html += '</td>';
      html += '</tr>';
    });
  }
  
  html += '</tbody></table>';
  document.getElementById('delivery-orders-table').innerHTML = html;
}

// Filter Orders by Status
function filterDeliveryOrdersByStatus(status, evt) {
  currentDeliveryFilter = status;
  
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  if (evt && evt.target) {
    evt.target.classList.add('active');
  }
  
  loadDeliveryOrders();
}

// Filter Orders by Search
function filterDeliveryOrders() {
  const searchText = document.getElementById('order-search').value.toLowerCase();
  const orders = JSON.parse(localStorage.getItem('kc_orders') || '[]');
  
  let filtered = orders.filter(o => 
    o.name.toLowerCase().includes(searchText) || 
    o.id.toString().includes(searchText)
  );
  
  if (currentDeliveryFilter !== 'all') {
    filtered = filtered.filter(o => o.status === currentDeliveryFilter);
  }
  
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
      html += '<button class="action-btn btn-view" onclick="viewDeliveryOrder(\'' + order.id + '\')">View</button>';
      html += '<button class="action-btn btn-update" onclick="updateDeliveryOrderStatus(\'' + order.id + '\')">Update</button>';
      html += '</td>';
      html += '</tr>';
    });
  }
  
  html += '</tbody></table>';
  document.getElementById('delivery-orders-table').innerHTML = html;
}

// View Order Details
function viewDeliveryOrder(orderId) {
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
function updateDeliveryOrderStatus(orderId) {
  const orders = JSON.parse(localStorage.getItem('kc_orders') || '[]');
  const orderIndex = orders.findIndex(o => o.id === orderId);
  
  if (orderIndex === -1) return;
  
  const order = orders[orderIndex];
  const statusFlow = ['pending', 'in-progress', 'delivered'];
  const currentIndex = statusFlow.indexOf(order.status);
  
  if (currentIndex < statusFlow.length - 1) {
    order.status = statusFlow[currentIndex + 1];
    
    // Clear new order flag when moving to delivered
    if (order.status === 'delivered') {
      delete order.acceptedForDelivery;
    }
    
    localStorage.setItem('kc_orders', JSON.stringify(orders));
    loadDeliveryOrders();
    
    const toast = document.createElement('div');
    toast.textContent = '✓ Order #' + orderId + ' status updated to: ' + order.status;
    toast.style.position = 'fixed';
    toast.style.bottom = '100px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = 'rgba(58,74,84,0.95)';
    toast.style.color = 'white';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '50px';
    toast.style.zIndex = 9999;
    toast.style.fontSize = '14px';
    toast.style.fontWeight = '600';
    toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  } else {
    alert('Order is already delivered!');
  }
}

// Check delivery page login
function checkDeliveryPage() {
  const loginSection = document.getElementById('login-section');
  const deliverySection = document.getElementById('delivery-section');

  if (loginSection && deliverySection) {
    if (isDeliveryLoggedIn()) {
      loginSection.classList.add('hidden');
      deliverySection.classList.remove('hidden');
      loadDeliveryOrders();
    } else {
      loginSection.classList.remove('hidden');
      deliverySection.classList.add('hidden');
    }
  }
}

// Update new orders badge
function updateNewOrdersBadge(count) {
  let badge = document.getElementById('new-orders-badge');
  if (!badge && count > 0) {
    badge = document.createElement('span');
    badge.id = 'new-orders-badge';
    badge.style.cssText = 'position:absolute;top:8px;right:8px;background:#FF6B35;color:white;border-radius:12px;padding:2px 8px;font-size:12px;font-weight:bold;';
    const navItem = document.querySelector('.nav-item');
    if (navItem) {
      navItem.style.position = 'relative';
      navItem.appendChild(badge);
    }
  }
  
  if (badge) {
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = 'block';
    } else {
      badge.style.display = 'none';
    }
  }
}

// On load
document.addEventListener('DOMContentLoaded', () => {
  const deliveryForm = document.getElementById('delivery-login-form');
  if (deliveryForm) {
    deliveryForm.addEventListener('submit', e => {
      e.preventDefault();
      const u = document.getElementById('delivery-user').value;
      const p = document.getElementById('delivery-pass').value;
      if (deliveryLogin(u, p)) {
        checkDeliveryPage();
      } else {
        alert('Invalid credentials');
      }
    });
  }

  checkDeliveryPage();
  
  // Auto-refresh orders every 10 seconds when logged in
  if (isDeliveryLoggedIn()) {
    setInterval(() => {
      if (document.getElementById('delivery-section') && !document.getElementById('delivery-section').classList.contains('hidden')) {
        loadDeliveryOrders();
      }
    }, 10000);
  }
});
