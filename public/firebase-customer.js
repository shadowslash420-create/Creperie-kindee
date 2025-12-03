import dbService from './db-service.js';
import { getFirestoreInstance } from './firebase-config.js';
import { 
  collection, 
  query, 
  onSnapshot 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let menuCache = null;
let menuListener = null;
let categoriesCache = null;
let db = null;

// Cache keys for localStorage
const CACHE_KEYS = {
  MENU: 'kc_firebase_menu_cache',
  CATEGORIES: 'kc_firebase_categories_cache',
  MENU_TIMESTAMP: 'kc_firebase_menu_timestamp',
  CATEGORIES_TIMESTAMP: 'kc_firebase_categories_timestamp'
};

// Cache TTL: 24 hours
const CACHE_TTL = 24 * 60 * 60 * 1000;

// Check if cache is still valid
function isCacheValid(timestampKey) {
  const timestamp = localStorage.getItem(timestampKey);
  if (!timestamp) return false;
  return Date.now() - parseInt(timestamp) < CACHE_TTL;
}

// Load from localStorage
function loadFromLocalStorage(cacheKey) {
  try {
    const data = localStorage.getItem(cacheKey);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return null;
  }
}

// Save to localStorage
function saveToLocalStorage(cacheKey, timestampKey, data) {
  try {
    localStorage.setItem(cacheKey, JSON.stringify(data));
    localStorage.setItem(timestampKey, Date.now().toString());
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

export async function getCategoriesFromFirebase() {
  try {
    console.log('📂 Loading categories from Firestore...');

    if (!dbService || typeof dbService.getAllCategories !== 'function') {
      console.error('❌ dbService is not properly initialized');
      return [];
    }

    // Check in-memory cache first
    if (categoriesCache) {
      console.log('📦 Returning cached categories (memory):', categoriesCache.length);
      return categoriesCache;
    }

    // Check localStorage next
    if (isCacheValid(CACHE_KEYS.CATEGORIES_TIMESTAMP)) {
      const cached = loadFromLocalStorage(CACHE_KEYS.CATEGORIES);
      if (cached) {
        console.log('📦 Returning cached categories (localStorage):', cached.length);
        categoriesCache = cached;
        return cached;
      }
    }

    // Fetch from Firestore
    console.log('🔄 Fetching fresh categories from Firestore...');
    const categories = await dbService.getAllCategories();
    console.log('✅ Categories loaded:', categories.length);
    console.log('📊 Category IDs:', categories.map(c => c.id));

    // Update both caches
    categoriesCache = categories;
    saveToLocalStorage(CACHE_KEYS.CATEGORIES, CACHE_KEYS.CATEGORIES_TIMESTAMP, categories);

    return categories;
  } catch (error) {
    console.error('❌ Failed to load categories from Firebase:', error);

    // Try to return localStorage data even if fetch failed
    const cached = loadFromLocalStorage(CACHE_KEYS.CATEGORIES);
    if (cached) {
      console.log('📦 Returning stale cached categories (Firebase failed):', cached.length);
      return cached;
    }

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

    // Check in-memory cache first
    if (menuCache) {
      console.log('📦 Returning cached menu (memory):', menuCache.length, 'items');
      return menuCache;
    }

    // Check localStorage next
    if (isCacheValid(CACHE_KEYS.MENU_TIMESTAMP)) {
      const cached = loadFromLocalStorage(CACHE_KEYS.MENU);
      if (cached) {
        console.log('📦 Returning cached menu (localStorage):', cached.length, 'items');
        menuCache = cached;
        // Still setup real-time listener in background
        setupMenuListener();
        return cached;
      }
    }

    // Fetch from Firestore
    console.log('🔄 Fetching fresh menu from Firestore...');
    const menu = await dbService.getAllMenuItems();
    console.log('✅ Menu fetched from Firestore:', menu.length, 'items');
    console.log('📊 Item details:', menu.map(item => ({ name: item.name, category: item.category })));

    // Update both caches
    menuCache = menu;
    saveToLocalStorage(CACHE_KEYS.MENU, CACHE_KEYS.MENU_TIMESTAMP, menu);

    // Setup real-time listener
    setupMenuListener();

    return menu;
  } catch (error) {
    console.error('❌ Failed to load menu from Firebase:', error);

    // Try to return localStorage data even if fetch failed
    const cached = loadFromLocalStorage(CACHE_KEYS.MENU);
    if (cached) {
      console.log('📦 Returning stale cached menu (Firebase failed):', cached.length, 'items');
      return cached;
    }

    return [];
  }
}

// Separate function to setup listener
async function setupMenuListener() {
  if (!menuListener) {
    console.log('👂 Setting up real-time menu listener...');
    if (!db) {
      db = await getFirestoreInstance();
    }
    let initialLoad = true;
    menuListener = onSnapshot(query(collection(db, 'menu')), (snapshot) => {
      if (snapshot.metadata.fromCache && !initialLoad) {
        console.log('⚠️ Ignoring cached snapshot');
        return;
      }

      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Only update if we have actual changes or it's the initial load
      if (initialLoad || !snapshot.metadata.hasPendingWrites) {
        console.log('🔄 Menu updated in real-time:', items.length, 'items');

        // Update cache
        setCache('kc_firebase_menu_cache', items);

        // Update state
        window.menuItems = items;

        // Re-render if we're on the home page
        if (typeof renderHomeMenuPreview === 'function') {
          renderHomeMenuPreview(items);
        }

        initialLoad = false;
      }
    }, (error) => {
      console.error('❌ Real-time listener error:', error);
    });
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

// Clear old caches when app updates (clear cache older than 24h on app start)
export function clearExpiredCache() {
  const keys = [
    [CACHE_KEYS.MENU, CACHE_KEYS.MENU_TIMESTAMP],
    [CACHE_KEYS.CATEGORIES, CACHE_KEYS.CATEGORIES_TIMESTAMP]
  ];

  keys.forEach(([cacheKey, timestampKey]) => {
    if (!isCacheValid(timestampKey)) {
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(timestampKey);
      console.log('🧹 Cleared expired cache:', cacheKey);
    }
  });
}

// Auto-clear expired caches on module load
clearExpiredCache();

window.FirebaseCustomer = {
  getMenu: getMenuFromFirebase,
  getCategories: getCategoriesFromFirebase,
  placeOrder: placeOrderToFirebase,
  getMenuItem: getMenuItemById,
  listenToMenuUpdates,
  clearCache: () => {
    menuCache = null;
    categoriesCache = null;
    localStorage.removeItem(CACHE_KEYS.MENU);
    localStorage.removeItem(CACHE_KEYS.CATEGORIES);
    localStorage.removeItem(CACHE_KEYS.MENU_TIMESTAMP);
    localStorage.removeItem(CACHE_KEYS.CATEGORIES_TIMESTAMP);
    console.log('🧹 All caches cleared');
  }
};