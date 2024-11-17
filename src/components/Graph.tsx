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
    const isDraggingRef = useRef(false);
    const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
    const [dragStartDatasetPos, setDragStartDatasetPos] = useState({ x: 0, y: 0 });
    const [viewport, setViewport] = useState<ViewportState>({
        scale: 1,
        translateX: 0,
        translateY: 0
    });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const [isBackgroundClicked, setIsBackgroundClicked] = useState(false);

    const calculateInitialViewport = () => {
        if (!containerRef.current || Object.keys(datasets).length === 0) return null;

        // Get container dimensions
        const containerRect = containerRef.current.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;

        // Calculate bounding box of all datasets
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        Object.values(datasets).forEach(dataset => {
            minX = Math.min(minX, dataset.x);
            maxX = Math.max(maxX, dataset.x + dataset.width);
            minY = Math.min(minY, dataset.y);
            maxY = Math.max(maxY, dataset.y + dataset.height);
        });

        // Add padding
        const padding = 50;
        const contentWidth = maxX - minX + (padding * 2);
        const contentHeight = maxY - minY + (padding * 2);

        // Calculate scale needed to fit content
        const scaleX = containerWidth / contentWidth;
        const scaleY = containerHeight / contentHeight;
        const scale = Math.min(scaleX, scaleY, 1); // Cap at 1 to prevent zooming in

        // Calculate translation to center content
        const translateX = (containerWidth - (contentWidth * scale)) / 2 - (minX * scale) + padding;
        const translateY = (containerHeight - (contentHeight * scale)) / 2 - (minY * scale) + padding;

        return {
            scale,
            translateX,
            translateY
        };
    };

    // Set initial viewport on mount and when datasets change
    useEffect(() => {
        const initialViewport = calculateInitialViewport();
        if (initialViewport) {
            setViewport(initialViewport);
        }
    }, [datasets]);

    // Add wheel event listener with { passive: false }
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheelEvent = (e: WheelEvent) => {
            e.preventDefault();
            const zoomSensitivity = 0.002; // Doubled from 0.001 to 0.002
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

    const handleDragStart = (e: MouseEvent, dataset: DatasetType) => {
        if (!containerRef.current) return;
        console.log('Drag started');
        
        const containerRect = containerRef.current.getBoundingClientRect();
        const mouseX = (e.clientX - containerRect.left - viewport.translateX) / viewport.scale;
        const mouseY = (e.clientY - containerRect.top - viewport.translateY) / viewport.scale;
        
        isDraggingRef.current = true;
        setDragStartPos({
            x: mouseX,
            y: mouseY
        });
        setDragStartDatasetPos({
            x: dataset.x,
            y: dataset.y
        });
    };

    const handleDrag = (e: MouseEvent, dataset: DatasetType) => {
        if (!isDraggingRef.current || !containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const mouseX = (e.clientX - containerRect.left - viewport.translateX) / viewport.scale;
        const mouseY = (e.clientY - containerRect.top - viewport.translateY) / viewport.scale;

        const deltaX = mouseX - dragStartPos.x;
        const deltaY = mouseY - dragStartPos.y;

        const newX = dragStartDatasetPos.x + deltaX;
        const newY = dragStartDatasetPos.y + deltaY;

        // Ensure the dataset stays within visible bounds
        const minX = -dataset.width;
        const maxX = (containerRect.width / viewport.scale) - (dataset.width / 2);
        const minY = 0;
        const maxY = (containerRect.height / viewport.scale) - dataset.height;

        const boundedX = Math.max(minX, Math.min(maxX, newX));
        const boundedY = Math.max(minY, Math.min(maxY, newY));
        
        setDatasets(prev => ({
            ...prev,
            [dataset.id]: {
                ...prev[dataset.id],
                x: boundedX,
                y: boundedY
            }
        }));
    };

    const handleDragEnd = () => {
        console.log('Drag ended');
        isDraggingRef.current = false;
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
                        onDragStart={(e) => handleDragStart(e, dataset)}
                        onDrag={(e) => handleDrag(e, dataset)}
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
