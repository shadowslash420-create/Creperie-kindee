// Thank you popup for successful order
function showThankYouPopup(customerName, orderId) {
  const isArabic = currentLang === 'ar';
  
  const popup = document.createElement('div');
  popup.id = 'thank-you-popup';
  popup.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    z-index: 50000;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.3s ease-in;
  `;

  const content = `
    <div style="
      background: white;
      border-radius: 24px;
      padding: 40px;
      max-width: 500px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    ">
      <!-- Checkmark Animation -->
      <div style="
        width: 80px;
        height: 80px;
        margin: 0 auto 24px;
        background: linear-gradient(135deg, #52C41A 0%, #389E0D 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        box-shadow: 0 8px 24px rgba(82, 196, 26, 0.3);
      ">
        <svg width="45" height="45" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>

      <!-- Heading -->
      <h1 style="
        margin: 0 0 12px 0;
        color: #2C1810;
        font-size: 32px;
        font-weight: 700;
        font-family: 'Cormorant Garamond', serif;
      ">
        ${isArabic ? '✨ شكراً لك!' : '✨ Thank You!'}
      </h1>

      <!-- Message -->
      <p style="
        margin: 0 0 24px 0;
        color: #5C4033;
        font-size: 18px;
        line-height: 1.6;
        font-family: 'Cormorant Garamond', serif;
      ">
        ${isArabic 
          ? `شكراً ${customerName}، تم استقبال طلبك بنجاح` 
          : `Thank you ${customerName}! Your order has been received`}
      </p>

      <!-- Order Details -->
      <div style="
        background: linear-gradient(135deg, #FFF5F5 0%, #FFE8E8 100%);
        border: 2px solid #FFE4E1;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 24px;
      ">
        <p style="
          margin: 0;
          color: #E30613;
          font-size: 14px;
          font-weight: 600;
        ">
          ${isArabic ? 'رقم الطلب:' : 'Order ID:'}
        </p>
        <p style="
          margin: 4px 0 0 0;
          color: #2C1810;
          font-size: 16px;
          font-weight: 700;
          font-family: monospace;
        ">
          ${orderId.substring(0, 12).toUpperCase()}
        </p>
      </div>

      <!-- Status Message -->
      <p style="
        margin: 0 0 32px 0;
        color: #666;
        font-size: 14px;
      ">
        ${isArabic 
          ? '📍 سيتم توصيل طلبك قريباً. شكراً لاختيارك Crêperie Kinder 5' 
          : '📍 Your order will be delivered soon. Thank you for choosing Crêperie Kinder 5'}
      </p>

      <!-- Action Button -->
      <button onclick="document.getElementById('thank-you-popup')?.remove();" style="
        width: 100%;
        padding: 14px 24px;
        background: linear-gradient(135deg, #E30613 0%, #B30510 100%);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        box-shadow: 0 4px 12px rgba(227, 6, 19, 0.4);
      "
      onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(227, 6, 19, 0.5)';"
      onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(227, 6, 19, 0.4)';">
        ${isArabic ? '✅ حسناً' : '✅ Awesome!'}
      </button>
    </div>

    <style>
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes scaleIn {
        from {
          opacity: 0;
          transform: scale(0.3);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
    </style>
  `;

  popup.innerHTML = content;
  document.body.appendChild(popup);

  // Auto-close after 3 seconds
  setTimeout(() => {
    popup.remove();
  }, 3000);
}
