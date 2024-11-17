import React, { useState, useEffect, useRef } from 'react';
import { Dataset as DatasetType, Connection as ConnectionType, GraphConfig, HighlightedColumn } from '../types/graph';
import Dataset from './Dataset';
import Connection from './Connection';
import ColumnConnection from './ColumnConnection';

interface GraphProps {
    config: GraphConfig;
}

interface DatasetWithPosition extends DatasetType {
    x: number;
    y: number;
}

interface ViewportState {
    scale: number;
    translateX: number;
    translateY: number;
}

const calculateDatasetPositions = (config: GraphConfig) => {
    const newDatasets: { [key: string]: DatasetWithPosition } = {};
    const HORIZONTAL_SPACING = 350; // Increased from 250 to 350
    const VERTICAL_SPACING = 150;  // Increased from 50 to 150
    
    // First, identify all unique levels and group datasets by level
    const levels: { [level: number]: string[] } = {};
    const visited = new Set<string>();
    
    // Helper function to get the level of a dataset
    const getLevel = (datasetId: string, level: number = 0) => {
        if (visited.has(datasetId)) return;
        visited.add(datasetId);
        
        levels[level] = levels[level] || [];
        levels[level].push(datasetId);
        
        // Find all connected datasets
        const connections = config.connections.filter(conn => conn.from === datasetId);
        connections.forEach((conn, index) => {
            getLevel(conn.to, level + 1);
        });
    };
    
    // Start with datasets that have no incoming connections (root nodes)
    const rootDatasets = config.datasets.filter(d => 
        !config.connections.some(conn => conn.to === d.id)
    );
    rootDatasets.forEach(d => getLevel(d.id));
    
    // Calculate positions for each level
    Object.entries(levels).forEach(([levelStr, datasetIds]) => {
        const level = parseInt(levelStr);
        const x = level * HORIZONTAL_SPACING + 50; // Add some initial padding
        
        datasetIds.forEach((datasetId, index) => {
            const dataset = config.datasets.find(d => d.id === datasetId);
            if (!dataset) return;
            
            // Get all incoming connections to this dataset
            const incomingConnections = config.connections.filter(conn => conn.to === datasetId);
            
            // If this dataset has incoming connections, align it with its source
            if (incomingConnections.length > 0) {
                const sourceDataset = newDatasets[incomingConnections[0].from];
                if (sourceDataset) {
                    // For input_flow datasets that share the same source, stack them vertically
                    const siblingConnections = config.connections.filter(
                        conn => conn.from === incomingConnections[0].from
                    );
                    const siblingIndex = siblingConnections.findIndex(conn => conn.to === datasetId);
                    const y = sourceDataset.y + (siblingIndex * (dataset.height + VERTICAL_SPACING));
                    
                    newDatasets[datasetId] = {
                        ...dataset,
                        x,
                        y
                    };
                }
            } else {
                // For root datasets or those without incoming connections
                newDatasets[datasetId] = {
                    ...dataset,
                    x,
                    y: index * (dataset.height + VERTICAL_SPACING) + 50 // Add some initial padding
                };
            }
        });
    });
    
    return newDatasets;
};

const Graph: React.FC<GraphProps> = ({ config }) => {
    const [datasets, setDatasets] = useState<{ [key: string]: DatasetWithPosition }>(() => {
        console.log('Initializing datasets with config:', config);
        return calculateDatasetPositions(config);
    });

    const [highlightedColumn, setHighlightedColumn] = useState<HighlightedColumn | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [viewport, setViewport] = useState<ViewportState>({
        scale: 1,
        translateX: 0,
        translateY: 0
    });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const [isBackgroundClicked, setIsBackgroundClicked] = useState(false);

    // Add wheel event listener with { passive: false }
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheelEvent = (e: WheelEvent) => {
            e.preventDefault();
            const zoomSensitivity = 0.001;
            const delta = -e.deltaY * zoomSensitivity;
            const newScale = Math.min(Math.max(viewport.scale + delta, 0.1), 2);

            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const scaleChange = newScale - viewport.scale;
            const newTranslateX = viewport.translateX - (mouseX * scaleChange);
            const newTranslateY = viewport.translateY - (mouseY * scaleChange);

            setViewport({
                scale: newScale,
                translateX: newTranslateX,
                translateY: newTranslateY
            });
        };

        container.addEventListener('wheel', handleWheelEvent, { passive: false });
        return () => container.removeEventListener('wheel', handleWheelEvent);
    }, [viewport]);

    // Handle pan with left or right click on background
    const handleMouseDown = (e: React.MouseEvent) => {
        // Only start panning if clicking the background (not a dataset)
        if (e.target === containerRef.current || e.target === containerRef.current?.firstChild) {
            e.preventDefault();
            setIsPanning(true);
            setPanStart({ x: e.clientX - viewport.translateX, y: e.clientY - viewport.translateY });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning) {
            e.preventDefault();
            setViewport(prev => ({
                ...prev,
                translateX: e.clientX - panStart.x,
                translateY: e.clientY - panStart.y
            }));
        }
    };

    const handleMouseUp = () => {
        setIsPanning(false);
    };

    // Prevent context menu on right click
    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
    };

    const handleDragStart = (e: React.DragEvent, id: string) => {
        const dataset = datasets[id];
        if (!dataset) return;

        setIsDragging(true);
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    const handleDrag = (x: number, y: number, id: string) => {
        if (!isDragging) return;

        setDatasets(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                x: x,
                y: y
            }
        }));
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    const handleColumnClick = (datasetId: string, columnName: string) => {
        setHighlightedColumn(prev => 
            prev?.sourceDatasetId === datasetId && prev.columnName === columnName
                ? null // Toggle off if clicking the same column
                : { sourceDatasetId: datasetId, columnName }
        );
    };

    const getColumnConnections = () => {
        if (!highlightedColumn) return [];

        const connections: Array<{
            from: DatasetWithPosition;
            to: DatasetWithPosition;
            columnName: string;
        }> = [];

        const sourceDataset = datasets[highlightedColumn.sourceDatasetId];
        if (!sourceDataset) return [];

        // Helper to get all connected datasets recursively
        const getAllConnectedDatasets = (datasetId: string, visited = new Set<string>()): string[] => {
            if (visited.has(datasetId)) return [];
            visited.add(datasetId);

            const directConnections = config.connections
                .filter(conn => conn.from === datasetId || conn.to === datasetId)
                .map(conn => conn.from === datasetId ? conn.to : conn.from);

            const allConnections = [...directConnections];
            directConnections.forEach(connectedId => {
                if (!visited.has(connectedId)) {
                    const furtherConnections = getAllConnectedDatasets(connectedId, visited);
                    allConnections.push(...furtherConnections);
                }
            });

            return allConnections;
        };

        // Get all datasets in the connected graph that have the matching column
        const allConnectedIds = getAllConnectedDatasets(sourceDataset.id);
        const connectedDatasets = [...new Set([sourceDataset.id, ...allConnectedIds])]
            .map(id => datasets[id])
            .filter(dataset => dataset && dataset.columns.some(col => 
                col.name === highlightedColumn.columnName || 
                col.name === `${highlightedColumn.columnName}Id`
            ))
            .sort((a, b) => a.x - b.x);

        // Create connections between adjacent datasets with matching columns
        for (let i = 0; i < connectedDatasets.length - 1; i++) {
            const current = connectedDatasets[i];
            const next = connectedDatasets[i + 1];

            // Check if these datasets are connected in the config
            const isDirectlyConnected = config.connections.some(conn => 
                (conn.from === current.id && conn.to === next.id) ||
                (conn.from === next.id && conn.to === current.id)
            );

            // If they're connected (directly or through other datasets), add the connection
            if (isDirectlyConnected || getAllConnectedDatasets(current.id).includes(next.id)) {
                connections.push({
                    from: current,
                    to: next,
                    columnName: highlightedColumn.columnName
                });
            }
        }

        return connections;
    };

    const getConnections = () => {
        return config.connections.map(connection => ({
            from: connection.from,
            to: connection.to,
        }));
    };

    return (
        <div 
            ref={containerRef}
            className="relative w-full h-full bg-gray-50 overflow-hidden"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onContextMenu={handleContextMenu}
            style={{
                cursor: isPanning ? 'grabbing' : 'grab'
            }}
        >
            <div
                className="absolute w-full h-full"
                style={{
                    transform: `translate(${viewport.translateX}px, ${viewport.translateY}px) scale(${viewport.scale})`,
                    transformOrigin: '0 0',
                    transition: 'transform 0.1s ease-out'
                }}
            >
                {/* Render datasets */}
                {Object.values(datasets).map((dataset) => (
                    <Dataset
                        key={dataset.id}
                        dataset={dataset}
                        onColumnClick={handleColumnClick}
                        highlightedColumn={highlightedColumn}
                        onDragStart={(e, d) => handleDragStart(e, d.id)}
                        onDrag={(e, d) => {
                            const rect = (e.target as HTMLElement).getBoundingClientRect();
                            handleDrag(e.clientX - rect.width / 2, e.clientY - rect.height / 2, d.id);
                        }}
                        onDragEnd={handleDragEnd}
                        x={dataset.x}
                        y={dataset.y}
                    />
                ))}

                {/* Render connections */}
                {getConnections().map((connection, index) => (
                    <Connection
                        key={`${connection.from}-${connection.to}-${index}`}
                        from={datasets[connection.from]}
                        to={datasets[connection.to]}
                    />
                ))}

                {/* Render column connections */}
                {getColumnConnections().map((connection, index) => (
                    <ColumnConnection
                        key={`col-${connection.from.id}-${connection.to.id}-${index}`}
                        from={connection.from}
                        to={connection.to}
                        columnName={connection.columnName}
                    />
                ))}
            </div>
        </div>
    );
};

export default Graph;
