import React, { useEffect, useRef } from 'react';
import { Dataset as DatasetType, Column, HighlightedColumn } from '../types/graph';

const COLUMN_HEIGHT = 20;
const ROW_PADDING = 4;
const HEADER_PADDING = 12;
const CONTAINER_PADDING = 12;
const MIN_WIDTH = 200;

interface DatasetProps {
    dataset: DatasetType;
    highlightedColumn: HighlightedColumn | null;
    connectedColumns: Array<{ datasetId: string; columnName: string; }>;
    onColumnClick: (columnName: string, datasetId: string) => void;
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
    highlightedColumn,
    connectedColumns,
    onColumnClick,
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

        // Calculate width needed for header elements
        const titleElement = header.children[0] as HTMLElement;
        const typeElement = header.children[1] as HTMLElement;
        const headerContentWidth = titleElement.offsetWidth + typeElement.offsetWidth + 40; // 40px for padding and gap

        // Calculate width needed for content
        const contentWidth = Math.max(
            ...Array.from(content.children).map(child => child.scrollWidth + (CONTAINER_PADDING * 2))
        );

        // Use the maximum of header width, content width, and MIN_WIDTH
        const maxWidth = Math.max(headerContentWidth, contentWidth, MIN_WIDTH);

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

    const isColumnConnected = (columnName: string) => {
        return connectedColumns.some(col => 
            col.datasetId === dataset.id && col.columnName === columnName
        );
    };

    const isColumnHighlighted = (columnName: string) => {
        return highlightedColumn?.sourceDatasetId === dataset.id && 
               highlightedColumn?.columnName === columnName;
    };

    const getColumnClassName = (columnName: string) => {
        const classes = ['dataset-column flex items-center gap-2 py-1 cursor-pointer px-3'];
        
        if (isColumnHighlighted(columnName)) {
            classes.push('!bg-yellow-200');
        } else if (isColumnConnected(columnName)) {
            classes.push('!bg-blue-200');
        } else {
            classes.push('hover:bg-gray-50');
        }
        
        return classes.join(' ');
    };

    const handleColumnClick = (columnName: string) => (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onColumnClick(columnName, dataset.id);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
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
    };

    return (
        <div
            data-testid={`dataset-${dataset.id}`}
            className="absolute bg-white rounded-lg shadow-md border border-gray-200 cursor-move text-sm"
            onMouseDown={handleMouseDown}
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
                className="flex justify-between items-center px-3 py-2 flex-wrap gap-2 bg-gray-200 rounded-t-lg"
            >
                <div className="font-medium text-gray-700">{dataset.display_name || dataset.name}</div>
                <div className="text-[10px] text-gray-500 italic">{dataset.type}</div>
            </div>

            {/* Content */}
            <div 
                ref={contentRef}
                className="border-t border-gray-100"
            >
                {dataset.columns.map((column, index) => (
                    <div
                        key={column.name}
                        className={getColumnClassName(column.name)}
                        data-testid={`column-${dataset.id}-${column.name}`}
                        data-highlighted={isColumnHighlighted(column.name)}
                        onClick={handleColumnClick(column.name)}
                        onMouseDown={(e) => e.stopPropagation()} // Prevent drag when clicking column
                        style={{ pointerEvents: 'auto' }}
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
