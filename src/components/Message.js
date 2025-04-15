import { formatDate } from '../utils/helpers';

/**
 * Create a message element
 * @param {Object} options - Message options
 * @param {string} options.content - Message content
 * @param {string} options.role - Message role (user or assistant)
 * @param {Date} options.timestamp - Message timestamp
 * @returns {HTMLElement} Message element
 */
export const createMessage = (options) => {
  const { content, role = 'assistant', timestamp = new Date() } = options;

  const message = document.createElement('div');
  message.className = `message ${role}-message`;

  // Check if content contains links and make them clickable
  const formattedContent = formatContentWithLinks(content);

  message.innerHTML = `
    <div class="message-content">${formattedContent}</div>
    <div class="message-time">${formatDate(timestamp)}</div>
  `;

  return message;
};

/**
 * Format message content with clickable links
 * @param {string} content - Message content
 * @returns {string} Formatted content with clickable links
 */
const formatContentWithLinks = (content) => {
  if (!content) return '';

  // Replace URLs with anchor tags
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const withLinks = content.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });

  // Replace line breaks with <br>
  return withLinks.replace(/\n/g, '<br>');
};
