/*
  # Create vehicles table for GPS tracking installation management

  1. New Tables
    - `vehicles`
      - `id` (text, primary key) - Vehicle identifier (V001, V002, etc.)
      - `type` (text) - Vehicle type/model
      - `location` (text) - Installation location
      - `fuel_tanks` (integer) - Number of fuel tanks
      - `gps_required` (integer) - Number of GPS devices required
      - `fuel_sensors` (integer) - Number of fuel sensors required
      - `day` (integer) - Scheduled installation day
      - `time_slot` (text) - Scheduled time slot
      - `status` (text) - Installation status (Pending, In Progress, Completed)
      - `created_at` (timestamp) - Record creation time
      - `updated_at` (timestamp) - Last update time

  2. Security
    - Enable RLS on `vehicles` table
    - Add policy for authenticated users to read and update vehicle data
*/

CREATE TABLE IF NOT EXISTS vehicles (
  id text PRIMARY KEY,
  type text NOT NULL,
  location text NOT NULL,
  fuel_tanks integer NOT NULL DEFAULT 1,
  gps_required integer NOT NULL DEFAULT 1,
  fuel_sensors integer NOT NULL DEFAULT 1,
  day integer NOT NULL,
  time_slot text NOT NULL,
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to vehicles"
  ON vehicles
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow update access to vehicles"
  ON vehicles
  FOR UPDATE
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow insert access to vehicles"
  ON vehicles
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_vehicles_location ON vehicles(location);
CREATE INDEX IF NOT EXISTS idx_vehicles_day ON vehicles(day);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);

-- Insert initial vehicle data
INSERT INTO vehicles (id, type, location, fuel_tanks, gps_required, fuel_sensors, day, time_slot, status) VALUES
  ('V001', 'FORD/D/P/UP RANGER', 'Bahir Dar', 1, 1, 1, 1, '8:30-11:30 AM', 'Completed'),
  ('V002', 'FORD/D/P/UP RANGER', 'Bahir Dar', 1, 1, 1, 1, '1:30-5:30 PM', 'Completed'),
  ('V003', 'FORD/D/P/UP RANGER', 'Bahir Dar', 1, 1, 1, 2, '8:30-11:30 AM', 'In Progress'),
  ('V004', 'FORD/D/P/UP RANGER', 'Bahir Dar', 1, 1, 1, 2, '1:30-5:30 PM', 'Pending'),
  ('V005', 'MAZDA/PICKUP W9AT', 'Bahir Dar', 1, 1, 1, 3, '8:30-11:30 AM', 'Pending'),
  ('V006', 'Mercedes bus MCV260', 'Bahir Dar', 1, 1, 1, 3, '1:30-5:30 PM', 'Pending'),
  ('V007', 'Toyota land cruiser', 'Bahir Dar', 1, 1, 1, 4, '8:30-11:30 AM', 'Pending'),
  ('V008', 'MAZDA/PICKUP W9AT', 'Bahir Dar', 1, 1, 1, 4, '1:30-5:30 PM', 'Pending'),
  ('V009', 'Mercedes bus MCV260', 'Bahir Dar', 1, 1, 1, 5, '8:30-11:30 AM', 'Pending'),
  ('V010', 'UD truck CV86BLLDL', 'Bahir Dar', 2, 1, 2, 5, '1:30-5:30 PM', 'Pending'),
  ('V011', 'Mitsubishi K777JENSU', 'Bahir Dar', 1, 1, 1, 6, '8:30-11:30 AM', 'Pending'),
  ('V012', 'Terios j120cg', 'Bahir Dar', 1, 1, 1, 6, '1:30-5:30 PM', 'Pending'),
  ('V013', 'MAZDA/PICKUP BT-50', 'Bahir Dar', 1, 1, 1, 7, '8:30-11:30 AM', 'Pending'),
  ('V014', 'Mitsubishi (k777jensl)', 'Bahir Dar', 1, 1, 1, 7, '1:30-5:30 PM', 'Pending'),
  ('V015', 'Cherry c7180elkkhb0018', 'Bahir Dar', 1, 1, 1, 8, '8:30-11:30 AM', 'Pending'),
  ('V016', 'FORD/D/P/UP RANGER', 'Kombolcha', 1, 1, 1, 10, '8:30-11:30 AM', 'Pending'),
  ('V017', 'MAZDA/R/D/UP BT-50', 'Kombolcha', 1, 1, 1, 10, '1:30-5:30 PM', 'Pending'),
  ('V018', 'Mercedes bus MCV5115', 'Kombolcha', 1, 1, 1, 11, '8:30-11:30 AM', 'Pending'),
  ('V019', 'Toyota Pickup LN166L-PRMDS', 'Kombolcha', 1, 1, 1, 11, '1:30-5:30 PM', 'Pending'),
  ('V020', 'Mitsubishi K34)JUNJJC', 'Kombolcha', 1, 1, 1, 12, '8:30-11:30 AM', 'Pending'),
  ('V021', 'UD truck CV86BLLDL', 'Kombolcha', 2, 1, 2, 12, '1:30-5:30 PM', 'Pending'),
  ('V022', 'FORD/D/P/UP RANGER', 'Addis Ababa', 1, 1, 1, 13, '8:30-11:30 AM', 'Pending'),
  ('V023', 'MAZDA/PICKUP-626', 'Addis Ababa', 1, 1, 1, 13, '1:30-5:30 PM', 'Pending'),
  ('V024', 'Cherry c7180elkkhb0018', 'Addis Ababa', 1, 1, 1, 14, '8:30-11:30 AM', 'Pending')
ON CONFLICT (id) DO NOTHING;