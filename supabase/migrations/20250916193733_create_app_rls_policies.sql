-- RLS Policies for Polling App
-- Updated with better security and real-time considerations

-- Enable RLS on all tables
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_analytics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public polls are viewable by everyone" ON polls;
DROP POLICY IF EXISTS "Users can create polls" ON polls;
DROP POLICY IF EXISTS "Creators can update their polls" ON polls;
DROP POLICY IF EXISTS "Creators can delete their polls" ON polls;
DROP POLICY IF EXISTS "Poll options are viewable with their polls" ON poll_options;
DROP POLICY IF EXISTS "Poll creators can manage options" ON poll_options;
DROP POLICY IF EXISTS "Allow all inserts on votes" ON votes;
DROP POLICY IF EXISTS "Vote counts are public" ON votes;
DROP POLICY IF EXISTS "Users can insert poll analytics" ON poll_analytics;
DROP POLICY IF EXISTS "Admins can view poll analytics" ON poll_analytics;

-- Polls policies
CREATE POLICY "Public polls are viewable by everyone" ON polls
    FOR SELECT TO anon, authenticated
    USING (is_active = true);

CREATE POLICY "Users can create polls" ON polls
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their polls" ON polls
    FOR UPDATE TO authenticated
    USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their polls" ON polls
    FOR DELETE TO authenticated
    USING (auth.uid() = creator_id);

-- Poll options policies
CREATE POLICY "Poll options are viewable with their polls" ON poll_options
    FOR SELECT TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM polls
            WHERE polls.id = poll_options.poll_id
            AND polls.is_active = true
        )
    );

CREATE POLICY "Poll creators can insert options" ON poll_options
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM polls
            WHERE polls.id = poll_options.poll_id
            AND polls.creator_id = auth.uid()
        )
    );

CREATE POLICY "Poll creators can update options" ON poll_options
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM polls
            WHERE polls.id = poll_options.poll_id
            AND polls.creator_id = auth.uid()
        )
    );

CREATE POLICY "Poll creators can delete options" ON poll_options
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM polls
            WHERE polls.id = poll_options.poll_id
            AND polls.creator_id = auth.uid()
        )
    );

-- Votes policies
CREATE POLICY "Anyone can vote on active polls" ON votes
    FOR INSERT TO anon, authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM polls
            WHERE polls.id = votes.poll_id
            AND polls.is_active = true
            AND (polls.expires_at IS NULL OR polls.expires_at > NOW())
        )
    );

CREATE POLICY "Votes are viewable for results" ON votes
    FOR SELECT TO anon, authenticated
    USING (true); -- Allow viewing votes for real-time results

-- Poll analytics policies
CREATE POLICY "Anyone can log analytics events" ON poll_analytics
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Poll creators can view their analytics" ON poll_analytics
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM polls
            WHERE polls.id = poll_analytics.poll_id
            AND polls.creator_id = auth.uid()
        )
    );

-- Grant necessary permissions for real-time functionality
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;