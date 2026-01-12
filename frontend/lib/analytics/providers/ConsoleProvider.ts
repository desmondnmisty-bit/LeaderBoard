import { AnalyticsEvent, AnalyticsProvider } from '../types';

export class ConsoleProvider implements AnalyticsProvider {
    initialize(): void {
        console.log('[Analytics] Console Provider Initialized');
    }

    trackEvent(event: AnalyticsEvent): void {
        console.log(`[Analytics] Track: ${event.name}`, event.properties);
    }

    trackPageView(url: string): void {
        console.log(`[Analytics] Page View: ${url}`);
    }
}
