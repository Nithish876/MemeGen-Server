-- ==============================================================
-- MemeHub Supabase Schema Migration Script
-- ==============================================================
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor)
-- to provision all tables, relations, and indexes.

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES / USERS TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'creator',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 2. TEMPLATES TABLE
CREATE TABLE IF NOT EXISTS public.templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  box_count INTEGER NOT NULL DEFAULT 2,
  category TEXT NOT NULL DEFAULT 'Classic',
  tags TEXT[] DEFAULT '{}',
  description TEXT DEFAULT '',
  usage_count INTEGER DEFAULT 0,
  default_text_slots JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for template queries & filters
CREATE INDEX IF NOT EXISTS idx_templates_category ON public.templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_usage ON public.templates(usage_count DESC);

-- 3. MEME DRAFTS TABLE (Auto-saved editing state drafts)
CREATE TABLE IF NOT EXISTS public.meme_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  meme_title TEXT NOT NULL DEFAULT 'Untitled Meme',
  text_layers JSONB NOT NULL DEFAULT '[]'::jsonb,
  canvas_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  preview_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for draft lookups by user
CREATE INDEX IF NOT EXISTS idx_meme_drafts_user ON public.meme_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_meme_drafts_updated ON public.meme_drafts(updated_at DESC);

-- 4. MEMES TABLE (Published & Exported memes created by users)
CREATE TABLE IF NOT EXISTS public.memes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  text_layers JSONB NOT NULL DEFAULT '[]'::jsonb,
  canvas_settings JSONB DEFAULT '{}'::jsonb,
  width INTEGER DEFAULT 600,
  height INTEGER DEFAULT 600,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for user memes and public feed
CREATE INDEX IF NOT EXISTS idx_memes_user ON public.memes(user_id);
CREATE INDEX IF NOT EXISTS idx_memes_public_created ON public.memes(is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memes_likes ON public.memes(likes DESC);

-- 5. FUNCTION TO AUTO-UPDATE updated_at TIMESTAMP
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for profiles, drafts, and memes
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meme_drafts_updated_at ON public.meme_drafts;
CREATE TRIGGER update_meme_drafts_updated_at
  BEFORE UPDATE ON public.meme_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_memes_updated_at ON public.memes;
CREATE TRIGGER update_memes_updated_at
  BEFORE UPDATE ON public.memes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
