const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Rota de Cadastro de Usuário
app.post('/register', async (req, res) => {
    const { fullName, cpf, birthDate, phoneNumber, email, address, password } = req.body;

    // Validação de CPF (11 dígitos)
    if (!cpf || cpf.length !== 11 || !/^\d+$/.test(cpf)) {
        return res.status(400).json({ message: 'CPF inválido. Deve conter 11 dígitos numéricos.' });
    }

    // Validação de Telefone (DDD + 9 dígitos)
    if (!phoneNumber || phoneNumber.length !== 11 || !/^\d{2}\d{9}$/.test(phoneNumber)) {
        return res.status(400).json({ message: 'Telefone inválido. Deve conter DDD + 9 dígitos numéricos.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.execute(
            'INSERT INTO users (full_name, cpf, birth_date, phone_number, email, address, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [fullName, cpf, birthDate, phoneNumber, email, address, hashedPassword]
        );

        res.status(201).json({ message: 'Usuário cadastrado com sucesso!', userId: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            if (error.sqlMessage.includes('cpf')) {
                return res.status(409).json({ message: 'CPF já cadastrado.' });
            }
            if (error.sqlMessage.includes('email')) {
                return res.status(409).json({ message: 'E-mail já cadastrado.' });
            }
        }
        console.error('Erro ao cadastrar usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao cadastrar usuário.' });
    }
});

// Rota de Login de Usuário
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.status(400).json({ message: 'Credenciais inválidas.' });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciais inválidas.' });
        }

        res.status(200).json({ message: 'Login realizado com sucesso!', user: { id: user.id, fullName: user.full_name, email: user.email } });
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao fazer login.' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});