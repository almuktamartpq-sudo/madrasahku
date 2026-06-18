-- ============================================
-- Storage RLS Policies: students, guru, munawib
-- Jalankan di Supabase SQL Editor
-- ============================================

-- ============================================
-- BUCKET: students
-- ============================================

DROP POLICY IF EXISTS "students_public_read" ON storage.objects;
DROP POLICY IF EXISTS "students_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "students_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "students_auth_delete" ON storage.objects;

-- SELECT: Semua user bisa baca foto students
CREATE POLICY "students_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'students');

-- INSERT: Hanya admin dan guru yang bisa upload
CREATE POLICY "students_auth_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'students'
  AND auth.uid() IS NOT NULL
  AND (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'guru')
    )
  )
);

-- UPDATE: Hanya admin dan guru yang bisa update
CREATE POLICY "students_auth_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'students'
  AND auth.uid() IS NOT NULL
  AND (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'guru')
    )
  )
);

-- DELETE: Hanya admin dan guru yang bisa hapus
CREATE POLICY "students_auth_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'students'
  AND auth.uid() IS NOT NULL
  AND (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'guru')
    )
  )
);

-- ============================================
-- BUCKET: guru
-- ============================================

DROP POLICY IF EXISTS "guru_public_read" ON storage.objects;
DROP POLICY IF EXISTS "guru_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "guru_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "guru_auth_delete" ON storage.objects;

CREATE POLICY "guru_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'guru');

CREATE POLICY "guru_auth_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'guru'
  AND auth.uid() IS NOT NULL
  AND (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'guru')
    )
  )
);

CREATE POLICY "guru_auth_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'guru'
  AND auth.uid() IS NOT NULL
  AND (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'guru')
    )
  )
);

CREATE POLICY "guru_auth_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'guru'
  AND auth.uid() IS NOT NULL
  AND (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'guru')
    )
  )
);

-- ============================================
-- BUCKET: munawib
-- ============================================

DROP POLICY IF EXISTS "munawib_public_read" ON storage.objects;
DROP POLICY IF EXISTS "munawib_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "munawib_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "munawib_auth_delete" ON storage.objects;

CREATE POLICY "munawib_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'munawib');

CREATE POLICY "munawib_auth_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'munawib'
  AND auth.uid() IS NOT NULL
  AND (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'guru')
    )
  )
);

CREATE POLICY "munawib_auth_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'munawib'
  AND auth.uid() IS NOT NULL
  AND (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'guru')
    )
  )
);

CREATE POLICY "munawib_auth_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'munawib'
  AND auth.uid() IS NOT NULL
  AND (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'guru')
    )
  )
);
