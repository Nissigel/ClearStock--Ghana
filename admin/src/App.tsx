import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Verifications from './pages/Verifications';
import VerificationDetail from './pages/VerificationDetail';
import Users from './pages/Users';
import Listings from './pages/Listings';
import ListingDetail from './pages/ListingDetail';
import Reports from './pages/Reports';
import Admins from './pages/Admins';
import AuditLogs from './pages/AuditLogs';

function Routed() {
  const { admin, loading } = useAuth();

  // Until the stored token has been checked we know nothing, so showing the
  // login form here would flash it at an already-signed-in admin.
  if (loading) return <div className="state">Loading…</div>;
  if (!admin) return <Login />;

  const isSuper = admin.role === 'SUPER_ADMIN';

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/verifications" element={<Verifications />} />
        <Route path="/verifications/:id" element={<VerificationDetail />} />
        <Route path="/users" element={<Users />} />
        <Route path="/listings" element={<Listings />} />
        <Route path="/listings/:id" element={<ListingDetail />} />
        <Route path="/reports" element={<Reports />} />
        {/* Guarded on the server too — this only hides a door that is
            already locked. */}
        <Route
          path="/admins"
          element={isSuper ? <Admins /> : <Navigate to="/" replace />}
        />
        <Route path="/audit-logs" element={<AuditLogs />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routed />
      </AuthProvider>
    </BrowserRouter>
  );
}
