import crypto from "crypto";

const ALGO = "aes-256-gcm";

function getKey(): Buffer {
  const raw = process.env.SETTINGS_ENCRYPTION_KEY || "";
  if (!raw || raw.length < 32) {
    throw new Error(
      "SETTINGS_ENCRYPTION_KEY must be set (at least 32 characters)",
    );
  }
  return crypto.createHash("sha256").update(raw).digest();
}

export function canEncryptSecrets(): boolean {
  const raw = process.env.SETTINGS_ENCRYPTION_KEY || "";
  return raw.length >= 32;
}

/** Encrypt a secret string. Returns empty string for empty input. */
export function encryptSecret(plain: string): string {
  if (!plain) return "";
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${enc.toString("base64url")}`;
}

export function decryptSecret(payload: string): string {
  if (!payload) return "";
  const [ivB64, tagB64, dataB64] = payload.split(".");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Invalid encrypted secret format");
  }
  const key = getKey();
  const decipher = crypto.createDecipheriv(
    ALGO,
    key,
    Buffer.from(ivB64, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64url")),
    decipher.final(),
  ]);
  return dec.toString("utf8");
}

export function maskSecret(value: string | undefined | null): string {
  if (!value) return "";
  const plain = (() => {
    try {
      return decryptSecret(value);
    } catch {
      return value;
    }
  })();
  if (!plain) return "";
  if (plain.length <= 4) return "••••";
  return `••••${plain.slice(-4)}`;
}

function otpPepper(): string {
  return (
    process.env.OTP_PEPPER ||
    process.env.JWT_SECRET ||
    "sparesx-otp-pepper-fallback"
  );
}

function digestEqual(aHex: string, bHex: string): boolean {
  try {
    const a = Buffer.from(aHex, "hex");
    const b = Buffer.from(bHex, "hex");
    if (a.length !== b.length || a.length === 0) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** HMAC-SHA256 OTP digest (pepper from OTP_PEPPER or JWT_SECRET). */
export function hashOtp(otp: string): string {
  return crypto
    .createHmac("sha256", otpPepper())
    .update(String(otp))
    .digest("hex");
}

function legacyHashOtp(otp: string): string {
  return crypto.createHash("sha256").update(String(otp)).digest("hex");
}

/** Constant-time compare; accepts peppered or legacy unsalted hashes. */
export function verifyOtp(
  otp: string,
  storedHash: string | undefined | null,
): boolean {
  if (!storedHash) return false;
  if (digestEqual(hashOtp(otp), String(storedHash))) return true;
  return digestEqual(legacyHashOtp(otp), String(storedHash));
}

export function generateOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}
