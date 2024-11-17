import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dataset from '../Dataset';
import { Dataset as DatasetType } from '../../types/graph';

describe('Dataset Component', () => {
    const mockDataset: DatasetType = {
        id: 'test-dataset',
        name: 'Test Dataset',
        display_name: 'Test Dataset Display',
        columns: [
            { name: 'id', type: 'number' },
            { name: 'name', type: 'string' }
        ],
        width: 200,
        height: 150,
        x: 0,
        y: 0
    };

    const mockProps = {
        dataset: mockDataset,
        onColumnClick: jest.fn(),
        onDragStart: jest.fn(),
        onDrag: jest.fn(),
        onDragEnd: jest.fn(),
        x: 100,
        y: 100,
        width: 200,
        height: 150
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders dataset with correct display name', () => {
        render(<Dataset {...mockProps} />);
        expect(screen.getByText('Test Dataset Display')).toBeInTheDocument();
    });

    it('renders all columns', () => {
        render(<Dataset {...mockProps} />);
        mockDataset.columns.forEach(column => {
            expect(screen.getByText(column.name)).toBeInTheDocument();
            expect(screen.getByText(column.type)).toBeInTheDocument();
        });
    });

    it('handles column click', () => {
        render(<Dataset {...mockProps} />);
        fireEvent.click(screen.getByText('id'));
        expect(mockProps.onColumnClick).toHaveBeenCalledWith('id', expect.any(Object));
    });

    it('handles drag start', () => {
        render(<Dataset {...mockProps} />);
        const dataset = screen.getByText('Test Dataset Display').parentElement?.parentElement;
        expect(dataset).toBeTruthy();
        
        fireEvent.mouseDown(dataset!, { button: 0 });
        expect(mockProps.onDragStart).toHaveBeenCalled();
    });

    it('ignores right click for drag start', () => {
        render(<Dataset {...mockProps} />);
        const dataset = screen.getByText('Test Dataset Display').parentElement?.parentElement;
        expect(dataset).toBeTruthy();
        
        fireEvent.mouseDown(dataset!, { button: 2 });
        expect(mockProps.onDragStart).not.toHaveBeenCalled();
    });

    it('handles drag movement', () => {
        render(<Dataset {...mockProps} />);
        const dataset = screen.getByText('Test Dataset Display').parentElement?.parentElement;
        expect(dataset).toBeTruthy();
        
        fireEvent.mouseDown(dataset!, { button: 0 });
        fireEvent.mouseMove(document, { clientX: 150, clientY: 150 });
        expect(mockProps.onDrag).toHaveBeenCalled();
    });

    it('handles drag end', () => {
        render(<Dataset {...mockProps} />);
        const dataset = screen.getByText('Test Dataset Display').parentElement?.parentElement;
        expect(dataset).toBeTruthy();
        
        fireEvent.mouseDown(dataset!, { button: 0 });
        fireEvent.mouseUp(document);
        expect(mockProps.onDragEnd).toHaveBeenCalled();
    });

    it('updates width based on content', () => {
        const { rerender } = render(<Dataset {...mockProps} />);
        
        // Mock getBoundingClientRect
        const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
        Element.prototype.getBoundingClientRect = jest.fn().mockReturnValue({
            width: 250,
            height: 100
        });

        // Rerender with new content
        rerender(<Dataset {...mockProps} dataset={{
            ...mockDataset,
            display_name: 'Very Long Dataset Name That Should Cause Resize'
        }} />);

        Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    });

    it('handles empty columns array', () => {
        render(
            <Dataset
                dataset={{
                    id: 'dataset1',
                    name: 'Dataset 1',
                    display_name: 'Dataset 1',
                    columns: [],
                    level: 0,
                    width: 200,
                    height: 150
                }}
                onColumnClick={() => {}}
            />
        );
        
        // Should render dataset name but no columns
        expect(screen.getByText('Dataset 1')).toBeInTheDocument();
        expect(screen.queryByText('id')).not.toBeInTheDocument();
    });

    it('handles missing display_name', () => {
        render(
            <Dataset
                dataset={{
                    id: 'dataset1',
                    name: 'Dataset 1',
                    columns: [{ name: 'id', type: 'number' }],
                    level: 0,
                    width: 200,
                    height: 150
                } as any}
                onColumnClick={() => {}}
            />
        );
        
        // Should fall back to name
        expect(screen.getByText('Dataset 1')).toBeInTheDocument();
    });

    it('handles missing width and height', () => {
        render(
            <Dataset
                dataset={{
                    id: 'dataset1',
                    name: 'Dataset 1',
                    display_name: 'Dataset 1',
                    columns: [{ name: 'id', type: 'number' }],
                    level: 0
                } as any}
                onColumnClick={() => {}}
                onDragStart={() => {}}
                onDrag={() => {}}
                onDragEnd={() => {}}
                x={0}
                y={0}
                width={200}
                height={150}
            />
        );
        
        // Should render with default dimensions
        const dataset = screen.getByText('Dataset 1').parentElement?.parentElement;
        expect(dataset).toHaveStyle({ minWidth: '200px' });
    });

    it('handles column click with event', () => {
        const onColumnClick = jest.fn();
        render(
            <Dataset
                dataset={{
                    id: 'dataset1',
                    name: 'Dataset 1',
                    display_name: 'Dataset 1',
                    columns: [{ name: 'id', type: 'number' }],
                    level: 0,
                    width: 200,
                    height: 150
                }}
                onColumnClick={onColumnClick}
                onDragStart={() => {}}
                onDrag={() => {}}
                onDragEnd={() => {}}
                x={0}
                y={0}
                width={200}
                height={150}
            />
        );
        
        const column = screen.getByText('id');
        fireEvent.click(column);
        
        expect(onColumnClick).toHaveBeenCalledWith('id', expect.any(Object));
    });
});
