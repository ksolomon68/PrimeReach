const mysql = require('mysql2/promise');

async function testConnection() {
    try {
        const connection = await mysql.createConnection({
            host: '127.0.0.1',
            user: 'root',
            password: 'root_password_123!'
        });
        console.log('Successfully connected to local MySQL as root!');
        await connection.query('CREATE DATABASE IF NOT EXISTS u579331817_primereach');
        console.log('Database u579331817_primereach ensured to exist!');
        await connection.end();
    } catch (err) {
        console.error('Connection failed:', err.message);
    }
}

testConnection();
