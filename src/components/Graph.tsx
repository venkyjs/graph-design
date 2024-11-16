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
        const SPACING_X = 350; // Horizontal spacing between boxes
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
        
        // Build a directed graph of connected boxes
        const connectedBoxes = new Map<string, Set<string>>();
        const directedConnections = new Set<string>(); // Store directed edges as "from-to" strings
        
        config.connections.forEach(conn => {
            if (!connectedBoxes.has(conn.from)) {
                connectedBoxes.set(conn.from, new Set());
            }
            if (!connectedBoxes.has(conn.to)) {
                connectedBoxes.set(conn.to, new Set());
            }
            // Store both directions for traversal
            connectedBoxes.get(conn.from)?.add(conn.to);
            connectedBoxes.get(conn.to)?.add(conn.from);
            // Store original direction
            directedConnections.add(`${conn.from}-${conn.to}`);
        });

        // Function to find valid paths where all boxes in the path have the column
        const findValidPaths = (
            startId: string,
            visited: Set<string> = new Set(),
            currentPath: string[] = []
        ) => {
            visited.add(startId);
            currentPath.push(startId);

            const currentBox = boxes[startId];
            const hasColumn = currentBox.columns.some(col => 
                col.name === highlightedColumn.columnName ||
                col.name === `${highlightedColumn.columnName}Id`
            );

            if (!hasColumn) {
                visited.delete(startId);
                currentPath.pop();
                return;
            }

            // For each valid path found, create connections
            if (currentPath.length > 1) {
                for (let i = 0; i < currentPath.length - 1; i++) {
                    const fromBoxId = currentPath[i];
                    const toBoxId = currentPath[i + 1];
                    
                    // Check the original direction in the config
                    const isForward = directedConnections.has(`${fromBoxId}-${toBoxId}`);
                    const isReverse = directedConnections.has(`${toBoxId}-${fromBoxId}`);
                    
                    if (isForward || isReverse) {
                        connections.push({
                            from: boxes[isForward ? fromBoxId : toBoxId],
                            to: boxes[isForward ? toBoxId : fromBoxId],
                            columnName: highlightedColumn.columnName
                        });
                    }
                }
            }

            // Continue exploring neighbors
            const neighbors = connectedBoxes.get(startId) || new Set();
            neighbors.forEach(neighborId => {
                if (!visited.has(neighborId)) {
                    findValidPaths(neighborId, visited, currentPath);
                }
            });

            visited.delete(startId);
            currentPath.pop();
        };

        // Start the path finding from the source box
        findValidPaths(sourceBox.id);

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
