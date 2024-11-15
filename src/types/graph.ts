export interface Box {
    id: string;
    width: number;
    height: number;
    label: string;
}

export interface Connection {
    from: string;
    to: string;
}

export interface GraphConfig {
    boxes: Box[];
    connections: Connection[];
}
