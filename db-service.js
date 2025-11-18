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

  async uploadImage(file, folder = 'menu') {
    await this.init();
    const timestamp = Date.now();
    const filename = `${folder}/${timestamp}_${file.name}`;
    const storageRef = ref(this.storage, filename);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  }

  async deleteImage(imageUrl) {
    await this.init();
    try {
      const imageRef = ref(this.storage, imageUrl);
      await deleteObject(imageRef);
    } catch (error) {
      console.warn('Failed to delete image:', error);
    }
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