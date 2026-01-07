import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps {
    initialQuery?: string;
    className?: string;
    onSearch: (query: string) => void;
}

export const SearchInput: React.FC<SearchInputProps & { compact?: boolean }> = ({ initialQuery = '', className = '', onSearch, compact = false }) => {
    const [query, setQuery] = useState(initialQuery);

    useEffect(() => {
        setQuery(initialQuery);
    }, [initialQuery]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query.trim());
        }
    };

    return (
        <form onSubmit={handleSubmit} className={`relative w-full max-w-2xl group ${className}`}>
            <div className={`absolute inset-y-0 left-4 flex items-center pointer-events-none ${compact ? 'left-3' : 'left-4'}`}>
                <Search className={`${compact ? 'w-4 h-4' : 'w-6 h-6'} text-black`} strokeWidth={3} />
            </div>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for images..."
                className={`w-full bg-white border-3 border-black font-mono
                   placeholder-gray-500 shadow-retro transition-shadow 
                   focus:outline-none focus:shadow-retro-lg
                   active:shadow-retro-sm
                   ${compact
                        ? 'py-2 pl-10 pr-16 text-sm'
                        : 'py-4 pl-14 pr-24 text-xl'
                    }`}
            />
            <button
                type="submit"
                className={`absolute top-1/2 -translate-y-1/2 
                   bg-ocean-300 border-2 border-black font-bold 
                   shadow-retro-sm hover:shadow-retro active:shadow-none active:translate-y-0.5
                   transition-all flex items-center justify-center
                   ${compact
                        ? 'right-1.5 px-3 py-1 text-xs'
                        : 'right-3 px-4 md:px-6 py-2 text-sm md:text-lg'
                    }`}
            >
                GO
            </button>
        </form>
    );
};
