'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { analytics } from '../lib/analytics/AnalyticsManager';

function AnalyticsTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Initialize analytics on mount
    useEffect(() => {
        analytics.init();
    }, []);

    // Track page views on route change
    useEffect(() => {
        const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
        analytics.pageView(url);
    }, [pathname, searchParams]);

    return null;
}

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Suspense fallback={null}>
                <AnalyticsTracker />
            </Suspense>
            {children}
        </>
    );
}
