const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'neouser', // Altere para o seu usuário do MySQL
    password: 'neoshop1234', // Altere para a sua senha do MySQL
    database: 'neoshop'
});

module.exports = pool;