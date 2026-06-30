import React, { useEffect, useRef, useState } from 'react';
import type { SearchResult, VideoSegment, Provenance } from '../lib/types';
import { getBlobUrl, getBlobPageUrl, api } from '../lib/api';
import { FileQuestion, Music, Play, Copy, Search as SearchIcon, Loader2 } from 'lucide-react';

interface ResultCardProps {
    result: SearchResult;
    // Reverse-image search supplies these so exact-match is authoritative
    // (driven by exact_duplicate_blob_id, not a score heuristic).
    exactDuplicateBlobId?: string | null;
    provenance?: Provenance | null;
    // Called when the blob fails to load (aggregator 404 for expired/broken blobs).
    // When provided, the parent removes the card instead of showing a placeholder.
    onBroken?: (blobId: string) => void;
}

const KIND_BADGE: Record<string, { label: string; className: string }> = {
    image: { label: 'IMG', className: 'text-ocean-700 dark:text-cyan-300 bg-ocean-100 dark:bg-slate-800' },
    audio: { label: 'AUD', className: 'text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/40' },
    video: { label: 'VID', className: 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40' },
};

const formatTime = (seconds: number) => {
    const s = Math.max(0, Math.floor(seconds));
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    return `${mm}:${ss.toString().padStart(2, '0')}`;
};

export const ResultCard: React.FC<ResultCardProps> = ({ result, exactDuplicateBlobId, provenance, onBroken }) => {
    const [error, setError] = useState(false);
    const [isRevealed, setIsRevealed] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    // A broken blob 404s from the aggregator. Auto-hide it (parent drops the card);
    // fall back to the in-place "Broken Blob" placeholder when no handler is given.
    const handleMediaError = () => {
        if (onBroken) onBroken(result.blob_id);
        else setError(true);
    };

    // Segments may come from the initial search or be fetched on demand via in-video search.
    const [segments, setSegments] = useState<VideoSegment[]>(result.segments ?? []);
    const [inVideoQuery, setInVideoQuery] = useState('');
    const [inVideoLoading, setInVideoLoading] = useState(false);
    const [inVideoError, setInVideoError] = useState<string | null>(null);

    const mediaUrl = getBlobUrl(result.blob_id);
    const pageUrl = getBlobPageUrl(result.blob_id);
    const isNsfw = result.is_nsfw || false;
    const kind = result.kind || 'image';
    const badge = KIND_BADGE[kind] || KIND_BADGE.image;
    const blurred = isNsfw && !isRevealed;
    // Authoritative exact-duplicate match from reverse-image search (not a score heuristic).
    const isExactDuplicate = !!exactDuplicateBlobId && result.blob_id === exactDuplicateBlobId;

    // Aggregators serve audio with no usable Content-Type *and* `nosniff`, so the
    // <audio> decoder rejects the bytes. Fetch them and re-wrap in a typed Blob to
    // force the MIME (CORS is open, so fetch works). Only needed for audio.
    const [audioSrc, setAudioSrc] = useState<string | null>(null);
    useEffect(() => {
        if (kind !== 'audio' || blurred) return;
        let objectUrl: string | null = null;
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(mediaUrl);
                if (!res.ok) throw new Error(String(res.status));
                const raw = await res.blob();
                const typed = raw.type.startsWith('audio/')
                    ? raw
                    : new Blob([raw], { type: result.mime_type || 'audio/mpeg' });
                objectUrl = URL.createObjectURL(typed);
                if (cancelled) URL.revokeObjectURL(objectUrl);
                else setAudioSrc(objectUrl);
            } catch {
                if (!cancelled) handleMediaError();
            }
        })();
        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mediaUrl, kind, blurred]);

    const seekTo = (segment: VideoSegment) => {
        const video = videoRef.current;
        if (!video) return;
        video.currentTime = segment.start;
        video.play().catch(() => { /* autoplay may be blocked; user can press play */ });
    };

    const runInVideoSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        const q = inVideoQuery.trim();
        if (!q || inVideoLoading) return;
        setInVideoLoading(true);
        setInVideoError(null);
        try {
            const segs = await api.inVideoSearch(result.blob_id, q);
            setSegments(segs);
            if (segs.length === 0) setInVideoError('No matching moments');
        } catch (err: any) {
            setInVideoError(err?.message || 'In-video search failed');
        } finally {
            setInVideoLoading(false);
        }
    };

    const nsfwOverlay = blurred && (
        <div className="absolute inset-0 flex-center z-20">
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsRevealed(true);
                }}
                className="bg-red-600 text-white font-black px-4 py-2 border-2 border-white shadow-[4px_4px_0px_#000] hover:translate-y-0.5 hover:shadow-none transition-all uppercase text-sm"
            >
                NSFW • Show
            </button>
        </div>
    );

    const renderMedia = () => {
        if (error) {
            return (
                <div className="text-gray-400 flex flex-col items-center p-8">
                    <FileQuestion className="w-8 h-8 mb-2" />
                    <span className="text-xs font-mono">Broken Blob</span>
                </div>
            );
        }

        if (kind === 'audio') {
            return (
                <div className="w-full p-4 flex flex-col items-center gap-3 bg-gradient-to-br from-purple-100 to-ocean-50 dark:from-purple-900/30 dark:to-slate-800">
                    <div className="w-14 h-14 flex-center border-2 border-black dark:border-white bg-white dark:bg-slate-900 shadow-[2px_2px_0px_#000]">
                        <Music className="w-7 h-7 text-purple-600 dark:text-purple-300" />
                    </div>
                    <audio
                        src={blurred ? undefined : (audioSrc ?? undefined)}
                        controls
                        preload="metadata"
                        onError={handleMediaError}
                        className="w-full"
                    />
                    {nsfwOverlay}
                </div>
            );
        }

        if (kind === 'video') {
            const firstSegment = segments[0];
            // Seed playback at the first matching segment when present.
            const src = firstSegment ? `${mediaUrl}#t=${firstSegment.start}` : mediaUrl;
            return (
                <>
                    <video
                        ref={videoRef}
                        src={blurred ? undefined : src}
                        controls
                        preload="metadata"
                        playsInline
                        onError={handleMediaError}
                        className={`w-full h-auto block ${blurred ? 'blur-xl' : ''}`}
                    />
                    {nsfwOverlay}
                </>
            );
        }

        // image (default)
        return (
            <>
                <img
                    src={mediaUrl}
                    alt={`Blob ${result.blob_id}`}
                    className={`w-full h-auto object-cover block transition-transform duration-500 group-hover:scale-110 ${blurred ? 'blur-xl scale-110' : ''}`}
                    loading="lazy"
                    onError={handleMediaError}
                />
                {nsfwOverlay}
                <a href={pageUrl} target="_blank" rel="noopener noreferrer" className={`absolute inset-0 ${blurred ? 'pointer-events-none' : ''}`} />
            </>
        );
    };

    return (
        <div className="group relative bg-white dark:bg-slate-900 border-3 border-black dark:border-white shadow-retro dark:shadow-[4px_4px_0px_#000] transition-all duration-200 hover:-translate-y-2 hover:shadow-[8px_8px_0px_#000] dark:hover:shadow-[8px_8px_0px_#000] h-full flex flex-col">
            <div className="block relative">
                <div className="bg-ocean-50 dark:bg-slate-800 overflow-hidden relative min-h-[150px] flex-center border-b-3 border-black dark:border-white">
                    {/* Authoritative exact-duplicate flag (reverse-image: exact_duplicate_blob_id) */}
                    {isExactDuplicate && (
                        <div className="absolute top-2 left-2 z-30 flex items-center gap-1 bg-green-500 text-black font-mono text-[10px] font-black uppercase px-2 py-1 border-2 border-black shadow-[2px_2px_0px_#000]">
                            <Copy className="w-3 h-3" strokeWidth={3} />
                            Exact Match
                        </div>
                    )}
                    {renderMedia()}
                    {/* Hover Overlay (image only — keeps media controls interactive) */}
                    {kind === 'image' && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 dark:group-hover:bg-white/10 transition-colors pointer-events-none" />
                    )}
                </div>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 border-t-3 border-black dark:border-white transition-colors">
                <div className="flex justify-between items-center mb-2">
                    <span className={`font-mono text-xs font-bold px-2 py-0.5 border border-black/20 dark:border-white/40 rounded-sm ${badge.className}`}>
                        {badge.label}
                    </span>
                    <div className="text-xs font-bold bg-coral dark:bg-pink-600 text-white border border-black dark:border-white px-1.5 py-0.5 shadow-[1px_1px_0px_#000] dark:shadow-[2px_2px_0px_#000]">
                        {result.similarity % 1 === 0 ? result.similarity.toFixed(0) : result.similarity.toFixed(1)}%
                    </div>
                </div>

                {/* Caption */}
                {result.caption && (
                    <p className="text-xs text-gray-700 dark:text-gray-300 mb-2 line-clamp-2" title={result.caption}>
                        {result.caption}
                    </p>
                )}

                {/* Search inside this video (in-video → segments) */}
                {kind === 'video' && (
                    <form onSubmit={runInVideoSearch} className="flex gap-1.5 mb-2">
                        <input
                            type="text"
                            value={inVideoQuery}
                            onChange={(e) => setInVideoQuery(e.target.value)}
                            placeholder="Search inside this video…"
                            className="flex-1 min-w-0 font-mono text-[10px] px-2 py-1 border border-black dark:border-white bg-white dark:bg-slate-800 text-black dark:text-white placeholder:text-gray-400 focus:outline-none"
                        />
                        <button
                            type="submit"
                            disabled={inVideoLoading || !inVideoQuery.trim()}
                            title="Find matching moments"
                            className="flex items-center justify-center px-2 py-1 bg-amber-300 dark:bg-amber-700 text-black dark:text-white border border-black dark:border-white shadow-[1px_1px_0px_#000] hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {inVideoLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <SearchIcon className="w-3 h-3" />}
                        </button>
                    </form>
                )}
                {kind === 'video' && inVideoError && (
                    <div className="text-[10px] font-mono text-red-500 mb-2">{inVideoError}</div>
                )}

                {/* Seek-to-timestamp controls for video segments */}
                {kind === 'video' && segments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        {segments.map((seg, i) => (
                            <button
                                key={`${seg.start}-${i}`}
                                onClick={() => seekTo(seg)}
                                title={`Seek to ${formatTime(seg.start)}–${formatTime(seg.end)}`}
                                className="flex items-center gap-1 font-mono text-[10px] font-bold bg-amber-200 dark:bg-amber-900/50 text-black dark:text-amber-200 border border-black dark:border-white px-1.5 py-0.5 shadow-[1px_1px_0px_#000] hover:translate-y-0.5 hover:shadow-none transition-all"
                            >
                                <Play className="w-2.5 h-2.5" />
                                {formatTime(seg.start)}
                            </button>
                        ))}
                    </div>
                )}

                {/* Provenance: prefer authoritative reverse-image provenance on an exact match,
                    otherwise fall back to the result's own NFT / quilt fields. */}
                {(() => {
                    const owner = (isExactDuplicate && provenance?.owner) || result.owner;
                    const quilt = (isExactDuplicate && provenance?.parent_quilt_id) || result.parent_quilt_id;
                    if (!owner && !quilt) return null;
                    return (
                        <div className="text-[10px] font-mono text-gray-500 dark:text-gray-400 mb-2 space-y-0.5">
                            {owner && <div className="truncate">owner: {owner}</div>}
                            {quilt && <div className="truncate">quilt: {quilt}</div>}
                        </div>
                    );
                })()}

                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-zinc-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full border border-black dark:border-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:shadow-none"></div>
                    <div className="text-[10px] font-mono text-gray-500 dark:text-gray-300 truncate flex-1">
                        {result.blob_id}
                    </div>
                </div>
            </div>
        </div>
    );
};
