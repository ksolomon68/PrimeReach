const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'data.db');

let db;

function getDbPath() {
    return dbPath;
}

function checkDbFile() {
    return fs.existsSync(dbPath);
}

function getDb() {
    if (!db) {
        try {
            db = new Database(dbPath);
            // Important for performance and safety
            db.pragma('journal_mode = WAL');
            db.pragma('foreign_keys = ON');
        } catch (err) {
            console.error('CaltransBizConnect: Failed to open database:', err.message);
            throw err;
        }
    }
    return db;
}

function initDatabase() {
    console.log('CaltransBizConnect DB: Initializing SQLite database...');
    const database = getDb();

    // Create tables if they don't exist
    database.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            type TEXT NOT NULL,
            business_name TEXT,
            contact_name TEXT,
            phone TEXT,
            ein TEXT,
            certification_number TEXT,
            business_description TEXT,
            organization_name TEXT,
            districts TEXT,
            categories TEXT,
            status TEXT NOT NULL DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            saved_opportunities TEXT,
            capability_statement TEXT,
            website TEXT,
            address TEXT,
            city TEXT,
            state TEXT,
            zip TEXT,
            years_in_business TEXT,
            certifications TEXT
        );

        CREATE TABLE IF NOT EXISTS opportunities (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            scope_summary TEXT NOT NULL,
            district TEXT NOT NULL,
            district_name TEXT NOT NULL,
            category TEXT NOT NULL,
            category_name TEXT NOT NULL,
            subcategory TEXT,
            estimated_value TEXT,
            due_date TEXT,
            due_time TEXT,
            submission_method TEXT,
            status TEXT NOT NULL DEFAULT 'published',
            posted_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            posted_by INTEGER,
            attachments TEXT,
            duration TEXT,
            requirements TEXT,
            certifications TEXT,
            experience TEXT,
            FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            opportunity_id TEXT NOT NULL,
            vendor_id INTEGER NOT NULL,
            agency_id INTEGER,
            status TEXT NOT NULL DEFAULT 'pending',
            applied_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            notes TEXT,
            FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE,
            FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS saved_opportunities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vendor_id INTEGER NOT NULL,
            opportunity_id TEXT NOT NULL,
            saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(vendor_id, opportunity_id),
            FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            opportunity_id TEXT,
            subject TEXT,
            body TEXT NOT NULL,
            is_read INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE SET NULL
        );
    `);
    console.log('CaltransBizConnect DB: SQLite database initialized.');
}

// Instantiate DB immediately for modules that use const { db } = require(...)
const databaseInstance = getDb();

module.exports = {
    db: databaseInstance,
    getDb,
    getDbPath,
    checkDbFile,
    initDatabase
};
