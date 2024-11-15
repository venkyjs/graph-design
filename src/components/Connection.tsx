import React from 'react';
import { Box } from '../types/graph';

interface ConnectionProps {
    fromBox: Box;
    toBox: Box;
}

type Side = 'top' | 'right' | 'bottom' | 'left';
type Point = { x: number; y: number };

const Connection: React.FC<ConnectionProps> = ({ fromBox, toBox }) => {
    const getPointForSide = (box: Box, side: Side): Point => {
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

    const findNearestSides = (box1: Box, box2: Box): [Side, Side] => {
        const sides: Side[] = ['top', 'right', 'bottom', 'left'];
        let minDistance = Infinity;
        let bestFromSide: Side = 'right';
        let bestToSide: Side = 'left';

        // Get center points of boxes
        const box1Center = {
            x: box1.x + box1.width / 2,
            y: box1.y + box1.height / 2
        };
        const box2Center = {
            x: box2.x + box2.width / 2,
            y: box2.y + box2.height / 2
        };

        // Calculate angle between centers to prioritize sides
        const angle = Math.atan2(box2Center.y - box1Center.y, box2Center.x - box1Center.x);
        const angleDeg = (angle * 180) / Math.PI;

        // Get candidate sides based on angle
        const getCandidateSides = (angle: number): Side[] => {
            if (angle > -45 && angle <= 45) return ['right', 'left'];
            if (angle > 45 && angle <= 135) return ['bottom', 'top'];
            if (angle > 135 || angle <= -135) return ['left', 'right'];
            return ['top', 'bottom'];
        };

        const primarySides = getCandidateSides(angleDeg);
        const secondarySides = sides.filter(side => !primarySides.includes(side));
        const fromSides = [...primarySides, ...secondarySides];
        const toSides = [...primarySides.slice().reverse(), ...secondarySides];

        // Find the nearest points between candidate sides
        for (const fromSide of fromSides) {
            for (const toSide of toSides) {
                const fromPoint = getPointForSide(box1, fromSide);
                const toPoint = getPointForSide(box2, toSide);
                const distance = getDistance(fromPoint, toPoint);

                if (distance < minDistance) {
                    minDistance = distance;
                    bestFromSide = fromSide;
                    bestToSide = toSide;
                }
            }
        }

        return [bestFromSide, bestToSide];
    };

    const [fromSide, toSide] = findNearestSides(fromBox, toBox);
    const startPoint = getPointForSide(fromBox, fromSide);
    const endPoint = getPointForSide(toBox, toSide);

    // Calculate control points based on the sides and distance
    const distance = getDistance(startPoint, endPoint);
    const controlDistance = Math.min(distance / 2, 100);

    const getControlPoint = (point: Point, side: Side): Point => {
        switch (side) {
            case 'top':
                return { x: point.x, y: point.y - controlDistance };
            case 'right':
                return { x: point.x + controlDistance, y: point.y };
            case 'bottom':
                return { x: point.x, y: point.y + controlDistance };
            case 'left':
                return { x: point.x - controlDistance, y: point.y };
        }
    };

    const controlPoint1 = getControlPoint(startPoint, fromSide);
    const controlPoint2 = getControlPoint(endPoint, toSide);

    // Generate the SVG path
    const path = `M ${startPoint.x} ${startPoint.y} 
                  C ${controlPoint1.x} ${controlPoint1.y},
                    ${controlPoint2.x} ${controlPoint2.y},
                    ${endPoint.x} ${endPoint.y}`;

    const markerId = `arrow-${fromBox.id}-${toBox.id}`;

    return (
        <svg
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0
            }}
        >
            <defs>
                <marker
                    id={markerId}
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
                markerEnd={`url(#${markerId})`}
            />
        </svg>
    );
};

export default Connection;
