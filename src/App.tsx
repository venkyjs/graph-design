import { useState, useEffect } from 'react';
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
        const data = await fetchGraphConfig();
        setConfig(data);
      } catch (err) {
        setError('Failed to load graph configuration');
        console.error(err);
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
    <div className="flex flex-col w-full h-full">
      <Graph config={config} />
    </div>
  );
}

export default App;
