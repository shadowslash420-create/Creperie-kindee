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
    
    // If no categories exist, initialize with defaults
    if (categories.length === 0) {
      await this.initializeDefaultCategories();
      return await this.getAllCategories();
    }
    
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

  // Image upload is now handled directly in admin-dashboard.js via /api/upload-image endpoint
  // This method is kept for backward compatibility but delegates to the server API
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

  async createOrder(orderData) {
    await this.init();
    const ordersRef = collection(this.db, 'orders');
    const order = {
      ...orderData,
      status: orderData.status || 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    const docRef = await addDoc(ordersRef, order);
    return docRef.id;
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
}

const dbService = new DatabaseService();
export default dbService;