import type { SearchRequest, SearchResponse, VectorStoreStats } from './types';

const API_BASE_URL = import.meta.env.DEV ? '/api' : 'https://api.omura.fun';

export const getBlobUrl = (blobId: string) => {
    return `https://walrus-mainnet-aggregator.redundex.com/v1/blobs/${blobId}`;
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
