"use client";

/** Soft notification chime via Web Audio (no asset file). Respects mute preference. */
export function playMessageSound() {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem("sparesx_chat_mute") === "1") return;
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
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
    void ctx.resume();
    setTimeout(() => void ctx.close(), 500);
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
