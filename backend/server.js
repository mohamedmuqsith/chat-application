const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Connect to MongoDB with improved settings
mongoose.connect('mongodb://localhost:27017/chatapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB', err));

// Message schema with additional fields
const messageSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  content: { type: String, required: true },
  room: { type: String, required: true },
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
  likes: { type: [String], default: [] },
  deleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null }
}, {
  timestamps: true
});

const Message = mongoose.model('Message', messageSchema);

// User schema with status tracking
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  room: String,
  socketId: String,
  online: { type: Boolean, default: true },
  lastActive: { type: Date, default: Date.now },
  status: { type: String, default: 'online', enum: ['online', 'away', 'busy', 'offline'] }
});

const User = mongoose.model('User', userSchema);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Join room handler
  socket.on('join_room', async (data) => {
    const { username, room } = data;
    socket.join(room);
    
    try {
      await User.findOneAndUpdate(
        { username },
        { 
          username, 
          room, 
          socketId: socket.id, 
          online: true, 
          lastActive: Date.now(),
          status: 'online'
        },
        { upsert: true, new: true }
      );
      
      const roomUsers = await User.find({ room });
      io.to(room).emit('user_status_update', {
        action: 'join',
        username,
        onlineUsers: roomUsers.filter(u => u.online).map(u => u.username),
        allUsers: roomUsers.map(u => ({
          username: u.username,
          online: u.online,
          status: u.status,
          lastActive: u.lastActive
        }))
      });
      
      await Message.updateMany(
        { room, delivered: false, sender: { $ne: username } },
        { $addToSet: { deliveredTo: username }, delivered: true }
      );
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  });
  
  // Send message handler
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
      const savedMessage = await newMessage.save();
      io.to(room).emit('receive_message', savedMessage);
      
      const onlineUsers = await User.find({ room, online: true });
      if (onlineUsers.length > 0) {
        await Message.updateOne(
          { _id: savedMessage._id },
          { 
            $addToSet: { deliveredTo: { $each: onlineUsers.map(u => u.username) } },
            delivered: true 
          }
        );
        
        io.to(room).emit('message_delivered', { 
          messageId: savedMessage._id,
          deliveredTo: onlineUsers.map(u => u.username)
        });
      }
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });
  
  // Message seen handler
  socket.on('message_seen', async (data) => {
    const { messageId, username, room } = data;
    
    try {
      const message = await Message.findById(messageId);
      if (message && !message.seenBy.includes(username)) {
        await Message.updateOne(
          { _id: messageId },
          { $addToSet: { seenBy: username } }
        );
        io.to(room).emit('update_message_status', {
          messageId,
          seenBy: [...message.seenBy, username]
        });
      }
    } catch (error) {
      console.error('Error updating message seen status:', error);
    }
  });
  
  // Typing indicator handler
  socket.on('user_typing', (data) => {
    const { username, room, isTyping } = data;
    socket.to(room).emit('user_typing_update', { username, isTyping });
  });
  
  // Delete message handler with time restriction (5 minutes)
  socket.on('delete_message', async (data) => {
    const { messageId, username, room } = data;
    try {
      const message = await Message.findById(messageId);
      if (!message) return;
      
      const timeDiff = (Date.now() - message.createdAt) / (1000 * 60); // minutes
      const canDelete = message.sender === username || username === 'admin';
      
      if (canDelete && timeDiff <= 5) { // 5 minutes limit
        await Message.deleteOne({ _id: messageId });
        io.to(room).emit('message_deleted', { messageId });
      } else if (canDelete) {
        // Soft delete for older messages
        await Message.updateOne(
          { _id: messageId },
          { deleted: true, deletedAt: Date.now(), content: "This message was deleted" }
        );
        io.to(room).emit('message_updated', {
          messageId,
          newContent: "This message was deleted",
          deleted: true
        });
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  });
  
  // Update message handler with time restriction (5 minutes)
  socket.on('update_message', async (data) => {
    const { messageId, username, newContent, room } = data;
    try {
      const message = await Message.findById(messageId);
      if (!message) return;
      
      const timeDiff = (Date.now() - message.createdAt) / (1000 * 60); // minutes
      const canEdit = message.sender === username && timeDiff <= 5; // 5 minutes limit
      
      if (canEdit) {
        await Message.updateOne(
          { _id: messageId },
          { 
            content: newContent,
            edited: true,
            editedAt: Date.now()
          }
        );
        io.to(room).emit('message_updated', {
          messageId,
          newContent,
          editedAt: Date.now()
        });
      }
    } catch (error) {
      console.error('Error updating message:', error);
    }
  });
  
  // Like message handler
  socket.on('like_message', async (data) => {
    const { messageId, username, room } = data;
    try {
      const message = await Message.findById(messageId);
      if (!message) return;
      
      const likeIndex = message.likes.indexOf(username);
      const updateOperation = likeIndex === -1 
        ? { $addToSet: { likes: username } }
        : { $pull: { likes: username } };
      
      await Message.updateOne({ _id: messageId }, updateOperation);
      const updatedMessage = await Message.findById(messageId);
      
      io.to(room).emit('message_liked', {
        messageId,
        likes: updatedMessage.likes
      });
    } catch (error) {
      console.error('Error liking message:', error);
    }
  });
  
  // User status update handler
  socket.on('update_status', async (data) => {
    const { username, status } = data;
    try {
      const user = await User.findOneAndUpdate(
        { username },
        { status, lastActive: Date.now() },
        { new: true }
      );
      
      if (user && user.room) {
        io.to(user.room).emit('user_status_updated', {
          username,
          status,
          lastActive: user.lastActive
        });
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  });
  
  // Disconnect handler
  socket.on('disconnect', async () => {
    try {
      const user = await User.findOneAndUpdate(
        { socketId: socket.id },
        { 
          online: false,
          status: 'offline',
          lastActive: Date.now()
        },
        { new: true }
      );
      
      if (user) {
        io.to(user.room).emit('user_status_update', {
          action: 'leave',
          username: user.username,
          lastActive: user.lastActive,
          status: 'offline'
        });
      }
    } catch (error) {
      console.error('Error updating disconnect status:', error);
    }
  });
});

// API routes
app.get('/api/messages/:room', async (req, res) => {
  try {
    const messages = await Message.find({ 
      room: req.params.room,
      deleted: false 
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/users/:room', async (req, res) => {
  try {
    const users = await User.find({ room: req.params.room });
    res.json(users.map(user => ({
      username: user.username,
      online: user.online,
      status: user.status,
      lastActive: user.lastActive
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));