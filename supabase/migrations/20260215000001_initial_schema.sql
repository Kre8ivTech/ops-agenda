-- ============================================================================
-- Ops Agenda — Initial Database Schema
-- ============================================================================
-- 
-- This migration creates the complete database schema for Ops Agenda v1.
-- 
-- Security: All tables have Row-Level Security (RLS) enabled for tenant isolation.
-- Encryption: OAuth tokens are encrypted at the application layer (AES-256-GCM).
-- Audit: All data modifications tracked in audit_logs table.
--
-- Created: 2026-02-15
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron"; -- For scheduled jobs (if available)

-- ============================================================================
-- USERS TABLE
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    work_hours_start TIME NOT NULL DEFAULT '09:00:00',
    work_hours_end TIME NOT NULL DEFAULT '17:00:00',
    data_retention_days INTEGER NOT NULL DEFAULT 30,
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster email lookups
CREATE INDEX idx_users_email ON users(email);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_own ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_update_own ON users
    FOR UPDATE USING (auth.uid() = id);

-- ============================================================================
-- MICROSOFT ACCOUNTS TABLE
-- ============================================================================

CREATE TABLE microsoft_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    microsoft_user_id TEXT NOT NULL,
    email TEXT NOT NULL,
    -- Encrypted tokens (AES-256-GCM at application layer)
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT NOT NULL,
    token_expires_at TIMESTAMPTZ NOT NULL,
    -- Sync state
    last_sync_at TIMESTAMPTZ,
    delta_token_email TEXT,
    delta_token_calendar TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id) -- One M365 account per user in v1
);

-- Indexes
CREATE INDEX idx_microsoft_accounts_user_id ON microsoft_accounts(user_id);
CREATE INDEX idx_microsoft_accounts_token_expires ON microsoft_accounts(token_expires_at);

-- RLS Policies
ALTER TABLE microsoft_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY microsoft_accounts_select_own ON microsoft_accounts
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY microsoft_accounts_insert_own ON microsoft_accounts
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY microsoft_accounts_update_own ON microsoft_accounts
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY microsoft_accounts_delete_own ON microsoft_accounts
    FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- EMAILS METADATA TABLE
-- ============================================================================

CREATE TABLE emails_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    microsoft_message_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    from_email TEXT NOT NULL,
    from_name TEXT,
    to_emails TEXT[] NOT NULL DEFAULT '{}',
    cc_emails TEXT[] NOT NULL DEFAULT '{}',
    snippet TEXT NOT NULL, -- First 200 chars only — NO FULL BODY
    received_at TIMESTAMPTZ NOT NULL,
    has_attachments BOOLEAN NOT NULL DEFAULT FALSE,
    importance TEXT NOT NULL DEFAULT 'normal' CHECK (importance IN ('low', 'normal', 'high')),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, microsoft_message_id)
);

-- Indexes for common queries
CREATE INDEX idx_emails_user_id ON emails_metadata(user_id);
CREATE INDEX idx_emails_received_at ON emails_metadata(received_at DESC);
CREATE INDEX idx_emails_user_received ON emails_metadata(user_id, received_at DESC);
CREATE INDEX idx_emails_from ON emails_metadata(from_email);

-- RLS Policies
ALTER TABLE emails_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY emails_metadata_select_own ON emails_metadata
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY emails_metadata_insert_own ON emails_metadata
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY emails_metadata_update_own ON emails_metadata
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY emails_metadata_delete_own ON emails_metadata
    FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- AI CLASSIFICATIONS TABLE
-- ============================================================================

CREATE TABLE ai_classifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_id UUID NOT NULL REFERENCES emails_metadata(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    priority TEXT NOT NULL CHECK (priority IN ('P1', 'P2', 'P3', 'FYSA')),
    confidence NUMERIC(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    reasoning TEXT,
    user_corrected BOOLEAN NOT NULL DEFAULT FALSE,
    corrected_priority TEXT CHECK (corrected_priority IN ('P1', 'P2', 'P3', 'FYSA')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(email_id)
);

-- Indexes
CREATE INDEX idx_classifications_email_id ON ai_classifications(email_id);
CREATE INDEX idx_classifications_user_priority ON ai_classifications(user_id, priority);
CREATE INDEX idx_classifications_user_corrected ON ai_classifications(user_id, user_corrected) WHERE user_corrected = TRUE;

-- RLS Policies
ALTER TABLE ai_classifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_classifications_select_own ON ai_classifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY ai_classifications_insert_own ON ai_classifications
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY ai_classifications_update_own ON ai_classifications
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY ai_classifications_delete_own ON ai_classifications
    FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- CALENDAR EVENTS TABLE
-- ============================================================================

CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    microsoft_event_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    location TEXT,
    is_online_meeting BOOLEAN NOT NULL DEFAULT FALSE,
    join_url TEXT,
    attendees JSONB NOT NULL DEFAULT '[]',
    is_all_day BOOLEAN NOT NULL DEFAULT FALSE,
    calendar_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, microsoft_event_id)
);

-- Indexes
CREATE INDEX idx_calendar_user_id ON calendar_events(user_id);
CREATE INDEX idx_calendar_start_time ON calendar_events(start_time);
CREATE INDEX idx_calendar_user_start ON calendar_events(user_id, start_time);
CREATE INDEX idx_calendar_user_date_range ON calendar_events(user_id, start_time, end_time);

-- RLS Policies
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY calendar_events_select_own ON calendar_events
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY calendar_events_insert_own ON calendar_events
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY calendar_events_update_own ON calendar_events
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY calendar_events_delete_own ON calendar_events
    FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- DUE-OUTS TABLE
-- ============================================================================

CREATE TABLE due_outs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_id UUID NOT NULL REFERENCES emails_metadata(id) ON DELETE CASCADE,
    task_description TEXT NOT NULL,
    due_date TIMESTAMPTZ NOT NULL,
    requester_email TEXT NOT NULL,
    requester_name TEXT,
    confidence NUMERIC(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_due_outs_user_id ON due_outs(user_id);
CREATE INDEX idx_due_outs_due_date ON due_outs(due_date);
CREATE INDEX idx_due_outs_user_due ON due_outs(user_id, due_date) WHERE is_completed = FALSE;
CREATE INDEX idx_due_outs_completed ON due_outs(user_id, is_completed);

-- RLS Policies
ALTER TABLE due_outs ENABLE ROW LEVEL SECURITY;

CREATE POLICY due_outs_select_own ON due_outs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY due_outs_insert_own ON due_outs
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY due_outs_update_own ON due_outs
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY due_outs_delete_own ON due_outs
    FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- DAILY OPS BRIEFS TABLE
-- ============================================================================

CREATE TABLE daily_ops_briefs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    narrative TEXT NOT NULL,
    top_priorities JSONB NOT NULL DEFAULT '[]',
    timeline JSONB NOT NULL DEFAULT '[]',
    meeting_prep JSONB NOT NULL DEFAULT '[]',
    focus_blocks JSONB NOT NULL DEFAULT '[]',
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cached_until TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '6 hours'),
    UNIQUE(user_id, date)
);

-- Indexes
CREATE INDEX idx_briefs_user_id ON daily_ops_briefs(user_id);
CREATE INDEX idx_briefs_date ON daily_ops_briefs(date DESC);
CREATE INDEX idx_briefs_user_date ON daily_ops_briefs(user_id, date DESC);
CREATE INDEX idx_briefs_cached ON daily_ops_briefs(cached_until) WHERE cached_until > NOW();

-- RLS Policies
ALTER TABLE daily_ops_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY daily_ops_briefs_select_own ON daily_ops_briefs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY daily_ops_briefs_insert_own ON daily_ops_briefs
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY daily_ops_briefs_update_own ON daily_ops_briefs
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY daily_ops_briefs_delete_own ON daily_ops_briefs
    FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- DRAFT REPLIES TABLE (Optional Feature)
-- ============================================================================

CREATE TABLE draft_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_id UUID NOT NULL REFERENCES emails_metadata(id) ON DELETE CASCADE,
    draft_text TEXT NOT NULL,
    tone TEXT NOT NULL CHECK (tone IN ('brief', 'detailed', 'decline')),
    user_feedback TEXT CHECK (user_feedback IN ('thumbs_up', 'thumbs_down')),
    was_used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_draft_replies_user_id ON draft_replies(user_id);
CREATE INDEX idx_draft_replies_email_id ON draft_replies(email_id);
CREATE INDEX idx_draft_replies_feedback ON draft_replies(user_feedback) WHERE user_feedback IS NOT NULL;

-- RLS Policies
ALTER TABLE draft_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY draft_replies_select_own ON draft_replies
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY draft_replies_insert_own ON draft_replies
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY draft_replies_update_own ON draft_replies
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY draft_replies_delete_own ON draft_replies
    FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- USER SETTINGS TABLE
-- ============================================================================

CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    draft_replies_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    due_out_detection_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_settings_select_own ON user_settings
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY user_settings_insert_own ON user_settings
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY user_settings_update_own ON user_settings
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY user_settings_delete_own ON user_settings
    FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- AUDIT LOGS TABLE (Immutable)
-- ============================================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    metadata JSONB NOT NULL DEFAULT '{}',
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- RLS Policies (read-only for users, admin-only insert)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_logs_select_own ON audit_logs
    FOR SELECT USING (user_id = auth.uid());

-- Only backend services can insert (service role key)
-- Users cannot modify audit logs

-- ============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_microsoft_accounts_updated_at BEFORE UPDATE ON microsoft_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_classifications_updated_at BEFORE UPDATE ON ai_classifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_due_outs_updated_at BEFORE UPDATE ON due_outs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DATA RETENTION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Delete emails older than user's retention period
    DELETE FROM emails_metadata
    WHERE created_at < NOW() - INTERVAL '1 day' * (
        SELECT data_retention_days FROM users WHERE users.id = emails_metadata.user_id
    );
    
    -- Delete old briefs (keep 90 days regardless of settings)
    DELETE FROM daily_ops_briefs
    WHERE date < CURRENT_DATE - INTERVAL '90 days';
    
    -- Delete old draft replies (keep 30 days)
    DELETE FROM draft_replies
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Keep audit logs for 1 year
    DELETE FROM audit_logs
    WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL SEED DATA
-- ============================================================================

-- Create a function to auto-create user_settings when user is created
CREATE OR REPLACE FUNCTION create_user_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_settings (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_user_settings
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_settings();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE users IS 'User profiles and preferences';
COMMENT ON TABLE microsoft_accounts IS 'Microsoft 365 OAuth tokens and sync state (tokens encrypted at app layer)';
COMMENT ON TABLE emails_metadata IS 'Email metadata only — NO raw bodies stored per PRD';
COMMENT ON TABLE ai_classifications IS 'AI priority classifications (P1/P2/P3/FYSA) with confidence scores';
COMMENT ON TABLE calendar_events IS 'Calendar event metadata from Microsoft Graph API';
COMMENT ON TABLE due_outs IS 'AI-detected deadlines extracted from email snippets';
COMMENT ON TABLE daily_ops_briefs IS 'Generated daily operations briefs (North Star feature)';
COMMENT ON TABLE draft_replies IS 'AI-suggested email responses (optional feature)';
COMMENT ON TABLE user_settings IS 'User preferences and feature toggles';
COMMENT ON TABLE audit_logs IS 'Immutable audit trail for compliance (SOC 2 aligned)';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
