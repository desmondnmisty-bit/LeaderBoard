import { AnalyticsEvent, AnalyticsProvider } from '../types';

declare global {
    interface Window {
        gtag: (...args: any[]) => void;
        dataLayer: any[];
    }
}

export class GoogleAnalyticsProvider implements AnalyticsProvider {
    private measurementId: string;

    constructor(measurementId: string) {
        this.measurementId = measurementId;
    }

    initialize(): void {
        // GA script is loaded via AnalyticsScript component in layout
        // We just verify configuration here
        if (!this.measurementId) {
            console.warn('[Analytics] GA4 Initialized without Measurement ID');
        }
    }

    trackEvent(event: AnalyticsEvent): void {
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', event.name, event.properties);
        }
    }

    trackPageView(url: string): void {
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('config', this.measurementId, {
                page_path: url,
            });
        }
    }
}
