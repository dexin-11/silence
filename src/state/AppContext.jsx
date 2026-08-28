import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { soundEngine } from '../audio/engine';

const AppContext = createContext(null);

export const useApp = () => useContext(AppContext);

export function AppProvider({ children }) {
  const [sound, setSound] = useState({ isPlaying: false, currentTrack: null });
  const [endedAt, setEndedAt] = useState(null); // 声音自然播完的时间戳
  const [breath, setBreath] = useState({ status: 'idle', elapsed: 0 });

  useEffect(() => {
    soundEngine.onStateChange = (track) => {
      setSound({ isPlaying: !!track, currentTrack: track });
    };
    soundEngine.onEnded = (track) => {
      setSound({ isPlaying: false, currentTrack: null });
      setEndedAt({ track, at: Date.now() });
    };
    return () => {
      soundEngine.onStateChange = null;
      soundEngine.onEnded = null;
    };
  }, []);

  // “结束了。”提示 3 秒后消失
  useEffect(() => {
    if (!endedAt) return;
    const timer = setTimeout(() => setEndedAt(null), 3000);
    return () => clearTimeout(timer);
  }, [endedAt]);

  const playTrack = useCallback((id) => soundEngine.play(id), []);
  const stopTrack = useCallback(() => soundEngine.stop(), []);
  const setBreathState = useCallback(
    (patch) => setBreath((b) => ({ ...b, ...patch })),
    []
  );
  const resetBreath = useCallback(() => setBreath({ status: 'idle', elapsed: 0 }), []);

  const value = {
    sound,
    endedNotice: endedAt,
    breath,
    setBreathState,
    resetBreath,
    playTrack,
    stopTrack
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
