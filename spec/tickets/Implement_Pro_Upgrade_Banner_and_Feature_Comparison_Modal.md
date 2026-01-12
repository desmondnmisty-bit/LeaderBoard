# Implement Pro Upgrade Banner and Feature Comparison Modal

## Objective
Create a moderate, non-intrusive Pro upgrade banner on the admin page and a detailed feature comparison modal to drive Pro conversions while maintaining a positive Lite user experience.

## Current State
- ✅ Admin page exists at `/admin`
- ⚠️ No Pro upsell messaging
- ⚠️ No feature comparison
- ⚠️ No conversion tracking

## Requirements

### 1. Pro Upgrade Banner

**Design Specifications:**
- **Placement**: Top of admin page, above main content
- **Style**: Gradient background (purple/blue), white text
- **Behavior**: Dismissible (stores preference in localStorage)
- **Frequency**: Show once per session after dismissal
- **Responsive**: Full-width on mobile, contained on desktop

**Content:**
- **Title**: "🚀 Upgrade to LeaderBoard Pro"
- **Message**: "Get multi-tenancy, user authentication, anti-cheat system, and advanced admin tools"
- **Primary CTA**: "Compare Features" (opens modal)
- **Secondary CTA**: "Dismiss" (hides banner)

**Banner States:**
- Visible (default for first visit)
- Dismissed (hidden, stored in localStorage)
- Collapsed (optional: minimize to small bar)

### 2. Feature Comparison Modal

**Modal Structure:**
- **Header**: "Lite vs Pro Comparison" with close button
- **Body**: Comparison table with features
- **Footer**: Pricing info and "Join Waitlist" CTA

**Comparison Table:**
| Feature | Lite (Free) | Pro |
|---------|-------------|-----|
| Real-time Leaderboard | ✓ | ✓ |
| Redis Caching | ✓ | ✓ |
| Socket.io Live Updates | ✓ | ✓ |
| Time-based Leaderboards | ✓ | ✓ |
| Railway.io Deployment | ✓ | ✓ |
| User Authentication (NextAuth.js) | ✗ | ✓ |
| Multi-Tenancy (Multiple Games) | ✗ | ✓ |
| Anti-Cheat System (HMAC) | ✗ | ✓ |
| Advanced Admin Dashboard | ✗ | ✓ |
| Player Ban/Unban | ✗ | ✓ |
| Priority Support | ✗ | ✓ |

**Modal Behavior:**
- Opens when "Compare Features" clicked
- Closes on X button, Escape key, or backdrop click
- Responsive: Full-screen on mobile, centered on desktop
- Smooth fade-in animation

### 3. Analytics Integration

**Track Events:**
- `pro_banner_viewed` - Banner displayed
- `pro_banner_dismissed` - User dismisses banner
- `pro_comparison_opened` - Modal opened
- `pro_comparison_closed` - Modal closed without action
- `waitlist_cta_clicked` - User clicks "Join Waitlist"

## Technical Approach

### Files to Create/Modify
- **file:frontend/components/ProUpgradeBanner.tsx** - Banner component (new)
- **file:frontend/components/ProComparisonModal.tsx** - Modal component (new)
- **file:frontend/app/admin/page.tsx** - Integrate banner
- **file:frontend/lib/analytics.ts** - Track Pro conversion events
- **file:frontend/hooks/useLocalStorage.ts** - Persist banner state (new)

### Implementation Steps

1. **Create ProUpgradeBanner component**:
   - Gradient background with branding
   - Dismissible with localStorage persistence
   - Responsive design
   - Track view and dismiss events

2. **Create ProComparisonModal component**:
   - Comparison table with checkmarks
   - Responsive modal (full-screen on mobile)
   - Close on Escape, backdrop, or X button
   - Track open and close events

3. **Integrate into admin page**:
   - Add banner at top of admin page
   - Connect modal trigger to banner CTA
   - Ensure proper z-index layering

4. **Add localStorage hook**:
   - Store banner dismissal state
   - Respect user preference across sessions
   - Clear on logout (optional)

5. **Track analytics events**:
   - Banner view on page load
   - Banner dismiss on click
   - Modal open/close
   - Waitlist CTA click

## Pro Upgrade Banner Wireframe

```wireframe
<!DOCTYPE html>
<html>
<head>
<style>
  body { margin: 0; font-family: system-ui, -apple-system, sans-serif; background: #f5f5f5; }
  .admin-container { max-width: 1200px; margin: 0 auto; padding: 20px; }
  .pro-banner { 
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    animation: slideDown 0.3s ease-out;
  }
  @keyframes slideDown {
    from { transform: translateY(-20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  .banner-content { flex: 1; }
  .banner-title { font-size: 18px; font-weight: 600; margin-bottom: 4px; }
  .banner-text { font-size: 14px; opacity: 0.9; }
  .banner-actions { display: flex; gap: 12px; align-items: center; }
  .btn-primary { 
    background: white;
    color: #667eea;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s;
  }
  .btn-primary:hover { transform: scale(1.05); }
  .btn-dismiss { 
    background: transparent;
    color: white;
    border: 1px solid rgba(255,255,255,0.3);
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.2s;
  }
  .btn-dismiss:hover { background: rgba(255,255,255,0.1); }
  .admin-content { background: white; padding: 24px; border-radius: 8px; }
  @media (max-width: 768px) {
    .pro-banner { flex-direction: column; gap: 16px; text-align: center; }
    .banner-actions { width: 100%; flex-direction: column; }
    .btn-primary, .btn-dismiss { width: 100%; }
  }
</style>
</head>
<body>
  <div class="admin-container">
    <div class="pro-banner" data-element-id="pro-upgrade-banner">
      <div class="banner-content">
        <div class="banner-title">🚀 Upgrade to LeaderBoard Pro</div>
        <div class="banner-text">Get multi-tenancy, user authentication, anti-cheat system, and advanced admin tools</div>
      </div>
      <div class="banner-actions">
        <button class="btn-primary" data-element-id="compare-features-btn">Compare Features</button>
        <button class="btn-dismiss" data-element-id="dismiss-banner-btn">Dismiss</button>
      </div>
    </div>
    
    <div class="admin-content">
      <h1>Admin Dashboard</h1>
      <p>Manage players, view statistics, and configure settings.</p>
    </div>
  </div>
</body>
</html>
```

## Pro Comparison Modal Wireframe

```wireframe
<!DOCTYPE html>
<html>
<head>
<style>
  body { margin: 0; font-family: system-ui, -apple-system, sans-serif; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
  .modal { 
    background: white;
    border-radius: 12px;
    max-width: 900px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    animation: fadeIn 0.3s ease-out;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  .modal-header { 
    padding: 24px;
    border-bottom: 1px solid #e5e5e5;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .modal-title { font-size: 24px; font-weight: 700; }
  .close-btn { 
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background 0.2s;
  }
  .close-btn:hover { background: #f5f5f5; }
  .modal-body { padding: 24px; }
  .comparison-table { width: 100%; border-collapse: collapse; }
  .comparison-table th { 
    background: #f9f9f9;
    padding: 12px;
    text-align: left;
    font-weight: 600;
    border-bottom: 2px solid #e5e5e5;
  }
  .comparison-table td { 
    padding: 12px;
    border-bottom: 1px solid #e5e5e5;
  }
  .feature-name { font-weight: 500; }
  .check { color: #10b981; font-weight: 700; font-size: 18px; }
  .cross { color: #ef4444; font-weight: 700; font-size: 18px; }
  .modal-footer { 
    padding: 24px;
    border-top: 1px solid #e5e5e5;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f9f9f9;
  }
  .price-tag { font-size: 14px; color: #666; }
  .btn-waitlist { 
    background: #667eea;
    color: white;
    border: none;
    padding: 12px 32px;
    border-radius: 6px;
    font-weight: 600;
    font-size: 16px;
    cursor: pointer;
    transition: background 0.2s;
  }
  .btn-waitlist:hover { background: #5568d3; }
  @media (max-width: 768px) {
    .modal { max-height: 100vh; border-radius: 0; }
    .modal-footer { flex-direction: column; gap: 12px; }
    .btn-waitlist { width: 100%; }
  }
</style>
</head>
<body>
  <div class="modal" data-element-id="pro-comparison-modal">
    <div class="modal-header">
      <h2 class="modal-title">Lite vs Pro Comparison</h2>
      <button class="close-btn" data-element-id="close-modal-btn">&times;</button>
    </div>
    <div class="modal-body">
      <table class="comparison-table">
        <thead>
          <tr>
            <th>Feature</th>
            <th>Lite (Free)</th>
            <th>Pro</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="feature-name">Real-time Leaderboard</td>
            <td class="check">✓</td>
            <td class="check">✓</td>
          </tr>
          <tr>
            <td class="feature-name">Redis Caching</td>
            <td class="check">✓</td>
            <td class="check">✓</td>
          </tr>
          <tr>
            <td class="feature-name">Socket.io Live Updates</td>
            <td class="check">✓</td>
            <td class="check">✓</td>
          </tr>
          <tr>
            <td class="feature-name">Time-based Leaderboards</td>
            <td class="check">✓</td>
            <td class="check">✓</td>
          </tr>
          <tr>
            <td class="feature-name">Railway.io Deployment</td>
            <td class="check">✓</td>
            <td class="check">✓</td>
          </tr>
          <tr>
            <td class="feature-name">User Authentication (NextAuth.js)</td>
            <td class="cross">✗</td>
            <td class="check">✓</td>
          </tr>
          <tr>
            <td class="feature-name">Multi-Tenancy (Multiple Games)</td>
            <td class="cross">✗</td>
            <td class="check">✓</td>
          </tr>
          <tr>
            <td class="feature-name">Anti-Cheat System (HMAC)</td>
            <td class="cross">✗</td>
            <td class="check">✓</td>
          </tr>
          <tr>
            <td class="feature-name">Advanced Admin Dashboard</td>
            <td class="cross">✗</td>
            <td class="check">✓</td>
          </tr>
          <tr>
            <td class="feature-name">Player Ban/Unban</td>
            <td class="cross">✗</td>
            <td class="check">✓</td>
          </tr>
          <tr>
            <td class="feature-name">Priority Support</td>
            <td class="cross">✗</td>
            <td class="check">✓</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="modal-footer">
      <div class="price-tag">Pro version coming soon • Early bird pricing available</div>
      <button class="btn-waitlist" data-element-id="join-waitlist-btn">Join Waitlist</button>
    </div>
  </div>
</body>
</html>
```

## Component Implementation Example

```typescript
// file:frontend/components/ProUpgradeBanner.tsx
'use client';

import { useState, useEffect } from 'react';
import { analytics } from '@/lib/analytics';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export default function ProUpgradeBanner({ onCompareClick }: { onCompareClick: () => void }) {
  const [dismissed, setDismissed] = useLocalStorage('pro-banner-dismissed', false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!dismissed) {
      setVisible(true);
      analytics.trackEvent('pro_banner_viewed', { page: 'admin' });
    }
  }, [dismissed]);

  const handleDismiss = () => {
    setDismissed(true);
    setVisible(false);
    analytics.trackEvent('pro_banner_dismissed', { page: 'admin' });
  };

  const handleCompareClick = () => {
    analytics.trackEvent('pro_comparison_opened', { source: 'banner' });
    onCompareClick();
  };

  if (!visible) return null;

  return (
    <div className="pro-banner">
      <div className="banner-content">
        <h3>🚀 Upgrade to LeaderBoard Pro</h3>
        <p>Get multi-tenancy, user authentication, anti-cheat system, and advanced admin tools</p>
      </div>
      <div className="banner-actions">
        <button onClick={handleCompareClick}>Compare Features</button>
        <button onClick={handleDismiss}>Dismiss</button>
      </div>
    </div>
  );
}
```

## Acceptance Criteria
- [ ] Pro upgrade banner displays on admin page
- [ ] Banner is dismissible and stores preference in localStorage
- [ ] Banner doesn't reappear after dismissal (same session)
- [ ] "Compare Features" button opens modal
- [ ] Modal displays complete feature comparison table
- [ ] Modal closes on X button, Escape key, and backdrop click
- [ ] Modal is responsive (full-screen on mobile)
- [ ] "Join Waitlist" button in modal footer
- [ ] All analytics events tracked correctly
- [ ] Banner and modal match design specifications
- [ ] Smooth animations for banner and modal
- [ ] Accessible (keyboard navigation, ARIA labels)

## Testing Checklist
- [ ] Banner appears on first admin page visit
- [ ] Dismiss button hides banner
- [ ] Banner stays hidden after page refresh
- [ ] Clear localStorage, banner reappears
- [ ] Compare Features opens modal
- [ ] Modal displays all features correctly
- [ ] Close modal with X button
- [ ] Close modal with Escape key
- [ ] Close modal by clicking backdrop
- [ ] Join Waitlist button clickable
- [ ] Analytics events fire correctly
- [ ] Responsive on mobile (full-screen modal)
- [ ] Keyboard navigation works
- [ ] Screen reader announces content

## Dependencies
- Analytics integration (from Phase 2)
- React hooks (useState, useEffect)

## Estimated Effort
**6-8 hours** (Large ticket)

## Related Artifacts
- **Epic Brief**: spec:74e6825c-8d55-4ab7-9815-849f8855bc05/ada011a7-ac51-4e46-8d4c-2ac6b36eb3bb
- **Core Flows**: spec:74e6825c-8d55-4ab7-9815-849f8855bc05/f6eb9bd3-f412-46c7-8c74-9372e6c0bc50