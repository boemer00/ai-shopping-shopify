/**
 * Format a price for display
 * @param {string|number} amount - The price amount
 * @param {string} currencyCode - The currency code
 * @returns {string} Formatted price
 */
export const formatPrice = (amount, currencyCode = 'USD') => {
  if (!amount) return '';

  // Convert string to number if needed
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currencyCode,
    }).format(numericAmount);
  } catch (error) {
    console.error('Error formatting price:', error);
    return `${numericAmount} ${currencyCode}`;
  }
};

/**
 * Format a date for display
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date
 */
export const formatDate = (date) => {
  if (!date) return '';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return String(date);
  }
};

/**
 * Truncate text to a specified length
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text || '';

  return `${text.substring(0, maxLength)}...`;
};

/**
 * Generate a unique ID
 * @returns {string} Unique ID
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

/**
 * Parse product ID from Shopify Global ID
 * @param {string} globalId - Shopify Global ID
 * @returns {string} Product ID
 */
export const parseProductId = (globalId) => {
  if (!globalId) return '';

  try {
    // Decode base64 if needed
    let decodedId = globalId;
    if (globalId.includes('=')) {
      decodedId = atob(globalId);
    }

    // Extract the numeric ID using regex
    const match = decodedId.match(/(\d+)$/);
    return match ? match[0] : '';
  } catch (error) {
    console.error('Error parsing product ID:', error);
    return '';
  }
};

/**
 * Debounce a function call
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait = 300) => {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Store data in localStorage with expiration
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 * @param {number} expirationMins - Expiration time in minutes
 */
export const setWithExpiry = (key, value, expirationMins = 60) => {
  const now = new Date();
  const item = {
    value,
    expiry: now.getTime() + expirationMins * 60 * 1000,
  };

  try {
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.error('Error storing data in localStorage:', error);
  }
};

/**
 * Get data from localStorage with expiration check
 * @param {string} key - Storage key
 * @returns {*} Stored value or null if expired
 */
export const getWithExpiry = (key) => {
  try {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;

    const item = JSON.parse(itemStr);
    const now = new Date();

    if (now.getTime() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }

    return item.value;
  } catch (error) {
    console.error('Error retrieving data from localStorage:', error);
    return null;
  }
};
