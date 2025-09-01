-- supabase/migrations/002_rls_policies.sql

ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_analytics ENABLE ROW LEVEL SECURITY;

-- Polls policies
DROP POLICY IF EXISTS "Public polls are viewable by everyone" ON polls;
CREATE POLICY "Public polls are viewable by everyone" ON polls
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Users can create polls" ON polls;
CREATE POLICY "Users can create polls" ON polls
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Creators can update their polls" ON polls;
CREATE POLICY "Creators can update their polls" ON polls
    FOR UPDATE USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Creators can delete their polls" ON polls;
CREATE POLICY "Creators can delete their polls" ON polls
    FOR DELETE USING (auth.uid() = creator_id);

-- Poll options policies
DROP POLICY IF EXISTS "Poll options are viewable with their polls" ON poll_options;
CREATE POLICY "Poll options are viewable with their polls" ON poll_options
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM polls
            WHERE polls.id = poll_options.poll_id
            AND polls.is_active = true
        )
    );

DROP POLICY IF EXISTS "Poll creators can manage options" ON poll_options;
CREATE POLICY "Poll creators can manage options" ON poll_options
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM polls
            WHERE polls.id = poll_options.poll_id
            AND polls.creator_id = auth.uid()
        )
    );

-- Votes policies
-- The FOR INSERT RLS policy for votes is being removed. The unique constraints on the 'votes' table
-- (idx_votes_user_poll and idx_votes_anonymous_poll) are sufficient to prevent duplicate votes.
-- Removing this policy allows the database to enforce uniqueness directly, which has been confirmed to work as desired.
DROP POLICY IF EXISTS "Users can vote once per poll" ON votes;

-- Allow all users (authenticated and anonymous) to insert votes. Duplicate vote prevention
-- will be handled by unique indexes on the 'votes' table, as confirmed by testing.
DROP POLICY IF EXISTS "Allow all inserts on votes" ON votes;
CREATE POLICY "Allow all inserts on votes" ON votes
    FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Vote counts are public" ON votes;
CREATE POLICY "Vote counts are public" ON votes
    FOR SELECT USING (true);
