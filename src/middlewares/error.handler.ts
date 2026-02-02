// src/middlewares/error.middleware.ts (atau utils/ErrorHandler.ts)
import type { Request, Response, NextFunction } from 'express';

export class ErrorHandler {
  // Ubah jadi STATIC biar gampang dipanggil tanpa 'new ErrorHandler()'
  public static handle(
    err: any, 
    _req: Request, 
    res: Response, 
    _next: NextFunction // <--- INI WAJIB ADA!
  ) {
    // Default status is 500 for unhandled errors
    let status = 500;
    let message = "Internal Server Error";

    // Handle standard Error objects (from throw new Error())
    if (err instanceof Error) {
      message = err.message;
      status = (err as any).status || 400; // Default to 400 for validation errors
    } else if (typeof err === 'object' && err !== null) {
      // Handle custom error objects
      status = err.status || 500;
      message = err.message || "Internal Server Error";
    } else if (typeof err === 'string') {
      // Handle string errors
      message = err;
    }
    
    // Opsional: Log error di console server biar developer tau (jangan dimakan sendiri)
    if (status === 500) {
        console.error("🔥 SERVER ERROR:", err);
    }

    res.status(status).json({
      success: false,
      message: message
    });
  }
}