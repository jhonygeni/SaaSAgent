-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users(id) PRIMARY KEY,
    name text,
    email text UNIQUE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Create function to handle profile updates
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updating updated_at
CREATE TRIGGER on_profile_update
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_update();

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user(); 