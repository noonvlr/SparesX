import {
  isValidIndianPhone,
  isValidPinCode,
  normalizePhone,
  normalizePinCode,
} from "@/lib/validation/userContact";

export type ProfileCompleteFields = {
  mobile?: string | null;
  whatsappNumber?: string | null;
  address?: string | null;
  pinCode?: string | null;
  city?: string | null;
  state?: string | null;
};

/** True when marketplace contact fields are filled with valid Indian formats. */
export function isProfileComplete(user: ProfileCompleteFields): boolean {
  const mobile = normalizePhone(user.mobile);
  const whatsapp = normalizePhone(user.whatsappNumber);
  const pin = normalizePinCode(user.pinCode);
  const address = String(user.address || "").trim();
  const city = String(user.city || "").trim();
  const state = String(user.state || "").trim();

  return (
    isValidIndianPhone(mobile) &&
    isValidIndianPhone(whatsapp) &&
    isValidPinCode(pin) &&
    address.length > 0 &&
    city.length > 0 &&
    state.length > 0
  );
}
