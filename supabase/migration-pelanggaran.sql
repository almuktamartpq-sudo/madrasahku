-- ============================================
-- PELANGGARAN (Violations) TABLE
-- ============================================

-- Create pelanggaran table
CREATE TABLE pelanggaran (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  jenis TEXT NOT NULL CHECK (jenis IN ('ringan', 'sedang', 'berat')),
  kartu TEXT NOT NULL DEFAULT 'kuning' CHECK (kartu IN ('kuning', 'oranye', 'merah')),
  deskripsi TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE pelanggaran ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admin can do everything
CREATE POLICY pelanggaran_admin_all ON pelanggaran
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Guru can CRUD (create, read, update, delete)
CREATE POLICY pelanggaran_guru_modify ON pelanggaran
  FOR ALL TO authenticated
  USING (is_admin_or_guru())
  WITH CHECK (is_admin_or_guru());

-- Munawib can only view
CREATE POLICY pelanggaran_select ON pelanggaran
  FOR SELECT TO authenticated
  USING (true);

-- Parent can view their children's violations
CREATE POLICY pelanggaran_parent_select ON pelanggaran
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM parent_students ps
    WHERE ps.parent_id = auth.uid()
    AND ps.student_id = pelanggaran.student_id
  ));

-- Index for performance
CREATE INDEX idx_pelanggaran_student ON pelanggaran(student_id);
CREATE INDEX idx_pelanggaran_tanggal ON pelanggaran(tanggal);
CREATE INDEX idx_pelanggaran_kartu ON pelanggaran(kartu);
