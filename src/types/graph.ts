export interface Box {
    id: string;
    width: number;
    height: number;
    label: string;
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
    boxes: Box[];
    connections: Connection[];
}
