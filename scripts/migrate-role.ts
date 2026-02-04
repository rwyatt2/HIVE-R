
/**
 * Run Database Migration
 * 
 * Adds 'role' column to users table if it doesn't exist.
 */

import Database from "better-sqlite3";
import path from "path";

const DB_PATH = process.env.DATABASE_PATH || "./data/hive.db";

function runMigration() {
    console.log("🔄 Starting migration: Add 'role' to users table...");

    const db = new Database(DB_PATH);

    try {
        // Check if column exists
        const tableInfo = db.prepare("PRAGMA table_info(users)").all() as any[];
        const hasRole = tableInfo.some(col => col.name === 'role');

        if (hasRole) {
            console.log("✅ Column 'role' already exists. Skipping.");
            return;
        }

        // Add column
        console.log("📝 Adding 'role' column...");
        db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");

        console.log("✅ Migration successful: Added 'role' column to users table.");

        // Update any existing users to have 'user' role (handled by DEFAULT but good to be explicit)
        const changes = db.prepare("UPDATE users SET role = 'user' WHERE role IS NULL").run();
        console.log(`ℹ️ Updated ${changes.changes} existing users to default role 'user'.`);

    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    } finally {
        db.close();
    }
}

runMigration();
