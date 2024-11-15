import React from 'react';
import { Box } from '../types/graph';

interface ConnectionProps {
    fromBox: Box & { x: number; y: number };
    toBox: Box & { x: number; y: number };
}

const Connection: React.FC<ConnectionProps> = ({ fromBox, toBox }) => {
    const calculateControlPoints = () => {
        // Calculate box centers
        const fromCenterX = fromBox.x + fromBox.width / 2;
        const fromCenterY = fromBox.y + fromBox.height / 2;
        const toCenterX = toBox.x + toBox.width / 2;
        const toCenterY = toBox.y + toBox.height / 2;

        // Calculate the direct distance between centers
        const dx = toCenterX - fromCenterX;
        const dy = toCenterY - fromCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Determine connection points
        let fromPoint = { x: 0, y: 0 };
        let toPoint = { x: 0, y: 0 };

        // If going right to left, we need a smoother curve
        const isRightToLeft = fromBox.x > toBox.x;

        if (isRightToLeft) {
            // For right-to-left connections, use side points
            fromPoint = {
                x: fromBox.x,
                y: fromBox.y + fromBox.height / 2
            };
            toPoint = {
                x: toBox.x + toBox.width,
                y: toBox.y + toBox.height / 2
            };
        } else {
            // For left-to-right connections, use standard side points
            fromPoint = {
                x: fromBox.x + fromBox.width,
                y: fromBox.y + fromBox.height / 2
            };
            toPoint = {
                x: toBox.x,
                y: toBox.y + toBox.height / 2
            };
        }

        // Calculate control points for the curve
        let control1, control2;

        if (isRightToLeft) {
            // Create a smoother curve for right-to-left connections
            const curveDistance = Math.abs(fromPoint.x - toPoint.x) * 0.5;
            const heightOffset = Math.min(150, distance * 0.5);

            // Calculate midpoint
            const midX = (fromPoint.x + toPoint.x) / 2;
            const midY = (fromPoint.y + toPoint.y) / 2 - heightOffset;

            // Create smooth control points using the midpoint
            control1 = {
                x: fromPoint.x - curveDistance * 0.3,
                y: midY
            };
            control2 = {
                x: toPoint.x + curveDistance * 0.3,
                y: midY
            };
        } else {
            // For left-to-right, use gentle curves
            const controlDistance = distance * 0.25;
            control1 = {
                x: fromPoint.x + controlDistance,
                y: fromPoint.y
            };
            control2 = {
                x: toPoint.x - controlDistance,
                y: toPoint.y
            };
        }

        return {
            fromPoint,
            toPoint,
            control1,
            control2
        };
    };

    const { fromPoint, toPoint, control1, control2 } = calculateControlPoints();

    // Calculate the angle for the arrow
    const arrowAngle = Math.atan2(
        toPoint.y - control2.y,
        toPoint.x - control2.x
    );

    const arrowLength = 10;
    const arrowWidth = 6;

    const arrowPoints = [
        toPoint.x,
        toPoint.y,
        toPoint.x - arrowLength * Math.cos(arrowAngle - Math.PI / 6),
        toPoint.y - arrowLength * Math.sin(arrowAngle - Math.PI / 6),
        toPoint.x - arrowLength * Math.cos(arrowAngle + Math.PI / 6),
        toPoint.y - arrowLength * Math.sin(arrowAngle + Math.PI / 6)
    ].join(',');

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
                    refX="5"
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
            />
        </svg>
    );
};

export default Connection;
