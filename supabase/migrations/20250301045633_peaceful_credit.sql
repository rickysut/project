/*
  # Initial Schema Setup for Admin Panel

  1. New Tables
    - `admins`
      - `id` (uuid, primary key, references auth.users)
      - `created_at` (timestamp)
      - `email` (text, unique)
      - `name` (text, nullable)
    - `jemaat`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `name` (text)
      - `address` (text, nullable)
      - `phone` (text, nullable)
      - `email` (text, nullable)
      - `birth_date` (date, nullable)
      - `status` (text, nullable)
  
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read/write data
*/

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  email TEXT UNIQUE NOT NULL,
  name TEXT
);



-- Enable Row Level Security
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;


-- Create policies for admins table
CREATE POLICY "Admins can view all admins"
  ON admins
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

CREATE POLICY "Admins can insert new admins"
  ON admins
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Create policies for jemaat table
CREATE POLICY "Admins can view all jemaat"
  ON jemaat
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

CREATE POLICY "Admins can insert jemaat"
  ON jemaat
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

CREATE POLICY "Admins can update jemaat"
  ON jemaat
  FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

CREATE POLICY "Admins can delete jemaat"
  ON jemaat
  FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));