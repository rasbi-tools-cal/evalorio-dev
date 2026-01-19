-- Add display_name column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Update the handle_new_user function to include display_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, credits, display_name)
  VALUES (
    new.id,
    new.email,
    1, -- New users get 1 free credit
    NULL -- Display name can be set later
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;
