# Shopify Integration Guide

This guide explains how to integrate the AI Shopping Assistant with your Shopify store.

## Overview

The AI Shopping Assistant can be integrated with your Shopify store in two ways:

1. **Theme App Extension** - Embed the widget directly in your Shopify theme (recommended)
2. **Vercel Deployment** - Host the application on Vercel and connect it to your Shopify store

## Prerequisites

- A Shopify store (can be a development store)
- Shopify Partner account (for creating apps)
- Vercel account (for deploying the application)
- Claude API key from Anthropic

## Method 1: Theme App Extension (Recommended)

### 1. Deploy the Application to Vercel

1. Push the code to GitHub
2. Create a new project on Vercel
3. Connect to your GitHub repository
4. Configure environment variables:
   - `SHOPIFY_API_KEY` - Your Shopify API key
   - `SHOPIFY_API_SECRET` - Your Shopify API secret
   - `SHOPIFY_STOREFRONT_ACCESS_TOKEN` - Your Shopify Storefront API token
   - `SHOPIFY_STORE_URL` - Your Shopify store URL (e.g., `your-store.myshopify.com`)
   - `SUPABASE_URL` - Your Supabase URL
   - `SUPABASE_KEY` - Your Supabase anon key
   - `CLAUDE_API_KEY` - Your Claude API key
   - `APP_URL` - Your Vercel app URL (e.g., `https://ai-shopping-shopify.vercel.app`)
5. Deploy the application

### 2. Create a Shopify App in Partner Dashboard

1. Go to your Shopify Partner Dashboard
2. Create a new app
3. In App Setup, set:
   - App URL: `https://your-vercel-deployment.vercel.app`
   - Allowed redirection URLs: `https://your-vercel-deployment.vercel.app/auth/callback`
4. Obtain the API Key and API Secret and update your Vercel environment variables

### 3. Create a Theme App Extension

1. Create a new folder in your Shopify theme: `snippets`
2. Add the file `ai-shopping-assistant.liquid` to the snippets folder (use the content from `shopify/ai-shopping-assistant.liquid`)
3. In your theme, include the snippet where you want the chat widget to appear:
   ```liquid
   {% render 'ai-shopping-assistant' %}
   ```

### 4. Add the Script Tag to Your Theme

For a more streamlined integration, you can add a script tag to your theme that will load the widget:

1. Go to your Shopify admin
2. Navigate to Online Store > Themes
3. Click "Actions" > "Edit code"
4. Open the `theme.liquid` file
5. Before the closing `</body>` tag, add:
   ```html
   <!-- AI Shopping Assistant -->
   {% render 'ai-shopping-assistant' %}
   ```

## Method 2: Vercel Deployment Only

You can also use the application directly from its Vercel deployment without creating a Shopify app.

1. Deploy the application to Vercel as described in Method 1, Step 1
2. Visit your Vercel deployment URL (e.g., `https://ai-shopping-shopify.vercel.app`)
3. You'll see the standalone version of the chat widget
4. You can also embed it in your Shopify theme using an iframe:
   ```html
   <iframe
     src="https://your-vercel-deployment.vercel.app/embed?shop=your-store.myshopify.com"
     style="position: fixed; bottom: 20px; right: 20px; width: 350px; height: 500px; border: none; z-index: 1000;"
   ></iframe>
   ```

## Troubleshooting

### Conversations Not Being Recorded in Supabase

If conversations are not being recorded in Supabase, check the following:

1. Verify Supabase URL and anon key are correctly set in the environment variables
2. Check browser console for any errors related to Supabase
3. Ensure the database tables are set up correctly in Supabase
4. Check that your shop ID is being correctly detected

### Widget Not Appearing in Shopify Store

If the widget doesn't appear in your Shopify store, check:

1. The `ai-shopping-assistant.liquid` snippet is correctly added to your theme
2. The snippet is correctly referenced in your theme
3. The environment variables on Vercel are correctly set
4. Your Vercel deployment is working correctly
5. CORS settings in `server.js` include your Shopify domain

## Testing

To test the widget:

1. Visit your Vercel deployment at `/test` (e.g., `https://ai-shopping-shopify.vercel.app/test`)
2. Enter your Shopify Storefront API token
3. Enter your Shopify store URL
4. Click "Initialize" to test the widget

## Support

For additional help, please refer to the README.md file or submit an issue on GitHub.
