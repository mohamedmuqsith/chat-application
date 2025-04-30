import React from 'react';
import { Check, CheckCircle, Heart, Trash2, Edit, CornerUpLeft } from 'lucide-react';

function Message({ 
  message, 
  time, 
  isCurrentUser, 
  onReply, 
  onDelete, 
  onEdit,
  onLike,
  seenBy, 
  delivered, 
  allUsers,
  isEditing,
  editContent,
  onEditChange,
  onSaveEdit,
  onCancelEdit
}) {
  const isReadByAll = allUsers && allUsers.length > 0 && 
    allUsers.every(user => seenBy.includes(user) || user === message.sender);
  
  const isReadBySome = seenBy && seenBy.length > 1 && !isReadByAll;
  
  const formatSeenInfo = () => {
    if (!seenBy) return 'Not seen yet';
    const otherUsers = seenBy.filter(user => user !== message.sender);
    if (otherUsers.length === 0) return 'Not seen yet';
    return `Seen by ${otherUsers.join(', ')}`;
  };

  const isLiked = message.likes && message.likes.includes(isCurrentUser ? 'You' : message.sender);

  if (isEditing) {
    return (
      <div className="w-full max-w-md bg-white p-3 rounded-lg shadow mb-4">
        <textarea
          value={editContent}
          onChange={(e) => onEditChange(e.target.value)}
          className="w-full p-2 border rounded mb-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          rows="3"
        />
        <div className="flex justify-end space-x-2">
          <button 
            onClick={onCancelEdit}
            className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
          >
            Cancel
          </button>
          <button 
            onClick={onSaveEdit}
            className="px-3 py-1 text-sm bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl relative ${
        isCurrentUser 
          ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-tr-none' 
          : 'bg-white text-gray-800 rounded-tl-none shadow-sm'
      }`}>
        <div className="flex justify-between items-center mb-1">
          {!isCurrentUser && (
            <span className="font-medium text-sm text-indigo-600">
              {message.sender}
            </span>
          )}
          <div className="flex items-center">
            <span className={`text-xs ${isCurrentUser ? 'text-indigo-100' : 'text-gray-500'}`}>
              {time}
            </span>
            {message.edited && (
              <span className="text-xs italic text-gray-400 ml-1">(edited)</span>
            )}
            
            {isCurrentUser && (
              <div className="flex items-center ml-1" title={formatSeenInfo()}>
                {isReadByAll ? (
                  <CheckCircle size={12} className="text-green-300" />
                ) : isReadBySome ? (
                  <CheckCircle size={12} className="text-indigo-300" />
                ) : delivered ? (
                  <Check size={12} className="text-indigo-300" />
                ) : (
                  <Check size={12} className="text-gray-300" />
                )}
              </div>
            )}
          </div>
        </div>
        
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
        
        <p className="text-sm break-words">{message.content}</p>
        
        <div className="flex items-center justify-between mt-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onLike(message._id);
            }}
            className={`flex items-center text-xs ${
              isCurrentUser 
                ? isLiked ? 'text-red-300' : 'text-indigo-200' 
                : isLiked ? 'text-red-500' : 'text-gray-500'
            } hover:scale-105 transition-transform`}
          >
            <Heart size={14} className="mr-1" fill={isLiked ? 'currentColor' : 'none'} />
            {message.likes?.length || 0}
          </button>
          
          <div className="flex space-x-2">
            {isCurrentUser && (
              <>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(message);
                  }}
                  className="text-xs hover:text-indigo-300 transition-colors"
                  title="Edit"
                >
                  <Edit size={14} />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(message._id);
                  }}
                  className="text-xs hover:text-indigo-300 transition-colors"
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