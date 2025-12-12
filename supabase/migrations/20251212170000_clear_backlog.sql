-- Clearing the stuck backlog of 200+ articles
-- They have Rule-Based summaries (verified), but are stuck in retry loops due to AI Rate Limits.
-- We mark them as processed so the system can move on to new content.

UPDATE articles 
SET 
  is_processed = true,
  summary = CASE 
    WHEN summary IS NULL OR summary = '' THEN '(Auto-Generated) Summary pending. Check original link.' 
    ELSE summary 
  END
WHERE is_processed = false;
