import { Graph } from './components/Graph'
import { GraphConfig } from './types/graph'

const sampleConfig: GraphConfig = {
  boxes: [
    {
      id: 'box1',
      x: 100,
      y: 100,
      width: 150,
      height: 80,
      label: 'Box 1'
    },
    {
      id: 'box2',
      x: 400,
      y: 200,
      width: 150,
      height: 80,
      label: 'Box 2'
    },
    {
      id: 'box3',
      x: 250,
      y: 400,
      width: 150,
      height: 80,
      label: 'Box 3'
    }
  ],
  connections: [
    {
      from: 'box1',
      to: 'box2'
    },
    {
      from: 'box2',
      to: 'box3'
    },
    {
      from: 'box3',
      to: 'box1'
    }
  ]
}

function App() {
  return (
    <div className="w-full h-screen bg-white">
      <Graph config={sampleConfig} />
    </div>
  )
}

export default App
