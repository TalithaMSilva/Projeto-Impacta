document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = 'http://localhost:3000';

    // Recupera usuário do localStorage
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
        // Se não tiver usuário, volta para login
        window.location.href = 'index.html';
        return;
    }
    const currentUser = JSON.parse(savedUser);

    // Elementos gerais
    const userNameDisplay = document.getElementById('userNameDisplay');
    const logoutButton = document.getElementById('logoutButton');

    // Tabs
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    // Elementos da aba Cadastro
    const userForm = document.getElementById('userForm');
    const userIdInput = document.getElementById('userId');
    const userFullNameInput = document.getElementById('userFullName');
    const userCpfInput = document.getElementById('userCpf');
    const userBirthDateInput = document.getElementById('userBirthDate');
    const userPhoneNumberInput = document.getElementById('userPhoneNumber');
    const userEmailInput = document.getElementById('userEmail');
    const userAddressInput = document.getElementById('userAddress');
    const userMessage = document.getElementById('userMessage');
    const deleteAccountButton = document.getElementById('deleteAccountButton');

    // Elementos da aba Produtos
    const toggleProductFormButton = document.getElementById('toggleProductFormButton');
    const productForm = document.getElementById('productForm');
    const productIdInput = document.getElementById('productId');
    const productNameInput = document.getElementById('productName');
    const productPriceInput = document.getElementById('productPrice');
    const productDescriptionInput = document.getElementById('productDescription');
    const productImageUrlInput = document.getElementById('productImageUrl');
    const cancelProductEditButton = document.getElementById('cancelProductEditButton');
    const productMessage = document.getElementById('productMessage');
    const productsList = document.getElementById('productsList');

    // Elementos da aba Carrinho
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const cartTotalSpan = document.getElementById('cartTotal');
    const clearCartButton = document.getElementById('clearCartButton');
    const cartMessage = document.getElementById('cartMessage');

    // ==========================
    // Inicialização
    // ==========================

    userNameDisplay.textContent = currentUser.fullName || currentUser.full_name || 'Usuário';

    // Carrega dados completos do usuário do backend (READ)
    async function loadUserData() {
        try {
            const response = await fetch(`${API_BASE}/users/${currentUser.id}`);
            if (!response.ok) {
                throw new Error('Erro ao carregar dados do usuário');
            }
            const user = await response.json();

            userIdInput.value = user.id;
            userFullNameInput.value = user.full_name;
            userCpfInput.value = user.cpf;
            userBirthDateInput.value = user.birth_date ? user.birth_date.split('T')[0] : '';
            userPhoneNumberInput.value = user.phone_number;
            userEmailInput.value = user.email;
            userAddressInput.value = user.address;
        } catch (error) {
            console.error(error);
            userMessage.className = 'message error';
            userMessage.textContent = 'Erro ao carregar dados do usuário.';
        }
    }

    // Carrega produtos
    async function loadProducts() {
        try {
            const response = await fetch(`${API_BASE}/products`);
            if (!response.ok) throw new Error('Erro ao listar produtos');

            const products = await response.json();
            renderProducts(products);
        } catch (error) {
            console.error(error);
            productMessage.className = 'message error';
            productMessage.textContent = 'Erro ao carregar produtos.';
        }
    }

    // Carrega carrinho
    async function loadCart() {
        try {
            const response = await fetch(`${API_BASE}/cart/${currentUser.id}`);
            if (!response.ok) throw new Error('Erro ao listar carrinho');

            const items = await response.json();
            renderCart(items);
        } catch (error) {
            console.error(error);
            cartMessage.className = 'message error';
            cartMessage.textContent = 'Erro ao carregar carrinho.';
        }
    }

    loadUserData();
    loadProducts();
    loadCart();

    // ==========================
    // Tabs
    // ==========================

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.remove('active'));

            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // ==========================
    // Logout
    // ==========================

    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    });

    // ==========================
    // CRUD Usuário
    // ==========================

    userPhoneNumberInput.addEventListener('input', () => {
        let phone = userPhoneNumberInput.value.replace(/\D/g, '');
        userPhoneNumberInput.value = phone;
    });

    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        userMessage.textContent = '';

        const id = userIdInput.value;
        const fullName = userFullNameInput.value;
        const birthDate = userBirthDateInput.value;
        const phoneNumber = userPhoneNumberInput.value;
        const email = userEmailInput.value;
        const address = userAddressInput.value;

        if (phoneNumber.length !== 11 || !/^\d{2}\d{9}$/.test(phoneNumber)) {
            userMessage.className = 'message error';
            userMessage.textContent = 'Telefone inválido. Deve conter DDD + 9 dígitos numéricos.';
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, birthDate, phoneNumber, email, address })
            });

            const data = await response.json();

            if (response.ok) {
                userMessage.className = 'message success';
                userMessage.textContent = data.message || 'Dados atualizados com sucesso.';

                // Atualiza também no localStorage
                currentUser.fullName = fullName;
                currentUser.email = email;
                localStorage.setItem('user', JSON.stringify(currentUser));
                userNameDisplay.textContent = fullName;
            } else {
                userMessage.className = 'message error';
                userMessage.textContent = data.message || 'Erro ao atualizar dados.';
            }
        } catch (error) {
            console.error(error);
            userMessage.className = 'message error';
            userMessage.textContent = 'Erro de conexão ao atualizar dados.';
        }
    });

    deleteAccountButton.addEventListener('click', async () => {
        const confirmDelete = confirm('Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.');
        if (!confirmDelete) return;

        try {
            const response = await fetch(`${API_BASE}/users/${currentUser.id}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message || 'Conta excluída com sucesso.');
                localStorage.removeItem('user');
                window.location.href = 'index.html';
            } else {
                userMessage.className = 'message error';
                userMessage.textContent = data.message || 'Erro ao excluir conta.';
            }
        } catch (error) {
            console.error(error);
            userMessage.className = 'message error';
            userMessage.textContent = 'Erro de conexão ao excluir conta.';
        }
    });

    // ==========================
    // CRUD Produtos
    // ==========================

    toggleProductFormButton.addEventListener('click', () => {
        productForm.classList.toggle('hidden');
        if (productForm.classList.contains('hidden')) {
            resetProductForm();
        }
    });

    cancelProductEditButton.addEventListener('click', () => {
        resetProductForm();
        productForm.classList.add('hidden');
    });

    function resetProductForm() {
        productIdInput.value = '';
        productNameInput.value = '';
        productPriceInput.value = '';
        productDescriptionInput.value = '';
        productImageUrlInput.value = '';
        productMessage.textContent = '';
    }

    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        productMessage.textContent = '';

        const id = productIdInput.value;
        const name = productNameInput.value;
        const price = parseFloat(productPriceInput.value);
        const description = productDescriptionInput.value;
        const imageUrl = productImageUrlInput.value;

        if (!name || !price || price <= 0) {
            productMessage.className = 'message error';
            productMessage.textContent = 'Nome e preço válidos são obrigatórios.';
            return;
        }

        const payload = { name, price, description, imageUrl };

        try {
            let response;
            if (id) {
                // Update
                response = await fetch(`${API_BASE}/products/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                // Create
                response = await fetch(`${API_BASE}/products`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            const data = await response.json();

            if (response.ok) {
                productMessage.className = 'message success';
                productMessage.textContent = data.message || 'Produto salvo com sucesso.';
                resetProductForm();
                productForm.classList.add('hidden');
                loadProducts();
            } else {
                productMessage.className = 'message error';
                productMessage.textContent = data.message || 'Erro ao salvar produto.';
            }
        } catch (error) {
            console.error(error);
            productMessage.className = 'message error';
            productMessage.textContent = 'Erro de conexão ao salvar produto.';
        }
    });

    function renderProducts(products) {
        productsList.innerHTML = '';

        if (!products || products.length === 0) {
            productsList.innerHTML = '<p>Nenhum produto cadastrado.</p>';
            return;
        }

        products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'card';

            if (product.image_url) {
                const img = document.createElement('img');
                img.src = product.image_url;
                img.alt = product.name;
                card.appendChild(img);
            }

            const title = document.createElement('div');
            title.className = 'card-title';
            title.textContent = product.name;
            card.appendChild(title);

            const price = document.createElement('div');
            price.className = 'card-price';
            price.textContent = `R$ ${Number(product.price).toFixed(2).replace('.', ',')}`;
            card.appendChild(price);

            if (product.description) {
                const desc = document.createElement('div');
                desc.className = 'card-description';
                desc.textContent = product.description;
                card.appendChild(desc);
            }

            const actions = document.createElement('div');
            actions.className = 'card-actions';

            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-outline';
            editBtn.textContent = 'Editar';
            editBtn.addEventListener('click', () => {
                productForm.classList.remove('hidden');
                productIdInput.value = product.id;
                productNameInput.value = product.name;
                productPriceInput.value = product.price;
                productDescriptionInput.value = product.description || '';
                productImageUrlInput.value = product.image_url || '';
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-danger';
            deleteBtn.textContent = 'Excluir';
            deleteBtn.addEventListener('click', () => deleteProduct(product.id));

            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);

            card.appendChild(actions);
            productsList.appendChild(card);
        });
    }

    async function deleteProduct(productId) {
        const confirmDelete = confirm('Deseja realmente excluir este produto?');
        if (!confirmDelete) return;

        try {
            const response = await fetch(`${API_BASE}/products/${productId}`, {
                method: 'DELETE'
            });
            const data = await response.json();

            if (response.ok) {
                productMessage.className = 'message success';
                productMessage.textContent = data.message || 'Produto excluído.';
                loadProducts();
            } else {
                productMessage.className = 'message error';
                productMessage.textContent = data.message || 'Erro ao excluir produto.';
            }
        } catch (error) {
            console.error(error);
            productMessage.className = 'message error';
            productMessage.textContent = 'Erro de conexão ao excluir produto.';
        }
    }

    // ==========================
    // CRUD Carrinho
    // ==========================

    async function addToCart(productId) {
        cartMessage.textContent = '';

        try {
            const response = await fetch(`${API_BASE}/cart`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.id, productId, quantity: 1 })
            });
            const data = await response.json();

            if (response.ok) {
                cartMessage.className = 'message success';
                cartMessage.textContent = data.message || 'Produto adicionado ao carrinho.';
                loadCart();
            } else {
                cartMessage.className = 'message error';
                cartMessage.textContent = data.message || 'Erro ao adicionar ao carrinho.';
            }
        } catch (error) {
            console.error(error);
            cartMessage.className = 'message error';
            cartMessage.textContent = 'Erro de conexão ao adicionar ao carrinho.';
        }
    }

    function renderCart(items) {
        cartItemsContainer.innerHTML = '';

        if (!items || items.length === 0) {
            cartItemsContainer.innerHTML = '<p>Seu carrinho está vazio.</p>';
            cartTotalSpan.textContent = '0,00';
            return;
        }

        let total = 0;

        items.forEach(item => {
            total += Number(item.total_item);

            const row = document.createElement('div');
            row.className = 'cart-item';

            const img = document.createElement('img');
            img.src = item.image_url || 'https://via.placeholder.com/80x80?text=Produto';
            img.alt = item.name;

            const details = document.createElement('div');
            details.className = 'cart-item-details';

            const title = document.createElement('div');
            title.textContent = item.name;

            const price = document.createElement('div');
            price.textContent = `Preço unit.: R$ ${Number(item.price).toFixed(2).replace('.', ',')}`;

            const qty = document.createElement('div');
            qty.textContent = `Qtd: ${item.quantity}`;

            details.appendChild(title);
            details.appendChild(price);
            details.appendChild(qty);

            const actions = document.createElement('div');
            actions.className = 'cart-item-actions';

            const quantityInput = document.createElement('input');
            quantityInput.type = 'number';
            quantityInput.min = '1';
            quantityInput.value = item.quantity;
            quantityInput.style.width = '60px';

            const updateBtn = document.createElement('button');
            updateBtn.className = 'btn btn-outline';
            updateBtn.textContent = 'Atualizar';
            updateBtn.addEventListener('click', () => {
                const newQty = parseInt(quantityInput.value, 10);
                if (newQty <= 0 || isNaN(newQty)) {
                    alert('Quantidade deve ser maior que zero.');
                    return;
                }
                updateCartItem(item.id, newQty);
            });

            const removeBtn = document.createElement('button');
            removeBtn.className = 'btn btn-danger';
            removeBtn.textContent = 'Remover';
            removeBtn.addEventListener('click', () => deleteCartItem(item.id));

            const lineTotal = document.createElement('div');
            lineTotal.textContent = `Total: R$ ${Number(item.total_item).toFixed(2).replace('.', ',')}`;

            actions.appendChild(quantityInput);
            actions.appendChild(updateBtn);
            actions.appendChild(removeBtn);
            actions.appendChild(lineTotal);

            row.appendChild(img);
            row.appendChild(details);
            row.appendChild(actions);

            cartItemsContainer.appendChild(row);
        });

        cartTotalSpan.textContent = total.toFixed(2).replace('.', ',');
    }

    async function updateCartItem(cartItemId, quantity) {
        try {
            const response = await fetch(`${API_BASE}/cart/${cartItemId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity })
            });
            const data = await response.json();

            if (response.ok) {
                cartMessage.className = 'message success';
                cartMessage.textContent = data.message || 'Item atualizado.';
                loadCart();
            } else {
                cartMessage.className = 'message error';
                cartMessage.textContent = data.message || 'Erro ao atualizar item.';
            }
        } catch (error) {
            console.error(error);
            cartMessage.className = 'message error';
            cartMessage.textContent = 'Erro de conexão ao atualizar item.';
        }
    }

    async function deleteCartItem(cartItemId) {
        const confirmDelete = confirm('Deseja remover este item do carrinho?');
        if (!confirmDelete) return;

        try {
            const response = await fetch(`${API_BASE}/cart/${cartItemId}`, {
                method: 'DELETE'
            });
            const data = await response.json();

            if (response.ok) {
                cartMessage.className = 'message success';
                cartMessage.textContent = data.message || 'Item removido.';
                loadCart();
            } else {
                cartMessage.className = 'message error';
                cartMessage.textContent = data.message || 'Erro ao remover item.';
            }
        } catch (error) {
            console.error(error);
            cartMessage.className = 'message error';
            cartMessage.textContent = 'Erro de conexão ao remover item.';
        }
    }

    clearCartButton.addEventListener('click', async () => {
        const confirmClear = confirm('Deseja esvaziar o carrinho?');
        if (!confirmClear) return;

        try {
            const response = await fetch(`${API_BASE}/cart/user/${currentUser.id}`, {
                method: 'DELETE'
            });
            const data = await response.json();

            if (response.ok) {
                cartMessage.className = 'message success';
                cartMessage.textContent = data.message || 'Carrinho esvaziado.';
                loadCart();
            } else {
                cartMessage.className = 'message error';
                cartMessage.textContent = data.message || 'Erro ao esvaziar carrinho.';
            }
        } catch (error) {
            console.error(error);
            cartMessage.className = 'message error';
            cartMessage.textContent = 'Erro de conexão ao esvaziar carrinho.';
        }
    });
});
