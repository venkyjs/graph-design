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

    const HEADER_HEIGHT = 24; // Height of the dataset header
    const COLUMN_HEIGHT = 20; // Height of each column row
    const ROW_PADDING = 4; // Padding for each row (4px top + 4px bottom)
    const HEADER_PADDING = 12; // Additional padding after header
    const CONTAINER_PADDING = 12; // p-3 equals 0.75rem = 12px padding
    const ROW_MARGIN = 0; // Margin between rows

    const getColumnY = (dataset: DatasetWithPosition, columnName?: string): number => {
        if (!columnName) {
            console.log('No column name provided, using dataset center');
            return dataset.y + dataset.height / 2;
        }

        const columnIndex = dataset.columns.findIndex(col => col.name === columnName);
        if (columnIndex === -1) {
            console.warn('Column not found:', columnName, 'in dataset:', dataset);
            return dataset.y + dataset.height / 2;
        }

        console.log('Found column at index:', columnIndex);

        const columnHeight = 24; // Height of each column
        const totalHeight = dataset.columns.length * columnHeight;
        const startY = dataset.y + (dataset.height - totalHeight) / 2;
        const y = startY + columnIndex * columnHeight  + columnHeight / 2;
        
        console.log('Calculated Y position:', { columnHeight, totalHeight, startY, y });
        return y;
    };

    // Calculate connection points - always draw from right edge of source to left edge of target
    const startX = from.x + from.width;  // Right edge of source
    const startY = getColumnY(from, columnName);
    
    let endX = to.x;  // Left edge of target
    const endY = getColumnY(to, columnName);

    // Create curved path with adjusted control points
    const distance = Math.abs(endX - startX);
    const controlPointOffset = Math.min(distance * 0.5, 150);
    
    // Calculate control points for a smoother curve
    const controlPoint1X = startX + controlPointOffset;
    const controlPoint1Y = startY;
    
    const controlPoint2X = endX - controlPointOffset;
    const controlPoint2Y = endY;

    endX = endX - 22;

    // Create the bezier curve path
    const path = `
        M ${startX} ${startY}
        C ${controlPoint1X} ${controlPoint1Y},
          ${controlPoint2X} ${controlPoint2Y},
          ${endX} ${endY}
    `.trim();

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
                        fill="#0066cc"
                    />
                </marker>
            </defs>
            <path
                d={path}
                stroke="#0066cc"
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
