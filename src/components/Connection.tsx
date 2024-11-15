import { Connection as ConnectionType, Box } from '../types/graph';

interface ConnectionProps extends ConnectionType {
    boxes: { [key: string]: Box };
}

const getConnectionPoints = (
    fromBox: Box,
    toBox: Box,
    fromSide: 'top' | 'right' | 'bottom' | 'left' = 'right',
    toSide: 'top' | 'right' | 'bottom' | 'left' = 'left'
) => {
    const getPoint = (box: Box, side: string) => {
        switch (side) {
            case 'top':
                return { x: box.x, y: box.y - box.height / 2 };
            case 'right':
                return { x: box.x + box.width / 2, y: box.y };
            case 'bottom':
                return { x: box.x, y: box.y + box.height / 2 };
            case 'left':
                return { x: box.x - box.width / 2, y: box.y };
            default:
                return { x: box.x, y: box.y };
        }
    };

    const start = getPoint(fromBox, fromSide);
    const end = getPoint(toBox, toSide);

    const dx = Math.abs(end.x - start.x);
    const dy = Math.abs(end.y - start.y);
    const controlDistance = Math.min(dx / 2, 100);

    const controlPoint1 = {
        x: start.x + (fromSide === 'left' ? -controlDistance : fromSide === 'right' ? controlDistance : 0),
        y: start.y + (fromSide === 'top' ? -controlDistance : fromSide === 'bottom' ? controlDistance : 0)
    };

    const controlPoint2 = {
        x: end.x + (toSide === 'left' ? -controlDistance : toSide === 'right' ? controlDistance : 0),
        y: end.y + (toSide === 'top' ? -controlDistance : toSide === 'bottom' ? controlDistance : 0)
    };

    return { start, end, controlPoint1, controlPoint2 };
};

export const Connection = ({ from, to, fromSide = 'right', toSide = 'left', boxes }: ConnectionProps) => {
    const fromBox = boxes[from];
    const toBox = boxes[to];

    if (!fromBox || !toBox) return null;

    const { start, end, controlPoint1, controlPoint2 } = getConnectionPoints(fromBox, toBox, fromSide, toSide);
    const path = `M ${start.x} ${start.y} C ${controlPoint1.x} ${controlPoint1.y}, ${controlPoint2.x} ${controlPoint2.y}, ${end.x} ${end.y}`;

    const markerId = `arrow-${from}-${to}`;

    return (
        <svg
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: -1
            }}
        >
            <defs>
                <marker
                    id={markerId}
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#666" />
                </marker>
            </defs>
            <path
                d={path}
                stroke="#666"
                strokeWidth="2"
                fill="none"
                markerEnd={`url(#${markerId})`}
            />
        </svg>
    );
};
