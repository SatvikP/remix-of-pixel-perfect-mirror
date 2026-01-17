-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service role can manage articles" ON public.articles;

-- Create specific policies for INSERT and UPDATE only (no DELETE from clients)
-- These will work with the service role key used by edge functions
CREATE POLICY "Allow insert articles" 
ON public.articles 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow update articles" 
ON public.articles 
FOR UPDATE 
USING (true)
WITH CHECK (true);