/*
  # Enhanced Vehicle Registration System

  1. New Tables
    - Enhanced vehicles table with registration fields
    - Vehicle registration history tracking
    - Vehicle maintenance records
    - Vehicle documents management

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users

  3. Changes
    - Add registration fields to vehicles table
    - Add vehicle history tracking
    - Add maintenance scheduling
    - Add document management
*/

-- Add registration and management fields to vehicles table
DO $$
BEGIN
  -- Registration Information
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'registration_number'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN registration_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'vin_number'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN vin_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'engine_number'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN engine_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'chassis_number'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN chassis_number text;
  END IF;

  -- Vehicle Details
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'make'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN make text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'model'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN model text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'year'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN year integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'color'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN color text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'fuel_type'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN fuel_type text DEFAULT 'Diesel';
  END IF;

  -- Ownership and Registration
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'owner_name'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN owner_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'owner_contact'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN owner_contact text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'registration_date'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN registration_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'registration_expiry'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN registration_expiry date;
  END IF;

  -- Installation Status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'installation_status'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN installation_status text DEFAULT 'Not Started';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'installation_notes'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN installation_notes text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'technician_assigned'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN technician_assigned text;
  END IF;

  -- GPS and Sensor Details
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'gps_device_id'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN gps_device_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'fuel_sensor_ids'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN fuel_sensor_ids text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'installation_date'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN installation_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'last_maintenance'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN last_maintenance date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'next_maintenance'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN next_maintenance date;
  END IF;

  -- Additional metadata
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'tags'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN tags text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'priority'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN priority text DEFAULT 'Medium';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'notes'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN notes text;
  END IF;
END $$;

-- Create vehicle registration history table
CREATE TABLE IF NOT EXISTS vehicle_registration_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id text NOT NULL,
  action text NOT NULL,
  field_name text,
  old_value text,
  new_value text,
  changed_by text NOT NULL,
  change_reason text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vehicle_registration_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to vehicle_registration_history"
  ON vehicle_registration_history
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow insert access to vehicle_registration_history"
  ON vehicle_registration_history
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Create vehicle documents table
CREATE TABLE IF NOT EXISTS vehicle_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id text NOT NULL,
  document_type text NOT NULL,
  document_name text NOT NULL,
  file_url text,
  file_size integer DEFAULT 0,
  mime_type text,
  uploaded_by text NOT NULL,
  expiry_date date,
  is_required boolean DEFAULT false,
  status text DEFAULT 'Valid',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vehicle_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to vehicle_documents"
  ON vehicle_documents
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow insert access to vehicle_documents"
  ON vehicle_documents
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Allow update access to vehicle_documents"
  ON vehicle_documents
  FOR UPDATE
  TO authenticated, anon
  USING (true);

-- Create vehicle maintenance records table
CREATE TABLE IF NOT EXISTS vehicle_maintenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id text NOT NULL,
  maintenance_type text NOT NULL,
  description text,
  scheduled_date date,
  completed_date date,
  technician text,
  cost numeric(10,2) DEFAULT 0,
  status text DEFAULT 'Scheduled',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vehicle_maintenance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to vehicle_maintenance"
  ON vehicle_maintenance
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow insert access to vehicle_maintenance"
  ON vehicle_maintenance
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Allow update access to vehicle_maintenance"
  ON vehicle_maintenance
  FOR UPDATE
  TO authenticated, anon
  USING (true);

-- Add constraints and indexes
DO $$
BEGIN
  -- Add check constraints if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'vehicles_installation_status_check'
  ) THEN
    ALTER TABLE vehicles ADD CONSTRAINT vehicles_installation_status_check 
    CHECK (installation_status IN ('Not Started', 'In Progress', 'Completed', 'On Hold', 'Failed'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'vehicles_fuel_type_check'
  ) THEN
    ALTER TABLE vehicles ADD CONSTRAINT vehicles_fuel_type_check 
    CHECK (fuel_type IN ('Diesel', 'Petrol', 'Electric', 'Hybrid', 'CNG', 'LPG'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'vehicles_priority_check'
  ) THEN
    ALTER TABLE vehicles ADD CONSTRAINT vehicles_priority_check 
    CHECK (priority IN ('High', 'Medium', 'Low'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'vehicle_documents_status_check'
  ) THEN
    ALTER TABLE vehicle_documents ADD CONSTRAINT vehicle_documents_status_check 
    CHECK (status IN ('Valid', 'Expired', 'Pending', 'Invalid'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'vehicle_maintenance_status_check'
  ) THEN
    ALTER TABLE vehicle_maintenance ADD CONSTRAINT vehicle_maintenance_status_check 
    CHECK (status IN ('Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Overdue'));
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicles_registration_number ON vehicles (registration_number);
CREATE INDEX IF NOT EXISTS idx_vehicles_vin_number ON vehicles (vin_number);
CREATE INDEX IF NOT EXISTS idx_vehicles_make_model ON vehicles (make, model);
CREATE INDEX IF NOT EXISTS idx_vehicles_installation_status ON vehicles (installation_status);
CREATE INDEX IF NOT EXISTS idx_vehicles_technician_assigned ON vehicles (technician_assigned);
CREATE INDEX IF NOT EXISTS idx_vehicles_priority ON vehicles (priority);
CREATE INDEX IF NOT EXISTS idx_vehicles_tags ON vehicles USING gin (tags);

CREATE INDEX IF NOT EXISTS idx_vehicle_registration_history_vehicle_id ON vehicle_registration_history (vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_registration_history_created_at ON vehicle_registration_history (created_at);

CREATE INDEX IF NOT EXISTS idx_vehicle_documents_vehicle_id ON vehicle_documents (vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_documents_document_type ON vehicle_documents (document_type);
CREATE INDEX IF NOT EXISTS idx_vehicle_documents_expiry_date ON vehicle_documents (expiry_date);

CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_vehicle_id ON vehicle_maintenance (vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_scheduled_date ON vehicle_maintenance (scheduled_date);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_status ON vehicle_maintenance (status);

-- Add foreign key constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'vehicle_registration_history_vehicle_id_fkey'
  ) THEN
    ALTER TABLE vehicle_registration_history 
    ADD CONSTRAINT vehicle_registration_history_vehicle_id_fkey 
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'vehicle_documents_vehicle_id_fkey'
  ) THEN
    ALTER TABLE vehicle_documents 
    ADD CONSTRAINT vehicle_documents_vehicle_id_fkey 
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'vehicle_maintenance_vehicle_id_fkey'
  ) THEN
    ALTER TABLE vehicle_maintenance 
    ADD CONSTRAINT vehicle_maintenance_vehicle_id_fkey 
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE;
  END IF;
END $$;