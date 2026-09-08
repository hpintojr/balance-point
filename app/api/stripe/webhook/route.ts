import Stripe from "stripe";
import { NextResponse } from "next/server";
import { DateTime } from "luxon";
import { confirmHoldEvent } from "@/lib/google-calendar";
import { getPackage } from "@/lib/packages";
import { pushToCRM, sendMailjetConfirmation, triggerSequenzy } from "@/lib/notifications";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) return new NextResponse("Webhook not configured", { status: 400 });

  let event: Stripe.Event;
  try {
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error(error);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const md = session.metadata || {};
    const pkg = getPackage(md.packageId || "");

    if (pkg && md.holdEventId && md.sessionStart && md.customerName && md.customerEmail && md.customerPhone) {
      const amountPaid = session.amount_total || 0;
      const totalPrice = pkg.price * 100;
      const remainingBalance = Math.max(0, totalPrice - amountPaid);
      const timezone = process.env.BOOKING_TIMEZONE || "America/Los_Angeles";
      const sessionStartFormatted = DateTime.fromISO(md.sessionStart, { setZone: true })
        .setZone(timezone)
        .toFormat("cccc, LLLL d 'at' h:mm a ZZZZ");

      await confirmHoldEvent({
        eventId: md.holdEventId,
        packageName: pkg.name,
        customerName: md.customerName,
        customerEmail: md.customerEmail,
        customerPhone: md.customerPhone,
        amountPaid,
      });

      const notification = {
        email: md.customerEmail,
        name: md.customerName,
        phone: md.customerPhone,
        packageName: pkg.name,
        sessionStart: sessionStartFormatted,
        amountPaid,
        remainingBalance,
      };

      const results = await Promise.allSettled([
        sendMailjetConfirmation(notification),
        triggerSequenzy(notification),
        pushToCRM({
          ...notification,
          packageId: pkg.id,
          stripeSessionId: session.id,
        }),
      ]);

      results.forEach((result) => {
        if (result.status === "rejected") console.error("Post-booking integration failed", result.reason);
      });
    }
  }

  return NextResponse.json({ received: true });
}
