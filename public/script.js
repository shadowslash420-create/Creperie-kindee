/* script.js - Handles menu, cart, checkout, localStorage orders, admin auth */
const MENU_KEY = 'kc_menu';
const CART_KEY = 'kc_cart';
const ORDERS_KEY = 'kc_orders';
const LANG_KEY = 'kc_lang';
const FEEDBACK_KEY = 'kc_feedback';

// Translations
const translations = {
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
    footerConnect: 'Connect',
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
    faqA1: 'نحن مفتوحون يومياً من الساعة 9 صباحاً حتى 11 مساءً',
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
    aboutManager: 'Manager Adam',
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
    menuPreviewTitle: 'Diverse Selection',
    menuPreview1Title: 'Sweet Crêpes',
    menuPreview1Desc: 'Kinder, Nutella, fresh fruits',
    menuPreview2Title: 'Savory Crêpes',
    menuPreview2Desc: 'Meat, cheese, grilled chicken',
    menuPreview3Title: 'Drinks',
    menuPreview3Desc: 'Hot chocolate, fresh juices',
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
    feedbackCommentLabel: 'Your comment:',
    feedbackSubmit: 'Submit Review',
    selectItem: '-- Select a product --',
    navFaq: 'FAQ',
    navFeedback: 'Reviews',
    navDelivery: 'Delivery',

    // FAQ Page
    faqQ1: 'What are your opening hours?',
    faqA1: 'We are open daily from 9 AM to 11 PM',
    faqQ2: 'Do you offer free delivery?',
    faqA2: 'Yes, we offer free delivery for orders over 15 DZD',
    faqQ3: 'Do you use original Kinder chocolate?',
    faqA3: 'Absolutely! We only use original Kinder chocolate and fresh ingredients daily',
    faqQ4: 'Can I customize my order?',
    faqA4: 'Yes, you can add special notes when ordering and we will accommodate your request as much as possible',
    faqQ5: 'Do you have vegan options?',
    faqA5: 'Yes, we have vegan crepes with berries and vegan cream',
    faqQ6: 'How long does preparation and delivery take?',
    faqA6: 'Preparation usually takes 10-15 minutes, and delivery 20-30 minutes depending on your location',
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
    aboutManager: 'Manager Adam',
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

function getCurrentLang(){
  return localStorage.getItem(LANG_KEY) || 'ar';
}

function setLanguage(lang){
  localStorage.setItem(LANG_KEY, lang);
  document.documentElement.lang = lang;
  document.body.dir = 'ltr'; // Default to LTR, Arabic will override if needed via CSS or explicit direction setting
}

function toggleLanguage(){
  const currentLang = getCurrentLang();
  const newLang = currentLang === 'ar' ? 'en' : 'ar';
  setLanguage(newLang);
  applyTranslations();
  updateCart(); // Re-render cart to update language-specific elements if any
  updatePageIndicator(); // Update page indicator if it uses language
  // Re-render menu to update category names/descriptions if they are translated
  renderMenu(); 
  renderCategoryTabs(); // Update tab buttons too
}

function applyTranslations(){
  const lang = getCurrentLang();
  const t = translations[lang];

  const langBtn = document.getElementById('lang-btn');
  if(langBtn) langBtn.textContent = lang === 'ar' ? 'EN' : 'AR'; // Changed to AR for Arabic

  const subtitle = document.getElementById('subtitle');
  if(subtitle) subtitle.textContent = t.subtitle;

  // Only translate hero-title on menu.html, not on index.html
  const heroTitle = document.getElementById('hero-title');
  // Assuming .home-hero class is present on index.html's hero section
  if(heroTitle && !document.querySelector('.home-hero')) heroTitle.textContent = t.heroTitle; 

  // Update tab buttons (these will be re-rendered by renderCategoryTabs anyway, but good for immediate feedback if needed)
  const tabSweet = document.getElementById('tab-sweet');
  if(tabSweet) tabSweet.textContent = t.tabSweet;

  const tabSavory = document.getElementById('tab-savory');
  if(tabSavory) tabSavory.textContent = t.tabSavory;

  const tabKids = document.getElementById('tab-kids');
  if(tabKids) tabKids.textContent = t.tabKids;

  const tabDrinks = document.getElementById('tab-drinks');
  if(tabDrinks) tabDrinks.textContent = t.tabDrinks;

  // Update category titles and descriptions IF they are not dynamically rendered by new menu logic
  const titleSweet = document.getElementById('title-sweet');
  if(titleSweet) titleSweet.textContent = t.titleSweet;

  const descSweet = document.getElementById('desc-sweet');
  if(descSweet) descSweet.textContent = t.descSweet;

  const titleSavory = document.getElementById('title-savory');
  if(titleSavory) titleSavory.textContent = t.titleSavory;

  const descSavory = document.getElementById('desc-savory');
  if(descSavory) descSavory.textContent = t.descSavory;

  const titleKids = document.getElementById('title-kids');
  if(titleKids) titleKids.textContent = t.titleKids;

  const descKids = document.getElementById('desc-kids');
  if(descKids) descKids.textContent = t.descKids;

  const titleDrinks = document.getElementById('title-drinks');
  if(titleDrinks) titleDrinks.textContent = t.titleDrinks;

  const descDrinks = document.getElementById('desc-drinks');
  if(descDrinks) descDrinks.textContent = t.descDrinks;

  const cartTitle = document.getElementById('cart-title');
  if(cartTitle) cartTitle.textContent = t.cartTitle;

  const totalLabel = document.getElementById('total-label');
  if(totalLabel) totalLabel.textContent = t.totalLabel;

  const checkoutBtn = document.getElementById('checkout-btn');
  if(checkoutBtn) checkoutBtn.textContent = t.checkoutBtn;

  const orderNowBtn = document.getElementById('order-now-btn');
  if(orderNowBtn) orderNowBtn.textContent = t.orderNowBtn;

  // Homepage translations
  const heroDesc = document.getElementById('hero-desc');
  if(heroDesc) heroDesc.textContent = t.heroDesc;

  const heroBtn = document.getElementById('hero-btn');
  if(heroBtn) heroBtn.textContent = t.heroBtn;

  const featuresTitle = document.getElementById('features-title');
  if(featuresTitle) featuresTitle.textContent = t.featuresTitle;

  const feature1Title = document.getElementById('feature1-title');
  if(feature1Title) feature1Title.textContent = t.feature1Title;

  const feature1Desc = document.getElementById('feature1-desc');
  if(feature1Desc) feature1Desc.textContent = t.feature1Desc;

  const feature2Title = document.getElementById('feature2-title');
  if(feature2Title) feature2Title.textContent = t.feature2Title;

  const feature2Desc = document.getElementById('feature2-desc');
  if(feature2Desc) feature2Desc.textContent = t.feature2Desc;

  const feature3Title = document.getElementById('feature3-title');
  if(feature3Title) feature3Title.textContent = t.feature3Title;

  const feature3Desc = document.getElementById('feature3-desc');
  if(feature3Desc) feature3Desc.textContent = t.feature3Desc;

  const feature4Title = document.getElementById('feature4-title');
  if(feature4Title) feature4Title.textContent = t.feature4Title;

  const feature4Desc = document.getElementById('feature4-desc');
  if(feature4Desc) feature4Desc.textContent = t.feature4Desc;

  const menuPreviewTitle = document.getElementById('menu-preview-title');
  if(menuPreviewTitle) menuPreviewTitle.textContent = t.menuPreviewTitle;

  const menuPreview1Title = document.getElementById('menu-preview1-title');
  if(menuPreview1Title) menuPreview1Title.textContent = t.menuPreview1Title;

  const menuPreview1Desc = document.getElementById('menu-preview1-desc');
  if(menuPreview1Desc) menuPreview1Desc.textContent = t.menuPreview1Desc;

  const menuPreview2Title = document.getElementById('menu-preview2-title');
  if(menuPreview2Title) menuPreview2Title.textContent = t.menuPreview2Title;

  const menuPreview2Desc = document.getElementById('menu-preview2-desc');
  if(menuPreview2Desc) menuPreview2Desc.textContent = t.menuPreview2Desc;

  const menuPreview3Title = document.getElementById('menu-preview3-title');
  if(menuPreview3Title) menuPreview3Title.textContent = t.menuPreview3Title;

  const menuPreview3Desc = document.getElementById('menu-preview3-desc');
  if(menuPreview3Desc) menuPreview3Desc.textContent = t.menuPreview3Desc;

  const viewFullMenuBtn = document.getElementById('view-full-menu-btn');
  if(viewFullMenuBtn) viewFullMenuBtn.textContent = t.viewFullMenuBtn;

  const ctaTitle = document.getElementById('cta-title');
  if(ctaTitle) ctaTitle.textContent = t.ctaTitle;

  const ctaDesc = document.getElementById('cta-desc');
  if(ctaDesc) ctaDesc.textContent = t.ctaDesc;

  const ctaBtn = document.getElementById('cta-btn');
  if(ctaBtn) ctaBtn.textContent = t.ctaBtn;

  // Footer copyright
  const footerCopyright = document.getElementById('footer-copyright');
  if(footerCopyright) footerCopyright.innerHTML = t.footerCopyright + '<br>اتصل: +213 5X XXX XXXX';

  // FAQ translations
  const faqTitle = document.getElementById('faq-title');
  if (faqTitle) faqTitle.textContent = t.faqTitle;
  const faqQ1 = document.getElementById('faq-q1');
  if (faqQ1) faqQ1.textContent = t.faqQ1;
  const faqA1 = document.getElementById('faq-a1');
  if (faqA1) faqA1.textContent = t.faqA1;
  const faqQ2 = document.getElementById('faq-q2');
  if (faqQ2) faqQ2.textContent = t.faqQ2;
  const faqA2 = document.getElementById('faq-a2');
  if (faqA2) faqA2.textContent = t.faqA2;
  const faqQ3 = document.getElementById('faq-q3');
  if (faqQ3) faqQ3.textContent = t.faqQ3;
  const faqA3 = document.getElementById('faq-a3');
  if (faqA3) faqA3.textContent = t.faqA3;
  const faqQ4 = document.getElementById('faq-q4');
  if (faqQ4) faqQ4.textContent = t.faqQ4;
  const faqA4 = document.getElementById('faq-a4');
  if (faqA4) faqA4.textContent = t.faqA4;
  const faqQ5 = document.getElementById('faq-q5');
  if (faqQ5) faqQ5.textContent = t.faqQ5;
  const faqA5 = document.getElementById('faq-a5');
  if (faqA5) faqA5.textContent = t.faqA5;
  const faqQ6 = document.getElementById('faq-q6');
  if (faqQ6) faqQ6.textContent = t.faqQ6;
  const faqA6 = document.getElementById('faq-a6');
  if (faqA6) faqA6.textContent = t.faqA6;

  // Feedback translations
  const feedbackFormTitle = document.getElementById('feedback-form-title');
  if (feedbackFormTitle) feedbackFormTitle.textContent = t.feedbackFormTitle;
  const feedbackReviewsTitle = document.getElementById('feedback-reviews-title');
  if (feedbackReviewsTitle) feedbackReviewsTitle.textContent = t.feedbackReviewsTitle;
  const feedbackNameLabel = document.getElementById('feedback-name-label');
  if (feedbackNameLabel) feedbackNameLabel.textContent = t.feedbackNameLabel;
  const feedbackItemLabel = document.getElementById('feedback-item-label');
  if (feedbackItemLabel) feedbackItemLabel.textContent = t.feedbackItemLabel;
  const feedbackRatingLabel = document.getElementById('feedback-rating-label');
  if (feedbackRatingLabel) feedbackRatingLabel.textContent = t.feedbackRatingLabel;
  const feedbackCommentLabel = document.getElementById('feedback-comment-label');
  if (feedbackCommentLabel) feedbackCommentLabel.textContent = t.feedbackCommentLabel;
  const feedbackSubmit = document.getElementById('feedback-submit');
  if (feedbackSubmit) feedbackSubmit.textContent = t.feedbackSubmit;
  const selectItem = document.getElementById('feedback-item');
  if(selectItem) selectItem.innerHTML = '<option value="">' + t.selectItem + '</option>';

  // About & Contact translations
  const aboutTitle = document.getElementById('about-title');
  if (aboutTitle) aboutTitle.textContent = t.aboutTitle;
  const aboutDesc1 = document.getElementById('about-desc1');
  if (aboutDesc1) aboutDesc1.textContent = t.aboutDesc1;
  const aboutDesc2 = document.getElementById('about-desc2');
  if (aboutDesc2) aboutDesc2.textContent = t.aboutDesc2;
  const aboutTeamTitle = document.getElementById('about-team-title');
  if (aboutTeamTitle) aboutTeamTitle.textContent = t.aboutTeamTitle;
  const aboutChef = document.getElementById('about-chef');
  if (aboutChef) aboutChef.textContent = t.aboutChef;
  const aboutChefDesc = document.getElementById('about-chef-desc');
  if (aboutChefDesc) aboutChefDesc.textContent = t.aboutChefDesc;
  const aboutManager = document.getElementById('about-manager');
  if (aboutManager) aboutManager.textContent = t.aboutManager;
  const aboutManagerDesc = document.getElementById('about-manager-desc');
  if (aboutManagerDesc) aboutManagerDesc.textContent = t.aboutManagerDesc;
  
  const contactTitle = document.getElementById('contact-title');
  if (contactTitle) contactTitle.textContent = t.contactTitle;
  const contactNameLabel = document.getElementById('contact-name-label');
  if (contactNameLabel) contactNameLabel.textContent = t.contactNameLabel;
  const contactEmailLabel = document.getElementById('contact-email-label');
  if (contactEmailLabel) contactEmailLabel.textContent = t.contactEmailLabel;
  const contactMessageLabel = document.getElementById('contact-message-label');
  if (contactMessageLabel) contactMessageLabel.textContent = t.contactMessageLabel;
  const contactSubmit = document.getElementById('contact-submit');
  if (contactSubmit) contactSubmit.textContent = t.contactSubmit;

  // Admin translations
  const adminLoginTitle = document.getElementById('admin-login-title');
  if (adminLoginTitle) adminLoginTitle.textContent = t.adminLoginTitle;
  const adminUsername = document.getElementById('admin-username-label');
  if (adminUsername) adminUsername.textContent = t.adminUsername;
  const adminPassword = document.getElementById('admin-password-label');
  if (adminPassword) adminPassword.textContent = t.adminPassword;
  const adminLoginBtn = document.getElementById('admin-login-btn');
  if (adminLoginBtn) adminLoginBtn.textContent = t.adminLoginBtn;
  const adminPanelTitle = document.getElementById('admin-panel-title');
  if (adminPanelTitle) adminPanelTitle.textContent = t.adminPanelTitle;
  const adminLogoutBtn = document.getElementById('admin-logout-btn');
  if (adminLogoutBtn) adminLogoutBtn.textContent = t.adminLogoutBtn;

  // Navigation links translations
  const navHomeLinks = document.querySelectorAll('.nav-link-home');
  navHomeLinks.forEach(link => link.textContent = t.navHome);
  
  const navAboutLinks = document.querySelectorAll('.nav-link-about');
  navAboutLinks.forEach(link => link.textContent = t.navAbout);
  
  const navMenuLinks = document.querySelectorAll('.nav-link-menu');
  navMenuLinks.forEach(link => link.textContent = t.navMenu);
  
  const navContactLinks = document.querySelectorAll('.nav-link-contact');
  navContactLinks.forEach(link => link.textContent = t.navContact);
  
  const navAdminLinks = document.querySelectorAll('.nav-link-admin');
  navAdminLinks.forEach(link => link.textContent = t.navAdmin);
  
  const navFaqLinks = document.querySelectorAll('.nav-link-faq');
  navFaqLinks.forEach(link => link.textContent = t.navFaq);
  
  const navFeedbackLinks = document.querySelectorAll('.nav-link-feedback');
  navFeedbackLinks.forEach(link => link.textContent = t.navFeedback);
  
  const navDeliveryLinks = document.querySelectorAll('.nav-link-delivery');
  navDeliveryLinks.forEach(link => link.textContent = t.navDelivery);

}

/* ====== NEW MENU LOGIC ====== */
// Assuming dbService is available globally or imported elsewhere if this were a module
// For this single file, we'll assume dbService is defined globally or in a preceding script.
// If not, this would need to be adapted.
// For example: const dbService = window.dbService || {}; 

// Use Firebase Firestore for menu data (with fallback to server API)
// This section replaces the old getMenu and saveMenu functions.

// --- State Management ---
const state = {
  currentLang: getCurrentLang(), // Initialize from localStorage
  currentTab: 'sweet',
  cart: [],
  menuItems: [],
  categories: []
};

// --- Translations (Menu specific, integrated into the main translations object) ---
// NOTE: The original translations object is kept. New menu-specific ones are added below for clarity.
// Existing translations for menu page elements will be used by applyTranslations.
// This new object is for dynamic rendering of menu items and categories within the new renderMenu function.
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

// --- Initialization ---
async function initMenu() {
  try {
    console.log('🔄 Loading menu from Firebase...');

    // Load categories first
    await loadCategories();

    // Load menu items
    await loadMenuItems();

    // Setup real-time listeners
    setupRealtimeListeners();

    // Load cart from localStorage
    loadCart();

    // Render initial view
    renderMenu();
    updateCart(); // Render cart contents

    console.log('✅ Menu loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load menu:', error);
    // Fallback to empty state if Firebase/DB fails
    state.menuItems = [];
    state.categories = [];
    renderMenu();
  }
}

// --- Data Loading ---
async function loadCategories() {
  try {
    // Assuming dbService has a method to fetch all categories
    // If dbService is not available, this will throw an error.
    const categories = await dbService.getAllCategories(); 
    state.categories = categories.sort((a, b) => (a.order || 0) - (b.order || 0)); // Sort by order

    // Update tab navigation UI
    renderCategoryTabs();
  } catch (error) {
    console.error('Failed to load categories from DB:', error);
    // Use default categories as fallback
    state.categories = [
      { id: 'sweet', name: 'Sweet Crêpes', order: 0 },
      { id: 'savory', name: 'Savory Crêpes', order: 1 },
      { id: 'kids', name: 'Kids Crêpes', order: 2 },
      { id: 'drinks', name: 'Drinks', order: 3 }
    ];
    renderCategoryTabs(); // Render with default categories
  }
}

async function loadMenuItems() {
  try {
    // Assuming dbService has a method to fetch all menu items
    const items = await dbService.getAllMenuItems();
    state.menuItems = items;
  } catch (error) {
    console.error('Failed to load menu items from DB:', error);
    state.menuItems = []; // Fallback to empty array
  }
}

// --- Real-Time Sync ---
function setupRealtimeListeners() {
  // Listen to menu item changes
  if (typeof dbService.listenToMenuChanges === 'function') {
    dbService.listenToMenuChanges((items) => {
      console.log('📡 Menu updated in real-time:', items.length, 'items');
      state.menuItems = items;
      renderMenu(); // Re-render the menu view
    });
  } else {
    console.warn('dbService.listenToMenuChanges not available. Real-time menu updates disabled.');
  }

  // Listen to category changes
  if (typeof dbService.listenToCategoryChanges === 'function') {
    dbService.listenToCategoryChanges((categories) => {
      console.log('📡 Categories updated in real-time:', categories.length, 'categories');
      state.categories = categories.sort((a, b) => (a.order || 0) - (b.order || 0));
      renderCategoryTabs(); // Update tab navigation
      renderMenu(); // Re-render menu in case category order/visibility changed
    });
  } else {
    console.warn('dbService.listenToCategoryChanges not available. Real-time category updates disabled.');
  }
}

// --- Category Tabs ---
function renderCategoryTabs() {
  const tabNav = document.getElementById('tab-nav'); // Assuming a div with id="tab-nav" exists
  if (!tabNav) return;

  // Sort categories by order before rendering
  const sortedCategories = [...state.categories].sort((a, b) => (a.order || 0) - (b.order || 0));

  const html = sortedCategories.map(cat => {
    // Use translated name if available, otherwise use the category name
    const categoryName = state.currentLang === 'ar' 
      ? (menuTranslations.ar.categories[cat.id] || cat.name)
      : (menuTranslations.en.categories[cat.id] || cat.name);

    return `
      <button class="tab-btn ${state.currentTab === cat.id ? 'active' : ''}" 
        onclick="switchTab('${cat.id}')" id="tab-${cat.id}">
        ${categoryName}
      </button>
    `;
  }).join('');

  tabNav.innerHTML = html;
}

// --- Menu Rendering ---
function renderMenu() {
  const container = document.querySelector('.menu-container'); // Assuming a container for menu sections
  if (!container) return;

  // Hide all sections first, then show the active one
  document.querySelectorAll('.section').forEach(section => {
    section.classList.add('hidden');
  });

  // Group items by category
  const itemsByCategory = {};
  state.menuItems.forEach(item => {
    if (!itemsByCategory[item.category]) {
      itemsByCategory[item.category] = [];
    }
    itemsByCategory[item.category].push(item);
  });

  // Render each category section
  state.categories.forEach(category => {
    const sectionId = `section-${category.id}`;
    let section = document.getElementById(sectionId);

    // Create section element if it doesn't exist
    if (!section) {
      section = document.createElement('section');
      section.id = sectionId;
      section.className = 'section hidden'; // Initially hidden
      container.appendChild(section);
    }

    // Get category details and translations
    const items = itemsByCategory[category.id] || [];
    const categoryName = state.currentLang === 'ar' 
      ? (menuTranslations.ar.categories[category.id] || category.name)
      : (menuTranslations.en.categories[cat.id] || category.name);
    const categoryDesc = state.currentLang === 'ar'
      ? (menuTranslations.ar.categoryDesc[category.id] || '')
      : (menuTranslations.en.categoryDesc[category.id] || '');
    const emptyMsg = state.currentLang === 'ar' ? menuTranslations.ar.emptyCategoryMsg : menuTranslations.en.emptyCategoryMsg;

    // Generate HTML for the menu items within this category
    const menuItemsHTML = items.length === 0 ? `
      <div class="empty-category-message">
        <div class="empty-icon">🍽️</div>
        <p>${emptyMsg}</p>
      </div>
    ` : items.map(item => `
      <div class="menu-card">
        <div class="menu-card-image" style="background-image:url('${item.img || 'images/placeholder.svg'}')"></div>
        <div class="menu-card-content">
          <h3 class="menu-card-title">${item.name}</h3>
          <p class="menu-card-desc">${item.desc}</p>
          <div class="menu-card-footer">
            <span class="menu-card-price">${item.price.toFixed(2)} DZD</span>
            <button class="menu-card-btn" onclick="addToCart('${item.id}')">
              ${state.currentLang === 'ar' ? menuTranslations.ar.addToCart : menuTranslations.en.addToCart}
            </button>
          </div>
        </div>
      </div>
    `).join('');

    // Update section content
    section.innerHTML = `
      <h2 class="section-title" id="title-${category.id}">${categoryName}</h2>
      <div class="section-desc" id="desc-${category.id}">${categoryDesc}</div>
      <div class="menu-grid" id="menu-${category.id}">
        ${menuItemsHTML}
      </div>
    `;

    // Show the section if it's the currently active tab
    if (category.id === state.currentTab) {
      section.classList.remove('hidden');
    }
  });
}

// --- Tab Switching ---
function switchTab(categoryId) {
  state.currentTab = categoryId;

  // Update active tab button visual state
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeTabBtn = document.getElementById(`tab-${categoryId}`);
  if (activeTabBtn) activeTabBtn.classList.add('active');

  // Show/hide sections
  document.querySelectorAll('.section').forEach(section => {
    section.classList.add('hidden');
  });
  const targetSection = document.getElementById(`section-${categoryId}`);
  if (targetSection) targetSection.classList.remove('hidden');
}

// --- Cart Functions ---
function addToCart(itemId) {
  const item = state.menuItems.find(i => i.id === itemId);
  if (!item) return;

  const existing = state.cart.find(c => c.id === itemId);
  if (existing) {
    existing.quantity++;
  } else {
    // Ensure item has all necessary properties for cart display if not present in DB item
    state.cart.push({ 
      id: item.id, 
      name: item.name, 
      price: item.price, 
      img: item.img, // Include image for cart display
      quantity: 1 
    });
  }

  saveCart();
  updateCart(); // Update cart UI

  // Visual feedback toast
  const toastMsg = state.currentLang === 'ar' ? menuTranslations.ar.addedToCartToast : menuTranslations.en.addedToCartToast;
  showToast(toastMsg);
}

function removeFromCart(itemId) {
  state.cart = state.cart.filter(item => item.id !== itemId);
  saveCart();
  updateCart();
}

function updateQuantity(itemId, delta) {
  const item = state.cart.find(c => c.id === itemId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    removeFromCart(itemId);
  } else {
    saveCart();
    updateCart();
  }
}

function updateCart() {
  const container = document.getElementById('cart-contents'); // Element to render cart items
  const totalEl = document.getElementById('cart-total');     // Element to display total price

  if (!container || !totalEl) {
    console.warn('Cart elements not found. Cannot update cart.');
    return;
  }

  if (state.cart.length === 0) {
    container.innerHTML = `
      <div style="padding: 40px 20px; text-align: center; color: #999;">
        <div style="font-size: 48px; margin-bottom: 16px;">🛒</div>
        <p>${state.currentLang === 'ar' ? translations.ar.emptyCart : translations.en.emptyCart}</p>
      </div>
    `;
    totalEl.textContent = '0.00 DZD';
    return;
  }

  // Calculate total
  const total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Render cart items
  container.innerHTML = state.cart.map(item => `
    <div class="cart-item">
      <img src="${item.img || 'images/placeholder.svg'}" alt="${item.name}" class="cart-item-img">
      <div class="cart-item-info">
        <h4>${item.name}</h4>
        <p>${item.price.toFixed(2)} DZD</p>
      </div>
      <div class="cart-item-controls">
        <button onclick="updateQuantity('${item.id}', -1)">-</button>
        <span>${item.quantity}</span>
        <button onclick="updateQuantity('${item.id}', 1)">+</button>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">×</button>
    </div>
  `).join('');

  // Update total display
  totalEl.textContent = total.toFixed(2) + ' DZD';
}

function saveCart() {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(state.cart));
  } catch (error) {
    console.error('Failed to save cart to localStorage:', error);
  }
}

function loadCart() {
  try {
    const saved = localStorage.getItem(CART_KEY);
    if (saved) {
      state.cart = JSON.parse(saved);
      // Ensure quantities are valid numbers
      state.cart.forEach(item => {
        if (typeof item.quantity !== 'number' || item.quantity < 0) {
          item.quantity = 0;
        }
      });
      state.cart = state.cart.filter(item => item.quantity > 0); // Remove items with zero quantity
    }
  } catch (error) {
    console.error('Failed to load cart from localStorage:', error);
    state.cart = []; // Reset cart if parsing fails
  }
}

// ==================== UI FUNCTIONS ====================
function toggleCart() {
  const cartSide = document.getElementById('cart-side');
  if (cartSide) {
    cartSide.classList.toggle('active');
    // Add/remove overlay and body overflow if they exist
    const overlay = document.getElementById('menu-overlay');
    if (overlay) overlay.classList.toggle('active');
    document.body.style.overflow = cartSide.classList.contains('active') ? 'hidden' : '';
  }
}

function toggleMenu() {
  const navMenu = document.getElementById('nav-menu');
  const overlay = document.getElementById('menu-overlay');
  if (navMenu && overlay) {
    navMenu.classList.toggle('active');
    overlay.classList.toggle('active');
    document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
  }
}

function checkoutFlow(){
  const lang = state.currentLang;
  const t = translations[lang];
  const cart = state.cart; // Use state.cart

  if(cart.length === 0) return alert(t.emptyCartAlert || 'Cart is empty!');
  
  // Calculate totals
  const subtotal = cart.reduce((s,i)=>s + i.price * i.qty, 0); // Assuming cart items have price and qty properties
  
  // Check minimum order
  const MIN_ORDER_AMOUNT = 5.0; // Minimum order in DZD
  if(subtotal < MIN_ORDER_AMOUNT){
    const minOrderMsg = lang === 'ar' 
      ? `الحد الأدنى للطلب هو ${MIN_ORDER_AMOUNT} دج`
      : `Minimum order amount is ${MIN_ORDER_AMOUNT} DZD`;
    return alert(minOrderMsg);
  }
  
  const FREE_DELIVERY_THRESHOLD = 15.0; // Free delivery over this amount
  const DELIVERY_FEE = 2.0; // Delivery fee in DZD
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = subtotal + deliveryFee;
  
  // Get saved customer info
  const savedInfo = getSavedCustomerInfo();
  
  // Create checkout modal
  const modal = document.createElement('div');
  modal.className = 'checkout-modal-overlay';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;';
  modal.onclick = (e) => {
    if(e.target === modal) closeCheckoutModal();
  };
  
  const savedNameLabel = lang === 'ar' ? 'الاسم الكامل' : 'Full Name';
  const savedPhoneLabel = lang === 'ar' ? 'رقم الهاتف' : 'Phone Number';
  const savedAddressLabel = lang === 'ar' ? 'العنوان' : 'Address';
  const savedInstructionsLabel = lang === 'ar' ? 'تعليمات خاصة (اختياري)' : 'Special Instructions (Optional)';
  const savedSubtotalLabel = lang === 'ar' ? 'المجموع الفرعي' : 'Subtotal';
  const savedDeliveryLabel = lang === 'ar' ? 'رسوم التوصيل' : 'Delivery Fee';
  const savedTotalLabel = lang === 'ar' ? 'المجموع الكلي' : 'Total';
  const savedFreeDeliveryLabel = lang === 'ar' ? 'توصيل مجاني!' : 'Free Delivery!';
  const savedPlaceOrderLabel = lang === 'ar' ? 'تأكيد الطلب' : 'Place Order';
  const savedCancelLabel = lang === 'ar' ? 'إلغاء' : 'Cancel';
  const savedPhoneErrorLabel = lang === 'ar' ? 'رقم الهاتف غير صحيح. استخدم التنسيق: +213 5XX XXX XXX' : 'Invalid phone number. Use format: +213 5XX XXX XXX';
  
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
          <button type="button" onclick="closeCheckoutModal()" style="flex:1;padding:14px;border:1px solid var(--border);background:#fff;border-radius:4px;cursor:pointer;font-weight:600;transition:all 0.3s;">${savedCancelLabel}</button>
          <button type="submit" style="flex:1;padding:14px;border:none;background:var(--gradient-primary);color:#fff;border-radius:4px;cursor:pointer;font-weight:700;transition:all 0.3s;">${savedPlaceOrderLabel}</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Handle form submission
  document.getElementById('checkout-form').onsubmit = (e) => {
    e.preventDefault();
    const name = document.getElementById('checkout-name').value.trim();
    const phone = document.getElementById('checkout-phone').value.trim();
    const address = document.getElementById('checkout-address').value.trim();
    const notes = document.getElementById('checkout-notes').value.trim();
    
    if(!name) return alert(t.nameRequired);
    if(!phone) return alert(t.phoneRequired);
    if(!validatePhone(phone)){
      alert(savedPhoneErrorLabel);
      return;
    }
    if(!address) return alert(t.addressRequired);
    
    // Format phone
    const formattedPhone = formatPhone(phone);
    
    // Save customer info
    saveCustomerInfo(name, formattedPhone, address);
    
    // Create order object using current cart state
    const order = {
      customerName: name,
      customerPhone: formattedPhone,
      customerAddress: address,
      items: state.cart.map(item => ({ // Map to include only necessary details for order
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      })),
      subtotal,
      deliveryFee,
      total,
      specialInstructions: notes,
      status:'pending', // Default status
      createdAt: new Date().toISOString() // Timestamp for the order
    };
    
    // Save to Firebase (with fallback to localStorage)
    placeOrderAsync(order, lang).then(orderId => {
      saveCart([]); // Clear cart after successful order placement
      closeCheckoutModal();
      toggleCart(); // Close cart UI if open
      showOrderConfirmation(orderId, order, lang); // Show confirmation modal
    }).catch(error => {
      alert(lang === 'ar' ? 'فشل في إرسال الطلب. حاول مرة أخرى.' : 'Failed to place order. Please try again.');
      console.error('Order placement failed:', error);
    });
  };
}

function closeCheckoutModal(){
  const modal = document.querySelector('.checkout-modal-overlay');
  if(modal) modal.remove();
}

function showOrderConfirmation(orderId, order, lang){
  const t = translations[lang];
  const confirmModal = document.createElement('div');
  confirmModal.className = 'checkout-modal-overlay';
  confirmModal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;';
  confirmModal.onclick = (e) => {
    if(e.target === confirmModal) confirmModal.remove();
  };
  
  const itemsList = order.items.map(item => 
    `${item.quantity}x ${item.name} - ${item.price.toFixed(2)} DZD`
  ).join('\n');
  
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
  toast(t.orderSuccess + orderId);
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
  // Fetch orders from localStorage or wherever they are stored. Assuming getOrders() retrieves them.
  const orders = getOrders().slice().reverse(); 
  if(!list) return;
  list.innerHTML = '';
  orders.forEach(o=>{
    const el = document.createElement('div');
    el.className='order';
    // Ensure 'id' and 'name'/'phone' exist, and 'timestamp' or 'createdAt'
    el.innerHTML = `<div style="display:flex;justify-content:space-between"><div><strong>${o.id || 'N/A'}</strong> <div class="text-sm">${o.customerName || o.name} • ${o.customerPhone || o.phone}</div></div><div><small>${new Date(o.createdAt || o.timestamp).toLocaleString()}</small></div></div>`;
    const items = document.createElement('div');
    items.className='text-sm';
    // Check if o.items exists and is an array
    items.textContent = Array.isArray(o.items) ? o.items.map(i=> `${i.name} x${i.quantity || i.qty}`).join(', ') : 'No items';
    
    const status = document.createElement('div');
    status.style.marginTop='6px';
    const sel = document.createElement('select');
    const statusMap = {'pending': 'Pending', 'in-progress': 'In Progress', 'delivered': 'Delivered'};
    Object.keys(statusMap).forEach(key=>{
      const opt = document.createElement('option');
      opt.value=key;
      opt.textContent=statusMap[key];
      // Normalize status for comparison: current order status vs mapped option value
      const currentStatusNormalized = o.status ? o.status.toLowerCase() : '';
      if(currentStatusNormalized === key || currentStatusNormalized === statusMap[key].toLowerCase()) opt.selected=true;
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
    statsEl.innerHTML += '<div class="stat-card"><strong>حسب الحالة</strong><div style="margin-top:6px">Pending: '+(byStatus.pending||0)+' • In Progress: '+(byStatus['in-progress']||0)+' • Delivered: '+(byStatus.delivered||0)+'</div></div>';
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
  const orders = getOrders(); // Assuming this retrieves orders from localStorage
  const o = orders.find(x=> x.id===id);
  if(!o) return;
  // Normalize status to lowercase for consistency
  const statusMap = {'Pending': 'pending', 'In Progress': 'in-progress', 'Delivered': 'delivered'};
  o.status = statusMap[status] || status.toLowerCase(); // Use mapped status or lowercase original
  saveOrders(orders); // Assuming this saves orders back to localStorage
  renderAdminOrders();
  toast('تم تحديث حالة الطلب ' + id);
}

/* Contact form */
function submitContact(e){
  e.preventDefault();
  const name = document.getElementById('contact-name').value;
  const email = document.getElementById('contact-email').value;
  const msg = document.getElementById('contact-msg').value;
  const lang = getCurrentLang();
  const t = translations[lang];
  // Assuming contactSuccess message requires name replacement
  toast(t.contactSuccess.replace('{name}', name)); 
  e.target.reset();
}

/* ====== FAQ Functions ====== */
function toggleFaq(element){
  const faqItem = element.parentElement;
  const isActive = faqItem.classList.contains('active');

  // Close all other FAQ items first
  document.querySelectorAll('.faq-item').forEach(item => {
    item.classList.remove('active');
    const icon = item.querySelector('.faq-icon');
    if(icon) icon.textContent = '+';
  });

  // Toggle the clicked item
  if(!isActive){
    faqItem.classList.add('active');
    const icon = element.querySelector('.faq-icon');
    if(icon) icon.textContent = '−';
  }
}

/* ====== Feedback Functions ====== */
function getFeedback(){ return JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '[]'); }
function saveFeedback(f){ localStorage.setItem(FEEDBACK_KEY, JSON.stringify(f)); }

async function submitFeedback(e){
  e.preventDefault();
  const lang = getCurrentLang();
  const t = translations[lang];

  const nameInput = document.getElementById('feedback-name');
  const itemIdInput = document.getElementById('feedback-item');
  const ratingInput = document.getElementById('feedback-rating');
  const commentInput = document.getElementById('feedback-comment');

  const name = nameInput ? nameInput.value : '';
  const itemId = itemIdInput ? itemIdInput.value : '';
  const rating = ratingInput ? parseInt(ratingInput.value) : 0;
  const comment = commentInput ? commentInput.value : '';

  if(!rating){
    return alert('الرجاء اختيار تقييم'); // "Please select a rating"
  }
  if (!itemId) {
      alert(lang === 'ar' ? 'الرجاء اختيار منتج' : 'Please select a product');
      return;
  }

  const menu = await getMenu(); // Use original getMenu for item name lookup if needed, or get from state.menuItems
  const item = state.menuItems.find(m => m.id === itemId); // Use the new state

  const feedback = getFeedback();
  const newFeedback = {
    id: 'FB-' + Date.now(),
    name,
    itemId,
    itemName: item ? item.name : '', // Get name from state.menuItems
    rating,
    comment,
    createdAt: new Date().toISOString()
  };

  feedback.push(newFeedback);
  saveFeedback(feedback);

  // Reset form and toast
  if(e.target) e.target.reset();
  if(ratingInput) ratingInput.value = '';
  document.querySelectorAll('.star').forEach(star => star.textContent = '☆'); // Reset stars

  toast(t.feedbackSuccess);
  renderFeedbackList();
}

function renderFeedbackList(){
  const container = document.getElementById('feedback-list');
  if(!container) return;

  const feedback = getFeedback().slice().reverse();
  container.innerHTML = '';

  const lang = getCurrentLang();
  const t = translations[lang];

  if(feedback.length === 0){
    container.innerHTML = '<div class="card"><p style="text-align:center;color:var(--warm-gray)">' + t.noFeedback + '</p></div>';
    return;
  }

  feedback.forEach(fb => {
    const card = document.createElement('div');
    card.className = 'feedback-card';

    const stars = '★'.repeat(fb.rating) + '☆'.repeat(5 - fb.rating);

    card.innerHTML = `
      <div class="feedback-header">
        <div>
          <strong>${fb.name}</strong>
          <div class="feedback-item-name">${fb.itemName}</div>
        </div>
        <div class="feedback-stars">${stars}</div>
      </div>
      <p class="feedback-comment">${fb.comment}</p>
      <div class="feedback-date">${new Date(fb.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'en-US')}</div>
    `;

    container.appendChild(card);
  });
}

async function populateFeedbackItems(){
  const select = document.getElementById('feedback-item');
  if(!select) return;

  // Use the new state.menuItems loaded by initMenu
  const menu = state.menuItems; 
  const lang = getCurrentLang();
  const t = translations[lang];

  select.innerHTML = '<option value="">' + t.selectItem + '</option>';

  menu.forEach(item => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = item.name;
    select.appendChild(option);
  });
}

function initStarRating(){
  const stars = document.querySelectorAll('.star');
  const ratingInput = document.getElementById('feedback-rating');

  if(!stars.length || !ratingInput) return;

  stars.forEach(star => {
    star.addEventListener('click', function(){
      const rating = parseInt(this.getAttribute('data-rating'));
      ratingInput.value = rating;

      stars.forEach((s, index) => {
        if(index < rating){
          s.textContent = '★';
        } else {
          s.textContent = '☆';
        }
      });
    });

    star.addEventListener('mouseenter', function(){
      const rating = parseInt(this.getAttribute('data-rating'));
      stars.forEach((s, index) => {
        if(index < rating){
          s.textContent = '★';
        } else {
          s.textContent = '☆';
        }
      });
    });
  });

  const starRating = document.getElementById('star-rating');
  if(starRating){
    starRating.addEventListener('mouseleave', function(){
      const currentRating = parseInt(ratingInput.value) || 0;
      stars.forEach((s, index) => {
        if(index < currentRating){
          s.textContent = '★';
        } else {
          s.textContent = '☆';
        }
      });
    });
  }
}

/* Highlight active page in navigation */
function highlightActivePage(){
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-menu-links a, .footer-links a');
  
  navLinks.forEach(link => {
    const linkPage = link.getAttribute('href');
    // Handle root path and index.html cases
    if( (currentPage === '' || currentPage === 'index.html') && (linkPage === '' || linkPage === 'index.html') ) {
      link.classList.add('active-page');
    } else if (linkPage === currentPage) {
      link.classList.add('active-page');
    }
  });
  
  // Update page indicator in header
  updatePageIndicator();
}

function updatePageIndicator(){
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const lang = getCurrentLang();
  const t = translations[lang];
  
  const pageNames = {
    'index.html': { ar: 'الرئيسية', en: 'Home' },
    '': { ar: 'الرئيسية', en: 'Home' }, // For root path
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
  
  // Apply translations to all navigation links (already done in applyTranslations, but good for redundancy if needed)
  // const navHomeLinks = document.querySelectorAll('.nav-link-home');
  // navHomeLinks.forEach(link => link.textContent = t.navHome);
  // ... and so on for other nav links ...
}

/* Scroll Button Functions */
function initScrollButton(){
  // Check if scroll-btn element already exists, if not create it
  let scrollBtn = document.getElementById('scroll-btn');
  if (!scrollBtn) {
    scrollBtn = document.createElement('button');
    scrollBtn.className = 'scroll-btn'; // Add base class
    scrollBtn.id = 'scroll-btn';
    document.body.appendChild(scrollBtn);
  }

  // Handle scroll event
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    
    if (!scrollBtn) return; // Exit if button somehow disappeared

    // Show button initially, or after scrolling
    if(scrolled === 0){
      // At top - show down arrow
      scrollBtn.classList.add('visible');
      scrollBtn.innerHTML = '↓';
      scrollBtn.setAttribute('aria-label', 'Scroll to bottom');
    } else if(scrolled > 50){
      // Scrolled down - show up arrow
      scrollBtn.classList.add('visible');
      scrollBtn.innerHTML = '↑';
      scrollBtn.setAttribute('aria-label', 'Scroll to top');
    } else {
      // Scrolled a little but not enough to show up arrow, maybe hide or keep subtle
      scrollBtn.classList.remove('visible');
    }
  });

  // Handle click
  scrollBtn.addEventListener('click', () => {
    const scrolled = window.scrollY;
    
    if(scrolled === 0 || scrollBtn.innerHTML === '↓'){
      // Scroll to bottom
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
      });
    } else {
      // Scroll to top
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  });
  
  // Initial check for visibility on load
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


/* Hidden Admin & Delivery Access - Secret Keyboard Shortcuts */
function initSecretAdminAccess(){
  // Secret keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Admin: Ctrl + Shift + K
    if (e.ctrlKey && e.shiftKey && e.key === 'K') {
      e.preventDefault();
      window.location.href = 'admin.html';
    }
    // Delivery: Ctrl + Shift + D
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      e.preventDefault();
      window.location.href = 'delivery.html';
    }
  });

  // Admin: 7 rapid taps on copyright text
  const copyrightElement = document.getElementById('footer-copyright');
  if(copyrightElement) {
    let adminTapCount = 0;
    let adminTapTimer = null;

    copyrightElement.addEventListener('click', () => {
      adminTapCount++;
      
      // Clear previous timer
      if(adminTapTimer) clearTimeout(adminTapTimer);
      
      // If 7 taps within 2 seconds, go to admin
      if(adminTapCount >= 7) {
        window.location.href = 'admin.html';
        adminTapCount = 0;
        return;
      }
      
      // Reset tap count after 2 seconds
      adminTapTimer = setTimeout(() => {
        adminTapCount = 0;
      }, 2000);
    });
  }

  // Delivery: 7 rapid taps on "Connect" text
  // Find the element with class 'footer-connect' or similar if it exists
  // Example: const connectText = document.querySelector('.footer-connect'); 
  // If not found, this part might be skipped or needs adjustment based on actual HTML.
  const connectText = document.querySelector('.footer-connect'); // Placeholder selector
  if(connectText) {
    let deliveryTapCount = 0;
    let deliveryTapTimer = null;

    connectText.addEventListener('click', (e) => {
      e.preventDefault();
      deliveryTapCount++;
      
      // Clear previous timer
      if(deliveryTapTimer) clearTimeout(deliveryTapTimer);
      
      // If 7 taps within 2 seconds, go to delivery
      if(deliveryTapCount >= 7) {
        window.location.href = 'delivery.html';
        deliveryTapCount = 0;
        return;
      }
      
      // Reset tap count after 2 seconds
      deliveryTapTimer = setTimeout(() => {
        deliveryTapCount = 0;
      }, 2000);
    });
  }
}

/* On load hooks */
/* Page loading animation */
function initPageLoad(){
  document.body.classList.add('page-loading');
  setTimeout(() => {
    document.body.classList.remove('page-loading');
    document.body.classList.add('page-loaded');
  }, 100);
}

document.addEventListener('DOMContentLoaded', ()=>{
  initPageLoad();
  try {
    // Set language based on localStorage
    const initialLang = getCurrentLang();
    setLanguage(initialLang);
    applyTranslations(); // Apply translations for static elements

    // Initialize menu loading (Firebase + real-time)
    initMenu().then(() => {
      // After menu is loaded and rendered, ensure cart and other UI elements are up-to-date.
      updateCart(); // Render cart contents based on loaded cart
      // Highlight active page might depend on menu rendering if nav links are dynamic
      highlightActivePage(); 
    });
    
    // Initialize scroll button
    initScrollButton();

    // Initialize secret admin access
    initSecretAdminAccess();
  } catch(error) {
    console.error('Error during DOMContentLoaded initialization:', error);
  }

  // Admin login form submission
  const adminForm = document.getElementById('admin-login-form');
  if(adminForm){
    adminForm.addEventListener('submit', e=>{
      e.preventDefault();
      const u = document.getElementById('adm-user').value;
      const p = document.getElementById('adm-pass').value;
      if(adminLogin(u,p)){
        checkAdminPage(); // Refresh admin page view
      } else {
        alert('خطأ في بيانات الدخول'); // "Login data error"
      }
    });
  }

  // Initial check for admin page state
  checkAdminPage();

  // Feedback page setup
  // Need to ensure populateFeedbackItems is called after menu items are loaded
  // So it's better to call it within initMenu's completion or here after ensuring menuItems are loaded.
  // For now, assuming feedback page might load independently or menu items are already available.
  populateFeedbackItems(); // Populate dropdown with menu items
  renderFeedbackList();    // Display existing feedback
  initStarRating();        // Initialize star rating functionality
});

/* Firebase Order Placement - Replaces the old placeOrderAsync */
async function placeOrderAsync(order, lang) {
  try {
    // Check if FirebaseCustomer object and its placeOrder method exist
    if (window.FirebaseCustomer && typeof window.FirebaseCustomer.placeOrder === 'function') {
      console.log('Placing order via Firebase...');
      const orderId = await window.FirebaseCustomer.placeOrder(order);
      console.log('Order placed successfully via Firebase with ID:', orderId);
      return orderId;
    } else {
      console.warn('FirebaseCustomer.placeOrder not available. Falling back to localStorage.');
    }
  } catch (error) {
    console.error('Firebase order placement failed:', error);
    console.log('Falling back to localStorage order placement.');
  }
  
  // Fallback to localStorage
  const orders = getOrders(); // Get existing orders
  const id = 'ORD-' + Date.now(); // Generate a unique ID
  const localOrder = {
    id,
    ...order, // Spread the order details
    createdAt: new Date().toISOString() // Ensure a creation timestamp
  };
  orders.push(localOrder);
  saveOrders(orders); // Save updated orders list
  console.log('Order placed successfully via localStorage with ID:', id);
  return id;
}

/* Helper functions from original file that might still be relevant */

// Get saved customer info (used in checkoutFlow)
function getSavedCustomerInfo(){
  const saved = localStorage.getItem('kc_customer_info');
  return saved ? JSON.parse(saved) : {name: '', phone: '', address: ''};
}

// Save customer info (used in checkoutFlow)
function saveCustomerInfo(name, phone, address){
  localStorage.setItem('kc_customer_info', JSON.stringify({name, phone, address}));
}

// Validate Algerian phone number (used in checkoutFlow)
function validatePhone(phone){
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return /^(\+213|213|0)[5-7][0-9]{8}$/.test(cleaned);
}

// Format phone number (used in checkoutFlow)
function formatPhone(phone){
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if(cleaned.startsWith('+213')) return cleaned;
  if(cleaned.startsWith('213')) return '+' + cleaned;
  if(cleaned.startsWith('0')) return '+213' + cleaned.substring(1);
  return '+213' + cleaned;
}

// Get orders from localStorage (used in admin panel and checkout fallback)
function getOrders(){ return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]'); }
// Save orders to localStorage (used in admin panel and checkout fallback)
function saveOrders(o){ localStorage.setItem(ORDERS_KEY, JSON.stringify(o)); }

// Dummy functions for dbService if it's not globally available
// In a real scenario, dbService would be imported or defined elsewhere.
// For this standalone file, we provide minimal stubs if they are missing.
if (typeof dbService === 'undefined') {
    console.warn('dbService is not defined. Using mock implementations.');
    window.dbService = {
        getAllCategories: async () => {
            console.log('Mock: Fetching categories...');
            // Return some default categories if Firebase is unavailable
            return Promise.resolve([
                { id: 'sweet', name: 'Sweet Crêpes', order: 0 },
                { id: 'savory', name: 'Savory Crêpes', order: 1 },
                { id: 'kids', name: 'Kids Crêpes', order: 2 },
                { id: 'drinks', name: 'Drinks', order: 3 }
            ]);
        },
        getAllMenuItems: async () => {
            console.log('Mock: Fetching menu items...');
            // Return some default menu items if Firebase is unavailable
            return Promise.resolve([
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
            ]);
        },
        listenToMenuChanges: () => { console.log('Mock: Listening to menu changes (no-op)'); },
        listenToCategoryChanges: () => { console.log('Mock: Listening to category changes (no-op)'); }
    };
}

// Dummy FirebaseCustomer for checkout fallback if window.FirebaseCustomer is not defined
if (typeof window.FirebaseCustomer === 'undefined') {
    window.FirebaseCustomer = {
        placeOrder: async (order) => {
            console.log('Mock: FirebaseCustomer.placeOrder called. Order:', order);
            return Promise.resolve('MOCK_ORD_ID_' + Date.now());
        }
    };
}