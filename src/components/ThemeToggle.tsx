import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            return document.documentElement.classList.contains('dark') ||
                localStorage.getItem('theme') === 'dark' ||
                (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
        return false;
    });

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    return (
        <button
            onClick={() => setIsDark(!isDark)}
            className={`relative w-16 h-8 bg-white dark:bg-slate-800 border-3 border-black dark:border-white flex items-center transition-colors shadow-retro-sm dark:shadow-[2px_2px_0px_#000] active:translate-y-0.5 active:shadow-none ${className}`}
            aria-label="Toggle Dark Mode"
        >
            {/* Icons Track */}
            <div className="absolute inset-0 flex justify-between items-center px-2 pointer-events-none z-0">
                <Sun className="w-4 h-4 text-black dark:text-gray-700 transition-colors" />
                <Moon className="w-4 h-4 text-gray-300 dark:text-white transition-colors" />
            </div>

            {/* Square Knob */}
            <div
                className={`absolute top-0.5 bottom-0.5 w-7 bg-coral dark:bg-cyan-400 border-2 border-black dark:border-white z-10
                    transform transition-transform duration-200 ease-out
                    ${isDark ? 'translate-x-[32px]' : 'translate-x-[2px]'}
                    flex items-center justify-center
                `}
            >
                <div className="flex flex-col gap-0.5">
                    <div className="w-4 h-0.5 bg-black/20 dark:bg-white/30 rounded-full" />
                    <div className="w-4 h-0.5 bg-black/20 dark:bg-white/30 rounded-full" />
                    <div className="w-4 h-0.5 bg-black/20 dark:bg-white/30 rounded-full" />
                </div>
            </div>
        </button>
    );
};
