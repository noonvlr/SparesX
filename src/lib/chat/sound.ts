"use client";

/**
 * Chat notification sound.
 * Browsers (especially mobile Safari/Chrome) start AudioContext suspended
 * until a user gesture. Oscillator playback was silently skipped whenever
 * the context was not already "running".
 */

let audioContext: AudioContext | null = null;
let unlocked = false;
let unlockInstalled = false;
let htmlAudio: HTMLAudioElement | null = null;
let chimeUrl: string | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return null;
  if (!audioContext) audioContext = new Ctx();
  return audioContext;
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, samples.length * 2, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}

function getChimeUrl(): string {
  if (chimeUrl) return chimeUrl;
  const sampleRate = 22050;
  const duration = 0.34;
  const n = Math.floor(sampleRate * duration);
  const data = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    let s = 0;
    if (t < 0.12) {
      s = Math.sin(2 * Math.PI * 880 * t) * Math.exp(-t * 16);
    } else if (t > 0.14 && t < 0.32) {
      const u = t - 0.14;
      s = Math.sin(2 * Math.PI * 1175 * u) * Math.exp(-u * 12);
    }
    data[i] = s * 0.55;
  }
  chimeUrl = URL.createObjectURL(encodeWav(data, sampleRate));
  return chimeUrl;
}

function getHtmlAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!htmlAudio) {
    htmlAudio = new Audio();
    htmlAudio.preload = "auto";
    htmlAudio.src = getChimeUrl();
    htmlAudio.volume = 0.85;
  }
  return htmlAudio;
}

async function playHtmlFallback() {
  try {
    const audio = getHtmlAudio();
    if (!audio) return;
    audio.currentTime = 0;
    await audio.play();
  } catch {
    // autoplay still blocked
  }
}

function playWebAudio(ctx: AudioContext) {
  const now = ctx.currentTime;
  const beep = (freq: number, start: number, dur: number, gain = 0.12) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gain, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.03);
  };
  beep(880, now, 0.1, 0.14);
  beep(1175, now + 0.12, 0.14, 0.16);
}

export async function unlockChatSound() {
  if (typeof window === "undefined") return;
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      await ctx.resume();
    }
    if (ctx && ctx.state === "running" && !unlocked) {
      const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(ctx.destination);
      src.start(0);
    }
    const audio = getHtmlAudio();
    if (audio) {
      audio.muted = true;
      audio.currentTime = 0;
      await audio.play().catch(() => {});
      audio.pause();
      audio.muted = false;
      audio.currentTime = 0;
    }
    unlocked = true;
  } catch {
    // ignore until the next gesture
  }
}

export function installChatSoundUnlock() {
  if (typeof window === "undefined" || unlockInstalled) return;
  unlockInstalled = true;
  const unlock = () => {
    void unlockChatSound();
  };
  window.addEventListener("pointerdown", unlock, { passive: true });
  window.addEventListener("touchstart", unlock, { passive: true });
  window.addEventListener("keydown", unlock);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void unlockChatSound();
  });
}

export function prepareChatSound() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem("sparesx_chat_mute") === "1") return;
  void unlockChatSound();
}

export function playMessageSound() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem("sparesx_chat_mute") === "1") return;
  void (async () => {
    try {
      await unlockChatSound();
      const ctx = getAudioContext();
      if (ctx?.state === "running") {
        playWebAudio(ctx);
        return;
      }
      await playHtmlFallback();
    } catch {
      await playHtmlFallback();
    }
  })();
}

export function isChatMuted() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("sparesx_chat_mute") === "1";
}

export function setChatMuted(muted: boolean) {
  localStorage.setItem("sparesx_chat_mute", muted ? "1" : "0");
  if (!muted) {
    void unlockChatSound().then(() => playMessageSound());
  }
}
