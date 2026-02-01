import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { PolicyList } from './pages/PolicyList';
import { PolicyDetail } from './pages/PolicyDetail';
import { DocumentList } from './pages/DocumentList';
import { AssetList } from './pages/AssetList';
import { VendorList } from './pages/VendorList';
import { VendorDetail } from './pages/VendorDetail';
import { AWSEvidence } from './pages/AWSEvidence';
import { Login } from './pages/Login';
import { UserManagement } from './pages/UserManagement';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="policies" element={<PolicyList />} />
        <Route path="policies/:slug" element={<PolicyDetail />} />
        <Route path="documents" element={<DocumentList />} />
        <Route path="assets" element={<AssetList />} />
        <Route path="vendors" element={<VendorList />} />
        <Route path="vendors/:vendorId" element={<VendorDetail />} />
        <Route path="aws-evidence" element={<AWSEvidence />} />
        <Route path="users" element={<UserManagement />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
