import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import Contact from "@/pages/Contact";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Students from "@/pages/Students";
import GuruPage from "@/pages/Guru";
import KelasPage from "@/pages/Kelas";
import MapelPage from "@/pages/Mapel";
import Grades from "@/pages/Grades";
import Attendance from "@/pages/Attendance";
import TeacherAttendance from "@/pages/TeacherAttendance";
import Payments from "@/pages/Payments";
import Pelanggaran from "@/pages/Pelanggaran";
import MunawibPage from "@/pages/Munawib";
import MyAttendance from "@/pages/MyAttendance";
import Profile from "@/pages/Profile";
import Orangtua from "@/pages/Orangtua";
import SettingsPage from "@/pages/Settings";
import { Toaster } from "sonner";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/contact" element={<Contact />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/students"
        element={
          <ProtectedRoute>
            <Layout>
              <Students />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/guru"
        element={
          <ProtectedRoute>
            <Layout>
              <GuruPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/kelas"
        element={
          <ProtectedRoute>
            <Layout>
              <KelasPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/mapel"
        element={
          <ProtectedRoute>
            <Layout>
              <MapelPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/grades"
        element={
          <ProtectedRoute>
            <Layout>
              <Grades />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance"
        element={
          <ProtectedRoute>
            <Layout>
              <Attendance />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pelanggaran"
        element={
          <ProtectedRoute>
            <Layout>
              <Pelanggaran />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher-attendance"
        element={
          <ProtectedRoute>
            <Layout>
              <TeacherAttendance />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payments"
        element={
          <ProtectedRoute>
            <Layout>
              <Payments />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/munawib"
        element={
          <ProtectedRoute>
            <Layout>
              <MunawibPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-attendance"
        element={
          <ProtectedRoute>
            <Layout>
              <MyAttendance />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orangtua"
        element={
          <ProtectedRoute>
            <Layout>
              <Orangtua />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <SettingsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <AuthProvider>
        <AppRoutes />
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  );
}
