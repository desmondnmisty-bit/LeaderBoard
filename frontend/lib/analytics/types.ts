export interface AnalyticsEvent {
    name: string;
    properties?: Record<string, any>;
}

export interface AnalyticsProvider {
    /**
     * Initialize the provider (e.g., load scripts)
     */
    initialize(): void;

    /**
     * Track a specific event
     */
    trackEvent(event: AnalyticsEvent): void;

    /**
     * Track a page view
     */
    trackPageView(url: string): void;
}
