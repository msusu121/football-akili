import jwt from "jsonwebtoken";
/**
 * Ensures required env vars exist at runtime.
 * TS still treats process.env.* as string | undefined, so we validate once here.
 */
function requireEnv(name) {
    const v = process.env[name];
    if (!v || !String(v).trim()) {
        throw new Error(`${name} is not set (check your .env and runtime env)`);
    }
    return v;
}
const JWT_SECRET = requireEnv("JWT_SECRET");
// JWT_EXPIRES_IN supports formats like: "7d", "1h", "30m", or a number of seconds.
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ??
    "7d");
export function signToken(payload) {
    const options = { expiresIn: JWT_EXPIRES_IN };
    return jwt.sign(payload, JWT_SECRET, options);
}
export function verifyToken(token) {
    // jwt.verify returns string | object; we cast to our payload type.
    return jwt.verify(token, JWT_SECRET);
}
