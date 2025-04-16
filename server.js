require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
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
  res.sendFile(path.join(__dirname, 'src', 'index.html'));
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
  res.json({ status: 'ok', uptime: process.uptime() });
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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Test page available at http://localhost:${PORT}/test`);
});
