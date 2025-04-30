import React from 'react';
import { Circle, Clock, CheckCircle2, XCircle } from 'lucide-react';

const statusIcons = {
  online: <Circle size={10} className="text-green-500 fill-green-500" />,
  away: <Clock size={10} className="text-yellow-500 fill-yellow-500" />,
  busy: <XCircle size={10} className="text-red-500 fill-red-500" />,
  offline: <Circle size={10} className="text-gray-400" />
};

const statusColors = {
  online: 'text-green-600',
  away: 'text-yellow-600',
  busy: 'text-red-600',
  offline: 'text-gray-500'
};

function UsersList({ users, currentUser }) {
  const formatLastActive = (lastActive) => {
    if (!lastActive) return 'Unknown';
    const now = new Date();
    const lastActiveDate = new Date(lastActive);
    const diffMinutes = Math.floor((now - lastActiveDate) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  return (
    <div className="h-full p-4 overflow-y-auto custom-scrollbar">
      <h3 className="mb-4 text-lg font-semibold text-gray-700">Active Users</h3>
      <ul className="space-y-3">
        {users
          .sort((a, b) => {
            // Sort by online status first, then by last active
            if (a.online !== b.online) return a.online ? -1 : 1;
            return new Date(b.lastActive) - new Date(a.lastActive);
          })
          .map((user) => (
            <li key={user.username} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="relative mr-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 rounded-full">
                    <span className="text-sm font-medium text-indigo-600">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1">
                    {statusIcons[user.status] || statusIcons.offline}
                  </div>
                </div>
                <div>
                  <div className="flex items-center">
                    <span className={`text-sm font-medium ${user.username === currentUser ? 'text-indigo-600' : 'text-gray-700'}`}>
                      {user.username}
                      {user.username === currentUser && ' (You)'}
                    </span>
                  </div>
                  <div className={`text-xs ${statusColors[user.status] || statusColors.offline}`}>
                    {user.online ? user.status : 'Offline'}
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {user.online ? '' : formatLastActive(user.lastActive)}
              </div>
            </li>
          ))}
      </ul>
    </div>
  );
}

export default UsersList;