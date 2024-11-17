import React, { useEffect, useRef } from 'react';
import { Dataset as DatasetType, Column } from '../types/graph';

const COLUMN_HEIGHT = 20;
const ROW_PADDING = 4;
const HEADER_PADDING = 12;
const CONTAINER_PADDING = 12;
const MIN_WIDTH = 200;

interface DatasetProps {
    dataset: DatasetType;
    onColumnClick: (datasetId: string, columnName: string) => void;
    highlightedColumn?: { sourceDatasetId: string; columnName: string };
    onDragStart: (e: MouseEvent, dataset: DatasetType) => void;
    onDrag: (e: MouseEvent, dataset: DatasetType) => void;
    onDragEnd: (e: MouseEvent) => void;
    x: number;
    y: number;
}

const Dataset: React.FC<DatasetProps> = ({
    dataset,
    onColumnClick,
    highlightedColumn,
    onDragStart,
    onDrag,
    onDragEnd,
    x,
    y
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
            style={{
                transform: `translate(${x}px, ${y}px)`,
                width: dataset.width,
                minWidth: MIN_WIDTH,
                transition: 'height 0.3s ease, width 0.3s ease',
                userSelect: 'none'
            }}
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
        >
            {/* Header */}
            <div 
                ref={headerRef}
                className="flex justify-between items-center px-3 py-2 flex-wrap gap-2"
            >
                <span className="font-semibold text-gray-700 break-words text-[0.8em]">{dataset.display_name}</span>
                <span className="text-[0.7em] italic text-gray-500 break-all">{dataset.id}</span>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200"></div>

            {/* Columns */}
            <div ref={contentRef} className="p-3 space-y-1">
                {dataset.columns.map((column, index) => (
                    <div
                        key={column.name}
                        className={`flex justify-between items-center px-2 rounded cursor-pointer hover:bg-gray-50 ${
                            isColumnHighlighted(column.name) ? 'bg-blue-50' : ''
                        }`}
                        style={{ height: COLUMN_HEIGHT }}
                        onClick={() => onColumnClick(dataset.id, column.name)}
                    >
                        <span className="text-[0.75em] text-gray-700 break-words">{column.name}</span>
                        <span className="text-[0.65em] text-gray-500 break-all ml-2">{column.type}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dataset;
