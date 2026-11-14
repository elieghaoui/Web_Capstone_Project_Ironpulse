import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import Plans from './pages/Plans.jsx';
import Classes from './pages/Classes.jsx';
import Trainers from './pages/Trainers.jsx';
import TrainerProfile from './pages/TrainerProfile.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Admin from './pages/Admin.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  const location = useLocation();

  return (
    // reducedMotion="user": people who turn off animations in their OS settings get a calmer site
    <MotionConfig reducedMotion="user">
      <Navbar />
      {/* mode="wait" lets the old page animate out before the new one comes in */}
      {/* onExitComplete: start each new page at the top */}
      <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo(0, 0)}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/trainers" element={<Trainers />} />
          <Route path="/trainers/:id" element={<TrainerProfile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
          />
          <Route
            path="/admin"
            element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
      <Footer />
    </MotionConfig>
  );
}
