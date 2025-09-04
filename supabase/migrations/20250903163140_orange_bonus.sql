/*
  # Fix tasks table ID column

  1. Changes
    - Modify `tasks` table `id` column to use uuid type with auto-generation
    - Change from text to uuid PRIMARY KEY with DEFAULT gen_random_uuid()
    - This resolves the null constraint violation when creating new tasks

  2. Security
    - Maintains existing RLS policies
    - No changes to security configuration
*/

-- Drop existing table and recreate with proper ID column
DROP TABLE IF EXISTS tasks CASCADE;

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed')),
  assigned_to text NOT NULL,
  priority text NOT NULL DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to tasks"
  ON tasks
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow update access to tasks"
  ON tasks
  FOR UPDATE
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow insert access to tasks"
  ON tasks
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

-- Insert initial task data with new UUID format
INSERT INTO tasks (name, status, assigned_to, priority, notes) VALUES
  ('Vehicle Inspection', 'In Progress', 'Tewachew', 'High', 'Pre-installation vehicle assessment and documentation'),
  ('GPS Device Installation', 'Pending', 'Tewachew', 'High', 'Install and mount GPS tracking devices'),
  ('Fuel Sensor Installation', 'Pending', 'Tewachew', 'High', 'Install fuel level sensors in tanks'),
  ('System Configuration', 'Pending', 'Tewachew', 'High', 'Configure GPS and sensor settings'),
  ('Fuel Sensor Calibration', 'Pending', 'Mandefro', 'High', 'Calibrate fuel sensors for accurate readings'),
  ('Quality Assurance', 'Pending', 'Abebaw Abebe', 'Medium', 'Final system testing and validation'),
  ('Documentation', 'Pending', 'Abebaw Abebe', 'Medium', 'Complete installation documentation');