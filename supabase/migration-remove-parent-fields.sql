-- ============================================
-- Migration: Remove parent_name and parent_phone from students table
-- Parent data is now managed via profiles + parent_students junction table
-- ============================================

ALTER TABLE public.students DROP COLUMN IF EXISTS parent_name;
ALTER TABLE public.students DROP COLUMN IF EXISTS parent_phone;
