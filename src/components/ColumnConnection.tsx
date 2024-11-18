import React from 'react';
import { DatasetWithPosition } from '../types/graph';

interface ColumnConnectionProps {
    from: DatasetWithPosition;
    to: DatasetWithPosition;
    columnName: string;
    fromId?: string;
    toId?: string;
}

const ColumnConnection: React.FC<ColumnConnectionProps> = ({ from, to, columnName, fromId, toId }) => {
    if (!from || !to) {
        console.warn('Missing dataset in column connection');
        return null;
    }

    console.log('Rendering column connection:', { from, to, columnName, fromId, toId });

    const getColumnY = (dataset: DatasetWithPosition, columnName: string): number => {
        const columnIndex = dataset.columns.findIndex(col => col.name === columnName);
        if (columnIndex === -1) return 0;
        
        const HEADER_HEIGHT = 50; // Height of the header
        const SEARCH_BOX_HEIGHT = 52; // Height of search box
        const COLUMN_HEIGHT = 20; // Height of each column
        const ROW_PADDING = 4; // Padding between rows
        
        return dataset.y + HEADER_HEIGHT + SEARCH_BOX_HEIGHT + 
               (columnIndex * (COLUMN_HEIGHT + ROW_PADDING)) + 
               (COLUMN_HEIGHT / 2); // Center of the column
    };

    // Calculate connection points - always draw from right edge of source to left edge of target
    const startX = from.x + from.width;  // Right edge of source
    const startY = getColumnY(from, columnName);
    
    let endX = to.x;  // Left edge of target
    const endY = getColumnY(to, columnName);

    // Calculate control points for the curve
    const controlPoint1X = startX + 50;
    const controlPoint2X = endX - 50;

    const path = `M ${startX} ${startY} C ${controlPoint1X} ${startY}, ${controlPoint2X} ${endY}, ${endX} ${endY}`;

    return (
        <svg
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 10,
                overflow: 'visible'
            }}
        >
            <defs>
                <marker
                    id={`column-arrowhead-${fromId}-${toId}`}
                    markerWidth="10"
                    markerHeight="7"
                    refX="0"
                    refY="3.5"
                    orient="auto"
                >
                    <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill="#3B82F6"
                    />
                </marker>
            </defs>
            <path
                d={path}
                stroke="#3B82F6"
                strokeWidth="2"
                fill="none"
                markerEnd={`url(#column-arrowhead-${fromId}-${toId})`}
                style={{
                    strokeDasharray: '4,4',
                    pointerEvents: 'none'
                }}
            />
        </svg>
    );
};

export default ColumnConnection;
