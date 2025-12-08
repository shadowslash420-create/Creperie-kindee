/* script.js - Handles menu, cart, checkout, localStorage orders, admin auth */
const MENU_KEY = 'kc_menu';
const CART_KEY = 'kc_cart';
const ORDERS_KEY = 'kc_orders';
const LANG_KEY = 'kc_lang';
const FEEDBACK_KEY = 'kc_feedback';

// ==================== CRITICAL UI FUNCTIONS - DEFINED FIRST ====================
// These must be defined before anything else to ensure they're available for onclick handlers
window.toggleMenu = function() {
  const navMenu = document.getElementById('nav-menu');
  const overlay = document.getElementById('menu-overlay');
  const cartSide = document.getElementById('cart-side');

  if (navMenu && overlay) {
    const isOpen = navMenu.classList.contains('open');

    if (cartSide && cartSide.classList.contains('open')) {
      cartSide.classList.remove('open');
    }

    if (isOpen) {
      navMenu.classList.remove('open');
      overlay.classList.remove('active');
    } else {
      navMenu.classList.add('open');
      overlay.classList.add('active');
    }
  }
}

window.toggleCart = function() {
  const cartSide = document.getElementById('cart-side');
  const overlay = document.getElementById('menu-overlay');
  const navMenu = document.getElementById('nav-menu');

  if (cartSide && overlay) {
    const isOpen = cartSide.classList.contains('open');

    if (navMenu && navMenu.classList.contains('open')) {
      navMenu.classList.remove('open');
    }

    if (isOpen) {
      cartSide.classList.remove('open');
      overlay.classList.remove('active');
    } else {
      cartSide.classList.add('open');
      overlay.classList.add('active');
      if (typeof renderCart === 'function') {
        renderCart();
      } else if (typeof window.renderCart === 'function') {
        window.renderCart();
      }
    }
  }
}

window.closeAllSidebars = function() {
  const cartSide = document.getElementById('cart-side');
  const navMenu = document.getElementById('nav-menu');
  const overlay = document.getElementById('menu-overlay');

  if (cartSide) cartSide.classList.remove('open');
  if (navMenu) {
    navMenu.classList.add('instant-close');
    navMenu.classList.remove('open');
    setTimeout(() => {
      navMenu.classList.remove('instant-close');
    }, 50);
  }
  if (overlay) overlay.classList.remove('active');
}

// Import Firebase services
import dbService from './db-service.js';
import { getMenuFromFirebase, getCategoriesFromFirebase, placeOrderToFirebase, listenToMenuUpdates } from './firebase-customer.js';
import { getAuthInstance } from './firebase-config.js';
import { debounce, throttle, CacheStore, RequestDeduplicator, measurePerformance } from './perf-utils.js';

// ==================== SETTINGS LOADER ====================
let restaurantSettings = {
  businessPhone: '+213 5X XXX XXXX',
  businessEmail: 'contact@creperie.com',
  openingTime: '11:00',
  closingTime: '01:00',
  deliveryFee: 0,
  freeDeliveryMin: 800
};

async function loadRestaurantSettings() {
  try {
    const settings = await dbService.getSettings();

    // Map admin field names to our expected names
    const normalizedSettings = {
      businessPhone: settings.businessPhone || settings.phone || '+213 5X XXX XXXX',
      businessEmail: settings.businessEmail || 'contact@creperie.com',
      openingTime: settings.openingTime || settings.hours?.openTime || '11:00',
      closingTime: settings.closingTime || settings.hours?.closeTime || '01:00',
      deliveryFee: settings.deliveryFee || 0,
      freeDeliveryMin: settings.freeDeliveryMin || 800
    };

    restaurantSettings = { ...restaurantSettings, ...normalizedSettings };
    updateAllFooters();
    updateFAQSettings();
    updateDeliverySettings();
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

function updateAllFooters() {
  const footers = document.querySelectorAll('#footer-copyright');
  footers.forEach(footer => {
    const phone = restaurantSettings.businessPhone || '+213 5X XXX XXXX';
    const email = restaurantSettings.businessEmail || 'contact@creperie.com';
    footer.innerHTML = `© Creperie Kinder — طعم ممتع لعائلتك<br>
      اتصل: ${phone}<br>
      البريد: ${email}`;
  });
}

function formatTimeWithAMPM(time24) {
  const [hours, minutes] = time24.split(':');
  let hoursNum = parseInt(hours);
  const meridiem = hoursNum >= 12 ? 'PM' : 'AM';
  if (hoursNum > 12) hoursNum -= 12;
  if (hoursNum === 0) hoursNum = 12;
  return `${String(hoursNum).padStart(2, '0')}:${minutes} ${meridiem}`;
}

function updateFAQSettings() {
  const openTime = restaurantSettings.openingTime || '11:00';
  const closeTime = restaurantSettings.closingTime || '01:00';
  const deliveryFee = restaurantSettings.deliveryFee || 0;

  const lang = localStorage.getItem(LANG_KEY) || 'ar';
  const isArabic = lang === 'ar';

  const openTimeFormatted = formatTimeWithAMPM(openTime);
  const closeTimeFormatted = formatTimeWithAMPM(closeTime);

  // Update FAQ answer 1 for hours
  const q1 = document.getElementById('faq-a1');
  if (q1) {
    q1.textContent = isArabic 
      ? `نحن مفتوحون يومياً من الساعة ${openTimeFormatted} حتى ${closeTimeFormatted}`
      : `We are open daily from ${openTimeFormatted} to ${closeTimeFormatted}`;
  }

  // Update FAQ answer 2 for free delivery threshold
  const q2 = document.getElementById('faq-a2');
  if (q2) {
    const freeDeliveryMin = restaurantSettings.freeDeliveryMin || 800;
    q2.textContent = isArabic 
      ? `نعم، نوفر توصيل مجاني للطلبات التي تزيد عن ${freeDeliveryMin} DZD`
      : `Yes, we offer free delivery for orders over ${freeDeliveryMin} DZD`;
  }
}

function updateDeliverySettings() {
  const fee = restaurantSettings.deliveryFee || 0;
  const feeText = document.getElementById('delivery-fee-display');
  if (feeText) feeText.textContent = `${fee} DZD`;
}

// Settings load is now handled in main consolidated DOMContentLoaded listener above

// Listen for real-time settings changes
dbService.listenToSettingsChanges((settings) => {
  // Map admin field names to our expected names
  const normalizedSettings = {
    businessPhone: settings.businessPhone || settings.phone || '+213 5X XXX XXXX',
    businessEmail: settings.businessEmail || 'contact@creperie.com',
    openingTime: settings.openingTime || settings.hours?.openTime || '11:00',
    closingTime: settings.closingTime || settings.hours?.closeTime || '01:00',
    deliveryFee: settings.deliveryFee || 0,
    freeDeliveryMin: settings.freeDeliveryMin || 800
  };

  restaurantSettings = { ...restaurantSettings, ...normalizedSettings };
  updateAllFooters();
  updateFAQSettings();
  updateDeliverySettings();
});


// Initialize performance utilities
const queryCache = new CacheStore(50);
const requestDeduplicator = new RequestDeduplicator();

// Comprehensive Translations - All pages covered
const translations = {
  ar: {
    home: 'الرئيسية', about: 'من نحن', menu: 'القائمة', orders: 'طلباتي', faq: 'الأسئلة الشائعة', feedback: 'التقييمات', contact: 'تواصل معنا',
    cart: 'السلة', total: 'المجموع', checkout: 'إتمام الطلب', emptyCart: 'سلتك فارغة', addToCart: 'أضف للسلة', viewMenu: 'عرض القائمة',
    sweet: 'حلو', savory: 'مالح', drinks: 'مشروبات', kids: 'أطفال', oussa: 'الأوسا', oussi: 'الأوسي', allCategories: 'جميع الفئات',
    searchPlaceholder: 'ابحث في القائمة...', customerInfo: 'معلومات العميل', yourName: 'اسمك', phoneNumber: 'رقم الهاتف',
    deliveryAddress: 'عنوان التوصيل', specialInstructions: 'تعليمات خاصة (اختياري)', placeOrder: 'تأكيد الطلب', orderPlaced: 'تم تقديم طلبك!',
    orderConfirmation: 'سيتم الاتصال بك قريباً لتأكيد الطلب.', loading: 'جاري التحميل...', errorLoading: 'خطأ في التحميل',
    deliveryFee: 'رسوم التوصيل', subtotal: 'المجموع الفرعي', freeDelivery: 'توصيل مجاني!',
    minOrderForFreeDelivery: 'الحد الأدنى للتوصيل المجاني: 1000 DZD', addMore: 'أضف منتجات بقيمة {amount} DZD للحصول على توصيل مجاني!',
    aboutTitle: 'من نحن', aboutDesc1: 'تأسست بشغف لتقديم أفضل كريب للأطفال والكبار',
    aboutDesc2: 'رؤيتنا: سعادة كل زبون في كل قضمة', aboutTeamTitle: 'فريقنا', aboutChef: 'Chef Silo',
    aboutChefDesc: 'خبيرة الكريب والحشوات الممتازة', aboutManager: 'Manager Aymen', aboutManagerDesc: 'رعاية الجودة وتجربة الزبائن',
    contactTitle: 'تواصل معنا', contactName: 'اسمك', contactEmail: 'بريدك الإلكتروني', contactMessage: 'رسالتك', contactSubmit: 'أرسل',
    contactNameLabel: 'الاسم:', contactEmailLabel: 'الإيميل:', contactMessageLabel: 'الرسالة:', contactSubmitBtn: 'أرسل',
    faqTitle: 'الأسئلة الشائعة', feedbackTitle: 'التقييمات', feedbackName: 'اسمك', feedbackRating: 'التقييم', feedbackComment: 'تعليقك',
    feedbackSubmit: 'أرسل التقييم', myOrdersTitle: 'طلباتي', orderStatus: 'حالة الطلب', orderDate: 'تاريخ الطلب', orderItems: 'المنتجات',
    connect: 'تابعنا', copyright: '© Creperie Kinder — طعم ممتع لعائلتك', callUs: 'اتصل: +213 5X XXX XXXX',
    orderNow: 'اطلب الآن', discoverMenu: 'استكشف القائمة', whatWeOffer: 'ماذا نقدم لعائلتك', ourMenu: 'من قائمتنا',
    discoverProducts: 'اكتشف بعض من أشهى منتجاتنا', fullMenu: 'شاهد القائمة الكاملة', readyForExperience: 'جاهز لتجربة لا تُنسى؟',
    orderNowDescription: 'اطلب الآن واستمتع بطعم كيندر الأصيل', heroDesc: 'تجربة فاخرة مستوحاة من نكهات كيندر الشهيرة', whatWeOfferSubtitle: 'في كريبري كيندر، نؤمن بأن كل لحظة مع العائلة تستحق أن تكون مميزة. لهذا نقدم لكم تجربة فريدة تجمع بين الجودة والراحة والسعادة',
    offering1Title: 'أجواء عائلية دافئة', offering1Desc: 'مساحة مريحة وآمنة للعائلات مع مقاعد مخصصة للأطفال وجو مرحب للجميع',
    offering2Title: 'احتفالات خاصة', offering2Desc: 'نساعدك في تنظيم حفلات أعياد الميلاد والمناسبات العائلية بخيارات مخصصة',
    offering3Title: 'قائمة متنوعة للجميع', offering3Desc: 'خيارات متعددة تناسب جميع الأعمار من الأطفال إلى الكبار، حلو أو مالح',
    offering4Title: 'توصيل سريع للمنزل', offering4Desc: 'استمتع بطعمنا الشهي في منزلك مع خدمة توصيل سريعة وموثوقة',
    offering5Title: 'عروض عائلية', offering5Desc: 'باقات خاصة للعائلات بأسعار مميزة وتوصيل مجاني للطلبات الكبيرة',
    offering6Title: 'خدمة طوال اليوم', offering6Desc: 'نعمل من الساعة 11 صباحاً حتى 1 صباحاً لنكون دائماً في خدمتكم',
    'faq-q1': 'ما هي ساعات العمل؟', 'faq-a1': 'نحن مفتوحون يومياً من الساعة 11 صباحاً حتى 1 صباحاً',
    'faq-q2': 'هل توفرون توصيل مجاني؟', 'faq-a2': 'نعم، نوفر توصيل مجاني للطلبات التي تزيد عن 1000 DZD',
    'faq-q3': 'هل تستخدمون شوكولاتة كيندر الأصلية؟', 'faq-a3': 'بالتأكيد! نستخدم فقط شوكولاتة كيندر الأصلية ومكونات طازجة يومياً',
    'faq-q4': 'هل يمكنني تخصيص طلبي؟', 'faq-a4': 'نعم، يمكنك إضافة ملاحظات خاصة عند الطلب وسنقوم بتلبية طلبك حسب الإمكان',
    'faq-q5': 'كم يستغرق التحضير والتوصيل؟', 'faq-a5': 'عادة يستغرق التحضير 10-15 دقيقة، والتوصيل 20-30 دقيقة حسب موقعك',
    selectItem: 'اختر منتج', noFeedback: 'لا توجد تقييمات حتى الآن', feedbackSuccess: 'شكراً لتقييمك!',
    feedbackFormTitle: 'شاركنا تجربتك', feedbackNameLabel: 'اسمك:', feedbackRatingLabel: 'التقييم:', feedbackCommentLabel: 'تعليقك:',
    feedbackSubmitBtn: 'إرسال التقييم', feedbackReviewsTitle: 'تقييمات العملاء',
    status_pending: 'في الانتظار', status_received: 'تم استلام الطلب', status_preparing: 'جاري تحضير طلبك', 
    status_ready: 'جاهز للاستلام', status_picked_up: 'تم الالتقاط من قبل السائق', status_in_transit: 'في الطريق', 
    status_cancelled: 'تم الإلغاء'
  },
  en: {
    home: 'Home', about: 'About Us', menu: 'Menu', orders: 'My Orders', faq: 'FAQ', feedback: 'Feedback', contact: 'Contact',
    cart: 'Cart', total: 'Total', checkout: 'Checkout', emptyCart: 'Your cart is empty', addToCart: 'Add to Cart', viewMenu: 'View Menu',
    sweet: 'Sweet', savory: 'Savory', drinks: 'Drinks', kids: 'Kids', oussa: 'Oussa', oussi: 'Oussi', allCategories: 'All Categories',
    searchPlaceholder: 'Search menu...', customerInfo: 'Customer Information', yourName: 'Your Name', phoneNumber: 'Phone Number',
    deliveryAddress: 'Delivery Address', specialInstructions: 'Special Instructions (optional)', placeOrder: 'Place Order', orderPlaced: 'Order Placed!',
    orderConfirmation: 'We will contact you shortly to confirm your order.', loading: 'Loading...', errorLoading: 'Error Loading',
    deliveryFee: 'Delivery Fee', subtotal: 'Subtotal', freeDelivery: 'Free Delivery!',
    minOrderForFreeDelivery: 'Minimum order for free delivery: 1000 DZD', addMore: 'Add {amount} DZD more for free delivery!',
    aboutTitle: 'About Us', aboutDesc1: 'Founded with passion to provide the best crepes for children and adults',
    aboutDesc2: 'Our vision: Customer happiness in every bite', aboutTeamTitle: 'Our Team', aboutChef: 'Chef Silo',
    aboutChefDesc: 'Expert in crepes and excellent fillings', aboutManager: 'Manager Aymen', aboutManagerDesc: 'Quality care and customer experience',
    contactTitle: 'Contact Us', contactName: 'Your Name', contactEmail: 'Your Email', contactMessage: 'Your Message', contactSubmit: 'Send',
    contactNameLabel: 'Name:', contactEmailLabel: 'Email:', contactMessageLabel: 'Message:', contactSubmitBtn: 'Send',
    faqTitle: 'Frequently Asked Questions', feedbackTitle: 'Feedback', feedbackName: 'Your Name', feedbackRating: 'Rating', feedbackComment: 'Your Comment',
    feedbackSubmit: 'Submit Feedback', myOrdersTitle: 'My Orders', orderStatus: 'Order Status', orderDate: 'Order Date', orderItems: 'Items',
    connect: 'Follow Us', copyright: '© Creperie Kinder — Delicious taste for your family', callUs: 'Call: +213 5X XXX XXXX',
    orderNow: 'Order Now', discoverMenu: 'Discover Menu', whatWeOffer: 'What We Offer Your Family', ourMenu: 'From Our Menu',
    discoverProducts: 'Discover some of our finest products', fullMenu: 'View Full Menu', readyForExperience: 'Ready for an unforgettable experience?',
    orderNowDescription: 'Order now and enjoy authentic Kinder taste', heroDesc: 'A luxurious experience inspired by famous Kinder flavors', whatWeOfferSubtitle: 'At Creperie Kinder, we believe every moment with family deserves to be special. That\'s why we offer you a unique experience that combines quality, comfort, and happiness.',
    offering1Title: 'Warm Family Atmosphere', offering1Desc: 'A comfortable and safe space for families with dedicated children\'s seating and a welcoming atmosphere for all',
    offering2Title: 'Special Celebrations', offering2Desc: 'We help you organize birthday parties and family events with custom options',
    offering3Title: 'Diverse Menu for All', offering3Desc: 'Multiple options suitable for all ages from children to adults, sweet or savory',
    offering4Title: 'Fast Home Delivery', offering4Desc: 'Enjoy our delicious food at home with fast and reliable delivery service',
    offering5Title: 'Family Packages', offering5Desc: 'Special bundles for families at great prices with free delivery on large orders',
    offering6Title: 'All-Day Service', offering6Desc: 'We\'re open from 11 AM to 1 AM to always be at your service',
    'faq-q1': 'What are your opening hours?', 'faq-a1': 'We are open daily from 11 AM to 1 AM',
    'faq-q2': 'Do you offer free delivery?', 'faq-a2': 'Yes, we offer free delivery for orders over 1000 DZD',
    'faq-q3': 'Do you use original Kinder chocolate?', 'faq-a3': 'Absolutely! We only use original Kinder chocolate and fresh ingredients daily',
    'faq-q4': 'Can I customize my order?', 'faq-a4': 'Yes, you can add special notes when ordering and we will fulfill your request as best as we can',
    'faq-q5': 'How long does preparation and delivery take?', 'faq-a5': 'Usually preparation takes 10-15 minutes, and delivery takes 20-30 minutes depending on your location',
    selectItem: 'Select Product', noFeedback: 'No reviews yet', feedbackSuccess: 'Thank you for your review!',
    feedbackFormTitle: 'Share Your Experience', feedbackNameLabel: 'Your Name:', feedbackRatingLabel: 'Rating:', feedbackCommentLabel: 'Your Comment:',
    feedbackSubmitBtn: 'Submit Feedback', feedbackReviewsTitle: 'Customer Reviews',
    status_pending: 'Pending', status_received: 'Order Received', status_preparing: 'Preparing Your Order', 
    status_ready: 'Ready for Pickup', status_picked_up: 'Picked Up', status_in_transit: 'On the Way', 
    status_cancelled: 'Cancelled'
  }
};

let cart = [];
let menuItems = [];
let categories = [];
let currentLang = localStorage.getItem(LANG_KEY) || 'ar';

// Get current auth user
let currentAuthUser = null;

function getCurrentLang(){
  return currentLang;
}

function getT() {
  return translations[currentLang] || translations.en;
}

// Load cart from localStorage
function loadCart() {
  const stored = localStorage.getItem(CART_KEY);
  cart = stored ? JSON.parse(stored) : [];
}

// Save cart to localStorage
function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

// Add item to cart
window.addToCart = function(itemId, event) {
  const menuItem = menuItems.find(item => item.id === itemId);
  if (!menuItem) {
    console.error('Menu item not found:', itemId);
    return;
  }

  const existing = cart.find(c => c.id === itemId);
  const wasInCart = !!existing;

  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...menuItem, qty: 1 });
  }
  saveCart();
  updateCart();
  renderCart();

  // Flash animation on cart icon
  const cartIcon = document.querySelector('.cart-icon');
  if (cartIcon) {
    cartIcon.style.transform = 'scale(1.2)';
    setTimeout(() => { cartIcon.style.transform = 'scale(1)'; }, 200);
  }

  // Animate the button that was clicked
  let button = null;
  if (event && event.target) {
    button = event.target.closest('button');
  } else if (document.activeElement && document.activeElement.tagName === 'BUTTON') {
    button = document.activeElement;
  }

  if (button) {
    button.style.transform = 'scale(0.9)';
    button.style.transition = 'transform 0.1s';
    setTimeout(() => {
      button.style.transform = 'scale(1)';
    }, 100);
  }

  // Show toast notification
  const t = getT();
  const isArabic = currentLang === 'ar';
  const message = wasInCart 
    ? (isArabic ? `✅ تم زيادة الكمية: ${menuItem.name}` : `✅ Quantity increased: ${menuItem.name}`)
    : (isArabic ? `✅ تمت الإضافة للسلة: ${menuItem.name}` : `✅ Added to cart: ${menuItem.name}`);

  showToast(message, 'success');
}

// Show toast notification
function showToast(message, type = 'success') {
  // Remove existing toasts
  const existingToast = document.getElementById('cart-toast');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.id = 'cart-toast';
  toast.textContent = message;

  const colors = {
    success: '#52C41A',
    error: '#E30613',
    info: '#FF6B35'
  };

  toast.style.cssText = `
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    background: ${colors[type] || colors.success};
    color: white;
    padding: 16px 24px;
    border-radius: 50px;
    z-index: 9999;
    font-size: 15px;
    font-weight: 600;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    max-width: 90%;
    text-align: center;
    pointer-events: none;
  `;

  document.body.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  }, 10);

  // Animate out and remove
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(100px)';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// Update cart display
function updateCart() {
  const cartIcon = document.querySelector('.cart-icon');
  if (cartIcon && cart.length > 0) {
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    cartIcon.textContent = `🛒 (${totalQty})`;
  } else if (cartIcon) {
    cartIcon.textContent = '🛒';
  }
}

// Render cart contents
window.renderCart = function() {
  const cartContents = document.getElementById('cart-contents');
  const cartTotal = document.getElementById('cart-total');

  if (!cartContents) return;

  const t = getT();
  const lang = getCurrentLang();
  const isArabic = lang === 'ar';

  if (cart.length === 0) {
    cartContents.innerHTML = `<p style="text-align:center;color:#999;padding:40px 20px;">${t.emptyCart}</p>`;
    if (cartTotal) cartTotal.textContent = '0.00 DZD';
    return;
  }

  // Check for unsaved checkout data
  const checkoutFormData = JSON.parse(localStorage.getItem('kc_checkout_form_data') || '{}');
  const hasUnsavedCheckout = checkoutFormData.firstName || checkoutFormData.phone || checkoutFormData.address;

  let checkoutReminderBanner = '';
  if (hasUnsavedCheckout) {
    checkoutReminderBanner = `
      <div style="
        background: linear-gradient(135deg, #FFF3CD 0%, #FFE69C 100%);
        border: 2px solid #FFC107;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 20px;
        box-shadow: 0 4px 12px rgba(255, 193, 7, 0.2);
      ">
        <div style="display: flex; align-items: start; gap: 12px;">
          <div style="font-size: 24px; flex-shrink: 0;">⚠️</div>
          <div style="flex: 1;">
            <div style="font-weight: 700; color: #856404; margin-bottom: 6px; font-size: 15px;">
              ${isArabic ? '⏳ لم تكمل طلبك!' : '⏳ You didn\'t complete your order!'}
            </div>
            <div style="color: #856404; font-size: 13px; line-height: 1.5; margin-bottom: 12px;">
              ${isArabic 
                ? `لديك معلومات محفوظة: ${checkoutFormData.firstName || ''} ${checkoutFormData.lastName || ''}`
                : `You have saved information: ${checkoutFormData.firstName || ''} ${checkoutFormData.lastName || ''}`
              }
            </div>
            <button 
              onclick="resumeCheckout()"
              style="
                background: linear-gradient(135deg, #E30613 0%, #B30510 100%);
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(227, 6, 19, 0.3);
                transition: all 0.3s ease;
              "
              onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(227, 6, 19, 0.4)';"
              onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(227, 6, 19, 0.3)';"
            >
              ${isArabic ? '✅ استكمل الطلب' : '✅ Resume Checkout'}
            </button>
            <button 
              onclick="clearCheckoutFormData(); renderCart();"
              style="
                background: transparent;
                color: #856404;
                border: 1px solid #856404;
                padding: 10px 20px;
                border-radius: 8px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                margin-left: 8px;
                transition: all 0.3s ease;
              "
              onmouseover="this.style.background='rgba(133, 100, 4, 0.1)';"
              onmouseout="this.style.background='transparent';"
            >
              ${isArabic ? '🗑️ مسح' : '🗑️ Clear'}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  let html = checkoutReminderBanner;
  let subtotal = 0;

  cart.forEach((item, idx) => {
    const itemTotal = item.price * item.qty;
    subtotal += itemTotal;

    html += `
      <div class="cart-item" style="display:flex;justify-content:space-between;align-items:center;padding:12px;border-bottom:1px solid var(--border);gap:12px;">
        <div style="flex:1;min-width:0;">
          <div style="font-weight:600;margin-bottom:4px;word-wrap:break-word;">${item.name}</div>
          <div style="font-size:14px;color:#999;">${item.price.toFixed(2)} DZD × ${item.qty}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
          <button onclick="changeQty(${idx}, -1)" style="width:28px;height:28px;border:1px solid var(--border);background:#fff;border-radius:4px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;">−</button>
          <span style="min-width:24px;text-align:center;font-weight:600;">${item.qty}</span>
          <button onclick="changeQty(${idx}, 1)" style="width:28px;height:28px;border:1px solid var(--border);background:#fff;border-radius:4px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;">+</button>
          <button onclick="removeFromCart(${idx})" style="width:28px;height:28px;border:1px solid #e74c3c;background:#fff;color:#e74c3c;border-radius:4px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;">×</button>
        </div>
      </div>
    `;
  });

  cartContents.innerHTML = html;

  // Calculate delivery fee
  const deliveryFee = subtotal >= 1000 ? 0 : 200;
  const total = subtotal + deliveryFee;

  if (cartTotal) {
    const savedSubtotalLabel = localStorage.getItem('kc_saved_subtotal_label') || t.subtotal;
    const savedDeliveryLabel = localStorage.getItem('kc_saved_delivery_label') || t.deliveryFee;
    const savedFreeDeliveryLabel = localStorage.getItem('kc_saved_free_delivery_label') || t.freeDelivery;

    cartTotal.innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
        <span>${savedSubtotalLabel}:</span>
        <strong>${subtotal.toFixed(2)} DZD</strong>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
        <span>${savedDeliveryLabel}:</span>
        <strong style="color:${deliveryFee === 0 ? 'var(--success)' : 'var(--text-primary)'};">${deliveryFee === 0 ? savedFreeDeliveryLabel : deliveryFee.toFixed(2) + ' DZD'}</strong>
      </div>
      <div style="display:flex;justify-content:space-between;padding-top:12px;border-top:2px solid var(--border);font-size:18px;">
        <span style="font-weight:700;">${t.total}:</span>
        <strong style="color:var(--warm-gold);font-size:20px;">${total.toFixed(2)} DZD</strong>
      </div>
    `;
  }
}

// Change quantity
window.changeQty = function(idx, delta) {
  if (cart[idx]) {
    cart[idx].qty += delta;
    if (cart[idx].qty <= 0) {
      cart.splice(idx, 1);
    }
    saveCart();
    updateCart();
    renderCart();
  }
}

// Remove from cart
window.removeFromCart = function(idx) {
  cart.splice(idx, 1);
  saveCart();
  updateCart();
  renderCart();
}

// UI functions already defined at top of file

// Track checkout submission state
let isCheckoutSubmitting = false;

// Close checkout modal
window.closeCheckoutModal = function(event) {
  // Prevent submission if in progress
  if (isCheckoutSubmitting) {
    console.log('⏳ Cannot close modal during order submission');
    return;
  }

  // Prevent event bubbling if called from click event
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  console.log('🔴 Closing checkout modal');

  // Find and remove all checkout modals
  const modals = document.querySelectorAll('.checkout-modal-overlay, #checkout-modal');
  modals.forEach(modal => {
    if (modal) {
      modal.remove();
    }
  });

  // Clean up map if it exists
  if (checkoutMap) {
    try {
      checkoutMap.remove();
      checkoutMap = null;
      checkoutMarker = null;
    } catch (e) {
      console.log('Error cleaning up map:', e);
    }
  }

  // Reset submission flag
  isCheckoutSubmitting = false;

  // Re-enable body scroll
  document.body.style.overflow = '';
}

// Check staff role and redirect
async function checkStaffRoleAndRedirect() {
  try {
    const auth = await getAuthInstance();
    if (!auth.currentUser) return;

    const email = auth.currentUser.email.toLowerCase().trim();
    const staffId = email.replace(/[^a-z0-9]/g, '_').substring(0, 64);

    const staff = await dbService.getAllStaff();
    const staffMember = staff.find(s => s.id === staffId);

    if (staffMember) {
      console.log('👨‍💼 Staff member detected:', staffMember.role);
      if (staffMember.role === 'Staff A') {
        window.location.href = 'staff-a.html';
      } else if (staffMember.role === 'Staff B') {
        window.location.href = 'staff-b.html';
      }
    }
  } catch (error) {
    console.error('Error checking staff role:', error);
  }
}

// Submit checkout form
window.submitCheckoutForm = async function(event) {
  event.preventDefault();
  const t = getT();

  // Check if user is logged in (REQUIRED)
  let userEmail = null;
  let currentUser = null;
  try {
    const auth = await getAuthInstance();
    if (auth && auth.currentUser) {
      userEmail = auth.currentUser.email ? auth.currentUser.email.toLowerCase().trim() : null;
      currentUser = auth.currentUser;
      console.log('✅ User logged in with email:', userEmail);

      // Check if this is a staff member and redirect
      checkStaffRoleAndRedirect();
    }
  } catch (error) {
    console.log('Error checking auth:', error);
  }

  // Require authentication to place orders
  if (!userEmail || !currentUser) {
    alert(currentLang === 'ar' 
      ? 'يجب تسجيل الدخول أولاً لتقديم الطلب\n\nسيتم توجيهك إلى صفحة تسجيل الدخول...' 
      : 'You must sign in to place an order\n\nRedirecting to login page...');

    closeCheckoutModal();

    // Redirect to login page
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 500);
    return;
  }

  // Get form values
  const firstName = document.getElementById('checkout-firstname').value.trim();
  const lastName = document.getElementById('checkout-lastname').value.trim();
  const phone = document.getElementById('checkout-phone').value.trim();
  const address = document.getElementById('checkout-address').value.trim();
  const notes = document.getElementById('checkout-notes').value.trim();
  const lat = document.getElementById('checkout-lat').value;
  const lng = document.getElementById('checkout-lng').value;

  // Validate - require location selection
  if (!firstName || !lastName || !phone || !address) {
    alert(currentLang === 'ar' ? 'الرجاء ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
    return;
  }

  if (!lat || !lng) {
    alert(currentLang === 'ar' ? 'الرجاء تحديد موقع التوصيل على الخريطة' : 'Please select your delivery location on the map');
    return;
  }

  // Combine first and last name
  const fullName = `${firstName} ${lastName}`;

  // Save customer info including location
  localStorage.setItem('kc_customer_info', JSON.stringify({ 
    firstName, 
    lastName, 
    phone, 
    address,
    lat: parseFloat(lat),
    lng: parseFloat(lng)
  }));

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const deliveryFee = subtotal >= 1000 ? 0 : 200;
  const total = subtotal + deliveryFee;

  const orderData = {
    name: fullName,
    firstName,
    lastName,
    phone,
    address,
    email: userEmail,
    location: {
      lat: parseFloat(lat),
      lng: parseFloat(lng)
    },
    items: cart.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      qty: item.qty
    })),
    subtotal,
    deliveryFee,
    total,
    specialInstructions: notes || '',
    status: 'pending'
  };

  // Set submission flag
  isCheckoutSubmitting = true;

  // Disable submit button and show loading state
  const submitBtn = document.getElementById('checkout-submit-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = currentLang === 'ar' ? '⏳ جاري الإرسال...' : '⏳ Submitting...';
  }

  // Disable close button during submission
  const closeBtn = document.getElementById('checkout-close-btn');
  if (closeBtn) {
    closeBtn.style.opacity = '0.5';
    closeBtn.style.cursor = 'not-allowed';
    closeBtn.disabled = true;
  }

  // Hide any previous error messages
  const errorDiv = document.getElementById('checkout-error');
  if (errorDiv) {
    errorDiv.style.display = 'none';
  }

  try {
    closeAllSidebars();

    // Create order in Firebase
    const orderId = await placeOrderToFirebase(orderData);
    console.log('✅ Order created:', orderId);

    // Send notification to admin and staff via OneSignal (using new unified endpoint)
    try {
      const notifyResponse = await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'admin',
          orderId,
          customerName: fullName
        })
      });
      
      if (notifyResponse.ok) {
        const result = await notifyResponse.json();
        console.log('✅ Admin notification sent via OneSignal:', result.recipients, 'recipients');
      } else {
        console.warn('⚠️ Admin notification failed');
      }
    } catch (notifyError) {
      console.warn('⚠️ Could not send admin notification:', notifyError);
    }

    // Clear cart
    cart = [];
    saveCart();
    updateCart();
    renderCart();

    // Clear saved checkout form data after successful order
    clearCheckoutFormData();

    // Reset submission flag
    isCheckoutSubmitting = false;

    // Close modal only after success
    closeCheckoutModal();

    alert(t.orderPlaced + '\n' + t.orderConfirmation);

    // Redirect to orders page after successful order
    setTimeout(() => {
      window.location.href = 'my-orders.html?order=' + orderId;
    }, 1000);
  } catch (error) {
    console.error('Error placing order:', error);

    // Reset submission flag immediately
    isCheckoutSubmitting = false;

    // Re-enable submit button
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = currentLang === 'ar' ? '✅ تأكيد الطلب' : '✅ Confirm Order';
    }

    // Re-enable close button
    if (closeBtn) {
      closeBtn.style.opacity = '1';
      closeBtn.style.cursor = 'pointer';
      closeBtn.disabled = false;
    }

    // Show error message inline
    let errorDiv = document.getElementById('checkout-error');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.id = 'checkout-error';
      errorDiv.style.cssText = `
        background: #fee;
        color: #c33;
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 16px;
        border: 2px solid #fcc;
        font-weight: 600;
        text-align: center;
      `;
      const form = document.getElementById('checkout-form');
      if (form) {
        form.insertBefore(errorDiv, form.firstChild);
      }
    }

    // Show more specific error message
    let errorMessage = currentLang === 'ar' 
      ? '❌ حدث خطأ أثناء تقديم الطلب. يرجى المحاولة مرة أخرى.' 
      : '❌ Error placing order. Please try again.';

    if (error.code === 'permission-denied') {
      errorMessage = currentLang === 'ar'
        ? '❌ عذراً، لا يمكن إتمام الطلب حالياً. يرجى الاتصال بنا مباشرة.'
        : '❌ Sorry, cannot complete order now. Please contact us directly.';
    }

    errorDiv.textContent = errorMessage;
    errorDiv.style.display = 'block';

    // Scroll error into view
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// Save checkout form data to localStorage (auto-save during typing)
function saveCheckoutFormData() {
  const firstName = document.getElementById('checkout-firstname')?.value || '';
  const lastName = document.getElementById('checkout-lastname')?.value || '';
  const phone = document.getElementById('checkout-phone')?.value || '';
  const address = document.getElementById('checkout-address')?.value || '';
  const notes = document.getElementById('checkout-notes')?.value || '';
  const lat = document.getElementById('checkout-lat')?.value || '';
  const lng = document.getElementById('checkout-lng')?.value || '';

  const formData = {
    firstName,
    lastName,
    phone,
    address,
    notes,
    lat,
    lng,
    timestamp: Date.now()
  };

  localStorage.setItem('kc_checkout_form_data', JSON.stringify(formData));
}

// Clear checkout form data after successful order
function clearCheckoutFormData() {
  localStorage.removeItem('kc_checkout_form_data');
}

// Resume checkout with saved data
window.resumeCheckout = function() {
  closeAllSidebars();
  setTimeout(() => {
    checkoutFlow();
  }, 300);
}

// Checkout flow with modal
window.checkoutFlow = async function() {
  const t = getT();

  if (cart.length === 0) {
    alert(t.emptyCart);
    return;
  }

  closeAllSidebars();

  // Get saved info - prioritize checkout form data over customer info
  const checkoutFormData = JSON.parse(localStorage.getItem('kc_checkout_form_data') || '{}');
  const savedCustomerInfo = JSON.parse(localStorage.getItem('kc_customer_info') || '{}');
  
  // Merge data, with checkout form data taking priority (more recent)
  const savedInfo = {
    firstName: checkoutFormData.firstName || savedCustomerInfo.firstName || '',
    lastName: checkoutFormData.lastName || savedCustomerInfo.lastName || '',
    phone: checkoutFormData.phone || savedCustomerInfo.phone || '',
    address: checkoutFormData.address || savedCustomerInfo.address || '',
    notes: checkoutFormData.notes || '',
    lat: checkoutFormData.lat || savedCustomerInfo.lat || '',
    lng: checkoutFormData.lng || savedCustomerInfo.lng || ''
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const deliveryFee = subtotal >= 1000 ? 0 : 200;
  const total = subtotal + deliveryFee;

  // Create modal
  const modal = document.createElement('div');
  modal.id = 'checkout-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    overflow-y: auto;
  `;

  const lang = currentLang;
  const isArabic = lang === 'ar';

  modal.innerHTML = `
    <div style="
      background: white;
      border-radius: 16px;
      max-width: 500px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      overflow: hidden;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      position: relative;
      z-index: 1;
    ">
      <div style="
        background: linear-gradient(135deg, #E30613 0%, #B30510 100%);
        padding: 20px 24px;
        color: white;
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: relative;
        z-index: 10;
      ">
        <h2 style="margin: 0; font-size: 24px; font-weight: 700;">
          ${isArabic ? '🛒 إتمام الطلب' : '🛒 Complete Order'}
        </h2>
        <button type="button" id="checkout-close-btn" onclick="window.closeCheckoutModal(event)" style="
          background: rgba(255,255,255,0.25);
          border: 2px solid rgba(255,255,255,0.4);
          color: white;
          font-size: 28px;
          cursor: pointer;
          padding: 0;
          line-height: 1;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          flex-shrink: 0;
          z-index: 100;
          position: relative;
          transition: all 0.2s;
          font-weight: 300;
        ">×</button>
      </div>

      <div style="padding: 24px; overflow-y: auto; flex: 1;">
        <form id="checkout-form" onsubmit="submitCheckoutForm(event); return false;">
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 6px; font-weight: 600; color: #2C1810;">
              ${isArabic ? 'الاسم الأول' : 'First Name'} <span style="color: #E30613;">*</span>
            </label>
            <input 
              type="text" 
              id="checkout-firstname" 
              required
              value="${savedInfo.firstName || ''}"
              style="
                width: 100%;
                padding: 12px;
                border: 2px solid #FFE4E1;
                border-radius: 8px;
                font-size: 16px;
                font-family: 'Cormorant Garamond', serif;
                transition: border-color 0.3s;
                box-sizing: border-box;
              "
              onfocus="this.style.borderColor='#E30613'"
              onblur="this.style.borderColor='#FFE4E1'"
            />
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 6px; font-weight: 600; color: #2C1810;">
              ${isArabic ? 'اسم العائلة' : 'Last Name'} <span style="color: #E30613;">*</span>
            </label>
            <input 
              type="text" 
              id="checkout-lastname" 
              required
              value="${savedInfo.lastName || ''}"
              style="
                width: 100%;
                padding: 12px;
                border: 2px solid #FFE4E1;
                border-radius: 8px;
                font-size: 16px;
                font-family: 'Cormorant Garamond', serif;
                transition: border-color 0.3s;
                box-sizing: border-box;
              "
              onfocus="this.style.borderColor='#E30613'"
              onblur="this.style.borderColor='#FFE4E1'"
            />
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 6px; font-weight: 600; color: #2C1810;">
              ${isArabic ? 'رقم الهاتف' : 'Phone Number'} <span style="color: #E30613;">*</span>
            </label>
            <input 
              type="tel" 
              id="checkout-phone" 
              required
              value="${savedInfo.phone || ''}"
              placeholder="${isArabic ? 'مثال: 0555123456' : 'Example: 0555123456'}"
              style="
                width: 100%;
                padding: 12px;
                border: 2px solid #FFE4E1;
                border-radius: 8px;
                font-size: 16px;
                font-family: 'Cormorant Garamond', serif;
                transition: border-color 0.3s;
                box-sizing: border-box;
              "
              onfocus="this.style.borderColor='#E30613'"
              onblur="this.style.borderColor='#FFE4E1'"
            />
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 6px; font-weight: 600; color: #2C1810;">
              ${isArabic ? 'موقع التوصيل' : 'Delivery Location'} <span style="color: #E30613;">*</span>
            </label>
            <p style="font-size: 13px; color: #5C4033; margin-bottom: 8px;">
              ${isArabic ? '📍 انقر على الخريطة أو استخدم موقعي الحالي لتحديد عنوان التوصيل' : '📍 Click on the map or use my current location to set delivery address'}
            </p>
            <button 
              type="button" 
              id="use-my-location-btn"
              onclick="useMyLocation()"
              style="
                width: 100%;
                padding: 10px;
                background: linear-gradient(135deg, #52C41A 0%, #389E0D 100%);
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                margin-bottom: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
              "
            >
              📍 ${isArabic ? 'استخدم موقعي الحالي' : 'Use My Current Location'}
            </button>
            <div id="checkout-map" style="
              width: 100%;
              height: 250px;
              border-radius: 8px;
              border: 2px solid #FFE4E1;
              margin-bottom: 10px;
              z-index: 100;
              position: relative;
              background: #f5f5f5;
            "></div>
            <input type="hidden" id="checkout-lat" value="${savedInfo.lat || ''}" />
            <input type="hidden" id="checkout-lng" value="${savedInfo.lng || ''}" />
            <textarea 
              id="checkout-address" 
              required
              rows="2"
              placeholder="${isArabic ? 'تفاصيل إضافية للعنوان (رقم الشقة، علامة مميزة...)' : 'Additional address details (apt number, landmark...)'}"
              style="
                width: 100%;
                padding: 12px;
                border: 2px solid #FFE4E1;
                border-radius: 8px;
                font-size: 16px;
                font-family: 'Cormorant Garamond', serif;
                resize: vertical;
                transition: border-color 0.3s;
                box-sizing: border-box;
              "
              onfocus="this.style.borderColor='#E30613'"
              onblur="this.style.borderColor='#FFE4E1'"
            >${savedInfo.address || ''}</textarea>
            <p id="selected-location-text" style="font-size: 12px; color: #52C41A; margin-top: 4px; display: none;">
              ✅ ${isArabic ? 'تم تحديد الموقع' : 'Location selected'}
            </p>
          </div>

          <div style="margin-bottom: 24px;">
            <label style="display: block; margin-bottom: 6px; font-weight: 600; color: #2C1810;">
              ${isArabic ? 'ملاحظات (اختياري)' : 'Notes (Optional)'}
            </label>
            <textarea 
              id="checkout-notes" 
              rows="3"
              placeholder="${isArabic ? 'أي تعليمات خاصة...' : 'Any special instructions...'}"
              style="
                width: 100%;
                padding: 12px;
                border: 2px solid #FFE4E1;
                border-radius: 8px;
                font-size: 16px;
                font-family: 'Cormorant Garamond', serif;
                resize: vertical;
                transition: border-color 0.3s;
              "
              onfocus="this.style.borderColor='#E30613'"
              onblur="this.style.borderColor='#FFE4E1'"
            ></textarea>
          </div>

          <div style="
            background: linear-gradient(135deg, #FFF5F5 0%, #FFE8E8 100%);
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 24px;
          ">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>${isArabic ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
              <strong>${subtotal.toFixed(2)} DZD</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>${isArabic ? 'رسوم التوصيل:' : 'Delivery Fee:'}</span>
              <strong style="color: ${deliveryFee === 0 ? '#52C41A' : '#2C1810'};">
                ${deliveryFee === 0 ? (isArabic ? 'مجاناً!' : 'Free!') : deliveryFee.toFixed(2) + ' DZD'}
              </strong>
            </div>
            <div style="
              display: flex;
              justify-content: space-between;
              padding-top: 12px;
              border-top: 2px solid #FFE4E1;
              font-size: 20px;
              color: #E30613;
            ">
              <strong>${isArabic ? 'الإجمالي:' : 'Total:'}</strong>
              <strong>${total.toFixed(2)} DZD</strong>
            </div>
            ${deliveryFee > 0 ? `
              <div style="margin-top: 8px; font-size: 14px; color: #5C4033;">
                ${isArabic ? `💡 احصل على توصيل مجاني عند الطلب بقيمة 1000 دج أو أكثر` : `💡 Get free delivery on orders of 1000 DZD or more`}
              </div>
            ` : ''}
          </div>

          <button 
            type="submit" 
            id="checkout-submit-btn"
            style="
              width: 100%;
              padding: 16px;
              background: linear-gradient(135deg, #E30613 0%, #B30510 100%);
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 18px;
              font-weight: 700;
              cursor: pointer;
              transition: transform 0.2s, box-shadow 0.2s;
              box-shadow: 0 4px 12px rgba(227, 6, 19, 0.4);
            "
            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(227, 6, 19, 0.5)';"
            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(227, 6, 19, 0.4)';"
          >
            ${isArabic ? '✅ تأكيد الطلب' : '✅ Confirm Order'}
          </button>
        </form>
      </div>
    </div>
  `;

  // Close on background click (but not during submission)
  modal.addEventListener('click', (e) => {
    if (e.target === modal && !isCheckoutSubmitting) {
      closeCheckoutModal();
    }
  });

  document.body.appendChild(modal);

  // Add auto-save listeners to all form inputs
  setTimeout(() => {
    const formInputs = [
      'checkout-firstname',
      'checkout-lastname', 
      'checkout-phone',
      'checkout-address',
      'checkout-notes',
      'checkout-lat',
      'checkout-lng'
    ];

    formInputs.forEach(inputId => {
      const input = document.getElementById(inputId);
      if (input) {
        input.addEventListener('input', saveCheckoutFormData);
        input.addEventListener('change', saveCheckoutFormData);
      }
    });

    console.log('✅ Checkout form auto-save enabled');
  }, 100);

  // Add click event listener to close button - MUST be synchronous
  const closeBtn = document.getElementById('checkout-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('🔴 Close button clicked');
      closeCheckoutModal();
    });

    closeBtn.addEventListener('mouseover', () => {
      if (!isCheckoutSubmitting) {
        closeBtn.style.background = 'rgba(255,255,255,0.4)';
        closeBtn.style.transform = 'scale(1.1)';
      }
    });

    closeBtn.addEventListener('mouseout', () => {
      closeBtn.style.background = 'rgba(255,255,255,0.25)';
      closeBtn.style.transform = 'scale(1)';
    });

    console.log('✅ Close button event listener attached');
  }

  // Initialize map after modal is fully rendered and visible
  function waitAndInitMap(attempts = 0) {
    const mapContainer = document.getElementById('checkout-map');
    const modal = document.querySelector('.checkout-modal-overlay');
    
    if (!mapContainer || !modal) {
      if (attempts < 10) {
        setTimeout(() => waitAndInitMap(attempts + 1), 100);
      }
      return;
    }

    // Check parent modal visibility
    const modalStyle = window.getComputedStyle(modal);
    const isModalVisible = modalStyle.display !== 'none' && modalStyle.visibility !== 'hidden';
    
    const rect = mapContainer.getBoundingClientRect();
    const hasHeight = mapContainer.offsetHeight > 0 && rect.height > 0;
    const hasWidth = mapContainer.offsetWidth > 0 && rect.width > 0;

    console.log(`🗺️ Map init attempt ${attempts}: visible=${isModalVisible}, width=${mapContainer.offsetWidth}, height=${mapContainer.offsetHeight}`);

    if (isModalVisible && hasHeight && hasWidth && attempts > 2) {
      console.log('🗺️ Container ready. Initializing map with dimensions:', mapContainer.offsetWidth, 'x', mapContainer.offsetHeight);
      initCheckoutMap(savedInfo);
      return;
    }

    if (attempts < 30) {
      setTimeout(() => waitAndInitMap(attempts + 1), 150);
    } else {
      console.warn('🗺️ Map initialization timeout - forcing init anyway');
      initCheckoutMap(savedInfo);
    }
  }
  
  // Wait for modal to be fully visible before initializing map
  setTimeout(() => waitAndInitMap(), 300);

  // Focus first input
  setTimeout(() => {
    const firstInput = document.getElementById('checkout-firstname');
    if (firstInput) firstInput.focus();
  }, 300);

  // Google Maps handles sizing automatically, no resize needed
}

// Map variables
let checkoutMap = null;
let checkoutMarker = null;

// Initialize checkout map with Google Maps
function initCheckoutMap(savedInfo) {
  const mapContainer = document.getElementById('checkout-map');
  if (!mapContainer) {
    console.error('⚠️ Map container not found');
    return;
  }

  // Wait for Google Maps to load
  if (!window.google || !window.google.maps) {
    console.warn('⚠️ Google Maps not loaded yet, retrying in 500ms...');
    setTimeout(() => initCheckoutMap(savedInfo), 500);
    return;
  }

  // Default to Algeria (Blida area - near Kinder 5)
  const defaultLat = savedInfo.lat ? parseFloat(savedInfo.lat) : 36.4700;
  const defaultLng = savedInfo.lng ? parseFloat(savedInfo.lng) : 2.8277;
  const hasExistingLocation = savedInfo.lat && savedInfo.lng;

  console.log('🗺️ Initializing Google Map at:', defaultLat, defaultLng, 'Has existing:', hasExistingLocation);

  // Ensure map container is visible and has explicit dimensions
  mapContainer.style.display = 'block';
  mapContainer.style.visibility = 'visible';
  mapContainer.style.width = '100%';
  mapContainer.style.height = '250px';
  mapContainer.style.minHeight = '250px';

  try {
    const defaultLocation = { lat: defaultLat, lng: defaultLng };
    
    // Ensure container has explicit dimensions for Google Maps
    const containerWidth = mapContainer.offsetWidth;
    const containerHeight = mapContainer.offsetHeight;
    console.log('🗺️ Map container dimensions:', containerWidth, 'x', containerHeight);
    
    // Create Google Map
    checkoutMap = new google.maps.Map(mapContainer, {
      zoom: hasExistingLocation ? 16 : 13,
      center: defaultLocation,
      mapTypeControl: true,
      fullscreenControl: false,
      streetViewControl: false,
      gestureHandling: 'greedy'
    });

    // Force resize and recenter after a brief delay to ensure proper rendering
    setTimeout(() => {
      if (checkoutMap) {
        google.maps.event.trigger(checkoutMap, 'resize');
        checkoutMap.setCenter(defaultLocation);
        console.log('🗺️ Map resized and recentered');
      }
    }, 200);

    // Create red marker icon
    const markerIcon = {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 12,
      fillColor: '#E30613',
      fillOpacity: 1,
      strokeColor: 'white',
      strokeWeight: 3
    };

    // Add marker if location exists
    if (hasExistingLocation) {
      checkoutMarker = new google.maps.Marker({
        position: defaultLocation,
        map: checkoutMap,
        icon: markerIcon,
        draggable: true
      });

      // Update inputs with saved location
      const latInput = document.getElementById('checkout-lat');
      const lngInput = document.getElementById('checkout-lng');
      if (latInput && lngInput) {
        latInput.value = defaultLat.toString();
        lngInput.value = defaultLng.toString();
      }

      setupMarkerDrag(checkoutMarker);
      showLocationConfirmation();
      console.log('✅ Marker added at saved location');
    }

    // Click on map to set location
    checkoutMap.addListener('click', (e) => {
      const clickLat = e.latLng.lat();
      const clickLng = e.latLng.lng();
      console.log('📍 Map clicked at:', clickLat, clickLng);
      setMapLocation(clickLat, clickLng);
    });

    console.log('✅ Google Map initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing map:', error);
    mapContainer.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100%;color:#E30613;font-weight:600;">
        ⚠️ Error loading map. Please try again.
      </div>
    `;
  }
}

// Set location on map
function setMapLocation(lat, lng) {
  if (!checkoutMap) {
    console.error('❌ Map not initialized');
    return;
  }

  const preciseLat = parseFloat(lat);
  const preciseLng = parseFloat(lng);

  console.log('📍 Setting location on map:', preciseLat, preciseLng);

  const markerIcon = {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 12,
    fillColor: '#E30613',
    fillOpacity: 1,
    strokeColor: 'white',
    strokeWeight: 3
  };

  // Remove existing marker
  if (checkoutMarker) {
    checkoutMarker.setMap(null);
    console.log('🗑️ Removed old marker');
  }

  // Add new marker
  const newLocation = { lat: preciseLat, lng: preciseLng };
  checkoutMarker = new google.maps.Marker({
    position: newLocation,
    map: checkoutMap,
    icon: markerIcon,
    draggable: true
  });
  setupMarkerDrag(checkoutMarker);

  // Update hidden inputs
  const latInput = document.getElementById('checkout-lat');
  const lngInput = document.getElementById('checkout-lng');

  if (latInput && lngInput) {
    latInput.value = preciseLat.toString();
    lngInput.value = preciseLng.toString();
    console.log('✅ Coordinates saved to hidden inputs:', latInput.value, lngInput.value);
    saveCheckoutFormData();
  }

  // Center map on new location
  checkoutMap.setCenter(newLocation);
  checkoutMap.setZoom(16);

  showLocationConfirmation();
  console.log('✅ Location set successfully:', preciseLat, preciseLng);
}

// Setup marker drag events
function setupMarkerDrag(marker) {
  marker.addListener('dragend', function(e) {
    const position = marker.getPosition();
    const preciseLat = position.lat();
    const preciseLng = position.lng();

    const latInput = document.getElementById('checkout-lat');
    const lngInput = document.getElementById('checkout-lng');

    if (latInput && lngInput) {
      latInput.value = preciseLat.toString();
      lngInput.value = preciseLng.toString();
      console.log('📍 Marker moved to:', preciseLat, preciseLng);
      console.log('✅ Updated inputs:', latInput.value, lngInput.value);
      saveCheckoutFormData();
    }

    showLocationConfirmation();
  });
}

// Show location confirmation text
function showLocationConfirmation() {
  const confirmText = document.getElementById('selected-location-text');
  if (confirmText) {
    confirmText.style.display = 'block';
  }
}

// Use current location
window.useMyLocation = function() {
  const btn = document.getElementById('use-my-location-btn');
  const latInput = document.getElementById('checkout-lat');
  const lngInput = document.getElementById('checkout-lng');
  const isArabic = currentLang === 'ar';

  console.log('📍 Requesting current location...');

  if (!navigator.geolocation) {
    const errorMsg = isArabic ? 'المتصفح لا يدعم تحديد الموقع' : 'Geolocation is not supported by your browser';
    alert(errorMsg);
    console.error('❌ Geolocation not supported');
    return;
  }

  // Show loading state
  if (btn) {
    btn.innerHTML = `<span style="display:flex;align-items:center;gap:8px;">⏳ ${isArabic ? 'جاري تحديد الموقع...' : 'Getting location...'}</span>`;
    btn.disabled = true;
    btn.style.opacity = '0.7';
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const accuracy = position.coords.accuracy;

      console.log('✅ Location obtained:', { lat, lng, accuracy: accuracy + 'm' });

      // CRITICAL: Set the hidden input values FIRST
      if (latInput && lngInput) {
        latInput.value = lat;
        lngInput.value = lng;
        console.log('✅ Coordinates saved to inputs:', latInput.value, lngInput.value);
      }

      // Then update the map visualization
      setMapLocation(lat, lng);

      // Update address field with coordinates
      const addressField = document.getElementById('checkout-address');
      if (addressField && !addressField.value.trim()) {
        addressField.value = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
        addressField.placeholder = isArabic ? 'أضف تفاصيل إضافية للعنوان...' : 'Add additional address details...';
      }

      // Show confirmation
      showLocationConfirmation();

      // Reset button with success state
      if (btn) {
        btn.innerHTML = `✅ ${isArabic ? 'تم تحديد الموقع' : 'Location Set'}`;
        btn.style.background = 'linear-gradient(135deg, #52C41A 0%, #389E0D 100%)';
        btn.style.opacity = '1';

        setTimeout(() => {
          btn.innerHTML = `📍 ${isArabic ? 'استخدم موقعي الحالي' : 'Use My Current Location'}`;
          btn.style.background = 'linear-gradient(135deg, #52C41A 0%, #389E0D 100%)';
          btn.disabled = false;
        }, 2000);
      }
    },
    (error) => {
      console.error('❌ Geolocation error:', error.code, error.message);

      let errorMsg = isArabic ? 'تعذر تحديد موقعك' : 'Could not get your location';
      let detailMsg = '';

      switch(error.code) {
        case error.PERMISSION_DENIED:
          errorMsg = isArabic ? 'تم رفض الإذن بالوصول إلى الموقع' : 'Location permission denied';
          detailMsg = isArabic 
            ? 'يرجى السماح بالوصول إلى موقعك في إعدادات المتصفح' 
            : 'Please allow location access in your browser settings';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMsg = isArabic ? 'الموقع غير متاح' : 'Location unavailable';
          detailMsg = isArabic 
            ? 'تأكد من تفعيل GPS على جهازك' 
            : 'Make sure GPS is enabled on your device';
          break;
        case error.TIMEOUT:
          errorMsg = isArabic ? 'انتهت مهلة تحديد الموقع' : 'Location request timed out';
          detailMsg = isArabic 
            ? 'يرجى المحاولة مرة أخرى' 
            : 'Please try again';
          break;
      }

      alert(errorMsg + '\n\n' + detailMsg);

      // Reset button
      if (btn) {
        btn.innerHTML = `📍 ${isArabic ? 'استخدم موقعي الحالي' : 'Use My Current Location'}`;
        btn.style.background = 'linear-gradient(135deg, #52C41A 0%, #389E0D 100%)';
        btn.style.opacity = '1';
        btn.disabled = false;
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    }
  );
}

// Toggle language
window.toggleLanguage = function() {
  currentLang = currentLang === 'ar' ? 'en' : 'ar';
  localStorage.setItem(LANG_KEY, currentLang);

  applyTranslations();

  if (typeof window.applyOrderTranslations === 'function') {
    window.applyOrderTranslations();
  }

  renderCart();

  const isMenuPage = window.location.pathname.includes('menu.html');
  if (isMenuPage) {
    renderMenu();
  }

  const isHomePage = window.location.pathname === '/' || 
                     window.location.pathname === '/index.html' || 
                     window.location.pathname.endsWith('/');
  if (isHomePage) {
    renderHomeMenuPreview();
  }

  // Update language button tooltip
  const langBtn = document.getElementById('lang-btn');
  if (langBtn) {
    langBtn.title = currentLang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية';
  }
}

// Apply translations to ALL pages including index sections
window.applyTranslations = function() {
  const t = getT();

  // Navigation and menu links
  document.querySelectorAll('.nav-link-home').forEach(el => el.textContent = t.home);
  document.querySelectorAll('.nav-link-about').forEach(el => el.textContent = t.about);
  document.querySelectorAll('.nav-link-menu').forEach(el => el.textContent = t.menu);
  document.querySelectorAll('.nav-link-orders').forEach(el => el.textContent = t.orders);
  document.querySelectorAll('.nav-link-faq').forEach(el => el.textContent = t.faq);
  document.querySelectorAll('.nav-link-feedback').forEach(el => el.textContent = t.feedback);
  document.querySelectorAll('.nav-link-contact').forEach(el => el.textContent = t.contact);

  // Translate all elements by ID for all pages
  const elementIds = {
    'page-indicator': t.home,
    'cart-title': t.cart,
    'total-label': t.total + ':',
    'checkout-btn': t.checkout,
    'hero-btn': t.discoverMenu,
    'hero-desc': t.heroDesc,
    'what-we-offer-title': t.whatWeOffer,
    'what-we-offer-subtitle': t.whatWeOfferSubtitle,
    'offering1-title': t.offering1Title,
    'offering1-desc': t.offering1Desc,
    'offering2-title': t.offering2Title,
    'offering2-desc': t.offering2Desc,
    'offering3-title': t.offering3Title,
    'offering3-desc': t.offering3Desc,
    'offering4-title': t.offering4Title,
    'offering4-desc': t.offering4Desc,
    'offering5-title': t.offering5Title,
    'offering5-desc': t.offering5Desc,
    'offering6-title': t.offering6Title,
    'offering6-desc': t.offering6Desc,
    'menu-preview-title': t.ourMenu,
    'discover-products': t.discoverProducts,
    'view-full-menu-btn': t.fullMenu,
    'cta-title': t.readyForExperience,
    'cta-desc': t.orderNowDescription,
    'cta-btn': t.orderNow,
    'footer-copyright': t.copyright,
    'footer-connect': t.connect,
    'about-title': t.aboutTitle,
    'about-desc1': t.aboutDesc1,
    'about-desc2': t.aboutDesc2,
    'about-team-title': t.aboutTeamTitle,
    'about-chef': t.aboutChef,
    'about-chef-desc': t.aboutChefDesc,
    'about-manager': t.aboutManager,
    'about-manager-desc': t.aboutManagerDesc,
    'contact-title': t.contactTitle,
    'contact-name-label': t.contactNameLabel,
    'contact-email-label': t.contactEmailLabel,
    'contact-message-label': t.contactMessageLabel,
    'contact-submit': t.contactSubmitBtn,
    'faq-title': t.faqTitle,
    'faq-q1': t['faq-q1'],
    'faq-q2': t['faq-q2'],
    'faq-q3': t['faq-q3'],
    'faq-q4': t['faq-q4'],
    'faq-q5': t['faq-q5'],
    'faq-a3': t['faq-a3'],
    'faq-a4': t['faq-a4'],
    'faq-a5': t['faq-a5'],
    'feedback-title': t.feedbackTitle,
    'feedback-form-title': t.feedbackFormTitle,
    'feedback-name-label': t.feedbackNameLabel,
    'feedback-rating-label': t.feedbackRatingLabel,
    'feedback-comment-label': t.feedbackCommentLabel,
    'feedback-submit': t.feedbackSubmitBtn,
    'feedback-reviews-title': t.feedbackReviewsTitle,
    'menu-search': t.searchPlaceholder,
  };

  // Apply translations by ID
  Object.entries(elementIds).forEach(([id, text]) => {
    const el = document.getElementById(id);
    if (el && text) {
      if (el.tagName === 'INPUT' && el.type === 'text') {
        el.placeholder = text;
      } else {
        el.textContent = text;
      }
    }
  });

  // Update FAQ with dynamic settings (hours, delivery fee)
  updateFAQSettings();

  // Save translations for later use
  localStorage.setItem('kc_saved_subtotal_label', t.subtotal);
  localStorage.setItem('kc_saved_delivery_label', t.deliveryFee);
  localStorage.setItem('kc_saved_free_delivery_label', t.freeDelivery);
}

// Highlight active page in navigation
function highlightActivePage() {
  const currentPath = window.location.pathname;
  const links = document.querySelectorAll('.nav-menu-links a, .footer-links a');

  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href && (currentPath.endsWith(href) || (href === 'index.html' && currentPath === '/'))) {
      link.style.color = 'var(--warm-gold)';
      link.style.fontWeight = '700';
    }
  });
}

// Update page indicator
window.updatePageIndicator = function() {
  const indicator = document.getElementById('page-indicator');
  if (!indicator) return;

  const t = getT();
  const path = window.location.pathname;

  if (path.includes('about.html')) indicator.textContent = t.about;
  else if (path.includes('menu.html')) indicator.textContent = t.menu;
  else if (path.includes('my-orders.html')) indicator.textContent = t.orders;
  else if (path.includes('faq.html')) indicator.textContent = t.faq;
  else if (path.includes('feedback.html')) indicator.textContent = t.feedback;
  else if (path.includes('contact.html')) indicator.textContent = t.contact;
  else indicator.textContent = t.home;
}

// Initialize scroll button
function initScrollButton() {
  const scrollBtn = document.getElementById('scroll-to-top');
  if (!scrollBtn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      scrollBtn.classList.add('visible');
    } else {
      scrollBtn.classList.remove('visible');
    }
  });

  scrollBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// Load menu items from Firebase
async function loadMenuItemsFromFirebase() {
  try {
    console.log('📋 Loading menu items from Firestore...');

    // Load both categories and menu items
    [categories, menuItems] = await Promise.all([
      getCategoriesFromFirebase(),
      getMenuFromFirebase()
    ]);

    console.log('✅ Menu items loaded:', menuItems.length);
    console.log('✅ Categories loaded:', categories.length);

    // Listen for real-time updates
    listenToMenuUpdates((updatedMenu) => {
      menuItems = updatedMenu;
      const isMenuPage = window.location.pathname.includes('menu.html');
      const isHomePage = window.location.pathname === '/' || 
                         window.location.pathname === '/index.html' || 
                         window.location.pathname.endsWith('/');

      if (isMenuPage) {
        renderMenu();
      } else if (isHomePage) {
        renderHomeMenuPreview();
      }
    });
  } catch (error) {
    console.error('Error loading menu items:', error);
    menuItems = [];
    categories = [];
  }
}

// Initialize menu (for menu.html)
async function initMenu() {
  await loadMenuItemsFromFirebase();
  renderMenu(null);  // Display all categories with their items
  setupSearch();
}

// Scroll tab carousel
window.scrollTabCarousel = function(direction) {
  const tabNav = document.getElementById('tab-nav');
  if (!tabNav) return;

  const scrollAmount = 200;
  const currentScroll = tabNav.scrollLeft;

  if (direction === 'left') {
    tabNav.scrollLeft = currentScroll - scrollAmount;
  } else {
    tabNav.scrollLeft = currentScroll + scrollAmount;
  }

  updateCarouselButtons();
}

// Update carousel button states
function updateCarouselButtons() {
  const tabNav = document.getElementById('tab-nav');
  const prevBtn = document.getElementById('tab-prev');
  const nextBtn = document.getElementById('tab-next');

  if (!tabNav || !prevBtn || !nextBtn) return;

  const canScrollLeft = tabNav.scrollLeft > 0;
  const canScrollRight = tabNav.scrollLeft < (tabNav.scrollWidth - tabNav.clientWidth - 10);

  prevBtn.disabled = !canScrollLeft;
  nextBtn.disabled = !canScrollRight;
}

// Render menu
function renderMenu(filterCategory = null, searchQuery = '') {
  const container = document.getElementById('menu-container');
  const tabNav = document.getElementById('tab-nav');

  if (!container || !tabNav) return;

  const t = getT();
  const lang = getCurrentLang();

  // Use categories from Firebase
  const allCategories = ['all', ...categories.map(c => c.id)];

  // Render category tabs
  tabNav.innerHTML = allCategories.map(cat => {
    const isActive = filterCategory === cat || (!filterCategory && cat === 'all');
    let categoryLabel;
    if (cat === 'all') {
      categoryLabel = t.allCategories;
    } else {
      const categoryObj = categories.find(c => c.id === cat);
      categoryLabel = lang === 'ar' ? (categoryObj?.nameAr || categoryObj?.name || cat) : (categoryObj?.name || cat);
    }
    // Use a class 'tab-btn' for easier selection and manipulation
    return `<button class="tab tab-btn ${isActive ? 'active' : ''}" onclick="filterByCategory('${cat}')">${categoryLabel}</button>`;
  }).join('');

  // Update carousel buttons after rendering
  setTimeout(updateCarouselButtons, 100);

  // Add scroll listener
  tabNav.addEventListener('scroll', updateCarouselButtons);

  // Filter items
  let filtered = menuItems;

  if (filterCategory && filterCategory !== 'all') {
    filtered = menuItems.filter(item => item.category === filterCategory);
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(item => 
      item.name.toLowerCase().includes(query) || 
      (item.desc && item.desc.toLowerCase().includes(query))
    );
  }

  // Group by category
  const grouped = {};
  filtered.forEach(item => {
    if (!grouped[item.category]) {
      grouped[item.category] = [];
    }
    grouped[item.category].push(item);
  });

  // Render sections
  container.innerHTML = '';
  Object.keys(grouped).forEach(category => {
    const section = document.createElement('section');
    section.className = 'section';

    const categoryLabel = t[category] || category;
    section.innerHTML = `
      <h2 class="section-title">${categoryLabel}</h2>
      <div class="grid">
        ${grouped[category].map(item => `
          <div class="card menu-item">
            ${item.img ? `<img src="${item.img}" alt="${item.name}" class="menu-item-img">` : ''}
            <h3 class="item-name">${item.name}</h3>
            ${item.desc ? `<p class="item-desc">${item.desc}</p>` : ''}
            <div class="item-footer">
              <span class="price">${item.price.toFixed(2)} DZD</span>
              <button class="cta" onclick="addToCart('${item.id}', event)">${t.addToCart}</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    container.appendChild(section);
  });

  if (filtered.length === 0) {
    container.innerHTML = `<p style="text-align:center;color:#999;padding:40px;">${t.errorLoading}</p>`;
  }
}

// Filter menu by category
window.filterByCategory = function(category) {
  console.log('🎯 Filtering by category:', category);

  // Update active state on tabs
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.classList.remove('active');
  });

  // Set active tab
  const activeTab = Array.from(tabs).find(tab => {
    const onclick = tab.getAttribute('onclick');
    return onclick && onclick.includes(`'${category}'`);
  });

  if (activeTab) {
    activeTab.classList.add('active');
  }

  // Re-render menu with filter - null shows all categories
  if (category === 'all') {
    renderMenu(null);  // Show all categories with their items
  } else {
    renderMenu(category);  // Show only selected category
  }
}

// Alias for compatibility
window.switchTab = window.filterByCategory;

// Mark active footer navigation link based on current page
function markActiveFooterLink() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const footerLinks = document.querySelectorAll('.footer-links a');

  footerLinks.forEach(link => {
    link.classList.remove('active-page');
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active-page');
    }
  });
}

// Apply translations to FAQ page
function applyFaqTranslations() {
  const t = getT();
  for (let i = 1; i <= 6; i++) {
    const qId = `faq-q${i}`;
    const aId = `faq-a${i}`;
    const qEl = document.getElementById(qId);
    const aEl = document.getElementById(aId);
    if (qEl) qEl.textContent = t[qId] || '';
    if (aEl) aEl.textContent = t[aId] || '';
  }
}

// Apply translations to Feedback page
function applyFeedbackTranslations() {
  const t = getT();
  const elements = {
    'feedback-title': t.feedbackTitle,
    'feedback-form-title': t.feedbackFormTitle,
    'feedback-name-label': t.feedbackNameLabel,
    'feedback-rating-label': t.feedbackRatingLabel,
    'feedback-comment-label': t.feedbackCommentLabel,
    'feedback-submit': t.feedbackSubmitBtn,
    'feedback-reviews-title': t.feedbackReviewsTitle
  };

  for (const [id, text] of Object.entries(elements)) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }
}

// Also call when page is shown (after navigation)
window.addEventListener('pageshow', markActiveFooterLink);

// Setup search with debouncing
function setupSearch() {
  const searchInput = document.getElementById('menu-search');
  if (!searchInput) return;

  // Debounce search to reduce re-renders
  const debouncedSearch = debounce((query) => {
    renderMenu(null, query);
  }, 300);

  searchInput.addEventListener('input', (e) => {
    debouncedSearch(e.target.value);
  });
}

// Render home menu preview
function renderHomeMenuPreview() {
  const container = document.getElementById('home-menu-items-grid');
  if (!container) {
    console.warn('⚠️ home-menu-items-grid container not found');
    return;
  }

  console.log('🎨 Rendering home menu preview with', menuItems.length, 'items');
  const t = getT();
  const lang = getCurrentLang();
  const isArabic = lang === 'ar';

  // Group items by category
  const itemsByCategory = {};
  menuItems.forEach(item => {
    if (!itemsByCategory[item.category]) {
      itemsByCategory[item.category] = [];
    }
    itemsByCategory[item.category].push(item);
  });

  // Select up to 9 items from different categories
  const featured = [];
  const categoryKeys = Object.keys(itemsByCategory);
  let categoryIndex = 0;
  
  while (featured.length < 9 && categoryKeys.length > 0) {
    const category = categoryKeys[categoryIndex % categoryKeys.length];
    if (itemsByCategory[category] && itemsByCategory[category].length > 0) {
      featured.push(itemsByCategory[category].shift());
    }
    if (itemsByCategory[category].length === 0) {
      categoryKeys.splice(categoryIndex % categoryKeys.length, 1);
    } else {
      categoryIndex++;
    }
  }

  if (featured.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px 20px; color: var(--text-secondary);">
        <div style="font-size: 48px; margin-bottom: 16px;">🍽️</div>
        <p>${isArabic ? 'قريباً... منتجات شهية في انتظاركم' : 'Coming soon... delicious products await you'}</p>
      </div>
    `;
    return;
  }

  // Get category labels
  const getCategoryLabel = (categoryId) => {
    const categoryObj = categories.find(c => c.id === categoryId);
    if (categoryObj) {
      return isArabic ? (categoryObj.nameAr || categoryObj.name) : categoryObj.name;
    }
    return categoryId;
  };

  container.innerHTML = featured.map(item => `
    <div class="menu-card home-preview-card">
      <div class="category-badge">${getCategoryLabel(item.category)}</div>
      <div class="menu-card-image" style="background-image:url('${item.img || 'images/placeholder.svg'}')"></div>
      <div class="menu-card-content">
        <h3 class="menu-card-title">${item.name}</h3>
        <p class="menu-card-desc">${item.desc || ''}</p>
        <div class="menu-card-footer">
          <span class="menu-card-price">${item.price ? item.price.toFixed(2) : '0.00'} DZD</span>
          <button class="menu-card-btn" onclick="addToCart('${item.id}', event)">
            ${t.addToCart}
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// Setup footer 7-click admin redirect
function setupFooterAdminClick() {
  const footerConnect = document.querySelector('.footer-connect');
  if (footerConnect) {
    let clickCount = 0;
    let clickTimeout;

    footerConnect.addEventListener('click', function() {
      clickCount++;

      // Reset counter after 3 seconds of no clicks
      clearTimeout(clickTimeout);
      clickTimeout = setTimeout(() => {
        clickCount = 0;
      }, 3000);

      // After 7 clicks, redirect to admin dashboard
      if (clickCount === 7) {
        clickCount = 0;
        console.log('🔐 Admin access granted!');
        window.location.href = 'admin.html';
      }
    });
  }
}

// SINGLE CONSOLIDATED INITIALIZATION - runs only ONCE
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🔄 PAGE INITIALIZATION STARTED (single listener)');

  applyTranslations();

  // Get current user for order tracking
  try {
    const auth = await getAuthInstance();
    if (auth && auth.currentUser) {
      currentAuthUser = auth.currentUser;
    }
  } catch (error) {
    console.log('Not logged in');
  }

  // Setup footer admin 7-click feature
  setupFooterAdminClick();

  // Mark active footer link
  markActiveFooterLink();

  // FAQ page setup
  if (document.getElementById('faq-q1')) applyFaqTranslations();

  // Feedback page setup
  if (document.getElementById('feedback-form')) {
    await loadMenuItemsFromFirebase();
    applyFeedbackTranslations();
    setTimeout(() => {
      initStarRatingOriginal();
      renderFeedbackListOriginal();
    }, 100);

    // Load menu items for feedback form select
    const feedbackItemSelect = document.getElementById('feedback-item');
    if (feedbackItemSelect && menuItems.length > 0) {
      feedbackItemSelect.innerHTML = '<option value="">-- اختر منتج --</option>';
      menuItems.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.name;
        feedbackItemSelect.appendChild(option);
      });
    }
  }

  // Determine page type and initialize accordingly
  const isMenuPage = window.location.pathname.includes('menu.html');
  const isHomePage = window.location.pathname === '/' || 
                     window.location.pathname === '/index.html' || 
                     window.location.pathname.endsWith('/');

  if (isMenuPage) {
    await initMenu();
  } else if (isHomePage) {
    // Load menu items for homepage preview
    await loadMenuItemsFromFirebase();
    loadCart();
    updateCart();
    renderHomeMenuPreview();
  } else {
    // Still load cart for other pages
    loadCart();
    updateCart();
  }

  highlightActivePage();
  initScrollButton();
  updatePageIndicator();

  console.log('✅ PAGE INITIALIZATION COMPLETE');
});

// Original translations, FAQ, admin, feedback, and other helper functions remain here.
// Original translations
const originalTranslations = {
  ar: {
    // Homepage
    heroDesc: 'تجربة فاخرة مستوحاة من نكهات كيندر الشهيرة',
    heroBtn: 'استكشف القائمة',
    featuresTitle: 'لماذا كريبري كيندر؟',
    feature1Title: 'شوكولاتة كيندر الأصلية',
    feature1Desc: 'نستخدم أجود أنواع شوكولاتة كيندر في جميع منتجاتنا الحلوة',
    feature2Title: 'طهاة محترفون',
    feature2Desc: 'فريق متخصص يحضر كل كريب بعناية وإتقان',
    feature3Title: 'مكونات طازجة',
    feature3Desc: 'نستخدم مكونات طازجة يومياً لضمان أفضل جودة',
    feature4Title: 'مناسب للعائلات',
    feature4Desc: 'خيارات متنوعة للأطفال والكبار في أجواء عائلية دافئة',

    whatWeOfferTitle: 'ماذا نقدم لعائلتك',
    whatWeOfferSubtitle: 'في كريبري كيندر، نؤمن بأن كل لحظة مع العائلة تستحق أن تكون مميزة. لهذا نقدم لكم تجربة فريدة تجمع بين الجودة والراحة والسعادة',
    offering1Title: 'أجواء عائلية دافئة',
    offering1Desc: 'مساحة مريحة وآمنة للعائلات مع مقاعد مخصصة للأطفال وجو مرحب للجميع',
    offering2Title: 'احتفالات خاصة',
    offering2Desc: 'نساعدك في تنظيم حفلات أعياد الميلاد والمناسبات العائلية بخيارات مخصصة',
    offering3Title: 'قائمة متنوعة للجميع',
    offering3Desc: 'خيارات متعددة تناسب جميع الأعمار من الأطفال إلى الكبار، حلو أو مالح',
    offering4Title: 'توصيل سريع للمنزل',
    offering4Desc: 'استمتع بطعمنا الشهي في منزلك مع خدمة توصيل سريعة وموثوقة',
    offering5Title: 'عروض عائلية',
    offering5Desc: 'باقات خاصة للعائلات بأسعار مميزة وتوصيل مجاني للطلبات الكبيرة',
    offering6Title: 'خدمة طوال اليوم',
    offering6Desc: 'نعمل من 9 صباحاً حتى 11 مساءً لنكون دائماً في خدمتكم',

    menuPreviewTitle: 'من قائمتنا',
    viewFullMenuBtn: 'شاهد القائمة الكاملة',
    ctaTitle: 'جاهز لتجربة لا تُنسى؟',
    ctaDesc: 'اطلب الآن واستمتع بطعم كيندر الأصيل',
    ctaBtn: 'اطلب الآن',
    navHome: 'الرئيسية',
    navAbout: 'من نحن',
    navMenu: 'القائمة',
    navOrders: 'طلباتي',
    navContact: 'تواصل معنا',
    navAdmin: 'لوحة الإدارة',
    navFaq: 'الأسئلة الشائعة',
    navFeedback: 'التقييمات',
    navDelivery: 'التوصيل',
    footerConnect: 'تواصل',
    footerCopyright: '© Creperie Kinder — طعم ممتع لعائلتك',

    // Menu page
    cartTitle: 'السلة',
    totalLabel: 'المجموع:',
    checkoutBtn: 'إتمام الطلب',
    orderNowBtn: 'اطلب الآن',
    emptyCart: 'السلة فارغة',
    addedToCart: '✓ أضيف إلى السلة',
    emptyCartAlert: 'السلة فارغة',
    namePrompt: 'الاسم الكامل:',
    nameRequired: 'مطلوب الاسم',
    phonePrompt: 'رقم الهاتف:',
    phoneRequired: 'مطلوب رقم الهاتف',
    addressPrompt: 'العنوان:',
    addressRequired: 'مطلوب العنوان',
    orderSuccess: '✓ تم إرسال الطلب! رقم الطلب: ',

    // FAQ & Feedback
    faqTitle: 'الأسئلة الشائعة',
    feedbackTitle: 'آراء العملاء',
    feedbackSuccess: '✓ شكراً لتقييمك!',
    feedbackNameLabel: 'اسمك:',
    feedbackItemLabel: 'اختر المنتج:',
    feedbackRatingLabel: 'التقييم:',
    feedbackCommentLabel: 'تعليقك:',
    feedbackSubmit: 'إرسال التقييم',
    selectItem: '-- اختر منتج --',
    navFaq: 'الأسئلة الشائعة',
    navFeedback: 'التقييمات',
    navDelivery: 'التوصيل',

    // FAQ Page
    faqQ1: 'ما هي ساعات العمل؟',
    faqA1: 'نحن مفتوحون يومياً من الساعة 11 صباحاً حتى 1 صباحاً',
    faqQ2: 'هل توفرون توصيل مجاني؟',
    faqA2: 'نعم، نوفر توصيل مجاني للطلبات التي تزيد عن 15 دج',
    faqQ3: 'هل تستخدمون شوكولاتة كيندر الأصلية؟',
    faqA3: 'بالتأكيد! نستخدم فقط شوكولاتة كيندر الأصلية ومكونات طازجة يومياً',
    faqQ4: 'هل يمكنني تخصيص طلبي؟',
    faqA4: 'نعم، يمكنك إضافة ملاحظات خاصة عند الطلب وسنقوم بتلبية طلبك حسب الإمكان',
    faqQ5: 'هل لديكم خيارات نباتية؟',
    faqA5: 'نعم، لدينا كريب نباتي مع التوت والكريمة النباتية',
    faqQ6: 'كم يستغرق التحضير والتوصيل؟',
    faqA6: 'عادة يستغرق التحضير 10-15 دقيقة، والتوصيل 20-30 دقيقة حسب موقعك',
    feedbackFormTitle: 'شاركنا تجربتك',
    feedbackReviewsTitle: 'تقييمات العملاء',
    noFeedback: 'لا توجد تقييمات بعد',

    // About & Contact
    aboutTitle: 'من نحن',
    aboutDesc1: 'Creperie Kinder تأسست بشغف لتقديم أفضل كريب للأطفال والكبار. نختار أفضل مكونات الشوكولا ونضيف لمسة سحرية في كل لفّة.',
    aboutDesc2: 'رؤيتنا: سعادة كل زبون في كل قضمة.',
    aboutTeamTitle: 'فريقنا',
    aboutChef: 'Chef Silo',
    aboutChefDesc: 'خبيرة الكريب والحشوات الممتازة.',
    aboutManager: 'Manager Aymen',
    aboutManagerDesc: 'رعاية الجودة وتجربة الزبائن.',
    contactTitle: 'تواصل معنا',
    contactNameLabel: 'الاسم:',
    contactEmailLabel: 'الإيميل:',
    contactMessageLabel: 'الرسالة:',
    contactSubmit: 'أرسل',
    contactSuccess: 'شكراً {name}! تم استلام رسالتك وسنرد عليك قريباً.',

    // Admin
    adminLoginTitle: 'تسجيل الدخول',
    adminUsername: 'اسم المستخدم:',
    adminPassword: 'كلمة المرور:',
    adminLoginBtn: 'دخول',
    adminPanelTitle: 'لوحة الطلبات',
    adminLogoutBtn: 'تسجيل خروج'
  },
  en: {
    // Homepage
    heroDesc: 'Premium experience inspired by famous Kinder flavors',
    heroBtn: 'EXPLORE MENU',
    featuresTitle: 'Why Creperie Kinder?',
    feature1Title: 'Original Kinder Chocolate',
    feature1Desc: 'We use the finest Kinder chocolate in all our sweet products',
    feature2Title: 'Professional Chefs',
    feature2Desc: 'Specialized team prepares each crepe with care and precision',
    feature3Title: 'Fresh Ingredients',
    feature3Desc: 'We use fresh ingredients daily to ensure the best quality',
    feature4Title: 'Family Friendly',
    feature4Desc: 'Variety of options for children and adults in a warm family atmosphere',

    whatWeOfferTitle: 'What We Offer Your Family',
    whatWeOfferSubtitle: 'At Creperie Kinder, we believe every family moment deserves to be special. That\'s why we offer a unique experience combining quality, comfort, and happiness.',
    offering1Title: 'Warm Family Atmosphere',
    offering1Desc: 'A comfortable and safe space for families with dedicated seating for children and a welcoming environment for everyone.',
    offering2Title: 'Special Celebrations',
    offering2Desc: 'We help you organize birthday parties and family events with customized options.',
    offering3Title: 'Diverse Menu for Everyone',
    offering3Desc: 'Multiple options to suit all ages, from children to adults, sweet or savory.',
    offering4Title: 'Fast Home Delivery',
    offering4Desc: 'Enjoy our delicious taste at home with fast and reliable delivery service.',
    offering5Title: 'Family Deals',
    offering5Desc: 'Special family packages at attractive prices and free delivery for large orders.',
    offering6Title: 'All-Day Service',
    offering6Desc: 'We are open from 9 AM to 11 PM to always be at your service.',

    menuPreviewTitle: 'From Our Menu',
    viewFullMenuBtn: 'View Full Menu',
    ctaTitle: 'Ready for an unforgettable experience?',
    ctaDesc: 'Order now and enjoy the authentic taste of Kinder',
    ctaBtn: 'ORDER NOW',
    navHome: 'Home',
    navAbout: 'About Us',
    navMenu: 'Menu',
    navOrders: 'My Orders',
    navContact: 'Contact Us',
    navAdmin: 'Admin Panel',
    navFaq: 'FAQ',
    navFeedback: 'Reviews',
    navDelivery: 'Delivery',
    footerConnect: 'Connect',
    footerCopyright: '© Creperie Kinder — Delicious taste for your family',

    // Menu page
    cartTitle: 'Cart',
    totalLabel: 'Total:',
    checkoutBtn: 'Checkout',
    orderNowBtn: 'ORDER NOW',
    emptyCart: 'Cart is empty',
    addedToCart: '✓ Added to cart',
    emptyCartAlert: 'Cart is empty',
    namePrompt: 'Full name:',
    nameRequired: 'Name is required',
    phonePrompt: 'Phone number:',
    phoneRequired: 'Phone number is required',
    addressPrompt: 'Address:',
    addressRequired: 'Address is required',
    orderSuccess: '✓ Order sent! Order number: ',

    // FAQ & Feedback
    faqTitle: 'Frequently Asked Questions',
    feedbackTitle: 'Customer Reviews',
    feedbackSuccess: '✓ Thank you for your feedback!',
    feedbackNameLabel: 'Your name:',
    feedbackItemLabel: 'Select product:',
    feedbackRatingLabel: 'Rating:',
    feedbackCommentLabel: 'Your Comment:',
    feedbackSubmit: 'Submit Review',
    selectItem: '-- Select a product --',
    navFaq: 'FAQ',
    navFeedback: 'Reviews',
    navDelivery: 'Delivery',

    // FAQ Page
    faqQ1: 'What are your opening hours?',
    faqA1: 'We are open daily from 11 AM to 1 AM',
    faqQ2: 'Do you offer free delivery?',
    faqA2: 'Yes, we offer free delivery for orders over 1000 DZD',
    faqQ3: 'Do you use original Kinder chocolate?',
    faqA3: 'Absolutely! We only use original Kinder chocolate and fresh ingredients daily',
    faqQ4: 'Can I customize my order?',
    faqA4: 'Yes, you can add special notes when ordering and we will fulfill your request as best as we can',
    faqQ5: 'How long does preparation and delivery take?',
    faqA5: 'Usually preparation takes 10-15 minutes, and delivery takes 20-30 minutes depending on your location',
    feedbackFormTitle: 'Share Your Experience',
    feedbackReviewsTitle: 'Customer Reviews',
    noFeedback: 'No reviews yet',

    // About & Contact
    aboutTitle: 'About Us',
    aboutDesc1: 'Creperie Kinder was founded with passion to provide the best crepes for children and adults. We choose the finest chocolate ingredients and add a magical touch to every wrap.',
    aboutDesc2: 'Our vision: Happiness for every customer in every bite.',
    aboutTeamTitle: 'Our Team',
    aboutChef: 'Chef Silo',
    aboutChefDesc: 'Expert in crepes and excellent fillings.',
    aboutManager: 'Manager Aymen',
    aboutManagerDesc: 'Quality care and customer experience.',
    contactTitle: 'Contact Us',
    contactNameLabel: 'Name:',
    contactEmailLabel: 'Email:',
    contactMessageLabel: 'Message:',
    contactSubmit: 'Send',
    contactSuccess: 'Thank you {name}! We received your message and will respond soon.',

    // Admin
    adminLoginTitle: 'Login',
    adminUsername: 'Username:',
    adminPassword: 'Password:',
    adminLoginBtn: 'Login',
    adminPanelTitle: 'Orders Dashboard',
    adminLogoutBtn: 'Logout'
  }
};

// Menu translations
const menuTranslations = {
  ar: {
    categories: {
      sweet: 'كريب حلو',
      savory: 'كريب مالح',
      kids: 'كريب الأطفال',
      drinks: 'مشروبات'
    },
    categoryDesc: {
      sweet: 'كريب حلو محضر بعناية مع مكونات طازجة',
      savory: 'كريب مالح مع حشوات شهية',
      kids: 'كريب خاص للأطفال',
      drinks: 'مشروبات ساخنة وباردة'
    },
    addToCart: 'أضف للسلة',
    emptyCategoryMsg: 'لا توجد عناصر في هذه الفئة',
    addedToCartToast: 'تمت الإضافة للسلة'
  },
  en: {
    categories: {
      sweet: 'Sweet Crêpes',
      savory: 'Savory Crêpes',
      kids: 'Kids Crêpes',
      drinks: 'Drinks'
    },
    categoryDesc: {
      sweet: 'Delicious sweet crepes with fresh ingredients',
      savory: 'Savory crepes with tasty fillings',
      kids: 'Special crepes for kids',
      drinks: 'Hot and cold beverages'
    },
    addToCart: 'Add to Cart',
    emptyCategoryMsg: 'No items in this category',
    addedToCartToast: 'Added to cart'
  }
};

// State Management (Original)
const state = {
  currentLang: getCurrentLang(),
  currentTab: 'sweet', // Default tab
  cart: [],
  menuItems: [],
  categories: []
};

// Load cart from localStorage (Original)
function loadCartOriginal() {
  try {
    const saved = localStorage.getItem(CART_KEY);
    if (saved) {
      state.cart = JSON.parse(saved);
      // Ensure quantities are valid
      state.cart.forEach(item => {
        if (typeof item.quantity !== 'number' || item.quantity < 0) {
          item.quantity = 0;
        }
      });
      state.cart = state.cart.filter(item => item.quantity > 0); // Remove items with 0 quantity
    }
  } catch (error) {
    console.error('Failed to load cart from localStorage:', error);
    state.cart = [];
  }
}

// Save cart to localStorage (Original)
function saveCartOriginal() {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(state.cart));
  } catch (error) {
    console.error('Failed to save cart to localStorage:', error);
  }
}

// Render cart contents (Original)
function renderCartOriginal() {
  const container = document.getElementById('cart-contents');
  const totalEl = document.getElementById('cart-total');

  if (!container || !totalEl) {
    return;
  }

  const t = translations[state.currentLang]; // Use original translations

  if (state.cart.length === 0) {
    container.innerHTML = `
      <div style="padding: 40px 20px; text-align: center; color: #999;">
        <div style="font-size: 48px; margin-bottom: 16px;">🛒</div>
        <p>${state.currentLang === 'ar' ? t.ar.emptyCart : t.en.emptyCart}</p>
      </div>
    `;
    totalEl.textContent = '0.00 DZD';
    return;
  }

  let total = 0;
  container.innerHTML = state.cart.map(item => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    return `
      <div class="cart-item">
        <img src="${item.img || 'images/placeholder.svg'}" alt="${item.name}" class="cart-item-img">
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <p>${item.price.toFixed(2)} DZD</p>
        </div>
        <div class="cart-item-controls">
          <button onclick="updateQuantityOriginal('${item.id}', -1)">-</button>
          <span>${item.quantity}</span>
          <button onclick="updateQuantityOriginal('${item.id}', 1)">+</button>
        </div>
        <button class="cart-item-remove" onclick="removeFromCartOriginal('${item.id}')">×</button>
      </div>
    `;
  }).join('');

  totalEl.textContent = total.toFixed(2) + ' DZD';
}

// Update quantity (Original)
function updateQuantityOriginal(itemId, delta) {
  const item = state.cart.find(c => c.id === itemId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    removeFromCartOriginal(itemId);
  } else {
    saveCartOriginal();
    renderCartOriginal();
  }
}

// Remove from cart (Original)
function removeFromCartOriginal(itemId) {
  state.cart = state.cart.filter(item => item.id !== itemId);
  saveCartOriginal();
  renderCartOriginal();
}

// Toggle cart sidebar (Original)
function toggleCartOriginal() {
  const cartSide = document.getElementById('cart-side');
  if (cartSide) {
    cartSide.classList.toggle('active');
    const overlay = document.getElementById('menu-overlay');
    if (overlay) overlay.classList.toggle('active');
    document.body.style.overflow = cartSide.classList.contains('active') ? 'hidden' : '';
  }
}

// Toggle menu sidebar (Original)
function toggleMenuOriginal() {
  const navMenu = document.getElementById('nav-menu');
  const overlay = document.getElementById('menu-overlay');
  if (navMenu && overlay) {
    navMenu.classList.toggle('active');
    overlay.classList.toggle('active');
    document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
  }
}

// Close all sidebars (Original)
function closeAllSidebarsOriginal() {
  const navMenu = document.getElementById('nav-menu');
  const cartSide = document.getElementById('cart-side');
  const overlay = document.getElementById('menu-overlay');

  if (navMenu) navMenu.classList.remove('active');
  if (cartSide) cartSide.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
  document.body.style.overflow = '';
}

// Checkout flow (Original)
function checkoutFlowOriginal(){
  const lang = state.currentLang;
  const t = translations[lang]; // Use original translations
  const cartItems = state.cart; // Use original cart state

  if(cartItems.length === 0) return alert(t.ar.emptyCartAlert || 'Cart is empty!'); // Use original translation keys
  const subtotal = cartItems.reduce((s,i)=>s + i.price * i.quantity, 0);

  const MIN_ORDER_AMOUNT = 5.0; // Keep original min order amount
  if(subtotal < MIN_ORDER_AMOUNT){
    const minOrderMsg = lang === 'ar'
      ? `الحد الأدنى للطلب هو ${MIN_ORDER_AMOUNT} دج`
      : `Minimum order amount is ${MIN_ORDER_AMOUNT} DZD`;
    return alert(minOrderMsg);
  }

  const FREE_DELIVERY_THRESHOLD = 15.0; // Keep original free delivery threshold
  const DELIVERY_FEE = 2.0; // Keep original delivery fee
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = subtotal + deliveryFee;

  const savedInfo = getSavedCustomerInfo(); // Keep original helper function

  const modal = document.createElement('div');
  modal.className = 'checkout-modal-overlay';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;';
  modal.onclick = (e) => {
    if(e.target === modal) window.closeCheckoutModal(); // Keep original close modal function
  };

  // Use original translation keys for labels
  const savedNameLabel = lang === 'ar' ? t.ar.namePrompt : t.en.namePrompt;
  const savedPhoneLabel = lang === 'ar' ? t.ar.phonePrompt : t.en.phonePrompt;
  const savedAddressLabel = lang === 'ar' ? t.ar.addressPrompt : t.en.addressPrompt;
  const savedInstructionsLabel = lang === 'ar' ? 'تعليمات خاصة (اختياري)' : 'Special Instructions (Optional)'; // Keep original if not in translations
  const savedSubtotalLabel = lang === 'ar' ? t.ar.totalLabel : t.en.totalLabel; // Use original translation keys
  const savedDeliveryLabel = lang === 'ar' ? 'رسوم التوصيل' : 'Delivery Fee'; // Keep original if not in translations
  const savedTotalLabel = lang === 'ar' ? t.ar.totalLabel : t.en.totalLabel; // Use original translation keys
  const savedFreeDeliveryLabel = lang === 'ar' ? 'توصيل مجاني!' : 'Free Delivery!'; // Keep original if not in translations
  const savedPlaceOrderLabel = lang === 'ar' ? t.ar.checkoutBtn : t.en.checkoutBtn; // Use original translation keys
  const savedCancelLabel = lang === 'ar' ? 'إلغاء' : 'Cancel'; // Keep original if not in translations
  const savedPhoneErrorLabel = lang === 'ar' ? 'رقم الهاتف غير صحيح. استخدم التنسيق: +213 5XX XXX XXX' : 'Invalid phone number. Use format: +213 5XX XXX XXX'; // Keep original

  modal.innerHTML = `
    <div class="checkout-modal" style="background:#fff;border-radius:12px;max-width:500px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
      <div style="padding:24px;border-bottom:1px solid #e8ddd1;">
        <h2 style="margin:0;font-family:'Playfair Display',serif;color:var(--text-primary);">${lang === 'ar' ? 'إتمام الطلب' : 'Checkout'}</h2>
      </div>
      <form id="checkout-form" style="padding:24px;">
        <div style="margin-bottom:20px;">
          <label style="display:block;margin-bottom:8px;font-weight:600;color:var(--text-primary);">${savedNameLabel} *</label>
          <input type="text" id="checkout-name" value="${savedInfo.name}" required style="width:100%;padding:12px;border:1px solid var(--border);border-radius:4px;font-size:16px;">
        </div>
        <div style="margin-bottom:20px;">
          <label style="display:block;margin-bottom:8px;font-weight:600;color:var(--text-primary);">${savedPhoneLabel} *</label>
          <input type="tel" id="checkout-phone" value="${savedInfo.phone}" required placeholder="+213 5XX XXX XXX" style="width:100%;padding:12px;border:1px solid var(--border);border-radius:4px;font-size:16px;">
          <small style="color:#999;font-size:12px;display:block;margin-top:4px;">${lang === 'ar' ? 'مثال: +213 555 123 456' : 'Example: +213 555 123 456'}</small>
        </div>
        <div style="margin-bottom:20px;">
          <label style="display:block;margin-bottom:8px;font-weight:600;color:var(--text-primary);">${savedAddressLabel} *</label>
          <textarea id="checkout-address" required rows="3" style="width:100%;padding:12px;border:1px solid var(--border);border-radius:4px;font-size:16px;resize:vertical;">${savedInfo.address}</textarea>
        </div>
        <div style="margin-bottom:20px;">
          <label style="display:block;margin-bottom:8px;font-weight:600;color:var(--text-primary);">${savedInstructionsLabel}</label>
          <textarea id="checkout-notes" rows="2" placeholder="${lang === 'ar' ? 'أي تعليمات خاصة للطلب...' : 'Any special instructions for your order...'}" style="width:100%;padding:12px;border:1px solid var(--border);border-radius:4px;font-size:16px;resize:vertical;"></textarea>
        </div>
        <div style="background:#f9f9f9;padding:16px;border-radius:8px;margin-bottom:20px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span>${savedSubtotalLabel}:</span>
            <strong>${subtotal.toFixed(2)} DZD</strong>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span>${savedDeliveryLabel}:</span>
            <strong style="color:${deliveryFee === 0 ? 'var(--success)' : 'var(--text-primary)'};">${deliveryFee === 0 ? savedFreeDeliveryLabel : deliveryFee.toFixed(2) + ' DZD'}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;padding-top:12px;border-top:2px solid var(--border);font-size:18px;">
            <span style="font-weight:700;">${savedTotalLabel}:</span>
            <strong style="color:var(--warm-gold);font-size:20px;">${total.toFixed(2)} DZD</strong>
          </div>
        </div>
        <div style="display:flex;gap:12px;">
          <button type="button" onclick="window.closeCheckoutModal()" style="flex:1;padding:14px;border:1px solid var(--border);background:#fff;border-radius:4px;cursor:pointer;font-weight:600;transition:all 0.3s;">${savedCancelLabel}</button>
          <button type="submit" style="flex:1;padding:14px;border:none;background:var(--gradient-primary);color:#fff;border-radius:4px;cursor:pointer;font-weight:700;transition:all 0.3s;">${savedPlaceOrderLabel}</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('checkout-form').onsubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('checkout-name').value.trim();
    const phone = document.getElementById('checkout-phone').value.trim();
    const address = document.getElementById('checkout-address').value.trim();
    const notes = document.getElementById('checkout-notes').value.trim();

    // Use original translation keys for required fields
    if(!name) return alert(t.ar.nameRequired || 'Name is required');
    if(!phone) return alert(t.ar.phoneRequired || 'Phone number is required');
    if(!validatePhone(phone)){ // Keep original validatePhone helper
      alert(savedPhoneErrorLabel);
      return;
    }
    if(!address) return alert(t.ar.addressRequired || 'Address is required');

    const formattedPhone = formatPhone(phone); // Keep original formatPhone helper

    saveCustomerInfo(name, formattedPhone, address); // Keep original helper function

    const order = {
      customerName: name,
      customerPhone: formattedPhone,
      customerAddress: address,
      // email field is added in the edited snippet
      email: userEmail, // This is from the edited snippet
      items: cartItems.map(item => ({ // Use original cart state
        id: item.id,
        name: item.name,
        price: item.price,
        img: item.img,
        quantity: item.quantity // Use original quantity property
      })),
      subtotal,
      deliveryFee,
      total,
      specialInstructions: notes,
      status:'pending', // Use 'pending' as per edited snippet's intention
      createdAt: new Date().toISOString()
    };

    try {
      const orderId = await placeOrderToFirebase(order); // Use original function call
      
      // Notify admins of new order
      fetch('/api/notify-admin-new-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          customerName: name,
          orderTotal: total.toFixed(2) + ' DZD',
          itemCount: cartItems.length
        })
      }).catch(e => console.warn('Admin notification failed (non-blocking):', e));
      
      cart = []; // Clear cart using original cart variable
      saveCart(); // Use original saveCart function
      window.closeCheckoutModal();
      toggleCartOriginal(); // Use original toggle cart function
      showOrderConfirmation(orderId, order, lang); // Keep original confirmation function
    } catch (error) {
      alert(lang === 'ar' ? 'فشل في إرسال الطلب. حاول مرة أخرى.' : 'Failed to place order. Please try again.');
      console.error('Order placement failed:', error);
    }
  };
}

// Close checkout modal (Original) - calls the main window.closeCheckoutModal
function closeCheckoutModalOriginal(){
  if (typeof window.closeCheckoutModal === 'function') {
    window.closeCheckoutModal();
  } else {
    const modal = document.querySelector('.checkout-modal-overlay');
    if(modal) modal.remove();
  }
}

// Show order confirmation (Original)
function showOrderConfirmation(orderId, order, lang){
  const t = translations[lang]; // Use original translations
  const confirmModal = document.createElement('div');
  confirmModal.className = 'checkout-modal-overlay';
  confirmModal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;';
  confirmModal.onclick = (e) => {
    if(e.target === confirmModal) confirmModal.remove();
  };

  // Use original translation keys for confirmation messages
  const successTitle = lang === 'ar' ? 'تم إرسال الطلب بنجاح!' : 'Order Placed Successfully!';
  const orderNumberLabel = lang === 'ar' ? 'رقم الطلب' : 'Order Number';
  const trackOrderLabel = lang === 'ar' ? 'تتبع الطلب' : 'Track Order';
  const closeLabel = lang === 'ar' ? 'إغلاق' : 'Close';

  confirmModal.innerHTML = `
    <div class="checkout-modal" style="background:#fff;border-radius:12px;max-width:500px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
      <div style="padding:24px;text-align:center;border-bottom:1px solid #e8ddd1;">
        <div style="width:60px;height:60px;background:var(--success);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:32px;">✓</div>
        <h2 style="margin:0;font-family:'Playfair Display',serif;color:var(--text-primary);">${successTitle}</h2>
      </div>
      <div style="padding:24px;">
        <div style="background:#f9f9f9;padding:16px;border-radius:8px;margin-bottom:20px;">
          <div style="margin-bottom:12px;">
            <strong>${orderNumberLabel}:</strong>
            <div style="font-size:20px;color:var(--warm-gold);font-weight:700;margin-top:4px;">${orderId}</div>
          </div>
          <div style="margin-bottom:8px;"><strong>${lang === 'ar' ? 'المجموع' : 'Total'}:</strong> ${order.total.toFixed(2)} DZD</div>
          <div style="margin-bottom:8px;"><strong>${lang === 'ar' ? 'الحالة' : 'Status'}:</strong> ${lang === 'ar' ? 'قيد الانتظار' : 'Pending'}</div>
        </div>
        <div style="margin-bottom:20px;">
          <button onclick="window.location.href='my-orders.html?order=${orderId}'" style="width:100%;padding:14px;border:none;background:var(--gradient-primary);color:#fff;border-radius:4px;cursor:pointer;font-weight:700;margin-bottom:12px;">${trackOrderLabel}</button>
          <button onclick="this.closest('.checkout-modal-overlay').remove()" style="width:100%;padding:14px;border:1px solid var(--border);background:#fff;border-radius:4px;cursor:pointer;font-weight:600;">${closeLabel}</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(confirmModal);
  showToastOriginal(t.ar.orderSuccess + orderId); // Use original showToast and translation key
}

// Show toast (Original)
function showToastOriginal(msg){
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

// Admin functions (Original)
function adminLoginOriginal(username, password){
  if(username === 'admin' && password === 'kinder123'){
    localStorage.setItem('kc_admin', '1');
    return true;
  }
  return false;
}

function adminLogoutOriginal(){
  localStorage.removeItem('kc_admin');
  window.location.href='index.html';
}

function isAdminOriginal(){
  return localStorage.getItem('kc_admin') === '1';
}

function renderAdminOrdersOriginal(){
  const list = document.getElementById('orders-list');
  const statsEl = document.getElementById('stats-area');
  const orders = getOrders().slice().reverse(); // Assuming getOrders is available
  if(!list) return;
  list.innerHTML = '';
  orders.forEach(o=>{
    const el = document.createElement('div');
    el.className='order';
    el.innerHTML = `<div style="display:flex;justify-content:space-between"><div><strong>${o.id || 'N/A'}</strong> <div class="text-sm">${o.customerName || o.name} • ${o.customerPhone || o.phone}</div></div><div><small>${new Date(o.createdAt || o.timestamp).toLocaleString()}</small></div></div>`;
    const items = document.createElement('div');
    items.className='text-sm';
    items.textContent = Array.isArray(o.items) ? o.items.map(i=> `${i.name} x${i.quantity || i.qty}`).join(', ') : 'No items';

    const status = document.createElement('div');
    status.style.marginTop='6px';
    const sel = document.createElement('select');
    const statusMap = {'received': 'Order Received', 'preparing': 'Preparing', 'ready': 'Ready', 'picked_up': 'Picked Up', 'in_transit': 'On the Way', 'cancelled': 'Cancelled'};
    Object.keys(statusMap).forEach(key=>{
      const opt = document.createElement('option');
      opt.value=key;
      opt.textContent=statusMap[key];
      const currentStatusNormalized = o.status ? o.status.toLowerCase() : '';
      if(currentStatusNormalized === key || currentStatusNormalized === statusMap[key].toLowerCase()) opt.selected=true;
      sel.appendChild(opt);
    });
    sel.onchange = ()=> updateOrderStatusOriginal(o.id, sel.value);
    status.appendChild(sel);
    el.appendChild(items);
    el.appendChild(status);
    list.appendChild(el);
  });

  if(statsEl){
    const totalOrders = orders.length;
    const totalSales = orders.reduce((s,o)=>s + (o.total||0),0);
    const byStatus = orders.reduce((acc,o)=> {
      const statusKey = o.status ? o.status.toLowerCase() : 'unknown';
      acc[statusKey] = (acc[statusKey]||0) +1;
      return acc;
    }, {});
    const popular = {};
    orders.forEach(o=> {
      if(Array.isArray(o.items)) {
        o.items.forEach(it=> {
          popular[it.name] = (popular[it.name]||0) + (it.quantity || it.qty || 0);
        });
      }
    });
    const top = Object.entries(popular).sort((a,b)=>b[1]-a[1]).slice(0,5);
    statsEl.innerHTML = '<div class="stat-card"><strong>المبيعات الإجمالية</strong><div style="font-size:20px;margin-top:6px">'+ totalSales.toFixed(2) +' DZD</div></div>';
    statsEl.innerHTML += '<div class="stat-card"><strong>عدد الطلبات</strong><div style="font-size:18px;margin-top:6px">'+ totalOrders +'</div></div>';
    statsEl.innerHTML += '<div class="stat-card"><strong>حسب الحالة</strong><div style="margin-top:6px">Received: '+(byStatus.received||0)+' • Preparing: '+(byStatus.preparing||0)+' • Ready: '+(byStatus.ready||0)+' • Picked Up: '+(byStatus.picked_up||0)+' • In Transit: '+(byStatus.in_transit||0)+'</div></div>';
    statsEl.innerHTML += '<div class="stat-card"><strong>الأكثر مبيعًا</strong><ul>' + top.map(t=>'<li>'+t[0]+' — '+t[1]+'</li>').join('') + '</ul></div>';
  }
}

function checkAdminPageOriginal(){
  const loginSection = document.getElementById('login-section');
  const adminSection = document.getElementById('admin-section');

  if(loginSection && adminSection){
    if(isAdminOriginal()){
      loginSection.classList.add('hidden');
      adminSection.classList.remove('hidden');
      renderAdminOrdersOriginal();
    } else {
      loginSection.classList.remove('hidden');
      adminSection.classList.add('hidden');
    }
  }
}

function updateOrderStatusOriginal(id, status){
  const orders = getOrders(); // Assuming getOrders is available
  const o = orders.find(x=> x.id===id);
  if(!o) return;
  const statusMap = {'Order Received': 'received', 'Preparing': 'preparing', 'Ready': 'ready', 'Picked Up': 'picked_up', 'On the Way': 'in_transit', 'Cancelled': 'cancelled'};
  o.status = statusMap[status] || status.toLowerCase();
  saveOrders(orders); // Assuming saveOrders is available
  renderAdminOrdersOriginal();
  showToastOriginal('تم تحديث حالة الطلب ' + id);
}

// Contact form (Original)
async function submitContactOriginal(e){
  e.preventDefault();
  const name = document.getElementById('contact-name').value;
  const email = document.getElementById('contact-email').value;
  const msg = document.getElementById('contact-msg').value;
  const lang = getCurrentLang();
  const t = translations[lang];

  try {
    // Ensure dbService is initialized
    if (!dbService || !dbService.init) {
      throw new Error('Database service not initialized');
    }

    const contactData = {
      name: name,
      email: email,
      message: msg
    };

    console.log('📝 Submitting contact message:', contactData);
    await dbService.addContactMessage(contactData);
    console.log('✅ Contact message submitted successfully');
    const successMsg = t.contactSuccess ? t.contactSuccess.replace('{name}', name) : (lang === 'ar' ? 'شكراً!' : 'Thank you!');
    showToastOriginal(successMsg);
    e.target.reset();
  } catch (error) {
    const errorMsg = error?.message || error?.code || JSON.stringify(error);
    console.error('❌ Error submitting contact message:', errorMsg, error);
    alert(lang === 'ar' ? 'حدث خطأ في إرسال الرسالة: ' + errorMsg : 'Error sending message: ' + errorMsg);
  }
}

// FAQ Functions (Original)
function toggleFaqOriginal(element){
  const faqItem = element.parentElement;
  const isActive = faqItem.classList.contains('active');

  document.querySelectorAll('.faq-item').forEach(item => {
    item.classList.remove('active');
    const icon = item.querySelector('.faq-icon');
    if(icon) icon.textContent = '+';
  });

  if(!isActive){
    faqItem.classList.add('active');
    const icon = element.querySelector('.faq-icon');
    if(icon) icon.textContent = '−';
  }
}

// Feedback Functions (Original)
function getFeedbackOriginal(){ return JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '[]'); }
function saveFeedbackOriginal(f){ localStorage.setItem(FEEDBACK_KEY, JSON.stringify(f)); }

async function submitFeedbackOriginal(e){
  e.preventDefault();
  const lang = getCurrentLang();
  const t = translations[lang];

  const nameInput = document.getElementById('feedback-name');
  const ratingInput = document.getElementById('feedback-rating');
  const commentInput = document.getElementById('feedback-comment');

  const name = nameInput ? nameInput.value.trim() : '';
  const rating = ratingInput ? parseInt(ratingInput.value) : 0;
  const comment = commentInput ? commentInput.value.trim() : '';

  if (!name) {
    alert(lang === 'ar' ? 'الرجاء إدخال اسمك' : 'Please enter your name');
    return;
  }
  if (!rating) {
    alert(lang === 'ar' ? 'الرجاء اختيار تقييم' : 'Please select a rating');
    return;
  }
  if (!comment) {
    alert(lang === 'ar' ? 'الرجاء إدخال تعليق' : 'Please enter a comment');
    return;
  }

  try {
    const reviewData = {
      customerName: name,
      rating: rating,
      comment: comment
    };

    await dbService.addReview(reviewData);
    alert(lang === 'ar' ? 'شكراً لك! تم إرسال تقييمك بنجاح' : 'Thank you! Your review has been submitted successfully');

    if(e.target) e.target.reset();
    if(ratingInput) ratingInput.value = '';
    document.querySelectorAll('.star').forEach(star => star.textContent = '☆');

    renderFeedbackListOriginal();
  } catch (error) {
    console.error('Error submitting feedback:', error);
    alert(lang === 'ar' ? 'حدث خطأ في إرسال تقييمك' : 'Error submitting feedback');
  }
}

async function renderFeedbackListOriginal(){
  const container = document.getElementById('feedback-list');
  if(!container) return;

  try {
    const feedback = await dbService.getAllReviews();
    container.innerHTML = '';

    const lang = getCurrentLang();
    const t = translations[lang];

    if(feedback.length === 0){
      container.innerHTML = '<div class="card"><p style="text-align:center;color:var(--warm-gray)">' + (t.noFeedback || 'No reviews yet') + '</p></div>';
      return;
    }

    feedback.forEach(fb => {
      const card = document.createElement('div');
      card.className = 'feedback-card';

      const stars = '★'.repeat(fb.rating) + '☆'.repeat(5 - fb.rating);
      const date = fb.createdAt ? new Date(fb.createdAt.toDate ? fb.createdAt.toDate() : fb.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'en-US') : 'N/A';

      card.innerHTML = `
        <div class="feedback-header">
          <div>
            <strong>${fb.customerName || fb.name || 'Anonymous'}</strong>
          </div>
          <div class="feedback-stars">${stars}</div>
        </div>
        <p class="feedback-comment">${fb.comment}</p>
        <div class="feedback-date">${date}</div>
      `;

      container.appendChild(card);
    });
  } catch (error) {
    console.error('Error loading feedback:', error);
    const container = document.getElementById('feedback-list');
    if(container) container.innerHTML = '<div class="card"><p style="text-align:center;color:var(--warm-gray)">Error loading reviews</p></div>';
  }
}

// Populate feedback item select (Original)
async function populateFeedbackItemsOriginal(){
  const select = document.getElementById('feedback-item');
  if(!select) return;

  const menu = menuItems; // Use updated menuItems
  const lang = getCurrentLang();
  const t = translations[lang]; // Use original translations

  select.innerHTML = '<option value="">' + (t.selectItem || 'Select Product') + '</option>';

  menu.forEach(item => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = item.name;
    select.appendChild(option);
  });
}

// Initialize star rating (Original)
function initStarRatingOriginal(){
  const stars = document.querySelectorAll('.star');
  const ratingInput = document.getElementById('feedback-rating');
  const starRating = document.getElementById('star-rating');

  if(!stars.length || !ratingInput) {
    console.log('⭐ Star rating not available');
    return;
  }

  // Click handler for setting rating
  stars.forEach(star => {
    star.addEventListener('click', function(e) {
      e.stopPropagation();
      const rating = parseInt(this.getAttribute('data-rating'));
      ratingInput.value = rating;
      updateStarDisplay(rating);
      console.log('⭐ Rating set to:', rating);
    });

    // Hover preview
    star.addEventListener('mouseenter', function() {
      const rating = parseInt(this.getAttribute('data-rating'));
      updateStarDisplay(rating);
    });
  });

  // Reset on mouse leave
  if(starRating){
    starRating.addEventListener('mouseleave', function(){
      const currentRating = parseInt(ratingInput.value) || 0;
      updateStarDisplay(currentRating);
    });
  }

  function updateStarDisplay(rating) {
    stars.forEach((s, index) => {
      s.textContent = (index < rating) ? '★' : '☆';
      s.style.color = (index < rating) ? 'var(--primary)' : '#ddd';
    });
  }
}

// Highlight active page (Original)
function highlightActivePageOriginal(){
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-menu-links a, .footer-links a');

  navLinks.forEach(link => {
    const linkPage = link.getAttribute('href');
    if( (currentPage === '' || currentPage === 'index.html') && (linkPage === '' || linkPage === 'index.html') ) {
      link.classList.add('active-page');
    } else if (linkPage === currentPage) {
      link.classList.add('active-page');
    }
  });

  updatePageIndicatorOriginal(); // Call original updatePageIndicator
}

// Update page indicator (Original)
function updatePageIndicatorOriginal(){
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const lang = getCurrentLang();
  const t = translations[lang]; // Use original translations

  const pageNames = {
    'index.html': { ar: 'الرئيسية', en: 'Home' },
    '': { ar: 'الرئيسية', en: 'Home' },
    'menu.html': { ar: 'القائمة', en: 'Menu' },
    'about.html': { ar: 'من نحن', en: 'About Us' },
    'my-orders.html': { ar: 'طلباتي', en: 'My Orders' },
    'contact.html': { ar: 'تواصل معنا', en: 'Contact Us' },
    'faq.html': { ar: 'الأسئلة الشائعة', en: 'FAQ' },
    'feedback.html': { ar: 'التقييمات', en: 'Reviews' },
    'admin.html': { ar: 'لوحة الإدارة', en: 'Admin' },
    'delivery.html': { ar: 'التوصيل', en: 'Delivery' }
  };

  const pageIndicator = document.getElementById('page-indicator');
  if(pageIndicator && pageNames[currentPage]){
    pageIndicator.textContent = pageNames[currentPage][lang];
  }
}

// Scroll Button (Original)
function initScrollButtonOriginal(){
  let scrollBtn = document.getElementById('scroll-btn');
  if (!scrollBtn) {
    scrollBtn = document.createElement('button');
    scrollBtn.className = 'scroll-btn';
    scrollBtn.id = 'scroll-btn';
    document.body.appendChild(scrollBtn);
  }

  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;

    if (!scrollBtn) return;

    if(scrolled === 0){
      scrollBtn.classList.add('visible');
      scrollBtn.innerHTML = '↓';
      scrollBtn.setAttribute('aria-label', 'Scroll to bottom');
    } else if(scrolled > 50){
      scrollBtn.classList.add('visible');
      scrollBtn.innerHTML = '↑';
      scrollBtn.setAttribute('aria-label', 'Scroll to top');
    } else {
      scrollBtn.classList.remove('visible');
    }
  });

  scrollBtn.addEventListener('click', () => {
    const scrolled = window.scrollY;

    if(scrolled === 0 || scrollBtn.innerHTML === '↓'){
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  });

  const scrolled = window.scrollY;
  if (scrolled === 0) {
    scrollBtn.classList.add('visible');
    scrollBtn.innerHTML = '↓';
    scrollBtn.setAttribute('aria-label', 'Scroll to bottom');
  } else if (scrolled > 50) {
     scrollBtn.classList.add('visible');
     scrollBtn.innerHTML = '↑';
     scrollBtn.setAttribute('aria-label', 'Scroll to top');
  } else {
     scrollBtn.classList.remove('visible');
  }
}

// Secret Admin Access DISABLED - Use role-based access in My Orders instead
function initSecretAdminAccessOriginal(){
  // Secret keyboard shortcuts and tap counters have been disabled
  // Staff/Admin access is now managed through the My Orders page role selector
  console.log('ℹ️ Staff/Admin access is now managed through role-based system in My Orders page');
}

// Page loading (Original)
function initPageLoadOriginal(){
  document.body.classList.add('page-loading');
  setTimeout(() => {
    document.body.classList.remove('page-loading');
    document.body.classList.add('page-loaded');
  }, 100);
}

// Helper functions (Original)
function getSavedCustomerInfoOriginal(){
  const saved = localStorage.getItem('kc_customer_info');
  return saved ? JSON.parse(saved) : {name: '', phone: '', address: ''};
}

function saveCustomerInfoOriginal(name, phone, address){
  localStorage.setItem('kc_customer_info', JSON.stringify({name, phone, address}));
}

function validatePhoneOriginal(phone){
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return /^(\+213|213|0)[5-7][0-9]{8}$/.test(cleaned);
}

function formatPhoneOriginal(phone){
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if(cleaned.startsWith('+213')) return cleaned;
  if(cleaned.startsWith('213')) return '+' + cleaned;
  if(cleaned.startsWith('0')) return '+213' + cleaned.substring(1);
  return '+213' + cleaned;
}

// Assuming getOrders and saveOrders are defined elsewhere or available globally
function getOrdersOriginal(){ return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]'); }
function saveOrdersOriginal(o){ localStorage.setItem(ORDERS_KEY, JSON.stringify(o)); }

// Render homepage menu preview (Original)
async function renderHomeMenuPreviewOriginal() {
  const container = document.getElementById('home-menu-items-grid');
  if (!container) return;

  try {
    // Load menu items if not already loaded
    if (menuItems.length === 0) { // Use updated menuItems
      await loadMenuItemsFromFirebase();
    }

    // Get up to 4 random items to display
    const itemsToShow = menuItems // Use updated menuItems
      .sort(() => 0.5 - Math.random())
      .slice(0, 4);

    if (itemsToShow.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px 20px; color: var(--text-secondary);">
          <div style="font-size: 48px; margin-bottom: 16px;">🍽️</div>
          <p>قريباً... منتجات شهية في انتظاركم</p>
        </div>
      `;
      return;
    }

    const addToCartText = currentLang === 'ar'
      ? menuTranslations.ar.addToCart
      : menuTranslations.en.addToCart;

    container.innerHTML = itemsToShow.map(item => `
      <div class="menu-card">
        <div class="menu-card-image" style="background-image:url('${item.img || 'images/placeholder.svg'}')"></div>
        <div class="menu-card-content">
          <h3 class="menu-card-title">${item.name}</h3>
          <p class="menu-card-desc">${item.desc}</p>
          <div class="menu-card-footer">
            <span class="menu-card-price">${item.price.toFixed(2)} DZD</span>
            <button class="menu-card-btn" onclick="addToCart('${item.id}', event)">
              ${addToCartText}
            </button>
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Failed to render home menu preview:', error);
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px 20px; color: var(--text-secondary);">
        <p>تعذر تحميل المنتجات</p>
      </div>
    `;
  }
}

// DUPLICATE REMOVED - consolidated into single listener above

// Update footer category links
function updateFooterCategoryLinks() {
  const footerLinks = document.getElementById('footer-links');
  if (!footerLinks) return;

  // This function is called but doesn't need to do anything special
  // Footer links are static in the HTML
  console.log('Footer links updated');
}

// Make functions globally accessible (Original)
// These are kept from the original to maintain compatibility if other scripts rely on them.
// However, the primary logic now uses the updated functions.
window.addToCart = addToCart; // Updated function
window.updateFooterCategoryLinks = updateFooterCategoryLinks;
window.removeFromCart = removeFromCart; // Updated function
window.updateQuantity = updateQuantity; // Updated function (assuming this exists in updated code)
window.toggleCart = toggleCart; // Updated function
window.toggleMenu = toggleMenu; // Updated function
window.checkoutFlow = checkoutFlow; // Updated function
window.closeCheckoutModal = closeCheckoutModal; // Original function
window.toggleLanguage = toggleLanguage; // Updated function
window.submitContact = submitContactOriginal; // Original function
window.toggleFaq = toggleFaqOriginal; // Original function
window.submitFeedback = submitFeedbackOriginal; // Original function
window.adminLogin = adminLoginOriginal; // Original function
window.adminLogout = adminLogoutOriginal; // Original function
window.isAdmin = isAdminOriginal; // Original function
window.renderAdminOrders = renderAdminOrdersOriginal; // Original function
window.checkAdminPage = checkAdminPageOriginal; // Original function
window.updateOrderStatus = updateOrderStatusOriginal; // Original function
window.initMenu = initMenu; // Updated function
window.populateFeedbackItems = populateFeedbackItemsOriginal; // Original function
window.renderFeedbackList = renderFeedbackListOriginal; // Original function
window.initStarRating = initStarRatingOriginal; // Original function
window.highlightActivePage = highlightActivePageOriginal; // Original function
window.updatePageIndicator = updatePageIndicatorOriginal; // Original function
window.initScrollButton = initScrollButtonOriginal; // Original function
window.initSecretAdminAccess = initSecretAdminAccessOriginal; // Original function
window.initPageLoad = initPageLoadOriginal; // Original function
window.getSavedCustomerInfo = getSavedCustomerInfoOriginal; // Original function
window.saveCustomerInfo = saveCustomerInfoOriginal; // Original function
window.validatePhone = validatePhoneOriginal; // Original function
window.formatPhone = formatPhoneOriginal; // Original function
window.getOrders = getOrdersOriginal; // Original function
window.saveOrders = saveOrdersOriginal; // Original function
window.showToast = showToastOriginal; // Original function
window.showOrderConfirmation = showOrderConfirmation; // Original function
window.renderHomeMenuPreview = renderHomeMenuPreviewOriginal; // Original function
window.closeAllSidebars = closeAllSidebarsOriginal; // Original function
window.updateFooterCategoryLinks = updateFooterCategoryLinks; // Original function (assuming it exists)

// Dummy definitions for functions that might be called but not fully implemented in the snippet
function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem(LANG_KEY, lang);
  document.documentElement.lang = lang;
  document.body.dir = 'ltr'; // Keep direction as LTR
  applyTranslations(); // Apply translations immediately
}

function applyTranslationsOriginal() {
  const t = translations[currentLang]; // Use original translations

  // Example: Translate navigation links
  if (t) {
    document.querySelectorAll('.nav-link-home').forEach(link => link.textContent = t.navHome || 'Home');
    document.querySelectorAll('.nav-link-about').forEach(link => link.textContent = t.navAbout || 'About');
    document.querySelectorAll('.nav-link-menu').forEach(link => link.textContent = t.navMenu || 'Menu');
    document.querySelectorAll('.nav-link-orders').forEach(link => link.textContent = t.navOrders || 'Orders');
    document.querySelectorAll('.nav-link-contact').forEach(link => link.textContent = t.navContact || 'Contact');
    document.querySelectorAll('.nav-link-faq').forEach(link => link.textContent = t.navFaq || 'FAQ');
    document.querySelectorAll('.nav-link-feedback').forEach(link => link.textContent = t.navFeedback || 'Feedback');
  }
  // Add translations for other nav links as needed based on original code
}

function updateQuantity(itemId, delta) {
  // This is a placeholder. The actual implementation should use `updateQuantityOriginal` or be integrated.
  console.warn("updateQuantity called, but using placeholder. Check for original implementation.");
  updateQuantityOriginal(itemId, delta); // Attempt to call original
}

// Add dummy implementations for other potentially missing functions if they cause errors
// Example: If `applyOrderTranslations` is called elsewhere
if (typeof window.applyOrderTranslations !== 'function') {
  window.applyOrderTranslations = () => { console.log('applyOrderTranslations placeholder called.'); };
}

// Also ensure that the original `translations` object is available if the new `translations` object doesn't override everything.
// If the new `translations` object is intended to completely replace the old one, then the original `translations` can be removed.
// For now, keeping the original `translations` object and using it where needed for original functions.

// Ensure `menuTranslations` is accessible if used by original functions
if (typeof menuTranslations === 'undefined') {
  // Define it if it's missing and used by original functions
  console.warn("menuTranslations was undefined, defining with placeholder.");
  window.menuTranslations = { ar: {}, en: {} };
}

// Ensure `state` object is available if used by original functions
if (typeof state === 'undefined') {
  console.warn("state object was undefined, defining with placeholder.");
  window.state = { currentLang: 'ar', currentTab: 'sweet', cart: [], menuItems: [], categories: [] };
}

// Ensure original `getAuthInstance` is correctly imported or defined
// If `getAuthInstance` is intended to be globally available from './firebase-config.js', it should be handled by the import.
// If it's a local function, it needs to be defined.

// Check if original helper functions are correctly mapped or replaced.
// E.g., `getSavedCustomerInfo` should point to `getSavedCustomerInfoOriginal`.
// Re-mapping for clarity and to ensure original functions are called when expected.
window.getSavedCustomerInfo = getSavedCustomerInfoOriginal;
window.saveCustomerInfo = saveCustomerInfoOriginal;
window.validatePhone = validatePhoneOriginal;
window.formatPhone = formatPhoneOriginal;
window.getOrders = getOrdersOriginal;
window.saveOrders = saveOrdersOriginal;
window.showToast = showToastOriginal;
window.adminLogin = adminLoginOriginal;
window.adminLogout = adminLogoutOriginal;
window.isAdmin = isAdminOriginal;
window.renderAdminOrders = renderAdminOrdersOriginal;
window.checkAdminPage = checkAdminPageOriginal;
window.updateOrderStatus = updateOrderStatusOriginal;
window.submitContact = submitContactOriginal;
window.toggleFaq = toggleFaqOriginal;
window.submitFeedback = submitFeedbackOriginal;
window.renderFeedbackList = renderFeedbackListOriginal;
window.populateFeedbackItems = populateFeedbackItemsOriginal;
window.initStarRating = initStarRatingOriginal;
window.highlightActivePage = highlightActivePageOriginal;
window.updatePageIndicator = updatePageIndicatorOriginal;
window.initScrollButton = initScrollButtonOriginal;
window.initSecretAdminAccess = initSecretAdminAccessOriginal;
window.initPageLoad = initPageLoadOriginal;
window.closeAllSidebars = closeAllSidebarsOriginal;
window.toggleCart = toggleCart; // Updated
window.toggleMenu = toggleMenu; // Updated
window.checkoutFlow = checkoutFlow; // Updated
window.addToCart = addToCart; // Updated
window.removeFromCart = removeFromCart; // Updated
window.changeQty = changeQty; // Updated
window.renderCart = renderCart; // Updated
window.initMenu = initMenu; // Updated
window.renderHomeMenuPreview = renderHomeMenuPreview; // Updated
window.applyTranslations = applyTranslations; // Updated
window.toggleLanguage = toggleLanguage; // Updated

// Ensure the updated functions are also globally accessible if needed
window.setupSearch = setupSearch;
window.loadMenuItemsFromFirebase = loadMenuItemsFromFirebase;
window.initMenu = initMenu;
window.renderMenu = renderMenu;
window.getT = getT;
window.getCurrentLang = getCurrentLang;
window.loadCart = loadCart;
window.saveCart = saveCart;
window.changeQty = changeQty;
window.removeFromCart = removeFromCart;
window.updateCart = updateCart;
window.renderCart = renderCart;
window.toggleCart = toggleCart;
window.toggleMenu = toggleMenu;
window.closeAllSidebars = closeAllSidebars;
window.checkoutFlow = checkoutFlow;
window.toggleLanguage = toggleLanguage;
window.applyTranslations = applyTranslations;
window.highlightActivePage = highlightActivePage;
window.updatePageIndicator = updatePageIndicator;
window.initScrollButton = initScrollButton;
window.loadMenuItemsFromFirebase = loadMenuItemsFromFirebase;
window.initMenu = initMenu;
window.renderMenu = renderMenu;
window.setupSearch = setupSearch;
window.renderHomeMenuPreview = renderHomeMenuPreview;