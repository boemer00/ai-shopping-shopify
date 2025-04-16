import { createClient } from '@supabase/supabase-js';

/**
 * Initialize Supabase client
 * @returns {Object} Supabase client
 */
export const initSupabase = () => {
  // Check for API key in window first (for browser environments), then try process.env (for Node environments)
  const supabaseUrl = window.SUPABASE_URL ||
                     (typeof process !== 'undefined' && process.env ? process.env.SUPABASE_URL : '') || '';

  const supabaseKey = window.SUPABASE_KEY ||
                     (typeof process !== 'undefined' && process.env ? process.env.SUPABASE_KEY : '') || '';

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
};

/**
 * Create a new conversation
 * @param {string} shopId - The Shopify shop ID
 * @param {string} customerId - The customer ID (optional)
 * @returns {Promise<Object>} The created conversation
 */
export const createConversation = async (shopId, customerId = null) => {
  const supabase = initSupabase();

  if (!supabase) {
    return { error: 'Supabase client not available' };
  }

  const conversation = {
    shop_id: shopId,
    customer_id: customerId,
  };

  try {
    const { data, error } = await supabase
      .from('conversations')
      .insert([conversation])
      .select()
      .single();

    if (error) throw error;

    return { conversation: data };
  } catch (error) {
    console.error('Error creating conversation:', error);
    return { error: error.message };
  }
};

/**
 * Add a message to a conversation
 * @param {string} conversationId - The conversation ID
 * @param {string} role - The message role (user or assistant)
 * @param {string} content - The message content
 * @returns {Promise<Object>} The created message
 */
export const addMessage = async (conversationId, role, content) => {
  const supabase = initSupabase();

  if (!supabase) {
    return { error: 'Supabase client not available' };
  }

  const message = {
    conversation_id: conversationId,
    role,
    content,
  };

  try {
    // Add message to the database
    const { data, error } = await supabase
      .from('messages')
      .insert([message])
      .select()
      .single();

    if (error) throw error;

    // Update last_message_at in the conversation
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    return { message: data };
  } catch (error) {
    console.error('Error adding message:', error);
    return { error: error.message };
  }
};

/**
 * Get messages for a conversation
 * @param {string} conversationId - The conversation ID
 * @param {number} limit - Maximum number of messages to retrieve
 * @returns {Promise<Array>} The conversation messages
 */
export const getMessages = async (conversationId, limit = 50) => {
  const supabase = initSupabase();

  if (!supabase) {
    return { error: 'Supabase client not available' };
  }

  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;

    return { messages: data };
  } catch (error) {
    console.error('Error getting messages:', error);
    return { error: error.message };
  }
};

/**
 * Save user preferences
 * @param {string} customerId - The customer ID
 * @param {Object} preferences - The user preferences to save
 * @returns {Promise<Object>} The saved preferences
 */
export const saveUserPreferences = async (customerId, preferences) => {
  const supabase = initSupabase();

  if (!supabase) {
    return { error: 'Supabase client not available' };
  }

  if (!customerId) {
    return { error: 'Customer ID is required' };
  }

  try {
    // Check if user preferences already exist
    const { data: existingData } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('customer_id', customerId)
      .maybeSingle();

    let result;

    if (existingData) {
      // Update existing preferences
      const { data, error } = await supabase
        .from('user_preferences')
        .update({
          ...preferences,
          updated_at: new Date().toISOString(),
        })
        .eq('customer_id', customerId)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert new preferences
      const { data, error } = await supabase
        .from('user_preferences')
        .insert([{
          customer_id: customerId,
          ...preferences,
        }])
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return { preferences: result };
  } catch (error) {
    console.error('Error saving user preferences:', error);
    return { error: error.message };
  }
};

/**
 * Get user preferences
 * @param {string} customerId - The customer ID
 * @returns {Promise<Object>} The user preferences
 */
export const getUserPreferences = async (customerId) => {
  const supabase = initSupabase();

  if (!supabase) {
    return { error: 'Supabase client not available' };
  }

  if (!customerId) {
    return { error: 'Customer ID is required' };
  }

  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('customer_id', customerId)
      .maybeSingle();

    if (error) throw error;

    return { preferences: data || {} };
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return { error: error.message };
  }
};
