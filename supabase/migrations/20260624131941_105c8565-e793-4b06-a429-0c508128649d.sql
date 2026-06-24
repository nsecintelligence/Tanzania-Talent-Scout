
-- Roles enum & user_roles
CREATE TYPE public.app_role AS ENUM ('admin','coach','player','scout','club','agent');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  avatar_url TEXT,
  region TEXT,
  bio TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles public read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own role on signup" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  -- Optional role from signup metadata
  IF NEW.raw_user_meta_data ? 'role' THEN
    INSERT INTO public.user_roles(user_id, role)
    VALUES (NEW.id, (NEW.raw_user_meta_data->>'role')::app_role)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Academies / clubs
CREATE TABLE public.academies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'academy', -- 'academy' | 'club'
  region TEXT,
  description TEXT,
  logo_url TEXT,
  manager_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.academies TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.academies TO authenticated;
GRANT ALL ON public.academies TO service_role;
ALTER TABLE public.academies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "academies public read" ON public.academies FOR SELECT USING (true);
CREATE POLICY "coaches insert academies" ON public.academies FOR INSERT TO authenticated WITH CHECK (auth.uid() = manager_id);
CREATE POLICY "manager updates academy" ON public.academies FOR UPDATE TO authenticated USING (auth.uid() = manager_id);
CREATE POLICY "manager deletes academy" ON public.academies FOR DELETE TO authenticated USING (auth.uid() = manager_id);

-- Players
CREATE TABLE public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  academy_id UUID REFERENCES public.academies(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  photo_url TEXT,
  position TEXT NOT NULL DEFAULT 'CM',
  age INT NOT NULL DEFAULT 18,
  height_cm INT,
  weight_kg INT,
  foot TEXT DEFAULT 'Right',
  region TEXT,
  rating INT NOT NULL DEFAULT 70,
  potential INT NOT NULL DEFAULT 80,
  verified BOOLEAN NOT NULL DEFAULT false,
  stats JSONB NOT NULL DEFAULT '{"pace":70,"shooting":70,"passing":70,"dribbling":70,"defense":60,"physical":70}'::jsonb,
  achievements TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.players TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.players TO authenticated;
GRANT ALL ON public.players TO service_role;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "players public read" ON public.players FOR SELECT USING (true);
CREATE POLICY "owner or creator inserts player" ON public.players FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by OR auth.uid() = user_id);
CREATE POLICY "owner or creator updates player" ON public.players FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR auth.uid() = user_id);
CREATE POLICY "creator deletes player" ON public.players FOR DELETE TO authenticated
  USING (auth.uid() = created_by);

-- Videos
CREATE TABLE public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'Highlights', -- Match/Training/Highlights
  duration TEXT,
  views INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.videos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.videos TO authenticated;
GRANT ALL ON public.videos TO service_role;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "videos public read" ON public.videos FOR SELECT USING (true);
CREATE POLICY "uploader inserts video" ON public.videos FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "uploader updates video" ON public.videos FOR UPDATE TO authenticated USING (auth.uid() = uploaded_by);
CREATE POLICY "uploader deletes video" ON public.videos FOR DELETE TO authenticated USING (auth.uid() = uploaded_by);

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "participants read messages" ON public.messages FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "sender inserts message" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "recipient marks read" ON public.messages FOR UPDATE TO authenticated USING (auth.uid() = recipient_id);

-- Trial invitations
CREATE TABLE public.trial_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  academy_id UUID REFERENCES public.academies(id) ON DELETE SET NULL,
  trial_date TIMESTAMPTZ,
  location TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending/accepted/declined
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.trial_invitations TO authenticated;
GRANT ALL ON public.trial_invitations TO service_role;
ALTER TABLE public.trial_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invite participants read" ON public.trial_invitations FOR SELECT TO authenticated
  USING (auth.uid() = invited_by OR EXISTS (SELECT 1 FROM public.players p WHERE p.id = player_id AND p.user_id = auth.uid()));
CREATE POLICY "inviter creates trial" ON public.trial_invitations FOR INSERT TO authenticated WITH CHECK (auth.uid() = invited_by);
CREATE POLICY "player updates trial status" ON public.trial_invitations FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.players p WHERE p.id = player_id AND p.user_id = auth.uid()) OR auth.uid() = invited_by);
