import React, { useRef, useState } from 'react';
import { Box as BoxType } from '../types/graph';

interface BoxProps extends BoxType {
    onDragStart: (e: React.DragEvent, id: string) => void;
    onDrag: (e: React.DragEvent, id: string) => void;
    onColumnClick: (boxId: string, columnName: string) => void;
    highlightedColumn?: string;
}

const Box: React.FC<BoxProps> = ({ 
    id, 
    x, 
    y, 
    width, 
    height, 
    label, 
    columns, 
    onDragStart, 
    onDrag,
    onColumnClick,
    highlightedColumn 
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const dragStartPos = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        const header = target.closest('[data-drag-handle="true"]');
        if (header) {
            setIsDragging(true);
            dragStartPos.current = {
                x: e.clientX - x,
                y: e.clientY - y
            };
            e.preventDefault(); // Prevent text selection
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            const newX = e.clientX - dragStartPos.current.x;
            const newY = e.clientY - dragStartPos.current.y;
            onDrag(newX, newY, id);
            e.preventDefault();
        }
    };

    const handleMouseUp = () => {
        if (isDragging) {
            setIsDragging(false);
        }
    };

    // Add global mouse event listeners when dragging starts
    React.useEffect(() => {
        if (isDragging) {
            const handleGlobalMouseMove = (e: MouseEvent) => {
                const newX = e.clientX - dragStartPos.current.x;
                const newY = e.clientY - dragStartPos.current.y;
                onDrag(newX, newY, id);
            };

            const handleGlobalMouseUp = () => {
                setIsDragging(false);
            };

            document.addEventListener('mousemove', handleGlobalMouseMove);
            document.addEventListener('mouseup', handleGlobalMouseUp);

            return () => {
                document.removeEventListener('mousemove', handleGlobalMouseMove);
                document.removeEventListener('mouseup', handleGlobalMouseUp);
            };
        }
    }, [isDragging, id, onDrag]);

    return (
        <div
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{
                position: 'absolute',
                left: x,
                top: y,
                width: width,
                minHeight: height,
                backgroundColor: 'white',
                border: '2px solid #666',
                borderRadius: '4px',
                zIndex: isDragging ? 1000 : 2,
                userSelect: 'none',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'Arial, sans-serif',
                fontSize: '14px',
                boxShadow: isDragging ? '0 8px 16px rgba(0,0,0,0.2)' : '0 2px 4px rgba(0,0,0,0.1)',
                transition: isDragging ? 'none' : 'box-shadow 0.2s ease',
                cursor: isDragging ? 'grabbing' : 'default'
            }}
        >
            {/* Table Header */}
            <div
                data-drag-handle="true"
                style={{
                    padding: '8px 12px',
                    borderBottom: '2px solid #666',
                    fontWeight: 'bold',
                    backgroundColor: '#f8f9fa',
                    borderTopLeftRadius: '2px',
                    borderTopRightRadius: '2px',
                    textAlign: 'center',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none',
                    userSelect: 'none'
                }}
            >
                <span
                    style={{
                        fontSize: '16px',
                        marginRight: '8px',
                        color: '#666'
                    }}
                >
                    ⋮⋮
                </span>
                {label}
            </div>

            {/* Table Columns */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%'
                }}
            >
                {columns.map((column, index) => (
                    <div
                        key={index}
                        style={{
                            display: 'flex',
                            padding: '2px 12px',
                            borderBottom: index < columns.length - 1 ? '1px solid #dee2e6' : 'none',
                            fontSize: '13px',
                            backgroundColor: highlightedColumn === column.name ? '#e8f4fe' : 'transparent',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease'
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onColumnClick(id, column.name);
                        }}
                        onMouseEnter={(e) => {
                            if (!isDragging) {
                                e.currentTarget.style.backgroundColor = '#f8f9fa';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isDragging) {
                                e.currentTarget.style.backgroundColor = 
                                    highlightedColumn === column.name ? '#e8f4fe' : 'transparent';
                            }
                        }}
                    >
                        <span style={{ 
                            flex: 1,
                            color: highlightedColumn === column.name ? '#0066cc' : 'inherit'
                        }}>
                            {column.name}
                        </span>
                        <span style={{ 
                            color: '#666',
                            marginLeft: '8px',
                            fontStyle: 'italic'
                        }}>
                            {column.type}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Box;
