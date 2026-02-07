/**
 * Semantic Memory System
 * 
 * Long-term memory storage using ChromaDB for vector search
 * and OpenAI ada-002 embeddings for semantic similarity.
 */

import { ChromaClient, type Collection, type Where } from 'chromadb';
import OpenAI from 'openai';
import { randomUUID } from 'crypto';
import { getSecret } from './secrets.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CHROMA_HOST = process.env.CHROMA_HOST || 'localhost';
const CHROMA_PORT = parseInt(process.env.CHROMA_PORT || '8000');
const EMBEDDING_MODEL = 'text-embedding-ada-002';
const COLLECTION_NAME = 'hive_memories';

// ============================================================================
// TYPES
// ============================================================================

export interface SemanticMemory {
    id: string;
    agentName: string;
    threadId?: string | undefined;
    userId?: string | undefined;
    content: string;
    type: 'conversation' | 'decision' | 'artifact' | 'feedback';
    metadata: Record<string, unknown>;
    createdAt: string;
}

export interface MemorySearchResult {
    memory: SemanticMemory;
    score: number;
}

export interface SemanticMemoryStats {
    totalMemories: number;
    byAgent: Record<string, number>;
    byType: Record<string, number>;
    isEnabled: boolean;
    backend: 'chromadb' | 'in-memory' | 'disabled';
}

// ============================================================================
// CLIENTS
// ============================================================================

let chromaClient: ChromaClient | null = null;
let memoryCollection: Collection | null = null;
let openaiClient: OpenAI | null = null;

// In-memory fallback when ChromaDB is not available
const inMemoryStore: Map<string, { memory: SemanticMemory; embedding: number[] }> = new Map();
let useInMemoryFallback = false;
let isInitialized = false;

/**
 * Initialize the semantic memory system
 */
export async function initSemanticMemory(): Promise<void> {
    if (isInitialized) return;

    try {
        // Initialize OpenAI client
        const openaiKey = getSecret('OPENAI_API_KEY');
        if (!openaiKey) {
            console.warn('⚠️ OPENAI_API_KEY not set - semantic memory disabled');
            return;
        }

        openaiClient = new OpenAI({
            apiKey: openaiKey
        });

        // Try to initialize ChromaDB client
        try {
            chromaClient = new ChromaClient({
                path: `http://${CHROMA_HOST}:${CHROMA_PORT}`
            });

            // Get or create collection
            memoryCollection = await chromaClient.getOrCreateCollection({
                name: COLLECTION_NAME,
                metadata: { description: 'HIVE-R agent memories' }
            });

            console.log('✅ Semantic memory initialized with ChromaDB');
        } catch {
            console.warn('⚠️ ChromaDB not available, using in-memory fallback');
            useInMemoryFallback = true;
        }

        isInitialized = true;
    } catch (error) {
        console.error('❌ Failed to initialize semantic memory:', error);
    }
}

// ============================================================================
// EMBEDDING FUNCTIONS
// ============================================================================

/**
 * Generate embedding for text using OpenAI ada-002
 */
async function generateEmbedding(text: string): Promise<number[]> {
    if (!openaiClient) {
        throw new Error('OpenAI client not initialized');
    }

    const response = await openaiClient.embeddings.create({
        model: EMBEDDING_MODEL,
        input: text.substring(0, 8000) // Limit input length
    });

    return response.data[0]?.embedding || [];
}

// ============================================================================
// MEMORY OPERATIONS
// ============================================================================

/**
 * Store a new memory
 */
export async function storeMemory(
    content: string,
    agentName: string,
    options: {
        threadId?: string;
        userId?: string;
        type?: SemanticMemory['type'];
        metadata?: Record<string, unknown>;
    } = {}
): Promise<SemanticMemory> {
    if (!isInitialized) {
        await initSemanticMemory();
    }

    const memory: SemanticMemory = {
        id: randomUUID(),
        agentName,
        threadId: options.threadId,
        userId: options.userId,
        content,
        type: options.type || 'conversation',
        metadata: options.metadata || {},
        createdAt: new Date().toISOString()
    };

    try {
        const embedding = await generateEmbedding(content);

        if (useInMemoryFallback) {
            inMemoryStore.set(memory.id, { memory, embedding });
        } else if (memoryCollection) {
            await memoryCollection.add({
                ids: [memory.id],
                embeddings: [embedding],
                metadatas: [{
                    agentName: memory.agentName,
                    threadId: memory.threadId || '',
                    userId: memory.userId || '',
                    type: memory.type,
                    createdAt: memory.createdAt,
                    ...memory.metadata
                }],
                documents: [content]
            });
        }

        return memory;
    } catch (error) {
        console.error('Failed to store memory:', error);
        throw error;
    }
}

/**
 * Search memories semantically
 */
export async function searchMemories(
    query: string,
    options: {
        agentName?: string;
        threadId?: string;
        userId?: string;
        type?: SemanticMemory['type'];
        limit?: number;
    } = {}
): Promise<MemorySearchResult[]> {
    if (!isInitialized) {
        await initSemanticMemory();
    }

    const limit = options.limit || 5;

    try {
        const queryEmbedding = await generateEmbedding(query);

        if (useInMemoryFallback) {
            return searchInMemory(queryEmbedding, options, limit);
        }

        if (!memoryCollection) {
            return [];
        }

        // Build where clause for filtering
        const whereClause: Record<string, unknown> = {};
        if (options.agentName) whereClause['agentName'] = options.agentName;
        if (options.threadId) whereClause['threadId'] = options.threadId;
        if (options.userId) whereClause['userId'] = options.userId;
        if (options.type) whereClause['type'] = options.type;

        const hasWhere = Object.keys(whereClause).length > 0;
        const results = await memoryCollection.query({
            queryEmbeddings: [queryEmbedding],
            nResults: limit,
            ...(hasWhere && { where: whereClause as Where })
        });

        return (results.ids[0] || []).map((id, index) => ({
            memory: {
                id,
                agentName: String(results.metadatas?.[0]?.[index]?.['agentName'] || ''),
                threadId: results.metadatas?.[0]?.[index]?.['threadId'] as string | undefined,
                userId: results.metadatas?.[0]?.[index]?.['userId'] as string | undefined,
                content: results.documents?.[0]?.[index] || '',
                type: (results.metadatas?.[0]?.[index]?.['type'] || 'conversation') as SemanticMemory['type'],
                metadata: results.metadatas?.[0]?.[index] || {},
                createdAt: String(results.metadatas?.[0]?.[index]?.['createdAt'] || '')
            },
            score: 1 - (results.distances?.[0]?.[index] || 0)
        }));
    } catch (error) {
        console.error('Memory search failed:', error);
        return [];
    }
}

/**
 * In-memory search fallback using cosine similarity
 */
function searchInMemory(
    queryEmbedding: number[],
    options: {
        agentName?: string;
        threadId?: string;
        userId?: string;
        type?: SemanticMemory['type'];
    },
    limit: number
): MemorySearchResult[] {
    const results: MemorySearchResult[] = [];

    for (const { memory, embedding } of inMemoryStore.values()) {
        // Apply filters
        if (options.agentName && memory.agentName !== options.agentName) continue;
        if (options.threadId && memory.threadId !== options.threadId) continue;
        if (options.userId && memory.userId !== options.userId) continue;
        if (options.type && memory.type !== options.type) continue;

        // Calculate cosine similarity
        const score = cosineSimilarity(queryEmbedding, embedding);
        results.push({ memory, score });
    }

    // Sort by score and limit
    return results
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += (a[i] || 0) * (b[i] || 0);
        normA += (a[i] || 0) ** 2;
        normB += (b[i] || 0) ** 2;
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
}

/**
 * Get context for a thread by retrieving relevant memories
 */
export async function getThreadContext(
    threadId: string,
    query?: string,
    limit: number = 3
): Promise<string> {
    const memories = query
        ? await searchMemories(query, { threadId, limit })
        : await searchMemories('recent conversation context', { threadId, limit });

    if (memories.length === 0) {
        return '';
    }

    const contextParts = memories.map(({ memory, score }) =>
        `[${memory.agentName}] (relevance: ${(score * 100).toFixed(0)}%): ${memory.content}`
    );

    return `## Relevant Context from Memory\n\n${contextParts.join('\n\n')}`;
}

/**
 * Delete memories for a thread
 */
export async function deleteThreadMemories(threadId: string): Promise<number> {
    if (useInMemoryFallback) {
        let deleted = 0;
        for (const [id, { memory }] of inMemoryStore.entries()) {
            if (memory.threadId === threadId) {
                inMemoryStore.delete(id);
                deleted++;
            }
        }
        return deleted;
    }

    if (!memoryCollection) return 0;

    try {
        const results = await memoryCollection.get({
            where: { threadId }
        });

        if (results.ids.length > 0) {
            await memoryCollection.delete({
                ids: results.ids
            });
        }

        return results.ids.length;
    } catch (error) {
        console.error('Failed to delete thread memories:', error);
        return 0;
    }
}

/**
 * Get memory statistics
 */
export async function getSemanticMemoryStats(): Promise<SemanticMemoryStats> {
    const baseStats: SemanticMemoryStats = {
        totalMemories: 0,
        byAgent: {},
        byType: {},
        isEnabled: isInitialized && !!openaiClient,
        backend: !isInitialized ? 'disabled' : useInMemoryFallback ? 'in-memory' : 'chromadb'
    };

    if (useInMemoryFallback) {
        baseStats.totalMemories = inMemoryStore.size;
        for (const { memory } of inMemoryStore.values()) {
            baseStats.byAgent[memory.agentName] = (baseStats.byAgent[memory.agentName] || 0) + 1;
            baseStats.byType[memory.type] = (baseStats.byType[memory.type] || 0) + 1;
        }
        return baseStats;
    }

    if (!memoryCollection) {
        return baseStats;
    }

    try {
        baseStats.totalMemories = await memoryCollection.count();
        return baseStats;
    } catch (error) {
        console.error('Failed to get memory stats:', error);
        return baseStats;
    }
}

/**
 * Check if semantic memory is enabled
 */
export function isSemanticMemoryEnabled(): boolean {
    return isInitialized && !!openaiClient && (!!memoryCollection || useInMemoryFallback);
}
