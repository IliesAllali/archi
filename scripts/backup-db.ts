/**
 * SQLite backup script — copies arbo.db to a timestamped file in data/backups/
 *
 * Usage:
 *   npx tsx scripts/backup-db.ts
 *
 * Run via cron on VPS:
 *   0 3 * * * cd /var/www/arbo && npx tsx scripts/backup-db.ts >> /var/log/arbo-backup.log 2>&1
 *
 * Keeps last 14 backups, deletes older ones.
 */

import path from "path";
import fs from "fs";
import Database from "better-sqlite3";

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "arbo.db");
const BACKUP_DIR = path.join(process.cwd(), "data", "backups");
const MAX_BACKUPS = 14;

function main() {
  // Ensure backup dir exists
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  // Check source exists
  if (!fs.existsSync(DB_PATH)) {
    console.error(`[backup] Source DB not found: ${DB_PATH}`);
    process.exit(1);
  }

  // Use SQLite's built-in backup API (safe, consistent snapshot)
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const backupPath = path.join(BACKUP_DIR, `arbo-${timestamp}.db`);

  const db = new Database(DB_PATH, { readonly: true });
  db.backup(backupPath)
    .then(() => {
      db.close();
      console.log(`[backup] OK — ${backupPath} (${formatSize(fs.statSync(backupPath).size)})`);

      // Cleanup old backups
      const files = fs
        .readdirSync(BACKUP_DIR)
        .filter((f) => f.startsWith("arbo-") && f.endsWith(".db"))
        .sort()
        .reverse();

      if (files.length > MAX_BACKUPS) {
        const toDelete = files.slice(MAX_BACKUPS);
        for (const f of toDelete) {
          fs.unlinkSync(path.join(BACKUP_DIR, f));
          console.log(`[backup] Deleted old backup: ${f}`);
        }
      }

      console.log(`[backup] ${files.length > MAX_BACKUPS ? MAX_BACKUPS : files.length} backups retained`);
    })
    .catch((err) => {
      db.close();
      console.error(`[backup] FAILED —`, err);
      process.exit(1);
    });
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

main();
