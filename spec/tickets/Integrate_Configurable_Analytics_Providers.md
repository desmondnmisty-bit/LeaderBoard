# Integrate Configurable Analytics Providers

## Objective
Implement provider-agnostic analytics integration that allows deployers to choose their preferred analytics service (Google Analytics, Mixpanel, Plausible, etc.) via environment variables.

## Current State
- ⚠️ No analytics integration
- ⚠️ No usage tracking
- ⚠️ No conversion funnel visibility
- ⚠️ No performance metrics

## Requirements

### 1. Supported Analytics Providers

| Provider | Use Case | Privacy | Cost |
|----------|----------|---------|------|
| **Google Analytics 4** | General web analytics | Medium | Free |
| **Mixpanel** | Product analytics, funnels | Medium | Free tier |
| **Plausible** | Privacy-first analytics | High | Paid |
| **Umami** | Self-hosted, privacy-first | High | Free (self-host) |
| **Custom** | Webhook to custom endpoint | Configurable | Variable |

### 2. Event Tracking

**User Engagement Events:**
- `page_view` - Page visits (landing, leaderboard, admin)
- `leaderboard_search` - Player searches for rank
- `score_submission` - New score submitted
- `real_time_update_received` - Live update via Socket.io

**Pro Conversion Funnel:**
- `pro_banner_viewed` - Banner displayed on admin page
- `pro_banner_dismissed` - User dismisses banner
- `pro_comparison_opened` - Feature comparison modal opened
- `pro_comparison_closed` - Modal closed without action
- `waitlist_form_opened` - Waitlist form opened
- `waitlist_form_submitted` - Email submitted
- `waitlist_form_abandoned` - Form closed without submit

**Technical Monitoring:**
- `redis_connection_lost` - Redis connection failure
- `redis_reconnected` - Redis auto-reconnect success
- `rate_limit_hit` - User hits rate limit
- `api_error` - API endpoint error

### 3. Configuration via Environment Variables

```bash
# Analytics Provider Selection
NEXT_PUBLIC_ANALYTICS_PROVIDER=google_analytics # or mixpanel, plausible, umami, custom, none

# Provider-Specific Configuration
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_MIXPANEL_TOKEN=your_mixpanel_token
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=yourdomain.com
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your_umami_id
NEXT_PUBLIC_UMAMI_URL=https://analytics.yourdomain.com
NEXT_PUBLIC_CUSTOM_ANALYTICS_URL=https://your-webhook.com/track

# Privacy Settings
NEXT_PUBLIC_ANALYTICS_ANONYMIZE_IP=true
NEXT_PUBLIC_ANALYTICS_COOKIE_CONSENT=false # Set to true to require consent
```

### 4. Privacy & GDPR Compliance
- IP anonymization option
- Cookie consent integration (optional)
- Opt-out mechanism
- Data retention documentation
- Privacy policy guidance

## Technical Approach

### Files to Create/Modify
- **file:frontend/lib/analytics.ts** - Analytics abstraction layer (new)
- **file:frontend/lib/providers/** - Provider implementations (new directory)
  - `google-analytics.ts`
  - `mixpanel.ts`
  - `plausible.ts`
  - `umami.ts`
  - `custom.ts`
- **file:frontend/app/layout.tsx** - Initialize analytics
- **file:frontend/hooks/useAnalytics.ts** - React hook for tracking (new)
- **file:frontend/.env.example** - Document analytics variables
- **file:README.md** - Add analytics setup guide

### Implementation Steps

1. **Create analytics abstraction layer**:
   - Define common interface for all providers
   - Implement provider factory pattern
   - Handle initialization and event tracking

2. **Implement provider adapters**:
   - Google Analytics 4 (gtag.js)
   - Mixpanel (mixpanel-browser)
   - Plausible (plausible-tracker)
   - Umami (umami-tracker)
   - Custom webhook

3. **Add tracking throughout app**:
   - Page views in `layout.tsx`
   - User interactions in components
   - Pro conversion events
   - Error events (integrate with Sentry)

4. **Implement privacy features**:
   - IP anonymization
   - Cookie consent banner (optional)
   - Opt-out mechanism
   - Respect Do Not Track

5. **Document setup**:
   - Provider-specific setup guides
   - Event catalog
   - Privacy considerations
   - GDPR compliance notes

## Analytics Abstraction Layer

```typescript
// file:frontend/lib/analytics.ts
export interface AnalyticsProvider {
  initialize(): void;
  trackEvent(event: string, properties?: Record<string, any>): void;
  trackPageView(path: string): void;
  setUser(userId: string, properties?: Record<string, any>): void;
}

class Analytics {
  private provider: AnalyticsProvider | null = null;

  initialize() {
    const providerName = process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER;
    
    switch (providerName) {
      case 'google_analytics':
        this.provider = new GoogleAnalyticsProvider();
        break;
      case 'mixpanel':
        this.provider = new MixpanelProvider();
        break;
      case 'plausible':
        this.provider = new PlausibleProvider();
        break;
      case 'umami':
        this.provider = new UmamiProvider();
        break;
      case 'custom':
        this.provider = new CustomProvider();
        break;
      default:
        this.provider = null; // No analytics
    }

    this.provider?.initialize();
  }

  trackEvent(event: string, properties?: Record<string, any>) {
    this.provider?.trackEvent(event, properties);
  }

  trackPageView(path: string) {
    this.provider?.trackPageView(path);
  }

  setUser(userId: string, properties?: Record<string, any>) {
    this.provider?.setUser(userId, properties);
  }
}

export const analytics = new Analytics();
```

## Usage Example

```typescript
// Track Pro conversion funnel
import { analytics } from '@/lib/analytics';

// When banner is viewed
analytics.trackEvent('pro_banner_viewed', {
  page: 'admin',
  timestamp: Date.now()
});

// When comparison modal opened
analytics.trackEvent('pro_comparison_opened', {
  source: 'banner_cta'
});

// When waitlist form submitted
analytics.trackEvent('waitlist_form_submitted', {
  email: 'user@example.com', // Consider privacy
  useCase: 'multi-game-deployment'
});
```

## Acceptance Criteria
- [ ] Analytics provider configurable via `NEXT_PUBLIC_ANALYTICS_PROVIDER`
- [ ] Google Analytics 4 integration working
- [ ] Mixpanel integration working
- [ ] Plausible integration working
- [ ] Umami integration working
- [ ] Custom webhook integration working
- [ ] All user engagement events tracked
- [ ] All Pro conversion funnel events tracked
- [ ] IP anonymization option working
- [ ] Cookie consent integration (optional)
- [ ] README documents all providers with setup guides
- [ ] `.env.example` includes all analytics variables
- [ ] Privacy policy guidance provided

## Testing Checklist
- [ ] Set GA4, verify events in GA dashboard
- [ ] Set Mixpanel, verify events in Mixpanel
- [ ] Set Plausible, verify events in Plausible
- [ ] Set custom webhook, verify POST requests
- [ ] Page views tracked correctly
- [ ] Pro banner view tracked
- [ ] Waitlist submission tracked
- [ ] IP anonymization working (if enabled)
- [ ] No tracking when provider set to "none"
- [ ] No console errors with any provider

## Dependencies
- `mixpanel-browser` (if using Mixpanel)
- `plausible-tracker` (if using Plausible)
- No additional deps for GA4, Umami, or custom

## Estimated Effort
**6-8 hours** (Large ticket)

## Related Artifacts
- **Epic Brief**: spec:74e6825c-8d55-4ab7-9815-849f8855bc05/ada011a7-ac51-4e46-8d4c-2ac6b36eb3bb
- **Core Flows**: spec:74e6825c-8d55-4ab7-9815-849f8855bc05/f6eb9bd3-f412-46c7-8c74-9372e6c0bc50