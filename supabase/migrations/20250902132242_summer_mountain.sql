/*
  # Enhance task scheduling with dynamic dates and flexible durations

  1. New Tables
    - `project_settings`
      - `id` (uuid, primary key)
      - `project_start_date` (date) - User-defined project start date
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Table Updates
    - Add `start_date` (date) to tasks table
    - Add `end_date` (date) to tasks table
    - Add `duration_days` (integer) to tasks table
    - Add `depends_on` (text[]) to tasks table for task dependencies
    - Add `start_date` (date) to vehicles table
    - Add `end_date` (date) to vehicles table
    - Add `duration_days` (integer) to vehicles table

  3. Security
    - Enable RLS on new tables
    - Add policies for read and update access
*/

-- Create project settings table
CREATE TABLE IF NOT EXISTS project_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_start_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE project_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to project_settings"
  ON project_settings
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow update access to project_settings"
  ON project_settings
  FOR UPDATE
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow insert access to project_settings"
  ON project_settings
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Add new columns to tasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE tasks ADD COLUMN start_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE tasks ADD COLUMN end_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'duration_days'
  ) THEN
    ALTER TABLE tasks ADD COLUMN duration_days integer DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'depends_on'
  ) THEN
    ALTER TABLE tasks ADD COLUMN depends_on text[] DEFAULT '{}';
  END IF;
END $$;

-- Add new columns to vehicles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN start_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN end_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'duration_days'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN duration_days integer DEFAULT 1;
  END IF;
END $$;

-- Insert default project settings
INSERT INTO project_settings (project_start_date) VALUES (CURRENT_DATE)
ON CONFLICT DO NOTHING;

-- Update existing tasks with calculated dates based on current day field
UPDATE tasks SET 
  start_date = CURRENT_DATE,
  end_date = CURRENT_DATE,
  duration_days = 1
WHERE start_date IS NULL;

-- Update existing vehicles with calculated dates based on current day field
UPDATE vehicles SET 
  start_date = CURRENT_DATE + (day - 1),
  end_date = CURRENT_DATE + (day - 1),
  duration_days = 1
WHERE start_date IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_start_date ON tasks(start_date);
CREATE INDEX IF NOT EXISTS idx_tasks_end_date ON tasks(end_date);
CREATE INDEX IF NOT EXISTS idx_vehicles_start_date ON vehicles(start_date);
CREATE INDEX IF NOT EXISTS idx_vehicles_end_date ON vehicles(end_date);

-- Create function to automatically update dependent tasks when a task is delayed
CREATE OR REPLACE FUNCTION update_dependent_tasks()
RETURNS TRIGGER AS $$
BEGIN
  -- Update dependent tasks when a task's end date changes
  IF OLD.end_date IS DISTINCT FROM NEW.end_date THEN
    UPDATE tasks 
    SET 
      start_date = NEW.end_date + 1,
      end_date = NEW.end_date + duration_days,
      updated_at = now()
    WHERE NEW.id = ANY(depends_on);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic task dependency updates
DROP TRIGGER IF EXISTS trigger_update_dependent_tasks ON tasks;
CREATE TRIGGER trigger_update_dependent_tasks
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_dependent_tasks();