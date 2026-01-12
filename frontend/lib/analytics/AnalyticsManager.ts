import { AnalyticsEvent, AnalyticsProvider } from './types';
import { ConsoleProvider } from './providers/ConsoleProvider';
import { GoogleAnalyticsProvider } from './providers/GoogleAnalyticsProvider';

class AnalyticsManager {
    private providers: AnalyticsProvider[] = [];
    private static instance: AnalyticsManager;

    private constructor() { }

    public static getInstance(): AnalyticsManager {
        if (!AnalyticsManager.instance) {
            AnalyticsManager.instance = new AnalyticsManager();
        }
        return AnalyticsManager.instance;
    }

    public async init() {
        this.providers = [];

        // Debug / Console Provider
        if (process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === 'true') {
            this.providers.push(new ConsoleProvider());
        }

        // Google Analytics 4
        let gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

        // If not in env, try fetching from backend config
        if (!gaId) {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                const res = await fetch(`${apiUrl}/config`);
                if (res.ok) {
                    const config = await res.json();
                    if (config.gaMeasurementId) {
                        gaId = config.gaMeasurementId;
                        console.log('[Analytics] Loaded GA ID from dynamic config:', gaId);
                    }
                }
            } catch (err) {
                console.warn('[Analytics] Failed to load dynamic config:', err);
            }
        }

        if (gaId) {
            this.providers.push(new GoogleAnalyticsProvider(gaId));
        }

        // Initialize all registered providers
        this.providers.forEach(provider => provider.initialize());
    }

    public track(eventName: string, properties?: Record<string, any>) {
        const event: AnalyticsEvent = { name: eventName, properties };
        this.providers.forEach(provider => provider.trackEvent(event));
    }

    public pageView(url: string) {
        this.providers.forEach(provider => provider.trackPageView(url));
    }
}

export const analytics = AnalyticsManager.getInstance();
