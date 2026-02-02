// backend/src/services/gemini.service.ts
import { DEFAULT_INSIGHT_PROMPT } from '../ai/prompts/insight.default';
import { DEFAULT_CHAT_PROMPT } from '../ai/prompts/chat.default';
import { LUNE_CHAT_PROMPT } from '../ai/prompts/chat.lune';
import { LUNE_INSIGHT_PROMPT } from '../ai/prompts/insight.lune';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

export class GeminiService {
    private model: any;

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
    async analyzeFinancialHealth(data: {
      userName: string;
      userOccupation: string;
      userRelationship: string;
      totalIncome: number;
      totalExpense: number;
      budgetLimit: number;
      topCategories: string[];
    },
    luneAwake: boolean = false
) {
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

        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace === -1 || lastBrace === -1) {
          throw new Error("Format JSON tidak ditemukan.");
        }

        return JSON.parse(text.substring(firstBrace, lastBrace + 1));

      } catch (error) {
        console.error("❌ GEMINI ERROR:", error);
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
    async chatWithFinancialBot(
      contextData: string,
      userQuestion: string,
      userOccupation: string,
      userRelationship: string,
      luneAwake: boolean = false
    ) {
      const prompt = luneAwake ? LUNE_CHAT_PROMPT(
        contextData,
        userQuestion,
        userOccupation,
        userRelationship,
      ) :
       DEFAULT_CHAT_PROMPT(
        contextData,
        userQuestion,
        userOccupation,
        userRelationship,
      );

      try {
        const result = await this.model.generateContent(prompt);
        return result.response.text();
      } catch (error) {
        console.error("Gemini Chat Error:", error);
        return "Mohon maaf, koneksi saya sedang tidak stabil. Boleh diulangi pertanyaannya?";
      }
    }

}