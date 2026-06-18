-- Migration: Hapus tabel teachers dan munawib, gunakan profiles langsung

-- 1. Tambah kelas_id ke profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kelas_id uuid;
ALTER TABLE profiles ADD CONSTRAINT profiles_kelas_id_fkey 
  FOREIGN KEY (kelas_id) REFERENCES kelas(id);

-- 2. Hapus semua trigger
DROP TRIGGER IF EXISTS on_guru_profile_created ON profiles;
DROP TRIGGER IF EXISTS on_munawib_profile_created ON profiles;
DROP TRIGGER IF EXISTS on_profile_created ON auth.users;
DROP TRIGGER IF EXISTS create_profile_after_auth_user_insert ON auth.users;
DROP FUNCTION IF EXISTS auto_create_teacher() CASCADE;
DROP FUNCTION IF EXISTS auto_create_munawib() CASCADE;

-- 3. Update teacher_attendance FK
ALTER TABLE teacher_attendance DROP CONSTRAINT IF EXISTS teacher_attendance_teacher_id_fkey;
ALTER TABLE teacher_attendance RENAME COLUMN teacher_id TO profile_id;
ALTER TABLE teacher_attendance ADD CONSTRAINT teacher_attendance_profile_id_fkey 
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 4. Update munawib_mapel FK
ALTER TABLE munawib_mapel DROP CONSTRAINT IF EXISTS munawib_mapel_munawib_id_fkey;
ALTER TABLE munawib_mapel RENAME COLUMN munawib_id TO profile_id;
ALTER TABLE munawib_mapel ADD CONSTRAINT munawib_mapel_profile_id_fkey 
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 5. Update munawib_attendance FK  
ALTER TABLE munawib_attendance DROP CONSTRAINT IF EXISTS munawib_attendance_munawib_id_fkey;
ALTER TABLE munawib_attendance RENAME COLUMN munawib_id TO profile_id;
ALTER TABLE munawib_attendance ADD CONSTRAINT munawib_attendance_profile_id_fkey 
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 6. Update munawib_kelas FK
ALTER TABLE munawib_kelas DROP CONSTRAINT IF EXISTS munawib_kelas_munawib_id_fkey;
ALTER TABLE munawib_kelas RENAME COLUMN munawib_id TO profile_id;
ALTER TABLE munawib_kelas ADD CONSTRAINT munawib_kelas_profile_id_fkey 
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 7. Update munawib_schedule FK
ALTER TABLE munawib_schedule DROP CONSTRAINT IF EXISTS munawib_schedule_munawib_id_fkey;
ALTER TABLE munawib_schedule RENAME COLUMN munawib_id TO profile_id;
ALTER TABLE munawib_schedule ADD CONSTRAINT munawib_schedule_profile_id_fkey 
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 8. Hapus tabel teachers dan munawib
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS munawib CASCADE;

-- 9. Buat trigger sederhana untuk profile creation
CREATE OR REPLACE FUNCTION handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'guru')::user_role
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_profile();

-- 10. Update RLS policies untuk profiles
DROP POLICY IF EXISTS profiles_insert_own ON profiles;
CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS profiles_insert_service ON profiles;
CREATE POLICY profiles_insert_service ON profiles
  FOR INSERT TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS profiles_select_authenticated ON profiles;
CREATE POLICY profiles_select_authenticated ON profiles
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS profiles_admin_select ON profiles;
CREATE POLICY profiles_admin_select ON profiles
  FOR SELECT TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS profiles_update_own ON profiles;
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS admin_update_profiles ON profiles;
CREATE POLICY admin_update_profiles ON profiles
  FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS profiles_admin_delete ON profiles;
CREATE POLICY profiles_admin_delete ON profiles
  FOR DELETE TO public
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'::user_role));
