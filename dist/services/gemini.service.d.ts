export declare class GeminiService {
    private model;
    constructor();
    analyzeFinancialHealth(data: {
        userName: string;
        userOccupation: string;
        userRelationship: string;
        totalIncome: number;
        totalExpense: number;
        budgetLimit: number;
        topCategories: string[];
    }, luneAwake?: boolean): Promise<any>;
    chatWithFinancialBot(contextData: string, userQuestion: string, userOccupation: string, userRelationship: string, luneAwake?: boolean): Promise<any>;
}
//# sourceMappingURL=gemini.service.d.ts.map