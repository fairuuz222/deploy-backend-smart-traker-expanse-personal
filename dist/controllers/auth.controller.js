import { asyncHandler } from "../utils/asyncHandler.js";
import { AuthService } from "../services/auth.service.js";
export class AuthController {
    authService;
    constructor() {
        this.authService = new AuthService();
    }
    // 1. REGISTER — Request OTP
    register = asyncHandler(async (req, res) => {
        const { email } = req.body;
        if (process.env.NODE_ENV === "development") {
            console.log("[auth] register request", { email, from: req.ip });
        }
        const result = await this.authService.registerUser(req.body);
        res.status(200).json({
            success: true,
            message: "Kode OTP telah dikirim ke email anda",
            data: result,
        });
    });
    // 2. VERIFY OTP — Finalisasi registrasi
    verifyOtp = asyncHandler(async (req, res) => {
        const { email } = req.body;
        // Accept either `code` (legacy) or `otpCode` (newer clients)
        const code = req.body.code ?? req.body.otpCode;
        if (!email || !code) {
            throw new Error("Email dan kode OTP wajib diisi");
        }
        if (process.env.NODE_ENV === "development") {
            console.log("[auth] verify otp", { email });
        }
        const newUser = await this.authService.verifyRegistration(email, code);
        res.status(201).json({
            success: true,
            message: "Registrasi berhasil, akun anda telah aktif",
            data: newUser,
        });
    });
    // 3. LOGIN
    login = asyncHandler(async (req, res) => {
        const { email } = req.body;
        if (process.env.NODE_ENV === "development") {
            console.log("[auth] login attempt", { email });
        }
        const loginResult = await this.authService.loginUser(req.body);
        res.status(200).json({
            success: true,
            message: "Login berhasil",
            data: loginResult,
        });
    });
    // 4. ME
    me = asyncHandler(async (req, res) => {
        if (!req.user) {
            throw new Error("Unauthorized");
        }
        res.status(200).json({
            success: true,
            message: "Data profile berhasil diambil",
            data: req.user,
        });
    });
    // 5. RESEND OTP
    resendOtp = asyncHandler(async (req, res) => {
        const { email } = req.body;
        if (!email) {
            throw new Error("Email wajib diisi");
        }
        const result = await this.authService.resendOtp(email);
        res.status(200).json({
            success: true,
            message: "Kode OTP baru telah dikirim",
            data: result,
        });
    });
    // 6. FORGOT PASSWORD
    forgotPassword = asyncHandler(async (req, res) => {
        const { email } = req.body;
        if (!email) {
            throw new Error("Email wajib diisi");
        }
        const result = await this.authService.requestPasswordReset(email);
        res.status(200).json({
            success: true,
            message: "Instruksi reset password telah dikirim ke email",
            data: result,
        });
    });
    // 7. RESET PASSWORD
    resetPassword = asyncHandler(async (req, res) => {
        const result = await this.authService.resetPassword(req.body);
        res.status(200).json({
            success: true,
            message: "Password anda berhasil diperbarui",
            data: result,
        });
    });
    // 8. CHANGE PASSWORD (Authenticated)
    changePassword = asyncHandler(async (req, res) => {
        const userId = req.user?.id;
        if (!userId) {
            throw new Error("Unauthorized");
        }
        const result = await this.authService.changePassword(userId, req.body);
        res.status(200).json({
            success: true,
            message: "Password berhasil diubah",
            data: result,
        });
    });
}
//# sourceMappingURL=auth.controller.js.map
