import React, { FC, useState } from 'react';
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
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);

  const handleServerClick = (server: Server) => {
    setSelectedServer(server);
  };

  const handleCloseModal = () => {
    setSelectedServer(null);
  };

  return (
    <div className="server-network-container">
      {servers.map((server) => (
        <div
          key={server.id}
          className="server-node"
          onClick={() => handleServerClick(server)}
          title="Click to view connected users"
        >
          <div className="server-label">Server</div>
          <div className="server-id">{server.id}</div>
          <div className="server-user-count">
            {server.users.length} {server.users.length === 1 ? 'user' : 'users'}
          </div>
        </div>
      ))}

      {selectedServer && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Server {selectedServer.id}</h2>
              <button className="modal-close" onClick={handleCloseModal}>&times;</button>
            </div>
            <div className="modal-body">
              <p className="modal-user-count">
                {selectedServer.users.length} connected {selectedServer.users.length === 1 ? 'user' : 'users'}
              </p>
              <ul className="user-list">
                {selectedServer.users.map((user) => (
                  <li key={user.name} className="user-list-item">
                    <span className={`status-dot ${user.isOnline ? 'online' : 'offline'}`} />
                    <span className="user-list-name">{user.name}</span>
                    <span className="user-list-seen">Last seen: {user.lastSeen}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};