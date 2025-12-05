
/* ---------- Median Push Notification Bridge ---------- */

const FCMBridge = (() => {
    let fcmToken = null;
    let oneSignalUserId = null;

    /** Check if running in Median wrapper (OneSignal approach) */
    function isMedianApp() {
        return typeof median !== 'undefined' || 
               typeof gonative !== 'undefined' || 
               typeof window.median !== 'undefined' ||
               typeof window.gonative !== 'undefined' ||
               typeof window.MedianBridge !== 'undefined';
    }

    /** Check if OneSignal is available */
    function hasOneSignal() {
        return typeof median !== 'undefined' && median.onesignal;
    }

    /** Request push notification permission and token */
    async function requestToken() {
        console.log('📱 FCMBridge: Requesting notification token...');
        
        // Try Median OneSignal first
        if (hasOneSignal()) {
            console.log('📱 Using Median OneSignal bridge');
            try {
                // Register for push notifications
                median.onesignal.push.register();
                
                // Try to get OneSignal info
                const info = await getOneSignalInfo();
                if (info && info.oneSignalUserId) {
                    oneSignalUserId = info.oneSignalUserId;
                    console.log('✅ OneSignal User ID:', oneSignalUserId);
                    localStorage.setItem('onesignal_user_id', oneSignalUserId);
                    
                    if (info.oneSignalPushToken) {
                        fcmToken = info.oneSignalPushToken;
                        localStorage.setItem('fcmToken', fcmToken);
                        sendTokenToServer(fcmToken);
                    }
                    return true;
                }
            } catch (err) {
                console.warn('OneSignal registration error:', err);
            }
        }
        
        // Fallback to legacy MedianBridge
        if (window.MedianBridge && window.MedianBridge.postMessage) {
            console.log('📱 Using legacy MedianBridge');
            sendToNative("getFCMToken");
            return true;
        }
        
        console.log('⚠️ No Median notification bridge available');
        return false;
    }

    /** Get OneSignal info with promise wrapper */
    function getOneSignalInfo() {
        return new Promise((resolve) => {
            if (!hasOneSignal()) {
                resolve(null);
                return;
            }
            
            try {
                // Try promise-based API first
                if (median.onesignal.info && typeof median.onesignal.info === 'function') {
                    median.onesignal.info()
                        .then(info => resolve(info))
                        .catch(() => resolve(null));
                } else {
                    resolve(null);
                }
            } catch (err) {
                console.warn('Error getting OneSignal info:', err);
                resolve(null);
            }
            
            // Timeout fallback
            setTimeout(() => resolve(null), 3000);
        });
    }

    /** Send messages to native (legacy) */
    function sendToNative(action, payload = {}) {
        if (window.MedianBridge && window.MedianBridge.postMessage) {
            window.MedianBridge.postMessage(JSON.stringify({ action, payload }));
        } else {
            console.warn("MedianBridge not available!");
        }
    }

    /** Handle incoming messages from native */
    function handleNativeMessage(data) {
        console.log("Native message received:", data);

        if (data.action === "fcmToken") {
            fcmToken = data.payload.token;
            console.log("FCM Token received:", fcmToken);
            localStorage.setItem("fcmToken", fcmToken);
            sendTokenToServer(fcmToken);
        }

        if (data.action === "notification") {
            if (window.notificationService && window.notificationService.showInAppNotification) {
                window.notificationService.showInAppNotification({
                    notification: {
                        title: data.payload.title,
                        body: data.payload.body
                    }
                });
            } else {
                displayNotification(data.payload.title, data.payload.body);
            }
        }
    }

    /** Send token to your backend */
    async function sendTokenToServer(token) {
        if (!token) return;
        
        try {
            // Get user email if available
            const userEmail = localStorage.getItem('userEmail') || 
                             localStorage.getItem('customerEmail') || 
                             null;
            
            const response = await fetch('/api/save-fcm-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    token,
                    userId: userEmail,
                    isOneSignal: hasOneSignal()
                })
            });
            
            if (response.ok) {
                console.log("✅ Push token saved to server");
            } else {
                console.error("Failed to save token:", response.status);
            }
        } catch (err) {
            console.error("Error sending token:", err);
        }
    }

    /** Display in-page notification (fallback) */
    function displayNotification(title, body) {
        const container = document.getElementById("notification-container") || createContainer();
        const el = document.createElement("div");
        el.className = "fcm-notification";
        el.innerHTML = `<strong>${title}</strong><p>${body}</p>`;
        container.appendChild(el);
        setTimeout(() => el.remove(), 5000);
    }

    function createContainer() {
        const container = document.createElement("div");
        container.id = "notification-container";
        container.style.position = "fixed";
        container.style.top = "10px";
        container.style.right = "10px";
        container.style.width = "300px";
        container.style.zIndex = 9999;
        document.body.appendChild(container);
        return container;
    }

    /** Trigger native toast */
    function showToast(message) {
        sendToNative("showToast", { message });
    }

    /** Trigger native page refresh */
    function refreshPage() {
        sendToNative("refreshPage");
    }

    /** Public API */
    return {
        requestToken,
        handleNativeMessage,
        showToast,
        refreshPage,
        isMedianApp,
        hasOneSignal,
        getOneSignalInfo,
        getToken: () => fcmToken || localStorage.getItem("fcmToken"),
        getOneSignalUserId: () => oneSignalUserId || localStorage.getItem("onesignal_user_id")
    };
})();

/* --- Setup: Listen for native messages --- */
window.onNativeMessage = FCMBridge.handleNativeMessage;

/* --- Callback for OneSignal info (legacy) --- */
window.median_onesignal_info = function(info) {
    console.log('📱 OneSignal info callback:', info);
    if (info && info.oneSignalUserId) {
        localStorage.setItem('onesignal_user_id', info.oneSignalUserId);
    }
    if (info && info.oneSignalPushToken) {
        localStorage.setItem('fcmToken', info.oneSignalPushToken);
    }
};

/* --- Auto-request token on page load --- */
document.addEventListener("DOMContentLoaded", () => {
    if (FCMBridge.isMedianApp()) {
        console.log("📱 Running in Median app wrapper");
        // Don't auto-request - let user click the notification button
    } else {
        console.log("🌐 Running in web browser - using web notifications");
    }
});

// Expose globally
if (typeof window !== 'undefined') {
    window.FCMBridge = FCMBridge;
}
