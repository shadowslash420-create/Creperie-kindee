/* script.js - Handles menu, cart, checkout, localStorage orders, admin auth */
const MENU_KEY = 'kc_menu';
const CART_KEY = 'kc_cart';
const ORDERS_KEY = 'kc_orders';
const LANG_KEY = 'kc_lang';
const FEEDBACK_KEY = 'kc_feedback';

// Import Firebase services
import dbService from './db-service.js';
import { getMenuFromFirebase, placeOrderToFirebase, listenToMenuUpdates } from './firebase-customer.js';

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
  // Keep direction as LTR for both languages
  document.body.dir = 'ltr';
}

function toggleLanguage(){
  const currentLang = getCurrentLang();
  const newLang = currentLang === 'ar' ? 'en' : 'ar';
  setLanguage(newLang);
  applyTranslations();
  updateCart();
  updatePageIndicator();
  
  // Only render menu components if on menu page
  const isMenuPage = window.location.pathname.includes('menu.html');
  if (isMenuPage && typeof renderMenu === 'function') {
    renderMenu();
  }
  if (isMenuPage && typeof renderCategoryTabs === 'function') {
    renderCategoryTabs();
  }
  
  // Re-render feedback list if on feedback page
  const isFeedbackPage = window.location.pathname.includes('feedback.html');
  if (isFeedbackPage && typeof renderFeedbackList === 'function') {
    renderFeedbackList();
  }
}

function applyTranslations(){
  const lang = getCurrentLang();
  const t = translations[lang];

  const langBtn = document.getElementById('lang-btn');
  if(langBtn) langBtn.textContent = lang === 'ar' ? 'EN' : 'AR';

  const subtitle = document.getElementById('subtitle');
  if(subtitle) subtitle.textContent = t.subtitle;

  const heroTitle = document.getElementById('hero-title');
  if(heroTitle && !document.querySelector('.home-hero')) heroTitle.textContent = t.heroTitle;

  const cartTitle = document.getElementById('cart-title');
  if(cartTitle) cartTitle.textContent = t.cartTitle;

  const totalLabel = document.getElementById('total-label');
  if(totalLabel) totalLabel.textContent = t.totalLabel;

  const checkoutBtn = document.getElementById('checkout-btn');
  if(checkoutBtn) checkoutBtn.textContent = t.checkoutBtn;

  const orderNowBtn = document.getElementById('order-now-btn');
  if(orderNowBtn) orderNowBtn.textContent = t.orderNowBtn;

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

  // New section translations
  const whatWeOfferTitle = document.getElementById('what-we-offer-title');
  if (whatWeOfferTitle) whatWeOfferTitle.textContent = t.whatWeOfferTitle;

  const whatWeOfferSubtitle = document.getElementById('what-we-offer-subtitle');
  if (whatWeOfferSubtitle) whatWeOfferSubtitle.textContent = t.whatWeOfferSubtitle;

  const offering1Title = document.getElementById('offering1-title');
  if (offering1Title) offering1Title.textContent = t.offering1Title;
  const offering1Desc = document.getElementById('offering1-desc');
  if (offering1Desc) offering1Desc.textContent = t.offering1Desc;

  const offering2Title = document.getElementById('offering2-title');
  if (offering2Title) offering2Title.textContent = t.offering2Title;
  const offering2Desc = document.getElementById('offering2-desc');
  if (offering2Desc) offering2Desc.textContent = t.offering2Desc;

  const offering3Title = document.getElementById('offering3-title');
  if (offering3Title) offering3Title.textContent = t.offering3Title;
  const offering3Desc = document.getElementById('offering3-desc');
  if (offering3Desc) offering3Desc.textContent = t.offering3Desc;

  const offering4Title = document.getElementById('offering4-title');
  if (offering4Title) offering4Title.textContent = t.offering4Title;
  const offering4Desc = document.getElementById('offering4-desc');
  if (offering4Desc) offering4Desc.textContent = t.offering4Desc;

  const offering5Title = document.getElementById('offering5-title');
  if (offering5Title) offering5Title.textContent = t.offering5Title;
  const offering5Desc = document.getElementById('offering5-desc');
  if (offering5Desc) offering5Desc.textContent = t.offering5Desc;

  const offering6Title = document.getElementById('offering6-title');
  if (offering6Title) offering6Title.textContent = t.offering6Title;
  const offering6Desc = document.getElementById('offering6-desc');
  if (offering6Desc) offering6Desc.textContent = t.offering6Desc;


  const menuPreviewTitle = document.getElementById('menu-preview-title');
  if(menuPreviewTitle) menuPreviewTitle.textContent = t.menuPreviewTitle;

  const viewFullMenuBtn = document.getElementById('view-full-menu-btn');
  if(viewFullMenuBtn) viewFullMenuBtn.textContent = t.viewFullMenuBtn;

  const ctaTitle = document.getElementById('cta-title');
  if(ctaTitle) ctaTitle.textContent = t.ctaTitle;

  const ctaDesc = document.getElementById('cta-desc');
  if(ctaDesc) ctaDesc.textContent = t.ctaDesc;

  const ctaBtn = document.getElementById('cta-btn');
  if(ctaBtn) ctaBtn.textContent = t.ctaBtn;

  const footerCopyright = document.getElementById('footer-copyright');
  if(footerCopyright) footerCopyright.innerHTML = t.footerCopyright + '<br>اتصل: +213 5X XXX XXXX';

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

  // Translate all navigation links
  const navHomeLinks = document.querySelectorAll('.nav-link-home');
  navHomeLinks.forEach(link => link.textContent = t.navHome);

  const navAboutLinks = document.querySelectorAll('.nav-link-about');
  navAboutLinks.forEach(link => link.textContent = t.navAbout);

  const navMenuLinks = document.querySelectorAll('.nav-link-menu');
  navMenuLinks.forEach(link => link.textContent = t.navMenu);

  const navOrdersLinks = document.querySelectorAll('.nav-link-orders');
  navOrdersLinks.forEach(link => link.textContent = t.navOrders);

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

  // Translate footer connect text
  const footerConnectElements = document.querySelectorAll('.footer-connect');
  footerConnectElements.forEach(el => el.textContent = t.footerConnect);
}

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

// State Management
const state = {
  currentLang: getCurrentLang(),
  currentTab: 'sweet',
  cart: [],
  menuItems: [],
  categories: []
};

// Initialize Menu from Firebase
async function initMenu() {
  try {
    console.log('🔄 Loading menu from Firebase Firestore...');

    await loadCategoriesFromFirebase();
    await loadMenuItemsFromFirebase();
    
    // Derive categories from menu items if Firestore categories are empty
    deriveCategoriesFromMenuItems();
    
    setupRealtimeListeners();
    loadCart();
    
    // Only render if menu elements exist on the page
    if (document.getElementById('tab-nav')) {
      // Set default tab to 'all' to show all items
      state.currentTab = 'all';
      renderCategoryTabs();
      renderMenu();
    }
    
    updateCart();

    console.log('✅ Menu loaded successfully from Firestore');
  } catch (error) {
    console.error('❌ Failed to load menu from Firebase:', error);
    // Initialize with default empty state
    state.menuItems = [];
    state.categories = [];
    
    // Only render if menu elements exist on the page
    if (document.getElementById('tab-nav')) {
      state.currentTab = 'all';
      renderCategoryTabs();
      renderMenu();
    }
  }
}

// Load categories from Firebase
async function loadCategoriesFromFirebase() {
  try {
    console.log('📂 Loading categories from Firestore...');

    if (!dbService || typeof dbService.getAllCategories !== 'function') {
      throw new Error('dbService not initialized');
    }

    const categories = await dbService.getAllCategories();
    console.log('✅ Categories loaded:', categories.length);
    console.log('📊 Category IDs:', categories.map(c => ({ id: c.id, name: c.name })));

    if (categories && categories.length > 0) {
      state.categories = categories.sort((a, b) => (a.order || 0) - (b.order || 0));
      // Set default tab to first category
      state.currentTab = state.categories[0].id;
      console.log('🎯 Initial default tab set to:', state.currentTab);
    } else {
      console.warn('⚠️ No categories found in Firestore - will derive from menu items');
      state.categories = [];
      state.currentTab = null;
    }
  } catch (error) {
    console.error('❌ Failed to load categories from Firebase:', error);
    state.categories = [];
    state.currentTab = null;
  }
}

// Derive categories from menu items if Firestore categories are empty
function deriveCategoriesFromMenuItems() {
  if (state.categories.length > 0 || state.menuItems.length === 0) {
    return; // Already have categories or no items to derive from
  }

  const uniqueCategories = new Set();
  state.menuItems.forEach(item => {
    if (item.category) {
      uniqueCategories.add(item.category);
    }
  });

  const categoryOrder = ['sweet', 'savory', 'kids', 'drinks'];
  const sortedCategories = Array.from(uniqueCategories).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  state.categories = sortedCategories.map((catId, index) => ({
    id: catId,
    name: catId,
    order: index
  }));

  if (state.categories.length > 0) {
    state.currentTab = state.categories[0].id;
    console.log('✅ Derived categories from menu items:', state.categories.map(c => c.id));
  }
}

// Load menu items from Firebase
async function loadMenuItemsFromFirebase() {
  try {
    console.log('📋 Loading menu items from Firestore...');

    if (!dbService) {
      throw new Error('dbService not initialized - check firebase-config.js');
    }

    const items = await getMenuFromFirebase();
    console.log('✅ Menu items loaded:', items ? items.length : 0);
    state.menuItems = items || [];
  } catch (error) {
    console.error('❌ Failed to load menu items from Firebase:', error);
    console.error('Error details:', error.message);
    state.menuItems = [];
  }
}

// Setup real-time listeners
function setupRealtimeListeners() {
  listenToMenuUpdates((items) => {
    console.log('📡 Menu updated in real-time:', items.length, 'items');
    state.menuItems = items;
    renderMenu();
  });

  dbService.listenToCategoryChanges((categories) => {
    console.log('📡 Categories updated in real-time:', categories.length, 'categories');
    state.categories = categories.sort((a, b) => (a.order || 0) - (b.order || 0));
    renderCategoryTabs();
    renderMenu();
  });
}

// Render category tabs
function renderCategoryTabs() {
  console.log('📑 Rendering category tabs...');
  const tabNav = document.getElementById('tab-nav');
  if (!tabNav) {
    console.error('❌ tab-nav element not found');
    return;
  }

  const sortedCategories = [...state.categories].sort((a, b) => (a.order || 0) - (b.order || 0));
  console.log('📋 Sorted categories:', sortedCategories.map(c => c.id));

  // Add "All" tab first
  const allLabel = state.currentLang === 'ar' ? 'الكل' : 'All';
  let html = `
    <button class="tab-btn ${state.currentTab === 'all' ? 'active' : ''}"
      onclick="switchTab('all')" id="tab-all">
      ${allLabel}
    </button>
  `;

  html += sortedCategories.map(cat => {
    // Use the actual category name from Firebase
    const categoryName = cat.name || cat.id;

    return `
      <button class="tab-btn ${state.currentTab === cat.id ? 'active' : ''}"
        onclick="switchTab('${cat.id}')" id="tab-${cat.id}">
        ${categoryName}
      </button>
    `;
  }).join('');

  tabNav.innerHTML = html;
  
  // Also update footer links if on menu page
  updateFooterCategoryLinks();
}

// Update footer with navigation links only (no category links)
function updateFooterCategoryLinks() {
  const footerLinks = document.getElementById('footer-links');
  if (!footerLinks) return;
  
  const t = translations[state.currentLang];
  const navigationLinks = `
    <a href="index.html" class="nav-link-home">${t.navHome}</a>
    <a href="about.html" class="nav-link-about">${t.navAbout}</a>
    <a href="menu.html" class="nav-link-menu">${t.navMenu}</a>
    <a href="my-orders.html" class="nav-link-orders">${t.navOrders}</a>
    <a href="faq.html" class="nav-link-faq">${t.navFaq}</a>
    <a href="feedback.html" class="nav-link-feedback">${t.navFeedback}</a>
    <a href="contact.html" class="nav-link-contact">${t.navContact}</a>
  `;
  
  footerLinks.innerHTML = navigationLinks;
}

// Render menu
function renderMenu() {
  console.log('🎨 Rendering menu for tab:', state.currentTab);
  const container = document.querySelector('.container');
  if (!container) {
    console.error('❌ Container not found for menu rendering');
    return;
  }

  document.querySelectorAll('.section').forEach(section => {
    section.classList.add('hidden');
  });

  const itemsByCategory = {};
  state.menuItems.forEach(item => {
    if (!itemsByCategory[item.category]) {
      itemsByCategory[item.category] = [];
    }
    itemsByCategory[item.category].push(item);
  });

  console.log('📦 Items grouped by category:', Object.keys(itemsByCategory).map(cat => `${cat}: ${itemsByCategory[cat].length} items`));

  // Find the footer element to insert sections before it
  const footer = container.querySelector('.footer');

  // Handle "All" tab - show all items
  if (state.currentTab === 'all') {
    const sectionId = 'section-all';
    let section = document.getElementById(sectionId);

    if (!section) {
      section = document.createElement('section');
      section.id = sectionId;
      section.className = 'section';
      if (footer) {
        container.insertBefore(section, footer);
      } else {
        container.appendChild(section);
      }
    }

    const allLabel = state.currentLang === 'ar' ? 'جميع المنتجات' : 'All Products';
    const allDesc = state.currentLang === 'ar' ? 'تصفح جميع منتجاتنا المميزة' : 'Browse all our featured products';

    const menuItemsHTML = state.menuItems.length === 0 ? `
      <div class="empty-category-message">
        <div class="empty-icon">🍽️</div>
        <p>${state.currentLang === 'ar' ? 'لا توجد منتجات حالياً' : 'No products available'}</p>
      </div>
    ` : state.menuItems.map(item => `
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

    section.innerHTML = `
      <h2 class="section-title" style="display:block;width:100%;text-align:left;">${allLabel}</h2>
      <div class="section-desc" style="display:block;width:100%;">${allDesc}</div>
      <div class="menu-grid">
        ${menuItemsHTML}
      </div>
    `;

    section.classList.remove('hidden');
    console.log('✅ Showing all items:', state.menuItems.length);
  } else {
    // Hide "all" section if it exists
    const allSection = document.getElementById('section-all');
    if (allSection) {
      allSection.classList.add('hidden');
    }

    // Show specific category
    state.categories.forEach(category => {
      const sectionId = `section-${category.id}`;
      let section = document.getElementById(sectionId);

      if (!section) {
        section = document.createElement('section');
        section.id = sectionId;
        section.className = 'section hidden';
        if (footer) {
          container.insertBefore(section, footer);
        } else {
          container.appendChild(section);
        }
      }

      const items = itemsByCategory[category.id] || [];
      console.log(`🔍 Category ${category.id}: ${items.length} items found`);
      
      // Use the actual category name from Firebase instead of translation
      const categoryName = category.name || category.id;
      const categoryDesc = state.currentLang === 'ar'
        ? (menuTranslations.ar.categoryDesc[category.id] || `منتجات ${categoryName}`)
        : (menuTranslations.en.categoryDesc[category.id] || `${categoryName} products`);
      const emptyMsg = state.currentLang === 'ar' ? menuTranslations.ar.emptyCategoryMsg : menuTranslations.en.emptyCategoryMsg;

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

      section.innerHTML = `
        <h2 class="section-title" id="title-${category.id}" style="display:block;width:100%;text-align:left;">${categoryName}</h2>
        <div class="section-desc" id="desc-${category.id}" style="display:block;width:100%;">${categoryDesc}</div>
        <div class="menu-grid" id="menu-${category.id}">
          ${menuItemsHTML}
        </div>
      `;

      if (category.id === state.currentTab) {
        section.classList.remove('hidden');
        console.log(`✅ Showing section for category: ${category.id} (${categoryName}) with ${items.length} items`);
      } else {
        section.classList.add('hidden');
      }
    });
  }

  console.log('🎨 Render complete. Current tab:', state.currentTab);
}

// Tab switching
function switchTab(categoryId) {
  state.currentTab = categoryId;

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeTabBtn = document.getElementById(`tab-${categoryId}`);
  if (activeTabBtn) activeTabBtn.classList.add('active');

  // Re-render menu to show correct content
  renderMenu();
}

// Cart functions
function addToCart(itemId) {
  const item = state.menuItems.find(i => i.id === itemId);
  if (!item) return;

  const existing = state.cart.find(c => c.id === itemId);
  if (existing) {
    existing.quantity++;
  } else {
    state.cart.push({
      id: item.id,
      name: item.name,
      price: item.price,
      img: item.img,
      quantity: 1
    });
  }

  saveCart();
  updateCart();

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
  const container = document.getElementById('cart-contents');
  const totalEl = document.getElementById('cart-total');

  if (!container || !totalEl) {
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

  const total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

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
      state.cart.forEach(item => {
        if (typeof item.quantity !== 'number' || item.quantity < 0) {
          item.quantity = 0;
        }
      });
      state.cart = state.cart.filter(item => item.quantity > 0);
    }
  } catch (error) {
    console.error('Failed to load cart from localStorage:', error);
    state.cart = [];
  }
}

// UI Functions
function toggleCart() {
  const cartSide = document.getElementById('cart-side');
  if (cartSide) {
    cartSide.classList.toggle('active');
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

function closeAllSidebars() {
  const navMenu = document.getElementById('nav-menu');
  const cartSide = document.getElementById('cart-side');
  const overlay = document.getElementById('menu-overlay');
  
  if (navMenu) navMenu.classList.remove('active');
  if (cartSide) cartSide.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
  document.body.style.overflow = '';
}

function checkoutFlow(){
  const lang = state.currentLang;
  const t = translations[lang];
  const cart = state.cart;

  if(cart.length === 0) return alert(t.emptyCartAlert || 'Cart is empty!');

  const subtotal = cart.reduce((s,i)=>s + i.price * i.quantity, 0);

  const MIN_ORDER_AMOUNT = 5.0;
  if(subtotal < MIN_ORDER_AMOUNT){
    const minOrderMsg = lang === 'ar'
      ? `الحد الأدنى للطلب هو ${MIN_ORDER_AMOUNT} دج`
      : `Minimum order amount is ${MIN_ORDER_AMOUNT} DZD`;
    return alert(minOrderMsg);
  }

  const FREE_DELIVERY_THRESHOLD = 15.0;
  const DELIVERY_FEE = 2.0;
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = subtotal + deliveryFee;

  const savedInfo = getSavedCustomerInfo();

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

  document.getElementById('checkout-form').onsubmit = async (e) => {
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

    const formattedPhone = formatPhone(phone);

    saveCustomerInfo(name, formattedPhone, address);

    const order = {
      customerName: name,
      customerPhone: formattedPhone,
      customerAddress: address,
      items: state.cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        img: item.img,
        quantity: item.quantity
      })),
      subtotal,
      deliveryFee,
      total,
      specialInstructions: notes,
      status:'pending',
      createdAt: new Date().toISOString()
    };

    try {
      const orderId = await placeOrderToFirebase(order);
      state.cart = [];
      saveCart();
      closeCheckoutModal();
      toggleCart();
      showOrderConfirmation(orderId, order, lang);
    } catch (error) {
      alert(lang === 'ar' ? 'فشل في إرسال الطلب. حاول مرة أخرى.' : 'Failed to place order. Please try again.');
      console.error('Order placement failed:', error);
    }
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
  showToast(t.orderSuccess + orderId);
}

function showToast(msg){
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

// Admin functions
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
    el.innerHTML = `<div style="display:flex;justify-content:space-between"><div><strong>${o.id || 'N/A'}</strong> <div class="text-sm">${o.customerName || o.name} • ${o.customerPhone || o.phone}</div></div><div><small>${new Date(o.createdAt || o.timestamp).toLocaleString()}</small></div></div>`;
    const items = document.createElement('div');
    items.className='text-sm';
    items.textContent = Array.isArray(o.items) ? o.items.map(i=> `${i.name} x${i.quantity || i.qty}`).join(', ') : 'No items';

    const status = document.createElement('div');
    status.style.marginTop='6px';
    const sel = document.createElement('select');
    const statusMap = {'pending': 'Pending', 'in-progress': 'In Progress', 'delivered': 'Delivered'};
    Object.keys(statusMap).forEach(key=>{
      const opt = document.createElement('option');
      opt.value=key;
      opt.textContent=statusMap[key];
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
  const orders = getOrders();
  const o = orders.find(x=> x.id===id);
  if(!o) return;
  const statusMap = {'Pending': 'pending', 'In Progress': 'in-progress', 'Delivered': 'delivered'};
  o.status = statusMap[status] || status.toLowerCase();
  saveOrders(orders);
  renderAdminOrders();
  showToast('تم تحديث حالة الطلب ' + id);
}

// Contact form
function submitContact(e){
  e.preventDefault();
  const name = document.getElementById('contact-name').value;
  const email = document.getElementById('contact-email').value;
  const msg = document.getElementById('contact-msg').value;
  const lang = getCurrentLang();
  const t = translations[lang];
  showToast(t.contactSuccess.replace('{name}', name));
  e.target.reset();
}

// FAQ Functions
function toggleFaq(element){
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

// Feedback Functions
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
    return alert('الرجاء اختيار تقييم');
  }
  if (!itemId) {
      alert(lang === 'ar' ? 'الرجاء اختيار منتج' : 'Please select a product');
      return;
  }

  const item = state.menuItems.find(m => m.id === itemId);

  const feedback = getFeedback();
  const newFeedback = {
    id: 'FB-' + Date.now(),
    name,
    itemId,
    itemName: item ? item.name : '',
    rating,
    comment,
    createdAt: new Date().toISOString()
  };

  feedback.push(newFeedback);
  saveFeedback(feedback);

  if(e.target) e.target.reset();
  if(ratingInput) ratingInput.value = '';
  document.querySelectorAll('.star').forEach(star => star.textContent = '☆');

  showToast(t.feedbackSuccess);
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

// Highlight active page
function highlightActivePage(){
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

  updatePageIndicator();
}

function updatePageIndicator(){
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const lang = getCurrentLang();
  const t = translations[lang];

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

// Scroll Button
function initScrollButton(){
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

// Secret Admin Access
function initSecretAdminAccess(){
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'K') {
      e.preventDefault();
      window.location.href = 'admin.html';
    }
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      e.preventDefault();
      window.location.href = 'delivery.html';
    }
  });

  const copyrightElement = document.getElementById('footer-copyright');
  if(copyrightElement) {
    let adminTapCount = 0;
    let adminTapTimer = null;

    copyrightElement.addEventListener('click', () => {
      adminTapCount++;

      if(adminTapTimer) clearTimeout(adminTapTimer);

      if(adminTapCount >= 7) {
        window.location.href = 'admin.html';
        adminTapCount = 0;
        return;
      }

      adminTapTimer = setTimeout(() => {
        adminTapCount = 0;
      }, 2000);
    });
  }

  const connectText = document.querySelector('.footer-connect');
  if(connectText) {
    let deliveryTapCount = 0;
    let deliveryTapTimer = null;

    connectText.addEventListener('click', (e) => {
      e.preventDefault();
      deliveryTapCount++;

      if(deliveryTapTimer) clearTimeout(deliveryTapTimer);

      if(deliveryTapCount >= 7) {
        window.location.href = 'delivery.html';
        deliveryTapCount = 0;
        return;
      }

      deliveryTapTimer = setTimeout(() => {
        deliveryTapCount = 0;
      }, 2000);
    });
  }
}

// Page loading
function initPageLoad(){
  document.body.classList.add('page-loading');
  setTimeout(() => {
    document.body.classList.remove('page-loading');
    document.body.classList.add('page-loaded');
  }, 100);
}

// Helper functions
function getSavedCustomerInfo(){
  const saved = localStorage.getItem('kc_customer_info');
  return saved ? JSON.parse(saved) : {name: '', phone: '', address: ''};
}

function saveCustomerInfo(name, phone, address){
  localStorage.setItem('kc_customer_info', JSON.stringify({name, phone, address}));
}

function validatePhone(phone){
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return /^(\+213|213|0)[5-7][0-9]{8}$/.test(cleaned);
}

function formatPhone(phone){
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if(cleaned.startsWith('+213')) return cleaned;
  if(cleaned.startsWith('213')) return '+' + cleaned;
  if(cleaned.startsWith('0')) return '+213' + cleaned.substring(1);
  return '+213' + cleaned;
}

function getOrders(){ return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]'); }
function saveOrders(o){ localStorage.setItem(ORDERS_KEY, JSON.stringify(o)); }

// Render homepage menu preview
async function renderHomeMenuPreview() {
  const container = document.getElementById('home-menu-items-grid');
  if (!container) return;

  try {
    // Load menu items if not already loaded
    if (state.menuItems.length === 0) {
      await loadMenuItemsFromFirebase();
    }

    // Get up to 4 random items to display
    const itemsToShow = state.menuItems
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

    const addToCartText = state.currentLang === 'ar' 
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
            <button class="menu-card-btn" onclick="addToCart('${item.id}')">
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

// Initialize on load
document.addEventListener('DOMContentLoaded', async ()=>{
  initPageLoad();
  try {
    const initialLang = getCurrentLang();
    setLanguage(initialLang);
    applyTranslations();

    // Only initialize menu if we're on the menu page
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
    initSecretAdminAccess();
  } catch(error) {
    console.error('Error during DOMContentLoaded initialization:', error);
  }

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

  checkAdminPage();

  populateFeedbackItems();
  renderFeedbackList();
  initStarRating();
});

// Make functions globally accessible
window.switchTab = switchTab;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.toggleCart = toggleCart;
window.toggleMenu = toggleMenu;
window.checkoutFlow = checkoutFlow;
window.closeCheckoutModal = closeCheckoutModal;
window.toggleLanguage = toggleLanguage;
window.submitContact = submitContact;
window.toggleFaq = toggleFaq;
window.submitFeedback = submitFeedback;
window.adminLogin = adminLogin;
window.adminLogout = adminLogout;
window.isAdmin = isAdmin; // Export isAdmin for potential use elsewhere
window.renderAdminOrders = renderAdminOrders; // Export renderAdminOrders
window.checkAdminPage = checkAdminPage; // Export checkAdminPage
window.updateOrderStatus = updateOrderStatus; // Export updateOrderStatus
window.initMenu = initMenu; // Export initMenu
window.populateFeedbackItems = populateFeedbackItems; // Export populateFeedbackItems
window.renderFeedbackList = renderFeedbackList; // Export renderFeedbackList
window.initStarRating = initStarRating; // Export initStarRating
window.highlightActivePage = highlightActivePage; // Export highlightActivePage
window.updatePageIndicator = updatePageIndicator; // Export updatePageIndicator
window.initScrollButton = initScrollButton; // Export initScrollButton
window.initSecretAdminAccess = initSecretAdminAccess; // Export initSecretAdminAccess
window.initPageLoad = initPageLoad; // Export initPageLoad
window.getSavedCustomerInfo = getSavedCustomerInfo; // Export helper
window.saveCustomerInfo = saveCustomerInfo; // Export helper
window.validatePhone = validatePhone; // Export helper
window.formatPhone = formatPhone; // Export helper
window.getOrders = getOrders; // Export helper
window.saveOrders = saveOrders; // Export helper
window.showToast = showToast; // Export showToast
window.showOrderConfirmation = showOrderConfirmation; // Export showOrderConfirmation
window.renderHomeMenuPreview = renderHomeMenuPreview; // Export renderHomeMenuPreview
window.closeAllSidebars = closeAllSidebars; // Export closeAllSidebars
window.updateFooterCategoryLinks = updateFooterCategoryLinks; // Export updateFooterCategoryLinks