create or replace function update_poll_with_options(
  p_poll_id uuid,
  p_title text,
  p_description text,
  p_options text[]
)
returns void
language plpgsql
as $$
begin
  -- Normalize and validate inputs
  p_options := coalesce(p_options, array[]::text[]);
  if not exists (select 1 from polls where id = p_poll_id for update) then
    raise exception 'Poll not found' using errcode = 'P0002';
  end if;
  if array_length(p_options, 1) is null or array_length(p_options, 1) < 2 then
    raise exception 'At least 2 options are required';
  end if;

  -- Update the main poll details
  update polls
  set title = p_title,
    description = p_description,
    updated_at = now()
  where id = p_poll_id;

  -- Update existing poll options' order_index if their text matches
  UPDATE poll_options po
  SET
      order_index = t.idx - 1
  FROM unnest(p_options) WITH ORDINALITY as t(opt, idx)
  WHERE po.poll_id = p_poll_id AND po.text = t.opt::text;

  -- Insert new poll options (those in p_options that don't exist yet by text for this poll)
  INSERT INTO poll_options (poll_id, text, order_index)
  SELECT
      p_poll_id,
      t.opt::text,
      t.idx - 1
  FROM unnest(p_options) WITH ORDINALITY as t(opt, idx)
  WHERE NOT EXISTS (
      SELECT 1
      FROM poll_options po2
      WHERE po2.poll_id = p_poll_id AND po2.text = t.opt::text
  );

  -- Delete poll options that were removed from p_options AND have no votes
  DELETE FROM poll_options po
  WHERE po.poll_id = p_poll_id
    AND NOT EXISTS (
      SELECT 1
      FROM unnest(p_options) AS t(opt)
      WHERE po.text = t.opt::text
    )
    AND NOT EXISTS (
      SELECT 1
      FROM votes v
      WHERE v.option_id = po.id
    );

end $$;