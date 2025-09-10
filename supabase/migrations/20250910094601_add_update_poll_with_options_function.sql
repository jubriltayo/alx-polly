create or replace function update_poll_with_options(p_poll_id uuid, p_title text, p_description text, p_options text[])
returns void language plpgsql as $$
begin
  update polls set title = p_title, description = p_description, updated_at = now() where id = p_poll_id;
  delete from poll_options where poll_id = p_poll_id;
  insert into poll_options (poll_id, text, order_index)
  select p_poll_id, opt, idx - 1
  from unnest(p_options) with ordinality as t(opt, idx);
end $$;
