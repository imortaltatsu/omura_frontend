import React, { useState } from 'react';
import type { SearchResult } from '../lib/types';
import { getBlobUrl } from '../lib/api';
import { FileQuestion } from 'lucide-react';

interface ResultCardProps {
    result: SearchResult;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result }) => {
    const [error, setError] = useState(false);
    const imageUrl = getBlobUrl(result.blob_id);

    return (
        <div className="group relative bg-white border-3 border-black shadow-retro transition-all duration-200 hover:-translate-y-2 hover:shadow-[8px_8px_0px_#000] cursor-pointer h-full flex flex-col">
            <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="block relative">
                <div className="bg-ocean-50 overflow-hidden relative min-h-[150px] flex-center border-b-3 border-black">
                    {!error ? (
                        <img
                            src={imageUrl}
                            alt={`Blob ${result.blob_id}`}
                            className="w-full h-auto object-cover block transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                            onError={() => setError(true)}
                        />
                    ) : (
                        <div className="text-gray-400 flex flex-col items-center p-8">
                            <FileQuestion className="w-8 h-8 mb-2" />
                            <span className="text-xs font-mono">Broken Blob</span>
                        </div>
                    )}
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                </div>
            </a>

            <div className="p-3 bg-white">
                <div className="flex justify-between items-center mb-2">
                    <span className="font-mono text-xs font-bold text-ocean-700 bg-ocean-100 px-2 py-0.5 border border-black/20 rounded-sm">
                        IMG
                    </span>
                    <div className="text-xs font-bold bg-coral text-white border border-black px-1.5 py-0.5 shadow-[1px_1px_0px_#000]">
                        {result.similarity.toFixed(0)}%
                    </div>
                </div>

                <div className="flex items-center gap-2 mt-2 pt-2 border-t-2 border-gray-100">
                    <div className="w-2 h-2 bg-green-500 rounded-full border border-black"></div>
                    <div className="text-[10px] font-mono text-gray-400 truncate flex-1">
                        {result.blob_id}
                    </div>
                </div>
            </div>
        </div>
    );
};
