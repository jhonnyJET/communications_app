// Conditional host variable based on NODE_ENV
const getHost = (): string => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const hostEnv = process.env.REACT_APP_SERVER_URL;
  const portEnv = process.env.REACT_APP_SERVER_PORT;

  console.log(`Current NODE_ENV: ${JSON.stringify(process.env)}, using host: ${hostEnv}`);

  switch (nodeEnv) {
    case 'production':
      return `http://${hostEnv}:${portEnv}`;
    case 'test':
      return `http://${hostEnv}:${portEnv}`;
    case 'development':
    default:
      return `http://${hostEnv}:${portEnv}`;
  }
};

const getTrackerHost = (): string => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const hostEnv = process.env.REACT_APP_SERVER_URL;
  const portEnv = process.env.REACT_APP_TRACKER_PORT;

  console.log(`Current NODE_ENV: ${JSON.stringify(process.env)}, using host: ${hostEnv}`);

  switch (nodeEnv) {
    case 'production':
      return `http://${hostEnv}:${portEnv}`;
    case 'test':
      return `http://${hostEnv}:${portEnv}`;
    case 'development':
    default:
      return `http://${hostEnv}:${portEnv}`;
  }
};

const getTrackerClientHost = (): string => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const hostEnv = process.env.REACT_APP_SERVER_URL;
  const portEnv = process.env.REACT_APP_TRACKER_CLIENT;

  console.log(`Current NODE_ENV: ${JSON.stringify(process.env)}, using host: ${hostEnv}`);

  switch (nodeEnv) {
    case 'production':
      return `http://${hostEnv}:${portEnv}`;
    case 'test':
      return `http://${hostEnv}:${portEnv}`;
    case 'development':
    default:
      return `http://${hostEnv}:${portEnv}`;
  }
};

const getTrackerServerGoHost = (): string => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const hostEnv = process.env.REACT_APP_SERVER_URL;
  const portEnv = process.env.REACT_APP_TRACKER_SERVER_GO_PORT;

  console.log(`Current NODE_ENV: ${JSON.stringify(process.env)}, using host: ${hostEnv}`);

  switch (nodeEnv) {
    case 'production':
      return `http://${hostEnv}:${portEnv}`;
    case 'test':
      return `http://${hostEnv}:${portEnv}`;
    case 'development':
    default:
      return `http://${hostEnv}:${portEnv}`;
  }
};

const getTrackerClientGoHost = (): string => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const hostEnv = process.env.REACT_APP_SERVER_URL;
  const portEnv = process.env.REACT_APP_TRACKER_CLIENT_GO_PORT;

  console.log(`Current NODE_ENV: ${JSON.stringify(process.env)}, using host: ${hostEnv}`);

  switch (nodeEnv) {
    case 'production':
      return `http://${hostEnv}:${portEnv}`;
    case 'test':
      return `http://${hostEnv}:${portEnv}`;
    case 'development':
    default:
      return `http://${hostEnv}:${portEnv}`;
  }
};

export const HOST = getHost();
export const TRACKER_HOST = getTrackerHost();
export const TRACKER_CLIENT_HOST = getTrackerClientHost();
export const TRACKER_SERVER_GO_HOST = getTrackerServerGoHost();
export const TRACKER_CLIENT_GO_HOST = getTrackerClientGoHost();
export const MQTT_WS_URL = process.env.REACT_APP_MQTT_WS_URL ?? 'ws://localhost:9001/mqtt';

// Optional: Export the function if you need to call it dynamically
export { getHost, getTrackerHost, getTrackerClientHost, getTrackerServerGoHost, getTrackerClientGoHost };

// Optional: You can also export specific environment checks
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';
