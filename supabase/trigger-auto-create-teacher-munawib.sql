-- Trigger: Auto-create teacher record when profile with role='guru' is created
CREATE OR REPLACE FUNCTION auto_create_teacher()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'guru' THEN
    INSERT INTO teachers (name, phone, email, profile_id)
    VALUES (NEW.name, COALESCE(NEW.phone, ''), NEW.email, NEW.id)
    ON CONFLICT (email) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_guru_profile_created ON profiles;
CREATE TRIGGER on_guru_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_teacher();

-- Trigger: Auto-create munawib record when profile with role='munawib' is created
CREATE OR REPLACE FUNCTION auto_create_munawib()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'munawib' THEN
    INSERT INTO munawib (name, phone, email, profile_id)
    VALUES (NEW.name, COALESCE(NEW.phone, ''), NEW.email, NEW.id)
    ON CONFLICT (email) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_munawib_profile_created ON profiles;
CREATE TRIGGER on_munawib_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_munawib();
