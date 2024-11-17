import React from 'react';
import { DatasetWithPosition } from '../types/graph';

interface ConnectionProps {
    from: DatasetWithPosition;
    to: DatasetWithPosition;
}

const Connection: React.FC<ConnectionProps> = ({ from, to }) => {
    if (!from || !to) {
        console.warn('Missing dataset in connection');
        return null;
    }

    const HEADER_HEIGHT = 24; // Height of the dataset header
    const HEADER_PADDING = 12; // Padding around header

    const getHeaderMiddleY = (dataset: DatasetWithPosition): number => {
        return dataset.y + (HEADER_HEIGHT / 2) + HEADER_PADDING;
    };

    // Determine if the connection should be reversed based on position
    const shouldReverse = from.x > to.x;
    const [startDataset, endDataset] = shouldReverse ? [to, from] : [from, to];

    // Calculate connection points
    const startX = shouldReverse 
        ? startDataset.x // Left edge
        : startDataset.x + startDataset.width; // Right edge
    const startY = getHeaderMiddleY(startDataset);
    
    const endX = shouldReverse 
        ? endDataset.x + endDataset.width // Right edge
        : endDataset.x; // Left edge
    const endY = getHeaderMiddleY(endDataset);

    // Create curved path with adjusted control points
    const distance = Math.abs(endX - startX);
    const controlPointOffset = Math.min(distance * 0.2, 50); // Limit the curve's bulge

    const path = `
        M ${startX} ${startY}
        C ${startX + (shouldReverse ? -controlPointOffset : controlPointOffset)} ${startY},
          ${endX + (shouldReverse ? controlPointOffset : -controlPointOffset)} ${endY},
          ${endX} ${endY}
    `;

    return (
        <svg
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 1
            }}
        >
            <defs>
                <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                >
                    <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill="#666666"
                    />
                </marker>
            </defs>
            <path
                d={path}
                stroke="#666666"
                strokeWidth="2"
                fill="none"
                markerEnd="url(#arrowhead)"
            />
        </svg>
    );
};

export default Connection;
