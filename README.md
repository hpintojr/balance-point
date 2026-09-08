# Balance Point Certified Booking Site

A production-oriented Next.js booking site for private motorcycle wheelie training.

## Booking flow

1. Rider chooses one of four training packages.
2. Live availability is read from the instructor's Google Calendar.
3. A selected slot is temporarily held in Google Calendar for 30 minutes.
4. Rider pays only the $20 reservation deposit through Stripe Checkout.
5. Stripe webhook confirms the calendar event.
6. Mailjet sends the immediate transactional confirmation.
7. Sequenzy receives `booking.confirmed` and can run reminder / nurture sequences.
8. The deposit-paid booking is POSTed to the Balance Point Certified Sulus CRM location (`blZQxRCCKPDWhePrhcDg`) through its configured intake webhook.
9. Vercel Cron removes abandoned calendar holds.

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

The correct Balance Point Certified CRM location is `https://crm.sulus.ai/location/blZQxRCCKPDWhePrhcDg`, so `SULUS_CRM_LOCATION_ID` is set to `blZQxRCCKPDWhePrhcDg`. That browser URL identifies the CRM location but is not itself the POST endpoint. Create an Inbound Webhook / intake endpoint inside that Sulus location and place the generated URL in `SULUS_CRM_WEBHOOK_URL`. The payload contains the location ID, contact details, package, first-session time, $20 deposit paid, remaining balance, balance-collection method, and Stripe session ID. If the endpoint uses bearer authentication, set `SULUS_CRM_WEBHOOK_TOKEN`.

## Deployment

Optimized for Vercel because Stripe webhooks, Google Calendar API routes, and Cron cleanup all run naturally as server routes. Add all `.env.example` values as Vercel environment variables before production deployment.
