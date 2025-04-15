import { initChatWidget } from './components/ChatWidget';
import { initAppBridge } from './services/appBridgeService';

// Initialize the application
const init = () => {
  // Initialize App Bridge for Shopify
  const appBridge = initAppBridge();

  // Initialize the chat widget
  const chatWidget = initChatWidget();

  // Expose the chat widget globally for debugging
  window.aiShopAssistant = chatWidget;
};

// Wait for DOM content to be loaded before initializing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
