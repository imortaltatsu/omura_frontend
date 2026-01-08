import React, { useState, useEffect } from 'react';
import { SearchInput } from '../components/SearchInput';
import { Marquee } from '../components/Marquee';
import { ThemeToggle } from '../components/ThemeToggle';
import { api } from '../lib/api';

interface HomeProps {
    onNavigate: (path: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
    const [stats, setStats] = useState<{ total: number; built: boolean } | null>(null);

    useEffect(() => {
        // Quick stats fetch for "alive" feel
        const fetchStats = async () => {
            try {
                const data = await api.getStats();
                setStats({ total: data.total_embeddings, built: data.index_built });
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            }
        };

        fetchStats();
    }, []);

    const handleSearch = (query: string) => {
        onNavigate(`/search?q=${encodeURIComponent(query)}`);
    };

    return (
        <div className="min-h-screen flex flex-col items-center p-4 relative overflow-hidden bg-ocean-50 dark:bg-slate-900 transition-colors duration-300">
            {/* Theme Toggle - Absolute Top Right */}
            <div className="absolute top-6 right-6 z-50">
                <ThemeToggle />
            </div>
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
                    <div className="flex gap-2 mt-4">
                        <span className="font-mono text-xs md:text-sm font-bold bg-ocean-400 dark:bg-cyan-700 text-white border-2 border-black dark:border-white px-2 md:px-3 py-1 shadow-retro-sm dark:shadow-[2px_2px_0px_#000]">
                            BETA
                        </span>
                        <span className="font-mono text-xs md:text-sm bg-white dark:bg-slate-800 text-black dark:text-white border-2 border-black dark:border-white px-2 md:px-3 py-1 shadow-retro-sm dark:shadow-[2px_2px_0px_#000]">
                            v0.1.0
                        </span>
                    </div>
                </div>

                <SearchInput onSearch={handleSearch} className="mb-8 md:mb-12 w-full px-4 md:px-0" />

                {/* Stats Grid */}
                {stats && (
                    <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
                        <div className="bg-white dark:bg-slate-800 border-3 border-black dark:border-white p-4 shadow-retro-sm dark:shadow-[4px_4px_0px_#000] text-center transition-colors">
                            <div className="text-xs font-mono text-gray-500 dark:text-gray-400 uppercase mb-1">Total Blobs</div>
                            <div className="text-2xl font-black text-black dark:text-white">{stats.total.toLocaleString()}</div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 border-3 border-black dark:border-white p-4 shadow-retro-sm dark:shadow-[4px_4px_0px_#000] text-center transition-colors">
                            <div className="text-xs font-mono text-gray-500 dark:text-gray-400 uppercase mb-1">Index Status</div>
                            <div className={`text-2xl font-black ${stats.built ? 'text-green-600 dark:text-green-400' : 'text-coral'}`}>
                                {stats.built ? 'READY' : 'BUILDING'}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Marquee items={['Powered by Walrus', 'Store Forever', 'Unstoppable Blob Storage', 'Sui Network']} direction="right" className="w-full -rotate-1 mb-8 z-10 bg-ocean-600 border-y-3" />

            <div className="absolute bottom-4 text-center w-full text-xs font-mono text-gray-500 z-20">
                Powered by Walrus Protocol & Omura API
            </div>
        </div>
    );
};
