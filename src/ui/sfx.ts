// 音效：全部用 Web Audio 即時合成，不用任何音檔。
// 第一次播放時才建立 AudioContext（瀏覽器要求在使用者操作之後）。開關記在 localStorage。

const KEY = 'jianghu.sfx';
const VOLUME = 0.35;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = readEnabled();

function readEnabled(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}

export function sfxEnabled(): boolean {
  return enabled;
}

export function setSfxEnabled(on: boolean): void {
  enabled = on;
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    // 存不了就只在這次有效
  }
}

function audio(): AudioContext | null {
  if (!enabled) return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = VOLUME;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** 一段音：頻率可以滑動，音量快起慢落。 */
function tone(freq: number, dur: number, opts: { type?: OscillatorType; to?: number; gain?: number; at?: number } = {}): void {
  const a = audio();
  if (!a || !master) return;
  const t = a.currentTime + (opts.at ?? 0);
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = opts.type ?? 'sine';
  osc.frequency.setValueAtTime(freq, t);
  if (opts.to) osc.frequency.exponentialRampToValueAtTime(opts.to, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(opts.gain ?? 0.5, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

/** 一段雜音，經過濾波：破風、撞擊的質感。 */
function noise(dur: number, opts: { type?: BiquadFilterType; freq?: number; to?: number; q?: number; gain?: number; at?: number } = {}): void {
  const a = audio();
  if (!a || !master) return;
  const t = a.currentTime + (opts.at ?? 0);
  const len = Math.max(1, Math.floor(a.sampleRate * dur));
  const buf = a.createBuffer(1, len, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = opts.type ?? 'bandpass';
  f.frequency.setValueAtTime(opts.freq ?? 1500, t);
  if (opts.to) f.frequency.exponentialRampToValueAtTime(opts.to, t + dur);
  f.Q.value = opts.q ?? 1;
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(opts.gain ?? 0.6, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t);
  src.stop(t + dur + 0.02);
}

export const sfx = {
  /** 出牌：牌飛出去的「颼」。 */
  card(): void {
    noise(0.16, { freq: 900, to: 3200, q: 2, gain: 0.25 });
  },
  /** 劍、刀：破風聲 + 一點金屬尾音。 */
  slash(): void {
    noise(0.14, { type: 'highpass', freq: 2500, to: 6000, gain: 0.45 });
    tone(1400, 0.12, { type: 'triangle', to: 900, gain: 0.08, at: 0.02 });
  },
  /** 槍：短促的刺。 */
  thrust(): void {
    noise(0.1, { freq: 1800, to: 4000, q: 3, gain: 0.45 });
  },
  /** 拳：悶響。 */
  punch(): void {
    tone(140, 0.16, { to: 55, gain: 0.8 });
    noise(0.07, { type: 'lowpass', freq: 900, gain: 0.5 });
  },
  /** 暗器：細碎的嘶聲。 */
  needle(): void {
    noise(0.08, { type: 'highpass', freq: 5000, gain: 0.3 });
    noise(0.08, { type: 'highpass', freq: 6000, gain: 0.25, at: 0.05 });
  },
  /** 挨打：沉的撞擊。 */
  hit(): void {
    tone(95, 0.22, { to: 40, gain: 0.7 });
    noise(0.09, { type: 'lowpass', freq: 600, gain: 0.45 });
  },
  /** 擋格：兵刃相碰的「鏘」。 */
  parry(): void {
    tone(1760, 0.3, { type: 'triangle', gain: 0.22 });
    tone(2640, 0.22, { type: 'triangle', gain: 0.14 });
    noise(0.04, { type: 'highpass', freq: 3000, gain: 0.4 });
  },
  /** 疊護體：輕的一聲。 */
  guard(): void {
    tone(330, 0.12, { type: 'triangle', to: 440, gain: 0.25 });
  },
  /** 回氣血。 */
  heal(): void {
    tone(660, 0.18, { gain: 0.2 });
    tone(990, 0.24, { gain: 0.16, at: 0.09 });
  },
  /** 高光時刻：一記太鼓，加一點鈸的餘音。 */
  highlight(): void {
    tone(75, 0.5, { to: 42, gain: 0.95 });
    noise(0.25, { type: 'lowpass', freq: 260, gain: 0.6 });
    noise(0.7, { type: 'highpass', freq: 6500, gain: 0.12, at: 0.05 });
  },
  /** 贏了：一記銅鑼。 */
  win(): void {
    tone(196, 1.6, { gain: 0.4 });
    tone(294, 1.3, { gain: 0.22 });
    tone(392, 1.0, { type: 'triangle', gain: 0.12 });
    noise(0.3, { type: 'lowpass', freq: 400, gain: 0.25 });
  },
  /** 輸了：往下沉的低音。 */
  lose(): void {
    tone(220, 0.9, { to: 70, gain: 0.4 });
    tone(165, 1.1, { to: 55, gain: 0.25, at: 0.12 });
  },
};
