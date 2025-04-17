/**
 * Shopify App Embed Component - Handles embedding the chat widget in Shopify storefronts
 */
import { initChatWidget } from './ChatWidget';

// Track initialization status
let isShopifyEmbedInitialized = false;

// Same localStorage key as in ChatWidget.js to ensure consistency
const STORAGE_KEY = 'aiShoppingAssistant_conversation';

/**
 * Initialize the Shopify app embed
 * @returns {Object} The initialized chat widget
 */
export const initShopifyAppEmbed = () => {
  console.log('Initializing Shopify app embed');

  // Prevent multiple initializations
  if (isShopifyEmbedInitialized || window.aiShopAssistant) {
    console.log('Shopify app embed already initialized, returning existing instance');
    return window.aiShopAssistant;
  }

  try {
    isShopifyEmbedInitialized = true;

    // Check if we're in a Shopify storefront
    const isShopifyStorefront = isInShopifyStorefront();
    console.log('Is in Shopify storefront:', isShopifyStorefront);

    // Set global variables based on environment
    configureGlobalVariables();

    // Create container for the chat widget if it doesn't exist
    ensureChatContainer();

    // Initialize the chat widget
    const chatWidget = initChatWidget();

    // Add to window for external access
    window.aiShopAssistant = chatWidget;

    console.log('Shopify app embed initialized successfully');
    return chatWidget;
  } catch (error) {
    console.error('Error initializing Shopify app embed:', error);
    isShopifyEmbedInitialized = false; // Reset flag if initialization failed
    return null;
  }
};

/**
 * Check if the app is running in a Shopify storefront
 * @returns {boolean} Whether the app is in a Shopify storefront
 */
const isInShopifyStorefront = () => {
  // Check if URL contains myshopify.com or has shop parameter
  const url = window.location.href;
  const urlParams = new URLSearchParams(window.location.search);

  return (
    url.includes('myshopify.com') ||
    urlParams.has('shop') ||
    (window.Shopify && window.Shopify.shop)
  );
};

/**
 * Configure global variables needed for the app
 */
const configureGlobalVariables = () => {
  // For Shopify theme app extension, these variables are set by the server or via script tags
  // Here we're checking if they're already set or if we need to extract them from the environment

  if (!window.SHOPIFY_STORE_URL) {
    // Try to get from URL
    const url = new URL(window.location.href);
    const shopParam = url.searchParams.get('shop');

    if (shopParam) {
      window.SHOPIFY_STORE_URL = shopParam;
    } else if (window.Shopify && window.Shopify.shop) {
      window.SHOPIFY_STORE_URL = window.Shopify.shop;
    } else if (window.location.host.includes('myshopify.com')) {
      window.SHOPIFY_STORE_URL = window.location.host;
    }

    console.log('Set SHOPIFY_STORE_URL:', window.SHOPIFY_STORE_URL);
  }

  // Other global variables can be set here if needed
};

/**
 * Ensure the chat container exists in the DOM
 */
const ensureChatContainer = () => {
  let container = document.getElementById('ai-shopping-assistant');

  if (!container) {
    console.log('Creating chat container');
    container = document.createElement('div');
    container.id = 'ai-shopping-assistant';
    container.className = 'chat-widget-container';

    // Create full chat interface structure
    container.innerHTML = `
      <div class="chat-widget-header">
        <h3>Shopping Assistant</h3>
        <button id="toggle-chat" class="toggle-button">-</button>
      </div>
      <div class="chat-messages" id="chat-messages">
        <!-- Messages will appear here -->
      </div>
      <div class="chat-input-container">
        <input type="text" id="chat-input" placeholder="Ask about products...">
        <button id="send-message">Send</button>
      </div>
    `;

    document.body.appendChild(container);

    // Log conversation status for debugging
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        console.log('Found stored conversation in localStorage:',
                    data.conversationId,
                    `with ${data.conversationHistory.length} messages`);
      } catch (e) {
        console.error('Error parsing stored conversation:', e);
      }
    } else {
      console.log('No stored conversation found in localStorage');
    }
  }

  return container;
};

/**
 * Load the app when DOM is ready
 * This self-executing code can be removed as the main index.js now handles initialization
 */
/*
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  console.log('Document already ready, initializing Shopify app embed');
  setTimeout(() => initShopifyAppEmbed(), 100);
} else {
  console.log('Waiting for DOMContentLoaded to initialize Shopify app embed');
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => initShopifyAppEmbed(), 100);
  });
}
*/

export default initShopifyAppEmbed;
