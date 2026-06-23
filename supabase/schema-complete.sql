-- ============================================
-- MADRASAH MUKTAMAR - Complete Database Schema
-- ============================================

-- 1. ENUM Types
CREATE TYPE user_role AS ENUM ('admin', 'guru', 'munawib', 'orangtua');
CREATE TYPE attendance_status AS ENUM ('hadir', 'sakit', 'izin', 'alfa');
CREATE TYPE payment_status AS ENUM ('lunas', 'belum_lunas');
CREATE TYPE grade_type AS ENUM ('tamrin', 'uts', 'uas', 'harian');

-- ============================================
-- 2. TABLES
-- ============================================

-- Profiles (users - replaces teachers and munawib tables)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'guru',
  avatar TEXT,
  phone TEXT,
  kelas_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Kelas
CREATE TABLE kelas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  urutan INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add FK to profiles after kelas exists
ALTER TABLE profiles ADD CONSTRAINT profiles_kelas_id_fkey 
  FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE SET NULL;

-- Students
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nis TEXT NOT NULL,
  name TEXT NOT NULL,
  photo TEXT,
  alamat TEXT NOT NULL,
  phone TEXT NOT NULL,
  parent_name TEXT NOT NULL,
  parent_phone TEXT NOT NULL,
  tanggal_masuk DATE NOT NULL DEFAULT CURRENT_DATE,
  kelas_id UUID REFERENCES kelas(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mapel (Mata Pelajaran)
CREATE TABLE mapel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  kelas_id UUID REFERENCES kelas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Grades
CREATE TABLE grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  semester TEXT NOT NULL DEFAULT '1',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  keterangan TEXT,
  kelas_id UUID REFERENCES kelas(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Student Attendance
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status attendance_status NOT NULL DEFAULT 'hadir',
  keterangan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, date)
);

-- Teacher Attendance (now uses profile_id from profiles)
CREATE TABLE teacher_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'hadir',
  keterangan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, date)
);

-- Munawib Attendance (now uses profile_id from profiles)
CREATE TABLE munawib_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'hadir',
  keterangan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, date)
);

-- Munawib Mapel (now uses profile_id)
CREATE TABLE munawib_mapel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mapel_id UUID NOT NULL REFERENCES mapel(id) ON DELETE CASCADE,
  UNIQUE(profile_id, mapel_id)
);

-- Munawib Kelas (now uses profile_id)
CREATE TABLE munawib_kelas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kelas_id UUID NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
  UNIQUE(profile_id, kelas_id)
);

-- Munawib Schedule (now uses profile_id)
CREATE TABLE munawib_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payment Types
CREATE TABLE payment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  jumlah INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  status payment_status NOT NULL DEFAULT 'belum_lunas',
  due_date DATE NOT NULL,
  paid_date DATE,
  bulan INTEGER,
  tahun INTEGER,
  keterangan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Parent-Student relationship
CREATE TABLE parent_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE(parent_id, student_id)
);

-- ============================================
-- 3. FUNCTIONS
-- ============================================

-- Check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user is admin or guru
CREATE OR REPLACE FUNCTION is_admin_or_guru()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin'::user_role, 'guru'::user_role)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Create profile when auth user is created
CREATE OR REPLACE FUNCTION handle_new_profile()
RETURNS TRIGGER AS $$
DECLARE
  user_role_val TEXT;
BEGIN
  user_role_val := COALESCE(NEW.raw_user_meta_data->>'role', 'guru');
  
  IF user_role_val NOT IN ('admin', 'guru', 'munawib', 'orangtua') THEN
    user_role_val := 'guru';
  END IF;
  
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    user_role_val::user_role
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin delete user RPC
CREATE OR REPLACE FUNCTION admin_delete_user(target_id UUID)
RETURNS VOID AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admin can delete users';
  END IF;
  DELETE FROM auth.users WHERE id = target_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. TRIGGERS
-- ============================================
-- NO TRIGGERS - Profile creation handled by application code
-- This keeps things simple and avoids auth.users permission issues

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mapel ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE munawib_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE munawib_mapel ENABLE ROW LEVEL SECURITY;
ALTER TABLE munawib_kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE munawib_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_students ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES RLS
-- ============================================

CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY profiles_insert_service ON profiles
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY profiles_select_authenticated ON profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY admin_update_profiles ON profiles
  FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY profiles_admin_delete ON profiles
  FOR DELETE TO public
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'::user_role));

-- ============================================
-- KELAS RLS
-- ============================================

CREATE POLICY kelas_select ON kelas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY kelas_insert ON kelas
  FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY kelas_update ON kelas
  FOR UPDATE TO authenticated USING (is_admin());

CREATE POLICY kelas_delete ON kelas
  FOR DELETE TO authenticated USING (is_admin());

-- ============================================
-- STUDENTS RLS
-- ============================================

CREATE POLICY students_select ON students
  FOR SELECT TO authenticated USING (true);

CREATE POLICY students_insert ON students
  FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY students_update ON students
  FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY students_delete ON students
  FOR DELETE TO authenticated USING (is_admin());

-- ============================================
-- MAPEL RLS
-- ============================================

CREATE POLICY mapel_select ON mapel
  FOR SELECT TO authenticated USING (true);

CREATE POLICY mapel_admin_all ON mapel
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- ============================================
-- GRADES RLS
-- ============================================

CREATE POLICY grades_admin_select ON grades
  FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'::user_role));

CREATE POLICY grades_admin_modify ON grades
  FOR ALL TO public
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'::user_role))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'::user_role));

CREATE POLICY grades_guru_modify ON grades
  FOR ALL TO authenticated USING (is_admin_or_guru()) WITH CHECK (is_admin_or_guru());

CREATE POLICY grades_parent_select ON grades
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM parent_students ps WHERE ps.parent_id = auth.uid() AND ps.student_id = grades.student_id));

CREATE POLICY grades_select_filtered ON grades
  FOR SELECT TO authenticated
  USING (is_admin() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND kelas_id = grades.kelas_id AND role = 'guru'::user_role));

-- ============================================
-- ATTENDANCE (Student) RLS
-- ============================================

CREATE POLICY attendance_admin_select ON attendance
  FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'::user_role));

CREATE POLICY attendance_admin_modify ON attendance
  FOR ALL TO public
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'::user_role))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'::user_role));

CREATE POLICY attendance_all_authenticated ON attendance
  FOR SELECT TO authenticated USING (true);

CREATE POLICY attendance_guru_modify ON attendance
  FOR ALL TO authenticated USING (is_admin_or_guru()) WITH CHECK (is_admin_or_guru());

CREATE POLICY attendance_parent_select ON attendance
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM parent_students ps WHERE ps.parent_id = auth.uid() AND ps.student_id = attendance.student_id));

-- ============================================
-- TEACHER ATTENDANCE RLS
-- ============================================

CREATE POLICY teacher_attendance_admin ON teacher_attendance
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY teacher_attendance_select ON teacher_attendance
  FOR SELECT TO authenticated USING (true);

CREATE POLICY teacher_attendance_self ON teacher_attendance
  FOR INSERT TO authenticated
  WITH CHECK (
    profile_id = auth.uid() AND 
    status IN ('izin', 'sakit')
  );

-- ============================================
-- MUNAWIB ATTENDANCE RLS
-- ============================================

CREATE POLICY munawib_attendance_admin ON munawib_attendance
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY munawib_attendance_select ON munawib_attendance
  FOR SELECT TO authenticated USING (true);

CREATE POLICY munawib_attendance_self ON munawib_attendance
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'munawib'::user_role) AND
    profile_id = auth.uid() AND 
    status IN ('izin', 'sakit')
  );

-- ============================================
-- MUNAWIB MAPEL RLS
-- ============================================

CREATE POLICY munawib_mapel_select ON munawib_mapel
  FOR SELECT TO authenticated USING (true);

CREATE POLICY munawib_mapel_write ON munawib_mapel
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- ============================================
-- MUNAWIB KELAS RLS
-- ============================================

CREATE POLICY munawib_kelas_select ON munawib_kelas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY munawib_kelas_write ON munawib_kelas
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- ============================================
-- MUNAWIB SCHEDULE RLS
-- ============================================

CREATE POLICY munawib_schedule_select ON munawib_schedule
  FOR SELECT TO authenticated USING (true);

CREATE POLICY munawib_schedule_write ON munawib_schedule
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- ============================================
-- PAYMENTS RLS
-- ============================================

CREATE POLICY payments_admin_select ON payments
  FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'::user_role));

CREATE POLICY payments_admin_modify ON payments
  FOR ALL TO public
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'::user_role))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'::user_role));

CREATE POLICY payments_all_authenticated ON payments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY payments_parent_select ON payments
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM parent_students ps WHERE ps.parent_id = auth.uid() AND ps.student_id = payments.student_id));

-- ============================================
-- PAYMENT TYPES RLS
-- ============================================

CREATE POLICY payment_types_select ON payment_types
  FOR SELECT TO authenticated USING (true);

CREATE POLICY payment_types_insert ON payment_types
  FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY payment_types_update ON payment_types
  FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY payment_types_delete ON payment_types
  FOR DELETE TO authenticated USING (is_admin());

-- ============================================
-- PARENT STUDENTS RLS
-- ============================================

CREATE POLICY parent_students_admin_select ON parent_students
  FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY parent_students_guru_select ON parent_students
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = parent_students.student_id
      AND s.kelas_id = (SELECT kelas_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY parent_students_parent_select ON parent_students
  FOR SELECT TO authenticated
  USING (parent_id = auth.uid());

CREATE POLICY parent_students_insert ON parent_students
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

CREATE POLICY parent_students_delete ON parent_students
  FOR DELETE TO authenticated
  USING ((auth.jwt() ->> 'role') = 'admin');

-- ============================================
-- 6. INDEXES (for performance)
-- ============================================

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_students_kelas ON students(kelas_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_teacher_attendance_date ON teacher_attendance(date);
CREATE INDEX idx_teacher_attendance_profile ON teacher_attendance(profile_id);
CREATE INDEX idx_munawib_attendance_date ON munawib_attendance(date);
CREATE INDEX idx_munawib_attendance_profile ON munawib_attendance(profile_id);
CREATE INDEX idx_grades_student ON grades(student_id);
CREATE INDEX idx_grades_date ON grades(date);
CREATE INDEX idx_payments_student ON payments(student_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_munawib_mapel_profile ON munawib_mapel(profile_id);
