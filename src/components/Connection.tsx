import React from 'react';
import { Box } from '../types/graph';

interface ConnectionProps {
    fromBox: Box & { x: number; y: number };
    toBox: Box & { x: number; y: number };
}

const Connection: React.FC<ConnectionProps> = ({ fromBox, toBox }) => {
    const headerHeight = 40; // Height of the header area

    const calculatePoints = () => {
        const fromCenterX = fromBox.x + fromBox.width / 2;
        const fromHeaderY = fromBox.y + headerHeight / 2;
        const toCenterX = toBox.x + toBox.width / 2;
        const toHeaderY = toBox.y + headerHeight / 2;

        // Determine if going right to left
        const isRightToLeft = fromBox.x > toBox.x;

        // Calculate connection points from headers
        let fromPoint = {
            x: isRightToLeft ? fromBox.x : fromBox.x + fromBox.width,
            y: fromHeaderY
        };

        let toPoint = {
            x: isRightToLeft ? toBox.x + toBox.width : toBox.x,
            y: toHeaderY
        };

        // Calculate control points for smooth curve
        const dx = Math.abs(fromPoint.x - toPoint.x);
        const curveDistance = Math.min(dx * 0.5, 100); // Cap the curve distance

        let control1 = {
            x: isRightToLeft ? fromPoint.x - curveDistance : fromPoint.x + curveDistance,
            y: fromPoint.y
        };

        let control2 = {
            x: isRightToLeft ? toPoint.x + curveDistance : toPoint.x - curveDistance,
            y: toPoint.y
        };

        return {
            fromPoint,
            toPoint,
            control1,
            control2
        };
    };

    const { fromPoint, toPoint, control1, control2 } = calculatePoints();

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
                    id={`arrow-${fromBox.id}-${toBox.id}`}
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#666" />
                </marker>
            </defs>
            <path
                d={`M ${fromPoint.x},${fromPoint.y} C ${control1.x},${control1.y} ${control2.x},${control2.y} ${toPoint.x},${toPoint.y}`}
                stroke="#666"
                strokeWidth="2"
                fill="none"
                markerEnd={`url(#arrow-${fromBox.id}-${toBox.id})`}
                style={{ markerEnd: `url(#arrow-${fromBox.id}-${toBox.id})` }}
            />
        </svg>
    );
};

export default Connection;
