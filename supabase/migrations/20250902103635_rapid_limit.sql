/*
  # Create team_members table for team management

  1. New Tables
    - `team_members`
      - `id` (text, primary key) - Team member identifier
      - `name` (text, unique) - Team member name
      - `role` (text) - Job role/position
      - `specializations` (text[]) - Array of specializations
      - `completion_rate` (integer) - Performance completion rate percentage
      - `average_task_time` (integer) - Average task completion time in minutes
      - `quality_score` (integer) - Quality score percentage
      - `created_at` (timestamp) - Record creation time

  2. Security
    - Enable RLS on `team_members` table
    - Add policies for read access
*/

CREATE TABLE IF NOT EXISTS team_members (
  id text PRIMARY KEY,
  name text UNIQUE NOT NULL,
  role text NOT NULL,
  specializations text[] NOT NULL DEFAULT '{}',
  completion_rate integer NOT NULL DEFAULT 0,
  average_task_time integer NOT NULL DEFAULT 0,
  quality_score integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to team_members"
  ON team_members
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow update access to team_members"
  ON team_members
  FOR UPDATE
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow insert access to team_members"
  ON team_members
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_team_members_name ON team_members(name);

-- Insert initial team member data
INSERT INTO team_members (id, name, role, specializations, completion_rate, average_task_time, quality_score) VALUES
  ('TM001', 'Tewachew', 'Lead Installation Technician', 
   ARRAY['GPS Installation', 'Vehicle Inspection', 'System Configuration', 'Fuel Sensor Installation'], 
   95, 45, 98),
  ('TM002', 'Mandefro', 'Fuel Systems Specialist', 
   ARRAY['Fuel Sensor Calibration', 'Tank Systems', 'Sensor Diagnostics', 'System Testing'], 
   92, 55, 96),
  ('TM003', 'Abebaw Abebe', 'Quality Assurance & Documentation', 
   ARRAY['Quality Control', 'System Testing', 'Documentation', 'Project Reporting', 'Final Inspection'], 
   98, 25, 99)
ON CONFLICT (id) DO NOTHING;