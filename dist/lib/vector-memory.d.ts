import { OpenAIEmbeddings } from "@langchain/openai";
declare const embeddings: OpenAIEmbeddings<number[]>;
/**
 * Store a memory with its embedding
 */
export declare function storeMemory(content: string, agent: string, metadata?: Record<string, unknown>): Promise<string>;
/**
 * Retrieve similar memories
 */
export declare function retrieveMemories(query: string, options?: {
    agent?: string;
    limit?: number;
    minSimilarity?: number;
}): Promise<Array<{
    id: string;
    agent: string;
    content: string;
    similarity: number;
    metadata?: Record<string, unknown>;
}>>;
/**
 * Format memories for injection into agent prompt
 */
export declare function formatMemoriesForPrompt(memories: Array<{
    agent: string;
    content: string;
    similarity: number;
}>): string;
/**
 * Get memory stats
 */
export declare function getMemoryStats(): {
    totalMemories: number;
    byAgent: Record<string, number>;
};
/**
 * Clear all memories (for testing)
 */
export declare function clearMemories(): void;
export { embeddings };
//# sourceMappingURL=vector-memory.d.ts.map