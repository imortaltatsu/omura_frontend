import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ThemeToggle } from '../components/ThemeToggle';
import { api } from '../lib/api';
import type { MediaCounters, ClassifierCounts } from '../lib/types';
import { AlertCircle, ArrowLeft, Database, Image, Video, Music, PieChart, Tag } from 'lucide-react';

export const Dashboard: React.FC = () => {
    const [, setLocation] = useLocation();
    const [media, setMedia] = useState<MediaCounters | null>(null);
    const [classifier, setClassifier] = useState<ClassifierCounts | null>(null);
    const [mediaError, setMediaError] = useState<string | null>(null);
    const [classifierError, setClassifierError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            const [mediaResult, classifierResult] = await Promise.allSettled([
                api.getMediaCounters(),
                api.getClassifierCounts(),
            ]);

            if (mediaResult.status === 'fulfilled') {
                setMedia(mediaResult.value);
            } else {
                setMediaError(mediaResult.reason?.message ?? 'Failed to load media counters');
            }

            if (classifierResult.status === 'fulfilled') {
                setClassifier(classifierResult.value);
            } else {
                setClassifierError(classifierResult.reason?.message ?? 'Failed to load classifier counts');
            }

            setLoading(false);
        };

        fetchData();
    }, []);

    const formatNumber = (n: number) => n.toLocaleString();

    const getModalityColor = (key: string): { bg: string; hex: string } => {
        const colors: Record<string, { bg: string; hex: string }> = {
            image: { bg: 'bg-sky-400', hex: '#38bdf8' },
            video: { bg: 'bg-violet-500', hex: '#8b5cf6' },
            audio: { bg: 'bg-emerald-400', hex: '#34d399' },
            application: { bg: 'bg-amber-400', hex: '#fbbf24' },
            archive: { bg: 'bg-orange-500', hex: '#f97316' },
            story: { bg: 'bg-rose-400', hex: '#fb7185' },
            unknown: { bg: 'bg-indigo-300', hex: '#a5b4fc' },
            quilt: { bg: 'bg-teal-400', hex: '#2dd4bf' },
            binary: { bg: 'bg-fuchsia-400', hex: '#e879f9' },
            text: { bg: 'bg-lime-400', hex: '#a3e635' },
            document: { bg: 'bg-cyan-400', hex: '#22d3ee' },
            model: { bg: 'bg-pink-400', hex: '#f472b6' },
            font: { bg: 'bg-yellow-300', hex: '#fde047' },
            data: { bg: 'bg-red-400', hex: '#f87171' },
        };
        return colors[key] ?? { bg: 'bg-blue-400', hex: '#60a5fa' };
    };

    const getPieSlices = (entries: [string, number][], total: number) => {
        const slices: { key: string; path: string; color: string; pct: number; value: number }[] = [];
        let cumulative = 0;
        const cx = 100, cy = 100, r = 90;

        for (const [key, value] of entries) {
            const pct = total > 0 ? value / total : 0;
            const startAngle = cumulative * 2 * Math.PI;
            const endAngle = (cumulative + pct) * 2 * Math.PI;
            cumulative += pct;

            const x1 = cx + r * Math.cos(startAngle - Math.PI / 2);
            const y1 = cy + r * Math.sin(startAngle - Math.PI / 2);
            const x2 = cx + r * Math.cos(endAngle - Math.PI / 2);
            const y2 = cy + r * Math.sin(endAngle - Math.PI / 2);
            const largeArc = pct > 0.5 ? 1 : 0;

            const path = pct >= 1
                ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`
                : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

            slices.push({ key, path, color: getModalityColor(key).hex, pct: pct * 100, value });
        }
        return slices;
    };

    const getCategoryColor = (index: number): { bg: string; hex: string } => {
        const colors = [
            { bg: 'bg-red-400', hex: '#f87171' },
            { bg: 'bg-sky-400', hex: '#38bdf8' },
            { bg: 'bg-emerald-400', hex: '#34d399' },
            { bg: 'bg-amber-400', hex: '#fbbf24' },
            { bg: 'bg-violet-500', hex: '#8b5cf6' },
            { bg: 'bg-rose-400', hex: '#fb7185' },
            { bg: 'bg-indigo-400', hex: '#818cf8' },
            { bg: 'bg-orange-400', hex: '#fb923c' },
            { bg: 'bg-teal-400', hex: '#2dd4bf' },
            { bg: 'bg-cyan-400', hex: '#22d3ee' },
            { bg: 'bg-lime-400', hex: '#a3e635' },
            { bg: 'bg-fuchsia-400', hex: '#e879f9' },
            { bg: 'bg-yellow-300', hex: '#fde047' },
            { bg: 'bg-pink-400', hex: '#f472b6' },
            { bg: 'bg-blue-400', hex: '#60a5fa' },
            { bg: 'bg-green-400', hex: '#4ade80' },
        ];
        return colors[index % colors.length];
    };

    const ErrorCard: React.FC<{ message: string }> = ({ message }) => (
        <div className="bg-red-50 dark:bg-red-950/30 border-3 border-red-400 dark:border-red-600 p-6 shadow-retro-sm dark:shadow-[4px_4px_0px_#000] flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="font-mono text-sm text-red-700 dark:text-red-400">{message}</p>
        </div>
    );

    const SkeletonCard: React.FC = () => (
        <div className="bg-white dark:bg-slate-800 border-3 border-black dark:border-white p-6 shadow-retro-sm dark:shadow-[4px_4px_0px_#000] animate-pulse">
            <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-24 mb-3"></div>
            <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-16"></div>
        </div>
    );

    const modalityTotal = media
        ? Object.values(media.modality_counts_all).reduce((a, b) => a + b, 0)
        : 0;

    const categoryTotal = classifier
        ? Object.values(classifier.categories).reduce((a, b) => a + b, 0)
        : 0;

    const sortedCategories = classifier
        ? Object.entries(classifier.categories).sort(([, a], [, b]) => b - a)
        : [];

    const sortedModalities = media
        ? Object.entries(media.modality_counts_all).sort(([, a], [, b]) => b - a)
        : [];

    return (
        <div className="min-h-screen bg-ocean-50 dark:bg-slate-900 transition-colors duration-300">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white dark:bg-slate-800 border-b-3 border-black dark:border-white shadow-retro-sm dark:shadow-[4px_4px_0px_#000] transition-colors">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setLocation('/')}
                            className="bg-white dark:bg-slate-700 border-3 border-black dark:border-white px-3 py-1.5 shadow-retro-sm dark:shadow-[2px_2px_0px_#000] hover:shadow-retro-hover active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-bold font-mono text-sm flex items-center gap-2 transition-all text-black dark:text-white"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            HOME
                        </button>
                        <h1 className="text-xl md:text-2xl font-black tracking-tight text-black dark:text-white font-mono">
                            DASHBOARD
                        </h1>
                    </div>
                    <ThemeToggle />
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8">
                {/* Media Counters Section */}
                <section className="mb-12">
                    <div className="flex items-center gap-2 mb-6">
                        <Database className="w-5 h-5 text-ocean-600 dark:text-ocean-400" />
                        <h2 className="text-lg font-black font-mono text-black dark:text-white uppercase tracking-wide">
                            Media Counters
                        </h2>
                    </div>

                    {mediaError ? (
                        <ErrorCard message={mediaError} />
                    ) : loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
                        </div>
                    ) : media ? (
                        <>
                            {/* Stat Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                                <div className="bg-white dark:bg-slate-800 border-3 border-black dark:border-white p-4 shadow-retro-sm dark:shadow-[4px_4px_0px_#000] text-center transition-colors">
                                    <div className="text-xs font-mono text-gray-500 dark:text-gray-400 uppercase mb-1 flex items-center justify-center gap-1">
                                        <Database className="w-3 h-3" /> Total Blobs
                                    </div>
                                    <div className="text-2xl font-black text-black dark:text-white">{formatNumber(media.total_blobs)}</div>
                                </div>
                                <div className="bg-white dark:bg-slate-800 border-3 border-black dark:border-white p-4 shadow-retro-sm dark:shadow-[4px_4px_0px_#000] text-center transition-colors">
                                    <div className="text-xs font-mono text-gray-500 dark:text-gray-400 uppercase mb-1">Active Blobs</div>
                                    <div className="text-2xl font-black text-green-600 dark:text-green-400">{formatNumber(media.active_blobs)}</div>
                                </div>
                                <div className="bg-white dark:bg-slate-800 border-3 border-black dark:border-white p-4 shadow-retro-sm dark:shadow-[4px_4px_0px_#000] text-center transition-colors">
                                    <div className="text-xs font-mono text-gray-500 dark:text-gray-400 uppercase mb-1 flex items-center justify-center gap-1">
                                        <Image className="w-3 h-3" /> Images
                                    </div>
                                    <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{formatNumber(media.identified_image)}</div>
                                </div>
                                <div className="bg-white dark:bg-slate-800 border-3 border-black dark:border-white p-4 shadow-retro-sm dark:shadow-[4px_4px_0px_#000] text-center transition-colors">
                                    <div className="text-xs font-mono text-gray-500 dark:text-gray-400 uppercase mb-1 flex items-center justify-center gap-1">
                                        <Video className="w-3 h-3" /> Videos
                                    </div>
                                    <div className="text-2xl font-black text-purple-600 dark:text-purple-400">{formatNumber(media.identified_video)}</div>
                                </div>
                                <div className="bg-white dark:bg-slate-800 border-3 border-black dark:border-white p-4 shadow-retro-sm dark:shadow-[4px_4px_0px_#000] text-center transition-colors">
                                    <div className="text-xs font-mono text-gray-500 dark:text-gray-400 uppercase mb-1 flex items-center justify-center gap-1">
                                        <Music className="w-3 h-3" /> Audio
                                    </div>
                                    <div className="text-2xl font-black text-green-600 dark:text-green-400">{formatNumber(media.identified_audio)}</div>
                                </div>
                            </div>

                            {/* Modality Distribution - Pie Chart */}
                            <div className="bg-white dark:bg-slate-800 border-3 border-black dark:border-white p-6 shadow-retro-sm dark:shadow-[4px_4px_0px_#000] transition-colors">
                                <div className="flex items-center gap-2 mb-6">
                                    <PieChart className="w-4 h-4 text-ocean-600 dark:text-ocean-400" />
                                    <h3 className="text-sm font-black font-mono text-black dark:text-white uppercase">Modality Distribution</h3>
                                </div>

                                <div className="flex flex-col md:flex-row items-center gap-8">
                                    {/* Pie Chart */}
                                    <div className="w-52 h-52 md:w-64 md:h-64 shrink-0">
                                        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
                                            {getPieSlices(sortedModalities, modalityTotal).map((slice) => (
                                                <path
                                                    key={slice.key}
                                                    d={slice.path}
                                                    fill={slice.color}
                                                    stroke="black"
                                                    strokeWidth="2"
                                                    className="hover:opacity-80 transition-opacity cursor-default"
                                                >
                                                    <title>{`${slice.key}: ${formatNumber(slice.value)} (${slice.pct.toFixed(1)}%)`}</title>
                                                </path>
                                            ))}
                                        </svg>
                                    </div>

                                    {/* Legend */}
                                    <div className="flex flex-col gap-3 flex-1">
                                        {sortedModalities.map(([key, value]) => {
                                            const pct = modalityTotal > 0 ? (value / modalityTotal) * 100 : 0;
                                            return (
                                                <div key={key} className="flex items-center gap-3 font-mono text-sm">
                                                    <div
                                                        className="w-4 h-4 border-2 border-black dark:border-white shrink-0"
                                                        style={{ backgroundColor: getModalityColor(key).hex }}
                                                    />
                                                    <span className="text-gray-700 dark:text-gray-300 capitalize w-24">{key}</span>
                                                    <span className="text-black dark:text-white font-bold">{formatNumber(value)}</span>
                                                    <span className="text-gray-400 dark:text-gray-500">({pct.toFixed(1)}%)</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : null}
                </section>

                {/* Classifier Counts Section */}
                <section>
                    <div className="flex items-center gap-2 mb-6">
                        <Tag className="w-5 h-5 text-ocean-600 dark:text-ocean-400" />
                        <h2 className="text-lg font-black font-mono text-black dark:text-white uppercase tracking-wide">
                            Classifier Categories
                        </h2>
                    </div>

                    {classifierError ? (
                        <ErrorCard message={classifierError} />
                    ) : loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
                        </div>
                    ) : classifier ? (
                        <>
                            {/* Category Bar Chart */}
                            <div className="bg-white dark:bg-slate-800 border-3 border-black dark:border-white p-6 shadow-retro-sm dark:shadow-[4px_4px_0px_#000] transition-colors mb-6">
                                <div className="space-y-3">
                                    {sortedCategories.map(([key, value], index) => {
                                        const pct = categoryTotal > 0 ? (value / categoryTotal) * 100 : 0;
                                        return (
                                            <div key={key} className="flex items-center gap-3">
                                                <span className="font-mono text-xs text-gray-700 dark:text-gray-300 capitalize w-24 text-right shrink-0 truncate" title={key}>
                                                    {key}
                                                </span>
                                                <div className="flex-1 h-6 bg-gray-100 dark:bg-slate-700 border border-black dark:border-white overflow-hidden">
                                                    <div
                                                        className="h-full transition-all duration-500"
                                                        style={{ backgroundColor: getCategoryColor(index).hex, width: `${Math.max(pct, 1)}%` }}
                                                    />
                                                </div>
                                                <span className="font-mono text-xs text-gray-500 dark:text-gray-400 w-20 shrink-0">
                                                    {formatNumber(value)} <span className="text-gray-400 dark:text-gray-500">({pct.toFixed(1)}%)</span>
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Category Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {sortedCategories.map(([key, value], index) => {
                                    const pct = categoryTotal > 0 ? (value / categoryTotal) * 100 : 0;
                                    return (
                                        <div
                                            key={key}
                                            className="bg-white dark:bg-slate-800 border-3 border-black dark:border-white p-4 shadow-retro-sm dark:shadow-[4px_4px_0px_#000] transition-colors hover:-translate-y-0.5 hover:shadow-retro"
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-2.5 h-2.5 border border-black dark:border-white" style={{ backgroundColor: getCategoryColor(index).hex }} />
                                                <span className="text-xs font-mono text-gray-500 dark:text-gray-400 uppercase capitalize truncate" title={key}>
                                                    {key}
                                                </span>
                                            </div>
                                            <div className="text-xl font-black text-black dark:text-white">{formatNumber(value)}</div>
                                            <div className="text-xs font-mono text-gray-400 dark:text-gray-500">{pct.toFixed(1)}%</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : null}
                </section>
            </main>
        </div>
    );
};
