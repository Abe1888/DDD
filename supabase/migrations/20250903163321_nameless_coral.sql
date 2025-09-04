/*
  # Fix tasks table with complete schema

  1. Changes
    - Modify `tasks` table to include all required columns:
      - `id` (uuid, primary key with auto-generation)
      - `vehicle_id` (text, required)
      - `name` (text, required)
      - `description` (text, optional)
      - `status` (text with enum including 'Blocked')
      - `priority` (text with enum)
      - `assigned_to` (text, required)
      - `estimated_duration` (integer, optional)
      - `actual_duration` (integer, optional)
      - `start_date` (date, optional)
      - `end_date` (date, optional)
      - `duration_days` (integer, optional)
      - `completed_at` (timestamptz, optional)
      - `tags` (text array, optional)
      - `depends_on` (uuid array, optional)
      - `created_by` (text, optional)
      - `created_at` (timestamptz with default)
      - `updated_at` (timestamptz with default)

  2. Security
    - Enable RLS on `tasks` table
    - Add policies for authenticated and anonymous access
    - Maintain existing security configuration

  3. Performance
    - Add indexes for frequently queried columns
    - Include foreign key relationships where appropriate
*/

-- Drop existing table and recreate with complete schema
DROP TABLE IF EXISTS tasks CASCADE;

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id text NOT NULL,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Blocked')),
  priority text NOT NULL DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
  assigned_to text NOT NULL,
  estimated_duration integer,
  actual_duration integer,
  start_date date,
  end_date date,
  duration_days integer,
  completed_at timestamptz,
  tags text[],
  depends_on uuid[],
  created_by text,
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
CREATE INDEX IF NOT EXISTS idx_tasks_vehicle_id ON tasks(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_start_date ON tasks(start_date);
CREATE INDEX IF NOT EXISTS idx_tasks_end_date ON tasks(end_date);

-- Function to update dependent tasks when a task is completed
CREATE OR REPLACE FUNCTION update_dependent_tasks()
RETURNS TRIGGER AS $$
BEGIN
  -- When a task is completed, update dependent tasks
  IF NEW.status = 'Completed' AND OLD.status != 'Completed' THEN
    UPDATE tasks 
    SET status = 'Pending'
    WHERE NEW.id = ANY(depends_on) AND status = 'Blocked';
  END IF;
  
  -- When a task is blocked or in progress, block dependent tasks
  IF NEW.status IN ('Blocked', 'In Progress') AND OLD.status = 'Pending' THEN
    UPDATE tasks 
    SET status = 'Blocked'
    WHERE NEW.id = ANY(depends_on) AND status = 'Pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for dependency management
DROP TRIGGER IF EXISTS trigger_update_dependent_tasks ON tasks;
CREATE TRIGGER trigger_update_dependent_tasks
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_dependent_tasks();

-- Insert initial task data with proper vehicle assignments
INSERT INTO tasks (vehicle_id, name, description, status, assigned_to, priority, estimated_duration, start_date, notes) VALUES
  ('V001', 'Vehicle Inspection', 'Pre-installation vehicle assessment and documentation', 'In Progress', 'Tewachew', 'High', 120, '2024-01-15', 'Pre-installation vehicle assessment and documentation'),
  ('V001', 'GPS Device Installation', 'Install and mount GPS tracking devices', 'Pending', 'Tewachew', 'High', 180, '2024-01-16', 'Install and mount GPS tracking devices'),
  ('V001', 'Fuel Sensor Installation', 'Install fuel level sensors in tanks', 'Pending', 'Tewachew', 'High', 240, '2024-01-17', 'Install fuel level sensors in tanks'),
  ('V001', 'System Configuration', 'Configure GPS and sensor settings', 'Pending', 'Tewachew', 'High', 90, '2024-01-18', 'Configure GPS and sensor settings'),
  ('V002', 'Fuel Sensor Calibration', 'Calibrate fuel sensors for accurate readings', 'Pending', 'Mandefro', 'High', 150, '2024-01-19', 'Calibrate fuel sensors for accurate readings'),
  ('V002', 'Quality Assurance', 'Final system testing and validation', 'Pending', 'Abebaw Abebe', 'Medium', 120, '2024-01-20', 'Final system testing and validation'),
  ('V003', 'Documentation', 'Complete installation documentation', 'Pending', 'Abebaw Abebe', 'Medium', 60, '2024-01-21', 'Complete installation documentation');