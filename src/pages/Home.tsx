import React, { useState, useEffect } from 'react';
import { SearchInput } from '../components/SearchInput';
import { Marquee } from '../components/Marquee';
import { ThemeToggle } from '../components/ThemeToggle';
import { api } from '../lib/api';
import { BarChart3, Github, Twitter } from 'lucide-react';

interface HomeProps {
    onNavigate: (path: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
    const [totalBlobs, setTotalBlobs] = useState<number | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await api.getMediaCounters();
                setTotalBlobs(data.total_blobs);
            } catch (error) {
                console.error('Failed to fetch media counters:', error);
            }
        };

        fetchStats();
    }, []);

    const handleSearch = (query: string) => {
        onNavigate(`/search?q=${encodeURIComponent(query)}`);
    };

    const handleImageSearch = (file: File) => {
        onNavigate('/search?reverse=1');
        // Dispatch event after navigation so Search page can pick it up
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('omura-reverse-search', { detail: file }));
        }, 100);
    };

    return (
        <div className="min-h-screen flex flex-col items-center p-4 relative overflow-hidden bg-ocean-50 dark:bg-slate-900 transition-colors duration-300">
            {/* Retro Grid Background */}
            <div className="absolute inset-0 z-0 pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }}
            >
                <div className="absolute inset-0 bg-ocean-50 dark:bg-slate-900 opacity-90 transition-colors duration-300"></div>
            </div>

            <Marquee items={['Decentralized Search', 'Walrus Protocol', 'Omura API', 'Vector Search']} className="w-full rotate-1 mt-4 z-10" />

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl mx-auto z-10 relative">
                {/* Decorative Blobs */}
                <div className="absolute top-1/4 left-10 w-32 h-32 bg-ocean-300 border-3 border-black dark:border-white shadow-retro dark:shadow-retro-lg animate-float opacity-80 hidden lg:block rotate-12"></div>
                <div className="absolute bottom-1/4 right-10 w-24 h-24 bg-coral border-3 border-black dark:border-white shadow-retro dark:shadow-retro-lg animate-float animation-delay-2000 opacity-80 hidden lg:block -rotate-12 rounded-none"></div>

                <div className="mb-8 md:mb-12 relative flex-center flex-col transform hover:scale-105 transition-transform duration-500">
                    <div className="w-40 h-40 md:w-56 md:h-56 bg-white border-4 border-black dark:border-white shadow-retro-lg dark:shadow-[8px_8px_0px_#000] flex-center mb-6 md:mb-8 overflow-hidden relative group">
                        <div className="absolute inset-0 bg-ocean-200 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                        <img src="/logo.png" alt="Omura Walrus" className="w-full h-full object-cover p-2" />
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-black dark:text-white mb-2 bg-white dark:bg-slate-800 px-4 md:px-6 py-2 border-3 border-black dark:border-white shadow-retro dark:shadow-retro-lg transition-colors" style={{ textShadow: 'none' }}>
                        OMURA
                    </h1>
                </div>

                <SearchInput onSearch={handleSearch} onImageSearch={handleImageSearch} className="mb-8 md:mb-12 w-full px-4 md:px-0" />

                {/* Stats & Dashboard */}
                <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
                    <div className="bg-white dark:bg-slate-800 border-3 border-black dark:border-white p-4 shadow-retro-sm dark:shadow-[4px_4px_0px_#000] text-center transition-colors">
                        <div className="text-xs font-mono text-gray-500 dark:text-gray-400 uppercase mb-1">Total Blobs</div>
                        <div className="text-2xl font-black text-black dark:text-white">
                            {totalBlobs !== null ? totalBlobs.toLocaleString() : '—'}
                        </div>
                    </div>
                    <button
                        onClick={() => onNavigate('/dashboard')}
                        className="bg-coral border-3 border-black dark:border-white p-4 shadow-retro-sm dark:shadow-[4px_4px_0px_#000] text-center transition-all hover:shadow-retro-hover active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                    >
                        <div className="text-xs font-mono text-white/80 uppercase mb-1">Explore</div>
                        <div className="text-2xl font-black text-white flex items-center justify-center gap-2">
                            <BarChart3 className="w-5 h-5" />
                            DASHBOARD
                        </div>
                    </button>
                </div>
            </div>

            <Marquee items={['Powered by Walrus', 'Store Forever', 'Unstoppable Blob Storage', 'Sui Network']} direction="right" className="w-full -rotate-1 mb-8 z-10 bg-ocean-600 border-y-3" />

            {/* Footer */}
            <footer className="w-full z-20 border-t-3 border-black dark:border-white bg-white dark:bg-slate-800 transition-colors">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                        Powered by Walrus Protocol & Omura API
                    </span>
                    <div className="flex items-center gap-3">
                        <a
                            href="https://github.com/imortaltatsu/omura_frontend"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                        >
                            <Github className="w-5 h-5" />
                        </a>
                        <a
                            href="https://x.com/OmuraHQ"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                        >
                            <Twitter className="w-5 h-5" />
                        </a>
                        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600" />
                        <ThemeToggle />
                    </div>
                </div>
            </footer>
        </div>
    );
};
