import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import { NotificationProvider } from './contexts/NotificationContext';

// Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import Dashboard from './pages/Dashboard/Dashboard';
import PersonalTasks from './pages/Tasks/PersonalTasks';
import TeamTasks from './pages/Tasks/TeamTasks';
import Projects from './pages/Projects/Projects';
import ProjectDetail from './pages/Projects/ProjectDetail';
import Teams from './pages/Teams/Teams';
import TeamDetail from './pages/Teams/TeamDetail';
import Calendar from './pages/Calendar/Calendar';
import Reports from './pages/Reports/Reports';
import PersonalReports from './pages/Reports/PersonalReports';
import AdminDashboard from './pages/Admin/AdminDashboard';
import Profile from './pages/Profile/Profile';
import SubProjectDetail from './pages/Projects/SubProjectDetail';
// ✅ Route bảo vệ DUY NHẤT - SỬA LẠI
const ProtectedRoute = ({ children, requireManager = false }) => {
  const { user, loading, isManager } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  // ❌ Chưa đăng nhập
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ❌ Cần manager nhưng không phải manager
  if (requireManager && !isManager()) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Protected */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="profile" element={<Profile />} />

                {/* Tasks */}
                <Route path="tasks/personal" element={<PersonalTasks />} />
                <Route path="tasks/team" element={<TeamTasks />} />

                {/* Projects */}
                <Route path="projects" element={<Projects />} />
                <Route path="projects/detail/:id" element={<ProjectDetail />} />
                <Route path="projects/detail/:parentId/subproject/:id" element={<SubProjectDetail />} />

                {/* Teams */}
                <Route path="teams" element={<Teams />} />
                <Route path="teams/:id" element={<TeamDetail />} />

                {/* Calendar */}
                <Route path="calendar" element={<Calendar />} />

                {/* Reports - CHỈ MANAGER */}
                <Route 
                  path="reports" 
                  element={
                    <ProtectedRoute requireManager={true}>
                      <Reports />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Personal Reports - AI CŨNG XEM ĐƯỢC */}
                <Route path="personalreports" element={<PersonalReports />} />

                {/* Admin - CHỈ MANAGER */}
                <Route
                  path="admin"
                  element={
                    <ProtectedRoute requireManager={true}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
              </Route>
            </Routes>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;