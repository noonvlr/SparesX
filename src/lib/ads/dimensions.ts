export type SizeSpec = { width: number; height: number };

export type DimensionCheckResult =
  | { ok: true; scale: 1 | 2 }
  | { ok: false; message: string };

/**
 * Accept exact placement size or exact 2× (same aspect). Nothing else.
 */
export function checkCreativeDimensions(
  uploaded: SizeSpec,
  required: SizeSpec,
  label: string,
): DimensionCheckResult {
  const { width: w, height: h } = uploaded;
  const { width: rw, height: rh } = required;

  if (w === rw && h === rh) return { ok: true, scale: 1 };
  if (w === rw * 2 && h === rh * 2) return { ok: true, scale: 2 };

  return {
    ok: false,
    message: `${label} must be ${rw}×${rh} (or ${rw * 2}×${rh * 2}). You uploaded ${w}×${h}.`,
  };
}

export function aspectRatioLabel(spec: SizeSpec): string {
  const g = gcd(spec.width, spec.height);
  return `${spec.width / g}:${spec.height / g}`;
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}
