import { useEffect, useState } from 'react';

type TypewriterHeadingProps = {
    /** Each entry is one line of the heading. */
    lines: string[];
    className?: string;
    /** Milliseconds per character. */
    speed?: number;
    /** Milliseconds to wait before typing starts. */
    delay?: number;
};

/**
 * Types a heading out character by character.
 *
 * The characters not typed yet are still rendered (invisible), so the heading
 * takes its final size from the start and nothing jumps while it types.
 * Screen readers get the full text straight away, and people who prefer
 * reduced motion see the finished heading with no animation.
 */
export default function TypewriterHeading({ lines, className, speed = 55, delay = 400 }: TypewriterHeadingProps) {
    const fullText = lines.join('\n');
    const [count, setCount] = useState(0);
    const [showCursor, setShowCursor] = useState(true);

    useEffect(() => {
        const reduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (reduceMotion) {
            setCount(fullText.length);
            setShowCursor(false);

            return;
        }

        setCount(0);
        setShowCursor(true);

        let index = 0;
        let interval: number | undefined;

        const start = window.setTimeout(() => {
            interval = window.setInterval(() => {
                index += 1;
                setCount(index);

                if (index >= fullText.length) {
                    window.clearInterval(interval);
                    // Let the cursor blink a moment after the last letter, then tidy it away.
                    window.setTimeout(() => setShowCursor(false), 1800);
                }
            }, speed);
        }, delay);

        return () => {
            window.clearTimeout(start);
            window.clearInterval(interval);
        };
    }, [fullText, speed, delay]);

    // The cursor sits on the line being typed (and stays on the last line when done).
    const starts = lines.map((_, index) => lines.slice(0, index).reduce((sum, line) => sum + line.length + 1, 0));
    const found = lines.findIndex((line, index) => count <= starts[index] + line.length);
    const activeLine = found === -1 ? lines.length - 1 : found;

    return (
        <h1 className={className} aria-label={lines.join(' ')}>
            {lines.map((line, lineIndex) => {
                const typed = Math.max(0, Math.min(line.length, count - starts[lineIndex]));

                return (
                    <span key={lineIndex} className="block sm:whitespace-nowrap" aria-hidden="true">
                        {line.slice(0, typed)}
                        {showCursor && lineIndex === activeLine && (
                            // Inline and empty on purpose: it takes no width and adds no line-break point, so the heading never re-wraps while typing.
                            <span className="relative" aria-hidden="true">
                                <span className="bg-primary absolute top-[0.12em] left-[0.06em] h-[0.85em] w-[3px] animate-pulse" />
                            </span>
                        )}
                        <span className="invisible">{line.slice(typed)}</span>
                    </span>
                );
            })}
        </h1>
    );
}
