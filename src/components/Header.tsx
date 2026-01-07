import React from 'react';
import { Link, useLocation } from 'wouter';
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
        <header className="sticky top-0 z-50 bg-ocean-50/95 backdrop-blur-sm border-b-3 border-black py-4 px-4 shadow-retro-sm">
            <div className="container mx-auto flex flex-col md:flex-row items-center gap-4">
                <Link href="/" className="flex items-center gap-3 group cursor-pointer shrink-0">
                    <div className="w-10 h-10 border-2 border-black bg-white rounded-full flex-center overflow-hidden shadow-retro-sm group-hover:scale-105 transition-transform">
                        <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
                    </div>
                    <span className="font-black text-2xl tracking-tighter" style={{ textShadow: '2px 2px 0px #fff' }}>
                        OMURA
                    </span>
                </Link>

                <div className="flex-1 w-full md:max-w-xl md:ml-8">
                    <SearchInput
                        onSearch={handleSearch}
                        compact={true}
                        initialQuery={new URLSearchParams(window.location.search).get('q') || ''}
                    />
                </div>
            </div>
        </header>
    );
};
