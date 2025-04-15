# AI Shopping Assistant for Shopify

A powerful AI-powered shopping assistant for Shopify stores using Anthropic's Claude API, Shopify Storefront API, and Supabase backend.

## Features

- **Natural Language Interaction**: Allows customers to ask questions and get product recommendations through a chat interface.
- **Product Search**: Intelligently searches for products based on customer queries.
- **Cart Management**: Helps customers add products to their cart directly from the chat.
- **Personalized Recommendations**: Provides tailored product suggestions using Claude AI.
- **British English Localization**: All responses are in British English for a consistent experience.
- **Responsive Design**: Works well on all devices, from desktop to mobile.

## Technology Stack

- **Frontend**: Pure vanilla JavaScript with no framework dependencies
- **AI**: Claude Anthropic API for natural language processing
- **E-commerce**: Shopify Storefront API (GraphQL) for product and cart management
- **Backend**: Supabase for storing conversations and user preferences
- **Integration**: Shopify App Bridge for secure embedding in Shopify stores

## Prerequisites

Before setting up the project, you'll need:

1. A Shopify Partner account
2. A Shopify development store
3. A Supabase account
4. An Anthropic Claude API key

## Setup Instructions

### 1. Shopify Setup

1. Create a new app in your Shopify Partner Dashboard
2. Configure the app URLs and redirect URLs
3. Note down your API key and API secret
4. Generate a Storefront API access token with the required scopes:
   - `unauthenticated_read_product_listings`
   - `unauthenticated_read_product_inventory`
   - `unauthenticated_write_checkouts`
   - `unauthenticated_read_checkouts`

### 2. Supabase Setup

1. Create a new Supabase project
2. Run the SQL setup script in `src/sql/setup.sql` in the Supabase SQL Editor
3. Note down your Supabase URL and anon key

### 3. Claude API Setup

1. Sign up for an Anthropic Claude API account
2. Generate an API key
3. Note down your API key

### 4. Project Setup

1. Clone this repository
2. Create a `.env.local` file based on the `.env.example` template:
   ```
   SHOPIFY_API_KEY=your_shopify_api_key
   SHOPIFY_API_SECRET=your_shopify_api_secret
   SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_storefront_access_token
   SHOPIFY_STORE_URL=your-store.myshopify.com

   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key

   CLAUDE_API_KEY=your_claude_api_key
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

### Testing Locally

1. Open `http://localhost:3000/test.html` in your browser
2. Enter your API keys in the settings panel
3. Interact with the chat widget to test its functionality

### Integration in Shopify

1. Build the project:
   ```bash
   npm run build
   ```
2. Deploy the `public` directory to your hosting service
3. Add the script to your Shopify theme:
   ```html
   <script src="https://your-deployed-url.com/bundle.js"></script>
   ```

## Customization

### Styling

You can customize the appearance of the chat widget by modifying the CSS variables in `public/styles.css`:

```css
:root {
  --primary-color: #5c6ac4;
  --secondary-color: #202e78;
  /* Other variables */
}
```

### Prompt Engineering

Modify the system prompt for Claude in `src/services/claudeService.js` to customize the AI's behavior and personality.

## Development

### Project Structure

- `src/components/`: UI components
- `src/services/`: API services (Shopify, Claude, Supabase)
- `src/utils/`: Utility functions
- `src/sql/`: SQL setup scripts for Supabase
- `public/`: Static assets and built files

### Build Process

1. Development: `npm run dev`
2. Production build: `npm run build`
3. Lint code: `npm run lint`

## Future Enhancements

- Add user authentication for personalized experiences
- Implement product image recognition
- Add voice interface capabilities
- Support for additional languages
- Integration with Shopify checkout and order history

## License

This project is licensed under the ISC License.

## Support

For support or questions, please open an issue in this repository.
