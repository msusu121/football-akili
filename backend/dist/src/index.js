import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { prisma } from "./lib/prisma.js";
import { errorHandler } from "./modules/middleware/errorHandler.js";
import { authRouter } from "./modules/auth/auth.router.js";
import { publicRouter } from "./modules/public/public.router.js";
import { newsRouter } from "./modules/news/news.router.js";
import { teamRouter } from "./modules/team/team.router.js";
import { matchesRouter } from "./modules/matches/matches.router.js";
import { shopRouter } from "./modules/shop/shop.router.js";
import { uploadsRouter } from "./modules/uploads/uploads.router.js";
import { ticketsRouter } from "./modules/tickets/tickets.router.js";
import { paymentsRouter } from "./modules/payments/payments.router.js";
import { adminRouter } from "./modules/admin/admin.router.js";
dotenv.config();
const app = express();
// Serve uploaded media from an open/public folder.
// Files saved under backend/public/uploads/... are available at /media/...
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/media", express.static(path.join(__dirname, "..", "public", "uploads")));
app.use(helmet());
app.use(cors({
    origin: (process.env.CORS_ORIGIN || "http://localhost:3000").split(","),
    credentials: true,
}));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));
app.get("/health", async (_req, res) => {
    // quick db ping
    await prisma.$queryRaw `SELECT 1`;
    res.json({ ok: true });
});
app.use("/auth", authRouter);
app.use("/public", publicRouter);
app.use("/news", newsRouter);
app.use("/team", teamRouter);
app.use("/matches", matchesRouter);
app.use("/shop", shopRouter);
app.use("/uploads", uploadsRouter);
app.use("/tickets", ticketsRouter);
app.use("/payments", paymentsRouter);
app.use("/admin", adminRouter);
app.use(errorHandler);
const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
});
