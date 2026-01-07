import React from 'react';

interface MarqueeProps {
    items: string[];
    direction?: 'left' | 'right';
    className?: string;
}

export const Marquee: React.FC<MarqueeProps> = ({ items, direction = 'left', className = '' }) => {
    return (
        <div className={`overflow-hidden whitespace-nowrap border-y-3 border-black bg-coral text-white py-2 ${className}`}>
            <div className={`inline-flex animate-marquee ${direction === 'right' ? 'animate-marquee-reverse' : ''}`}>
                {[...Array(10)].map((_, i) => (
                    <React.Fragment key={i}>
                        {items.map((item, idx) => (
                            <span key={idx} className="mx-8 font-mono font-bold text-lg uppercase tracking-widest flex items-center">
                                {item}
                                <span className="ml-8 w-3 h-3 bg-black block" />
                            </span>
                        ))}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};
