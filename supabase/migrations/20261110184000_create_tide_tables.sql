-- Migration: 20261110184000_create_tide_tables.sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  address_evm TEXT,
  address_nim TEXT,
  chain TEXT NOT NULL DEFAULT 'polygon',
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_seen_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create sessions table (stores iron-encrypted sealed token payloads)
CREATE TABLE IF NOT EXISTS public.sessions (
  id TEXT PRIMARY KEY,
  address TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  chain TEXT NOT NULL DEFAULT 'polygon',
  sealed_payload TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create positions table (persists user deposits and staking allocations)
CREATE TABLE IF NOT EXISTS public.positions (
  id TEXT PRIMARY KEY,
  address TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  venue_id TEXT NOT NULL,
  venue_name TEXT NOT NULL,
  chain TEXT NOT NULL,
  asset TEXT NOT NULL,
  principal NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  tx_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create siwe_nonces table (prevents replay attacks on wallet authentication)
CREATE TABLE IF NOT EXISTS public.siwe_nonces (
  nonce TEXT PRIMARY KEY,
  address TEXT,
  issued_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.siwe_nonces ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Allow public read of profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert of profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update of profiles"
  ON public.profiles FOR UPDATE
  USING (true);

-- Sessions Policies
CREATE POLICY "Allow public read of sessions"
  ON public.sessions FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert of sessions"
  ON public.sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update of sessions"
  ON public.sessions FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete of sessions"
  ON public.sessions FOR DELETE
  USING (true);

-- Positions Policies
CREATE POLICY "Allow public read of positions"
  ON public.positions FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert of positions"
  ON public.positions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update of positions"
  ON public.positions FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete of positions"
  ON public.positions FOR DELETE
  USING (true);

-- SIWE Nonces Policies
CREATE POLICY "Allow public read of siwe_nonces"
  ON public.siwe_nonces FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert of siwe_nonces"
  ON public.siwe_nonces FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public delete of siwe_nonces"
  ON public.siwe_nonces FOR DELETE
  USING (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_sessions_address ON public.sessions(address);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON public.sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_positions_address ON public.positions(address);
CREATE INDEX IF NOT EXISTS idx_siwe_nonces_expires_at ON public.siwe_nonces(expires_at);

