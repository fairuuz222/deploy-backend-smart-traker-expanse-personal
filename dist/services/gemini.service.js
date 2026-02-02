// backend/src/services/gemini.service.ts
import { DEFAULT_INSIGHT_PROMPT } from "../ai/prompts/insight.default.js";
import { DEFAULT_CHAT_PROMPT } from "../ai/prompts/chat.default.js";
import { LUNE_CHAT_PROMPT } from "../ai/prompts/chat.lune.js";
import { LUNE_INSIGHT_PROMPT } from "../ai/prompts/insight.lune.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();
export class GeminiService {
    model;
    constructor() {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY tidak ditemukan di .env");
        }
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Tetap pakai model 2.5 Flash
        this.model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    }
    // ==========================================
    // 1. FITUR INSIGHT (Gaya: Smart Casual & Sopan)
    // ==========================================
    async analyzeFinancialHealth(data, luneAwake = false) {
        const remaining = data.budgetLimit - data.totalExpense;
        const usagePercent = data.budgetLimit > 0
            ? Math.round((data.totalExpense / data.budgetLimit) * 100)
            : 0;
        const prompt = luneAwake ? LUNE_INSIGHT_PROMPT({
            ...data,
            remaining,
            usagePercent,
        }) :
            DEFAULT_INSIGHT_PROMPT({
                ...data,
                remaining,
                usagePercent,
            });
        try {
            const result = await this.model.generateContent(prompt);
            const text = result.response.text();
            const firstBrace = text.indexOf("{");
            const lastBrace = text.lastIndexOf("}");
            if (firstBrace === -1 || lastBrace === -1) {
                throw new Error("Format JSON tidak ditemukan.");
            }
            return JSON.parse(text.substring(firstBrace, lastBrace + 1));
        }
        catch (error) {
            console.error("\u274C GEMINI ERROR:", error);
            return {
                score: 0,
                status: "ERROR",
                message: "Maaf, asisten keuangan sedang istirahat sebentar.",
                tips: []
            };
        }
    }
    // ==========================================
    // 2. FITUR CHATBOT (Gaya: Ramah & Membantu)
    // ==========================================
    async chatWithFinancialBot(contextData, userQuestion, userOccupation, userRelationship, luneAwake = false) {
        const prompt = luneAwake ? LUNE_CHAT_PROMPT(contextData, userQuestion, userOccupation, userRelationship) :
            DEFAULT_CHAT_PROMPT(contextData, userQuestion, userOccupation, userRelationship);
        try {
            const result = await this.model.generateContent(prompt);
            return result.response.text();
        }
        catch (error) {
            console.error("Gemini Chat Error:", error);
            return "Mohon maaf, koneksi saya sedang tidak stabil. Boleh diulangi pertanyaannya?";
        }
    }
}
//# sourceMappingURL=gemini.service.js.map
