import { useState } from 'react';
import { GraphConfig, Box as BoxType } from '../types/graph';
import { Box } from './Box';
import { Connection } from './Connection';

interface GraphProps {
    config: GraphConfig;
    className?: string;
}

export const Graph = ({ config: initialConfig, className = '' }: GraphProps) => {
    const [boxes, setBoxes] = useState<BoxType[]>(initialConfig.boxes);
    
    const boxesMap = boxes.reduce((acc, box) => ({
        ...acc,
        [box.id]: box
    }), {});

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrag = (id: string, x: number, y: number) => {
        setBoxes(prevBoxes =>
            prevBoxes.map(box =>
                box.id === id
                    ? { ...box, x, y }
                    : box
            )
        );
    };

    return (
        <div 
            style={{ 
                width: '100%',
                height: '100%',
                position: 'relative',
                overflow: 'hidden'
            }}
            className={className}
            onDragOver={handleDragOver}
        >
            {initialConfig.connections.map((connection, index) => (
                <Connection
                    key={`${connection.from}-${connection.to}-${index}`}
                    {...connection}
                    boxes={boxesMap}
                />
            ))}
            {boxes.map((box) => (
                <Box 
                    key={box.id} 
                    {...box}
                    onDrag={handleDrag}
                />
            ))}
        </div>
    );
};
