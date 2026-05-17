# Cursor Prompt — Prototype Mode (No Stripe)
### Real-World Test with 2 Property Managers

Paste this entire prompt into Cursor. Read `DIRECT_BOOKING_ENGINE.md` before starting.
This prompt replaces the Stripe payment flow with a manual confirmation flow
suitable for a free real-world prototype test.

---

## Context

We are running a no-cost prototype with two short-term rental property managers.
Guests will request bookings directly. Hosts will confirm and collect payment
manually (e-transfer, PayPal, cash — their existing methods).

The goal is to validate that past Airbnb guests will click a direct booking link
and complete a booking request. Payment infrastructure comes after validation.

Do NOT remove any existing files. Add a `NEXT_PUBLIC_PROTOTYPE_MODE=true`
environment variable that switches behavior. This keeps the Stripe path intact
for when we enable it after validation.

---

## Environment variable

Add to `.env.local`:
```
NEXT_PUBLIC_PROTOTYPE_MODE=true
```

Add to `lib/config.ts` (create if it does not exist):
```ts
export const PROTOTYPE_MODE = process.env.NEXT_PUBLIC_PROTOTYPE_MODE === 'true'
```

---

## Changes required

---

### 1. `app/api/book/route.ts`

**Replace the Stripe session block with a manual booking flow when PROTOTYPE_MODE is true.**

Full updated logic:

```ts
// At the top
import { PROTOTYPE_MODE } from '@/lib/config'

// Inside the POST handler, after all date validation passes:

if (PROTOTYPE_MODE) {
  // 1. Insert booking with status "requested"
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      property_id,
      guest_email,
      guest_phone,
      guest_name,
      check_in,
      check_out,
      total_price: total,
      status: 'requested',
    })
    .select()
    .single()

  if (bookingError || !booking) {
    return NextResponse.json(
      { error: 'Could not save your booking request. Please try again.' },
      { status: 500 }
    )
  }

  // 2. Upsert guest record
  await supabase
    .from('guests')
    .upsert({
      property_id,
      email: guest_email,
      phone: guest_phone ?? null,
      first_name: guest_name?.split(' ')[0] ?? null,
      last_name: guest_name?.split(' ').slice(1).join(' ') ?? null,
      last_stay_date: check_in,
      source: 'direct',
    },
    { onConflict: 'property_id,email' })

  // 3. Send host notification email via Resend
  await sendHostNotification({
    property,
    booking,
    guestName: guest_name,
    guestEmail: guest_email,
    guestPhone: guest_phone,
    checkIn: check_in,
    checkOut: check_out,
    totalPrice: total,
    nights,
  })

  // 4. Send guest confirmation email via Resend
  await sendGuestConfirmation({
    guestName: guest_name,
    guestEmail: guest_email,
    propertyName: property.name,
    checkIn: check_in,
    checkOut: check_out,
    totalPrice: total,
  })

  return NextResponse.json({ success: true, booking_id: booking.id })
}

// Stripe path remains here unchanged for when PROTOTYPE_MODE is false
```

---

### 2. `lib/emails.ts` (create this file)

Two email functions using Resend. Import and call from the API route above.

```ts
import { Resend } from 'resend'
import { formatYmd } from './booking-dates'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'Rebookt <notifications@rebookt.com>'

// ── Host notification ────────────────────────────────────────

export async function sendHostNotification({
  property,
  booking,
  guestName,
  guestEmail,
  guestPhone,
  checkIn,
  checkOut,
  totalPrice,
  nights,
}: {
  property: { name: string; user_id: string }
  booking: { id: string }
  guestName: string
  guestEmail: string
  guestPhone?: string
  checkIn: string
  checkOut: string
  totalPrice: number
  nights: number
}) {
  // Fetch host email from users table
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = createClient()
  const { data: host } = await supabase
    .from('users')
    .select('email')
    .eq('id', property.user_id)
    .single()

  if (!host?.email) return

  const formattedTotal = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(totalPrice)

  await resend.emails.send({
    from: FROM,
    to: host.email,
    subject: `New booking request — ${property.name}`,
    html: `
      <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1A1A18;">

        <div style="border-bottom: 1px solid #E8E7E2; padding-bottom: 24px; margin-bottom: 24px;">
          <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #A8A79F; margin: 0 0 8px;">
            Rebookt — New Request
          </p>
          <h1 style="font-size: 24px; font-weight: 600; margin: 0; color: #1C3A2F;">
            ${property.name}
          </h1>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tr>
            <td style="padding: 10px 0; color: #6B6A65; font-size: 14px; border-bottom: 1px solid #E8E7E2;">Guest</td>
            <td style="padding: 10px 0; font-size: 14px; text-align: right; border-bottom: 1px solid #E8E7E2;">${guestName}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #6B6A65; font-size: 14px; border-bottom: 1px solid #E8E7E2;">Email</td>
            <td style="padding: 10px 0; font-size: 14px; text-align: right; border-bottom: 1px solid #E8E7E2;">
              <a href="mailto:${guestEmail}" style="color: #1C3A2F;">${guestEmail}</a>
            </td>
          </tr>
          ${guestPhone ? `
          <tr>
            <td style="padding: 10px 0; color: #6B6A65; font-size: 14px; border-bottom: 1px solid #E8E7E2;">Phone</td>
            <td style="padding: 10px 0; font-size: 14px; text-align: right; border-bottom: 1px solid #E8E7E2;">
              <a href="tel:${guestPhone}" style="color: #1C3A2F;">${guestPhone}</a>
            </td>
          </tr>` : ''}
          <tr>
            <td style="padding: 10px 0; color: #6B6A65; font-size: 14px; border-bottom: 1px solid #E8E7E2;">Check-in</td>
            <td style="padding: 10px 0; font-size: 14px; text-align: right; border-bottom: 1px solid #E8E7E2;">${checkIn}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #6B6A65; font-size: 14px; border-bottom: 1px solid #E8E7E2;">Check-out</td>
            <td style="padding: 10px 0; font-size: 14px; text-align: right; border-bottom: 1px solid #E8E7E2;">${checkOut}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #6B6A65; font-size: 14px; border-bottom: 1px solid #E8E7E2;">Nights</td>
            <td style="padding: 10px 0; font-size: 14px; text-align: right; border-bottom: 1px solid #E8E7E2;">${nights}</td>
          </tr>
          <tr>
            <td style="padding: 14px 0 0; font-weight: 500; font-size: 15px;">Total (direct rate)</td>
            <td style="padding: 14px 0 0; font-weight: 500; font-size: 15px; text-align: right; color: #1C3A2F;">${formattedTotal}</td>
          </tr>
        </table>

        <div style="background: #F4F3EF; border-radius: 6px; padding: 20px; margin-bottom: 32px;">
          <p style="margin: 0; font-size: 14px; color: #6B6A65; line-height: 1.6;">
            This is a direct booking request — no platform fees apply.
            Reach out to the guest to confirm dates and arrange payment
            using your preferred method.
          </p>
        </div>

        <p style="font-size: 12px; color: #A8A79F; border-top: 1px solid #E8E7E2; padding-top: 20px; margin: 0;">
          Rebookt · rebookt.vercel.app · Booking ID: ${booking.id}
        </p>

      </div>
    `,
  })
}

// ── Guest confirmation ───────────────────────────────────────

export async function sendGuestConfirmation({
  guestName,
  guestEmail,
  propertyName,
  checkIn,
  checkOut,
  totalPrice,
}: {
  guestName: string
  guestEmail: string
  propertyName: string
  checkIn: string
  checkOut: string
  totalPrice: number
}) {
  const firstName = guestName.split(' ')[0]

  const formattedTotal = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(totalPrice)

  await resend.emails.send({
    from: FROM,
    to: guestEmail,
    subject: `Your booking request — ${propertyName}`,
    html: `
      <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1A1A18;">

        <div style="border-bottom: 1px solid #E8E7E2; padding-bottom: 24px; margin-bottom: 24px;">
          <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #A8A79F; margin: 0 0 8px;">
            Rebookt
          </p>
          <h1 style="font-size: 24px; font-weight: 600; margin: 0; color: #1C3A2F;">
            Request received
          </h1>
        </div>

        <p style="font-size: 15px; line-height: 1.7; color: #6B6A65; margin: 0 0 24px;">
          Hi ${firstName}, your booking request for <strong style="color: #1A1A18;">${propertyName}</strong>
          has been received. The host will confirm your dates and be in touch
          within 24 hours.
        </p>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
          <tr>
            <td style="padding: 10px 0; color: #6B6A65; font-size: 14px; border-bottom: 1px solid #E8E7E2;">Property</td>
            <td style="padding: 10px 0; font-size: 14px; text-align: right; border-bottom: 1px solid #E8E7E2;">${propertyName}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #6B6A65; font-size: 14px; border-bottom: 1px solid #E8E7E2;">Check-in</td>
            <td style="padding: 10px 0; font-size: 14px; text-align: right; border-bottom: 1px solid #E8E7E2;">${checkIn}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #6B6A65; font-size: 14px; border-bottom: 1px solid #E8E7E2;">Check-out</td>
            <td style="padding: 10px 0; font-size: 14px; text-align: right; border-bottom: 1px solid #E8E7E2;">${checkOut}</td>
          </tr>
          <tr>
            <td style="padding: 14px 0 0; font-weight: 500; font-size: 15px;">Direct rate</td>
            <td style="padding: 14px 0 0; font-weight: 500; font-size: 15px; text-align: right; color: #4CAF82;">${formattedTotal}</td>
          </tr>
        </table>

        <div style="background: #F4F3EF; border-radius: 6px; padding: 20px; margin-bottom: 32px;">
          <p style="margin: 0; font-size: 14px; color: #6B6A65; line-height: 1.6;">
            You booked direct — no platform fees were charged.
            Payment will be arranged directly with the host.
          </p>
        </div>

        <p style="font-size: 12px; color: #A8A79F; border-top: 1px solid #E8E7E2; padding-top: 20px; margin: 0;">
          Rebookt · You received this because you submitted a booking request.
        </p>

      </div>
    `,
  })
}
```

---

### 3. `app/(public)/p/[slug]/BookingPanel.tsx`

**Three changes only. Do not rewrite the file — make surgical edits.**

**Change 1 — Import config:**
```ts
import { PROTOTYPE_MODE } from '@/lib/config'
```

**Change 2 — Button label:**
```ts
// Before
"Book Direct — $[total]"

// After
{PROTOTYPE_MODE ? 'Request Booking' : 'Book Direct'} — {formattedTotal}
```

**Change 3 — Handle success response:**
```ts
// Before (Stripe path)
const { url } = await res.json()
window.location.href = url

// After
const data = await res.json()
if (PROTOTYPE_MODE && data.success) {
  window.location.href = `/success?booking_id=${data.booking_id}`
} else if (data.url) {
  window.location.href = data.url
} else {
  setError(data.error ?? 'Something went wrong. Please try again.')
}
```

---

### 4. `app/(public)/success/page.tsx`

**Two changes only.**

**Change 1 — Read `booking_id` from search params** (already may exist,
confirm it handles both `session_id` and `booking_id`):

```ts
const bookingId = searchParams.booking_id ?? null
const sessionId = searchParams.session_id ?? null
// Use whichever is present to look up the booking
```

**Change 2 — Conditional headline and subtext:**

```ts
// If booking.status === 'requested' (prototype mode):
headline = "Booking request sent."
subtext  = "The host will confirm your dates and reach out within 24 hours. 
            A summary has been sent to [guest_email]."

// If booking.status === 'confirmed' (Stripe mode):
headline = "You're booked."
subtext  = "A confirmation has been sent to [guest_email]."
```

---

### 5. Supabase — add `location` column

Run this in the Supabase SQL Editor:

```sql
ALTER TABLE properties ADD COLUMN IF NOT EXISTS location text;
```

Then in `app/(public)/p/[slug]/page.tsx`, update the location tag:

```ts
// Before
<span>{property.slug}</span>

// After
<span>{property.location ?? property.slug}</span>
```

---

### 6. Dashboard — booking status badge

In the bookings list table at `/dashboard/bookings`, add a status badge
so the host can see which bookings are `requested` vs `confirmed`:

```ts
const statusStyles = {
  requested:  'bg-yellow-50  text-yellow-800  border-yellow-200',
  confirmed:  'bg-green-50   text-green-800   border-green-200',
  cancelled:  'bg-red-50     text-red-800     border-red-200',
  pending:    'bg-gray-50    text-gray-600    border-gray-200',
}

// Render as a small pill:
<span className={`
  inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
  border ${statusStyles[booking.status] ?? statusStyles.pending}
`}>
  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
</span>
```

Add a "Mark as confirmed" button next to each `requested` booking that
calls `PATCH /api/bookings/[id]/confirm`:

```ts
// app/api/bookings/[id]/confirm/route.ts
// Protect with Supabase session check — host must own the property

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify the booking belongs to a property owned by this host
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, property_id, properties(user_id)')
    .eq('id', params.id)
    .single()

  if (!booking || booking.properties?.user_id !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await supabase
    .from('bookings')
    .update({ status: 'confirmed' })
    .eq('id', params.id)

  return NextResponse.json({ success: true })
}
```

---

## Definition of done

- [ ] `NEXT_PUBLIC_PROTOTYPE_MODE=true` switches the booking flow without
      touching Stripe-path code
- [ ] Guest submits booking request — booking saved with status `requested`
- [ ] Host receives notification email with guest name, dates, total,
      and direct contact details
- [ ] Guest receives confirmation email with booking summary
- [ ] `/success` page shows "Booking request sent." with 24-hour message
- [ ] Dashboard bookings list shows status badge (requested / confirmed)
- [ ] "Mark as confirmed" button updates status via PATCH endpoint
- [ ] `location` column added to properties table and displayed on
      booking page (fallback to slug if null)
- [ ] Mobile calendar uses single prev/next control between stacked months
- [ ] `npm run build` passes with no errors
