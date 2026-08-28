import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AppProvider, useApp } from './state/AppContext';
import Breathe from './pages/Breathe';
import Done from './pages/Done';
import Burn from './pages/Burn';
import Nothing from './pages/Nothing';

// 离开 / 时呼吸状态自动重置
function BreathResetter({ children }) {
  const { pathname } = useLocation();
  const { resetBreath } = useApp();
  useEffect(() => {
    if (pathname !== '/') resetBreath();
  }, [pathname, resetBreath]);
  return children;
}

// 声音自然播完的全局提示：“结束了。”（右下角，3 秒）
function EndedNotice() {
  const { endedNotice } = useApp();
  return (
    <AnimatePresence>
      {endedNotice && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="pointer-events-none fixed bottom-6 right-6 z-50 text-sm text-faint"
        >
          结束了。
        </motion.p>
      )}
    </AnimatePresence>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Breathe />} />
        <Route path="/burn" element={<Burn />} />
        <Route path="/nothing" element={<Nothing />} />
        <Route path="/done" element={<Done />} />
        <Route path="*" element={<Breathe />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <BreathResetter>
          <AnimatedRoutes />
          <EndedNotice />
        </BreathResetter>
      </BrowserRouter>
    </AppProvider>
  );
}
