import { formatDate } from '../utils/helpers';
import { createConversation, addMessage, getMessages } from '../services/supabaseService';
import { saveConversation, loadConversation } from '../utils/storage';

/**
 * Initialize the chat widget
 * @returns {Object} The chat widget instance
 */
export const initChatWidget = () => {
  console.log('Initializing chat widget...');

  // Create widget instance
  const chatWidget = new ChatWidget();

  // Define initialization function
  const go = () => {
    // Initialize async with setTimeout to ensure DOM is fully ready
    setTimeout(() => {
      chatWidget.init();
    }, 100);
  };

  // Run initialization based on document state
  if (document.readyState === 'loading') {
    console.log('Document still loading, will initialize when DOM content loaded');
    document.addEventListener('DOMContentLoaded', go);
  } else {
    console.log('Document already loaded, initializing now');
    go();
  }

  console.log('Chat widget initialization scheduled');
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

      // When using a pre-existing container, check if it already has the chat interface
      const hasRequiredElements =
        this.container.querySelector('.chat-messages') &&
        this.container.querySelector('input[type="text"]') &&
        this.container.querySelector('button:not(.toggle-button)') &&
        this.container.querySelector('.toggle-button');

      // If container exists but doesn't have the required elements, add them
      if (!hasRequiredElements) {
        console.log('Container exists but missing required elements, adding chat interface');
        // Save any existing content that might be a loading indicator
        const existingContent = this.container.innerHTML;
        this.container.innerHTML = `
          <div class="chat-widget-header">
            <h3>Shopping Assistant</h3>
            <button id="toggle-chat" class="toggle-button">-</button>
          </div>
          <div class="chat-messages" id="chat-messages">
          </div>
          <div class="chat-input-container">
            <input type="text" id="chat-input" placeholder="Ask about products...">
            <button id="send-message">Send</button>
          </div>
        `;
      }

      // Get references to elements within the container directly
      this.messagesContainer = this.container.querySelector('.chat-messages');
      this.inputField = this.container.querySelector('input[type="text"]');
      this.sendButton = this.container.querySelector('button:not(.toggle-button)');
      this.toggleButton = this.container.querySelector('.toggle-button');

      console.log('Elements found:',
        'messagesContainer:', !!this.messagesContainer,
        'inputField:', !!this.inputField,
        'sendButton:', !!this.sendButton,
        'toggleButton:', !!this.toggleButton
      );

      // If we still couldn't find all elements, log an error and return
      if (!this.messagesContainer || !this.inputField || !this.sendButton || !this.toggleButton) {
        console.error('ChatWidget initialization failed - critical elements not found');
        return;
      }

      // Remove any loading indicators that might be present
      const loadingIndicators = this.messagesContainer.querySelectorAll('.loading-indicator');
      if (loadingIndicators.length > 0) {
        console.log(`Removing ${loadingIndicators.length} loading indicators before initialization`);
        loadingIndicators.forEach(indicator => indicator.remove());
      }

      // Try to restore conversation from storage first
      console.log('Attempting to restore conversation from localStorage...');
      const restored = this.restoreConversationFromStorage();

      if (!restored) {
        // If we couldn't restore, create a new conversation in Supabase
        console.log('No existing conversation found in localStorage, creating a new one');
        await this.createNewConversation();

        // Load previous messages if available (unlikely in this case)
        await this.loadMessages();

        // Add welcome message if no previous messages and no existing welcome message
        const hasExistingMessages = this.conversationHistory.length > 0;
        const hasWelcomeMessageInDOM = this.messagesContainer.querySelector('.assistant-message') !== null;

        if (!hasExistingMessages && !hasWelcomeMessageInDOM && this.messagesContainer) {
          console.log('No messages found, adding welcome message');
          this.addWelcomeMessageDirect();
        } else {
          console.log('Skipping welcome message, conversation already has messages');
        }
      } else {
        console.log('Successfully restored existing conversation');

        // If we have a conversation ID but no history (from cookie), load messages from Supabase
        if (this.conversationId && this.conversationHistory.length === 0) {
          console.log('Found conversation ID but no history, loading messages from Supabase');
          await this.loadMessages();

          // If still no messages, this might be a new conversation
          if (this.conversationHistory.length === 0) {
            console.log('No messages found after loading, adding welcome message');
            this.addWelcomeMessageDirect();
          }
        }
      }

      // Set up event listeners
      this.setupEventListeners();

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

        // Save to localStorage immediately after creating a new conversation
        this.saveConversationToStorage();
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

        // Save to localStorage to ensure persistence across page loads
        this.saveConversationToStorage();
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

    // Check if welcome message already exists to prevent duplicates
    const existingWelcomeMessages = this.messagesContainer.querySelectorAll('.assistant-message');
    if (existingWelcomeMessages.length > 0) {
      console.log('Welcome message already exists, skipping to prevent duplicates');
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

    // Save conversation to localStorage to persist across page navigation
    this.saveConversationToStorage();
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

    // Save conversation to localStorage to persist across page navigation
    this.saveConversationToStorage();

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

      // Save updated conversation to localStorage
      this.saveConversationToStorage();

    } catch (error) {
      console.error('Error processing message:', error);

      // Add error message directly
      this.addAssistantMessageDirect('Sorry, I encountered an error. Please try again later. Technical details: ' + error.message);

      // Save error message to Supabase
      await this.saveMessageToSupabase('assistant', 'Sorry, I encountered an error. Please try again later. Technical details: ' + error.message);

      // Save conversation with error message to localStorage
      this.saveConversationToStorage();
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Add a user message directly to the chat
   * @param {string} message - User message
   * @param {boolean} shouldScroll - Whether to scroll to bottom after adding message
   */
  addUserMessageDirect(message, shouldScroll = true) {
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
    if (shouldScroll) {
      this.scrollToBottom();
    }
  }

  /**
   * Add an assistant message directly to the chat
   * @param {string} message - Assistant message
   * @param {boolean} shouldScroll - Whether to scroll to bottom after adding message
   */
  addAssistantMessageDirect(message, shouldScroll = true) {
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
    if (shouldScroll) {
      this.scrollToBottom();
    }
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

  /**
   * Save conversation state to localStorage
   * This allows us to maintain conversation across page navigation
   */
  saveConversationToStorage() {
    try {
      // Don't save if no conversation ID
      if (!this.conversationId) {
        console.warn('No conversation ID available, cannot save to localStorage');
        return;
      }

      // Ensure we have a valid shop ID
      if (!this.shopId) {
        console.warn('No shop ID available, using default for localStorage');
        this.shopId = 'default-shop';
      }

      const conversationData = {
        conversationId: this.conversationId,
        shopId: this.shopId,
        customerId: this.customerId,
        conversationHistory: this.conversationHistory,
        timestamp: new Date().getTime()
      };

      // Use our utility function to save to both localStorage and cookie
      saveConversation(conversationData);

      console.log(`Conversation saved: ID ${this.conversationId} with ${this.conversationHistory.length} messages`);
    } catch (error) {
      console.error('Error saving conversation to storage:', error);
    }
  }

  /**
   * Restore conversation from localStorage
   * @returns {boolean} Whether restoration was successful
   */
  restoreConversationFromStorage() {
    try {
      // Use our utility function to load from localStorage or cookie
      const result = loadConversation();

      if (!result) {
        console.log('No stored conversation found');
        return false;
      }

      const { source, data, conversationId } = result;

      if (source === 'localStorage' && data) {
        // Check if data is still valid (not older than 24 hours)
        const now = new Date().getTime();
        const storedTime = data.timestamp || 0;
        const hoursSinceStored = (now - storedTime) / (1000 * 60 * 60);

        if (hoursSinceStored > 24) {
          console.log('Stored conversation is too old (>24 hours), starting a new one');
          return false;
        }

        // Restore full data from localStorage
        this.conversationId = data.conversationId;
        this.shopId = data.shopId || this.shopId;
        this.customerId = data.customerId || this.customerId;
        this.conversationHistory = data.conversationHistory || [];

        // Display messages from history in the UI
        this.displayConversationHistory();

        console.log('Conversation restored from localStorage:',
          this.conversationId,
          `(${this.conversationHistory.length} messages)`
        );
        return true;
      }
      else if (source === 'cookie') {
        // We only have the ID from cookie, set it and return true
        // Messages will be loaded from Supabase later
        this.conversationId = conversationId;
        console.log('Found conversationId in cookie:', conversationId);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error restoring conversation from storage:', error);
      return false;
    }
  }

  /**
   * Display conversation history in the chat UI
   */
  displayConversationHistory() {
    if (!this.messagesContainer || !this.conversationHistory || this.conversationHistory.length === 0) {
      console.log('Nothing to display: messagesContainer, conversationHistory, or messages missing');
      return;
    }

    console.log(`Displaying ${this.conversationHistory.length} messages from restored conversation ${this.conversationId}`);

    // Clear existing messages and loading indicators
    this.messagesContainer.innerHTML = '';

    // Add each message to the UI
    this.conversationHistory.forEach((message, index) => {
      if (message.role === 'user') {
        this.addUserMessageDirect(message.content, false); // Don't scroll on each message
      } else if (message.role === 'assistant') {
        this.addAssistantMessageDirect(message.content, false); // Don't scroll on each message
      }
    });

    // Scroll to bottom after adding all messages
    setTimeout(() => this.scrollToBottom(), 100);
  }
}
