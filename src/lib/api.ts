import type { SearchRequest, SearchResponse, VectorStoreStats } from './types';

const API_BASE_URL = '/api'; // Use proxy for development

export const getBlobUrl = (blobId: string) => {
    // For images, we can use the direct URL if needed, but proxy is safer for dev.
    // However, if we deploy this statically, we need the real URL.
    // For now, let's stick to the proxy path for dev, and we can adjust for prod envs.
    // Actually, for static build deployment, we need the FULL URL because there's no Vite proxy in production.
    // But adhering to "refining" based on CORS, let's handle both.
    // Simpler approach: Use full URL for prod (static), proxy for dev.
    if (import.meta.env.DEV) {
        return `${API_BASE_URL}/blob/${blobId}`;
    }
    return `https://api.omura.fun/blob/${blobId}`;
};

const fetchWithRetry = async (url: string, options: RequestInit = {}, retries = 3, backoff = 500): Promise<Response> => {
    try {
        const response = await fetch(url, options);
        if (!response.ok && response.status >= 500 && retries > 0) {
            throw new Error(`Server error: ${response.status}`);
        }
        return response;
    } catch (err) {
        if (retries > 0) {
            console.warn(`Fetch failed, retrying... (${retries} left)`);
            await new Promise(r => setTimeout(r, backoff));
            return fetchWithRetry(url, options, retries - 1, backoff * 2);
        }
        throw err;
    }
};

export const api = {
    search: async (req: SearchRequest): Promise<SearchResponse> => {
        const response = await fetchWithRetry(`${API_BASE_URL}/search/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req),
        });

        if (!response.ok) {
            // Try to parse error detail from JSON
            try {
                const errorData = await response.json();
                throw new Error(JSON.stringify(errorData));
            } catch (e) {
                throw new Error(`Search failed: ${response.statusText}`);
            }
        }

        return response.json();
    },

    getStats: async (): Promise<VectorStoreStats> => {
        const response = await fetchWithRetry(`${API_BASE_URL}/search/stats`);

        if (!response.ok) {
            throw new Error(`Failed to fetch stats: ${response.statusText}`);
        }

        return response.json();
    }
};
