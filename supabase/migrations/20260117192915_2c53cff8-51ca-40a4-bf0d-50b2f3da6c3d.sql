-- Create function to update timestamps (if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create articles table for scraped EU startup news
CREATE TABLE public.articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  published_date TIMESTAMP WITH TIME ZONE,
  authors TEXT[] DEFAULT '{}',
  section TEXT,
  tags TEXT[] DEFAULT '{}',
  is_pro BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX idx_articles_source ON public.articles(source);
CREATE INDEX idx_articles_published_date ON public.articles(published_date DESC);
CREATE INDEX idx_articles_created_at ON public.articles(created_at DESC);

-- Enable RLS (public read access for this use case)
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Allow public read access (articles are public content)
CREATE POLICY "Articles are publicly readable" 
ON public.articles 
FOR SELECT 
USING (true);

-- Allow service role to manage articles (edge functions use service role)
CREATE POLICY "Service role can manage articles" 
ON public.articles 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create updated_at trigger
CREATE TRIGGER update_articles_updated_at
BEFORE UPDATE ON public.articles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();