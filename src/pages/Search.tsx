import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Header } from '../components/Header';
import { ResultCard } from '../components/ResultCard';
import { api } from '../lib/api';
import type { SearchResult } from '../lib/types';
import { AlertCircle, ShieldOff, Shield } from 'lucide-react';

export const Search: React.FC = () => {
    const [searchParams, setSearchParams] = useState(window.location.search);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [reverseImageName, setReverseImageName] = useState<string | null>(null);
    const [excludeNsfw, setExcludeNsfw] = useState(() => localStorage.getItem('omura-exclude-nsfw') !== 'false');

    // Keep a ref to the last uploaded file so we can re-search on toggle
    const lastFileRef = useRef<File | null>(null);

    const toggleNsfw = () => {
        setExcludeNsfw(prev => {
            const next = !prev;
            localStorage.setItem('omura-exclude-nsfw', String(next));
            return next;
        });
    };

    const handleImageSearch = useCallback(async (file: File, nsfw?: boolean) => {
        lastFileRef.current = file;
        setLoading(true);
        setError(null);
        setReverseImageName(file.name);
        setResults([]);
        try {
            const data = await api.reverseImageSearch(file, 50, nsfw ?? excludeNsfw);
            setResults(data.results);
        } catch (err: any) {
            setError(err.message || 'Reverse image search failed');
        } finally {
            setLoading(false);
        }
    }, [excludeNsfw]);

    const imageSearchRef = useRef(handleImageSearch);
    imageSearchRef.current = handleImageSearch;

    useEffect(() => {
        const onSearchUpdate = () => setSearchParams(window.location.search);

        window.addEventListener('omura-search', onSearchUpdate);
        window.addEventListener('popstate', onSearchUpdate);
        return () => {
            window.removeEventListener('omura-search', onSearchUpdate);
            window.removeEventListener('popstate', onSearchUpdate);
        };
    }, []);

    useEffect(() => {
        const onReverseSearch = (e: Event) => {
            const file = (e as CustomEvent).detail as File;
            if (file) imageSearchRef.current(file);
        };
        window.addEventListener('omura-reverse-search', onReverseSearch);
        return () => window.removeEventListener('omura-reverse-search', onReverseSearch);
    }, []);

    const query = new URLSearchParams(searchParams).get('q') || '';

    // Re-fetch text search when query or excludeNsfw changes
    useEffect(() => {
        if (!query) return;
        setReverseImageName(null);
        lastFileRef.current = null;

        const fetchResults = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await api.search({ query, top_k: 50, exclude_nsfw: excludeNsfw });
                setResults(data.results);
            } catch (err: any) {
                setError(err.message || 'Something went wrong');
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [query, excludeNsfw]);

    // Re-fetch reverse image search when excludeNsfw changes
    useEffect(() => {
        if (!lastFileRef.current || query) return;
        handleImageSearch(lastFileRef.current, excludeNsfw);
    }, [excludeNsfw]);

    return (
        <div className="min-h-screen bg-ocean-50 dark:bg-zinc-900 relative transition-colors duration-300">
            <div className="fixed inset-0 z-0 pointer-events-none opacity-5 dark:opacity-10"
                style={{
                    backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                    color: 'inherit'
                }}
            />

            <Header onImageSearch={handleImageSearch} />

            <main className="container mx-auto px-4 py-6 relative z-10">

                {/* NSFW Toggle */}
                <div className="flex justify-end mb-4">
                    <button
                        onClick={toggleNsfw}
                        className={`flex items-center gap-2 px-3 py-1.5 font-mono text-xs font-bold border-2 border-black dark:border-white shadow-retro-sm dark:shadow-[2px_2px_0px_#000] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
                            excludeNsfw
                                ? 'bg-white dark:bg-slate-800 text-black dark:text-white'
                                : 'bg-red-500 text-white'
                        }`}
                    >
                        {excludeNsfw ? <Shield className="w-3.5 h-3.5" /> : <ShieldOff className="w-3.5 h-3.5" />}
                        NSFW {excludeNsfw ? 'OFF' : 'ON'}
                    </button>
                </div>

                {loading && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-64 bg-white dark:bg-slate-800 border-3 border-black dark:border-white shadow-retro dark:shadow-[4px_4px_0px_#000] opacity-50"></div>
                        ))}
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border-3 border-black dark:border-white p-6 shadow-retro dark:shadow-[4px_4px_0px_#000] flex items-center gap-4 max-w-2xl mx-auto mt-10">
                        <AlertCircle className="w-8 h-8 text-red-500 dark:text-red-400" />
                        <div>
                            <h3 className="font-bold text-lg text-black dark:text-white">Search Failed</h3>
                            <p className="font-mono text-sm text-gray-700 dark:text-gray-300">{error}</p>
                        </div>
                    </div>
                )}

                {!loading && !error && results.length === 0 && (query || reverseImageName) && (
                    <div className="text-center py-20 bg-white dark:bg-slate-800 border-3 border-black dark:border-white shadow-retro dark:shadow-[4px_4px_0px_#000] max-w-xl mx-auto">
                        <h2 className="text-3xl font-black mb-4 text-black dark:text-white">No Blobs Found</h2>
                        <p className="font-mono text-gray-500 dark:text-gray-400 mb-6">
                            {reverseImageName
                                ? `No similar images found for "${reverseImageName}".`
                                : `We couldn't find any images matching "${query}".`
                            }
                        </p>
                        <div className="inline-block bg-ocean-100 dark:bg-cyan-900/50 px-4 py-2 border-2 border-black dark:border-white font-mono text-sm text-black dark:text-white">
                            Try searching for "cat", "cyberpunk", or "landscape"
                        </div>
                    </div>
                )}

                {!loading && !error && results.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 pb-20">
                        {results.map((result, idx) => (
                            <ResultCard key={result.blob_id + idx} result={result} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};
