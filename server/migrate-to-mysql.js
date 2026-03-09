/**
 * CaltransBizConnect - SQLite → MySQL Data Export Script
 *
 * Run this script LOCALLY (where data.db lives) to generate a MySQL
 * import file containing all your existing data.
 *
 * Usage:
 *   node server/migrate-to-mysql.js
 *
 * Output:
 *   server/mysql-data-export.sql
 *
 * Then import that file into Hostinger via phpMyAdmin or MySQL CLI:
 *   mysql -u DB_USER -p DB_NAME < server/mysql-data-export.sql
 */

'use strict';

const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');

const DB_PATH  = path.resolve(__dirname, 'data.db');
const OUT_PATH = path.resolve(__dirname, 'mysql-data-export.sql');

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------

function escStr(val) {
    if (val === null || val === undefined) return 'NULL';
    // Escape backslashes, then single quotes, then wrap
    return "'" + String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r') + "'";
}

function escVal(val) {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number')           return String(val);
    return escStr(val);
}

function rowToInsert(table, row, columns) {
    const cols = columns.map(c => `\`${c}\``).join(', ');
    const vals = columns.map(c => escVal(row[c])).join(', ');
    return `INSERT INTO \`${table}\` (${cols}) VALUES (${vals});`;
}

// -------------------------------------------------------
// Main
// -------------------------------------------------------

console.log('CaltransBizConnect Migration: Opening SQLite database at', DB_PATH);
if (!fs.existsSync(DB_PATH)) {
    console.error('ERROR: data.db not found at', DB_PATH);
    process.exit(1);
}

const sqlite = new Database(DB_PATH, { readonly: true });

const lines = [];
lines.push('-- ============================================================');
lines.push('-- CaltransBizConnect MySQL Data Export');
lines.push('-- Generated: ' + new Date().toISOString());
lines.push('-- Import AFTER running mysql-schema.sql');
lines.push('-- ============================================================');
lines.push('');
lines.push('SET FOREIGN_KEY_CHECKS = 0;');
lines.push('SET NAMES utf8mb4;');
lines.push('');

// Export tables in dependency order (users first, then opportunities, then rest)
const TABLE_ORDER = ['users', 'opportunities', 'applications', 'saved_opportunities', 'messages'];

for (const table of TABLE_ORDER) {
    // Check table exists
    const tableExists = sqlite.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
    ).get(table);

    if (!tableExists) {
        lines.push(`-- Table '${table}' not found in SQLite, skipping.`);
        lines.push('');
        continue;
    }

    const rows = sqlite.prepare(`SELECT * FROM \`${table}\``).all();

    lines.push(`-- -------------------------------------------------------`);
    lines.push(`-- Table: ${table} (${rows.length} rows)`);
    lines.push(`-- -------------------------------------------------------`);

    if (rows.length === 0) {
        lines.push(`-- (no data)`);
        lines.push('');
        continue;
    }

    // Get column names from first row
    const columns = Object.keys(rows[0]);

    // Truncate existing data and reset auto-increment before re-inserting
    lines.push(`TRUNCATE TABLE \`${table}\`;`);
    lines.push('');

    for (const row of rows) {
        lines.push(rowToInsert(table, row, columns));
    }

    lines.push('');
}

lines.push('SET FOREIGN_KEY_CHECKS = 1;');
lines.push('');
lines.push('-- Export complete.');

const sql = lines.join('\n');
fs.writeFileSync(OUT_PATH, sql, 'utf8');

sqlite.close();

console.log('');
console.log('✓ Export complete!');
console.log('  Output file:', OUT_PATH);
console.log('');
console.log('NEXT STEPS:');
console.log('  1. In Hostinger phpMyAdmin, create a new MySQL database.');
console.log('  2. Import  server/mysql-schema.sql  first (creates tables).');
console.log('  3. Import  server/mysql-data-export.sql  second (loads data).');
console.log('  4. Update your .env file with the MySQL credentials.');
console.log('  5. Deploy the updated server code (npm install; npm start).');
console.log('');

// Summary
const tables = TABLE_ORDER.map(t => {
    try {
        const count = sqlite.prepare ? null : 0; // already closed
        return t;
    } catch { return t; }
});
console.log('Tables exported:', TABLE_ORDER.join(', '));
