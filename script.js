
/* script.js - Handles menu, cart, checkout, localStorage orders, admin auth */
const MENU_KEY = 'kc_menu';
const CART_KEY = 'kc_cart';
const ORDERS_KEY = 'kc_orders';

// default menu (Kinder-inspired)
const defaultMenu = [
  {id:'c1', name:'Kinder Nutella Crepe', desc:'Nutella, banana, whipped cream', price:5.5, img:'images/crepe1.jpg', category:'Sweet'},
  {id:'c2', name:'Strawberry Kinder', desc:'Fresh strawberries & Kinder flakes', price:6.0, img:'images/crepe2.jpg', category:'Sweet'},
  {id:'c3', name:'Ham & Cheese', desc:'Savory ham, melted cheese', price:6.5, img:'images/crepe3.jpg', category:'Savory'},
  {id:'c4', name:'Banoffee Delight', desc:'Banana, caramel, Kinder pieces', price:6.8, img:'images/crepe4.jpg', category:'Sweet'},
  {id:'c5', name:'Hot Chocolate Drink', desc:'Creamy hot chocolate with Kinder touch', price:3.5, img:'images/drink1.jpg', category:'Drinks'},
  {id:'c6', name:'Vegan Berry', desc:'Mixed berries, vegan cream', price:6.2, img:'images/crepe5.jpg', category:'Vegan'}
];

// init menu in localStorage if not present
if(!localStorage.getItem(MENU_KEY)){
  localStorage.setItem(MENU_KEY, JSON.stringify(defaultMenu));
}

function getMenu(){ return JSON.parse(localStorage.getItem(MENU_KEY) || '[]'); }
function saveMenu(m){ localStorage.setItem(MENU_KEY, JSON.stringify(m)); }

function getCart(){ return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
function saveCart(c){ localStorage.setItem(CART_KEY, JSON.stringify(c)); renderCart(); }

function getOrders(){ return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]'); }
function saveOrders(o){ localStorage.setItem(ORDERS_KEY, JSON.stringify(o)); }

/* ====== Customer pages ====== */

function renderMenuGrid(containerId){
  const container = document.getElementById(containerId);
  if(!container) return;
  const menu = getMenu();
  container.innerHTML = '';
  menu.forEach(item=>{
    const card = document.createElement('div'); card.className='card';
    const img = document.createElement('img'); img.src = item.img; img.alt = item.name;
    const h = document.createElement('h4'); h.textContent = item.name;
    const p = document.createElement('p'); p.textContent = item.desc;
    const meta = document.createElement('div'); meta.className='meta';
    const price = document.createElement('div'); price.textContent = '$' + Number(item.price).toFixed(2);
    const btn = document.createElement('button'); btn.textContent='Add'; btn.onclick=()=> addToCart(item.id);
    meta.appendChild(price); meta.appendChild(btn);
    card.appendChild(img); card.appendChild(h); card.appendChild(p); card.appendChild(meta);
    container.appendChild(card);
  });
}

function addToCart(id){
  const menu = getMenu(); const item = menu.find(m=>m.id===id); if(!item) return;
  const cart = getCart();
  const found = cart.find(c=>c.id===id);
  if(found){ found.qty += 1; } else { cart.push({id:item.id, name:item.name, price:item.price, qty:1}); }
  saveCart(cart);
  toast('Added to cart: ' + item.name);
}

function renderCart(){
  const container = document.getElementById('cart-contents');
  if(!container) return;
  const cart = getCart();
  container.innerHTML = '';
  if(cart.length===0){ container.innerHTML = '<div>Cart is empty</div>'; document.getElementById('cart-total').textContent = '$0.00'; return; }
  cart.forEach(it=>{
    const div = document.createElement('div'); div.className='cart-item';
    div.innerHTML = `<div><strong>${it.name}</strong><div class="text-sm">$${it.price.toFixed(2)}</div></div>`;
    const controls = document.createElement('div'); controls.className='qty';
    const minus = document.createElement('button'); minus.textContent='-'; minus.onclick = ()=> { updateQty(it.id, it.qty-1); };
    const q = document.createElement('span'); q.textContent = it.qty;
    const plus = document.createElement('button'); plus.textContent='+'; plus.onclick = ()=> { updateQty(it.id, it.qty+1); };
    const del = document.createElement('button'); del.textContent='×'; del.onclick = ()=> removeFromCart(it.id); del.style.marginLeft='8px';
    controls.appendChild(minus); controls.appendChild(q); controls.appendChild(plus); controls.appendChild(del);
    div.appendChild(controls);
    container.appendChild(div);
  });
  const total = cart.reduce((s,i)=>s + i.price * i.qty, 0);
  document.getElementById('cart-total').textContent = '$' + total.toFixed(2);
}

function updateQty(id, qty){
  let cart = getCart();
  cart = cart.map(c=> c.id===id ? {...c, qty: Math.max(0, qty)} : c).filter(c=>c.qty>0);
  saveCart(cart);
}

function removeFromCart(id){
  let cart = getCart();
  cart = cart.filter(c=>c.id!==id);
  saveCart(cart);
}

function checkoutFlow(){
  const cart = getCart();
  if(cart.length===0) return alert('السلة فارغة');
  const name = prompt('الاسم الكامل:');
  if(!name) return alert('مطلوب الاسم');
  const phone = prompt('رقم الهاتف:');
  if(!phone) return alert('مطلوب رقم الهاتف');
  const address = prompt('العنوان:');
  if(!address) return alert('مطلوب العنوان');
  const total = cart.reduce((s,i)=>s + i.price * i.qty, 0);
  const orders = getOrders();
  const id = 'ORD-' + Date.now();
  const order = { id, name, phone, address, items: cart, total, status:'Pending', createdAt: new Date().toISOString() };
  orders.push(order); saveOrders(orders);
  // clear cart
  saveCart([]);
  toast('تم إرسال الطلب! رقم الطلب: ' + id);
}

/* small toast */
function toast(msg){
  const t = document.createElement('div'); t.textContent = msg; t.style.position='fixed'; t.style.bottom='18px'; t.style.left='18px'; t.style.background='rgba(0,0,0,0.8)'; t.style.color='white'; t.style.padding='10px 14px'; t.style.borderRadius='10px'; t.style.zIndex=9999;
  document.body.appendChild(t); setTimeout(()=> t.remove(),2500);
}

/* ===== Admin ===== */
function adminLogin(username, password){
  // fixed credentials: admin / kinder123
  if(username === 'admin' && password === 'kinder123'){
    localStorage.setItem('kc_admin', '1');
    return true;
  }
  return false;
}
function adminLogout(){ localStorage.removeItem('kc_admin'); window.location.href='index.html'; }
function isAdmin(){ return localStorage.getItem('kc_admin') === '1'; }

function renderAdminOrders(){
  if(!isAdmin()) { window.location.href='admin.html'; return; }
  const list = document.getElementById('orders-list');
  const statsEl = document.getElementById('stats-area');
  const orders = getOrders().slice().reverse();
  if(!list) return;
  list.innerHTML = '';
  orders.forEach(o=>{
    const el = document.createElement('div'); el.className='order';
    el.innerHTML = `<div style="display:flex;justify-content:space-between"><div><strong>${o.id}</strong> <div class="text-sm">${o.name} • ${o.phone}</div></div><div><small>${new Date(o.createdAt).toLocaleString()}</small></div></div>`;
    const items = document.createElement('div'); items.className='text-sm'; items.textContent = o.items.map(i=> i.name + ' x' + i.qty).join(', ');
    const status = document.createElement('div'); status.style.marginTop='6px';
    const sel = document.createElement('select');
    ['Pending','In Progress','Delivered'].forEach(s=>{ const opt = document.createElement('option'); opt.value=s; opt.textContent=s; if(o.status===s) opt.selected=true; sel.appendChild(opt); });
    sel.onchange = ()=> updateOrderStatus(o.id, sel.value);
    status.appendChild(sel);
    el.appendChild(items); el.appendChild(status);
    list.appendChild(el);
  });
  // stats
  if(statsEl){
    const totalOrders = orders.length;
    const totalSales = orders.reduce((s,o)=>s + (o.total||0),0);
    const byStatus = orders.reduce((acc,o)=> { acc[o.status] = (acc[o.status]||0) +1; return acc; }, {});
    const popular = {};
    orders.forEach(o=> o.items.forEach(it=> { popular[it.name] = (popular[it.name]||0) + it.qty; }));
    const top = Object.entries(popular).sort((a,b)=>b[1]-a[1]).slice(0,5);
    statsEl.innerHTML = '<div class="stat-card"><strong>المبيعات الإجمالية</strong><div style="font-size:20px;margin-top:6px">$'+ totalSales.toFixed(2) +'</div></div>';
    statsEl.innerHTML += '<div class="stat-card"><strong>عدد الطلبات</strong><div style="font-size:18px;margin-top:6px">'+ totalOrders +'</div></div>';
    statsEl.innerHTML += '<div class="stat-card"><strong>حسب الحالة</strong><div style="margin-top:6px">Pending: '+(byStatus.Pending||0)+' • In Progress: '+(byStatus['In Progress']||0)+' • Delivered: '+(byStatus.Delivered||0)+'</div></div>';
    statsEl.innerHTML += '<div class="stat-card"><strong>الأكثر مبيعًا</strong><ul>' + top.map(t=>'<li>'+t[0]+' — '+t[1]+'</li>').join('') + '</ul></div>';
  }
}

function updateOrderStatus(id, status){
  const orders = getOrders();
  const o = orders.find(x=> x.id===id);
  if(!o) return;
  o.status = status;
  saveOrders(orders);
  renderAdminOrders();
  toast('تم تحديث حالة الطلب ' + id);
}

/* On load hooks for pages */
document.addEventListener('DOMContentLoaded', ()=>{
  // Menu grid
  renderMenuGrid('menu-grid');
  renderCart();
  // admin login page
  const adminForm = document.getElementById('admin-login-form');
  if(adminForm){
    adminForm.addEventListener('submit', e=>{
      e.preventDefault();
      const u = document.getElementById('adm-user').value;
      const p = document.getElementById('adm-pass').value;
      if(adminLogin(u,p)){ window.location.href='admin.html?view=orders'; } else { alert('خطأ في بيانات الدخول') }
    });
  }
  // admin orders page
  if(document.getElementById('orders-list')) renderAdminOrders();
});
