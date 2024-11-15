import { GraphConfig } from './types/graph';
import Graph from './components/Graph';

const config: GraphConfig = {
  boxes: [
    {
      id: 'box1',
      width: 200,
      height: 200,
      label: 'User',
      columns: [
        { name: 'id', type: 'UUID' },
        { name: 'username', type: 'string' },
        { name: 'email', type: 'string' },
        { name: 'createdAt', type: 'datetime' }
      ]
    },
    {
      id: 'box2',
      width: 200,
      height: 200,
      label: 'Post',
      columns: [
        { name: 'id', type: 'UUID' },
        { name: 'title', type: 'string' },
        { name: 'content', type: 'text' },
        { name: 'userId', type: 'UUID' },
        { name: 'publishedAt', type: 'datetime' }
      ]
    },
    {
      id: 'box3',
      width: 200,
      height: 200,
      label: 'Comment',
      columns: [
        { name: 'id', type: 'UUID' },
        { name: 'postId', type: 'UUID' },
        { name: 'userId', type: 'UUID' },
        { name: 'content', type: 'text' },
        { name: 'createdAt', type: 'datetime' }
      ]
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
    }
  ]
};

function App() {
  return (
    <div className="flex flex-col w-full h-full">
      <Graph config={config} />
    </div>
  );
}

export default App;
