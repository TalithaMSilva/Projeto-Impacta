const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root', // Altere para o seu usuário do MySQL
    password: 'SQL1234#', // Altere para a sua senha do MySQL
    database: 'neoshop'
});

module.exports = pool;