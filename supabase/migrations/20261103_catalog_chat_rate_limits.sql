-- Asistente público del catálogo Donatello: limitador sin almacenar chats ni IP.
-- Independiente del bot clínico y números WhatsApp de Mi Casa Loto.
CREATE SCHEMA IF NOT EXISTS donatello_internal;
REVOKE ALL ON SCHEMA donatello_internal FROM PUBLIC, anon, authenticated;
CREATE TABLE IF NOT EXISTS donatello_internal.catalog_chat_limits (
  visitor_hash text PRIMARY KEY CHECK (visitor_hash ~ '^[0-9a-f]{64}$'),
  minute_started_at timestamptz NOT NULL DEFAULT now(),
  minute_hits integer NOT NULL DEFAULT 0,
  day_started_at date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  day_hits integer NOT NULL DEFAULT 0
);
ALTER TABLE donatello_internal.catalog_chat_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE donatello_internal.catalog_chat_limits FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.donatello_catalog_chat_allow(p_visitor_hash text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_minute integer;
  v_day integer;
  v_time timestamptz := clock_timestamp();
  v_date date := (clock_timestamp() AT TIME ZONE 'UTC')::date;
BEGIN
  IF p_visitor_hash IS NULL OR p_visitor_hash !~ '^[0-9a-f]{64}$' THEN RETURN false; END IF;
  INSERT INTO donatello_internal.catalog_chat_limits
    (visitor_hash, minute_started_at, minute_hits, day_started_at, day_hits)
  VALUES (p_visitor_hash, v_time, 1, v_date, 1)
  ON CONFLICT (visitor_hash) DO UPDATE SET
    minute_started_at = CASE
      WHEN catalog_chat_limits.minute_started_at <= v_time - interval '60 seconds'
      THEN v_time ELSE catalog_chat_limits.minute_started_at END,
    minute_hits = CASE
      WHEN catalog_chat_limits.minute_started_at <= v_time - interval '60 seconds'
      THEN 1 ELSE catalog_chat_limits.minute_hits + 1 END,
    day_started_at = CASE
      WHEN catalog_chat_limits.day_started_at <> v_date THEN v_date
      ELSE catalog_chat_limits.day_started_at END,
    day_hits = CASE
      WHEN catalog_chat_limits.day_started_at <> v_date THEN 1
      ELSE catalog_chat_limits.day_hits + 1 END
  RETURNING minute_hits, day_hits INTO v_minute, v_day;
  RETURN v_minute <= 16 AND v_day <= 120;
END;
$$;
REVOKE ALL ON FUNCTION public.donatello_catalog_chat_allow(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.donatello_catalog_chat_allow(text) TO service_role;
