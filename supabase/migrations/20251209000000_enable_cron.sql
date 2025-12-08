-- Enable pg_cron extension
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Schedule fetch-content to run at 2:00 AM UTC daily
select
  cron.schedule(
    'fetch-content-daily',
    '0 2 * * *',
    $$
    select
      net.http_post(
          url:='https://ubimtwjvjcvueolfsogx.supabase.co/functions/v1/fetch-content',
          headers:='{"Content-Type": "application/json"}'::jsonb
      ) as request_id;
    $$
  );

-- Schedule send-digest to run at 3:00 AM UTC daily
select
  cron.schedule(
    'send-digest-daily',
    '0 3 * * *',
    $$
    select
      net.http_post(
          url:='https://ubimtwjvjcvueolfsogx.supabase.co/functions/v1/send-digest',
          headers:='{"Content-Type": "application/json"}'::jsonb
      ) as request_id;
    $$
  );
