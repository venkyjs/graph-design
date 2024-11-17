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

    const HEADER_HEIGHT = 24;
    const HEADER_PADDING = 12;

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

    // Calculate SVG viewport dimensions
    const minX = Math.min(startX, endX);
    const maxX = Math.max(startX, endX);
    const minY = Math.min(startY, endY);
    const maxY = Math.max(startY, endY);
    const padding = 100;

    // Calculate control points for the curve
    const distance = Math.abs(endX - startX);
    const controlPointOffset = Math.min(distance * 0.4, 100);  // Increased offset for straighter entry
    const entryLength = Math.min(distance * 0.15, 30);  // Straight entry length

    // Adjust coordinates to be relative to the SVG viewport
    const relativeStartX = startX - minX + padding;
    const relativeStartY = startY - minY + padding;
    const relativeEndX = endX - minX + padding;
    const relativeEndY = endY - minY + padding;

    const path = `
        M ${relativeStartX} ${relativeStartY}
        C ${relativeStartX + (shouldReverse ? -entryLength : entryLength)} ${relativeStartY},
          ${relativeEndX + (shouldReverse ? controlPointOffset : -controlPointOffset)} ${relativeEndY},
          ${relativeEndX} ${relativeEndY}
    `;

    // Calculate the angle of the path at the end point
    // Use multiple points near the end to get a more accurate angle
    const t = 0.95; // Sample point near the end of the curve
    const t1 = 0.90; // Second sample point for better accuracy
    
    // Cubic Bezier curve formula
    const bezierPoint = (t: number) => {
        const p0x = relativeStartX;
        const p0y = relativeStartY;
        const p1x = relativeStartX + (shouldReverse ? -entryLength : entryLength);
        const p1y = relativeStartY;
        const p2x = relativeEndX + (shouldReverse ? controlPointOffset : -controlPointOffset);
        const p2y = relativeEndY;
        const p3x = relativeEndX;
        const p3y = relativeEndY;

        const x = Math.pow(1-t, 3) * p0x +
                 3 * Math.pow(1-t, 2) * t * p1x +
                 3 * (1-t) * Math.pow(t, 2) * p2x +
                 Math.pow(t, 3) * p3x;
                 
        const y = Math.pow(1-t, 3) * p0y +
                 3 * Math.pow(1-t, 2) * t * p1y +
                 3 * (1-t) * Math.pow(t, 2) * p2y +
                 Math.pow(t, 3) * p3y;
                 
        return { x, y };
    };

    // Get two points near the end of the curve
    const point1 = bezierPoint(t);
    const point2 = bezierPoint(t1);

    // Calculate angle from these points
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    return (
        <svg
            style={{
                position: 'absolute',
                top: minY - padding,
                left: minX - padding,
                width: maxX - minX + (padding * 2),
                height: maxY - minY + (padding * 2),
                pointerEvents: 'none',
                zIndex: 1,
                overflow: 'visible'
            }}
        >
            <defs>
                <marker
                    id={`arrowhead-${from.id}-${to.id}`}
                    markerWidth="5"
                    markerHeight="4.375"
                    refX="4"
                    refY="2.1875"
                    orient={angle}
                    preserveAspectRatio="xMidYMid"
                >
                    <path
                        d="M 0 0 L 5 2.1875 L 0 4.375 L 0.8 2.1875 Z"
                        fill="#666666"
                    />
                </marker>
            </defs>
            <path
                d={path}
                stroke="#666666"
                strokeWidth="1.5"
                fill="none"
                markerEnd={`url(#arrowhead-${from.id}-${to.id})`}
                style={{
                    transition: 'none'
                }}
            />
        </svg>
    );
};

export default Connection;
