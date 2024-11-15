import React, { useState } from 'react';
import { Box as BoxType, Connection as ConnectionType, GraphConfig } from '../types/graph';
import Box from './Box';
import Connection from './Connection';

interface GraphProps {
    config: GraphConfig;
}

const Graph: React.FC<GraphProps> = ({ config }) => {
    const [boxes, setBoxes] = useState<{ [key: string]: BoxType }>(
        config.boxes.reduce((acc, box) => ({ ...acc, [box.id]: box }), {})
    );

    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData('text/plain', id);
    };

    const handleDrag = (e: React.DragEvent, id: string) => {
        if (e.clientX === 0 && e.clientY === 0) return;

        setBoxes(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                x: e.clientX - prev[id].width / 2,
                y: e.clientY - prev[id].height / 2
            }
        }));
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
            {config.connections.map((conn, index) => (
                <Connection
                    key={`${conn.from}-${conn.to}-${index}`}
                    from={conn.from}
                    to={conn.to}
                    boxes={boxes}
                />
            ))}
            {config.boxes.map(box => (
                <Box
                    key={box.id}
                    {...boxes[box.id]}
                    onDragStart={handleDragStart}
                    onDrag={handleDrag}
                />
            ))}
        </div>
    );
};

export default Graph;
