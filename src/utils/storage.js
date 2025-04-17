/**
 * Storage utilities for conversation persistence
 */

// Constants for storage keys
export const STORAGE_KEY = 'aiShoppingAssistant_conversation';
export const COOKIE_NAME = 'ai_shop_conversation_id';

/**
 * Save conversation data to localStorage and cookie
 * @param {Object} data - The conversation data to save
 */
export const saveConversation = (data) => {
  try {
    if (!data || !data.conversationId) {
      console.warn('Invalid data, cannot save conversation');
      return;
    }

    // Save full data to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    // Save conversation ID to cookie for cross-domain persistence
    setConversationCookie(data.conversationId);

    console.log(`Saved conversation ${data.conversationId} to localStorage and cookie`);
  } catch (error) {
    console.error('Error saving conversation:', error);
  }
};

/**
 * Load conversation data from localStorage or cookie
 * @returns {Object|null} The conversation data or null
 */
export const loadConversation = () => {
  try {
    // First try localStorage (same origin)
    const storedData = localStorage.getItem(STORAGE_KEY);

    if (storedData) {
      const data = JSON.parse(storedData);
      return {
        source: 'localStorage',
        data: data,
        conversationId: data.conversationId
      };
    }

    // If not in localStorage, try to get ID from cookie
    const conversationId = getConversationCookie();
    if (conversationId) {
      console.log('Found conversation ID in cookie:', conversationId);
      return {
        source: 'cookie',
        data: null,
        conversationId: conversationId
      };
    }

    return null;
  } catch (error) {
    console.error('Error loading conversation:', error);
    return null;
  }
};

/**
 * Set conversation ID in a cookie for cross-domain persistence
 * @param {string} conversationId - The conversation ID
 */
export const setConversationCookie = (conversationId) => {
  try {
    if (!conversationId) return;

    // Get domain for the cookie
    const domain = getCookieDomain();

    // Set cookie with a 24-hour expiry
    const expires = new Date();
    expires.setTime(expires.getTime() + 24 * 60 * 60 * 1000);

    document.cookie = `${COOKIE_NAME}=${conversationId}; expires=${expires.toUTCString()}; path=/; domain=${domain}; SameSite=Lax`;
    console.log(`Set conversation cookie with ID ${conversationId} for domain ${domain}`);
  } catch (error) {
    console.error('Error setting conversation cookie:', error);
  }
};

/**
 * Get conversation ID from cookie
 * @returns {string|null} The conversation ID or null
 */
export const getConversationCookie = () => {
  try {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith(COOKIE_NAME + '=')) {
        return cookie.substring(COOKIE_NAME.length + 1);
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting conversation cookie:', error);
    return null;
  }
};

/**
 * Get the domain to use for cookies
 * @returns {string} The domain
 */
export const getCookieDomain = () => {
  try {
    const hostname = window.location.hostname;

    // For localhost, don't set a domain
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return hostname;
    }

    // For an IP address, return it as is
    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      return hostname;
    }

    // For myshopify.com domains, use the .myshopify.com domain
    if (hostname.includes('myshopify.com')) {
      // Return as is for myshopify domains
      return hostname;
    }

    // Get the root domain (e.g., example.com from www.example.com)
    const parts = hostname.split('.');
    if (parts.length > 2) {
      // Return the base domain: ".example.com"
      return parts.slice(-2).join('.');
    }

    // Default to the hostname
    return hostname;
  } catch (error) {
    console.error('Error getting cookie domain:', error);
    return window.location.hostname;
  }
};
