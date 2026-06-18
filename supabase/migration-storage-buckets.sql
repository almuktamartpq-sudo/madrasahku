-- ============================================
-- Migration: Create Storage Buckets for Photos
-- Bucket: students, guru, munawib
-- ============================================

-- 1. Create buckets (public = auto readable by everyone)
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('students', 'students', true),
  ('guru', 'guru', true),
  ('munawib', 'munawib', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. RLS Policies untuk storage.objects
--    HARUS dijalankan via Supabase Dashboard > Storage > Policies
--    karena SQL Editor tidak punya ownership ke storage.objects
-- ============================================
--
-- Untuk setiap bucket, tambahkan policy berikut via Dashboard:
--
-- [SELECT] Public read access:
--   Policy name: Public read access
--   Allowed operation: SELECT
--   Target roles: public
--   Policy definition (USING): bucket_id = 'students'  (ganti untuk guru/munawib)
--
-- [INSERT] Authenticated upload:
--   Policy name: Authenticated users can upload
--   Allowed operation: INSERT
--   Target roles: authenticated
--   Policy definition (WITH CHECK):
--     bucket_id = 'students'
--     AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'guru')
--
-- [UPDATE] Authenticated update:
--   Policy name: Authenticated users can update
--   Allowed operation: UPDATE
--   Target roles: authenticated
--   Policy definition (USING):
--     bucket_id = 'students'
--     AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'guru')
--
-- [DELETE] Authenticated delete:
--   Policy name: Authenticated users can delete
--   Allowed operation: DELETE
--   Target roles: authenticated
--   Policy definition (USING):
--     bucket_id = 'students'
--     AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'guru')
--
-- Ulangi untuk bucket 'guru' dan 'munawib' (ganti bucket_id)
