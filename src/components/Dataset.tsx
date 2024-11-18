import React, { useEffect, useRef, useState } from 'react';
import { Dataset as DatasetType, Column, HighlightedColumn } from '../types/graph';

const COLUMN_HEIGHT = 20;
const ROW_PADDING = 4;
const HEADER_PADDING = 12;
const CONTAINER_PADDING = 12;
const SHOW_MORE_HEIGHT = 32; // Height for Show More/Less link
const MIN_WIDTH = 300;

interface DatasetProps {
    dataset: DatasetType;
    highlightedColumn: HighlightedColumn | null;
    connectedColumns: Array<{ datasetId: string; columnName: string; }>;
    onColumnClick: (columnName: string, datasetId: string) => void;
    onDragStart: (e: MouseEvent, dataset: DatasetType) => void;
    onDrag: (e: MouseEvent, dataset: DatasetType) => void;
    onDragEnd: (e: MouseEvent) => void;
    onHeightChange?: (datasetId: string, newHeight: number) => void;
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
    onHeightChange,
    x,
    y,
    width,
    height
}) => {
    const headerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [boxHeight, setBoxHeight] = useState(height);

    // Calculate width only once on mount
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
    }, []); // Empty dependency array means this runs once on mount

    // Handle height changes separately
    useEffect(() => {
        const newHeight = calculateHeight(dataset.columns);
        setBoxHeight(newHeight);
        
        // Notify parent of height change
        if (onHeightChange && newHeight !== height) {
            onHeightChange(dataset.id, newHeight);
        }
    }, [dataset.columns, isExpanded, height, onHeightChange]);

    // Calculate dynamic height based on header and columns
    const calculateHeight = (columns: Column[]): number => {
        const headerHeight = headerRef.current?.offsetHeight || 0;
        const visibleColumns = isExpanded ? columns.length : Math.min(3, columns.length);
        
        return headerHeight + // Header height
               (visibleColumns * COLUMN_HEIGHT) + // Height for visible columns
               ((visibleColumns - 1) * ROW_PADDING) + // Padding between columns
               (CONTAINER_PADDING * 2) + // Top and bottom padding
               (columns.length > 3 ? SHOW_MORE_HEIGHT : 0) + // Show More/Less link height
               4; // Extra padding for border
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

    const handleShowMore = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    return (
        <div
            data-testid={`dataset-${dataset.id}`}
            className="absolute bg-white rounded-lg shadow-md border border-gray-200 cursor-move text-sm overflow-hidden"
            onMouseDown={handleMouseDown}
            style={{
                transform: `translate(${x}px, ${y}px)`,
                width: `${width}px`,
                height: `${boxHeight}px`,
                position: 'absolute',
                userSelect: 'none',
                minWidth: MIN_WIDTH,
                maxWidth: width,
                transition: 'height 0.3s ease-in-out'
            }}
        >
            {/* Header */}
            <div 
                ref={headerRef}
                className="flex justify-between items-center px-3 py-2 gap-4 bg-gray-200 rounded-t-lg"
            >
                <div className="font-medium text-gray-700 truncate">{dataset.display_name || dataset.name}</div>
                <div className="text-[10px] text-gray-500 italic whitespace-nowrap">{dataset.type}</div>
            </div>

            {/* Content */}
            <div 
                ref={contentRef}
                className="border-t border-gray-100 flex flex-col relative"
                style={{
                    height: `${boxHeight - (headerRef.current?.offsetHeight || 0)}px`,
                    overflow: 'hidden'
                }}
            >
                <div className="flex-1 overflow-y-auto">
                    <div className="flex flex-col">
                        {dataset.columns.slice(0, isExpanded ? undefined : 3).map((column, index) => (
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
                {dataset.columns.length > 3 && (
                    <div
                        className={`dataset-column flex items-center justify-center py-2 cursor-pointer px-3 text-blue-600 hover:bg-gray-50 ${isExpanded ? 'border-t border-gray-100 bg-white' : ''}`}
                        onClick={handleShowMore}
                        onMouseDown={(e) => e.stopPropagation()}
                        style={{
                            width: '100%',
                            height: `${SHOW_MORE_HEIGHT}px`,
                            boxShadow: isExpanded ? '0 -4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
                        }}
                    >
                        {isExpanded ? 'Show Less' : `Show ${dataset.columns.length - 3} More`}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dataset;
