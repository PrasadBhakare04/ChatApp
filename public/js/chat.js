// DOM Elements
const messagesContainer = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-btn');
const currentChatTitle = document.getElementById('current-chat');
const typingIndicator = document.getElementById('typing-indicator');
const onlineUsersList = document.getElementById('online-users-list');
const logoutBtn = document.getElementById('logout-btn');
const usernameDisplay = document.getElementById('username');
const sidebarToggle = document.getElementById('sidebar-toggle');
const chatSidebar = document.querySelector('.chat-sidebar');

// Global variables
let socket;
let currentChat = null;
let typingTimeout;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

// Initialize chat
function initChat() {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    
    if (!user || !token) {
        window.handleLogout();
        return;
    }
    
    usernameDisplay.textContent = user.username;
    
    socket = io({
        auth: { token },
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000
    });

    initSidebarToggle();
    window.socket = socket;

    socket.on('connect', () => {
        reconnectAttempts = 0;
        showNotification('Connected to server', 'info');
    });

    socket.on('connect_error', (error) => {
        reconnectAttempts++;
        
        if (error.message === 'Authentication error' || reconnectAttempts >= maxReconnectAttempts) {
            localStorage.removeItem('token');
            window.location.href = '/login.html';
        } else {
            showNotification('Connection error. Attempting to reconnect...', 'error');
        }
    });

    socket.on('disconnect', (reason) => {
        if (reason === 'io server disconnect') {
            socket.connect();
        }
        showNotification('Disconnected from server. Attempting to reconnect...', 'error');
    });

    socket.on('message', handleNewMessage);
    socket.on('userList', handleUserList);
    socket.on('userTyping', handleUserTyping);
    socket.on('chatHistory', handleChatHistory);

    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    let typingTimer;
    messageInput.addEventListener('input', () => {
        if (currentChat) {
            clearTimeout(typingTimer);
            socket.emit('typing', currentChat);
            typingTimer = setTimeout(() => {}, 1000);
        }
    });

    logoutBtn.addEventListener('click', () => {
        window.handleLogout();
    });
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    messagesContainer.appendChild(notification);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function handleNewMessage(message) {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    
    if (message.sender._id === currentChat || 
        (message.receiver._id === currentChat && message.sender._id === currentUser.id)) {
        const messageElement = createMessageElement(message);
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

function createMessageElement(message) {
    const user = JSON.parse(localStorage.getItem('user'));
    const isSent = message.sender._id === user.id;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
    
    const time = new Date(message.createdAt).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    messageDiv.innerHTML = `
        <div class="content">${message.content}</div>
        <div class="time">${time}</div>
    `;
    
    return messageDiv;
}

function sendMessage() {
    const text = messageInput.value.trim();
    if (!currentChat || !text) return;

    const message = {
        receiverId: currentChat,
        text: text,
        messageType: 'text'
    };

    socket.emit('sendMessage', message, (error) => {
        if (error) {
            showNotification('Failed to send message', 'error');
        }
    });

    messageInput.value = '';
}

function handleUserList(users) {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    onlineUsersList.innerHTML = '';
    
    users
        .filter(user => user._id !== currentUser.id)
        .forEach(user => {
            const userElement = document.createElement('div');
            userElement.className = `online-user ${user.isOnline ? 'online' : 'offline'}`;
            userElement.innerHTML = `
                <div class="online-status"></div>
                <span>${user.username}</span>
            `;
            userElement.addEventListener('click', () => {
                startChat(user._id, user.username);
                if (window.innerWidth <= 768) {
                    chatSidebar.classList.remove('active');
                    document.querySelector('.sidebar-overlay').classList.remove('active');
                }
            });
            
            if (currentChat === user._id) {
                userElement.classList.add('active');
            }
            
            onlineUsersList.appendChild(userElement);
        });
}

function handleUserTyping(data) {
    if (data.user === currentChat) {
        typingIndicator.textContent = `${data.user} is typing...`;
        typingIndicator.classList.remove('hidden');

        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            typingIndicator.classList.add('hidden');
        }, 3000);
    }
}

function handleChatHistory(messages) {
    messagesContainer.innerHTML = '';
    messages.forEach(message => {
        const messageElement = createMessageElement(message);
        messagesContainer.appendChild(messageElement);
    });
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function startChat(userId, username) {
    currentChat = userId;
    currentChatTitle.textContent = username;
    messagesContainer.innerHTML = '';
    messageInput.disabled = false;
    sendButton.disabled = false;
    
    document.querySelectorAll('.online-user').forEach(user => {
        user.classList.remove('active');
        if (user.querySelector('span').textContent === username) {
            user.classList.add('active');
        }
    });

    socket.emit('getChatHistory', userId);
}

function initSidebarToggle() {
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);

    sidebarToggle.addEventListener('click', () => {
        chatSidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', () => {
        chatSidebar.classList.remove('active');
        overlay.classList.remove('active');
    });

    const onlineUsers = document.querySelectorAll('.online-user');
    onlineUsers.forEach(user => {
        user.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                chatSidebar.classList.remove('active');
                overlay.classList.remove('active');
            }
        });
    });
} 