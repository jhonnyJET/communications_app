import { useState } from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import './App.css';
import { Communication } from './pages/communication/Communication';
import { Route } from './pages/route/Route';

function App() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="App">
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Connections" />
          <Tab label="Route" />
        </Tabs>
      </Box>
      {activeTab === 0 && <Communication />}
      {activeTab === 1 && <Route />}
    </div>
  );
}

export default App;
