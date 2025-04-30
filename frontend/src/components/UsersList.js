import React from 'react';
import { Users, Circle } from 'lucide-react';

function UsersList({ users, currentUser }) {
  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center mb-4 text-indigo-600">
        <Users size={20} className="mr-2" />
        <h3 className="text-lg font-semibold">Active Users</h3>
        <span className="ml-auto bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
          {users.length} online
        </span>
      </div>
      <ul className="space-y-2 overflow-y-auto flex-1">
        {users.map((user) => (
          <li 
            key={user.username} 
            className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="relative mr-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 flex items-center justify-center text-white font-medium">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
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