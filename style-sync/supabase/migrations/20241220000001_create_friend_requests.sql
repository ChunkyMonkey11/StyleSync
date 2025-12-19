-- Create friend_requests table
-- This table stores friend requests between users

CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,î
  sender_id UUID NOT NULL REFERENCES userprofiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES userprofiles(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a user can't send multiple requests to the same person
  UNIQUE(sender_id, receiver_id),
  
  -- Ensure a user can't send a request to themselves
  CHECK (sender_id != receiver_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_friend_requests_updated_at 
    BEFORE UPDATE ON friend_requests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see friend requests they sent or received
CREATE POLICY "Users can view their own friend requests" ON friend_requests
    FOR SELECT USING (
        auth.uid()::text IN (
            SELECT shop_public_id FROM userprofiles WHERE id = sender_id
        ) OR 
        auth.uid()::text IN (
            SELECT shop_public_id FROM userprofiles WHERE id = receiver_id
        )
    );

-- Users can only create friend requests where they are the sender
CREATE POLICY "Users can create friend requests as sender" ON friend_requests
    FOR INSERT WITH CHECK (
        auth.uid()::text IN (
            SELECT shop_public_id FROM userprofiles WHERE id = sender_id
        )
    );

-- Users can only update friend requests where they are the receiver
CREATE POLICY "Users can update friend requests as receiver" ON friend_requests
    FOR UPDATE USING (
        auth.uid()::text IN (
            SELECT shop_public_id FROM userprofiles WHERE id = receiver_id
        )
    );

-- Users can only delete friend requests they sent
CREATE POLICY "Users can delete friend requests they sent" ON friend_requests
    FOR DELETE USING (
        auth.uid()::text IN (
            SELECT shop_public_id FROM userprofiles WHERE id = sender_id
        )
    );


