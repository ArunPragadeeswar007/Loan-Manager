-- Create a table for public profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  phone TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies (Updated to ensure client-side upsert works flawlessly)
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow read access to all profiles" ON public.profiles;

-- Allow read access to everyone
CREATE POLICY "Allow read access to all profiles" ON public.profiles
  FOR SELECT USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Allow users to insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Allow users to update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Create a function to handle new user registration automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    avatar_url = EXCLUDED.avatar_url,
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set up the trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
