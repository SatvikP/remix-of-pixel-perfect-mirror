-- Create user_startups table for persisting CSV data
CREATE TABLE public.user_startups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  website TEXT,
  tags TEXT,
  linkedin TEXT,
  blurb TEXT,
  location TEXT,
  maturity TEXT,
  amount_raised TEXT,
  business_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_startups ENABLE ROW LEVEL SECURITY;

-- RLS policies for user data isolation
CREATE POLICY "Users can view own startups" 
  ON public.user_startups FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own startups" 
  ON public.user_startups FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own startups" 
  ON public.user_startups FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own startups" 
  ON public.user_startups FOR DELETE 
  USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_user_startups_updated_at
BEFORE UPDATE ON public.user_startups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();