import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useTransform
} from 'framer-motion';
import Page, { ContentColumn } from '../components/Page';
import SoundSheet from '../components/SoundSheet';
import { useApp } from '../state/AppContext';

// 一个呼吸周期 19s：吸 4 + 屏 7 + 呼 8
const INHALE = 4;
const HOLD = 7;
const EXHALE = 8;
const CYCLE = INHALE + HOLD + EXHALE; // 19

const COLOR_SPAN = 180; // 颜色渐变时长 3 分钟
// 总时长：周期持续到跨过 3 分钟的那一轮自然结束（约 9.5 周期 → 10 周期 = 190s，不截断）
const TOTAL = CYCLE * Math.ceil(COLOR_SPAN / CYCLE); // 190

const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

// 周期内光球 scale：吸 1→1.35（easeInOut 4s），屏 1.35，呼 1.35→1（easeInOut 8s）
function scaleAt(t) {
  const pos = t % CYCLE;
  if (pos < INHALE) return 1 + 0.35 * easeInOutQuad(pos / INHALE);
  if (pos < INHALE + HOLD) return 1.35;
  return 1.35 - 0.35 * easeInOutQuad((pos - INHALE - HOLD) / EXHALE);
}

// 屏息期间 opacity 0.9 → 1
function opacityAt(t) {
  const pos = t % CYCLE;
  if (pos < INHALE) return 0.9;
  if (pos < INHALE + HOLD) return 0.9 + 0.1 * ((pos - INHALE) / HOLD);
  return 1;
}

export default function Breathe() {
  const navigate = useNavigate();
  const { setBreathState, sound, playTrack, stopTrack } = useApp();

  const t = useMotionValue(0); // 已进行秒数

  const runningRef = useRef(true);
  const elapsedRef = useRef(0); // ms
  const lastTsRef = useRef(null);
  const reportedRef = useRef(-1);
  const finishedRef = useRef(false);
  const autoPausedRef = useRef(false);
  const hideTimerRef = useRef(null);

  const [running, setRunning] = useState(true);
  const [controls, setControls] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [prompt, setPrompt] = useState(false); // 页面返回后的“继续？”

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    runningRef.current = false;
    setBreathState({ status: 'finished', elapsed: TOTAL });
    navigate('/done');
  }, [navigate, setBreathState]);

  // rAF 时间轴：唯一的时间来源，暂停/后台均不累计
  useEffect(() => {
    setBreathState({ status: 'running', elapsed: 0 });
    let raf;
    const tick = (now) => {
      if (lastTsRef.current == null) lastTsRef.current = now;
      if (runningRef.current) {
        elapsedRef.current += now - lastTsRef.current;
        lastTsRef.current = now;
        t.set(Math.min(elapsedRef.current / 1000, TOTAL));
        const sec = Math.floor(elapsedRef.current / 1000);
        if (sec > reportedRef.current) {
          reportedRef.current = sec;
          setBreathState({ elapsed: sec });
        }
        if (elapsedRef.current >= TOTAL * 1000) {
          finish();
          return;
        }
      } else {
        lastTsRef.current = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [finish, setBreathState, t]);

  const pause = useCallback(
    (silent) => {
      runningRef.current = false;
      setRunning(false);
      if (!silent) setBreathState({ status: 'paused' });
    },
    [setBreathState]
  );

  const resume = useCallback(() => {
    runningRef.current = true;
    autoPausedRef.current = false;
    setPrompt(false);
    setRunning(true);
    setBreathState({ status: 'running' });
  }, [setBreathState]);

  const restart = useCallback(() => {
    elapsedRef.current = 0;
    reportedRef.current = -1;
    t.set(0);
    resume();
  }, [resume, t]);

  // 页面不可见时暂停，返回后询问“继续？”
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        if (runningRef.current) {
          autoPausedRef.current = true;
          pause(true);
        }
      } else if (autoPausedRef.current) {
        setPrompt(true);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [pause]);

  useEffect(() => () => clearTimeout(hideTimerRef.current), []);

  // 点击屏幕：显示/隐藏控制层，3 秒无操作自动淡出
  const onScreenTap = () => {
    if (sheetOpen) {
      setSheetOpen(false);
      return;
    }
    if (prompt) return;
    if (controls) {
      setControls(false);
      clearTimeout(hideTimerRef.current);
    } else {
      setControls(true);
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => setControls(false), 3000);
    }
  };

  // 声音图标 / 控制层声音按钮：播放中→停止；否则展开浮层
  const handleSoundToggle = () => {
    if (sound.isPlaying) {
      stopTrack();
      setSheetOpen(false);
    } else {
      setSheetOpen((o) => !o);
    }
  };

  const handleSelect = (id) => {
    if (sound.currentTrack === id) stopTrack();
    else playTrack(id);
    setSheetOpen(false);
  };

  // 派生的视觉值
  const scale = useTransform(t, scaleAt);
  const ballOpacity = useTransform(t, opacityAt);
  const bg = useTransform(t, [0, COLOR_SPAN], ['#F5F0EA', '#EAEFF2']);
  const ballColor = useTransform(t, [0, COLOR_SPAN], ['#C4A48A', '#8FA8B8']);
  const glowColor = useTransform(
    t,
    [0, COLOR_SPAN],
    ['rgba(196,164,138,0.3)', 'rgba(143,168,184,0.3)']
  );
  const boxShadow = useMotionTemplate`0 0 80px 30px ${glowColor}`;

  return (
    <Page>
      <motion.div
        style={{ backgroundColor: bg }}
        className="absolute inset-0"
        onPointerDown={onScreenTap}
      >
        <ContentColumn>
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              style={{
                width: '35vw',
                maxWidth: 160,
                aspectRatio: '1',
                borderRadius: '9999px',
                backgroundColor: ballColor,
                boxShadow,
                filter: 'blur(0.5px)',
                scale,
                opacity: ballOpacity
              }}
            />
          </div>
        </ContentColumn>
      </motion.div>

      <ContentColumn className="pointer-events-none">
        {/* 声音图标：底部左侧 24px */}
        <button
          aria-label="声音"
          className="pointer-events-auto absolute bottom-6 left-6 select-none text-base text-faint hover:opacity-60"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={handleSoundToggle}
        >
          {sound.isPlaying ? '🔊' : '🔇'}
        </button>

        {/* 什么都不做：底部中央 */}
        <button
          className="pointer-events-auto absolute bottom-4 left-1/2 -translate-x-1/2 select-none text-[10px] text-whisper hover:opacity-60"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => navigate('/nothing')}
        >
          什么都不做
        </button>

        {/* 控制层 */}
        <AnimatePresence>
          {controls && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              className="pointer-events-auto absolute inset-x-0 top-1/2 flex -translate-y-1/2 flex-col items-center gap-6"
            >
              <div className="flex items-center gap-10">
                <button
                  className="text-sm text-faint hover:opacity-60"
                  onClick={() => (running ? pause(false) : resume())}
                >
                  {running ? '⏸ 暂停' : '继续'}
                </button>
                <button className="text-sm text-faint hover:opacity-60" onClick={finish}>
                  ⏭ 跳过
                </button>
              </div>
              <button className="text-sm text-faint hover:opacity-60" onClick={handleSoundToggle}>
                声音：{sound.isPlaying ? '🔊' : '🔇'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 返回页面后的极简询问 */}
        <AnimatePresence>
          {prompt && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-8"
            >
              <p className="text-base text-faint">继续？</p>
              <div className="flex gap-10">
                <button className="text-sm text-ink hover:opacity-60" onClick={resume}>
                  继续
                </button>
                <button className="text-sm text-ink hover:opacity-60" onClick={restart}>
                  重新开始
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </ContentColumn>

      {/* 声音选择浮层 */}
      <SoundSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSelect={handleSelect}
        currentTrack={sound.currentTrack}
      />
    </Page>
  );
}
