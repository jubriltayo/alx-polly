-- Enable RLS on all tables
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_analytics ENABLE ROW LEVEL SECURITY;

-- Polls policies
DROP POLICY IF EXISTS "Public polls are viewable by everyone" ON polls;
CREATE POLICY "Public polls are viewable by everyone" ON polls
    FOR SELECT TO anon, authenticated
    USING (is_active = true);

DROP POLICY IF EXISTS "Users can create polls" ON polls;
CREATE POLICY "Users can create polls" ON polls
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Creators can update their polls" ON polls;
CREATE POLICY "Creators can update their polls" ON polls
    FOR UPDATE TO authenticated
    USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Creators can delete their polls" ON polls;
CREATE POLICY "Creators can delete their polls" ON polls
    FOR DELETE TO authenticated
    USING (auth.uid() = creator_id);

-- Poll options policies
DROP POLICY IF EXISTS "Poll options are viewable with their polls" ON poll_options;
CREATE POLICY "Poll options are viewable with their polls" ON poll_options
    FOR SELECT TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM polls
            WHERE polls.id = poll_options.poll_id
            AND polls.is_active = true
        )
    );

DROP POLICY IF EXISTS "Poll creators can manage options" ON poll_options;
CREATE POLICY "Poll creators can manage options" ON poll_options
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM polls
            WHERE polls.id = poll_options.poll_id
            AND polls.creator_id = auth.uid()
        )
    );

-- Votes policies
DROP POLICY IF EXISTS "Allow all inserts on votes" ON votes;
CREATE POLICY "Allow all inserts on votes" ON votes
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Vote counts are public" ON votes;
CREATE POLICY "Vote counts are public" ON votes
    FOR SELECT TO anon, authenticated
    USING (true);
