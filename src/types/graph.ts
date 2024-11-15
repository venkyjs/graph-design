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
    fromSide?: 'top' | 'right' | 'bottom' | 'left';
    toSide?: 'top' | 'right' | 'bottom' | 'left';
}

export interface GraphConfig {
    boxes: Box[];
    connections: Connection[];
}
