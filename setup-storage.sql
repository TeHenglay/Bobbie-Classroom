-- Create storage bucket for assignment answers
INSERT INTO storage.buckets (id, name, public)
VALUES ('assignment-answer', 'assignment-answer', true)
ON CONFLICT (id) DO NOTHING;

-- SIMPLE APPROACH: Allow all authenticated users to do everything
-- This is simpler and works for classroom environments

-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'assignment-answer');

-- Allow authenticated users to update files
CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'assignment-answer');

-- Allow authenticated users to delete files
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'assignment-answer');

-- Allow authenticated users to read files
CREATE POLICY "Allow authenticated reads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'assignment-answer');
