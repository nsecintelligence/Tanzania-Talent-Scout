
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ensure updated_at helper exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 1. Tamper-evident audit log
CREATE TABLE public.audit_logs (
  id            BIGSERIAL PRIMARY KEY,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,
  target_type   TEXT,
  target_id     TEXT,
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  prev_hash     TEXT NOT NULL DEFAULT '',
  row_hash      TEXT NOT NULL
);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL    ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read audit log"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. Login attempts
CREATE TABLE public.login_attempts (
  id            BIGSERIAL PRIMARY KEY,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  email_hash    TEXT NOT NULL,
  ip_hash       TEXT,
  user_agent    TEXT,
  success       BOOLEAN NOT NULL,
  reason        TEXT
);
CREATE INDEX login_attempts_email_time ON public.login_attempts (email_hash, created_at DESC);
CREATE INDEX login_attempts_time       ON public.login_attempts (created_at DESC);
GRANT SELECT, INSERT ON public.login_attempts TO authenticated;
GRANT INSERT         ON public.login_attempts TO anon;
GRANT USAGE, SELECT  ON SEQUENCE public.login_attempts_id_seq TO authenticated, anon;
GRANT ALL            ON public.login_attempts TO service_role;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert a login attempt"
  ON public.login_attempts FOR INSERT TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY "Admins can read login attempts"
  ON public.login_attempts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Content reports
CREATE TYPE public.report_status AS ENUM ('open', 'reviewing', 'resolved', 'rejected');

CREATE TABLE public.content_reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  reporter_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type   TEXT NOT NULL,
  target_id     TEXT NOT NULL,
  reason        TEXT NOT NULL,
  details       TEXT,
  status        public.report_status NOT NULL DEFAULT 'open',
  resolved_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at   TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE ON public.content_reports TO authenticated;
GRANT ALL                    ON public.content_reports TO service_role;
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users create their own reports"
  ON public.content_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users see own or admin sees all"
  ON public.content_reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update reports"
  ON public.content_reports FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER content_reports_touch
  BEFORE UPDATE ON public.content_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. RPC: append_audit_log (hash-chained)
CREATE OR REPLACE FUNCTION public.append_audit_log(
  _action      TEXT,
  _target_type TEXT DEFAULT NULL,
  _target_id   TEXT DEFAULT NULL,
  _metadata    JSONB DEFAULT '{}'::jsonb
) RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _prev  TEXT;
  _hash  TEXT;
  _id    BIGINT;
  _actor UUID := auth.uid();
  _ts    TIMESTAMPTZ := now();
BEGIN
  SELECT row_hash INTO _prev FROM public.audit_logs ORDER BY id DESC LIMIT 1;
  _prev := COALESCE(_prev, '');
  _hash := encode(digest(
    _prev || COALESCE(_actor::text,'') || _action
    || COALESCE(_target_type,'') || COALESCE(_target_id,'')
    || _metadata::text || _ts::text,
    'sha256'), 'hex');
  INSERT INTO public.audit_logs (created_at, actor_id, action, target_type, target_id, metadata, prev_hash, row_hash)
  VALUES (_ts, _actor, _action, _target_type, _target_id, _metadata, _prev, _hash)
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;
REVOKE ALL ON FUNCTION public.append_audit_log(TEXT,TEXT,TEXT,JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.append_audit_log(TEXT,TEXT,TEXT,JSONB) TO authenticated;

-- 5. RPC: verify_audit_chain
CREATE OR REPLACE FUNCTION public.verify_audit_chain()
RETURNS TABLE (broken_at BIGINT, expected_hash TEXT, actual_hash TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE r RECORD; _prev TEXT := ''; _expect TEXT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  FOR r IN SELECT * FROM public.audit_logs ORDER BY id ASC LOOP
    _expect := encode(digest(
      _prev || COALESCE(r.actor_id::text,'') || r.action
      || COALESCE(r.target_type,'') || COALESCE(r.target_id,'')
      || r.metadata::text || r.created_at::text,
      'sha256'), 'hex');
    IF _expect <> r.row_hash OR r.prev_hash <> _prev THEN
      broken_at := r.id; expected_hash := _expect; actual_hash := r.row_hash;
      RETURN NEXT; RETURN;
    END IF;
    _prev := r.row_hash;
  END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION public.verify_audit_chain() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_audit_chain() TO authenticated;

-- 6. RPC: recent_failed_logins
CREATE OR REPLACE FUNCTION public.recent_failed_logins(_email_hash TEXT, _window_minutes INT DEFAULT 15)
RETURNS INT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COUNT(*)::int FROM public.login_attempts
  WHERE email_hash = _email_hash AND success = false
    AND created_at > now() - make_interval(mins => _window_minutes);
$$;
REVOKE ALL ON FUNCTION public.recent_failed_logins(TEXT,INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.recent_failed_logins(TEXT,INT) TO anon, authenticated;
