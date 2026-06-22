-- Add mapel_id column to grades table
ALTER TABLE grades ADD COLUMN IF NOT EXISTS mapel_id UUID REFERENCES mapel(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_grades_mapel ON grades(mapel_id);
