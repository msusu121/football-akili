import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../../lib/auth.js";

export type AuthUser = { id: string; role: string };

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) return next(Object.assign(new Error("Unauthorized"), { status: 401 }));

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch (e) {
    return next(Object.assign(new Error("Unauthorized"), { status: 401 }));
  }
}

export function requireRole(roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(Object.assign(new Error("Unauthorized"), { status: 401 }));
    if (!roles.includes(req.user.role)) return next(Object.assign(new Error("Forbidden"), { status: 403 }));
    return next();
  };
}
