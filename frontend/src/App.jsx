import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import useAuthStore from "./stores/auth.store.js";
import Layout from "./components/shared/Layout.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import DashboardPage from "./pages/admin/DashboardPage.jsx";
import { useEffect } from "react";
import api from "./services/api.js";

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
          <Route path="dashboard" element={<DashboardPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
