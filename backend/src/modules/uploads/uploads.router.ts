import { Router, type Request, type Response, type NextFunction } from "express";
import { z, ZodError } from "zod";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";

export const uploadsRouter = Router();

const CreateUploadSchema = z.object({
  folder: z.string().min(1),
  filename: z.string().min(1),
  mimeType: z.string().min(1),
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

function sanitizeFolder(raw: string) {
  return raw
    .replace(/^\/+|\/+$/g, "")
    .replace(/[^a-zA-Z0-9/_-]/g, "_");
}

function sanitizeFilename(name: string) {
  const ext = path.extname(name).replace(/[^a-zA-Z0-9.]/g, "");
  const base = path
    .basename(name, ext)
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .replace(/_+/g, "_");

  return `${base}${ext}`;
}

function httpError(message: string, status = 500, extra?: Record<string, unknown>) {
  return Object.assign(new Error(message), { status, ...extra });
}

function buildS3Client() {
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION || "us-east-1";
  const accessKeyId = process.env.S3_ACCESS_KEY || "";
  const secretAccessKey = process.env.S3_SECRET_KEY || "";

  if (!endpoint) {
    throw httpError("S3_ENDPOINT missing", 500);
  }
  if (!accessKeyId || !secretAccessKey) {
    throw httpError("S3 credentials missing", 500);
  }

  return new S3Client({
    region,
    endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

function buildPublicUrl(key: string) {
  const publicBase = (process.env.S3_PUBLIC_BASE_URL || "").replace(/\/+$/g, "");
  return publicBase ? `${publicBase}/${key}` : key;
}

function runSingleUpload(req: Request, res: Response) {
  return new Promise<void>((resolve, reject) => {
    upload.single("file")(req, res, (err: unknown) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

uploadsRouter.post(
  "/presign",
  requireAuth,
  requireRole(["SUPER_ADMIN", "CLUB_ADMIN", "EDITOR"]),
  async (req, res, next) => {
    try {
      const body = CreateUploadSchema.parse(req.body);
      const bucket = process.env.S3_BUCKET || "club-media";
      const client = buildS3Client();

      const folder = sanitizeFolder(body.folder);
      const filename = sanitizeFilename(body.filename);
      const key = `${folder}/${Date.now()}-${filename}`;

      const cmd = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: body.mimeType,
      });

      const uploadUrl = await getSignedUrl(client, cmd, { expiresIn: 60 * 5 });

      return res.json({
        key,
        uploadUrl,
        publicUrl: buildPublicUrl(key),
      });
    } catch (err) {
      return next(err);
    }
  }
);

uploadsRouter.post(
  "/upload",
  requireAuth,
  requireRole(["SUPER_ADMIN", "CLUB_ADMIN", "EDITOR"]),
  async (req, res, next) => {
    try {
      await runSingleUpload(req, res);

      const file = req.file as Express.Multer.File | undefined;
      if (!file) {
        throw httpError("No file uploaded", 400);
      }

      const bucket = process.env.S3_BUCKET || "club-media";
      const client = buildS3Client();

      const rawFolder = String((req.body as any)?.folder || "misc");
      const folder = sanitizeFolder(rawFolder);
      const original = sanitizeFilename(file.originalname);
      const key = `${folder}/${Date.now()}-${crypto.randomUUID()}-${original}`;

      try {
        await client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
            ContentLength: file.size,
            Metadata: {
              originalname: file.originalname,
            },
          })
        );
      } catch (err: any) {
        console.error("S3 upload failed", {
          message: err?.message,
          name: err?.name,
          code: err?.code,
          endpoint: process.env.S3_ENDPOINT,
          bucket,
          key,
        });
        throw httpError(`S3 upload failed: ${err?.message || "unknown error"}`, 502);
      }

      return res.json({
        key,
        publicUrl: buildPublicUrl(key),
        mimeType: file.mimetype,
        bytes: file.size,
        filename: file.originalname,
      });
    } catch (err) {
      return next(err);
    }
  }
);