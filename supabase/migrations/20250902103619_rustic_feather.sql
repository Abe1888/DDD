/*
  # Create locations table for project location management

  1. New Tables
    - `locations`
      - `id` (uuid, primary key)
      - `name` (text, unique) - Location name
      - `duration` (text) - Project duration at location
      - `vehicles` (integer) - Number of vehicles at location
      - `gps_devices` (integer) - Number of GPS devices required
      - `fuel_sensors` (integer) - Number of fuel sensors required
      - `created_at` (timestamp) - Record creation time

  2. Security
    - Enable RLS on `locations` table
    - Add policy for public read access
*/

CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  duration text NOT NULL,
  vehicles integer NOT NULL DEFAULT 0,
  gps_devices integer NOT NULL DEFAULT 0,
  fuel_sensors integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to locations"
  ON locations
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow insert access to locations"
  ON locations
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Allow update access to locations"
  ON locations
  FOR UPDATE
  TO authenticated, anon
  USING (true);

-- Insert initial location data
INSERT INTO locations (name, duration, vehicles, gps_devices, fuel_sensors) VALUES
  ('Bahir Dar', '8 Days', 15, 15, 16),
  ('Kombolcha', '3 Days', 6, 6, 7),
  ('Addis Ababa', '2 Days', 3, 3, 3)
ON CONFLICT (name) DO NOTHING;