import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import useAuthStore from "./stores/auth.store.js";
import Layout from "./components/shared/Layout.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import { useEffect } from "react";
import api from "./services/api.js";
import DashboardPage from "./pages/admin/DashboardPage.jsx";
import PatientsPage from "./pages/admin/PatientsPage.jsx";
import BookingsPage from "./pages/admin/BookingsPage.jsx";
import DoctorsPage from "./pages/admin/DoctorsPage.jsx";
import BranchesPage from "./pages/admin/BranchesPage.jsx";
import ReportsPage from "./pages/admin/ReportsPage.jsx";
import SchedulesPage from "./pages/admin/SchedulesPage.jsx";
import ServicesPage from "./pages/admin/ServicesPage.jsx";
import UsersPage from "./pages/admin/UsersPage.jsx";

const ProtectedRoute = ({ children }) => {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (!user) return null;
  if (user.role !== "ADMIN") return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { token } = useAuthStore();
  if (token) return <Navigate to="/dashboard" replace />;
  return children;
};

const App = () => {
  const { token, setAuth, logout } = useAuthStore();

  useEffect(() => {
    if (token) {
      api
        .get("/auth/me")
        .then((res) => setAuth(res.data, token))
        .catch(() => logout());
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="patients" element={<PatientsPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="doctors" element={<AdminRoute><DoctorsPage /></AdminRoute>} />
          <Route path="branches" element={<AdminRoute><BranchesPage /></AdminRoute>} />
          <Route path="reports" element={<AdminRoute><ReportsPage /></AdminRoute>} />
          <Route path="schedules" element={<AdminRoute><SchedulesPage /></AdminRoute>} />
          <Route path="services" element={<AdminRoute><ServicesPage /></AdminRoute>} />
          <Route path="users" element={<AdminRoute><UsersPage /></AdminRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
