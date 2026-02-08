-- Replace 'round_robin' with 'assigned' in the rotation_type check constraint
-- Also migrates any existing rows that used 'round_robin'

UPDATE leagues SET rotation_type = 'assigned' WHERE rotation_type = 'round_robin';

ALTER TABLE leagues DROP CONSTRAINT IF EXISTS leagues_rotation_type_check;
ALTER TABLE leagues ADD CONSTRAINT leagues_rotation_type_check
  CHECK (rotation_type IS NULL OR rotation_type IN ('random','assigned'));
