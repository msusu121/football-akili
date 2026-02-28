import { prisma } from "../../lib/prisma.js";
export async function requireActiveMembership(req, _res, next) {
    if (!req.user)
        return next(Object.assign(new Error("Unauthorized"), { status: 401 }));
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user)
        return next(Object.assign(new Error("Unauthorized"), { status: 401 }));
    const isActive = user.membership === "ACTIVE" &&
        (!user.membershipUntil || user.membershipUntil.getTime() > Date.now());
    if (!isActive)
        return next(Object.assign(new Error("Membership required"), { status: 402 }));
    return next();
}
