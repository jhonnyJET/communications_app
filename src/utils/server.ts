// Conditional host variable based on NODE_ENV
const getHost = (): string => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const hostEnv = process.env.BE_HOST || 'localhost';
  
  switch (nodeEnv) {
    case 'production':
      return `http://${hostEnv}:8000` || 'http://localhost:8000';
    case 'test':
      return process.env.REACT_APP_TEST_HOST || 'http://localhost:8000';
    case 'development':
    default:
      return process.env.REACT_APP_DEV_HOST || 'http://localhost:8000';
  }
};

export const HOST = getHost();

// Optional: Export the function if you need to call it dynamically
export { getHost };

// Optional: You can also export specific environment checks
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';
