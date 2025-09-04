/*
  # Add vehicle task fields to tasks table

  1. Schema Updates
    - Add `vehicle_id` column to link tasks to vehicles
    - Add `description` column for detailed task descriptions
    - Add `estimated_duration` and `actual_duration` columns for time tracking
    - Add `tags` column for task categorization
    - Add `created_by` and `completed_at` columns for audit trail
    - Update status constraint to include 'Blocked' status

  2. Security
    - Maintain existing RLS policies
    - Add indexes for new columns to improve query performance
*/

-- Add new columns to tasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'vehicle_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN vehicle_id text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'description'
  ) THEN
    ALTER TABLE tasks ADD COLUMN description text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'estimated_duration'
  ) THEN
    ALTER TABLE tasks ADD COLUMN estimated_duration integer DEFAULT 60;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'actual_duration'
  ) THEN
    ALTER TABLE tasks ADD COLUMN actual_duration integer;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'tags'
  ) THEN
    ALTER TABLE tasks ADD COLUMN tags text[] DEFAULT '{}';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE tasks ADD COLUMN created_by text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE tasks ADD COLUMN completed_at timestamptz;
  END IF;
END $$;

-- Update status constraint to include 'Blocked'
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'tasks' AND constraint_name = 'tasks_status_check'
  ) THEN
    ALTER TABLE tasks DROP CONSTRAINT tasks_status_check;
  END IF;
  
  -- Add updated constraint
  ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
    CHECK (status = ANY (ARRAY['Pending'::text, 'In Progress'::text, 'Completed'::text, 'Blocked'::text]));
END $$;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_tasks_vehicle_id ON tasks (vehicle_id);
CREATE INDEX IF NOT EXISTS idx_tasks_estimated_duration ON tasks (estimated_duration);
CREATE INDEX IF NOT EXISTS idx_tasks_actual_duration ON tasks (actual_duration);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks (created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks (completed_at);
CREATE INDEX IF NOT EXISTS idx_tasks_tags ON tasks USING gin (tags);