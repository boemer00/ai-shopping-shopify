import { formatDate } from '../utils/helpers';
import { createMessage } from './Message';
import { createProductCard } from './ProductCard';
import { sendMessageToClaude, isProductSearch, extractSearchTerms } from '../services/claudeService';
import { searchProducts, createCart, addToCart, getCart } from '../services/storefrontService';
import {
  createConversation,
  addMessage,
  getMessages,
  saveUserPreferences
} from '../services/supabaseService';

/**
 * Chat Widget Component
 */
export class ChatWidget {
  constructor() {
    this.container = null;
    this.messagesContainer = null;
    this.inputField = null;
    this.sendButton = null;
    this.toggleButton = null;
    this.isMinimized = false;
    this.isLoading = false;
    this.conversationId = null;
    this.cartId = null;
    this.shopId = null;
    this.customerId = null;
    this.conversationHistory = [];
  }

  /**
   * Initialize the chat widget
   */
  async init() {
    this.container = document.getElementById('ai-shopping-assistant');

    // If container doesn't exist, create it
    if (!this.container) {
      this.container = this.createChatContainer();
      document.body.appendChild(this.container);
    }

    this.messagesContainer = document.getElementById('chat-messages');
    this.inputField = document.getElementById('chat-input');
    this.sendButton = document.getElementById('send-message');
    this.toggleButton = document.getElementById('toggle-chat');

    // Set up event listeners
    this.setupEventListeners();

    // Get or create shop ID
    this.shopId = window.Shopify?.shop || window.location.hostname;

    // Try to get customer ID if available
    this.customerId = this.getCustomerId();

    // Create a conversation in Supabase
    await this.createNewConversation();

    // Create a cart
    await this.createNewCart();

    // Add welcome message
    this.addWelcomeMessage();
  }

  /**
   * Create chat container if it doesn't exist
   * @returns {HTMLElement} The chat container
   */
  createChatContainer() {
    const container = document.createElement('div');
    container.id = 'ai-shopping-assistant';
    container.className = 'chat-widget-container';

    container.innerHTML = `
      <div class="chat-widget-header">
        <h3>Shopping Assistant</h3>
        <button id="toggle-chat" class="toggle-button">-</button>
      </div>
      <div class="chat-messages" id="chat-messages">
        <!-- Messages will be displayed here -->
      </div>
      <div class="chat-input-container">
        <input type="text" id="chat-input" placeholder="Ask about products...">
        <button id="send-message">Send</button>
      </div>
    `;

    return container;
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Send message when button is clicked
    this.sendButton.addEventListener('click', () => {
      this.handleSendMessage();
    });

    // Send message when Enter key is pressed
    this.inputField.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        this.handleSendMessage();
      }
    });

    // Toggle chat minimization
    this.toggleButton.addEventListener('click', () => {
      this.toggleChat();
    });
  }

  /**
   * Get customer ID from Shopify if available
   * @returns {string|null} Customer ID or null
   */
  getCustomerId() {
    // Try to get from Shopify customer object if available
    if (window.Shopify && window.Shopify.customer) {
      return window.Shopify.customer.id;
    }

    // Otherwise return null (anonymous user)
    return null;
  }

  /**
   * Create a new conversation in Supabase
   */
  async createNewConversation() {
    try {
      const { conversation, error } = await createConversation(this.shopId, this.customerId);

      if (error) {
        console.error('Error creating conversation:', error);
        return;
      }

      this.conversationId = conversation.id;
      console.log('Conversation created with ID:', this.conversationId);
    } catch (error) {
      console.error('Error in createNewConversation:', error);
    }
  }

  /**
   * Create a new cart in Shopify
   */
  async createNewCart() {
    try {
      const { cart, error } = await createCart();

      if (error) {
        console.error('Error creating cart:', error);
        return;
      }

      this.cartId = cart.id;
      console.log('Cart created with ID:', this.cartId);
    } catch (error) {
      console.error('Error in createNewCart:', error);
    }
  }

  /**
   * Add welcome message to the chat
   */
  addWelcomeMessage() {
    const welcomeMessage = "Hello! I'm your shopping assistant. How can I help you today?";
    this.addAssistantMessage(welcomeMessage);

    // Store message in Supabase if conversation exists
    if (this.conversationId) {
      addMessage(this.conversationId, 'assistant', welcomeMessage)
        .catch(error => console.error('Error storing welcome message:', error));
    }
  }

  /**
   * Handle sending a user message
   */
  async handleSendMessage() {
    const message = this.inputField.value.trim();

    if (!message || this.isLoading) {
      return;
    }

    // Clear input field
    this.inputField.value = '';

    // Add user message to chat
    this.addUserMessage(message);

    // Store message in Supabase
    if (this.conversationId) {
      await addMessage(this.conversationId, 'user', message)
        .catch(error => console.error('Error storing user message:', error));
    }

    // Add to conversation history
    this.conversationHistory.push({
      role: 'user',
      content: message
    });

    // Show loading indicator
    this.setLoading(true);

    try {
      // Check if this is likely a product search
      if (isProductSearch(message)) {
        await this.handleProductSearch(message);
      } else {
        await this.handleGeneralQuery(message);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      this.addAssistantMessage('Sorry, I encountered an error. Please try again later.');
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Handle a product search query
   * @param {string} message - User message
   */
  async handleProductSearch(message) {
    try {
      // Extract search terms
      const searchTerms = extractSearchTerms(message);

      // Search for products
      const { products, error } = await searchProducts(searchTerms);

      if (error) {
        throw new Error(error);
      }

      // Create context with products
      const context = { products };

      // Get cart if available
      if (this.cartId) {
        const { cart } = await getCart(this.cartId);
        if (cart) {
          context.cart = cart;
        }
      }

      // Get AI response
      const response = await sendMessageToClaude(
        message,
        this.conversationHistory,
        context
      );

      if (response.error) {
        throw new Error(response.error);
      }

      // Add AI response to chat
      this.addAssistantMessage(response.message);

      // Store message in Supabase
      if (this.conversationId) {
        await addMessage(this.conversationId, 'assistant', response.message)
          .catch(error => console.error('Error storing assistant message:', error));
      }

      // Add to conversation history
      this.conversationHistory.push({
        role: 'assistant',
        content: response.message
      });

      // Display product cards if products were found
      if (products && products.length > 0) {
        this.displayProductCards(products);
      }
    } catch (error) {
      console.error('Error in handleProductSearch:', error);
      this.addAssistantMessage('Sorry, I had trouble searching for products. Please try again later.');
    }
  }

  /**
   * Handle a general query (non-product search)
   * @param {string} message - User message
   */
  async handleGeneralQuery(message) {
    try {
      // Create context object
      const context = {};

      // Get cart if available
      if (this.cartId) {
        const { cart } = await getCart(this.cartId);
        if (cart) {
          context.cart = cart;
        }
      }

      // Get AI response
      const response = await sendMessageToClaude(
        message,
        this.conversationHistory,
        context
      );

      if (response.error) {
        throw new Error(response.error);
      }

      // Add AI response to chat
      this.addAssistantMessage(response.message);

      // Store message in Supabase
      if (this.conversationId) {
        await addMessage(this.conversationId, 'assistant', response.message)
          .catch(error => console.error('Error storing assistant message:', error));
      }

      // Add to conversation history
      this.conversationHistory.push({
        role: 'assistant',
        content: response.message
      });
    } catch (error) {
      console.error('Error in handleGeneralQuery:', error);
      this.addAssistantMessage('Sorry, I encountered an error. Please try again later.');
    }
  }

  /**
   * Display product cards in chat
   * @param {Array} products - Products to display
   */
  displayProductCards(products) {
    // Create a container for product cards
    const productCardsContainer = document.createElement('div');
    productCardsContainer.className = 'product-cards-container';

    // Add up to 3 product cards
    const displayProducts = products.slice(0, 3);

    displayProducts.forEach(product => {
      const productCard = createProductCard(product, this.handleAddToCart.bind(this));
      productCardsContainer.appendChild(productCard);
    });

    // Add to messages container
    this.messagesContainer.appendChild(productCardsContainer);

    // Scroll to bottom
    this.scrollToBottom();
  }

  /**
   * Handle adding a product to cart
   * @param {Object} product - Product to add
   */
  async handleAddToCart(product) {
    if (!this.cartId || !product.variantId) {
      console.error('Cart ID or variant ID is missing');
      return;
    }

    try {
      this.setLoading(true);

      const lines = [{
        merchandiseId: product.variantId,
        quantity: 1
      }];

      const { cart, error } = await addToCart(this.cartId, lines);

      if (error) {
        throw new Error(error);
      }

      // Display success message
      this.addAssistantMessage(`I've added "${product.title}" to your cart.`);

      // Store message in Supabase
      if (this.conversationId) {
        await addMessage(this.conversationId, 'assistant', `I've added "${product.title}" to your cart.`)
          .catch(error => console.error('Error storing assistant message:', error));
      }

      // Update conversation history
      this.conversationHistory.push({
        role: 'assistant',
        content: `I've added "${product.title}" to your cart.`
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      this.addAssistantMessage('Sorry, I had trouble adding that item to your cart. Please try again later.');
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Add a user message to the chat
   * @param {string} content - Message content
   */
  addUserMessage(content) {
    const message = createMessage({
      content,
      role: 'user',
      timestamp: new Date()
    });

    this.messagesContainer.appendChild(message);
    this.scrollToBottom();
  }

  /**
   * Add an assistant message to the chat
   * @param {string} content - Message content
   */
  addAssistantMessage(content) {
    const message = createMessage({
      content,
      role: 'assistant',
      timestamp: new Date()
    });

    this.messagesContainer.appendChild(message);
    this.scrollToBottom();
  }

  /**
   * Set loading state
   * @param {boolean} isLoading - Loading state
   */
  setLoading(isLoading) {
    this.isLoading = isLoading;

    // Disable/enable input field and send button
    this.inputField.disabled = isLoading;
    this.sendButton.disabled = isLoading;

    // Remove existing loading indicator if any
    const existingIndicator = document.querySelector('.loading-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }

    // Add loading indicator if loading
    if (isLoading) {
      const loadingIndicator = document.createElement('div');
      loadingIndicator.className = 'loading-indicator';
      loadingIndicator.innerHTML = `
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
      `;

      this.messagesContainer.appendChild(loadingIndicator);
      this.scrollToBottom();
    }
  }

  /**
   * Toggle chat minimization
   */
  toggleChat() {
    this.isMinimized = !this.isMinimized;

    if (this.isMinimized) {
      this.messagesContainer.style.display = 'none';
      this.inputField.style.display = 'none';
      this.sendButton.style.display = 'none';
      this.container.classList.add('minimized');
      this.toggleButton.innerText = '+';
    } else {
      this.messagesContainer.style.display = 'flex';
      this.inputField.style.display = 'block';
      this.sendButton.style.display = 'block';
      this.container.classList.remove('minimized');
      this.toggleButton.innerText = '-';
    }
  }

  /**
   * Scroll to the bottom of the chat
   */
  scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }
}

/**
 * Create and initialize chat widget
 */
export const initChatWidget = () => {
  const chatWidget = new ChatWidget();
  chatWidget.init();
  return chatWidget;
};
