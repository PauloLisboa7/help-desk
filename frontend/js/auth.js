/* ============================================
   AUTENTICAÇÃO - LOGIN
   ============================================ */

class AuthManager {
    constructor() {
        this.tokenKey = 'helpdesk_token';
        this.userKey = 'helpdesk_user';
        this.apiBaseUrl = '/api';
    }

    // Fazer login
    async login(usuario, senha) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: usuario, senha })
            });

            const data = await response.json();
            const userData = data.usuario || data.user;

            if (response.ok && userData) {
                // Normalize profile property for compatibility with mock and real APIs
                if (userData.role && !userData.perfil) {
                    userData.perfil = userData.role;
                }

                localStorage.setItem(this.tokenKey, data.token);
                localStorage.setItem(this.userKey, JSON.stringify(userData));
                return { success: true, user: userData };
            } else {
                return { success: false, error: data.error || data.message || 'Erro ao fazer login' };
            }
        } catch (error) {
            console.error('Erro na requisição:', error);
            return { success: false, error: 'Erro de conexão com servidor' };
        }
    }

    // Fazer logout
    logout() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        window.location.href = '/';
    }

    // Obter token
    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    // Obter usuário logado
    getUser() {
        const user = localStorage.getItem(this.userKey);
        return user ? JSON.parse(user) : null;
    }

    // Verificar se está autenticado
    isAuthenticated() {
        return !!this.getToken();
    }

    // Fazer requisição autenticada
    async fetch(url, options = {}) {
        const token = this.getToken();

        const headers = {
            ...options.headers
        };

        if (!options.body || !(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${this.apiBaseUrl}${url}`, {
            ...options,
            headers
        });

        if (response.status === 401) {
            // Token expirado
            this.logout();
        }

        return response;
    }
}

// Instância global
const authManager = new AuthManager();

// ============================================
// FORMULÁRIO DE LOGIN
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.getElementById('togglePassword');
    const senhaInput = document.getElementById('senha');
    const forgotPasswordLink = document.getElementById('forgotPassword');

    if (loginForm) {
        // Toggle de visualização de senha
        if (togglePassword && senhaInput) {
            togglePassword.addEventListener('click', function() {
                const type = senhaInput.getAttribute('type') === 'password' ? 'text' : 'password';
                senhaInput.setAttribute('type', type);
                this.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
            });
        }

        // Submissão do formulário
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const usuario = document.getElementById('usuario').value.trim();
            const senha = document.getElementById('senha').value;
            const lembrar = document.getElementById('lembrar').checked;
            const alertArea = document.getElementById('alertArea');

            if (!usuario || !senha) {
                showAlert(alertArea, 'Por favor, preecha todos os campos', 'danger');
                return;
            }

            // Desabilitar botão
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Autenticando...';

            try {
                const result = await authManager.login(usuario, senha);

                if (result.success) {
                    showAlert(alertArea, 'Login realizado com sucesso!', 'success');
                    
                    // Redirecionar para dashboard
                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 1000);
                } else {
                    showAlert(alertArea, result.error, 'danger');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            } catch (error) {
                showAlert(alertArea, 'Erro ao processar login', 'danger');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });

        // Link "Esqueceu sua senha?"
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', function(e) {
                e.preventDefault();
                alert('Funcionalidade de recuperação de senha em desenvolvimento.\nEntre em contato com o administrador.');
            });
        }
    }

    // Logout
    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Tem certeza que deseja sair?')) {
                authManager.logout();
            }
        });
    }

    // Verificar se está na página de dashboard
    if (window.location.pathname.includes('dashboard')) {
        if (!authManager.isAuthenticated()) {
            window.location.href = '/';
        }

        // Mostrar nome do usuário
        const user = authManager.getUser();
        if (user) {
            const usuarioNome = document.getElementById('usuarioNome');
            if (usuarioNome) {
                const displayRole = user.perfil || user.role || 'Usuário';
                usuarioNome.textContent = `${user.nome} (${displayRole})`;
            }

            // Mostrar menu de admin se necessário
            if (user.perfil === 'administrador' || user.role === 'administrador') {
                const adminMenus = document.querySelectorAll('#adminMenu, #adminMenu2');
                adminMenus.forEach(menu => menu.style.display = 'block');
            }
        }
    }
});

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================

function showAlert(container, message, type) {
    const alertHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            <i class="fas fa-exclamation-circle"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    container.innerHTML = alertHTML;

    // Remover alerta automaticamente após 5 segundos
    setTimeout(() => {
        const alert = container.querySelector('.alert');
        if (alert) {
            alert.remove();
        }
    }, 5000);
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

function formatDateTime(date) {
    return new Date(date).toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}
