import React, { useState, useEffect } from 'react';
import { Tooltip } from 'react-tooltip';
import { 
  Check, 
  CheckCircle, 
  Heart, 
  Trash2, 
  Edit, 
  CornerUpLeft, 
  Clock,
  Image as ImageIcon,
  File,
  Download,
  X
} from 'lucide-react';

function Message({ 
  message, 
  time, 
  isCurrentUser, 
  onReply, 
  onDelete, 
  onEdit,
  onLike,
  seenBy = [], 
  delivered = false, 
  allUsers = [],
  isEditing = false,
  editContent = '',
  onEditChange,
  onSaveEdit,
  onCancelEdit,
  deleted = false
}) {
  // State for context menu
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

  // Calculate message status
  const isReadByAll = allUsers.length > 0 && 
    allUsers.every(user => seenBy.includes(user) || user === message.sender);
  
  const isReadBySome = seenBy.length > 1 && !isReadByAll;

  // Format seen information for tooltip
  const formatSeenInfo = () => {
    if (seenBy.length === 0) return 'Not seen yet';
    const otherUsers = seenBy.filter(user => user !== message.sender);
    if (otherUsers.length === 0) return 'Not seen yet';
    return `Seen by ${otherUsers.join(', ')}`;
  };

  // Check if current user liked the message
  const isLiked = message.likes && message.likes.includes(isCurrentUser ? 'You' : message.sender);

  // Get message status text
  const getMessageStatus = () => {
    if (isReadByAll) return 'Read by all';
    if (isReadBySome) return 'Read by some';
    if (delivered) return 'Delivered';
    return 'Sent';
  };

  // Handle file download
  const handleDownload = (file) => {
    if (file.url) {
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Context menu handler
  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowContextMenu(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Message status component
  const MessageStatus = () => (
    <div className="flex items-center ml-1">
      <div 
        data-tooltip-id="status-tooltip" 
        data-tooltip-content={formatSeenInfo()}
      >
        {isReadByAll ? (
          <CheckCircle size={12} className="text-green-300" />
        ) : isReadBySome ? (
          <CheckCircle size={12} className="text-indigo-300" />
        ) : delivered ? (
          <Check size={12} className="text-indigo-300" />
        ) : (
          <Clock size={12} className="text-gray-300" />
        )}
      </div>
      <Tooltip id="status-tooltip" />
    </div>
  );

  // Like button component
  const LikeButton = () => (
    <button 
      onClick={(e) => {
        e.stopPropagation();
        onLike(message._id);
      }}
      data-tooltip-id="like-tooltip"
      data-tooltip-content={isLiked ? 'Remove like' : 'Like'}
      className={`flex items-center text-xs ${
        isCurrentUser 
          ? isLiked ? 'text-red-300' : 'text-indigo-200' 
          : isLiked ? 'text-red-500' : 'text-gray-500'
      } hover:scale-105 transition-transform`}
    >
      <Heart 
        size={14} 
        className="mr-1" 
        fill={isLiked ? 'currentColor' : 'none'} 
      />
      {message.likes?.length || 0}
      <Tooltip id="like-tooltip" />
    </button>
  );

  // Read receipts component
  const ReadReceipts = () => {
    if (!isCurrentUser || seenBy.length <= 1) return null;
    
    return (
      <div className="flex justify-end mt-1">
        <div className="flex -space-x-2">
          {seenBy
            .filter(username => username !== message.sender)
            .slice(0, 3)
            .map((username) => (
              <div 
                key={username}
                className="flex items-center justify-center w-5 h-5 bg-indigo-100 border border-white rounded-full"
                data-tooltip-id={`read-by-${username}`}
              >
                <span className="text-xs font-medium text-indigo-600">
                  {username.charAt(0).toUpperCase()}
                </span>
                <Tooltip id={`read-by-${username}`} place="top">
                  {username}
                </Tooltip>
              </div>
            ))}
          {seenBy.length > 4 && (
            <div className="flex items-center justify-center w-5 h-5 text-xs bg-gray-100 border border-white rounded-full">
              +{seenBy.length - 4}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Editing mode UI
  if (isEditing) {
    return (
      <div className={`w-full max-w-md ${isCurrentUser ? 'ml-auto' : 'mr-auto'} bg-white p-3 rounded-lg shadow mb-4`}>
        <textarea
          value={editContent}
          onChange={(e) => onEditChange(e.target.value)}
          className="w-full p-2 mb-2 border rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          rows="3"
          autoFocus
        />
        <div className="flex justify-end space-x-2">
          <button 
            onClick={onCancelEdit}
            className="px-3 py-1 text-sm text-gray-600 rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button 
            onClick={onSaveEdit}
            className="px-3 py-1 text-sm text-white bg-indigo-500 rounded hover:bg-indigo-600"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  // Deleted message UI
  if (deleted) {
    return (
      <div className={`flex mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl relative ${
          isCurrentUser 
            ? 'bg-gray-100 text-gray-500 italic rounded-tr-none' 
            : 'bg-gray-100 text-gray-500 italic rounded-tl-none shadow-sm'
        }`}>
          <p className="text-sm">This message was deleted</p>
          <div className={`absolute top-0 w-3 h-3 ${
            isCurrentUser 
              ? 'right-0 -mr-3 bg-gray-100 clip-path-bubble-tail-right'
              : 'left-0 -ml-3 bg-gray-100 clip-path-bubble-tail-left'
          }`}></div>
        </div>
      </div>
    );
  }

  // Normal message UI
  return (
    <div 
      className={`flex mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
      onContextMenu={handleContextMenu}
    >
      <div className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl relative ${
        isCurrentUser 
          ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-tr-none' 
          : 'bg-white text-gray-800 rounded-tl-none shadow-sm'
      }`}>
        {/* Message header with sender and time */}
        <div className="flex items-center justify-between mb-1">
          {!isCurrentUser && (
            <span className="text-sm font-medium text-indigo-600">
              {message.sender}
            </span>
          )}
          <div className="flex items-center">
            <span className={`text-xs ${isCurrentUser ? 'text-indigo-100' : 'text-gray-500'}`}>
              {time}
            </span>
            {message.edited && (
              <span className={`text-xs italic ml-1 ${isCurrentUser ? 'text-indigo-200' : 'text-gray-400'}`}>
                (edited)
              </span>
            )}
            
            {/* Message status indicator */}
            {isCurrentUser && <MessageStatus />}
          </div>
        </div>
        
        {/* Reply preview */}
        {message.replyTo && message.replyTo.content && (
          <div className={`mb-2 p-2 text-xs rounded-lg border-l-4 ${
            isCurrentUser 
              ? 'bg-indigo-600 border-indigo-300' 
              : 'bg-gray-100 border-gray-300 text-gray-700'
          }`}>
            <div className={`font-medium ${
              isCurrentUser ? 'text-indigo-200' : 'text-indigo-600'
            }`}>
              Replying to {message.replyTo.sender}
            </div>
            <p className="mt-1 truncate">{message.replyTo.content}</p>
          </div>
        )}
        
        {/* Message content or file */}
        {message.file ? (
          <div className={`p-2 rounded-lg mb-2 ${
            isCurrentUser ? 'bg-indigo-600' : 'bg-gray-100'
          }`}>
            <div className="flex items-center">
              {message.file.type.startsWith('image/') ? (
                <>
                  <ImageIcon size={16} className="mr-2" />
                  <div>
                    <img 
                      src={message.file.url} 
                      alt={message.file.name || 'Image'} 
                      className="object-cover rounded cursor-pointer max-h-40"
                      onClick={() => handleDownload(message.file)}
                    />
                    {message.file.name && (
                      <p className="mt-1 text-xs truncate">{message.file.name}</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <File size={16} className="mr-2" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{message.file.name || 'File'}</p>
                    <p className="text-xs text-gray-500">
                      {message.file.size ? `${Math.round(message.file.size / 1024)} KB` : ''}
                    </p>
                  </div>
                </>
              )}
              <button 
                onClick={() => handleDownload(message.file)}
                className="p-1 ml-2 rounded-full hover:bg-white/20"
              >
                <Download size={16} />
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm break-words">{message.content}</p>
        )}
        
        {/* Message actions (like, reply, etc.) */}
        <div className="flex items-center justify-between mt-2">
          <LikeButton />
          
          <div className="flex space-x-2">
            {isCurrentUser && (
              <>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(message);
                  }}
                  className="text-xs transition-colors hover:text-indigo-300"
                  title="Edit"
                >
                  <Edit size={14} />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(message._id);
                  }}
                  className="text-xs transition-colors hover:text-indigo-300"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onReply(message);
              }} 
              className={`text-xs ${
                isCurrentUser ? 'text-indigo-200 hover:text-white' : 'text-gray-500 hover:text-indigo-600'
              } transition-colors`}
              title="Reply"
            >
              <CornerUpLeft size={14} />
            </button>
          </div>
        </div>

        {/* Context menu */}
        {showContextMenu && (
          <div 
            className="fixed z-50 py-1 bg-white rounded-md shadow-lg"
            style={{
              top: contextMenuPos.y,
              left: contextMenuPos.x,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => {
                onReply(message);
                setShowContextMenu(false);
              }}
              className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100"
            >
              <CornerUpLeft size={14} className="mr-2" />
              Reply
            </button>
            {isCurrentUser && (
              <>
                <button 
                  onClick={() => {
                    onEdit(message);
                    setShowContextMenu(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100"
                >
                  <Edit size={14} className="mr-2" />
                  Edit
                </button>
                <button 
                  onClick={() => {
                    onDelete(message._id);
                    setShowContextMenu(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-left text-red-500 hover:bg-gray-100"
                >
                  <Trash2 size={14} className="mr-2" />
                  Delete
                </button>
              </>
            )}
          </div>
        )}
        
        {/* Read receipts */}
        <ReadReceipts />
        
        {/* Bubble tail */}
        <div className={`absolute top-0 w-3 h-3 ${
          isCurrentUser 
            ? 'right-0 -mr-3 bg-gradient-to-br from-indigo-500 to-purple-500 clip-path-bubble-tail-right'
            : 'left-0 -ml-3 bg-white clip-path-bubble-tail-left'
        }`}></div>
      </div>
    </div>
  );
}

export default Message;