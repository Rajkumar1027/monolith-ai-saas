import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { StartingPage } from './pages/StartingPage';
import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './pages/Dashboard';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { CursorGlow } from './components/CursorGlow';

/** Blocks unauthenticated access — redirects to /login */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  if (localStorage.getItem('monolith_auth') !== 'true') {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

/**
 * PublicRoute — wraps public-only pages (landing, auth).
 * If the user is already authenticated, skip the page and
 * send them straight into the dashboard.
 */
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  if (localStorage.getItem('monolith_auth') === 'true') {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

function AppRoutes() {
  const location = useLocation();
  return (
    <>
      <CursorGlow />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Root: show landing to guests, redirect to dashboard for auth'd users */}
          <Route path="/" element={<PublicRoute><StartingPage /></PublicRoute>} />
          {/* Login / Register: same guard — don't show auth page to logged-in users */}
          <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />
          {/* Dashboard: protected — bounces unauthenticated visitors to /login */}
          <Route path="/dashboard/*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          {/* Google OAuth 2.0 callback — must be public (user isn't logged in yet) */}
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          {/* Catch-all: unknown routes fall back to root */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
