// Import stylesheets
import './styles/main.css';
import './styles/chat-widget.css';

// Import app functionality
import './js/app.js';

import { initChatWidget } from './components/ChatWidget';
import { initAppBridge } from './services/appBridgeService';
import { testClaudeConnection } from './services/claudeService';
import { initShopifyAppEmbed } from './components/ShopifyAppEmbed';

// For debugging
console.log('index.js loaded');

// Global initialization flag to prevent multiple initializations
let isInitialized = false;

// Initialize the application
const init = () => {
  // Prevent multiple initializations
  if (isInitialized || window.aiShopAssistant) {
    console.log('Application already initialized, skipping');
    return;
  }

  console.log('AI Shopping application initialization started');
  isInitialized = true;

  try {
    // Check if we're running in Shopify admin via App Bridge
    const appBridgeElement = document.getElementById('shopify-app-bridge');
    const isAppBridgeMode = !!appBridgeElement;

    // Check if we're running in a Shopify storefront
    const isStorefrontMode = window.location.href.includes('myshopify.com') ||
                            new URLSearchParams(window.location.search).has('shop') ||
                            (window.Shopify && window.Shopify.shop);

    // Determine operating mode
    const isStandalone = !isAppBridgeMode && !isStorefrontMode;

    console.log('Running in',
      isAppBridgeMode ? 'Shopify admin mode' :
      isStorefrontMode ? 'Shopify storefront mode' :
      'standalone mode'
    );

    // Set up application based on mode
    if (isAppBridgeMode) {
      // Initialize App Bridge for Shopify Admin
      try {
        const appBridge = initAppBridge();
        console.log('App Bridge initialized');
      } catch (e) {
        console.error('Failed to initialize App Bridge:', e);
      }
    } else if (isStorefrontMode) {
      // Initialize Shopify storefront embed
      try {
        const shopifyEmbed = initShopifyAppEmbed();
        console.log('Shopify embed initialized');
      } catch (e) {
        console.error('Failed to initialize Shopify embed:', e);
      }
    } else {
      // Initialize standalone chat widget if container exists
      const chatContainer = document.getElementById('ai-shopping-assistant');
      if (chatContainer) {
        console.log('Initializing chat widget in standalone mode');
        try {
          const chatWidget = initChatWidget();
          window.aiShopAssistant = chatWidget;
          console.log('Chat widget initialized and exposed as window.aiShopAssistant');
        } catch (e) {
          console.error('Failed to initialize chat widget:', e);
        }
      } else {
        console.log('Chat widget container not found in the DOM');
      }
    }

    // Expose test functions globally for the test page
    window.testClaudeConnection = testClaudeConnection;
    console.log('AI Shopping application initialization completed');
  } catch (error) {
    console.error('Error during application initialization:', error);
    isInitialized = false; // Reset flag if initialization failed
  }
};

// Wait for DOM to be fully loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  // DOM is already completely loaded or interactive
  console.log('Document is already ready, adding a small delay before initialization');
  setTimeout(init, 100);
} else {
  // Use DOMContentLoaded as the primary event listener
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded fired, adding a small delay before initialization');
    setTimeout(init, 100);
  });

  // Also listen for load event as a fallback
  window.addEventListener('load', () => {
    console.log('Window load event fired, checking if initialization has occurred');
    // Only initialize if aiShopAssistant is not yet defined and not already initialized
    if (!window.aiShopAssistant && !isInitialized) {
      console.log('Application not yet initialized, running init');
      setTimeout(init, 100);
    }
  });
}
