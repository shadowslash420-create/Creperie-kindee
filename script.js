/* script.js - Handles menu, cart, checkout, localStorage orders, admin auth */
const MENU_KEY = 'kc_menu';
const CART_KEY = 'kc_cart';
const ORDERS_KEY = 'kc_orders';

// default menu with proper categories
const defaultMenu = [
  {id:'c1', name:'Kinder Nutella Crepe', desc:'Nutella, banana, whipped cream', price:5.5, img:'images/crepe1.svg', category:'sweet'},
  {id:'c2', name:'Strawberry Kinder', desc:'Fresh strawberries & Kinder flakes', price:6.0, img:'images/crepe2.svg', category:'sweet'},
  {id:'c4', name:'Banoffee Delight', desc:'Banana, caramel, Kinder pieces', price:6.8, img:'images/crepe4.svg', category:'sweet'},
  {id:'c6', name:'Vegan Berry', desc:'Mixed berries, vegan cream', price:6.2, img:'images/crepe5.svg', category:'sweet'},
  {id:'c3', name:'Ham & Cheese', desc:'Savory ham, melted cheese', price:6.5, img:'images/crepe3.svg', category:'savory'},
  {id:'c7', name:'Chicken Alfredo', desc:'Grilled chicken, creamy sauce', price:7.5, img:'images/crepe3.svg', category:'savory'},
  {id:'c8', name:'Kids Ham Special', desc:'Ham & cheese for kids', price:4.5, img:'images/crepe3.svg', category:'kids'},
  {id:'c9', name:'Kids Nutella', desc:'Simple Nutella crepe', price:4.0, img:'images/crepe1.svg', category:'kids'},
  {id:'c5', name:'Hot Chocolate', desc:'Creamy hot chocolate', price:3.5, img:'images/drink1.svg', category:'drinks'},
  {id:'c10', name:'Fresh Orange Juice', desc:'Freshly squeezed orange juice', price:3.0, img:'images/drink1.svg', category:'drinks'}
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

/* ====== UI Functions ====== */

function toggleCart(){
  const cartSide = document.getElementById('cart-side');
  if(cartSide){
    cartSide.classList.toggle('open');
  }
}

function toggleMenu(){
  const navMenu = document.getElementById('nav-menu');
  const overlay = document.getElementById('menu-overlay');
  if(navMenu && overlay){
    navMenu.classList.toggle('open');
    overlay.classList.toggle('active');
    
    // Prevent body scroll when menu is open
    if(navMenu.classList.contains('open')){
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }
}

function switchTab(category){
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  // Show/hide sections
  const sections = ['sweet', 'savory', 'kids', 'drinks'];
  sections.forEach(sec => {
    const section = document.getElementById('section-' + sec);
    if(section){
      if(sec === category){
        section.classList.remove('hidden');
      } else {
        section.classList.add('hidden');
      }
    }
  });
}

/* ====== Menu Rendering ====== */

function renderMenuByCategory(category, containerId){
  const container = document.getElementById(containerId);
  if(!container) return;
  const menu = getMenu().filter(item => item.category === category);
  container.innerHTML = '';
  
  menu.forEach(item=>{
    const card = document.createElement('div');
    card.className = 'menu-item';
    card.onclick = () => addToCart(item.id);
    
    const img = document.createElement('img');
    img.className = 'menu-item-img';
    img.src = item.img;
    img.alt = item.name;
    
    const info = document.createElement('div');
    info.className = 'menu-item-info';
    
    const name = document.createElement('div');
    name.className = 'menu-item-name';
    name.textContent = item.name;
    
    const desc = document.createElement('div');
    desc.className = 'menu-item-desc';
    desc.textContent = item.desc;
    
    const price = document.createElement('div');
    price.className = 'menu-item-price';
    price.textContent = '$' + Number(item.price).toFixed(2);
    
    info.appendChild(name);
    info.appendChild(desc);
    info.appendChild(price);
    
    card.appendChild(img);
    card.appendChild(info);
    container.appendChild(card);
  });
}

function addToCart(id){
  const menu = getMenu();
  const item = menu.find(m=>m.id===id);
  if(!item) return;
  const cart = getCart();
  const found = cart.find(c=>c.id===id);
  if(found){
    found.qty += 1;
  } else {
    cart.push({id:item.id, name:item.name, price:item.price, qty:1});
  }
  saveCart(cart);
  toast('✓ أضيف إلى السلة');
  toggleCart();
}

function renderCart(){
  const container = document.getElementById('cart-contents');
  if(!container) return;
  const cart = getCart();
  container.innerHTML = '';
  
  if(cart.length===0){
    container.innerHTML = '<div style="text-align:center;padding:20px;color:#999">السلة فارغة</div>';
    const totalEl = document.getElementById('cart-total');
    if(totalEl) totalEl.textContent = '$0.00';
    return;
  }
  
  cart.forEach(it=>{
    const div = document.createElement('div');
    div.className='cart-item';
    
    const details = document.createElement('div');
    details.className = 'cart-item-details';
    
    const itemName = document.createElement('div');
    itemName.className = 'cart-item-name';
    itemName.textContent = it.name;
    
    const itemPrice = document.createElement('div');
    itemPrice.className = 'cart-item-price';
    itemPrice.textContent = '$' + it.price.toFixed(2);
    
    const controls = document.createElement('div');
    controls.className='qty';
    
    const minus = document.createElement('button');
    minus.textContent='-';
    minus.onclick = ()=> updateQty(it.id, it.qty-1);
    
    const q = document.createElement('span');
    q.textContent = it.qty;
    
    const plus = document.createElement('button');
    plus.textContent='+';
    plus.onclick = ()=> updateQty(it.id, it.qty+1);
    
    const del = document.createElement('button');
    del.textContent='×';
    del.onclick = ()=> removeFromCart(it.id);
    del.style.marginLeft='8px';
    
    controls.appendChild(minus);
    controls.appendChild(q);
    controls.appendChild(plus);
    controls.appendChild(del);
    
    details.appendChild(itemName);
    details.appendChild(itemPrice);
    details.appendChild(controls);
    
    div.appendChild(details);
    container.appendChild(div);
  });
  
  const total = cart.reduce((s,i)=>s + i.price * i.qty, 0);
  const totalEl = document.getElementById('cart-total');
  if(totalEl) totalEl.textContent = '$' + total.toFixed(2);
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
  const order = {
    id, name, phone, address,
    items: cart,
    total,
    status:'Pending',
    createdAt: new Date().toISOString()
  };
  orders.push(order);
  saveOrders(orders);
  saveCart([]);
  toggleCart();
  toast('✓ تم إرسال الطلب! رقم الطلب: ' + id);
}

/* Toast notification */
function toast(msg){
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.position='fixed';
  t.style.bottom='100px';
  t.style.left='50%';
  t.style.transform='translateX(-50%)';
  t.style.background='rgba(58,74,84,0.95)';
  t.style.color='white';
  t.style.padding='12px 24px';
  t.style.borderRadius='50px';
  t.style.zIndex=9999;
  t.style.fontSize='14px';
  t.style.fontWeight='600';
  t.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)';
  document.body.appendChild(t);
  setTimeout(()=> t.remove(),2500);
}

/* ===== Admin ===== */
function adminLogin(username, password){
  if(username === 'admin' && password === 'kinder123'){
    localStorage.setItem('kc_admin', '1');
    return true;
  }
  return false;
}

function adminLogout(){
  localStorage.removeItem('kc_admin');
  window.location.href='index.html';
}

function isAdmin(){
  return localStorage.getItem('kc_admin') === '1';
}

function renderAdminOrders(){
  const list = document.getElementById('orders-list');
  const statsEl = document.getElementById('stats-area');
  const orders = getOrders().slice().reverse();
  if(!list) return;
  list.innerHTML = '';
  orders.forEach(o=>{
    const el = document.createElement('div');
    el.className='order';
    el.innerHTML = `<div style="display:flex;justify-content:space-between"><div><strong>${o.id}</strong> <div class="text-sm">${o.name} • ${o.phone}</div></div><div><small>${new Date(o.createdAt).toLocaleString()}</small></div></div>`;
    const items = document.createElement('div');
    items.className='text-sm';
    items.textContent = o.items.map(i=> i.name + ' x' + i.qty).join(', ');
    const status = document.createElement('div');
    status.style.marginTop='6px';
    const sel = document.createElement('select');
    ['Pending','In Progress','Delivered'].forEach(s=>{
      const opt = document.createElement('option');
      opt.value=s;
      opt.textContent=s;
      if(o.status===s) opt.selected=true;
      sel.appendChild(opt);
    });
    sel.onchange = ()=> updateOrderStatus(o.id, sel.value);
    status.appendChild(sel);
    el.appendChild(items);
    el.appendChild(status);
    list.appendChild(el);
  });
  
  if(statsEl){
    const totalOrders = orders.length;
    const totalSales = orders.reduce((s,o)=>s + (o.total||0),0);
    const byStatus = orders.reduce((acc,o)=> {
      acc[o.status] = (acc[o.status]||0) +1;
      return acc;
    }, {});
    const popular = {};
    orders.forEach(o=> o.items.forEach(it=> {
      popular[it.name] = (popular[it.name]||0) + it.qty;
    }));
    const top = Object.entries(popular).sort((a,b)=>b[1]-a[1]).slice(0,5);
    statsEl.innerHTML = '<div class="stat-card"><strong>المبيعات الإجمالية</strong><div style="font-size:20px;margin-top:6px">$'+ totalSales.toFixed(2) +'</div></div>';
    statsEl.innerHTML += '<div class="stat-card"><strong>عدد الطلبات</strong><div style="font-size:18px;margin-top:6px">'+ totalOrders +'</div></div>';
    statsEl.innerHTML += '<div class="stat-card"><strong>حسب الحالة</strong><div style="margin-top:6px">Pending: '+(byStatus.Pending||0)+' • In Progress: '+(byStatus['In Progress']||0)+' • Delivered: '+(byStatus.Delivered||0)+'</div></div>';
    statsEl.innerHTML += '<div class="stat-card"><strong>الأكثر مبيعًا</strong><ul>' + top.map(t=>'<li>'+t[0]+' — '+t[1]+'</li>').join('') + '</ul></div>';
  }
}

function checkAdminPage(){
  const loginSection = document.getElementById('login-section');
  const adminSection = document.getElementById('admin-section');
  
  if(loginSection && adminSection){
    if(isAdmin()){
      loginSection.classList.add('hidden');
      adminSection.classList.remove('hidden');
      renderAdminOrders();
    } else {
      loginSection.classList.remove('hidden');
      adminSection.classList.add('hidden');
    }
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

/* Contact form */
function submitContact(e){
  e.preventDefault();
  const name = document.getElementById('contact-name').value;
  const email = document.getElementById('contact-email').value;
  const msg = document.getElementById('contact-msg').value;
  toast('شكراً ' + name + '! تم استلام رسالتك وسنرد عليك قريباً.');
  e.target.reset();
}

/* On load hooks */
document.addEventListener('DOMContentLoaded', ()=>{
  // Update menu if needed
  const currentMenu = getMenu();
  if(currentMenu.length > 0 && (!currentMenu[0].category || currentMenu[0].img.includes('.jpg'))){
    localStorage.setItem(MENU_KEY, JSON.stringify(defaultMenu));
  }
  
  // Render all category menus
  renderMenuByCategory('sweet', 'menu-sweet');
  renderMenuByCategory('savory', 'menu-savory');
  renderMenuByCategory('kids', 'menu-kids');
  renderMenuByCategory('drinks', 'menu-drinks');
  renderCart();
  
  // Admin login
  const adminForm = document.getElementById('admin-login-form');
  if(adminForm){
    adminForm.addEventListener('submit', e=>{
      e.preventDefault();
      const u = document.getElementById('adm-user').value;
      const p = document.getElementById('adm-pass').value;
      if(adminLogin(u,p)){
        checkAdminPage();
      } else {
        alert('خطأ في بيانات الدخول');
      }
    });
  }
  
  // Admin orders page
  checkAdminPage();
});
