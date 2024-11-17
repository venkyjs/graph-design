import { GraphConfig } from '../types/graph';
import config from '../data/graph-config.json';

export const fetchGraphConfig = async (): Promise<GraphConfig> => {
    try {
        // In development, use the imported config directly
        if (import.meta.env.DEV) {
            console.log('Using development config:', config);
            return config as GraphConfig;
        }

        // In production, fetch from public directory
        const response = await fetch('/data/graph-config.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch graph configuration: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Fetched config:', data);
        return data;
    } catch (error) {
        console.error('Error fetching graph configuration:', error);
        throw error;
    }
};
