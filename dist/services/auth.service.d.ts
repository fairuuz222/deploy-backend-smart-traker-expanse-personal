export declare class AuthService {
    private activityLogService;
    private otpRepository;
    private mailService;
    /**
     * TAHAP 1 — REQUEST REGISTER (OTP)
     */
    registerUser(data: any): Promise<{
        email: any;
    }>;
    /**
     * TAHAP 2 — VERIFY REGISTER (FINAL)
     */
    verifyRegistration(email: string, code: string): Promise<{
        id: any;
        email: any;
        fullName: any;
    }>;
    /**
     * LOGIN
     */
    loginUser(data: any): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            fullName: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
    }>;
    resendOtp(email: string): Promise<{
        message: string;
    }>;
    requestPasswordReset(email: string): Promise<{
        message: string;
    }>;
    resetPassword(data: any): Promise<{
        message: string;
    }>;
    changePassword(userId: string, data: any): Promise<{
        message: string;
    }>;
}
//# sourceMappingURL=auth.service.d.ts.map