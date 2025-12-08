-- Add policy for email_logs (only backend should access this, but we need at least one policy)
CREATE POLICY "Service role only for email logs" 
ON public.email_logs 
FOR ALL 
USING (false);