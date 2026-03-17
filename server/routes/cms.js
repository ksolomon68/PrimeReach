/**
 * CMS API Routes
 *
 * Endpoints:
 *   GET    /api/cms/global              — get global site settings
 *   PUT    /api/cms/global              — update global settings        [admin]
 *   GET    /api/cms/pages               — list all pages
 *   GET    /api/cms/pages/:slug         — get single page content
 *   PUT    /api/cms/pages/:slug         — update page content           [admin]
 *   POST   /api/cms/pages               — create new custom page        [admin]
 *   DELETE /api/cms/pages/:slug         — delete a custom page          [admin]
 *   GET    /api/cms/schema              — get component-type schemas
 *   GET    /api/cms/media               — list media library files      [admin]
 *   POST   /api/cms/media               — upload image to media library [admin]
 *   DELETE /api/cms/media/:filename     — delete a media file           [admin]
 *
 * @module routes/cms
 */

'use strict';

const express = require('express');
const path    = require('path');
const fs      = require('fs');
const multer  = require('multer');

const router = express.Router();

// ─── Directory paths ────────────────────────────────────────────────────────
const ROOT_DIR    = path.join(__dirname, '../../');
const CONTENT_DIR = path.join(ROOT_DIR, 'content');
const PAGES_DIR   = path.join(CONTENT_DIR, 'pages');
const SCHEMAS_DIR = path.join(CONTENT_DIR, 'schemas');
const GLOBAL_FILE = path.join(CONTENT_DIR, 'global.json');
const MEDIA_DIR   = path.join(ROOT_DIR, 'uploads/cms-media');

// Ensure required directories exist at startup
[CONTENT_DIR, PAGES_DIR, SCHEMAS_DIR, MEDIA_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ─── Multer — media uploads ──────────────────────────────────────────────────
const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'
]);

const mediaStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, MEDIA_DIR),
    filename:    (_req, file, cb) => {
        // Sanitise original filename and prefix with timestamp
        const safe   = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        const unique = `${Date.now()}-${safe}`;
        cb(null, unique);
    }
});

const upload = multer({
    storage: mediaStorage,
    limits:  { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files (JPEG, PNG, GIF, WebP, SVG) are allowed.'));
        }
    }
});

// ─── CMS Login (no MySQL required) ───────────────────────────────────────────
/**
 * POST /api/cms/login
 * Authenticates a CMS admin without hitting the database.
 * Checks:
 *   1. Email matches admin pattern (contains "admin" or is the known admin address)
 *   2. Password matches CMS_ADMIN_PASSWORD env var (if set), otherwise any password
 *      is accepted for local dev convenience.
 *
 * Body: { email: string, password: string }
 */
router.post('/login', (req, res) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const isAdminEmail = (
        email.toLowerCase().includes('admin') ||
        email === 'ks@evobrand.net'
    );

    if (!isAdminEmail) {
        return res.status(403).json({ error: 'This account does not have CMS admin access' });
    }

    const requiredPassword = process.env.CMS_ADMIN_PASSWORD;

    if (requiredPassword && password !== requiredPassword) {
        return res.status(401).json({ error: 'Invalid password' });
    }

    // No CMS_ADMIN_PASSWORD set → local dev mode, accept any password
    res.json({ success: true, email, message: 'CMS login successful' });
});

// ─── Admin auth middleware ────────────────────────────────────────────────────
/**
 * Reuses the same admin-email pattern as server/routes/admin.js
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function requireAdmin(req, res, next) {
    const email = req.headers['x-admin-email'];
    const isAdmin = email && (
        email.toLowerCase().includes('admin') ||
        email === 'ks@evobrand.net'
    );
    if (!isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

// ─── File helpers ─────────────────────────────────────────────────────────────
/**
 * Read a JSON file, returning null if it doesn't exist.
 * @param {string} filePath
 * @returns {object|null}
 */
function readJson(filePath) {
    if (!fs.existsSync(filePath)) return null;
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
        return null;
    }
}

/**
 * Write data to a JSON file atomically (write to .tmp then rename).
 * @param {string} filePath
 * @param {object} data
 */
function writeJson(filePath, data) {
    const tmp = filePath + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmp, filePath);
}

/**
 * Validate a page slug: lowercase letters, numbers, and hyphens only.
 * @param {string} slug
 * @returns {boolean}
 */
function isValidSlug(slug) {
    return /^[a-z0-9][a-z0-9-]{0,79}$/.test(slug);
}

// ─── GLOBAL SETTINGS ─────────────────────────────────────────────────────────

/** GET /api/cms/global — public, so renderers can fetch it */
router.get('/global', (req, res) => {
    const data = readJson(GLOBAL_FILE);
    if (!data) {
        return res.status(404).json({ error: 'global.json not found' });
    }
    res.json(data);
});

/** PUT /api/cms/global — merge top-level keys (admin only) */
router.put('/global', requireAdmin, (req, res) => {
    if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: 'JSON body required' });
    }
    const current = readJson(GLOBAL_FILE) || {};
    // Deep-merge one level: allow partial updates to sub-objects
    const updated = mergeDeep(current, req.body);
    updated.updatedAt = new Date().toISOString();
    writeJson(GLOBAL_FILE, updated);
    res.json({ success: true, data: updated });
});

// ─── PAGE CONTENT ─────────────────────────────────────────────────────────────

/** GET /api/cms/pages — list all pages (public) */
router.get('/pages', (_req, res) => {
    const files = fs.existsSync(PAGES_DIR)
        ? fs.readdirSync(PAGES_DIR).filter(f => f.endsWith('.json'))
        : [];

    const pages = files.map(f => {
        const slug = f.replace('.json', '');
        const data = readJson(path.join(PAGES_DIR, f));
        return {
            slug,
            title:     data?.meta?.title       || slug,
            updatedAt: data?.updatedAt          || null,
            isSystem:  data?.isSystem           || false
        };
    });

    res.json(pages);
});

/** GET /api/cms/pages/:slug — get a single page (public) */
router.get('/pages/:slug', (req, res) => {
    const { slug } = req.params;
    if (!isValidSlug(slug)) {
        return res.status(400).json({ error: 'Invalid page slug' });
    }
    const data = readJson(path.join(PAGES_DIR, `${slug}.json`));
    if (!data) {
        return res.status(404).json({ error: `Page "${slug}" not found` });
    }
    res.json(data);
});

/** PUT /api/cms/pages/:slug — update page content (admin only) */
router.put('/pages/:slug', requireAdmin, (req, res) => {
    const { slug } = req.params;
    if (!isValidSlug(slug)) {
        return res.status(400).json({ error: 'Invalid page slug' });
    }
    if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: 'JSON body required' });
    }

    const filePath = path.join(PAGES_DIR, `${slug}.json`);
    const current  = readJson(filePath) || {};
    const updated  = mergeDeep(current, req.body);
    updated.updatedAt = new Date().toISOString();
    writeJson(filePath, updated);
    res.json({ success: true, data: updated });
});

/** POST /api/cms/pages — create a new custom page (admin only) */
router.post('/pages', requireAdmin, (req, res) => {
    const { slug, meta, sections } = req.body || {};

    if (!slug || !isValidSlug(slug)) {
        return res.status(400).json({ error: 'A valid slug is required (lowercase letters, numbers, hyphens)' });
    }

    const filePath = path.join(PAGES_DIR, `${slug}.json`);
    if (fs.existsSync(filePath)) {
        return res.status(409).json({ error: `Page "${slug}" already exists` });
    }

    /** @type {PageContent} */
    const newPage = {
        slug,
        isSystem:  false,
        meta: {
            title:       meta?.title       || slug,
            description: meta?.description || ''
        },
        header: {
            backgroundImage: '',
            logoImage:       'images/caltrans-logo.png',
            logoAlt:         'Caltrans'
        },
        sections:  sections || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    writeJson(filePath, newPage);
    res.status(201).json({ success: true, data: newPage });
});

/** DELETE /api/cms/pages/:slug — delete a custom page (admin only, not system pages) */
router.delete('/pages/:slug', requireAdmin, (req, res) => {
    const { slug } = req.params;
    if (!isValidSlug(slug)) {
        return res.status(400).json({ error: 'Invalid page slug' });
    }

    const filePath = path.join(PAGES_DIR, `${slug}.json`);
    const data     = readJson(filePath);
    if (!data) {
        return res.status(404).json({ error: `Page "${slug}" not found` });
    }
    if (data.isSystem) {
        return res.status(403).json({ error: 'System pages cannot be deleted' });
    }

    fs.unlinkSync(filePath);
    res.json({ success: true, message: `Page "${slug}" deleted` });
});

// ─── SCHEMA ──────────────────────────────────────────────────────────────────

/** GET /api/cms/schema — return component-types schema (public) */
router.get('/schema', (_req, res) => {
    const data = readJson(path.join(SCHEMAS_DIR, 'component-types.json'));
    if (!data) {
        return res.status(404).json({ error: 'Schema file not found' });
    }
    res.json(data);
});

// ─── MEDIA LIBRARY ───────────────────────────────────────────────────────────

/** GET /api/cms/media — list uploaded media files (admin only) */
router.get('/media', requireAdmin, (_req, res) => {
    if (!fs.existsSync(MEDIA_DIR)) return res.json([]);

    const imageExt = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
    const files = fs.readdirSync(MEDIA_DIR)
        .filter(f => imageExt.test(f))
        .map(f => {
            const stat    = fs.statSync(path.join(MEDIA_DIR, f));
            const metaRaw = readJson(path.join(MEDIA_DIR, f + '.meta.json'));
            return {
                filename:   f,
                url:        `/uploads/cms-media/${f}`,
                size:       stat.size,
                altText:    metaRaw?.altText        || '',
                uploadedAt: metaRaw?.uploadedAt     || stat.birthtime.toISOString()
            };
        })
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    res.json(files);
});

/** POST /api/cms/media — upload an image (admin only, alt text required) */
router.post('/media', requireAdmin, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const altText = (req.body.altText || '').trim();
    if (!altText) {
        // Delete the uploaded file — alt text is mandatory per style guide
        fs.unlinkSync(path.join(MEDIA_DIR, req.file.filename));
        return res.status(400).json({
            error: 'Alt text is required for every uploaded image (Caltrans accessibility policy)'
        });
    }

    // Write sidecar metadata
    const meta = {
        altText,
        originalName: req.file.originalname,
        mimeType:     req.file.mimetype,
        size:         req.file.size,
        uploadedAt:   new Date().toISOString()
    };
    writeJson(path.join(MEDIA_DIR, req.file.filename + '.meta.json'), meta);

    res.status(201).json({
        success:  true,
        filename: req.file.filename,
        url:      `/uploads/cms-media/${req.file.filename}`,
        altText,
        size:     req.file.size
    });
});

/** DELETE /api/cms/media/:filename — delete a media file (admin only) */
router.delete('/media/:filename', requireAdmin, (req, res) => {
    const { filename } = req.params;

    // Prevent path traversal
    if (/[./\\]/.test(filename.replace(/[a-zA-Z0-9._-]/g, ''))) {
        return res.status(400).json({ error: 'Invalid filename' });
    }

    const filePath = path.join(MEDIA_DIR, filename);
    const metaPath = filePath + '.meta.json';

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }

    fs.unlinkSync(filePath);
    if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);

    res.json({ success: true, message: `"${filename}" deleted` });
});

// ─── Utility ──────────────────────────────────────────────────────────────────
/**
 * Deep-merge source into target (one level of object merging for sub-objects).
 * Arrays from source always replace target arrays (no concat).
 * @param {object} target
 * @param {object} source
 * @returns {object}
 */
function mergeDeep(target, source) {
    const result = Object.assign({}, target);
    for (const key of Object.keys(source)) {
        const sv = source[key];
        const tv = target[key];
        if (sv && typeof sv === 'object' && !Array.isArray(sv) &&
            tv && typeof tv === 'object' && !Array.isArray(tv)) {
            result[key] = mergeDeep(tv, sv);
        } else {
            result[key] = sv;
        }
    }
    return result;
}

// ─── Multer error handler ─────────────────────────────────────────────────────
router.use((err, _req, res, _next) => {
    if (err instanceof multer.MulterError || err.message) {
        return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Internal server error' });
});

module.exports = router;
