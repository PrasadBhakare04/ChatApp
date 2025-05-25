const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const User = require('./src/models/User');
const Message = require('./src/models/Message');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
});


const connectedUsers = new Map();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chat_app', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch(err => console.error('MongoDB connection error:', err));

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ error: 'User already exists' });
        }

        user = new User({ username, email, password });
        await user.save();

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your_jwt_secret_key_here',
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Email is not registered' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Incorrect password' });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your_jwt_secret_key_here',
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error. Please try again later.' });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Socket.IO middleware for authentication
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return next(new Error('User not found'));
        }

        socket.user = user;
        next();
    } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication error'));
    }
});

// Socket.IO connection handling
io.on('connection', async (socket) => {
    try {
        connectedUsers.set(socket.user._id.toString(), socket);

        await User.findByIdAndUpdate(socket.user._id, {
            isOnline: true,
            lastSeen: new Date()
        });

        const users = await User.find().select('-password');
        io.emit('userList', users);

        socket.on('sendMessage', async (messageData) => {
            try {
                const message = new Message({
                    sender: socket.user._id,
                    receiver: messageData.receiverId,
                    content: messageData.text,
                    messageType: messageData.messageType || 'text'
                });

                await message.save();

                const populatedMessage = await Message.findById(message._id)
                    .populate('sender', 'username')
                    .populate('receiver', 'username');

                socket.emit('message', populatedMessage);
                
                const receiverSocket = connectedUsers.get(messageData.receiverId);
                if (receiverSocket) {
                    receiverSocket.emit('message', populatedMessage);
                }
            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: 'Error sending message' });
            }
        });

        socket.on('typing', (receiverId) => {
            const receiverSocket = connectedUsers.get(receiverId);
            if (receiverSocket) {
                receiverSocket.emit('userTyping', {
                    user: socket.user.username
                });
            }
        });

        socket.on('getChatHistory', async (userId) => {
            try {
                const messages = await Message.find({
                    $or: [
                        { sender: socket.user._id, receiver: userId },
                        { sender: userId, receiver: socket.user._id }
                    ]
                })
                .populate('sender', 'username')
                .populate('receiver', 'username')
                .sort({ createdAt: 1 })
                .limit(50);
                
                socket.emit('chatHistory', messages);
            } catch (error) {
                console.error('Error loading chat history:', error);
                socket.emit('error', { message: 'Error loading chat history' });
            }
        });

        socket.on('disconnect', async () => {
            connectedUsers.delete(socket.user._id.toString());
            
            await User.findByIdAndUpdate(socket.user._id, {
                isOnline: false,
                lastSeen: new Date()
            });

            const users = await User.find().select('-password');
            io.emit('userList', users);
        });

    } catch (error) {
        console.error('Socket connection error:', error);
        socket.emit('error', { message: 'Connection error' });
        socket.disconnect();
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 