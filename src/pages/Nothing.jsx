import { useState } from 'react';
import { motion } from 'framer-motion';
import Page from '../components/Page';

// 极慢随机游走的光斑：每段 600s（10 分钟）移动约 ±100px，到达后换新目标，越界折返
const randomOffset = () => ({
  x: Math.random() * 200 - 100,
  y: Math.random() * 200 - 100
});

// 限制累计漂移，避免光斑游走出屏
const clamp = (v) => Math.max(-120, Math.min(120, v));

function Blob({ color, size = 200, className = '' }) {
  const [offset, setOffset] = useState(randomOffset);

  return (
    <motion.div
      className={`absolute rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        filter: 'blur(60px)'
      }}
      initial={{ x: 0, y: 0 }}
      animate={{ x: offset.x, y: offset.y }}
      transition={{ duration: 600, ease: 'easeInOut' }}
      onAnimationComplete={() =>
        setOffset((prev) => ({
          x: clamp(prev.x + (Math.random() * 200 - 100) * 0.5),
          y: clamp(prev.y + (Math.random() * 200 - 100) * 0.5)
        }))
      }
    />
  );
}

export default function Nothing() {
  return (
    <Page style={{ backgroundColor: '#FAFAF7' }}>
      <Blob color="rgba(196, 164, 138, 0.15)" className="left-[15%] top-[25%]" />
      <Blob color="rgba(143, 168, 184, 0.12)" className="left-[50%] top-[50%]" />
    </Page>
  );
}
