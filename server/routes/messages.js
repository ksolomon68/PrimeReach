const express = require('express');
const { db } = require('../database');
const router = express.Router();

// Send a message (Contact Form)
router.post('/contact', async (req, res) => {
    const { name, email, subject, message, issueType, pageUrl } = req.body;

    // Log to console to simulate email delivery
    console.log('--- [EMAIL_TO: k.solomon@live.com] ---');
    console.log('From:', name, `<${email}>`);
    console.log('Subject:', subject || `Issue Report: ${issueType}`);
    if (pageUrl) console.log('Page URL:', pageUrl);
    console.log('Body:', message);
    console.log('----------------------------------------');

    res.json({ message: 'Contact form submitted successfully' });
});

module.exports = router;
