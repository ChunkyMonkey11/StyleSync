-- Optimize queries for "people you follow" (sender_id, status='accepted')
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender_status_accepted 
ON friend_requests(sender_id, status) 
WHERE status = 'accepted';

-- Optimize queries for "people following you" (receiver_id, status='accepted')  
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver_status_accepted 
ON friend_requests(receiver_id, status) 
WHERE status = 'accepted';
