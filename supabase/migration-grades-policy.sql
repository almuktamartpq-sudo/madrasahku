-- Update grades RLS policies for guru edit permission
-- Guru bisa UPDATE (edit nilai) tapi TIDAK bisa DELETE
-- Admin bisa UPDATE dan DELETE

-- Drop existing policies
DROP POLICY IF EXISTS grades_admin_modify ON grades;
DROP POLICY IF EXISTS grades_admin_select ON grades;
DROP POLICY IF EXISTS grades_guru_modify ON grades;
DROP POLICY IF EXISTS grades_parent_select ON grades;
DROP POLICY IF EXISTS grades_select_filtered ON grades;

-- Admin: SELECT (read) dan UPDATE (edit), tapi bukan DELETE
CREATE POLICY grades_admin_select ON grades
  FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY grades_admin_update ON grades
  FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admin: DELETE (hanya admin bisa hapus)
CREATE POLICY grades_admin_delete ON grades
  FOR DELETE TO authenticated
  USING (is_admin());

-- Guru: SELECT (read), INSERT (tambah nilai), UPDATE (edit nilai)
-- Guru TIDAK punya DELETE permission
CREATE POLICY grades_guru_select ON grades
  FOR SELECT TO authenticated
  USING (is_admin_or_guru());

CREATE POLICY grades_guru_insert ON grades
  FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_guru());

CREATE POLICY grades_guru_update ON grades
  FOR UPDATE TO authenticated
  USING (is_admin_or_guru())
  WITH CHECK (is_admin_or_guru());

-- Orangtua: SELECT (hanya nilai anaknya)
CREATE POLICY grades_parent_select ON grades
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM parent_students ps
      WHERE ps.parent_id = auth.uid() AND ps.student_id = grades.student_id
    )
  );
