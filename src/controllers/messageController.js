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

// Update message status
exports.updateMessageStatus = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { status } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    message.status = status;
    await message.save();

    res.json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get unread messages count
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.user._id,
      status: { $ne: 'seen' }
    });

    res.json({ unreadCount: count });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  sendMessage,
  getChatHistory
}; 