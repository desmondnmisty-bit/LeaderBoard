# Add Theme Customization via Environment Variables

## Objective
Enable deployers to customize the leaderboard's visual theme (colors, branding, logos) via environment variables, allowing white-label deployments without code changes.

## Current State
- ✅ Theme toggle component exists (dark/light mode)
- ✅ Tailwind CSS configured
- ⚠️ No customization via environment variables
- ⚠️ Hard-coded colors and branding
- ⚠️ No logo upload/customization option

## Requirements

### 1. Customizable Theme Variables

| Variable | Purpose | Default | Example |
|----------|---------|---------|---------|
| `NEXT_PUBLIC_PRIMARY_COLOR` | Primary brand color | `#667eea` | `#ff6b6b` |
| `NEXT_PUBLIC_SECONDARY_COLOR` | Secondary/accent color | `#764ba2` | `#4ecdc4` |
| `NEXT_PUBLIC_APP_NAME` | Application name | `LeaderBoard` | `My Game Leaderboard` |
| `NEXT_PUBLIC_LOGO_URL` | Logo image URL | Default logo | `https://cdn.example.com/logo.png` |
| `NEXT_PUBLIC_FAVICON_URL` | Favicon URL | Default favicon | `https://cdn.example.com/favicon.ico` |
| `NEXT_PUBLIC_FONT_FAMILY` | Custom font | `system-ui` | `'Roboto', sans-serif` |

### 2. Dynamic Color Application
Apply custom colors to:
- Primary buttons and CTAs
- Links and interactive elements
- Rank badges and highlights
- Gradient backgrounds
- Loading indicators
- Pro upgrade banner

### 3. Branding Customization
- Custom app name in header and title
- Custom logo in navigation
- Custom favicon
- Custom font family (Google Fonts support)
- Custom meta tags for social sharing

### 4. CSS Variable Injection
Use CSS custom properties for dynamic theming:
```css
:root {
  --color-primary: #667eea;
  --color-secondary: #764ba2;
  --font-family: system-ui;
}
```

## Technical Approach

### Files to Modify
- **file:frontend/app/layout.tsx** - Inject CSS variables from env
- **file:frontend/tailwind.config.js** - Use CSS variables in Tailwind
- **file:frontend/components/ThemeToggle.tsx** - Respect custom colors
- **file:frontend/app/globals.css** - Define CSS custom properties
- **file:frontend/.env.example** - Document theme variables
- **file:README.md** - Add theme customization guide

### Implementation Steps

1. **Define CSS custom properties**:
   - Read env vars in `layout.tsx`
   - Inject CSS variables into `:root`
   - Fallback to defaults if not set

2. **Update Tailwind config**:
   - Use CSS variables for colors
   - Enable custom color classes
   - Support dark mode with custom colors

3. **Apply custom branding**:
   - Replace app name dynamically
   - Load custom logo from URL
   - Update favicon dynamically
   - Load custom font from Google Fonts

4. **Test theme variations**:
   - Test with different color schemes
   - Verify contrast ratios (WCAG AA)
   - Test dark mode compatibility
   - Test with custom fonts

5. **Document customization**:
   - Add theme guide to README
   - Provide color palette examples
   - Show before/after screenshots

## Theme Customization Example

```typescript
// file:frontend/app/layout.tsx
export default function RootLayout({ children }) {
  const primaryColor = process.env.NEXT_PUBLIC_PRIMARY_COLOR || '#667eea';
  const secondaryColor = process.env.NEXT_PUBLIC_SECONDARY_COLOR || '#764ba2';
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'LeaderBoard';
  const logoUrl = process.env.NEXT_PUBLIC_LOGO_URL;
  const fontFamily = process.env.NEXT_PUBLIC_FONT_FAMILY || 'system-ui';

  return (
    <html lang="en">
      <head>
        <title>{appName}</title>
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              --color-primary: ${primaryColor};
              --color-secondary: ${secondaryColor};
              --font-family: ${fontFamily};
            }
          `
        }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

## Tailwind Config Update

```javascript
// file:frontend/tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
      },
      fontFamily: {
        sans: ['var(--font-family)', 'system-ui', 'sans-serif'],
      }
    }
  }
};
```

## Theme Examples

### Gaming Theme
```bash
NEXT_PUBLIC_PRIMARY_COLOR=#ff6b6b
NEXT_PUBLIC_SECONDARY_COLOR=#4ecdc4
NEXT_PUBLIC_APP_NAME="Epic Game Leaderboard"
NEXT_PUBLIC_LOGO_URL=https://cdn.example.com/gaming-logo.png
```

### Corporate Theme
```bash
NEXT_PUBLIC_PRIMARY_COLOR=#2c3e50
NEXT_PUBLIC_SECONDARY_COLOR=#3498db
NEXT_PUBLIC_APP_NAME="Company Leaderboard"
NEXT_PUBLIC_LOGO_URL=https://cdn.example.com/corp-logo.png
NEXT_PUBLIC_FONT_FAMILY="'Inter', sans-serif"
```

## Acceptance Criteria
- [ ] Primary color customizable via `NEXT_PUBLIC_PRIMARY_COLOR`
- [ ] Secondary color customizable via `NEXT_PUBLIC_SECONDARY_COLOR`
- [ ] App name customizable via `NEXT_PUBLIC_APP_NAME`
- [ ] Logo customizable via `NEXT_PUBLIC_LOGO_URL`
- [ ] Favicon customizable via `NEXT_PUBLIC_FAVICON_URL`
- [ ] Font family customizable via `NEXT_PUBLIC_FONT_FAMILY`
- [ ] Custom colors applied to all interactive elements
- [ ] Dark mode works with custom colors
- [ ] Color contrast meets WCAG AA standards
- [ ] README documents all theme variables with examples
- [ ] `.env.example` includes theme variables

## Testing Checklist
- [ ] Set custom primary color, verify buttons update
- [ ] Set custom logo URL, verify logo displays
- [ ] Set custom app name, verify header and title update
- [ ] Set custom font, verify typography changes
- [ ] Test dark mode with custom colors
- [ ] Verify color contrast with accessibility tools
- [ ] Test with multiple theme combinations
- [ ] Verify fallback to defaults when vars not set

## Dependencies
- None (uses existing Tailwind and Next.js)

## Estimated Effort
**4-5 hours** (Medium ticket)

## Related Artifacts
- **Epic Brief**: spec:74e6825c-8d55-4ab7-9815-849f8855bc05/ada011a7-ac51-4e46-8d4c-2ac6b36eb3bb
- **Core Flows**: spec:74e6825c-8d55-4ab7-9815-849f8855bc05/f6eb9bd3-f412-46c7-8c74-9372e6c0bc50