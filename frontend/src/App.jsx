import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthPage from './pages/AuthPage';
import UserLogin from './pages/UserLogin';
import UserSignup from './pages/UserSignup';
import OTPVerification from './pages/OTPVerification';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Home from './pages/Home';
import ShakhaList from './pages/ShakhaList';
import ShakhaDetail from './pages/ShakhaDetail';
import Meetings from './pages/Meetings';
import Events from './pages/Events';
import Join from './pages/Join';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import BottomNav from './components/BottomNav';
import Notifications from './pages/Notifications';
import Attendance from './pages/Attendance';
import AdminLayout from './layouts/AdminLayout';
import AdminRoute from './components/AdminRoute';
import AdminProfile from './pages/admin/AdminProfile';

// A wrapper component to handle conditional layout visibility
const AppLayout = () => {
  const location = useLocation();
  const hideLayoutPaths = ['/', '/login', '/signup', '/verify', '/admin/login', '/forgot-password', '/reset-password'];
  const isAdminRoute = location.pathname.startsWith('/admin');
  const shouldHideLayout = hideLayoutPaths.includes(location.pathname) || isAdminRoute;
  const isHome = location.pathname === '/home';

  return (
    <div className="flex flex-col min-h-screen bg-[#faf8f5]">
      {!shouldHideLayout && <Navbar />}
      <main className={`flex-grow md:pb-0 pb-20 ${!shouldHideLayout && !isHome ? 'pt-[72px]' : ''}`}>
        <Routes>
          {/* Auth Routes */}
          <Route path="/" element={<PublicRoute><AuthPage /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><UserLogin /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><UserSignup /></PublicRoute>} />
          <Route path="/verify" element={<PublicRoute><OTPVerification /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
          
          {/* Main App Routes (Protected) */}
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/shakhas" element={<ProtectedRoute><ShakhaList /></ProtectedRoute>} />
          <Route path="/shakhas/:id" element={<ProtectedRoute><ShakhaDetail /></ProtectedRoute>} />
          <Route path="/meetings" element={<ProtectedRoute><Meetings /></ProtectedRoute>} />
          <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/join" element={<ProtectedRoute><Join /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="shakhas" element={<Dashboard />} />
            <Route path="meetings" element={<Dashboard />} />
            <Route path="events" element={<Dashboard />} />
            <Route path="users" element={<Dashboard />} />
            <Route path="notifications" element={<Dashboard />} />
            <Route path="joinRequests" element={<Dashboard />} />
            <Route path="groups" element={<Dashboard />} />
            <Route path="profile" element={<AdminProfile />} />
          </Route>
        </Routes>
      </main>
      {!shouldHideLayout && <BottomNav />}
      <div className="hidden md:block">
        {!shouldHideLayout && <Footer />}
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
