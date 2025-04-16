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
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  if (!date || !(date instanceof Date)) {
    console.error('Invalid date provided to formatDate:', date);
    return 'Invalid date';
  }

  try {
    const day = date.getDate().toString().padStart(2, '0');
    const month = new Intl.DateTimeFormat('en', { month: 'short' }).format(date);
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Date error';
  }
}

/**
 * Truncate text to a specified length
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
}

/**
 * Generate a unique ID
 * @returns {string} Unique ID
 */
export function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

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
 * Debounce a function to limit how often it can be called
 * @param {Function} func - The function to debounce
 * @param {number} wait - The time to wait in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

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

/**
 * Format currency amount
 * @param {number} amount - The amount to format
 * @param {string} currencyCode - Currency code (USD, GBP, etc.)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currencyCode = 'USD') {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  });
  return formatter.format(amount);
}
