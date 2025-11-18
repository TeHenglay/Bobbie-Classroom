# Quick Start Guide - ClassLab

Follow these steps to get ClassLab running on your machine.

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] npm installed
- [ ] Supabase account created

## Setup Steps (10-15 minutes)

### 1. Backend Setup (Supabase)

#### Create Project
1. Go to https://supabase.com
2. Sign in and click "New Project"
3. Fill in project details and create

#### Run SQL Setup
1. Go to **SQL Editor** in Supabase dashboard
2. Open `SUPABASE_SETUP.md` from this project
3. Copy and run **Section 3.1** (Create Tables)
4. Copy and run **Section 4** (RLS Policies)
5. Go to **Storage** tab
6. Create bucket: `assignment-submissions` (Private)

#### Get API Keys
1. Go to **Settings** > **API**
2. Copy:
   - Project URL
   - anon public key

### 2. Frontend Setup

#### Configure Environment
```bash
# In classroom-app directory
cp .env.example .env
```

Edit `.env` file:
```env
VITE_SUPABASE_URL=paste_your_project_url_here
VITE_SUPABASE_ANON_KEY=paste_your_anon_key_here
```

#### Install & Run
```bash
# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

Open browser to: http://localhost:5173

### 3. Create First Admin

#### Register Account
1. Click "Sign up" on login page
2. Enter your details and register

#### Make Yourself Admin
1. Go to Supabase dashboard
2. Navigate to **Authentication** > **Users**
3. Click on your user, copy the UUID
4. Go to **SQL Editor**
5. Run:
```sql
UPDATE profiles SET role = 'admin' WHERE id = 'paste-your-uuid-here';
```
6. Log out and log back into the app

### 4. Test the System

#### As Admin
- [ ] View dashboard statistics
- [ ] Go to User Management
- [ ] Register another test user
- [ ] Change their role to "teacher"

#### As Teacher (switch to test account)
- [ ] Create a class
- [ ] Note the class code
- [ ] View class on dashboard

#### As Student (register another account)
- [ ] Join class using code
- [ ] View class on dashboard

## Troubleshooting

### "Failed to fetch"
- ✅ Check `.env` file exists and has correct values
- ✅ Restart dev server after changing `.env`
- ✅ Verify Supabase project is active

### "Permission denied" errors
- ✅ Ensure all RLS policies were created
- ✅ Check user has role set in profiles table
- ✅ Verify you're logged in

### Can't login after registering
- ✅ Check browser console for errors
- ✅ Verify **Auth** is enabled in Supabase
- ✅ Check redirect URLs in Supabase auth settings

### Tables not found
- ✅ Run all SQL commands from SUPABASE_SETUP.md
- ✅ Check **Table Editor** to verify tables exist
- ✅ Ensure queries ran without errors

## Next Steps After Setup

1. **Explore as each role:**
   - Admin: Manage users and view stats
   - Teacher: Create classes and share codes
   - Student: Join classes and view assignments

2. **Continue development:**
   - Read `PROJECT_SUMMARY.md` for what's implemented
   - Check `Roadmap.md` for planned features
   - Start with assignment creation feature

3. **Customize:**
   - Update colors in `tailwind.config.js`
   - Modify component styles
   - Add your own features

## Common Commands

```bash
# Development
npm run dev              # Start dev server

# Building
npm run build           # Build for production
npm run preview         # Preview production build

# Code Quality
npm run lint            # Check for linting errors
```

## Getting Help

- Check `SUPABASE_SETUP.md` for backend details
- Read `README.md` for comprehensive documentation
- Review `PROJECT_SUMMARY.md` for implementation status
- Check browser console for error messages

## Success Checklist

- [ ] Supabase project created
- [ ] All SQL tables created
- [ ] RLS policies applied
- [ ] Storage bucket created
- [ ] Environment variables configured
- [ ] App running on localhost:5173
- [ ] Successfully registered account
- [ ] Admin role assigned
- [ ] Can access admin dashboard
- [ ] Created test teacher account
- [ ] Created test class
- [ ] Joined class as student

**Congratulations! You're all set! 🎉**
