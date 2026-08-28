import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Page, { ContentColumn } from '../components/Page';

function ClockView() {
  const [now, setNow] = useState(() => new Date());
  const [faded, setFaded] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // 5 秒后自动淡出，页面变空白
  useEffect(() => {
    const id = setTimeout(() => setFaded(true), 5000);
    return () => clearTimeout(id);
  }, []);

  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');

  return (
    <motion.div
      animate={{ opacity: faded ? 0 : 1 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
      className="absolute inset-0 flex items-center justify-center"
    >
      <span className="text-[48px] leading-none text-faint">
        {hh}:{mm}
      </span>
    </motion.div>
  );
}

export default function Done() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('main'); // 'main' | 'clock'

  return (
    <Page style={{ backgroundColor: '#EAEFF2' }}>
      <AnimatePresence mode="wait">
        {mode === 'main' ? (
          <motion.div
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            <ContentColumn>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-10">
                <p className="px-8 text-center text-base text-faint">
                  可以继续，也可以去忙了。
                </p>
                <div className="flex gap-10">
                  <button
                    className="text-sm text-ink hover:opacity-60"
                    onClick={() => navigate('/')}
                  >
                    再来一轮
                  </button>
                  <button
                    className="text-sm text-ink hover:opacity-60"
                    onClick={() => setMode('clock')}
                  >
                    去忙了
                  </button>
                </div>
              </div>
              <button
                className="absolute bottom-6 left-1/2 -translate-x-1/2 select-none text-[10px] text-whisper hover:opacity-60"
                onClick={() => navigate('/burn')}
              >
                脑子里还是乱？写下来烧掉。
              </button>
            </ContentColumn>
          </motion.div>
        ) : (
          <motion.div key="clock" className="absolute inset-0">
            <ClockView />
          </motion.div>
        )}
      </AnimatePresence>
    </Page>
  );
}
