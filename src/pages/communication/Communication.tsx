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
    
  return (
    <div>
      <h1>Server-User Network</h1>
      <ServerUserNetwork servers={servers} />
    </div>
  )
}
