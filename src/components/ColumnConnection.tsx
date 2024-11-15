import React from 'react';
import { Box } from '../types/graph';

interface ColumnConnectionProps {
    fromBox: Box & { x: number; y: number };
    toBox: Box & { x: number; y: number };
    columnName: string;
}

const ColumnConnection: React.FC<ColumnConnectionProps> = ({ fromBox, toBox, columnName }) => {
    const calculateControlPoints = () => {
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

        // Find the column positions in both boxes
        const getColumnY = (box: Box & { x: number; y: number }, colName: string): number => {
            const columnIndex = box.columns.findIndex(col => 
                col.name === colName || col.name === `${colName}Id`
            );
            if (columnIndex === -1) return box.y + box.height / 2;
            
            const headerHeight = 40; // Approximate header height
            const columnHeight = 30; // Approximate height per column
            return box.y + headerHeight + (columnIndex * columnHeight) + (columnHeight / 2);
        };

        const fromY = getColumnY(fromBox, columnName);
        const toY = getColumnY(toBox, columnName);

        // Determine if going right to left
        const isRightToLeft = fromBox.x > toBox.x;

        if (isRightToLeft) {
            fromPoint = {
                x: fromBox.x,
                y: fromY
            };
            toPoint = {
                x: toBox.x + toBox.width,
                y: toY
            };
        } else {
            fromPoint = {
                x: fromBox.x + fromBox.width,
                y: fromY
            };
            toPoint = {
                x: toBox.x,
                y: toY
            };
        }

        // Calculate control points
        let control1, control2;
        const curveDistance = Math.abs(fromPoint.x - toPoint.x) * 0.4;

        if (isRightToLeft) {
            // Create a smoother curve for right-to-left connections
            control1 = {
                x: fromPoint.x - curveDistance,
                y: fromPoint.y
            };
            control2 = {
                x: toPoint.x + curveDistance,
                y: toPoint.y
            };
        } else {
            control1 = {
                x: fromPoint.x + curveDistance,
                y: fromPoint.y
            };
            control2 = {
                x: toPoint.x - curveDistance,
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
                    id={`column-arrow-${fromBox.id}-${toBox.id}`}
                    viewBox="0 0 10 10"
                    refX="5"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563eb" />
                </marker>
            </defs>
            <path
                d={`M ${fromPoint.x},${fromPoint.y} C ${control1.x},${control1.y} ${control2.x},${control2.y} ${toPoint.x},${toPoint.y}`}
                stroke="#2563eb"
                strokeWidth="2"
                strokeDasharray="4 2"
                fill="none"
                markerEnd={`url(#column-arrow-${fromBox.id}-${toBox.id})`}
            />
        </svg>
    );
};

export default ColumnConnection;
