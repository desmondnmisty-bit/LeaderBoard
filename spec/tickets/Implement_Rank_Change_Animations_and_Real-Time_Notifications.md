# Implement Rank Change Animations and Real-Time Notifications

## Objective
Add engaging visual animations for rank changes and real-time notifications to enhance user experience and make demos more compelling.

## Current State
- ✅ Real-time updates via Socket.io working
- ✅ Leaderboard updates every 30 seconds
- ⚠️ No visual feedback for rank changes
- ⚠️ No animations or transitions
- ⚠️ Updates feel abrupt and jarring

## Requirements

### 1. Rank Change Animations

**Rank Up (Improved Position):**
- Green highlight flash
- Upward arrow animation (↑)
- Smooth row transition
- Celebration effect (optional confetti)

**Rank Down (Worse Position):**
- Red highlight flash
- Downward arrow animation (↓)
- Smooth row transition

**New Entry:**
- Fade-in animation
- Highlight border
- "NEW" badge (temporary)

**Score Update (Same Rank):**
- Subtle pulse animation
- Score number count-up effect

### 2. Real-Time Notifications

**Toast Notifications:**
- Position: Top-right corner
- Duration: 3-5 seconds
- Auto-dismiss with progress bar
- Stack multiple notifications

**Notification Types:**
- Personal rank change: "You moved up to #5! 🎉"
- New high score: "New record! PlayerX scored 15,000"
- Milestone reached: "You're in the top 10!"

### 3. Animation Performance
- Use CSS transforms (GPU-accelerated)
- Reduce motion for users with `prefers-reduced-motion`
- Throttle animations on low-end devices
- Smooth 60fps animations

### 4. Sound Effects (Optional)
- Rank up sound (subtle chime)
- Rank down sound (subtle tone)
- Configurable via settings
- Muted by default

## Technical Approach

### Files to Modify
- **file:frontend/components/LeaderboardTable.tsx** - Add rank change detection and animations
- **file:frontend/components/YourRankIndicator.tsx** - Add personal rank animations
- **file:frontend/hooks/useSocket.ts** - Detect rank changes from Socket.io events
- **file:frontend/app/globals.css** - Add animation keyframes
- **file:frontend/components/Toast.tsx** - Create toast notification component (new)

### Implementation Steps

1. **Detect rank changes**:
   - Compare previous and current leaderboard state
   - Identify players who moved up/down
   - Track new entries and exits

2. **Create animation components**:
   - `RankChangeIndicator` - Arrow with animation
   - `HighlightRow` - Flash highlight effect
   - `ScoreCounter` - Count-up animation
   - `Toast` - Notification component

3. **Apply animations**:
   - Add CSS transitions to table rows
   - Trigger animations on rank change
   - Use Framer Motion or CSS animations

4. **Implement toast notifications**:
   - Create toast context/provider
   - Add toast queue management
   - Style toast with icons and colors

5. **Optimize performance**:
   - Use `will-change` CSS property
   - Debounce rapid updates
   - Respect `prefers-reduced-motion`

## Animation Examples

### Rank Up Animation

```css
@keyframes rankUp {
  0% { background-color: transparent; }
  50% { background-color: rgba(16, 185, 129, 0.2); }
  100% { background-color: transparent; }
}

@keyframes arrowUp {
  0% { transform: translateY(10px); opacity: 0; }
  50% { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(-10px); opacity: 0; }
}

.rank-up {
  animation: rankUp 1s ease-in-out;
}

.arrow-up {
  animation: arrowUp 0.8s ease-in-out;
  color: #10b981;
}
```

### Score Count-Up

```typescript
// Animate score from old to new value
const animateScore = (from: number, to: number, duration: number) => {
  const start = Date.now();
  const update = () => {
    const now = Date.now();
    const progress = Math.min((now - start) / duration, 1);
    const current = Math.floor(from + (to - from) * progress);
    setDisplayScore(current);
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
};
```

## Toast Notification Wireframe

```wireframe
<!DOCTYPE html>
<html>
<head>
<style>
  body { margin: 0; font-family: system-ui, -apple-system, sans-serif; background: #f5f5f5; padding: 20px; }
  .toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .toast {
    background: white;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    min-width: 300px;
    display: flex;
    align-items: center;
    gap: 12px;
    animation: slideIn 0.3s ease-out;
  }
  @keyframes slideIn {
    from { transform: translateX(400px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  .toast-icon {
    font-size: 24px;
    flex-shrink: 0;
  }
  .toast-content {
    flex: 1;
  }
  .toast-title {
    font-weight: 600;
    margin-bottom: 4px;
  }
  .toast-message {
    font-size: 14px;
    color: #666;
  }
  .toast-close {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #999;
  }
  .toast-progress {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 3px;
    background: #667eea;
    animation: progress 3s linear;
  }
  @keyframes progress {
    from { width: 100%; }
    to { width: 0%; }
  }
  .toast-success { border-left: 4px solid #10b981; }
  .toast-info { border-left: 4px solid #3b82f6; }
  .toast-warning { border-left: 4px solid #f59e0b; }
</style>
</head>
<body>
  <div class="toast-container" data-element-id="toast-container">
    <div class="toast toast-success" data-element-id="rank-up-toast">
      <div class="toast-icon">🎉</div>
      <div class="toast-content">
        <div class="toast-title">Rank Up!</div>
        <div class="toast-message">You moved up to #5</div>
      </div>
      <button class="toast-close" data-element-id="close-toast">×</button>
      <div class="toast-progress"></div>
    </div>
    
    <div class="toast toast-info" data-element-id="new-score-toast">
      <div class="toast-icon">🏆</div>
      <div class="toast-content">
        <div class="toast-title">New High Score!</div>
        <div class="toast-message">PlayerX scored 15,000 points</div>
      </div>
      <button class="toast-close">×</button>
      <div class="toast-progress"></div>
    </div>
  </div>
</body>
</html>
```

## Acceptance Criteria
- [ ] Rank up shows green highlight and upward arrow
- [ ] Rank down shows red highlight and downward arrow
- [ ] New entries fade in with "NEW" badge
- [ ] Score updates animate with count-up effect
- [ ] Toast notifications appear for personal rank changes
- [ ] Toast notifications auto-dismiss after 3-5 seconds
- [ ] Multiple toasts stack vertically
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Animations run at 60fps (no jank)
- [ ] Animations work on mobile devices

## Testing Checklist
- [ ] Trigger rank up, verify green animation
- [ ] Trigger rank down, verify red animation
- [ ] Add new player, verify fade-in
- [ ] Update score, verify count-up animation
- [ ] Personal rank change shows toast
- [ ] Multiple toasts stack correctly
- [ ] Toast auto-dismisses after duration
- [ ] Animations smooth on low-end device
- [ ] `prefers-reduced-motion` disables animations
- [ ] No performance issues with rapid updates

## Dependencies
- Optional: `framer-motion` for advanced animations (or use CSS)

## Estimated Effort
**6-7 hours** (Medium-Large ticket)

## Related Artifacts
- **Epic Brief**: spec:74e6825c-8d55-4ab7-9815-849f8855bc05/ada011a7-ac51-4e46-8d4c-2ac6b36eb3bb
- **Core Flows**: spec:74e6825c-8d55-4ab7-9815-849f8855bc05/f6eb9bd3-f412-46c7-8c74-9372e6c0bc50