document.addEventListener('DOMContentLoaded', () => {
    const loginCard = document.getElementById('login-card');
    const registerCard = document.getElementById('register-card');
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // Toggle views
    if(showRegister) {
        showRegister.addEventListener('click', () => {
            loginCard.classList.add('hidden');
            registerCard.classList.remove('hidden');
        });
    }

    if(showLogin) {
        showLogin.addEventListener('click', () => {
            registerCard.classList.add('hidden');
            loginCard.classList.remove('hidden');
        });
    }

    // Login logic
    if(loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            try {
                const res = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.msg || 'Login failed');
                }

                setToken(data.token);
                setUser(data.user);
                window.location.href = 'index.html';
            } catch (err) {
                showAlert(err.message, 'error');
            }
        });
    }

    // Register logic
    if(registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('reg-username').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;

            try {
                const res = await fetch(`${API_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password })
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.msg || 'Registration failed');
                }

                setToken(data.token);
                setUser(data.user);
                window.location.href = 'index.html';
            } catch (err) {
                showAlert(err.message, 'error');
            }
        });
    }
});
