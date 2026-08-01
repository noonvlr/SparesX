"use client";

import { useEffect, useState } from "react";

const RESEND_SECONDS = 120;

/** Countdown for OTP resend. Call `restart()` after a successful send. */
export function useOtpResendCooldown(initialSeconds = RESEND_SECONDS) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  function restart(seconds = initialSeconds) {
    setSecondsLeft(seconds);
  }

  const canResend = secondsLeft === 0;
  const label =
    secondsLeft > 0
      ? `Resend OTP in ${Math.floor(secondsLeft / 60)}:${String(
          secondsLeft % 60,
        ).padStart(2, "0")}`
      : "Resend OTP";

  return { secondsLeft, canResend, label, restart };
}

export { RESEND_SECONDS };
