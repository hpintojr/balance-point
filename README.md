# Balance Point Certified Booking Site

A production-oriented Next.js booking site for private motorcycle wheelie training.

## Booking flow

Two payment paths live side by side in the booking section:

**Pay at my session (live now — cash welcome)**
1. Rider chooses a package on the site.
2. The embedded Sulus CRM booking widget (`NEXT_PUBLIC_SULUS_BOOKING_URL`, calendar "Training Session") shows live availability — synced with the owner's Google Calendar once he connects it under his Sulus user.
3. Rider picks the matching service (package), a time, fills the Rider Booking Form (phone required + waiver checkbox) and confirms.
4. Sulus creates the contact + appointment, sends SMS/email confirmation, 24h and 2h reminders, and runs the **Rider Bookings** pipeline workflows (intake → session completed → certified / no-show).

**Reserve with a $20 deposit online (dormant until Stripe is connected)**
1. Set `STRIPE_*`, `GOOGLE_*` and `NEXT_PUBLIC_ONLINE_DEPOSIT=true`.
2. Slot is held in Google Calendar, rider pays the deposit in Stripe Checkout.
3. Stripe webhook confirms the event, Mailjet + Sequenzy fire, and the booking is POSTed (HMAC-signed) to the Sulus **Website Booking — New Rider Intake** inbound-webhook workflow.
4. Vercel Cron removes abandoned holds.

## Packages

- First Clutch-Up — 1 session — $120
- BP Starter — 3 sessions — $325
- Balance Point Challenge — 5 sessions — $500
- BPC Complete — 8 sessions — $750
- Default reservation deposit — $20

The five-session Balance Point Challenge is positioned as a structured goal, not a guarantee. Certification is earned only when the required standards are met.

Only the $20 reservation deposit is charged online. The remaining package balance is collected directly by the owner; cash is welcome.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Google Calendar

Create a Google Cloud service account with Calendar API access. Share the actual training calendar with the service account email and grant permission to make changes. Put the calendar ID, service account email, and private key in `.env.local` / Vercel environment variables.

## Stripe

Create a webhook endpoint:

`https://YOUR-DOMAIN.com/api/stripe/webhook`

Subscribe to:

- `checkout.session.completed`

Copy the signing secret to `STRIPE_WEBHOOK_SECRET`.

## Mailjet

Validate the sending domain/address first. The app sends immediate confirmation via the Mailjet Send API v3.1.

## Sequenzy

Create a webhook in Sequenzy and place the URL in `SEQUENZY_WEBHOOK_URL`. The app posts an event named `booking.confirmed` with subscriber and booking properties. Use that event to trigger reminders such as 24 hours before, 2 hours before, follow-up, review request, or next-session scheduling.

## Sulus CRM

Location: `https://crm.sulus.ai/location/blZQxRCCKPDWhePrhcDg` (`SULUS_CRM_LOCATION_ID`).

- **Calendar → Training Session** (`/b/training-session`): 60-min slots, Mon–Sat 9–5 PT, 4 priced services matching `lib/packages.ts`, booking form "Rider Booking Form", attendee + owner notifications on.
- **Pipeline → Rider Bookings**: New Booking → Session Confirmed → In Training → Balance Collected → Package Complete / Certified · Lost / No-Show.
- **Contact fields**: Training Package, Payment Method, Balance Due, Sessions Completed.
- **Workflows**: 1. New Booking — Rider Intake · 2. Session Completed — Progress + Next Session · 3. Certified — Package Complete · 4. No-Show — Rebook Nudge · (draft) Website Booking — New Rider Intake (inbound webhook for the Stripe path).

For the Stripe path, `SULUS_CRM_WEBHOOK_URL` is the inbound-webhook Endpoint URL and `SULUS_CRM_WEBHOOK_TOKEN` its Signing Secret; the app signs the raw JSON body as `X-Webhook-Signature: sha256=<hmac>`.

## Deployment

Optimized for Vercel because Stripe webhooks, Google Calendar API routes, and Cron cleanup all run naturally as server routes. Add all `.env.example` values as Vercel environment variables before production deployment.
