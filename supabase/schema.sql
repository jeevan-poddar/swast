-- ============================================================
-- SWAST FITNESS APP — SUPABASE SCHEMA (v2)
-- Run in Supabase SQL Editor: Dashboard → SQL Editor → New Query
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: users
-- Mirrors auth.users. Created automatically via trigger below.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT,
  email      TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: profiles
-- Extended health / fitness settings. One row per user (1-1).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id                   UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID        UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name                 TEXT,
  email                TEXT,
  goal                 TEXT,                 -- 'lose_weight' | 'gain_muscle' | 'maintain'
  how_much_weight      NUMERIC(6,2),         -- kg target delta
  in_how_many_days     INTEGER,
  food_type            TEXT,                 -- 'veg' | 'non-veg' | 'vegan'
  meat                 TEXT[],               -- e.g. ['chicken','fish']
  meat_preference_days TEXT[],               -- e.g. ['Monday','Wednesday']
  dob                  DATE,
  gender               TEXT,                 -- 'male' | 'female' | 'other'
  kitchen              TEXT,
  city                 TEXT,
  state                TEXT,
  country              TEXT,
  weight               NUMERIC(5,2),         -- kg
  height               NUMERIC(5,2),         -- cm
  allergies            TEXT,
  job_type             TEXT,                 -- '1' desk | '2' active | '3' field | '4' athlete
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: activities
-- User-defined exercise routines.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.activities (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  activity_name TEXT NOT NULL,
  duration      INTEGER,          -- minutes
  start_time    TEXT,             -- e.g. '07:30'
  days          TEXT[],           -- e.g. ['Monday','Wednesday','Friday']
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: food_items
-- Nutritional data per food (shared reference table).
-- Seeded manually or auto-populated via AI fallback in the API.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.food_items (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT        UNIQUE NOT NULL,   -- lowercase, canonical
  base_amount      NUMERIC(8,2) NOT NULL,          -- e.g. 100
  unit_type        TEXT        NOT NULL CHECK (unit_type IN ('g', 'ml', 'piece')),
  price_per_100g   NUMERIC(8,2) DEFAULT 0,
  is_budget_exempt BOOLEAN     DEFAULT FALSE,
  -- Macronutrients (per base_amount)
  kcal             NUMERIC(8,2) DEFAULT 0,
  protein          NUMERIC(8,2) DEFAULT 0,
  carbs            NUMERIC(8,2) DEFAULT 0,
  fats             NUMERIC(8,2) DEFAULT 0,
  -- Micronutrients
  fiber            NUMERIC(8,4) DEFAULT 0,
  water            NUMERIC(8,4) DEFAULT 0,
  sodium           NUMERIC(10,4) DEFAULT 0,
  potassium        NUMERIC(10,4) DEFAULT 0,
  magnesium        NUMERIC(10,4) DEFAULT 0,
  iron             NUMERIC(10,4) DEFAULT 0,
  calcium          NUMERIC(10,4) DEFAULT 0,
  vit_d            NUMERIC(10,4) DEFAULT 0,
  vit_b12          NUMERIC(10,4) DEFAULT 0,
  omega3           NUMERIC(10,4) DEFAULT 0,
  vit_e            NUMERIC(10,4) DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: meal_logs
-- One row per (user, date).
-- Fixed meals (breakfast / lunch / dinner) are top-level JSONB columns.
-- Custom/extra meals live in extra_meals JSONB map.
--
-- Per-meal JSONB shape:
--   {
--     "status": "not_reported" | "eaten" | "not_eaten",
--     "items":  [ { "name": string, "quantity": number, "unit": string, ...nutrients } ],
--     "total_nutrients": { "kcal": number, "protein": number, ... }
--   }
-- ============================================================
CREATE TABLE IF NOT EXISTS public.meal_logs (
  id          UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID    NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date        DATE    NOT NULL,
  meals_list  TEXT[]  DEFAULT ARRAY['breakfast','lunch','dinner'],
  breakfast   JSONB   DEFAULT '{"status":"not_reported","items":[],"total_nutrients":{}}'::JSONB,
  lunch       JSONB   DEFAULT '{"status":"not_reported","items":[],"total_nutrients":{}}'::JSONB,
  dinner      JSONB   DEFAULT '{"status":"not_reported","items":[],"total_nutrients":{}}'::JSONB,
  extra_meals JSONB   DEFAULT '{}'::JSONB,   -- keyed by custom meal name
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)
);

-- ============================================================
-- TABLE: diet_plans
-- AI-generated weekly meal plans. One active plan per user.
-- weekly_plan JSON shape (from Gemini):
--   { "weekly_plan": { "monday": { "daily_cost": N, "meals": { ... } }, ... } }
-- ============================================================
CREATE TABLE IF NOT EXISTS public.diet_plans (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  weekly_plan JSONB       NOT NULL,
  budget      NUMERIC(8,2),       -- daily budget in INR
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_activities_user_id   ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_logs_user_date  ON public.meal_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_meal_logs_date       ON public.meal_logs(date);
CREATE INDEX IF NOT EXISTS idx_diet_plans_user_id   ON public.diet_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_food_items_name      ON public.food_items(name);

-- ============================================================
-- TRIGGER: auto-create public.users row when Supabase Auth
-- creates an auth.users row (email/password sign-up or OAuth).
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ============================================================
-- TRIGGER: auto-update updated_at columns
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS meal_logs_updated_at  ON public.meal_logs;
CREATE TRIGGER meal_logs_updated_at
  BEFORE UPDATE ON public.meal_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS diet_plans_updated_at ON public.diet_plans;
CREATE TRIGGER diet_plans_updated_at
  BEFORE UPDATE ON public.diet_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS profiles_updated_at   ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- API routes use the service-role key (bypasses RLS).
-- Browser/anon client calls are gated by these policies.
-- ============================================================
ALTER TABLE public.users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_logs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_plans  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_items  ENABLE ROW LEVEL SECURITY;

-- ── users ────────────────────────────────────────────────────
-- Allow the trigger (SECURITY DEFINER) to insert; users read/update own row.
CREATE POLICY "users: read own"   ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users: update own" ON public.users FOR UPDATE USING (auth.uid() = id);

-- ── profiles ─────────────────────────────────────────────────
CREATE POLICY "profiles: read own"   ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles: insert own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles: update own" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- ── activities ───────────────────────────────────────────────
CREATE POLICY "activities: read own"   ON public.activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "activities: insert own" ON public.activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "activities: update own" ON public.activities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "activities: delete own" ON public.activities FOR DELETE USING (auth.uid() = user_id);

-- ── meal_logs ────────────────────────────────────────────────
CREATE POLICY "meal_logs: read own"   ON public.meal_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "meal_logs: insert own" ON public.meal_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "meal_logs: update own" ON public.meal_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "meal_logs: delete own" ON public.meal_logs FOR DELETE USING (auth.uid() = user_id);

-- ── diet_plans ───────────────────────────────────────────────
CREATE POLICY "diet_plans: read own"   ON public.diet_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "diet_plans: insert own" ON public.diet_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "diet_plans: update own" ON public.diet_plans FOR UPDATE USING (auth.uid() = user_id);

-- ── food_items ───────────────────────────────────────────────
-- Anyone authenticated can read; only service-role can write (via API).
CREATE POLICY "food_items: public read" ON public.food_items
  FOR SELECT TO authenticated USING (true);
