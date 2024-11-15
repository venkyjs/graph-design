import React from 'react';
import { Connection as ConnectionType, Box } from '../types/graph';

interface ConnectionProps extends ConnectionType {
    boxes: { [key: string]: Box };
}

type Side = 'top' | 'right' | 'bottom' | 'left';
type Point = { x: number; y: number };

const Connection: React.FC<ConnectionProps> = ({ from, to, boxes }) => {
    const fromBox = boxes[from];
    const toBox = boxes[to];

    if (!fromBox || !toBox) return null;

    const determineBestSides = (from: Box, to: Box): [Side, Side] => {
        const sides: Side[] = ['top', 'right', 'bottom', 'left'];
        let bestFromSide: Side = 'right';
        let bestToSide: Side = 'left';
        let minDistance = Infinity;

        // Calculate center points of boxes
        const fromCenter = {
            x: from.x + from.width / 2,
            y: from.y + from.height / 2
        };
        const toCenter = {
            x: to.x + to.width / 2,
            y: to.y + to.height / 2
        };

        // Try all possible side combinations
        for (const fromSide of sides) {
            for (const toSide of sides) {
                const fromPoint = getConnectionPoint(from, fromSide);
                const toPoint = getConnectionPoint(to, toSide);
                const distance = getDistance(fromPoint, toPoint);

                // Update if this is the shortest distance found
                if (distance < minDistance) {
                    minDistance = distance;
                    bestFromSide = fromSide;
                    bestToSide = toSide;
                }
            }
        }

        return [bestFromSide, bestToSide];
    };

    const getConnectionPoint = (box: Box, side: Side): Point => {
        const centerX = box.x + box.width / 2;
        const centerY = box.y + box.height / 2;

        switch (side) {
            case 'top':
                return { x: centerX, y: box.y };
            case 'right':
                return { x: box.x + box.width, y: centerY };
            case 'bottom':
                return { x: centerX, y: box.y + box.height };
            case 'left':
                return { x: box.x, y: centerY };
        }
    };

    const getDistance = (p1: Point, p2: Point): number => {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    };

    const [fromSide, toSide] = determineBestSides(fromBox, toBox);
    const startPoint = getConnectionPoint(fromBox, fromSide);
    const endPoint = getConnectionPoint(toBox, toSide);

    // Calculate control points for the bezier curve
    const controlPoint1 = {
        x: startPoint.x + (fromSide === 'right' ? 50 : fromSide === 'left' ? -50 : 0),
        y: startPoint.y + (fromSide === 'bottom' ? 50 : fromSide === 'top' ? -50 : 0)
    };

    const controlPoint2 = {
        x: endPoint.x + (toSide === 'right' ? 50 : toSide === 'left' ? -50 : 0),
        y: endPoint.y + (toSide === 'bottom' ? 50 : toSide === 'top' ? -50 : 0)
    };

    // Generate the SVG path
    const path = `M ${startPoint.x} ${startPoint.y} 
                  C ${controlPoint1.x} ${controlPoint1.y},
                    ${controlPoint2.x} ${controlPoint2.y},
                    ${endPoint.x} ${endPoint.y}`;

    return (
        <svg
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: -1
            }}
        >
            <g>
                <defs>
                    <marker
                        id="arrowhead"
                        markerWidth="10"
                        markerHeight="7"
                        refX="9"
                        refY="3.5"
                        orient="auto"
                    >
                        <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
                    </marker>
                </defs>
                <path
                    d={path}
                    stroke="#666"
                    strokeWidth="2"
                    fill="none"
                    markerEnd="url(#arrowhead)"
                />
            </g>
        </svg>
    );
};

export default Connection;
