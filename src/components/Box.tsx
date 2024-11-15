import React from 'react';
import { Box as BoxType } from '../types/graph';

interface BoxProps extends BoxType {
    onDragStart: (e: React.DragEvent, id: string) => void;
    onDrag: (e: React.DragEvent, id: string) => void;
}

const Box: React.FC<BoxProps> = ({ id, x, y, width, height, label, onDragStart, onDrag }) => {
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, id)}
            onDrag={(e) => onDrag(e, id)}
            style={{
                position: 'absolute',
                left: `${x}px`,
                top: `${y}px`,
                width: `${width}px`,
                height: `${height}px`,
                backgroundColor: 'white',
                border: '2px solid #666',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'move',
                userSelect: 'none',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                zIndex: 1
            }}
        >
            {label}
        </div>
    );
};

export default Box;
