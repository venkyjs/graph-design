import React, { useState, useEffect } from 'react';
import { Box as BoxType, Connection as ConnectionType, GraphConfig } from '../types/graph';
import Box from './Box';
import Connection from './Connection';

interface GraphProps {
    config: GraphConfig;
}

interface BoxWithPosition extends BoxType {
    x: number;
    y: number;
}

const Graph: React.FC<GraphProps> = ({ config }) => {
    const [boxes, setBoxes] = useState<{ [key: string]: BoxWithPosition }>({});

    // Initialize box positions once when component mounts
    useEffect(() => {
        const SPACING_X = 250;
        const SPACING_Y = 150;
        const START_X = 100;
        const START_Y = 100;

        // Create a simple left-to-right layout
        const newBoxes = config.boxes.reduce((acc, box, index) => {
            acc[box.id] = {
                ...box,
                x: START_X + (index * SPACING_X),
                y: START_Y
            };
            return acc;
        }, {} as { [key: string]: BoxWithPosition });

        setBoxes(newBoxes);
    }, [config]);

    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData('text/plain', id);
        const dragImage = document.createElement('div');
        dragImage.style.opacity = '0';
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 0, 0);
        document.body.removeChild(dragImage);
    };

    const handleDrag = (e: React.DragEvent, id: string) => {
        if (e.clientX === 0 && e.clientY === 0) return;

        const box = boxes[id];
        if (!box) return;

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
            {Object.values(boxes).length > 0 && (
                <>
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
                </>
            )}
        </div>
    );
};

export default Graph;
