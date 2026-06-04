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

-- Create loans table referencing the existing profiles table
CREATE TABLE IF NOT EXISTS public.loans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  loan_number TEXT NOT NULL,
  loan_type TEXT NOT NULL, -- 'Home', 'Car', 'Insurance', 'Personal', 'Business', 'Other'
  loan_amount NUMERIC NOT NULL CHECK (loan_amount > 0),
  tenure INTEGER NOT NULL CHECK (tenure > 0), -- in months
  installment_start_date DATE NOT NULL,
  interest_type TEXT NOT NULL, -- 'Fixed', 'Floating'
  roi NUMERIC NOT NULL CHECK (roi >= 0), -- Rate of Interest (percent, e.g. 8.5)
  status TEXT DEFAULT 'Active' NOT NULL, -- 'Active', 'Pending', 'Paid'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_loan_number_per_customer UNIQUE (customer_id, loan_number)
);

-- Enable Row Level Security
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

-- Create Policies for RLS
-- Users can only read and manage their own loans
CREATE POLICY "Allow users to read their own loans" ON public.loans
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Allow users to insert their own loans" ON public.loans
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Allow users to update their own loans" ON public.loans
  FOR UPDATE USING (auth.uid() = customer_id) WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Allow users to delete their own loans" ON public.loans
  FOR DELETE USING (auth.uid() = customer_id);

