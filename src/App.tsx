import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import AdminRegistration from './pages/AdminRegistration';
import Unauthorized from './pages/Unauthorized';
import DownloadData from './pages/download-data';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
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
            path="/download-data"
            element={
              <ProtectedRoute requireAdmin={true}>
                <Layout>
                  <DownloadData />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/register-admin"
            element={
              <ProtectedRoute requireAdmin={true}>
                <Layout>
                  <AdminRegistration />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;