"use client";

/** Soft notification chime via Web Audio (no asset file). Respects mute preference. */
let audioContext: AudioContext | null = null;

function getAudioContext() {
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return null;
  if (!audioContext) audioContext = new Ctx();
  return audioContext;
}

export function prepareChatSound() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem("sparesx_chat_mute") === "1") return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state !== "running") {
      void ctx.resume();
    }
  } catch {
    // ignore autoplay restrictions until the next user gesture
  }
}

export function playMessageSound() {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem("sparesx_chat_mute") === "1") return;
    const ctx = getAudioContext();
    if (!ctx || ctx.state !== "running") return;
    const now = ctx.currentTime;

    const beep = (freq: number, start: number, dur: number, gain = 0.04) => {
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
      osc.stop(start + dur + 0.02);
    };

    beep(880, now, 0.09);
    beep(1175, now + 0.1, 0.12);
  } catch {
    // ignore autoplay restrictions
  }
}

export function isChatMuted() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("sparesx_chat_mute") === "1";
}

export function setChatMuted(muted: boolean) {
  localStorage.setItem("sparesx_chat_mute", muted ? "1" : "0");
}
