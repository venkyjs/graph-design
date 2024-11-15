import React from 'react';
import { Box as BoxType } from '../types/graph';

interface BoxProps extends BoxType {
    onDragStart: (e: React.DragEvent, id: string) => void;
    onDrag: (e: React.DragEvent, id: string) => void;
    columns: { name: string; type: string }[];
}

const Box: React.FC<BoxProps> = ({ id, x, y, width, height, label, columns, onDragStart, onDrag }) => {
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, id)}
            onDrag={(e) => onDrag(e, id)}
            style={{
                position: 'absolute',
                left: x,
                top: y,
                width: width,
                minHeight: height,
                backgroundColor: 'white',
                border: '2px solid #666',
                borderRadius: '4px',
                zIndex: 2,
                cursor: 'move',
                userSelect: 'none',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'Arial, sans-serif',
                fontSize: '14px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
        >
            {/* Table Header */}
            <div
                style={{
                    padding: '8px 12px',
                    borderBottom: '2px solid #666',
                    fontWeight: 'bold',
                    backgroundColor: '#f8f9fa',
                    borderTopLeftRadius: '2px',
                    borderTopRightRadius: '2px',
                    textAlign: 'center'
                }}
            >
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
                            padding: '6px 12px',
                            borderBottom: index < columns.length - 1 ? '1px solid #dee2e6' : 'none',
                            fontSize: '13px'
                        }}
                    >
                        <span style={{ flex: 1 }}>{column.name}</span>
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
