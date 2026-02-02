import type { Request, Response } from "express";
import { TransactionService } from "../services/transaction.service";
import { asyncHandler } from "../utils/asyncHandler";
import { 
    createTransactionSchema, 
    updateTransactionSchema, 
    queryTransactionSchema 
} from "../validations/transaction.validation";

export class TransactionController {
    private service: TransactionService;

    constructor() {
        this.service = new TransactionService();
    }

    // 1. GET ALL (Dengan Pagination, Filter & Search)
    public getAll = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user?.id;
        if (!userId) throw new Error("Unauthorized");

        // --- LOG START ---
        if (process.env.NODE_ENV === 'development') {
            // Sangat penting melihat raw query sebelum diparse Zod
            // Jika Zod error, kita tahu input aslinya apa.
            console.log('[transaction] getAll called from', req.ip || req.hostname, 'userId:', userId, 'query:', req.query);
        }

        const query = queryTransactionSchema.parse(req.query);

        const result = await this.service.getTransactions(
            userId,
            query.month ? Number(query.month) : undefined,
            query.year ? Number(query.year) : undefined,
            query.type as string | undefined,     
            query.search as string | undefined,
            query.page ? Number(query.page) : undefined,     
            query.limit ? Number(query.limit) : undefined     
        );

        // --- LOG END ---
        if (process.env.NODE_ENV === 'development') {
            try {
                // Log jumlah data & info pagination
                console.log(`[transaction] getAll returned ${result.data.length} items. Page ${result.meta.page}/${result.meta.total_pages}`);
            } catch (_) {}
        }

        res.status(200).json({
            success: true,
            message: "Operation success",
            data: result.data, 
            meta: {
                ...result.meta, 
                filter_month: query.month || new Date().getMonth() + 1,
                filter_year: query.year || new Date().getFullYear(),
                search: query.search || null
            }
        });
    });

    // 2. GET DETAIL (By ID)
    public getDetail = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user?.id;
        if (!userId) throw new Error("Unauthorized");

        const { id } = req.params;

        // --- LOG START ---
        if (process.env.NODE_ENV === 'development') {
            console.log('[transaction] getDetail called for id:', id);
        }

        const transaction = await this.service.getTransactionDetail(userId, String(id));

        res.status(200).json({
            success: true,
            message: "Operation success",
            data: transaction
        });

        if (process.env.NODE_ENV === 'development') {
            try {
                console.log(`[transaction] fetched detail id=${id} userId=${userId}`);
            } catch (err:any) {
                console.error('[transaction] getDetail error:', err.message);
            }}
    });

    // 3. CREATE
    public create = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user?.id;
        if (!userId) throw new Error("Unauthorized");

        // --- LOG START ---
        if (process.env.NODE_ENV === 'development') {
            console.log('[transaction] create called from', req.ip || req.hostname, 'userId:', userId, 'body:', req.body);
        }

        const validatedData = createTransactionSchema.parse(req.body);

        const newTransaction = await this.service.createTransaction(userId, validatedData);

        // --- LOG END ---
        if (process.env.NODE_ENV === 'development') {
            try {
                console.log(`[transaction] created id=${(newTransaction as any).id} amount=${(newTransaction as any).amount}`);
                console.log(`[transaction] newTransaction object:`, JSON.stringify(newTransaction, null, 2));
            } catch (error) {
                console.error(`[transaction] Error logging newTransaction:`, error);
            }
        }

        res.status(201).json({
            success: true,
            message: "Operation success",
            data: newTransaction
        });

        if (process.env.NODE_ENV === 'development') {
            try {
                console.log(`[transaction] created id=${(newTransaction as any).id} name=${(newTransaction as any).name} userId=${userId}`);
            } catch (_) {}}
    });

    // 4. UPDATE
    public update = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user?.id;
        if (!userId) throw new Error("Unauthorized");

        const { id } = req.params;
        
        // --- LOG START ---
        if (process.env.NODE_ENV === 'development') {
             console.log('[transaction] update called id:', id, 'body:', req.body);
        }

        const validatedData = updateTransactionSchema.parse(req.body);

        const updatedTransaction = await this.service.updateTransaction(userId, String(id), validatedData);

        // --- LOG END ---
        if (process.env.NODE_ENV === 'development') {
            try {
                console.log(`[transaction] updated id=${(updatedTransaction as any).id}`);
            } catch (_) {}
        }

        res.status(200).json({
            success: true,
            message: "Operation success",
            data: updatedTransaction
        });
        if (process.env.NODE_ENV === 'development') {
            try {
                console.log(`[transaction] updated id=${(updatedTransaction as any).id} name=${(updatedTransaction as any).name} userId=${userId}`);
            } catch (_) {}}
    });

    // 5. DELETE
    public delete = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user?.id;
        if (!userId) throw new Error("Unauthorized");

        const { id } = req.params;

        // --- LOG START ---
        if (process.env.NODE_ENV === 'development') {
             console.log('[transaction] delete called id:', id);
        }

        await this.service.deleteTransaction(userId, String(id));

        // --- LOG END ---
        if (process.env.NODE_ENV === 'development') {
             console.log(`[transaction] deleted id=${id}`);
        }

        res.status(200).json({
            success: true,
            message: "Operation success",
            data: {} 
        });
        if (process.env.NODE_ENV === 'development') {
            try {
                console.log(`[transaction] deleted id=${id} userId=${userId}`);
            } catch (_) {}}
    });
}