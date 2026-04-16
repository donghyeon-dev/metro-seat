-- Session messages for template-based communication between provider and seeker
CREATE TABLE IF NOT EXISTS session_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id UUID NOT NULL REFERENCES seat_offers(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  message_key TEXT NOT NULL, -- template key: 'nod', 'black_mask', 'earphone', 'phone', 'thanks'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by offer
CREATE INDEX IF NOT EXISTS idx_session_messages_offer_id ON session_messages(offer_id);

-- RLS policies
ALTER TABLE session_messages ENABLE ROW LEVEL SECURITY;

-- Anyone involved in the offer (provider or seeker with a request) can read messages
CREATE POLICY "session_messages_select" ON session_messages
  FOR SELECT USING (
    sender_id = auth.uid()
    OR offer_id IN (
      SELECT id FROM seat_offers WHERE provider_id = auth.uid()
    )
    OR offer_id IN (
      SELECT offer_id FROM seat_requests WHERE seeker_id = auth.uid()
    )
  );

-- Any authenticated user can insert their own messages
CREATE POLICY "session_messages_insert" ON session_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
  );

-- Enable realtime for session_messages
ALTER PUBLICATION supabase_realtime ADD TABLE session_messages;
