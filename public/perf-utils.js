// Performance utilities for faster loading and rendering

// Debounce function to prevent excessive calls
export function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

// Throttle function for high-frequency events
export function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Simple LRU cache for Firebase queries
export class CacheStore {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  set(key, value, ttl = 5 * 60 * 1000) {
    // Remove oldest if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  clear() {
    this.cache.clear();
  }
}

// Batch DOM updates for better performance
export function batchDOMUpdates(updates) {
  return new Promise(resolve => {
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => {
        updates();
        resolve();
      });
    } else {
      setTimeout(() => {
        updates();
        resolve();
      }, 0);
    }
  });
}

// Lazy load images
export function observeImages() {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        }
      });
    }, {
      rootMargin: '50px'
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }
}

// Request deduplication for parallel Firebase calls
export class RequestDeduplicator {
  constructor() {
    this.pendingRequests = new Map();
  }

  async deduplicate(key, requestFn) {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }
}

// Virtual scrolling for large lists
export function setupVirtualScroll(container, items, renderItem, itemHeight = 60) {
  let visibleRange = { start: 0, end: 0 };
  
  const render = () => {
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.ceil((scrollTop + containerHeight) / itemHeight);
    
    if (start !== visibleRange.start || end !== visibleRange.end) {
      visibleRange = { start, end };
      
      container.innerHTML = '';
      const fragment = document.createDocumentFragment();
      
      for (let i = Math.max(0, start - 5); i < Math.min(items.length, end + 5); i++) {
        const el = renderItem(items[i], i);
        fragment.appendChild(el);
      }
      
      container.appendChild(fragment);
    }
  };
  
  container.addEventListener('scroll', throttle(render, 16));
  render();
}

// Preload critical resources
export function preloadResources() {
  const links = [
    { rel: 'preload', as: 'script', href: 'firebase-config.js' },
    { rel: 'preload', as: 'script', href: 'db-service.js' },
    { rel: 'prefetch', href: 'menu.html' },
    { rel: 'prefetch', href: 'login.html' }
  ];
  
  links.forEach(({ rel, as, href }) => {
    const link = document.createElement('link');
    link.rel = rel;
    if (as) link.as = as;
    link.href = href;
    document.head.appendChild(link);
  });
}

// Performance monitoring
export function measurePerformance(label) {
  const start = performance.now();
  return {
    end: () => {
      const duration = performance.now() - start;
      if (duration > 100) console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
    }
  };
}
