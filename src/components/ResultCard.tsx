import React, { useState } from 'react';
import type { SearchResult } from '../lib/types';
import { getBlobUrl, getBlobPageUrl } from '../lib/api';
import { FileQuestion } from 'lucide-react';

interface ResultCardProps {
    result: SearchResult;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result }) => {
    const [error, setError] = useState(false);
    const [isRevealed, setIsRevealed] = useState(false);
    const imageUrl = getBlobUrl(result.blob_id);
    const pageUrl = getBlobPageUrl(result.blob_id);
    const isNsfw = result.is_nsfw || false;

    return (
        <div className="group relative bg-white dark:bg-slate-900 border-3 border-black dark:border-white shadow-retro dark:shadow-[4px_4px_0px_#000] transition-all duration-200 hover:-translate-y-2 hover:shadow-[8px_8px_0px_#000] dark:hover:shadow-[8px_8px_0px_#000] cursor-pointer h-full flex flex-col">
            <div className="block relative">
                <div className="bg-ocean-50 dark:bg-slate-800 overflow-hidden relative min-h-[150px] flex-center border-b-3 border-black dark:border-white">
                    {!error ? (
                        <>
                            <img
                                src={imageUrl}
                                alt={`Blob ${result.blob_id}`}
                                className={`w-full h-auto object-cover block transition-transform duration-500 group-hover:scale-110 ${isNsfw && !isRevealed ? 'blur-xl scale-110' : ''}`}
                                loading="lazy"
                                onError={() => setError(true)}
                            />
                            {isNsfw && !isRevealed && (
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
                            )}
                            <a href={pageUrl} target="_blank" rel="noopener noreferrer" className={`absolute inset-0 ${isNsfw && !isRevealed ? 'pointer-events-none' : ''}`} />
                        </>
                    ) : (
                        <div className="text-gray-400 flex flex-col items-center p-8">
                            <FileQuestion className="w-8 h-8 mb-2" />
                            <span className="text-xs font-mono">Broken Blob</span>
                        </div>
                    )}
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 dark:group-hover:bg-white/10 transition-colors pointer-events-none" />
                </div>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 border-t-3 border-black dark:border-white transition-colors">
                <div className="flex justify-between items-center mb-2">
                    <span className="font-mono text-xs font-bold text-ocean-700 dark:text-cyan-300 bg-ocean-100 dark:bg-slate-800 px-2 py-0.5 border border-black/20 dark:border-white/40 rounded-sm">
                        IMG
                    </span>
                    <div className="text-xs font-bold bg-coral dark:bg-pink-600 text-white border border-black dark:border-white px-1.5 py-0.5 shadow-[1px_1px_0px_#000] dark:shadow-[2px_2px_0px_#000]">
                        {result.similarity.toFixed(0)}%
                    </div>
                </div>

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
