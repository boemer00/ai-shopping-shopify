require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 8000;

// Get allowed origins for CORS
const getAllowedOrigins = () => {
  const origins = [
    'http://localhost:8000',
    'http://localhost:8082',
    'https://ai-shopping-shopify.vercel.app'
  ];

  // Add custom domain if specified in env
  if (process.env.APP_URL) {
    origins.push(process.env.APP_URL);
  }

  // Add the Shopify store URL if it exists
  if (process.env.SHOPIFY_STORE_URL) {
    const storeUrl = process.env.SHOPIFY_STORE_URL.replace('.myshopify.com', '');
    origins.push(`https://${storeUrl}.myshopify.com`);
    origins.push(`https://${process.env.SHOPIFY_STORE_URL}`);
  }

  // For embedded usage in any Shopify store
  origins.push('https://*.myshopify.com');

  return origins;
};

// Configure CORS
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = getAllowedOrigins();

    // In development, log the origin for debugging
    if (process.env.NODE_ENV !== 'production') {
      console.log('Request origin:', origin);
    }

    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) {
      callback(null, true);
      return;
    }

    // Allow any myshopify.com domain
    if (origin.includes('myshopify.com')) {
      callback(null, true);
      return;
    }

    // Check against allowlist
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked for origin:', origin);
      callback(null, false);
    }
  },
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve source files during development
if (process.env.NODE_ENV !== 'production') {
  app.use('/src', express.static(path.join(__dirname, 'src')));
}

// Claude API proxy endpoint
app.post('/api/claude', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'] || process.env.CLAUDE_API_KEY;

    console.log('Claude API request received', {
      hasApiKey: !!apiKey,
      bodyHasModel: !!req.body.model,
      bodyHasMessages: !!req.body.messages,
      messageCount: req.body.messages ? req.body.messages.length : 0
    });

    if (!apiKey) {
      console.error('Missing Claude API key');
      return res.status(400).json({ error: { message: 'API key is required' } });
    }

    console.log('Forwarding request to Claude API with model:', req.body.model);

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    });

    console.log('Claude API responded with status:', claudeResponse.status);

    const data = await claudeResponse.json();

    if (!claudeResponse.ok) {
      console.error('Claude API error:', data);
      return res.status(claudeResponse.status).json(data);
    }

    console.log('Claude API successful response with message:',
      data.content && data.content[0] ? data.content[0].text.substring(0, 50) + '...' : 'No content');

    return res.json(data);
  } catch (error) {
    console.error('Error proxying to Claude API:', error);
    res.status(500).json({ error: { message: error.message } });
  }
});

// Main route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Embed route for Shopify storefront integration
app.get('/embed', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'embed.html'));
});

// Test page route
app.get('/test', (req, res) => {
  const testFilePath = path.join(__dirname, 'public', 'test.html');

  // Check if file exists before sending
  if (require('fs').existsSync(testFilePath)) {
    console.log(`Serving test file from: ${testFilePath}`);
    res.sendFile(testFilePath);
  } else {
    console.error(`Test file not found at: ${testFilePath}`);
    res.status(404).send(`
      <h1>Test File Not Found</h1>
      <p>The test.html file could not be found at ${testFilePath}</p>
      <p>Current directory: ${__dirname}</p>
      <p>Files in public directory:</p>
      <pre>${require('fs').readdirSync(path.join(__dirname, 'public')).join('\n')}</pre>
    `);
  }
});

// Claude API test page
app.get('/claude-test', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'claude-test.html'));
});

// API test page
app.get('/api-test', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'api-test.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: require('./package.json').version,
    deployment: 'vercel'
  });
});

// Simple API test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API test endpoint is working',
    timestamp: new Date().toISOString(),
    env: {
      hasClaudeKey: !!process.env.CLAUDE_API_KEY,
      hasSupabaseKey: !!process.env.SUPABASE_KEY,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      nodeEnv: process.env.NODE_ENV || 'not set'
    }
  });
});

// Shopify storefront settings endpoint
app.get('/api/shopify-settings', (req, res) => {
  // Verify the request is coming from a valid Shopify store
  const shop = req.query.shop;

  if (!shop || !shop.includes('myshopify.com')) {
    return res.status(400).json({ error: 'Invalid shop parameter' });
  }

  // Return public settings for the widget
  res.json({
    shopUrl: process.env.SHOPIFY_STORE_URL || shop,
    appUrl: process.env.APP_URL || 'https://ai-shopping-shopify.vercel.app',
    hasStorefrontToken: !!process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
    hasClaudeKey: !!process.env.CLAUDE_API_KEY
  });
});

// For Vercel serverless functions, we don't need to explicitly listen
// But we keep this for local development
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Test page available at http://localhost:${PORT}/test`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

// Export for Vercel serverless deployment
module.exports = app;
