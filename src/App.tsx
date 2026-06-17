import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import RoomsList from "@/pages/RoomsList";
import RoomDetail from "@/pages/RoomDetail";
import StudyCenter from "@/pages/StudyCenter";
import Leaderboard from "@/pages/Leaderboard";
import Profile from "@/pages/Profile";
import Login from "@/pages/Login";
import ToastContainer from "@/components/Toast";
import useAppStore from "@/store/useAppStore";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAppStore();
  const location = useLocation();

  if (loading.auth) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <p className="text-cream-500">加载中...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { checkAuth } = useAppStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <Layout>
            <Home />
          </Layout>
        }
      />
      <Route
        path="/rooms"
        element={
          <Layout>
            <RoomsList />
          </Layout>
        }
      />
      <Route
        path="/rooms/:id"
        element={
          <Layout>
            <RoomDetail />
          </Layout>
        }
      />
      <Route
        path="/study"
        element={
          <Layout>
            <RequireAuth>
              <StudyCenter />
            </RequireAuth>
          </Layout>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <Layout>
            <Leaderboard />
          </Layout>
        }
      />
      <Route
        path="/profile"
        element={
          <Layout>
            <RequireAuth>
              <Profile />
            </RequireAuth>
          </Layout>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
      <ToastContainer />
    </Router>
  );
}
