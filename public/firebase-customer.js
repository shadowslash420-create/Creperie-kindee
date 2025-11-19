import dbService from './db-service.js';

let menuCache = null;
let menuListener = null;

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
  placeOrder: placeOrderToFirebase,
  getMenuItem: getMenuItemById,
  listenToMenuUpdates
};
