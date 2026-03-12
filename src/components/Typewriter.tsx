
import React, { useState, useEffect } from 'react';

// Typewriter Component
interface TypingSegment {
    text: string;
    className?: string;
    newLine?: boolean;
}

const Typewriter: React.FC<{ segments: TypingSegment[] }> = ({ segments }) => {
    const [completedSegments, setCompletedSegments] = useState<number>(0);
    const [currentSegmentText, setCurrentSegmentText] = useState('');
    const [started, setStarted] = useState(false);

    useEffect(() => {
        // Initial delay
        const timeout = setTimeout(() => setStarted(true), 500);
        return () => clearTimeout(timeout);
    }, []);

    useEffect(() => {
        if (!started) return;
        if (completedSegments >= segments.length) return;

        const segment = segments[completedSegments];

        // Handle instant segments (like newlines)
        if (segment.newLine) {
            setCompletedSegments(prev => prev + 1);
            setCurrentSegmentText('');
            return;
        }

        if (currentSegmentText.length < segment.text.length) {
            const timeout = setTimeout(() => {
                setCurrentSegmentText(segment.text.slice(0, currentSegmentText.length + 1));
            }, 80); // Typing speed
            return () => clearTimeout(timeout);
        } else {
            // Segment finished
            const timeout = setTimeout(() => {
                setCompletedSegments(prev => prev + 1);
                setCurrentSegmentText('');
            }, 0);
            return () => clearTimeout(timeout);
        }
    }, [started, completedSegments, currentSegmentText, segments]);

    return (
        <h1 className="text-4xl font-black text-slate-900 leading-[1.1] tracking-tight min-h-[1.1em]">
            {segments.map((seg, index) => {
                if (seg.newLine) return <br key={index} />;
                return (
                    <span key={index} className={seg.className}>
                        {index < completedSegments ? seg.text : (index === completedSegments ? currentSegmentText : '')}
                    </span>
                );
            })}
            <span className="inline-block w-[3px] h-[0.8em] bg-orange-500 ml-1 animate-pulse" />
        </h1>
    );
};

export default Typewriter;
