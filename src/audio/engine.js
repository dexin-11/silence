// 声音引擎：Web Audio API，全局单例，跨路由不中断。
// TODO: public/audio 下的三个 m4a 为 ffmpeg 合成的占位音频，
// 正式版请替换为真实录音（rain.m4a 雨声 / whisper.m4a 低语 / bowl.m4a 钵音，各 10 分钟，≤5MB）。
const TRACKS = {
  rain: '/audio/rain.m4a',
  whisper: '/audio/whisper.m4a',
  bowl: '/audio/bowl.m4a'
};

const FADE_IN = 3; // 淡入 3 秒
const FADE_OUT = 5; // 淡出 5 秒
const STOP_FADE = 0.4; // 手动停止的快速淡出（防爆音）

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.mediaSource = null;
    this.gain = null;
    this.audio = null;
    this.current = null; // trackId | null
    this.fadeOutScheduled = false;
    this.onStateChange = null;
    this.onEnded = null;
    this.stopTimer = null;
  }

  ensureCtx() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  play(trackId) {
    this.stopInternal();
    const url = TRACKS[trackId];
    if (!url) return;

    const ctx = this.ensureCtx();
    if (!this.audio) {
      this.audio = new Audio();
      this.audio.preload = 'auto';
      this.mediaSource = ctx.createMediaElementSource(this.audio);
      this.gain = ctx.createGain();
      this.gain.gain.value = 0;
      this.mediaSource.connect(this.gain).connect(ctx.destination);
    }

    const a = this.audio;
    const g = this.gain;
    this.fadeOutScheduled = false;
    this.current = trackId;

    a.src = url;
    a.onended = () => {
      if (this.current === trackId) {
        const cb = this.onEnded;
        this.current = null;
        this.onStateChange && this.onStateChange(null);
        cb && cb(trackId);
      }
    };
    // duration 未知，用 timeupdate 在剩 5 秒时调度淡出
    a.ontimeupdate = () => {
      if (this.current !== trackId || this.fadeOutScheduled) return;
      if (a.duration && Number.isFinite(a.duration) && a.duration - a.currentTime <= FADE_OUT) {
        this.fadeOutScheduled = true;
        const now = ctx.currentTime;
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(g.gain.value, now);
        g.gain.linearRampToValueAtTime(0, now + Math.max(0.1, a.duration - a.currentTime));
      }
    };

    a.play().catch(() => {
      // 极端情况下播放失败：静默复位
      this.current = null;
      this.onStateChange && this.onStateChange(null);
      return;
    });

    // 淡入 3 秒
    const now = ctx.currentTime;
    g.gain.cancelScheduledValues(now);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(1, now + FADE_IN);

    this.onStateChange && this.onStateChange(trackId);
  }

  stopInternal() {
    if (!this.audio || !this.current) return;
    const a = this.audio;
    const g = this.gain;
    const ctx = this.ctx;
    const track = this.current;
    this.current = null;
    this.fadeOutScheduled = false;
    a.onended = null;
    a.ontimeupdate = null;
    try {
      const now = ctx.currentTime;
      g.gain.cancelScheduledValues(now);
      g.gain.setValueAtTime(g.gain.value, now);
      g.gain.linearRampToValueAtTime(0, now + STOP_FADE);
    } catch (e) { /* noop */ }
    clearTimeout(this.stopTimer);
    this.stopTimer = setTimeout(() => {
      try { a.pause(); } catch (e) { /* noop */ }
    }, STOP_FADE * 1000 + 60);
    this.onStateChange && this.onStateChange(null);
    void track;
  }

  stop() {
    this.stopInternal();
  }
}

export const soundEngine = new SoundEngine();
