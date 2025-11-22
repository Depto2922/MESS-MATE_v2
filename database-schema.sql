-- database-schema.sql
-- Supabase database schema for MESS-MATE application

-- Create profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messes table
CREATE TABLE messes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mess_members table (junction table)
CREATE TABLE mess_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id UUID REFERENCES messes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('manager', 'member')) DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(mess_id, user_id)
);

-- Create expenses table
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id UUID REFERENCES messes(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'food',
  date DATE NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shared_expenses table
CREATE TABLE shared_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id UUID REFERENCES messes(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'utilities',
  date DATE NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create meal_counts table
CREATE TABLE meal_counts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id UUID REFERENCES messes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  breakfast INTEGER DEFAULT 0,
  lunch INTEGER DEFAULT 0,
  dinner INTEGER DEFAULT 0,
  total INTEGER GENERATED ALWAYS AS (breakfast + lunch + dinner) STORED,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(mess_id, user_id, date)
);

-- Create tasks table
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id UUID REFERENCES messes(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  due_date DATE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'completed')) DEFAULT 'pending',
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create deposits table
CREATE TABLE deposits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id UUID REFERENCES messes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notices table
CREATE TABLE notices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id UUID REFERENCES messes(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reviews table (global, not mess-specific)
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  university TEXT NOT NULL,
  text TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create debt_requests table
CREATE TABLE debt_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id UUID REFERENCES messes(id) ON DELETE CASCADE NOT NULL,
  from_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  to_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'denied')) DEFAULT 'pending',
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE messes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mess_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Messes policies
CREATE POLICY "Users can view messes they belong to" ON messes
  FOR SELECT USING (
    id IN (
      SELECT mess_id FROM mess_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messes" ON messes
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Mess managers can update their mess" ON messes
  FOR UPDATE USING (
    id IN (
      SELECT mess_id FROM mess_members 
      WHERE user_id = auth.uid() AND role = 'manager'
    )
  );

-- Mess members policies
CREATE POLICY "Users can view mess members of their mess" ON mess_members
  FOR SELECT USING (
    mess_id IN (
      SELECT mess_id FROM mess_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join messes" ON mess_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers can manage mess members" ON mess_members
  FOR ALL USING (
    mess_id IN (
      SELECT mess_id FROM mess_members 
      WHERE user_id = auth.uid() AND role = 'manager'
    )
  );

-- Expenses policies
CREATE POLICY "Mess members can view expenses" ON expenses
  FOR SELECT USING (
    mess_id IN (
      SELECT mess_id FROM mess_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can manage expenses" ON expenses
  FOR ALL USING (
    mess_id IN (
      SELECT mess_id FROM mess_members 
      WHERE user_id = auth.uid() AND role = 'manager'
    )
  );

-- Shared expenses policies
CREATE POLICY "Mess members can view shared expenses" ON shared_expenses
  FOR SELECT USING (
    mess_id IN (
      SELECT mess_id FROM mess_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can manage shared expenses" ON shared_expenses
  FOR ALL USING (
    mess_id IN (
      SELECT mess_id FROM mess_members 
      WHERE user_id = auth.uid() AND role = 'manager'
    )
  );

-- Meal counts policies
CREATE POLICY "Mess members can view meal counts" ON meal_counts
  FOR SELECT USING (
    mess_id IN (
      SELECT mess_id FROM mess_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own meal counts" ON meal_counts
  FOR ALL USING (
    user_id = auth.uid() OR 
    mess_id IN (
      SELECT mess_id FROM mess_members 
      WHERE user_id = auth.uid() AND role = 'manager'
    )
  );

-- Tasks policies
CREATE POLICY "Mess members can view tasks" ON tasks
  FOR SELECT USING (
    mess_id IN (
      SELECT mess_id FROM mess_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can manage tasks" ON tasks
  FOR ALL USING (
    mess_id IN (
      SELECT mess_id FROM mess_members 
      WHERE user_id = auth.uid() AND role = 'manager'
    )
  );

-- Deposits policies
CREATE POLICY "Mess members can view deposits" ON deposits
  FOR SELECT USING (
    mess_id IN (
      SELECT mess_id FROM mess_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can manage deposits" ON deposits
  FOR ALL USING (
    mess_id IN (
      SELECT mess_id FROM mess_members 
      WHERE user_id = auth.uid() AND role = 'manager'
    )
  );

-- Notices policies
CREATE POLICY "Mess members can view notices" ON notices
  FOR SELECT USING (
    mess_id IN (
      SELECT mess_id FROM mess_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Mess members can create notices" ON notices
  FOR INSERT WITH CHECK (
    mess_id IN (
      SELECT mess_id FROM mess_members WHERE user_id = auth.uid()
    ) AND auth.uid() = created_by
  );

CREATE POLICY "Users can delete their own notices" ON notices
  FOR DELETE USING (auth.uid() = created_by);

-- Reviews policies (global)
CREATE POLICY "Anyone can view reviews" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can manage their own reviews" ON reviews
  FOR ALL USING (auth.uid() = created_by);

-- Debt requests policies
CREATE POLICY "Mess members can view debt requests" ON debt_requests
  FOR SELECT USING (
    mess_id IN (
      SELECT mess_id FROM mess_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create debt requests" ON debt_requests
  FOR INSERT WITH CHECK (
    mess_id IN (
      SELECT mess_id FROM mess_members WHERE user_id = auth.uid()
    ) AND (from_user_id = auth.uid() OR to_user_id = auth.uid())
  );

CREATE POLICY "Users can update debt requests they're involved in" ON debt_requests
  FOR UPDATE USING (
    from_user_id = auth.uid() OR to_user_id = auth.uid()
  );

-- Functions and triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messes_updated_at BEFORE UPDATE ON messes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shared_expenses_updated_at BEFORE UPDATE ON shared_expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_counts_updated_at BEFORE UPDATE ON meal_counts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deposits_updated_at BEFORE UPDATE ON deposits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notices_updated_at BEFORE UPDATE ON notices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_debt_requests_updated_at BEFORE UPDATE ON debt_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();