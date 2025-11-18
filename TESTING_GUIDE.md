# Testing Guide - Authentication & Role-Based Access

## Current Setup Status

✅ **Authentication Flow**: Complete
✅ **Role Selection**: Student & Teacher options available during registration
✅ **Database Integration**: Accounts stored in Supabase with roles
✅ **Role-Based Routing**: Different dashboards for each role

## Important: Database Setup

### 1. Disable Email Verification

By default, Supabase requires email verification. To disable it for testing:

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers** → **Email**
3. Scroll down to **Confirm email**
4. **Uncheck** "Enable email confirmations"
5. Click **Save**

### 2. Check RLS Status
The profiles table should have RLS **DISABLED** for testing. Run this in Supabase SQL Editor:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- If rowsecurity is true, disable it:
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

### 3. Verify Tables Exist
```sql
-- Check that the profiles table exists with correct structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles';
```

Expected columns:
- `id` (UUID) - Primary Key
- `full_name` (TEXT)
- `role` (TEXT) - Should accept 'student', 'teacher', 'admin'
- `created_at` (TIMESTAMP WITH TIME ZONE)

## Testing Steps

### Test 1: Register as Student

1. Navigate to http://localhost:5174
2. Click "Get Started"
3. Fill in the registration form:
   - Full Name: Test Student
   - Email: student@test.com
   - Password: password123
   - Confirm Password: password123
   - **Role: Click "Student" button**
4. Click "Create Account"
5. You should be redirected to the login page

**Verify in Supabase:**
- Go to Authentication > Users
- Find the user with email student@test.com
- Copy the User ID
- Go to Table Editor > profiles
- Find the row with matching ID
- **Verify role = 'student'**

### Test 2: Register as Teacher

1. Go back to registration page
2. Fill in the form:
   - Full Name: Test Teacher
   - Email: teacher@test.com
   - Password: password123
   - Confirm Password: password123
   - **Role: Click "Teacher" button**
3. Click "Create Account"
4. You should be redirected to the login page

**Verify in Supabase:**
- Check Authentication > Users for teacher@test.com
- Check Table Editor > profiles for the user
- **Verify role = 'teacher'**

### Test 3: Login as Student

1. Go to http://localhost:5174/login
2. Enter credentials:
   - Email: student@test.com
   - Password: password123
3. Click "Sign In"
4. **Expected**: Redirect to `/student/dashboard`
5. You should see the Student Dashboard with "My Classes" section

### Test 4: Login as Teacher

1. Logout (if logged in)
2. Go to login page
3. Enter credentials:
   - Email: teacher@test.com
   - Password: password123
4. Click "Sign In"
5. **Expected**: Redirect to `/teacher/dashboard`
6. You should see the Teacher Dashboard with "Create New Class" button

### Test 5: Check Profile Loading

Open browser console (F12) and check for any errors:
- ❌ If you see "PGRST116" errors → RLS is blocking profile access
- ❌ If you see "infinite recursion" → RLS policies have circular dependencies
- ✅ No errors → Everything is working correctly

## Troubleshooting

### Issue: "Failed to create an account"

**Possible causes:**
1. Email already exists
2. Password too short (must be 6+ characters)
3. Passwords don't match
4. Database connection issue

**Solution:**
- Try a different email
- Check browser console for detailed error
- Verify `.env` file has correct Supabase credentials

### Issue: Profile not being created

**Check in Supabase SQL Editor:**
```sql
-- See if profile was created
SELECT * FROM profiles WHERE full_name LIKE '%Test%';
```

If no rows returned:
1. Check if RLS is enabled: `ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;`
2. Verify the profiles table exists
3. Check Supabase logs for errors

### Issue: Wrong dashboard after login

**Verify role in database:**
```sql
-- Check user's role
SELECT p.full_name, p.role, u.email
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'your-email@test.com';
```

If role is incorrect:
```sql
-- Fix the role
UPDATE profiles 
SET role = 'student'  -- or 'teacher'
WHERE id = 'user-id-here';
```

### Issue: Redirected back to login page

This means the signIn function couldn't load the profile. 

**Fix:**
1. Disable RLS on profiles table (see above)
2. Or check AuthContext.tsx line ~40-55 for PGRST116 error handling

## Database Reset (if needed)

If you need to start fresh:

```sql
-- Delete all profiles (this will cascade to delete related data)
DELETE FROM profiles;

-- Delete all auth users
-- Do this in Authentication > Users in Supabase dashboard
-- (Can't be done via SQL)
```

## Current Database State

Run this to see all users and their roles:

```sql
SELECT 
  u.email,
  p.full_name,
  p.role,
  p.created_at
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
ORDER BY p.created_at DESC;
```

## Success Criteria

✅ Registration creates user in auth.users
✅ Registration creates profile in profiles table
✅ Profile has correct role (student or teacher)
✅ Login redirects to correct dashboard based on role
✅ No console errors during authentication
✅ User can access their respective dashboard features

## Next Steps After Successful Testing

Once both student and teacher accounts work:

1. **Create sample classes** (as teacher)
2. **Join classes** (as student using class code)
3. **Create assignments** (as teacher)
4. **Submit assignments** (as student)
5. **Grade submissions** (as teacher)

---

**Need Admin Access?**

To create an admin user, first register normally, then run:

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'your-user-id-here';
```

Admin can access: http://localhost:5174/admin/dashboard (no authentication required currently)
