/*
  # Create tasks table for task management

  1. New Tables
    - `tasks`
      - `id` (text, primary key) - Task identifier
      - `name` (text) - Task name
      - `status` (text) - Task status (Pending, In Progress, Completed)
      - `assigned_to` (text) - Team member assigned to task
      - `priority` (text) - Task priority (High, Medium, Low)
      - `notes` (text) - Task notes and description
      - `created_at` (timestamp) - Record creation time
      - `updated_at` (timestamp) - Last update time

  2. Security
    - Enable RLS on `tasks` table
    - Add policies for read and update access
*/

CREATE TABLE IF NOT EXISTS tasks (
  id text PRIMARY KEY,
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

-- Insert initial task data
INSERT INTO tasks (id, name, status, assigned_to, priority, notes) VALUES
  ('T001', 'Vehicle Inspection', 'In Progress', 'Tewachew', 'High', 'Pre-installation vehicle assessment and documentation'),
  ('T002', 'GPS Device Installation', 'Pending', 'Tewachew', 'High', 'Install and mount GPS tracking devices'),
  ('T003', 'Fuel Sensor Installation', 'Pending', 'Tewachew', 'High', 'Install fuel level sensors in tanks'),
  ('T004', 'System Configuration', 'Pending', 'Tewachew', 'High', 'Configure GPS and sensor settings'),
  ('T005', 'Fuel Sensor Calibration', 'Pending', 'Mandefro', 'High', 'Calibrate fuel sensors for accurate readings'),
  ('T006', 'Quality Assurance', 'Pending', 'Abebaw Abebe', 'Medium', 'Final system testing and validation'),
  ('T007', 'Documentation', 'Pending', 'Abebaw Abebe', 'Medium', 'Complete installation documentation')
ON CONFLICT (id) DO NOTHING;