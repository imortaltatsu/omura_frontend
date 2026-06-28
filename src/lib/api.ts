import type { SearchRequest, SearchResponse, SearchResult, VectorStoreStats, MediaCounters, ClassifierCounts, MediaKind, Modality, VideoSegment, ReverseImageResponse } from './types';

// Audio/video search runs a liveness precheck (~1–2s) and can take ≥30s; in-video
// is on-demand (≤90s warm, but the first cold call can run longer). Give the
// slowest path generous headroom so we don't abort a request that would succeed.
const REQUEST_TIMEOUT_MS = 120_000;

// apiv2 is the current backend (= berryserver:19543 over Tailscale, which the dev
// proxy targets). It has the multimodal audio/video/in-video routes that the old
// api.omura.fun lacks, and CORS allows the https://omura.fun origin directly.
const API_BASE_URL = import.meta.env.DEV ? '/api' : 'https://apiv2.omura.fun';

const AGGREGATORS = [
    'https://agrregator.omura.fun',
    'https://aggregator.walrus-mainnet.walrus.space'
];

// Used for fetching the actual media content.
// Serves raw bytes with the correct Content-Type for image/audio/video and
// supports HTTP Range (206) requests, which video seeking relies on.
export const getBlobUrl = (blobId: string) => {
    // Pick an aggregator deterministically so the same id always hits the same
    // node (maximizes cache hits while balancing load).
    let hash = 0;
    for (let i = 0; i < blobId.length; i++) {
        hash = blobId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const aggregator = AGGREGATORS[Math.abs(hash) % AGGREGATORS.length];

    // Quilt patch: a composite "<quiltId>::<identifier>" id. This is NOT a blob id —
    // the plain /v1/blobs/ path (and the /blob proxy) reject it with "failed to parse
    // a blob ID". Walrus serves quilt patches via the by-quilt-id endpoint instead.
    const sep = blobId.indexOf('::');
    if (sep !== -1) {
        const quiltId = blobId.slice(0, sep);
        const identifier = blobId.slice(sep + 2);
        return `${aggregator}/v1/blobs/by-quilt-id/${encodeURIComponent(quiltId)}/${encodeURIComponent(identifier)}`;
    }

    // Plain blob: address it directly by blob id.
    return `${aggregator}/v1/blobs/${encodeURIComponent(blobId)}`;
};

// Used for the navigation link when clicking the result
export const getBlobPageUrl = (blobId: string) => {
    // URL-encode: quilt-patch ids contain "::" which must be escaped for /blob.
    return `https://apiv2.omura.fun/blob/${encodeURIComponent(blobId)}`;
};

const fetchWithRetry = async (url: string, options: RequestInit = {}, retries = 3, backoff = 500): Promise<Response> => {
    // Abort a hung request so it can't hang the UI forever. A caller-supplied
    // signal still wins (we only add our own timeout when none was passed).
    const controller = options.signal ? null : new AbortController();
    const timeout = controller ? setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS) : null;
    try {
        const response = await fetch(url, controller ? { ...options, signal: controller.signal } : options);
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
    } finally {
        if (timeout) clearTimeout(timeout);
    }
};

// Infer the media kind from an explicit field or, failing that, the mime type.
const inferKind = (item: any): MediaKind => {
    const raw = (item.kind ?? '').toString().toLowerCase();
    if (raw === 'image' || raw === 'audio' || raw === 'video') return raw;

    const mime = (item.mime_type ?? item.mimeType ?? '').toString().toLowerCase();
    if (mime.startsWith('audio/')) return 'audio';
    if (mime.startsWith('video/')) return 'video';
    return 'image';
};

const normalizeSegments = (item: any): VideoSegment[] | undefined => {
    const raw = item.segments;
    if (!Array.isArray(raw) || raw.length === 0) return undefined;
    const segments = raw
        .map((s: any) => ({
            start: Number(s.start ?? s.start_time ?? 0),
            end: Number(s.end ?? s.end_time ?? 0),
            score: s.score != null ? Number(s.score) : undefined,
        }))
        .filter((s: VideoSegment) => Number.isFinite(s.start) && Number.isFinite(s.end));
    return segments.length ? segments : undefined;
};

const normalizeSearchResults = (data: any): SearchResponse => {
    const rawResults = data.results ?? data ?? [];
    const results: SearchResult[] = (Array.isArray(rawResults) ? rawResults : []).map((item: any) => {
        // Backend scores are already on a 0–100 scale and pre-sorted — do NOT
        // re-normalize (per the apiv2 contract). Rescaling here would turn a
        // legitimate low score like 0.5 into 50.
        const similarity = item.score ?? item.similarity ?? 0;

        return {
            blob_id: item.blob_id ?? item.blobId ?? '',
            mime_type: item.mime_type ?? item.mimeType ?? 'image/unknown',
            size: item.size ?? 0,
            similarity,
            extension: item.extension ?? null,
            kind: inferKind(item),
            caption: item.caption ?? null,
            is_nsfw: item.is_nsfw ?? item.isNsfw ?? false,
            is_quilt: item.is_quilt ?? item.isQuilt ?? false,
            parent_quilt_id: item.parent_quilt_id ?? item.parentQuiltId ?? null,
            quilt_identifier: item.quilt_identifier ?? item.quiltIdentifier ?? null,
            owner: item.owner ?? null,
            segments: normalizeSegments(item),
        };
    });

    return { results, total: data.total ?? results.length };
};

// Maps a UI modality to its backend search endpoint.
// "all" and "image" both hit the text→media endpoint; "image" is filtered client-side.
const ENDPOINT_BY_MODALITY: Record<Modality, string> = {
    all: '/search/',
    image: '/search/',
    audio: '/search/audio',
    video: '/search/video',
};

export const api = {
    search: async (req: SearchRequest, modality: Modality = 'all'): Promise<SearchResponse> => {
        const endpoint = ENDPOINT_BY_MODALITY[modality] ?? '/search/';
        const response = await fetchWithRetry(`${API_BASE_URL}${endpoint}`, {
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
        const normalized = normalizeSearchResults(data);

        // The "image" toggle shares the text→media endpoint; keep only images.
        if (modality === 'image') {
            normalized.results = normalized.results.filter(r => r.kind === 'image');
            normalized.total = normalized.results.length;
        }

        return normalized;
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

    reverseImageSearch: async (file: File, topK = 10, excludeNsfw = true, verifyDuplicates = true): Promise<ReverseImageResponse> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('top_k', String(topK));
        formData.append('exclude_nsfw', String(excludeNsfw));
        formData.append('verify_duplicates', String(verifyDuplicates));

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
        // Carry the authoritative duplicate/provenance fields through alongside the
        // normalized results (exact_duplicate_blob_id is the source of truth, not score).
        return {
            ...normalizeSearchResults(data),
            query_phash: data.query_phash ?? null,
            duplicates_found: data.duplicates_found ?? 0,
            exact_duplicate_blob_id: data.exact_duplicate_blob_id ?? null,
            provenance: data.provenance ?? null,
        };
    },

    // Find matching moments inside a single video. Returns the video's matching
    // segments (start/end seconds) for the given query — drives "Seek to mm:ss".
    inVideoSearch: async (blobId: string, query: string): Promise<VideoSegment[]> => {
        const response = await fetchWithRetry(`${API_BASE_URL}/search/video/in-video`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ blob_id: blobId, query }),
        });

        if (!response.ok) {
            try {
                const errorData = await response.json();
                throw new Error(JSON.stringify(errorData));
            } catch {
                throw new Error(`In-video search failed: ${response.statusText}`);
            }
        }

        const data = await response.json();
        // The endpoint may return segments directly, under `segments`, or `results`.
        const raw = Array.isArray(data) ? data : (data.segments ?? data.results ?? []);
        return normalizeSegments({ segments: raw }) ?? [];
    },

    getClassifierCounts: async (): Promise<ClassifierCounts> => {
        const response = await fetchWithRetry(`${API_BASE_URL}/search/dashboard/classifier-counts`);

        if (!response.ok) {
            throw new Error(`Failed to fetch classifier counts: ${response.statusText}`);
        }

        return response.json();
    },
};
