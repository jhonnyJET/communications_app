import React, { FC } from 'react';
import './ServerUserNetwork.css';

interface User {
  name: string;
  lastSeen: string;
  isOnline: boolean;
}

interface Server {
  id: string;
  users: User[];
}

interface ServerUserNetworkProps {
  servers?: Server[];
}

const defaultServers: Server[] = [
  {
    id: '7fbfe99b50e2',
    users: [
      { name: 'Jon', lastSeen: '2s', isOnline: true }
    ]
  },
  {
    id: '286ae590f0d6',
    users: [
      { name: 'Joe', lastSeen: '20min', isOnline: false },
      { name: 'Jane', lastSeen: '5min', isOnline: true }
    ]
  },
  {
    id: '99b0aa8e60a',
    users: [
      { name: 'Josh', lastSeen: '40min', isOnline: false },
      { name: 'Jenna', lastSeen: '5min', isOnline: true },
      { name: 'Janice', lastSeen: '50min', isOnline: false }
    ]
  }
];

export const ServerUserNetwork: FC<ServerUserNetworkProps> = ({ servers = defaultServers }) => {
  return (
    <div className="server-network-container">
      {servers.map((server, serverIndex) => (
        <div key={server.id} className="server-group">
          <div className="server-node">
            <div className="server-label">Server</div>
            <div className="server-id">{server.id}</div>
          </div>
          <div className="users-container">
            {server.users.map((user, userIndex) => (
              <div key={`${server.id}-${user.name}`} className="user-connection">
                <div className={`connection-line ${user.isOnline ? 'online' : 'offline'}`}></div>
                <div className={`user-node ${user.isOnline ? 'online' : 'offline'}`}>
                  <div className="user-label">User:</div>
                  <div className="user-name">{user.name}</div>
                  <div className="last-seen">Last seen:</div>
                  <div className="last-seen-time">{user.lastSeen}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};