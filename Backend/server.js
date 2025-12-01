const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

/**
 * ============================
 * ROTAS DE USUÁRIO (AUTH + CRUD)
 * ============================
 */

// Rota de Cadastro de Usuário (CREATE)
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

        res.status(201).json({ 
            message: 'Usuário cadastrado com sucesso!', 
            user: {
                id: result.insertId,
                fullName,
                email
            }
        });
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

// Rota de Login de Usuário (READ + autenticação)
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

        res.status(200).json({ 
            message: 'Login realizado com sucesso!', 
            user: { 
                id: user.id, 
                fullName: user.full_name, 
                email: user.email,
                cpf: user.cpf,
                birthDate: user.birth_date,
                phoneNumber: user.phone_number,
                address: user.address
            } 
        });
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao fazer login.' });
    }
});

// GET /users/:id (READ - perfil do usuário)
app.get('/users/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        const [rows] = await db.execute(
            'SELECT id, full_name, cpf, birth_date, phone_number, email, address, created_at FROM users WHERE id = ?',
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar usuário.' });
    }
});

// PUT /users/:id (UPDATE - atualizar dados do usuário)
app.put('/users/:id', async (req, res) => {
    const userId = req.params.id;
    const { fullName, birthDate, phoneNumber, email, address } = req.body;

    // Aqui manteríamos CPF fixo se você quiser, então nem recebemos cpf
    if (!phoneNumber || phoneNumber.length !== 11 || !/^\d{2}\d{9}$/.test(phoneNumber)) {
        return res.status(400).json({ message: 'Telefone inválido. Deve conter DDD + 9 dígitos numéricos.' });
    }

    try {
        const [result] = await db.execute(
            `UPDATE users 
             SET full_name = ?, birth_date = ?, phone_number = ?, email = ?, address = ? 
             WHERE id = ?`,
            [fullName, birthDate, phoneNumber, email, address, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        res.status(200).json({ message: 'Dados do usuário atualizados com sucesso.' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            if (error.sqlMessage.includes('email')) {
                return res.status(409).json({ message: 'E-mail já cadastrado.' });
            }
        }
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar usuário.' });
    }
});

// DELETE /users/:id (DELETE - excluir conta do usuário)
app.delete('/users/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        const [result] = await db.execute('DELETE FROM users WHERE id = ?', [userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        res.status(200).json({ message: 'Conta de usuário excluída com sucesso.' });
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao excluir usuário.' });
    }
});

/**
 * ============================
 * ROTAS DE PRODUTOS (CRUD)
 * ============================
 */

// POST /products (CREATE)
app.post('/products', async (req, res) => {
    const { name, description, price, imageUrl } = req.body;

    if (!name || !price) {
        return res.status(400).json({ message: 'Nome e preço são obrigatórios.' });
    }

    try {
        const [result] = await db.execute(
            'INSERT INTO products (name, description, price, image_url) VALUES (?, ?, ?, ?)',
            [name, description || '', price, imageUrl || '']
        );

        res.status(201).json({ 
            message: 'Produto criado com sucesso.', 
            productId: result.insertId 
        });
    } catch (error) {
        console.error('Erro ao criar produto:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao criar produto.' });
    }
});

// GET /products (READ - listar todos)
app.get('/products', async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT id, name, description, price, image_url, created_at, updated_at FROM products'
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error('Erro ao listar produtos:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao listar produtos.' });
    }
});

// GET /products/:id (READ - produto específico)
app.get('/products/:id', async (req, res) => {
    const productId = req.params.id;

    try {
        const [rows] = await db.execute(
            'SELECT id, name, description, price, image_url, created_at, updated_at FROM products WHERE id = ?',
            [productId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar produto.' });
    }
});

// PUT /products/:id (UPDATE)
app.put('/products/:id', async (req, res) => {
    const productId = req.params.id;
    const { name, description, price, imageUrl } = req.body;

    if (!name || !price) {
        return res.status(400).json({ message: 'Nome e preço são obrigatórios.' });
    }

    try {
        const [result] = await db.execute(
            `UPDATE products 
             SET name = ?, description = ?, price = ?, image_url = ?, updated_at = NOW() 
             WHERE id = ?`,
            [name, description || '', price, imageUrl || '', productId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }

        res.status(200).json({ message: 'Produto atualizado com sucesso.' });
    } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar produto.' });
    }
});

// DELETE /products/:id (DELETE)
app.delete('/products/:id', async (req, res) => {
    const productId = req.params.id;

    try {
        const [result] = await db.execute('DELETE FROM products WHERE id = ?', [productId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }

        res.status(200).json({ message: 'Produto excluído com sucesso.' });
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao excluir produto.' });
    }
});

/**
 * ============================
 * ROTAS DE CARRINHO (CRUD)
 * ============================
 */

// POST /cart (CREATE - adicionar item ao carrinho)
app.post('/cart', async (req, res) => {
    const { userId, productId, quantity } = req.body;

    if (!userId || !productId) {
        return res.status(400).json({ message: 'Usuário e produto são obrigatórios.' });
    }

    const qty = quantity && quantity > 0 ? quantity : 1;

    try {
        // Verificar se já existe item desse produto para esse usuário
        const [rows] = await db.execute(
            'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?',
            [userId, productId]
        );

        if (rows.length > 0) {
            // Atualiza quantidade
            const existingItem = rows[0];
            const newQty = existingItem.quantity + qty;

            await db.execute(
                'UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE id = ?',
                [newQty, existingItem.id]
            );

            return res.status(200).json({ message: 'Quantidade do item atualizada no carrinho.' });
        } else {
            // Cria novo item
            await db.execute(
                'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
                [userId, productId, qty]
            );

            return res.status(201).json({ message: 'Produto adicionado ao carrinho.' });
        }
    } catch (error) {
        console.error('Erro ao adicionar item ao carrinho:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao adicionar item ao carrinho.' });
    }
});

// GET /cart/:userId (READ - itens do carrinho de um usuário)
app.get('/cart/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        const [rows] = await db.execute(
            `SELECT 
                c.id,
                c.product_id,
                p.name,
                p.description,
                p.price,
                p.image_url,
                c.quantity,
                (p.price * c.quantity) AS total_item
             FROM cart_items c
             JOIN products p ON c.product_id = p.id
             WHERE c.user_id = ?`,
            [userId]
        );

        res.status(200).json(rows);
    } catch (error) {
        console.error('Erro ao listar itens do carrinho:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao listar itens do carrinho.' });
    }
});

// PUT /cart/:id (UPDATE - alterar quantidade)
app.put('/cart/:id', async (req, res) => {
    const cartItemId = req.params.id;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
        return res.status(400).json({ message: 'Quantidade deve ser maior que zero.' });
    }

    try {
        const [result] = await db.execute(
            'UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE id = ?',
            [quantity, cartItemId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Item do carrinho não encontrado.' });
        }

        res.status(200).json({ message: 'Quantidade do item atualizada com sucesso.' });
    } catch (error) {
        console.error('Erro ao atualizar item do carrinho:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar item do carrinho.' });
    }
});

// DELETE /cart/:id (DELETE - remover item específico)
app.delete('/cart/:id', async (req, res) => {
    const cartItemId = req.params.id;

    try {
        const [result] = await db.execute('DELETE FROM cart_items WHERE id = ?', [cartItemId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Item do carrinho não encontrado.' });
        }

        res.status(200).json({ message: 'Item removido do carrinho com sucesso.' });
    } catch (error) {
        console.error('Erro ao remover item do carrinho:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao remover item do carrinho.' });
    }
});

// DELETE /cart/user/:userId (DELETE - esvaziar carrinho do usuário)
app.delete('/cart/user/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        await db.execute('DELETE FROM cart_items WHERE user_id = ?', [userId]);
        res.status(200).json({ message: 'Carrinho esvaziado com sucesso.' });
    } catch (error) {
        console.error('Erro ao esvaziar carrinho:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao esvaziar carrinho.' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
