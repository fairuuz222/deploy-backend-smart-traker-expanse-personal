export class ErrorHandler {
    // Ubah jadi STATIC biar gampang dipanggil tanpa 'new ErrorHandler()'
    static handle(err, _req, res, _next // <--- INI WAJIB ADA!
    ) {
        // Default status is 500 for unhandled errors
        let status = 500;
        let message = "Internal Server Error";
        // Handle standard Error objects (from throw new Error())
        if (err instanceof Error) {
            message = err.message;
            status = err.status || 400; // Default to 400 for validation errors
        }
        else if (typeof err === 'object' && err !== null) {
            // Handle custom error objects
            status = err.status || 500;
            message = err.message || "Internal Server Error";
        }
        else if (typeof err === 'string') {
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
//# sourceMappingURL=error.handler.js.map