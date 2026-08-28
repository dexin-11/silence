import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Page, { ContentColumn } from '../components/Page';

// 按显示宽度把文本切分为视觉行（与输入区同字体同宽度测量）
function wrapLines(text, width) {
  const div = document.createElement('div');
  Object.assign(div.style, {
    position: 'fixed',
    top: '-9999px',
    left: '0',
    visibility: 'hidden',
    width: `${width}px`,
    fontSize: '16px',
    lineHeight: '1.8',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontFamily: 'inherit'
  });
  document.body.appendChild(div);
  const out = [];
  for (const para of text.split('\n')) {
    if (para === '') {
      out.push('');
      continue;
    }
    div.textContent = para;
    const node = div.firstChild;
    const range = document.createRange();
    let lineStart = 0;
    let lastTop = null;
    for (let i = 1; i <= para.length; i++) {
      range.setStart(node, i - 1);
      range.setEnd(node, i);
      const top = range.getBoundingClientRect().top;
      if (lastTop !== null && Math.abs(top - lastTop) > 2) {
        out.push(para.slice(lineStart, i - 1));
        lineStart = i - 1;
      }
      lastTop = top;
    }
    out.push(para.slice(lineStart));
    div.textContent = '';
  }
  div.remove();
  return out;
}

// 每行切成 2 字小颗粒
function chunkLine(line) {
  const chars = [...line];
  const chunks = [];
  for (let i = 0; i < chars.length; i += 2) chunks.push(chars.slice(i, i + 2).join(''));
  if (chunks.length === 0) chunks.push('\u00A0');
  return chunks;
}

// 烧掉动画时序：整体变暗 0.3s → 自底向上逐行灰烬（行间 80ms，每行 0.9s）→ “没有了。”
const PHASE1 = 0.3;
const LINE_STAGGER = 0.08;
const LINE_DUR = 0.9;

export default function Burn() {
  const navigate = useNavigate();
  const areaRef = useRef(null);
  const [text, setText] = useState('');
  const [phase, setPhase] = useState('input'); // 'input' | 'burning' | 'gone'
  const [lines, setLines] = useState([]);
  const timerRef = useRef(null);

  useEffect(() => {
    // 自动聚焦
    areaRef.current?.focus();
    return () => clearTimeout(timerRef.current);
  }, []);

  // 刷新/离开即消失：仅存于 state，无任何存储

  const startBurn = () => {
    const area = areaRef.current;
    if (!area || !text.trim()) return;
    const ls = wrapLines(text, area.clientWidth);
    setLines(ls);
    setPhase('burning');
    const end = PHASE1 * 1000 + Math.max(0, ls.length - 1) * LINE_STAGGER * 1000 + LINE_DUR * 1000;
    timerRef.current = setTimeout(() => setPhase('gone'), Math.max(1500, end + 300));
  };

  const resetPage = () => {
    setText('');
    setLines([]);
    setPhase('input');
    requestAnimationFrame(() => areaRef.current?.focus());
  };

  const canBurn = text.trim().length > 0;

  return (
    <Page style={{ backgroundColor: '#F5F0EA' }}>
      <ContentColumn>
        {/* 返回 */}
        <button
          className="absolute left-4 top-4 select-none text-[10px] text-faint hover:opacity-60"
          onClick={() => navigate('/')}
        >
          ← 返回
        </button>

        <p className="absolute inset-x-0 top-10 px-8 text-center text-sm text-faint">
          把脑子里的事都倒在这里。
        </p>

        {phase === 'input' && (
          <div className="absolute inset-x-6 top-1/4">
            <textarea
              ref={areaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="h-[50vh] w-full bg-transparent text-base leading-[1.8] text-ink"
              style={{ wordBreak: 'break-word' }}
              spellCheck={false}
            />
            <div className="mt-10 flex justify-center">
              <button
                className={`select-none text-base ${
                  canBurn ? 'text-ink hover:opacity-60' : 'pointer-events-none text-whisper'
                }`}
                onClick={startBurn}
              >
                烧掉
              </button>
            </div>
          </div>
        )}

        {phase === 'burning' && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0.3 }}
            transition={{ duration: PHASE1, ease: 'easeInOut' }}
            className="absolute inset-x-6 top-1/4 text-base leading-[1.8] text-ink"
            style={{ wordBreak: 'break-word' }}
          >
            {lines.map((line, li) => {
              const delay = PHASE1 + (lines.length - 1 - li) * LINE_STAGGER; // 自底向上
              return (
                <div key={li} style={{ minHeight: '1.8em' }}>
                  {chunkLine(line).map((chunk, ci) => (
                    <motion.span
                      key={ci}
                      initial={{ opacity: 1, y: 0, x: 0, color: '#4A4A4A' }}
                      animate={{
                        opacity: 0,
                        y: -(50 + Math.random() * 50),
                        x: Math.random() * 30 - 15,
                        color: '#C4A48A'
                      }}
                      transition={{
                        duration: LINE_DUR,
                        delay: delay + Math.random() * 0.15,
                        ease: 'easeInOut'
                      }}
                      style={{ display: 'inline-block', whiteSpace: 'pre' }}
                    >
                      {chunk}
                    </motion.span>
                  ))}
                </div>
              );
            })}
          </motion.div>
        )}

        {phase === 'gone' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-10">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="text-sm text-faint"
            >
              没有了。
            </motion.p>
            <button className="text-sm text-ink hover:opacity-60" onClick={resetPage}>
              再写一页
            </button>
          </div>
        )}
      </ContentColumn>
    </Page>
  );
}
