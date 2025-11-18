# ClassLab - Classroom Management Platform

A Google Classroom-style platform built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

### For Students
- 📚 Join classes using class codes
- 📝 View and submit assignments
- 📊 Track grades and feedback
- 📢 View class announcements
- 📅 See upcoming assignments

### For Teachers
- 🏫 Create and manage classes
- 📋 Create assignments with due dates
- ✅ Grade student submissions
- 📣 Post class announcements
- 👥 Manage class members

### For Administrators
- 👤 Manage user accounts
- 🔄 Change user roles (student/teacher/admin)
- 📊 View system statistics
- 🏢 Oversee all classes

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up Supabase**
   - Follow the detailed guide in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
   - Create tables and set up RLS policies
   - Create storage buckets

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## Usage

### First Time Setup

1. Register a new account
2. In Supabase dashboard, go to **Authentication** > **Users**
3. Find your user and copy the UUID
4. In SQL Editor, run:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE id = 'your-user-uuid';
   ```
5. Log out and log back in

### Creating Test Users

**As Admin:**
1. Register additional test accounts
2. Go to Admin Dashboard > User Management
3. Change roles as needed

### Teacher Workflow

1. Navigate to Teacher Dashboard
2. Click "Create Class"
3. Fill in class details (name, section, description)
4. Share the generated class code with students
5. Create assignments with due dates
6. Grade student submissions

### Student Workflow

1. Navigate to Student Dashboard
2. Click "Join Class"
3. Enter the class code provided by teacher
4. View assignments in the class
5. Submit work before due date
6. Check grades and feedback

## Project Structure

```
classroom-app/
├── src/
│   ├── components/         # Reusable UI components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and configurations
│   ├── pages/             # Page components
│   ├── types/             # TypeScript type definitions
│   ├── App.tsx            # Main app component
│   └── main.tsx           # Entry point
├── SUPABASE_SETUP.md      # Database setup guide
└── README.md
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Troubleshooting

### "Supabase environment variables are not set"
- Check that `.env` file exists in project root
- Verify environment variable names start with `VITE_`
- Restart the development server

### Authentication not working
- Verify Supabase project URL and anon key
- Check auth providers are enabled in Supabase
- Clear browser cache and cookies

### Permission denied errors
- Verify RLS policies are created correctly
- Check user role in profiles table
- Review browser console for detailed errors

## License

MIT License - feel free to use this project for learning or production.
