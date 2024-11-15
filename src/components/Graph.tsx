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
        // Create a transparent drag image
        const dragImage = document.createElement('div');
        dragImage.style.opacity = '0';
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 0, 0);
        document.body.removeChild(dragImage);
    };

    const handleDrag = (e: React.DragEvent, id: string) => {
        if (e.clientX === 0 && e.clientY === 0) return;

        const box = boxes[id];
        const newX = e.clientX - box.width / 2;
        const newY = e.clientY - box.height / 2;

        setBoxes(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                x: newX,
                y: newY
            }
        }));
    };

    return (
        <div 
            style={{ 
                position: 'relative', 
                width: '100%', 
                height: '100vh',
                backgroundColor: 'white',
                overflow: 'hidden'
            }}
        >
            {config.connections.map((conn, index) => {
                const fromBox = boxes[conn.from];
                const toBox = boxes[conn.to];
                
                if (!fromBox || !toBox) return null;
                
                return (
                    <Connection
                        key={`${conn.from}-${conn.to}-${index}`}
                        fromBox={fromBox}
                        toBox={toBox}
                    />
                );
            })}
            {Object.values(boxes).map(box => (
                <Box
                    key={box.id}
                    {...box}
                    onDragStart={handleDragStart}
                    onDrag={handleDrag}
                />
            ))}
        </div>
    );
};

export default Graph;
