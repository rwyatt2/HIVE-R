/**
 * SQLite Backup Script for HIVE-R
 * 
 * Creates consistent backups using SQLite's backup API.
 * Run with: npm run backup
 */

import { execSync } from "child_process";
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from "fs";
import path from "path";

// ============================================================================
// CONFIGURATION
// ============================================================================

const DB_PATH = process.env.DATABASE_PATH || "./data/hive.db";
const BACKUP_DIR = process.env.BACKUP_DIR || "./data/backups";
const MAX_BACKUPS = parseInt(process.env.MAX_BACKUPS || "10", 10);

// ============================================================================
// BACKUP FUNCTIONS
// ============================================================================

/**
 * Create a backup of the SQLite database
 */
export async function createBackup(): Promise<string> {
    console.log("💾 Starting HIVE-R database backup...");
    console.log(`   Source: ${DB_PATH}`);

    // Check if source database exists
    if (!existsSync(DB_PATH)) {
        throw new Error(`Database not found: ${DB_PATH}`);
    }

    // Create backup directory if it doesn't exist
    if (!existsSync(BACKUP_DIR)) {
        mkdirSync(BACKUP_DIR, { recursive: true });
        console.log(`   Created backup directory: ${BACKUP_DIR}`);
    }

    // Generate backup filename with timestamp
    const timestamp = new Date().toISOString()
        .replace(/[:.]/g, '-')
        .replace('T', '_')
        .slice(0, 19);
    const backupFilename = `hive-${timestamp}.db`;
    const backupPath = path.join(BACKUP_DIR, backupFilename);

    try {
        // Use SQLite's backup command for consistent snapshot
        execSync(`sqlite3 "${DB_PATH}" ".backup '${backupPath}'"`, {
            stdio: 'inherit',
            timeout: 60000 // 1 minute timeout
        });

        // Verify backup was created
        if (!existsSync(backupPath)) {
            throw new Error("Backup file was not created");
        }

        const stats = statSync(backupPath);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

        console.log(`✅ Backup created: ${backupPath}`);
        console.log(`   Size: ${sizeMB} MB`);

        // Cleanup old backups
        await cleanupOldBackups();

        return backupPath;
    } catch (error) {
        console.error("❌ Backup failed:", error);
        throw error;
    }
}

/**
 * List all available backups
 */
export function listBackups(): Array<{ filename: string; path: string; size: number; date: Date }> {
    if (!existsSync(BACKUP_DIR)) {
        return [];
    }

    const files = readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith('hive-') && f.endsWith('.db'))
        .map(filename => {
            const fullPath = path.join(BACKUP_DIR, filename);
            const stats = statSync(fullPath);
            return {
                filename,
                path: fullPath,
                size: stats.size,
                date: stats.mtime,
            };
        })
        .sort((a, b) => b.date.getTime() - a.date.getTime());

    return files;
}

/**
 * Clean up old backups, keeping only the most recent MAX_BACKUPS
 */
async function cleanupOldBackups(): Promise<void> {
    const backups = listBackups();

    if (backups.length <= MAX_BACKUPS) {
        return;
    }

    const toDelete = backups.slice(MAX_BACKUPS);
    console.log(`🧹 Cleaning up ${toDelete.length} old backup(s)...`);

    for (const backup of toDelete) {
        try {
            unlinkSync(backup.path);
            console.log(`   Deleted: ${backup.filename}`);
        } catch (error) {
            console.error(`   Failed to delete ${backup.filename}:`, error);
        }
    }
}

/**
 * Get the most recent backup
 */
export function getLatestBackup(): { filename: string; path: string; size: number; date: Date } | null {
    const backups = listBackups();
    return backups.length > 0 ? backups[0] : null;
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    createBackup()
        .then((backupPath) => {
            console.log("\n✅ Backup completed successfully!");
            console.log(`   File: ${backupPath}`);

            // Show all backups
            const backups = listBackups();
            console.log(`\n📁 Available backups (${backups.length}):`);
            for (const backup of backups) {
                const sizeMB = (backup.size / 1024 / 1024).toFixed(2);
                console.log(`   ${backup.filename} (${sizeMB} MB)`);
            }
        })
        .catch((error) => {
            console.error("\n❌ Backup failed:", error.message);
            process.exit(1);
        });
}
