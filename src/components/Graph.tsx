import React, { useState, useEffect } from 'react';
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

const SPACING_X = 350;
const SPACING_Y = 100;

const Graph: React.FC<GraphProps> = ({ config }) => {
    const [datasets, setDatasets] = useState<{ [key: string]: DatasetWithPosition }>(() => {
        console.log('Initializing datasets with config:', config);
        const initialDatasets: { [key: string]: DatasetWithPosition } = {};
        config.datasets.forEach((dataset, index) => {
            initialDatasets[dataset.id] = {
                ...dataset,
                x: index * SPACING_X + 50,
                y: SPACING_Y
            };
        });
        console.log('Initialized datasets:', initialDatasets);
        return initialDatasets;
    });

    const [highlightedColumn, setHighlightedColumn] = useState<HighlightedColumn | null>(null);

    const handleDragStart = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
    };

    const handleDrag = (newX: number, newY: number, id: string) => {
        setDatasets(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                x: newX,
                y: newY
            }
        }));
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
        <div className="relative w-full h-full bg-gray-50 overflow-auto">
            {/* Render datasets */}
            {Object.values(datasets).map((dataset) => (
                <Dataset
                    key={dataset.id}
                    dataset={dataset}
                    onDragStart={handleDragStart}
                    onDrag={handleDrag}
                    onColumnClick={handleColumnClick}
                    highlightedColumn={highlightedColumn}
                />
            ))}

            {/* Render connections */}
            {getConnections().map((connection, index) => (
                <Connection
                    key={`connection-${index}`}
                    from={datasets[connection.from]}
                    to={datasets[connection.to]}
                />
            ))}

            {/* Render column connections */}
            {getColumnConnections().map((connection, index) => (
                <ColumnConnection
                    key={`column-connection-${index}`}
                    from={connection.from}
                    to={connection.to}
                    columnName={connection.columnName}
                />
            ))}
        </div>
    );
};

export default Graph;
