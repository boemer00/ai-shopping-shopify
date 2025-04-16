import { formatDate } from '../utils/helpers';
import { createConversation, addMessage, getMessages } from '../services/supabaseService';

/**
 * Initialize the chat widget
 * @returns {Object} The chat widget instance
 */
export const initChatWidget = () => {
  console.log('Initializing chat widget...');

  // Check if DOM is ready
  if (document.readyState === 'loading') {
    console.log('Document still loading, deferring chat widget initialization');
    return null;
  }

  const chatWidget = new ChatWidget();

  // Initialize async with setTimeout to ensure DOM is fully ready
  setTimeout(() => {
    chatWidget.init();
  }, 100);

  console.log('Chat widget initialized');
  return chatWidget;
};

/**
 * Chat Widget Component
 */
class ChatWidget {
  constructor() {
    this.container = null;
    this.messagesContainer = null;
    this.inputField = null;
    this.sendButton = null;
    this.toggleButton = null;
    this.isMinimized = false;
    this.isLoading = false;
    this.conversationHistory = [];
    this.initialized = false;
    this.conversationId = null;
    this.shopId = this.getShopId();
    this.customerId = this.getCustomerId();
    console.log('ChatWidget constructed');
  }

  /**
   * Get shop ID from the URL or window object
   * @returns {string} The shop ID
   */
  getShopId() {
    // Try to get from query string first
    const url = new URL(window.location.href);
    const shopOrigin = url.searchParams.get('shop');

    if (shopOrigin) {
      return shopOrigin;
    }

    // Try to get from window variable
    if (window.SHOPIFY_STORE_URL) {
      return window.SHOPIFY_STORE_URL;
    }

    // Fallback to ancestor origins if in iframe
    if (window.location.ancestorOrigins && window.location.ancestorOrigins[0]) {
      const ancestorUrl = new URL(window.location.ancestorOrigins[0]);
      return ancestorUrl.hostname;
    }

    // Default for development
    return process.env.SHOPIFY_STORE_URL || 'test-store-tailor-ai.myshopify.com';
  }

  /**
   * Get customer ID if available
   * @returns {string|null} The customer ID or null
   */
  getCustomerId() {
    // For now, we'll just use a placeholder
    // In a real implementation, this would come from the Shopify customer data
    return null;
  }

  /**
   * Initialize the chat widget
   */
  async init() {
    try {
      // If already initialized, don't do it again
      if (this.initialized) {
        console.log('ChatWidget already initialized, skipping');
        return;
      }

      console.log('Starting ChatWidget.init()');

      // Find chat container or create it if it doesn't exist
      this.container = document.getElementById('ai-shopping-assistant');
      console.log('Container found:', !!this.container);

      // If container doesn't exist, create it
      if (!this.container) {
        console.log('Creating container as it does not exist');
        this.container = this.createChatContainer();
        document.body.appendChild(this.container);
        console.log('Container created and appended to body');
      }

      // Get references to elements within the container
      this.messagesContainer = document.getElementById('chat-messages');
      this.inputField = document.getElementById('chat-input');
      this.sendButton = document.getElementById('send-message');
      this.toggleButton = document.getElementById('toggle-chat');

      console.log('Elements found:',
        'messagesContainer:', !!this.messagesContainer,
        'inputField:', !!this.inputField,
        'sendButton:', !!this.sendButton,
        'toggleButton:', !!this.toggleButton
      );

      // If elements still not found, try to find them within the container directly
      if (!this.messagesContainer || !this.inputField || !this.sendButton || !this.toggleButton) {
        console.log('Some elements not found by ID, trying to find within container');

        if (!this.messagesContainer) {
          this.messagesContainer = this.container.querySelector('.chat-messages');
        }

        if (!this.inputField) {
          this.inputField = this.container.querySelector('input[type="text"]');
        }

        if (!this.sendButton) {
          this.sendButton = this.container.querySelector('button:not(.toggle-button)');
        }

        if (!this.toggleButton) {
          this.toggleButton = this.container.querySelector('.toggle-button');
        }

        console.log('Elements after container search:',
          'messagesContainer:', !!this.messagesContainer,
          'inputField:', !!this.inputField,
          'sendButton:', !!this.sendButton,
          'toggleButton:', !!this.toggleButton
        );
      }

      // If we still couldn't find all elements, log an error and return
      if (!this.messagesContainer || !this.inputField || !this.sendButton || !this.toggleButton) {
        console.error('ChatWidget initialization failed - critical elements not found');
        return;
      }

      // Create a new conversation in Supabase
      await this.createNewConversation();

      // Set up event listeners
      this.setupEventListeners();

      // Load previous messages if available
      await this.loadMessages();

      // Add welcome message if no previous messages
      if (this.conversationHistory.length === 0 && this.messagesContainer) {
        this.addWelcomeMessageDirect();
      }

      this.initialized = true;
      console.log('ChatWidget initialization completed');
    } catch (error) {
      console.error('Error in ChatWidget.init():', error);
    }
  }

  /**
   * Create a new conversation in Supabase
   */
  async createNewConversation() {
    try {
      if (!this.shopId) {
        console.warn('Shop ID not available, using default');
        this.shopId = 'default-shop';
      }

      console.log('Creating new conversation with shop ID:', this.shopId);
      const { conversation, error } = await createConversation(this.shopId, this.customerId);

      if (error) {
        console.error('Error creating conversation:', error);
        return;
      }

      if (conversation) {
        this.conversationId = conversation.id;
        console.log('New conversation created with ID:', this.conversationId);
      }
    } catch (error) {
      console.error('Error in createNewConversation:', error);
    }
  }

  /**
   * Load previous messages from Supabase
   */
  async loadMessages() {
    try {
      if (!this.conversationId) {
        console.warn('No conversation ID available, skipping message loading');
        return;
      }

      console.log('Loading messages for conversation:', this.conversationId);
      const { messages, error } = await getMessages(this.conversationId);

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      if (messages && messages.length > 0) {
        console.log(`Loaded ${messages.length} messages from Supabase`);

        // Clear existing messages in UI
        this.messagesContainer.innerHTML = '';

        // Add messages to UI and conversation history
        this.conversationHistory = [];

        messages.forEach(message => {
          this.conversationHistory.push({
            role: message.role,
            content: message.content
          });

          if (message.role === 'user') {
            this.addUserMessageDirect(message.content);
          } else if (message.role === 'assistant') {
            this.addAssistantMessageDirect(message.content);
          }
        });

        console.log('Messages loaded and displayed');
      } else {
        console.log('No previous messages found');
      }
    } catch (error) {
      console.error('Error in loadMessages:', error);
    }
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
    try {
      // Check if elements exist before adding event listeners
      if (!this.sendButton || !this.inputField || !this.toggleButton) {
        console.error('Cannot set up event listeners - UI elements not found:', {
          sendButton: !this.sendButton,
          inputField: !this.inputField,
          toggleButton: !this.toggleButton
        });
        return;
      }

      // Send message when button is clicked
      try {
        this.sendButton.addEventListener('click', () => {
          this.handleSendMessage();
        });
        console.log('Added click listener to send button');
      } catch (error) {
        console.error('Error adding click listener to send button:', error);
      }

      // Send message when Enter key is pressed
      try {
        this.inputField.addEventListener('keypress', (event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            this.handleSendMessage();
          }
        });
        console.log('Added keypress listener to input field');
      } catch (error) {
        console.error('Error adding keypress listener to input field:', error);
      }

      // Toggle chat minimization
      try {
        this.toggleButton.addEventListener('click', () => {
          this.toggleChat();
        });
        console.log('Added click listener to toggle button');
      } catch (error) {
        console.error('Error adding click listener to toggle button:', error);
      }

      console.log('Event listeners successfully set up');
    } catch (error) {
      console.error('Error in setupEventListeners:', error);
    }
  }

  /**
   * Add welcome message to the chat (direct HTML injection)
   */
  addWelcomeMessageDirect() {
    console.log('Adding welcome message directly');

    if (!this.messagesContainer) {
      console.error('messagesContainer is null - cannot add welcome message');
      return;
    }

    // Create the date string manually
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][now.getMonth()];
    const year = now.getFullYear();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const dateString = `${day} ${month} ${year}, ${hours}:${minutes}`;

    // Create element directly
    const messageElement = document.createElement('div');
    messageElement.className = 'message assistant-message';

    messageElement.innerHTML = `
      <div class="message-content">
        <p>Hello! I'm your shopping assistant. How can I help you today?</p>
      </div>
      <div class="message-time">${dateString}</div>
    `;

    this.messagesContainer.appendChild(messageElement);
    console.log('Welcome message element added to container');

    // Add to conversation history
    this.conversationHistory.push({
      role: 'assistant',
      content: "Hello! I'm your shopping assistant. How can I help you today?"
    });

    // Save welcome message to Supabase
    this.saveMessageToSupabase('assistant', "Hello! I'm your shopping assistant. How can I help you today?");
  }

  /**
   * Save message to Supabase
   * @param {string} role - The message role (user or assistant)
   * @param {string} content - The message content
   */
  async saveMessageToSupabase(role, content) {
    try {
      if (!this.conversationId) {
        console.warn('No conversation ID available, cannot save message');
        return;
      }

      console.log(`Saving ${role} message to Supabase:`, content.substring(0, 30) + '...');
      const { message, error } = await addMessage(this.conversationId, role, content);

      if (error) {
        console.error('Error saving message to Supabase:', error);
        return;
      }

      console.log('Message saved successfully with ID:', message?.id);
    } catch (error) {
      console.error('Error in saveMessageToSupabase:', error);
    }
  }

  /**
   * Handle sending a message
   */
  async handleSendMessage() {
    const message = this.inputField.value.trim();

    if (!message || this.isLoading) {
      return;
    }

    // Clear input field
    this.inputField.value = '';

    console.log('Handling send message:', message);

    // Directly add user message to chat
    this.addUserMessageDirect(message);

    // Add to conversation history
    this.conversationHistory.push({
      role: 'user',
      content: message
    });

    // Save user message to Supabase
    await this.saveMessageToSupabase('user', message);

    // Show loading indicator
    this.setLoading(true);

    try {
      // Prepare the request body
      const requestBody = {
        model: "claude-3-7-sonnet-20250219",
        max_tokens: 1024,
        messages: [
          ...this.conversationHistory
        ]
      };

      console.log('Sending request to Claude API with body:', JSON.stringify(requestBody));

      // Call the Claude API through our server proxy endpoint
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Claude API response status:', response.status);

      // Get response text for debugging
      const responseText = await response.text();
      console.log('Claude API raw response:', responseText);

      // Parse the response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse JSON response:', e);
        throw new Error('Invalid JSON response from server');
      }

      if (!response.ok) {
        console.error('Error response from API:', data);
        throw new Error(`API responded with status ${response.status}: ${JSON.stringify(data)}`);
      }

      console.log('Parsed Claude API response:', data);

      if (!data.content || !data.content[0] || !data.content[0].text) {
        console.error('Unexpected response format:', data);
        throw new Error('Invalid response format from API');
      }

      const assistantResponse = data.content[0].text;
      console.log('Assistant response:', assistantResponse);

      // Add to conversation history
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantResponse
      });

      // Save assistant message to Supabase
      await this.saveMessageToSupabase('assistant', assistantResponse);

      // Directly add assistant message
      this.addAssistantMessageDirect(assistantResponse);

    } catch (error) {
      console.error('Error processing message:', error);

      // Add error message directly
      this.addAssistantMessageDirect('Sorry, I encountered an error. Please try again later. Technical details: ' + error.message);

      // Save error message to Supabase
      await this.saveMessageToSupabase('assistant', 'Sorry, I encountered an error. Please try again later. Technical details: ' + error.message);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Add a user message directly to the chat
   * @param {string} message - User message
   */
  addUserMessageDirect(message) {
    console.log('Adding user message directly:', message);

    // Create the date string manually
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][now.getMonth()];
    const year = now.getFullYear();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const dateString = `${day} ${month} ${year}, ${hours}:${minutes}`;

    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = 'message user-message';

    // Escape HTML in the message
    const escapedMessage = this.escapeHtml(message);

    messageElement.innerHTML = `
      <div class="message-content">
        <p>${escapedMessage}</p>
      </div>
      <div class="message-time">${dateString}</div>
    `;

    this.messagesContainer.appendChild(messageElement);
    this.scrollToBottom();
  }

  /**
   * Add an assistant message directly to the chat
   * @param {string} message - Assistant message
   */
  addAssistantMessageDirect(message) {
    console.log('Adding assistant message directly:', message);

    // Create the date string manually
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][now.getMonth()];
    const year = now.getFullYear();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const dateString = `${day} ${month} ${year}, ${hours}:${minutes}`;

    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = 'message assistant-message';

    // Format message with basic formatting
    const formattedMessage = this.formatMessageText(message);

    messageElement.innerHTML = `
      <div class="message-content">
        <p>${formattedMessage}</p>
      </div>
      <div class="message-time">${dateString}</div>
    `;

    this.messagesContainer.appendChild(messageElement);
    this.scrollToBottom();
  }

  /**
   * Set the loading state
   * @param {boolean} isLoading - Whether the widget is in loading state
   */
  setLoading(isLoading) {
    this.isLoading = isLoading;

    if (isLoading) {
      const loadingElement = document.createElement('div');
      loadingElement.className = 'message assistant-message loading';
      loadingElement.innerHTML = '<div class="loading-indicator"><span></span><span></span><span></span></div>';
      loadingElement.id = 'loading-message';
      this.messagesContainer.appendChild(loadingElement);
      this.scrollToBottom();
    } else {
      const loadingElement = document.getElementById('loading-message');
      if (loadingElement) {
        loadingElement.remove();
      }
    }
  }

  /**
   * Scroll the messages container to the bottom
   */
  scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  /**
   * Format message text with basic Markdown-like formatting
   * @param {string} text - Raw text
   * @returns {string} Formatted HTML
   */
  formatMessageText(text) {
    if (!text) return '';

    // Escape HTML first
    let formattedText = this.escapeHtml(text);

    // Simple link formatting
    formattedText = formattedText.replace(
      /\[(.*?)\]\((https?:\/\/.*?)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // Convert line breaks to <br>
    formattedText = formattedText.replace(/\n/g, '<br>');

    return formattedText;
  }

  /**
   * Escape HTML special characters
   * @param {string} text - Raw text
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    if (!text) return '';

    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Toggle chat minimization
   */
  toggleChat() {
    this.isMinimized = !this.isMinimized;

    if (this.isMinimized) {
      this.container.classList.add('minimized');
      this.toggleButton.textContent = '+';
    } else {
      this.container.classList.remove('minimized');
      this.toggleButton.textContent = '-';
    }
  }
}
