const Message = require('../models/Message');
const User = require('../models/User');

// Send a message
const sendMessage = async (req, res) => {
  try {
    const { receiverId, content, messageType = 'text', fileUrl } = req.body;
    
    const message = new Message({
      sender: req.user._id,
      receiver: receiverId,
      content,
      messageType,
      fileUrl
    });

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username')
      .populate('receiver', 'username');

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get chat history
const getChatHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id }
      ]
    })
    .populate('sender', 'username')
    .populate('receiver', 'username')
    .sort({ createdAt: 1 })
    .limit(50);

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  sendMessage,
  getChatHistory
}; 