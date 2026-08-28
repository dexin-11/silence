import { AnimatePresence, motion } from 'framer-motion';

const ITEMS = [
  { id: 'rain', label: '雨声' },
  { id: 'whisper', label: '低语' },
  { id: 'bowl', label: '钵音' }
];

// 声音选择浮层：从底部滑入，半透明 + 毛玻璃
export default function SoundSheet({ open, onClose, onSelect, currentTrack }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="fixed inset-x-0 bottom-0 z-40 flex flex-col items-center pb-20 pt-14"
          style={{
            background: 'rgba(250, 250, 247, 0.92)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)'
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            // 点击浮层空白处收起
            if (e.target === e.currentTarget) onClose();
          }}
        >
          {ITEMS.map((it) => (
            <button
              key={it.id}
              onClick={() => onSelect(it.id)}
              className={`py-5 text-base ${
                currentTrack === it.id ? 'text-faint' : 'text-ink'
              }`}
            >
              {it.label}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
