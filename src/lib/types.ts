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
}

export interface VectorStoreStats {
    total_embeddings: number;
    index_built: boolean;
    status?: string | null;
}

export interface ApiError {
    detail: string | { loc: (string | number)[]; msg: string; type: string }[];
}
