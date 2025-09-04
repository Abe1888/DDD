/*
  # Create comments table for task comments

  1. New Tables
    - `comments`
      - `id` (uuid, primary key) - Comment identifier
      - `task_id` (text) - Reference to task
      - `text` (text) - Comment content
      - `author` (text) - Comment author
      - `created_at` (timestamp) - Comment creation time

  2. Security
    - Enable RLS on `comments` table
    - Add policies for read and insert access
*/

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id text NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  text text NOT NULL,
  author text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to comments"
  ON comments
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow insert access to comments"
  ON comments
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_comments_task_id ON comments(task_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);