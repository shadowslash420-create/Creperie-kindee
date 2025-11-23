import dbService from './db-service.js';

let menuCache = null;
let menuListener = null;

let categoriesCache = null;

export async function getCategoriesFromFirebase() {
  try {
    console.log('📂 Loading categories from Firestore...');
    
    if (!dbService || typeof dbService.getAllCategories !== 'function') {
      console.error('❌ dbService is not properly initialized');
      return [];
    }
    
    if (categoriesCache) {
      console.log('📦 Returning cached categories:', categoriesCache.length);
      return categoriesCache;
    }
    
    const categories = await dbService.getAllCategories();
    console.log('✅ Categories loaded:', categories.length);
    console.log('📊 Category IDs:', categories.map(c => c.id));
    categoriesCache = categories;
    
    return categories;
  } catch (error) {
    console.error('❌ Failed to load categories from Firebase:', error);
    return [];
  }
}

export async function getMenuFromFirebase() {
  try {
    console.log('🔍 firebase-customer.js: Fetching menu from dbService...');
    
    if (!dbService || typeof dbService.getAllMenuItems !== 'function') {
      console.error('❌ dbService is not properly initialized');
      return [];
    }
    
    if (menuCache) {
      console.log('📦 Returning cached menu:', menuCache.length, 'items');
      return menuCache;
    }
    
    const menu = await dbService.getAllMenuItems();
    console.log('✅ Menu fetched from Firestore:', menu.length, 'items');
    console.log('📊 Item details:', menu.map(item => ({ name: item.name, category: item.category })));
    menuCache = menu;
    
    if (!menuListener) {
      console.log('👂 Setting up real-time menu listener...');
      menuListener = dbService.listenToMenuChanges((updatedMenu) => {
        console.log('🔄 Menu updated in real-time:', updatedMenu.length, 'items');
        menuCache = updatedMenu;
        window.dispatchEvent(new CustomEvent('menuUpdated', { detail: updatedMenu }));
      });
    }
    
    return menu;
  } catch (error) {
    console.error('❌ Failed to load menu from Firebase:', error);
    // Return empty array instead of trying API fallback
    return [];
  }
}

export async function placeOrderToFirebase(orderData) {
  try {
    const orderId = await dbService.createOrder(orderData);
    return orderId;
  } catch (error) {
    console.error('Failed to place order to Firebase:', error);
    throw error;
  }
}

export async function getMenuItemById(itemId) {
  try {
    return await dbService.getMenuItem(itemId);
  } catch (error) {
    console.error('Failed to get menu item:', error);
    return null;
  }
}

export function listenToMenuUpdates(callback) {
  window.addEventListener('menuUpdated', (event) => {
    callback(event.detail);
  });
}

window.FirebaseCustomer = {
  getMenu: getMenuFromFirebase,
  getCategories: getCategoriesFromFirebase,
  placeOrder: placeOrderToFirebase,
  getMenuItem: getMenuItemById,
  listenToMenuUpdates
};
