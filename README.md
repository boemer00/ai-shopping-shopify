# AI Shopping Assistant

An intelligent shopping assistant that helps users find products through a simple search interface. This application can be used standalone or integrated with Shopify.

![AI Shopping Assistant](https://example.com/screenshot.png)

## Features

- Simple and intuitive search interface
- Responsive design that works on desktop and mobile
- Sample product data with images
- Loading indicators and helpful messages
- Easily extensible to connect to real product APIs

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ai-shopping-shopify.git
   cd ai-shopping-shopify
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file based on `.env.example`:
   ```bash
   cp .env.example .env.local
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:8000](http://localhost:8000) in your browser.

## Usage

1. Enter a search term in the search box (e.g., "headphones", "camera", "wallet")
2. Click the "Search" button or press Enter
3. View the search results displayed as product cards
4. Click on a product to view more details

## Testing Claude API Integration

To test the Claude API integration:

1. Visit [http://localhost:8000/claude-test](http://localhost:8000/claude-test)
2. Enter your Claude API key (you can get one from [Anthropic](https://www.anthropic.com/))
3. Type a message or use the default one
4. Click "Send to Claude" to test the API connection

## Project Structure

```
├── public/           # Static assets and bundled output
├── src/              # Source code
│   ├── components/   # UI components
│   ├── js/           # JavaScript files
│   ├── services/     # API and service integrations
│   ├── styles/       # CSS styles
│   └── index.html    # Main HTML file
├── .env.example      # Example environment variables
├── package.json      # Project dependencies
├── webpack.config.js # Webpack configuration
└── README.md         # This file
```

## Integrating with Shopify

This application can be integrated with Shopify to display real product data. To enable Shopify integration:

1. Create a Shopify app in the Shopify Partner Dashboard
2. Update the `.env.local` file with your Shopify API credentials
3. Run the application in integrated mode

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Images provided by [Unsplash](https://unsplash.com/)
- Icons by [Feather Icons](https://feathericons.com/)
