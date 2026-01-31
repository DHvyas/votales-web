import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import HomeView from './components/HomeView';
import ReaderView from './components/ReaderView';
import AuthView from './components/AuthView';
import UpdatePasswordView from './components/UpdatePasswordView';
import SearchView from './components/SearchView';
import ProfileView from './components/ProfileView';
import UserView from './components/UserView';
import AboutView from './components/AboutView';
import PrivacyView from './components/PrivacyView';
import NotFoundView from './components/NotFoundView';
import { ToastProvider } from './components/ui';
import './App.css';

// Page transition wrapper
const pageVariants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut' as const,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: 'easeIn' as const,
    },
  },
};

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <Routes location={location}>
          <Route path="/" element={<HomeView />} />
          <Route path="/tale/:id" element={<ReaderView />} />
          <Route path="/login" element={<AuthView />} />
          <Route path="/update-password" element={<UpdatePasswordView />} />
          <Route path="/search" element={<SearchView />} />
          <Route path="/profile" element={<ProfileView />} />
          <Route path="/u/:identifier" element={<UserView />} />
          <Route path="/profile/:identifier" element={<UserView />} />
          <Route path="/about" element={<AboutView />} />
          <Route path="/privacy" element={<PrivacyView />} />
          <Route path="*" element={<NotFoundView />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AnimatedRoutes />
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;

