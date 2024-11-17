import React, { useEffect, useRef } from 'react';
import { Dataset as DatasetType, Column } from '../types/graph';

const COLUMN_HEIGHT = 20;
const ROW_PADDING = 4;
const HEADER_PADDING = 12;
const CONTAINER_PADDING = 12;
const MIN_WIDTH = 200;

interface DatasetProps {
    dataset: DatasetType;
    onColumnClick: (columnName: string, e: MouseEvent) => void;
    highlightedColumn?: { sourceDatasetId: string; columnName: string };
    onDragStart: (e: MouseEvent, dataset: DatasetType) => void;
    onDrag: (e: MouseEvent, dataset: DatasetType) => void;
    onDragEnd: (e: MouseEvent) => void;
    x: number;
    y: number;
    width: number;
    height: number;
}

const Dataset: React.FC<DatasetProps> = ({
    dataset,
    onColumnClick,
    highlightedColumn,
    onDragStart,
    onDrag,
    onDragEnd,
    x,
    y,
    width,
    height
}) => {
    const headerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const header = headerRef.current;
        const content = contentRef.current;
        if (!header || !content) return;

        // Calculate maximum width needed for header and content
        const headerWidth = Math.max(
            header.scrollWidth + (HEADER_PADDING * 2),
            MIN_WIDTH
        );

        const contentWidth = Math.max(
            ...Array.from(content.children).map(child => child.scrollWidth + (HEADER_PADDING * 2)),
            MIN_WIDTH
        );

        const maxWidth = Math.max(headerWidth, contentWidth);

        // Update dataset width if different from current
        if (maxWidth !== dataset.width) {
            dataset.width = maxWidth;
        }
    }, [dataset]);

    // Calculate dynamic height based on header and columns
    const calculateHeight = (columns: Column[]): number => {
        const headerHeight = headerRef.current?.offsetHeight || 0;
        return headerHeight + // Dynamic header height
               HEADER_PADDING * 2 + // Header padding
               columns.length * COLUMN_HEIGHT + // Total height of all columns
               (columns.length - 1) * ROW_PADDING + // Padding between columns
               CONTAINER_PADDING * 2; // Container padding
    };

    const isColumnHighlighted = (columnName: string) => {
        return highlightedColumn?.sourceDatasetId === dataset.id && 
               highlightedColumn?.columnName === columnName;
    };

    return (
        <div
            className="absolute bg-white rounded-lg shadow-md border border-gray-200 cursor-move text-sm"
            onMouseDown={(e) => {
                // Only handle left mouse button
                if (e.button !== 0) return;
                
                e.preventDefault();
                e.stopPropagation();
                
                // Start the drag
                onDragStart(e.nativeEvent, dataset);
                
                // Handle mouse move for dragging
                const handleMouseMove = (moveEvent: MouseEvent) => {
                    moveEvent.preventDefault();
                    moveEvent.stopPropagation();
                    
                    // Ensure the event target is still valid
                    if (!moveEvent.target) return;
                    
                    onDrag(moveEvent, dataset);
                };
                
                // Handle mouse up for drop
                const handleMouseUp = (upEvent: MouseEvent) => {
                    upEvent.preventDefault();
                    upEvent.stopPropagation();
                    
                    // Clean up event listeners first
                    document.removeEventListener('mousemove', handleMouseMove, true);
                    document.removeEventListener('mouseup', handleMouseUp, true);
                    
                    onDragEnd(upEvent);
                };
                
                // Add event listeners with capture phase to ensure they're handled first
                document.addEventListener('mousemove', handleMouseMove, true);
                document.addEventListener('mouseup', handleMouseUp, true);
            }}
            style={{
                transform: `translate(${x}px, ${y}px)`,
                width: `${width}px`,
                height: `${height}px`,
                position: 'absolute',
                userSelect: 'none',
                minWidth: MIN_WIDTH,
                maxWidth: width,
            }}
        >
            {/* Header */}
            <div 
                ref={headerRef}
                className="flex justify-between items-center px-3 py-2 flex-wrap gap-2"
            >
                <div className="font-medium text-gray-700">{dataset.display_name || dataset.name}</div>
            </div>

            {/* Content */}
            <div 
                ref={contentRef}
                className="px-3 py-2 border-t border-gray-100"
            >
                {dataset.columns.map((column, index) => (
                    <div
                        key={column.name}
                        className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 rounded px-1"
                        onClick={(e) => onColumnClick(column.name, e)}
                    >
                        <div className="text-gray-600">{column.name}</div>
                        <div className="text-gray-400 text-xs">{column.type}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dataset;
