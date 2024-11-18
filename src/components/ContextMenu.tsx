import React from 'react';

interface ContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose, onZoomIn, onZoomOut }) => {
    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.context-menu')) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div 
            className="context-menu"
            style={{
                position: 'fixed',
                left: x,
                top: y,
                backgroundColor: 'white',
                borderRadius: '4px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                border: '1px solid #e2e8f0',
                zIndex: 1000,
                minWidth: '160px',
                overflow: 'hidden'
            }}
        >
            <div
                style={{
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                }}
            >
                <button
                    onClick={onZoomIn}
                    style={{
                        padding: '8px 12px',
                        textAlign: 'left',
                        border: 'none',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        width: '100%',
                        borderRadius: '4px',
                        color: '#1f2937'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                    <span style={{ fontSize: '14px' }}>🔍</span>
                    Zoom to here
                </button>
                <button
                    onClick={onZoomOut}
                    style={{
                        padding: '8px 12px',
                        textAlign: 'left',
                        border: 'none',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        width: '100%',
                        borderRadius: '4px',
                        color: '#1f2937'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                    <span style={{ fontSize: '14px' }}>⟲</span>
                    Zoom out
                </button>
            </div>
        </div>
    );
};

export default ContextMenu;
