-- 1) Add sex to players
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS sex text NOT NULL DEFAULT 'male' CHECK (sex IN ('male','female'));

-- 2) Add activity tracking + alert state to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS inactivity_alerted_at timestamptz;

-- 3) Scout tracking table (3 months window)
CREATE TABLE IF NOT EXISTS public.scout_tracked_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scout_id uuid NOT NULL,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL DEFAULT (now() + interval '3 months'),
  note text,
  UNIQUE (scout_id, player_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scout_tracked_players TO authenticated;
GRANT ALL ON public.scout_tracked_players TO service_role;
ALTER TABLE public.scout_tracked_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Scouts view own tracking" ON public.scout_tracked_players FOR SELECT TO authenticated USING (auth.uid() = scout_id);
CREATE POLICY "Scouts insert own tracking" ON public.scout_tracked_players FOR INSERT TO authenticated WITH CHECK (auth.uid() = scout_id AND public.has_role(auth.uid(),'scout'));
CREATE POLICY "Scouts update own tracking" ON public.scout_tracked_players FOR UPDATE TO authenticated USING (auth.uid() = scout_id);
CREATE POLICY "Scouts delete own tracking" ON public.scout_tracked_players FOR DELETE TO authenticated USING (auth.uid() = scout_id);

-- 4) Progress entries logged within a tracking window
CREATE TABLE IF NOT EXISTS public.player_progress_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id uuid NOT NULL REFERENCES public.scout_tracked_players(id) ON DELETE CASCADE,
  scout_id uuid NOT NULL,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  entry_date date NOT NULL DEFAULT (now()::date),
  rating int CHECK (rating BETWEEN 1 AND 100),
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_progress_entries TO authenticated;
GRANT ALL ON public.player_progress_entries TO service_role;
ALTER TABLE public.player_progress_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Scout reads own entries" ON public.player_progress_entries FOR SELECT TO authenticated USING (auth.uid() = scout_id);
CREATE POLICY "Scout writes own entries" ON public.player_progress_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = scout_id);
CREATE POLICY "Scout updates own entries" ON public.player_progress_entries FOR UPDATE TO authenticated USING (auth.uid() = scout_id);
CREATE POLICY "Scout deletes own entries" ON public.player_progress_entries FOR DELETE TO authenticated USING (auth.uid() = scout_id);

-- 5) Helper: bump last_active_at for the current user
CREATE OR REPLACE FUNCTION public.touch_activity()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles
  SET last_active_at = now(), inactivity_alerted_at = NULL
  WHERE id = auth.uid();
$$;
GRANT EXECUTE ON FUNCTION public.touch_activity() TO authenticated;