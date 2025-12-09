-- Enable the pg_cron extension
create extension if not exists pg_cron;

-- Schedule article fetching every hour at minute 0
select
  cron.schedule(
    'fetch-content-hourly',
    '0 * * * *', -- Every hour
    $$
    select
      net.http_post(
          url:='https://ubimtwjvjcvueolfsogx.supabase.co/functions/v1/fetch-content',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer SERVICE_ROLE_KEY"}'::jsonb,
          body:='{}'::jsonb
      ) as request_id;
    $$
  );

-- Schedule AI processing every hour at minute 5 (giving fetcher 5 mins to finish)
select
  cron.schedule(
    'process-articles-hourly',
    '5 * * * *', -- 5 minutes past every hour
    $$
    select
      net.http_post(
          url:='https://ubimtwjvjcvueolfsogx.supabase.co/functions/v1/process-articles',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer SERVICE_ROLE_KEY"}'::jsonb,
          body:='{}'::jsonb
      ) as request_id;
    $$
  );
