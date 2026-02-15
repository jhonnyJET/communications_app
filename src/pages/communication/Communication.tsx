import React, { FC, useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { ServerUserNetwork } from '../../components/ServerUserNetwork/ServerUserNetwork'
import { getHost } from '../../utils/server';

interface Server {
  id: any;
  users: { name: any; lastSeen: string; isOnline: boolean; }[];
}

export const Communication: FC<any> = () => {
  const [servers, setServers] = useState<Server[]>([]);
  const [hostAddress, setHostAddress] = useState<string>(getHost());
  const [hostInput, setHostInput] = useState<string>(getHost());

  const getUsersByServerId = (hostId: string, data: any[]) => {
    console.log('Getting users for serverId:', hostId);

    return data
      .filter(item => item.hostId === hostId)
      .map(({userId}) => ({
        name: userId,
        lastSeen: 'now',
        isOnline: true
      }));
  }

  const fetchData = useCallback(async (host: string) => {
    try {
      const response = await axios.get(`${host}/ws-session/all`);

      // Transform payload here before passing to ServerUserNetwork
      const serverData = response.data;
      const deduplicatedServerIds: string[] = Array.from(new Set(serverData.map((item: any) => item.hostId)));
      const formattedServerData: Server[] = deduplicatedServerIds.map((hostId: string) => {
        const x = getUsersByServerId(hostId, serverData);
        return { id: hostId, users: x };
      });

      setServers(formattedServerData);
    } catch (error) {
      console.error('Failed to fetch data from host:', host, error);
    }
  }, []);

  useEffect(() => {
    fetchData(hostAddress);
  }, [hostAddress, fetchData]);

  const handleHostApply = () => {
    setHostAddress(hostInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleHostApply();
    }
  };

  const totalUsers = servers.reduce((sum, s) => sum + s.users.length, 0);
  const maxCapacity = servers.length * 10;
  const utilization = maxCapacity > 0 ? ((totalUsers / maxCapacity) * 100).toFixed(1) : '0.0';

  return (
    <div>
      <h1>Server-User Network</h1>
      <div style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        padding: '12px 24px',
        marginBottom: '16px',
        background: '#fff',
        borderRadius: '8px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
        flexWrap: 'wrap',
      }}>
        <label style={{ fontSize: '13px', fontWeight: 600, color: '#333' }}>Host Address:</label>
        <input
          type="text"
          value={hostInput}
          onChange={(e) => setHostInput(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '8px 12px',
            fontSize: '14px',
            border: '1px solid #ccc',
            borderRadius: '6px',
            outline: 'none',
          }}
          placeholder="e.g. http://localhost:8000"
        />
        <button
          onClick={handleHostApply}
          style={{
            padding: '8px 20px',
            fontSize: '14px',
            fontWeight: 600,
            color: '#fff',
            background: '#4a90d9',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Apply
        </button>
      </div>
      <div style={{
        display: 'flex',
        gap: '24px',
        padding: '16px 24px',
        marginBottom: '16px',
        background: '#fff',
        borderRadius: '8px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
        flexWrap: 'wrap',
        justifyContent: 'center',
        textAlign: 'center',
      }}>
        <div>
          <span style={{ fontSize: '13px', color: '#666' }}>Total Users Connected</span>
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{totalUsers}</div>
        </div>
        <div style={{ borderLeft: '1px solid #eee', paddingLeft: '24px' }}>
          <span style={{ fontSize: '13px', color: '#666' }}>Overall Max Connection Utilization</span>
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{utilization}%</div>
          <span style={{ fontSize: '11px', color: '#999' }}>{totalUsers} / {maxCapacity} (servers: {servers.length})</span>
        </div>
      </div>
      <ServerUserNetwork servers={servers} />
    </div>
  )
}
