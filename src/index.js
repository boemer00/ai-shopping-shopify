// Import stylesheets
import './styles/main.css';
import './styles/chat-widget.css';

// Import app functionality
import './js/app.js';

import { initChatWidget } from './components/ChatWidget';
import { initAppBridge } from './services/appBridgeService';
import { testClaudeConnection } from './services/claudeService';

// For debugging
console.log('index.js loaded');

// Initialize the application
const init = () => {
  console.log('AI Shopping application initialization started');

  try {
    // Check if we're running in standalone mode or integrated mode
    const appBridgeElement = document.getElementById('shopify-app-bridge');
    const isStandalone = !appBridgeElement;
    console.log('Running in', isStandalone ? 'standalone mode' : 'integrated mode');

    if (!isStandalone && appBridgeElement) {
      // Initialize App Bridge for Shopify
      try {
        const appBridge = initAppBridge();
        console.log('App Bridge initialized');
      } catch (e) {
        console.error('Failed to initialize App Bridge:', e);
      }
    }

    // Initialize the chat widget if needed elements exist
    const chatContainer = document.getElementById('ai-shopping-assistant');
    if (chatContainer) {
      console.log('Initializing chat widget');
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

    // Expose test functions globally for the test page
    window.testClaudeConnection = testClaudeConnection;
    console.log('AI Shopping application initialization completed');
  } catch (error) {
    console.error('Error during application initialization:', error);
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
    // Only initialize if aiShopAssistant is not yet defined
    if (!window.aiShopAssistant) {
      console.log('Application not yet initialized, running init');
      setTimeout(init, 100);
    }
  });
}
