import type { ErrorRequestHandler } from "express";
import multer from "multer";
import { ZodError } from "zod";

export const errorHandler: ErrorRequestHandler = (err: any, _req, res, _next) => {
  let status = Number(err?.status || err?.statusCode || 500);
  let error = "Internal server error";
  let details: unknown = undefined;

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      status = 413;
      error = "File too large";
    } else {
      status = 400;
      error = err.message || "Upload error";
    }
  } else if (err instanceof ZodError) {
    status = 400;
    error = "Validation failed";
    details = err.flatten();
  } else if (err?.type === "entity.too.large") {
    status = 413;
    error = "Request body too large";
  } else if (err?.message) {
    error = err.message;
  }

  if (status >= 500) {
    console.error("API error:", {
      message: err?.message,
      stack: err?.stack,
      name: err?.name,
      status,
    });
  }

  return res.status(status).json({
    ok: false,
    error,
    ...(details ? { details } : {}),
  });
};