import React from 'react';
import { Box } from '../types/graph';

interface ColumnConnectionProps {
    fromBox: Box & { x: number; y: number };
    toBox: Box & { x: number; y: number };
    columnName: string;
}

const ColumnConnection: React.FC<ColumnConnectionProps> = ({ fromBox, toBox, columnName }) => {
    const headerHeight = 40; // Height of the header area

    const calculatePoints = () => {
        // Find the column positions in both boxes
        const getColumnY = (box: Box & { x: number; y: number }, colName: string): number => {
            const columnIndex = box.columns.findIndex(col => 
                col.name === colName || col.name === `${colName}Id`
            );
            if (columnIndex === -1) return box.y + headerHeight / 2;
            
            return box.y + headerHeight + (columnIndex * 30) + 15; // 30px per column, centered
        };

        const fromY = getColumnY(fromBox, columnName);
        const toY = getColumnY(toBox, columnName);

        // Determine if going right to left
        const isRightToLeft = fromBox.x > toBox.x;

        let fromPoint = {
            x: isRightToLeft ? fromBox.x : fromBox.x + fromBox.width,
            y: fromY
        };

        let toPoint = {
            x: isRightToLeft ? toBox.x + toBox.width : toBox.x,
            y: toY
        };

        // Calculate control points for smooth curve
        const dx = Math.abs(fromPoint.x - toPoint.x);
        const curveDistance = Math.min(dx * 0.4, 80); // Slightly tighter curves for columns

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
