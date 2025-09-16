-- Application Schema and Triggers for Polling App
-- Updated with optimizations and real-time support

-- polls table
CREATE TABLE polls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    allow_multiple_votes BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE,
    poll_url TEXT,
    qr_generated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- poll_options table
CREATE TABLE poll_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
    value TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    votes_count INT NOT NULL DEFAULT 0, -- Maintained by trigger for real-time updates
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- votes table
CREATE TABLE votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
    option_id UUID REFERENCES poll_options(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address INET,
    session_fingerprint TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comprehensive duplicate vote prevention indexes
-- Added index names for better management
CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_user_poll
    ON votes(poll_id, user_id)
    WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_anonymous_poll
    ON votes(poll_id, ip_address, session_fingerprint)
    WHERE user_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_votes_poll_created ON votes(poll_id, created_at DESC);

-- Index for better real-time performance on poll_options
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON poll_options(poll_id);

-- poll_analytics table
CREATE TABLE poll_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to update votes_count on poll_options
CREATE OR REPLACE FUNCTION update_votes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE poll_options
        SET votes_count = votes_count + 1
        WHERE id = NEW.option_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE poll_options
        SET votes_count = votes_count - 1
        WHERE id = OLD.option_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for votes_count maintenance
DROP TRIGGER IF EXISTS votes_count_on_insert ON votes;
CREATE TRIGGER votes_count_on_insert
AFTER INSERT ON votes
FOR EACH ROW EXECUTE FUNCTION update_votes_count();

DROP TRIGGER IF EXISTS votes_count_on_delete ON votes;
CREATE TRIGGER votes_count_on_delete
AFTER DELETE ON votes
FOR EACH ROW EXECUTE FUNCTION update_votes_count();

-- Function to update poll updated_at timestamp
CREATE OR REPLACE FUNCTION update_poll_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE polls
    SET updated_at = NOW()
    WHERE id = NEW.poll_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update poll timestamp when options change
DROP TRIGGER IF EXISTS update_poll_on_option_change ON poll_options;
CREATE TRIGGER update_poll_on_option_change
AFTER INSERT OR UPDATE OR DELETE ON poll_options
FOR EACH ROW EXECUTE FUNCTION update_poll_updated_at();

-- Trigger to update poll timestamp when votes change
DROP TRIGGER IF EXISTS update_poll_on_vote_change ON votes;
CREATE TRIGGER update_poll_on_vote_change
AFTER INSERT OR DELETE ON votes
FOR EACH ROW EXECUTE FUNCTION update_poll_updated_at();