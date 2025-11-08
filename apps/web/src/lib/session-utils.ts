/**
 * Utility functions for handling session expiration and authentication errors
 */

export const handleSessionExpired = () => {
  console.log('Session expired - clearing tokens and redirecting to login');
  
  // Clear stored tokens and user data
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  
  // Show a brief message before redirecting
  if (typeof window !== 'undefined') {
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f59e0b;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 9999;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = 'Session expired. Redirecting to login...';
    document.body.appendChild(notification);
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Remove notification after 2 seconds and redirect
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
      window.location.href = '/auth/login';
    }, 2000);
  } else {
    // Fallback for server-side
    window.location.href = '/auth/login';
  }
};

export const isAuthError = (error: any): boolean => {
  return error?.response?.status === 401 || error?.response?.status === 403;
};

export const shouldRedirectToLogin = (): boolean => {
  const isOnLoginPage = window.location.pathname === '/auth/login';
  const isOnSignupPage = window.location.pathname === '/auth/signup';
  return !isOnLoginPage && !isOnSignupPage;
};
