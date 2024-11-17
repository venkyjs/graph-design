import React from 'react';
import { DatasetWithPosition } from '../types/graph';

interface ColumnConnectionProps {
    from: DatasetWithPosition;
    to: DatasetWithPosition;
    columnName: string;
}

const ColumnConnection: React.FC<ColumnConnectionProps> = ({ from, to, columnName }) => {
    if (!from || !to) {
        console.warn('Missing dataset in column connection');
        return null;
    }

    const HEADER_HEIGHT = 24; // Height of the dataset header
    const COLUMN_HEIGHT = 20; // Height of each column row
    const ROW_PADDING = 4; // Padding for each row (4px top + 4px bottom)
    const HEADER_PADDING = 12; // Additional padding after header
    const CONTAINER_PADDING = 12; // p-3 equals 0.75rem = 12px padding
    const ROW_MARGIN = 0; // Margin between rows

    const getColumnY = (dataset: DatasetWithPosition, columnName: string): number => {
        // Find the exact column we're looking for
        const columnIndex = dataset.columns.findIndex(col => {
            if (col.name === columnName) return true;
            if (col.name === `${columnName}Id`) return true;
            return false;
        });
        
        if (columnIndex === -1) {
            console.warn(`Column ${columnName} not found in dataset ${dataset.id}`);
            return dataset.y + dataset.height / 2;
        }

        // Calculate exact Y position
        return dataset.y + 
               HEADER_HEIGHT + // Account for header
               (HEADER_PADDING * 2) + // Padding after header
               CONTAINER_PADDING + // Container padding (p-3 = 8px)
               (columnIndex * (COLUMN_HEIGHT + (ROW_PADDING * 2) + ROW_MARGIN)) + // Previous columns with padding
               (COLUMN_HEIGHT / 2); // Center of current column
    };

    // Determine if the connection should be reversed based on position
    const shouldReverse = from.x > to.x;
    const [startDataset, endDataset] = shouldReverse ? [to, from] : [from, to];

    // Calculate connection points
    const startX = shouldReverse 
        ? startDataset.x // Left edge
        : startDataset.x + startDataset.width; // Right edge
    const startY = getColumnY(startDataset, columnName);
    
    const endX = shouldReverse 
        ? endDataset.x + endDataset.width // Right edge
        : endDataset.x; // Left edge
    const endY = getColumnY(endDataset, columnName);

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
                zIndex: 2
            }}
        >
            <defs>
                <marker
                    id="column-arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
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
                strokeDasharray="4"
                fill="none"
                markerEnd="url(#column-arrowhead)"
            />
        </svg>
    );
};

export default ColumnConnection;
