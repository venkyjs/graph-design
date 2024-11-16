import React, { useState, useEffect } from 'react';
import { Box as BoxType, Connection as ConnectionType, GraphConfig } from '../types/graph';
import Box from './Box';
import Connection from './Connection';
import ColumnConnection from './ColumnConnection';

interface GraphProps {
    config: GraphConfig;
}

interface BoxWithPosition extends BoxType {
    x: number;
    y: number;
}

interface ColumnHighlight {
    columnName: string;
    sourceBoxId: string;
}

const Graph: React.FC<GraphProps> = ({ config }) => {
    const [boxes, setBoxes] = useState<{ [key: string]: BoxWithPosition }>({});
    const [highlightedColumn, setHighlightedColumn] = useState<ColumnHighlight | null>(null);

    // Initialize box positions once when component mounts
    useEffect(() => {
        const SPACING_X = 250;
        const SPACING_Y = 200;
        const START_X = 100;
        const START_Y = 100;

        // Create a simple left-to-right layout
        const newBoxes = config.boxes.reduce((acc, box, index) => {
            acc[box.id] = {
                ...box,
                x: START_X + (index * SPACING_X),
                y: START_Y
            };
            return acc;
        }, {} as { [key: string]: BoxWithPosition });

        setBoxes(newBoxes);
    }, [config]);

    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData('text/plain', id);
        const dragImage = document.createElement('div');
        dragImage.style.opacity = '0';
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 0, 0);
        document.body.removeChild(dragImage);
    };

    const handleDrag = (newX: number, newY: number, id: string) => {
        setBoxes(prevBoxes => ({
            ...prevBoxes,
            [id]: {
                ...prevBoxes[id],
                x: newX,
                y: newY
            }
        }));
    };

    const handleColumnClick = (boxId: string, columnName: string) => {
        if (highlightedColumn?.columnName === columnName && highlightedColumn?.sourceBoxId === boxId) {
            setHighlightedColumn(null);
        } else {
            setHighlightedColumn({ columnName, sourceBoxId: boxId });
        }
    };

    // Find boxes that have the highlighted column
    const getColumnConnections = () => {
        if (!highlightedColumn) return [];
        
        const sourceBox = boxes[highlightedColumn.sourceBoxId];
        if (!sourceBox) return [];

        const connections: Array<{ from: BoxWithPosition, to: BoxWithPosition, columnName: string }> = [];
        
        Object.values(boxes).forEach(targetBox => {
            if (targetBox.id === sourceBox.id) return;
            
            const hasColumn = targetBox.columns.some(col => 
                col.name === highlightedColumn.columnName ||
                col.name === `${highlightedColumn.columnName}Id`
            );
            
            if (hasColumn) {
                connections.push({
                    from: sourceBox,
                    to: targetBox,
                    columnName: highlightedColumn.columnName
                });
            }
        });

        return connections;
    };

    return (
        <div 
            style={{ 
                position: 'relative', 
                width: '100%', 
                height: '100vh',
                backgroundColor: 'white',
                overflow: 'hidden'
            }}
        >
            {Object.values(boxes).length > 0 && (
                <>
                    {/* Regular connections */}
                    {config.connections.map((conn, index) => {
                        const fromBox = boxes[conn.from];
                        const toBox = boxes[conn.to];
                        
                        if (!fromBox || !toBox) return null;
                        
                        return (
                            <Connection
                                key={`${conn.from}-${conn.to}-${index}`}
                                fromBox={fromBox}
                                toBox={toBox}
                            />
                        );
                    })}

                    {/* Column connections */}
                    {getColumnConnections().map((conn, index) => (
                        <ColumnConnection
                            key={`column-${conn.from.id}-${conn.to.id}-${index}`}
                            fromBox={conn.from}
                            toBox={conn.to}
                            columnName={conn.columnName}
                        />
                    ))}

                    {/* Boxes */}
                    {Object.values(boxes).map(box => (
                        <Box
                            key={box.id}
                            {...box}
                            onDragStart={handleDragStart}
                            onDrag={handleDrag}
                            onColumnClick={handleColumnClick}
                            highlightedColumn={highlightedColumn?.columnName}
                        />
                    ))}
                </>
            )}
        </div>
    );
};

export default Graph;
