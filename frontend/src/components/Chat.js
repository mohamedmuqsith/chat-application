import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import Message from './Message';
import UsersList from './UsersList';
import { debounce } from 'lodash';
import { Send, X, Smile, Paperclip, ChevronDown } from 'lucide-react';

const socket = io('http://localhost:5000');

function Chat({ username, room }) {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isUsersListOpen, setIsUsersListOpen] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const debouncedTypingStatus = useRef(
    debounce((typing) => {
      socket.emit('user_typing', { username, room, isTyping: typing });
    }, 500)
  ).current;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const markMessageAsSeen = (messageId) => {
    socket.emit('message_seen', { messageId, username, room });
  };

  const handleReply = (message) => {
    setReplyTo({
      messageId: message._id,
      content: message.content,
      sender: message.sender
    });
  };

  const cancelReply = () => {
    setReplyTo(null);
  };

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    debouncedTypingStatus(e.target.value.length > 0);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const messageData = {
      sender: username,
      content: messageInput,
      room,
      replyTo: replyTo || null
    };

    socket.emit('send_message', messageData);
    setMessageInput('');
    setReplyTo(null);
    debouncedTypingStatus(false);
  };

  const handleDeleteMessage = (messageId) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      socket.emit('delete_message', { messageId, username, room });
    }
  };

  const handleStartEdit = (message) => {
    setEditingMessageId(message._id);
    setEditContent(message.content);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

  const handleUpdateMessage = (messageId) => {
    if (!editContent.trim()) {
      alert("Message cannot be empty");
      return;
    }
    
    socket.emit('update_message', {
      messageId,
      username,
      newContent: editContent,
      room
    });
    
    setEditingMessageId(null);
    setEditContent('');
  };

  const handleLikeMessage = (messageId) => {
    socket.emit('like_message', { messageId, username, room });
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/messages/${room}`);
        setMessages(response.data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    const fetchOnlineUsers = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/users/${room}`);
        setOnlineUsers(response.data);
      } catch (error) {
        console.error('Error fetching online users:', error);
      }
    };

    fetchMessages();
    fetchOnlineUsers();

    socket.emit('join_room', { username, room });

    socket.on('receive_message', (message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
      markMessageAsSeen(message._id);
    });

    socket.on('update_message_status', ({ messageId, seenBy }) => {
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, seenBy } : msg
      ));
    });

    socket.on('message_delivered', ({ messageId }) => {
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, delivered: true } : msg
      ));
    });

    socket.on('user_status_update', (data) => {
      if (data.action === 'join') {
        setOnlineUsers(prev => [...prev, { username: data.username }]);
      } else if (data.action === 'leave') {
        setOnlineUsers(prev => prev.filter(user => user.username !== data.username));
      }
    });

    socket.on('user_typing_update', ({ username: typingUser, isTyping }) => {
      setTypingUsers(prev => 
        isTyping 
          ? [...new Set([...prev, typingUser])]
          : prev.filter(user => user !== typingUser)
      );
    });

    socket.on('message_deleted', ({ messageId }) => {
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
      scrollToBottom();
    });

    socket.on('message_updated', ({ messageId, newContent, editedAt }) => {
      setMessages(prev => prev.map(msg => 
        msg._id === messageId 
          ? { ...msg, content: newContent, edited: true, editedAt } 
          : msg
      ));
      scrollToBottom();
    });

    socket.on('message_liked', ({ messageId, likes }) => {
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, likes } : msg
      ));
    });

    return () => {
      debouncedTypingStatus.cancel();
      socket.off('receive_message');
      socket.off('update_message_status');
      socket.off('message_delivered');
      socket.off('user_status_update');
      socket.off('user_typing_update');
      socket.off('message_deleted');
      socket.off('message_updated');
      socket.off('message_liked');
    };
  }, [room, username, debouncedTypingStatus]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-xl font-bold">{username.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">ChatSphere</h1>
              <div className="flex items-center text-sm">
                <span className="mr-2">{room}</span>
                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="ml-1 text-xs">{onlineUsers.length} online</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setIsUsersListOpen(!isUsersListOpen)}
            className="md:hidden flex items-center space-x-1 bg-white/20 px-3 py-1 rounded-full"
          >
            <span>Users</span>
            <ChevronDown size={16} className={`transition-transform ${isUsersListOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
      
      {isUsersListOpen && (
        <div className="md:hidden bg-white shadow-md">
          <UsersList users={onlineUsers} currentUser={username} />
        </div>
      )}
      
      <div className="flex flex-1 overflow-hidden">
        <div 
          ref={messagesContainerRef}
          className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
        >
          <div className="container mx-auto max-w-3xl space-y-4">
            {messages.length > 0 ? (
              messages.map((message) => (
                <div key={message._id}>
                  {editingMessageId === message._id ? (
                    <Message
                      message={message}
                      isEditing={true}
                      editContent={editContent}
                      onEditChange={setEditContent}
                      onSaveEdit={() => handleUpdateMessage(message._id)}
                      onCancelEdit={handleCancelEdit}
                    />
                  ) : (
                    <div 
                      onMouseEnter={() => {
                        if (!message.seenBy?.includes(username) && message.sender !== username) {
                          markMessageAsSeen(message._id);
                        }
                      }}
                      className="message-bubble"
                    >
                      <Message 
                        message={message}
                        time={formatTime(message.timestamp)}
                        isCurrentUser={message.sender === username}
                        onReply={handleReply}
                        onDelete={handleDeleteMessage}
                        onEdit={handleStartEdit}
                        onLike={handleLikeMessage}
                        seenBy={message.seenBy || []}
                        delivered={message.delivered}
                        allUsers={onlineUsers.map(user => user.username)}
                      />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="bg-gradient-to-r from-indigo-100 to-purple-100 p-6 rounded-full mb-4">
                  <svg className="w-12 h-12 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-700 mb-2">No messages yet</h3>
                <p className="text-gray-500 max-w-md">Start the conversation by sending your first message!</p>
              </div>
            )}
            
            {typingUsers.length > 0 && (
              <div className="flex items-center px-4 py-2 bg-white/50 backdrop-blur-sm rounded-full shadow-sm w-fit mx-auto">
                <div className="flex mr-2">
                  <div className="h-2 w-2 bg-indigo-400 rounded-full mr-1 animate-bounce"></div>
                  <div className="h-2 w-2 bg-indigo-400 rounded-full mr-1 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <span className="text-sm text-gray-600">
                  {typingUsers.length === 1 
                    ? `${typingUsers[0]} is typing...` 
                    : `${typingUsers.slice(0, 2).join(', ')} ${typingUsers.length > 2 ? `and ${typingUsers.length - 2} more` : ''} are typing...`}
                </span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        <div className="hidden md:block w-72 bg-white border-l border-gray-200 shadow-inner">
          <UsersList users={onlineUsers} currentUser={username} />
        </div>
      </div>
      
      <div className="bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="container mx-auto max-w-3xl">
          {replyTo && (
            <div className="flex items-center justify-between mb-2 p-3 bg-indigo-50 rounded-lg">
              <div className="flex-1">
                <div className="text-xs text-indigo-600 font-medium">Replying to {replyTo.sender}</div>
                <div className="text-sm text-gray-800 truncate">{replyTo.content}</div>
              </div>
              <button 
                onClick={cancelReply}
                className="ml-2 p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
              >
                <X size={16} />
              </button>
            </div>
          )}
          
          <form onSubmit={sendMessage} className="flex items-center bg-gray-50 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white">
            <button type="button" className="p-2 text-gray-500 hover:text-indigo-600 rounded-full">
              <Smile size={20} />
            </button>
            <button type="button" className="p-2 text-gray-500 hover:text-indigo-600 rounded-full">
              <Paperclip size={20} />
            </button>
            <input
              type="text"
              value={messageInput}
              onChange={handleInputChange}
              placeholder={replyTo ? "Type your reply..." : "Type a message..."}
              className="flex-1 px-3 py-2 bg-transparent border-none focus:outline-none focus:ring-0"
            />
            <button
              type="submit"
              disabled={!messageInput.trim()}
              className={`p-2 rounded-full ${messageInput.trim() ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'text-gray-400'}`}
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Chat;