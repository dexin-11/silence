// 生成钵音占位音频（432Hz 谐波，每 18s 一次敲击，指数衰减）→ stdout WAV
import { writeFileSync } from 'node:fs';

const SR = 44100;
const DUR = 600;
const N = SR * DUR;
const samples = new Float32Array(N);

for (let strike = 0; strike * 18 < DUR; strike++) {
  const t0 = strike * 18;
  const len = Math.min(12, DUR - t0) * SR; // 余韵 12s（指数衰减后近无声）
  const s0 = Math.round(t0 * SR);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const env = Math.exp(-0.55 * t);
    const v = (Math.sin(2 * Math.PI * 432 * t) * 0.6
      + Math.sin(2 * Math.PI * 864.2 * t) * 0.15
      + Math.sin(2 * Math.PI * 1296.1 * t) * 0.05) * env * 0.5;
    samples[s0 + i] += v;
  }
}

// WAV 16-bit mono
const buf = Buffer.alloc(44 + N * 2);
buf.write('RIFF', 0);
buf.writeUInt32LE(36 + N * 2, 4);
buf.write('WAVE', 8);
buf.write('fmt ', 12);
buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20); // PCM
buf.writeUInt16LE(1, 22); // mono
buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 2, 28);
buf.writeUInt16LE(2, 32);
buf.writeUInt16LE(16, 34);
buf.write('data', 36);
buf.writeUInt32LE(N * 2, 40);
for (let i = 0; i < N; i++) {
  const s = Math.max(-1, Math.min(1, samples[i]));
  buf.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
}
writeFileSync('public/audio/bowl.wav', buf);
console.log('WAV_OK');
