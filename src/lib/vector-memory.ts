import { OpenAIEmbeddings } from "@langchain/openai";
import Database from "better-sqlite3";
import { randomUUID } from "crypto";
import { optimizeDatabase } from "./db-init.js";
import { logger } from "./logger.js";

/**
 * Simple SQLite-based Vector Memory Store
 * 
 * Stores embeddings of agent outputs for cross-session retrieval.
 * Uses OpenAI embeddings + SQLite for zero-config local operation.
 */

const DB_PATH = process.env.MEMORY_DB_PATH || "./data/memory.db";

// Initialize database
const db = new Database(DB_PATH);
optimizeDatabase(db);

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS memories (
    id TEXT PRIMARY KEY,
    agent TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding BLOB NOT NULL,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE INDEX IF NOT EXISTS idx_agent ON memories(agent);
  CREATE INDEX IF NOT EXISTS idx_created ON memories(created_at);
`);

logger.info({ dbPath: DB_PATH }, `Vector memory enabled: ${DB_PATH}`);

// Initialize embeddings model
const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-small",
    dimensions: 256, // Smaller for faster local storage
});

/**
 * Store a memory with its embedding
 */
export async function storeMemory(
    content: string,
    agent: string,
    metadata?: Record<string, unknown>
): Promise<string> {
    const id = randomUUID();

    // Generate embedding
    const vector = await embeddings.embedQuery(content);

    // Store in SQLite (blob for embedding)
    const stmt = db.prepare(`
        INSERT INTO memories (id, agent, content, embedding, metadata)
        VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
        id,
        agent,
        content,
        Buffer.from(new Float32Array(vector).buffer),
        metadata ? JSON.stringify(metadata) : null
    );

    return id;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += (a[i] ?? 0) * (b[i] ?? 0);
        normA += (a[i] ?? 0) ** 2;
        normB += (b[i] ?? 0) ** 2;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Retrieve similar memories
 */
export async function retrieveMemories(
    query: string,
    options: {
        agent?: string;
        limit?: number;
        minSimilarity?: number;
    } = {}
): Promise<Array<{
    id: string;
    agent: string;
    content: string;
    similarity: number;
    metadata?: Record<string, unknown>;
}>> {
    const { agent, limit = 5, minSimilarity = 0.7 } = options;

    // Generate query embedding
    const queryVector = await embeddings.embedQuery(query);

    // Fetch all memories (or filtered by agent)
    const whereClause = agent ? "WHERE agent = ?" : "";
    const params = agent ? [agent] : [];

    const stmt = db.prepare(`
        SELECT id, agent, content, embedding, metadata
        FROM memories
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT 100
    `);

    const rows = stmt.all(...params) as Array<{
        id: string;
        agent: string;
        content: string;
        embedding: Buffer;
        metadata: string | null;
    }>;

    // Calculate similarity and rank
    const results = rows.map(row => {
        const storedVector = Array.from(new Float32Array(row.embedding.buffer));
        const similarity = cosineSimilarity(queryVector, storedVector);

        return {
            id: row.id,
            agent: row.agent,
            content: row.content,
            similarity,
            metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
        };
    });

    // Filter by similarity and return top N
    return results
        .filter(r => r.similarity >= minSimilarity)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
}

/**
 * Format memories for injection into agent prompt
 */
export function formatMemoriesForPrompt(
    memories: Array<{ agent: string; content: string; similarity: number }>
): string {
    if (memories.length === 0) {
        return "";
    }

    const formatted = memories.map((m, i) =>
        `${i + 1}. [${m.agent}] (${(m.similarity * 100).toFixed(0)}% relevant):\n${m.content.substring(0, 300)}...`
    ).join("\n\n");

    return `
## 📚 Relevant Past Work

The following are excerpts from previous sessions that may be relevant:

${formatted}

Use this context to build on past work and maintain consistency.
`;
}

/**
 * Get memory stats
 */
export function getMemoryStats(): {
    totalMemories: number;
    byAgent: Record<string, number>;
} {
    const total = db.prepare("SELECT COUNT(*) as count FROM memories").get() as { count: number };
    const byAgentRows = db.prepare(`
        SELECT agent, COUNT(*) as count 
        FROM memories 
        GROUP BY agent
    `).all() as Array<{ agent: string; count: number }>;

    const byAgent: Record<string, number> = {};
    for (const row of byAgentRows) {
        byAgent[row.agent] = row.count;
    }

    return {
        totalMemories: total.count,
        byAgent,
    };
}

/**
 * Clear all memories (for testing)
 */
export function clearMemories(): void {
    db.exec("DELETE FROM memories");
}

export { embeddings };
