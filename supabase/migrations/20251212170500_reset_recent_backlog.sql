-- User requested to ACTUALLY process the last 2 days of articles.
-- We previously marked them all as true. Now we revert the recent ones.

UPDATE articles
SET is_processed = false
WHERE fetched_at > (now() - interval '2 days');
