import dbService from './db-service.js';

let menuCache = null;
let menuListener = null;

export async function getMenuFromFirebase() {
  try {
    if (menuCache) {
      return menuCache;
    }
    
    const menu = await dbService.getAllMenuItems();
    menuCache = menu;
    
    if (!menuListener) {
      menuListener = dbService.listenToMenuChanges((updatedMenu) => {
        menuCache = updatedMenu;
        window.dispatchEvent(new CustomEvent('menuUpdated', { detail: updatedMenu }));
      });
    }
    
    return menu;
  } catch (error) {
    console.error('Failed to load menu from Firebase:', error);
    const fallback = await fetch('/api/menu').then(r => r.json()).catch(() => []);
    return fallback;
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
