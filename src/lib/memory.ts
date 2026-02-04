import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";
import Database from "better-sqlite3";
import path from "path";

/**
 * ✅ A+ Persistence: SQLite-backed checkpointer
 * Data survives server restarts
 */

const DB_PATH = process.env.DATABASE_PATH || "./data/hive.db";

// Ensure data directory exists
import { mkdirSync } from "fs";
mkdirSync(path.dirname(DB_PATH), { recursive: true });

// Create SQLite database
const db = new Database(DB_PATH);

// Create the checkpointer
export const checkpointer = SqliteSaver.fromConnString(DB_PATH);

console.error(`💾 SQLite persistence enabled: ${DB_PATH}`);
