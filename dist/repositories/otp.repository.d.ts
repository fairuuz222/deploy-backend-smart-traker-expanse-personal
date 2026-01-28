import { PrismaClient, Otp } from "../../dist/generated/index.js";
export declare class OtpRepository {
    private prisma;
    constructor(prismaClient: PrismaClient);
    createOtp(userId: string, code: string, type: any): Promise<Otp>;
    findValidOtp(userId: string, code: string): Promise<Otp | null>;
    deleteUserOtps(userId: string): Promise<import("../../dist/generated/index.js").Prisma.BatchPayload>;
}
//# sourceMappingURL=otp.repository.d.ts.map
