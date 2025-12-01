import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SearchProvider } from './contexts/SearchContext';

// Pages
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { AboutPage } from './pages/AboutPage';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { JoinClassPage } from './pages/student/JoinClassPage';
import { StudentClassPage } from './pages/student/StudentClassPage';
import { StudentAssignmentPage } from './pages/student/StudentAssignmentPage';
import { AssignmentsPage } from './pages/student/AssignmentsPage';
import { LecturesPage as StudentLecturesPage } from './pages/student/LecturesPage';

// Teacher Pages
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { ClassPage } from './pages/teacher/ClassPage';
import { AssignmentDetailPage } from './pages/teacher/AssignmentDetailPage';
import { AssignmentsPage as TeacherAssignmentsPage } from './pages/teacher/AssignmentsPage';
import { AssignmentsListPage as TeacherAssignmentsListPage } from './pages/teacher/AssignmentsListPage';
import { LecturesPage as TeacherLecturesPage } from './pages/teacher/LecturesPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminClassesPage } from './pages/admin/AdminClassesPage';

function App() {
  return (
    <AuthProvider>
      <SearchProvider>
        <BrowserRouter>
          <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/about" element={<AboutPage />} />

          {/* Admin Routes - NO PROTECTION */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/classes" element={<AdminClassesPage />} />

          {/* Student Routes */}
          <Route
            path="/student/dashboard"
            element={<StudentDashboard />}
          />
          <Route
            path="/student/classes"
            element={<StudentDashboard />}
          />
          <Route
            path="/student/classes/:classId"
            element={<StudentClassPage />}
          />
          <Route
            path="/student/classes/:classId/assignments/:assignmentId"
            element={<StudentAssignmentPage />}
          />
          <Route
            path="/student/class/:classId/assignment/:assignmentId"
            element={<StudentAssignmentPage />}
          />
          <Route
            path="/student/join-class"
            element={<JoinClassPage />}
          />
          <Route
            path="/student/lectures"
            element={<StudentLecturesPage />}
          />
          <Route
            path="/student/assignments"
            element={<AssignmentsPage />}
          />

          {/* Teacher Routes */}
          <Route
            path="/teacher/dashboard"
            element={<TeacherDashboard />}
          />
          <Route
            path="/teacher/class/:classId"
            element={<ClassPage />}
          />
          <Route
            path="/teacher/class/:classId/assignment/:assignmentId"
            element={<AssignmentDetailPage />}
          />
          <Route
            path="/teacher/classes"
            element={<TeacherDashboard />}
          />
          <Route
            path="/teacher/lectures"
            element={<TeacherLecturesPage />}
          />
          <Route
            path="/teacher/assignments"
            element={<TeacherAssignmentsListPage />}
          />
          <Route
            path="/teacher/assignments/create"
            element={<TeacherAssignmentsPage />}
          />

          {/* Default Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </SearchProvider>
    </AuthProvider>
  );
}

export default App;
