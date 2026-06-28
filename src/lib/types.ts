export type MediaKind = 'image' | 'audio' | 'video';

export type Modality = 'all' | 'image' | 'audio' | 'video';

export interface VideoSegment {
    start: number; // seconds
    end: number;   // seconds
    score?: number;
}

export interface SearchResult {
    blob_id: string;
    mime_type: string;
    size: number;
    similarity: number;
    extension?: string | null;
    kind?: MediaKind | null;
    is_nsfw?: boolean;
    // Human-readable caption returned with every result.
    caption?: string | null;
    // NFT / quilt provenance
    is_quilt?: boolean;
    parent_quilt_id?: string | null;
    quilt_identifier?: string | null;
    owner?: string | null;
    // Video temporal navigation (Seek to Timestamp)
    segments?: VideoSegment[];
}

export interface SearchResponse {
    results: SearchResult[];
    total: number;
}

// Provenance of an exact-duplicate match (reverse-image search).
export interface Provenance {
    owner?: string | null;            // original holder
    parent_quilt_id?: string | null; // source collection
    [key: string]: unknown;
}

// Reverse-image search adds authoritative duplicate/provenance metadata on top
// of the regular search response.
export interface ReverseImageResponse extends SearchResponse {
    query_phash?: string | null;
    duplicates_found?: number;
    exact_duplicate_blob_id?: string | null;
    provenance?: Provenance | null;
}

export interface SearchRequest {
    query: string;
    top_k?: number;
    exclude_nsfw?: boolean;
}

export interface InVideoRequest {
    blob_id: string;
    query: string;
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
