# Build Waitlist Signup Form with Backend Integration

## Objective
Create a waitlist signup form for Pro version with backend API integration, email validation, and analytics tracking to capture interested users.

## Current State
- ⚠️ No waitlist mechanism
- ⚠️ No email collection
- ⚠️ No Pro conversion tracking

## Requirements

### 1. Waitlist Signup Form

**Form Fields:**
- **Email** (required) - Validated email address
- **Name** (optional) - User's name
- **Use Case** (optional) - Textarea for project description
- **Company** (optional) - Company name

**Form Validation:**
- Email format validation
- Required field validation
- Character limits (name: 100, use case: 500)
- Duplicate email prevention

**Form States:**
- Initial (empty form)
- Submitting (loading spinner)
- Success (confirmation message)
- Error (error message with retry)

### 2. Backend API Endpoint

**Endpoint**: `POST /api/waitlist`

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "useCase": "Building leaderboard for mobile game",
  "company": "Game Studio Inc"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Thank you! You've been added to the waitlist."
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": {
    "message": "Email already registered",
    "code": "DUPLICATE_EMAIL"
  }
}
```

### 3. Data Storage

**Options:**
1. **Redis** (simple, existing infrastructure)
   - Store as sorted set with timestamp
   - Key: `waitlist:emails`
   - Value: JSON with email, name, useCase, company, timestamp

2. **External Service** (recommended for production)
   - Mailchimp API
   - ConvertKit API
   - Custom webhook to Google Sheets/Airtable

3. **Database** (if available)
   - PostgreSQL table
   - MongoDB collection

### 4. Email Notifications

**Confirmation Email (Optional):**
- Send to user after signup
- Thank you message
- What to expect next
- Link to Pro landing page

**Admin Notification (Optional):**
- Notify admin of new signup
- Include user details
- Daily digest option

### 5. Analytics Tracking

**Track Events:**
- `waitlist_form_opened` - Form displayed
- `waitlist_form_submitted` - Form submitted successfully
- `waitlist_form_error` - Submission error
- `waitlist_form_abandoned` - Form closed without submit

## Technical Approach

### Files to Create/Modify
- **file:frontend/components/WaitlistForm.tsx** - Form component (new)
- **file:backend/src/routes/waitlist.js** - API endpoint (new)
- **file:backend/src/middleware/validation.js** - Add waitlist validation
- **file:backend/src/utils/email.js** - Email sending utility (new, optional)
- **file:frontend/lib/analytics.ts** - Track waitlist events

### Implementation Steps

1. **Create WaitlistForm component**:
   - Form with email, name, use case fields
   - Client-side validation
   - Loading and success states
   - Error handling

2. **Create backend API endpoint**:
   - POST /api/waitlist route
   - Validate email format
   - Check for duplicates
   - Store in Redis or external service
   - Return success/error response

3. **Add validation middleware**:
   - Email format validation
   - Required field validation
   - Sanitize inputs
   - Rate limiting (prevent spam)

4. **Integrate with external service** (optional):
   - Mailchimp API for email list
   - ConvertKit for email marketing
   - Webhook to Google Sheets

5. **Add confirmation email** (optional):
   - Use Nodemailer or SendGrid
   - Send thank you email
   - Include Pro information

6. **Track analytics**:
   - Form open event
   - Form submit event
   - Success/error events

## Waitlist Form Wireframe

```wireframe
<!DOCTYPE html>
<html>
<head>
<style>
  body { margin: 0; font-family: system-ui, -apple-system, sans-serif; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
  .form-modal { 
    background: white;
    border-radius: 12px;
    max-width: 500px;
    width: 100%;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    animation: slideUp 0.3s ease-out;
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .form-header { 
    padding: 24px;
    border-bottom: 1px solid #e5e5e5;
    text-align: center;
  }
  .form-title { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
  .form-subtitle { font-size: 14px; color: #666; }
  .form-body { padding: 24px; }
  .form-group { margin-bottom: 20px; }
  .form-label { 
    display: block;
    font-weight: 600;
    margin-bottom: 8px;
    font-size: 14px;
  }
  .required { color: #ef4444; }
  .form-input { 
    width: 100%;
    padding: 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    box-sizing: border-box;
    transition: border-color 0.2s;
  }
  .form-input:focus { 
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  .form-textarea { 
    width: 100%;
    padding: 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    min-height: 100px;
    box-sizing: border-box;
    font-family: inherit;
    resize: vertical;
  }
  .form-footer { 
    padding: 24px;
    border-top: 1px solid #e5e5e5;
    display: flex;
    gap: 12px;
  }
  .btn-submit { 
    flex: 1;
    background: #667eea;
    color: white;
    border: none;
    padding: 12px;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }
  .btn-submit:hover { background: #5568d3; }
  .btn-submit:disabled { 
    background: #d1d5db;
    cursor: not-allowed;
  }
  .btn-cancel { 
    flex: 1;
    background: white;
    color: #666;
    border: 1px solid #d1d5db;
    padding: 12px;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }
  .btn-cancel:hover { background: #f9f9f9; }
  .success-message {
    text-align: center;
    padding: 40px 24px;
  }
  .success-icon { font-size: 48px; margin-bottom: 16px; }
  .success-title { font-size: 20px; font-weight: 600; margin-bottom: 8px; }
  .success-text { color: #666; }
  @media (max-width: 768px) {
    .form-modal { max-height: 100vh; border-radius: 0; }
  }
</style>
</head>
<body>
  <div class="form-modal" data-element-id="waitlist-form-modal">
    <div class="form-header">
      <h2 class="form-title">Join the Pro Waitlist</h2>
      <p class="form-subtitle">Be the first to know when LeaderBoard Pro launches</p>
    </div>
    <div class="form-body">
      <div class="form-group">
        <label class="form-label" for="email">
          Email Address <span class="required">*</span>
        </label>
        <input 
          type="email" 
          id="email" 
          class="form-input" 
          placeholder="you@example.com" 
          data-element-id="email-input" 
          required 
        />
      </div>
      <div class="form-group">
        <label class="form-label" for="name">Name</label>
        <input 
          type="text" 
          id="name" 
          class="form-input" 
          placeholder="Your name" 
          data-element-id="name-input" 
        />
      </div>
      <div class="form-group">
        <label class="form-label" for="company">Company</label>
        <input 
          type="text" 
          id="company" 
          class="form-input" 
          placeholder="Your company" 
          data-element-id="company-input" 
        />
      </div>
      <div class="form-group">
        <label class="form-label" for="usecase">What will you use LeaderBoard Pro for?</label>
        <textarea 
          id="usecase" 
          class="form-textarea" 
          placeholder="Tell us about your project..." 
          data-element-id="usecase-input"
        ></textarea>
      </div>
    </div>
    <div class="form-footer">
      <button class="btn-cancel" data-element-id="cancel-btn">Cancel</button>
      <button class="btn-submit" data-element-id="submit-btn">Join Waitlist</button>
    </div>
  </div>
</body>
</html>
```

## Backend API Implementation

```javascript
// file:backend/src/routes/waitlist.js
const express = require('express');
const router = express.Router();
const { validateEmail } = require('../middleware/validation');
const { apiLimiter } = require('../middleware/rateLimiter');
const redisClient = require('../config/redis');
const logger = require('../utils/logger');

router.post('/', apiLimiter, validateEmail, async (req, res) => {
  try {
    const { email, name, company, useCase } = req.body;
    
    // Check for duplicate
    const exists = await redisClient.zscore('waitlist:emails', email);
    if (exists) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Email already registered',
          code: 'DUPLICATE_EMAIL'
        }
      });
    }
    
    // Store in Redis
    const timestamp = Date.now();
    const data = JSON.stringify({ email, name, company, useCase, timestamp });
    await redisClient.zadd('waitlist:emails', timestamp, email);
    await redisClient.hset('waitlist:data', email, data);
    
    logger.info('Waitlist signup', { email, name, company });
    
    // Optional: Send to external service (Mailchimp, etc.)
    // await sendToMailchimp({ email, name, company, useCase });
    
    res.json({
      success: true,
      message: 'Thank you! You\'ve been added to the waitlist.'
    });
  } catch (error) {
    logger.error('Waitlist signup error', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to join waitlist. Please try again.',
        code: 'SERVER_ERROR'
      }
    });
  }
});

module.exports = router;
```

## Acceptance Criteria
- [ ] Waitlist form component created with all fields
- [ ] Email validation (format and required)
- [ ] Backend API endpoint `/api/waitlist` created
- [ ] Duplicate email prevention
- [ ] Data stored in Redis (or external service)
- [ ] Success message displayed after submission
- [ ] Error handling for failed submissions
- [ ] Rate limiting on API endpoint (prevent spam)
- [ ] Analytics events tracked (open, submit, error, abandon)
- [ ] Form is responsive (mobile-friendly)
- [ ] Accessible (keyboard navigation, ARIA labels)
- [ ] Loading state during submission
- [ ] Form resets after successful submission

## Testing Checklist
- [ ] Submit valid email, verify success message
- [ ] Submit duplicate email, verify error message
- [ ] Submit invalid email format, verify validation error
- [ ] Submit without required email, verify error
- [ ] Submit with all fields, verify data stored
- [ ] Rapid submissions trigger rate limit
- [ ] Analytics events fire correctly
- [ ] Form works on mobile
- [ ] Keyboard navigation works
- [ ] Screen reader announces errors

## Dependencies
- Redis (already configured)
- Optional: Mailchimp/ConvertKit API
- Optional: Nodemailer/SendGrid for emails

## Estimated Effort
**5-6 hours** (Medium-Large ticket)

## Related Artifacts
- **Epic Brief**: spec:74e6825c-8d55-4ab7-9815-849f8855bc05/ada011a7-ac51-4e46-8d4c-2ac6b36eb3bb
- **Core Flows**: spec:74e6825c-8d55-4ab7-9815-849f8855bc05/f6eb9bd3-f412-46c7-8c74-9372e6c0bc50