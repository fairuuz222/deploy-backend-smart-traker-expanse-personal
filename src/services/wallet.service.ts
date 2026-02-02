// services/wallet.service.ts
import { WalletRepository } from '../repositories/wallet.repository';
import prisma from '../database';
// 👇 1. Import Enum dari generated prisma
import { WalletType } from '../../dist/generated'; 

export class WalletService { 
    private walletRepo: WalletRepository;

    constructor() {
        this.walletRepo = new WalletRepository(prisma);
    }

    async getWallets(userId: string) {
        return await this.walletRepo.findAll(userId);
    }

   async createWallet(
  userId: string,
  data: {
    name: string;
    type: string;
    initialBalance?: number;
    balance?: number;
  }
) {
  // 1️⃣ Tentukan balance (prioritas initialBalance dari frontend)
  const balance =
    data.initialBalance !== undefined
      ? data.initialBalance
      : data.balance ?? 0;

  // 2️⃣ Validasi tipe wallet (string → enum)
  const isValidType = Object.values(WalletType).includes(
    data.type as WalletType
  );

  if (!isValidType) {
    throw new Error(
      `Tipe wallet '${data.type}' tidak valid. Pilihan: ${Object.values(WalletType).join(', ')}`
    );
  }

  // 3️⃣ Casting aman setelah validasi
  const typeEnum = data.type as WalletType;

  // 4️⃣ Simpan ke database
  return await this.walletRepo.create({
    name: data.name,
    type: typeEnum,
    balance,
    user_id: userId,
  });
}


    async updateWallet(userId: string, walletId: string, data: { name?: string; type?: string; balance?: number }) {
        const wallet = await this.walletRepo.findById(walletId);
        
        if (!wallet || wallet.user_id !== userId) {
            const error: any = new Error("Wallet tidak ditemukan atau akses dilarang");
            error.status = 404;
            throw error;
        }

        const updateData: any = {
            name: data.name,
            balance: data.balance
        };

        // --- VALIDASI UPDATE ---
        // Cek jika user mengirim field 'type' untuk diupdate
        if (data.type) {
            const isValidType = Object.values(WalletType).includes(data.type as any);
            
            if (!isValidType) {
                 throw new Error(`Tipe wallet '${data.type}' tidak valid.`);
            }

            // Assign sebagai Enum
            updateData.type = data.type as WalletType;
        }

        return await this.walletRepo.update(walletId, updateData);
    }

    async deleteWallet(userId: string, walletId: string) {
        // ... (sama seperti sebelumnya, tidak ada perubahan karena delete cuma butuh ID)
        const wallet = await this.walletRepo.findById(walletId);
        if (!wallet || wallet.user_id !== userId) {
            const error: any = new Error("Wallet tidak ditemukan");
            error.status = 404;
            throw error;
        }
        return await this.walletRepo.delete(walletId);
    }
}