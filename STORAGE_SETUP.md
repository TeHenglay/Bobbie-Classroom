# Storage Setup for Assignment Files

## Setup Instructions

### Method 1: Quick Setup (Recommended for Development)

1. **Go to your Supabase Dashboard**
   - Navigate to Storage section
   - Click "Create a new bucket"

2. **Create the bucket**
   - Bucket name: `assignment-answer`
   - Set as **Public bucket** (check the public option)
   - Click "Create bucket"

3. **Set up Storage Policies**
   - Go to SQL Editor in Supabase Dashboard
   - Copy and paste the contents of `setup-storage.sql`
   - Click "Run" to execute

### Method 2: Manual Policy Setup

1. Create the bucket `assignment-answer` (public)
2. Go to Storage → Policies
3. For the `assignment-answer` bucket, add these policies:
   - **INSERT**: Allow authenticated users (Target: `authenticated`, Policy: `bucket_id = 'assignment-answer'`)
   - **SELECT**: Allow authenticated users (Target: `authenticated`, Policy: `bucket_id = 'assignment-answer'`)
   - **UPDATE**: Allow authenticated users (Target: `authenticated`, Policy: `bucket_id = 'assignment-answer'`)
   - **DELETE**: Allow authenticated users (Target: `authenticated`, Policy: `bucket_id = 'assignment-answer'`)

## How It Works

- **Students**: Can upload files when submitting assignments
- **File Storage**: Files are stored in `assignment-answer` bucket with path structure:
  - `{student_id}/{assignment_id}/{timestamp}.{extension}`
- **Teachers**: Can view and download student files in the grading modal
- **Students**: Can view their submitted files after submission

## Testing

1. Log in as a student
2. Go to an assignment
3. Upload a file and submit
4. Log in as a teacher
5. View the submission - the file should be visible and downloadable
