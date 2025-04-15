/**
 * Service for interacting with the Claude API
 */

/**
 * Send a message to Claude API
 * @param {string} message - The user message
 * @param {Array} conversationHistory - The conversation history
 * @param {Object} context - Additional context like product data
 * @returns {Promise<Object>} The Claude API response
 */
export const sendMessageToClaude = async (message, conversationHistory = [], context = {}) => {
  const apiKey = process.env.CLAUDE_API_KEY || '';

  if (!apiKey) {
    console.error('Missing Claude API key');
    return { error: 'Claude API key is missing' };
  }

  // Prepare the messages array for the API
  const messages = [
    ...formatConversationHistory(conversationHistory),
    {
      role: 'user',
      content: formatMessageWithContext(message, context),
    },
  ];

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 1024,
        messages,
        system: getSystemPrompt(),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Unknown error occurred');
    }

    const data = await response.json();
    return {
      message: data.content[0].text,
      messageId: data.id
    };
  } catch (error) {
    console.error('Error calling Claude API:', error);
    return { error: error.message };
  }
};

/**
 * Format conversation history for Claude API
 * @param {Array} history - Conversation history
 * @returns {Array} Formatted messages for Claude API
 */
const formatConversationHistory = (history) => {
  if (!history || !Array.isArray(history) || history.length === 0) {
    return [];
  }

  return history.map(entry => ({
    role: entry.role,
    content: entry.content,
  }));
};

/**
 * Format user message with context
 * @param {string} message - User message
 * @param {Object} context - Additional context
 * @returns {string} Formatted message
 */
const formatMessageWithContext = (message, context) => {
  // For simple messages without context
  if (!context || Object.keys(context).length === 0) {
    return message;
  }

  let formattedMessage = message;

  // Add product context if available
  if (context.products && context.products.length > 0) {
    formattedMessage += '\n\nAvailable products:\n';
    context.products.forEach((product, index) => {
      formattedMessage += `\n${index + 1}. ${product.title} - ${product.price} ${product.currencyCode}`;
      if (product.description) {
        formattedMessage += `\n   Description: ${product.description.substring(0, 100)}${product.description.length > 100 ? '...' : ''}`;
      }
    });
  }

  // Add cart context if available
  if (context.cart && context.cart.lines && context.cart.lines.edges) {
    formattedMessage += '\n\nCurrent cart:\n';
    context.cart.lines.edges.forEach((edge, index) => {
      const item = edge.node;
      formattedMessage += `\n${index + 1}. ${item.merchandise.product.title} - Quantity: ${item.quantity}`;
    });

    if (context.cart.estimatedCost && context.cart.estimatedCost.totalAmount) {
      formattedMessage += `\n\nTotal: ${context.cart.estimatedCost.totalAmount.amount} ${context.cart.estimatedCost.totalAmount.currencyCode}`;
    }
  }

  return formattedMessage;
};

/**
 * Get the system prompt for Claude
 * @returns {string} The system prompt
 */
const getSystemPrompt = () => {
  return `You are a helpful shopping assistant for an online store. Your purpose is to help customers find products, answer questions about products, and help them make purchases.

- Always respond in British English, using a friendly and helpful tone.
- When recommending products, be specific and reference their attributes.
- If asked about adding products to the cart, respond positively and confirm the action.
- If a customer asks for help finding a product, ask clarifying questions about what they're looking for.
- Don't make up information about products that aren't in the provided context.
- Keep responses concise but informative.

When asked about product details, price, or availability, only use the information provided in the context. If the information isn't available, ask the customer for more details or suggest searching for specific products.`;
};

/**
 * Check if message appears to be a product search
 * @param {string} message - User message
 * @returns {boolean} Whether the message is a product search
 */
export const isProductSearch = (message) => {
  if (!message) return false;

  const lowercasedMessage = message.toLowerCase();

  const searchPhrases = [
    'looking for',
    'search for',
    'find',
    'do you have',
    'i want',
    'i need',
    'show me',
    'where can i find',
    'where are',
    'got any',
    'recommend',
    'suggestion'
  ];

  return searchPhrases.some(phrase => lowercasedMessage.includes(phrase));
};

/**
 * Extract search terms from a message
 * @param {string} message - User message
 * @returns {string} Extracted search terms
 */
export const extractSearchTerms = (message) => {
  if (!message) return '';

  // Remove common question prefixes
  const cleanMessage = message
    .replace(/^(can you|could you|would you|please|hi|hello|hey)[\s,]+/i, '')
    .replace(/^(i'm|im|i am)[\s,]+/i, '')
    .replace(/^(looking for|search for|find|do you have|i want|i need|show me|where can i find|where are|got any)[\s,]*/i, '');

  return cleanMessage;
};
