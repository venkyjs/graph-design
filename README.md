# Graph Design

A React + TypeScript application for creating interactive graph visualizations with draggable nodes and dynamic connections.

## Features

- Draggable boxes with real-time position updates
- Dynamic bezier curve connections between boxes
- Directional arrows on connections
- Smooth drag and drop functionality
- Real-time connection updates during box movement

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS

## Getting Started

1. Clone the repository:
```bash
git clone [your-repository-url]
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Usage

- Click and drag boxes to move them
- Connections will automatically update as boxes are moved
- Arrows indicate the direction of connections

## Project Structure

```
src/
  components/
    Box.tsx         # Draggable box component
    Connection.tsx  # Bezier curve connection with arrow
    Graph.tsx      # Main graph container component
  types/
    graph.ts       # TypeScript interfaces
  App.tsx          # Root application component
```

## License

MIT
