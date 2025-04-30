import React from 'react';
import { Users, Circle } from 'lucide-react';

function UsersList({ users, currentUser }) {
  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex items-center mb-4 text-indigo-600">
        <Users size={20} className="mr-2" />
        <h3 className="text-lg font-semibold">Active Users</h3>
        <span className="px-2 py-1 ml-auto text-xs text-indigo-800 bg-indigo-100 rounded-full">
          {users.length} online
        </span>
      </div>
      <ul className="flex-1 space-y-2 overflow-y-auto">
        {users.map((user) => (
          <li 
            key={user.username} 
            className="flex items-center p-2 transition-colors rounded-lg hover:bg-gray-50"
          >
            <div className="relative mr-3">
              <div className="flex items-center justify-center w-8 h-8 font-medium text-white rounded-full bg-gradient-to-r from-indigo-400 to-purple-400">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <span className={`${user.username === currentUser ? 'font-semibold text-indigo-600' : 'text-gray-700'}`}>
              {user.username} {user.username === currentUser && '(You)'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default UsersList;