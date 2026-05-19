const mysql  = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path   = require('path');

// First try to load the default .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

// If on a live server, conditionally load .env.production overrides (if it exists)
const isLive = !!(process.env.PHUSION_PASSENGER || process.env.PASSENGER_NODE_CONTROL_REPO || process.env.NODE_ENV === 'production');
if (isLive) {
    dotenv.config({ path: path.join(__dirname, '../.env.production'), override: true });
}

console.log('PrimeReach DB: Initializing MySQL Connection Pool...');

let pool;

function getDb() {
    if (!pool) {
        try {
            const dbHost = process.env.DB_HOST || 'localhost';
            pool = mysql.createPool({
                host: dbHost,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0,
                enableKeepAlive: true,
                keepAliveInitialDelay: 10000
            });
            console.log('PrimeReach DB: MySQL Pool Created.');
        } catch (err) {
            console.error('PrimeReach DB Error: Failed to create pool:', err.message);
            throw err;
        }
    }
    return pool;
}

async function initDatabase() {
    console.log('PrimeReach DB: Running initDatabase()...');
    const db = getDb();

    try {
        console.log('PrimeReach DB: Verifying connection...');
        await db.execute('SELECT 1');
        console.log('PrimeReach DB: Connection verified.');

        // 1. Users Table
        console.log('PrimeReach DB: Ensuring "users" table exists...');
        await db.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                type VARCHAR(50) NOT NULL,
                business_name VARCHAR(255),
                contact_name VARCHAR(255),
                phone VARCHAR(50),
                ein VARCHAR(50),
                certification_number VARCHAR(100),
                business_description TEXT,
                organization_name VARCHAR(255),
                districts TEXT,
                categories TEXT,
                status VARCHAR(50) NOT NULL DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                saved_opportunities TEXT,
                capability_statement TEXT,
                website VARCHAR(255),
                address VARCHAR(255),
                city VARCHAR(100),
                state VARCHAR(50),
                zip VARCHAR(20),
                years_in_business VARCHAR(50),
                certifications TEXT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 2. Opportunities Table
        console.log('PrimeReach DB: Ensuring "opportunities" table exists...');
        await db.execute(`
            CREATE TABLE IF NOT EXISTS opportunities (
                id VARCHAR(100) PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                scope_summary TEXT NOT NULL,
                district VARCHAR(50) NOT NULL,
                district_name VARCHAR(100) NOT NULL,
                category VARCHAR(100) NOT NULL,
                category_name VARCHAR(100) NOT NULL,
                subcategory VARCHAR(100),
                estimated_value VARCHAR(100),
                due_date VARCHAR(50),
                due_time VARCHAR(50),
                submission_method VARCHAR(255),
                status VARCHAR(50) NOT NULL DEFAULT 'published',
                posted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                posted_by INT,
                attachments TEXT,
                duration VARCHAR(100),
                requirements TEXT,
                certifications TEXT,
                experience TEXT,
                INDEX (posted_by),
                FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 3. Applications Table
        console.log('PrimeReach DB: Ensuring "applications" table exists...');
        await db.execute(`
            CREATE TABLE IF NOT EXISTS applications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                opportunity_id VARCHAR(100) NOT NULL,
                small_business_id INT NOT NULL,
                prime_contractor_id INT,
                status VARCHAR(50) NOT NULL DEFAULT 'pending',
                applied_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                notes TEXT,
                UNIQUE(opportunity_id, small_business_id),
                INDEX (opportunity_id),
                INDEX (small_business_id),
                FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE,
                FOREIGN KEY (small_business_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 4. Saved Opportunities Table
        console.log('PrimeReach DB: Ensuring "saved_opportunities" table exists...');
        await db.execute(`
            CREATE TABLE IF NOT EXISTS saved_opportunities (
                id INT AUTO_INCREMENT PRIMARY KEY,
                small_business_id INT NOT NULL,
                opportunity_id VARCHAR(100) NOT NULL,
                saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(small_business_id, opportunity_id),
                INDEX (opportunity_id),
                INDEX (small_business_id),
                FOREIGN KEY (small_business_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 5. Messages Table
        console.log('PrimeReach DB: Ensuring "messages" table exists...');
        await db.execute(`
            CREATE TABLE IF NOT EXISTS messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sender_id INT NOT NULL,
                receiver_id INT NOT NULL,
                sender_business_name VARCHAR(255),
                receiver_business_name VARCHAR(255),
                opportunity_id VARCHAR(100),
                message_type ENUM('invite', 'application', 'reply') DEFAULT 'reply',
                subject VARCHAR(255),
                body TEXT NOT NULL,
                is_read TINYINT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX (sender_id),
                INDEX (receiver_id),
                FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 6. Districts Table
        console.log('PrimeReach DB: Ensuring "districts" table exists...');
        await db.execute(`
            CREATE TABLE IF NOT EXISTS districts (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                region VARCHAR(100)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 7. Work Categories Table
        console.log('PrimeReach DB: Ensuring "work_categories" table exists...');
        await db.execute(`
            CREATE TABLE IF NOT EXISTS work_categories (
                id VARCHAR(100) PRIMARY KEY,
                name VARCHAR(100) NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 8. Notifications Table
        console.log('PrimeReach DB: Ensuring "notifications" table exists...');
        await db.execute(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                message_id INT,
                is_read TINYINT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX (user_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 9. CMS FAQs Table
        console.log('PrimeReach DB: Ensuring "cms_faqs" table exists...');
        await db.execute(`
            CREATE TABLE IF NOT EXISTS cms_faqs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                category VARCHAR(100) NOT NULL DEFAULT 'General',
                question TEXT NOT NULL,
                answer LONGTEXT NOT NULL,
                sort_order INT DEFAULT 0,
                status ENUM('active', 'inactive') DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_faq_category (category),
                INDEX idx_faq_status (status),
                INDEX idx_faq_sort (sort_order)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // Seed default FAQs if the table is empty
        const [[{ faqCount }]] = await db.execute('SELECT COUNT(*) AS faqCount FROM cms_faqs');
        if (faqCount === 0) {
            console.log('PrimeReach DB: Seeding default FAQs...');
            const defaultFaqs = [
                ['General Questions', 0, 'Do I need to be Small Business certified to use the platform?', '<p>No, you don\'t need Small Business certification to create an account and browse opportunities. However, some opportunities may require Small Business certification. Check the requirements for each opportunity listing.</p><p><strong>How do I get Small Business certified?</strong> Visit our <a href="eligibility.html">Eligibility page</a> to learn about the Small Business certification process, requirements, and how to apply.</p>'],
                ['General Questions', 1, 'What is a capability statement?', '<p>A capability statement is a one-page document that showcases your business qualifications, past performance, and capabilities. It\'s like a resume for your business.</p><p>You can download our template from the <a href="resources.html">Resources page</a>. Capability statements must be uploaded as PDF files with a maximum size of 10MB.</p>'],
                ['General Questions', 2, 'How do I apply for an opportunity?', '<p>Each opportunity listing includes contact information for the posting agency. You\'ll need to contact them directly using the information provided and follow their specific application process.</p>'],
                ['General Questions', 3, 'Can I select multiple work categories?', '<p>Yes, you can select all work categories that apply to your business capabilities. This helps agencies find you when searching for small businesses in those categories.</p>'],
                ['For Small Businesses', 0, 'How often are new opportunities posted?', '<p>Opportunities are posted regularly as agencies have new projects. We recommend checking the platform frequently or enabling email notifications for new opportunities in your selected categories.</p>'],
                ['For Small Businesses', 1, 'How long does it take for an opportunity to be posted?', '<p>Opportunities that meet our quality standards are typically posted within 1–2 business days after submission for review.</p>'],
                ['For Small Businesses', 2, 'Can I edit an opportunity after it\'s posted?', '<p>Yes, you can edit your posted opportunities through your prime contractor dashboard. Updates will be reflected immediately on the platform.</p>'],
                ['For Small Businesses', 3, 'How do I search for qualified small businesses?', '<p>Use the small business search feature in your dashboard to filter by work category, district, and certification status. You can review small business profiles and capability statements to find qualified partners.</p>'],
                ['For Prime Contractors', 0, 'Who can post opportunities?', '<p>Caltrans districts, other government agencies, and agencies working on Caltrans projects can post opportunities on the platform.</p>'],
                ['For Prime Contractors', 1, 'What information is required to post an opportunity?', '<p>You\'ll need to provide project title, description, location (district), work category, timeline, budget range, requirements, and contact information. All fields are required to ensure small businesses receive complete information.</p>'],
                ['For Prime Contractors', 2, 'How long does it take for an opportunity to be posted?', '<p>Opportunities that meet our quality standards are typically posted within 1–2 business days after submission for review.</p>'],
                ['For Prime Contractors', 3, 'Can I edit an opportunity after it\'s posted?', '<p>Yes, you can edit your posted opportunities through your prime contractor dashboard. Updates will be reflected immediately on the platform.</p>'],
                ['For Prime Contractors', 4, 'How do I search for qualified small businesses?', '<p>Use the small business search feature in your dashboard to filter by work category, district, and certification status. You can review small business profiles and capability statements to find qualified partners.</p>'],
                ['For Prime Contractors', 5, 'What are the quality standards for opportunity postings?', '<p>All postings must include complete project information, clear requirements, realistic timelines, and accurate contact details. This ensures small businesses can make informed decisions about applying.</p>'],
                ['Technical Questions', 0, 'What browsers are supported?', '<p>PrimeReach works best on the latest versions of Chrome, Firefox, Safari, and Edge. We recommend keeping your browser updated for the best experience.</p>'],
                ['Technical Questions', 1, 'Is the platform mobile-friendly?', '<p>Yes, PrimeReach is fully responsive and works on smartphones, tablets, and desktop computers.</p>'],
                ['Technical Questions', 2, 'Is my information secure?', '<p>Yes, we use industry-standard security measures to protect your data. Your personal information is never shared without your consent.</p>'],
                ['Technical Questions', 3, 'I forgot my password. How do I reset it?', '<p>Click the "Forgot Password" link on the login page and follow the instructions to reset your password via email.</p>'],
            ];
            for (const [category, sort_order, question, answer] of defaultFaqs) {
                await db.execute(
                    `INSERT INTO cms_faqs (category, sort_order, question, answer, status) VALUES (?, ?, ?, ?, 'active')`,
                    [category, sort_order, question, answer]
                );
            }
            console.log(`PrimeReach DB: Seeded ${defaultFaqs.length} default FAQs.`);
        }

        // Terminlogy Migrations for existing live databases
        console.log('PrimeReach DB: Running terminology data migrations...');
        try {
            // Update user types
            await db.execute("UPDATE users SET type = 'small_business' WHERE type = 'vendor' OR type = 'small business'");
            await db.execute("UPDATE users SET type = 'agency' WHERE type = 'prime_contractor' OR type = 'prime contractor'");
            
            // Rename legacy columns
            const [appCols] = await db.execute("SHOW COLUMNS FROM applications LIKE 'vendor_id'");
            if (appCols && appCols.length > 0) {
                await db.execute("ALTER TABLE applications CHANGE vendor_id small_business_id INT NOT NULL");
            }
            const [appColsAgency] = await db.execute("SHOW COLUMNS FROM applications LIKE 'agency_id'");
            if (appColsAgency && appColsAgency.length > 0) {
                await db.execute("ALTER TABLE applications CHANGE agency_id prime_contractor_id INT");
            }
            
            const [savedCols] = await db.execute("SHOW COLUMNS FROM saved_opportunities LIKE 'vendor_id'");
            if (savedCols && savedCols.length > 0) {
                await db.execute("ALTER TABLE saved_opportunities CHANGE vendor_id small_business_id INT NOT NULL");
            }
        } catch (migErr) {
            console.warn('PrimeReach DB: Terminology migration warning:', migErr.message);
        }

        // Safe migrations — add columns that may be missing from existing tables
        console.log('PrimeReach DB: Running safe column migrations...');
        const migrations = [
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS capability_statement TEXT`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS website VARCHAR(255)`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR(255)`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100)`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS state VARCHAR(50)`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS zip VARCHAR(20)`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS years_in_business VARCHAR(50)`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS certifications TEXT`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS saved_opportunities TEXT`,
            `ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_business_name VARCHAR(255)`,
            `ALTER TABLE messages ADD COLUMN IF NOT EXISTS receiver_business_name VARCHAR(255)`,
            `ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type ENUM('invite', 'application', 'reply') DEFAULT 'reply'`,
            `ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS description TEXT`,
            `ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS tags TEXT`,
            `ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS posted_by_name VARCHAR(255)`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS naics_codes TEXT`,
            `ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS naics_codes TEXT`
        ];
        for (const sql of migrations) {
            await db.execute(sql).catch(() => {}); // Ignore if column already exists
        }
        console.log('PrimeReach DB: Migrations complete.');

        // Password Reset Tokens Table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                token VARCHAR(255) NOT NULL UNIQUE,
                expires_at DATETIME NOT NULL,
                used BOOLEAN DEFAULT FALSE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_token (token),
                INDEX idx_user_id (user_id),
                INDEX idx_expires_at (expires_at),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Workers Table (Portal 2 — Labor)
        console.log('PrimeReach DB: Ensuring "workers" table exists...');
        await db.execute(`
            CREATE TABLE IF NOT EXISTS workers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                full_name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                phone VARCHAR(30),
                trade_category VARCHAR(50),
                skills JSON,
                certifications JSON,
                years_experience INT,
                sam_registered TINYINT(1) DEFAULT 0,
                business_entity VARCHAR(30),
                city VARCHAR(80),
                state VARCHAR(2),
                zip VARCHAR(10),
                travel_willingness ENUM('local','100mi','regional','national') DEFAULT 'local',
                resume_path VARCHAR(255),
                profile_complete TINYINT(1) DEFAULT 0,
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // NAICS Codes Table with seed data
        console.log('PrimeReach DB: Ensuring "naics_codes" table exists...');
        await db.execute(`
            CREATE TABLE IF NOT EXISTS naics_codes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                code VARCHAR(10) NOT NULL,
                description VARCHAR(255) NOT NULL,
                trade_category VARCHAR(50),
                portal ENUM('business','labor','both') DEFAULT 'labor',
                avg_contract_size VARCHAR(50),
                set_aside_eligible TINYINT(1) DEFAULT 1,
                INDEX idx_trade (trade_category),
                INDEX idx_code (code)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Seed NAICS codes if the table is empty
        const [[{ naicsCount }]] = await db.execute('SELECT COUNT(*) AS naicsCount FROM naics_codes');
        if (naicsCount === 0) {
            console.log('PrimeReach DB: Seeding NAICS codes...');
            const naicsSeed = [
                ['484110','General Freight Trucking, Local','cdl-trucking','labor','$50K–$500K',1],
                ['484121','General Freight Trucking, Long-Distance, TL','cdl-trucking','labor','$100K–$2M',1],
                ['484122','General Freight Trucking, Long-Distance, LTL','cdl-trucking','labor','$100K–$2M',1],
                ['488490','Other Support Activities for Road Transportation','cdl-trucking','labor','$25K–$250K',1],
                ['238110','Poured Concrete Foundation and Structure Contractors','concrete-cement','labor','$500K–$5M',1],
                ['238190','Other Foundation, Structure, and Building Exterior Contractors','concrete-cement','labor','$250K–$2M',1],
                ['237310','Highway, Street, and Bridge Construction','concrete-cement','labor','$1M–$50M',1],
                ['236220','Commercial and Institutional Building Construction','construction','labor','$1M–$100M',1],
                ['237110','Water and Sewer Line and Related Structures Construction','construction','labor','$500K–$20M',1],
                ['238900','Other Specialty Trade Contractors','construction','labor','$100K–$5M',1],
                ['237130','Power and Communication Line and Related Structures Construction','fiber-broadband','labor','$500K–$50M',1],
                ['517311','Wired Telecommunications Carriers','fiber-broadband','labor','$1M–$100M',1],
                ['238210','Electrical Contractors and Other Wiring Installation Contractors','cell-site-tech','labor','$250K–$10M',1],
                ['517410','Satellite Telecommunications','structured-cabling','labor','$500K–$20M',1],
                ['541512','Computer Systems Design Services','cloud-network-infra','labor','$500K–$50M',1],
                ['517210','Wireless Telecommunications Carriers','cloud-network-infra','labor','$1M–$100M',1],
                ['332312','Fabricated Structural Metal Manufacturing','welding-fabrication','labor','$250K–$5M',1],
                ['332313','Plate Work Manufacturing','welding-fabrication','labor','$100K–$2M',1],
                ['811310','Commercial and Industrial Machinery and Equipment Repair and Maintenance','welding-fabrication','labor','$50K–$1M',1],
                ['238220','Plumbing, Heating, and Air-Conditioning Contractors','plumbing-hvac','labor','$250K–$5M',1],
                ['561730','Landscaping Services','landscaping','labor','$25K–$500K',1],
                ['541511','Custom Computer Programming Services','it-support','labor','$100K–$5M',1],
                ['811212','Computer and Office Machine Repair and Maintenance','it-support','labor','$25K–$500K',1],
                ['561110','Office Administrative Services','admin-clerical','labor','$25K–$500K',1],
                ['561320','Temporary Help Services','admin-clerical','labor','$100K–$2M',1],
            ];
            for (const [code, description, trade_category, portal, avg_contract_size, set_aside_eligible] of naicsSeed) {
                await db.execute(
                    'INSERT INTO naics_codes (code, description, trade_category, portal, avg_contract_size, set_aside_eligible) VALUES (?,?,?,?,?,?)',
                    [code, description, trade_category, portal, avg_contract_size, set_aside_eligible]
                ).catch(() => {});
            }
            console.log(`PrimeReach DB: Seeded ${naicsSeed.length} NAICS codes.`);
        }

        // Checklist Progress Table
        console.log('PrimeReach DB: Ensuring "checklist_progress" table exists...');
        await db.execute(`
            CREATE TABLE IF NOT EXISTS checklist_progress (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_type ENUM('business','worker') NOT NULL,
                user_id INT NOT NULL,
                track VARCHAR(20) NOT NULL,
                item_key VARCHAR(80) NOT NULL,
                completed TINYINT(1) DEFAULT 0,
                completed_at TIMESTAMP NULL,
                UNIQUE KEY uq_progress (user_type, user_id, track, item_key),
                INDEX idx_user (user_type, user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Labor Connections Table
        console.log('PrimeReach DB: Ensuring "labor_connections" table exists...');
        await db.execute(`
            CREATE TABLE IF NOT EXISTS labor_connections (
                id INT AUTO_INCREMENT PRIMARY KEY,
                prime_id INT,
                worker_id INT NOT NULL,
                message TEXT,
                status ENUM('pending','accepted','declined') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_prime (prime_id),
                INDEX idx_worker (worker_id),
                FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // ── Demo Data Seeding ─────────────────────────────────────────────────
        // Runs only when the opportunities table is empty (fresh installs / new prod DBs).
        const [[{ oppCount }]] = await db.execute('SELECT COUNT(*) AS oppCount FROM opportunities');
        if (oppCount === 0) {
            console.log('PrimeReach DB: Empty opportunities table — seeding demo data...');
            const demoHash = await bcrypt.hash('DemoPass1!', 10);

            const demoUsers = [
                { email: 'demo-admin@primereachgov.com', type: 'admin',          org: 'PrimeReach Platform Admin',    contact: 'Alex Rivera',    phone: '916-555-0100' },
                { email: 'apex.builders@demo.com',       type: 'agency',         org: 'Apex Builders Group',          contact: 'Marcus Thompson', phone: '916-555-0201' },
                { email: 'summit.construction@demo.com', type: 'agency',         org: 'Summit Construction Partners', contact: 'Diane Park',      phone: '916-555-0202' },
                { email: 'greenpath.services@demo.com',  type: 'small_business', biz: 'GreenPath Environmental Services', contact: 'Tanya Williams', phone: '510-555-0301', certs: 'DBE,SBE' },
                { email: 'truenorth.electric@demo.com',  type: 'small_business', biz: 'TrueNorth Electrical Contractors', contact: 'James Okafor',   phone: '213-555-0302', certs: 'DBE,MBE' },
                { email: 'blueprint.consulting@demo.com',type: 'small_business', biz: 'Blueprint Engineering Consultants', contact: 'Sofia Ramirez', phone: '619-555-0303', certs: 'DBE,WBE' },
                { email: 'vanguard.landscape@demo.com',  type: 'small_business', biz: 'Vanguard Landscape & Erosion Control', contact: 'Carlos Mendez', phone: '559-555-0304', certs: 'SBE,DVB' },
            ];

            let primeId = null;
            for (const u of demoUsers) {
                try {
                    const [r] = await db.execute(
                        `INSERT IGNORE INTO users (email, password_hash, type, business_name, organization_name, contact_name, phone, certifications, status)
                         VALUES (?,?,?,?,?,?,?,?,'active')`,
                        [u.email, demoHash, u.type, u.biz || null, u.org || null, u.contact, u.phone, u.certs || null]
                    );
                    if (u.type === 'agency' && !primeId && r.insertId) primeId = r.insertId;
                } catch (e) { console.warn('PrimeReach DB: Demo user skip:', u.email, e.message); }
            }
            if (!primeId) {
                const [r] = await db.execute('SELECT id FROM users WHERE email = ?', ['apex.builders@demo.com']);
                if (r.length) primeId = r[0].id;
            }

            const demoOpps = [
                ['DEMO-OPP-001', 'Highway 101 Median Barrier Replacement — DBE Subcontract', 'Seeking a DBE-certified firm to supply and install concrete median barriers along a 4.2-mile segment of US-101.', '4', 'District 4', 'construction', 'Construction', '$380,000 – $450,000', '2026-08-15', 'published'],
                ['DEMO-OPP-002', 'Traffic Signal Upgrade — Electrical Subcontractor Needed', 'Prime contractor seeks a certified DBE or MBE electrical subcontractor for traffic signal upgrades at 14 intersections.', '7', 'District 7', 'electrical', 'Electrical', '$620,000 – $750,000', '2026-08-22', 'published'],
                ['DEMO-OPP-003', 'Slope Stabilization & Revegetation — SR-99 Corridor', 'Subcontracting opportunity for SBE or DVB-certified landscape and erosion control firm along a 6-mile stretch of SR-99.', '6', 'District 6', 'landscaping', 'Landscaping', '$195,000 – $240,000', '2026-08-30', 'published'],
                ['DEMO-OPP-004', 'Environmental Site Assessment — Bridge Rehabilitation Project', 'Prime contractor seeking a DBE environmental consulting firm for Phase I/II site assessments and NEPA documentation.', '3', 'District 3', 'environmental', 'Environmental', '$85,000 – $120,000', '2026-09-06', 'published'],
                ['DEMO-OPP-005', 'Structural Engineering Plan Review — District 11 Bridge Program', 'Seeking a WBE or DBE-certified structural engineering firm for independent plan review on six bridge replacement projects.', '11', 'District 11', 'engineering', 'Engineering', '$160,000 – $210,000', '2026-09-13', 'published'],
                ['DEMO-OPP-006', 'Concrete Flatwork & Curb Ramp Installation — ADA Transition Program', 'SBE or DBE concrete contractor to install ADA-compliant curb ramps and sidewalk panels at 40+ Bay Area locations.', '4', 'District 4', 'construction', 'Construction', '$220,000 – $270,000', '2026-09-30', 'published'],
                ['DEMO-OPP-007', 'Electrical & Lighting — I-5 HOV Lane Extension', 'DBE/MBE electrical subcontractor needed for roadway lighting and conduit installation on Interstate 5 HOV extension.', '12', 'District 12', 'electrical', 'Electrical', '$310,000 – $390,000', '2026-10-01', 'published'],
            ];

            for (const [id, title, scope, district, dname, cat, catName, value, due, status] of demoOpps) {
                await db.execute(
                    `INSERT IGNORE INTO opportunities (id, title, scope_summary, district, district_name, category, category_name, estimated_value, due_date, status, posted_by)
                     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
                    [id, title, scope, district, dname, cat, catName, value, due, status, primeId]
                ).catch(e => console.warn('PrimeReach DB: Demo opp skip:', id, e.message));
            }
            console.log(`PrimeReach DB: Demo data seeded (${demoOpps.length} opportunities).`);
        }

        console.log('PrimeReach DB: All MySQL tables initialized successfully.');

        // Cleanup expired tokens every hour
        setInterval(async () => {
            try {
                const db = getDb();
                const [result] = await db.execute(
                    'DELETE FROM password_reset_tokens WHERE expires_at < NOW() OR used = TRUE'
                );
                if (result.affectedRows > 0) {
                    console.log(`PrimeReach DB: Cleaned up ${result.affectedRows} expired/used reset tokens.`);
                }
            } catch (e) {
                console.error('PrimeReach DB: Token cleanup error:', e.message);
            }
        }, 60 * 60 * 1000);
    } catch (err) {
        console.error('PrimeReach DB CRITICAL ERROR: Database initialization failed.');
        console.error(err);
        // Do not rethrow here to prevent server crash during startup, 
        // but health check will reflect the error.
    }
}

module.exports = {
    db: getDb(),
    getDb,
    initDatabase
};
