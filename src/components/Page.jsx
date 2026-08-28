import { motion } from 'framer-motion';

// 页面容器：全屏、淡入淡出 0.6s，桌面端内容列居中 480px
export default function Page({ className = '', style, children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
      className={`fixed inset-0 overflow-hidden ${className}`}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// 内容列：移动端全宽，≥768px 限宽 480px 居中
export function ContentColumn({ className = '', children }) {
  return (
    <div className={`relative mx-auto h-full w-full max-w-[480px] ${className}`}>
      {children}
    </div>
  );
}
