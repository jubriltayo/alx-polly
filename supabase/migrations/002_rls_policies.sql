-- supabase/migrations/002_rls_policies.sql

ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_analytics ENABLE ROW LEVEL SECURITY;

-- Polls policies
CREATE POLICY "Public polls are viewable by everyone" ON polls
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can create polls" ON polls
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their polls" ON polls
    FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their polls" ON polls
    FOR DELETE USING (auth.uid() = creator_id);

-- Poll options policies
CREATE POLICY "Poll options are viewable with their polls" ON poll_options
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM polls
            WHERE polls.id = poll_options.poll_id
            AND polls.is_active = true
        )
    );

CREATE POLICY "Poll creators can manage options" ON poll_options
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM polls
            WHERE polls.id = poll_options.poll_id
            AND polls.creator_id = auth.uid()
        )
    );

-- Votes policies
CREATE POLICY "Users can vote once per poll" ON votes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM polls
            WHERE polls.id = poll_id
            AND polls.is_active = true
        ) AND (
            auth.uid() IS NULL OR
            NOT EXISTS (
                SELECT 1 FROM votes
                WHERE votes.poll_id = poll_id
                AND votes.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Vote counts are public" ON votes
    FOR SELECT USING (true);
