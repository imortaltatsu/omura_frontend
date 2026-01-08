import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { ResultCard } from '../components/ResultCard';
import { api } from '../lib/api';
import type { SearchResult } from '../lib/types';
import { AlertCircle } from 'lucide-react';

export const Search: React.FC = () => {
    // location is used to trigger re-renders on navigation
    // Custom hook-like logic to track query params since wouter useLocation is path-only
    const [searchParams, setSearchParams] = useState(window.location.search);

    useEffect(() => {
        const onSearchUpdate = () => setSearchParams(window.location.search);

        window.addEventListener('omura-search', onSearchUpdate);
        window.addEventListener('popstate', onSearchUpdate);
        return () => {
            window.removeEventListener('omura-search', onSearchUpdate);
            window.removeEventListener('popstate', onSearchUpdate);
        };
    }, []);

    const query = new URLSearchParams(searchParams).get('q') || '';

    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('Images');

    useEffect(() => {
        if (!query) return;

        const fetchResults = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await api.search({ query, top_k: 50 });
                setResults(data.results);
            } catch (err: any) {
                setError(err.message || 'Something went wrong');
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [query]);

    const tabs = ['All', 'Images', 'Web', 'Audio', 'Video'];

    return (
        <div className="min-h-screen bg-ocean-50 dark:bg-zinc-900 relative transition-colors duration-300">
            {/* Retro Grid Background - Fixed to stay behind content */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-5 dark:opacity-10"
                style={{
                    backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                    color: 'inherit' // Inherits text-black or text-white from body
                }}
            />

            <Header />

            <main className="container mx-auto px-4 py-6 relative z-10">

                {/* Tabs Bar */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 border-b-2 border-black/10 dark:border-white/20">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 font-mono font-bold text-sm border-2 border-black dark:border-white transition-all shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff]
                ${activeTab === tab
                                    ? 'bg-coral text-white translate-y-0.5 shadow-none'
                                    : 'bg-white dark:bg-zinc-800 dark:text-white hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#000] dark:hover:shadow-[4px_4px_0px_#fff]'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
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

                {!loading && !error && results.length === 0 && query && (
                    <div className="text-center py-20 bg-white dark:bg-slate-800 border-3 border-black dark:border-white shadow-retro dark:shadow-[4px_4px_0px_#000] max-w-xl mx-auto">
                        <h2 className="text-3xl font-black mb-4 text-black dark:text-white">No Blobs Found</h2>
                        <p className="font-mono text-gray-500 dark:text-gray-400 mb-6">
                            We couldn't find any images matching "{query}".
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
