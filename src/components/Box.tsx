import { Box as BoxType } from '../types/graph';
import { useRef } from 'react';

interface BoxProps extends BoxType {
    className?: string;
    onDrag: (id: string, x: number, y: number) => void;
}

export const Box = ({ id, x, y, width, height, label, className = '', onDrag }: BoxProps) => {
    const dragOffset = useRef<{ x: number; y: number } | null>(null);

    const handleDragStart = (e: React.DragEvent) => {
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        dragOffset.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        // Prevent default ghost image
        const img = new Image();
        e.dataTransfer.setDragImage(img, 0, 0);
        
        e.dataTransfer.setData('text/plain', id);
    };

    const handleDrag = (e: React.DragEvent) => {
        if (e.clientX === 0 && e.clientY === 0) return; // Ignore invalid drag events
        if (!dragOffset.current) return;

        const rect = (e.currentTarget as HTMLElement).parentElement?.getBoundingClientRect();
        if (!rect) return;

        const newX = e.clientX - rect.left;
        const newY = e.clientY - rect.top;
        onDrag(id, newX, newY);
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            style={{
                position: 'absolute',
                left: `${x}px`,
                top: `${y}px`,
                width: `${width}px`,
                height: `${height}px`,
                transform: 'translate(-50%, -50%)',
                border: '2px solid #666',
                borderRadius: '8px',
                backgroundColor: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: 500,
                zIndex: 1,
                cursor: 'move',
                userSelect: 'none'
            }}
            className={className}
        >
            {label}
        </div>
    );
};
