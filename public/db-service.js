import { getFirestoreInstance, getStorageInstance, getAuthInstance } from './firebase-config.js';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  Timestamp,
  setDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

class DatabaseService {
  constructor() {
    this.db = null;
    this.storage = null;
    this.auth = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    this.db = await getFirestoreInstance();
    this.storage = await getStorageInstance();
    this.auth = await getAuthInstance();
    this.initialized = true;
  }

  async getAllMenuItems() {
    await this.init();
    const menuRef = collection(this.db, 'menu');
    const snapshot = await getDocs(menuRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async getMenuItemsByCategory(category) {
    await this.init();
    const menuRef = collection(this.db, 'menu');
    const q = query(menuRef, where('category', '==', category));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async getMenuItem(id) {
    await this.init();
    const docRef = doc(this.db, 'menu', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  }

  async addMenuItem(item) {
    await this.init();
    const menuRef = collection(this.db, 'menu');
    const docRef = await addDoc(menuRef, {
      ...item,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  }

  async updateMenuItem(id, updates) {
    await this.init();
    const docRef = doc(this.db, 'menu', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  }

  async deleteMenuItem(id) {
    await this.init();
    const item = await this.getMenuItem(id);
    if (item && item.img && item.img.includes('firebase')) {
      await this.deleteImage(item.img);
    }
    const docRef = doc(this.db, 'menu', id);
    await deleteDoc(docRef);
  }

  // ==================== CATEGORY MANAGEMENT ====================
  
  async getAllCategories() {
    await this.init();
    const categoriesRef = collection(this.db, 'categories');
    const q = query(categoriesRef, orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return categories;
  }

  async getCategory(id) {
    await this.init();
    const docRef = doc(this.db, 'categories', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  }

  async addCategory(categoryData) {
    await this.init();
    const categoriesRef = collection(this.db, 'categories');
    
    // Get current count for ordering
    const snapshot = await getDocs(categoriesRef);
    const order = snapshot.size;
    
    // Use the category ID as the document ID for easy lookup
    const docRef = doc(categoriesRef, categoryData.id);
    await setDoc(docRef, {
      name: categoryData.name,
      order: categoryData.order !== undefined ? categoryData.order : order,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    return categoryData.id;
  }

  async updateCategory(id, updates) {
    await this.init();
    const docRef = doc(this.db, 'categories', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  }

  async deleteCategory(id) {
    await this.init();
    const docRef = doc(this.db, 'categories', id);
    await deleteDoc(docRef);
  }

  async initializeDefaultCategories() {
    await this.init();
    const defaultCategories = [
      { id: 'sweet', name: 'Sweet Crêpes', order: 0 },
      { id: 'savory', name: 'Savory Crêpes', order: 1 },
      { id: 'kids', name: 'Kids Crêpes', order: 2 },
      { id: 'drinks', name: 'Drinks', order: 3 }
    ];
    
    for (const category of defaultCategories) {
      await this.addCategory(category);
    }
    
    return defaultCategories;
  }

  async listenToCategoryChanges(callback) {
    await this.init();
    const categoriesRef = collection(this.db, 'categories');
    const q = query(categoriesRef, orderBy('order', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(categories);
    }, (error) => {
      console.error('Error listening to category changes:', error);
    });
  }

  // ==================== END CATEGORY MANAGEMENT ====================

  async uploadImage(file, folder = 'menu') {
    console.warn('⚠️ uploadImage method is deprecated. Use /api/upload-image endpoint directly.');
    
    // Convert file to base64
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Send to server for upload to ImgBB
    const formData = new FormData();
    formData.append('image', base64);
    formData.append('folder', folder);
    formData.append('filename', file.name.replace(/\.[^/.]+$/, ''));

    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    if (result.success) {
      return result.url;
    } else {
      throw new Error(result.error || 'Upload failed');
    }
  }

  async deleteImage(imageUrl) {
    await this.init();
    // Note: ImgBB doesn't support API-based deletion for free accounts
    // Images are stored permanently on ImgBB
    // If you need to delete images, you'll need to do it manually from ImgBB dashboard
    console.log('Image deletion not supported for ImgBB free accounts:', imageUrl);
  }

  async getAllOrders() {
    await this.init();
    const ordersRef = collection(this.db, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async getOrder(id) {
    await this.init();
    const docRef = doc(this.db, 'orders', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  }

  async getOrdersByPhone(phoneNumber) {
    await this.init();
    const normalizedPhone = this.normalizePhone(phoneNumber);
    const ordersRef = collection(this.db, 'orders');
    const q = query(ordersRef, where('phone', '==', normalizedPhone));
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    orders.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
      return dateB - dateA;
    });
    
    return orders;
  }

  normalizePhone(phoneStr) {
    if (!phoneStr) return '';
    
    let cleaned = phoneStr.replace(/\D/g, '');
    
    if (cleaned.startsWith('00213')) {
      cleaned = cleaned.substring(5);
    } else if (cleaned.startsWith('213')) {
      cleaned = cleaned.substring(3);
    }
    
    if (!cleaned.startsWith('0')) {
      cleaned = '0' + cleaned;
    }
    
    return cleaned;
  }

  async createOrder(orderData) {
    await this.init();
    const ordersRef = collection(this.db, 'orders');
    const normalizedEmail = orderData.email ? orderData.email.toLowerCase().trim() : null;
    const order = {
      ...orderData,
      phone: this.normalizePhone(orderData.phone),
      email: normalizedEmail,
      status: orderData.status || 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    console.log('📝 Creating order with email:', normalizedEmail);
    const docRef = await addDoc(ordersRef, order);
    console.log('✅ Order created with ID:', docRef.id, 'for email:', normalizedEmail);
    return docRef.id;
  }

  async getOrdersByEmail(email) {
    await this.init();
    const normalizedEmail = email ? email.toLowerCase().trim() : null;
    console.log('🔍 Searching orders for email:', normalizedEmail);
    const ordersRef = collection(this.db, 'orders');
    const q = query(ordersRef, where('email', '==', normalizedEmail));
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('✅ Found', orders.length, 'orders for email:', normalizedEmail);
    // Sort by createdAt in JavaScript to avoid needing Firestore composite index
    return orders.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA; // Descending order (newest first)
    });
  }

  listenToOrdersByEmail(email, callback) {
    return this.init().then(() => {
      const normalizedEmail = email ? email.toLowerCase().trim() : null;
      const ordersRef = collection(this.db, 'orders');
      const q = query(ordersRef, where('email', '==', normalizedEmail));
      return onSnapshot(q, (snapshot) => {
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort by createdAt in JavaScript to avoid needing Firestore composite index
        const sortedOrders = orders.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return timeB - timeA; // Descending order (newest first)
        });
        callback(sortedOrders);
      });
    });
  }

  async updateOrder(id, updates) {
    await this.init();
    const docRef = doc(this.db, 'orders', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  }

  async updateOrderStatus(id, status) {
    await this.updateOrder(id, { status });
  }

  async deleteOrder(id) {
    await this.init();
    const docRef = doc(this.db, 'orders', id);
    await deleteDoc(docRef);
  }

  listenToMenuChanges(callback) {
    this.init().then(() => {
      const menuRef = collection(this.db, 'menu');
      return onSnapshot(menuRef, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(items);
      });
    });
  }

  listenToOrderChanges(callback) {
    this.init().then(() => {
      const ordersRef = collection(this.db, 'orders');
      const q = query(ordersRef, orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snapshot) => {
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(orders);
      });
    });
  }

  listenToOrdersByPhone(phoneNumber, callback) {
    return this.init().then(() => {
      const normalizedPhone = this.normalizePhone(phoneNumber);
      const ordersRef = collection(this.db, 'orders');
      const q = query(ordersRef, where('phone', '==', normalizedPhone), orderBy('createdAt', 'desc'));
      
      return onSnapshot(q, (snapshot) => {
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(orders);
      });
    });
  }

  async getCustomers() {
    await this.init();
    const orders = await this.getAllOrders();
    const customerMap = new Map();
    
    orders.forEach(order => {
      if (!customerMap.has(order.customerPhone)) {
        customerMap.set(order.customerPhone, {
          name: order.customerName,
          phone: order.customerPhone,
          address: order.customerAddress,
          totalOrders: 0,
          totalSpent: 0,
          lastOrder: order.createdAt
        });
      }
      const customer = customerMap.get(order.customerPhone);
      customer.totalOrders++;
      customer.totalSpent += order.total || 0;
      if (order.createdAt > customer.lastOrder) {
        customer.lastOrder = order.createdAt;
      }
    });
    
    return Array.from(customerMap.values());
  }

  async migrateMenuData(menuArray) {
    await this.init();
    const batch = [];
    for (const item of menuArray) {
      const menuRef = collection(this.db, 'menu');
      await setDoc(doc(menuRef, item.id), {
        name: item.name,
        desc: item.desc,
        price: item.price,
        img: item.img,
        category: item.category,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      batch.push(item.id);
    }
    return batch;
  }

  // ==================== INGREDIENTS MANAGEMENT ====================
  
  async getAllIngredients() {
    await this.init();
    const ref = collection(this.db, 'ingredients');
    const snapshot = await getDocs(query(ref, orderBy('name')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async addIngredient(ingredient) {
    await this.init();
    const ref = collection(this.db, 'ingredients');
    const docRef = await addDoc(ref, {
      ...ingredient,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  }

  async updateIngredient(id, data) {
    await this.init();
    const docRef = doc(this.db, 'ingredients', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
  }

  async deleteIngredient(id) {
    await this.init();
    const docRef = doc(this.db, 'ingredients', id);
    await deleteDoc(docRef);
  }

  listenToIngredientChanges(callback) {
    if (!this.db) return () => {};
    const ref = collection(this.db, 'ingredients');
    return onSnapshot(query(ref, orderBy('name')), (snapshot) => {
      const ingredients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(ingredients);
    });
  }

  // ==================== REVIEWS MANAGEMENT ====================
  
  async getAllReviews() {
    await this.init();
    const ref = collection(this.db, 'reviews');
    const snapshot = await getDocs(query(ref, orderBy('createdAt', 'desc')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async addReview(review) {
    await this.init();
    const ref = collection(this.db, 'reviews');
    const docRef = await addDoc(ref, {
      ...review,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  }

  async updateReview(id, data) {
    await this.init();
    const docRef = doc(this.db, 'reviews', id);
    await updateDoc(docRef, data);
  }

  async deleteReview(id) {
    await this.init();
    const docRef = doc(this.db, 'reviews', id);
    await deleteDoc(docRef);
  }

  listenToReviewChanges(callback) {
    if (!this.db) return () => {};
    const ref = collection(this.db, 'reviews');
    return onSnapshot(query(ref, orderBy('createdAt', 'desc')), (snapshot) => {
      const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(reviews);
    });
  }

  // ==================== CONTACT MESSAGES MANAGEMENT ====================
  
  async getAllContactMessages() {
    await this.init();
    const ref = collection(this.db, 'contact_messages');
    const snapshot = await getDocs(query(ref, orderBy('createdAt', 'desc')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async addContactMessage(message) {
    await this.init();
    const ref = collection(this.db, 'contact_messages');
    const docRef = await addDoc(ref, {
      ...message,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  }

  async deleteContactMessage(id) {
    await this.init();
    const docRef = doc(this.db, 'contact_messages', id);
    await deleteDoc(docRef);
  }

  async updateContactMessage(id, data) {
    await this.init();
    const docRef = doc(this.db, 'contact_messages', id);
    await updateDoc(docRef, data);
  }

  // ==================== STAFF MANAGEMENT ====================
  
  async getAllStaff() {
    await this.init();
    const ref = collection(this.db, 'staff');
    const snapshot = await getDocs(ref);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async addStaff(staff) {
    await this.init();
    console.log('📝 addStaff called with:', staff);
    const ref = collection(this.db, 'staff');
    try {
      const docRef = await addDoc(ref, {
        ...staff,
        createdAt: Timestamp.now()
      });
      console.log('✅ Staff member added with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error adding staff:', error.code, error.message);
      throw error;
    }
  }

  async updateStaff(id, data) {
    await this.init();
    const docRef = doc(this.db, 'staff', id);
    await updateDoc(docRef, data);
  }

  async deleteStaff(id) {
    await this.init();
    const docRef = doc(this.db, 'staff', id);
    await deleteDoc(docRef);
  }

  listenToStaffChanges(callback) {
    if (!this.db) return () => {};
    const ref = collection(this.db, 'staff');
    return onSnapshot(ref, (snapshot) => {
      const staff = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(staff);
    });
  }

  // ==================== SETTINGS MANAGEMENT ====================
  
  async getSettings() {
    await this.init();
    const docRef = doc(this.db, 'settings', 'restaurant');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return {
      name: 'Creperie Kinder',
      businessPhone: '+213 5X XXX XXXX',
      businessEmail: 'contact@creperie.com',
      address: '',
      openingTime: '11:00',
      closingTime: '01:00',
      deliveryFee: 0,
      freeDeliveryMin: 800,
      paymentMethods: {
        cash: true,
        card: false,
        mobile: false
      }
    };
  }

  async updateSettings(settings) {
    await this.init();
    console.log('💾 updateSettings called with:', settings);
    const docRef = doc(this.db, 'settings', 'restaurant');
    try {
      await setDoc(docRef, {
        ...settings,
        updatedAt: Timestamp.now()
      }, { merge: true });
      console.log('✅ Settings updated successfully');
    } catch (error) {
      console.error('❌ Error updating settings:', error.code, error.message);
      throw error;
    }
  }

  listenToSettingsChanges(callback) {
    if (!this.db) return () => {};
    const docRef = doc(this.db, 'settings', 'restaurant');
    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data());
      }
    });
  }
}

const dbService = new DatabaseService();
export default dbService;