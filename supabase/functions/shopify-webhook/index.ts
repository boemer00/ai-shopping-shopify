import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const SHOPIFY_WEBHOOK_SECRET = Deno.env.get('SHOPIFY_WEBHOOK_SECRET') || '';

interface ShopifyWebhookEvent {
  topic: string;
  shop_id: string;
  shop_domain: string;
  [key: string]: any;
}

serve(async (req: Request) => {
  // Verify the request is coming from Shopify
  const hmac = req.headers.get('X-Shopify-Hmac-Sha256');

  if (!hmac) {
    return new Response(JSON.stringify({ error: 'Missing HMAC header' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Get the raw request body
  const rawBody = await req.text();

  // Verify HMAC (in a real implementation, you would verify the HMAC here)
  // For brevity, we're skipping the actual HMAC verification in this example

  try {
    // Parse the webhook payload
    const payload: ShopifyWebhookEvent = JSON.parse(rawBody);

    // Extract topic and shop information
    const { topic, shop_id, shop_domain } = payload;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle different webhook topics
    switch (topic) {
      case 'orders/create':
        // Handle order creation
        // You could store the order information or trigger follow-up actions
        break;

      case 'products/update':
        // Handle product updates
        break;

      // Add more cases as needed for other webhook topics

      default:
        console.log(`Unhandled webhook topic: ${topic}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error processing webhook:', error);

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
