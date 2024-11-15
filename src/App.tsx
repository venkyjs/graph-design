import { Graph } from './components/Graph'
import { GraphConfig } from './types/graph'

const sampleConfig: GraphConfig = {
  boxes: [
    {
      id: 'box1',
      x: 300,
      y: 100,
      width: 150,
      height: 80,
      label: 'Box 1'
    },
    {
      id: 'box2',
      x: 700,
      y: 100,
      width: 150,
      height: 80,
      label: 'Box 2'
    },
    {
      id: 'box3',
      x: 500,
      y: 300,
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
      from: 'box1',
      to: 'box3',
      fromSide: 'bottom',
      toSide: 'left'
    },
    {
      from: 'box2',
      to: 'box3',
      fromSide: 'bottom',
      toSide: 'right'
    }
  ]
}

function App() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Graph config={sampleConfig} />
    </div>
  )
}

export default App
