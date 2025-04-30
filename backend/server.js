const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/chatapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB', err));

const messageSchema = new mongoose.Schema({
  sender: String,
  content: String,
  room: String,
  timestamp: { type: Date, default: Date.now },
  replyTo: {
    messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
    content: { type: String, default: null },
    sender: { type: String, default: null }
  },
  seenBy: [String],
  delivered: { type: Boolean, default: false },
  edited: { type: Boolean, default: false },
  editedAt: { type: Date, default: null },
  likes: { type: [String], default: [] }
});

const Message = mongoose.model('Message', messageSchema);

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  room: String,
  socketId: String,
  online: { type: Boolean, default: true },
  lastActive: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  socket.on('join_room', async (data) => {
    const { username, room } = data;
    socket.join(room);
    
    try {
      await User.findOneAndUpdate(
        { username },
        { username, room, socketId: socket.id, online: true, lastActive: Date.now() },
        { upsert: true, new: true }
      );
      
      const roomUsers = await User.find({ room, online: true });
      io.to(room).emit('user_status_update', {
        action: 'join',
        username,
        onlineUsers: roomUsers.map(user => user.username)
      });
      
      await Message.updateMany(
        { room, delivered: false },
        { delivered: true }
      );
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  });
  
  socket.on('send_message', async (messageData) => {
    const { sender, content, room, replyTo } = messageData;
    
    const newMessage = new Message({
      sender,
      content,
      room,
      replyTo: replyTo || null,
      seenBy: [sender],
      delivered: false
    });
    
    try {
      await newMessage.save();
      io.to(room).emit('receive_message', newMessage);
      
      const onlineUsers = await User.find({ room, online: true });
      if (onlineUsers.length > 0) {
        newMessage.delivered = true;
        await newMessage.save();
        io.to(room).emit('message_delivered', { 
          messageId: newMessage._id,
          deliveredTo: onlineUsers.map(user => user.username)
        });
      }
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });
  
  socket.on('message_seen', async (data) => {
    const { messageId, username, room } = data;
    
    try {
      const message = await Message.findById(messageId);
      if (message && !message.seenBy.includes(username)) {
        message.seenBy.push(username);
        await message.save();
        io.to(room).emit('update_message_status', {
          messageId,
          seenBy: message.seenBy
        });
      }
    } catch (error) {
      console.error('Error updating message seen status:', error);
    }
  });
  
  socket.on('user_typing', (data) => {
    const { username, room, isTyping } = data;
    socket.to(room).emit('user_typing_update', { username, isTyping });
  });
  
  socket.on('delete_message', async (data) => {
    const { messageId, username, room } = data;
    try {
      const message = await Message.findById(messageId);
      if (message && (message.sender === username || username === 'admin')) {
        await Message.deleteOne({ _id: messageId });
        io.to(room).emit('message_deleted', { messageId });
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  });
  
  socket.on('update_message', async (data) => {
    const { messageId, username, newContent, room } = data;
    try {
      const message = await Message.findById(messageId);
      if (message && message.sender === username) {
        message.content = newContent;
        message.edited = true;
        message.editedAt = Date.now();
        await message.save();
        io.to(room).emit('message_updated', {
          messageId,
          newContent,
          editedAt: message.editedAt
        });
      }
    } catch (error) {
      console.error('Error updating message:', error);
    }
  });
  
  socket.on('like_message', async (data) => {
    const { messageId, username, room } = data;
    try {
      const message = await Message.findById(messageId);
      if (message) {
        const likeIndex = message.likes.indexOf(username);
        if (likeIndex === -1) {
          message.likes.push(username);
        } else {
          message.likes.splice(likeIndex, 1);
        }
        await message.save();
        io.to(room).emit('message_liked', {
          messageId,
          likes: message.likes
        });
      }
    } catch (error) {
      console.error('Error liking message:', error);
    }
  });
  
  socket.on('disconnect', async () => {
    try {
      const user = await User.findOne({ socketId: socket.id });
      if (user) {
        user.online = false;
        user.lastActive = Date.now();
        await user.save();
        io.to(user.room).emit('user_status_update', {
          action: 'leave',
          username: user.username,
          lastActive: user.lastActive
        });
      }
    } catch (error) {
      console.error('Error updating disconnect status:', error);
    }
  });
});

app.get('/api/messages/:room', async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.room })
      .sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/users/:room', async (req, res) => {
  try {
    const users = await User.find({ room: req.params.room, online: true });
    res.json(users.map(user => ({
      username: user.username,
      lastActive: user.lastActive
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));