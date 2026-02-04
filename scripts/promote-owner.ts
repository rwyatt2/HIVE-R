
/**
 * Promote User to Owner
 * 
 * Manually promotes a user to 'system_owner' role.
 * Usage: npx tsx scripts/promote-owner.ts <email>
 */

import Database from "better-sqlite3";
import path from "path";

const DB_PATH = process.env.DATABASE_PATH || "./data/hive.db";

function promoteUser(email: string) {
    if (!email) {
        console.error("❌ Please provide an email address.");
        console.log("Usage: npx tsx scripts/promote-owner.ts <email>");
        process.exit(1);
    }

    console.log(`🔍 Looking for user: ${email}...`);

    const db = new Database(DB_PATH);

    try {
        const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as { id: string, role: string } | undefined;

        if (!user) {
            console.error(`❌ User not found: ${email}`);
            process.exit(1);
        }

        console.log(`👤 Found user (ID: ${user.id}, Current Role: ${user.role || 'user'})`);

        if (user.role === 'system_owner') {
            console.log("✅ User is already a system owner.");
            return;
        }

        console.log("👑 Promoting to System Owner...");
        db.prepare("UPDATE users SET role = 'system_owner' WHERE id = ?").run(user.id);

        console.log(`✅ Success! ${email} is now a System Owner.`);

    } catch (error) {
        console.error("❌ Promotion failed:", error);
        process.exit(1);
    } finally {
        db.close();
    }
}

// Get email from command line args
const email = process.argv[2];
promoteUser(email);
