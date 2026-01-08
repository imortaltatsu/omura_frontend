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
                <Search className={`${compact ? 'w-4 h-4' : 'w-6 h-6'} text-black dark:text-white`} strokeWidth={3} />
            </div>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for images..."
                className={`w-full bg-white dark:bg-slate-800 dark:text-white border-3 border-black dark:border-white font-mono
                   placeholder-gray-500 dark:placeholder-gray-400 shadow-retro dark:shadow-[4px_4px_0px_#000] transition-shadow 
                   focus:outline-none focus:shadow-retro-lg dark:focus:shadow-[6px_6px_0px_#000]
                   active:shadow-retro-sm
                   ${compact
                        ? 'py-2 pl-10 pr-16 text-sm'
                        : 'py-4 pl-12 pr-32 text-lg md:text-xl'
                    }`}
            />
            <button
                type="submit"
                className={`absolute top-1/2 -translate-y-1/2 
                   bg-ocean-300 dark:bg-cyan-600 border-2 border-black dark:border-white font-bold 
                   shadow-retro-sm dark:shadow-[2px_2px_0px_#fff] hover:shadow-retro dark:hover:shadow-[4px_4px_0px_#fff] 
                   active:shadow-none active:translate-y-0.5
                   transition-all flex items-center justify-center text-black dark:text-white
                   ${compact
                        ? 'right-1.5 px-3 py-1 text-xs'
                        : 'right-3 px-4 md:px-6 py-2 text-sm md:text-lg'
                    }
                `}
            >
                GO
            </button>
        </form>
    );
};
