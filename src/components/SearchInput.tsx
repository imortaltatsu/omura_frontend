import React, { useState, useEffect, useRef } from 'react';
import { Search, ImagePlus, X } from 'lucide-react';

interface SearchInputProps {
    initialQuery?: string;
    className?: string;
    onSearch: (query: string) => void;
    onImageSearch?: (file: File) => void;
    compact?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({ initialQuery = '', className = '', onSearch, onImageSearch, compact = false }) => {
    const [query, setQuery] = useState(initialQuery);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setQuery(initialQuery);
    }, [initialQuery]);

    useEffect(() => {
        if (!selectedFile) {
            setPreview(null);
            return;
        }
        const url = URL.createObjectURL(selectedFile);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [selectedFile]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedFile && onImageSearch) {
            onImageSearch(selectedFile);
        } else if (query.trim()) {
            onSearch(query.trim());
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setQuery('');
        }
    };

    const clearFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <form onSubmit={handleSubmit} className={`relative w-full max-w-2xl group ${className}`}>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
            />

            {/* Image preview badge */}
            {selectedFile && preview && (
                <div className={`absolute z-10 flex items-center gap-2 bg-ocean-100 dark:bg-slate-700 border-2 border-black dark:border-white px-2 py-1 ${compact ? 'top-1 left-9' : 'top-2 left-12'}`}>
                    <img src={preview} alt="Preview" className={`object-cover border border-black dark:border-white ${compact ? 'w-5 h-5' : 'w-8 h-8'}`} />
                    <span className={`font-mono text-black dark:text-white truncate max-w-[120px] ${compact ? 'text-xs' : 'text-sm'}`}>
                        {selectedFile.name}
                    </span>
                    <button
                        type="button"
                        onClick={clearFile}
                        className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                    >
                        <X className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
                    </button>
                </div>
            )}

            <div className={`absolute inset-y-0 flex items-center pointer-events-none ${compact ? 'left-3' : 'left-4'}`}>
                <Search className={`${compact ? 'w-4 h-4' : 'w-6 h-6'} text-black dark:text-white`} strokeWidth={3} />
            </div>
            <input
                type="text"
                value={selectedFile ? '' : query}
                onChange={(e) => { setQuery(e.target.value); clearFile(); }}
                placeholder={selectedFile ? '' : 'Search for images...'}
                disabled={!!selectedFile}
                className={`w-full bg-white dark:bg-slate-800 dark:text-white border-3 border-black dark:border-white font-mono
                   placeholder-gray-500 dark:placeholder-gray-400 shadow-retro dark:shadow-[4px_4px_0px_#000] transition-shadow
                   focus:outline-none focus:shadow-retro-lg dark:focus:shadow-[6px_6px_0px_#000]
                   active:shadow-retro-sm disabled:opacity-80
                   ${compact
                        ? 'py-2 pl-10 pr-28 text-sm'
                        : 'py-4 pl-12 pr-40 text-lg md:text-xl'
                    }`}
            />

            {/* Image upload button */}
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Reverse image search"
                className={`absolute top-1/2 -translate-y-1/2
                   border-2 border-black dark:border-white font-bold
                   transition-all flex items-center justify-center
                   ${selectedFile
                        ? 'bg-ocean-400 dark:bg-cyan-600 text-white'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-ocean-100 dark:hover:bg-slate-600'
                    }
                   ${compact
                        ? 'right-14 px-2 py-1'
                        : 'right-20 md:right-24 px-3 py-2'
                    }
                `}
            >
                <ImagePlus className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
            </button>

            {/* Submit button */}
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
