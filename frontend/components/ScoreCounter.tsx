'use client';

import { useEffect, useState, useRef } from 'react';
import { formatScore } from '../lib/utils';

interface ScoreCounterProps {
    value: number;
    duration?: number;
}

export default function ScoreCounter({ value, duration = 1000 }: ScoreCounterProps) {
    const [displayValue, setDisplayValue] = useState(value);
    const startValueRef = useRef(value);
    const startTimeRef = useRef<number | null>(null);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        if (value === displayValue) return;

        startValueRef.current = displayValue;
        startTimeRef.current = null;

        const animate = (timestamp: number) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp;
            const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);

            // Easing function (easeOutExpo)
            // 1 - Math.pow(2, -10 * progress) for smoother end
            const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

            const nextValue = Math.floor(startValueRef.current + (value - startValueRef.current) * ease);

            setDisplayValue(nextValue);

            if (progress < 1) {
                rafRef.current = requestAnimationFrame(animate);
            }
        };

        rafRef.current = requestAnimationFrame(animate);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [value, duration]); // dependency on displayValue removed to prevent restart, logic relies on value change

    return <>{formatScore(displayValue)}</>;
}
