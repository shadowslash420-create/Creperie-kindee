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
    menuPreviewTitle: 'تشكيلة متنوعة',
    menuPreview1Title: 'كريب حلو',
    menuPreview1Desc: 'كيندر، نوتيلا، فواكه طازجة',
    menuPreview2Title: 'كريب مالح',
    menuPreview2Desc: 'لحم، جبن، دجاج مشوي',
    menuPreview3Title: 'مشروبات',
    menuPreview3Desc: 'شوكولاتة ساخنة، عصائر طبيعية',
    viewFullMenuBtn: 'شاهد القائمة الكاملة',
    ctaTitle: 'جاهز لتجربة لا تُنسى؟',
    ctaDesc: 'اطلب الآن واستمتع بطعم كيندر الأصيل',
    ctaBtn: 'اطلب الآن',
    navHome: 'الرئيسية',
    navAbout: 'من نحن',
    navMenu: 'القائمة',
    navContact: 'تواصل معنا',
    navAdmin: 'لوحة الإدارة',
    footerConnect: 'Connect',
    footerCopyright: '© Creperie Kinder — طعم ممتع لعائلتك',

    // Menu page
    subtitle: 'كريب & كافيه',
    heroTitle: 'القائمة',
    tabSweet: 'كريب حلو',
    tabSavory: 'كريب مالح',
    tabKids: 'كريب الأطفال',
    tabDrinks: 'مشروبات',
    titleSweet: 'كريب حلو',
    descSweet: 'كريب حلو محضر بعناية مع مكونات طازجة',
    titleSavory: 'كريب مالح',
    descSavory: 'كريب مالح مع حشوات شهية',
    titleKids: 'كريب الأطفال',
    descKids: 'كريب خاص للأطفال',
    titleDrinks: 'مشروبات',
    descDrinks: 'مشروبات ساخنة وباردة',
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
    faqA2: 'نعم، نوفر توصيل مجاني للطلبات التي تزيد عن 15 دولار',
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
    aboutChef: 'Chef Lina',
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
    navContact: 'Contact Us',
    navAdmin: 'Admin Panel',
    footerConnect: 'Connect',
    footerCopyright: '© Creperie Kinder — Delicious taste for your family',

    // Menu page
    subtitle: 'Crêpes & Café',
    heroTitle: 'Menu',
    tabSweet: 'Sweet Crêpes',
    tabSavory: 'Savory Crêpes',
    tabKids: 'Kids Crêpes',
    tabDrinks: 'Drinks',
    titleSweet: 'Sweet Crêpes',
    descSweet: 'Carefully prepared sweet crepes with fresh ingredients',
    titleSavory: 'Savory Crêpes',
    descSavory: 'Savory crepes with delicious fillings',
    titleKids: 'Kids Crêpes',
    descKids: 'Special crepes for kids',
    titleDrinks: 'Drinks',
    descDrinks: 'Hot and cold beverages',
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
    faqA2: 'Yes, we offer free delivery for orders over $15',
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
    aboutChef: 'Chef Lina',
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
  document.body.dir = 'ltr';
}

function toggleLanguage(){
  const currentLang = getCurrentLang();
  const newLang = currentLang === 'ar' ? 'en' : 'ar';
  setLanguage(newLang);
  applyTranslations();
  renderCart();
  updatePageIndicator();
}

function applyTranslations(){
  const lang = getCurrentLang();
  const t = translations[lang];

  const langBtn = document.getElementById('lang-btn');
  if(langBtn) langBtn.textContent = lang === 'ar' ? 'EN' : 'ع';

  const subtitle = document.getElementById('subtitle');
  if(subtitle) subtitle.textContent = t.subtitle;

  // Only translate hero-title on menu.html, not on index.html
  const heroTitle = document.getElementById('hero-title');
  if(heroTitle && !document.querySelector('.home-hero')) heroTitle.textContent = t.heroTitle;

  const tabSweet = document.getElementById('tab-sweet');
  if(tabSweet) tabSweet.textContent = t.tabSweet;

  const tabSavory = document.getElementById('tab-savory');
  if(tabSavory) tabSavory.textContent = t.tabSavory;

  const tabKids = document.getElementById('tab-kids');
  if(tabKids) tabKids.textContent = t.tabKids;

  const tabDrinks = document.getElementById('tab-drinks');
  if(tabDrinks) tabDrinks.textContent = t.tabDrinks;

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
  const navMenu = document.getElementById('nav-menu');
  const overlay = document.getElementById('menu-overlay');
  
  if(cartSide){
    const isOpen = cartSide.classList.contains('open');
    
    // Close nav menu if open
    if(navMenu && navMenu.classList.contains('open')){
      navMenu.classList.remove('open');
      if(overlay) overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
    
    // Toggle cart
    if(isOpen){
      cartSide.classList.remove('open');
      if(overlay) overlay.classList.remove('active');
      document.body.style.overflow = '';
    } else {
      cartSide.classList.add('open');
      if(overlay) overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }
}

function toggleMenu(){
  const navMenu = document.getElementById('nav-menu');
  const cartSide = document.getElementById('cart-side');
  const overlay = document.getElementById('menu-overlay');
  
  if(navMenu && overlay){
    const isOpen = navMenu.classList.contains('open');
    
    // Close cart if open
    if(cartSide && cartSide.classList.contains('open')){
      cartSide.classList.remove('open');
    }
    
    // Toggle menu
    if(isOpen){
      navMenu.classList.remove('open');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    } else {
      navMenu.classList.add('open');
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }
}

function closeAllSidebars(){
  const navMenu = document.getElementById('nav-menu');
  const cartSide = document.getElementById('cart-side');
  const overlay = document.getElementById('menu-overlay');
  
  if(navMenu) navMenu.classList.remove('open');
  if(cartSide) cartSide.classList.remove('open');
  if(overlay) overlay.classList.remove('active');
  document.body.style.overflow = '';
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
  const lang = getCurrentLang();
  const t = translations[lang];
  toast(t.addedToCart);
  toggleCart();
}

function renderCart(){
  const container = document.getElementById('cart-contents');
  if(!container) return;
  const cart = getCart();
  const lang = getCurrentLang();
  const t = translations[lang];
  container.innerHTML = '';

  if(cart.length===0){
    container.innerHTML = '<div style="text-align:center;padding:20px;color:#999">' + t.emptyCart + '</div>';
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
  const lang = getCurrentLang();
  const t = translations[lang];
  const cart = getCart();
  if(cart.length===0) return alert(t.emptyCartAlert);
  const name = prompt(t.namePrompt);
  if(!name) return alert(t.nameRequired);
  const phone = prompt(t.phonePrompt);
  if(!phone) return alert(t.phoneRequired);
  const address = prompt(t.addressPrompt);
  if(!address) return alert(t.addressRequired);
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
  toast(t.orderSuccess + id);
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
  const lang = getCurrentLang();
  const t = translations[lang];
  toast(t.contactSuccess.replace('{name}', name));
  e.target.reset();
}

/* ====== FAQ Functions ====== */
function toggleFaq(element){
  const faqItem = element.parentElement;
  const isActive = faqItem.classList.contains('active');

  document.querySelectorAll('.faq-item').forEach(item => {
    item.classList.remove('active');
    item.querySelector('.faq-icon').textContent = '+';
  });

  if(!isActive){
    faqItem.classList.add('active');
    element.querySelector('.faq-icon').textContent = '−';
  }
}

/* ====== Feedback Functions ====== */
function getFeedback(){ return JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '[]'); }
function saveFeedback(f){ localStorage.setItem(FEEDBACK_KEY, JSON.stringify(f)); }

function submitFeedback(e){
  e.preventDefault();
  const lang = getCurrentLang();
  const t = translations[lang];

  const name = document.getElementById('feedback-name').value;
  const itemId = document.getElementById('feedback-item').value;
  const rating = parseInt(document.getElementById('feedback-rating').value);
  const comment = document.getElementById('feedback-comment').value;

  if(!rating){
    return alert('الرجاء اختيار تقييم');
  }

  const menu = getMenu();
  const item = menu.find(m => m.id === itemId);

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

  e.target.reset();
  document.getElementById('feedback-rating').value = '';
  document.querySelectorAll('.star').forEach(star => star.textContent = '☆');

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

function populateFeedbackItems(){
  const select = document.getElementById('feedback-item');
  if(!select) return;

  const menu = getMenu();
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
    if(linkPage === currentPage || (currentPage === '' && linkPage === 'index.html')){
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
    '': { ar: 'الرئيسية', en: 'Home' },
    'menu.html': { ar: 'القائمة', en: 'Menu' },
    'about.html': { ar: 'من نحن', en: 'About Us' },
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
  
  // Apply translations to all navigation links
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

/* Scroll Button Functions */
function initScrollButton(){
  // Create scroll button
  const scrollBtn = document.createElement('button');
  scrollBtn.className = 'scroll-btn visible';
  scrollBtn.id = 'scroll-btn';
  scrollBtn.innerHTML = '↓';
  scrollBtn.setAttribute('aria-label', 'Scroll to bottom');
  document.body.appendChild(scrollBtn);

  // Handle scroll
  window.addEventListener('scroll', () => {
    const scrollBtn = document.getElementById('scroll-btn');
    if(!scrollBtn) return;

    const scrolled = window.scrollY;

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
}

/* On load hooks */
document.addEventListener('DOMContentLoaded', ()=>{
  try {
    // Set language
    const lang = getCurrentLang();
    setLanguage(lang);
    applyTranslations();

    // Update menu if needed
    const currentMenu = getMenu();
    if(currentMenu.length === 0 || !currentMenu[0].category || currentMenu[0].img.includes('.jpg')){
      localStorage.setItem(MENU_KEY, JSON.stringify(defaultMenu));
    }

    // Render all category menus
    renderMenuByCategory('sweet', 'menu-sweet');
    renderMenuByCategory('savory', 'menu-savory');
    renderMenuByCategory('kids', 'menu-kids');
    renderMenuByCategory('drinks', 'menu-drinks');
    renderCart();
    
    // Highlight active page
    highlightActivePage();

    // Initialize scroll button
    initScrollButton();
  } catch(error) {
    console.error('خطأ في تهيئة التطبيق:', error);
  }

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

  // Feedback page
  populateFeedbackItems();
  renderFeedbackList();
  initStarRating();
});