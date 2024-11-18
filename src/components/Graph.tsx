import React, { useState, useEffect, useRef, useCallback } from 'react';
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

interface ConnectedColumn {
    datasetId: string;
    columnName: string;
}

const HEADER_HEIGHT = 50; // Height of the header
const SEARCH_BOX_HEIGHT = 52; // Height of search box
const COLUMN_HEIGHT = 20; // Height of each column
const ROW_PADDING = 4; // Padding between rows

const calculateDatasetPositions = (config: GraphConfig) => {
    const newDatasets: { [key: string]: DatasetWithPosition } = {};
    const HORIZONTAL_SPACING = 500; 
    const VERTICAL_SPACING = 200;  
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
    const [connectedColumns, setConnectedColumns] = useState<ConnectedColumn[]>([]);
    const isDraggingRef = useRef(false);
    const dragStartDatasetId = useRef<string | null>(null);
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
        if (!containerRef.current || Object.keys(datasets).length === 0) return {
            scale: 1,
            translateX: 0,
            translateY: 0
        };

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

        // Add padding (100px on all sides)
        const padding = 100;
        const contentWidth = maxX - minX + (padding * 2);
        const contentHeight = maxY - minY + (padding * 2);

        // Calculate scale to fit all content
        const scaleX = containerWidth / contentWidth;
        const scaleY = containerHeight / contentHeight;
        const scale = Math.min(scaleX, scaleY); // Remove the cap at 1 to ensure content fits

        // Calculate translations to center the content
        const scaledContentWidth = contentWidth * scale;
        const scaledContentHeight = contentHeight * scale;
        const translateX = (containerWidth - scaledContentWidth) / 2 - (minX * scale) + (padding * scale);
        const translateY = (containerHeight - scaledContentHeight) / 2 - (minY * scale) + (padding * scale);

        return {
            scale,
            translateX,
            translateY
        };
    };

    // Set initial viewport on mount
    useEffect(() => {
        // Only set initial viewport on mount or when container size changes
        const initialViewport = calculateInitialViewport();
        if (initialViewport) {
            setViewport(initialViewport);
        }

        // Add resize observer to handle container size changes
        const resizeObserver = new ResizeObserver(() => {
            const newViewport = calculateInitialViewport();
            if (newViewport) {
                setViewport(newViewport);
            }
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    // Modified wheel handler to maintain position
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheelEvent = (e: WheelEvent) => {
            e.preventDefault();
            const zoomSensitivity = 0.002;
            const delta = -e.deltaY * zoomSensitivity;
            const newScale = Math.min(Math.max(viewport.scale + delta, 0.1), 2);

            // Get mouse position relative to container
            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Calculate the point to zoom towards (in viewport space)
            const zoomPointX = (mouseX - viewport.translateX) / viewport.scale;
            const zoomPointY = (mouseY - viewport.translateY) / viewport.scale;

            // Calculate new translations to maintain mouse position
            const newTranslateX = mouseX - (zoomPointX * newScale);
            const newTranslateY = mouseY - (zoomPointY * newScale);

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
        // Start panning on middle mouse button or when clicking the background
        if (e.button === 1 || e.target === e.currentTarget) {
            e.preventDefault();
            setIsPanning(true);
            setPanStart({
                x: e.clientX - viewport.translateX,
                y: e.clientY - viewport.translateY
            });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning) {
            e.preventDefault();
            const dx = e.clientX - panStart.x;
            const dy = e.clientY - panStart.y;
            
            setViewport(prev => ({
                ...prev,
                translateX: dx,
                translateY: dy
            }));
        }
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        if (isPanning) {
            e.preventDefault();
            setIsPanning(false);
        }
    };

    const handleMouseLeave = (e: React.MouseEvent) => {
        setIsPanning(false);
        if (isDraggingRef.current) {
            isDraggingRef.current = false;
            setDatasets(prev => ({
                ...prev,
                [dragStartDatasetId.current]: {
                    ...prev[dragStartDatasetId.current],
                    x: dragStartDatasetPos.x,
                    y: dragStartDatasetPos.y
                }
            }));
        }
    };

    const handleDragStart = (e: MouseEvent, dataset: DatasetType) => {
        if (!containerRef.current) return;
        console.log('Drag started');
        
        const containerRect = containerRef.current.getBoundingClientRect();
        const mouseX = Math.round((e.clientX - containerRect.left - viewport.translateX) / viewport.scale);
        const mouseY = Math.round((e.clientY - containerRect.top - viewport.translateY) / viewport.scale);
        
        isDraggingRef.current = true;
        dragStartDatasetId.current = dataset.id;
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
        const mouseX = Math.round((e.clientX - containerRect.left - viewport.translateX) / viewport.scale);
        const mouseY = Math.round((e.clientY - containerRect.top - viewport.translateY) / viewport.scale);

        const deltaX = mouseX - dragStartPos.x;
        const deltaY = mouseY - dragStartPos.y;

        const newX = Math.round(dragStartDatasetPos.x + deltaX);
        const newY = Math.round(dragStartDatasetPos.y + deltaY);

        // Ensure the dataset stays within visible bounds
        const minX = -dataset.width / 2;
        const maxX = (containerRect.width / viewport.scale) - (dataset.width / 2);
        const minY = 0;
        const maxY = (containerRect.height / viewport.scale) - dataset.height;

        const boundedX = Math.round(Math.max(minX, Math.min(maxX, newX)));
        const boundedY = Math.round(Math.max(minY, Math.min(maxY, newY)));

        setDatasets(prev => ({
            ...prev,
            [dataset.id]: {
                ...prev[dataset.id],
                x: boundedX,
                y: boundedY,
                width: dataset.width,
                height: dataset.height
            }
        }));
    };

    const handleDragEnd = () => {
        console.log('Drag ended');
        isDraggingRef.current = false;
    };

    const handleColumnClick = useCallback((columnName: string, sourceDatasetId: string) => {
        // First update state
        setHighlightedColumn({
            columnName,
            sourceDatasetId
        });

        // Then immediately calculate and update connections
        const { connectedColumns: newConnectedColumns } = getColumnConnections({
            columnName,
            sourceDatasetId
        });
        setConnectedColumns(newConnectedColumns);
    }, []);

    const getColumnConnections = (currentHighlightedColumn: HighlightedColumn | null) => {
        if (!currentHighlightedColumn) {
            return { connections: [], connectedColumns: [] };
        }

        const connections: Array<{
            from: DatasetWithPosition;
            to: DatasetWithPosition;
            columnName: string;
            fromId: string;
            toId: string;
        }> = [];

        const processedConnections = new Set<string>();
        const newConnectedColumns: ConnectedColumn[] = [];

        // Add the clicked column to connected columns
        newConnectedColumns.push({
            datasetId: currentHighlightedColumn.sourceDatasetId,
            columnName: currentHighlightedColumn.columnName
        });

        // Recursive function to trace connections
        const traceConnections = (datasetId: string, columnName: string, visited: Set<string> = new Set()) => {
            if (visited.has(datasetId)) return;
            visited.add(datasetId);

            const currentDataset = config.datasets.find(d => d.id === datasetId);
            if (!currentDataset) return;

            (config.connections || []).forEach(conn => {
                if (conn.from === datasetId) {
                    const fromDataset = datasets[conn.from];
                    const toDataset = datasets[conn.to];
                    const targetDataset = config.datasets.find(d => d.id === conn.to);
                    
                    if (!fromDataset || !toDataset || !targetDataset) {
                        console.warn('Missing dataset in connection:', { from: conn.from, to: conn.to });
                        return;
                    }

                    // Check if the column exists in target dataset
                    const hasMatchingColumn = targetDataset.columns.some(col => col.name === columnName);
                    if (!hasMatchingColumn) return;

                    const connectionKey = `${conn.from}-${conn.to}-${columnName}`;
                    if (!processedConnections.has(connectionKey)) {
                        connections.push({
                            from: fromDataset,
                            to: toDataset,
                            columnName: columnName,
                            fromId: conn.from,
                            toId: conn.to
                        });
                        processedConnections.add(connectionKey);

                        newConnectedColumns.push({
                            datasetId: conn.to,
                            columnName: columnName
                        });
                    }

                    traceConnections(conn.to, columnName, visited);
                }
            });
        };

        const traceBackwards = (datasetId: string, columnName: string, visited: Set<string> = new Set()) => {
            if (visited.has(datasetId)) return;
            visited.add(datasetId);

            const currentDataset = config.datasets.find(d => d.id === datasetId);
            if (!currentDataset) return;

            (config.connections || []).forEach(conn => {
                if (conn.to === datasetId) {
                    const fromDataset = datasets[conn.from];
                    const toDataset = datasets[conn.to];
                    const sourceDataset = config.datasets.find(d => d.id === conn.from);
                    
                    if (!fromDataset || !toDataset || !sourceDataset) return;

                    // Check if the column exists in source dataset
                    const hasMatchingColumn = sourceDataset.columns.some(col => col.name === columnName);
                    if (!hasMatchingColumn) return;

                    const connectionKey = `${conn.from}-${conn.to}-${columnName}`;
                    if (!processedConnections.has(connectionKey)) {
                        connections.push({
                            from: fromDataset,
                            to: toDataset,
                            columnName: columnName,
                            fromId: conn.from,
                            toId: conn.to
                        });
                        processedConnections.add(connectionKey);

                        newConnectedColumns.push({
                            datasetId: conn.from,
                            columnName: columnName
                        });
                    }

                    traceBackwards(conn.from, columnName, visited);
                }
            });
        };

        traceConnections(currentHighlightedColumn.sourceDatasetId, currentHighlightedColumn.columnName);
        traceBackwards(currentHighlightedColumn.sourceDatasetId, currentHighlightedColumn.columnName);

        return { connections, connectedColumns: newConnectedColumns };
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

    const handleDatasetHeightChange = useCallback((datasetId: string, newHeight: number) => {
        setDatasets(prevDatasets => {
            const updatedDataset = { ...prevDatasets[datasetId], height: newHeight };
            return {
                ...prevDatasets,
                [datasetId]: updatedDataset
            };
        });
    }, []);

    return (
        <div 
            ref={containerRef}
            role="presentation"
            aria-label="Graph visualization"
            className="relative w-full h-full bg-gray-50 overflow-hidden select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onContextMenu={(e) => e.preventDefault()}
            onDoubleClick={handleDoubleClick}
            style={{
                cursor: isPanning ? 'grabbing' : 'grab',
                touchAction: 'none'
            }}
        >
            <svg 
                className="absolute top-0 left-0 w-full h-full pointer-events-none" 
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
                        const startY = fromDataset.y + (HEADER_HEIGHT / 2); // Center of header
                        const endX = toDataset.x - 15;
                        const endY = toDataset.y + (HEADER_HEIGHT / 2);

                        const path = `M ${startX} ${startY} C ${startX + 50} ${startY}, ${endX - 50} ${endY}, ${endX} ${endY}`;

                        return (
                            <path
                                key={`dataset-${connection.from}-${connection.to}-${index}`}
                                d={path}
                                stroke="#9CA3AF"
                                strokeWidth={2}
                                fill="none"
                                markerEnd="url(#arrowhead)"
                                opacity={0.5}
                            />
                        );
                    })}
                    {getColumnConnections(highlightedColumn).connections.map((connection, index) => (
                        <ColumnConnection
                            key={`col-${connection.fromId}-${connection.toId}-${index}`}
                            from={connection.from}
                            to={connection.to}
                            columnName={connection.columnName}
                            fromId={connection.fromId}
                            toId={connection.toId}
                        />
                    ))}
                </g>
            </svg>

            <div
                style={{
                    transform: `translate(${viewport.translateX}px, ${viewport.translateY}px) scale(${viewport.scale})`,
                    transformOrigin: '0 0',
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none'
                }}
            >
                <div style={{ pointerEvents: 'auto' }}>
                    {/* Render datasets */}
                    {Object.values(datasets).map(dataset => (
                        <Dataset
                            key={dataset.id}
                            dataset={dataset}
                            highlightedColumn={highlightedColumn}
                            connectedColumns={connectedColumns}
                            onColumnClick={handleColumnClick}
                            onDragStart={(e) => handleDragStart(e, dataset)}
                            onDrag={(e) => handleDrag(e, dataset)}
                            onDragEnd={handleDragEnd}
                            onHeightChange={handleDatasetHeightChange}
                            x={dataset.x}
                            y={dataset.y}
                            width={dataset.width}
                            height={dataset.height}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Graph;
