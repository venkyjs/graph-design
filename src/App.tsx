import React, { useState, useEffect } from 'react';
import { GraphConfig } from './types/graph';
import Graph from './components/Graph';
import { fetchGraphConfig } from './services/graphService';

function App() {
  const [config, setConfig] = useState<GraphConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        console.log('Fetching configuration...');
        const data = await fetchGraphConfig();
        console.log('Configuration loaded:', data);
        setConfig(data);
        setError(null);
      } catch (err) {
        console.error('Error loading configuration:', err);
        setError('Failed to load graph configuration');
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-screen text-red-500">{error}</div>;
  }

  if (!config) {
    return <div className="flex items-center justify-center h-screen">No configuration available</div>;
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-gray-100">
      <Graph config={config} />
    </div>
  );
}

export default App;
