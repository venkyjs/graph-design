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
    const HORIZONTAL_SPACING = 350; 
    const VERTICAL_SPACING = 150;  
    const DEFAULT_CONTAINER_HEIGHT = 800; // Default height if not specified
    
    // First, identify all unique levels and group datasets by level
    const levels: { [level: number]: string[] } = {};
    const visited = new Set<string>();
    
    // Helper function to get the level of a dataset
    const getLevel = (datasetId: string, level = 0) => {
        if (visited.has(datasetId)) return;
        visited.add(datasetId);
        
        levels[level] = levels[level] || [];
        levels[level].push(datasetId);
        
        // Get all outgoing connections from this dataset
        const outgoingConnections = (config.connections || []).filter(conn => conn.from === datasetId);
        
        // Process all target datasets
        outgoingConnections.forEach(conn => {
            getLevel(conn.to, level + 1);
        });
    };
    
    // Start with root datasets (those with no incoming connections)
    const rootDatasets = config.datasets.filter(dataset => 
        !(config.connections || []).some(conn => conn.to === dataset.id)
    );
    
    // If no root datasets found (e.g., all datasets are connected in a cycle),
    // use all datasets as roots
    if (rootDatasets.length === 0) {
        config.datasets.forEach(d => getLevel(d.id));
    } else {
        rootDatasets.forEach(d => getLevel(d.id));
    }
    
    // Calculate positions for each level
    Object.entries(levels).forEach(([levelStr, datasetIds]) => {
        const level = parseInt(levelStr);
        const x = level * HORIZONTAL_SPACING + 50;

        // Calculate total height of all datasets in this level
        const totalHeight = datasetIds.reduce((acc, datasetId) => {
            const dataset = config.datasets.find(d => d.id === datasetId);
            return acc + (dataset?.height || 0) + VERTICAL_SPACING;
        }, -VERTICAL_SPACING); // Subtract one spacing since we don't need it after the last dataset

        // Calculate starting Y position to center the datasets
        const startY = (DEFAULT_CONTAINER_HEIGHT - totalHeight) / 2;
        
        let currentY = startY;
        datasetIds.forEach((datasetId, index) => {
            const dataset = config.datasets.find(d => d.id === datasetId);
            if (!dataset) return;

            // Always position datasets vertically in their level
            newDatasets[datasetId] = {
                ...dataset,
                x,
                y: currentY
            };
            currentY += dataset.height + VERTICAL_SPACING;
        });
    });
    
    return newDatasets;
};

const Graph: React.FC<GraphProps> = ({ config }) => {
    const [datasets, setDatasets] = useState<{ [key: string]: DatasetWithPosition }>(() => {
        if (!config.datasets || config.datasets.length === 0) {
            return {};
        }
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
        const scale = Math.min(scaleX, scaleY, 1); 

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
            const zoomSensitivity = 0.002; 
            const delta = -e.deltaY * zoomSensitivity;
            const newScale = Math.min(Math.max(viewport.scale + delta, 0.1), 2);

            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const scaleChange = newScale - viewport.scale;
            const newTranslateX = viewport.translateX - (mouseX * scaleChange);
            const newTranslateY = viewport.translateY - (mouseY * scaleChange);
            console.log(`scale: ${newScale}`);
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
            console.log('Panning...');
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
        const minX = -dataset.width / 2;
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
                y: boundedY,
                width: dataset.width, // Maintain original width
                height: dataset.height // Maintain original height
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
                ? null 
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

            const directConnections = (config.connections || [])
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
            const isDirectlyConnected = (config.connections || []).some(conn => 
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

    const handleDoubleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - containerRect.left;
        const mouseY = e.clientY - containerRect.top;

        // Calculate the point to zoom towards (in viewport space)
        const zoomPointX = (mouseX - viewport.translateX) / viewport.scale;
        const zoomPointY = (mouseY - viewport.translateY) / viewport.scale;

        // Zoom factor for double click (1.5x zoom in)
        const zoomFactor = 1.5;
        const newScale = viewport.scale * zoomFactor;

        // Adjust translation to keep the clicked point stationary
        const newTranslateX = mouseX - (zoomPointX * newScale);
        const newTranslateY = mouseY - (zoomPointY * newScale);
        console.log(`dblclick scale: ${newScale}`);
        setViewport({
            scale: newScale,
            translateX: newTranslateX,
            translateY: newTranslateY
        });
    };

    return (
        <div 
            ref={containerRef}
            role="presentation"
            aria-label="Graph visualization"
            className="relative w-full h-full bg-gray-50 overflow-hidden"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onContextMenu={handleContextMenu}
            onDoubleClick={handleDoubleClick}
            style={{
                cursor: isPanning ? 'grabbing' : 'grab'
            }}
        >
            <svg 
                className="absolute top-0 left-0 w-full h-full" 
                style={{ pointerEvents: 'none' }}
                aria-hidden="true"
            >
                <defs>
                    <marker
                        id="arrowhead"
                        markerWidth="10"
                        markerHeight="7"
                        refX="2"
                        refY="3.5"
                        orient="auto"
                    >
                        <polygon points="0 0, 10 3.5, 0 7" fill="#9CA3AF" />
                    </marker>
                </defs>
                <g transform={`translate(${viewport.translateX},${viewport.translateY}) scale(${viewport.scale})`}>
                    {(config.connections || []).map((connection, index) => {
                        const fromDataset = datasets[connection.from];
                        const toDataset = datasets[connection.to];

                        if (!fromDataset || !toDataset) return null;

                        const startX = fromDataset.x + fromDataset.width;
                        const startY = fromDataset.y + 20;
                        const endX = toDataset.x - 15;
                        const endY = toDataset.y + 20;

                        const path = `M ${startX} ${startY} C ${startX + 50} ${startY}, ${endX - 50} ${endY}, ${endX} ${endY}`;

                        return (
                            <path
                                key={`${connection.from}-${connection.to}-${index}`}
                                d={path}
                                stroke="#9CA3AF"
                                strokeWidth={2}
                                fill="none"
                                markerEnd="url(#arrowhead)"
                            />
                        );
                    })}
                </g>
            </svg>

            <div
                style={{
                    transform: `translate(${viewport.translateX}px, ${viewport.translateY}px) scale(${viewport.scale})`,
                    transformOrigin: '0 0',
                }}
            >
                {/* Render datasets */}
                {Object.values(datasets).map(dataset => (
                    <Dataset
                        key={dataset.id}
                        dataset={dataset}
                        onColumnClick={handleColumnClick}
                        onDragStart={handleDragStart}
                        onDrag={handleDrag}
                        onDragEnd={handleDragEnd}
                        x={dataset.x}
                        y={dataset.y}
                        width={dataset.width}
                        height={dataset.height}
                    />
                ))}

                {/* Render column connections */}
                {getColumnConnections().map((connection, index) => (
                    <ColumnConnection
                        key={`col-${connection.from.id}-${connection.to.id}-${index}`}
                        from={connection.from}
                        to={connection.to}
                        fromColumn={connection.fromColumn}
                        toColumn={connection.toColumn}
                    />
                ))}
            </div>
        </div>
    );
};

export default Graph;
