import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import ColumnConnection from '../ColumnConnection';
import { DatasetWithPosition } from '../../types/graph';

describe('ColumnConnection Component', () => {
    const mockFromDataset: DatasetWithPosition = {
        id: 'dataset1',
        name: 'Dataset 1',
        display_name: 'Dataset 1',
        columns: [
            { name: 'id', type: 'number' },
            { name: 'name', type: 'string' }
        ],
        x: 0,
        y: 0,
        width: 200,
        height: 150
    };

    const mockToDataset: DatasetWithPosition = {
        id: 'dataset2',
        name: 'Dataset 2',
        display_name: 'Dataset 2',
        columns: [
            { name: 'id', type: 'number' },
            { name: 'dataset1Id', type: 'number' }
        ],
        x: 300,
        y: 0,
        width: 200,
        height: 150
    };

    it('renders connection between datasets', () => {
        const { container } = render(
            <ColumnConnection
                from={mockFromDataset}
                to={mockToDataset}
                columnName="id"
            />
        );
        expect(container.querySelector('path')).toBeInTheDocument();
        expect(container.querySelector('marker')).toBeInTheDocument();
    });

    it('renders connection with reversed datasets', () => {
        const { container } = render(
            <ColumnConnection
                from={mockToDataset}
                to={mockFromDataset}
                columnName="id"
            />
        );
        expect(container.querySelector('path')).toBeInTheDocument();
    });

    it('handles missing datasets gracefully', () => {
        const { container } = render(
            <ColumnConnection
                from={null as any}
                to={mockToDataset}
                columnName="id"
            />
        );
        expect(container.querySelector('path')).not.toBeInTheDocument();
    });

    it('handles missing columns gracefully', () => {
        const datasetWithoutColumn = {
            ...mockFromDataset,
            columns: []
        };
        const { container } = render(
            <ColumnConnection
                from={datasetWithoutColumn}
                to={mockToDataset}
                columnName="nonexistent"
            />
        );
        expect(container.querySelector('path')).toBeInTheDocument();
    });

    it('calculates correct path for distant datasets', () => {
        const distantDataset = {
            ...mockToDataset,
            x: 1000,
            y: 500
        };
        const { container } = render(
            <ColumnConnection
                from={mockFromDataset}
                to={distantDataset}
                columnName="id"
            />
        );
        const path = container.querySelector('path');
        expect(path).toBeInTheDocument();
        // Verify that the path uses control points for curve
        expect(path?.getAttribute('d')).toContain('C');
    });
});
