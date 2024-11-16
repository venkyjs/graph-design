import { GraphConfig } from '../types/graph';

export const fetchGraphConfig = async (): Promise<GraphConfig> => {
    try {
        // In a real application, this would be an API call
        const response = await fetch('/data/graph-config.json');
        if (!response.ok) {
            throw new Error('Failed to fetch graph configuration');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching graph configuration:', error);
        throw error;
    }
};
