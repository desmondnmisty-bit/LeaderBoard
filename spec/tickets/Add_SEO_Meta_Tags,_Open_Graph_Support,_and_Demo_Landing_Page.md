# Add SEO Meta Tags, Open Graph Support, and Demo Landing Page

## Objective
Implement comprehensive SEO meta tags, Open Graph support for social sharing, and create an engaging demo landing page to improve discoverability and showcase features.

## Current State
- ✅ Next.js app with basic metadata
- ⚠️ No Open Graph tags for social sharing
- ⚠️ No Twitter Card support
- ⚠️ No demo landing page
- ⚠️ Minimal SEO optimization

## Requirements

### 1. SEO Meta Tags

**Essential Meta Tags:**
- Title (dynamic, descriptive)
- Description (compelling, keyword-rich)
- Keywords (relevant terms)
- Author
- Viewport (mobile-friendly)
- Canonical URL
- Robots (index, follow)

**Example:**
```html
<title>LeaderBoard - Real-Time Leaderboards for Games | Open Source</title>
<meta name="description" content="Deploy production-ready real-time leaderboards in minutes. Built with Redis, Socket.io, and Next.js. Open source and free." />
<meta name="keywords" content="leaderboard, real-time, redis, socket.io, gaming, open source" />
```

### 2. Open Graph Tags

**For Social Sharing (Facebook, LinkedIn, etc.):**
- og:title
- og:description
- og:image (1200x630px recommended)
- og:url
- og:type
- og:site_name

**Example:**
```html
<meta property="og:title" content="LeaderBoard - Real-Time Leaderboards" />
<meta property="og:description" content="Deploy production-ready leaderboards in minutes" />
<meta property="og:image" content="https://yourdomain.com/og-image.png" />
<meta property="og:url" content="https://yourdomain.com" />
<meta property="og:type" content="website" />
```

### 3. Twitter Card Tags

**For Twitter Sharing:**
- twitter:card (summary_large_image)
- twitter:title
- twitter:description
- twitter:image
- twitter:creator

### 4. Demo Landing Page

**Landing Page Sections:**

**Hero Section:**
- Compelling headline
- Subheadline with value proposition
- Primary CTA ("Deploy on Railway")
- Secondary CTA ("View Live Demo")
- Hero image or animation

**Features Section:**
- 3-6 key features with icons
- Real-time updates
- One-click deploy
- Redis-powered performance
- Socket.io live updates
- Production-ready

**Live Demo Section:**
- Embedded live leaderboard
- Real-time updates visible
- Interactive (users can search)

**How It Works:**
- 3-step process
- Visual diagram or screenshots
- Code examples

**Comparison Table:**
- Lite vs Pro features
- Clear differentiation
- CTA to Pro waitlist

**Testimonials/Social Proof:**
- GitHub stars
- Deployment count
- User quotes (if available)

**Footer:**
- Links to docs, GitHub, Pro version
- Social media links
- Copyright

### 5. Structured Data (JSON-LD)

**For Rich Snippets:**
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "LeaderBoard",
  "description": "Real-time leaderboard system",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Any",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}
```

## Technical Approach

### Files to Create/Modify
- **file:frontend/app/layout.tsx** - Add meta tags
- **file:frontend/app/page.tsx** - Create landing page
- **file:frontend/app/metadata.ts** - Centralize metadata (new)
- **file:frontend/public/og-image.png** - Open Graph image (new)
- **file:frontend/public/twitter-card.png** - Twitter card image (new)
- **file:frontend/components/LandingHero.tsx** - Hero section (new)
- **file:frontend/components/LandingFeatures.tsx** - Features section (new)
- **file:frontend/components/LandingDemo.tsx** - Live demo section (new)

### Implementation Steps

1. **Create metadata configuration**:
   - Define all meta tags
   - Configure Open Graph
   - Add Twitter Cards
   - Add JSON-LD structured data

2. **Design and create OG images**:
   - Create 1200x630px image for Open Graph
   - Create 1200x600px image for Twitter Card
   - Include branding and key message
   - Optimize for file size

3. **Build landing page components**:
   - Hero section with CTAs
   - Features grid with icons
   - Live demo embed
   - How it works section
   - Comparison table
   - Footer

4. **Implement SEO best practices**:
   - Semantic HTML
   - Heading hierarchy (H1, H2, H3)
   - Alt text for images
   - Internal linking
   - Fast loading (optimize images)

5. **Test social sharing**:
   - Facebook Sharing Debugger
   - Twitter Card Validator
   - LinkedIn Post Inspector
   - Verify images and text display correctly

## Landing Page Hero Wireframe

```wireframe
<!DOCTYPE html>
<html>
<head>
<style>
  body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
  .hero {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    min-height: 600px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 40px 20px;
  }
  .hero-content { max-width: 800px; }
  .hero-title {
    font-size: 56px;
    font-weight: 700;
    margin-bottom: 24px;
    line-height: 1.2;
  }
  .hero-subtitle {
    font-size: 24px;
    opacity: 0.9;
    margin-bottom: 40px;
    line-height: 1.5;
  }
  .hero-ctas {
    display: flex;
    gap: 16px;
    justify-content: center;
    flex-wrap: wrap;
  }
  .btn-primary {
    background: white;
    color: #667eea;
    border: none;
    padding: 16px 40px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 18px;
    cursor: pointer;
    text-decoration: none;
    display: inline-block;
  }
  .btn-secondary {
    background: transparent;
    color: white;
    border: 2px solid white;
    padding: 16px 40px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 18px;
    cursor: pointer;
    text-decoration: none;
    display: inline-block;
  }
  .hero-badges {
    margin-top: 40px;
    display: flex;
    gap: 24px;
    justify-content: center;
    flex-wrap: wrap;
  }
  .badge {
    background: rgba(255,255,255,0.2);
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 14px;
  }
</style>
</head>
<body>
  <div class="hero" data-element-id="landing-hero">
    <div class="hero-content">
      <h1 class="hero-title">Real-Time Leaderboards Made Simple</h1>
      <p class="hero-subtitle">
        Deploy production-ready leaderboards in minutes with Redis, Socket.io, and Next.js. 
        Open source, free, and built for scale.
      </p>
      <div class="hero-ctas">
        <a href="#" class="btn-primary" data-element-id="deploy-cta">
          🚀 Deploy on Railway
        </a>
        <a href="#demo" class="btn-secondary" data-element-id="demo-cta">
          👀 View Live Demo
        </a>
      </div>
      <div class="hero-badges">
        <div class="badge">⚡ Sub-millisecond response</div>
        <div class="badge">🔄 Real-time updates</div>
        <div class="badge">🎯 Production-ready</div>
      </div>
    </div>
  </div>
</body>
</html>
```

## Metadata Configuration Example

```typescript
// file:frontend/app/metadata.ts
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LeaderBoard - Real-Time Leaderboards for Games | Open Source',
  description: 'Deploy production-ready real-time leaderboards in minutes. Built with Redis, Socket.io, and Next.js. Open source and free.',
  keywords: ['leaderboard', 'real-time', 'redis', 'socket.io', 'gaming', 'open source', 'next.js'],
  authors: [{ name: 'Your Name' }],
  openGraph: {
    title: 'LeaderBoard - Real-Time Leaderboards',
    description: 'Deploy production-ready leaderboards in minutes',
    url: 'https://yourdomain.com',
    siteName: 'LeaderBoard',
    images: [
      {
        url: 'https://yourdomain.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LeaderBoard Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LeaderBoard - Real-Time Leaderboards',
    description: 'Deploy production-ready leaderboards in minutes',
    images: ['https://yourdomain.com/twitter-card.png'],
    creator: '@yourusername',
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: 'your-google-verification-code',
  },
};
```

## Acceptance Criteria
- [ ] All essential SEO meta tags implemented
- [ ] Open Graph tags for Facebook/LinkedIn sharing
- [ ] Twitter Card tags implemented
- [ ] JSON-LD structured data added
- [ ] OG image created (1200x630px)
- [ ] Twitter card image created (1200x600px)
- [ ] Landing page hero section complete
- [ ] Features section with 6 key features
- [ ] Live demo section with embedded leaderboard
- [ ] How it works section
- [ ] Comparison table (Lite vs Pro)
- [ ] Footer with links
- [ ] Semantic HTML with proper heading hierarchy
- [ ] Alt text for all images
- [ ] Fast page load (<2s)
- [ ] Social sharing tested on Facebook, Twitter, LinkedIn

## Testing Checklist
- [ ] Facebook Sharing Debugger shows correct preview
- [ ] Twitter Card Validator shows correct preview
- [ ] LinkedIn Post Inspector shows correct preview
- [ ] Google Search Console validates structured data
- [ ] Lighthouse SEO score >90
- [ ] All images have alt text
- [ ] Heading hierarchy is correct (H1 → H2 → H3)
- [ ] Page loads in <2s on 3G
- [ ] Mobile responsive

## Dependencies
- Image editing tool for OG images (Figma, Canva, etc.)

## Estimated Effort
**8-10 hours** (Large ticket - includes design and content)

## Related Artifacts
- **Epic Brief**: spec:74e6825c-8d55-4ab7-9815-849f8855bc05/ada011a7-ac51-4e46-8d4c-2ac6b36eb3bb
- **Core Flows**: spec:74e6825c-8d55-4ab7-9815-849f8855bc05/f6eb9bd3-f412-46c7-8c74-9372e6c0bc50