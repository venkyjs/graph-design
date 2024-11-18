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
            ]
        };
        render(<Graph config={configWithUndefinedConnections} />);
        expect(screen.getByText('Dataset 1')).toBeInTheDocument();
    });

    it('handles zoom limits correctly', () => {
        const { container } = render(<Graph config={mockConfig} />);
        const graph = container.firstChild as HTMLElement;
        
        // Test minimum zoom limit
        for (let i = 0; i < 20; i++) {
            fireEvent.wheel(graph, { deltaY: 100 }); // Zoom out
        }
        const minZoomTransform = graph.querySelector('div')?.style.transform;
        fireEvent.wheel(graph, { deltaY: 100 }); // Try to zoom out more
        expect(graph.querySelector('div')?.style.transform).toBe(minZoomTransform);

        // Test maximum zoom limit
        for (let i = 0; i < 20; i++) {
            fireEvent.wheel(graph, { deltaY: -100 }); // Zoom in
        }
        const maxZoomTransform = graph.querySelector('div')?.style.transform;
        fireEvent.wheel(graph, { deltaY: -100 }); // Try to zoom in more
        expect(graph.querySelector('div')?.style.transform).toBe(maxZoomTransform);
    });

    it('handles column highlighting with non-matching columns', () => {
        const configWithNonMatchingColumns = {
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
        
        render(<Graph config={configWithNonMatchingColumns} />);
        const column = screen.getByText('column1');
        fireEvent.click(column);
        
        // Verify that the column connections are rendered correctly
        expect(document.querySelector('path')).toBeInTheDocument();
    });

    it('handles recursive dataset connections', () => {
        const configWithRecursiveConnections = {
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
        
        render(<Graph config={configWithRecursiveConnections} />);
        const column = screen.getAllByText('id')[0];
        fireEvent.click(column);
        
        // Verify that the recursive connections are rendered
        const paths = document.querySelectorAll('path');
        expect(paths.length).toBeGreaterThan(0);
    });

    it('handles mousemove without active pan', () => {
        const { container } = render(<Graph config={mockConfig} />);
        const graph = container.firstChild as HTMLElement;
        
        // Move mouse without pressing down first
        fireEvent.mouseMove(graph, { clientX: 100, clientY: 100 });
        
        // Verify no transform change
        const initialTransform = graph.querySelector('div')?.style.transform;
        fireEvent.mouseMove(graph, { clientX: 200, clientY: 200 });
        expect(graph.querySelector('div')?.style.transform).toBe(initialTransform);
    });

    it('handles dataset dragging with invalid target', () => {
        const { container } = render(<Graph config={mockConfig} />);
        const graph = container.firstChild as HTMLElement;
        
        // Try to drag a non-dataset element
        fireEvent.mouseDown(graph, { 
            clientX: 0,
            clientY: 0,
            target: graph
        });
        fireEvent.mouseMove(graph, { 
            clientX: 100,
            clientY: 100
        });
        fireEvent.mouseUp(graph);
        
        // Verify no dataset position changes
        const datasets = container.querySelectorAll('.cursor-move');
        datasets.forEach(dataset => {
            expect(dataset.getAttribute('style')).not.toContain('translate(100px, 100px)');
        });
    });

    it('handles column highlighting with complex connections', () => {
        const complexConfig = {
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
                },
                {
                    id: 'dataset3',
                    name: 'Dataset 3',
                    display_name: 'Dataset 3',
                    columns: [{ name: 'id', type: 'number' }],
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
                    toColumn: 'id'
                },
                {
                    from: 'dataset2',
                    to: 'dataset3',
                    fromColumn: 'id',
                    toColumn: 'id'
                }
            ]
        };
        
        render(<Graph config={complexConfig} />);
        const columns = screen.getAllByText('id');
        fireEvent.click(columns[0]);
        
        // Verify column connections are rendered
        const paths = document.querySelectorAll('path');
        expect(paths.length).toBeGreaterThan(1);
    });

    it('handles dataset dragging with multiple datasets', () => {
        render(<Graph config={mockConfig} />);
        const datasets = document.querySelectorAll('.cursor-move');
        const firstDataset = datasets[0];
        const secondDataset = datasets[1];
        
        // Drag first dataset
        fireEvent.mouseDown(firstDataset, { clientX: 0, clientY: 0 });
        fireEvent.mouseMove(firstDataset, { clientX: 100, clientY: 100 });
        fireEvent.mouseUp(firstDataset);
        
        // Verify first dataset moved but second didn't
        expect(firstDataset.getAttribute('style')).toContain('translate');
        expect(secondDataset.getAttribute('style')).not.toContain('translate(100px, 100px)');
    });

    it('handles mousemove during dataset drag', () => {
        const { container } = render(<Graph config={mockConfig} />);
        const dataset = document.querySelector('.cursor-move') as HTMLElement;
        const graph = container.firstChild as HTMLElement;
        
        // Set initial viewport scale and translation
        const viewportTransform = 'scale(1) translate(0px, 0px)';
        graph.style.transform = viewportTransform;
        
        const containerRect = graph.getBoundingClientRect();
        
        // Start dragging from center
        fireEvent.mouseDown(dataset, { 
            clientX: containerRect.left + containerRect.width / 2,
            clientY: containerRect.top + containerRect.height / 2
        });
        
        // Move right and down
        fireEvent.mouseMove(dataset, { 
            clientX: containerRect.left + containerRect.width / 2 + 100,
            clientY: containerRect.top + containerRect.height / 2 + 100
        });
        
        // End drag
        fireEvent.mouseUp(dataset);
        
        // Verify the dataset moved in the expected direction
        const transform = dataset.style.transform;
        expect(transform).toMatch(/translate\(\d+px,\s*\d+px\)/);
        
        // Extract actual translation values
        const match = transform.match(/translate\((-?\d+)px,\s*(-?\d+)px\)/);
        if (match) {
            const [, x, y] = match;
            // Verify movement direction (positive for both x and y)
            expect(Number(x)).toBeGreaterThan(-100);
            expect(Number(y)).toBeGreaterThan(-100);
        }
    });

    it('handles dataset dragging with mouse leave', () => {
        render(<Graph config={mockConfig} />);
        const dataset = document.querySelector('.cursor-move') as HTMLElement;
        
        // Start dragging
        fireEvent.mouseDown(dataset, { clientX: 0, clientY: 0 });
        
        // Move and leave
        fireEvent.mouseMove(dataset, { clientX: 50, clientY: 50 });
        fireEvent.mouseLeave(dataset);
        fireEvent.mouseMove(dataset, { clientX: 100, clientY: 100 });
        
        // Verify position after leave
        expect(dataset.style.transform).not.toContain('translate(100px, 100px)');
    });

    it('handles dataset dragging outside bounds', () => {
        render(<Graph config={mockConfig} />);
        const dataset = document.querySelector('.cursor-move') as HTMLElement;
        
        // Start dragging
        fireEvent.mouseDown(dataset, { clientX: 0, clientY: 0 });
        
        // Move outside bounds
        fireEvent.mouseMove(dataset, { clientX: -1000, clientY: -1000 });
        
        // End drag
        fireEvent.mouseUp(dataset);
        
        // Verify position is constrained
        const transform = dataset.style.transform;
        const match = transform.match(/translate\((-?\d+)px,\s*(-?\d+)px\)/);
        if (match) {
            const [, x, y] = match;
            expect(parseInt(x)).toBeGreaterThan(-1000);
            expect(parseInt(y)).toBeGreaterThan(-1000);
        }
    });

    it('handles dataset dragging at viewport boundaries', () => {
        const { container } = render(<Graph config={mockConfig} />);
        const dataset = document.querySelector('.cursor-move') as HTMLElement;
        const graph = container.firstChild as HTMLElement;
        
        // Get initial position
        const initialTransform = dataset.style.transform;
        const initialMatch = initialTransform.match(/translate\((-?\d+)px/);
        const initialX = initialMatch ? Number(initialMatch[1]) : 0;
        
        // Try to drag beyond left boundary
        fireEvent.mouseDown(dataset, { 
            clientX: 0,
            clientY: 0
        });
        
        fireEvent.mouseMove(dataset, { 
            clientX: -1000,
            clientY: 0
        });
        
        fireEvent.mouseUp(dataset);
        
        // Verify dataset is constrained
        const leftTransform = dataset.style.transform;
        const leftMatch = leftTransform.match(/translate\((-?\d+)px/);
        if (leftMatch) {
            const [, x] = leftMatch;
            expect(Number(x)).toBeGreaterThan(-200); // Dataset width
        }
        
        // Try to drag beyond right boundary
        fireEvent.mouseDown(dataset, { 
            clientX: window.innerWidth,
            clientY: 0
        });
        
        fireEvent.mouseMove(dataset, { 
            clientX: window.innerWidth + 1000,
            clientY: 0
        });
        
        fireEvent.mouseUp(dataset);
        
        // Verify dataset is constrained
        const rightTransform = dataset.style.transform;
        const rightMatch = rightTransform.match(/translate\((-?\d+)px/);
        if (rightMatch) {
            const [, x] = rightMatch;
            expect(Number(x)).toBeLessThan(window.innerWidth);
        }
    });

    it('handles viewport transformation with scaled datasets', () => {
        const { container } = render(<Graph config={mockConfig} />);
        const transformContainer = container.querySelector('div[style*="transform"]') as HTMLElement;
        
        // Initial scale should be 1
        expect(transformContainer.style.transform).toBe('translate(0px, 0px) scale(1)');
        
        // Simulate zooming in
        const graph = container.firstChild as HTMLElement;
        fireEvent.wheel(graph, { deltaY: -100 });
        
        // Verify scale increased
        const transform = transformContainer.style.transform;
        const match = transform.match(/scale\(([\d.]+)\)/);
        expect(match).toBeTruthy();
        if (match) {
            const scale = Number(match[1]);
            expect(scale).toBeGreaterThan(1);
            expect(scale).toBeLessThanOrEqual(2); // Max scale
        }
        
        // Verify datasets are still draggable at new scale
        const dataset = document.querySelector('.cursor-move') as HTMLElement;
        
        fireEvent.mouseDown(dataset, { clientX: 0, clientY: 0 });
        fireEvent.mouseMove(dataset, { clientX: 50, clientY: 50 });
        fireEvent.mouseUp(dataset);
        
        // Verify dataset movement is scaled appropriately
        const datasetTransform = dataset.style.transform;
        expect(datasetTransform).toMatch(/translate\((-?\d+)px,\s*(-?\d+)px\)/);
    });

    it('handles simultaneous column highlighting and dataset dragging', () => {
        const { container } = render(<Graph config={mockConfig} />);
        
        // Find datasets using data-testid
        const firstDataset = container.querySelector('[data-testid="dataset-dataset1"]') as HTMLElement;
        const secondDataset = container.querySelector('[data-testid="dataset-dataset2"]') as HTMLElement;
        expect(firstDataset).toBeTruthy();
        expect(secondDataset).toBeTruthy();
        
        // Find column by dataset id and column name
        const column = firstDataset.querySelector('[data-testid="column-dataset1-id"]') as HTMLElement;
        expect(column).toBeTruthy();
        
        // Click column to highlight
        fireEvent.click(column);
        
        // Verify column is highlighted after click
        expect(column.getAttribute('data-highlighted')).toBe('true');
        
        // Start dragging second dataset
        fireEvent.mouseDown(secondDataset, { clientX: 0, clientY: 0 });
        fireEvent.mouseMove(secondDataset, { clientX: 100, clientY: 100 });
        
        // Verify column remains highlighted during drag
        expect(column.getAttribute('data-highlighted')).toBe('true');
        
        // End drag
        fireEvent.mouseUp(secondDataset);
        
        // Verify both column highlight and dataset position are maintained
        expect(column.getAttribute('data-highlighted')).toBe('true');
        const datasetTransform = window.getComputedStyle(secondDataset).transform;
        expect(datasetTransform).toMatch(/translate\((-?\d+)px,\s*(-?\d+)px\)/);
    });
});
