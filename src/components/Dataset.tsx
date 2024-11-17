import React from 'react';
import { DatasetWithPosition, Column, HighlightedColumn } from '../types/graph';

interface DatasetProps {
    dataset: DatasetWithPosition;
    onDragStart: (e: React.MouseEvent, id: string) => void;
    onDrag: (newX: number, newY: number, id: string) => void;
    onColumnClick: (datasetId: string, columnName: string) => void;
    highlightedColumn: HighlightedColumn | null;
}

const Dataset: React.FC<DatasetProps> = ({ 
    dataset,
    onDragStart,
    onDrag,
    onColumnClick,
    highlightedColumn 
}) => {
    const {
        id,
        x,
        y,
        width,
        height,
        type,
        display_name,
        columns = [] // Provide default empty array
    } = dataset;

    const [isDragging, setIsDragging] = React.useState(false);
    const dragStartPos = React.useRef({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('[data-drag-handle="true"]')) {
            e.preventDefault();
            setIsDragging(true);
            dragStartPos.current = { x: e.clientX - x, y: e.clientY - y };
            onDragStart(e, id);
        }
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (isDragging) {
            const newX = e.clientX - dragStartPos.current.x;
            const newY = e.clientY - dragStartPos.current.y;
            onDrag(newX, newY, id);
        }
    };

    const handleMouseUp = () => {
        if (isDragging) {
            setIsDragging(false);
        }
    };

    const isColumnHighlighted = (columnName: string): boolean => {
        if (!highlightedColumn) return false;
        if (highlightedColumn.sourceDatasetId !== id) return false;
        return highlightedColumn.columnName === columnName;
    };

    React.useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        } else {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    return (
        <div
            className="absolute border-2 border-gray-300 bg-white rounded-lg shadow-lg"
            style={{
                left: x,
                top: y,
                width,
                height,
                cursor: isDragging ? 'grabbing' : 'grab'
            }}
            onMouseDown={handleMouseDown}
        >
            {/* Dataset Header */}
            <div 
                className="px-4 py-2 bg-gray-100 border-b-2 border-gray-300 rounded-t-lg flex justify-between items-center"
                data-drag-handle="true"
            >
                <div className="font-semibold text-gray-700">{display_name}</div>
                <div className="text-sm text-gray-500 italic">{type}</div>
            </div>

            {/* Dataset Columns */}
            <div className="p-3">
                {columns.map((column, index) => (
                    <div
                        key={`${id}-${column.name}`}
                        className={`px-2 py-1 cursor-pointer rounded transition-colors ${
                            isColumnHighlighted(column.name)
                                ? 'bg-blue-100 hover:bg-blue-200'
                                : 'hover:bg-gray-100'
                        }`}
                        onClick={() => onColumnClick(id, column.name)}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">{column.name}</span>
                            <span className="text-xs text-gray-500">{column.type}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dataset;
