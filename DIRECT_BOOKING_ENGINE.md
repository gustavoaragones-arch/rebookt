# Rebookt
### Project Brief for Claude Code in Cursor

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Strategic Context](#2-strategic-context)
3. [Product Philosophy](#3-product-philosophy)
4. [Tech Stack](#4-tech-stack)
5. [Data Model](#5-data-model)
6. [Architecture & Module Map](#6-architecture--module-map)
7. [Module Specifications](#7-module-specifications)
8. [Design System](#8-design-system)
9. [Landing Page Structure](#9-landing-page-structure)
10. [Booking Widget UX](#10-booking-widget-ux)
11. [Phase Roadmap](#11-phase-roadmap)
12. [Cursor AI Instructions](#12-cursor-ai-instructions)
13. [What NOT to Build](#13-what-not-to-build)

---

## 1. Project Overview

**Product Name:** Rebookt
**Stage:** Phase 1 — Market Capture MVP (Pre-SaaS)
**Core Goal:** Validate that short-term rental hosts will pay for direct booking recovery — not for "software."

### The One-Line Pitch

> Turn past Airbnb guests into repeat direct bookings — automatically.

### The Problem

Short-term rental hosts lose 10–15% of gross revenue to platform fees on every booking. A property generating $100,000/year loses up to $15,000 in host fees to Airbnb or VRBO. Most hosts want direct bookings but lack the tools, confidence, or marketing infrastructure to capture them.

The deeper problem is not the fee itself — it is **dependency**. Airbnb provides distribution, trust, and conversion. Hosts cannot simply leave the platform. They need a layer that works alongside it.

### The Positioning

This product is not a Property Management System. It is not a website builder. It is not a channel manager.

It is the **conversion layer that sits on top of Airbnb traffic** and captures repeat guests before the next booking happens.

Mental model: **"Klaviyo for Airbnb hosts."**

---

## 2. Strategic Context

### Why Competitors Fail

Companies like Lodgify, Hostfully, Hospitable, and Tokeet all attempt to be:
- Property Management Systems
- Channel managers
- Website builders
- Messaging platforms
- Pricing engines

The result is bloated, expensive, and overwhelming for independent hosts.

### The Winning Angle

Stay narrow. Focus exclusively on **revenue recovery from repeat guests.** Do not expand scope until this core loop is validated and generating revenue.

### Core Value Loop

```
Guest stays via Airbnb
       ↓
We capture guest contact (email + phone)
       ↓
Automated follow-up at +2 days post-checkout
       ↓
Guest books direct next time → Host saves 10–15% commission
       ↓
Guest receives thank-you reward → Posts Google review
       ↓
More reviews → Better organic ranking → More direct traffic
       ↓
Host pays $49/month — breaks even with 1 repeat booking
```

### Trust Constraint (Critical)

The product must never risk a host's Airbnb ranking or standing. All messaging must reinforce:

- Works alongside Airbnb
- No impact on rankings
- Only targets past guests, never active Airbnb traffic

---

## 3. Product Philosophy

### You Are Building

- A focused conversion tool
- A guest capture and re-engagement engine
- A direct booking page per property
- A lightweight embed widget for external sites
- A Google review growth engine via guest appreciation rewards

### You Are NOT Building

- An Airbnb replacement
- A full PMS
- A pricing engine
- A calendar sync system
- A review aggregation or management platform
- A multi-channel manager

**The moment scope expands beyond guest capture, rebooking automation, and review growth, the product fails.**

---

## 4. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | Full-stack, SSR, API routes in one repo |
| Database | Supabase (Postgres) | Auth, DB, and real-time out of the box |
| Payments | Stripe | Industry standard, webhook support |
| Email | Resend | Simple transactional email API |
| SMS | Twilio | Programmatic SMS for rebooking automation |
| Auth | Supabase Magic Link | No password friction for hosts |
| Hosting | Vercel | Zero-config Next.js deployment |
| Styling | Tailwind CSS | Utility-first, fast iteration |
| Widget | Vanilla JS bundle | Zero-dependency embeddable script |

### Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

RESEND_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

NEXT_PUBLIC_APP_URL=
```

---

## 5. Data Model

### Schema Overview

```sql
-- Users (hosts)
users
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
  email         text UNIQUE NOT NULL
  created_at    timestamptz DEFAULT now()

-- Properties owned by hosts
properties
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
  user_id       uuid REFERENCES users(id) ON DELETE CASCADE
  name          text NOT NULL
  slug          text UNIQUE NOT NULL
  description   text
  base_price    numeric NOT NULL
  cleaning_fee  numeric DEFAULT 0
  images        text[]        -- array of image URLs
  created_at    timestamptz DEFAULT now()

-- Bookings per property
bookings
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
  property_id   uuid REFERENCES properties(id)
  guest_email   text NOT NULL
  guest_phone   text
  check_in      date NOT NULL
  check_out     date NOT NULL
  total_price   numeric NOT NULL
  status        text DEFAULT 'pending'   -- pending | confirmed | cancelled
  stripe_session_id text
  created_at    timestamptz DEFAULT now()

-- Guest registry per property
guests
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
  property_id   uuid REFERENCES properties(id)
  email         text NOT NULL
  phone         text
  first_name    text
  last_name     text
  last_stay_date date
  source        text DEFAULT 'direct'   -- direct | manual_import
  created_at    timestamptz DEFAULT now()

-- Outbound messages (email + SMS)
messages
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
  guest_id      uuid REFERENCES guests(id)
  type          text NOT NULL   -- email | sms
  template      text            -- rebooking | confirmation | reminder | gar_invite | gar_reward
  status        text DEFAULT 'pending'   -- pending | sent | failed
  sent_at       timestamptz
  created_at    timestamptz DEFAULT now()

-- Guest Appreciation Rewards (GAR)
reward_codes
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
  property_id   uuid REFERENCES properties(id)
  guest_id      uuid REFERENCES guests(id)
  code          text UNIQUE NOT NULL       -- short alphanumeric code e.g. "STAY-X4K2"
  discount_pct  numeric NOT NULL           -- set by host, e.g. 5 (for 5%)
  status        text DEFAULT 'pending'     -- pending | redeemed | expired
  sent_at       timestamptz
  redeemed_at   timestamptz
  expires_at    timestamptz                -- default: sent_at + 90 days
  created_at    timestamptz DEFAULT now()

-- Blocked dates (manual MVP)
blocked_dates
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
  property_id   uuid REFERENCES properties(id)
  date          date NOT NULL
  reason        text
```

---

## 6. Architecture & Module Map

```
app/
├── (public)/
│   ├── p/[slug]/              # Property booking page
│   │   └── page.tsx
│   ├── success/               # Post-booking confirmation
│   │   └── page.tsx
│   └── page.tsx               # Landing page (marketing)
│
├── (auth)/
│   ├── login/                 # Magic link login
│   │   └── page.tsx
│   └── auth/callback/         # Supabase auth redirect
│       └── route.ts
│
├── dashboard/
│   ├── page.tsx               # Overview + stats
│   ├── properties/
│   │   ├── page.tsx           # Property list
│   │   ├── new/page.tsx       # Create property
│   │   └── [id]/page.tsx      # Edit property + widget code
│   ├── bookings/
│   │   └── page.tsx           # Booking list
│   └── guests/
│       └── page.tsx           # Guest list + import
│
├── api/
│   ├── book/
│   │   └── route.ts           # POST — create Stripe checkout session
│   ├── webhooks/
│   │   └── stripe/
│   │       └── route.ts       # Stripe webhook handler
│   ├── availability/
│   │   └── route.ts           # GET — blocked dates for calendar
│   └── automation/
│       └── trigger/
│           └── route.ts       # POST — trigger rebooking sequence
│
├── api/
│   └── rewards/
│       ├── generate/
│       │   └── route.ts       # POST — generate reward code for guest
│       └── redeem/
│           └── route.ts       # POST — validate and apply reward code at checkout
│
public/
└── widget.js                  # Embeddable booking widget (vanilla JS)
```

---

## 7. Module Specifications

### 7.1 Property Booking Page — `/p/[slug]`

**Purpose:** This is the guest-facing direct booking page. It must feel faster and simpler than Airbnb.

**Components:**
- Property image gallery (lightbox optional in MVP)
- Property name, description
- Availability calendar (blocks dates from `blocked_dates` table)
- Dynamic price preview (base price + cleaning fee + nights)
- "Book Direct and Save 10%" primary CTA
- Trust badges: No platform fees, Secure checkout, Instant confirmation

**Key behavior:**
- Price preview updates live on date selection
- No login required for guests
- On submit, calls `POST /api/book`

---

### 7.2 Booking API — `POST /api/book`

**Input:**
```ts
{
  property_id: string
  check_in: string       // ISO date
  check_out: string      // ISO date
  guest_email: string
  guest_phone?: string
  guest_name?: string
}
```

**Logic:**
1. Validate dates are not blocked
2. Calculate total: `(nights × base_price) + cleaning_fee`
3. Apply 10% discount vs platform price (display only — no enforcement needed in MVP)
4. Create Stripe Checkout session with metadata
5. Return `{ url: stripeCheckoutUrl }`

**Stripe Session Config:**
```ts
{
  payment_method_types: ['card'],
  line_items: [{
    price_data: {
      currency: 'usd',
      product_data: { name: `${property.name} — ${checkIn} to ${checkOut}` },
      unit_amount: totalInCents,
    },
    quantity: 1,
  }],
  metadata: {
    property_id,
    check_in,
    check_out,
    guest_email,
    guest_phone,
  },
  success_url: `${APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${APP_URL}/p/${slug}`,
}
```

---

### 7.3 Stripe Webhook — `POST /api/webhooks/stripe`

**Event:** `checkout.session.completed`

**Actions on success:**
1. Create `bookings` record with status `confirmed`
2. Upsert `guests` record (email + phone + last_stay_date = check_in)
3. Send booking confirmation email via Resend
4. Schedule rebooking automation: queue message for `check_out + 2 days`

**Security:** Verify Stripe signature on every request. Reject unsigned calls with 400.

---

### 7.4 Rebooking Automation Engine

**Trigger:** 2 days after guest checkout date

**Email template (Resend):**
```
Subject: Your stay at [Property Name] — come back and save

Hi [First Name],

We loved having you. Your next stay doesn't need to go through Airbnb.

Book direct and save 10%:
→ [Direct Booking Link]

No platform fees. Same property. Better rate.

[Host Name]
```

**SMS template (Twilio):**
```
Hi [Name], thanks for staying at [Property]. 
Book your next stay direct and save 10%: [short link]
```

**Implementation note for MVP:** Use a cron job (Vercel Cron or Supabase Edge Function) that runs daily, queries `bookings` where `check_out = today - 2 days` and `automation_sent = false`, then fires messages.

---

### 7.5 Guest Appreciation Rewards (GAR)

**Purpose:** Grow the host's Google review count by sending guests a thank-you reward after their stay. The reward is framed as host appreciation — not as payment for a review — to comply with Google's review policy.

**Policy Compliance (Critical):**
The reward must never be conditional on a review being posted. The flow must always be:
1. Send the thank-you message first (no strings attached)
2. In the same message, gently invite the guest to share their experience on Google
3. The reward code is included as a gesture of appreciation, not as a transaction

This framing is not cosmetic — it is the legal and policy boundary. Do not reorder these steps.

---

**Host Configuration (per property in dashboard):**

| Setting | Description |
|---|---|
| GAR enabled | Toggle on/off per property |
| Reward discount % | Host sets this (e.g. 5%, 10%, 15%) — stacks on top of the direct booking discount |
| Trigger delay | Days after checkout to send GAR message (default: 5 days) |
| Google Business URL | Host pastes their Google review link |
| Message tone | Formal / Casual (controls email copy variant) |

---

**Trigger Flow:**

```
Guest checks out
       ↓
Day +2: Rebooking automation fires (existing)
       ↓
Day +5: GAR automation fires (if enabled for property)
       ↓
Email sent to guest with:
  - Thank-you message from host
  - Invitation to share their experience on Google (with link)
  - Unique reward code for next direct booking
       ↓
Guest posts review (optional — no tracking or gating)
       ↓
Guest uses reward code at next booking
       ↓
Discount applied automatically at checkout
```

---

**Email Template (GAR — Resend):**

```
Subject: A thank-you from [Host Name] at [Property Name]

Hi [First Name],

Thank you for staying with us. Having you as a guest meant a lot.

If you have a moment, we would love to hear about your experience:
→ [Google Review Link]

As a small token of our appreciation — whether you share a review or not —
here is a discount code for your next stay booked directly with us:

  Code: [REWARD_CODE]
  Discount: [X]% off your next stay
  Valid for 90 days

Book direct anytime at:
→ [Direct Booking Link]

With gratitude,
[Host Name]
```

---

**Reward Code Redemption (at booking):**

On the property booking page `/p/[slug]`, add an optional field:

```
[ Have a reward code? ]
[ __________________ ]  [Apply]
```

On apply:
1. `POST /api/rewards/redeem` with `{ code, property_id }`
2. Validate: code exists, not expired, not already redeemed, belongs to this property
3. Return `{ valid: true, discount_pct: X }`
4. Price preview updates to show stacked discounts:

```
Base total:              $800
Direct booking discount:  -$80   (10%)
Appreciation reward:      -$36   (5% of post-discount total)
──────────────────────────────
You pay:                 $684
```

5. Reward code status set to `redeemed` on Stripe webhook success

---

**GAR API Endpoints:**

`POST /api/rewards/generate`
```ts
// Called by the daily cron after determining GAR should fire
{
  guest_id: string
  property_id: string
}
// Creates reward_codes record, sends email via Resend
```

`POST /api/rewards/redeem`
```ts
// Called from booking page on code entry
{
  code: string
  property_id: string
}
// Returns { valid: boolean, discount_pct?: number, error?: string }
```

---

**Dashboard additions for GAR:**

In `/dashboard/guests/[id]`:
- Show reward code status (pending / sent / redeemed / expired)
- Show whether a GAR message was sent and when

In `/dashboard/properties/[id]`:
- GAR settings panel (toggle, discount %, trigger delay, Google URL)

---

**Usage (host pastes into their website):**
```html
<script 
  src="https://yourdomain.com/widget.js" 
  data-property="[slug]">
</script>
```

**Behavior:**
1. Injects a fixed floating button (bottom-right) — "Book Direct and Save"
2. On click: opens a centered modal iframe loading `/p/[slug]`
3. Modal closes on backdrop click or ESC key
4. Zero dependencies, self-contained, under 10kb

**Widget states:**
- `IDLE` — floating button visible with subtle pulse
- `OPEN` — modal overlay with booking page loaded
- `CLOSED` — returns to IDLE

---

### 7.6 Host Dashboard

**Route:** `/dashboard`

**Features (MVP only):**

| Feature | Description |
|---|---|
| Property creation | Name, slug, base price, cleaning fee, images (URL input) |
| Booking list | Table: guest name, dates, total, status |
| Guest list | Table: email, phone, last stay, message history |
| Widget code | Copy-paste snippet with property slug pre-filled |
| Manual date blocking | Select dates to mark unavailable |

**No analytics dashboard in MVP.** Do not build charts or revenue graphs until Phase 2.

---

## 8. Design System

### Aesthetic Direction

**Tone:** Refined, institutional, minimal luxury. Inspired by high-end hotel reservation platforms (Four Seasons, Blacklane, Resy) — not by SaaS dashboards or startup landing pages.

**Core principle:** The product should feel like it costs more than $49/month to use.

### Typography

```css
/* Display / Headlines */
font-family: 'Playfair Display', serif;

/* Body / UI */
font-family: 'DM Sans', sans-serif;

/* Monospace / Code */
font-family: 'JetBrains Mono', monospace;
```

Import via Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
```

### Color Palette

```css
:root {
  /* Backgrounds */
  --color-bg-base:       #FAFAF8;   /* warm off-white */
  --color-bg-surface:    #FFFFFF;
  --color-bg-subtle:     #F4F3EF;

  /* Text */
  --color-text-primary:  #1A1A18;   /* near-black, warm */
  --color-text-secondary:#6B6A65;
  --color-text-muted:    #A8A79F;

  /* Brand */
  --color-brand:         #1C3A2F;   /* deep forest green */
  --color-brand-light:   #2D5C4A;
  --color-brand-accent:  #4CAF82;   /* fresh mint — CTA only */

  /* Borders */
  --color-border:        #E8E7E2;
  --color-border-strong: #C8C7C0;

  /* Semantic */
  --color-success:       #2E7D5E;
  --color-warning:       #B45309;
  --color-error:         #991B1B;
}
```

### Spacing Scale

Use Tailwind's default scale. Key values:
- Section padding: `py-24` (desktop), `py-16` (mobile)
- Container max-width: `max-w-6xl mx-auto px-6`
- Card padding: `p-8`
- Component gap: `gap-6` or `gap-8`

### Component Tokens

```css
/* Buttons */
.btn-primary {
  background: var(--color-brand);
  color: white;
  padding: 14px 28px;
  font-family: 'DM Sans', sans-serif;
  font-weight: 500;
  font-size: 15px;
  letter-spacing: 0.02em;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-primary:hover {
  background: var(--color-brand-light);
}

/* Cards */
.card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 32px;
}

/* Inputs */
.input {
  border: 1px solid var(--color-border-strong);
  border-radius: 4px;
  padding: 12px 16px;
  font-family: 'DM Sans', sans-serif;
  font-size: 15px;
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
  width: 100%;
  transition: border-color 0.15s ease;
}

.input:focus {
  outline: none;
  border-color: var(--color-brand);
}
```

### Design Rules

1. **No gradients on backgrounds.** Flat, warm whites only.
2. **One accent color** (mint green `#4CAF82`) used exclusively for primary CTAs and savings highlights.
3. **Brand green** (`#1C3A2F`) for headers, nav, and secondary buttons.
4. **Photography over illustration.** Use real property images. No icons as decoration.
5. **Generous whitespace.** Sections breathe. Nothing feels cramped.
6. **Borders instead of shadows** for cards and inputs. One subtle `box-shadow` allowed on modals only.
7. **Uppercase sparingly.** Only for labels, tags, and nav items — `letter-spacing: 0.08em`.

---

## 9. Landing Page Structure

### Section Order

```
/
├── [HERO]
├── [PROBLEM]
├── [SOLUTION]
├── [HOW IT WORKS]
├── [ROI CALCULATOR]
├── [WIDGET DEMO]
├── [PRICING]
└── [FINAL CTA]
```

---

### Section 1: Hero

**Headline (Playfair Display, 56px):**
> Stop Paying Airbnb 15% on Repeat Guests

**Subheadline (DM Sans, 20px, muted):**
> Turn every stay into future direct revenue — automatically.

**CTA button:** "Get Your Direct Booking Setup"

**Visual:** Split layout. Left: headline + CTA. Right: property booking page UI preview (screenshot or live iframe of `/p/[slug]`).

**Trust line below CTA:** "Works alongside Airbnb — no impact on rankings"

---

### Section 2: Problem

**Layout:** 3-column stat cards

| Card 1 | Card 2 | Card 3 |
|---|---|---|
| Airbnb charges 3–15% per booking | A $100K property loses $10–15K/year | Your guests trust you — not the platform |

**Below cards:** One-line copy:
> "You already did the hard part. We make sure you keep the margin the second time."

---

### Section 3: Solution

**3-column feature blocks:**

1. **Capture** — We store guest contact details after every stay
2. **Automate** — Follow-up emails and SMS go out automatically at checkout + 2 days
3. **Convert** — Guests click a direct booking link. You keep the commission.

---

### Section 4: How It Works

**3-step vertical timeline:**

```
Step 1   Guest stays via Airbnb as normal
         No changes to your existing setup

Step 2   We follow up automatically
         Email and SMS with a direct booking link

Step 3   They book direct next time
         You save the platform fee — every time
```

---

### Section 5: ROI Calculator

**Interactive component (client-side only, no API needed):**

```
Input:  Average booking value:     [$___]
Input:  Repeat bookings per year:  [___]

Output: Platform fees saved per year: $[calculated]
Output: Your cost:                    $588/year ($49/month)
Output: Net gain:                     $[calculated]
```

Formula: `savings = (avg_value × 0.12) × repeat_bookings`

---

### Section 6: Widget Demo

**Split layout:**
- Left: Code snippet showing embed script
- Right: Live preview of the floating widget button and modal open state

**Caption:** "Paste one line of code into your website. The widget does the rest."

---

### Section 7: Pricing

**Single centered card:**

```
$49 / month

- Direct booking page for your property
- Automated guest follow-up (email + SMS)
- Embeddable booking widget
- Guest contact database
- Stripe-powered payments

[Start for Free — 14-day trial]

No commission. No setup fee. Cancel anytime.
```

---

### Section 8: Final CTA

**Headline:** "Your next guest is already in Airbnb. Make sure the one after is yours."

**CTA:** "Start Recovering Your Bookings"

---

## 10. Booking Widget UX

### Floating Button (IDLE state)

```
Position:   fixed, bottom-right, 24px margin
Size:       auto-width pill button
Label:      "Book Direct — Save 10%"
Color:      var(--color-brand) background, white text
Animation:  subtle box-shadow pulse every 4s (CSS keyframes)
Z-index:    9999
```

### Modal (OPEN state)

```
Overlay:    rgba(0,0,0,0.5), backdrop-filter blur(4px)
Modal:      centered, max-width 480px, border-radius 8px
Content:    iframe loading /p/[slug]
Close:      X button top-right + ESC key + backdrop click
Animation:  fade + scale-up (200ms ease-out)
```

### Booking Page Layout (inside modal and standalone)

```
┌─────────────────────────────────┐
│  [Property Name]                │
│  [Location tag]                 │
├─────────────────────────────────┤
│  [Image — 16:9 ratio]           │
├─────────────────────────────────┤
│  Check-in        Check-out      │
│  [Date Input]    [Date Input]   │
├─────────────────────────────────┤
│  Price Breakdown                │
│  $250/night × 3 nights  $750    │
│  Cleaning fee           $75     │
│  Direct discount       -$82     │
│  ─────────────────────────────  │
│  Total                  $743    │
│                                 │
│  Airbnb price would be: $892    │
│  You save: $149                 │
├─────────────────────────────────┤
│  Your email                     │
│  [________________________]     │
│  Your phone (optional)          │
│  [________________________]     │
├─────────────────────────────────┤
│  [   Book Direct — $743   ]     │
│                                 │
│  Secure payment via Stripe      │
│  No platform fees               │
└─────────────────────────────────┘
```

### Savings Highlight Rules

- Always show the Airbnb comparison price (calculate as: `total / 0.88` to imply the 12% fee)
- Display the savings amount in the accent green `#4CAF82`
- Label it clearly: "vs. booking through Airbnb"

---

## 11. Phase Roadmap

### Phase 1 — MVP (Current)

**Goal:** Validate willingness to pay

| Task | Priority |
|---|---|
| Property page `/p/[slug]` | P0 |
| Stripe checkout flow | P0 |
| Stripe webhook + booking creation | P0 |
| Guest capture (email + phone) | P0 |
| Rebooking email automation | P0 |
| Host dashboard (create property, view bookings) | P1 |
| Embed widget `widget.js` | P1 |
| Manual date blocking | P1 |
| Landing page | P1 |
| GAR — reward code generation + email | P1 |
| GAR — reward code redemption at checkout | P1 |
| GAR — host settings panel (toggle, %, Google URL) | P1 |

---

### Phase 2 — Growth (Post-Validation)

- iCal sync (read Airbnb calendar for availability)
- Manual guest import (CSV from Airbnb reservation export)
- SMS automation (Twilio)
- Analytics dashboard (revenue recovered, open rates, conversion)
- Multi-property support per host

---

### Phase 3 — Scale

- Airbnb API integration (if/when available)
- White-label option for property managers
- Referral program for hosts
- Upsell: managed setup service at $199 one-time

---

## 12. Cursor AI Instructions

When opening this project in Cursor, use the following prompts to bootstrap each module. Always read this document first before generating any code.

### Prompt 1 — Project Scaffold

```
Read DIRECT_BOOKING_ENGINE.md fully.
Scaffold a Next.js 14 App Router project with:
- Supabase client (server + browser)
- Stripe SDK
- Resend SDK
- Tailwind CSS with the custom design tokens from the Design System section
- Folder structure matching the Architecture section exactly
Do not generate any page UI yet. Only scaffold config files, env types, and lib utilities.
```

### Prompt 2 — Database

```
Using the Data Model in DIRECT_BOOKING_ENGINE.md,
generate the full Supabase SQL migration file.
Include RLS policies: hosts can only read/write their own properties and bookings.
Guests table has no auth — insertable by anyone (booking flow).
```

### Prompt 3 — Property Booking Page

```
Build /app/(public)/p/[slug]/page.tsx.
Follow the Booking Page Layout in section 10.
Use design tokens from section 8.
Fetch property by slug from Supabase.
Implement live price calculation on date selection.
On submit, POST to /api/book and redirect to Stripe URL.
No external calendar library — use a simple custom date picker.
```

### Prompt 4 — Stripe Integration

```
Build /app/api/book/route.ts and /app/api/webhooks/stripe/route.ts.
Follow specs in sections 7.2 and 7.3 exactly.
On webhook success: create booking, upsert guest, trigger automation queue.
Verify Stripe signature. Return 400 on invalid signature.
```

### Prompt 5 — Rebooking Automation

```
Build the rebooking automation engine from section 7.4.
Use Resend for email with the exact template provided.
Create a Vercel cron job at /app/api/automation/trigger/route.ts
that runs daily and sends follow-up messages to guests 
whose checkout was 2 days ago and who have not yet received automation.
```

### Prompt 6 — Guest Appreciation Rewards (GAR)

```
Build the Guest Appreciation Rewards system from section 7.5.
Implement:
- reward_codes table per the data model in section 5
- POST /api/rewards/generate — creates a unique reward code and sends
  the GAR email via Resend using the exact template in section 7.5
- POST /api/rewards/redeem — validates a code at booking time,
  returns discount_pct, rejects expired or already-redeemed codes
- Reward code input field on /p/[slug] booking page with live price update
- Stacked discount display in price breakdown (direct discount + reward discount shown separately)
- GAR settings panel in /dashboard/properties/[id]:
  toggle, discount_pct input, trigger_delay_days input, google_business_url input
- Daily cron extension: after rebooking check, also check for guests
  whose checkout was trigger_delay_days ago and who have not yet received a GAR message

Critical policy rule: the GAR email must send the reward code unconditionally.
The Google review link is an invitation only — never a condition of the reward.
Do not add any language implying the code is granted because of a review.
```

### Prompt 7 — Embed Widget

```
Build public/widget.js as a self-contained vanilla JS file.
Follow the widget spec in section 7.6.
It must:
- Read data-property attribute from the script tag
- Inject a fixed floating button (bottom-right)
- Open a centered modal with an iframe on click
- Close on ESC or backdrop click
- Have zero dependencies
- Be under 10kb unminified
```

### Prompt 8 — Host Dashboard

```
Build the host dashboard at /dashboard using Next.js App Router.
Protect all routes with Supabase session check — redirect to /login if unauthenticated.
Implement: property creation form, booking list table, guest list table, widget code copy panel, GAR settings panel per property.
Follow the design system in section 8 exactly.
No charts or analytics in this phase.
```

### Prompt 9 — Landing Page

```
Build the marketing landing page at /app/(public)/page.tsx.
Follow the Section Order and content in section 9 exactly.
Include the ROI calculator as a client component with live calculation.
Use design tokens from section 8.
Include the widget demo section showing a preview of the floating button and modal.
This page must feel like a premium reservation platform — reference Four Seasons or Resy aesthetics.
No emojis. No illustrations. Photography-first layout.
```

---

## 13. What NOT to Build

Cursor must refuse or defer any request to implement the following in Phase 1:

| Feature | Reason |
|---|---|
| Airbnb API integration | Not available + not needed for MVP |
| Full calendar sync (iCal) | Phase 2 only |
| Pricing engine / dynamic rates | Scope creep |
| Multi-property management | Phase 2 only |
| Review aggregation or response management | Out of scope — GAR only sends invitations |
| Guest messaging inbox | Phase 2 only |
| Mobile app | Web-first, validate first |
| Analytics dashboard | Phase 2 only |
| Owner portal (separate from host) | Not in core loop |

If any of the above is requested during Phase 1 development, respond with:

> "This is a Phase 2 feature. The current build scope is limited to the Rebookt MVP as defined in DIRECT_BOOKING_ENGINE.md."

---

*Document version: 1.1 — Phase 1 MVP + Guest Appreciation Rewards*
*Product name: Rebookt*
*Stack: Next.js 14 / Supabase / Stripe / Resend / Twilio*
*Design reference: Resy, Four Seasons Reservations, Blacklane*
