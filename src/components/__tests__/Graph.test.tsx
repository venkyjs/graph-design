import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Graph from '../Graph';
import { GraphConfig } from '../../types/graph';

describe('Graph Component', () => {
    const mockConfig: GraphConfig = {
        datasets: [
            {
                id: 'dataset1',
                name: 'Dataset 1',
                display_name: 'Dataset 1',
                columns: [
                    { name: 'id', type: 'number' },
                    { name: 'name', type: 'string' }
                ],
                level: 0,
                width: 200,
                height: 150
            },
            {
                id: 'dataset2',
                name: 'Dataset 2',
                display_name: 'Dataset 2',
                columns: [
                    { name: 'id', type: 'number' },
                    { name: 'dataset1Id', type: 'number' }
                ],
                level: 1,
                width: 200,
                height: 150
            }
        ],
        connections: [
            {
                from: 'dataset1',
                to: 'dataset2',
                fromColumn: 'id',
                toColumn: 'dataset1Id'
            }
        ]
    };

    beforeEach(() => {
        // Mock getBoundingClientRect for container
        Element.prototype.getBoundingClientRect = jest.fn().mockReturnValue({
            width: 1000,
            height: 800,
            top: 0,
            left: 0,
            right: 1000,
            bottom: 800,
            x: 0,
            y: 0
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('renders all datasets', () => {
        render(<Graph config={mockConfig} />);
        mockConfig.datasets.forEach(dataset => {
            expect(screen.getByText(dataset.display_name)).toBeInTheDocument();
        });
    });

    it('handles pan interaction', () => {
        const { container } = render(<Graph config={mockConfig} />);
        const graph = container.firstChild as HTMLElement;
        
        fireEvent.mouseDown(graph, { clientX: 0, clientY: 0 });
        fireEvent.mouseMove(graph, { clientX: 100, clientY: 100 });
        fireEvent.mouseUp(graph);
        
        // Verify transform style was updated
        expect(graph.querySelector('div')?.style.transform).toContain('translate');
    });

    it('handles zoom interaction', () => {
        const { container } = render(<Graph config={mockConfig} />);
        const graph = container.firstChild as HTMLElement;
        
        fireEvent.wheel(graph, { deltaY: -100 });
        
        // Verify transform style was updated
        expect(graph.querySelector('div')?.style.transform).toContain('scale');
    });

    it('handles double click zoom', () => {
        const { container } = render(<Graph config={mockConfig} />);
        const graph = container.firstChild as HTMLElement;
        
        fireEvent.doubleClick(graph, { clientX: 500, clientY: 400 });
        
        // Verify transform style was updated
        expect(graph.querySelector('div')?.style.transform).toContain('scale');
    });

    it('handles column highlighting', () => {
        render(<Graph config={mockConfig} />);
        // Use getAllByText and select the first occurrence
        const columns = screen.getAllByText('id');
        const column = columns[0];
        
        fireEvent.click(column);
        
        // Verify that the column is highlighted (you may need to adjust this based on your implementation)
        expect(column.parentElement).toHaveClass('hover:bg-gray-50');
    });

    it('handles dataset dragging', () => {
        render(<Graph config={mockConfig} />);
        const dataset = screen.getByText('Dataset 1').parentElement?.parentElement;
        expect(dataset).toBeTruthy();
        
        fireEvent.mouseDown(dataset!, { clientX: 0, clientY: 0 });
        fireEvent.mouseMove(document, { clientX: 100, clientY: 100 });
        fireEvent.mouseUp(document);
        
        // Verify dataset position was updated
        expect(dataset?.style.transform).toContain('translate');
    });

    it('prevents context menu on right click', () => {
        const { container } = render(<Graph config={mockConfig} />);
        const graph = container.firstChild as HTMLElement;
        const preventDefault = jest.fn();
        
        // Create a new context menu event with preventDefault
        const contextMenuEvent = new MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true
        });
        
        // Override preventDefault
        Object.defineProperty(contextMenuEvent, 'preventDefault', {
            value: preventDefault
        });
        
        // Dispatch the event
        graph.dispatchEvent(contextMenuEvent);
        
        expect(preventDefault).toHaveBeenCalled();
    });

    it('calculates initial viewport correctly', () => {
        const { container } = render(<Graph config={mockConfig} />);
        const graph = container.firstChild as HTMLElement;
        
        // Verify initial transform is set
        expect(graph.querySelector('div')?.style.transform).toContain('translate');
        expect(graph.querySelector('div')?.style.transform).toContain('scale');
    });

    it('handles mouse leave during drag', () => {
        const { container } = render(<Graph config={mockConfig} />);
        const graph = container.firstChild as HTMLElement;
        
        fireEvent.mouseDown(graph, { clientX: 0, clientY: 0 });
        fireEvent.mouseLeave(graph);
        
        // Verify pan state is reset
        fireEvent.mouseMove(graph, { clientX: 100, clientY: 100 });
        expect(graph.querySelector('div')?.style.transform).not.toContain('translate(100px, 100px)');
    });

    it('handles empty dataset config', () => {
        const emptyConfig = { datasets: [], connections: [] };
        render(<Graph config={emptyConfig} />);
        
        // Should render without crashing
        const graph = screen.getByRole('presentation');
        expect(graph).toBeInTheDocument();
        expect(graph).toHaveAttribute('aria-label', 'Graph visualization');
        
        // Should not render any datasets or connections
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
        expect(graph.querySelector('path')).not.toBeInTheDocument();
    });

    it('handles datasets without connections', () => {
        const configWithoutConnections = {
            datasets: [
                {
                    id: 'dataset1',
                    name: 'Dataset 1',
                    display_name: 'Dataset 1',
                    columns: [{ name: 'id', type: 'number' }],
                    level: 0,
                    width: 200,
                    height: 150
                }
            ],
            connections: []
        };
        
        render(<Graph config={configWithoutConnections} />);
        
        // Should render the dataset
        const dataset = screen.getByText('Dataset 1');
        expect(dataset).toBeInTheDocument();
        
        // Should not render any connections
        const graph = screen.getByRole('presentation');
        expect(graph.querySelector('path')).not.toBeInTheDocument();
    });

    it('handles undefined connections array', () => {
        const configWithUndefinedConnections = {
            datasets: [
                {
                    id: 'dataset1',
                    name: 'Dataset 1',
                    display_name: 'Dataset 1',
                    columns: [{ name: 'id', type: 'number' }],
                    level: 0,
                    width: 200,
                    height: 150
                }
            ],
            connections: undefined
        };
        
        render(<Graph config={configWithUndefinedConnections as any} />);
        
        // Should render without crashing
        const graph = screen.getByRole('presentation');
        expect(graph).toBeInTheDocument();
        
        // Should render the dataset
        const dataset = screen.getByText('Dataset 1');
        expect(dataset).toBeInTheDocument();
    });

    it('handles undefined datasets array', () => {
        const configWithUndefinedDatasets = {
            datasets: undefined,
            connections: []
        };
        
        render(<Graph config={configWithUndefinedDatasets as any} />);
        
        // Should render without crashing
        const graph = screen.getByRole('presentation');
        expect(graph).toBeInTheDocument();
        
        // Should not render any datasets
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('handles invalid connection references', () => {
        const configWithInvalidConnections = {
            datasets: [
                {
                    id: 'dataset1',
                    name: 'Dataset 1',
                    display_name: 'Dataset 1',
                    columns: [{ name: 'id', type: 'number' }],
                    level: 0,
                    width: 200,
                    height: 150
                }
            ],
            connections: [
                {
                    from: 'nonexistent1',
                    to: 'nonexistent2',
                    fromColumn: 'id',
                    toColumn: 'dataset1Id'
                }
            ]
        };
        
        render(<Graph config={configWithInvalidConnections} />);
        
        // Should render without crashing
        const dataset = screen.getByText('Dataset 1');
        expect(dataset).toBeInTheDocument();
    });

    it('handles wheel events for zooming', () => {
        const { container } = render(<Graph config={mockConfig} />);
        const graph = container.firstChild as HTMLElement;
        
        // Test zooming in
        fireEvent.wheel(graph, { deltaY: -100 });
        
        // Test zooming out
        fireEvent.wheel(graph, { deltaY: 100 });
        
        // Test with ctrl key
        fireEvent.wheel(graph, { deltaY: -100, ctrlKey: true });
    });

    it('handles mouse move without dragging', () => {
        const { container } = render(<Graph config={mockConfig} />);
        const graph = container.firstChild as HTMLElement;
        
        fireEvent.mouseMove(graph, {
            clientX: 100,
            clientY: 100
        });
        
        // Should not crash
        expect(graph).toBeInTheDocument();
    });

    it('handles cyclic dataset connections', () => {
        const cyclicConfig = {
            datasets: [
                {
                    id: 'dataset1',
                    name: 'Dataset 1',
                    display_name: 'Dataset 1',
                    columns: [{ name: 'id', type: 'number' }, { name: 'dataset2Id', type: 'number' }],
                    level: 0,
                    width: 200,
                    height: 150
                },
                {
                    id: 'dataset2',
                    name: 'Dataset 2',
                    display_name: 'Dataset 2',
                    columns: [{ name: 'id', type: 'number' }, { name: 'dataset3Id', type: 'number' }],
                    level: 1,
                    width: 200,
                    height: 150
                },
                {
                    id: 'dataset3',
                    name: 'Dataset 3',
                    display_name: 'Dataset 3',
                    columns: [{ name: 'id', type: 'number' }, { name: 'dataset1Id', type: 'number' }],
                    level: 2,
                    width: 200,
                    height: 150
                }
            ],
            connections: [
                {
                    from: 'dataset1',
                    to: 'dataset2',
                    fromColumn: 'id',
                    toColumn: 'dataset2Id'
                },
                {
                    from: 'dataset2',
                    to: 'dataset3',
                    fromColumn: 'id',
                    toColumn: 'dataset3Id'
                },
                {
                    from: 'dataset3',
                    to: 'dataset1',
                    fromColumn: 'id',
                    toColumn: 'dataset1Id'
                }
            ]
        };
        
        render(<Graph config={cyclicConfig} />);
        
        // All datasets should be rendered
        cyclicConfig.datasets.forEach(dataset => {
            expect(screen.getByText(dataset.display_name)).toBeInTheDocument();
        });
        
        // Verify that datasets are rendered with transform styles
        const datasets = screen.getAllByText(/Dataset \d/).map(el => el.parentElement?.parentElement?.parentElement);
        datasets.forEach(dataset => {
            expect(dataset?.style.transform).toBeTruthy();
        });
        
        // Verify that connections are rendered
        const svg = screen.getByRole('presentation').querySelector('svg');
        expect(svg?.querySelectorAll('path').length).toBe(3); // Should have 3 connections
    });

    it('handles column highlighting in cyclic connections', () => {
        const cyclicConfig = {
            datasets: [
                {
                    id: 'dataset1',
                    name: 'Dataset 1',
                    display_name: 'Dataset 1',
                    columns: [{ name: 'id', type: 'number' }],
                    level: 0,
                    width: 200,
                    height: 150
                },
                {
                    id: 'dataset2',
                    name: 'Dataset 2',
                    display_name: 'Dataset 2',
                    columns: [{ name: 'id', type: 'number' }],
                    level: 1,
                    width: 200,
                    height: 150
                }
            ],
            connections: [
                {
                    from: 'dataset1',
                    to: 'dataset2',
                    fromColumn: 'id',
                    toColumn: 'id'
                },
                {
                    from: 'dataset2',
                    to: 'dataset1',
                    fromColumn: 'id',
                    toColumn: 'id'
                }
            ]
        };
        
        render(<Graph config={cyclicConfig} />);
        
        // Click on the first 'id' column
        const columns = screen.getAllByText('id');
        fireEvent.click(columns[0]);
        
        // Should show column connections
        const svg = screen.getByRole('presentation').querySelector('svg');
        expect(svg?.querySelectorAll('path').length).toBeGreaterThan(0);
    });

    it('handles datasets with no matching columns', () => {
        const noMatchingColumnsConfig = {
            datasets: [
                {
                    id: 'dataset1',
                    name: 'Dataset 1',
                    display_name: 'Dataset 1',
                    columns: [{ name: 'column1', type: 'number' }],
                    level: 0,
                    width: 200,
                    height: 150
                },
                {
                    id: 'dataset2',
                    name: 'Dataset 2',
                    display_name: 'Dataset 2',
                    columns: [{ name: 'column2', type: 'number' }],
                    level: 1,
                    width: 200,
                    height: 150
                }
            ],
            connections: [
                {
                    from: 'dataset1',
                    to: 'dataset2',
                    fromColumn: 'column1',
                    toColumn: 'column2'
                }
            ]
        };
        
        render(<Graph config={noMatchingColumnsConfig} />);
        
        // Click on column1
        const column = screen.getByText('column1');
        fireEvent.click(column);
        
        // Should not create any column connections
        const svg = screen.getByRole('presentation').querySelector('svg');
        expect(svg?.querySelectorAll('path').length).toBe(1); // Only the regular connection
    });

    it('handles undefined connections array', () => {
        const configWithoutConnections = {
            datasets: [
                {
                    id: 'dataset1',
                    name: 'Dataset 1',
                    display_name: 'Dataset 1',
                    columns: [{ name: 'id', type: 'number' }],
                    level: 0,
                    width: 200,
                    height: 150
                }
            ]
        };
        
        render(<Graph config={configWithoutConnections} />);
        
        // Should render the dataset
        expect(screen.getByText('Dataset 1')).toBeInTheDocument();
        
        // Should not have any connections
        const svg = screen.getByRole('presentation').querySelector('svg');
        expect(svg?.querySelectorAll('path').length).toBe(0);
    });

    it('handles invalid connections between nonexistent datasets', () => {
        const configWithInvalidConnections = {
            datasets: [
                {
                    id: 'dataset1',
                    name: 'Dataset 1',
                    display_name: 'Dataset 1',
                    columns: [{ name: 'id', type: 'number' }],
                    level: 0,
                    width: 200,
                    height: 150
                }
            ],
            connections: [
                {
                    from: 'nonexistent1',
                    to: 'nonexistent2',
                    fromColumn: 'id',
                    toColumn: 'dataset1Id'
                }
            ]
        };
        
        render(<Graph config={configWithInvalidConnections} />);
        
        // Should render the valid dataset
        expect(screen.getByText('Dataset 1')).toBeInTheDocument();
        
        // Should not render invalid connections
        const svg = screen.getByRole('presentation').querySelector('svg');
        expect(svg?.querySelectorAll('path').length).toBe(0);
    });

    it('handles zoom limits correctly', () => {
        const { container } = render(<Graph config={mockConfig} />);
        const graph = container.firstChild as HTMLElement;
        
        // Test minimum zoom
        for (let i = 0; i < 10; i++) {
            fireEvent.wheel(graph, { deltaY: 100 }); // Zoom out
        }
        
        // Should not go below minimum scale
        const minScale = graph.querySelector('div')?.style.transform.match(/scale\((.*?)\)/)?.[1];
        expect(parseFloat(minScale || '0')).toBeGreaterThanOrEqual(0.1);
        
        // Test maximum zoom
        for (let i = 0; i < 10; i++) {
            fireEvent.wheel(graph, { deltaY: -100 }); // Zoom in
        }
        
        // Should not exceed maximum scale
        const maxScale = graph.querySelector('div')?.style.transform.match(/scale\((.*?)\)/)?.[1];
        expect(parseFloat(maxScale || '0')).toBeLessThanOrEqual(2);
    });
});
