export interface SearchResult {
    blob_id: string;
    mime_type: string;
    size: number;
    similarity: number;
    extension?: string | null;
    kind?: string | null;
    is_nsfw?: boolean;
}

export interface SearchResponse {
    results: SearchResult[];
    total: number;
}

export interface SearchRequest {
    query: string;
    top_k?: number;
    exclude_nsfw?: boolean;
}

export interface VectorStoreStats {
    total_embeddings: number;
    index_built: boolean;
    status?: string | null;
}

export interface ApiError {
    detail: string | { loc: (string | number)[]; msg: string; type: string }[];
}

export interface MediaCounters {
    total_blobs: number;
    active_blobs: number;
    identified_image: number;
    identified_video: number;
    identified_audio: number;
    modality_counts_all: Record<string, number>;
}

export interface ClassifierCounts {
    categories: Record<string, number>;
}
