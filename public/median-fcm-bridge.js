
/* ---------- Median FCM JavaScript Bridge ---------- */

const FCMBridge = (() => {
    let fcmToken = null;

    /** Send messages to native */
    function sendToNative(action, payload = {}) {
        if (window.MedianBridge && window.MedianBridge.postMessage) {
            window.MedianBridge.postMessage(JSON.stringify({ action, payload }));
        } else {
            console.warn("MedianBridge not available!");
        }
    }

    /** Request FCM token from native */
    function requestToken() {
        sendToNative("getFCMToken");
    }

    /** Handle incoming messages from native */
    function handleNativeMessage(data) {
        console.log("Native message received:", data);

        if (data.action === "fcmToken") {
            fcmToken = data.payload.token;
            console.log("FCM Token received:", fcmToken);

            // Store locally
            localStorage.setItem("fcmToken", fcmToken);

            // Send token to backend
            sendTokenToServer(fcmToken);
        }

        if (data.action === "notification") {
            // Display notification in-page using existing notification system
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
        try {
            const response = await fetch('/api/save-fcm-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });
            
            if (response.ok) {
                console.log("✅ FCM token saved to server");
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

    /** Check if running in Median wrapper */
    function isMedianApp() {
        return typeof window.MedianBridge !== 'undefined';
    }

    /** Public API */
    return {
        requestToken,
        handleNativeMessage,
        showToast,
        refreshPage,
        isMedianApp,
        getToken: () => fcmToken || localStorage.getItem("fcmToken")
    };
})();

/* --- Setup: Listen for native messages --- */
window.onNativeMessage = FCMBridge.handleNativeMessage;

/* --- Auto-request FCM token on page load --- */
document.addEventListener("DOMContentLoaded", () => {
    if (FCMBridge.isMedianApp()) {
        console.log("📱 Running in Median app wrapper - requesting FCM token");
        FCMBridge.requestToken();
    } else {
        console.log("🌐 Running in web browser - using web notifications");
    }
});

// Expose globally
if (typeof window !== 'undefined') {
    window.FCMBridge = FCMBridge;
}
