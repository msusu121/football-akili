import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export const uploadsRouter = Router();

// -------- Local uploads (public folder) --------
// Saves to backend/public/uploads/<folder>/<filename>
// and returns { key, publicUrl } where key is stored in DB.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_ROOT = path.join(__dirname, "..", "..", "..", "public", "uploads");

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const raw = String((req.body as any)?.folder || "misc");
    const folder = raw.replace(/^\/+|\/+$/g, "");
    const dest = path.join(UPLOAD_ROOT, folder);
    ensureDir(dest);
    cb(null, dest);
  },
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({ storage });

const CreateUploadSchema = z.object({
  folder: z.string().min(1),
  filename: z.string().min(1),
  mimeType: z.string().min(1),
});

uploadsRouter.post(
  "/presign",
  requireAuth,
  requireRole(["SUPER_ADMIN", "CLUB_ADMIN", "EDITOR"]),
  async (req, res, next) => {
    try {
      const body = CreateUploadSchema.parse(req.body);
      const bucket = process.env.S3_BUCKET || "club-media";
      const endpoint = process.env.S3_ENDPOINT;
      const region = process.env.S3_REGION || "us-east-1";

      if (!endpoint) throw Object.assign(new Error("S3_ENDPOINT missing"), { status: 500 });

      const client = new S3Client({
        region,
        endpoint,
        forcePathStyle: true,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY || "",
          secretAccessKey: process.env.S3_SECRET_KEY || "",
        },
      });

      const key = `${body.folder.replace(/\/+$/g, "")}/${Date.now()}-${body.filename}`;
      const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: body.mimeType });
      const uploadUrl = await getSignedUrl(client, cmd, { expiresIn: 60 * 5 });

      const publicBase = process.env.S3_PUBLIC_BASE_URL || "";
      const publicUrl = publicBase ? `${publicBase}/${key}` : key;

      res.json({
        key,
        uploadUrl,
        publicUrl,
      });
    } catch (e) {
      next(e);
    }
  }
);

uploadsRouter.post(
  "/local",
  requireAuth,
  requireRole(["SUPER_ADMIN", "CLUB_ADMIN", "EDITOR"]),
  upload.single("file"),
  async (req, res, next) => {
    try {
      const f = (req as any).file as Express.Multer.File | undefined;
      if (!f) throw Object.assign(new Error("No file uploaded"), { status: 400 });

      const raw = String((req.body as any)?.folder || "misc");
      const folder = raw.replace(/^\/+|\/+$/g, "");
      const key = `${folder}/${f.filename}`;
      const base = process.env.PUBLIC_MEDIA_BASE_URL || "http://localhost:4000/media";
      const publicUrl = `${base.replace(/\/+$/g, "")}/${key}`;

      res.json({
        key,
        publicUrl,
        mimeType: f.mimetype,
        bytes: f.size,
        filename: f.originalname,
      });
    } catch (e) {
      next(e);
    }
  }
);
