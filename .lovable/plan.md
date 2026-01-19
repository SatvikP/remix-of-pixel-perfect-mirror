

## One-Click Email Feature for Startup Modal

### Overview
Add a "Send Email" button to the StartupDetailModal that allows users to send a pre-drafted investment inquiry email directly from the app without leaving the page.

### Prerequisites
- **Resend API Key**: Required for sending emails
  - Sign up at https://resend.com
  - Validate your domain at https://resend.com/domains
  - Create API key at https://resend.com/api-keys

### Architecture

```
User clicks "Send Email" button
        ↓
Modal shows email composer with pre-filled draft
        ↓
User edits/confirms and clicks "Send"
        ↓
Frontend calls send-outreach-email edge function
        ↓
Edge function uses Resend API to send email
        ↓
Success toast shown to user
```

### Implementation Steps

#### 1. Add RESEND_API_KEY Secret
- Use the add_secret tool to request the Resend API key from the user
- This secret will be available in the edge function

#### 2. Create Edge Function: send-outreach-email
**File:** `supabase/functions/send-outreach-email/index.ts`

The edge function will:
- Accept: recipient email, subject, body, startup name
- Use Resend SDK to send the email
- Return success/failure status

```typescript
// Edge function structure
- Imports (Resend SDK)
- CORS headers
- Handler that sends email via Resend
- Error handling and logging
```

#### 3. Create Email Composer Component
**File:** `src/components/EmailComposer.tsx`

A dialog component that:
- Takes startup data as props
- Pre-generates an email draft based on startup info
- Allows user to edit recipient, subject, and body
- Has "Send" and "Cancel" buttons
- Shows loading state while sending
- Displays success/error feedback

**Draft Email Template:**
```
Subject: Investment Inquiry - [Startup Name]

Hi,

I came across [Startup Name] and was impressed by your work in [matched trends].

[Personalized content based on startup data: blurb, market, value prop]

I'd love to schedule a call to learn more about your vision and discuss potential investment opportunities.

Best regards,
[Sender name - from user profile or editable field]
```

#### 4. Update StartupDetailModal
**File:** `src/components/StartupDetailModal.tsx`

Changes:
- Add "Send Email" button (with Mail icon) in the Links section
- Add state to control email composer visibility
- Pass startup data to EmailComposer component

#### 5. Add API Integration Function
**File:** `src/lib/api.ts`

Add function to call the edge function:
```typescript
export async function sendOutreachEmail(data: {
  to: string;
  subject: string;
  body: string;
  startupName: string;
}): Promise<{ success: boolean; error?: string }>
```

### UI Design

**In StartupDetailModal (Links section):**
```
[🔗 Website]  [💼 LinkedIn]  [✉️ Send Email]
```

**Email Composer Dialog:**
```
┌─────────────────────────────────────────────────────┐
│  📧 Email Outreach                              [X] │
├─────────────────────────────────────────────────────┤
│  To:      [recipient@startup.com____________]       │
│  Subject: [Investment Inquiry - NutriSensor__]      │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ Hi,                                         │   │
│  │                                              │   │
│  │ I came across NutriSensor and was           │   │
│  │ impressed by your work in Precision         │   │
│  │ Health & Bio-Sensing Wearables...           │   │
│  │                                              │   │
│  │ [Editable textarea with full draft]         │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  From: [Your Name (editable)__________________]     │
│  Reply-to: [your@email.com___________________]      │
│                                                     │
│                      [Cancel]  [📤 Send Email]      │
└─────────────────────────────────────────────────────┘
```

### File Changes Summary

| File | Change |
|------|--------|
| `supabase/functions/send-outreach-email/index.ts` | **New** - Edge function for sending emails via Resend |
| `supabase/config.toml` | Update - Add new edge function config |
| `src/components/EmailComposer.tsx` | **New** - Email composition dialog component |
| `src/components/StartupDetailModal.tsx` | Update - Add email button and composer integration |
| `src/lib/api.ts` | Update - Add sendOutreachEmail function |

### Critical Files for Implementation
- `supabase/functions/send-outreach-email/index.ts` - Edge function to send emails via Resend API
- `src/components/EmailComposer.tsx` - New component for composing and sending emails
- `src/components/StartupDetailModal.tsx` - Add email button and integrate composer
- `src/lib/api.ts` - Add API function to call the edge function
- `supabase/config.toml` - Register the new edge function

