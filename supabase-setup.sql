-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id TEXT NOT NULL,
  customer_id TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  customer_id TEXT PRIMARY KEY,
  preferred_categories TEXT[],
  last_viewed_products JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for conversations table
CREATE POLICY "Shops can view their own conversations"
  ON conversations
  FOR SELECT
  USING (shop_id = current_setting('app.current_shop_id', TRUE));

CREATE POLICY "Shops can insert their own conversations"
  ON conversations
  FOR INSERT
  WITH CHECK (shop_id = current_setting('app.current_shop_id', TRUE));

CREATE POLICY "Shops can update their own conversations"
  ON conversations
  FOR UPDATE
  USING (shop_id = current_setting('app.current_shop_id', TRUE));

-- Create policies for messages table
CREATE POLICY "Shops can view their conversation messages"
  ON messages
  FOR SELECT
  USING (conversation_id IN (
    SELECT id FROM conversations WHERE shop_id = current_setting('app.current_shop_id', TRUE)
  ));

CREATE POLICY "Shops can insert messages into their conversations"
  ON messages
  FOR INSERT
  WITH CHECK (conversation_id IN (
    SELECT id FROM conversations WHERE shop_id = current_setting('app.current_shop_id', TRUE)
  ));

-- Create policies for user_preferences table
CREATE POLICY "Users can view their own preferences"
  ON user_preferences
  FOR SELECT
  USING (customer_id = current_setting('app.current_customer_id', TRUE));

CREATE POLICY "Users can insert their own preferences"
  ON user_preferences
  FOR INSERT
  WITH CHECK (customer_id = current_setting('app.current_customer_id', TRUE));

CREATE POLICY "Users can update their own preferences"
  ON user_preferences
  FOR UPDATE
  USING (customer_id = current_setting('app.current_customer_id', TRUE));
