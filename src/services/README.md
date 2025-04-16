# Services Directory

This directory contains service modules for the AI Shopping Assistant application.

These services handle external API integrations and core functionality that is separate from the UI.

## Service Structure

- `appBridgeService.js` - Handles Shopify App Bridge integration
- `claudeService.js` - Handles communication with Claude AI API
- Additional services as needed for the application

Each service should follow these principles:
- Keep services focused on a single responsibility
- Implement proper error handling
- Use async/await for asynchronous operations
- Document public methods with JSDoc comments
