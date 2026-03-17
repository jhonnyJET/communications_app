import mqtt from 'mqtt';
import { useEffect, useRef, useState } from 'react';

export interface SimulationNotification {
  simulationId: string;
  message: string;
}

export function useSimulationMqtt(clientId: string | null, brokerUrl: string) {
  const [notification, setNotification] = useState<SimulationNotification | null>(null);
  const clientRef = useRef<mqtt.MqttClient | null>(null);

  useEffect(() => {
    if (!clientId) return;

    const topic = `simulation/${clientId}/updates`;
    const client = mqtt.connect(brokerUrl);
    clientRef.current = client;

    client.on('connect', () => {
      client.subscribe(topic);
    });

    client.on('message', (_, payload) => {
      try {
        const data: SimulationNotification = JSON.parse(payload.toString());
        setNotification(data);
      } catch {
        // ignore malformed messages
      }
    });

    return () => {
      client.end();
      clientRef.current = null;
    };
  }, [clientId, brokerUrl]);

  return notification;
}
