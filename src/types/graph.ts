export interface Box {
    id: string;
    x: number;
    y: number;
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
