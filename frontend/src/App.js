import React, { useState, useEffect } from 'react';
import Chat from './components/Chat';
import Join from './components/Join';

function App() {
  const [userData, setUserData] = useState(() => {
    // Try to load from localStorage
    const savedData = localStorage.getItem('chatUserData');
    return savedData 
      ? JSON.parse(savedData)
      : {
          username: '',
          room: '',
          joined: false
        };
  });

  useEffect(() => {
    // Save to localStorage whenever userData changes
    if (userData.joined) {
      localStorage.setItem('chatUserData', JSON.stringify(userData));
    } else {
      localStorage.removeItem('chatUserData');
    }
  }, [userData]);

  const handleJoinChat = (username, room) => {
    setUserData({
      username,
      room,
      joined: true
    });
  };

  const handleLogout = () => {
    setUserData({
      username: '',
      room: '',
      joined: false
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {!userData.joined ? (
        <Join onJoin={handleJoinChat} />
      ) : (
        <div className="flex flex-col h-screen">
          <div className="absolute z-10 top-4 right-4">
            <button
              onClick={handleLogout}
              className="px-3 py-1 text-sm text-white transition-all bg-red-500 rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Logout
            </button>
          </div>
          <Chat username={userData.username} room={userData.room} />
        </div>
      )}
    </div>
  );
}

export default App;