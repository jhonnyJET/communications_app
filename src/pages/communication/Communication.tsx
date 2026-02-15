import React, { FC, useState, useEffect } from 'react'
import axios from 'axios'
import { ServerUserNetwork } from '../../components/ServerUserNetwork/ServerUserNetwork'
import { getHost } from '../../utils/server';

interface Server {
  id: any;
  users: { name: any; lastSeen: string; isOnline: boolean; }[];
}

export const Communication: FC<any> = () => {
  const [servers, setServers] = useState<Server[]>([]);


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

  useEffect(() => {
    const fetchData = async () => {
      const response = await axios.get(`${getHost()}/ws-session/all`);
      
      // Transform payload here before passing to ServerUserNetwork
      const serverData = response.data; 
      const deduplicatedServerIds:string[] = Array.from(new Set(serverData.map((item: any) => item.hostId)));
      const formattedServerData: Server[] =  deduplicatedServerIds.map((hostId: string) => {
        const x = getUsersByServerId(hostId, serverData)        
        return {id: hostId, users: x};
      }); 

      setServers(formattedServerData);
    };

    fetchData();
  }, []);
    
  const totalUsers = servers.reduce((sum, s) => sum + s.users.length, 0);
  const maxCapacity = servers.length * 10;
  const utilization = maxCapacity > 0 ? ((totalUsers / maxCapacity) * 100).toFixed(1) : '0.0';

  return (
    <div>
      <h1>Server-User Network</h1>
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
