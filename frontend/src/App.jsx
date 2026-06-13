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

const ProtectedRoute = ({ children }) => {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
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
          <Route path="doctors" element={<DoctorsPage />} />
          <Route path="branches" element={<BranchesPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="schedules" element={<SchedulesPage />} />
          <Route path="services" element={<ServicesPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
