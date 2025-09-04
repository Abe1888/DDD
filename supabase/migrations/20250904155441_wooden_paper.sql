/*
  # Project Management Enhancements

  1. New Tables
    - Enhanced `project_settings` table with comprehensive project configuration
    - Project reset audit log for tracking reset operations

  2. Enhanced Features
    - Project start date management with automatic schedule recalculation
    - Project reset functionality with complete state cleanup
    - Audit trail for project management operations

  3. Security
    - Enable RLS on all new tables
    - Add policies for authenticated and anonymous access
    - Maintain data integrity during reset operations

  4. Performance
    - Add indexes for frequently queried columns
    - Optimize batch operations for schedule updates
*/

-- Enhanced project settings table
CREATE TABLE IF NOT EXISTS project_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_start_date date NOT NULL DEFAULT CURRENT_DATE,
  project_name text DEFAULT 'GPS Installation Project',
  project_description text DEFAULT 'Vehicle GPS tracking device and fuel level sensor installation',
  total_duration_days integer DEFAULT 14,
  total_vehicles integer DEFAULT 24,
  total_locations integer DEFAULT 3,
  is_active boolean DEFAULT false,
  last_reset_date timestamptz,
  reset_count integer DEFAULT 0,
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

-- Project reset audit log
CREATE TABLE IF NOT EXISTS project_reset_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reset_type text NOT NULL CHECK (reset_type IN ('Full Reset', 'Partial Reset', 'Date Change')),
  reset_reason text,
  vehicles_affected integer DEFAULT 0,
  tasks_affected integer DEFAULT 0,
  comments_cleared integer DEFAULT 0,
  performed_by text DEFAULT 'System',
  old_start_date date,
  new_start_date date,
  reset_duration_ms integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE project_reset_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to project_reset_log"
  ON project_reset_log
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow insert access to project_reset_log"
  ON project_reset_log
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Function to perform complete project reset
CREATE OR REPLACE FUNCTION reset_project_to_initial_state()
RETURNS TABLE (
  vehicles_reset integer,
  tasks_reset integer,
  comments_cleared integer,
  history_cleared integer,
  maintenance_cleared integer,
  documents_cleared integer
) AS $$
DECLARE
  v_count integer := 0;
  t_count integer := 0;
  c_count integer := 0;
  h_count integer := 0;
  m_count integer := 0;
  d_count integer := 0;
  reset_start_time timestamptz;
BEGIN
  reset_start_time := now();
  
  -- Count records before reset
  SELECT COUNT(*) INTO v_count FROM vehicles WHERE status != 'Pending';
  SELECT COUNT(*) INTO t_count FROM tasks WHERE status != 'Pending';
  SELECT COUNT(*) INTO c_count FROM comments;
  SELECT COUNT(*) INTO h_count FROM vehicle_registration_history;
  SELECT COUNT(*) INTO m_count FROM vehicle_maintenance;
  SELECT COUNT(*) INTO d_count FROM vehicle_documents;

  -- Reset vehicles to initial state
  UPDATE vehicles SET 
    status = 'Pending',
    installation_status = 'Not Started',
    installation_notes = NULL,
    technician_assigned = NULL,
    gps_device_id = NULL,
    fuel_sensor_ids = NULL,
    installation_date = NULL,
    last_maintenance = NULL,
    next_maintenance = NULL,
    updated_at = now()
  WHERE status != 'Pending' OR installation_status != 'Not Started';

  -- Reset tasks to initial state
  UPDATE tasks SET 
    status = 'Pending',
    actual_duration = NULL,
    completed_at = NULL,
    updated_at = now()
  WHERE status != 'Pending';

  -- Clear all comments
  DELETE FROM comments;

  -- Clear vehicle history
  DELETE FROM vehicle_registration_history;

  -- Clear maintenance records
  DELETE FROM vehicle_maintenance;

  -- Clear vehicle documents
  DELETE FROM vehicle_documents;

  -- Update project settings
  UPDATE project_settings SET 
    last_reset_date = now(),
    reset_count = reset_count + 1,
    updated_at = now();

  -- Log the reset operation
  INSERT INTO project_reset_log (
    reset_type,
    reset_reason,
    vehicles_affected,
    tasks_affected,
    comments_cleared,
    performed_by,
    reset_duration_ms
  ) VALUES (
    'Full Reset',
    'Complete project reset to initial state',
    v_count,
    t_count,
    c_count,
    'System',
    EXTRACT(EPOCH FROM (now() - reset_start_time)) * 1000
  );

  RETURN QUERY SELECT v_count, t_count, c_count, h_count, m_count, d_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update all schedule dates based on new project start date
CREATE OR REPLACE FUNCTION update_project_schedule_dates(new_start_date date)
RETURNS TABLE (
  vehicles_updated integer,
  tasks_updated integer
) AS $$
DECLARE
  v_count integer := 0;
  t_count integer := 0;
  old_start_date date;
BEGIN
  -- Get current start date
  SELECT project_start_date INTO old_start_date 
  FROM project_settings 
  LIMIT 1;

  -- Update vehicles based on their day offset
  UPDATE vehicles SET 
    start_date = new_start_date + (day - 1),
    end_date = new_start_date + (day - 1),
    updated_at = now();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Update tasks based on their vehicle assignments
  UPDATE tasks SET 
    start_date = new_start_date + (
      SELECT day - 1 
      FROM vehicles 
      WHERE vehicles.id = tasks.vehicle_id
    ),
    end_date = new_start_date + (
      SELECT day - 1 
      FROM vehicles 
      WHERE vehicles.id = tasks.vehicle_id
    ) + COALESCE(duration_days, 1) - 1,
    updated_at = now()
  WHERE vehicle_id IS NOT NULL;
  
  GET DIAGNOSTICS t_count = ROW_COUNT;

  -- Update project settings
  UPDATE project_settings SET 
    project_start_date = new_start_date,
    updated_at = now();

  -- Log the date change
  INSERT INTO project_reset_log (
    reset_type,
    reset_reason,
    vehicles_affected,
    tasks_affected,
    performed_by,
    old_start_date,
    new_start_date
  ) VALUES (
    'Date Change',
    'Project start date updated with schedule recalculation',
    v_count,
    t_count,
    'System',
    old_start_date,
    new_start_date
  );

  RETURN QUERY SELECT v_count, t_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get project countdown information
CREATE OR REPLACE FUNCTION get_project_countdown()
RETURNS TABLE (
  start_date date,
  days_until_start integer,
  is_started boolean,
  project_status text
) AS $$
DECLARE
  proj_start_date date;
  days_diff integer;
BEGIN
  -- Get project start date
  SELECT project_start_date INTO proj_start_date 
  FROM project_settings 
  LIMIT 1;
  
  -- If no settings exist, use current date
  IF proj_start_date IS NULL THEN
    proj_start_date := CURRENT_DATE;
  END IF;
  
  -- Calculate days until start
  days_diff := proj_start_date - CURRENT_DATE;
  
  RETURN QUERY SELECT 
    proj_start_date,
    days_diff,
    days_diff <= 0,
    CASE 
      WHEN days_diff < 0 THEN 'In Progress'
      WHEN days_diff = 0 THEN 'Starting Today'
      WHEN days_diff <= 7 THEN 'Starting Soon'
      ELSE 'Scheduled'
    END;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_settings_start_date ON project_settings(project_start_date);
CREATE INDEX IF NOT EXISTS idx_project_reset_log_created_at ON project_reset_log(created_at);
CREATE INDEX IF NOT EXISTS idx_project_reset_log_reset_type ON project_reset_log(reset_type);

-- Insert default project settings if none exist
INSERT INTO project_settings (
  project_start_date,
  project_name,
  project_description,
  total_duration_days,
  total_vehicles,
  total_locations,
  is_active
) VALUES (
  CURRENT_DATE,
  'GPS Installation Project',
  'Vehicle GPS tracking device and fuel level sensor installation across multiple locations',
  14,
  24,
  3,
  false
) ON CONFLICT DO NOTHING;

-- Create trigger to automatically update project status based on start date
CREATE OR REPLACE FUNCTION update_project_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update is_active based on start date
  NEW.is_active := (NEW.project_start_date <= CURRENT_DATE);
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_project_status ON project_settings;
CREATE TRIGGER trigger_update_project_status
  BEFORE UPDATE ON project_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_project_status();