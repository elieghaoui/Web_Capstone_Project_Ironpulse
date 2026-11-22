import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { Loader } from './components/Status.jsx';
import Home from './pages/Home.jsx';

// Performance fix (lecture 22): every page except Home is split into its own file
// and only downloaded the first time someone opens it. Home stays in the main
// bundle because it is the first thing every visitor sees.
const Plans = lazy(() => import('./pages/Plans.jsx'));
const Classes = lazy(() => import('./pages/Classes.jsx'));
const Trainers = lazy(() => import('./pages/Trainers.jsx'));
const TrainerProfile = lazy(() => import('./pages/TrainerProfile.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const Signup = lazy(() => import('./pages/Signup.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Admin = lazy(() => import('./pages/Admin.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

export default function App() {
  const { pathname } = useLocation();

  // Start every new page at the top (an effect: it reaches outside React, lecture 15).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <Navbar />
      {/* Shows the loader while a page's file is downloading */}
      <Suspense fallback={<Loader label="Loading page" />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/trainers" element={<Trainers />} />
          <Route path="/trainers/:id" element={<TrainerProfile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<ProtectedRoute memberOnly><Dashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <Footer />
    </>
  );
}
