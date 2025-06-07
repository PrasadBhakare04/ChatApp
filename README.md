# Real-Time Chat Application

- 🔐 User Authentication (Login/Register)
- 💬 Real-time messaging
- 🟢 Online/Offline status
- ✍️ Typing indicators
- 📱 Responsive design (Mobile-friendly)
- 📜 Message history
- 🍔 Mobile sidebar navigation

## Tech Stack

- **Frontend:**
  - HTML5/CSS3
  - JavaScript (ES6+)
  - Bootstrap 5.3.2
  - Socket.IO Client

- **Backend:**
  - Node.js
  - Express.js
  - Socket.IO
  - MongoDB
  - JWT Authentication

## Prerequisites

- Node.js
- MongoDB
- npm or yarn

## Quick Start Guide

1. **Install Dependencies**
```bash
npm install
```

2. **Start MongoDB**
```bash
# Start MongoDB service
sudo service mongodb start

# Check MongoDB status
sudo service mongodb status
```

3. **Set Environment Variables**
Create `.env` file in root:
```env
MONGODB_URI=mongodb://localhost:27017/chat_app
JWT_SECRET=your_secret_key
PORT=3000
```

4. **Run the Application**
```bash
# Development mode with auto-reload
npm run dev

# OR Production mode
npm start
```

Visit `http://localhost:3000` in your browser.

## Testing APIs with Postman

### Import Postman Collection
1. Open Postman
2. Click "Import" button
3. Copy and paste this collection:
   and add this file - chatappCollection.json

### Test API Endpoints

1. **Register New User**
   - Use the "Register" request
   - Response will include JWT token and user info

2. **Login User**
   - Use the "Login" request
   - Save the JWT token for chat authentication

## Screenshot
![image alt](https://github.com/PrasadBhakare04/ChatApp/blob/a9bc998d21dc8867112a367db201337721accb98/Screenshot.png)


## License

This project is licensed under the MIT License. 
