import prisma from '../database';
import jwt from 'jsonwebtoken';
import { hashPassword, comparePassword } from '../utils/hash';
import { ActivityLogService } from './activity-log.service';
import { ActivityAction } from '../types/activity.types';
import { OtpRepository } from '../repositories/otp.repository';
import { MailService } from './mail.service';

export class AuthService {
  private activityLogService = new ActivityLogService();
  private otpRepository = new OtpRepository(prisma);
  private mailService = new MailService();

  /**
   * TAHAP 1 — REQUEST REGISTER (OTP)
   */
  async registerUser(data: any) {
    const { fullName, email, password } = data;

    if (!fullName || !email || !password) {
      throw new Error('Full name, email, dan password wajib diisi');
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('Email sudah terdaftar');
    }

    const hashedPassword = await hashPassword(password);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    await this.otpRepository.deleteOtpsByEmail(email);
    await this.otpRepository.createRegistrationOtp(email, otpCode, {
      fullName,
      password: hashedPassword,
    });

    await this.mailService.sendOTP(email, otpCode);

    return { email };
  }

  /**
   * TAHAP 2 — VERIFY REGISTER (FINAL)
   */
  async verifyRegistration(email: string, code: string) {
    const otpRecord = await this.otpRepository.findValidRegistrationOtp(email, code);
    if (!otpRecord) {
      throw new Error('Kode OTP salah atau kadaluarsa');
    }

    const payload = otpRecord.payload as { fullName: string; password: string };

    const user = await prisma.$transaction(async (tx: any) => {
      const username =
        payload.fullName.replace(/\s+/g, '').toLowerCase() +
        Math.floor(100 + Math.random() * 900);

      const createdUser = await tx.user.create({
        data: {
          full_name: payload.fullName,
          email,
          password: payload.password,
          role: 'USER',
          profile: { create: { username } },
        },
      });

      await tx.otp.delete({ where: { id: otpRecord.id } });
      return createdUser;
    });

    await this.activityLogService.log(
      user.id,
      ActivityAction.REGISTER,
      `User verified via email ${email}`
    );

    return {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
    };
  }

  /**
   * LOGIN
   */
  async loginUser(data: any) {
    const { email, password } = data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Email atau password salah');

    const isValid = await comparePassword(password, user.password);
    if (!isValid) throw new Error('Email atau password salah');

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '1d' }
    );

    await this.activityLogService.log(user.id, ActivityAction.LOGIN, 'Login success');

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
    };
  }

    async resendOtp(email: string) {
        // Cek apakah email sudah jadi user (jika sudah, arahkan ke flow login)
        const userExists = await prisma.user.findUnique({ where: { email } });
        if (userExists) throw new Error("Akun ini sudah aktif, silakan login.");

        // Cari record pendaftaran sementara
        const pendingOtp = await prisma.otp.findFirst({
            where: { email, type: 'REGISTRATION' },
            orderBy: { expired_at: 'desc' }
        });

        if (!pendingOtp) throw new Error("Data pendaftaran tidak ditemukan. Silakan register ulang.");

        const newOtpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Update OTP (Bersihkan yang lama, buat yang baru dengan payload yang sama)
        await this.otpRepository.deleteOtpsByEmail(email);
        await this.otpRepository.createRegistrationOtp(email, newOtpCode, pendingOtp.payload);

        await this.mailService.sendOTP(email, newOtpCode);

        return { message: "Kode OTP baru berhasil dikirim" };
    }

    async requestPasswordReset(email: string) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) throw new Error("Email tidak ditemukan");

        await this.otpRepository.deleteOtpsByEmail(email);
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Gunakan userId untuk forgot password karena user-nya sudah ada
        await this.otpRepository.createOtpWithUserId(user.id, email, otpCode, 'PASSWORD_RESET');

        await this.mailService.sendOTP(user.email, otpCode);
        await this.activityLogService.log(user.id, ActivityAction.FORGOT_PASSWORD, `Reset requested for: ${email}`);

        return { message: "Kode OTP reset password telah dikirim" };
    }

    async resetPassword(data: any) {
        const { email, code, newPassword, confirmPassword } = data;

        if (newPassword !== confirmPassword) throw new Error("Password tidak cocok");

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) throw new Error("User tidak ditemukan");

        // Cek OTP khusus untuk reset password
        const isValidOtp = await prisma.otp.findFirst({
            where: {
                user_id: user.id,
                code: code,
                type: 'PASSWORD_RESET',
                expired_at: { gt: new Date() }
            }
        });

        if (!isValidOtp) throw new Error("Kode OTP salah atau kadaluarsa");

        const hashedPassword = await hashPassword(newPassword);

        await prisma.$transaction([
            prisma.user.update({ where: { id: user.id }, data: { password: hashedPassword } }),
            prisma.otp.deleteMany({ where: { user_id: user.id } })
        ]);

        await this.activityLogService.log(user.id, ActivityAction.RESET_PASSWORD, "Password changed successfully");

        return { message: "Password berhasil diubah. Silakan login." };
    }

    async changePassword(userId: string, data: any) {
        const { oldPassword, newPassword, confirmPassword } = data; //

        if (newPassword !== confirmPassword) {
            throw new Error("Password baru dan konfirmasi tidak cocok");
        }

        // Cari user berdasarkan ID yang didapat dari token
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error("User tidak ditemukan");

        // Bandingkan password lama
        const isMatch = await comparePassword(oldPassword, user.password);
        if (!isMatch) throw new Error("Password lama salah");

        // Hash & Update
        const hashedPassword = await hashPassword(newPassword);

        // Update tanpa me-return seluruh object user (keamanan)
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });

        return { message: "Password updated successfully" };
    }
}