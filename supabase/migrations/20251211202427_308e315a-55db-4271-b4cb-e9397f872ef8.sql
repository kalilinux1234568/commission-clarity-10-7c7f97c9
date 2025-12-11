-- Create sellers table
CREATE TABLE public.sellers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required for this app)
CREATE POLICY "Allow public read sellers" ON public.sellers FOR SELECT USING (true);
CREATE POLICY "Allow public insert sellers" ON public.sellers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update sellers" ON public.sellers FOR UPDATE USING (true);
CREATE POLICY "Allow public delete sellers" ON public.sellers FOR DELETE USING (true);

-- Add seller_id to invoices table
ALTER TABLE public.invoices ADD COLUMN seller_id UUID REFERENCES public.sellers(id) ON DELETE SET NULL;