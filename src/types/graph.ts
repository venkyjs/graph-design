export interface Dataset {
    id: string;
    display_name: string;
    width: number;
    height: number;
    type: string;
    columns: Column[];
}

export interface Column {
    name: string;
    type: string;
}

export interface Connection {
    from: string;
    to: string;
}

export interface GraphConfig {
    datasets: Dataset[];
    connections: Connection[];
}

export interface DatasetWithPosition extends Dataset {
    x: number;
    y: number;
}

export interface HighlightedColumn {
    sourceDatasetId: string;
    columnName: string;
}
