// services/wallet.service.ts
import { WalletRepository } from "../repositories/wallet.repository.js";
import prisma from "../database.js";
// 👇 1. Import Enum dari generated prisma
import { WalletType } from "@prisma/client";
export class WalletService {
    walletRepo;
    constructor() {
        this.walletRepo = new WalletRepository(prisma);
    }
    async getWallets(userId) {
        return await this.walletRepo.findAll(userId);
    }
    async createWallet(userId, data) {
        // 1️⃣ Tentukan balance (prioritas initialBalance dari frontend)
        const balance = data.initialBalance !== undefined
            ? data.initialBalance
            : data.balance ?? 0;
        // 2️⃣ Validasi tipe wallet (string → enum)
        const isValidType = Object.values(WalletType).includes(data.type);
        if (!isValidType) {
            throw new Error(`Tipe wallet '${data.type}' tidak valid. Pilihan: ${Object.values(WalletType).join(", ")}`);
        }
        // 3️⃣ Casting aman setelah validasi
        const typeEnum = data.type;
        // 4️⃣ Simpan ke database
        return await this.walletRepo.create({
            name: data.name,
            type: typeEnum,
            balance,
            user_id: userId,
        });
    }
    async updateWallet(userId, walletId, data) {
        const wallet = await this.walletRepo.findById(walletId);
        if (!wallet || wallet.user_id !== userId) {
            const error = new Error("Wallet tidak ditemukan atau akses dilarang");
            error.status = 404;
            throw error;
        }
        const updateData = {
            name: data.name,
            balance: data.balance
        };
        // --- VALIDASI UPDATE ---
        // Cek jika user mengirim field 'type' untuk diupdate
        if (data.type) {
            const isValidType = Object.values(WalletType).includes(data.type);
            if (!isValidType) {
                throw new Error(`Tipe wallet '${data.type}' tidak valid.`);
            }
            // Assign sebagai Enum
            updateData.type = data.type;
        }
        return await this.walletRepo.update(walletId, updateData);
    }
    async deleteWallet(userId, walletId) {
        // ... (sama seperti sebelumnya, tidak ada perubahan karena delete cuma butuh ID)
        const wallet = await this.walletRepo.findById(walletId);
        if (!wallet || wallet.user_id !== userId) {
            const error = new Error("Wallet tidak ditemukan");
            error.status = 404;
            throw error;
        }
        return await this.walletRepo.delete(walletId);
    }
}
//# sourceMappingURL=wallet.service.js.map
