-- Create Unsubscribe RPC Function
create or replace function unsubscribe_user(p_email text)
returns void
language plpgsql
security definer
as $$
begin
  -- Option 1: Hard Delete (cleanest)
  delete from subscribers
  where email = p_email;
  
  -- Option 2: Soft Delete (if we had a status column, which we don't yet, so sticking to delete)
  -- update subscribers set is_active = false where email = p_email;
end;
$$;

-- Grant access to public (so frontend can call it via client)
grant execute on function unsubscribe_user(text) to anon, authenticated, service_role;


-- Optimize Cron Schedule for AI Processing
-- Previous: '5 * * * *' (Once an hour)
-- New: '*/5 * * * *' (Every 5 minutes)

select
  cron.unschedule('process-articles-hourly');

select
  cron.schedule(
    'process-articles-5min',
    '*/5 * * * *', -- Every 5 minutes
    $$
    select
      net.http_post(
          url:='https://ubimtwjvjcvueolfsogx.supabase.co/functions/v1/process-articles',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer SERVICE_ROLE_KEY"}'::jsonb,
          body:='{}'::jsonb
      ) as request_id;
    $$
  );
