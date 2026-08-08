import jwt from "jsonwebtoken";
import type { IUser } from "../models/User";

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) throw new Error("JWT_SECRET not set");

/** Access token TTL — refresh cookie covers longer sessions. */
export const ACCESS_TOKEN_EXPIRES_IN = "1h";

export type JwtPayload = {
  id: string;
  role: string;
  /** Session version — must match User.sessionVersion */
  sv: number;
};

export function signJwt(
  user: Pick<IUser, "_id" | "role"> & { sessionVersion?: number },
  expiresIn: string | number = ACCESS_TOKEN_EXPIRES_IN,
) {
  const payload: JwtPayload = {
    id: String(user._id),
    role: user.role,
    sv: typeof user.sessionVersion === "number" ? user.sessionVersion : 0,
  };
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: expiresIn as jwt.SignOptions["expiresIn"],
    algorithm: "HS256",
  });
}

export function verifyJwt(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    }) as JwtPayload & { id?: string };
    if (!decoded?.id) return null;
    return {
      id: String(decoded.id),
      role: String(decoded.role || ""),
      // Older tokens without sv are treated as version 0
      sv: typeof decoded.sv === "number" ? decoded.sv : 0,
    };
  } catch {
    return null;
  }
}
