document.addEventListener('DOMContentLoaded', () => {
    const registerTab = document.getElementById('register-tab');
    const loginTab = document.getElementById('login-tab');
    const registerFormDiv = document.getElementById('register-form');
    const loginFormDiv = document.getElementById('login-form');

    const registrationForm = document.getElementById('registrationForm');
    const loginForm = document.getElementById('loginForm');

    const registerMessage = document.getElementById('register-message');
    const loginMessage = document.getElementById('login-message');

    const cpfInput = document.getElementById('regCpf');
    const cpfError = document.getElementById('cpf-error');
    const phoneInput = document.getElementById('regPhoneNumber');
    const phoneError = document.getElementById('phone-error');

    // Funções para alternar entre as abas
    registerTab.addEventListener('click', () => {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerFormDiv.classList.add('active');
        loginFormDiv.classList.remove('active');
        registerMessage.textContent = '';
        loginMessage.textContent = '';
    });

    loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginFormDiv.classList.add('active');
        registerFormDiv.classList.remove('active');
        registerMessage.textContent = '';
        loginMessage.textContent = '';
    });

    // Validação de CPF em tempo real
    cpfInput.addEventListener('input', () => {
        let cpf = cpfInput.value.replace(/\D/g, '');
        cpfInput.value = cpf;

        if (cpf.length === 11) {
            cpfError.textContent = '';
        } else if (cpf.length > 0) {
            cpfError.textContent = 'CPF deve conter 11 dígitos.';
        } else {
            cpfError.textContent = '';
        }
    });

    // Validação de Telefone em tempo real
    phoneInput.addEventListener('input', () => {
        let phone = phoneInput.value.replace(/\D/g, '');
        phoneInput.value = phone;

        if (phone.length === 11) {
            phoneError.textContent = '';
        } else if (phone.length > 0) {
            phoneError.textContent = 'Telefone deve conter DDD + 9 dígitos.';
        } else {
            phoneError.textContent = '';
        }
    });

    // Submissão do formulário de Cadastro
    registrationForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fullName = document.getElementById('regFullName').value;
        const cpf = document.getElementById('regCpf').value;
        const birthDate = document.getElementById('regBirthDate').value;
        const phoneNumber = document.getElementById('regPhoneNumber').value;
        const email = document.getElementById('regEmail').value;
        const address = document.getElementById('regAddress').value;
        const password = document.getElementById('regPassword').value;

        if (cpf.length !== 11 || !/^\d+$/.test(cpf)) {
            cpfError.textContent = 'CPF inválido. Deve conter 11 dígitos numéricos.';
            return;
        }
        if (phoneNumber.length !== 11 || !/^\d{2}\d{9}$/.test(phoneNumber)) {
            phoneError.textContent = 'Telefone inválido. Deve conter DDD + 9 dígitos numéricos.';
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fullName, cpf, birthDate, phoneNumber, email, address, password })
            });

            const data = await response.json();

            if (response.ok) {
                registerMessage.className = 'message success';
                registerMessage.textContent = data.message;

                // Salva usuário no localStorage e redireciona para main.html
                const user = data.user;
                localStorage.setItem('user', JSON.stringify(user));

                setTimeout(() => {
                    window.location.href = 'main.html';
                }, 800);
            } else {
                registerMessage.className = 'message error';
                registerMessage.textContent = data.message || 'Erro ao cadastrar. Tente novamente.';
            }
        } catch (error) {
            console.error('Erro na requisição de cadastro:', error);
            registerMessage.className = 'message error';
            registerMessage.textContent = 'Erro de conexão com o servidor.';
        }
    });

    // Submissão do formulário de Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('logEmail').value;
        const password = document.getElementById('logPassword').value;

        try {
            const response = await fetch('http://localhost:3000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                loginMessage.className = 'message success';
                loginMessage.textContent = data.message;

                // Salva usuário completo no localStorage e redireciona para main.html
                localStorage.setItem('user', JSON.stringify(data.user));

                setTimeout(() => {
                    window.location.href = 'main.html';
                }, 800);
            } else {
                loginMessage.className = 'message error';
                loginMessage.textContent = data.message || 'Erro ao fazer login. Credenciais inválidas.';
            }
        } catch (error) {
            console.error('Erro na requisição de login:', error);
            loginMessage.className = 'message error';
            loginMessage.textContent = 'Erro de conexão com o servidor.';
        }
    });
});
