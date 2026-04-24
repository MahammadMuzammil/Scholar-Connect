import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import RequireAuth from './components/RequireAuth.jsx';
import Nav from './components/Nav.jsx';
import Greeting from './components/Greeting.jsx';
import Home from './pages/Home.jsx';
import ScholarDetail from './pages/ScholarDetail.jsx';
import Booking from './pages/Booking.jsx';
import Confirmation from './pages/Confirmation.jsx';
import ScholarDashboard from './pages/ScholarDashboard.jsx';
import VideoCall from './pages/VideoCall.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import MyBookings from './pages/MyBookings.jsx';

function RootRedirect() {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="container" style={{ padding: '40px 0' }}>
        <div className="empty">Loading…</div>
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  if (session.role === 'scholar') return <Navigate to="/dashboard" replace />;
  return <Home />;
}

export default function App() {
  return (
    <AuthProvider>
      <Greeting />
      <Nav />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/" element={<RootRedirect />} />

        <Route
          path="/scholar/:id"
          element={
            <RequireAuth role="user">
              <ScholarDetail />
            </RequireAuth>
          }
        />
        <Route
          path="/book/:id"
          element={
            <RequireAuth role="user">
              <Booking />
            </RequireAuth>
          }
        />
        <Route
          path="/confirmation/:bookingId"
          element={
            <RequireAuth role="user">
              <Confirmation />
            </RequireAuth>
          }
        />
        <Route
          path="/my-bookings"
          element={
            <RequireAuth role="user">
              <MyBookings />
            </RequireAuth>
          }
        />

        <Route
          path="/dashboard"
          element={
            <RequireAuth role="scholar">
              <ScholarDashboard />
            </RequireAuth>
          }
        />

        <Route path="/call/:bookingId" element={<VideoCall />} />
      </Routes>
      <footer className="container">ScholarConnect — a Shariah-compliant consultation marketplace</footer>
    </AuthProvider>
  );
}
