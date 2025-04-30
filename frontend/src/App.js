import React, { useState } from 'react';
import Chat from './components/Chat';
import Join from './components/Join';

function App() {
  const [userData, setUserData] = useState({
    username: '',
    room: '',
    joined: false
  });

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
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={handleLogout}
              className="px-3 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600 focus:outline-none"
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