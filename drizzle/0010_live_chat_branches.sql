ALTER TABLE live_chat_conversations ADD COLUMN branch_id TEXT NOT NULL DEFAULT '';
ALTER TABLE live_chat_conversations ADD COLUMN branch_name TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS live_chat_conversations_branch_idx ON live_chat_conversations(branch_id, status, updated_at);
