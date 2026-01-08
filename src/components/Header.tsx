import React from 'react';
import { useLocation } from 'wouter';
import { ThemeToggle } from './ThemeToggle';
import { SearchInput } from './SearchInput';

export const Header: React.FC = () => {
    const [, setLocation] = useLocation();

    const handleSearch = (query: string) => {
        const newPath = `/search?q=${encodeURIComponent(query)}`;
        setLocation(newPath);
        // Force event for Search page to detect query change (wouter useLocation is path-only)
        window.dispatchEvent(new CustomEvent('omura-search', { detail: newPath }));
    };

    return (
        <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b-3 border-black dark:border-white shadow-retro-sm dark:shadow-[2px_2px_0px_#fff] py-2 md:py-3 px-4 flex items-center gap-4 transition-colors">
            <div
                onClick={() => setLocation('/')}
                className="flex items-center gap-2 cursor-pointer group shrink-0"
            >
                <div className="relative w-8 h-8 md:w-10 md:h-10 border-2 border-black dark:border-white bg-ocean-100 dark:bg-slate-800 p-1 group-hover:rotate-6 transition-transform shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff]">
                    <img src="/logo.png" alt="Omura" className="w-full h-full object-contain" />
                </div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-black dark:text-white group-hover:text-ocean-600 dark:group-hover:text-cyan-400 transition-colors hidden sm:block" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.1)' }}>
                    OMURA
                </h1>
            </div>

            <div className="flex-1 max-w-xl mx-auto">
                <SearchInput
                    onSearch={handleSearch}
                    compact
                    className="w-full"
                    initialQuery={new URLSearchParams(window.location.search).get('q') || ''}
                />
            </div>

            <div className="shrink-0">
                <ThemeToggle className="w-14 h-7 md:w-16 md:h-8" />
            </div>
        </header>
    );
};
