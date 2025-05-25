// DOM Elements
const authContainer = document.getElementById('auth-container');
const chatContainer = document.getElementById('chat-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const tabBtns = document.querySelectorAll('[data-tab]');

// Initialize forms
loginForm.style.display = 'block';
registerForm.style.display = 'none';

// Tab switching
tabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = btn.getAttribute('data-tab');
        
        // Remove active class from all tabs and add to clicked tab
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Show/hide appropriate form
        if (tab === 'login') {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
        } else {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
        }
    });
});

// Handle login
loginForm.addEventListener('submit', handleLogin);

// Handle registration
registerForm.addEventListener('submit', handleRegister);

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    // Find the active form
    const form = loginForm.style.display === 'none' ? registerForm : loginForm;
    
    // Remove any existing error messages
    const existingError = form.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Insert error at the top of the form
    form.insertBefore(errorDiv, form.firstChild);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

// Check if user is already logged in
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        showChat();
    } else {
        showAuth();
    }
}

// Show chat interface
function showChat() {
    authContainer.classList.add('hidden');
    chatContainer.classList.remove('hidden');
    
    // Initialize chat
    if (typeof initChat === 'function') {
        initChat();
    }
}

// Show auth interface
function showAuth() {
    authContainer.classList.remove('hidden');
    chatContainer.classList.add('hidden');
    
    // Clear forms
    loginForm.reset();
    registerForm.reset();
    
    // Clear any existing chat state
    if (window.socket) {
        window.socket.disconnect();
    }
}

// Handle logout
function handleLogout() {
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Disconnect socket
    if (window.socket) {
        window.socket.disconnect();
    }
    
    // Show auth interface
    showAuth();
}

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

// Export handleLogout for use in chat.js
window.handleLogout = handleLogout;

function showNotification(message, type = 'info') {
    // Remove any existing notifications first
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Create an icon based on the type
    const icon = document.createElement('span');
    icon.className = 'notification-icon';
    if (type === 'error') {
        icon.textContent = '❌ ';
    } else if (type === 'success') {
        icon.textContent = '✅ ';
    } else {
        icon.textContent = 'ℹ️ ';
    }
    
    // Create message element
    const messageElement = document.createElement('span');
    messageElement.textContent = message;
    
    // Add elements to notification
    notification.appendChild(icon);
    notification.appendChild(messageElement);
    
    // Add close button
    const closeButton = document.createElement('span');
    closeButton.className = 'notification-close';
    closeButton.textContent = '×';
    closeButton.onclick = () => notification.remove();
    notification.appendChild(closeButton);
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Add active class for animation
    setTimeout(() => notification.classList.add('active'), 10);
    
    // Auto remove after 5 seconds
    const timeout = setTimeout(() => {
        notification.classList.remove('active');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
    
    // Clear timeout if manually closed
    notification.addEventListener('click', () => {
        clearTimeout(timeout);
        notification.classList.remove('active');
        setTimeout(() => notification.remove(), 300);
    });
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    // Basic validation
    if (!email) {
        showError('Please enter your email');
        return;
    }
    if (!password) {
        showError('Please enter your password');
        return;
    }

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            showError(data.error || 'Login failed');
            return;
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        showChat();
        loginForm.reset();
    } catch (error) {
        showError('An error occurred. Please try again.');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    // Basic validation
    if (!username) {
        showError('Please enter a username');
        return;
    }
    if (!email) {
        showError('Please enter an email');
        return;
    }
    if (!password) {
        showError('Please enter a password');
        return;
    }

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            showError(data.error || 'Registration failed');
            return;
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        showChat();
        registerForm.reset();
    } catch (error) {
        showError('An error occurred. Please try again.');
    }
} 