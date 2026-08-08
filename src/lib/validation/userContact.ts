/** Shared Indian contact field normalization + validation for register, profile, admin. */

export const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;
export const PIN_CODE_REGEX = /^\d{6}$/;
export const MIN_PASSWORD_LENGTH = 6;
export const MAX_ABOUT_LENGTH = 500;

export function normalizePhone(value: unknown): string {
  return String(value ?? "").replace(/\D/g, "");
}

export function normalizeEmail(value: unknown): string {
  return String(value ?? "").toLowerCase().trim();
}

export function normalizePinCode(value: unknown): string {
  return String(value ?? "").replace(/\D/g, "");
}

export function normalizeCountryCode(value: unknown): string {
  const cc = String(value ?? "").trim();
  // SparesX is India-only — always store +91
  if (!cc || cc === "+91" || cc === "91") return "+91";
  return "+91";
}

export function isIndiaCountryCode(value: unknown): boolean {
  const cc = String(value ?? "").trim();
  return !cc || cc === "+91" || cc === "91";
}

export function normalizeAbout(value: unknown): string {
  return String(value ?? "").trim().slice(0, MAX_ABOUT_LENGTH);
}

export function isValidIndianPhone(digits: string): boolean {
  return INDIAN_PHONE_REGEX.test(digits);
}

export function isValidPinCode(digits: string): boolean {
  return PIN_CODE_REGEX.test(digits);
}

export function validatePassword(password: unknown): string | null {
  const pw = String(password ?? "");
  if (pw.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  return null;
}

export type ContactFieldsInput = {
  name?: unknown;
  email?: unknown;
  mobile?: unknown;
  whatsappNumber?: unknown;
  pinCode?: unknown;
  countryCode?: unknown;
  address?: unknown;
  city?: unknown;
  state?: unknown;
};

export type NormalizedContactFields = {
  name?: string;
  email?: string;
  mobile?: string;
  whatsappNumber?: string;
  pinCode?: string;
  countryCode?: string;
  address?: string;
  city?: string;
  state?: string;
};

/**
 * Validate and normalize contact fields present in `input`.
 * Returns `{ ok: true, data }` or `{ ok: false, message }`.
 * Pass `requireAll: true` for registration / create user.
 */
export function parseContactFields(
  input: ContactFieldsInput,
  opts: { requireAll?: boolean; fieldsPresent?: (keyof ContactFieldsInput)[] } = {},
): { ok: true; data: NormalizedContactFields } | { ok: false; message: string } {
  const data: NormalizedContactFields = {};
  const requireAll = !!opts.requireAll;

  const has = (key: keyof ContactFieldsInput) =>
    requireAll ||
    input[key] !== undefined ||
    (opts.fieldsPresent?.includes(key) ?? false);

  if (has("name")) {
    const name = String(input.name ?? "").trim();
    if (!name) return { ok: false, message: "Name is required" };
    data.name = name;
  }

  if (has("email")) {
    const email = normalizeEmail(input.email);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false, message: "Valid email is required" };
    }
    data.email = email;
  }

  if (has("mobile")) {
    const mobile = normalizePhone(input.mobile);
    if (!isValidIndianPhone(mobile)) {
      return {
        ok: false,
        message: "Mobile number must be 10 digits and start with 6-9",
      };
    }
    data.mobile = mobile;
  }

  if (has("whatsappNumber")) {
    const whatsappNumber = normalizePhone(input.whatsappNumber);
    if (!isValidIndianPhone(whatsappNumber)) {
      return {
        ok: false,
        message: "WhatsApp number must be 10 digits and start with 6-9",
      };
    }
    data.whatsappNumber = whatsappNumber;
  }

  if (has("pinCode")) {
    const pinCode = normalizePinCode(input.pinCode);
    if (!isValidPinCode(pinCode)) {
      return { ok: false, message: "PIN code must be 6 digits" };
    }
    data.pinCode = pinCode;
  }

  if (has("countryCode") || input.countryCode !== undefined) {
    const raw = String(input.countryCode ?? "").trim();
    if (raw && !isIndiaCountryCode(raw)) {
      return {
        ok: false,
        message: "SparesX currently supports India (+91) numbers only",
      };
    }
    data.countryCode = normalizeCountryCode(input.countryCode);
  }

  if (has("address")) {
    const address = String(input.address ?? "").trim();
    if (!address) return { ok: false, message: "Address is required" };
    data.address = address;
  }

  if (has("city")) {
    const city = String(input.city ?? "").trim();
    if (!city) return { ok: false, message: "City is required" };
    data.city = city;
  }

  if (has("state")) {
    const state = String(input.state ?? "").trim();
    if (!state) return { ok: false, message: "State is required" };
    data.state = state;
  }

  return { ok: true, data };
}
