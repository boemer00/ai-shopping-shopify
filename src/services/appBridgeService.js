import { createApp } from '@shopify/app-bridge';
import { getSessionToken } from '@shopify/app-bridge-utils';

/**
 * Initialize Shopify App Bridge
 * @returns {Object} The App Bridge instance
 */
export const initAppBridge = () => {
  try {
    // If not in Shopify admin, don't initialize
    if (!isShopifyAdmin()) {
      console.log('Not in Shopify admin, skipping App Bridge initialization');
      return null;
    }

    const shopifyApiKey = process.env.SHOPIFY_API_KEY || '';

    if (!shopifyApiKey) {
      console.error('Missing Shopify API key');
      return null;
    }

    const config = {
      apiKey: shopifyApiKey,
      host: getShopOrigin(),
      forceRedirect: false
    };

    const app = createApp(config);
    console.log('App Bridge initialized successfully');
    return app;
  } catch (error) {
    console.error('Failed to initialize App Bridge:', error);
    return null;
  }
};

/**
 * Get the session token from App Bridge
 * @param {Object} app - The App Bridge instance
 * @returns {Promise<string>} The session token
 */
export const getAppBridgeSessionToken = async (app) => {
  try {
    if (!app) {
      console.error('App Bridge instance is not available');
      return null;
    }

    const token = await getSessionToken(app);
    return token;
  } catch (error) {
    console.error('Failed to get session token:', error);
    return null;
  }
};

/**
 * Check if the current page is within the Shopify admin
 * @returns {boolean} True if within Shopify admin
 */
export const isShopifyAdmin = () => {
  return window.top !== window.self &&
         window.location.ancestorOrigins &&
         window.location.ancestorOrigins[0] &&
         window.location.ancestorOrigins[0].includes('myshopify.com');
};

/**
 * Extract shop origin from the URL
 * @returns {string} The shop origin
 */
export const getShopOrigin = () => {
  // Try to get from query string first
  const url = new URL(window.location.href);
  const shopOrigin = url.searchParams.get('shop');

  if (shopOrigin) {
    return shopOrigin;
  }

  // Fallback to ancestor origins if in iframe
  if (window.location.ancestorOrigins && window.location.ancestorOrigins[0]) {
    const ancestorUrl = new URL(window.location.ancestorOrigins[0]);
    return ancestorUrl.hostname;
  }

  return '';
};
