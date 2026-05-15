import type { SearchRequest, SearchResponse, SearchResult, VectorStoreStats, MediaCounters, ClassifierCounts } from './types';

const API_BASE_URL = import.meta.env.DEV ? '/api' : 'https://api.omura.fun';

// Used for fetching the actual image content (Walrus Mainnet Aggregator)
export const getBlobUrl = (blobId: string) => {
    return `https://agrregator.omura.fun/v1/blobs/${blobId}`;
};

// Used for the navigation link when clicking the result
export const getBlobPageUrl = (blobId: string) => {
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

const normalizeSearchResults = (data: any): SearchResponse => {
    const rawResults = data.results ?? data ?? [];
    const results: SearchResult[] = (Array.isArray(rawResults) ? rawResults : []).map((item: any) => {
        // Prioritize 'score' from the example backend response
        let similarity = item.score ?? item.similarity ?? item.distance ?? 0;
        
        // Conditional scaling: if it's very small (0-1), it's likely a decimal percentage.
        // If it's already > 1 (like 97.7), we keep it as is.
        if (typeof similarity === 'number' && similarity > 0 && similarity <= 1) {
            similarity *= 100;
        }

        return {
            blob_id: item.blob_id ?? item.blobId ?? '',
            mime_type: item.mime_type ?? item.mimeType ?? 'image/unknown',
            size: item.size ?? 0,
            similarity,
            extension: item.extension ?? null,
            kind: item.kind ?? null,
            is_nsfw: item.is_nsfw ?? item.isNsfw ?? false,
        };
    });

    return { results, total: data.total ?? results.length };
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

        const data = await response.json();
        return normalizeSearchResults(data);
    },

    getStats: async (): Promise<VectorStoreStats> => {
        const response = await fetchWithRetry(`${API_BASE_URL}/search/stats`);

        if (!response.ok) {
            throw new Error(`Failed to fetch stats: ${response.statusText}`);
        }

        return response.json();
    },

    getMediaCounters: async (): Promise<MediaCounters> => {
        const response = await fetchWithRetry(`${API_BASE_URL}/search/dashboard/media-counters`);

        if (!response.ok) {
            throw new Error(`Failed to fetch media counters: ${response.statusText}`);
        }

        return response.json();
    },

    reverseImageSearch: async (file: File, topK = 10, excludeNsfw = true): Promise<SearchResponse> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('top_k', String(topK));
        formData.append('exclude_nsfw', String(excludeNsfw));

        const response = await fetchWithRetry(`${API_BASE_URL}/search/reverse-image`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            try {
                const errorData = await response.json();
                throw new Error(JSON.stringify(errorData));
            } catch {
                throw new Error(`Reverse image search failed: ${response.statusText}`);
            }
        }

        const data = await response.json();
        return normalizeSearchResults(data);
    },

    getClassifierCounts: async (): Promise<ClassifierCounts> => {
        const response = await fetchWithRetry(`${API_BASE_URL}/search/dashboard/classifier-counts`);

        if (!response.ok) {
            throw new Error(`Failed to fetch classifier counts: ${response.statusText}`);
        }

        return response.json();
    },
};
