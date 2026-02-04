/**
 * SQLite Restore Script for HIVE-R
 * 
 * Restores database from a backup file.
 * Run with: npm run backup:restore -- --file=<backup-file>
 */

import { existsSync, copyFileSync, renameSync, unlinkSync } from "fs";
import path from "path";
import { listBackups, getLatestBackup } from "./backup.js";

// ============================================================================
// CONFIGURATION
// ============================================================================

const DB_PATH = process.env.DATABASE_PATH || "./data/hive.db";

// ============================================================================
// RESTORE FUNCTIONS
// ============================================================================

/**
 * Restore database from a backup file
 */
export async function restoreBackup(backupPath: string): Promise<void> {
    console.log("🔄 Starting HIVE-R database restore...");
    console.log(`   Source: ${backupPath}`);
    console.log(`   Target: ${DB_PATH}`);

    // Verify backup file exists
    if (!existsSync(backupPath)) {
        throw new Error(`Backup file not found: ${backupPath}`);
    }

    // Create a safety backup of current database if it exists
    const safetyBackupPath = `${DB_PATH}.pre-restore`;
    if (existsSync(DB_PATH)) {
        console.log(`   Creating safety backup: ${safetyBackupPath}`);
        copyFileSync(DB_PATH, safetyBackupPath);
    }

    try {
        // Copy backup to database location
        copyFileSync(backupPath, DB_PATH);

        console.log("✅ Database restored successfully!");

        // Clean up safety backup on success
        if (existsSync(safetyBackupPath)) {
            unlinkSync(safetyBackupPath);
        }
    } catch (error) {
        console.error("❌ Restore failed, attempting to recover...");

        // Try to restore from safety backup
        if (existsSync(safetyBackupPath)) {
            renameSync(safetyBackupPath, DB_PATH);
            console.log("   Recovered original database");
        }

        throw error;
    }
}

/**
 * Restore from the most recent backup
 */
export async function restoreLatest(): Promise<void> {
    const latest = getLatestBackup();

    if (!latest) {
        throw new Error("No backups found to restore");
    }

    console.log(`📦 Found latest backup: ${latest.filename}`);
    console.log(`   Date: ${latest.date.toISOString()}`);

    await restoreBackup(latest.path);
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

function printUsage(): void {
    console.log(`
HIVE-R Database Restore

Usage:
  npm run backup:restore -- --file=<backup-file>   Restore from specific backup
  npm run backup:restore -- --latest               Restore from most recent backup
  npm run backup:restore -- --list                 List available backups

Examples:
  npm run backup:restore -- --file=./data/backups/hive-2024-01-15_12-30-00.db
  npm run backup:restore -- --latest
    `);
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
}

if (args.includes('--list')) {
    const backups = listBackups();

    if (backups.length === 0) {
        console.log("No backups found.");
        process.exit(0);
    }

    console.log(`📁 Available backups (${backups.length}):\n`);
    for (const backup of backups) {
        const sizeMB = (backup.size / 1024 / 1024).toFixed(2);
        console.log(`  ${backup.filename}`);
        console.log(`    Size: ${sizeMB} MB`);
        console.log(`    Date: ${backup.date.toISOString()}\n`);
    }
    process.exit(0);
}

if (args.includes('--latest')) {
    restoreLatest()
        .then(() => {
            console.log("\n⚠️  Please restart the HIVE-R server to use the restored database.");
        })
        .catch((error) => {
            console.error("\n❌ Restore failed:", error.message);
            process.exit(1);
        });
} else {
    const fileArg = args.find(a => a.startsWith('--file='));

    if (!fileArg) {
        console.error("Error: Please specify --file=<path> or --latest");
        printUsage();
        process.exit(1);
    }

    const backupPath = fileArg.replace('--file=', '');

    restoreBackup(backupPath)
        .then(() => {
            console.log("\n⚠️  Please restart the HIVE-R server to use the restored database.");
        })
        .catch((error) => {
            console.error("\n❌ Restore failed:", error.message);
            process.exit(1);
        });
}
