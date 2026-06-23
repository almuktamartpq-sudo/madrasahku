-- ============================================
-- Fix parent_students RLS: guru hanya bisa lihat
-- parent_students untuk siswa di kelasnya saja
-- ============================================

-- Drop existing policies (ignore if not exists)
DROP POLICY IF EXISTS parent_students_select ON parent_students;
DROP POLICY IF EXISTS parent_students_admin_select ON parent_students;
DROP POLICY IF EXISTS parent_students_guru_select ON parent_students;
DROP POLICY IF EXISTS parent_students_parent_select ON parent_students;

-- Admin: bisa lihat semua
CREATE POLICY parent_students_admin_select ON parent_students
  FOR SELECT TO authenticated
  USING (is_admin());

-- Guru: hanya bisa lihat parent_students untuk siswa di kelasnya
CREATE POLICY parent_students_guru_select ON parent_students
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = parent_students.student_id
      AND s.kelas_id = (SELECT kelas_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Orangtua: hanya bisa lihat record parent_students miliknya sendiri
CREATE POLICY parent_students_parent_select ON parent_students
  FOR SELECT TO authenticated
  USING (parent_id = auth.uid());
