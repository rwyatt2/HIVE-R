import { z } from "zod";
export declare const queryDatabase: import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    query: z.ZodString;
}, z.core.$strip>, {
    query: string;
}, {
    query: string;
}, string, "query_database">;
//# sourceMappingURL=database.d.ts.map