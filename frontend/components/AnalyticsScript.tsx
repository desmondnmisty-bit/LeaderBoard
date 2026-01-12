'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

export default function AnalyticsScript() {
    const envGaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    const [dynamicGaId, setDynamicGaId] = useState<string | null>(null);

    useEffect(() => {
        if (envGaId) return; // Env var takes precedence

        const fetchConfig = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                console.log('[AnalyticsScript] Fetching dynamic config from:', `${apiUrl}/config`);

                const res = await fetch(`${apiUrl}/config`);
                const data = await res.json();

                if (data.gaMeasurementId) {
                    console.log('[AnalyticsScript] Found dynamic GA ID:', data.gaMeasurementId);
                    setDynamicGaId(data.gaMeasurementId);
                } else {
                    console.log('[AnalyticsScript] No GA ID found in dynamic config');
                }
            } catch (err) {
                console.error('[AnalyticsScript] Failed to load config:', err);
            }
        };

        fetchConfig();
    }, [envGaId]);

    const gaId = envGaId || dynamicGaId;

    if (!gaId) {
        if (process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === 'true') {
            console.log('[AnalyticsScript] No GA ID available (Env or Dynamic). Script will not load.');
        }
        return null;
    }

    return (
        <>
            <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
                strategy="afterInteractive"
                onLoad={() => console.log('[AnalyticsScript] GA Script Loaded from source')}
            />
            <Script id="google-analytics" strategy="afterInteractive">
                {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', '${gaId}', {
              debug_mode: ${process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === 'true'}
          });
          console.log('[AnalyticsScript] Gtag initialized with ID: ${gaId}');
        `}
            </Script>
        </>
    );
}
