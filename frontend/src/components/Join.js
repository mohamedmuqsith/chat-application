import React, { useState } from 'react';
import { MessageSquare, User, Hash } from 'lucide-react';

function Join({ onJoin }) {
  const [username, setUsername] = useState('');
  const [room, setRoom] = useState('');
  const [error, setError] = useState('');
  const [availableRooms, setAvailableRooms] = useState([
    'General', 'Technology', 'Gaming', 'Music', 'Movies'
  ]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (username.trim() === '') {
      setError('Username is required');
      return;
    }
    
    const roomToJoin = room.trim() === '' ? 'General' : room;
    onJoin(username, roomToJoin);
  };

  const selectRoom = (selectedRoom) => {
    setRoom(selectedRoom);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mb-4">
            <MessageSquare size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Welcome to ChatSphere</h2>
          <p className="text-gray-500 mt-2">Connect with others in real-time</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="username">
              Your Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                id="username"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Choose a Room
            </label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {availableRooms.map((roomName) => (
                <button
                  key={roomName}
                  type="button"
                  className={`px-3 py-2 text-sm rounded-lg transition-all flex items-center ${
                    room === roomName 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md' 
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-indigo-300'
                  }`}
                  onClick={() => selectRoom(roomName)}
                >
                  <Hash size={14} className="mr-1" />
                  {roomName}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="room">
              Or Create Custom Room
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Hash size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                id="room"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="Enter custom room name"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Leave empty to join the "General" room
            </p>
          </div>
          
          <button
            type="submit"
            className="w-full py-2 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-lg hover:from-indigo-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-md transition-all"
          >
            Join Chat
          </button>
        </form>
      </div>
    </div>
  );
}

export default Join;