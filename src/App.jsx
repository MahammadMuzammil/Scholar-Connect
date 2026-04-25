import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ScholarsProvider } from './context/ScholarsContext.jsx';
import { supabase } from './lib/supabase.js';
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
  const [supaSessionState, setSupaSessionState] = useState({ checked: false, hasSession: false });

  // After the user signs in, supabase has a session in memory immediately, but
  // AuthContext takes a moment to fetch the profile and update React state.
  // Don't redirect to /login during that gap.
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setSupaSessionState({ checked: true, hasSession: !!data?.session });
    });
    return () => { mounted = false; };
  }, []);

  const stillResolving = loading || !supaSessionState.checked || (supaSessionState.hasSession && !session);

  if (stillResolving) {
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
      <ScholarsProvider>
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
      </ScholarsProvider>
    </AuthProvider>
  );
}
